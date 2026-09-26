<?php
/**
 * Dashboard Gestionale Principale
 * Posizione: /private/pages/gestionale.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Conteggi e KPI
$totPersone = (int)$db->query("SELECT COUNT(*) FROM persone")->fetchColumn();
$totMinorenni = (int)$db->query("SELECT COUNT(*) FROM persone WHERE is_minorenne = 1")->fetchColumn();
$totTesserati = (int)$db->query("SELECT COUNT(*) FROM tesserati WHERE stato = 'Attivo'")->fetchColumn();
$totCorsi = (int)$db->query("SELECT COUNT(*) FROM gruppi")->fetchColumn();

// Quote del mese corrente
$meseCorrente = date('Y-m');
$stmtQuoteMese = $db->prepare("SELECT COUNT(*) as tot_quote, COALESCE(SUM(importo), 0) as entrate_previste, COALESCE(SUM(importo_pagato), 0) as entrate_incassate FROM quote WHERE mese_riferimento = ? AND stato != 'annullata'");
$stmtQuoteMese->execute([$meseCorrente]);
$kpiQuote = $stmtQuoteMese->fetch() ?: ['tot_quote' => 0, 'entrate_previste' => 0, 'entrate_incassate' => 0];

$residuoMese = (float)$kpiQuote['entrate_previste'] - (float)$kpiQuote['entrate_incassate'];

// Quote scadute non saldate
$totScadute = (int)$db->query("SELECT COUNT(*) FROM quote WHERE data_scadenza < CURRENT_DATE AND stato IN ('da_pagare', 'parziale')")->fetchColumn();
$importoScaduto = (float)$db->query("SELECT COALESCE(SUM(importo - importo_pagato), 0) FROM quote WHERE data_scadenza < CURRENT_DATE AND stato IN ('da_pagare', 'parziale')")->fetchColumn();

// Ultimi 5 pagamenti registrati
$ultimiPagamenti = $db->query("
    SELECT p.*, per.nome, per.cognome, t.numero_tessera
    FROM pagamenti p
    INNER JOIN tesserati t ON p.tesserato_id = t.id
    INNER JOIN persone per ON t.persona_id = per.id
    ORDER BY p.data_pagamento DESC
    LIMIT 5
")->fetchAll();

// Prossime 5 quote in scadenza
$prossimeQuote = $db->query("
    SELECT q.*, per.nome, per.cognome, g.nome_gruppo
    FROM quote q
    INNER JOIN tesserati t ON q.tesserato_id = t.id
    INNER JOIN persone per ON t.persona_id = per.id
    LEFT JOIN gruppi g ON q.gruppo_id = g.id
    WHERE q.stato IN ('da_pagare', 'parziale')
    ORDER BY q.data_scadenza ASC
    LIMIT 5
")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1"><i class="bi bi-speedometer2 text-primary me-2"></i>Dashboard Gestionale</h2>
        <p class="text-muted small mb-0">Controllo attività sportiva, tesseramenti e situazione quote mensili</p>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php?page=persona_nuova" class="btn btn-primary fw-bold btn-sm shadow-sm">
            <i class="bi bi-person-plus-fill me-1"></i> Nuova Persona
        </a>
        <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold btn-sm shadow-sm">
            <i class="bi bi-tablet-landscape me-1"></i> Apri Kiosk Desk
        </a>
    </div>
</div>

<!-- 4 Grandi KPI -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-primary border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Tesserati Attivi</span>
                    <h3 class="fw-bold my-1 text-primary"><?= $totTesserati ?></h3>
                    <small class="text-muted">su <?= $totPersone ?> anagrafiche (<?= $totMinorenni ?> minori)</small>
                </div>
                <div class="p-3 bg-primary-subtle text-primary rounded-3"><i class="bi bi-people-fill fs-3"></i></div>
            </div>
            <div class="mt-2 pt-2 border-top">
                <a href="index.php?page=persone" class="small text-primary fw-semibold text-decoration-none">Vedi anagrafica &rarr;</a>
                <span class="text-muted mx-1">•</span>
                <a href="index.php?page=persona_nuova" class="small text-success fw-bold text-decoration-none">+ Nuova Persona</a>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-success border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Quote Questo Mese</span>
                    <h3 class="fw-bold my-1 text-success">€ <?= number_format($kpiQuote['entrate_incassate'], 2, ',', '.') ?></h3>
                    <small class="text-muted">Previste: € <?= number_format($kpiQuote['entrate_previste'], 2, ',', '.') ?></small>
                </div>
                <div class="p-3 bg-success-subtle text-success rounded-3"><i class="bi bi-cash-coin fs-3"></i></div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-danger border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Quote Scadute</span>
                    <h3 class="fw-bold my-1 text-danger"><?= $totScadute ?></h3>
                    <small class="text-danger fw-bold">Totale: € <?= number_format($importoScaduto, 2, ',', '.') ?></small>
                </div>
                <div class="p-3 bg-danger-subtle text-danger rounded-3"><i class="bi bi-exclamation-triangle-fill fs-3"></i></div>
            </div>
            <?php if ($totScadute > 0): ?>
            <div class="mt-2 pt-2 border-top">
                <a href="index.php?page=quote_scadute" class="small text-danger fw-bold text-decoration-none">Vedi elenco scadute &rarr;</a>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-info border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Corsi & Gruppi</span>
                    <h3 class="fw-bold my-1 text-info-emphasis"><?= $totCorsi ?></h3>
                    <small class="text-muted">Stagione Sportiva 2024/2025</small>
                </div>
                <div class="p-3 bg-info-subtle text-info rounded-3"><i class="bi bi-diagram-3-fill fs-3"></i></div>
            </div>
        </div>
    </div>
</div>

<!-- Banner Previsione & Budget -->
<div class="alert border-0 shadow-sm p-3 rounded-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);">
    <div class="d-flex align-items-center">
        <div class="bg-success text-white p-2 rounded-3 me-3 shadow-sm">
            <i class="bi bi-graph-up-arrow fs-4"></i>
        </div>
        <div>
            <h6 class="fw-bold text-dark mb-0">Previsione Incassi Quote & Budget Spese Stagionali</h6>
            <small class="text-dark text-opacity-75">Simula gli scenari di cassa, programma le uscite per impianti/istruttori e genera il prospetto per il CD.</small>
        </div>
    </div>
    <a href="index.php?page=previsioni" class="btn btn-success fw-bold shadow-sm">
        <i class="bi bi-calculator me-1"></i> Apri Analisi & Budget &rarr;
    </a>
</div>

<!-- Tabelle Rapide -->
<div class="row g-4">
    <!-- Prossime Scadenze -->
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0"><i class="bi bi-calendar-event text-primary me-2"></i>Quote in Scadenza</h5>
                <a href="index.php?page=quote" class="btn btn-sm btn-outline-primary">Tutte le Quote</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light small">
                        <tr>
                            <th>Atleta</th>
                            <th>Gruppo</th>
                            <th>Scadenza</th>
                            <th class="text-end">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($prossimeQuote)): ?>
                            <tr><td colspan="4" class="text-center py-4 text-muted">Nessuna quota in scadenza.</td></tr>
                        <?php else: foreach ($prossimeQuote as $q): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong></td>
                                <td><span class="badge bg-light text-dark"><?= htmlspecialchars($q['nome_gruppo'] ?? 'Generale') ?></span></td>
                                <td><?= date('d/m/Y', strtotime($q['data_scadenza'])) ?></td>
                                <td class="text-end fw-bold text-primary">€ <?= number_format($q['importo'], 2, ',', '.') ?></td>
                            </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Ultimi Pagamenti -->
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0"><i class="bi bi-wallet2 text-success me-2"></i>Ultimi Incassi Registrati</h5>
                <a href="index.php?page=pagamenti" class="btn btn-sm btn-outline-success">Tutti i Pagamenti</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light small">
                        <tr>
                            <th>Ricevuta</th>
                            <th>Atleta</th>
                            <th>Data</th>
                            <th>Metodo</th>
                            <th class="text-end">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($ultimiPagamenti)): ?>
                            <tr><td colspan="5" class="text-center py-4 text-muted">Nessun pagamento registrato di recente.</td></tr>
                        <?php else: foreach ($ultimiPagamenti as $p): ?>
                            <tr>
                                <td><code><?= htmlspecialchars($p['ricevuta_numero']) ?></code></td>
                                <td><strong><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($p['data_pagamento'])) ?></td>
                                <td><span class="badge bg-secondary-subtle text-secondary"><?= ucfirst($p['metodo_pagamento']) ?></span></td>
                                <td class="text-end fw-bold text-success">€ <?= number_format($p['importo'], 2, ',', '.') ?></td>
                            </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
