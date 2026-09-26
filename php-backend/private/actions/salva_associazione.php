<?php
/**
 * Salvataggio Dati Associazione Sportiva & Enti Affiliati
 * Posizione: /private/actions/salva_associazione.php
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

    $denominazione = trim($_POST['denominazione'] ?? '');
    $cf = strtoupper(trim($_POST['codice_fiscale'] ?? ''));
    $piva = trim($_POST['partita_iva'] ?? '');
    $indirizzo = trim($_POST['indirizzo'] ?? '');
    $cap = trim($_POST['cap'] ?? '');
    $comune = trim($_POST['comune'] ?? '');
    $provincia = strtoupper(trim($_POST['provincia'] ?? ''));
    $legaleRappresentante = trim($_POST['legale_rappresentante'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $pec = trim($_POST['pec'] ?? '');
    $codiceAffiliazione = trim($_POST['codice_affiliazione'] ?? '');
    $iban = strtoupper(trim($_POST['iban'] ?? ''));

    if (empty($denominazione) || empty($cf) || empty($legaleRappresentante)) {
        header('Location: index.php?page=associazione&err=' . urlencode('Denominazione, Codice Fiscale e Legale Rappresentante sono obbligatori.'));
        exit;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO associazione (id, denominazione, codice_fiscale, partita_iva, indirizzo, cap, comune, provincia, legale_rappresentante, telefono, email, pec, codice_affiliazione, iban)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                denominazione = VALUES(denominazione),
                codice_fiscale = VALUES(codice_fiscale),
                partita_iva = VALUES(partita_iva),
                indirizzo = VALUES(indirizzo),
                cap = VALUES(cap),
                comune = VALUES(comune),
                provincia = VALUES(provincia),
                legale_rappresentante = VALUES(legale_rappresentante),
                telefono = VALUES(telefono),
                email = VALUES(email),
                pec = VALUES(pec),
                codice_affiliazione = VALUES(codice_affiliazione),
                iban = VALUES(iban)
        ");
        $stmt->execute([
            $denominazione, $cf, $piva, $indirizzo, $cap, $comune, $provincia,
            $legaleRappresentante, $telefono, $email, $pec, $codiceAffiliazione, $iban
        ]);

        header('Location: index.php?page=associazione&msg=' . urlencode('Dati associazione sportiva aggiornati con successo.'));
        exit;
    } catch (Exception $e) {
        header('Location: index.php?page=associazione&err=' . urlencode('Errore salvataggio dati associazione: ' . $e->getMessage()));
        exit;
    }
}
