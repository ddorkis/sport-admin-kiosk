<?php
/**
 * Gestione Tesserati per Anno Sportivo
 * Posizione: /private/pages/tesserati.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$search = trim($_GET['search'] ?? '');
$tipo = $_GET['tipo'] ?? '';
$stato = $_GET['stato'] ?? '';

$sql = "SELECT t.*, p.nome, p.cognome, p.codice_fiscale, p.is_minorenne, p.tutore_nome, p.tutore_cognome, a.anno
        FROM tesserati t
        INNER JOIN persone p ON t.persona_id = p.id
        INNER JOIN anno a ON t.anno_id = a.id
        WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (p.nome LIKE ? OR p.cognome LIKE ? OR t.numero_tessera LIKE ? OR p.codice_fiscale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($tipo !== '') {
    $sql .= " AND t.tipo_tesseramento = ?";
    $params[] = $tipo;
}

if ($stato !== '') {
    $sql .= " AND t.stato = ?";
    $params[] = $stato;
}

$sql .= " ORDER BY t.data_tesseramento DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$tesserati = $stmt->fetchAll();

// Recupera elenco persone e anni per il modal di nuovo tesseramento
$elencoPersone = $db->query("SELECT id, nome, cognome, codice_fiscale, is_minorenne FROM persone ORDER BY cognome ASC, nome ASC")->fetchAll();
$elencoAnni = $db->query("SELECT id, anno, attivo FROM anno ORDER BY id DESC")->fetchAll();

$selectedPersonaId = isset($_GET['persona_id']) ? (int)$_GET['persona_id'] : 0;
$autoOpenNuovoTess = !empty($_GET['nuovo_tess']);
?>

<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-card-checklist me-2 text-primary"></i>Registro Tesserati Sportivi</h2>
        <p class="text-muted small mb-0">Gestione soci tesserati, numeri di tessera e certificati medici</p>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php?page=persona_nuova" class="btn btn-outline-primary fw-semibold shadow-sm">
            <i class="bi bi-person-plus-fill me-1"></i> Nuova Persona
        </a>
        <button class="btn btn-primary fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#modalNuovoTesseramento">
            <i class="bi bi-plus-lg me-1"></i> Nuovo Tesseramento
        </button>
    </div>
</div>

<!-- Filtri -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="tesserati">
            <div class="col-md-5">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta, Tessera o Codice Fiscale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="tipo" class="form-select form-select-sm">
                    <option value="">Tutti i Tipi Tesseramento</option>
                    <option value="Agonista" <?= $tipo==='Agonista'?'selected':'' ?>>Agonista</option>
                    <option value="Non Agonista" <?= $tipo==='Non Agonista'?'selected':'' ?>>Non Agonista</option>
                    <option value="Promozionale" <?= $tipo==='Promozionale'?'selected':'' ?>>Promozionale</option>
                    <option value="Socio / Dirigente" <?= $tipo==='Socio / Dirigente'?'selected':'' ?>>Socio / Dirigente</option>
                </select>
            </div>
            <div class="col-md-2">
                <select name="stato" class="form-select form-select-sm">
                    <option value="">Tutti gli Stati</option>
                    <option value="Attivo" <?= $stato==='Attivo'?'selected':'' ?>>Attivo</option>
                    <option value="Sospeso" <?= $stato==='Sospeso'?'selected':'' ?>>Sospeso</option>
                    <option value="Scaduto" <?= $stato==='Scaduto'?'selected':'' ?>>Scaduto</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
        </form>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>N° Tessera</th>
                <th>Atleta</th>
                <th>Anno</th>
                <th>Data Tesseramento</th>
                <th>Tipo</th>
                <th>Certificato Medico</th>
                <th>Stato</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($tesserati)): ?>
                <tr><td colspan="7" class="text-center py-4 text-muted">Nessun tesserato trovato.</td></tr>
            <?php else: foreach ($tesserati as $t): ?>
                <tr>
                    <td><code><?= htmlspecialchars($t['numero_tessera']) ?></code></td>
                    <td>
                        <strong><?= htmlspecialchars($t['cognome'] . ' ' . $t['nome']) ?></strong>
                        <?php if ($t['is_minorenne']): ?>
                            <span class="badge bg-warning text-dark ms-1">Minorenne</span>
                        <?php endif; ?>
                    </td>
                    <td><span class="badge bg-light text-dark"><?= htmlspecialchars($t['anno']) ?></span></td>
                    <td><?= date('d/m/Y', strtotime($t['data_tesseramento'])) ?></td>
                    <td><span class="badge bg-primary-subtle text-primary"><?= htmlspecialchars($t['tipo_tesseramento']) ?></span></td>
                    <td>
                        <?php if (!empty($t['certificato_medico_scadenza'])): 
                            $isScadutoMed = strtotime($t['certificato_medico_scadenza']) < time();
                        ?>
                            <span class="<?= $isScadutoMed ? 'text-danger fw-bold' : 'text-success' ?>">
                                <?= date('d/m/Y', strtotime($t['certificato_medico_scadenza'])) ?>
                                <?= $isScadutoMed ? '<i class="bi bi-exclamation-circle ms-1"></i>' : '' ?>
                            </span>
                        <?php else: ?>
                            <span class="text-muted">Non inserito</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <span class="badge bg-<?= $t['stato']==='Attivo'?'success':($t['stato']==='Sospeso'?'warning text-dark':'secondary') ?>">
                            <?= htmlspecialchars($t['stato']) ?>
                        </span>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<!-- MODAL: NUOVO TESSERAMENTO -->
<div class="modal fade" id="modalNuovoTesseramento" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title fw-bold"><i class="bi bi-card-checklist me-2"></i>Registra Nuovo Tesseramento</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="index.php?action=salva_tesseramento">
                <div class="modal-body p-4">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <label class="form-label fw-bold">Seleziona Persona / Atleta <span class="text-danger">*</span></label>
                            <select name="persona_id" class="form-select" required>
                                <option value="">-- Seleziona persona da anagrafica --</option>
                                <?php foreach ($elencoPersone as $p): ?>
                                    <option value="<?= $p['id'] ?>" <?= ($selectedPersonaId === (int)$p['id'] ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?> (CF: <?= htmlspecialchars($p['codice_fiscale']) ?><?= $p['is_minorenne'] ? ' - Minorenne' : '' ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="form-text">Se la persona non è presente, inseriscila in <a href="index.php?page=persona_nuova">Nuova Persona</a>.</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Anno Sportivo <span class="text-danger">*</span></label>
                            <select name="anno_id" class="form-select" required>
                                <?php foreach ($elencoAnni as $a): ?>
                                    <option value="<?= $a['id'] ?>" <?= (!empty($a['attivo']) ? 'selected' : '') ?>><?= htmlspecialchars($a['anno']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Numero di Tessera <span class="text-danger">*</span></label>
                            <input type="text" name="numero_tessera" class="form-control font-monospace" placeholder="es. FISR-2024-0892" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Tesseramento <span class="text-danger">*</span></label>
                            <input type="date" name="data_tesseramento" class="form-control" value="<?= date('Y-m-d') ?>" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Tipo Tesseramento <span class="text-danger">*</span></label>
                            <select name="tipo_tesseramento" class="form-select" required>
                                <option value="Agonista">Agonista</option>
                                <option value="Non Agonista">Non Agonista</option>
                                <option value="Promozionale">Promozionale</option>
                                <option value="Socio / Dirigente">Socio / Dirigente</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Scadenza Certificato Medico</label>
                            <input type="date" name="certificato_medico_scadenza" class="form-control">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Stato Tesseramento</label>
                            <select name="stato" class="form-select">
                                <option value="Attivo">Attivo</option>
                                <option value="Sospeso">Sospeso</option>
                                <option value="Scaduto">Scaduto</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="submit" class="btn btn-primary fw-bold"><i class="bi bi-check-lg me-1"></i> Conferma Tesseramento</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php if ($autoOpenNuovoTess): ?>
<script>
document.addEventListener('DOMContentLoaded', function() {
    var modalEl = document.getElementById('modalNuovoTesseramento');
    if (modalEl) {
        var myModal = new bootstrap.Modal(modalEl);
        myModal.show();
    }
});
</script>
<?php endif; ?>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
