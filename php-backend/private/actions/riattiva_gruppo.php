<?php
/**
 * Riattivazione Gruppo / Corso Sportivo
 * Posizione: /private/actions/riattiva_gruppo.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db = getDbConnection();
    $gruppoId = (int)($_POST['gruppo_id'] ?? 0);

    if (!$gruppoId) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Gruppo non specificato.'));
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE gruppi SET attivo = 1 WHERE id = ?");
        $stmt->execute([$gruppoId]);

        header('Location: index.php?page=gruppi&msg=' . urlencode('Corso riattivato con successo.'));
        exit;
    } catch (PDOException $e) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Errore durante la riattivazione: ' . $e->getMessage()));
        exit;
    }
} else {
    header('Location: index.php?page=gruppi');
    exit;
}
