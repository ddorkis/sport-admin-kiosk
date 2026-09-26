<?php
/**
 * Iscrizione Atleta a Gruppo e Generazione Automatica Quote
 * Posizione: /private/actions/iscrivi_gruppo.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
require_once (defined('PATH_ACTIONS') ? PATH_ACTIONS : __DIR__) . '/genera_quote.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db = getDbConnection();

    $gruppoId = (int)($_POST['gruppo_id'] ?? 0);
    $tesseratoId = (int)($_POST['tesserato_id'] ?? 0);
    $dataIscrizione = !empty($_POST['data_iscrizione']) ? trim($_POST['data_iscrizione']) : date('Y-m-d');
    $note = trim($_POST['note'] ?? '');
    $generaQuote = !empty($_POST['genera_quote']);

    if ($gruppoId <= 0 || $tesseratoId <= 0) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Selezionare obbligatoriamente sia il gruppo che l\'atleta tesserato.'));
        exit;
    }

    try {
        // Controlla se già iscritto
        $stmtCheck = $db->prepare("SELECT id FROM gruppi_tesserati WHERE gruppo_id = ? AND tesserato_id = ?");
        $stmtCheck->execute([$gruppoId, $tesseratoId]);
        if ($stmtCheck->fetch()) {
            header('Location: index.php?page=gruppi&err=' . urlencode('L\'atleta selezionato risulta già iscritto a questo gruppo.'));
            exit;
        }

        // Inserisci iscrizione
        $stmt = $db->prepare("INSERT INTO gruppi_tesserati (gruppo_id, tesserato_id, data_iscrizione, note) VALUES (?, ?, ?, ?)");
        $stmt->execute([$gruppoId, $tesseratoId, $dataIscrizione, $note]);

        $quoteMsg = "";
        if ($generaQuote) {
            $quoteRes = generaQuoteAutomatiche($tesseratoId, $gruppoId);
            $num = $quoteRes['quote_generate'];
            $quoteMsg = " Generate in automatico {$num} rate mensili per l'atleta.";
        }

        header('Location: index.php?page=gruppi&msg=' . urlencode("Atleta iscritto al corso con successo.{$quoteMsg}"));
        exit;
    } catch (Exception $e) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Errore iscrizione: ' . $e->getMessage()));
        exit;
    }
}
