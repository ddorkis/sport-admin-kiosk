-- ==============================================================================
-- SCHEMA MARIADB / MYSQL: GESTIONALE SPORTIVO CON KIOSK & TESSERATI MINORENNI
-- Tabelle: anno, persone, tesserati, gruppi, gruppi_tesserati, quote, pagamenti, utenti
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `gestionale_sportivo` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `gestionale_sportivo`;

-- 1. TABELLA ANNO SPORTIVO
CREATE TABLE IF NOT EXISTS `anno` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `anno` VARCHAR(20) NOT NULL COMMENT 'es. 2024/2025',
  `data_inizio` DATE NOT NULL,
  `data_fine` DATE NOT NULL,
  `attivo` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 se anno corrente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELLA PERSONE (Anagrafica generale con supporto atleti minorenni e tutori)
CREATE TABLE IF NOT EXISTS `persone` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(80) NOT NULL,
  `cognome` VARCHAR(80) NOT NULL,
  `codice_fiscale` VARCHAR(16) NOT NULL UNIQUE,
  `data_nascita` DATE NOT NULL,
  `luogo_nascita` VARCHAR(100) NULL,
  `indirizzo` VARCHAR(150) NULL,
  `citta` VARCHAR(100) NULL,
  `telefono` VARCHAR(30) NULL,
  `email` VARCHAR(120) NULL,
  `is_minorenne` TINYINT(1) NOT NULL DEFAULT 0,
  -- Dati del Tutore Legale (obbligatori se is_minorenne = 1)
  `tutore_nome` VARCHAR(80) NULL,
  `tutore_cognome` VARCHAR(80) NULL,
  `tutore_cf` VARCHAR(16) NULL,
  `tutore_telefono` VARCHAR(30) NULL,
  `tutore_email` VARCHAR(120) NULL,
  `tutore_relazione` VARCHAR(40) NULL COMMENT 'Padre, Madre, Tutore Legale',
  `note` TEXT NULL,
  `attivo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 se attiva, 0 se archiviata/nascosta',
  `anonimizzato_gdpr` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 se anonimizzata ex Art. 17 GDPR',
  `data_anonimizzazione` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_persona_cognome_nome` (`cognome`, `nome`),
  INDEX `idx_persona_cf` (`codice_fiscale`),
  INDEX `idx_persona_minorenne` (`is_minorenne`),
  INDEX `idx_persona_attivo` (`attivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELLA TESSERATI (Collegamento persona e anno sportivo)
CREATE TABLE IF NOT EXISTS `tesserati` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `persona_id` INT NOT NULL,
  `anno_id` INT NOT NULL,
  `numero_tessera` VARCHAR(40) NOT NULL,
  `data_tesseramento` DATE NOT NULL,
  `tipo_tesseramento` ENUM('Agonista', 'Non Agonista', 'Promozionale', 'Socio / Dirigente') NOT NULL DEFAULT 'Agonista',
  `certificato_medico_scadenza` DATE NULL,
  `stato` ENUM('Attivo', 'Sospeso', 'Scaduto') NOT NULL DEFAULT 'Attivo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_persona_anno` (`persona_id`, `anno_id`),
  INDEX `idx_tesserato_numero` (`numero_tessera`),
  CONSTRAINT `fk_tesserati_persona` FOREIGN KEY (`persona_id`) REFERENCES `persone` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tesserati_anno` FOREIGN KEY (`anno_id`) REFERENCES `anno` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELLA GRUPPI (Annuale con parametri di calcolo automatico quote)
CREATE TABLE IF NOT EXISTS `gruppi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `anno_id` INT NOT NULL,
  `nome_gruppo` VARCHAR(100) NOT NULL,
  `descrizione` TEXT NULL,
  `categoria` VARCHAR(80) NULL,
  `quota_mensile` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `giorno_scadenza_mensile` TINYINT NOT NULL DEFAULT 10 COMMENT 'Giorno del mese (es. 10)',
  `data_inizio` DATE NOT NULL COMMENT 'Inizio corso/gruppo',
  `data_fine` DATE NOT NULL COMMENT 'Fine corso/gruppo',
  `istruttore` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_gruppi_anno` FOREIGN KEY (`anno_id`) REFERENCES `anno` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELLA GRUPPI_TESSERATI (Associazione molti-a-molti tra gruppo e tesserato nell'anno)
CREATE TABLE IF NOT EXISTS `gruppi_tesserati` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `gruppo_id` INT NOT NULL,
  `tesserato_id` INT NOT NULL,
  `data_iscrizione` DATE NOT NULL,
  `note` VARCHAR(255) NULL,
  UNIQUE KEY `uk_gruppo_tesserato` (`gruppo_id`, `tesserato_id`),
  CONSTRAINT `fk_gt_gruppo` FOREIGN KEY (`gruppo_id`) REFERENCES `gruppi` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gt_tesserato` FOREIGN KEY (`tesserato_id`) REFERENCES `tesserati` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELLA QUOTE (Create automaticamente dal gruppo o manuali)
CREATE TABLE IF NOT EXISTS `quote` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tesserato_id` INT NOT NULL,
  `gruppo_id` INT NULL COMMENT 'NULL se quota libera/straordinaria',
  `causale` VARCHAR(150) NOT NULL,
  `importo` DECIMAL(10,2) NOT NULL,
  `importo_pagato` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `data_scadenza` DATE NOT NULL,
  `stato` ENUM('da_pagare', 'parziale', 'pagata', 'annullata') NOT NULL DEFAULT 'da_pagare',
  `mese_riferimento` VARCHAR(7) NULL COMMENT 'Formato YYYY-MM per evitare duplicati automatici',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_quote_scadenza_stato` (`data_scadenza`, `stato`),
  CONSTRAINT `fk_quote_tesserato` FOREIGN KEY (`tesserato_id`) REFERENCES `tesserati` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quote_gruppo` FOREIGN KEY (`gruppo_id`) REFERENCES `gruppi` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABELLA PAGAMENTI (Relativi a una quota specifica o pagamenti liberi non riconducibili a quota)
CREATE TABLE IF NOT EXISTS `pagamenti` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tesserato_id` INT NOT NULL,
  `quota_id` INT NULL COMMENT 'Se NULL, pagamento extra non riconducibile a quota',
  `importo` DECIMAL(10,2) NOT NULL,
  `data_pagamento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metodo_pagamento` ENUM('contanti', 'pos', 'bonifico', 'satispay') NOT NULL DEFAULT 'contanti',
  `causale` VARCHAR(150) NOT NULL,
  `ricevuta_numero` VARCHAR(50) NOT NULL,
  `note` TEXT NULL,
  CONSTRAINT `fk_pagamenti_tesserato` FOREIGN KEY (`tesserato_id`) REFERENCES `tesserati` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pagamenti_quota` FOREIGN KEY (`quota_id`) REFERENCES `quote` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABELLA UTENTI (Con flag KIOSK per accesso diretto all'interfaccia touch)
CREATE TABLE IF NOT EXISTS `utenti` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `ruolo` ENUM('admin', 'operatore', 'desk') NOT NULL DEFAULT 'operatore',
  `is_kiosk` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Se 1, reindirizza direttamente al Kiosk touch',
  `attivo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABELLA DATI ASSOCIAZIONE SPORTIVA (Per intestazione stampe, ricevute, moduli)
CREATE TABLE IF NOT EXISTS `associazione` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `denominazione` VARCHAR(150) NOT NULL,
  `codice_fiscale` VARCHAR(16) NOT NULL,
  `partita_iva` VARCHAR(20) NULL,
  `indirizzo` VARCHAR(150) NOT NULL,
  `cap` VARCHAR(10) NOT NULL,
  `comune` VARCHAR(80) NOT NULL,
  `provincia` VARCHAR(4) NOT NULL,
  `legale_rappresentante` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(30) NULL,
  `email` VARCHAR(120) NULL,
  `pec` VARCHAR(120) NULL,
  `codice_affiliazione` VARCHAR(80) NULL,
  `iban` VARCHAR(35) NULL,
  `disciplina` VARCHAR(100) NOT NULL DEFAULT 'Pattinaggio Artistico a Rotelle',
  `codice_affiliazione_fisr` VARCHAR(80) NULL DEFAULT 'FISR n. 3942',
  `registro_rasd` VARCHAR(80) NULL DEFAULT 'RASD-RM-048291',
  `enti_affiliati_json` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABELLA SPESE PREVISIONALI (Budget & Previsione Bilancio CD)
CREATE TABLE IF NOT EXISTS `spese_previsionali` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `anno_id` INT NOT NULL,
  `titolo` VARCHAR(150) NOT NULL,
  `categoria` VARCHAR(80) NOT NULL DEFAULT 'Altro',
  `importo_mensile` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `ricorrente` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 se spesa attiva tutti i mesi della stagione',
  `mesi_json` TEXT NULL COMMENT 'JSON array dei mesi specifici se non ricorrente',
  `note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_spese_anno` FOREIGN KEY (`anno_id`) REFERENCES `anno` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DATI INIZIALI DI SEEDING (Admin predefinito, Anno 2024/2025, Gruppi e Spese)
-- ==============================================================================

INSERT INTO `associazione` (`id`, `denominazione`, `codice_fiscale`, `partita_iva`, `indirizzo`, `cap`, `comune`, `provincia`, `legale_rappresentante`, `telefono`, `email`, `pec`, `codice_affiliazione`, `iban`, `disciplina`, `codice_affiliazione_fisr`, `registro_rasd`, `enti_affiliati_json`) VALUES
(1, 'A.S.D. Polisportiva Aurora', '97854120584', '04859620581', 'Via dello Sport, 24', '00153', 'Roma', 'RM', 'Alessandro Bianchi', '06 5894123', 'segreteria@polisportivaurora.it', 'polisportivaurora@pec.it', 'CONI / FISR n. 3942', 'IT60X0542811101000000123456', 'Pattinaggio Artistico a Rotelle', 'FISR n. 3942', 'RASD-RM-048291', '[{\"id\":\"1\",\"tipo\":\"FSN\",\"sigla\":\"FISR\",\"denominazione_estesa\":\"Federazione Italiana Sport Rotellistici\",\"codice_societa\":\"3942\",\"attivo\":true},{\"id\":\"2\",\"tipo\":\"EPS\",\"sigla\":\"UISP\",\"denominazione_estesa\":\"Unione Italiana Sport Per tutti - Pattinaggio\",\"codice_societa\":\"UISP-RM-8492\",\"attivo\":true},{\"id\":\"3\",\"tipo\":\"EPS\",\"sigla\":\"AICS\",\"denominazione_estesa\":\"Associazione Italiana Cultura Sport\",\"codice_societa\":\"AICS-99321\",\"attivo\":true}]')
ON DUPLICATE KEY UPDATE `denominazione` = VALUES(`denominazione`);

-- Password default 'admin123' con BCRYPT: $2y$10$4.T8K321b7kE8lUqF7kQ3.QvB9iZq8WwJv9C5k4R3m1Q8W9E0R1T2
-- Per semplicità nel test: username 'admin', 'kiosk'
INSERT INTO `anno` (`id`, `anno`, `data_inizio`, `data_fine`, `attivo`) VALUES
(1, '2024/2025', '2024-09-01', '2025-06-30', 1);

INSERT INTO `utenti` (`id`, `username`, `password_hash`, `nome`, `ruolo`, `is_kiosk`, `attivo`) VALUES
(1, 'admin', '$2y$10$wE9sS4Q0wO9vC3X4K8V/ueKk5m9Q9J2n2bK7z7V8V7x6c5b4n3m2', 'Direttore Sportivo', 'admin', 0, 1),
(2, 'kiosk', '$2y$10$wE9sS4Q0wO9vC3X4K8V/ueKk5m9Q9J2n2bK7z7V8V7x6c5b4n3m2', 'Totem Desk Reception', 'desk', 1, 1);

INSERT INTO `gruppi` (`id`, `anno_id`, `nome_gruppo`, `descrizione`, `categoria`, `quota_mensile`, `giorno_scadenza_mensile`, `data_inizio`, `data_fine`, `istruttore`) VALUES
(1, 1, 'Basket Under 14 Maschile', 'Allenamenti Lun-Mer-Ven 17:30', 'Pallacanestro Giovanile', 60.00, 10, '2024-09-01', '2025-05-31', 'Coach Valerio Mancini'),
(2, 1, 'Volley Minivolley Promo', 'Allenamenti Mar-Gio 16:30', 'Pallavolo Avviamento', 45.00, 10, '2024-10-01', '2025-05-31', 'Istruttrice Laura Donati');

INSERT INTO `spese_previsionali` (`id`, `anno_id`, `titolo`, `categoria`, `importo_mensile`, `ricorrente`, `mesi_json`, `note`) VALUES
(1, 1, 'Affitto Palazzetto dello Sport e Pista', 'Affitto Impianti / Pista', 350.00, 1, NULL, 'Canone mensile concordato per spazi allenamento'),
(2, 1, 'Compensi Istruttori Tecnici Qualificati', 'Compensi Tecnici / Allenatori', 450.00, 1, NULL, 'Rimborsi forfettari e compensi istruttori per corsi attivi'),
(3, 1, 'Assicurazioni Sportive & Tesseramenti Iniziali', 'Assicurazioni', 220.00, 0, '["2024-09","2024-10"]', 'Coperture assicurative integrative obbligatorie atleti'),
(4, 1, 'Fornitura Materiale Tecnico & Divise Sociali', 'Materiale Sportivo & Divise', 180.00, 0, '["2024-10","2024-11"]', 'Kit gara e abbigliamento sociale stagione'),
(5, 1, 'Quota Iscrizione Gare e Trasferte Campionati', 'Gare & Trasferte', 150.00, 0, '["2025-02","2025-03","2025-04"]', 'Iscrizioni circuiti regionali e nazionali');
