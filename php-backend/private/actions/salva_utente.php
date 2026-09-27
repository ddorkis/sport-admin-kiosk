<?php
/**
 * Azione: Creazione / Modifica Utente
 * Posizione: /private/actions/salva_utente.php
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

    $username = trim($_POST['username'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $ruolo = trim($_POST['ruolo'] ?? 'operatore');
    $isKiosk = !empty($_POST['is_kiosk']) ? 1 : 0;
    $attivo = isset($_POST['attivo']) ? (int)$_POST['attivo'] : 1;

    if (empty($username) || empty($nome)) {
        header('Location: index.php?page=utenti&err=' . urlencode('Compilare username e nome completo.'));
        exit;
    }

    $passHash = !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : password_hash('password', PASSWORD_DEFAULT);

    try {
        $stmt = $db->prepare("
            INSERT INTO utenti (username, password_hash, nome, ruolo, is_kiosk, attivo)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$username, $passHash, $nome, $ruolo, $isKiosk, $attivo]);

        header('Location: index.php?page=utenti&msg=' . urlencode("Utente '{$username}' creato con successo."));
        exit;
    } catch (Exception $e) {
        header('Location: index.php?page=utente_nuovo&err=' . urlencode('Errore salvataggio utente: ' . $e->getMessage()));
        exit;
    }
}
