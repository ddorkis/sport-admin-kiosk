<?php
/**
 * Pagina Dedicata: Iscrizione Atleta a Gruppo / Corso Sportivo
 * Posizione: /private/pages/iscrizione_gruppo.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$preselectedTessId = isset($_GET['tesserato_id']) ? (int)$_GET['tesserato_id'] : 0;
$preselectedGruppoId = isset($_GET['gruppo_id']) ? (int)$_GET['gruppo_id'] : 0;

// Recupera tesserati attivi
$stmtT = $db->query("
    SELECT t.id AS tesserato_id, t.numero_tessera, p.nome, p.cognome, p.is_minorenne, p.codice_fiscale
    FROM tesserati t
    INNER JOIN persone p ON t.persona_id = p.id
    WHERE t.stato = 'Attivo'
    ORDER BY p.cognome ASC, p.nome ASC
");
$tesserati = $stmtT->fetchAll();

// Recupera gruppi
$stmtG = $db->query("
    SELECT g.*, a.anno
    FROM gruppi g
    INNER JOIN anno a ON g.anno_id = a.id
    ORDER BY g.nome_gruppo ASC
");
$gruppi = $stmtG->fetchAll();

$fromKiosk = (!empty($_GET['from']) && $_GET['from'] === 'kiosk') || (!empty($user['is_kiosk']) && ($user['ruolo'] ?? '') !== 'admin');
$backUrl = $fromKiosk ? 'index.php?page=kiosk' : 'index.php?page=gruppi';
$backLabel = $fromKiosk ? 'Torna al Kiosk Reception' : 'Torna ai Gruppi';
?>

<!-- Breadcrumb -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item">
            <a href="<?= htmlspecialchars($backUrl) ?>" class="text-decoration-none">
                <i class="<?= $fromKiosk ? 'bi bi-display' : 'bi bi-diagram-3' ?> me-1"></i> <?= htmlspecialchars($backLabel) ?>
            </a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Iscrizione Atleta</li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-person-plus text-primary me-2"></i>
            Iscrizione Atleta a Gruppo / Corso
        </h2>
        <p class="text-muted small mb-0">
            Inserisci l'atleta nel gruppo di allenamento e calcola in automatico le rate mensili previste per il corso
        </p>
    </div>
    <div>
        <a href="<?= htmlspecialchars($backUrl) ?>" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> <?= htmlspecialchars($backLabel) ?>
        </a>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-8 col-xl-7">
        <form method="POST" action="index.php?action=iscrivi_gruppo">
            <?php if ($fromKiosk): ?>
                <input type="hidden" name="from" value="kiosk">
            <?php endif; ?>
            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-calendar-check text-primary me-2"></i> Dettagli dell'Iscrizione
                    </h5>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Selezione Atleta -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Seleziona Atleta Tesserato <span class="text-danger">*</span></label>
                            <select name="tesserato_id" class="form-select form-select-lg" required>
                                <option value="">-- Seleziona Atleta --</option>
                                <?php foreach ($tesserati as $t): ?>
                                    <option value="<?= $t['tesserato_id'] ?>" <?= ($t['tesserato_id'] == $preselectedTessId ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($t['cognome'] . ' ' . $t['nome']) ?> (Tessera: <?= htmlspecialchars($t['numero_tessera']) ?> - CF: <?= htmlspecialchars($t['codice_fiscale']) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <!-- Selezione Gruppo -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Corso / Gruppo di Destinazione <span class="text-danger">*</span></label>
                            <select name="gruppo_id" class="form-select form-select-lg" required>
                                <option value="">-- Seleziona Gruppo --</option>
                                <?php foreach ($gruppi as $g): ?>
                                    <option value="<?= $g['id'] ?>" <?= ($g['id'] == $preselectedGruppoId ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($g['nome_gruppo']) ?> (<?= htmlspecialchars($g['categoria']) ?>) &bull; € <?= number_format($g['quota_mensile'], 2) ?>/mese &bull; [Stagione <?= htmlspecialchars($g['anno']) ?>]
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <!-- Data Iscrizione -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Inizio Iscrizione <span class="text-danger">*</span></label>
                            <input type="date" name="data_iscrizione" class="form-control" value="<?= date('Y-m-d') ?>" required>
                        </div>

                        <!-- Opzione Generazione Quote -->
                        <div class="col-md-6 d-flex align-items-center">
                            <div class="p-3 bg-light rounded-3 border w-100">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="genera_quote" id="chkGeneraQuote" value="1" checked>
                                    <label class="form-check-label fw-bold text-dark" for="chkGeneraQuote">
                                        Genera Quote Mensili Automatiche
                                    </label>
                                </div>
                                <div class="small text-muted mt-1" style="font-size: 0.78rem;">
                                    Crea subito le rate scadenzate per tutti i mesi del corso.
                                </div>
                            </div>
                        </div>

                        <!-- Note -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Note Iscrizione</label>
                            <input type="text" name="note" class="form-control" placeholder="es. Iscritto con sconto secondo figlio, frequenza parziale, ecc.">
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center">
                    <a href="index.php?page=gruppi" class="btn btn-light border px-4">Annulla</a>
                    <button type="submit" class="btn btn-primary fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i> Conferma Iscrizione al Gruppo
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
