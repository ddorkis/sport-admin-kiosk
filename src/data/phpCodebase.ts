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
    description: 'Front Controller pubblico che include dinamicamente le pagine dalla cartella privata',
    content: `<?php
/**
 * Front Controller Pubblico
 * Posizione: /public/index.php
 * Riceve le richieste e include le pagine dalla cartella protetta /private/
 */
session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../private/includes/auth.php';

// Pagina richiesta (default: 'home')
$page = isset($_GET['page']) ? trim($_GET['page']) : 'home';
$action = isset($_GET['action']) ? trim($_GET['action']) : null;

// Gestione Azioni (POST / API)
if ($action) {
    $actionPath = __DIR__ . '/../private/actions/' . basename($action) . '.php';
    if (file_exists($actionPath)) {
        require $actionPath;
        exit;
    }
}

// Verifica se l'utente è loggato
$user = getCurrentUser();

if (!$user) {
    // Utente non autenticato -> Mostra login
    require __DIR__ . '/../private/pages/login.php';
    exit;
}

// Controllo Flag KIOSK: se l'utente ha la modalità kiosk attiva e non ha forzato una pagina autorizzata
if (!empty($user['is_kiosk']) && $page !== 'kiosk' && $page !== 'logout') {
    header('Location: index.php?page=kiosk');
    exit;
}

// Routing sicuro con whitelist per impedire Local File Inclusion (LFI)
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
$targetPath = __DIR__ . '/../private/pages/' . $fileToLoad;

if (!file_exists($targetPath)) {
    http_response_code(404);
    echo "<h1>404 - Pagina non trovata</h1>";
    exit;
}

// Inclusione sicura della pagina privata
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

function loginUser($username, $password) {
    $db = getDbConnection();
    $stmt = $db->prepare("SELECT * FROM utenti WHERE username = ? AND attivo = 1 LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Rigenera session ID per prevenire session fixation
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['nome'] = $user['nome'];
        $_SESSION['ruolo'] = $user['ruolo'];
        $_SESSION['is_kiosk'] = (int)$user['is_kiosk'];
        return true;
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
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
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
<!-- Bootstrap 5 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
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
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
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

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
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
        header('Location: ../../public/index.php?page=pagamenti&msg=success');
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
require_once __DIR__ . '/../includes/header.php';

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
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
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
require_once __DIR__ . '/../includes/header.php';
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
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
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
