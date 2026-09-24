import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Associazione, Anno, Quota, SpesaPrevisionale, Gruppo, CategoriaSpesa } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  associazione: Associazione;
  annoAttivo?: Anno;
  quote: Quota[];
  spese: SpesaPrevisionale[];
  gruppi: Gruppo[];
  variazioneQuotePercentuale?: number;
  variazioneSpesePercentuale?: number;
}

export const StampaProspettoCdModal: React.FC<Props> = ({
  isOpen,
  onClose,
  associazione,
  annoAttivo,
  quote,
  spese,
  gruppi,
  variazioneQuotePercentuale = 0,
  variazioneSpesePercentuale = 0
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

  const stagioneNome = annoAttivo?.anno || '2024/2025';

  // Helper per nomi dei mesi
  const formatMese = (m: string) => {
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  // Mesi della stagione sportiva da Settembre a Maggio (o Giugno)
  const tuttiMesi = [
    '2024-09',
    '2024-10',
    '2024-11',
    '2024-12',
    '2025-01',
    '2025-02',
    '2025-03',
    '2025-04',
    '2025-05'
  ];

  // Calcolo piano finanziario mensile
  let progressivoCassa = 0;
  const pianoMesi = tuttiMesi.map((m) => {
    const quoteMese = quote.filter(
      (q) => (q.mese_riferimento || q.data_scadenza.substring(0, 7)) === m && q.stato !== 'annullata'
    );
    const entrateBase = quoteMese.reduce((sum, q) => sum + q.importo, 0);
    const incassatoEffettivo = quoteMese.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
    const residuoDaIncassare = entrateBase - incassatoEffettivo;

    const speseMese = spese.filter((s) => {
      if (s.ricorrente) return true;
      return s.mesi.includes(m);
    });
    const usciteBase = speseMese.reduce((sum, s) => sum + s.importo_mensile, 0);

    const entrateSimulate = entrateBase * (1 + variazioneQuotePercentuale / 100);
    const usciteSimulate = usciteBase * (1 + variazioneSpesePercentuale / 100);
    const saldoMese = entrateSimulate - usciteSimulate;
    progressivoCassa += saldoMese;

    return {
      mese: m,
      label: formatMese(m),
      quoteCount: quoteMese.length,
      entrateBase,
      entrateSimulate,
      incassatoEffettivo,
      residuoDaIncassare,
      speseCount: speseMese.length,
      usciteBase,
      usciteSimulate,
      saldoMese,
      progressivoCassa
    };
  });

  const totaleEntrateStagione = pianoMesi.reduce((sum, p) => sum + p.entrateSimulate, 0);
  const totaleUsciteStagione = pianoMesi.reduce((sum, p) => sum + p.usciteSimulate, 0);
  const saldoFinaleStagione = totaleEntrateStagione - totaleUsciteStagione;
  const totaleIncassatoReale = pianoMesi.reduce((sum, p) => sum + p.incassatoEffettivo, 0);
  const totaleResiduoReale = pianoMesi.reduce((sum, p) => sum + p.residuoDaIncassare, 0);
  const tassoCopertura = totaleUsciteStagione > 0 ? (totaleEntrateStagione / totaleUsciteStagione) * 100 : 100;

  // Calcolo ripartizione spese per categoria
  const CATEGORIE_SPESA: CategoriaSpesa[] = [
    'Affitto Impianti / Pista',
    'Compensi Tecnici / Allenatori',
    'Tesseramenti & Affiliazioni (FISR/EPS)',
    'Assicurazioni',
    'Materiale Sportivo & Divise',
    'Gare & Trasferte',
    'Amministrazione & Commercialista',
    'Altro'
  ];

  const spesePerCategoria = CATEGORIE_SPESA.map((cat) => {
    const speseCat = spese.filter((s) => s.categoria === cat);
    let totaleAnnoCat = 0;
    for (const m of tuttiMesi) {
      for (const s of speseCat) {
        if (s.ricorrente || s.mesi.includes(m)) {
          totaleAnnoCat += s.importo_mensile;
        }
      }
    }
    return {
      categoria: cat,
      totale: totaleAnnoCat,
      percentuale: totaleUsciteStagione > 0 ? Math.round((totaleAnnoCat / totaleUsciteStagione) * 100) : 0,
      count: speseCat.length
    };
  }).filter((c) => c.totale > 0);

  // Nome file PDF
  const getPdfFilename = () => {
    const safeDenom = associazione.denominazione.replace(/[^a-zA-Z0-9]/g, '_');
    const safeStagione = stagioneNome.replace(/[^a-zA-Z0-9]/g, '_');
    return `Prospetto_CD_Previsioni_${safeDenom}_${safeStagione}.pdf`;
  };

  // Generazione e download PDF A4 con supporto multi-pagina
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    setPrintErrorNotice(false);

    try {
      const element = document.getElementById('prospetto-cd-stampa-a4');
      if (!element) {
        alert('Elemento da stampare non trovato.');
        setIsGeneratingPdf(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210; // mm
      const pageHeight = 297; // mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 2) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(getPdfFilename());
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 5000);
    } catch (err) {
      console.error('Errore creazione PDF:', err);
      alert('Si è verificato un errore durante la generazione del file PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Stampa standard del browser
  const handlePrint = () => {
    try {
      const isIframe = window.self !== window.top;
      if (isIframe) {
        setPrintErrorNotice(true);
      }
      window.print();
    } catch (e) {
      console.warn('window.print() non consentito:', e);
      setPrintErrorNotice(true);
    }
  };

  // Apri finestra autonoma per stampa se consentito
  const handleOpenPrintWindow = () => {
    const element = document.getElementById('prospetto-cd-stampa-a4');
    if (!element) return;

    try {
      const printWindow = window.open('', '_blank', 'width=950,height=1150');
      if (!printWindow) {
        handleDownloadPdf();
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prospetto CD Previsione Incassi e Spese - ${associazione.denominazione}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
            <style>
              body { background: #ffffff; color: #212529; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
              @page { size: A4; margin: 10mm 12mm; }
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
              }, 400);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      console.warn('Popup bloccato:', e);
      handleDownloadPdf();
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* HEADER MODALE (Nascosto in stampa) */}
          <div className="modal-header bg-dark text-white d-print-none py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-bar-graph-fill text-warning fs-4"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">
                  Prospetto Finanziario Previsionale per il Consiglio Direttivo
                </h5>
                <small className="text-white-50">
                  {associazione.denominazione} &bull; Stagione Sportiva {stagioneNome}
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Scarica PDF */}
              <button
                type="button"
                className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-2 px-3 shadow-sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Genera e scarica il file PDF A4 ad alta risoluzione"
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Generazione PDF in corso...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill fs-6"></i>
                    <span>Scarica PDF Ufficiale A4</span>
                  </>
                )}
              </button>

              {/* Stampa Browser */}
              <button
                type="button"
                className="btn btn-outline-light btn-sm fw-semibold d-flex align-items-center gap-2 px-3"
                onClick={handlePrint}
                title="Invia alla stampante del computer"
              >
                <i className="bi bi-printer fs-6"></i>
                <span>Stampa</span>
              </button>

              {/* Chiudi */}
              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Chiudi"
              ></button>
            </div>
          </div>

          {/* AVVISO ANTEPRIMA & IFRAME */}
          <div className="bg-light border-bottom p-2 px-4 d-print-none">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 small">
              <div className="text-muted d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-primary"></i>
                <span>
                  <strong>Documento Ufficiale per il C.D.:</strong> Puoi salvare il documento in PDF cliccando su <strong>"Scarica PDF Ufficiale A4"</strong>, oppure stamparlo direttamente su carta intestata.
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
                <span><strong>PDF generato con successo!</strong> Il file è stato salvato nei tuoi Download.</span>
              </div>
            )}

            {printErrorNotice && (
              <div className="alert alert-warning py-1 px-3 mb-0 mt-2 small d-flex align-items-center justify-content-between">
                <div>
                  <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                  <span>Finestra di stampa inibita dal browser: usa il pulsante verde <strong>"Scarica PDF Ufficiale A4"</strong> per salvare il prospetto.</span>
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

          {/* CORPO MODALE CON FOGLIO A4 */}
          <div className="modal-body p-3 p-md-4 bg-secondary-subtle printable-document-container">
            <div
              id="prospetto-cd-stampa-a4"
              className="bg-white p-4 p-md-5 mx-auto rounded shadow-sm border printable-paper"
              style={{
                maxWidth: '860px',
                color: '#1e293b',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* INTESTAZIONE UFFICIALE ASD */}
              <div className="row pb-3 mb-3 border-bottom border-dark border-2 align-items-center">
                <div className="col-8">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="p-2 bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-award-fill fs-5"></i>
                    </span>
                    <div>
                      <h4 className="fw-bold mb-0 text-dark text-uppercase tracking-wide" style={{ letterSpacing: '0.5px' }}>
                        {associazione.denominazione}
                      </h4>
                      <div className="small text-muted fw-semibold">
                        Associazione Sportiva Dilettantistica &bull; {associazione.disciplina || 'Pattinaggio Artistico a Rotelle'}
                      </div>
                    </div>
                  </div>

                  <div className="small text-secondary mt-2" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                    <div>
                      <strong>Sede Legale:</strong> {associazione.indirizzo} - {associazione.cap} {associazione.comune} ({associazione.provincia})
                    </div>
                    <div>
                      <strong>C.F.:</strong> {associazione.codice_fiscale}
                      {associazione.partita_iva && <> &bull; <strong>P.IVA:</strong> {associazione.partita_iva}</>}
                      {(associazione.codice_affiliazione_fisr || associazione.codice_affiliazione) && (
                        <> &bull; <strong>Cod. FISR:</strong> {associazione.codice_affiliazione_fisr || associazione.codice_affiliazione}</>
                      )}
                      {associazione.registro_rasd && <> &bull; <strong>RASD:</strong> {associazione.registro_rasd}</>}
                    </div>
                    <div>
                      <strong>Email:</strong> {associazione.email || 'info@asdpattinaggio.it'}
                      {associazione.telefono && <> &bull; <strong>Tel:</strong> {associazione.telefono}</>}
                    </div>
                  </div>
                </div>

                <div className="col-4 text-end">
                  <div className="p-2 border border-2 border-primary rounded-3 bg-light text-center">
                    <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                      Documento Ufficiale C.D.
                    </div>
                    <div className="fw-bold text-primary fs-6">
                      PROSPETTO PREVISIONALE
                    </div>
                    <div className="small text-dark fw-semibold mt-1">
                      Stagione {stagioneNome}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Data: {dataOggi}
                    </div>
                  </div>
                </div>
              </div>

              {/* TITOLO DEL DOCUMENTO */}
              <div className="text-center my-3 pb-2 border-bottom">
                <h4 className="fw-bold text-dark mb-1 text-uppercase">
                  Previsione Incassi Quote & Budget di Spesa
                </h4>
                <p className="text-muted small mb-0">
                  Documento di pianificazione economica e verifica sostenibilità per la stagione sportiva {stagioneNome}
                </p>
              </div>

              {/* 1. QUADRO SINTESI ECONOMICO-FINANZIARIA */}
              <div className="mb-4">
                <h6 className="fw-bold text-uppercase text-secondary border-start border-3 border-primary ps-2 mb-3" style={{ fontSize: '0.88rem' }}>
                  1. Quadro di Sintesi Economico-Finanziaria
                </h6>

                <div className="row g-2">
                  <div className="col-3">
                    <div className="p-2 rounded border bg-light">
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>ENTRATE QUOTE PREVISTE</div>
                      <div className="fs-5 fw-bold text-primary">€ {totaleEntrateStagione.toFixed(2)}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {quote.filter((q) => q.stato !== 'annullata').length} quote stagionali
                      </div>
                    </div>
                  </div>

                  <div className="col-3">
                    <div className="p-2 rounded border bg-light">
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>SPESE / COSTI PREVENTIVATI</div>
                      <div className="fs-5 fw-bold text-danger">€ {totaleUsciteStagione.toFixed(2)}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {spese.length} voci di spesa previste
                      </div>
                    </div>
                  </div>

                  <div className="col-3">
                    <div className={`p-2 rounded border ${saldoFinaleStagione >= 0 ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>MARGINE PREVISIONALE</div>
                      <div className={`fs-5 fw-bold ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                        {saldoFinaleStagione >= 0 ? '+' : ''}€ {saldoFinaleStagione.toFixed(2)}
                      </div>
                      <div className="fw-semibold" style={{ fontSize: '0.7rem', color: saldoFinaleStagione >= 0 ? '#15803d' : '#b91c1c' }}>
                        {saldoFinaleStagione >= 0 ? 'In Utile / Surplus' : 'Disavanzo / Deficit'}
                      </div>
                    </div>
                  </div>

                  <div className="col-3">
                    <div className="p-2 rounded border bg-light">
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>COPERTURA DEI COSTI</div>
                      <div className="fs-5 fw-bold text-dark">{tassoCopertura.toFixed(1)}%</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {tassoCopertura >= 100 ? 'Totale autosufficienza' : 'Fabbisogno integrativo'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-light rounded border text-muted small d-flex justify-content-between" style={{ fontSize: '0.78rem' }}>
                  <span>
                    Stato incassi effettivi alla data: <strong className="text-success">€ {totaleIncassatoReale.toFixed(2)}</strong> già riscossi
                  </span>
                  <span>
                    Residuo ancora da incassare entro fine stagione: <strong className="text-dark">€ {totaleResiduoReale.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              {/* 2. PIANIFICAZIONE MENSILE DEI FLUSSI (CASH FLOW) */}
              <div className="mb-4">
                <h6 className="fw-bold text-uppercase text-secondary border-start border-3 border-primary ps-2 mb-2" style={{ fontSize: '0.88rem' }}>
                  2. Flusso di Cassa & Scadenziario Quote Mese per Mese
                </h6>

                <table className="table table-bordered table-sm align-middle mb-1" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light text-uppercase" style={{ fontSize: '0.72rem' }}>
                    <tr>
                      <th>Mese Riferimento</th>
                      <th className="text-center">Quote</th>
                      <th className="text-end">Entrate Quote</th>
                      <th className="text-end">Incassato</th>
                      <th className="text-end">Residuo</th>
                      <th className="text-end">Spese Mese</th>
                      <th className="text-end">Saldo Mese</th>
                      <th className="text-end">Cassa Cumulata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pianoMesi.map((p) => {
                      const isPositivo = p.saldoMese >= 0;
                      const isCassaPositiva = p.progressivoCassa >= 0;
                      return (
                        <tr key={p.mese}>
                          <td className="fw-semibold">{p.label}</td>
                          <td className="text-center">{p.quoteCount}</td>
                          <td className="text-end fw-bold text-primary">€ {p.entrateSimulate.toFixed(2)}</td>
                          <td className="text-end text-success">€ {p.incassatoEffettivo.toFixed(2)}</td>
                          <td className="text-end text-muted">€ {p.residuoDaIncassare.toFixed(2)}</td>
                          <td className="text-end fw-bold text-danger">€ {p.usciteSimulate.toFixed(2)}</td>
                          <td className={`text-end fw-bold ${isPositivo ? 'text-success' : 'text-danger'}`}>
                            {isPositivo ? '+' : ''}€ {p.saldoMese.toFixed(2)}
                          </td>
                          <td className={`text-end fw-bold ${isCassaPositiva ? 'text-dark' : 'text-danger'}`}>
                            {isCassaPositiva ? '+' : ''}€ {p.progressivoCassa.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-secondary fw-bold" style={{ fontSize: '0.82rem' }}>
                    <tr>
                      <td>TOTALE GENERALE</td>
                      <td className="text-center">{quote.filter((q) => q.stato !== 'annullata').length}</td>
                      <td className="text-end text-primary">€ {totaleEntrateStagione.toFixed(2)}</td>
                      <td className="text-end text-success">€ {totaleIncassatoReale.toFixed(2)}</td>
                      <td className="text-end text-muted">€ {totaleResiduoReale.toFixed(2)}</td>
                      <td className="text-end text-danger">€ {totaleUsciteStagione.toFixed(2)}</td>
                      <td className={`text-end ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                        {saldoFinaleStagione >= 0 ? '+' : ''}€ {saldoFinaleStagione.toFixed(2)}
                      </td>
                      <td className={`text-end ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                        {saldoFinaleStagione >= 0 ? '+' : ''}€ {saldoFinaleStagione.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  * Il prospetto mensile include le quote degli atleti iscritti ai corsi e le scadenze impostate nei gruppi sportivi.
                </div>
              </div>

              {/* 3. RIPARTIZIONE DEI COSTI PREVENTIVATI PER CATEGORIA */}
              <div className="mb-4">
                <h6 className="fw-bold text-uppercase text-secondary border-start border-3 border-primary ps-2 mb-2" style={{ fontSize: '0.88rem' }}>
                  3. Ripartizione Costi di Gestione per Categoria
                </h6>

                <div className="row g-3">
                  <div className="col-7">
                    <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                      <thead className="table-light text-uppercase" style={{ fontSize: '0.7rem' }}>
                        <tr>
                          <th>Categoria di Spesa</th>
                          <th className="text-center">Voci</th>
                          <th className="text-end">Totale Annuo</th>
                          <th className="text-end">Incidenza</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spesePerCategoria.map((cat) => (
                          <tr key={cat.categoria}>
                            <td className="fw-semibold">{cat.categoria}</td>
                            <td className="text-center">{cat.count}</td>
                            <td className="text-end fw-bold">€ {cat.totale.toFixed(2)}</td>
                            <td className="text-end">{cat.percentuale}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light fw-bold">
                        <tr>
                          <td colSpan={2}>TOTALE USCITE</td>
                          <td className="text-end text-danger">€ {totaleUsciteStagione.toFixed(2)}</td>
                          <td className="text-end">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="col-5">
                    <div className="p-3 bg-light rounded border h-100" style={{ fontSize: '0.78rem' }}>
                      <h6 className="fw-bold small text-dark mb-2">Note di Gestione Costi:</h6>
                      <ul className="ps-3 mb-0 text-secondary" style={{ lineHeight: '1.4' }}>
                        <li>
                          I costi per <strong>affitto pista</strong> e <strong>compensi tecnici</strong> costituiscono le principali uscite fisse dell'associazione.
                        </li>
                        <li className="mt-1">
                          Le coperture assicurative e le affiliazioni FISR/EPS devono essere saldate tempestivamente all'avvio dei corsi.
                        </li>
                        <li className="mt-1">
                          Tutte le spese preventivate sono coerenti con le finalità sportive istituzionali non a fini di lucro.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. VERBALE & FIRME DI APPROVAZIONE CONSIGLIO DIRETTIVO */}
              <div className="pt-3 border-top border-dark border-1">
                <div className="row">
                  <div className="col-7">
                    <div className="small fw-bold text-dark mb-1">Delibera del Consiglio Direttivo:</div>
                    <div className="small text-secondary" style={{ fontSize: '0.75rem' }}>
                      Il presente prospetto economico-finanziario previsionale è stato esaminato e discusso:
                    </div>
                    <div className="mt-2 small text-dark">
                      <span className="me-3">[ &nbsp; ] Approvato all'unanimità</span>
                      <span className="me-3">[ &nbsp; ] Approvato a maggioranza</span>
                      <span>[ &nbsp; ] Rinviato per modifiche</span>
                    </div>
                    <div className="mt-2 small text-muted" style={{ fontSize: '0.75rem' }}>
                      Luogo e Data: __________________________, lì {dataOggi}
                    </div>
                  </div>

                  <div className="col-5 text-end">
                    <div className="row g-2">
                      <div className="col-6 text-center">
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Il Presidente del C.D.</div>
                        <div className="border-bottom border-dark my-4"></div>
                        <div className="small text-muted" style={{ fontSize: '0.7rem' }}>(Firma)</div>
                      </div>
                      <div className="col-6 text-center">
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Il Tesoriere / Segretario</div>
                        <div className="border-bottom border-dark my-4"></div>
                        <div className="small text-muted" style={{ fontSize: '0.7rem' }}>(Firma)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIEDE DI PAGINA */}
              <div className="text-center text-muted border-top mt-4 pt-2" style={{ fontSize: '0.68rem' }}>
                {associazione.denominazione} &bull; Documento generato dal Sistema Gestionale ASD &bull; Stampato il {dataOggi} &bull; Pagina 1 di 1
              </div>
            </div>
          </div>

          {/* FOOTER MODALE (Nascosto in stampa) */}
          <div className="modal-footer bg-white d-print-none d-flex justify-content-between p-3">
            <div className="text-muted small">
              <i className="bi bi-shield-check text-success me-1"></i>
              Formato A4 pronto per l'Assemblea dei Soci e Riunioni del Direttivo.
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Chiudi
              </button>
              <button
                type="button"
                className="btn btn-primary fw-bold"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                <i className="bi bi-download me-1"></i>
                Scarica PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
