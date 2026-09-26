<?php
/**
 * ==============================================================================
 * CONFIGURAZIONE PARAMETRICA DEI PERCORSI DEL FILESYSTEM (PATHS CONFIG)
 * Posizione predefinita: /config/paths.php
 * ==============================================================================
 *
 * Centralizza la definizione di tutti i percorsi dell'applicazione per permettere
 * di organizzare liberamente il filesystem (es. isolare 'private' e 'config'
 * fuori dalla DocumentRoot del webserver Apache / Nginx o in cartelle dedicate).
 *
 * PRIORITÀ DI CONFIGURAZIONE:
 * 1. Variabili d'ambiente di sistema (SetEnv Apache, fastcgi_param Nginx, Docker, .env)
 *    - APP_ROOT_PATH
 *    - APP_CONFIG_PATH
 *    - APP_PRIVATE_PATH
 *    - APP_PUBLIC_PATH
 * 2. File opzionale 'public/paths.local.php' caricato prima di index.php
 * 3. Valori predefiniti relativi alla struttura standard del progetto
 */

function getEnvParam($key, $default = null) {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    return $default;
}

// 1. Root del Progetto (cartella genitore contenente public, private, config)
if (!defined('PATH_ROOT')) {
    $envRoot = getEnvParam('APP_ROOT_PATH');
    define('PATH_ROOT', $envRoot ? rtrim($envRoot, '/\\') : dirname(__DIR__));
}

// 2. Percorso Cartella Config (parametri database, percorsi, sicurezza)
if (!defined('PATH_CONFIG')) {
    $envConfig = getEnvParam('APP_CONFIG_PATH');
    define('PATH_CONFIG', $envConfig ? rtrim($envConfig, '/\\') : (PATH_ROOT . '/config'));
}

// 3. Percorso Cartella Private (protetta, non accessibile direttamente via browser)
if (!defined('PATH_PRIVATE')) {
    $envPrivate = getEnvParam('APP_PRIVATE_PATH');
    define('PATH_PRIVATE', $envPrivate ? rtrim($envPrivate, '/\\') : (PATH_ROOT . '/private'));
}

// 4. Sottocartelle modulari interne alla cartella Private
if (!defined('PATH_INCLUDES')) {
    define('PATH_INCLUDES', PATH_PRIVATE . '/includes');
}
if (!defined('PATH_PAGES')) {
    define('PATH_PAGES', PATH_PRIVATE . '/pages');
}
if (!defined('PATH_ACTIONS')) {
    define('PATH_ACTIONS', PATH_PRIVATE . '/actions');
}

// 5. Percorso Cartella Public (DocumentRoot del webserver)
if (!defined('PATH_PUBLIC')) {
    $envPublic = getEnvParam('APP_PUBLIC_PATH');
    define('PATH_PUBLIC', $envPublic ? rtrim($envPublic, '/\\') : (PATH_ROOT . '/public'));
}

// 6. Percorso Cartella Assets Pubblici (CSS, JS, Fonts locali offline)
if (!defined('PATH_ASSETS')) {
    $envAssets = getEnvParam('APP_ASSETS_PATH');
    define('PATH_ASSETS', $envAssets ? rtrim($envAssets, '/\\') : (PATH_PUBLIC . '/assets'));
}
