# Gestionale Sportivo ASD - Kiosk & Amministrazione

Software gestionale per associazioni e società sportive dilettantistiche (ASD/SSD), progettato per la gestione dei tesserati (inclusi atleti minorenni e relativi tutori), corsi e gruppi sportivi, scadenziario automatico delle quote mensili, registrazione incassi e quietanze, previsione entrate/spese e interfaccia Touch Kiosk per desk di reception.

---

## 📂 Dove sono i file del progetto?

Il repository include sia l'applicazione frontend React sia il backend completo in PHP nativo + MariaDB:

### 1. 🐘 Backend PHP & MariaDB (Cartella `/php-backend`)
Tutti i file sorgente PHP, lo schema SQL e la configurazione Apache sono ora presenti direttamente nella cartella **`php-backend/`**:

```text
php-backend/
├── database/
│   └── schema.sql              # Schema MariaDB/MySQL con tabelle e dati iniziali di prova
├── config/
│   ├── .htaccess               # Protezione accesso diretto ai file di configurazione
│   ├── database.php            # Connessione PDO sicura a MariaDB con prepared statements
│   └── paths.php               # Parametrizzazione percorsi (private, config, public)
├── public/                     # <-- DOCUMENT ROOT da impostare sul server Apache
│   ├── .htaccess               # URL Rewriting verso index.php
│   ├── index.php               # Front Controller unico pubblico
│   └── paths.local.php.example # Modello per personalizzazione percorsi locali
├── private/                    # <-- Cartella protetta non raggiungibile via browser
│   ├── .htaccess               # 'Require all denied'
│   ├── includes/
│   │   ├── auth.php            # Gestione sessioni e login (Admin / Kiosk)
│   │   ├── header.php          # Navbar e layout Bootstrap 5
│   │   └── footer.php          # Chiusura layout e script
│   ├── pages/
│   │   ├── login.php           # Autenticazione con form Bootstrap 5 e credenziali
│   │   ├── logout.php          # Disconnessione sicura e distruzione sessione
│   │   ├── gestionale.php      # Cruscotto principale con KPI e scadenze
│   │   ├── kiosk.php           # Interfaccia touch Kiosk desk
│   │   ├── persone.php         # Anagrafica atleti e tutori
│   │   ├── tesserati.php       # Registro tesserati e visite mediche
│   │   ├── gruppi.php          # Corsi, orari e quote mensili
│   │   ├── quote.php           # Scadenziario quote con filtri mensili
│   │   ├── quote_scadute.php   # Elenco quote insolute e solleciti
│   │   ├── pagamenti.php       # Registrazione incassi e quietanze
│   │   ├── anni.php            # Stagioni sportive
│   │   ├── utenti.php          # Gestione operatori e postazioni
│   │   └── 404.php             # Errore pagina non trovata
│   └── actions/
│       ├── genera_quote.php    # Generazione automatica scadenziario mensile
│       ├── registra_pagamento.php # Registrazione incassi
│       └── salva_persona.php   # Salvataggio anagrafica persona e tutore
└── README.md                   # Guida dettagliata all'installazione su server LAMP/XAMPP
```

#### Come installare il backend PHP su XAMPP / LAMP / Hosting:
1. **Importa il database**: apri phpMyAdmin o terminale MySQL ed esegui `php-backend/database/schema.sql`.
2. **Configura la connessione**: modifica le credenziali MySQL in `php-backend/config/database.php`.
3. **Copia i file**: copia la cartella in `htdocs` (su XAMPP) o imposta `php-backend/public/` come DocumentRoot del tuo virtual host.
4. **Credenziali predefinite**:
   - Amministratore: `admin` / `admin123`
   - Reception Desk: `kiosk` / `admin123`

#### ⚙️ Parametrizzazione cartelle `private/` e `config/`:
Tutti i percorsi sono completamente parametrizzati tramite costanti (`PATH_CONFIG`, `PATH_PRIVATE`, `PATH_INCLUDES`, `PATH_PAGES`, `PATH_ACTIONS`, `PATH_PUBLIC`):
- **Opzione 1 (File Locale)**: rinomina `php-backend/public/paths.local.php.example` in `paths.local.php` e imposta i percorsi personalizzati (`PATH_CONFIG`, `PATH_PRIVATE`, `PATH_ROOT`).
- **Opzione 2 (Variabili d'Ambiente Server)**: imposta `APP_CONFIG_PATH` e `APP_PRIVATE_PATH` in Apache (`SetEnv`), Nginx (`fastcgi_param`), o Docker / `.env`.
- **Opzione 3 (Configurazione centralizzata)**: modifica direttamente `php-backend/config/paths.php`.

---

### 2. ⚛️ Frontend React & TypeScript (Applicazione Web Interattiva)
La root del progetto contiene l'applicazione React SPA sviluppata con Vite, Bootstrap Icons e Tailwind CSS.

- **Avvio in sviluppo**:
  ```bash
  npm install
  npm run dev
  ```
- **Compilazione build di produzione**:
  ```bash
  npm run build
  ```
- **Esportazione / Rigenerazione automatica dei file PHP**:
  Se desideri rigenerare i file PHP aggiornati, puoi eseguire in qualsiasi momento:
  ```bash
  npm run export:php
  ```
- **Download tramite interfaccia grafica**:
  Nell'applicazione web trovi anche il pulsante **"Esporta Codice PHP/SQL"** in alto a destra, che permette di scaricare direttamente l'intero archivio `.zip` pronto per la distribuzione.
