<?php
/**
 * Eliminazione Gruppo Corso Sportivo
 * Posizione: /private/actions/elimina_gruppo.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$id = !empty($_POST['id']) ? (int)$_POST['id'] : (!empty($_GET['id']) ? (int)$_GET['id'] : 0);

if ($id <= 0) {
    header('Location: index.php?page=gruppi&err=' . urlencode('Identificativo gruppo non valido.'));
    exit;
}

$db = getDbConnection();

try {
    // Recupera nome del gruppo
    $stmtG = $db->prepare("SELECT nome_gruppo FROM gruppi WHERE id = ?");
    $stmtG->execute([$id]);
    $gruppo = $stmtG->fetch();

    if (!$gruppo) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Gruppo non trovato.'));
        exit;
    }

    $nome = $gruppo['nome_gruppo'];

    // Elimina associazioni gruppi_tesserati e quote se necessario
    $db->beginTransaction();

    // Elimina prima gruppi_tesserati
    $db->prepare("DELETE FROM gruppi_tesserati WHERE gruppo_id = ?")->execute([$id]);

    // Rimuovi o scollega quote associate a questo gruppo
    $db->prepare("UPDATE quote SET gruppo_id = NULL WHERE gruppo_id = ?")->execute([$id]);

    // Elimina gruppo
    $db->prepare("DELETE FROM gruppi WHERE id = ?")->execute([$id]);

    $db->commit();

    header('Location: index.php?page=gruppi&msg=' . urlencode("Gruppo '{$nome}' eliminato con successo."));
    exit;
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    header('Location: index.php?page=gruppi&err=' . urlencode('Impossibile eliminare il gruppo: ' . $e->getMessage()));
    exit;
}
