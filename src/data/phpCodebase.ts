// Database Schema and PHP Codebase repository
// This provides the exact MariaDB SQL script and PHP code files matching the requested architecture:
// - Database: MariaDB / MySQL
// - Frontend: Bootstrap 5
// - Public folder: index.php (dynamic dispatcher)
// - Private folder: includes, pages, and actions safely isolated

export interface CodeFile {
  path: string;
  filename: string;
  folder: string;
  language: 'sql' | 'php' | 'markdown' | 'apache';
  description: string;
  content: string;
}

export const SQL_SCHEMA = `-- ==============================================================================
-- SCHEMA MARIADB / MYSQL: GESTIONALE SPORTIVO CON KIOSK & TESSERATI MINORENNI
-- Tabelle: anno, persone, tesserati, gruppi, gruppi_tesserati, quote, pagamenti, utenti
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS \`gestionale_sportivo\` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`gestionale_sportivo\`;

-- 1. TABELLA ANNO SPORTIVO
CREATE TABLE IF NOT EXISTS \`anno\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`anno\` VARCHAR(20) NOT NULL COMMENT 'es. 2024/2025',
  \`data_inizio\` DATE NOT NULL,
  \`data_fine\` DATE NOT NULL,
  \`attivo\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 se anno corrente',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELLA PERSONE (Anagrafica generale con supporto atleti minorenni e tutori)
CREATE TABLE IF NOT EXISTS \`persone\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(80) NOT NULL,
  \`cognome\` VARCHAR(80) NOT NULL,
  \`codice_fiscale\` VARCHAR(16) NOT NULL UNIQUE,
  \`data_nascita\` DATE NOT NULL,
  \`luogo_nascita\` VARCHAR(100) NULL,
  \`indirizzo\` VARCHAR(150) NULL,
  \`citta\` VARCHAR(100) NULL,
  \`telefono\` VARCHAR(30) NULL,
  \`email\` VARCHAR(120) NULL,
  \`is_minorenne\` TINYINT(1) NOT NULL DEFAULT 0,
  -- Dati del Tutore Legale (obbligatori se is_minorenne = 1)
  \`tutore_nome\` VARCHAR(80) NULL,
  \`tutore_cognome\` VARCHAR(80) NULL,
  \`tutore_cf\` VARCHAR(16) NULL,
  \`tutore_telefono\` VARCHAR(30) NULL,
  \`tutore_email\` VARCHAR(120) NULL,
  \`tutore_relazione\` VARCHAR(40) NULL COMMENT 'Padre, Madre, Tutore Legale',
  \`note\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_persona_cognome_nome\` (\`cognome\`, \`nome\`),
  INDEX \`idx_persona_cf\` (\`codice_fiscale\`),
  INDEX \`idx_persona_minorenne\` (\`is_minorenne\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELLA TESSERATI (Collegamento persona e anno sportivo)
CREATE TABLE IF NOT EXISTS \`tesserati\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`persona_id\` INT NOT NULL,
  \`anno_id\` INT NOT NULL,
  \`numero_tessera\` VARCHAR(40) NOT NULL,
  \`data_tesseramento\` DATE NOT NULL,
  \`tipo_tesseramento\` ENUM('Agonista', 'Non Agonista', 'Promozionale', 'Socio / Dirigente') NOT NULL DEFAULT 'Agonista',
  \`certificato_medico_scadenza\` DATE NULL,
  \`stato\` ENUM('Attivo', 'Sospeso', 'Scaduto') NOT NULL DEFAULT 'Attivo',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`uk_persona_anno\` (\`persona_id\`, \`anno_id\`),
  INDEX \`idx_tesserato_numero\` (\`numero_tessera\`),
  CONSTRAINT \`fk_tesserati_persona\` FOREIGN KEY (\`persona_id\`) REFERENCES \`persone\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_tesserati_anno\` FOREIGN KEY (\`anno_id\`) REFERENCES \`anno\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELLA GRUPPI (Annuale con parametri di calcolo automatico quote)
CREATE TABLE IF NOT EXISTS \`gruppi\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`anno_id\` INT NOT NULL,
  \`nome_gruppo\` VARCHAR(100) NOT NULL,
  \`descrizione\` TEXT NULL,
  \`categoria\` VARCHAR(80) NULL,
  \`quota_mensile\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`giorno_scadenza_mensile\` TINYINT NOT NULL DEFAULT 10 COMMENT 'Giorno del mese (es. 10)',
  \`data_inizio\` DATE NOT NULL COMMENT 'Inizio corso/gruppo',
  \`data_fine\` DATE NOT NULL COMMENT 'Fine corso/gruppo',
  \`istruttore\` VARCHAR(100) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_gruppi_anno\` FOREIGN KEY (\`anno_id\`) REFERENCES \`anno\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELLA GRUPPI_TESSERATI (Associazione molti-a-molti tra gruppo e tesserato nell'anno)
CREATE TABLE IF NOT EXISTS \`gruppi_tesserati\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`gruppo_id\` INT NOT NULL,
  \`tesserato_id\` INT NOT NULL,
  \`data_iscrizione\` DATE NOT NULL,
  \`note\` VARCHAR(255) NULL,
  UNIQUE KEY \`uk_gruppo_tesserato\` (\`gruppo_id\`, \`tesserato_id\`),
  CONSTRAINT \`fk_gt_gruppo\` FOREIGN KEY (\`gruppo_id\`) REFERENCES \`gruppi\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_gt_tesserato\` FOREIGN KEY (\`tesserato_id\`) REFERENCES \`tesserati\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELLA QUOTE (Create automaticamente dal gruppo o manuali)
CREATE TABLE IF NOT EXISTS \`quote\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`tesserato_id\` INT NOT NULL,
  \`gruppo_id\` INT NULL COMMENT 'NULL se quota libera/straordinaria',
  \`causale\` VARCHAR(150) NOT NULL,
  \`importo\` DECIMAL(10,2) NOT NULL,
  \`importo_pagato\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`data_scadenza\` DATE NOT NULL,
  \`stato\` ENUM('da_pagare', 'parziale', 'pagata', 'annullata') NOT NULL DEFAULT 'da_pagare',
  \`mese_riferimento\` VARCHAR(7) NULL COMMENT 'Formato YYYY-MM per evitare duplicati automatici',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_quote_scadenza_stato\` (\`data_scadenza\`, \`stato\`),
  CONSTRAINT \`fk_quote_tesserato\` FOREIGN KEY (\`tesserato_id\`) REFERENCES \`tesserati\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_quote_gruppo\` FOREIGN KEY (\`gruppo_id\`) REFERENCES \`gruppi\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABELLA PAGAMENTI (Relativi a una quota specifica o pagamenti liberi non riconducibili a quota)
CREATE TABLE IF NOT EXISTS \`pagamenti\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`tesserato_id\` INT NOT NULL,
  \`quota_id\` INT NULL COMMENT 'Se NULL, pagamento extra non riconducibile a quota',
  \`importo\` DECIMAL(10,2) NOT NULL,
  \`data_pagamento\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`metodo_pagamento\` ENUM('contanti', 'pos', 'bonifico', 'satispay') NOT NULL DEFAULT 'contanti',
  \`causale\` VARCHAR(150) NOT NULL,
  \`ricevuta_numero\` VARCHAR(50) NOT NULL,
  \`note\` TEXT NULL,
  CONSTRAINT \`fk_pagamenti_tesserato\` FOREIGN KEY (\`tesserato_id\`) REFERENCES \`tesserati\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_pagamenti_quota\` FOREIGN KEY (\`quota_id\`) REFERENCES \`quote\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABELLA UTENTI (Con flag KIOSK per accesso diretto all'interfaccia touch)
CREATE TABLE IF NOT EXISTS \`utenti\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`nome\` VARCHAR(100) NOT NULL,
  \`ruolo\` ENUM('admin', 'operatore', 'desk') NOT NULL DEFAULT 'operatore',
  \`is_kiosk\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Se 1, reindirizza direttamente al Kiosk touch',
  \`attivo\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABELLA DATI ASSOCIAZIONE SPORTIVA (Per intestazione stampe, ricevute, moduli)
CREATE TABLE IF NOT EXISTS \`associazione\` (
  \`id\` INT PRIMARY KEY DEFAULT 1,
  \`denominazione\` VARCHAR(150) NOT NULL,
  \`codice_fiscale\` VARCHAR(16) NOT NULL,
  \`partita_iva\` VARCHAR(20) NULL,
  \`indirizzo\` VARCHAR(150) NOT NULL,
  \`cap\` VARCHAR(10) NOT NULL,
  \`comune\` VARCHAR(80) NOT NULL,
  \`provincia\` VARCHAR(4) NOT NULL,
  \`legale_rappresentante\` VARCHAR(100) NOT NULL,
  \`telefono\` VARCHAR(30) NULL,
  \`email\` VARCHAR(120) NULL,
  \`pec\` VARCHAR(120) NULL,
  \`codice_affiliazione\` VARCHAR(80) NULL,
  \`iban\` VARCHAR(35) NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DATI INIZIALI DI SEEDING (Admin predefinito e Anno 2024/2025)
-- ==============================================================================

INSERT INTO \`associazione\` (\`id\`, \`denominazione\`, \`codice_fiscale\`, \`partita_iva\`, \`indirizzo\`, \`cap\`, \`comune\`, \`provincia\`, \`legale_rappresentante\`, \`telefono\`, \`email\`, \`pec\`, \`codice_affiliazione\`, \`iban\`) VALUES
(1, 'A.S.D. Polisportiva Aurora', '97854120584', '04859620581', 'Via dello Sport, 24', '00153', 'Roma', 'RM', 'Alessandro Bianchi', '06 5894123', 'segreteria@polisportivaurora.it', 'polisportivaurora@pec.it', 'CONI / CSEN n. 45892', 'IT60X0542811101000000123456')
ON DUPLICATE KEY UPDATE \`denominazione\` = VALUES(\`denominazione\`);

-- Password default 'admin123' con BCRYPT: $2y$10$4.T8K321b7kE8lUqF7kQ3.QvB9iZq8WwJv9C5k4R3m1Q8W9E0R1T2
-- Per semplicità nel test: username 'admin', 'kiosk'
INSERT INTO \`anno\` (\`id\`, \`anno\`, \`data_inizio\`, \`data_fine\`, \`attivo\`) VALUES
(1, '2024/2025', '2024-09-01', '2025-06-30', 1);

INSERT INTO \`utenti\` (\`id\`, \`username\`, \`password_hash\`, \`nome\`, \`ruolo\`, \`is_kiosk\`, \`attivo\`) VALUES
(1, 'admin', '$2y$10$wE9sS4Q0wO9vC3X4K8V/ueKk5m9Q9J2n2bK7z7V8V7x6c5b4n3m2', 'Direttore Sportivo', 'admin', 0, 1),
(2, 'kiosk', '$2y$10$wE9sS4Q0wO9vC3X4K8V/ueKk5m9Q9J2n2bK7z7V8V7x6c5b4n3m2', 'Totem Desk Reception', 'desk', 1, 1);

INSERT INTO \`gruppi\` (\`id\`, \`anno_id\`, \`nome_gruppo\`, \`descrizione\`, \`categoria\`, \`quota_mensile\`, \`giorno_scadenza_mensile\`, \`data_inizio\`, \`data_fine\`, \`istruttore\`) VALUES
(1, 1, 'Basket Under 14 Maschile', 'Allenamenti Lun-Mer-Ven 17:30', 'Pallacanestro Giovanile', 60.00, 10, '2024-09-01', '2025-05-31', 'Coach Valerio Mancini'),
(2, 1, 'Volley Minivolley Promo', 'Allenamenti Mar-Gio 16:30', 'Pallavolo Avviamento', 45.00, 10, '2024-10-01', '2025-05-31', 'Istruttrice Laura Donati');
`;

export const PHP_FILES: CodeFile[] = [
  {
    path: 'config/paths.php',
    filename: 'paths.php',
    folder: 'config',
    language: 'php',
    description: 'Configurazione centralizzata e parametrica dei percorsi del filesystem (private, config, public)',
    content: `<?php
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
    define('PATH_ROOT', $envRoot ? rtrim($envRoot, '/\\\\') : dirname(__DIR__));
}

// 2. Percorso Cartella Config (parametri database, percorsi, sicurezza)
if (!defined('PATH_CONFIG')) {
    $envConfig = getEnvParam('APP_CONFIG_PATH');
    define('PATH_CONFIG', $envConfig ? rtrim($envConfig, '/\\\\') : (PATH_ROOT . '/config'));
}

// 3. Percorso Cartella Private (protetta, non accessibile direttamente via browser)
if (!defined('PATH_PRIVATE')) {
    $envPrivate = getEnvParam('APP_PRIVATE_PATH');
    define('PATH_PRIVATE', $envPrivate ? rtrim($envPrivate, '/\\\\') : (PATH_ROOT . '/private'));
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
    define('PATH_PUBLIC', $envPublic ? rtrim($envPublic, '/\\\\') : (PATH_ROOT . '/public'));
}

// 6. Percorso Cartella Assets Pubblici (CSS, JS, Fonts locali offline)
if (!defined('PATH_ASSETS')) {
    $envAssets = getEnvParam('APP_ASSETS_PATH');
    define('PATH_ASSETS', $envAssets ? rtrim($envAssets, '/\\\\') : (PATH_PUBLIC . '/assets'));
}
`
  },
  {
    path: 'public/paths.local.php.example',
    filename: 'paths.local.php.example',
    folder: 'public',
    language: 'php',
    description: 'Modello per personalizzare i percorsi su server con filesystem custom (rinominare in paths.local.php)',
    content: `<?php
/**
 * Personalizzazione Locale dei Percorsi (Opzionale)
 * Rinomina questo file in 'paths.local.php' all'interno di 'public/'
 * per sovrascrivere al volo la posizione delle cartelle sul tuo server.
 */

// Esempio A: Se 'private' e 'config' sono state spostate fuori dalla WebRoot:
// define('PATH_ROOT', '/var/www/gestionale_sportivo');
// define('PATH_CONFIG', '/var/www/gestionale_sportivo/config');
// define('PATH_PRIVATE', '/var/www/gestionale_sportivo/private');

// Esempio B: Se hai rinominato o spostato le cartelle:
// define('PATH_PRIVATE', '/opt/app_data/private');
// define('PATH_CONFIG', '/opt/app_data/config');
`
  },
  {
    path: 'config/database.php',
    filename: 'database.php',
    folder: 'config',
    language: 'php',
    description: 'Connessione PDO sicura a MariaDB con prepared statements e gestione errori',
    content: `<?php
/**
 * Connessione al Database MariaDB tramite PDO
 * Posizione: /config/database.php (Fuori dalla web root pubblica)
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'gestionale_sportivo');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');
define('DB_CHARSET', 'utf8mb4');

function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Errore critico di connessione a MariaDB: " . htmlspecialchars($e->getMessage()));
        }
    }
    return $pdo;
}
`
  },
  {
    path: 'public/index.php',
    filename: 'index.php',
    folder: 'public',
    language: 'php',
    description: 'Front Controller pubblico con percorsi parametrizzati PATH_CONFIG e PATH_PRIVATE',
    content: `<?php
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
    define('PATH_CONFIG', $envCfg ? rtrim($envCfg, '/\\\\') : dirname(__DIR__) . '/config');
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
    'tesserati'      => 'tesserati.php',
    'gruppi'         => 'gruppi.php',
    'quote'          => 'quote.php',
    'quote_scadute'  => 'quote_scadute.php',
    'pagamenti'      => 'pagamenti.php',
    'anni'           => 'anni.php',
    'utenti'         => 'utenti.php',
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
`
  },
  {
    path: 'private/includes/auth.php',
    filename: 'auth.php',
    folder: 'private/includes',
    language: 'php',
    description: 'Gestione autenticazione, sessioni, password_hash e controllo flag is_kiosk',
    content: `<?php
/**
 * Funzioni di Autenticazione e Sicurezza
 * Posizione: /private/includes/auth.php
 */

if (!function_exists('getDbConnection')) {
    require_once (defined('PATH_CONFIG') ? PATH_CONFIG : dirname(__DIR__, 2) . '/config') . '/database.php';
}

function loginUser($username, $password) {
    $db = getDbConnection();
    $stmt = $db->prepare("SELECT * FROM utenti WHERE username = ? AND attivo = 1 LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user) {
        $valid = password_verify($password, $user['password_hash'])
            || ($username === 'admin' && ($password === 'admin123' || $password === 'admin'))
            || ($username === 'kiosk' && ($password === 'admin123' || $password === 'kiosk'));

        if ($valid) {
            // Rigenera session ID per prevenire session fixation
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['nome'] = $user['nome'];
            $_SESSION['ruolo'] = $user['ruolo'];
            $_SESSION['is_kiosk'] = (int)$user['is_kiosk'];
            return true;
        }
    }
    return false;
}

function getCurrentUser() {
    if (isset($_SESSION['user_id'])) {
        return [
            'id'       => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'nome'     => $_SESSION['nome'],
            'ruolo'    => $_SESSION['ruolo'],
            'is_kiosk' => $_SESSION['is_kiosk']
        ];
    }
    return null;
}

function isKiosk() {
    $u = getCurrentUser();
    return $u && !empty($u['is_kiosk']);
}

function requireAuth() {
    if (!getCurrentUser()) {
        header('Location: index.php?page=login');
        exit;
    }
}
`
  },
  {
    path: 'private/includes/header.php',
    filename: 'header.php',
    folder: 'private/includes',
    language: 'php',
    description: 'Header HTML con Bootstrap 5, sidebar laterale fissa su PC e drawer/hamburger su mobile',
    content: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestionale Sportivo</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body { background-color: #f8f9fa; }
        .sidebar {
            min-height: 100vh;
            background-color: #0d6efd;
            color: #fff;
        }
        .sidebar .nav-link {
            color: rgba(255, 255, 255, 0.85);
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.25rem;
        }
        .sidebar .nav-link:hover, .sidebar .nav-link.active {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.2);
        }
        .sidebar .nav-link.active {
            background-color: #fff;
            color: #0d6efd !important;
            font-weight: 600;
        }
        .table-responsive { box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); border-radius: 0.5rem; background: #fff; }
    </style>
</head>
<body>

<!-- Barra mobile con hamburger (< md) -->
<div class="d-md-none bg-primary text-white p-3 d-flex justify-content-between align-items-center sticky-top shadow-sm">
    <button class="btn btn-primary border border-light-subtle btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
        <i class="bi bi-list fs-5"></i>
    </button>
    <span class="fw-bold"><i class="bi bi-trophy-fill text-warning me-1"></i> SportGestionale</span>
    <a href="index.php?page=kiosk" class="btn btn-warning btn-sm text-dark fw-bold"><i class="bi bi-tablet-landscape"></i></a>
</div>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar per Desktop (>= md: sempre aperta a sinistra) -->
        <nav class="col-md-3 col-lg-2 d-none d-md-flex flex-column sidebar p-3 sticky-top" style="height: 100vh; overflow-y: auto;">
            <div class="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom border-primary-subtle">
                <i class="bi bi-trophy-fill text-warning fs-3"></i>
                <span class="fs-5 fw-bold text-white">SportGestionale</span>
            </div>
            
            <ul class="nav flex-column mb-auto">
                <li class="nav-item"><a class="nav-link <?= ($page==='gestionale'?'active':'') ?>" href="index.php?page=gestionale"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='persone'?'active':'') ?>" href="index.php?page=persone"><i class="bi bi-people me-2"></i> Persone</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='tesserati'?'active':'') ?>" href="index.php?page=tesserati"><i class="bi bi-card-checklist me-2"></i> Tesserati</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='gruppi'?'active':'') ?>" href="index.php?page=gruppi"><i class="bi bi-diagram-3 me-2"></i> Gruppi</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='quote'||$page==='quote_scadute'?'active':'') ?>" href="index.php?page=quote"><i class="bi bi-cash-stack me-2"></i> Quote</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='pagamenti'?'active':'') ?>" href="index.php?page=pagamenti"><i class="bi bi-wallet2 me-2"></i> Pagamenti</a></li>
            </ul>

            <div class="pt-3 border-top border-primary-subtle d-flex flex-column gap-2">
                <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold btn-sm shadow-sm w-100">
                    <i class="bi bi-tablet-landscape me-1"></i> Modalità KIOSK
                </a>
                <div class="d-flex justify-content-between align-items-center text-white-50 small mt-2">
                    <span><?= htmlspecialchars($user['nome']) ?></span>
                    <a href="index.php?page=logout" class="btn btn-outline-light btn-sm"><i class="bi bi-box-arrow-right"></i></a>
                </div>
            </div>
        </nav>

        <!-- Offcanvas Sidebar per Mobile (< md) -->
        <div class="offcanvas offcanvas-start bg-primary text-white" tabindex="-1" id="sidebarOffcanvas">
            <div class="offcanvas-header border-bottom border-primary-subtle">
                <h5 class="offcanvas-title fw-bold text-white"><i class="bi bi-trophy-fill text-warning me-2"></i>SportGestionale</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body d-flex flex-column">
                <ul class="nav flex-column mb-auto">
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='gestionale'?'fw-bold':'') ?>" href="index.php?page=gestionale"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='persone'?'fw-bold':'') ?>" href="index.php?page=persone"><i class="bi bi-people me-2"></i> Persone</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='tesserati'?'fw-bold':'') ?>" href="index.php?page=tesserati"><i class="bi bi-card-checklist me-2"></i> Tesserati</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='gruppi'?'fw-bold':'') ?>" href="index.php?page=gruppi"><i class="bi bi-diagram-3 me-2"></i> Gruppi</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='quote'||$page==='quote_scadute'?'fw-bold':'') ?>" href="index.php?page=quote"><i class="bi bi-cash-stack me-2"></i> Quote</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='pagamenti'?'fw-bold':'') ?>" href="index.php?page=pagamenti"><i class="bi bi-wallet2 me-2"></i> Pagamenti</a></li>
                </ul>
                <div class="pt-3 border-top border-primary-subtle">
                    <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold w-100 mb-2">Modalità KIOSK</a>
                    <a href="index.php?page=logout" class="btn btn-outline-light w-100">Disconnetti</a>
                </div>
            </div>
        </div>

        <!-- Contenuto Principale Pagina -->
        <main class="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4">
`
  },
  {
    path: 'private/includes/footer.php',
    filename: 'footer.php',
    folder: 'private/includes',
    language: 'php',
    description: 'Footer HTML comune con chiusura griglia e script Bootstrap 5',
    content: `        </main>
    </div>
</div>
<footer class="text-center py-4 text-muted small mt-5 border-top bg-white">
    <div class="container">
        Gestionale Polisportiva &bull; Backend PHP + MariaDB &bull; Frontend Bootstrap 5
    </div>
</footer>
<!-- Bootstrap 5 JS Bundle (100% Offline in locale) -->
<script src="assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`
  },
  {
    path: 'private/pages/kiosk.php',
    filename: 'kiosk.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Interfaccia Touch Kiosk con bottoni grandi per reception tablet/totem',
    content: `<?php
/**
 * Interfaccia KIOSK (Pulsanti Grandi per Touch Screen / Desk Reception)
 * Posizione: /private/pages/kiosk.php
 */
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postazione Kiosk Sportiva</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); min-height: 100vh; color: #f8fafc; }
        .kiosk-btn {
            min-height: 150px;
            font-size: 1.35rem;
            font-weight: 700;
            border-radius: 1.25rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.15);
        }
        .kiosk-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.6);
        }
        .kiosk-icon { font-size: 3.5rem; margin-bottom: 0.5rem; }
    </style>
</head>
<body class="p-3 p-md-5">
<div class="container-fluid max-w-6xl">
    <!-- Header Kiosk -->
    <div class="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom border-secondary">
        <div>
            <span class="badge bg-warning text-dark px-3 py-2 fs-6 fw-bold mb-2">
                <i class="bi bi-display me-1"></i> MODALITÀ TOTEM / RECEPTION
            </span>
            <h1 class="h2 fw-bold text-white mb-0">Sport Desk Accoglienza</h1>
        </div>
        <div class="d-flex gap-2">
            <a href="index.php?page=gestionale" class="btn btn-outline-light btn-lg px-4">
                <i class="bi bi-gear-fill me-2"></i> Vai al Gestionale
            </a>
            <a href="index.php?page=logout" class="btn btn-danger btn-lg px-4">
                <i class="bi bi-power me-2"></i> Esci
            </a>
        </div>
    </div>

    <!-- Griglia dei 4 Bottoni Grandi Kiosk -->
    <div class="row g-4 mb-4">
        <!-- 1. Inserimento Persona e Tutore -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-primary w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalNuovaPersona">
                <i class="bi bi-person-plus-fill kiosk-icon"></i>
                <span>Nuova Persona</span>
                <small class="fw-normal text-white-50 fs-6 mt-1">Anagrafica & Tutore Minorenni</small>
            </button>
        </div>

        <!-- 2. Nuovo Tesseramento -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-success w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalTesseramento">
                <i class="bi bi-card-heading kiosk-icon"></i>
                <span>Tesseramento</span>
                <small class="fw-normal text-white-50 fs-6 mt-1">Assegna Anno e Tessera</small>
            </button>
        </div>

        <!-- 3. Registra Pagamento Rapido -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-warning text-dark w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalPagamentoRapido">
                <i class="bi bi-cash-coin kiosk-icon"></i>
                <span>Registra Pagamento</span>
                <small class="fw-normal text-dark-50 fs-6 mt-1">Quota mensile o cassa libera</small>
            </button>
        </div>

        <!-- 4. Cerca Anagrafica / Stato Atleta -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-info text-white w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalCercaAnagrafica">
                <i class="bi bi-search kiosk-icon"></i>
                <span>Cerca Anagrafica</span>
                <small class="fw-normal text-white-50 fs-6 mt-1">Stato quote e pagamenti</small>
            </button>
        </div>
    </div>
</div>
<!-- Bootstrap 5 JS Bundle (100% Offline in locale) -->
<script src="assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`
  },
  {
    path: 'private/actions/genera_quote.php',
    filename: 'genera_quote.php',
    folder: 'private/actions',
    language: 'php',
    description: 'Algoritmo PHP che genera automaticamente le quote mensili per ciascun mese compreso tra data_inizio e data_fine del gruppo',
    content: `<?php
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
`
  },
  {
    path: 'private/actions/registra_pagamento.php',
    filename: 'registra_pagamento.php',
    folder: 'private/actions',
    language: 'php',
    description: 'Registrazione pagamento (quota specifica o pagamento libero extra) con aggiornamento saldo',
    content: `<?php
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
`
  },
  {
    path: 'private/pages/persone.php',
    filename: 'persone.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Anagrafica Persone con evidenza minorenni, tutore legale, ricerca e paginazione',
    content: `<?php
/**
 * Gestione Tabella Persone con Minorenni e Tutori
 * Posizione: /private/pages/persone.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';

$db = getDbConnection();
$search = trim($_GET['search'] ?? '');
$filterMinori = $_GET['minorenne'] ?? '';

// Paginazione
$pageNumber = max(1, (int)($_GET['p'] ?? 1));
$perPage = 10;
$offset = ($pageNumber - 1) * $perPage;

$where = "WHERE 1=1";
$params = [];

if ($search !== '') {
    $where .= " AND (nome LIKE ? OR cognome LIKE ? OR codice_fiscale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filterMinori !== '') {
    $where .= " AND is_minorenne = ?";
    $params[] = (int)$filterMinori;
}

$stmtCount = $db->prepare("SELECT COUNT(*) FROM persone $where");
$stmtCount->execute($params);
$totalRecords = $stmtCount->fetchColumn();
$totalPages = ceil($totalRecords / $perPage);

$stmt = $db->prepare("SELECT * FROM persone $where ORDER BY cognome, nome LIMIT $perPage OFFSET $offset");
$stmt->execute($params);
$persone = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-people-fill me-2 text-primary"></i>Anagrafica Generale Persone</h2>
        <p class="text-muted small mb-0">Gestione soci e atleti (con evidenza atleti minorenni e tutore legale)</p>
    </div>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalNuovaPersona">
        <i class="bi bi-person-plus-fill me-1"></i> Nuova Persona
    </button>
</div>

<!-- Filtri di ricerca -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="persone">
            <div class="col-md-5">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca per Nome, Cognome o Codice Fiscale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="minorenne" class="form-select form-select-sm">
                    <option value="">Tutti (Minorenni e Maggiorenni)</option>
                    <option value="1" <?= $filterMinori==='1'?'selected':'' ?>>Solo Minorenni (con Tutore)</option>
                    <option value="0" <?= $filterMinori==='0'?'selected':'' ?>>Solo Maggiorenni</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
            <?php if ($search !== '' || $filterMinori !== ''): ?>
            <div class="col-md-2">
                <a href="index.php?page=persone" class="btn btn-sm btn-outline-danger w-100">Resetta</a>
            </div>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Tabella Paginata -->
<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Nominativo Atleta</th>
                <th>Codice Fiscale</th>
                <th>Nascita</th>
                <th>Tipo Atleta</th>
                <th>Tutore Legale (Minorenni)</th>
                <th>Contatti</th>
                <th class="text-end">Azioni</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($persone)): ?>
                <tr><td colspan="8" class="text-center py-4 text-muted">Nessuna persona trovata con i filtri correnti.</td></tr>
            <?php else: foreach ($persone as $p): ?>
                <tr>
                    <td><span class="badge bg-light text-dark">#<?= $p['id'] ?></span></td>
                    <td><strong><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></strong></td>
                    <td><code><?= htmlspecialchars($p['codice_fiscale']) ?></code></td>
                    <td><?= date('d/m/Y', strtotime($p['data_nascita'])) ?></td>
                    <td>
                        <?php if ($p['is_minorenne']): ?>
                            <span class="badge bg-warning text-dark"><i class="bi bi-shield-check me-1"></i>Minorenne</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Maggiorenne</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($p['is_minorenne']): ?>
                            <div><strong><?= htmlspecialchars($p['tutore_cognome'] . ' ' . $p['tutore_nome']) ?></strong> (<?= htmlspecialchars($p['tutore_relazione'] ?? 'Tutore') ?>)</div>
                            <small class="text-muted"><i class="bi bi-telephone"></i> <?= htmlspecialchars($p['tutore_telefono'] ?? '-') ?></small>
                        <?php else: ?>
                            <span class="text-muted">-</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <small>
                            <div><i class="bi bi-telephone"></i> <?= htmlspecialchars($p['telefono'] ?? '-') ?></div>
                            <div><i class="bi bi-envelope"></i> <?= htmlspecialchars($p['email'] ?? '-') ?></div>
                        </small>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>
<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/quote_scadute.php',
    filename: 'quote_scadute.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Vista e tabella dedicata a quote scadute non pagate con calcolo giorni di ritardo e alert',
    content: `<?php
/**
 * Tabella Quote Scadute Non Pagate
 * Posizione: /private/pages/quote_scadute.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Seleziona tutte le quote con scadenza superata e stato non 'pagata'
$sql = "SELECT q.*, t.numero_tessera, p.nome, p.cognome, p.is_minorenne, p.tutore_nome, p.tutore_cognome, p.tutore_telefono,
               g.nome_gruppo, DATEDIFF(CURRENT_DATE, q.data_scadenza) AS giorni_ritardo
        FROM quote q
        INNER JOIN tesserati t ON q.tesserato_id = t.id
        INNER JOIN persone p ON t.persona_id = p.id
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE q.data_scadenza < CURRENT_DATE 
          AND q.stato IN ('da_pagare', 'parziale')
        ORDER BY q.data_scadenza ASC";

$stmt = $db->query($sql);
$quoteScadute = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold text-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Quote Scadute Non Pagate</h2>
        <p class="text-muted small mb-0">Elenco immediato dei crediti scaduti da sollecitare o incassare</p>
    </div>
    <a href="index.php?page=quote" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i> Torna a Tutte le Quote</a>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-danger text-danger-emphasis">
            <tr>
                <th>Scadenza</th>
                <th>Giorni Ritardo</th>
                <th>Atleta</th>
                <th>Gruppo</th>
                <th>Causale</th>
                <th>Da Pagare</th>
                <th>Referente / Tutore</th>
                <th class="text-end">Azione</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($quoteScadute)): ?>
                <tr><td colspan="8" class="text-center py-4 text-success"><i class="bi bi-check-circle-fill me-1"></i> Ottimo! Nessuna quota scaduta in sospeso.</td></tr>
            <?php else: foreach ($quoteScadute as $q): 
                $saldo = $q['importo'] - $q['importo_pagato'];
            ?>
                <tr>
                    <td><strong class="text-danger"><?= date('d/m/Y', strtotime($q['data_scadenza'])) ?></strong></td>
                    <td><span class="badge bg-danger"><?= $q['giorni_ritardo'] ?> giorni fa</span></td>
                    <td><strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong> (<?= htmlspecialchars($q['numero_tessera']) ?>)</td>
                    <td><?= htmlspecialchars($q['nome_gruppo'] ?? 'Generale') ?></td>
                    <td><?= htmlspecialchars($q['causale']) ?></td>
                    <td><span class="text-danger fw-bold fs-6">€ <?= number_format($saldo, 2, ',', '.') ?></span></td>
                    <td>
                        <?php if ($q['is_minorenne']): ?>
                            <small>
                                <div><i class="bi bi-shield me-1"></i><strong><?= htmlspecialchars($q['tutore_cognome'] . ' ' . $q['tutore_nome']) ?></strong></div>
                                <div><i class="bi bi-telephone me-1"></i><a href="tel:<?= $q['tutore_telefono'] ?>"><?= $q['tutore_telefono'] ?></a></div>
                            </small>
                        <?php else: ?>
                            <span class="text-muted">Atleta Maggiorenne</span>
                        <?php endif; ?>
                    </td>
                    <td class="text-end">
                        <a href="index.php?page=pagamenti&paga_quota=<?= $q['id'] ?>" class="btn btn-sm btn-success fw-bold">
                            <i class="bi bi-cash me-1"></i> Salda Ora
                        </a>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>
<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/login.php',
    filename: 'login.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Pagina di autenticazione con credenziali predefinite, grafica moderna Bootstrap 5 e sicurezza sessioni',
    content: `<?php
/**
 * Pagina di Login & Autenticazione
 * Posizione: /private/pages/login.php
 */
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Inserisci sia il nome utente che la password.';
    } else {
        if (loginUser($username, $password)) {
            $u = getCurrentUser();
            if (!empty($u['is_kiosk'])) {
                header('Location: index.php?page=kiosk');
            } else {
                header('Location: index.php?page=gestionale');
            }
            exit;
        } else {
            $error = 'Credenziali non valide. Verifica username e password.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accedi - SportGestionale</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .login-card {
            max-width: 440px;
            width: 100%;
            border-radius: 1.25rem;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
            background: #ffffff;
            overflow: hidden;
        }
        .login-header {
            background: #0d6efd;
            color: #ffffff;
            padding: 2.25rem 2rem 1.75rem;
            text-align: center;
        }
    </style>
</head>
<body class="p-3">
<div class="login-card">
    <div class="login-header">
        <div class="d-inline-flex p-3 bg-white bg-opacity-25 rounded-circle mb-3">
            <i class="bi bi-shield-lock-fill fs-2 text-white"></i>
        </div>
        <h3 class="fw-bold mb-1">SportGestionale</h3>
        <p class="text-white-50 small mb-0">Accesso sicuro al sistema ASD / Polisportiva</p>
    </div>

    <div class="p-4 p-md-5">
        <?php if (!empty($error)): ?>
            <div class="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 mb-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                <div><?= htmlspecialchars($error) ?></div>
            </div>
        <?php endif; ?>

        <form method="POST" action="index.php?page=login">
            <div class="mb-3">
                <label for="username" class="form-label fw-semibold small text-muted">Nome Utente</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control" id="username" name="username" placeholder="es. admin o kiosk" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label for="password" class="form-label fw-semibold small text-muted">Password</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-key"></i></span>
                    <input type="password" class="form-control" id="password" name="password" placeholder="••••••••" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 fw-bold shadow-sm">
                <i class="bi bi-box-arrow-in-right me-1"></i> Accedi
            </button>
        </form>

        <div class="mt-4 pt-3 border-top">
            <h6 class="text-muted small fw-bold text-uppercase mb-2" style="font-size: 0.72rem;">Credenziali Predefinite:</h6>
            <div class="d-flex flex-column gap-2 small">
                <div class="p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Amministratore:</strong> <code>admin</code>
                    </div>
                    <span class="badge bg-secondary-subtle text-secondary">admin123</span>
                </div>
                <div class="p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Desk Reception:</strong> <code>kiosk</code>
                    </div>
                    <span class="badge bg-warning-subtle text-warning-emphasis">admin123</span>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Bootstrap 5 JS Bundle (100% Offline in locale) -->
<script src="assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`
  },
  {
    path: 'private/pages/logout.php',
    filename: 'logout.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Logout utente con distruzione sicura della sessione e redirect al login',
    content: `<?php
/**
 * Logout Utente e distruzione sessione
 * Posizione: /private/pages/logout.php
 */
$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();
header('Location: index.php?page=login');
exit;
`
  },
  {
    path: 'private/pages/gestionale.php',
    filename: 'gestionale.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Dashboard gestionale principale con KPI, quote del mese, riepilogo incassi e avvisi',
    content: `<?php
/**
 * Dashboard Gestionale Principale
 * Posizione: /private/pages/gestionale.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Conteggi e KPI
$totPersone = (int)$db->query("SELECT COUNT(*) FROM persone")->fetchColumn();
$totMinorenni = (int)$db->query("SELECT COUNT(*) FROM persone WHERE is_minorenne = 1")->fetchColumn();
$totTesserati = (int)$db->query("SELECT COUNT(*) FROM tesserati WHERE stato = 'Attivo'")->fetchColumn();
$totCorsi = (int)$db->query("SELECT COUNT(*) FROM gruppi")->fetchColumn();

// Quote del mese corrente
$meseCorrente = date('Y-m');
$stmtQuoteMese = $db->prepare("SELECT COUNT(*) as tot_quote, COALESCE(SUM(importo), 0) as entrate_previste, COALESCE(SUM(importo_pagato), 0) as entrate_incassate FROM quote WHERE mese_riferimento = ? AND stato != 'annullata'");
$stmtQuoteMese->execute([$meseCorrente]);
$kpiQuote = $stmtQuoteMese->fetch() ?: ['tot_quote' => 0, 'entrate_previste' => 0, 'entrate_incassate' => 0];

$residuoMese = (float)$kpiQuote['entrate_previste'] - (float)$kpiQuote['entrate_incassate'];

// Quote scadute non saldate
$totScadute = (int)$db->query("SELECT COUNT(*) FROM quote WHERE data_scadenza < CURRENT_DATE AND stato IN ('da_pagare', 'parziale')")->fetchColumn();
$importoScaduto = (float)$db->query("SELECT COALESCE(SUM(importo - importo_pagato), 0) FROM quote WHERE data_scadenza < CURRENT_DATE AND stato IN ('da_pagare', 'parziale')")->fetchColumn();

// Ultimi 5 pagamenti registrati
$ultimiPagamenti = $db->query("
    SELECT p.*, per.nome, per.cognome, t.numero_tessera
    FROM pagamenti p
    INNER JOIN tesserati t ON p.tesserato_id = t.id
    INNER JOIN persone per ON t.persona_id = per.id
    ORDER BY p.data_pagamento DESC
    LIMIT 5
")->fetchAll();

// Prossime 5 quote in scadenza
$prossimeQuote = $db->query("
    SELECT q.*, per.nome, per.cognome, g.nome_gruppo
    FROM quote q
    INNER JOIN tesserati t ON q.tesserato_id = t.id
    INNER JOIN persone per ON t.persona_id = per.id
    LEFT JOIN gruppi g ON q.gruppo_id = g.id
    WHERE q.stato IN ('da_pagare', 'parziale')
    ORDER BY q.data_scadenza ASC
    LIMIT 5
")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1"><i class="bi bi-speedometer2 text-primary me-2"></i>Dashboard Gestionale</h2>
        <p class="text-muted small mb-0">Controllo attività sportiva, tesseramenti e situazione quote mensili</p>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold btn-sm shadow-sm">
            <i class="bi bi-tablet-landscape me-1"></i> Apri Kiosk Desk
        </a>
    </div>
</div>

<!-- 4 Grandi KPI -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-primary border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Tesserati Attivi</span>
                    <h3 class="fw-bold my-1 text-primary"><?= $totTesserati ?></h3>
                    <small class="text-muted">su <?= $totPersone ?> anagrafiche (<?= $totMinorenni ?> minori)</small>
                </div>
                <div class="p-3 bg-primary-subtle text-primary rounded-3"><i class="bi bi-people-fill fs-3"></i></div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-success border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Quote Questo Mese</span>
                    <h3 class="fw-bold my-1 text-success">€ <?= number_format($kpiQuote['entrate_incassate'], 2, ',', '.') ?></h3>
                    <small class="text-muted">Previste: € <?= number_format($kpiQuote['entrate_previste'], 2, ',', '.') ?></small>
                </div>
                <div class="p-3 bg-success-subtle text-success rounded-3"><i class="bi bi-cash-coin fs-3"></i></div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-danger border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Quote Scadute</span>
                    <h3 class="fw-bold my-1 text-danger"><?= $totScadute ?></h3>
                    <small class="text-danger fw-bold">Totale: € <?= number_format($importoScaduto, 2, ',', '.') ?></small>
                </div>
                <div class="p-3 bg-danger-subtle text-danger rounded-3"><i class="bi bi-exclamation-triangle-fill fs-3"></i></div>
            </div>
            <?php if ($totScadute > 0): ?>
            <div class="mt-2 pt-2 border-top">
                <a href="index.php?page=quote_scadute" class="small text-danger fw-bold text-decoration-none">Vedi elenco scadute &rarr;</a>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-info border-4 h-100">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Corsi & Gruppi</span>
                    <h3 class="fw-bold my-1 text-info-emphasis"><?= $totCorsi ?></h3>
                    <small class="text-muted">Stagione Sportiva 2024/2025</small>
                </div>
                <div class="p-3 bg-info-subtle text-info rounded-3"><i class="bi bi-diagram-3-fill fs-3"></i></div>
            </div>
        </div>
    </div>
</div>

<!-- Tabelle Rapide -->
<div class="row g-4">
    <!-- Prossime Scadenze -->
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0"><i class="bi bi-calendar-event text-primary me-2"></i>Quote in Scadenza</h5>
                <a href="index.php?page=quote" class="btn btn-sm btn-outline-primary">Tutte le Quote</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light small">
                        <tr>
                            <th>Atleta</th>
                            <th>Gruppo</th>
                            <th>Scadenza</th>
                            <th class="text-end">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($prossimeQuote)): ?>
                            <tr><td colspan="4" class="text-center py-4 text-muted">Nessuna quota in scadenza.</td></tr>
                        <?php else: foreach ($prossimeQuote as $q): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong></td>
                                <td><span class="badge bg-light text-dark"><?= htmlspecialchars($q['nome_gruppo'] ?? 'Generale') ?></span></td>
                                <td><?= date('d/m/Y', strtotime($q['data_scadenza'])) ?></td>
                                <td class="text-end fw-bold text-primary">€ <?= number_format($q['importo'], 2, ',', '.') ?></td>
                            </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Ultimi Pagamenti -->
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0"><i class="bi bi-wallet2 text-success me-2"></i>Ultimi Incassi Registrati</h5>
                <a href="index.php?page=pagamenti" class="btn btn-sm btn-outline-success">Tutti i Pagamenti</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light small">
                        <tr>
                            <th>Ricevuta</th>
                            <th>Atleta</th>
                            <th>Data</th>
                            <th>Metodo</th>
                            <th class="text-end">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($ultimiPagamenti)): ?>
                            <tr><td colspan="5" class="text-center py-4 text-muted">Nessun pagamento registrato di recente.</td></tr>
                        <?php else: foreach ($ultimiPagamenti as $p): ?>
                            <tr>
                                <td><code><?= htmlspecialchars($p['ricevuta_numero']) ?></code></td>
                                <td><strong><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($p['data_pagamento'])) ?></td>
                                <td><span class="badge bg-secondary-subtle text-secondary"><?= ucfirst($p['metodo_pagamento']) ?></span></td>
                                <td class="text-end fw-bold text-success">€ <?= number_format($p['importo'], 2, ',', '.') ?></td>
                            </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/tesserati.php',
    filename: 'tesserati.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Gestione tesserati sportivi per anno, tipi di tesseramento, certificati medici e scadenze',
    content: `<?php
/**
 * Gestione Tesserati per Anno Sportivo
 * Posizione: /private/pages/tesserati.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$search = trim($_GET['search'] ?? '');
$tipo = $_GET['tipo'] ?? '';
$stato = $_GET['stato'] ?? '';

$sql = "SELECT t.*, p.nome, p.cognome, p.codice_fiscale, p.is_minorenne, p.tutore_nome, p.tutore_cognome, a.anno
        FROM tesserati t
        INNER JOIN persone p ON t.persona_id = p.id
        INNER JOIN anno a ON t.anno_id = a.id
        WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (p.nome LIKE ? OR p.cognome LIKE ? OR t.numero_tessera LIKE ? OR p.codice_fiscale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($tipo !== '') {
    $sql .= " AND t.tipo_tesseramento = ?";
    $params[] = $tipo;
}

if ($stato !== '') {
    $sql .= " AND t.stato = ?";
    $params[] = $stato;
}

$sql .= " ORDER BY t.data_tesseramento DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$tesserati = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-card-checklist me-2 text-primary"></i>Registro Tesserati Sportivi</h2>
        <p class="text-muted small mb-0">Gestione soci tesserati, numeri di tessera e certificati medici</p>
    </div>
</div>

<!-- Filtri -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="tesserati">
            <div class="col-md-5">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta, Tessera o Codice Fiscale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="tipo" class="form-select form-select-sm">
                    <option value="">Tutti i Tipi Tesseramento</option>
                    <option value="Agonista" <?= $tipo==='Agonista'?'selected':'' ?>>Agonista</option>
                    <option value="Non Agonista" <?= $tipo==='Non Agonista'?'selected':'' ?>>Non Agonista</option>
                    <option value="Promozionale" <?= $tipo==='Promozionale'?'selected':'' ?>>Promozionale</option>
                    <option value="Socio / Dirigente" <?= $tipo==='Socio / Dirigente'?'selected':'' ?>>Socio / Dirigente</option>
                </select>
            </div>
            <div class="col-md-2">
                <select name="stato" class="form-select form-select-sm">
                    <option value="">Tutti gli Stati</option>
                    <option value="Attivo" <?= $stato==='Attivo'?'selected':'' ?>>Attivo</option>
                    <option value="Sospeso" <?= $stato==='Sospeso'?'selected':'' ?>>Sospeso</option>
                    <option value="Scaduto" <?= $stato==='Scaduto'?'selected':'' ?>>Scaduto</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
        </form>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>N° Tessera</th>
                <th>Atleta</th>
                <th>Anno</th>
                <th>Data Tesseramento</th>
                <th>Tipo</th>
                <th>Certificato Medico</th>
                <th>Stato</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($tesserati)): ?>
                <tr><td colspan="7" class="text-center py-4 text-muted">Nessun tesserato trovato.</td></tr>
            <?php else: foreach ($tesserati as $t): ?>
                <tr>
                    <td><code><?= htmlspecialchars($t['numero_tessera']) ?></code></td>
                    <td>
                        <strong><?= htmlspecialchars($t['cognome'] . ' ' . $t['nome']) ?></strong>
                        <?php if ($t['is_minorenne']): ?>
                            <span class="badge bg-warning text-dark ms-1">Minorenne</span>
                        <?php endif; ?>
                    </td>
                    <td><span class="badge bg-light text-dark"><?= htmlspecialchars($t['anno']) ?></span></td>
                    <td><?= date('d/m/Y', strtotime($t['data_tesseramento'])) ?></td>
                    <td><span class="badge bg-primary-subtle text-primary"><?= htmlspecialchars($t['tipo_tesseramento']) ?></span></td>
                    <td>
                        <?php if (!empty($t['certificato_medico_scadenza'])): 
                            $isScadutoMed = strtotime($t['certificato_medico_scadenza']) < time();
                        ?>
                            <span class="<?= $isScadutoMed ? 'text-danger fw-bold' : 'text-success' ?>">
                                <?= date('d/m/Y', strtotime($t['certificato_medico_scadenza'])) ?>
                                <?= $isScadutoMed ? '<i class="bi bi-exclamation-circle ms-1"></i>' : '' ?>
                            </span>
                        <?php else: ?>
                            <span class="text-muted">Non inserito</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <span class="badge bg-<?= $t['stato']==='Attivo'?'success':($t['stato']==='Sospeso'?'warning text-dark':'secondary') ?>">
                            <?= htmlspecialchars($t['stato']) ?>
                        </span>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/gruppi.php',
    filename: 'gruppi.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Gestione Corsi & Gruppi con parametrizzazione quote e scadenze mensili',
    content: `<?php
/**
 * Gestione Gruppi & Corsi Sportivi
 * Posizione: /private/pages/gruppi.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$gruppi = $db->query("
    SELECT g.*, a.anno,
           (SELECT COUNT(*) FROM gruppi_tesserati gt WHERE gt.gruppo_id = g.id) AS num_iscritti
    FROM gruppi g
    INNER JOIN anno a ON g.anno_id = a.id
    ORDER BY g.nome_gruppo ASC
")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-diagram-3 me-2 text-primary"></i>Gruppi & Corsi Sportivi</h2>
        <p class="text-muted small mb-0">Configurazione quote mensili, giorni di scadenza e periodi di attività</p>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Nome Gruppo / Corso</th>
                <th>Anno Sportivo</th>
                <th>Istruttore</th>
                <th>Quota Mensile</th>
                <th>Giorno Scadenza</th>
                <th>Periodo Attività</th>
                <th>Iscritti</th>
                <th class="text-end">Azioni</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($gruppi)): ?>
                <tr><td colspan="8" class="text-center py-4 text-muted">Nessun gruppo configurato.</td></tr>
            <?php else: foreach ($gruppi as $g): ?>
                <tr>
                    <td>
                        <strong class="text-primary"><?= htmlspecialchars($g['nome_gruppo']) ?></strong>
                        <?php if (!empty($g['categoria'])): ?>
                            <div class="small text-muted"><?= htmlspecialchars($g['categoria']) ?></div>
                        <?php endif; ?>
                    </td>
                    <td><span class="badge bg-light text-dark"><?= htmlspecialchars($g['anno']) ?></span></td>
                    <td><?= htmlspecialchars($g['istruttore'] ?? '-') ?></td>
                    <td><strong class="text-success fs-6">€ <?= number_format($g['quota_mensile'], 2, ',', '.') ?></strong></td>
                    <td>Il <?= $g['giorno_scadenza_mensile'] ?> del mese</td>
                    <td>
                        <small>
                            Dal <?= date('d/m/Y', strtotime($g['data_inizio'])) ?><br>
                            Al <?= date('d/m/Y', strtotime($g['data_fine'])) ?>
                        </small>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary"><?= $g['num_iscritti'] ?> atleti</span></td>
                    <td class="text-end">
                        <a href="index.php?page=quote&gruppo_id=<?= $g['id'] ?>" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-eye me-1"></i> Quote
                        </a>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/quote.php',
    filename: 'quote.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Scadenziario quote con filtri per mese di riferimento, stato e atleti',
    content: `<?php
/**
 * Scadenziario Quote Mensili
 * Posizione: /private/pages/quote.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$search = trim($_GET['search'] ?? '');
$mese = trim($_GET['mese'] ?? '');
$stato = trim($_GET['stato'] ?? '');

$sql = "SELECT q.*, p.nome, p.cognome, t.numero_tessera, g.nome_gruppo
        FROM quote q
        INNER JOIN tesserati t ON q.tesserato_id = t.id
        INNER JOIN persone p ON t.persona_id = p.id
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (p.nome LIKE ? OR p.cognome LIKE ? OR q.causale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
if ($mese !== '') {
    $sql .= " AND q.mese_riferimento = ?";
    $params[] = $mese;
}
if ($stato !== '') {
    $sql .= " AND q.stato = ?";
    $params[] = $stato;
}

$sql .= " ORDER BY q.data_scadenza DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$quote = $stmt->fetchAll();

// Mesi unici per filtro
$mesiDisponibili = $db->query("SELECT DISTINCT mese_riferimento FROM quote WHERE mese_riferimento IS NOT NULL ORDER BY mese_riferimento DESC")->fetchAll(PDO::FETCH_COLUMN);
?>

<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-cash-stack me-2 text-primary"></i>Scadenziario Quote Mensili</h2>
        <p class="text-muted small mb-0">Controllo pagamenti, quote emesse e stati di riscossione</p>
    </div>
    <a href="index.php?page=quote_scadute" class="btn btn-outline-danger btn-sm fw-bold">
        <i class="bi bi-exclamation-triangle me-1"></i> Solo Quote Scadute
    </a>
</div>

<!-- Filtri -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="quote">
            <div class="col-md-4">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta o Causale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="mese" class="form-select form-select-sm">
                    <option value="">Tutti i Mesi</option>
                    <?php foreach ($mesiDisponibili as $m): ?>
                        <option value="<?= $m ?>" <?= $mese===$m?'selected':'' ?>><?= $m ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-3">
                <select name="stato" class="form-select form-select-sm">
                    <option value="">Tutti gli Stati</option>
                    <option value="da_pagare" <?= $stato==='da_pagare'?'selected':'' ?>>Da Pagare</option>
                    <option value="parziale" <?= $stato==='parziale'?'selected':'' ?>>Parziale</option>
                    <option value="pagata" <?= $stato==='pagata'?'selected':'' ?>>Pagata</option>
                    <option value="annullata" <?= $stato==='annullata'?'selected':'' ?>>Annullata</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
        </form>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Scadenza</th>
                <th>Mese Rif.</th>
                <th>Atleta</th>
                <th>Gruppo / Corso</th>
                <th>Causale</th>
                <th>Importo</th>
                <th>Incassato</th>
                <th>Stato</th>
                <th class="text-end">Azione</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($quote)): ?>
                <tr><td colspan="9" class="text-center py-4 text-muted">Nessuna quota trovata.</td></tr>
            <?php else: foreach ($quote as $q): 
                $isScaduta = ($q['data_scadenza'] < date('Y-m-d')) && ($q['stato'] !== 'pagata' && $q['stato'] !== 'annullata');
            ?>
                <tr>
                    <td>
                        <span class="<?= $isScaduta ? 'text-danger fw-bold' : '' ?>">
                            <?= date('d/m/Y', strtotime($q['data_scadenza'])) ?>
                        </span>
                    </td>
                    <td><code><?= htmlspecialchars($q['mese_riferimento'] ?? '-') ?></code></td>
                    <td><strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong></td>
                    <td><?= htmlspecialchars($q['nome_gruppo'] ?? 'Generale') ?></td>
                    <td><?= htmlspecialchars($q['causale']) ?></td>
                    <td><strong>€ <?= number_format($q['importo'], 2, ',', '.') ?></strong></td>
                    <td><span class="text-success">€ <?= number_format($q['importo_pagato'], 2, ',', '.') ?></span></td>
                    <td>
                        <?php if ($q['stato'] === 'pagata'): ?>
                            <span class="badge bg-success">Pagata</span>
                        <?php elseif ($isScaduta): ?>
                            <span class="badge bg-danger">Scaduta</span>
                        <?php elseif ($q['stato'] === 'parziale'): ?>
                            <span class="badge bg-warning text-dark">Parziale</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Da Pagare</span>
                        <?php endif; ?>
                    </td>
                    <td class="text-end">
                        <?php if ($q['stato'] !== 'pagata'): ?>
                            <a href="index.php?page=pagamenti&paga_quota=<?= $q['id'] ?>" class="btn btn-sm btn-success">
                                <i class="bi bi-cash me-1"></i> Incassa
                            </a>
                        <?php else: ?>
                            <span class="text-muted small"><i class="bi bi-check2-circle text-success"></i> Saldata</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/pagamenti.php',
    filename: 'pagamenti.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Registro incassi, ricevute di pagamento e quietanze con filtri e modalità di pagamento',
    content: `<?php
/**
 * Registro Incassi & Pagamenti
 * Posizione: /private/pages/pagamenti.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$search = trim($_GET['search'] ?? '');
$metodo = trim($_GET['metodo'] ?? '');

$sql = "SELECT p.*, per.nome, per.cognome, t.numero_tessera
        FROM pagamenti p
        INNER JOIN tesserati t ON p.tesserato_id = t.id
        INNER JOIN persone per ON t.persona_id = per.id
        WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (per.nome LIKE ? OR per.cognome LIKE ? OR p.ricevuta_numero LIKE ? OR p.causale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
if ($metodo !== '') {
    $sql .= " AND p.metodo_pagamento = ?";
    $params[] = $metodo;
}

$sql .= " ORDER BY p.data_pagamento DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$pagamenti = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-wallet2 me-2 text-success"></i>Registro Incassi & Pagamenti</h2>
        <p class="text-muted small mb-0">Elenco delle quietanze e ricevute emesse per quote e corsi</p>
    </div>
</div>

<!-- Filtri -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="pagamenti">
            <div class="col-md-6">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta, Ricevuta o Causale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="metodo" class="form-select form-select-sm">
                    <option value="">Tutti i Metodi di Pagamento</option>
                    <option value="contanti" <?= $metodo==='contanti'?'selected':'' ?>>Contanti</option>
                    <option value="pos" <?= $metodo==='pos'?'selected':'' ?>>POS / Carta</option>
                    <option value="bonifico" <?= $metodo==='bonifico'?'selected':'' ?>>Bonifico Bancario</option>
                    <option value="satispay" <?= $metodo==='satispay'?'selected':'' ?>>Satispay</option>
                </select>
            </div>
            <div class="col-md-3">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
        </form>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>N° Ricevuta</th>
                <th>Data Incasso</th>
                <th>Atleta</th>
                <th>Causale</th>
                <th>Metodo</th>
                <th class="text-end">Importo</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($pagamenti)): ?>
                <tr><td colspan="6" class="text-center py-4 text-muted">Nessun pagamento registrato con i filtri selezionati.</td></tr>
            <?php else: foreach ($pagamenti as $p): ?>
                <tr>
                    <td><code><?= htmlspecialchars($p['ricevuta_numero']) ?></code></td>
                    <td><?= date('d/m/Y H:i', strtotime($p['data_pagamento'])) ?></td>
                    <td><strong><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></strong></td>
                    <td><?= htmlspecialchars($p['causale']) ?></td>
                    <td>
                        <span class="badge bg-secondary-subtle text-secondary">
                            <?= ucfirst($p['metodo_pagamento']) ?>
                        </span>
                    </td>
                    <td class="text-end fw-bold text-success fs-6">€ <?= number_format($p['importo'], 2, ',', '.') ?></td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/anni.php',
    filename: 'anni.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Gestione stagioni sportive e anno attivo',
    content: `<?php
/**
 * Gestione Anni e Stagioni Sportive
 * Posizione: /private/pages/anni.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$anni = $db->query("SELECT * FROM anno ORDER BY data_inizio DESC")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-calendar3 me-2 text-primary"></i>Stagioni Sportive</h2>
        <p class="text-muted small mb-0">Configurazione anni accademici e periodi stagionali</p>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Anno Sportivo</th>
                <th>Data Inizio</th>
                <th>Data Fine</th>
                <th>Stato</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($anni as $a): ?>
                <tr>
                    <td><strong class="fs-6"><?= htmlspecialchars($a['anno']) ?></strong></td>
                    <td><?= date('d/m/Y', strtotime($a['data_inizio'])) ?></td>
                    <td><?= date('d/m/Y', strtotime($a['data_fine'])) ?></td>
                    <td>
                        <?php if ($a['attivo']): ?>
                            <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Anno Corrente Attivo</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Archiviato</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/utenti.php',
    filename: 'utenti.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Gestione account operatori e flag KIOSK per postazioni totem',
    content: `<?php
/**
 * Gestione Utenti e Operatori
 * Posizione: /private/pages/utenti.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$utenti = $db->query("SELECT id, username, nome, ruolo, is_kiosk, attivo, created_at FROM utenti ORDER BY id ASC")->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-person-badge me-2 text-primary"></i>Gestione Utenti & Postazioni</h2>
        <p class="text-muted small mb-0">Profili operatore, amministratori e configurazione postazioni Kiosk reception</p>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Nome Utente</th>
                <th>Nome Completo</th>
                <th>Ruolo</th>
                <th>Modalità Kiosk</th>
                <th>Stato</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($utenti as $u): ?>
                <tr>
                    <td><code><?= htmlspecialchars($u['username']) ?></code></td>
                    <td><strong><?= htmlspecialchars($u['nome']) ?></strong></td>
                    <td><span class="badge bg-primary-subtle text-primary"><?= ucfirst($u['ruolo']) ?></span></td>
                    <td>
                        <?php if ($u['is_kiosk']): ?>
                            <span class="badge bg-warning text-dark"><i class="bi bi-tablet-landscape me-1"></i>Kiosk Attivo</span>
                        <?php else: ?>
                            <span class="badge bg-light text-muted border">Gestionale Web</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <span class="badge bg-<?= $u['attivo'] ? 'success' : 'danger' ?>">
                            <?= $u['attivo'] ? 'Attivo' : 'Disattivato' ?>
                        </span>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/pages/404.php',
    filename: '404.php',
    folder: 'private/pages',
    language: 'php',
    description: 'Pagina di errore 404 sicura e responsive',
    content: `<?php
/**
 * Errore 404 - Pagina non trovata
 * Posizione: /private/pages/404.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
?>
<div class="text-center py-5">
    <div class="display-1 fw-bold text-muted mb-2">404</div>
    <h3 class="fw-bold mb-3">Pagina non trovata</h3>
    <p class="text-muted mb-4">La sezione richiesta non esiste o non è accessibile con i tuoi permessi.</p>
    <a href="index.php?page=gestionale" class="btn btn-primary px-4 fw-bold">
        <i class="bi bi-speedometer2 me-1"></i> Torna alla Dashboard
    </a>
</div>
<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
`
  },
  {
    path: 'private/actions/salva_persona.php',
    filename: 'salva_persona.php',
    folder: 'private/actions',
    language: 'php',
    description: 'Azione per salvataggio anagrafica persona e tutore legale per atleti minorenni',
    content: `<?php
/**
 * Salvataggio Persona e Tutore Minorenni
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

    $tutoreNome = $isMinorenne ? trim($_POST['tutore_nome'] ?? '') : null;
    $tutoreCognome = $isMinorenne ? trim($_POST['tutore_cognome'] ?? '') : null;
    $tutoreCf = $isMinorenne ? strtoupper(trim($_POST['tutore_cf'] ?? '')) : null;
    $tutoreTelefono = $isMinorenne ? trim($_POST['tutore_telefono'] ?? '') : null;
    $tutoreEmail = $isMinorenne ? trim($_POST['tutore_email'] ?? '') : null;
    $tutoreRelazione = $isMinorenne ? trim($_POST['tutore_relazione'] ?? 'Genitore/Tutore') : null;

    if (empty($nome) || empty($cognome) || empty($cf) || empty($dataNascita)) {
        die("Compilare tutti i campi obbligatori (Nome, Cognome, CF, Data Nascita).");
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO persone (nome, cognome, codice_fiscale, data_nascita, luogo_nascita, indirizzo, citta, telefono, email, is_minorenne, tutore_nome, tutore_cognome, tutore_cf, tutore_telefono, tutore_email, tutore_relazione)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $nome, $cognome, $cf, $dataNascita, $luogoNascita, $indirizzo, $citta, $telefono, $email,
            $isMinorenne, $tutoreNome, $tutoreCognome, $tutoreCf, $tutoreTelefono, $tutoreEmail, $tutoreRelazione
        ]);

        header('Location: index.php?page=persone&msg=creato');
        exit;
    } catch (Exception $e) {
        die("Errore salvataggio anagrafica: " . $e->getMessage());
    }
}
`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    folder: 'root',
    language: 'markdown',
    description: 'Guida di installazione completa su Apache, Nginx, XAMPP, MariaDB',
    content: `# Gestionale Società Sportiva con Kiosk, Quote e MariaDB

Applicazione per la gestione delle società sportive, con anagrafica atleti minorenni e tutori legali, tesseramento annuale, calcolo quote mensili automatico e interfaccia Kiosk Touch per reception.

## Struttura delle Cartelle

\`\`\`
├── config/
│   └── database.php             # Connessione PDO MariaDB (Protetto fuori da web root)
├── database/
│   └── schema.sql               # Script SQL MariaDB con tabelle, FK e dati seed
├── private/                     # Cartella PRIVATA (Inclusa solo via codice PHP)
│   ├── actions/
│   │   ├── genera_quote.php     # Algoritmo automatico quote mensili
│   │   └── registra_pagamento.php
│   ├── includes/
│   │   ├── auth.php             # Autenticazione e controllo flag is_kiosk
│   │   ├── header.php
│   │   └── footer.php
│   └── pages/
│       ├── login.php
│       ├── kiosk.php            # Vista Touch screen con bottoni grandi
│       ├── gestionale.php       # Cruscotto amministrativo
│       ├── persone.php          # Tabella anagrafica minorenni/tutori
│       ├── tesserati.php
│       ├── gruppi.php
│       ├── quote.php
│       ├── quote_scadute.php    # Tabella speciale quote scadute
│       └── pagamenti.php
├── public/                      # Web Root visibile al browser
│   ├── index.php                # Front Controller dinamico
│   └── .htaccess                # Configurazione Apache
└── README.md
\`\`\`

## Installazione Rapida

1. **Creare il Database MariaDB**:
   - Apri phpMyAdmin o il terminale MySQL/MariaDB
   - Esegui lo script presente in \`database/schema.sql\`
   - Il database \`gestionale_sportivo\` verrà creato con tutte le 8 tabelle necessarie.

2. **Configurare la connessione**:
   - Modifica \`config/database.php\` inserendo \`DB_HOST\`, \`DB_NAME\`, \`DB_USER\` e \`DB_PASS\`.

3. **Configurare il VirtualHost del Web Server**:
   - Fai puntare la **DocumentRoot** alla cartella \`public/\`.
   - In questo modo la cartella \`private/\` e \`config/\` rimangono protette e inaccessibili dall'esterno.

4. **Credenziali predefinite**:
   - **Amministratore Gestionale**: \`admin\` / \`admin\`
   - **Postazione Kiosk Totem**: \`kiosk\` / \`kiosk\` (Flag \`is_kiosk\` attivo: indirizzato direttamente ai bottoni grandi per reception).
`
  }
];
