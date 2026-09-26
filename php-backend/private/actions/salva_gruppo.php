<?php
/**
 * Salvataggio / Modifica Gruppo Corso Sportivo
 * Posizione: /private/actions/salva_gruppo.php
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
    $nomeGruppo = trim($_POST['nome_gruppo'] ?? '');
    $categoria = trim($_POST['categoria'] ?? '');
    $quotaMensile = (float)str_replace(',', '.', $_POST['quota_mensile'] ?? '0');
    $giornoScadenza = (int)($_POST['giorno_scadenza_mensile'] ?? 10);
    $dataInizio = $_POST['data_inizio'] ?? '';
    $dataFine = $_POST['data_fine'] ?? '';
    $istruttore = trim($_POST['istruttore'] ?? '');
    $descrizione = trim($_POST['descrizione'] ?? '');

    if (empty($nomeGruppo) || empty($dataInizio) || empty($dataFine)) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Compilare tutti i campi obbligatori (Nome Gruppo, Data Inizio, Data Fine).'));
        exit;
    }

    if ($giornoScadenza < 1 || $giornoScadenza > 31) {
        $giornoScadenza = 10;
    }

    try {
        if ($id) {
            $stmt = $db->prepare("
                UPDATE gruppi
                SET anno_id = ?, nome_gruppo = ?, categoria = ?, quota_mensile = ?,
                    giorno_scadenza_mensile = ?, data_inizio = ?, data_fine = ?,
                    istruttore = ?, descrizione = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $annoId, $nomeGruppo, $categoria, $quotaMensile,
                $giornoScadenza, $dataInizio, $dataFine,
                $istruttore, $descrizione, $id
            ]);
            $msg = "Gruppo '{$nomeGruppo}' aggiornato con successo.";
        } else {
            $stmt = $db->prepare("
                INSERT INTO gruppi (anno_id, nome_gruppo, categoria, quota_mensile, giorno_scadenza_mensile, data_inizio, data_fine, istruttore, descrizione)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $annoId, $nomeGruppo, $categoria, $quotaMensile,
                $giornoScadenza, $dataInizio, $dataFine,
                $istruttore, $descrizione
            ]);
            $msg = "Nuovo gruppo '{$nomeGruppo}' creato con successo.";
        }

        header('Location: index.php?page=gruppi&msg=' . urlencode($msg));
        exit;
    } catch (Exception $e) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Errore nel salvataggio gruppo: ' . $e->getMessage()));
        exit;
    }
}
