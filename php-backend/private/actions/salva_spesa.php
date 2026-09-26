<?php
/**
 * Salvataggio Spesa Previsionale (Budget Spese)
 * Posizione: /private/actions/salva_spesa.php
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

    $id = !empty($_POST['id']) ? (int)$_POST['id'] : null;
    $annoId = !empty($_POST['anno_id']) ? (int)$_POST['anno_id'] : 1;
    $titolo = trim($_POST['titolo'] ?? '');
    $categoria = trim($_POST['categoria'] ?? 'Altro');
    $importoMensile = (float)str_replace(',', '.', $_POST['importo_mensile'] ?? '0');
    $ricorrente = !empty($_POST['ricorrente']) ? 1 : 0;
    $mesiArray = isset($_POST['mesi']) && is_array($_POST['mesi']) ? array_values($_POST['mesi']) : [];
    $mesiJson = (!$ricorrente && !empty($mesiArray)) ? json_encode($mesiArray) : null;
    $note = trim($_POST['note'] ?? '');

    if (empty($titolo) || $importoMensile <= 0) {
        header('Location: index.php?page=previsioni&err=' . urlencode('Specificare un titolo valido e un importo mensile superiore a 0.'));
        exit;
    }

    try {
        if ($id) {
            $stmt = $db->prepare("
                UPDATE spese_previsionali
                SET anno_id = ?, titolo = ?, categoria = ?, importo_mensile = ?, ricorrente = ?, mesi_json = ?, note = ?
                WHERE id = ?
            ");
            $stmt->execute([$annoId, $titolo, $categoria, $importoMensile, $ricorrente, $mesiJson, $note, $id]);
            $msg = "Spesa previsionale '{$titolo}' aggiornata con successo.";
        } else {
            $stmt = $db->prepare("
                INSERT INTO spese_previsionali (anno_id, titolo, categoria, importo_mensile, ricorrente, mesi_json, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$annoId, $titolo, $categoria, $importoMensile, $ricorrente, $mesiJson, $note]);
            $msg = "Spesa previsionale '{$titolo}' inserita a budget con successo.";
        }

        header('Location: index.php?page=previsioni&msg=' . urlencode($msg));
        exit;
    } catch (Exception $e) {
        header('Location: index.php?page=previsioni&err=' . urlencode('Errore salvataggio spesa: ' . $e->getMessage()));
        exit;
    }
}
