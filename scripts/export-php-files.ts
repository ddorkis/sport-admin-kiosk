import fs from 'fs';
import path from 'path';
import { SQL_SCHEMA, PHP_FILES } from '../src/data/phpCodebase';

const targetDir = path.resolve(process.cwd(), 'php-backend');

console.log(`Esportazione file PHP & MariaDB in: ${targetDir}`);

// Crea cartella principale se non esiste
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Scrivi lo Schema SQL
const dbDir = path.join(targetDir, 'database');
fs.mkdirSync(dbDir, { recursive: true });
fs.writeFileSync(path.join(dbDir, 'schema.sql'), SQL_SCHEMA, 'utf-8');
console.log('✓ Creato database/schema.sql');

// 2. Scrivi tutti i file PHP definiti
PHP_FILES.forEach((file) => {
  const filePath = path.join(targetDir, file.path);
  const fileDir = path.dirname(filePath);
  fs.mkdirSync(fileDir, { recursive: true });
  fs.writeFileSync(filePath, file.content, 'utf-8');
  console.log(`✓ Creato ${file.path}`);
});

// 3. Scrivi i file .htaccess per la sicurezza Apache
fs.writeFileSync(
  path.join(targetDir, 'public', '.htaccess'),
  `# Configurazione Apache per Web Root pubblica
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?page=$1 [L,QSA]
`,
  'utf-8'
);
console.log('✓ Creato public/.htaccess');

fs.writeFileSync(
  path.join(targetDir, 'private', '.htaccess'),
  `# Blocca qualsiasi accesso diretto via browser alla cartella privata
Require all denied
`,
  'utf-8'
);
console.log('✓ Creato private/.htaccess');

fs.writeFileSync(
  path.join(targetDir, 'config', '.htaccess'),
  `# Blocca qualsiasi accesso diretto via browser alla configurazione database
Require all denied
`,
  'utf-8'
);
console.log('✓ Creato config/.htaccess');

// 4. Copia Asset Statici Locali (CSS, JS, Font) per funzionamento 100% Offline
const assetsTarget = path.join(targetDir, 'public', 'assets');
fs.mkdirSync(path.join(assetsTarget, 'css', 'fonts'), { recursive: true });
fs.mkdirSync(path.join(assetsTarget, 'fonts'), { recursive: true });
fs.mkdirSync(path.join(assetsTarget, 'js'), { recursive: true });

const srcBootstrapCss = path.resolve(process.cwd(), 'node_modules/bootstrap/dist/css/bootstrap.min.css');
const srcBootstrapJs = path.resolve(process.cwd(), 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js');
const srcIconsCss = path.resolve(process.cwd(), 'node_modules/bootstrap-icons/font/bootstrap-icons.min.css');
const srcIconsWoff2 = path.resolve(process.cwd(), 'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2');
const srcIconsWoff = path.resolve(process.cwd(), 'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff');

if (fs.existsSync(srcBootstrapCss)) {
  fs.copyFileSync(srcBootstrapCss, path.join(assetsTarget, 'css', 'bootstrap.min.css'));
  fs.copyFileSync(srcBootstrapJs, path.join(assetsTarget, 'js', 'bootstrap.bundle.min.js'));
  fs.copyFileSync(srcIconsCss, path.join(assetsTarget, 'css', 'bootstrap-icons.min.css'));
  fs.copyFileSync(srcIconsWoff2, path.join(assetsTarget, 'css', 'fonts', 'bootstrap-icons.woff2'));
  fs.copyFileSync(srcIconsWoff, path.join(assetsTarget, 'css', 'fonts', 'bootstrap-icons.woff'));
  fs.copyFileSync(srcIconsWoff2, path.join(assetsTarget, 'fonts', 'bootstrap-icons.woff2'));
  fs.copyFileSync(srcIconsWoff, path.join(assetsTarget, 'fonts', 'bootstrap-icons.woff'));
  console.log('✓ Copiati asset CSS, JS e Fonts locali in public/assets/ (100% Offline)');
}

// 5. Scrivi README.md completo di istruzioni di installazione LAMP / XAMPP
const readmeContent = `# Backend PHP & MariaDB - Gestionale Sportivo ASD

Questa cartella contiene l'architettura backend completa in **PHP Nativo + MariaDB / MySQL**, sviluppata con standard di sicurezza (Prepared Statements PDO, separazione Web Root / cartella privata protetta, Kiosk mode) e con **supporto 100% OFFLINE** (tutti i CSS, JS e font di Bootstrap 5 sono inclusi localmente).

---

## 📁 Struttura delle Cartelle

\`\`\`
php-backend/
├── database/
│   └── schema.sql              # Script DDL completo con tabelle e dati iniziali di prova
├── config/
│   ├── .htaccess               # Protezione accesso diretto
│   ├── database.php            # Parametri di connessione PDO a MariaDB/MySQL
│   └── paths.php               # Parametrizzazione centralizzata percorsi (config, private, public, assets)
├── public/                     # <-- QUESTA DEVE ESSERE LA DOCUMENT ROOT DEL WEBSERVER
│   ├── .htaccess               # URL Rewriting verso index.php
│   ├── index.php               # Front Controller unico pubblico
│   ├── paths.local.php.example # Esempio per override percorsi su filesystem custom
│   └── assets/                 # <-- File statici locali 100% offline (Nessuna connessione internet richiesta)
│       ├── css/
│       │   ├── bootstrap.min.css         # Bootstrap 5.3 CSS
│       │   ├── bootstrap-icons.min.css   # Icone Bootstrap CSS
│       │   └── fonts/                    # Font WOFF/WOFF2 per icone offline
│       │       ├── bootstrap-icons.woff
│       │       └── bootstrap-icons.woff2
│       ├── js/
│       │   └── bootstrap.bundle.min.js   # Bootstrap 5.3 JS Bundle (con Popper)
│       └── fonts/                        # Font WOFF/WOFF2 (risoluzione root)
│           ├── bootstrap-icons.woff
│           └── bootstrap-icons.woff2
├── private/                    # <-- Cartella non accessibile direttamente dal browser
│   ├── .htaccess               # 'Require all denied'
│   ├── includes/
│   │   ├── auth.php            # Controllo sessioni, permessi e login Kiosk/Admin
│   │   ├── functions.php       # Funzioni di utilità, scadenziari e calcolo quote
│   │   ├── header.php          # Navbar e layout Bootstrap 5 (link locali ad assets/)
│   │   └── footer.php          # Chiusura layout e script JS (link locale ad assets/)
│   └── pages/
│       ├── login.php           # Autenticazione con form Bootstrap 5 e credenziali
│       ├── logout.php          # Disconnessione sicura e distruzione sessione
│       ├── gestionale.php      # Cruscotto principale con KPI e scadenze
│       ├── kiosk.php           # Interfaccia semplificata Touch per Totem/Reception
│       ├── persone.php         # Anagrafica atleti e tutori legali minorenni
│       ├── tesserati.php       # Registro tesserati, numeri tessera e visite mediche
│       ├── gruppi.php          # Configurazione corsi, orari e quote mensili
│       ├── quote.php           # Scadenziario completo quote con filtri
│       ├── quote_scadute.php   # Registro solleciti e insoluti
│       ├── pagamenti.php       # Registrazione incassi e quietanze
│       ├── anni.php            # Stagioni sportive
│       ├── utenti.php          # Gestione operatori e postazioni
│       └── 404.php             # Errore pagina non trovata
│   └── actions/
│       ├── genera_quote.php    # Algoritmo automatico calcolo scadenze
│       ├── registra_pagamento.php # Incasso quote o pagamenti liberi
│       └── salva_persona.php   # Creazione anagrafica persona e tutore
└── README.md
\`\`\`

---

## 🌐 Supporto 100% Offline (Senza Connessione Internet)

Tutti i fogli di stile CSS, gli script JavaScript e i font delle icone sono salvati localmente nella cartella \`public/assets/\`.
- **Nessuna chiamata a CDN o server esterni** (\`cdn.jsdelivr.net\`).
- Il gestionale funziona perfettamente su personal computer, server locali, intranet aziendali o postazioni totem reception completamente isolate da Internet.

---

## 🚀 Istruzioni di Installazione (XAMPP / LAMP / Hosting)

### 1. Importa il Database
1. Apri **phpMyAdmin** o la console MySQL/MariaDB:
   \`\`\`bash
   mysql -u root -p < database/schema.sql
   \`\`\`
   Verrà creato il database \`gestionale_sportivo\` con tutte le tabelle e gli utenti iniziali.

### 2. Configura le credenziali del Database
Modifica il file \`config/database.php\`:
\`\`\`php
define('DB_HOST', 'localhost');
define('DB_NAME', 'gestionale_sportivo');
define('DB_USER', 'tuo_utente_mysql');
define('DB_PASS', 'tua_password');
\`\`\`

### 3. Configura il Web Server (Apache)
Per massima sicurezza, imposta come **DocumentRoot** la cartella \`php-backend/public/\`. In questo modo la cartella \`private/\` e i file di configurazione non saranno mai esposti pubblicamente su Internet.

Se usi **XAMPP / Wamp**:
Copia l'intera cartella in \`htdocs\` e accedi a:
\`http://localhost/php-backend/public/\`

### 4. Credenziali di Accesso Predefinite:
- **Amministratore**:
  - Username: \`admin\`
  - Password: \`admin123\`
- **Desk Kiosk**:
  - Username: \`kiosk\`
  - Password: \`admin123\`

---

## 🔧 Come Parametrizzare i Percorsi di 'private' e 'config'

Tutti i percorsi sono completamente parametrizzati tramite costanti (\`PATH_CONFIG\`, \`PATH_PRIVATE\`, \`PATH_INCLUDES\`, \`PATH_PAGES\`, \`PATH_ACTIONS\`).

### Opzione 1: File Locale \`public/paths.local.php\` (Consigliato per hosting condiviso o XAMPP)
Rinomina \`public/paths.local.php.example\` in \`public/paths.local.php\` e imposta i tuoi percorsi personalizzati:
\`\`\`php
<?php
define('PATH_ROOT', '/var/www/gestionale');
define('PATH_CONFIG', '/var/www/gestionale/mia_configurazione');
define('PATH_PRIVATE', '/var/www/gestionale/cartella_privata_sicura');
\`\`\`

### Opzione 2: Variabili d'Ambiente Web Server (LAMP / Nginx / Docker)
Puoi configurare le variabili d'ambiente direttamente nel tuo web server:
- **Apache (VirtualHost o .htaccess)**:
  \`\`\`apache
  SetEnv APP_CONFIG_PATH "/var/secure/config"
  SetEnv APP_PRIVATE_PATH "/var/secure/private"
  \`\`\`
- **Nginx (fastcgi_params)**:
  \`\`\`nginx
  fastcgi_param APP_CONFIG_PATH /var/secure/config;
  fastcgi_param APP_PRIVATE_PATH /var/secure/private;
  \`\`\`

### Opzione 3: Modifica diretta di \`config/paths.php\`
Puoi modificare direttamente i percorsi predefiniti all'interno del file \`config/paths.php\`.
`;

fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');
console.log('✓ Creato README.md');

console.log('✅ Esportazione completata con successo!');
