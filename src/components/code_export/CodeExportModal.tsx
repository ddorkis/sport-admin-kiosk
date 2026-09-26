import React, { useState } from 'react';
import JSZip from 'jszip';
import { SQL_SCHEMA, PHP_FILES, CodeFile } from '../../data/phpCodebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'files' | 'guide'>('sql');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(1); // index.php
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    setTimeout(() => setCopiedState(null), 2500);
  };

  const downloadFile = (filename: string, content: string, mime: string = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();

      // Aggiungi schema SQL
      zip.file('database/schema.sql', SQL_SCHEMA);

      // Aggiungi tutti i file PHP
      PHP_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      // Aggiungi .htaccess per la cartella pubblica
      zip.file(
        'public/.htaccess',
        `# Configurazione Apache per Web Root pubblica
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?page=$1 [L,QSA]
`
      );

      // Aggiungi .htaccess per bloccare accesso web diretto a cartella privata e config
      zip.file(
        'private/.htaccess',
        `# Blocca qualsiasi accesso diretto via browser alla cartella privata
Require all denied
`
      );

      zip.file(
        'config/.htaccess',
        `# Blocca qualsiasi accesso diretto via browser alla configurazione database
Require all denied
`
      );

      // Aggiungi README.md completo
      zip.file(
        'README.md',
        `# Backend PHP & MariaDB - Gestionale Sportivo ASD

Architettura professionale in PHP Nativo + MariaDB / MySQL con supporto 100% OFFLINE.

Tutti i fogli di stile CSS (Bootstrap 5.3), script JS (Bootstrap Bundle) e font delle icone (Bootstrap Icons) sono inclusi nella cartella \`public/assets/\`.
Nessuna connessione a Internet è richiesta: il sito funziona al 100% anche su PC completamente disconnessi dalla rete.

## Istruzioni Rapide:
1. Importa 'database/schema.sql' in MariaDB/MySQL.
2. Configura 'config/database.php' con le tue credenziali.
3. Imposta la cartella 'public/' come DocumentRoot del tuo Web Server Apache (XAMPP/LAMP) o Nginx.
4. Accedi via browser a http://localhost/ con:
   - Admin: user 'admin', password 'admin123'
   - Kiosk: user 'kiosk', password 'admin123'
`
      );

      // Inserisci asset statici CSS, JS e Font per funzionamento 100% Offline
      const assetList = [
        { url: '/php-assets/css/bootstrap.min.css', zipPath: 'public/assets/css/bootstrap.min.css', binary: false },
        { url: '/php-assets/css/bootstrap-icons.min.css', zipPath: 'public/assets/css/bootstrap-icons.min.css', binary: false },
        { url: '/php-assets/js/bootstrap.bundle.min.js', zipPath: 'public/assets/js/bootstrap.bundle.min.js', binary: false },
        { url: '/php-assets/fonts/bootstrap-icons.woff2', zipPath: 'public/assets/fonts/bootstrap-icons.woff2', binary: true },
        { url: '/php-assets/fonts/bootstrap-icons.woff', zipPath: 'public/assets/fonts/bootstrap-icons.woff', binary: true },
        { url: '/php-assets/fonts/bootstrap-icons.woff2', zipPath: 'public/assets/css/fonts/bootstrap-icons.woff2', binary: true },
        { url: '/php-assets/fonts/bootstrap-icons.woff', zipPath: 'public/assets/css/fonts/bootstrap-icons.woff', binary: true },
      ];

      await Promise.all(
        assetList.map(async (asset) => {
          try {
            const resp = await fetch(asset.url);
            if (resp.ok) {
              if (asset.binary) {
                const data = await resp.arrayBuffer();
                zip.file(asset.zipPath, data);
              } else {
                const data = await resp.text();
                zip.file(asset.zipPath, data);
              }
            } else {
              console.warn(`Impossibile scaricare asset locale ${asset.url}: HTTP ${resp.status}`);
            }
          } catch (e) {
            console.warn(`Errore caricamento asset ${asset.url}:`, e);
          }
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gestionale_sportivo_php_mariadb.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Errore creazione ZIP:', err);
      alert('Si è verificato un errore durante la generazione del pacchetto ZIP.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const currentFile = PHP_FILES[selectedFileIndex] || PHP_FILES[0];

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden" style={{ height: '90vh' }}>
          {/* Header */}
          <div className="modal-header bg-dark text-white p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-file-earmark-code-fill text-warning fs-3"></i>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold mb-0">Codice Sorgente PHP & Script MariaDB</h5>
                  <span className="badge bg-success bg-opacity-75 text-white small">
                    <i className="bi bi-wifi-off me-1"></i> 100% Offline
                  </span>
                </div>
                <small className="text-secondary">Architettura con web root pubblica, pagine private e asset CSS/JS locali</small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-warning text-dark fw-bold btn-sm shadow-sm"
                onClick={handleDownloadAllZip}
                disabled={isDownloadingZip}
              >
                {isDownloadingZip ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Creazione ZIP...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-zip-fill me-1"></i> Scarica Progetto ZIP Completo
                  </>
                )}
              </button>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
            </div>
          </div>

          {/* Navigazione Tab */}
          <div className="bg-light border-bottom px-4 pt-2">
            <ul className="nav nav-tabs border-0">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'sql' ? 'active fw-bold text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('sql')}
                >
                  <i className="bi bi-database me-1"></i> Script SQL MariaDB (database/schema.sql)
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'files' ? 'active fw-bold text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('files')}
                >
                  <i className="bi bi-folder-symlink me-1"></i> File PHP (Pubblici & Privati)
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'guide' ? 'active fw-bold text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('guide')}
                >
                  <i className="bi bi-book me-1"></i> Guida Installazione Apache/Nginx
                </button>
              </li>
            </ul>
          </div>

          {/* Corpo Tab */}
          <div className="modal-body p-0 d-flex flex-column flex-grow-1 overflow-hidden">
            {/* TAB 1: SCRIPT SQL */}
            {activeTab === 'sql' && (
              <div className="d-flex flex-column h-100 p-3">
                <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                  <span className="small text-muted">
                    Script pronto all'uso con tabelle <code>persone</code>, <code>tesserati</code>, <code>gruppi</code>, <code>quote</code>, <code>pagamenti</code>, <code>utenti</code>
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => copyToClipboard(SQL_SCHEMA, 'sql')}
                    >
                      <i className="bi bi-clipboard me-1"></i>
                      {copiedState === 'sql' ? 'Copiato!' : 'Copia SQL'}
                    </button>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => downloadFile('schema.sql', SQL_SCHEMA, 'application/sql')}
                    >
                      <i className="bi bi-download me-1"></i> Scarica schema.sql
                    </button>
                  </div>
                </div>
                <div className="flex-grow-1 bg-dark text-light p-3 rounded-3 overflow-auto font-monospace small">
                  <pre className="mb-0"><code>{SQL_SCHEMA}</code></pre>
                </div>
              </div>
            )}

            {/* TAB 2: EXPLORER FILE PHP */}
            {activeTab === 'files' && (
              <div className="row g-0 h-100">
                {/* File Tree a Sinistra */}
                <div className="col-md-4 border-end bg-light d-flex flex-column h-100">
                  <div className="p-3 border-bottom bg-white fw-bold small text-uppercase text-secondary">
                    <i className="bi bi-folder2-open me-2 text-warning"></i> Albero File PHP
                  </div>
                  <div className="list-group list-group-flush overflow-auto flex-grow-1">
                    {PHP_FILES.map((f, idx) => {
                      const isSelected = selectedFileIndex === idx;
                      return (
                        <button
                          key={f.path}
                          className={`list-group-item list-group-item-action py-2 px-3 text-start border-0 ${
                            isSelected ? 'bg-primary text-white' : ''
                          }`}
                          onClick={() => setSelectedFileIndex(idx)}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className={`bi ${f.folder === 'public' ? 'bi-globe text-success' : f.folder === 'config' ? 'bi-gear text-danger' : 'bi-filetype-php text-primary'} ${isSelected ? 'text-white' : ''}`}></i>
                            <div className="text-truncate">
                              <span className="font-monospace small fw-bold d-block">{f.path}</span>
                              <span className={`small ${isSelected ? 'text-white-50' : 'text-muted'}`}>{f.description}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visualizzatore Codice a Destra */}
                <div className="col-md-8 d-flex flex-column h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div>
                      <strong className="font-monospace text-primary">{currentFile.path}</strong>
                      <span className="badge bg-light text-dark border ms-2">{currentFile.folder}</span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => copyToClipboard(currentFile.content, currentFile.path)}
                      >
                        <i className="bi bi-clipboard me-1"></i>
                        {copiedState === currentFile.path ? 'Copiato!' : 'Copia'}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => downloadFile(currentFile.filename, currentFile.content, 'text/x-php')}
                      >
                        <i className="bi bi-download me-1"></i> Scarica
                      </button>
                    </div>
                  </div>
                  <div className="flex-grow-1 bg-dark text-light p-3 rounded-3 overflow-auto font-monospace small">
                    <pre className="mb-0"><code>{currentFile.content}</code></pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GUIDA INSTALLAZIONE */}
            {activeTab === 'guide' && (
              <div className="p-4 overflow-auto">
                <div className="max-w-3xl mx-auto">
                  <h4 className="fw-bold text-dark mb-3">
                    <i className="bi bi-hdd-network me-2 text-primary"></i>
                    Come installare ed eseguire il progetto PHP & MariaDB
                  </h4>

                  <div className="card border-0 bg-light p-4 rounded-4 mb-4">
                    <h5 className="fw-bold text-primary mb-2">1. Architettura Richiesta (Pubblica / Privata)</h5>
                    <p className="text-muted small mb-2">
                      L'applicazione rispetta lo standard di sicurezza professionale per cui:
                    </p>
                    <ul className="small text-muted mb-0">
                      <li><strong><code>/public</code>:</strong> È l'unica cartella esposta al server web (DocumentRoot). Contiene <code>index.php</code> che fa da dispatcher/router.</li>
                      <li><strong><code>/private</code>:</strong> Cartella protetta contenente le pagine reali (<code>gestionale.php</code>, <code>kiosk.php</code>, <code>persone.php</code>) e le azioni (<code>genera_quote.php</code>, <code>registra_pagamento.php</code>). Nessun utente esterno può accedervi via URL diretto.</li>
                      <li><strong><code>/config</code>:</strong> Contiene le credenziali del database MariaDB (<code>database.php</code>) e non è accessibile via web.</li>
                    </ul>
                  </div>

                  <div className="card border-0 bg-light p-4 rounded-4 mb-4">
                    <h5 className="fw-bold text-success mb-2">2. Importazione Database in MariaDB</h5>
                    <ol className="small text-muted mb-0">
                      <li>Apri phpMyAdmin, DBeaver o la riga di comando MySQL/MariaDB.</li>
                      <li>Copia ed incolla lo script presente nella scheda <strong>"Script SQL MariaDB"</strong> o importa il file <code>schema.sql</code>.</li>
                      <li>Verrà creato il database <code>gestionale_sportivo</code> con tutte le tabelle (persone, tesserati, gruppi, quote, pagamenti, utenti).</li>
                    </ol>
                  </div>

                  <div className="card border-0 bg-light p-4 rounded-4 mb-4">
                    <h5 className="fw-bold text-warning-emphasis mb-2">3. Configurazione Web Server (Apache o Nginx)</h5>
                    <p className="small text-muted mb-2">Esempio di VirtualHost Apache (in XAMPP o Linux):</p>
                    <div className="bg-dark text-light p-3 rounded font-monospace small">
                      <pre className="mb-0">{`<VirtualHost *:80>
    ServerName gestionale.local
    DocumentRoot "C:/xampp/htdocs/gestionale_sportivo/public"
    
    <Directory "C:/xampp/htdocs/gestionale_sportivo/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>`}</pre>
                    </div>
                  </div>

                  <div className="card border-0 bg-light p-4 rounded-4 mb-4">
                    <h5 className="fw-bold text-dark mb-2">4. Accesso & Credenziali Default</h5>
                    <ul className="small text-muted mb-0">
                      <li><strong>Amministratore Gestionale:</strong> username <code>admin</code>, password <code>admin</code> (accede a tutte le tabelle, quote scadute e configurazioni).</li>
                      <li><strong>Totem / Reception Kiosk:</strong> username <code>kiosk</code>, password <code>kiosk</code> (flag <code>is_kiosk=1</code>, entra direttamente nei bottoni grandi touch).</li>
                    </ul>
                  </div>

                  <div className="card border-0 bg-light p-4 rounded-4 border-start border-success border-4">
                    <h5 className="fw-bold text-success mb-2">
                      <i className="bi bi-wifi-off me-2"></i>
                      5. Funzionamento 100% Offline (Senza Connessione Internet)
                    </h5>
                    <p className="small text-muted mb-2">
                      Tutti i file CSS di Bootstrap 5, le icone Bootstrap Icons e gli script JavaScript sono inclusi localmente nella cartella <code>public/assets/</code>.
                    </p>
                    <ul className="small text-muted mb-0">
                      <li>Nessuna richiesta remota verso CDN (come <code>cdn.jsdelivr.net</code>).</li>
                      <li>Il gestionale e la postazione Kiosk funzionano regolarmente anche se il PC è completamente privo di connessione Internet.</li>
                      <li>Il pacchetto ZIP include già l'intera alberatura <code>public/assets/css/</code>, <code>public/assets/js/</code> e <code>public/assets/fonts/</code>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light p-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Progetto pronto per MariaDB 10.x+ e PHP 7.4 / 8.x con Bootstrap 5
            </span>
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
