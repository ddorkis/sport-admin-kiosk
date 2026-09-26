<?php
/**
 * Gestione Tabella Persone con Minorenni e Tutori
 * Posizione: /private/pages/persone.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';

$db = getDbConnection();
$search = trim($_GET['search'] ?? '');
$filterMinori = $_GET['minorenne'] ?? '';

// Paginazione
$pageNumber = max(1, (int)($_GET['p'] ?? 1));
$perPage = 10;
$offset = ($pageNumber - 1) * $perPage;

$where = "WHERE 1=1";
$params = [];

if ($search !== '') {
    $where .= " AND (nome LIKE ? OR cognome LIKE ? OR codice_fiscale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filterMinori !== '') {
    $where .= " AND is_minorenne = ?";
    $params[] = (int)$filterMinori;
}

$stmtCount = $db->prepare("SELECT COUNT(*) FROM persone $where");
$stmtCount->execute($params);
$totalRecords = $stmtCount->fetchColumn();
$totalPages = ceil($totalRecords / $perPage);

$stmt = $db->prepare("SELECT * FROM persone $where ORDER BY cognome, nome LIMIT $perPage OFFSET $offset");
$stmt->execute($params);
$persone = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-people-fill me-2 text-primary"></i>Anagrafica Generale Persone</h2>
        <p class="text-muted small mb-0">Gestione soci e atleti (con evidenza atleti minorenni e tutore legale)</p>
    </div>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalNuovaPersona">
        <i class="bi bi-person-plus-fill me-1"></i> Nuova Persona
    </button>
</div>

<!-- Filtri di ricerca -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="persone">
            <div class="col-md-5">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca per Nome, Cognome o Codice Fiscale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="minorenne" class="form-select form-select-sm">
                    <option value="">Tutti (Minorenni e Maggiorenni)</option>
                    <option value="1" <?= $filterMinori==='1'?'selected':'' ?>>Solo Minorenni (con Tutore)</option>
                    <option value="0" <?= $filterMinori==='0'?'selected':'' ?>>Solo Maggiorenni</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
            <?php if ($search !== '' || $filterMinori !== ''): ?>
            <div class="col-md-2">
                <a href="index.php?page=persone" class="btn btn-sm btn-outline-danger w-100">Resetta</a>
            </div>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Tabella Paginata -->
<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Nominativo Atleta</th>
                <th>Codice Fiscale</th>
                <th>Nascita</th>
                <th>Tipo Atleta</th>
                <th>Tutore Legale (Minorenni)</th>
                <th>Contatti</th>
                <th class="text-end">Azioni</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($persone)): ?>
                <tr><td colspan="8" class="text-center py-4 text-muted">Nessuna persona trovata con i filtri correnti.</td></tr>
            <?php else: foreach ($persone as $p): ?>
                <tr>
                    <td><span class="badge bg-light text-dark">#<?= $p['id'] ?></span></td>
                    <td><strong><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></strong></td>
                    <td><code><?= htmlspecialchars($p['codice_fiscale']) ?></code></td>
                    <td><?= date('d/m/Y', strtotime($p['data_nascita'])) ?></td>
                    <td>
                        <?php if ($p['is_minorenne']): ?>
                            <span class="badge bg-warning text-dark"><i class="bi bi-shield-check me-1"></i>Minorenne</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Maggiorenne</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($p['is_minorenne']): ?>
                            <div><strong><?= htmlspecialchars($p['tutore_cognome'] . ' ' . $p['tutore_nome']) ?></strong> (<?= htmlspecialchars($p['tutore_relazione'] ?? 'Tutore') ?>)</div>
                            <small class="text-muted"><i class="bi bi-telephone"></i> <?= htmlspecialchars($p['tutore_telefono'] ?? '-') ?></small>
                        <?php else: ?>
                            <span class="text-muted">-</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <small>
                            <div><i class="bi bi-telephone"></i> <?= htmlspecialchars($p['telefono'] ?? '-') ?></div>
                            <div><i class="bi bi-envelope"></i> <?= htmlspecialchars($p['email'] ?? '-') ?></div>
                        </small>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>
<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
