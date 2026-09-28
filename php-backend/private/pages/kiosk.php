<?php
/**
 * Interfaccia KIOSK (Pulsanti Grandi per Touch Screen / Desk Reception)
 * Posizione: /private/pages/kiosk.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$db = getDbConnection();
$user = getCurrentUser();

// Anno sportivo attivo
$annoAttivo = null;
try {
    $annoAttivo = $db->query("SELECT * FROM anno WHERE attivo = 1 LIMIT 1")->fetch();
} catch (Exception $e) {}
if (!$annoAttivo) {
    $annoAttivo = ['id' => 1, 'anno' => '2024/2025'];
}
$annoId = (int)($annoAttivo['id'] ?? 1);

// Contatore 1: Totale persone anagrafica & minori con tutore
$totPersone = 0;
$minorenniCount = 0;
try {
    $totPersone = (int)$db->query("SELECT COUNT(*) FROM persone WHERE attivo = 1 OR attivo IS NULL")->fetchColumn();
    $minorenniCount = (int)$db->query("SELECT COUNT(*) FROM persone WHERE (attivo = 1 OR attivo IS NULL) AND is_minorenne = 1")->fetchColumn();
} catch (Exception $e) {}

// Contatore 2: Tesserati attivi anno corrente e numero corsi/gruppi
$totTesserati = 0;
$totGruppi = 0;
try {
    $stmtTess = $db->prepare("SELECT COUNT(*) FROM tesserati WHERE anno_id = ? AND stato = 'Attivo'");
    $stmtTess->execute([$annoId]);
    $totTesserati = (int)$stmtTess->fetchColumn();

    $stmtGrp = $db->prepare("SELECT COUNT(*) FROM gruppi WHERE anno_id = ? AND (attivo = 1 OR attivo IS NULL)");
    $stmtGrp->execute([$annoId]);
    $totGruppi = (int)$stmtGrp->fetchColumn();
} catch (Exception $e) {}

// Contatore 3: Quote scadute non pagate
$quoteScaduteCount = 0;
try {
    $quoteScaduteCount = (int)$db->query("SELECT COUNT(*) FROM quote WHERE stato IN ('da_pagare', 'parziale') AND data_scadenza < CURDATE()")->fetchColumn();
} catch (Exception $e) {}

// Contatore 4: Totale incassato cassa e numero ricevute
$totaleIncassato = 0.0;
$totPagamenti = 0;
try {
    $stmtInc = $db->query("SELECT COALESCE(SUM(importo), 0) AS totale, COUNT(*) AS count FROM pagamenti");
    $incDati = $stmtInc->fetch() ?: ['totale' => 0, 'count' => 0];
    $totaleIncassato = (float)$incDati['totale'];
    $totPagamenti = (int)$incDati['count'];
} catch (Exception $e) {}

// Elenco atleti per la ricerca rapida nel modal Touch Cerca Anagrafica
$atletiRicerca = [];
try {
    $stmtAtleti = $db->query("
        SELECT p.id AS persona_id, p.nome, p.cognome, p.codice_fiscale, p.telefono, p.is_minorenne, p.tutore_nome, p.tutore_cognome,
               t.id AS tesserato_id, t.numero_tessera, t.stato AS stato_tesserato,
               (SELECT COUNT(*) FROM quote q WHERE q.tesserato_id = t.id AND q.stato IN ('da_pagare', 'parziale') AND q.data_scadenza < CURDATE()) AS quote_scadute,
               (SELECT COALESCE(SUM(q2.importo - q2.importo_pagato), 0) FROM quote q2 WHERE q2.tesserato_id = t.id AND q2.stato IN ('da_pagare', 'parziale')) AS debito_totale
        FROM persone p
        LEFT JOIN tesserati t ON p.id = t.persona_id AND t.anno_id = {$annoId}
        WHERE p.attivo = 1 OR p.attivo IS NULL
        ORDER BY p.cognome ASC, p.nome ASC
        LIMIT 60
    ");
    $atletiRicerca = $stmtAtleti->fetchAll() ?: [];
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postazione Kiosk Touch Reception - SportGestionale</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body {
            background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
            min-height: 100vh;
            color: #f8fafc;
        }
        .kiosk-btn {
            min-height: 190px;
            font-size: 1.25rem;
            font-weight: 700;
            border-radius: 1.25rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.15);
            text-align: center;
            padding: 1.5rem 1rem;
        }
        .kiosk-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.6);
        }
        .kiosk-icon { font-size: 3.5rem; margin-bottom: 0.5rem; line-height: 1; }
        .kiosk-subtext { font-size: 0.85rem; font-weight: normal; opacity: 0.85; margin-top: 0.25rem; }
        .kpi-box {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 1rem;
            padding: 1.25rem;
            backdrop-filter: blur(8px);
        }
    </style>
</head>
<body class="p-3 p-md-5 d-flex flex-column justify-content-between">
<div class="container-fluid max-w-7xl">
    <!-- Header Kiosk -->
    <header class="d-flex justify-content-between align-items-center pb-4 mb-4 border-bottom border-secondary flex-wrap gap-3">
        <div>
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span class="badge bg-warning text-dark px-3 py-2 fw-bold text-uppercase fs-6 shadow-sm">
                    <i class="bi bi-display me-1"></i> Postazione Touch Reception
                </span>
                <span class="badge bg-primary text-white px-3 py-2 fs-6 shadow-sm">
                    <i class="bi bi-calendar-event me-1"></i> Anno Sportivo <?= htmlspecialchars($annoAttivo['anno']) ?>
                </span>
            </div>
            <h1 class="h2 fw-bold mb-0 text-light d-flex align-items-center gap-2">
                <i class="bi bi-trophy-fill text-warning"></i> SportGestionale &bull; Kiosk Desk
            </h1>
        </div>

        <div class="d-flex align-items-center gap-3 flex-wrap">
            <?php if (!empty($user['ruolo']) && $user['ruolo'] === 'admin'): ?>
                <a href="index.php?page=gestionale" class="btn btn-light btn-lg px-4 fw-bold shadow-sm">
                    <i class="bi bi-table me-2 text-primary"></i> Gestionale Amministrativo
                </a>
            <?php else: ?>
                <span class="badge bg-secondary px-3 py-2 fs-6 text-white-50 border border-secondary" title="Postazione limitata alle funzioni di accoglienza cassa e tesseramento">
                    <i class="bi bi-shield-lock me-1"></i> Profilo Desk Reception
                </span>
            <?php endif; ?>

            <a href="index.php?page=logout" class="btn btn-danger btn-lg px-3 shadow-sm" title="Esci dall'applicazione">
                <i class="bi bi-power"></i>
            </a>
        </div>
    </header>

    <!-- Notifiche Toast / Alert -->
    <?php if (!empty($_GET['msg'])): ?>
        <div class="alert alert-success alert-dismissible fade show shadow-lg d-flex align-items-center mb-4" role="alert">
            <i class="bi bi-check-circle-fill me-3 fs-4"></i>
            <div class="fs-6"><?= htmlspecialchars($_GET['msg']) ?></div>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <?php if (!empty($_GET['err'])): ?>
        <div class="alert alert-danger alert-dismissible fade show shadow-lg d-flex align-items-center mb-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div class="fs-6"><?= htmlspecialchars($_GET['err']) ?></div>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <!-- Sezione Centrale: Titolo Operazioni e Griglia dei 5 Bottoni Grandi Kiosk -->
    <main class="my-auto py-3">
        <div class="text-center mb-5">
            <h2 class="display-6 fw-bold text-white mb-2">Operazioni Rapide Reception</h2>
            <p class="lead text-secondary mb-0">
                Tocca uno dei pulsanti per avviare subito l'inserimento anagrafica, tesseramento, iscrizione corso o incasso quote.
            </p>
        </div>

        <div class="row g-4 justify-content-center">
            <!-- 1. Nuova Persona & Tutore -->
            <div class="col-12 col-sm-6 col-lg-4 col-xl-2">
                <a href="index.php?page=persona_nuova&from=kiosk" class="btn btn-primary w-100 kiosk-btn text-decoration-none">
                    <i class="bi bi-person-plus-fill kiosk-icon"></i>
                    <span>Nuova Persona</span>
                    <span class="kiosk-subtext">Anagrafica & Tutore Legale</span>
                </a>
            </div>

            <!-- 2. Nuovo Tesseramento -->
            <div class="col-12 col-sm-6 col-lg-4 col-xl-2">
                <a href="index.php?page=tesseramento_nuovo&from=kiosk" class="btn btn-success w-100 kiosk-btn text-decoration-none">
                    <i class="bi bi-card-checklist kiosk-icon"></i>
                    <span>Tesseramento</span>
                    <span class="kiosk-subtext">Numero Tessera & Medico</span>
                </a>
            </div>

            <!-- 3. Iscrizione Gruppo / Corso -->
            <div class="col-12 col-sm-6 col-lg-4 col-xl-2">
                <a href="index.php?page=iscrizione_gruppo&from=kiosk" class="btn btn-info text-white w-100 kiosk-btn text-decoration-none">
                    <i class="bi bi-diagram-3-fill kiosk-icon"></i>
                    <span>Iscrizione Gruppo</span>
                    <span class="kiosk-subtext">Calcolo Quote Mensili</span>
                </a>
            </div>

            <!-- 4. Registra Pagamento Rapido -->
            <div class="col-12 col-sm-6 col-lg-4 col-xl-2">
                <a href="index.php?page=pagamento_nuovo&from=kiosk" class="btn btn-warning text-dark w-100 kiosk-btn text-decoration-none">
                    <i class="bi bi-cash-coin kiosk-icon"></i>
                    <span>Registra Pagamento</span>
                    <span class="kiosk-subtext text-dark-50">Quote o Pagamento Libero</span>
                </a>
            </div>

            <!-- 5. Cerca Anagrafica / Stato Atleta -->
            <div class="col-12 col-sm-6 col-lg-4 col-xl-2">
                <button type="button" class="btn btn-secondary w-100 kiosk-btn text-decoration-none" data-bs-toggle="modal" data-bs-target="#modalCercaAnagrafica">
                    <i class="bi bi-search kiosk-icon text-info"></i>
                    <span class="text-white">Cerca Anagrafica</span>
                    <span class="kiosk-subtext">Scheda & Saldo Atleta</span>
                </button>
            </div>
        </div>
    </main>

    <!-- Barra Inferiore con Riepilogo Rapido di Cassa e Situazione (I 4 Contatori) -->
    <footer class="pt-4 mt-5 border-top border-secondary">
        <div class="row g-3 text-center">
            <!-- Contatore 1: Totale Anagrafiche -->
            <div class="col-6 col-md-3">
                <div class="kpi-box h-100 d-flex flex-column justify-content-center">
                    <span class="text-secondary small d-block mb-1">Totale Atleti Anagrafica</span>
                    <strong class="fs-4 text-light"><?= $totPersone ?></strong>
                    <small class="text-warning-emphasis d-block mt-1">(<?= $minorenniCount ?> minorenni con tutore)</small>
                </div>
            </div>

            <!-- Contatore 2: Tesserati Attivi Anno -->
            <div class="col-6 col-md-3">
                <div class="kpi-box h-100 d-flex flex-column justify-content-center">
                    <span class="text-secondary small d-block mb-1">Tesserati Attivi Anno</span>
                    <strong class="fs-4 text-success"><?= $totTesserati ?></strong>
                    <small class="text-secondary d-block mt-1">in <?= $totGruppi ?> corsi / gruppi</small>
                </div>
            </div>

            <!-- Contatore 3: Quote Scadute Non Pagate -->
            <div class="col-6 col-md-3">
                <div class="kpi-box h-100 d-flex flex-column justify-content-center">
                    <span class="text-secondary small d-block mb-1">Quote Scadute Non Pagate</span>
                    <strong class="fs-4 <?= $quoteScaduteCount > 0 ? 'text-danger' : 'text-success' ?>">
                        <?= $quoteScaduteCount ?>
                    </strong>
                    <small class="text-secondary d-block mt-1">richiedono sollecito</small>
                </div>
            </div>

            <!-- Contatore 4: Totale Incassato Cassa -->
            <div class="col-6 col-md-3">
                <div class="kpi-box h-100 d-flex flex-column justify-content-center">
                    <span class="text-secondary small d-block mb-1">Totale Incassato Cassa</span>
                    <strong class="fs-4 text-warning">€ <?= number_format($totaleIncassato, 2, ',', '.') ?></strong>
                    <small class="text-secondary d-block mt-1">(<?= $totPagamenti ?> ricevute emesse)</small>
                </div>
            </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-4 small text-secondary flex-wrap gap-2">
            <div>
                Operatore Kiosk: <strong class="text-light"><?= htmlspecialchars($user['nome'] ?? 'Desk Reception') ?></strong> (<?= htmlspecialchars($user['username'] ?? 'kiosk') ?>) &bull; Flag Kiosk: <span class="badge bg-success">Attivo</span>
            </div>
            <div>
                SportGestionale &bull; PHP + MariaDB + Bootstrap 5
            </div>
        </div>
    </footer>
</div>

<!-- Modal Touch: Cerca Anagrafica Rapida & Saldo Atleta -->
<div class="modal fade" id="modalCercaAnagrafica" tabindex="-1" aria-labelledby="modalCercaAnagraficaLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content bg-dark text-white border-secondary shadow-lg rounded-4">
            <div class="modal-header border-secondary py-3 px-4">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-search text-warning fs-4"></i>
                    <div>
                        <h5 class="modal-title fw-bold mb-0 text-white" id="modalCercaAnagraficaLabel">Cerca Anagrafica & Saldo Atleta</h5>
                        <small class="text-secondary">Ricerca per nome, cognome, codice fiscale o tessera</small>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
            </div>
            <div class="modal-body p-4">
                <!-- Input Ricerca Live -->
                <div class="input-group input-group-lg mb-4 shadow-sm">
                    <span class="input-group-text bg-secondary border-secondary text-white"><i class="bi bi-search"></i></span>
                    <input type="text" id="kioskSearchInput" class="form-control bg-dark border-secondary text-white fw-semibold" placeholder="Scrivi nome, cognome, CF o n. tessera..." onkeyup="filtraAtletiKiosk()">
                    <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('kioskSearchInput').value=''; filtraAtletiKiosk();">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <!-- Elenco Risultati -->
                <div class="table-responsive rounded-3 border border-secondary" style="max-height: 400px;">
                    <table class="table table-dark table-hover align-middle mb-0" id="kioskAtletiTable">
                        <thead class="table-secondary text-uppercase small text-dark sticky-top">
                            <tr>
                                <th>Atleta / Anagrafica</th>
                                <th>Tessera</th>
                                <th>Stato Pagamenti</th>
                                <th class="text-end">Azione</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($atletiRicerca)): ?>
                                <tr>
                                    <td colspan="4" class="text-center py-4 text-secondary">
                                        Nessun atleta registrato al momento.
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($atletiRicerca as $atl): ?>
                                    <tr class="atleta-row" data-search="<?= strtolower(htmlspecialchars($atl['nome'] . ' ' . $atl['cognome'] . ' ' . $atl['codice_fiscale'] . ' ' . ($atl['numero_tessera'] ?? '') . ' ' . ($atl['tutore_cognome'] ?? ''))) ?>">
                                        <td>
                                            <div class="fw-bold text-white"><?= htmlspecialchars($atl['cognome'] . ' ' . $atl['nome']) ?></div>
                                            <small class="text-secondary font-monospace"><?= htmlspecialchars($atl['codice_fiscale']) ?></small>
                                            <?php if (!empty($atl['is_minorenne']) && !empty($atl['tutore_cognome'])): ?>
                                                <span class="badge bg-secondary-subtle text-light ms-1" style="font-size: 0.7rem;">
                                                    Tutore: <?= htmlspecialchars($atl['tutore_cognome'] . ' ' . $atl['tutore_nome']) ?>
                                                </span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if (!empty($atl['numero_tessera'])): ?>
                                                <span class="badge bg-success-subtle text-success border border-success-subtle"><?= htmlspecialchars($atl['numero_tessera']) ?></span>
                                            <?php else: ?>
                                                <span class="badge bg-secondary-subtle text-secondary">Non tesserato</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($atl['quote_scadute'] > 0): ?>
                                                <span class="badge bg-danger">
                                                    <?= $atl['quote_scadute'] ?> quote scadute (€ <?= number_format($atl['debito_totale'], 2, ',', '.') ?>)
                                                </span>
                                            <?php elseif ($atl['debito_totale'] > 0): ?>
                                                <span class="badge bg-warning text-dark">
                                                    In corso (€ <?= number_format($atl['debito_totale'], 2, ',', '.') ?>)
                                                </span>
                                            <?php else: ?>
                                                <span class="badge bg-success"><i class="bi bi-check-lg me-1"></i> In regola</span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="text-end">
                                            <?php if (!empty($atl['tesserato_id'])): ?>
                                                <a href="index.php?page=pagamento_nuovo&from=kiosk&tesserato_id=<?= (int)$atl['tesserato_id'] ?>" class="btn btn-warning text-dark btn-sm fw-bold">
                                                    <i class="bi bi-cash-coin me-1"></i> Incassa
                                                </a>
                                            <?php else: ?>
                                                <a href="index.php?page=tesseramento_nuovo&from=kiosk&persona_id=<?= (int)$atl['persona_id'] ?>" class="btn btn-success btn-sm fw-bold">
                                                    <i class="bi bi-card-checklist me-1"></i> Tessera
                                                </a>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer border-secondary justify-content-between p-3">
                <a href="index.php?page=persone&from=kiosk" class="btn btn-outline-info">
                    <i class="bi bi-people me-1"></i> Apri Anagrafica Persone Completa &rarr;
                </a>
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Chiudi</button>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap 5 JS Bundle (100% Offline in locale) -->
<script src="assets/js/bootstrap.bundle.min.js"></script>
<script>
function filtraAtletiKiosk() {
    const input = document.getElementById('kioskSearchInput');
    const filter = input.value.toLowerCase().trim();
    const rows = document.querySelectorAll('.atleta-row');
    rows.forEach(row => {
        const text = row.getAttribute('data-search') || '';
        if (text.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
</script>
</body>
</html>
