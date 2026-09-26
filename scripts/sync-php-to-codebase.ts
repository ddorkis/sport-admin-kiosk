import fs from 'fs';
import path from 'path';

const phpBackendDir = path.resolve(process.cwd(), 'php-backend');
const outputFile = path.resolve(process.cwd(), 'src/data/phpCodebase.ts');

const fileDescriptions: Record<string, string> = {
  'config/paths.php': 'Configurazione centralizzata e parametrica dei percorsi del filesystem',
  'public/paths.local.php.example': 'File di esempio per override locale dei percorsi',
  'config/database.php': 'Connessione PDO MariaDB / MySQL sicura e centralizzata',
  'public/index.php': 'Front controller pubblico con routing sicuro whitelist',
  'private/includes/header.php': 'Layout comune, navbar con badge scadenze e inclusioni locali offline',
  'private/includes/footer.php': 'Chiusura layout e script Bootstrap bundle locali',
  'private/includes/auth.php': 'Verifica sessioni, permessi e autenticazione utenti / kiosk',
  'private/pages/gestionale.php': 'Dashboard gestionale principale con KPI, scadenze e scorciatoie',
  'private/pages/kiosk.php': 'Interfaccia semplificata touch Kiosk per totem reception',
  'private/pages/login.php': 'Schermata di autenticazione con credenziali predefinite e demo',
  'private/pages/logout.php': 'Terminazione sicura sessione e redirect al login',
  'private/pages/persone.php': 'Anagrafica soci e atleti con gestione tutore legale per minorenni',
  'private/pages/persona_nuova.php': 'Pagina dedicata di inserimento e modifica scheda anagrafica atleta e tutore',
  'private/pages/tesserati.php': 'Registro tesserati sportivi con visite mediche e numeri tessera',
  'private/pages/gruppi.php': 'Gestione gruppi, corsi, quote mensili e iscrizioni atleti',
  'private/pages/quote.php': 'Scadenziario e previsione mensile quote per atleti e corsi',
  'private/pages/quote_scadute.php': 'Elenco e sollecito insoluti con contatto telefonico del tutore',
  'private/pages/previsioni.php': 'Previsione entrate quote e budget spese stagionali con simulatore di cassa',
  'private/pages/pagamenti.php': 'Registro incassi, ricevute di cassa e quietanze',
  'private/pages/anni.php': 'Configurazione anni sportivi e selezione anno di lavoro attivo',
  'private/pages/utenti.php': 'Gestione credenziali operatori e abilitazione flag Kiosk',
  'private/pages/associazione.php': 'Anagrafica completa associazione sportiva dilettantistica e affiliazioni',
  'private/pages/404.php': 'Pagina errore per risorsa non trovata',
  'private/actions/salva_persona.php': 'Azione di creazione o modifica anagrafica atleta e tutore legale',
  'private/actions/elimina_persona.php': 'Azione gestione privacy, archiviazione, anonimizzazione GDPR ed eliminazione persona',
  'private/actions/salva_tesseramento.php': 'Azione registrazione tesseramento sportivo associato ad anno',
  'private/actions/salva_gruppo.php': 'Azione creazione o aggiornamento corso / gruppo sportivo',
  'private/actions/elimina_gruppo.php': 'Azione eliminazione corso sportivo',
  'private/actions/iscrivi_gruppo.php': 'Azione iscrizione atleta a corso con calcolo rate mensili',
  'private/actions/disiscrivi_gruppo.php': 'Azione disiscrizione atleta da corso e cancellazione rate future',
  'private/actions/genera_quote.php': 'Algoritmo generazione automatica quote mensili dal corso',
  'private/actions/registra_pagamento.php': 'Azione registrazione pagamento quota con ricevuta numerata',
  'private/actions/annulla_quota.php': 'Azione annullamento quota mensile non dovuta',
  'private/actions/salva_anno.php': 'Azione creazione e selezione anno sportivo attivo di lavoro',
  'private/actions/salva_spesa.php': 'Azione inserimento o modifica spesa previsionale a budget',
  'private/actions/elimina_spesa.php': 'Azione eliminazione spesa dal budget previsionale',
  'private/actions/salva_associazione.php': 'Azione aggiornamento anagrafica associazione sportiva',
  'README.md': 'Istruzioni complete per installazione su MariaDB e Apache'
};

const sqlSchemaPath = path.join(phpBackendDir, 'database/schema.sql');
const sqlSchemaContent = fs.readFileSync(sqlSchemaPath, 'utf-8');

const filesToInclude: string[] = [
  'config/paths.php',
  'public/paths.local.php.example',
  'config/database.php',
  'public/index.php',
  'private/includes/header.php',
  'private/includes/footer.php',
  'private/includes/auth.php',
  'private/pages/gestionale.php',
  'private/pages/kiosk.php',
  'private/pages/login.php',
  'private/pages/logout.php',
  'private/pages/persone.php',
  'private/pages/persona_nuova.php',
  'private/pages/tesserati.php',
  'private/pages/gruppi.php',
  'private/pages/quote.php',
  'private/pages/quote_scadute.php',
  'private/pages/previsioni.php',
  'private/pages/pagamenti.php',
  'private/pages/anni.php',
  'private/pages/utenti.php',
  'private/pages/associazione.php',
  'private/pages/404.php',
  'private/actions/salva_anno.php',
  'private/actions/salva_persona.php',
  'private/actions/elimina_persona.php',
  'private/actions/salva_tesseramento.php',
  'private/actions/salva_gruppo.php',
  'private/actions/elimina_gruppo.php',
  'private/actions/iscrivi_gruppo.php',
  'private/actions/disiscrivi_gruppo.php',
  'private/actions/genera_quote.php',
  'private/actions/registra_pagamento.php',
  'private/actions/annulla_quota.php',
  'private/actions/salva_spesa.php',
  'private/actions/elimina_spesa.php',
  'private/actions/salva_associazione.php',
  'README.md'
];

interface CodeFileItem {
  path: string;
  filename: string;
  folder: string;
  language: 'sql' | 'php' | 'markdown' | 'apache';
  description: string;
  content: string;
}

const phpFiles: CodeFileItem[] = [];

for (const relPath of filesToInclude) {
  const fullPath = path.join(phpBackendDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File non trovato: ${fullPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const filename = path.basename(relPath);
  const folder = path.dirname(relPath);
  let lang: 'sql' | 'php' | 'markdown' | 'apache' = 'php';
  if (filename.endsWith('.sql')) lang = 'sql';
  else if (filename.endsWith('.md')) lang = 'markdown';
  else if (filename === '.htaccess') lang = 'apache';

  phpFiles.push({
    path: relPath,
    filename,
    folder: folder === '.' ? 'root' : folder,
    language: lang,
    description: fileDescriptions[relPath] || `Modulo ${filename}`,
    content
  });
}

const fileHeader = `// Database Schema and PHP Codebase repository
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

export const SQL_SCHEMA = ${JSON.stringify(sqlSchemaContent)};

export const PHP_FILES: CodeFile[] = ${JSON.stringify(phpFiles, null, 2)};
`;

fs.writeFileSync(outputFile, fileHeader, 'utf-8');
console.log(`✓ Sincronizzati con successo ${phpFiles.length} file PHP & MariaDB in ${outputFile}`);
