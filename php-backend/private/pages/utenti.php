<?php
/**
 * Gestione Utenti e Operatori
 * Posizione: /private/pages/utenti.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$utenti = $db->query("SELECT id, username, nome, ruolo, is_kiosk, attivo, created_at FROM utenti ORDER BY id ASC")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-person-badge me-2 text-primary"></i>Gestione Utenti & Postazioni</h2>
        <p class="text-muted small mb-0">Profili operatore, amministratori e configurazione postazioni Kiosk reception</p>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Nome Utente</th>
                <th>Nome Completo</th>
                <th>Ruolo</th>
                <th>Modalità Kiosk</th>
                <th>Stato</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($utenti as $u): ?>
                <tr>
                    <td><code><?= htmlspecialchars($u['username']) ?></code></td>
                    <td><strong><?= htmlspecialchars($u['nome']) ?></strong></td>
                    <td><span class="badge bg-primary-subtle text-primary"><?= ucfirst($u['ruolo']) ?></span></td>
                    <td>
                        <?php if ($u['is_kiosk']): ?>
                            <span class="badge bg-warning text-dark"><i class="bi bi-tablet-landscape me-1"></i>Kiosk Attivo</span>
                        <?php else: ?>
                            <span class="badge bg-light text-muted border">Gestionale Web</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <span class="badge bg-<?= $u['attivo'] ? 'success' : 'danger' ?>">
                            <?= $u['attivo'] ? 'Attivo' : 'Disattivato' ?>
                        </span>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
