<?php
/**
 * Front Controller Pubblico
 * Posizione: /public/index.php
 *
 * Riceve tutte le richieste HTTP e include in modo sicuro le pagine e le azioni
 * dalla cartella protetta parametrizzata PATH_PRIVATE.
 */
session_start();

// 1. Carica override locale dei percorsi se presente
if (file_exists(__DIR__ . '/paths.local.php')) {
    require_once __DIR__ . '/paths.local.php';
}

// 2. Determina PATH_CONFIG e carica la configurazione dei percorsi
if (!defined('PATH_CONFIG')) {
    $envCfg = getenv('APP_CONFIG_PATH') ?: ($_ENV['APP_CONFIG_PATH'] ?? ($_SERVER['APP_CONFIG_PATH'] ?? null));
    define('PATH_CONFIG', $envCfg ? rtrim($envCfg, '/\\') : dirname(__DIR__) . '/config');
}

if (file_exists(PATH_CONFIG . '/paths.php')) {
    require_once PATH_CONFIG . '/paths.php';
}

// 3. Fallback per le costanti se paths.php non fosse presente
if (!defined('PATH_PRIVATE')) {
    define('PATH_PRIVATE', dirname(__DIR__) . '/private');
}
if (!defined('PATH_INCLUDES')) {
    define('PATH_INCLUDES', PATH_PRIVATE . '/includes');
}
if (!defined('PATH_PAGES')) {
    define('PATH_PAGES', PATH_PRIVATE . '/pages');
}
if (!defined('PATH_ACTIONS')) {
    define('PATH_ACTIONS', PATH_PRIVATE . '/actions');
}
if (!defined('PATH_ASSETS')) {
    define('PATH_ASSETS', __DIR__ . '/assets');
}

// 4. Carica configurazione Database e funzioni di autenticazione
require_once PATH_CONFIG . '/database.php';
require_once PATH_INCLUDES . '/auth.php';

// 5. Parametri della richiesta
$page = isset($_GET['page']) ? trim($_GET['page']) : 'home';
$action = isset($_GET['action']) ? trim($_GET['action']) : null;

// 6. Gestione Azioni (POST / API)
if ($action) {
    $actionPath = PATH_ACTIONS . '/' . basename($action) . '.php';
    if (file_exists($actionPath)) {
        require $actionPath;
        exit;
    }
}

// 7. Verifica Autenticazione Utente
$user = getCurrentUser();

if (!$user) {
    // Utente non autenticato -> Mostra login
    require PATH_PAGES . '/login.php';
    exit;
}

// 8. Controllo Flag KIOSK: se l'utente ha la modalità kiosk attiva e non ha forzato una pagina autorizzata
if (!empty($user['is_kiosk']) && $page !== 'kiosk' && $page !== 'logout') {
    header('Location: index.php?page=kiosk');
    exit;
}

// 9. Routing sicuro con whitelist per impedire Local File Inclusion (LFI)
$allowedPages = [
    'home'           => 'gestionale.php',
    'gestionale'     => 'gestionale.php',
    'kiosk'          => 'kiosk.php',
    'persone'        => 'persone.php',
    'persona_nuova'  => 'persona_nuova.php',
    'nuova_persona'  => 'persona_nuova.php',
    'tesserati'      => 'tesserati.php',
    'gruppi'         => 'gruppi.php',
    'quote'          => 'quote.php',
    'quote_scadute'  => 'quote_scadute.php',
    'previsioni'     => 'previsioni.php',
    'pagamenti'      => 'pagamenti.php',
    'anni'           => 'anni.php',
    'utenti'         => 'utenti.php',
    'associazione'   => 'associazione.php',
    'logout'         => 'logout.php'
];

$fileToLoad = $allowedPages[$page] ?? '404.php';
$targetPath = PATH_PAGES . '/' . $fileToLoad;

if (!file_exists($targetPath)) {
    http_response_code(404);
    echo "<h1>404 - Pagina non trovata</h1>";
    exit;
}

// 10. Inclusione sicura della pagina privata
require $targetPath;
