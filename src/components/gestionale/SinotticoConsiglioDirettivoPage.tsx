import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Associazione, Anno, Quota, SpesaPrevisionale, Gruppo, CategoriaSpesa } from '../../types';

interface Props {
  associazione: Associazione;
  annoAttivo?: Anno;
  quote: Quota[];
  spese: SpesaPrevisionale[];
  gruppi: Gruppo[];
  onBack: () => void;
}

export const SinotticoConsiglioDirettivoPage: React.FC<Props> = ({
  associazione,
  annoAttivo,
  quote,
  spese,
  gruppi,
  onBack
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const dataOggi = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const stagioneNome = annoAttivo?.anno || '2024/2025';

  const formatMese = (m: string) => {
    const [year, month] = m.split('-');
    const mesiNomi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${mesiNomi[idx] || month} ${year}`;
  };

  // Mesi stagione
  const tuttiMesi = [
    '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'
  ];

  // Calcolo piano finanziario mese per mese
  let progressivoCassa = 0;
  const pianoMesi = tuttiMesi.map((m) => {
    const quoteMese = quote.filter(
      (q) => (q.mese_riferimento || q.data_scadenza.substring(0, 7)) === m && q.stato !== 'annullata'
    );
    const entrateMese = quoteMese.reduce((sum, q) => sum + q.importo, 0);
    const incassatoMese = quoteMese.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
    const residuoMese = entrateMese - incassatoMese;

    const speseMese = spese.filter((s) => {
      if (s.ricorrente) return true;
      return s.mesi.includes(m);
    });
    const usciteMese = speseMese.reduce((sum, s) => sum + s.importo_mensile, 0);

    const saldoMese = entrateMese - usciteMese;
    progressivoCassa += saldoMese;

    return {
      mese: m,
      label: formatMese(m),
      quoteCount: quoteMese.length,
      entrateMese,
      incassatoMese,
      residuoMese,
      speseCount: speseMese.length,
      speseVoci: speseMese.map((s) => s.titolo),
      usciteMese,
      saldoMese,
      progressivoCassa
    };
  });

  const totaleEntrateStagione = pianoMesi.reduce((sum, p) => sum + p.entrateMese, 0);
  const totaleIncassatoStagione = pianoMesi.reduce((sum, p) => sum + p.incassatoMese, 0);
  const totaleResiduoStagione = pianoMesi.reduce((sum, p) => sum + p.residuoMese, 0);
  const totaleUsciteStagione = pianoMesi.reduce((sum, p) => sum + p.usciteMese, 0);
  const saldoFinaleStagione = totaleEntrateStagione - totaleUsciteStagione;
  const tassoCopertura =
    totaleUsciteStagione > 0 ? Math.round((totaleEntrateStagione / totaleUsciteStagione) * 100) : 100;

  // Ripartizione spese per categoria
  const categorieRiepilogo: Record<string, { count: number; totale: number }> = {};
  spese.forEach((s) => {
    const occorrenze = s.ricorrente ? tuttiMesi.length : s.mesi.length;
    const costoVoce = s.importo_mensile * occorrenze;
    if (!categorieRiepilogo[s.categoria]) {
      categorieRiepilogo[s.categoria] = { count: 0, totale: 0 };
    }
    categorieRiepilogo[s.categoria].count += 1;
    categorieRiepilogo[s.categoria].totale += costoVoce;
  });

  // Ripartizione quote per gruppo
  const gruppiRiepilogo = gruppi.map((g) => {
    const quoteGruppo = quote.filter((q) => q.gruppo_id === g.id && q.stato !== 'annullata');
    const totGruppo = quoteGruppo.reduce((sum, q) => sum + q.importo, 0);
    const incassatoGruppo = quoteGruppo.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
    return {
      nome: g.nome_gruppo,
      quoteCount: quoteGruppo.length,
      totale: totGruppo,
      incassato: incassatoGruppo
    };
  });

  // Generazione PDF
  const handleDownloadPdf = async () => {
    const elemento = document.getElementById('sinottico-documento-cd');
    if (!elemento) return;

    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sinottico_Consiglio_Direttivo_${stagioneNome.replace('/', '_')}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Errore generazione PDF:', err);
      alert('Si è verificato un errore durante la generazione del PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const epsAttivi = associazione.enti_affiliati?.filter((e) => e.tipo === 'EPS' && e.attivo !== false) || [];

  return (
    <div className="container-fluid py-4">
      {/* Top Header & Navigazione */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 d-print-none">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={onBack}
                >
                  Previsione & Budget
                </button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Sinottico Consiglio Direttivo
              </li>
            </ol>
          </nav>
          <h2 className="h3 fw-bold mb-0 d-flex align-items-center">
            <i className="bi bi-file-earmark-spreadsheet-fill text-primary me-2"></i>
            Sinottico Finanziario per il Consiglio Direttivo
          </h2>
          <small className="text-muted">
            Prospetto economico-patrimoniale completo per la stagione sportiva {stagioneNome}
          </small>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left me-1"></i> Torna al Budget
          </button>
          <button type="button" className="btn btn-outline-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Stampa Prospetto
          </button>
          <button
            type="button"
            className="btn btn-primary fw-bold shadow-sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Generazione PDF...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-pdf-fill me-1"></i> Scarica PDF Ufficiale
              </>
            )}
          </button>
        </div>
      </div>

      {pdfSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 shadow-sm mb-4 d-print-none">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <span>Documento PDF ufficiale generato e scaricato con successo!</span>
        </div>
      )}

      {/* DOCUMENTO UFFICIALE CD (STAMPABILE & ESPORTABILE) */}
      <div
        id="sinottico-documento-cd"
        className="card border-0 shadow rounded-4 bg-white p-4 p-md-5 mb-5 mx-auto"
        style={{ maxWidth: '1100px' }}
      >
        {/* Intestazione Associazione */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
          <div>
            <div className="badge bg-primary text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
              {associazione.disciplina || 'Pattinaggio Artistico a Rotelle'}
            </div>
            <h3 className="fw-bold text-primary mb-1 text-uppercase">
              {associazione.denominazione}
            </h3>
            <div className="text-muted small lh-sm">
              <div>
                {associazione.indirizzo}, {associazione.cap} {associazione.comune} ({associazione.provincia})
              </div>
              <div className="mt-1">
                <strong>C.F.:</strong> {associazione.codice_fiscale}
                {associazione.partita_iva && (
                  <span className="ms-2">| <strong>P.IVA:</strong> {associazione.partita_iva}</span>
                )}
                {associazione.telefono && <span className="ms-2">| <strong>Tel:</strong> {associazione.telefono}</span>}
              </div>
              <div className="mt-1">
                <strong>Presidente / Legale Rappr.:</strong> {associazione.legale_rappresentante}
              </div>
              <div className="mt-1 text-danger fw-semibold">
                <i className="bi bi-award-fill me-1"></i>
                Federazione Ufficiale: {associazione.codice_affiliazione_fisr || 'FISR n. 3942'}
                {associazione.registro_rasd && (
                  <span className="ms-2 text-dark font-monospace">| Registro RASD: {associazione.registro_rasd}</span>
                )}
              </div>
              {epsAttivi.length > 0 && (
                <div className="mt-1 text-primary small">
                  <strong>EPS Riconosciuti:</strong> {epsAttivi.map((e) => e.sigla).join(' • ')}
                </div>
              )}
            </div>
          </div>

          <div className="text-end">
            <span className="badge bg-primary fs-6 px-3 py-2 fw-bold text-uppercase shadow-xs">
              Consiglio Direttivo
            </span>
            <div className="fw-bold text-dark mt-2 fs-6">Bilancio di Previsione</div>
            <div className="badge bg-light text-dark border mt-1">Stagione {stagioneNome}</div>
            <div className="small text-muted mt-2">Data Prospetto: {dataOggi}</div>
          </div>
        </div>

        {/* Titolo Documento */}
        <div className="text-center mb-4">
          <h4 className="fw-bold text-dark text-uppercase mb-1">
            QUADRO SINOTTICO GENERALE DELLE ENTRATE E DELLE SPESE PREVISIONALI
          </h4>
          <p className="text-muted small mb-0">
            Documento contabile a supporto delle deliberazioni del Consiglio Direttivo dell'Associazione
          </p>
        </div>

        {/* 4 Grandi Indicatori Sintetici */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-md-3">
            <div className="p-3 border rounded-3 bg-light text-center h-100">
              <span className="small text-muted text-uppercase fw-semibold d-block">
                Totale Entrate Quote
              </span>
              <h4 className="fw-bold text-dark my-1">
                € {totaleEntrateStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </h4>
              <small className="text-success fw-bold">
                € {totaleIncassatoStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })} saldati
              </small>
            </div>
          </div>

          <div className="col-sm-6 col-md-3">
            <div className="p-3 border rounded-3 bg-light text-center h-100">
              <span className="small text-muted text-uppercase fw-semibold d-block">
                Totale Spese a Budget
              </span>
              <h4 className="fw-bold text-danger my-1">
                € {totaleUsciteStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </h4>
              <small className="text-muted">{spese.length} voci di costo</small>
            </div>
          </div>

          <div className="col-sm-6 col-md-3">
            <div
              className={`p-3 border rounded-3 text-center h-100 ${
                saldoFinaleStagione >= 0 ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'
              }`}
            >
              <span className="small text-muted text-uppercase fw-semibold d-block">
                Risultato d'Esercizio
              </span>
              <h4 className={`fw-bold my-1 ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                {saldoFinaleStagione >= 0 ? '+' : ''}€{' '}
                {saldoFinaleStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </h4>
              <span className={`badge ${saldoFinaleStagione >= 0 ? 'bg-success' : 'bg-danger'}`}>
                {saldoFinaleStagione >= 0 ? 'Avanzo Previsto' : 'Disavanzo Previsto'}
              </span>
            </div>
          </div>

          <div className="col-sm-6 col-md-3">
            <div className="p-3 border rounded-3 bg-light text-center h-100">
              <span className="small text-muted text-uppercase fw-semibold d-block">
                Copertura Costi
              </span>
              <h4 className="fw-bold text-dark my-1">{tassoCopertura}%</h4>
              <small className="text-muted">
                Residuo: € {totaleResiduoStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </small>
            </div>
          </div>
        </div>

        {/* Tabella 1: Flussi Finanziari Mese per Mese */}
        <h5 className="fw-bold text-dark mb-2 d-flex align-items-center">
          <i className="bi bi-calendar3 me-2 text-primary"></i> 1. Piano di Cassa e Flussi Finanziari Mensilizzati
        </h5>
        <div className="table-responsive mb-4">
          <table className="table table-bordered table-sm align-middle small mb-0">
            <thead className="table-light text-uppercase">
              <tr>
                <th>Mese di Riferimento</th>
                <th className="text-end">Entrate Quote Previste</th>
                <th className="text-end">Incassato Reale</th>
                <th className="text-end">Residuo da Incassare</th>
                <th className="text-end text-danger">Spese Programmate</th>
                <th className="text-end">Saldo Mensile</th>
                <th className="text-end">Progressivo Cassa</th>
              </tr>
            </thead>
            <tbody>
              {pianoMesi.map((pm) => (
                <tr key={pm.mese}>
                  <td>
                    <strong>{pm.label}</strong>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {pm.quoteCount} rate quote • {pm.speseCount} voci costo
                    </div>
                  </td>
                  <td className="text-end fw-semibold">
                    € {pm.entrateMese.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-end text-success">
                    € {pm.incassatoMese.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-end text-muted">
                    € {pm.residuoMese.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-end text-danger fw-semibold">
                    € {pm.usciteMese.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-end fw-bold ${pm.saldoMese >= 0 ? 'text-success' : 'text-danger'}`}>
                    {pm.saldoMese >= 0 ? '+' : ''}€{' '}
                    {pm.saldoMese.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-end fw-bold ${pm.progressivoCassa >= 0 ? 'text-primary' : 'text-danger'}`}>
                    € {pm.progressivoCassa.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light fw-bold border-top">
              <tr>
                <td>TOTALI STAGIONE</td>
                <td className="text-end">
                  € {totaleEntrateStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-end text-success">
                  € {totaleIncassatoStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-end text-muted">
                  € {totaleResiduoStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-end text-danger">
                  € {totaleUsciteStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td className={`text-end ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                  {saldoFinaleStagione >= 0 ? '+' : ''}€{' '}
                  {saldoFinaleStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
                <td className={`text-end ${saldoFinaleStagione >= 0 ? 'text-primary' : 'text-danger'}`}>
                  € {saldoFinaleStagione.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tabella 2: Analisi Voci di Spesa per Categoria */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <h5 className="fw-bold text-dark mb-2 d-flex align-items-center">
              <i className="bi bi-pie-chart-fill me-2 text-danger"></i> 2. Ripartizione Costi per Categoria
            </h5>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Categoria Spesa</th>
                    <th className="text-center" style={{ width: '80px' }}>Voci</th>
                    <th className="text-end">Importo Totale</th>
                    <th className="text-end" style={{ width: '70px' }}>Incidenza</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categorieRiepilogo).map(([cat, dati]) => {
                    const incidenza =
                      totaleUsciteStagione > 0 ? Math.round((dati.totale / totaleUsciteStagione) * 100) : 0;
                    return (
                      <tr key={cat}>
                        <td><strong>{cat}</strong></td>
                        <td className="text-center">{dati.count}</td>
                        <td className="text-end text-danger fw-bold">
                          € {dati.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-end">{incidenza}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="fw-bold text-dark mb-2 d-flex align-items-center">
              <i className="bi bi-diagram-3-fill me-2 text-primary"></i> 3. Ripartizione Entrate per Corso / Gruppo
            </h5>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Corso / Gruppo</th>
                    <th className="text-center" style={{ width: '80px' }}>Rate</th>
                    <th className="text-end">Totale Previsto</th>
                    <th className="text-end">Incassato</th>
                  </tr>
                </thead>
                <tbody>
                  {gruppiRiepilogo.map((g) => (
                    <tr key={g.nome}>
                      <td><strong>{g.nome}</strong></td>
                      <td className="text-center">{g.quoteCount}</td>
                      <td className="text-end fw-bold text-dark">
                        € {g.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-success fw-bold">
                        € {g.incassato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Nota Metodologica CD */}
        <div className="p-3 bg-light rounded-3 border mb-4 small text-muted">
          <strong>Note per il Consiglio Direttivo:</strong> Il presente prospetto sinottico è redatto sulla base dei
          piani corso vigenti e dei preventivi di costo approvati. Tutte le quote associative ed istituzionali sono
          esenti IVA ai sensi dell'art. 4 DPR 633/1972 e dell'art. 148 TUIR conformemente alle disposizioni del D.Lgs. 36/2021
          (Riforma dello Sport).
        </div>

        {/* Firme Ufficiali */}
        <div className="row pt-4 mt-3 border-top">
          <div className="col-6 text-center">
            <small className="text-muted d-block mb-4">Il Responsabile Amministrativo / Tesoriere</small>
            <div className="border-bottom mx-auto" style={{ width: '220px' }}></div>
            <small className="text-muted mt-1 d-block">Firma e Visto di Congruità</small>
          </div>
          <div className="col-6 text-center">
            <small className="text-muted d-block mb-4">Il Presidente / Legale Rappresentante</small>
            <div className="border-bottom mx-auto" style={{ width: '220px' }}></div>
            <strong className="text-dark d-block mt-1">{associazione.legale_rappresentante}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
