<?php
/**
 * Generazione automatica quote mensili per atleta iscritto a un gruppo
 * Posizione: /private/actions/genera_quote.php
 *
 * Formula: Per ciascun mese compreso tra data_inizio e data_fine del gruppo:
 *  - Calcola giorno scadenza (es. giorno 10 del mese)
 *  - Genera causale (es. "Quota Ottobre 2024 - Under 14")
 *  - Inserisce la quota con stato 'da_pagare'
 */

function generaQuoteAutomatiche($tesseratoId, $gruppoId) {
    $db = getDbConnection();

    // 1. Recupero dati gruppo
    $stmtG = $db->prepare("SELECT * FROM gruppi WHERE id = ?");
    $stmtG->execute([$gruppoId]);
    $gruppo = $stmtG->fetch();

    if (!$gruppo) {
        return ['success' => false, 'message' => 'Gruppo non trovato'];
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

    $stmtCheck = $db->prepare("SELECT id FROM quote WHERE tesserato_id = ? AND gruppo_id = ? AND mese_riferimento = ?");
    $stmtInsert = $db->prepare("INSERT INTO quote (tesserato_id, gruppo_id, causale, importo, importo_pagato, data_scadenza, stato, mese_riferimento) VALUES (?, ?, ?, ?, 0.00, ?, 'da_pagare', ?)");

    while ($current < $end) {
        $meseRif = $current->format('Y-m'); // es. 2024-09
        $nomeMese = $current->format('F Y'); // In italiano si può mappare

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
