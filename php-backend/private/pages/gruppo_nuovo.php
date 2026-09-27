<?php
/**
 * Pagina Dedicata: Creazione / Modifica Gruppo / Corso Sportivo
 * Posizione: /private/pages/gruppo_nuovo.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Recupera eventuale gruppo da modificare
$editId = !empty($_GET['id']) ? (int)$_GET['id'] : (!empty($_GET['edit_id']) ? (int)$_GET['edit_id'] : null);
$gruppo = null;
if ($editId) {
    $stmtG = $db->prepare("SELECT * FROM gruppi WHERE id = ?");
    $stmtG->execute([$editId]);
    $gruppo = $stmtG->fetch();
}

$isEditing = !empty($gruppo);

// Recupera anni sportivi
$anni = $db->query("SELECT * FROM anno ORDER BY id DESC")->fetchAll();
$annoIdAttivo = $gruppo['anno_id'] ?? ($annoAttivo['id'] ?? 1);

// Date di default per il corso in base all'anno attivo o al gruppo esistente
$dataInizioDefault = $gruppo['data_inizio'] ?? (!empty($annoAttivo['data_inizio']) ? $annoAttivo['data_inizio'] : date('Y') . '-09-01');
$dataFineDefault = $gruppo['data_fine'] ?? (!empty($annoAttivo['data_fine']) ? $annoAttivo['data_fine'] : (date('Y') + 1) . '-05-31');

$categorieGruppo = [
    'Pattinaggio Singolo',
    'Coppia Artistico',
    'Solo Dance & Coppia Danza',
    'Gruppi Show & Precision',
    'Avviamento & Primi Passi',
    'Agonismo Avanzato',
    'Corsi Adulti / Amatori',
    'Preparazione Atletica'
];
?>

<!-- Breadcrumb -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="index.php?page=gruppi" class="text-decoration-none">Gruppi & Corsi</a></li>
        <li class="breadcrumb-item active" aria-current="page"><?= $isEditing ? 'Modifica Gruppo' : 'Nuovo Gruppo' ?></li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-diagram-3-fill text-primary me-2"></i>
            <?= $isEditing ? 'Modifica Gruppo: ' . htmlspecialchars($gruppo['nome_gruppo']) : 'Nuovo Gruppo / Corso di Pattinaggio' ?>
        </h2>
        <p class="text-muted small mb-0">
            <?= $isEditing
                ? "Modifica il nome del corso, l'istruttore o gli orari. Le quote già emesse e i pagamenti storici non vengono alterati."
                : "Definisci la quota mensile, il giorno di scadenza e il periodo di attività per l'automazione delle rate." ?>
        </p>
    </div>
    <div>
        <a href="index.php?page=gruppi" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Annulla e Torna all'Elenco
        </a>
    </div>
</div>

<?php if ($isEditing): ?>
    <div class="alert alert-info border-info d-flex align-items-start mb-4 shadow-sm p-3 rounded-3">
        <i class="bi bi-info-circle-fill fs-3 text-primary me-3 flex-shrink-0 mt-1"></i>
        <div class="small">
            <strong className="d-block mb-1 fs-6">Gestione Modifica Nome vs Variazione Importo:</strong>
            <ul class="mb-0 ps-3">
                <li>
                    <strong>Vuoi cambiare solo il nome, l'istruttore o la descrizione?</strong> Puoi farlo direttamente qui: il nuovo nome verrà associato al corso e mostrato in tutte le schermate, senza alterare gli importi delle quote o i pagamenti già registrati.
                </li>
                <li class="mt-1">
                    <strong>Vuoi cambiare l'importo mensile a stagione in corso?</strong> La regola contabile corretta è non modificare retroattivamente il gruppo. Ti consigliamo invece di usare la funzione <em>"Disattiva & Quote"</em> nell'elenco gruppi (che sgoverà le rate non saldate da oggi in poi) e poi creare un nuovo gruppo con la nuova tariffa.
                </li>
            </ul>
        </div>
    </div>
<?php endif; ?>

<div class="row justify-content-center">
    <div class="col-lg-9 col-xl-8">
        <form method="POST" action="index.php?action=salva_gruppo">
            <?php if ($isEditing): ?>
                <input type="hidden" name="id" value="<?= (int)$gruppo['id'] ?>">
            <?php endif; ?>

            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-sliders me-2 text-primary"></i> Dati del Corso e Piano Quote
                    </h5>
                    <?php if ($isEditing): ?>
                        <span class="badge <?= (!empty($gruppo['attivo']) ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary') ?> px-3 py-2">
                            <?= (!empty($gruppo['attivo']) ? 'Corso Attivo' : 'Corso Disattivato') ?>
                        </span>
                    <?php else: ?>
                        <span class="badge bg-secondary-subtle text-secondary px-3 py-2">
                            Stagione <?= htmlspecialchars($annoAttivo['anno'] ?? '') ?>
                        </span>
                    <?php endif; ?>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Nome Gruppo -->
                        <div class="col-md-8">
                            <label class="form-label fw-bold">Nome del Gruppo / Corso <span class="text-danger">*</span></label>
                            <input type="text" name="nome_gruppo" class="form-control form-control-lg fw-semibold"
                                   placeholder="es. Avviamento Base Lunedì/Mercoledì"
                                   value="<?= htmlspecialchars($gruppo['nome_gruppo'] ?? '') ?>" required>
                            <div class="form-text small">Nome identificativo mostrato nei prospetti e sulle ricevute delle quote.</div>
                        </div>

                        <!-- Anno Sportivo -->
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Anno Sportivo <span class="text-danger">*</span></label>
                            <select name="anno_id" class="form-select form-select-lg" required>
                                <?php foreach ($anni as $a): ?>
                                    <option value="<?= $a['id'] ?>" <?= ($a['id'] == $annoIdAttivo ? 'selected' : '') ?>>
                                        Stagione <?= htmlspecialchars($a['anno']) ?> <?= (!empty($a['attivo']) ? '(Attivo)' : '') ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <!-- Categoria Disciplina -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Disciplina / Specialità <span class="text-danger">*</span></label>
                            <select name="categoria" class="form-select" required>
                                <?php foreach ($categorieGruppo as $cat): ?>
                                    <option value="<?= htmlspecialchars($cat) ?>" <?= (($gruppo['categoria'] ?? '') === $cat ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($cat) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <!-- Istruttore / Allenatore -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Istruttore / Responsabile Tecnico</label>
                            <input type="text" name="istruttore" class="form-control"
                                   placeholder="es. Elena Bianchi (Tecnico Federale)"
                                   value="<?= htmlspecialchars($gruppo['istruttore'] ?? '') ?>">
                        </div>

                        <div class="col-12"><hr class="my-2 text-muted"></div>

                        <!-- Quota Mensile e Scadenza -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Quota Mensile Riferimento (€) <span class="text-danger">*</span></label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-light fw-bold">€</span>
                                <input type="number" step="0.50" min="0" name="quota_mensile" class="form-control fw-bold text-primary font-monospace"
                                       value="<?= htmlspecialchars(number_format($gruppo['quota_mensile'] ?? 55.00, 2, '.', '')) ?>" required>
                            </div>
                            <div class="form-text small">
                                <?= $isEditing ? 'Attenzione: modificare questo importo influisce solo sulle generazioni future, non su quelle già emesse.' : 'Importo applicato per ciascuna rata mensile generata per i corsisti.' ?>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Giorno del Mese di Scadenza Rata <span class="text-danger">*</span></label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-light fw-bold"><i class="bi bi-calendar-event"></i></span>
                                <input type="number" min="1" max="31" name="giorno_scadenza_mensile" class="form-control fw-bold font-monospace"
                                       value="<?= (int)($gruppo['giorno_scadenza_mensile'] ?? 10) ?>" required>
                            </div>
                            <div class="form-text small">Giorno di scadenza delle rate (es. il 10 del mese per le quote successive).</div>
                        </div>

                        <!-- Periodo di Attività (Inizio e Fine) -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Inizio Attività Corso <span class="text-danger">*</span></label>
                            <input type="date" name="data_inizio" class="form-control" value="<?= htmlspecialchars($dataInizioDefault) ?>" required>
                            <div class="form-text small">Determina il primo mese utile per la generazione automatica delle quote.</div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Fine Attività Corso <span class="text-danger">*</span></label>
                            <input type="date" name="data_fine" class="form-control" value="<?= htmlspecialchars($dataFineDefault) ?>" required>
                            <div class="form-text small">Determina l'ultimo mese in cui viene calcolata la retta del corso.</div>
                        </div>

                        <!-- Descrizione e Note Orari -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Descrizione, Orari Pista & Note</label>
                            <textarea name="descrizione" class="form-control" rows="3"
                                      placeholder="es. Pista Comunale Palazzetto: Lunedì 16:30-18:00 e Giovedì 17:00-18:30. Livello preparatorio principianti."><?= htmlspecialchars($gruppo['descrizione'] ?? '') ?></textarea>
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center">
                    <a href="index.php?page=gruppi" class="btn btn-light border px-4">Annulla</a>
                    <button type="submit" class="btn btn-primary fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i> <?= $isEditing ? 'Salva Modifiche Gruppo' : 'Salva e Attiva Corso' ?>
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
