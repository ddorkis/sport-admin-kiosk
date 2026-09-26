<?php
/**
 * Scadenziario Quote Mensili con Riepilogo Mese per Mese
 * Posizione: /private/pages/quote.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$vista = $_GET['vista'] ?? (isset($_GET['mese']) ? 'tabella' : 'previsione');
$search = trim($_GET['search'] ?? '');
$meseFiltro = trim($_GET['mese'] ?? '');
$statoFiltro = trim($_GET['stato'] ?? '');
$gruppoFiltro = !empty($_GET['gruppo_id']) ? (int)$_GET['gruppo_id'] : 0;

// Utility nomi mesi italiani
function formattaMeseItaliano($m) {
    if (!$m) return '';
    $parts = explode('-', $m);
    if (count($parts) < 2) return $m;
    $mesi = [
        '01' => 'Gennaio', '02' => 'Febbraio', '03' => 'Marzo',
        '04' => 'Aprile', '05' => 'Maggio', '06' => 'Giugno',
        '07' => 'Luglio', '08' => 'Agosto', '09' => 'Settembre',
        '10' => 'Ottobre', '11' => 'Novembre', '12' => 'Dicembre'
    ];
    $nome = $mesi[$parts[1]] ?? $parts[1];
    return "{$nome} {$parts[0]}";
}

// 1. Statistiche Complessive Stagione
$statsTotali = $db->query("
    SELECT 
        COUNT(*) AS totale_quote,
        COALESCE(SUM(importo), 0) AS valore_totale,
        COALESCE(SUM(importo_pagato), 0) AS totale_incassato,
        COALESCE(SUM(importo - importo_pagato), 0) AS totale_residuo
    FROM quote
    WHERE stato != 'annullata'
")->fetch();

$valoreTotale = (float)$statsTotali['valore_totale'];
$totaleIncassato = (float)$statsTotali['totale_incassato'];
$totaleResiduo = (float)$statsTotali['totale_residuo'];
$percIncasso = $valoreTotale > 0 ? round(($totaleIncassato / $valoreTotale) * 100) : 0;

// Quote scadute
$statsScadute = $db->query("
    SELECT 
        COUNT(*) AS count_scadute,
        COALESCE(SUM(importo - importo_pagato), 0) AS importo_scaduto
    FROM quote
    WHERE stato != 'pagata' AND stato != 'annullata' AND data_scadenza < CURDATE()
")->fetch();
$quoteScaduteCount = (int)$statsScadute['count_scadute'];
$totaleScaduto = (float)$statsScadute['importo_scaduto'];

// 2. Mesi disponibili & Raggruppamento per Mese
$mesiDisponibili = $db->query("
    SELECT DISTINCT mese_riferimento 
    FROM quote 
    WHERE mese_riferimento IS NOT NULL 
    ORDER BY mese_riferimento ASC
")->fetchAll(PDO::FETCH_COLUMN);

// Se non ci sono ancora quote con mese_riferimento, proponi mesi stagione standard
if (empty($mesiDisponibili)) {
    $mesiDisponibili = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
}

$riepilogoMesi = [];
foreach ($mesiDisponibili as $m) {
    $stmtM = $db->prepare("
        SELECT 
            COUNT(*) AS count_quote,
            COALESCE(SUM(importo), 0) AS previsto,
            COALESCE(SUM(importo_pagato), 0) AS incassato,
            COALESCE(SUM(importo - importo_pagato), 0) AS residuo,
            COALESCE(SUM(CASE WHEN stato != 'pagata' AND stato != 'annullata' AND data_scadenza < CURDATE() THEN (importo - importo_pagato) ELSE 0 END), 0) AS scaduto,
            SUM(CASE WHEN stato = 'pagata' THEN 1 ELSE 0 END) AS pagate,
            SUM(CASE WHEN stato = 'parziale' THEN 1 ELSE 0 END) AS parziali,
            SUM(CASE WHEN stato = 'da_pagare' THEN 1 ELSE 0 END) AS da_pagare
        FROM quote
        WHERE mese_riferimento = ? AND stato != 'annullata'
    ");
    $stmtM->execute([$m]);
    $rowM = $stmtM->fetch();
    $previstoM = (float)$rowM['previsto'];
    $incassatoM = (float)$rowM['incassato'];
    $percM = $previstoM > 0 ? round(($incassatoM / $previstoM) * 100) : 0;

    $riepilogoMesi[] = [
        'mese' => $m,
        'label' => formattaMeseItaliano($m),
        'count' => (int)$rowM['count_quote'],
        'previsto' => $previstoM,
        'incassato' => $incassatoM,
        'residuo' => (float)$rowM['residuo'],
        'scaduto' => (float)$rowM['scaduto'],
        'perc' => $percM,
        'pagate' => (int)$rowM['pagate'],
        'parziali' => (int)$rowM['parziali'],
        'da_pagare' => (int)$rowM['da_pagare']
    ];
}

// 3. Query per Tabella Singole Quote
$sqlTabella = "
    SELECT q.*, p.nome, p.cognome, p.is_minorenne, t.numero_tessera, g.nome_gruppo
    FROM quote q
    INNER JOIN tesserati t ON q.tesserato_id = t.id
    INNER JOIN persone p ON t.persona_id = p.id
    LEFT JOIN gruppi g ON q.gruppo_id = g.id
    WHERE 1=1
";
$paramsTabella = [];

if ($search !== '') {
    $sqlTabella .= " AND (p.nome LIKE ? OR p.cognome LIKE ? OR t.numero_tessera LIKE ? OR q.causale LIKE ?)";
    $paramsTabella[] = "%$search%";
    $paramsTabella[] = "%$search%";
    $paramsTabella[] = "%$search%";
    $paramsTabella[] = "%$search%";
}
if ($meseFiltro !== '') {
    $sqlTabella .= " AND q.mese_riferimento = ?";
    $paramsTabella[] = $meseFiltro;
}
if ($gruppoFiltro > 0) {
    $sqlTabella .= " AND q.gruppo_id = ?";
    $paramsTabella[] = $gruppoFiltro;
}
if ($statoFiltro === 'scadute') {
    $sqlTabella .= " AND q.stato != 'pagata' AND q.stato != 'annullata' AND q.data_scadenza < CURDATE()";
} elseif ($statoFiltro !== '') {
    $sqlTabella .= " AND q.stato = ?";
    $paramsTabella[] = $statoFiltro;
}

$sqlTabella .= " ORDER BY q.data_scadenza DESC, q.id DESC";
$stmtTabella = $db->prepare($sqlTabella);
$stmtTabella->execute($paramsTabella);
$quoteElenco = $stmtTabella->fetchAll();

// Gruppi per dropdown filtro
$elencoGruppi = $db->query("SELECT id, nome_gruppo FROM gruppi ORDER BY nome_gruppo ASC")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-cash-stack text-primary me-2"></i> Scadenziario Quote Mensili
        </h2>
        <p class="text-muted small mb-0">Controllo pagamenti, quote emesse e stati di riscossione per la stagione sportiva</p>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php?action=genera_quote&redirect=quote" class="btn btn-outline-primary shadow-sm" onclick="return confirm('Generare/sincronizzare tutte le quote per i gruppi attivi?');">
            <i class="bi bi-lightning-charge me-1"></i> Genera / Sincronizza Quote
        </a>
        <a href="index.php?page=quote&vista=tabella&stato=scadute" class="btn btn-outline-danger shadow-sm fw-bold">
            <i class="bi bi-exclamation-triangle me-1"></i> Quote Scadute (<?= $quoteScaduteCount ?>)
        </a>
    </div>
</div>

<!-- 4 KPI CARDS -->
<div class="row g-3 mb-4">
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-primary-subtle text-primary p-3 rounded-4 me-3">
                    <i class="bi bi-wallet2 fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Valore Totale Quote</span>
                    <h4 class="fw-bold text-dark mb-0">€ <?= number_format($valoreTotale, 2, ',', '.') ?></h4>
                    <span class="text-muted small"><?= (int)$statsTotali['totale_quote'] ?> rate generate</span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-success-subtle text-success p-3 rounded-4 me-3">
                    <i class="bi bi-check-circle-fill fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Incassato ad Oggi</span>
                    <h4 class="fw-bold text-success mb-0">€ <?= number_format($totaleIncassato, 2, ',', '.') ?></h4>
                    <span class="badge bg-success-subtle text-success small"><?= $percIncasso ?>% saldato</span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-warning-subtle text-warning p-3 rounded-4 me-3">
                    <i class="bi bi-hourglass-split fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Residuo da Incassare</span>
                    <h4 class="fw-bold text-dark mb-0">€ <?= number_format($totaleResiduo, 2, ',', '.') ?></h4>
                    <span class="text-muted small">In attesa o in scadenza</span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-danger-subtle text-danger p-3 rounded-4 me-3">
                    <i class="bi bi-exclamation-octagon-fill fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Quote Scadute</span>
                    <h4 class="fw-bold text-danger mb-0">€ <?= number_format($totaleScaduto, 2, ',', '.') ?></h4>
                    <span class="badge bg-danger rounded-pill small"><?= $quoteScaduteCount ?> rate in ritardo</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- NAVIGATORE VISTE: PIANO MENSILE VS ELENCO QUOTE -->
<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <div class="btn-group shadow-sm" role="group">
        <a href="index.php?page=quote&vista=previsione" class="btn btn-sm <?= $vista === 'previsione' ? 'btn-primary fw-bold' : 'btn-outline-primary' ?>">
            <i class="bi bi-calendar-month me-1"></i> Riepilogo & Scadenziario Mensile
        </a>
        <a href="index.php?page=quote&vista=tabella" class="btn btn-sm <?= $vista === 'tabella' ? 'btn-primary fw-bold' : 'btn-outline-primary' ?>">
            <i class="bi bi-table me-1"></i> Elenco Dettagliato Singole Quote
        </a>
    </div>
    <?php if ($vista === 'previsione'): ?>
        <a href="index.php?page=previsioni" class="btn btn-sm btn-outline-success">
            <i class="bi bi-graph-up-arrow me-1"></i> Vai al Bilancio Previsionale Completo &rarr;
        </a>
    <?php endif; ?>
</div>

<?php if ($vista === 'previsione'): ?>
    <!-- TAB 1: RIEPILOGO MESE PER MESE -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
        <div class="card-header bg-white border-bottom py-3">
            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-calendar3 me-2 text-primary"></i>Piano Incassi Quote Mese per Mese</h5>
            <small class="text-muted">Prospetto analitico delle quote per ciascun mese della stagione sportiva</small>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light small text-uppercase">
                    <tr>
                        <th>Mese Stagione</th>
                        <th>Quote Generate</th>
                        <th>Incassato Reale</th>
                        <th>Residuo da Saldare</th>
                        <th>Scaduto in Ritardo</th>
                        <th>Ripartizione Stato Rate</th>
                        <th class="text-end">Azione</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($riepilogoMesi)): ?>
                        <tr><td colspan="7" class="text-center py-4 text-muted">Nessuna quota registrata. Clicca su "Genera Quote" per calcolarle.</td></tr>
                    <?php else: foreach ($riepilogoMesi as $rm): ?>
                        <tr>
                            <td>
                                <strong class="text-dark fs-6"><?= htmlspecialchars($rm['label']) ?></strong>
                                <div class="small text-muted">Codice: <?= htmlspecialchars($rm['mese']) ?></div>
                            </td>
                            <td>
                                <strong class="text-dark">€ <?= number_format($rm['previsto'], 2, ',', '.') ?></strong>
                                <div class="small text-muted"><?= $rm['count'] ?> rate</div>
                            </td>
                            <td>
                                <strong class="text-success">€ <?= number_format($rm['incassato'], 2, ',', '.') ?></strong>
                                <div class="progress mt-1" style="height: 6px; width: 100px;">
                                    <div class="progress-bar bg-success" role="progressbar" style="width: <?= $rm['perc'] ?>%;"></div>
                                </div>
                                <small class="text-muted"><?= $rm['perc'] ?>% incassato</small>
                            </td>
                            <td>
                                <strong class="text-warning text-dark">€ <?= number_format($rm['residuo'], 2, ',', '.') ?></strong>
                            </td>
                            <td>
                                <?php if ($rm['scaduto'] > 0): ?>
                                    <strong class="text-danger">€ <?= number_format($rm['scaduto'], 2, ',', '.') ?></strong>
                                    <span class="badge bg-danger ms-1">Scaduto</span>
                                <?php else: ?>
                                    <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="badge bg-success-subtle text-success me-1"><?= $rm['pagate'] ?> pagate</span>
                                <span class="badge bg-warning-subtle text-warning me-1"><?= $rm['parziali'] ?> parziali</span>
                                <span class="badge bg-secondary-subtle text-secondary"><?= $rm['da_pagare'] ?> da pagare</span>
                            </td>
                            <td class="text-end">
                                <a href="index.php?page=quote&vista=tabella&mese=<?= urlencode($rm['mese']) ?>" class="btn btn-sm btn-outline-primary">
                                    <i class="bi bi-eye me-1"></i> Dettaglio Mese
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
    </div>

<?php else: ?>
    <!-- TAB 2: ELENCO DETTAGLIATO SINGOLE QUOTE -->
    <!-- Filtri di ricerca -->
    <div class="card border-0 shadow-sm rounded-4 mb-3 bg-white">
        <div class="card-body p-3">
            <form method="GET" class="row g-2 align-items-center">
                <input type="hidden" name="page" value="quote">
                <input type="hidden" name="vista" value="tabella">
                <div class="col-md-3">
                    <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta o Tessera..." value="<?= htmlspecialchars($search) ?>">
                </div>
                <div class="col-md-3">
                    <select name="mese" class="form-select form-select-sm">
                        <option value="">Tutti i Mesi</option>
                        <?php foreach ($mesiDisponibili as $m): ?>
                            <option value="<?= $m ?>" <?= $meseFiltro === $m ? 'selected' : '' ?>><?= formattaMeseItaliano($m) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="gruppo_id" class="form-select form-select-sm">
                        <option value="0">Tutti i Gruppi</option>
                        <?php foreach ($elencoGruppi as $eg): ?>
                            <option value="<?= $eg['id'] ?>" <?= $gruppoFiltro === (int)$eg['id'] ? 'selected' : '' ?>><?= htmlspecialchars($eg['nome_gruppo']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="stato" class="form-select form-select-sm">
                        <option value="">Tutti gli Stati</option>
                        <option value="da_pagare" <?= $statoFiltro === 'da_pagare' ? 'selected' : '' ?>>Da Pagare</option>
                        <option value="parziale" <?= $statoFiltro === 'parziale' ? 'selected' : '' ?>>Parziale</option>
                        <option value="pagata" <?= $statoFiltro === 'pagata' ? 'selected' : '' ?>>Pagata</option>
                        <option value="scadute" <?= $statoFiltro === 'scadute' ? 'selected' : '' ?>>Solo Scadute</option>
                        <option value="annullata" <?= $statoFiltro === 'annullata' ? 'selected' : '' ?>>Annullata</option>
                    </select>
                </div>
                <div class="col-md-2 d-flex gap-1">
                    <button type="submit" class="btn btn-sm btn-primary flex-fill"><i class="bi bi-filter me-1"></i> Filtra</button>
                    <a href="index.php?page=quote&vista=tabella" class="btn btn-sm btn-outline-secondary" title="Reset filtri"><i class="bi bi-arrow-counterclockwise"></i></a>
                </div>
            </form>
        </div>
    </div>

    <!-- Tabella Quote -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light small text-uppercase">
                    <tr>
                        <th>Scadenza</th>
                        <th>Mese Rif.</th>
                        <th>Atleta / Tessera</th>
                        <th>Corso / Gruppo</th>
                        <th>Causale</th>
                        <th>Importo</th>
                        <th>Incassato</th>
                        <th>Stato</th>
                        <th class="text-end">Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($quoteElenco)): ?>
                        <tr><td colspan="9" class="text-center py-4 text-muted">Nessuna quota trovata con i filtri impostati.</td></tr>
                    <?php else: foreach ($quoteElenco as $q): ?>
                        <?php
                            $isScaduta = ($q['stato'] !== 'pagata' && $q['stato'] !== 'annullata' && strtotime($q['data_scadenza']) < strtotime(date('Y-m-d')));
                            $badgeClass = 'bg-secondary';
                            $statoTesto = $q['stato'];
                            if ($q['stato'] === 'pagata') {
                                $badgeClass = 'bg-success';
                                $statoTesto = 'Pagata';
                            } elseif ($q['stato'] === 'parziale') {
                                $badgeClass = 'bg-warning text-dark';
                                $statoTesto = 'Parziale';
                            } elseif ($isScaduta) {
                                $badgeClass = 'bg-danger';
                                $statoTesto = 'Scaduta';
                            } elseif ($q['stato'] === 'da_pagare') {
                                $badgeClass = 'bg-primary-subtle text-primary';
                                $statoTesto = 'Da Pagare';
                            } elseif ($q['stato'] === 'annullata') {
                                $badgeClass = 'bg-secondary text-white';
                                $statoTesto = 'Annullata';
                            }
                            $residuoQuota = (float)$q['importo'] - (float)$q['importo_pagato'];
                        ?>
                        <tr class="<?= $isScaduta ? 'table-danger-subtle' : '' ?>">
                            <td>
                                <strong><?= date('d/m/Y', strtotime($q['data_scadenza'])) ?></strong>
                                <?php if ($isScaduta): ?>
                                    <div class="badge bg-danger" style="font-size: 0.65rem;">Scaduta</div>
                                <?php endif; ?>
                            </td>
                            <td><span class="badge bg-light text-dark"><?= htmlspecialchars($q['mese_riferimento'] ?: '-') ?></span></td>
                            <td>
                                <strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong>
                                <div class="small text-muted">Tessera: <code><?= htmlspecialchars($q['numero_tessera']) ?></code></div>
                            </td>
                            <td><?= htmlspecialchars($q['nome_gruppo'] ?: 'Quota Libera') ?></td>
                            <td><span class="small text-muted"><?= htmlspecialchars($q['causale']) ?></span></td>
                            <td><strong>€ <?= number_format($q['importo'], 2, ',', '.') ?></strong></td>
                            <td>
                                <?php if ((float)$q['importo_pagato'] > 0): ?>
                                    <span class="text-success fw-bold">€ <?= number_format($q['importo_pagato'], 2, ',', '.') ?></span>
                                <?php else: ?>
                                    <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                            <td><span class="badge <?= $badgeClass ?>"><?= $statoTesto ?></span></td>
                            <td class="text-end">
                                <div class="d-flex justify-content-end gap-1">
                                    <?php if ($q['stato'] !== 'pagata' && $q['stato'] !== 'annullata'): ?>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-success fw-bold"
                                            data-bs-toggle="modal"
                                            data-bs-target="#modalPagaQuota_<?= $q['id'] ?>"
                                            title="Registra Incasso Quota"
                                        >
                                            <i class="bi bi-wallet2 me-1"></i> Incassa
                                        </button>
                                        <form method="POST" action="index.php?action=annulla_quota" class="d-inline" onsubmit="return confirm('Annullare questa quota (es. per ritiro atleta)?');">
                                            <input type="hidden" name="id" value="<?= $q['id'] ?>">
                                            <input type="hidden" name="redirect" value="quote">
                                            <button type="submit" class="btn btn-sm btn-outline-secondary" title="Annulla Quota">
                                                <i class="bi bi-x-circle"></i>
                                            </button>
                                        </form>
                                    <?php else: ?>
                                        <span class="text-muted small">&bull; Saldata &bull;</span>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>

                        <!-- Modal Incasso Quota Specifica -->
                        <?php if ($q['stato'] !== 'pagata' && $q['stato'] !== 'annullata'): ?>
                            <div class="modal fade" id="modalPagaQuota_<?= $q['id'] ?>" tabindex="-1" aria-hidden="true">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content border-0 rounded-4 shadow">
                                        <div class="modal-header bg-success text-white">
                                            <h5 class="modal-title fw-bold"><i class="bi bi-cash-coin me-2"></i>Registra Pagamento Quota</h5>
                                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                        </div>
                                        <form method="POST" action="index.php?action=registra_pagamento">
                                            <input type="hidden" name="tesserato_id" value="<?= $q['tesserato_id'] ?>">
                                            <input type="hidden" name="quota_id" value="<?= $q['id'] ?>">
                                            <div class="modal-body p-4">
                                                <div class="bg-light p-3 rounded-3 mb-3 small">
                                                    <div><strong>Atleta:</strong> <?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></div>
                                                    <div><strong>Causale:</strong> <?= htmlspecialchars($q['causale']) ?></div>
                                                    <div><strong>Importo Quota:</strong> € <?= number_format($q['importo'], 2) ?> | <strong>Residuo:</strong> <span class="text-danger fw-bold">€ <?= number_format($residuoQuota, 2) ?></span></div>
                                                </div>

                                                <div class="mb-3">
                                                    <label class="form-label fw-bold">Importo da Incassare (€)</label>
                                                    <input type="number" step="0.50" name="importo" class="form-control" value="<?= number_format($residuoQuota, 2, '.', '') ?>" max="<?= number_format($residuoQuota, 2, '.', '') ?>" required>
                                                </div>

                                                <div class="mb-3">
                                                    <label class="form-label fw-bold">Metodo di Pagamento</label>
                                                    <select name="metodo_pagamento" class="form-select" required>
                                                        <option value="contanti">Contanti</option>
                                                        <option value="pos">POS / Carta di Debito o Credito</option>
                                                        <option value="bonifico">Bonifico Bancario</option>
                                                        <option value="satispay">Satispay</option>
                                                    </select>
                                                </div>

                                                <div class="mb-3">
                                                    <label class="form-label fw-bold">Causale Ricevuta</label>
                                                    <input type="text" name="causale" class="form-control" value="Incasso <?= htmlspecialchars($q['causale']) ?>" required>
                                                </div>

                                                <div class="mb-3">
                                                    <label class="form-label fw-bold">Note Aggiuntive</label>
                                                    <input type="text" name="note" class="form-control" placeholder="es. Saldo rate">
                                                </div>
                                            </div>
                                            <div class="modal-footer bg-light">
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                                <button type="submit" class="btn btn-success fw-bold"><i class="bi bi-check-lg me-1"></i> Conferma Incasso</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
    </div>
<?php endif; ?>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
