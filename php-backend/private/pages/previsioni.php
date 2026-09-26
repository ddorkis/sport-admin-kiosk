<?php
/**
 * Previsione Incassi Quote & Budget Spese Previsionali
 * Posizione: /private/pages/previsioni.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Recupera anno attivo e dati associazione
$annoAttivo = $db->query("SELECT * FROM anno WHERE attivo = 1 LIMIT 1")->fetch() ?: ['id' => 1, 'anno' => '2024/2025'];
$annoId = (int)$annoAttivo['id'];
$associazione = $db->query("SELECT * FROM associazione WHERE id = 1 LIMIT 1")->fetch() ?: [
    'denominazione' => 'A.S.D. Polisportiva Aurora',
    'codice_fiscale' => '97854120584',
    'partita_iva' => '04859620581',
    'indirizzo' => 'Via dello Sport, 24',
    'cap' => '00153',
    'comune' => 'Roma',
    'provincia' => 'RM',
    'legale_rappresentante' => 'Alessandro Bianchi'
];

// Categorie e colori spese
$categorieSpesaConfig = [
    'Affitto Impianti / Pista' => ['badge' => 'bg-primary text-white', 'icon' => 'bi-building'],
    'Compensi Tecnici / Allenatori' => ['badge' => 'bg-info text-dark', 'icon' => 'bi-person-badge'],
    'Tesseramenti & Affiliazioni (FISR/EPS)' => ['badge' => 'bg-success text-white', 'icon' => 'bi-patch-check'],
    'Assicurazioni' => ['badge' => 'bg-warning text-dark', 'icon' => 'bi-shield-check'],
    'Materiale Sportivo & Divise' => ['badge' => 'bg-secondary text-white', 'icon' => 'bi-bag'],
    'Gare & Trasferte' => ['badge' => 'bg-danger text-white', 'icon' => 'bi-trophy'],
    'Amministrazione & Commercialista' => ['badge' => 'bg-dark text-white', 'icon' => 'bi-file-earmark-spreadsheet'],
    'Altro' => ['badge' => 'bg-light text-dark border', 'icon' => 'bi-three-dots']
];

// Recupera spese previsionali a database
$stmtSpese = $db->prepare("SELECT * FROM spese_previsionali WHERE anno_id = ? ORDER BY id ASC");
$stmtSpese->execute([$annoId]);
$speseList = $stmtSpese->fetchAll();

// Mesi della stagione sportiva (default Settembre a Giugno)
$mesiStagione = [
    '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'
];

// Integra con eventuali mesi trovati nelle quote
$mesiQuote = $db->query("SELECT DISTINCT mese_riferimento FROM quote WHERE mese_riferimento IS NOT NULL ORDER BY mese_riferimento ASC")->fetchAll(PDO::FETCH_COLUMN);
$tuttiMesi = array_values(array_unique(array_merge($mesiStagione, $mesiQuote)));
sort($tuttiMesi);

// Utility nomi mesi italiani
function getNomeMeseIT($m) {
    $parts = explode('-', $m);
    if (count($parts) < 2) return $m;
    $nomi = [
        '01' => 'Gennaio', '02' => 'Febbraio', '03' => 'Marzo',
        '04' => 'Aprile', '05' => 'Maggio', '06' => 'Giugno',
        '07' => 'Luglio', '08' => 'Agosto', '09' => 'Settembre',
        '10' => 'Ottobre', '11' => 'Novembre', '12' => 'Dicembre'
    ];
    return ($nomi[$parts[1]] ?? $parts[1]) . ' ' . $parts[0];
}

// 1. Calcolo del Piano di Cassa Mese per Mese
$pianoMesi = [];
$progressivoCassa = 0;

$totaleEntratePreviste = 0;
$totaleIncassatoReale = 0;
$totaleResiduoReale = 0;
$totaleUscitePreviste = 0;

foreach ($tuttiMesi as $m) {
    // Quote del mese
    $stmtQ = $db->prepare("
        SELECT 
            COUNT(*) AS count_quote,
            COALESCE(SUM(importo), 0) AS entrate,
            COALESCE(SUM(importo_pagato), 0) AS incassato,
            COALESCE(SUM(importo - importo_pagato), 0) AS residuo
        FROM quote
        WHERE mese_riferimento = ? AND stato != 'annullata'
    ");
    $stmtQ->execute([$m]);
    $qData = $stmtQ->fetch();

    $entrateMese = (float)$qData['entrate'];
    $incassatoMese = (float)$qData['incassato'];
    $residuoMese = (float)$qData['residuo'];

    // Spese del mese
    $speseMeseVoci = [];
    $usciteMese = 0;
    foreach ($speseList as $spesa) {
        $includeSpesa = false;
        if (!empty($spesa['ricorrente'])) {
            $includeSpesa = true;
        } else {
            $mesiJson = !empty($spesa['mesi_json']) ? json_decode($spesa['mesi_json'], true) : [];
            if (is_array($mesiJson) && in_array($m, $mesiJson)) {
                $includeSpesa = true;
            }
        }

        if ($includeSpesa) {
            $importoSpesa = (float)$spesa['importo_mensile'];
            $usciteMese += $importoSpesa;
            $speseMeseVoci[] = [
                'titolo' => $spesa['titolo'],
                'categoria' => $spesa['categoria'],
                'importo' => $importoSpesa
            ];
        }
    }

    $saldoMese = $entrateMese - $usciteMese;
    $progressivoCassa += $saldoMese;

    $totaleEntratePreviste += $entrateMese;
    $totaleIncassatoReale += $incassatoMese;
    $totaleResiduoReale += $residuoMese;
    $totaleUscitePreviste += $usciteMese;

    $pianoMesi[] = [
        'mese' => $m,
        'label' => getNomeMeseIT($m),
        'count_quote' => (int)$qData['count_quote'],
        'entrate' => $entrateMese,
        'incassato' => $incassatoMese,
        'residuo' => $residuoMese,
        'spese_voci' => $speseMeseVoci,
        'uscite' => $usciteMese,
        'saldo_mese' => $saldoMese,
        'progressivo' => $progressivoCassa
    ];
}

$saldoFinaleStagione = $totaleEntratePreviste - $totaleUscitePreviste;
$tassoCopertura = $totaleUscitePreviste > 0 ? round(($totaleEntratePreviste / $totaleUscitePreviste) * 100) : 100;
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-graph-up-arrow text-success me-2"></i> Previsione Incassi Quote & Budget Spese
        </h2>
        <p class="text-muted small mb-0">
            Pianificazione economico-finanziaria per la stagione <?= htmlspecialchars($annoAttivo['anno']) ?>, piano di cassa mensile e simulatore di bilancio
        </p>
    </div>
    <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary shadow-sm" data-bs-toggle="modal" data-bs-target="#modalStampaCd">
            <i class="bi bi-printer me-1"></i> Prospetto per Consiglio Direttivo
        </button>
        <button class="btn btn-primary fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#modalNuovaSpesa">
            <i class="bi bi-plus-lg me-1"></i> Aggiungi Spesa Previsionale
        </button>
    </div>
</div>

<!-- 4 KPI PRINCIPALI DI BILANCIO -->
<div class="row g-3 mb-4">
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-primary-subtle text-primary p-3 rounded-4 me-3">
                    <i class="bi bi-cash-stack fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Entrate Quote Previste</span>
                    <h4 class="fw-bold text-dark mb-0">€ <span id="kpiEntrate"><?= number_format($totaleEntratePreviste, 2, ',', '.') ?></span></h4>
                    <span class="text-success small fw-bold">€ <?= number_format($totaleIncassatoReale, 2, ',', '.') ?> già incassati</span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-danger-subtle text-danger p-3 rounded-4 me-3">
                    <i class="bi bi-receipt-cutoff fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Uscite Spese a Budget</span>
                    <h4 class="fw-bold text-danger mb-0">€ <span id="kpiUscite"><?= number_format($totaleUscitePreviste, 2, ',', '.') ?></span></h4>
                    <span class="text-muted small"><?= count($speseList) ?> voci di costo configurate</span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="p-3 rounded-4 me-3 <?= $saldoFinaleStagione >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger' ?>" id="kpiSaldoIconBox">
                    <i class="bi <?= $saldoFinaleStagione >= 0 ? 'bi-shield-check' : 'bi-exclamation-diamond' ?> fs-3" id="kpiSaldoIcon"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Saldo Stimato Stagione</span>
                    <h4 class="fw-bold mb-0 <?= $saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger' ?>" id="kpiSaldoText">
                        € <span id="kpiSaldoVal"><?= number_format($saldoFinaleStagione, 2, ',', '.') ?></span>
                    </h4>
                    <span class="badge <?= $saldoFinaleStagione >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger' ?>" id="kpiSaldoBadge">
                        <?= $saldoFinaleStagione >= 0 ? 'Attivo di Cassa' : 'Disavanzo Previsto' ?>
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-3">
            <div class="d-flex align-items-center">
                <div class="bg-info-subtle text-info p-3 rounded-4 me-3">
                    <i class="bi bi-pie-chart-fill fs-3"></i>
                </div>
                <div>
                    <span class="text-muted small d-block">Tasso Copertura Spese</span>
                    <h4 class="fw-bold text-dark mb-0"><span id="kpiCopertura"><?= $tassoCopertura ?></span>%</h4>
                    <span class="text-muted small">Residuo da incassare: € <?= number_format($totaleResiduoReale, 2, ',', '.') ?></span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- SIMULATORE DI SCENARIO INTERATTIVO -->
<div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
    <div class="card-header bg-light border-0 py-3 px-4 d-flex justify-content-between align-items-center">
        <div>
            <h5 class="fw-bold mb-0 text-dark">
                <i class="bi bi-sliders2-vertical me-2 text-primary"></i> Simulatore di Scenario Bilancio
            </h5>
            <small class="text-muted">Simula aumenti/diminuzioni di iscritti o variazioni di costi per verificare la tenuta economica</small>
        </div>
        <button class="btn btn-sm btn-outline-secondary" type="button" onclick="resetSimulator()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Reimposta
        </button>
    </div>
    <div class="card-body px-4 py-3">
        <div class="row g-4 align-items-center">
            <div class="col-md-6">
                <div class="d-flex justify-content-between mb-1">
                    <label class="form-label small fw-bold mb-0 text-dark">Variazione Iscritti / Incassi Quote:</label>
                    <span class="badge bg-primary fs-6" id="badgeVarQuote">0%</span>
                </div>
                <input type="range" class="form-range" id="sliderQuote" min="-30" max="30" step="5" value="0" oninput="aggiornaSimulatore()">
                <div class="d-flex justify-content-between text-muted small">
                    <span>-30%</span>
                    <span>Nessuna variazione (0%)</span>
                    <span>+30%</span>
                </div>
            </div>
            <div class="col-md-6">
                <div class="d-flex justify-content-between mb-1">
                    <label class="form-label small fw-bold mb-0 text-dark">Variazione Costi / Spese:</label>
                    <span class="badge bg-danger fs-6" id="badgeVarSpese">0%</span>
                </div>
                <input type="range" class="form-range" id="sliderSpese" min="-30" max="30" step="5" value="0" oninput="aggiornaSimulatore()">
                <div class="d-flex justify-content-between text-muted small">
                    <span>-30% (Risparmio)</span>
                    <span>Nessuna variazione (0%)</span>
                    <span>+30% (Rincari)</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- TABELLA PIANO DI CASSA MESE PER MESE -->
<div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
    <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
        <div>
            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-calendar3 me-2 text-primary"></i>Piano di Cassa & Flussi Mensili</h5>
            <small class="text-muted">Entrate quote, uscite spese e progressivo di cassa cumulativo per tutta la stagione</small>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0" id="tabellaPianoCassa">
            <thead class="table-light small text-uppercase">
                <tr>
                    <th>Mese Stagione</th>
                    <th>Entrate Quote Previste</th>
                    <th>Incassato Reale</th>
                    <th>Spese Previsionali Uscite</th>
                    <th>Saldo Mensile</th>
                    <th>Progressivo Cassa</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($pianoMesi as $idx => $pm): ?>
                    <tr data-base-entrate="<?= $pm['entrate'] ?>" data-base-uscite="<?= $pm['uscite'] ?>">
                        <td>
                            <strong class="text-dark"><?= htmlspecialchars($pm['label']) ?></strong>
                            <div class="small text-muted"><?= htmlspecialchars($pm['mese']) ?></div>
                        </td>
                        <td>
                            <strong class="text-dark col-entrate">€ <?= number_format($pm['entrate'], 2, ',', '.') ?></strong>
                            <div class="small text-muted"><?= $pm['count_quote'] ?> rate</div>
                        </td>
                        <td>
                            <span class="text-success fw-bold">€ <?= number_format($pm['incassato'], 2, ',', '.') ?></span>
                            <?php if ($pm['residuo'] > 0): ?>
                                <div class="small text-muted">Residuo: € <?= number_format($pm['residuo'], 2, ',', '.') ?></div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <strong class="text-danger col-uscite">€ <?= number_format($pm['uscite'], 2, ',', '.') ?></strong>
                            <?php if (!empty($pm['spese_voci'])): ?>
                                <div class="small text-truncate text-muted mt-1" style="max-width: 250px;">
                                    <?= count($pm['spese_voci']) ?> voci (<?= htmlspecialchars(implode(', ', array_column($pm['spese_voci'], 'titolo'))) ?>)
                                </div>
                            <?php else: ?>
                                <div class="small text-muted">Nessuna spesa prevista</div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="fw-bold col-saldo <?= $pm['saldo_mese'] >= 0 ? 'text-success' : 'text-danger' ?>">
                                <?= $pm['saldo_mese'] >= 0 ? '+' : '' ?>€ <?= number_format($pm['saldo_mese'], 2, ',', '.') ?>
                            </span>
                        </td>
                        <td>
                            <strong class="col-progressivo <?= $pm['progressivo'] >= 0 ? 'text-primary' : 'text-danger' ?>">
                                € <?= number_format($pm['progressivo'], 2, ',', '.') ?>
                            </strong>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
            <tfoot class="table-light fw-bold border-top">
                <tr>
                    <td>TOTALI STAGIONE</td>
                    <td id="footEntrate">€ <?= number_format($totaleEntratePreviste, 2, ',', '.') ?></td>
                    <td>€ <?= number_format($totaleIncassatoReale, 2, ',', '.') ?></td>
                    <td id="footUscite" class="text-danger">€ <?= number_format($totaleUscitePreviste, 2, ',', '.') ?></td>
                    <td id="footSaldo" class="<?= $saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger' ?>">
                        <?= $saldoFinaleStagione >= 0 ? '+' : '' ?>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?>
                    </td>
                    <td id="footProgressivo" class="<?= $saldoFinaleStagione >= 0 ? 'text-primary' : 'text-danger' ?>">
                        € <?= number_format($saldoFinaleStagione, 2, ',', '.') ?>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</div>

<!-- SEZIONE GESTIONE SPESE PREVISIONALI -->
<div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
    <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
        <div>
            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-receipt me-2 text-danger"></i>Voci di Spesa Previsionali a Budget</h5>
            <small class="text-muted">Elenco dei costi fissi e variabili programmati per la stagione</small>
        </div>
        <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#modalNuovaSpesa">
            <i class="bi bi-plus-lg me-1"></i> Aggiungi Spesa
        </button>
    </div>
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light small text-uppercase">
                <tr>
                    <th>Titolo Spesa</th>
                    <th>Categoria</th>
                    <th>Importo Canone</th>
                    <th>Ricorrenza nel Periodo</th>
                    <th>Note / Dettagli</th>
                    <th class="text-end">Azione</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($speseList)): ?>
                    <tr><td colspan="6" class="text-center py-4 text-muted">Nessuna voce di spesa inserita a budget.</td></tr>
                <?php else: foreach ($speseList as $sp): ?>
                    <?php 
                        $cfgCat = $categorieSpesaConfig[$sp['categoria']] ?? ['badge' => 'bg-secondary text-white', 'icon' => 'bi-tag'];
                        $mesiSpec = !empty($sp['mesi_json']) ? json_decode($sp['mesi_json'], true) : [];
                    ?>
                    <tr>
                        <td>
                            <strong class="text-dark"><?= htmlspecialchars($sp['titolo']) ?></strong>
                        </td>
                        <td>
                            <span class="badge <?= $cfgCat['badge'] ?> px-2 py-1">
                                <i class="bi <?= $cfgCat['icon'] ?> me-1"></i> <?= htmlspecialchars($sp['categoria']) ?>
                            </span>
                        </td>
                        <td>
                            <strong class="text-danger fs-6">€ <?= number_format($sp['importo_mensile'], 2, ',', '.') ?></strong>
                            <small class="text-muted"><?= $sp['ricorrente'] ? '/ mese' : '/ occorrenza' ?></small>
                        </td>
                        <td>
                            <?php if ($sp['ricorrente']): ?>
                                <span class="badge bg-success-subtle text-success">Tutti i mesi (Ricorrente)</span>
                            <?php else: ?>
                                <span class="badge bg-info-subtle text-info"><?= count($mesiSpec) ?> mesi: <?= implode(', ', $mesiSpec) ?></span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="small text-muted"><?= htmlspecialchars($sp['note'] ?: '-') ?></span>
                        </td>
                        <td class="text-end">
                            <form method="POST" action="index.php?action=elimina_spesa" class="d-inline" onsubmit="return confirm('Eliminare questa spesa previsionale dal budget?');">
                                <input type="hidden" name="id" value="<?= $sp['id'] ?>">
                                <button type="submit" class="btn btn-sm btn-outline-danger" title="Elimina Spesa">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- MODAL: AGGIUNGI SPESA PREVISIONALE -->
<div class="modal fade" id="modalNuovaSpesa" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title fw-bold"><i class="bi bi-plus-circle me-2"></i>Aggiungi Voce di Spesa a Budget</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="index.php?action=salva_spesa">
                <input type="hidden" name="anno_id" value="<?= $annoId ?>">
                <div class="modal-body p-4">
                    <div class="row g-3">
                        <div class="col-md-7">
                            <label class="form-label fw-bold">Descrizione Spesa <span class="text-danger">*</span></label>
                            <input type="text" name="titolo" class="form-control" placeholder="es. Canone Affitto Pista / Palestra Comunale" required>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label fw-bold">Categoria Spesa <span class="text-danger">*</span></label>
                            <select name="categoria" class="form-select" required>
                                <?php foreach (array_keys($categorieSpesaConfig) as $cat): ?>
                                    <option value="<?= htmlspecialchars($cat) ?>"><?= htmlspecialchars($cat) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Importo Mensile / Occorrenza (€) <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text">€</span>
                                <input type="number" step="0.50" name="importo_mensile" class="form-control" value="200.00" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Tipologia Ricorrenza <span class="text-danger">*</span></label>
                            <select name="ricorrente" class="form-select" id="selectRicorrenza" onchange="toggleMesiSpecifici(this.value)">
                                <option value="1">Ricorrente ogni mese della stagione</option>
                                <option value="0">Solo nei mesi specifici selezionati</option>
                            </select>
                        </div>

                        <div class="col-12 d-none" id="boxMesiSpecifici">
                            <label class="form-label fw-bold">Seleziona i mesi in cui si verifica la spesa:</label>
                            <div class="row g-2 bg-light p-3 rounded-3">
                                <?php foreach ($tuttiMesi as $m): ?>
                                    <div class="col-6 col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="mesi[]" value="<?= $m ?>" id="chk_<?= $m ?>">
                                            <label class="form-check-label small" for="chk_<?= $m ?>"><?= getNomeMeseIT($m) ?></label>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <div class="col-12">
                            <label class="form-label fw-bold">Note / Dettagli Fornitore o Convenzione</label>
                            <textarea name="note" class="form-control" rows="2" placeholder="es. Fatturazione bimestrale posticipata concordata con l'Ufficio Sport del Comune"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="submit" class="btn btn-primary fw-bold"><i class="bi bi-check-lg me-1"></i> Inserisci Spesa a Budget</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- MODAL: PROSPETTO CD PER STAMPA -->
<div class="modal fade" id="modalStampaCd" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-light">
                <h5 class="modal-title fw-bold"><i class="bi bi-file-earmark-spreadsheet me-2 text-primary"></i>Prospetto Finanziario per Consiglio Direttivo</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4" id="areaStampaCd">
                <div class="border p-4 bg-white rounded-3">
                    <!-- Intestazione Associazione -->
                    <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                        <div>
                            <h4 class="fw-bold mb-1"><?= htmlspecialchars($associazione['denominazione']) ?></h4>
                            <div class="small text-muted"><?= htmlspecialchars($associazione['indirizzo']) ?> - <?= htmlspecialchars($associazione['cap']) ?> <?= htmlspecialchars($associazione['comune']) ?> (<?= htmlspecialchars($associazione['provincia']) ?>)</div>
                            <div class="small text-muted">C.F.: <?= htmlspecialchars($associazione['codice_fiscale']) ?> <?= $associazione['partita_iva'] ? ' | P.IVA: ' . htmlspecialchars($associazione['partita_iva']) : '' ?></div>
                        </div>
                        <div class="text-end">
                            <div class="badge bg-primary fs-6 px-3 py-2">Bilancio Previsionale <?= htmlspecialchars($annoAttivo['anno']) ?></div>
                            <div class="small text-muted mt-1">Data documento: <?= date('d/m/Y') ?></div>
                        </div>
                    </div>

                    <!-- Riepilogo Sintetico CD -->
                    <div class="row g-3 mb-4">
                        <div class="col-4">
                            <div class="border p-3 rounded-3 text-center bg-light">
                                <span class="text-muted small d-block">Totale Entrate Quote</span>
                                <h5 class="fw-bold text-success mb-0">€ <?= number_format($totaleEntratePreviste, 2, ',', '.') ?></h5>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="border p-3 rounded-3 text-center bg-light">
                                <span class="text-muted small d-block">Totale Spese Programmate</span>
                                <h5 class="fw-bold text-danger mb-0">€ <?= number_format($totaleUscitePreviste, 2, ',', '.') ?></h5>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="border p-3 rounded-3 text-center bg-light">
                                <span class="text-muted small d-block">Risultato Previsionale d'Esercizio</span>
                                <h5 class="fw-bold <?= $saldoFinaleStagione >= 0 ? 'text-primary' : 'text-danger' ?> mb-0">
                                    <?= $saldoFinaleStagione >= 0 ? '+' : '' ?>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?>
                                </h5>
                            </div>
                        </div>
                    </div>

                    <!-- Tabella Flussi per CD -->
                    <h6 class="fw-bold text-dark mb-2">Prospetto Mensilizzato Entrate / Uscite</h6>
                    <div class="table-responsive mb-4">
                        <table class="table table-bordered table-sm align-middle small">
                            <thead class="table-light">
                                <tr>
                                    <th>Mese</th>
                                    <th>Entrate Quote</th>
                                    <th>Uscite Spese</th>
                                    <th>Saldo Mensile</th>
                                    <th>Progressivo Cassa</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($pianoMesi as $pm): ?>
                                    <tr>
                                        <td><strong><?= htmlspecialchars($pm['label']) ?></strong></td>
                                        <td>€ <?= number_format($pm['entrate'], 2, ',', '.') ?></td>
                                        <td class="text-danger">€ <?= number_format($pm['uscite'], 2, ',', '.') ?></td>
                                        <td class="<?= $pm['saldo_mese'] >= 0 ? 'text-success' : 'text-danger' ?>">
                                            <?= $pm['saldo_mese'] >= 0 ? '+' : '' ?>€ <?= number_format($pm['saldo_mese'], 2, ',', '.') ?>
                                        </td>
                                        <td class="fw-bold <?= $pm['progressivo'] >= 0 ? 'text-primary' : 'text-danger' ?>">
                                            € <?= number_format($pm['progressivo'], 2, ',', '.') ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                            <tfoot class="table-light fw-bold">
                                <tr>
                                    <td>TOTALE</td>
                                    <td>€ <?= number_format($totaleEntratePreviste, 2, ',', '.') ?></td>
                                    <td class="text-danger">€ <?= number_format($totaleUscitePreviste, 2, ',', '.') ?></td>
                                    <td><?= $saldoFinaleStagione >= 0 ? '+' : '' ?>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?></td>
                                    <td>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- Spazio Firme -->
                    <div class="row pt-4 mt-4 border-top">
                        <div class="col-6 text-center">
                            <small class="text-muted d-block mb-4">Il Responsabile Amministrativo</small>
                            <div class="border-bottom mx-auto" style="width: 200px;"></div>
                        </div>
                        <div class="col-6 text-center">
                            <small class="text-muted d-block mb-4">Il Presidente / Legale Rappresentante</small>
                            <div class="border-bottom mx-auto" style="width: 200px;"></div>
                            <small class="text-dark fw-bold mt-1 d-block"><?= htmlspecialchars($associazione['legale_rappresentante']) ?></small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                <button type="button" class="btn btn-primary fw-bold" onclick="window.print()">
                    <i class="bi bi-printer me-1"></i> Stampa Prospetto
                </button>
            </div>
        </div>
    </div>
</div>

<script>
function toggleMesiSpecifici(val) {
    var box = document.getElementById('boxMesiSpecifici');
    if (val === '0') {
        box.classList.remove('d-none');
    } else {
        box.classList.add('d-none');
    }
}

function resetSimulator() {
    document.getElementById('sliderQuote').value = 0;
    document.getElementById('sliderSpese').value = 0;
    aggiornaSimulatore();
}

function aggiornaSimulatore() {
    var vQ = parseInt(document.getElementById('sliderQuote').value, 10);
    var vS = parseInt(document.getElementById('sliderSpese').value, 10);

    document.getElementById('badgeVarQuote').textContent = (vQ > 0 ? '+' : '') + vQ + '%';
    document.getElementById('badgeVarSpese').textContent = (vS > 0 ? '+' : '') + vS + '%';

    var rows = document.querySelectorAll('#tabellaPianoCassa tbody tr');
    var totE = 0;
    var totU = 0;
    var prog = 0;

    rows.forEach(function(r) {
        var baseE = parseFloat(r.getAttribute('data-base-entrate')) || 0;
        var baseU = parseFloat(r.getAttribute('data-base-uscite')) || 0;

        var simE = baseE * (1 + vQ / 100);
        var simU = baseU * (1 + vS / 100);
        var saldo = simE - simU;
        prog += saldo;

        totE += simE;
        totU += simU;

        r.querySelector('.col-entrate').textContent = '€ ' + simE.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        r.querySelector('.col-uscite').textContent = '€ ' + simU.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        var saldoEl = r.querySelector('.col-saldo');
        saldoEl.textContent = (saldo >= 0 ? '+' : '') + '€ ' + saldo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        saldoEl.className = 'fw-bold col-saldo ' + (saldo >= 0 ? 'text-success' : 'text-danger');

        var progEl = r.querySelector('.col-progressivo');
        progEl.textContent = '€ ' + prog.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        progEl.className = 'col-progressivo ' + (prog >= 0 ? 'text-primary' : 'text-danger');
    });

    var saldoFinale = totE - totU;
    var tasso = totU > 0 ? Math.round((totE / totU) * 100) : 100;

    // Aggiorna KPI
    document.getElementById('kpiEntrate').textContent = totE.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpiUscite').textContent = totU.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpiSaldoVal').textContent = saldoFinale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpiCopertura').textContent = tasso;

    var saldoText = document.getElementById('kpiSaldoText');
    var saldoBadge = document.getElementById('kpiSaldoBadge');
    var saldoIconBox = document.getElementById('kpiSaldoIconBox');
    var saldoIcon = document.getElementById('kpiSaldoIcon');

    if (saldoFinale >= 0) {
        saldoText.className = 'fw-bold mb-0 text-success';
        saldoBadge.className = 'badge bg-success-subtle text-success';
        saldoBadge.textContent = 'Attivo di Cassa';
        saldoIconBox.className = 'p-3 rounded-4 me-3 bg-success-subtle text-success';
        saldoIcon.className = 'bi bi-shield-check fs-3';
    } else {
        saldoText.className = 'fw-bold mb-0 text-danger';
        saldoBadge.className = 'badge bg-danger-subtle text-danger';
        saldoBadge.textContent = 'Disavanzo Previsto';
        saldoIconBox.className = 'p-3 rounded-4 me-3 bg-danger-subtle text-danger';
        saldoIcon.className = 'bi bi-exclamation-diamond fs-3';
    }

    // Aggiorna Footer Tabella
    document.getElementById('footEntrate').textContent = '€ ' + totE.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('footUscite').textContent = '€ ' + totU.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    var footSaldo = document.getElementById('footSaldo');
    footSaldo.textContent = (saldoFinale >= 0 ? '+' : '') + '€ ' + saldoFinale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    footSaldo.className = (saldoFinale >= 0 ? 'text-success' : 'text-danger');

    var footProg = document.getElementById('footProgressivo');
    footProg.textContent = '€ ' + saldoFinale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    footProg.className = (saldoFinale >= 0 ? 'text-primary' : 'text-danger');
}
</script>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
