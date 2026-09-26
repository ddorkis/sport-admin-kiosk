<?php
/**
 * Annullamento Quota Mensile (per ritiro, esonero o motivazione contabile)
 * Posizione: /private/actions/annulla_quota.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$quotaId = (int)($_REQUEST['id'] ?? 0);
$motivo = trim($_REQUEST['motivo'] ?? 'Annullamento manuale da segreteria');
$redirect = !empty($_REQUEST['redirect']) ? trim($_REQUEST['redirect']) : 'quote';

if ($quotaId <= 0) {
    header("Location: index.php?page={$redirect}&err=" . urlencode('Identificativo quota non valido.'));
    exit;
}

$db = getDbConnection();

try {
    $stmt = $db->prepare("
        UPDATE quote
        SET stato = 'annullata', causale = CONCAT(causale, ' [ANNULLATA: ', ?, ']')
        WHERE id = ? AND stato != 'pagata'
    ");
    $stmt->execute([$motivo, $quotaId]);

    if ($stmt->rowCount() > 0) {
        header("Location: index.php?page={$redirect}&msg=" . urlencode('Quota contrassegnata come annullata con successo.'));
    } else {
        header("Location: index.php?page={$redirect}&err=" . urlencode('Impossibile annullare: la quota potrebbe essere già stata saldata o non esistere.'));
    }
    exit;
} catch (Exception $e) {
    header("Location: index.php?page={$redirect}&err=" . urlencode('Errore durante annullamento quota: ' . $e->getMessage()));
    exit;
}
