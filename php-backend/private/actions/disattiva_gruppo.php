<?php
/**
 * Disattivazione Gruppo / Corso Sportivo e Sgravio Quote Future
 * Posizione: /private/actions/disattiva_gruppo.php
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
    $dataInterruzione = $_POST['data_interruzione'] ?? date('Y-m-d');
    $annullaQuoteFuture = !empty($_POST['annulla_quote_future']);
    $motivo = trim($_POST['motivo'] ?? 'Rimodulazione corso / variazione importo');
    $creaNuovo = !empty($_POST['crea_nuovo']);

    if (!$gruppoId) {
        header('Location: index.php?page=gruppi&err=' . urlencode('Gruppo non specificato.'));
        exit;
    }

    try {
        $db->beginTransaction();

        // 1. Recupera nome gruppo
        $stmtG = $db->prepare("SELECT nome_gruppo FROM gruppi WHERE id = ?");
        $stmtG->execute([$gruppoId]);
        $grp = $stmtG->fetch();
        $nomeGruppo = $grp ? $grp['nome_gruppo'] : "ID #$gruppoId";

        // 2. Disattiva gruppo
        $stmtDis = $db->prepare("UPDATE gruppi SET attivo = 0 WHERE id = ?");
        $stmtDis->execute([$gruppoId]);

        // 3. Annulla quote future non saldate se richiesto
        $countAnnullate = 0;
        if ($annullaQuoteFuture) {
            $notaAnnullamento = "Annullata per disattivazione corso dal " . date('d/m/Y', strtotime($dataInterruzione)) . " ($motivo)";
            $stmtQuote = $db->prepare("
                UPDATE quote
                SET stato = 'annullata',
                    note = ?
                WHERE gruppo_id = ?
                  AND stato != 'pagata'
                  AND stato != 'annullata'
                  AND data_scadenza >= ?
            ");
            $stmtQuote->execute([$notaAnnullamento, $gruppoId, $dataInterruzione]);
            $countAnnullate = $stmtQuote->rowCount();
        }

        $db->commit();

        $msg = "Corso '{$nomeGruppo}' disattivato con successo.";
        if ($countAnnullate > 0) {
            $msg .= " Sgravate {$countAnnullate} quote future non saldate.";
        }

        if ($creaNuovo) {
            header('Location: index.php?page=gruppo_nuovo&msg=' . urlencode($msg . ' Puoi ora definire il nuovo gruppo con il nuovo importo.'));
        } else {
            header('Location: index.php?page=gruppi&msg=' . urlencode($msg));
        }
        exit;

    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        header('Location: index.php?page=gruppi&err=' . urlencode('Errore durante la disattivazione del corso: ' . $e->getMessage()));
        exit;
    }
} else {
    header('Location: index.php?page=gruppi');
    exit;
}
