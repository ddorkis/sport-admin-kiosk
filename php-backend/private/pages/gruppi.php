<?php
/**
 * Gestione Gruppi & Corsi Sportivi
 * Posizione: /private/pages/gruppi.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$gruppi = $db->query("
    SELECT g.*, a.anno,
           (SELECT COUNT(*) FROM gruppi_tesserati gt WHERE gt.gruppo_id = g.id) AS num_iscritti
    FROM gruppi g
    INNER JOIN anno a ON g.anno_id = a.id
    ORDER BY g.nome_gruppo ASC
")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-diagram-3 me-2 text-primary"></i>Gruppi & Corsi Sportivi</h2>
        <p class="text-muted small mb-0">Configurazione quote mensili, giorni di scadenza e periodi di attività</p>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Nome Gruppo / Corso</th>
                <th>Anno Sportivo</th>
                <th>Istruttore</th>
                <th>Quota Mensile</th>
                <th>Giorno Scadenza</th>
                <th>Periodo Attività</th>
                <th>Iscritti</th>
                <th class="text-end">Azioni</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($gruppi)): ?>
                <tr><td colspan="8" class="text-center py-4 text-muted">Nessun gruppo configurato.</td></tr>
            <?php else: foreach ($gruppi as $g): ?>
                <tr>
                    <td>
                        <strong class="text-primary"><?= htmlspecialchars($g['nome_gruppo']) ?></strong>
                        <?php if (!empty($g['categoria'])): ?>
                            <div class="small text-muted"><?= htmlspecialchars($g['categoria']) ?></div>
                        <?php endif; ?>
                    </td>
                    <td><span class="badge bg-light text-dark"><?= htmlspecialchars($g['anno']) ?></span></td>
                    <td><?= htmlspecialchars($g['istruttore'] ?? '-') ?></td>
                    <td><strong class="text-success fs-6">€ <?= number_format($g['quota_mensile'], 2, ',', '.') ?></strong></td>
                    <td>Il <?= $g['giorno_scadenza_mensile'] ?> del mese</td>
                    <td>
                        <small>
                            Dal <?= date('d/m/Y', strtotime($g['data_inizio'])) ?><br>
                            Al <?= date('d/m/Y', strtotime($g['data_fine'])) ?>
                        </small>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary"><?= $g['num_iscritti'] ?> atleti</span></td>
                    <td class="text-end">
                        <a href="index.php?page=quote&gruppo_id=<?= $g['id'] ?>" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-eye me-1"></i> Quote
                        </a>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
