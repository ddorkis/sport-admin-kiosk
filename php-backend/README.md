# Backend PHP & MariaDB - Gestionale Sportivo ASD

Questa cartella contiene l'architettura backend completa in **PHP Nativo + MariaDB / MySQL**, sviluppata con standard di sicurezza (Prepared Statements PDO, separazione Web Root / cartella privata protetta, Kiosk mode) e con **supporto 100% OFFLINE** (tutti i CSS, JS e font di Bootstrap 5 sono inclusi localmente).

---

## 📁 Struttura delle Cartelle

```
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
```

---

## 🌐 Supporto 100% Offline (Senza Connessione Internet)

Tutti i fogli di stile CSS, gli script JavaScript e i font delle icone sono salvati localmente nella cartella `public/assets/`.
- **Nessuna chiamata a CDN o server esterni** (`cdn.jsdelivr.net`).
- Il gestionale funziona perfettamente su personal computer, server locali, intranet aziendali o postazioni totem reception completamente isolate da Internet.

---

## 🚀 Istruzioni di Installazione (XAMPP / LAMP / Hosting)

### 1. Importa il Database
1. Apri **phpMyAdmin** o la console MySQL/MariaDB:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   Verrà creato il database `gestionale_sportivo` con tutte le tabelle e gli utenti iniziali.

### 2. Configura le credenziali del Database
Modifica il file `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'gestionale_sportivo');
define('DB_USER', 'tuo_utente_mysql');
define('DB_PASS', 'tua_password');
```

### 3. Configura il Web Server (Apache)
Per massima sicurezza, imposta come **DocumentRoot** la cartella `php-backend/public/`. In questo modo la cartella `private/` e i file di configurazione non saranno mai esposti pubblicamente su Internet.

Se usi **XAMPP / Wamp**:
Copia l'intera cartella in `htdocs` e accedi a:
`http://localhost/php-backend/public/`

### 4. Credenziali di Accesso Predefinite:
- **Amministratore**:
  - Username: `admin`
  - Password: `admin123`
- **Desk Kiosk**:
  - Username: `kiosk`
  - Password: `admin123`

---

## 🔧 Come Parametrizzare i Percorsi di 'private' e 'config'

Tutti i percorsi sono completamente parametrizzati tramite costanti (`PATH_CONFIG`, `PATH_PRIVATE`, `PATH_INCLUDES`, `PATH_PAGES`, `PATH_ACTIONS`).

### Opzione 1: File Locale `public/paths.local.php` (Consigliato per hosting condiviso o XAMPP)
Rinomina `public/paths.local.php.example` in `public/paths.local.php` e imposta i tuoi percorsi personalizzati:
```php
<?php
define('PATH_ROOT', '/var/www/gestionale');
define('PATH_CONFIG', '/var/www/gestionale/mia_configurazione');
define('PATH_PRIVATE', '/var/www/gestionale/cartella_privata_sicura');
```

### Opzione 2: Variabili d'Ambiente Web Server (LAMP / Nginx / Docker)
Puoi configurare le variabili d'ambiente direttamente nel tuo web server:
- **Apache (VirtualHost o .htaccess)**:
  ```apache
  SetEnv APP_CONFIG_PATH "/var/secure/config"
  SetEnv APP_PRIVATE_PATH "/var/secure/private"
  ```
- **Nginx (fastcgi_params)**:
  ```nginx
  fastcgi_param APP_CONFIG_PATH /var/secure/config;
  fastcgi_param APP_PRIVATE_PATH /var/secure/private;
  ```

### Opzione 3: Modifica diretta di `config/paths.php`
Puoi modificare direttamente i percorsi predefiniti all'interno del file `config/paths.php`.
