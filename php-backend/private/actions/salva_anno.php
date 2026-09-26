<?php
/**
 * Gestione Creazione e Selezione Anno Sportivo Attivo
 * Posizione: /private/actions/salva_anno.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$db = getDbConnection();
$returnPage = $_REQUEST['return_page'] ?? 'anni';

// 1. Cambio rapido dell'anno sportivo attivo
if (isset($_REQUEST['switch_anno_id'])) {
    $annoId = (int)$_REQUEST['switch_anno_id'];
    if ($annoId > 0) {
        try {
            $db->exec("UPDATE anno SET attivo = 0");
            $stmt = $db->prepare("UPDATE anno SET attivo = 1 WHERE id = ?");
            $stmt->execute([$annoId]);

            $stmtNome = $db->prepare("SELECT anno FROM anno WHERE id = ?");
            $stmtNome->execute([$annoId]);
            $nomeAnno = $stmtNome->fetchColumn() ?: '';

            header("Location: index.php?page=" . urlencode($returnPage) . "&msg=" . urlencode("Anno sportivo di lavoro impostato su {$nomeAnno}!"));
            exit;
        } catch (Exception $e) {
            header("Location: index.php?page=" . urlencode($returnPage) . "&err=" . urlencode("Errore selezione anno: " . $e->getMessage()));
            exit;
        }
    }
}

// 2. Creazione / Modifica nuovo anno sportivo
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = !empty($_POST['id']) ? (int)$_POST['id'] : null;
    $anno = trim($_POST['anno'] ?? '');
    $dataInizio = $_POST['data_inizio'] ?? '';
    $dataFine = $_POST['data_fine'] ?? '';
    $attivo = !empty($_POST['attivo']) ? 1 : 0;

    if (empty($anno) || empty($dataInizio) || empty($dataFine)) {
        header("Location: index.php?page=" . urlencode($returnPage) . "&err=" . urlencode("Compilare tutti i campi obbligatori dell'anno sportivo."));
        exit;
    }

    try {
        if ($attivo) {
            $db->exec("UPDATE anno SET attivo = 0");
        }

        if ($id) {
            $stmt = $db->prepare("UPDATE anno SET anno = ?, data_inizio = ?, data_fine = ?, attivo = ? WHERE id = ?");
            $stmt->execute([$anno, $dataInizio, $dataFine, $attivo, $id]);
            $msg = "Stagione sportiva {$anno} aggiornata con successo.";
        } else {
            $stmt = $db->prepare("INSERT INTO anno (anno, data_inizio, data_fine, attivo) VALUES (?, ?, ?, ?)");
            $stmt->execute([$anno, $dataInizio, $dataFine, $attivo]);
            $msg = "Nuova stagione sportiva {$anno} creata con successo!";
        }

        header("Location: index.php?page=" . urlencode($returnPage) . "&msg=" . urlencode($msg));
        exit;
    } catch (Exception $e) {
        header("Location: index.php?page=" . urlencode($returnPage) . "&err=" . urlencode("Errore salvataggio anno sportivo: " . $e->getMessage()));
        exit;
    }
}

header("Location: index.php?page=" . urlencode($returnPage));
exit;
