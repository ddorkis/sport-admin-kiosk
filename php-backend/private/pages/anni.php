<?php
/**
 * Gestione Anni e Stagioni Sportive (Creazione, Scelta Anno Attivo e Statistiche)
 * Posizione: /private/pages/anni.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Assicura l'esistenza delle tabelle collegate
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS `spese_previsionali` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `anno_id` INT NOT NULL,
            `titolo` VARCHAR(150) NOT NULL,
            `categoria` VARCHAR(80) NOT NULL DEFAULT 'Altro',
            `importo_mensile` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `ricorrente` TINYINT(1) NOT NULL DEFAULT 1,
            `mesi_json` TEXT NULL,
            `note` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (Exception $e) {}

// Recupera tutti gli anni con statistiche
$anni = [];
try {
    $anni = $db->query("
        SELECT a.*,
            (SELECT COUNT(*) FROM tesserati t WHERE t.anno_id = a.id) as tot_tesserati,
            (SELECT COUNT(*) FROM gruppi g WHERE g.anno_id = a.id) as tot_gruppi,
            (SELECT COUNT(*) FROM spese_previsionali s WHERE s.anno_id = a.id) as tot_spese
        FROM anno a
        ORDER BY a.data_inizio DESC
    ")->fetchAll() ?: [];
} catch (Exception $e) {}

$msg = $_GET['msg'] ?? '';
$err = $_GET['err'] ?? '';
$annoCorrente = null;
foreach ($anni as $a) {
    if (!empty($a['attivo'])) {
        $annoCorrente = $a;
        break;
    }
}
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-calendar-range-fill text-primary me-2"></i> Stagioni Sportive & Anno di Lavoro
        </h2>
        <p class="text-muted small mb-0">
            Imposta l'anno attivo su cui operano tesseramenti, corsi e quote, oppure crea una nuova stagione sportiva
        </p>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php?page=gestionale" class="btn btn-outline-secondary btn-sm shadow-sm">
            <i class="bi bi-arrow-left me-1"></i> Torna alla Dashboard
        </a>
        <button class="btn btn-primary fw-bold btn-sm shadow-sm" data-bs-toggle="modal" data-bs-target="#modalNuovoAnno">
            <i class="bi bi-plus-circle me-1"></i> Crea Nuova Stagione
        </button>
    </div>
</div>

<!-- Banner Anno Attivo -->
<?php if ($annoCorrente): ?>
    <div class="card border-0 shadow-sm rounded-4 mb-4 text-white" style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);">
        <div class="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
                <div class="p-3 bg-white bg-opacity-20 rounded-4">
                    <i class="bi bi-calendar-check-fill fs-2 text-warning"></i>
                </div>
                <div>
                    <span class="badge bg-warning text-dark fw-bold mb-1 text-uppercase">Anno Sportivo Attivo di Lavoro</span>
                    <h3 class="fw-bold mb-0">Stagione <?= htmlspecialchars($annoCorrente['anno']) ?></h3>
                    <small class="text-white-50">
                        Periodo: dal <?= date('d/m/Y', strtotime($annoCorrente['data_inizio'])) ?> al <?= date('d/m/Y', strtotime($annoCorrente['data_fine'])) ?> • 
                        <strong><?= $annoCorrente['tot_tesserati'] ?></strong> tesserati registrati • 
                        <strong><?= $annoCorrente['tot_gruppi'] ?></strong> corsi attivi • 
                        <strong><?= $annoCorrente['tot_spese'] ?></strong> voci spesa a budget
                    </small>
                </div>
            </div>
            <div>
                <span class="badge bg-white text-primary fs-6 px-3 py-2 fw-bold shadow-xs">
                    <i class="bi bi-check2-circle me-1"></i> Predefinito in Tutto il Gestionale
                </span>
            </div>
        </div>
    </div>
<?php endif; ?>

<!-- Tabella Tutte le Stagioni -->
<div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
    <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
        <div>
            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-list-columns-reverse me-2 text-primary"></i>Elenco Stagioni Sportive Registrate</h5>
            <small class="text-muted">Passa da un anno all'altro per consultare gli archivi o avviare le nuove iscrizioni</small>
        </div>
        <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#modalNuovoAnno">
            <i class="bi bi-plus-lg me-1"></i> Nuova Stagione
        </button>
    </div>
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light small text-uppercase">
                <tr>
                    <th style="width: 70px;">ID</th>
                    <th>Stagione Sportiva</th>
                    <th>Data Inizio</th>
                    <th>Data Fine</th>
                    <th>Tesserati</th>
                    <th>Corsi / Gruppi</th>
                    <th>Stato Attività</th>
                    <th class="text-end">Azione</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($anni)): ?>
                    <tr><td colspan="8" class="text-center py-4 text-muted">Nessun anno sportivo registrato.</td></tr>
                <?php else: foreach ($anni as $a): 
                    $isAttivo = !empty($a['attivo']);
                ?>
                    <tr class="<?= $isAttivo ? 'table-primary bg-opacity-10' : '' ?>">
                        <td><span class="badge bg-light text-secondary border">#<?= $a['id'] ?></span></td>
                        <td>
                            <strong class="fs-6 text-dark"><?= htmlspecialchars($a['anno']) ?></strong>
                            <?php if ($isAttivo): ?>
                                <span class="badge bg-success ms-2"><i class="bi bi-check-lg me-1"></i>Attivo</span>
                            <?php endif; ?>
                        </td>
                        <td><?= date('d/m/Y', strtotime($a['data_inizio'])) ?></td>
                        <td><?= date('d/m/Y', strtotime($a['data_fine'])) ?></td>
                        <td>
                            <span class="badge bg-light text-dark border"><?= $a['tot_tesserati'] ?> atleti</span>
                        </td>
                        <td>
                            <span class="badge bg-light text-dark border"><?= $a['tot_gruppi'] ?> corsi</span>
                        </td>
                        <td>
                            <?php if ($isAttivo): ?>
                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                    <i class="bi bi-check-circle-fill me-1"></i>In Lavorazione
                                </span>
                            <?php else: ?>
                                <span class="badge bg-secondary-subtle text-secondary px-2 py-1">Archiviato</span>
                            <?php endif; ?>
                        </td>
                        <td class="text-end text-nowrap">
                            <?php if (!$isAttivo): ?>
                                <a href="index.php?action=salva_anno&switch_anno_id=<?= $a['id'] ?>&return_page=anni" class="btn btn-sm btn-outline-primary fw-semibold" title="Imposta come anno di lavoro predefinito">
                                    <i class="bi bi-arrow-repeat me-1"></i> Rendi Attivo
                                </a>
                            <?php else: ?>
                                <button class="btn btn-sm btn-success" disabled>
                                    <i class="bi bi-check-circle me-1"></i> Anno Corrente
                                </button>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- MODAL: CREA NUOVO ANNO SPORTIVO -->
<div class="modal fade" id="modalNuovoAnno" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
            <div class="modal-header bg-primary text-white p-3">
                <h5 class="modal-title fw-bold"><i class="bi bi-calendar-plus me-2"></i>Nuova Stagione Sportiva</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="index.php?action=salva_anno">
                <input type="hidden" name="return_page" value="anni">
                <div class="modal-body p-4 bg-light">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <label class="form-label small fw-bold text-muted mb-0 text-uppercase">Configurazione Rapida</label>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="suggerisciProssimoAnno()">
                            <i class="bi bi-magic me-1"></i> Suggerisci Anno Successivo
                        </button>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Denominazione Anno Sportivo <span class="text-danger">*</span></label>
                        <input type="text" name="anno" id="inputNomeAnno" class="form-control fw-bold" placeholder="Es. 2025/2026" required>
                        <div class="form-text small">Utilizza il formato standard con barra (es. 2025/2026).</div>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label fw-bold">Data Inizio <span class="text-danger">*</span></label>
                            <input type="date" name="data_inizio" id="inputDataInizio" class="form-control" value="<?= date('Y') ?>-09-01" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-bold">Data Fine <span class="text-danger">*</span></label>
                            <input type="date" name="data_fine" id="inputDataFine" class="form-control" value="<?= (int)date('Y')+1 ?>-06-30" required>
                        </div>
                    </div>

                    <div class="form-check p-3 bg-white rounded-3 border">
                        <input class="form-check-input ms-0 me-2" type="checkbox" name="attivo" value="1" id="checkAttivo" checked>
                        <label class="form-check-label fw-bold text-dark" for="checkAttivo">
                            Imposta subito come anno sportivo attivo di lavoro
                        </label>
                        <small class="text-muted d-block mt-1">
                            Tutte le schermate del gestionale, le nuove quote e le iscrizioni utilizzeranno automaticamente questa stagione.
                        </small>
                    </div>
                </div>
                <div class="modal-footer bg-white border-top p-3">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="submit" class="btn btn-primary fw-bold px-4">
                        <i class="bi bi-check-lg me-1"></i> Salva Stagione
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function suggerisciProssimoAnno() {
    var d = new Date();
    var y1 = d.getFullYear();
    var y2 = y1 + 1;
    // Se siamo già a Settembre o oltre, proponi anno successivo
    if (d.getMonth() >= 7) {
        y1 = y1 + 1;
        y2 = y1 + 1;
    }
    document.getElementById('inputNomeAnno').value = y1 + '/' + y2;
    document.getElementById('inputDataInizio').value = y1 + '-09-01';
    document.getElementById('inputDataFine').value = y2 + '-06-30';
    document.getElementById('checkAttivo').checked = true;
}
</script>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
