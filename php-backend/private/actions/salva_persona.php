<?php
/**
 * Salvataggio Persona e Tutore Minorenni (Creazione e Modifica)
 * Posizione: /private/actions/salva_persona.php
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

    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $nome = trim($_POST['nome'] ?? '');
    $cognome = trim($_POST['cognome'] ?? '');
    $cf = strtoupper(trim($_POST['codice_fiscale'] ?? ''));
    $dataNascita = $_POST['data_nascita'] ?? '';
    $luogoNascita = trim($_POST['luogo_nascita'] ?? '');
    $indirizzo = trim($_POST['indirizzo'] ?? '');
    $citta = trim($_POST['citta'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $isMinorenne = !empty($_POST['is_minorenne']) ? 1 : 0;
    $note = trim($_POST['note'] ?? '');

    $tutoreNome = $isMinorenne ? trim($_POST['tutore_nome'] ?? '') : null;
    $tutoreCognome = $isMinorenne ? trim($_POST['tutore_cognome'] ?? '') : null;
    $tutoreCf = $isMinorenne ? strtoupper(trim($_POST['tutore_cf'] ?? '')) : null;
    $tutoreTelefono = $isMinorenne ? trim($_POST['tutore_telefono'] ?? '') : null;
    $tutoreEmail = $isMinorenne ? trim($_POST['tutore_email'] ?? '') : null;
    $tutoreRelazione = $isMinorenne ? trim($_POST['tutore_relazione'] ?? 'Genitore') : null;

    $actionType = $_POST['action_type'] ?? 'save';

    if (empty($nome) || empty($cognome) || empty($cf) || empty($dataNascita)) {
        die("Compilare tutti i campi obbligatori (Nome, Cognome, CF, Data Nascita).");
    }

    try {
        if ($id > 0) {
            // Modifica anagrafica esistente
            $stmt = $db->prepare("
                UPDATE persone SET
                    nome = ?, cognome = ?, codice_fiscale = ?, data_nascita = ?,
                    luogo_nascita = ?, indirizzo = ?, citta = ?, telefono = ?, email = ?,
                    is_minorenne = ?, tutore_nome = ?, tutore_cognome = ?, tutore_cf = ?,
                    tutore_telefono = ?, tutore_email = ?, tutore_relazione = ?, note = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $nome, $cognome, $cf, $dataNascita,
                $luogoNascita, $indirizzo, $citta, $telefono, $email,
                $isMinorenne, $tutoreNome, $tutoreCognome, $tutoreCf,
                $tutoreTelefono, $tutoreEmail, $tutoreRelazione, $note,
                $id
            ]);
            $targetId = $id;
            $msg = 'modificato';
        } else {
            // Creazione nuova anagrafica
            $stmt = $db->prepare("
                INSERT INTO persone (
                    nome, cognome, codice_fiscale, data_nascita,
                    luogo_nascita, indirizzo, citta, telefono, email,
                    is_minorenne, tutore_nome, tutore_cognome, tutore_cf,
                    tutore_telefono, tutore_email, tutore_relazione, note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $nome, $cognome, $cf, $dataNascita,
                $luogoNascita, $indirizzo, $citta, $telefono, $email,
                $isMinorenne, $tutoreNome, $tutoreCognome, $tutoreCf,
                $tutoreTelefono, $tutoreEmail, $tutoreRelazione, $note
            ]);
            $targetId = (int)$db->lastInsertId();
            $msg = 'creato';
        }

        if ($actionType === 'save_and_tessera') {
            header("Location: index.php?page=tesserati&nuovo_tess=1&persona_id=" . $targetId . "&msg=" . $msg);
        } else {
            header("Location: index.php?page=persone&msg=" . $msg);
        }
        exit;
    } catch (Exception $e) {
        die("Errore salvataggio anagrafica: " . $e->getMessage());
    }
}
