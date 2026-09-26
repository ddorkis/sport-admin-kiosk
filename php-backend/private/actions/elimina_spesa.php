<?php
/**
 * Eliminazione Spesa Previsionale (Budget Spese)
 * Posizione: /private/actions/elimina_spesa.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$id = (int)($_REQUEST['id'] ?? 0);

if ($id <= 0) {
    header('Location: index.php?page=previsioni&err=' . urlencode('Identificativo spesa non valido.'));
    exit;
}

$db = getDbConnection();

try {
    $stmt = $db->prepare("DELETE FROM spese_previsionali WHERE id = ?");
    $stmt->execute([$id]);

    header('Location: index.php?page=previsioni&msg=' . urlencode('Voce di spesa eliminata dal budget previsionale.'));
    exit;
} catch (Exception $e) {
    header('Location: index.php?page=previsioni&err=' . urlencode('Errore eliminazione spesa: ' . $e->getMessage()));
    exit;
}
