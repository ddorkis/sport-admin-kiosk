<?php
/**
 * Generazione automatica quote mensili per atleta iscritto a un gruppo
 * Posizione: /private/actions/genera_quote.php
 *
 * Formula: Per ciascun mese compreso tra data_inizio e data_fine del gruppo:
 *  - Calcola giorno scadenza (es. giorno 10 del mese)
 *  - Genera causale (es. "Quota 2024-10 - Basket Under 14")
 *  - Inserisce la quota con stato 'da_pagare' se non già presente per quel mese
 */

if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';

function generaQuoteAutomatiche($tesseratoId, $gruppoId) {
    $db = getDbConnection();

    // 1. Recupero dati gruppo
    $stmtG = $db->prepare("SELECT * FROM gruppi WHERE id = ?");
    $stmtG->execute([$gruppoId]);
    $gruppo = $stmtG->fetch();

    if (!$gruppo) {
        return ['success' => false, 'message' => 'Gruppo non trovato', 'quote_generate' => 0];
    }

    $dataInizio = new DateTime($gruppo['data_inizio']);
    $dataFine   = new DateTime($gruppo['data_fine']);
    $giornoScadenza = (int)$gruppo['giorno_scadenza_mensile'];
    $quotaMensile   = (float)$gruppo['quota_mensile'];

    $mesiGenerati = 0;
    $current = clone $dataInizio;
    $current->modify('first day of this month');

    $end = clone $dataFine;
    $end->modify('first day of next month');

    $stmtCheck = $db->prepare("SELECT id FROM quote WHERE tesserato_id = ? AND (gruppo_id = ? OR gruppo_id IS NULL) AND mese_riferimento = ?");
    $stmtInsert = $db->prepare("INSERT INTO quote (tesserato_id, gruppo_id, causale, importo, importo_pagato, data_scadenza, stato, mese_riferimento) VALUES (?, ?, ?, ?, 0.00, ?, 'da_pagare', ?)");

    while ($current < $end) {
        $meseRif = $current->format('Y-m'); // es. 2024-09

        // Controlla se la quota per questo mese esiste già
        $stmtCheck->execute([$tesseratoId, $gruppoId, $meseRif]);
        if (!$stmtCheck->fetch()) {
            // Calcola data scadenza con giorno specifico del mese
            $giornoEffettivo = min($giornoScadenza, (int)$current->format('t'));
            $dataScadenza = $current->format('Y-m-') . sprintf('%02d', $giornoEffettivo);
            $causale = "Quota " . $meseRif . " - " . $gruppo['nome_gruppo'];

            $stmtInsert->execute([
                $tesseratoId,
                $gruppoId,
                $causale,
                $quotaMensile,
                $dataScadenza,
                $meseRif
            ]);
            $mesiGenerati++;
        }

        $current->modify('+1 month');
    }

    return ['success' => true, 'quote_generate' => $mesiGenerati];
}

// Se invocato direttamente come azione HTTP (GET o POST)
if (isset($_GET['action']) && $_GET['action'] === 'genera_quote') {
    requireAuth();
    $db = getDbConnection();

    $gruppoId = !empty($_REQUEST['gruppo_id']) ? (int)$_REQUEST['gruppo_id'] : 0;
    $tesseratoId = !empty($_REQUEST['tesserato_id']) ? (int)$_REQUEST['tesserato_id'] : 0;
    $redirectPage = !empty($_REQUEST['redirect']) ? trim($_REQUEST['redirect']) : 'gruppi';

    $totaleQuote = 0;

    if ($tesseratoId > 0 && $gruppoId > 0) {
        $res = generaQuoteAutomatiche($tesseratoId, $gruppoId);
        $totaleQuote += $res['quote_generate'];
    } elseif ($gruppoId > 0) {
        // Genera per tutti gli iscritti al gruppo
        $iscritti = $db->prepare("SELECT tesserato_id FROM gruppi_tesserati WHERE gruppo_id = ?");
        $iscritti->execute([$gruppoId]);
        foreach ($iscritti->fetchAll() as $row) {
            $res = generaQuoteAutomatiche($row['tesserato_id'], $gruppoId);
            $totaleQuote += $res['quote_generate'];
        }
    } else {
        // Genera per tutti i gruppi
        $tuttiGruppi = $db->query("SELECT gt.tesserato_id, gt.gruppo_id FROM gruppi_tesserati gt INNER JOIN gruppi g ON gt.gruppo_id = g.id")->fetchAll();
        foreach ($tuttiGruppi as $row) {
            $res = generaQuoteAutomatiche($row['tesserato_id'], $row['gruppo_id']);
            $totaleQuote += $res['quote_generate'];
        }
    }

    $msg = $totaleQuote > 0 
        ? "Generate con successo {$totaleQuote} quote mensili automatiche."
        : "Tutte le quote mensili per il periodo risultano già generate e sincronizzate.";

    header("Location: index.php?page={$redirectPage}&msg=" . urlencode($msg));
    exit;
}
