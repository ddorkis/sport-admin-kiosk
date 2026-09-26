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
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-card-checklist me-2 text-primary"></i>Registro Tesserati Sportivi</h2>
        <p class="text-muted small mb-0">Gestione soci tesserati, numeri di tessera e certificati medici</p>
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

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
