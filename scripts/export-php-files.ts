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

// 5. Verifica README.md completo
const readmeFile = PHP_FILES.find((f) => f.path === 'README.md');
if (readmeFile) {
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeFile.content, 'utf-8');
  console.log('✓ Creato README.md con documentazione completa');
}

console.log('✅ Esportazione completata con successo!');

