<?php
/**
 * Registro Incassi & Pagamenti
 * Posizione: /private/pages/pagamenti.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$search = trim($_GET['search'] ?? '');
$metodo = trim($_GET['metodo'] ?? '');

$sql = "SELECT p.*, per.nome, per.cognome, t.numero_tessera
        FROM pagamenti p
        INNER JOIN tesserati t ON p.tesserato_id = t.id
        INNER JOIN persone per ON t.persona_id = per.id
        WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (per.nome LIKE ? OR per.cognome LIKE ? OR p.ricevuta_numero LIKE ? OR p.causale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
if ($metodo !== '') {
    $sql .= " AND p.metodo_pagamento = ?";
    $params[] = $metodo;
}

$sql .= " ORDER BY p.data_pagamento DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$pagamenti = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-wallet2 me-2 text-success"></i>Registro Incassi & Pagamenti</h2>
        <p class="text-muted small mb-0">Elenco delle quietanze e ricevute emesse per quote e corsi</p>
    </div>
</div>

<!-- Filtri -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="pagamenti">
            <div class="col-md-6">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta, Ricevuta o Causale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="metodo" class="form-select form-select-sm">
                    <option value="">Tutti i Metodi di Pagamento</option>
                    <option value="contanti" <?= $metodo==='contanti'?'selected':'' ?>>Contanti</option>
                    <option value="pos" <?= $metodo==='pos'?'selected':'' ?>>POS / Carta</option>
                    <option value="bonifico" <?= $metodo==='bonifico'?'selected':'' ?>>Bonifico Bancario</option>
                    <option value="satispay" <?= $metodo==='satispay'?'selected':'' ?>>Satispay</option>
                </select>
            </div>
            <div class="col-md-3">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
        </form>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>N° Ricevuta</th>
                <th>Data Incasso</th>
                <th>Atleta</th>
                <th>Causale</th>
                <th>Metodo</th>
                <th class="text-end">Importo</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($pagamenti)): ?>
                <tr><td colspan="6" class="text-center py-4 text-muted">Nessun pagamento registrato con i filtri selezionati.</td></tr>
            <?php else: foreach ($pagamenti as $p): ?>
                <tr>
                    <td><code><?= htmlspecialchars($p['ricevuta_numero']) ?></code></td>
                    <td><?= date('d/m/Y H:i', strtotime($p['data_pagamento'])) ?></td>
                    <td><strong><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></strong></td>
                    <td><?= htmlspecialchars($p['causale']) ?></td>
                    <td>
                        <span class="badge bg-secondary-subtle text-secondary">
                            <?= ucfirst($p['metodo_pagamento']) ?>
                        </span>
                    </td>
                    <td class="text-end fw-bold text-success fs-6">€ <?= number_format($p['importo'], 2, ',', '.') ?></td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
