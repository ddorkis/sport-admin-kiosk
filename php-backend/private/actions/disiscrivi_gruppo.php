<?php
/**
 * Disiscrizione Atleta da Gruppo
 * Posizione: /private/actions/disiscrivi_gruppo.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$gruppoId = (int)($_REQUEST['gruppo_id'] ?? 0);
$tesseratoId = (int)($_REQUEST['tesserato_id'] ?? 0);
$annullaQuoteFuture = !empty($_REQUEST['annulla_quote_future']);

if ($gruppoId <= 0 || $tesseratoId <= 0) {
    header('Location: index.php?page=gruppi&err=' . urlencode('Parametri di disiscrizione non validi.'));
    exit;
}

$db = getDbConnection();

try {
    $db->beginTransaction();

    // Rimuovi iscrizione dal gruppo
    $stmt = $db->prepare("DELETE FROM gruppi_tesserati WHERE gruppo_id = ? AND tesserato_id = ?");
    $stmt->execute([$gruppoId, $tesseratoId]);

    $quoteAnnullate = 0;
    if ($annullaQuoteFuture) {
        // Annulla le quote non pagate future per questo gruppo
        $today = date('Y-m-d');
        $stmtQ = $db->prepare("
            UPDATE quote
            SET stato = 'annullata', causale = CONCAT(causale, ' [ANNULLATA PER DISISCRIZIONE]')
            WHERE tesserato_id = ? AND gruppo_id = ? AND stato = 'da_pagare' AND data_scadenza >= ?
        ");
        $stmtQ->execute([$tesseratoId, $gruppoId, $today]);
        $quoteAnnullate = $stmtQ->rowCount();
    }

    $db->commit();

    $annullaMsg = $quoteAnnullate > 0 ? " e annullate {$quoteAnnullate} quote future non saldate." : ".";
    header('Location: index.php?page=gruppi&msg=' . urlencode("Atleta disiscritto dal corso{$annullaMsg}"));
    exit;
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    header('Location: index.php?page=gruppi&err=' . urlencode('Errore disiscrizione: ' . $e->getMessage()));
    exit;
}
