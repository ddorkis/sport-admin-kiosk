<?php
/**
 * Gestione Anni e Stagioni Sportive
 * Posizione: /private/pages/anni.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$anni = $db->query("SELECT * FROM anno ORDER BY data_inizio DESC")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-calendar3 me-2 text-primary"></i>Stagioni Sportive</h2>
        <p class="text-muted small mb-0">Configurazione anni accademici e periodi stagionali</p>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Anno Sportivo</th>
                <th>Data Inizio</th>
                <th>Data Fine</th>
                <th>Stato</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($anni as $a): ?>
                <tr>
                    <td><strong class="fs-6"><?= htmlspecialchars($a['anno']) ?></strong></td>
                    <td><?= date('d/m/Y', strtotime($a['data_inizio'])) ?></td>
                    <td><?= date('d/m/Y', strtotime($a['data_fine'])) ?></td>
                    <td>
                        <?php if ($a['attivo']): ?>
                            <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Anno Corrente Attivo</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Archiviato</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
