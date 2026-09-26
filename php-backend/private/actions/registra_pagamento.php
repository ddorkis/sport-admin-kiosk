<?php
/**
 * Registrazione Pagamento (Quota o Extra)
 * Posizione: /private/actions/registra_pagamento.php
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
    
    $tesseratoId   = (int)($_POST['tesserato_id'] ?? 0);
    $quotaId       = !empty($_POST['quota_id']) ? (int)$_POST['quota_id'] : null;
    $importo       = (float)($_POST['importo'] ?? 0);
    $metodo        = $_POST['metodo_pagamento'] ?? 'contanti';
    $causale       = trim($_POST['causale'] ?? '');
    $note          = trim($_POST['note'] ?? '');
    $ricevutaNum   = 'RIC-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

    if ($tesseratoId <= 0 || $importo <= 0) {
        die("Dati non validi");
    }

    $db->beginTransaction();
    try {
        // Inserisce Pagamento
        $stmtP = $db->prepare("INSERT INTO pagamenti (tesserato_id, quota_id, importo, data_pagamento, metodo_pagamento, causale, ricevuta_numero, note) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)");
        $stmtP->execute([$tesseratoId, $quotaId, $importo, $metodo, $causale, $ricevutaNum, $note]);

        // Se collegato a una quota, aggiorna importo_pagato e stato
        if ($quotaId !== null) {
            $stmtQ = $db->prepare("SELECT importo, importo_pagato FROM quote WHERE id = ? FOR UPDATE");
            $stmtQ->execute([$quotaId]);
            $quota = $stmtQ->fetch();

            if ($quota) {
                $nuovoPagato = (float)$quota['importo_pagato'] + $importo;
                $nuovoStato = ($nuovoPagato >= (float)$quota['importo']) ? 'pagata' : 'parziale';

                $stmtUpdate = $db->prepare("UPDATE quote SET importo_pagato = ?, stato = ? WHERE id = ?");
                $stmtUpdate->execute([$nuovoPagato, $nuovoStato, $quotaId]);
            }
        }

        $db->commit();
        header('Location: index.php?page=pagamenti&msg=success');
        exit;
    } catch (Exception $e) {
        $db->rollBack();
        die("Errore salvataggio: " . $e->getMessage());
    }
}
