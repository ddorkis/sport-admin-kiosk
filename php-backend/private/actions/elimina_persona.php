<?php
/**
 * Gestione Privacy, Archiviazione, Anonimizzazione GDPR ed Eliminazione Persona
 * Posizione: /private/actions/elimina_persona.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

$id = isset($_REQUEST['id']) ? (int)$_REQUEST['id'] : 0;
$actionMode = $_REQUEST['action_mode'] ?? 'archivia';

if ($id <= 0) {
    header('Location: index.php?page=persone&err=' . urlencode('Identificativo persona non valido.'));
    exit;
}

$db = getDbConnection();

try {
    // Verifica esistenza anagrafica
    $stmtP = $db->prepare("SELECT * FROM persone WHERE id = ?");
    $stmtP->execute([$id]);
    $persona = $stmtP->fetch();

    if (!$persona) {
        header('Location: index.php?page=persone&err=' . urlencode('Anagrafica non trovata.'));
        exit;
    }

    if ($actionMode === 'archivia') {
        // Soft delete: nasconde la persona senza toccare dati o contabilità
        $stmt = $db->prepare("UPDATE persone SET attivo = 0 WHERE id = ?");
        $stmt->execute([$id]);
        header('Location: index.php?page=persone&msg=' . urlencode('Anagrafica archiviata con successo (nascosta dalle liste ordinarie).'));
        exit;
    }

    if ($actionMode === 'ripristina') {
        // Ripristina l'anagrafica tra i soci attivi
        $stmt = $db->prepare("UPDATE persone SET attivo = 1 WHERE id = ?");
        $stmt->execute([$id]);
        header('Location: index.php?page=persone&msg=' . urlencode('Anagrafica ripristinata tra i soci attivi!'));
        exit;
    }

    if ($actionMode === 'anonimizza_gdpr') {
        // Diritto all'Oblio (Art. 17 GDPR) con conservazione decennale ricevute contabili (Art. 2220 C.C.)
        $cfAnonimo = 'ANON' . str_pad($id, 12, '0', STR_PAD_LEFT);
        $notaGdpr = "Dati personali e del tutore cancellati ex Art. 17 GDPR (Diritto all'Oblio). Estremi contabili conservati ai sensi dell'art. 2220 C.C. in data " . date('d/m/Y H:i');

        $stmt = $db->prepare("
            UPDATE persone SET
                nome = 'ANONIMO',
                cognome = ?,
                codice_fiscale = ?,
                luogo_nascita = NULL,
                indirizzo = NULL,
                citta = NULL,
                telefono = NULL,
                email = NULL,
                is_minorenne = 0,
                tutore_nome = NULL,
                tutore_cognome = NULL,
                tutore_cf = NULL,
                tutore_telefono = NULL,
                tutore_email = NULL,
                tutore_relazione = NULL,
                note = ?,
                attivo = 0,
                anonimizzato_gdpr = 1,
                data_anonimizzazione = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            "GDPR #{$id}",
            $cfAnonimo,
            $notaGdpr,
            $id
        ]);

        header('Location: index.php?page=persone&msg=' . urlencode("Dati personali e tutore anonimizzati a norma di legge (Art. 17 GDPR). Ricevute contabili mantenute a fini fiscali decennali."));
        exit;
    }

    if ($actionMode === 'elimina_definitivo') {
        // Verifica se ci sono ricevute fiscali / pagamenti registrati
        $stmtCheck = $db->prepare("
            SELECT COUNT(*) FROM pagamenti p
            INNER JOIN tesserati t ON p.tesserato_id = t.id
            WHERE t.persona_id = ?
        ");
        $stmtCheck->execute([$id]);
        $hasPagamenti = ((int)$stmtCheck->fetchColumn() > 0);

        if ($hasPagamenti) {
            header('Location: index.php?page=persone&err=' . urlencode("Impossibile eliminare definitivamente: risultano pagamenti e ricevute contabili che la legge (art. 2220 C.C. e DPR 600/73) obbliga a conservare per 10 anni. Per cancellare i dati personali nel rispetto del GDPR usa l'Anonimizzazione."));
            exit;
        }

        // Se non ci sono pagamenti, elimina fisicamente la persona (con eliminazione a cascata tesserati e quote)
        $stmtDel = $db->prepare("DELETE FROM persone WHERE id = ?");
        $stmtDel->execute([$id]);

        header('Location: index.php?page=persone&msg=' . urlencode('Anagrafica eliminata definitivamente dal database.'));
        exit;
    }

    header('Location: index.php?page=persone');
    exit;

} catch (Exception $e) {
    header('Location: index.php?page=persone&err=' . urlencode('Errore operazione privacy: ' . $e->getMessage()));
    exit;
}
