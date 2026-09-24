import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Associazione, Persona, Tesserato, Pagamento, Anno, Gruppo } from '../../types';

export type TipoDocumentoStampa = 'ricevuta' | 'domanda_iscrizione' | 'richiesta_certificato';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipoDocumento: TipoDocumentoStampa;
  associazione: Associazione;
  persona?: Persona;
  tesserato?: Tesserato;
  pagamento?: Pagamento;
  annoAttivo?: Anno;
  gruppi?: Gruppo[];
}

export const StampaDocumentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tipoDocumento,
  associazione,
  persona,
  tesserato,
  pagamento,
  annoAttivo,
  gruppi = []
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [printErrorNotice, setPrintErrorNotice] = useState(false);

  if (!isOpen) return null;

  const dataOggi = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getTitoloModal = () => {
    switch (tipoDocumento) {
      case 'ricevuta':
        return `Ricevuta di Pagamento ${pagamento?.ricevuta_numero || ''}`;
      case 'domanda_iscrizione':
        return `Domanda Iscrizione & Tesseramento FISR/EPS - ${persona ? `${persona.cognome} ${persona.nome}` : ''}`;
      case 'richiesta_certificato':
        return `Richiesta Certificato Medico Pattinaggio - ${persona ? `${persona.cognome} ${persona.nome}` : ''}`;
    }
  };

  // Genera nome file pulito
  const getPdfFilename = () => {
    const atleta = persona ? `${persona.cognome}_${persona.nome}`.replace(/\s+/g, '_') : 'documento';
    const dataStr = new Date().toISOString().slice(0, 10);
    switch (tipoDocumento) {
      case 'ricevuta':
        return `Ricevuta_${pagamento?.ricevuta_numero || 'pagamento'}_${atleta}.pdf`;
      case 'domanda_iscrizione':
        return `Domanda_Iscrizione_FISR_${atleta}_${dataStr}.pdf`;
      case 'richiesta_certificato':
        return `Richiesta_Certificato_Medico_${atleta}_${dataStr}.pdf`;
    }
  };

  // Download PDF con html2canvas + jsPDF (funziona al 100% in iframe e su qualsiasi browser)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    setPrintErrorNotice(false);

    try {
      const element = document.getElementById('documento-stampa-a4');
      if (!element) {
        alert('Elemento di stampa non trovato.');
        setIsGeneratingPdf(false);
        return;
      }

      // Render su canvas ad alta risoluzione
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(getPdfFilename());

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 5000);
    } catch (err) {
      console.error('Errore generazione PDF:', err);
      alert('Si è verificato un errore durante la generazione del PDF. Riprova con la stampa browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Stampa standard del browser con fallback
  const handlePrint = () => {
    try {
      // Se siamo in un iframe, il browser potrebbe bloccare window.print()
      const isIframe = window.self !== window.top;
      if (isIframe) {
        setPrintErrorNotice(true);
      }
      window.print();
    } catch (e) {
      console.warn('window.print() non consentito dall\'ambiente sandbox:', e);
      setPrintErrorNotice(true);
    }
  };

  // Apri in finestra pulita per stampa esterna se preferito
  const handleOpenPrintWindow = () => {
    const element = document.getElementById('documento-stampa-a4');
    if (!element) return;

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=1100');
      if (!printWindow) {
        alert('Il browser ha bloccato il popup. Usa il pulsante "Scarica PDF Ufficiale" per ottenere il documento.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${getTitoloModal()}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
            <style>
              body { background: #ffffff; color: #212529; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
              @page { size: A4; margin: 12mm 15mm; }
              @media print {
                body { padding: 0; }
                .d-print-none { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="d-print-none text-center mb-4 p-3 bg-light border rounded">
              <button onclick="window.print()" class="btn btn-primary fw-bold px-4 me-2">
                <i class="bi bi-printer me-1"></i> Stampa Subito
              </button>
              <button onclick="window.close()" class="btn btn-secondary px-3">
                Chiudi Finestra
              </button>
            </div>
            <div>${element.innerHTML}</div>
            <script>
              setTimeout(() => {
                window.print();
              }, 450);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      console.warn('Apertura finestra bloccata:', e);
      // Fallback sul download del PDF
      handleDownloadPdf();
    }
  };

  // Enti attivi
  const entiAttivi = associazione.enti_affiliati && associazione.enti_affiliati.length > 0
    ? associazione.enti_affiliati.filter(e => e.attivo !== false)
    : [];

  const epsList = entiAttivi.filter(e => e.tipo === 'EPS');

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          
          {/* HEADER DEL MODAL (Nascosto in stampa) */}
          <div className="modal-header bg-dark text-white d-print-none py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-printer-fill text-warning fs-5"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">{getTitoloModal()}</h5>
                <small className="text-warning-emphasis">
                  {associazione.denominazione} &bull; {associazione.disciplina || 'Pattinaggio Artistico a Rotelle'}
                </small>
              </div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              {/* PULSANTE 1: DOWNLOAD PDF DIRETTO (Indistruttibile) */}
              <button
                type="button"
                className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-2 px-3 shadow-sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Generazione PDF...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill fs-6"></i>
                    <span>Scarica PDF Ufficiale</span>
                  </>
                )}
              </button>

              {/* PULSANTE 2: STAMPA DIRETTA BROWSER */}
              <button
                type="button"
                className="btn btn-warning btn-sm text-dark fw-bold d-flex align-items-center gap-2 px-3 shadow-sm"
                onClick={handlePrint}
              >
                <i className="bi bi-printer fs-6"></i>
                <span>Stampa</span>
              </button>

              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Chiudi"
              ></button>
            </div>
          </div>

          {/* BANNER INFORMATIVO STAMPA & IFRAME (Nascosto in stampa) */}
          <div className="bg-light border-bottom p-2 px-4 d-print-none">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 small">
              <div className="text-muted d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-primary"></i>
                <span>
                  <strong>Consiglio di Stampa:</strong> Se il browser blocca la finestra pop-up di stampa, fai clic sul pulsante verde <strong>"Scarica PDF Ufficiale"</strong> per ottenere subito il file A4 pronto da stampare o inviare su WhatsApp.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm py-0 px-2 small"
                onClick={handleOpenPrintWindow}
              >
                <i className="bi bi-box-arrow-up-right me-1"></i> Apri in nuova scheda
              </button>
            </div>

            {pdfSuccess && (
              <div className="alert alert-success py-1 px-3 mb-0 mt-2 small d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-success fs-6"></i>
                <span><strong>PDF generato e scaricato con successo!</strong> Controlla la cartella Download del tuo dispositivo.</span>
              </div>
            )}

            {printErrorNotice && (
              <div className="alert alert-warning py-1 px-3 mb-0 mt-2 small d-flex align-items-center justify-content-between">
                <div>
                  <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                  <span>Finestra di stampa inibita dai permessi dell'anteprima: clicca sul pulsante verde <strong>"Scarica PDF Ufficiale"</strong>.</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-dark py-0"
                  onClick={handleDownloadPdf}
                >
                  Scarica PDF
                </button>
              </div>
            )}
          </div>

          {/* CORPO STAMPABILE */}
          <div className="modal-body p-3 p-md-5 bg-secondary-subtle printable-document-container">
            {/* FOGLIO A4 STILIZZATO */}
            <div
              id="documento-stampa-a4"
              className="bg-white p-4 p-md-5 mx-auto rounded shadow-sm border printable-paper"
              style={{
                maxWidth: '820px',
                minHeight: '1050px',
                color: '#212529',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* CARTA INTESTATA ASSOCIAZIONE SPORTIVA (Senza riquadri colorati per la stampa) */}
              <div className="border-bottom pb-3 mb-4" style={{ borderColor: '#212529', borderBottomWidth: '2px' }}>
                <div className="row align-items-center">
                  <div className="col-7">
                    <h3
                      className="fw-bold mb-1 text-uppercase"
                      style={{
                        color: '#111827',
                        letterSpacing: '0.02em',
                        fontSize: '1.35rem',
                        lineHeight: '1.2'
                      }}
                    >
                      {associazione.denominazione || 'A.S.D. Pattinaggio Artistico Aurora'}
                    </h3>

                    <div className="small text-secondary lh-sm" style={{ fontSize: '0.82rem' }}>
                      <div className="text-dark">
                        <i className="bi bi-geo-alt me-1"></i>
                        {associazione.indirizzo}, {associazione.cap} {associazione.comune} ({associazione.provincia})
                      </div>
                      <div className="mt-1">
                        <strong>Codice Fiscale:</strong> <span className="font-monospace fw-bold text-dark">{associazione.codice_fiscale}</span>
                        {associazione.partita_iva && (
                          <span className="ms-3">
                            <strong>P.IVA:</strong> <span className="font-monospace text-dark">{associazione.partita_iva}</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <strong>Legale Rappresentante:</strong> {associazione.legale_rappresentante} (Presidente)
                      </div>
                      {(associazione.telefono || associazione.email) && (
                        <div className="mt-1">
                          {associazione.telefono && <span className="me-3"><strong>Tel:</strong> {associazione.telefono}</span>}
                          {associazione.email && <span><strong>Email:</strong> {associazione.email}</span>}
                        </div>
                      )}
                      {associazione.pec && (
                        <div className="mt-0 text-muted" style={{ fontSize: '0.76rem' }}>
                          <strong>PEC:</strong> {associazione.pec}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Riquadro Federazione / Registri Ufficiali (Pulito, senza colori per la stampa) */}
                  <div className="col-5 d-flex justify-content-end">
                    <div
                      style={{
                        border: '1.5px solid #212529',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        padding: '10px 12px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '250px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className="fw-bold text-dark mb-1 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.03em' }}>
                        FEDERAZIONE FISR
                      </div>
                      <div className="text-muted lh-tight" style={{ fontSize: '0.7rem' }}>
                        Federazione Italiana Sport Rotellistici
                      </div>
                      
                      <div
                        className="mt-1 pt-1 border-top fw-bold text-dark"
                        style={{ fontSize: '0.74rem' }}
                      >
                        Cod. Società FISR: {associazione.codice_affiliazione_fisr || '3942'}
                      </div>

                      <div
                        className="mt-1 text-dark border p-1 rounded"
                        style={{
                          borderColor: '#495057',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      >
                        Reg. Naz. RASD / CONI: {associazione.registro_rasd || 'RASD-RM-048291'}
                      </div>

                      {epsList.length > 0 && (
                        <div className="mt-1 pt-1 border-top" style={{ fontSize: '0.7rem' }}>
                          <span className="text-muted">Affiliaz. EPS: </span>
                          <strong className="text-dark">{epsList.map(e => e.sigla).join(' • ')}</strong>
                        </div>
                      )}

                      <div className="text-dark fw-semibold mt-1" style={{ fontSize: '0.72rem' }}>
                        Anno Sportivo {annoAttivo ? annoAttivo.anno : '2024/2025'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENUTO 1: RICEVUTA DI PAGAMENTO FISCALMENTE CONFORME (ART. 15 TUIR / DM 28/03/2007) */}
              {tipoDocumento === 'ricevuta' && (
                <div>
                  {/* Titolo e Intestazione Fiscale */}
                  <div
                    style={{
                      borderBottom: '2px solid #212529',
                      paddingBottom: '12px',
                      marginBottom: '16px'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div
                          style={{
                            display: 'inline-block',
                            border: '1.5px solid #212529',
                            color: '#111827',
                            backgroundColor: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            padding: '5px 12px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          Quietanza di Incasso e Attestazione Spesa Sportiva
                        </div>
                        <div className="text-dark fw-semibold small mt-2">
                          Valida ai fini della detrazione fiscale del 19% (Art. 15, c. 1, lett. i-quinquies, D.P.R. 917/1986 - D.M. 28/03/2007)
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.76rem' }}>
                          Operazione istituzionale de-commercializzata e fuori campo IVA ai sensi dell'art. 148 TUIR e art. 4 D.P.R. 633/1972.
                        </div>
                      </div>

                      <div className="text-end" style={{ minWidth: '160px' }}>
                        <div className="text-muted small text-uppercase fw-bold">Ricevuta N.</div>
                        <div
                          className="font-monospace fw-bold text-dark"
                          style={{ fontSize: '1.25rem' }}
                        >
                          {pagamento ? pagamento.ricevuta_numero : 'RIC-2024-0001'}
                        </div>
                        <div className="small text-dark mt-1">
                          <strong>Data Incasso:</strong> {pagamento ? pagamento.data_pagamento : dataOggi}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quadro Anagrafico Fiscale Completo: Atleta Praticante & Genitore Pagatore (Obbligatorio per il 730) */}
                  <div
                    style={{
                      border: '1px solid #495057',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      padding: '12px 16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div className="row g-3">
                      {/* Colonna Sinistra: Atleta Praticante */}
                      <div className="col-6 border-end" style={{ borderColor: '#495057' }}>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            color: '#495057',
                            letterSpacing: '0.04em',
                            marginBottom: '4px'
                          }}
                        >
                          1. Ragazzo / Atleta Praticante (Beneficiario del Corso)
                        </div>
                        <div className="fs-6 fw-bold text-dark">
                          {persona ? `${persona.cognome} ${persona.nome}` : 'Atleta Tesserato'}
                        </div>
                        <div className="small text-dark mt-1">
                          <strong>Codice Fiscale:</strong> <span className="font-monospace fw-bold">{persona?.codice_fiscale}</span>
                        </div>
                        <div className="small text-muted mt-1">
                          Nato/a a: <strong>{persona?.luogo_nascita || '—'}</strong> il{' '}
                          <strong>{persona?.data_nascita ? new Date(persona.data_nascita).toLocaleDateString('it-IT') : '—'}</strong>
                        </div>
                        <div className="small text-muted">
                          Residente in: {persona?.indirizzo}, {persona?.citta}
                        </div>
                        <div className="small text-dark mt-1">
                          Tessera FISR/Sociale: <strong>{tesserato?.numero_tessera || 'TESS-001'}</strong> ({tesserato?.tipo_tesseramento || 'Atleta'})
                        </div>
                      </div>

                      {/* Colonna Destra: Soggetto Pagatore / Genitore Avente Diritto alla Detrazione */}
                      <div className="col-6">
                        <div
                          style={{
                            fontSize: '0.74rem',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            color: '#495057',
                            letterSpacing: '0.04em',
                            marginBottom: '4px'
                          }}
                        >
                          2. Soggetto Pagatore (Intestatario ai fini 730 / Unico)
                        </div>

                        {persona && persona.is_minorenne ? (
                          <div>
                            <div className="fs-6 fw-bold text-dark">
                              {persona.tutore_cognome || 'Genitore'} {persona.tutore_nome || ''}
                            </div>
                            <div className="small text-dark mt-1">
                              <strong>C.F. Pagatore (Detraente):</strong>{' '}
                              <span className="font-monospace fw-bold text-dark">
                                {persona.tutore_cf || 'NON INSERITO'}
                              </span>
                            </div>
                            <div className="small text-muted mt-1">
                              Titolo: <strong>{persona.tutore_relazione || 'Esercente la potestà genitoriale'}</strong>
                            </div>
                            <div className="small text-muted">
                              Telefono: {persona.tutore_telefono || persona.telefono || '—'}
                            </div>
                            <div
                              className="mt-2 text-dark border p-1 rounded"
                              style={{
                                borderColor: '#495057',
                                fontSize: '0.72rem'
                              }}
                            >
                              <i className="bi bi-info-circle me-1"></i>
                              Spesa detraibile nel Quadro E del Mod. 730 per ragazzi tra i 5 e i 18 anni.
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="fs-6 fw-bold text-dark">
                              {persona ? `${persona.cognome} ${persona.nome}` : 'Socio Atleta'}
                            </div>
                            <div className="small text-dark mt-1">
                              <strong>Codice Fiscale:</strong> <span className="font-monospace fw-bold">{persona?.codice_fiscale}</span>
                            </div>
                            <div className="small text-muted mt-1">
                              (Atleta maggiorenne / pagamento in proprio)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabella Dettaglio Contabile e Modalità Tracciata */}
                  <div className="mb-3">
                    <table
                      className="table table-bordered align-middle mb-0"
                      style={{ borderColor: '#495057' }}
                    >
                      <thead style={{ backgroundColor: '#f8f9fa', color: '#111827' }}>
                        <tr style={{ fontSize: '0.82rem', textTransform: 'uppercase' }}>
                          <th style={{ width: '55%' }}>Descrizione dell'Attività Sportiva Dilettantistica</th>
                          <th className="text-center" style={{ width: '22%' }}>Modalità Pagamento</th>
                          <th className="text-end" style={{ width: '23%' }}>Importo Versato</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: 'top', padding: '10px 12px' }}>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                              {pagamento ? pagamento.causale : 'Quota Iscrizione e Frequenza Corso Pattinaggio Artistico'}
                            </div>
                            <div className="text-secondary small mt-1" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                              Causale Fiscale: Corrispettivo specifico versato da socio/tesserato per la frequenza dell'attività sportiva dilettantistica continuativa e per il tesseramento alla <strong>Federazione Italiana Sport Rotellistici (FISR)</strong>.
                            </div>
                            {pagamento?.note && (
                              <div className="text-muted fst-italic small mt-1" style={{ fontSize: '0.78rem' }}>
                                Annotazioni: {pagamento.note}
                              </div>
                            )}
                          </td>

                          <td className="text-center" style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                            <div
                              style={{
                                display: 'inline-block',
                                border: '1px solid #212529',
                                color: '#111827',
                                backgroundColor: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {pagamento ? pagamento.metodo_pagamento : 'BONIFICO'}
                            </div>
                            {pagamento && (pagamento.metodo_pagamento === 'bonifico' || pagamento.metodo_pagamento === 'pos' || pagamento.metodo_pagamento === 'satispay') ? (
                              <div className="mt-1 text-dark fw-semibold" style={{ fontSize: '0.72rem' }}>
                                <i className="bi bi-check-circle me-1"></i>
                                Metodo Tracciabile (L. 160/2019)
                              </div>
                            ) : (
                              <div className="mt-1 text-dark fw-semibold" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Contanti (Non detraibile 730)
                              </div>
                            )}
                          </td>

                          <td className="text-end" style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                            <div className="fw-bold text-dark font-monospace" style={{ fontSize: '1.25rem' }}>
                              € {pagamento ? pagamento.importo.toFixed(2) : '80.00'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th colSpan={2} className="text-end text-uppercase" style={{ fontSize: '0.85rem' }}>
                            Totale Complessivo Quietanzato:
                          </th>
                          <th
                            className="text-end font-monospace fw-bold text-dark"
                            style={{ fontSize: '1.25rem' }}
                          >
                            € {pagamento ? pagamento.importo.toFixed(2) : '80.00'}
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Note Giuridiche, Bollo e Firma per Quietanza */}
                  <div
                    style={{
                      border: '1px solid #495057',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      padding: '12px 16px',
                      marginBottom: '10px'
                    }}
                  >
                    <div className="row align-items-end">
                      <div className="col-7">
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>
                          Dichiarazione di Trasparenza Fiscale (Art. 15 DPR 917/1986 & D.M. 28/03/2007):
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.73rem', lineHeight: '1.35' }}>
                          Si attesta che la somma sopra indicata è stata interamente riscossa per l'esercizio della pratica sportiva dilettantistica non professionale del beneficiario.
                        </div>
                        <div className="text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                          <strong>Imposta di bollo:</strong> Esente da imposta di bollo ai sensi dell'art. 27-bis della Tabella B allegata al D.P.R. 26/10/1972 n. 642 (Atti e documenti posti in essere da Associazioni e Società Sportive Dilettantistiche iscritte al Registro Nazionale).
                        </div>
                      </div>

                      <div className="col-5 text-end">
                        <div className="small text-muted">Per quietanza e attestazione:</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                          {associazione.denominazione}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          Il Legale Rappresentante: <strong>{associazione.legale_rappresentante}</strong>
                        </div>
                        <div
                          className="mt-4 pt-3 border-bottom d-inline-block"
                          style={{ width: '200px', borderColor: '#495057' }}
                        ></div>
                        <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          Timbro societario e firma
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENUTO 2: MODULO UFFICIALE DI ISCRIZIONE, AMMISSIONE A SOCIO E TESSERAMENTO CON INFORMATIVA PRIVACY */}
              {tipoDocumento === 'domanda_iscrizione' && persona && (
                <div>
                  {/* Titolo Principale Documento */}
                  <div className="text-center pb-2 mb-3 border-bottom" style={{ borderColor: '#212529', borderBottomWidth: '2px' }}>
                    <h4 className="fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.03em', fontSize: '1.25rem', color: '#111827' }}>
                      Domanda di Iscrizione, Ammissione a Socio e Tesseramento
                    </h4>
                    <div className="fw-semibold text-uppercase" style={{ fontSize: '0.85rem', color: '#374151' }}>
                      Anno Sportivo {annoAttivo ? annoAttivo.anno : '2024/2025'} &bull; Disciplina: {associazione.disciplina || 'Pattinaggio Artistico a Rotelle'}
                    </div>
                  </div>

                  {/* Indirizzamento formale al Consiglio Direttivo */}
                  <div className="mb-3 small" style={{ lineHeight: '1.45', fontSize: '0.82rem' }}>
                    Al Consiglio Direttivo dell'Associazione Sportiva Dilettantistica <strong>{associazione.denominazione}</strong>
                    <br />
                    Con sede in {associazione.indirizzo}, {associazione.cap} {associazione.comune} ({associazione.provincia}) - C.F. {associazione.codice_fiscale}
                    {associazione.partita_iva && ` - P.IVA ${associazione.partita_iva}`}
                    <br />
                    Affiliata FISR (Cod. {associazione.codice_affiliazione_fisr || '3942'}) {epsList.length > 0 && `• Affiliata EPS: ${epsList.map(e => e.sigla).join(', ')}`} • Iscritta al Registro Naz. RASD / Dipartimento per lo Sport ({associazione.registro_rasd || 'RASD-RM-048291'})
                  </div>

                  {/* SEZIONE 1: DATI ANAGRAFICI DELL'ATLETA / SOCIO */}
                  <div className="mb-3" style={{ border: '1px solid #374151', borderRadius: '4px' }}>
                    <div className="px-3 py-1 fw-bold text-uppercase border-bottom" style={{ backgroundColor: '#f3f4f6', fontSize: '0.78rem', borderColor: '#374151' }}>
                      1. Dati Anagrafici dell'Atleta / Richiedente
                    </div>
                    <div className="p-3">
                      <div className="row g-2" style={{ fontSize: '0.82rem' }}>
                        <div className="col-7">
                          <strong>Cognome e Nome:</strong> <span className="fw-bold text-uppercase">{persona.cognome} {persona.nome}</span>
                        </div>
                        <div className="col-5">
                          <strong>Codice Fiscale:</strong> <span className="font-monospace fw-bold">{persona.codice_fiscale}</span>
                        </div>
                        <div className="col-7">
                          <strong>Nato/a a:</strong> {persona.luogo_nascita || '—'} il {persona.data_nascita ? new Date(persona.data_nascita).toLocaleDateString('it-IT') : '—'}
                        </div>
                        <div className="col-5">
                          <strong>Sesso:</strong> {persona.codice_fiscale && persona.codice_fiscale.length >= 11 && parseInt(persona.codice_fiscale.substring(9, 11), 10) > 40 ? 'F' : 'M'} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Cittadinanza:</strong> Italiana
                        </div>
                        <div className="col-7">
                          <strong>Residenza:</strong> {persona.indirizzo}, {persona.citta}
                        </div>
                        <div className="col-5">
                          <strong>Stato Atleta:</strong> {persona.is_minorenne ? 'Minorenne' : 'Maggiorenne'}
                        </div>
                        <div className="col-7">
                          <strong>Recapito Telefonico:</strong> {persona.telefono || '—'}
                        </div>
                        <div className="col-5">
                          <strong>Email:</strong> {persona.email || '—'}
                        </div>
                        <div className="col-12 pt-1 border-top mt-1" style={{ fontSize: '0.78rem' }}>
                          <strong>Corso / Gruppo di Attività:</strong>{' '}
                          <span className="fw-bold">
                            {gruppi.length > 0 ? gruppi.map(g => g.nome_gruppo).join(', ') : 'Pattinaggio Artistico a Rotelle (Avviamento / Corsi Sociali)'}
                          </span>
                          {tesserato && <span className="ms-3 text-muted">| N. Tessera: <strong>{tesserato.numero_tessera}</strong></span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEZIONE 2: ESERCENTE RESPONSABILITÀ GENITORIALE (PER MINORENNI) */}
                  {persona.is_minorenne && (
                    <div className="mb-3" style={{ border: '1px solid #374151', borderRadius: '4px' }}>
                      <div className="px-3 py-1 fw-bold text-uppercase border-bottom" style={{ backgroundColor: '#f3f4f6', fontSize: '0.78rem', borderColor: '#374151' }}>
                        2. Dati del Genitore / Tutore Esercente la Responsabilità Genitoriale
                      </div>
                      <div className="p-3">
                        <div className="row g-2" style={{ fontSize: '0.82rem' }}>
                          <div className="col-7">
                            <strong>Cognome e Nome Genitore:</strong> <span className="fw-bold text-uppercase">{persona.tutore_cognome || '—'} {persona.tutore_nome || '—'}</span>
                          </div>
                          <div className="col-5">
                            <strong>Codice Fiscale:</strong> <span className="font-monospace fw-bold">{persona.tutore_cf || '—'}</span>
                          </div>
                          <div className="col-7">
                            <strong>Grado di Parentela / Ruolo:</strong> {persona.tutore_relazione || 'Genitore / Tutore Legale'}
                          </div>
                          <div className="col-5">
                            <strong>Telefono Cellulare:</strong> {persona.tutore_telefono || persona.telefono || '—'}
                          </div>
                          {persona.tutore_email && (
                            <div className="col-12">
                              <strong>Email di Contatto:</strong> {persona.tutore_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEZIONE 3: RICHIESTA FORMALE E DICHIARAZIONI ASSOCIATIVE */}
                  <div className="mb-3" style={{ border: '1px solid #374151', borderRadius: '4px' }}>
                    <div className="px-3 py-1 fw-bold text-uppercase border-bottom" style={{ backgroundColor: '#f3f4f6', fontSize: '0.78rem', borderColor: '#374151' }}>
                      {persona.is_minorenne ? '3. Richiesta di Ammissione e Dichiarazioni' : '2. Richiesta di Ammissione e Dichiarazioni'}
                    </div>
                    <div className="p-3" style={{ fontSize: '0.76rem', lineHeight: '1.45', color: '#1f2937' }}>
                      <p className="mb-2">
                        Il/La sottoscritto/a, con la presente, <strong>CHIEDE</strong> l'ammissione a socio dell'A.S.D. <strong>{associazione.denominazione}</strong> e il conseguente tesseramento presso la <strong>Federazione Italiana Sport Rotellistici (FISR)</strong> e/o gli Enti di Promozione Sportiva a cui la società è affiliata per l'Anno Sportivo <strong>{annoAttivo ? annoAttivo.anno : '2024/2025'}</strong> per la pratica del Pattinaggio Artistico a Rotelle.
                      </p>
                      <p className="mb-2">
                        A tal fine, sotto la propria personale responsabilità, <strong>DICHIARA E SI IMPEGNA A</strong>:
                      </p>
                      <ul className="mb-0 ps-3">
                        <li className="mb-1">
                          Aver preso attenta visione dello <strong>Statuto Sociale</strong>, dei regolamenti interni e dei regolamenti federali FISR / EPS / CONI / RASD, di condividerne le finalità istituzionali senza scopo di lucro e di accettarli incondizionatamente in ogni loro parte.
                        </li>
                        <li className="mb-1">
                          Corrispondere puntualmente la quota associativa annua e le quote periodiche deliberate dal Consiglio Direttivo presieduto dal Legale Rappresentante <strong>{associazione.legale_rappresentante}</strong> per la frequenza delle attività e corsi.
                        </li>
                        <li className="mb-1">
                          Consegnare tempestivamente alla segreteria, <strong>prima dell'inizio delle attività in pista</strong>, idoneo <strong>certificato medico</strong> di idoneità all'attività sportiva (non agonistica con ECG o agonistica Tab. B1 per il pattinaggio artistico) in corso di validità, consapevole che in difetto non sarà consentito l'accesso agli allenamenti né la copertura assicurativa sportiva.
                        </li>
                        <li className="mb-0">
                          Rispettare le disposizioni di sicurezza degli impianti sportivi, sollevando la Società e i suoi tecnici/dirigenti da ogni responsabilità per infortuni o danni a persone o cose provocati dal mancato rispetto dei regolamenti o da condotte imprudenti.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* SEZIONE 4: INFORMATIVA E CONSENSO PRIVACY (GDPR - REGOLAMENTO UE 2016/679) */}
                  <div className="mb-3" style={{ border: '1px solid #374151', borderRadius: '4px' }}>
                    <div className="px-3 py-1 fw-bold text-uppercase border-bottom" style={{ backgroundColor: '#f3f4f6', fontSize: '0.78rem', borderColor: '#374151' }}>
                      Informativa e Consenso al Trattamento dei Dati Personali (GDPR - Reg. UE 2016/679)
                    </div>
                    <div className="p-3" style={{ fontSize: '0.74rem', lineHeight: '1.4', color: '#1f2937' }}>
                      <p className="mb-2">
                        <strong>Titolare del trattamento:</strong> A.S.D. {associazione.denominazione}, con sede in {associazione.indirizzo}, {associazione.cap} {associazione.comune} ({associazione.provincia}), C.F. {associazione.codice_fiscale}, in persona del Legale Rappresentante pro-tempore {associazione.legale_rappresentante}. I dati personali, anagrafici e sanitari forniti sono trattati nel pieno rispetto dei principi di correttezza, liceità e trasparenza previsti dal Regolamento UE 2016/679 (GDPR).
                      </p>

                      {/* Box Consensi con Caselle di Spunta Stampabili */}
                      <div className="border p-2 rounded mb-2" style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div>
                            <strong>A) Gestione Associativa, Tesseramento Federale e Copertura Assicurativa (Obbligatorio per legge e statuto):</strong>
                            <div className="text-secondary" style={{ fontSize: '0.71rem' }}>
                              Trattamento dei dati anagrafici e fiscali per la gestione del libro soci, tesseramento alla Federazione Italiana Sport Rotellistici (FISR), Enti di Promozione Sportiva (EPS), iscrizione al Registro Nazionale RASD / Dipartimento per lo Sport e attivazione delle polizze infortuni/RCT obbligatorie.
                            </div>
                          </div>
                          <div className="text-nowrap ms-3 fw-bold font-monospace pt-1" style={{ fontSize: '0.78rem' }}>
                            [ X ] ACCONSENTO &nbsp;&nbsp; [ &nbsp; ] NON ACCONSENTO
                          </div>
                        </div>
                      </div>

                      <div className="border p-2 rounded mb-2" style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div>
                            <strong>B) Trattamento Dati Sanitari e Certificazione Medica di Idoneità Sportiva (Art. 9 GDPR):</strong>
                            <div className="text-secondary" style={{ fontSize: '0.71rem' }}>
                              Trattamento dei dati relativi allo stato di salute e conservazione del certificato medico di idoneità all'attività sportiva per le finalità di tutela sanitaria previste dalla legge.
                            </div>
                          </div>
                          <div className="text-nowrap ms-3 fw-bold font-monospace pt-1" style={{ fontSize: '0.78rem' }}>
                            [ X ] ACCONSENTO &nbsp;&nbsp; [ &nbsp; ] NON ACCONSENTO
                          </div>
                        </div>
                      </div>

                      <div className="border p-2 rounded mb-2" style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div>
                            <strong>C) Liberatoria Riprese Fotografiche, Video e Utilizzo Immagini Istituzionali:</strong>
                            <div className="text-secondary" style={{ fontSize: '0.71rem' }}>
                              Autorizzazione a riprese foto/video durante allenamenti, saggi, esibizioni, rassegne e gare FISR/EPS per pubblicazione sul sito web, social network ufficiali societari, materiale divulgativo e archivio storico della società, escluso qualsiasi uso commerciale a terzi.
                            </div>
                          </div>
                          <div className="text-nowrap ms-3 fw-bold font-monospace pt-1" style={{ fontSize: '0.78rem' }}>
                            [ X ] ACCONSENTO &nbsp;&nbsp; [ &nbsp; ] NON ACCONSENTO
                          </div>
                        </div>
                      </div>

                      <div className="border p-2 rounded" style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>D) Comunicazioni Istituzionali e Organizzative di Servizio (WhatsApp / SMS / Email):</strong>
                            <div className="text-secondary" style={{ fontSize: '0.71rem' }}>
                              Ricezione di comunicazioni di servizio inerenti orari corsi, variazioni pista, convocazioni alle gare, manifestazioni ed eventi societari.
                            </div>
                          </div>
                          <div className="text-nowrap ms-3 fw-bold font-monospace pt-1" style={{ fontSize: '0.78rem' }}>
                            [ X ] ACCONSENTO &nbsp;&nbsp; [ &nbsp; ] NON ACCONSENTO
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEZIONE 5: QUADRO DELLE FIRME */}
                  <div className="mb-3" style={{ border: '1px solid #374151', borderRadius: '4px' }}>
                    <div className="px-3 py-1 fw-bold text-uppercase border-bottom" style={{ backgroundColor: '#f3f4f6', fontSize: '0.78rem', borderColor: '#374151' }}>
                      Sottoscrizione e Firme
                    </div>
                    <div className="p-3">
                      <div className="row g-3">
                        <div className="col-4">
                          <div className="small text-muted">Luogo e Data:</div>
                          <div className="fw-bold mt-1" style={{ fontSize: '0.85rem' }}>{associazione.comune}, {dataOggi}</div>
                        </div>

                        <div className="col-4 text-center">
                          <div className="small text-muted">Firma Richiesta Iscrizione e Statuto:</div>
                          <div className="mt-4 pt-3 border-bottom mx-auto" style={{ width: '85%', borderColor: '#111827' }}></div>
                          <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                            {persona.is_minorenne ? 'Firma del Genitore / Tutore Legale' : 'Firma del Socio / Atleta'}
                          </div>
                        </div>

                        <div className="col-4 text-center">
                          <div className="small text-muted">Firma Consensi Privacy e Foto (GDPR):</div>
                          <div className="mt-4 pt-3 border-bottom mx-auto" style={{ width: '85%', borderColor: '#111827' }}></div>
                          <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                            {persona.is_minorenne ? 'Firma del Genitore / Tutore Legale' : 'Firma del Socio / Atleta'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEZIONE 6: PARTE RISERVATA AL CONSIGLIO DIRETTIVO DELL'ASSOCIAZIONE */}
                  <div style={{ border: '1px solid #374151', borderRadius: '4px' }}>
                    <div className="px-3 py-1 fw-bold text-uppercase border-bottom" style={{ backgroundColor: '#f3f4f6', fontSize: '0.78rem', borderColor: '#374151' }}>
                      Spazio Riservato al Consiglio Direttivo dell'Associazione
                    </div>
                    <div className="p-3">
                      <div className="row align-items-center" style={{ fontSize: '0.78rem' }}>
                        <div className="col-4">
                          <div>Domanda ricevuta in data: <strong>{dataOggi}</strong></div>
                          <div className="mt-1">
                            Esito Delibera: <strong>[ X ] ACCOLTA &nbsp;&nbsp; [ &nbsp; ] RESPINTA</strong>
                          </div>
                          <div className="mt-1">
                            Verbale del C.D. n.: <strong>______ / {new Date().getFullYear()}</strong>
                          </div>
                        </div>
                        <div className="col-4">
                          <div>N. Tessera FISR/EPS: <strong>{tesserato?.numero_tessera || '________________'}</strong></div>
                          <div className="mt-1">Anno Sportivo: <strong>{annoAttivo ? annoAttivo.anno : '2024/2025'}</strong></div>
                          <div className="mt-1">Certificato Medico: <strong>[ &nbsp; ] Presentato &nbsp; [ &nbsp; ] In attesa</strong></div>
                        </div>
                        <div className="col-4 text-end">
                          <div className="small text-muted">Il Presidente / Legale Rappresentante:</div>
                          <div className="fw-bold text-dark mt-1">{associazione.legale_rappresentante}</div>
                          <div className="mt-3 pt-3 border-bottom d-inline-block" style={{ width: '180px', borderColor: '#111827' }}></div>
                          <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>Timbro A.S.D. e Firma</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENUTO 3: RICHIESTA CERTIFICATO MEDICO SPORTIVO (Monocromatico, senza riquadri colorati) */}
              {tipoDocumento === 'richiesta_certificato' && persona && (
                <div>
                  <div className="row mb-4">
                    <div className="col-7">
                      <div className="small text-muted">
                        Protocollo Richiesta N.: <strong>CERT-FISR-{new Date().getFullYear()}-{persona.id}</strong>
                      </div>
                      <div className="small text-muted">Data di emissione: <strong>{dataOggi}</strong></div>
                    </div>
                    <div className="col-5 text-end">
                      <div className="border p-2 rounded bg-white text-start small" style={{ borderColor: '#495057' }}>
                        <strong>Spett.le Medico Curante:</strong>
                        <div>Al Medico di Medicina Generale /</div>
                        <div>Al Pediatra di Libera Scelta /</div>
                        <div>Al Medico Specialista in Medicina dello Sport</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center my-4">
                    <h4 className="fw-bold text-uppercase border-bottom pb-2" style={{ borderColor: '#212529', color: '#111827' }}>
                      Richiesta di Certificato Medico per Attività Sportiva
                    </h4>
                    <div className="d-inline-block border border-dark px-3 py-1 rounded small fw-bold mt-1">
                      Disciplina: Pattinaggio Artistico a Rotelle (FISR / EPS)
                    </div>
                  </div>

                  <div className="my-4 small lh-lg">
                    <p>
                      La scrivente <strong>{associazione.denominazione}</strong>, con sede legale in{' '}
                      <strong>{associazione.indirizzo} - {associazione.cap} {associazione.comune} ({associazione.provincia})</strong>,
                      Codice Fiscale <strong>{associazione.codice_fiscale}</strong>
                      {associazione.partita_iva && `, Partita IVA ${associazione.partita_iva}`}, regolarmente affiliata alla{' '}
                      <strong>Federazione Italiana Sport Rotellistici (FISR - Cod. {associazione.codice_affiliazione_fisr || '3942'})</strong> ed agli Enti di Promozione Sportiva riconosciuti dal CONI, in persona del Legale Rappresentante{' '}
                      <strong>{associazione.legale_rappresentante}</strong>:
                    </p>

                    <div className="p-3 bg-white border rounded my-3" style={{ borderColor: '#495057' }}>
                      <div className="fs-6 fw-bold text-dark mb-2">ATTESTA CHE:</div>
                      <div>
                        L'atleta <strong>{persona.cognome} {persona.nome}</strong>,
                        {persona.is_minorenne && persona.tutore_nome && (
                          <span> (rappresentato/a dal genitore {persona.tutore_cognome} {persona.tutore_nome}),</span>
                        )}
                        {' '}nato/a a <strong>{persona.luogo_nascita}</strong> il{' '}
                        <strong>{new Date(persona.data_nascita).toLocaleDateString('it-IT')}</strong>,
                        residente in <strong>{persona.indirizzo}, {persona.citta}</strong>,
                        Codice Fiscale <strong className="font-monospace">{persona.codice_fiscale}</strong>:
                      </div>
                      <div className="mt-2 fw-semibold">
                        &bull; È regolarmente iscritto/tesserato presso la nostra associazione per l'Anno Sportivo{' '}
                        {annoAttivo ? annoAttivo.anno : '2024/2025'}{' '}
                        {tesserato ? `(Tessera n. ${tesserato.numero_tessera})` : ''};
                      </div>
                      <div className="fw-semibold">
                        &bull; Pratica la disciplina:{' '}
                        <span className="text-dark fw-bold">
                          {gruppi.length > 0 ? gruppi.map((g) => g.nome_gruppo).join(', ') : 'Pattinaggio Artistico a Rotelle (Corsi e Allenamenti)'}
                        </span>.
                      </div>
                    </div>

                    <div className="text-center my-3 fw-bold fs-6">
                      PERTANTO SI RICHIEDE IL RILASCIO DEL:
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-6">
                        <div
                          style={{
                            border: '1.5px solid #212529',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            padding: '12px 14px',
                            textAlign: 'center',
                            height: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div className="fw-bold mb-1 text-dark text-uppercase" style={{ fontSize: '0.92rem' }}>
                            CERTIFICATO NON AGONISTICO
                          </div>
                          <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                            Ai sensi del D.M. 24/04/2013 e s.m.i.
                          </div>
                          <div className="text-dark small mt-2" style={{ fontSize: '0.74rem', lineHeight: '1.35' }}>
                            (con elettrocardiogramma ECG a riposo per atleti promozionali, avviamento e corsi formativi)
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div
                          style={{
                            border: '1.5px solid #212529',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            padding: '12px 14px',
                            textAlign: 'center',
                            height: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div className="fw-bold mb-1 text-dark text-uppercase" style={{ fontSize: '0.92rem' }}>
                            CERTIFICATO AGONISTICO FISR (TAB. B1)
                          </div>
                          <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                            Ai sensi del D.M. 18/02/1982 - Sport Rotellistici
                          </div>
                          <div className="text-dark small mt-2" style={{ fontSize: '0.74rem', lineHeight: '1.35' }}>
                            (per atleti agonisti partecipanti a campionati provinciali, regionali e nazionali FISR)
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted">
                      Si rilascia la presente attestazione su richiesta dell'interessato per gli usi consentiti dalla legge al fine del tesseramento e della tutela sanitaria delle attività sportive su rotelle.
                    </p>
                  </div>

                  {/* Firma e Timbro */}
                  <div className="row g-4 pt-4 border-top mt-5" style={{ borderColor: '#495057' }}>
                    <div className="col-6">
                      <div className="small text-muted">Luogo e Data:</div>
                      <div className="fw-bold">{associazione.comune}, {dataOggi}</div>
                      <div className="mt-3 small text-muted">Timbro Associazione Sportiva:</div>
                      <div
                        className="border border-dashed rounded p-3 text-center text-muted small mt-1"
                        style={{ height: '70px', borderColor: '#495057' }}
                      >
                        [ Timbro {associazione.denominazione} ]
                      </div>
                    </div>

                    <div className="col-6 text-end">
                      <div className="small text-muted">Il Legale Rappresentante:</div>
                      <div className="fs-6 fw-bold text-dark mt-1">{associazione.legale_rappresentante}</div>
                      <div className="small text-muted">Presidente {associazione.denominazione}</div>
                      <div className="mt-4 pt-3 border-bottom d-inline-block" style={{ width: '220px', borderColor: '#212529' }}></div>
                      <div className="small text-muted">Firma</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER DEL MODAL (Nascosto in stampa) */}
          <div className="modal-footer bg-white d-print-none d-flex justify-content-between p-3">
            <div className="text-muted small">
              <i className="bi bi-info-circle me-1"></i>
              I dati dell'Associazione (denominazione, C.F., P.IVA, indirizzo, legale rappresentante, FISR ed EPS) sono gestibili in <strong>Dati Associazione</strong>.
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Chiudi
              </button>
              
              <button
                type="button"
                className="btn btn-success fw-bold d-flex align-items-center gap-1 shadow-sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    <span>Download PDF...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill me-1"></i>
                    <span>Scarica PDF A4</span>
                  </>
                )}
              </button>

              <button type="button" className="btn btn-primary fw-bold" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Stampa
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
