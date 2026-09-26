<?php
/**
 * Pagina Dedicata: Sinottico Finanziario per il Consiglio Direttivo & Stampa Verbale
 * Posizione: /private/pages/sinottico_consiglio.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Determina Anno Sportivo
$annoId = isset($_GET['anno_id']) ? (int)$_GET['anno_id'] : ($annoAttivo['id'] ?? 1);
$stmtAnno = $db->prepare("SELECT * FROM anno WHERE id = ?");
$stmtAnno->execute([$annoId]);
$annoSelezionato = $stmtAnno->fetch() ?: $annoAttivo;

// Dati Associazione
$stmtAssoc = $db->query("SELECT * FROM associazione WHERE id = 1 LIMIT 1");
$associazione = $stmtAssoc ? $stmtAssoc->fetch() : null;
if (!$associazione) {
    $associazione = [
        'denominazione' => 'A.S.D. Pattinaggio & Sport',
        'codice_fiscale' => '90012340567',
        'partita_iva' => '',
        'indirizzo' => 'Via dello Sport 10',
        'cap' => '00100',
        'comune' => 'Roma',
        'provincia' => 'RM',
        'legale_rappresentante' => 'Mario Rossi',
        'disciplina' => 'Pattinaggio Artistico a Rotelle',
        'codice_affiliazione_fisr' => 'FISR-12345',
        'registro_rasd' => 'RASD-09876'
    ];
}

// Categorie Spesa Standard
$categorieSpesaConfig = [
    'Affitto Impianti / Pista' => ['icon' => 'bi-building', 'color' => 'bg-primary text-white'],
    'Compensi Tecnici / Allenatori' => ['icon' => 'bi-person-badge', 'color' => 'bg-info text-dark'],
    'Tesseramenti & Affiliazioni (FISR/EPS)' => ['icon' => 'bi-patch-check', 'color' => 'bg-success text-white'],
    'Assicurazioni' => ['icon' => 'bi-shield-check', 'color' => 'bg-warning text-dark'],
    'Materiale Sportivo & Divise' => ['icon' => 'bi-bag', 'color' => 'bg-secondary text-white'],
    'Gare & Trasferte' => ['icon' => 'bi-trophy', 'color' => 'bg-danger text-white'],
    'Amministrazione & Commercialista' => ['icon' => 'bi-file-earmark-spreadsheet', 'color' => 'bg-dark text-white'],
    'Altro' => ['icon' => 'bi-three-dots', 'color' => 'bg-light text-dark border']
];

// Recupero spese previsionali
$speseList = [];
try {
    $stmtSpese = $db->prepare("SELECT * FROM spese_previsionali WHERE anno_id = ? ORDER BY id ASC");
    $stmtSpese->execute([$annoId]);
    $speseList = $stmtSpese->fetchAll();
} catch (Exception $e) {
    $speseList = [];
}

// Recupero quote filtrate per anno
$quoteList = [];
try {
    $stmtQuote = $db->prepare("
        SELECT q.*, t.anno_id, p.nome, p.cognome, g.nome_gruppo
        FROM quote q
        INNER JOIN tesserati t ON q.tesserato_id = t.id
        LEFT JOIN persone p ON t.persona_id = p.id
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE t.anno_id = ? AND q.stato != 'annullata'
        ORDER BY q.data_scadenza ASC
    ");
    $stmtQuote->execute([$annoId]);
    $quoteList = $stmtQuote->fetchAll();
} catch (Exception $e) {
    $quoteList = [];
}

// Mesi stagione
$tuttiMesi = [];
if (!empty($annoSelezionato['data_inizio']) && !empty($annoSelezionato['data_fine'])) {
    $cur = strtotime(substr($annoSelezionato['data_inizio'], 0, 7) . '-01');
    $end = strtotime(substr($annoSelezionato['data_fine'], 0, 7) . '-01');
    while ($cur <= $end) {
        $tuttiMesi[] = date('Y-m', $cur);
        $cur = strtotime('+1 month', $cur);
    }
}
if (empty($tuttiMesi)) {
    $tuttiMesi = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
}

function getNomeMeseITSinottico($m) {
    if (!$m) return '';
    $parts = explode('-', $m);
    if (count($parts) < 2) return $m;
    $nomi = [
        '01' => 'Gennaio', '02' => 'Febbraio', '03' => 'Marzo', '04' => 'Aprile',
        '05' => 'Maggio', '06' => 'Giugno', '07' => 'Luglio', '08' => 'Agosto',
        '09' => 'Settembre', '10' => 'Ottobre', '11' => 'Novembre', '12' => 'Dicembre'
    ];
    return ($nomi[$parts[1]] ?? $parts[1]) . ' ' . $parts[0];
}

// Calcolo mese per mese
$progressivoCassa = 0;
$pianoMesi = [];
$totaleEntratePreviste = 0;
$totaleIncassatoReale = 0;
$totaleResiduoReale = 0;
$totaleUscitePreviste = 0;

foreach ($tuttiMesi as $m) {
    $quoteMese = array_filter($quoteList, function($q) use ($m) {
        $meseQ = !empty($q['mese_riferimento']) ? $q['mese_riferimento'] : substr($q['data_scadenza'], 0, 7);
        return $meseQ === $m;
    });

    $countQuote = count($quoteMese);
    $entrateMese = array_reduce($quoteMese, fn($sum, $q) => $sum + (float)$q['importo'], 0);
    $incassatoMese = array_reduce($quoteMese, fn($sum, $q) => $sum + (float)($q['importo_pagato'] ?? 0), 0);
    $residuoMese = $entrateMese - $incassatoMese;

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
            $importoSpesa = (float)($spesa['importo_mensile'] ?? 0);
            $usciteMese += $importoSpesa;
            $speseMeseVoci[] = $spesa['titolo'];
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
        'label' => getNomeMeseITSinottico($m),
        'count_quote' => $countQuote,
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

// Ripartizione spese per categoria
$ripartizioneCategorie = [];
foreach ($speseList as $s) {
    $cat = $s['categoria'] ?? 'Altro';
    $numOcc = !empty($s['ricorrente']) ? count($tuttiMesi) : count(json_decode($s['mesi_json'] ?? '[]', true) ?: []);
    $totVoce = (float)$s['importo_mensile'] * $numOcc;

    if (!isset($ripartizioneCategorie[$cat])) {
        $ripartizioneCategorie[$cat] = ['totale' => 0, 'count' => 0];
    }
    $ripartizioneCategorie[$cat]['totale'] += $totVoce;
    $ripartizioneCategorie[$cat]['count'] += 1;
}
?>

<style>
@media print {
    .d-print-none { display: none !important; }
    body { background-color: #fff !important; }
    .card { border: 1px solid #ddd !important; box-shadow: none !important; }
    .table-striped tbody tr:nth-of-type(odd) { background-color: rgba(0, 0, 0, 0.03) !important; }
    @page { margin: 12mm; size: A4 portrait; }
}
</style>

<!-- Breadcrumbs e Barra Azioni Superiore -->
<div class="d-print-none mb-3">
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
            <li class="breadcrumb-item"><a href="index.php?page=previsioni" class="text-decoration-none">Previsione & Budget</a></li>
            <li class="breadcrumb-item active" aria-current="page">Sinottico per Consiglio Direttivo</li>
        </ol>
    </nav>

    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
            <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
                <i class="bi bi-file-earmark-spreadsheet-fill text-primary me-2"></i>
                Sinottico Finanziario per il Consiglio Direttivo
            </h2>
            <p class="text-muted small mb-0">
                Documento ufficiale di rendicontazione economico-finanziaria per la stagione <strong><?= htmlspecialchars($annoSelezionato['anno']) ?></strong>
            </p>
        </div>

        <div class="d-flex gap-2">
            <a href="index.php?page=previsioni" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i> Torna al Budget
            </a>
            <button type="button" class="btn btn-primary fw-bold shadow-sm" onclick="window.print()">
                <i class="bi bi-printer-fill me-1"></i> Stampa Prospetto Ufficiale
            </button>
        </div>
    </div>
</div>

<!-- DOCUMENTO STAMPABILE E SINOTTICO COMPLETO -->
<div class="card border-0 shadow-sm rounded-4 bg-white p-4 p-md-5 mb-5" id="sinottico-ufficiale-cd">
    <!-- Intestazione Carta Intestata Associazione -->
    <div class="row border-bottom pb-4 mb-4 align-items-center">
        <div class="col-sm-8">
            <h3 class="fw-bold text-dark mb-1"><?= htmlspecialchars($associazione['denominazione']) ?></h3>
            <div class="text-muted small">
                <strong>Sede Legale:</strong> <?= htmlspecialchars($associazione['indirizzo']) ?> - <?= htmlspecialchars($associazione['cap']) ?> <?= htmlspecialchars($associazione['comune']) ?> (<?= htmlspecialchars($associazione['provincia']) ?>)
            </div>
            <div class="text-muted small">
                <strong>C.F.:</strong> <?= htmlspecialchars($associazione['codice_fiscale']) ?>
                <?php if (!empty($associazione['partita_iva'])): ?>
                    | <strong>P.IVA:</strong> <?= htmlspecialchars($associazione['partita_iva']) ?>
                <?php endif; ?>
                | <strong>Rappr. Legale:</strong> <?= htmlspecialchars($associazione['legale_rappresentante']) ?>
            </div>
            <div class="text-muted small">
                <?php if (!empty($associazione['codice_affiliazione_fisr'])): ?>
                    <span class="me-2"><i class="bi bi-patch-check-fill text-primary"></i> FISR: <strong><?= htmlspecialchars($associazione['codice_affiliazione_fisr']) ?></strong></span>
                <?php endif; ?>
                <?php if (!empty($associazione['registro_rasd'])): ?>
                    <span><i class="bi bi-shield-fill-check text-success"></i> RASD: <strong><?= htmlspecialchars($associazione['registro_rasd']) ?></strong></span>
                <?php endif; ?>
            </div>
        </div>

        <div class="col-sm-4 text-sm-end mt-3 mt-sm-0">
            <span class="badge bg-primary fs-6 px-3 py-2 mb-2 d-inline-block">
                Bilancio Previsionale <?= htmlspecialchars($annoSelezionato['anno']) ?>
            </span>
            <div class="small text-muted">Data emissione: <strong><?= date('d/m/Y') ?></strong></div>
            <div class="small text-muted">Destinatario: <strong>Consiglio Direttivo</strong></div>
        </div>
    </div>

    <!-- Titolo Documento -->
    <div class="text-center mb-4">
        <h4 class="fw-bold text-uppercase tracking-wide text-dark mb-1">
            Prospetto Economico-Finanziario e Flusso di Cassa Previsionale
        </h4>
        <p class="text-muted small">
            Quadro riepilogativo delle entrate stimate dalle quote associative e dei costi preventivati per la gestione delle attività
        </p>
    </div>

    <!-- Indicatori Chiave di Performance (KPI) -->
    <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
            <div class="p-3 bg-light rounded-3 border text-center">
                <small class="text-muted d-block text-uppercase fw-semibold" style="font-size: 0.75rem;">Entrate Quote Stimate</small>
                <h4 class="fw-bold text-primary mb-0 font-monospace">€ <?= number_format($totaleEntratePreviste, 2, ',', '.') ?></h4>
                <small class="text-muted"><?= count($quoteList) ?> quote totali</small>
            </div>
        </div>

        <div class="col-6 col-md-3">
            <div class="p-3 bg-light rounded-3 border text-center">
                <small class="text-muted d-block text-uppercase fw-semibold" style="font-size: 0.75rem;">Incassato Effettivo</small>
                <h4 class="fw-bold text-success mb-0 font-monospace">€ <?= number_format($totaleIncassatoReale, 2, ',', '.') ?></h4>
                <small class="text-muted">Residuo: € <?= number_format($totaleResiduoReale, 2, ',', '.') ?></small>
            </div>
        </div>

        <div class="col-6 col-md-3">
            <div class="p-3 bg-light rounded-3 border text-center">
                <small class="text-muted d-block text-uppercase fw-semibold" style="font-size: 0.75rem;">Uscite Preventivate</small>
                <h4 class="fw-bold text-danger mb-0 font-monospace">€ <?= number_format($totaleUscitePreviste, 2, ',', '.') ?></h4>
                <small class="text-muted"><?= count($speseList) ?> voci di costo</small>
            </div>
        </div>

        <div class="col-6 col-md-3">
            <div class="p-3 bg-light rounded-3 border text-center">
                <small class="text-muted d-block text-uppercase fw-semibold" style="font-size: 0.75rem;">Margine Netto Previsto</small>
                <h4 class="fw-bold mb-0 font-monospace <?= $saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger' ?>">
                    <?= $saldoFinaleStagione >= 0 ? '+' : '' ?>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?>
                </h4>
                <small class="badge <?= $saldoFinaleStagione >= 0 ? 'bg-success' : 'bg-danger' ?> mt-1">
                    Copertura: <?= $tassoCopertura ?>%
                </small>
            </div>
        </div>
    </div>

    <!-- Tabella Finanziaria Mensile (Sinottico Flusso di Cassa) -->
    <h5 class="fw-bold text-dark mb-3">
        <i class="bi bi-calendar-month text-primary me-2"></i> Piano di Cassa e Ripartizione Mensile
    </h5>
    <div class="table-responsive mb-4">
        <table class="table table-bordered table-striped align-middle mb-0" style="font-size: 0.88rem;">
            <thead class="table-dark text-center align-middle">
                <tr>
                    <th rowspan="2" class="text-start">Mese</th>
                    <th rowspan="2">Atleti / Quote</th>
                    <th colspan="3" class="bg-primary text-white">Entrate Corsisti & Soci</th>
                    <th colspan="2" class="bg-danger text-white">Uscite di Gestione</th>
                    <th rowspan="2">Margine Mese</th>
                    <th rowspan="2">Cassa Progressiva</th>
                </tr>
                <tr>
                    <th>Preventivate</th>
                    <th>Incassate</th>
                    <th>Residuo</th>
                    <th>Voci di Costo</th>
                    <th>Totale Uscite</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($pianoMesi as $p): ?>
                    <tr>
                        <td class="fw-bold text-dark"><?= htmlspecialchars($p['label']) ?></td>
                        <td class="text-center font-monospace"><?= $p['count_quote'] ?></td>
                        <td class="text-end font-monospace text-primary fw-semibold">€ <?= number_format($p['entrate'], 2, ',', '.') ?></td>
                        <td class="text-end font-monospace text-success">€ <?= number_format($p['incassato'], 2, ',', '.') ?></td>
                        <td class="text-end font-monospace text-muted">€ <?= number_format($p['residuo'], 2, ',', '.') ?></td>
                        <td class="small">
                            <?php if (empty($p['spese_voci'])): ?>
                                <span class="text-muted fst-italic">Nessun costo</span>
                            <?php else: ?>
                                <?= htmlspecialchars(implode(', ', $p['spese_voci'])) ?>
                            <?php endif; ?>
                        </td>
                        <td class="text-end font-monospace text-danger fw-semibold">€ <?= number_format($p['uscite'], 2, ',', '.') ?></td>
                        <td class="text-end font-monospace fw-bold <?= $p['saldo_mese'] >= 0 ? 'text-success' : 'text-danger' ?>">
                            <?= $p['saldo_mese'] >= 0 ? '+' : '' ?>€ <?= number_format($p['saldo_mese'], 2, ',', '.') ?>
                        </td>
                        <td class="text-end font-monospace fw-bold <?= $p['progressivo'] >= 0 ? 'text-success bg-success-subtle' : 'text-danger bg-danger-subtle' ?>">
                            <?= $p['progressivo'] >= 0 ? '+' : '' ?>€ <?= number_format($p['progressivo'], 2, ',', '.') ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
            <tfoot class="table-light fw-bold">
                <tr>
                    <td colspan="2" class="text-uppercase text-center">TOTALE COMPLESSIVO STAGIONE</td>
                    <td class="text-end text-primary font-monospace">€ <?= number_format($totaleEntratePreviste, 2, ',', '.') ?></td>
                    <td class="text-end text-success font-monospace">€ <?= number_format($totaleIncassatoReale, 2, ',', '.') ?></td>
                    <td class="text-end text-muted font-monospace">€ <?= number_format($totaleResiduoReale, 2, ',', '.') ?></td>
                    <td><?= count($speseList) ?> voci a budget</td>
                    <td class="text-end text-danger font-monospace">€ <?= number_format($totaleUscitePreviste, 2, ',', '.') ?></td>
                    <td class="text-end font-monospace <?= $saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger' ?>">
                        <?= $saldoFinaleStagione >= 0 ? '+' : '' ?>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?>
                    </td>
                    <td class="text-end font-monospace <?= $saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger' ?>">
                        <?= $saldoFinaleStagione >= 0 ? '+' : '' ?>€ <?= number_format($saldoFinaleStagione, 2, ',', '.') ?>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>

    <!-- Ripartizione Uscite per Categoria -->
    <div class="row g-4 mb-4">
        <div class="col-md-7">
            <h5 class="fw-bold text-dark mb-3">
                <i class="bi bi-pie-chart-fill text-danger me-2"></i> Ripartizione Costi Preventivati per Categoria
            </h5>
            <div class="table-responsive">
                <table class="table table-sm table-bordered mb-0">
                    <thead class="table-light small">
                        <tr>
                            <th>Categoria Spesa</th>
                            <th class="text-center">Voci</th>
                            <th class="text-end">Importo Totale</th>
                            <th class="text-end">Incidenza %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($ripartizioneCategorie)): ?>
                            <tr><td colspan="4" class="text-center text-muted">Nessuna voce di spesa registrata.</td></tr>
                        <?php else: ?>
                            <?php foreach ($ripartizioneCategorie as $catName => $catDati): 
                                $perc = $totaleUscitePreviste > 0 ? round(($catDati['totale'] / $totaleUscitePreviste) * 100) : 0;
                            ?>
                                <tr>
                                    <td class="fw-semibold"><?= htmlspecialchars($catName) ?></td>
                                    <td class="text-center"><?= $catDati['count'] ?></td>
                                    <td class="text-end font-monospace text-danger">€ <?= number_format($catDati['totale'], 2, ',', '.') ?></td>
                                    <td class="text-end">
                                        <div class="d-flex align-items-center justify-content-end gap-2">
                                            <span class="small font-monospace"><?= $perc ?>%</span>
                                            <div class="progress flex-grow-1" style="height: 6px; max-width: 60px;">
                                                <div class="progress-bar bg-danger" style="width: <?= $perc ?>%"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="col-md-5">
            <div class="border rounded-4 p-3 bg-light h-100">
                <h6 class="fw-bold text-dark mb-2">
                    <i class="bi bi-journal-check text-primary me-2"></i> Verbale & Delibera di Approvazione
                </h6>
                <p class="small text-muted mb-2">
                    Il presente prospetto economico-finanziario previsionale è stato redatto dal Tesoriere e sottoposto all'esame del Consiglio Direttivo dell'Associazione.
                </p>
                <div class="small text-muted mb-3">
                    <strong>Delibera Consiglio Direttivo n.:</strong> _______________________<br>
                    <strong>Seduta del:</strong> _______________________<br>
                    <strong>Esito:</strong> [ &nbsp; ] Approvato all'unanimità &nbsp;&nbsp; [ &nbsp; ] Approvato a maggioranza
                </div>
                <div class="alert alert-warning py-1 px-2 small mb-0">
                    Conservare agli atti dell'Associazione a norma dell'art. 20 del D.Lgs. 36/2021.
                </div>
            </div>
        </div>
    </div>

    <!-- Firme di Rito del Consiglio Direttivo -->
    <div class="row pt-4 mt-4 border-top">
        <div class="col-4 text-center">
            <div class="small text-muted mb-4">Il Tesoriere / Segretario</div>
            <div class="border-bottom border-dark mx-auto" style="max-width: 180px;"></div>
            <div class="small text-muted mt-1">(Firma autografa)</div>
        </div>
        <div class="col-4 text-center">
            <div class="small text-muted mb-4">Il Presidente Legale Rappresentante</div>
            <div class="border-bottom border-dark mx-auto" style="max-width: 180px;"></div>
            <div class="small fw-semibold mt-1"><?= htmlspecialchars($associazione['legale_rappresentante']) ?></div>
        </div>
        <div class="col-4 text-center">
            <div class="small text-muted mb-4">Timbro dell'Associazione</div>
            <div class="border border-secondary border-dashed rounded-3 mx-auto" style="height: 55px; max-width: 140px;"></div>
        </div>
    </div>
</div>

<?php
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php';
?>
