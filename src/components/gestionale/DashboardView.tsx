import React from 'react';
import { Persona, Tesserato, Gruppo, Quota, Pagamento, Anno } from '../../types';
import { isQuotaScaduta, getGiorniRitardo } from '../../utils/storage';

interface Props {
  annoAttivo?: Anno;
  persone: Persona[];
  tesserati: Tesserato[];
  gruppi: Gruppo[];
  quote: Quota[];
  pagamenti: Pagamento[];
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenPagamento: (tesseratoId?: number, quotaId?: number) => void;
  onOpenNuovaPersona: () => void;
}

export const DashboardView: React.FC<Props> = ({
  annoAttivo,
  persone,
  tesserati,
  gruppi,
  quote,
  pagamenti,
  onNavigateTab,
  onOpenPagamento,
  onOpenNuovaPersona
}) => {
  const quoteScadute = quote.filter(isQuotaScaduta);
  const totaleIncassato = pagamenti.reduce((acc, p) => acc + p.importo, 0);
  const totaleQuoteDaIncassare = quote
    .filter((q) => q.stato !== 'pagata' && q.stato !== 'annullata')
    .reduce((acc, q) => acc + (q.importo - (q.importo_pagato || 0)), 0);

  const minorenniCount = persone.filter((p) => p.is_minorenne).length;

  // Calcolo Previsione Mese Corrente
  const allMonths = Array.from(
    new Set(quote.map((q) => q.mese_riferimento || q.data_scadenza.substring(0, 7)).filter(Boolean))
  ).sort();
  const currentMonthStr = '2024-10'; // default periodo attivo o mese corrente
  const activeMonth = allMonths.includes(currentMonthStr) ? currentMonthStr : (allMonths[0] || '2024-09');

  const quoteMeseAttivo = quote.filter(
    (q) => (q.mese_riferimento || q.data_scadenza.substring(0, 7)) === activeMonth && q.stato !== 'annullata'
  );
  const totalePrevistoMese = quoteMeseAttivo.reduce((sum, q) => sum + q.importo, 0);
  const totaleIncassatoMese = quoteMeseAttivo.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
  const totaleResiduoMese = totalePrevistoMese - totaleIncassatoMese;
  const percIncassatoMese = totalePrevistoMese > 0 ? Math.round((totaleIncassatoMese / totalePrevistoMese) * 100) : 0;

  const mesiNomi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  const [actYear, actM] = activeMonth.split('-');
  const labelMeseAttivo = `${mesiNomi[parseInt(actM, 10) - 1] || actM} ${actYear}`;

  return (
    <div className="container-fluid py-4">
      {/* Banner Allerta Quote Scadute se presenti */}
      {quoteScadute.length > 0 && (
        <div className="alert alert-danger shadow-sm border-danger d-flex justify-content-between align-items-center mb-4 p-3 rounded-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill fs-2 me-3 text-danger"></i>
            <div>
              <h5 className="alert-heading fw-bold mb-1">Attenzione: {quoteScadute.length} Quote Mensili Scadute Non Pagate!</h5>
              <p className="mb-0 small">
                Ci sono atleti con rette mensili non regolarizzate per un totale di <strong>€ {quoteScadute.reduce((sum, q) => sum + (q.importo - (q.importo_pagato || 0)), 0).toFixed(2)}</strong>.
              </p>
            </div>
          </div>
          <button
            className="btn btn-danger fw-bold shadow-sm"
            onClick={() => onNavigateTab('quote', 'scadute')}
          >
            <i className="bi bi-arrow-right-circle me-1"></i> Visualizza Quote Scadute
          </button>
        </div>
      )}

      {/* KPI Statistiche */}
      <div className="row g-3 mb-4">
        {/* Atleti In Anagrafica */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Totale Anagrafica</span>
                <h3 className="fw-bold my-1 text-primary">{persone.length}</h3>
                <span className="badge bg-warning-subtle text-warning-emphasis">
                  <i className="bi bi-shield-check me-1"></i> {minorenniCount} minorenni (con tutore)
                </span>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-3">
                <i className="bi bi-people-fill fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <button
                className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                onClick={() => onNavigateTab('persone')}
              >
                Vedi Anagrafica &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Tesserati Anno Corrente */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Tesserati {annoAttivo?.anno}</span>
                <h3 className="fw-bold my-1 text-success">{tesserati.length}</h3>
                <span className="badge bg-success-subtle text-success">
                  {gruppi.length} Gruppi Sportivi Attivi
                </span>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-3">
                <i className="bi bi-card-checklist fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <button
                className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                onClick={() => onNavigateTab('tesserati')}
              >
                Vedi Tesserati &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Quote Scadute Non Pagate */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-danger border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-danger small fw-bold text-uppercase">Quote Scadute Non Pagate</span>
                <h3 className="fw-bold my-1 text-danger">{quoteScadute.length}</h3>
                <span className="badge bg-danger-subtle text-danger">
                  € {quoteScadute.reduce((sum, q) => sum + (q.importo - (q.importo_pagato || 0)), 0).toFixed(2)} da riscuotere
                </span>
              </div>
              <div className="p-3 bg-danger-subtle text-danger rounded-3">
                <i className="bi bi-clock-history fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <button
                className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-bold"
                onClick={() => onNavigateTab('quote', 'scadute')}
              >
                Gestisci insoluti &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Totale Incassato */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Totale Incassato Cassa</span>
                <h3 className="fw-bold my-1 text-dark">€ {totaleIncassato.toFixed(2)}</h3>
                <span className="badge bg-info-subtle text-info-emphasis">
                  {pagamenti.length} Ricevute Emesse
                </span>
              </div>
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-3">
                <i className="bi bi-wallet2 fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <button
                className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                onClick={() => onNavigateTab('pagamenti')}
              >
                Registro Cassa &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Riquadro Previsione Incassi del Mese & Flusso di Cassa */}
      <div className="card border-0 shadow-sm rounded-4 bg-white mb-4 overflow-hidden border-start border-primary border-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-primary-subtle text-primary rounded-4 me-3">
                <i className="bi bi-graph-up-arrow fs-2"></i>
              </div>
              <div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">
                  <i className="bi bi-calendar-event me-1"></i> Previsione Mese: {labelMeseAttivo}
                </span>
                <h4 className="fw-bold mb-1 text-dark">
                  Quote da incassare nel mese: <span className="text-primary">€ {totalePrevistoMese.toFixed(2)}</span>
                </h4>
                <div className="small text-muted">
                  Totale previsto per <strong>{quoteMeseAttivo.length} atleti</strong> iscritti ai corsi •{' '}
                  <span className="text-success fw-bold">€ {totaleIncassatoMese.toFixed(2)} già riscossi ({percIncassatoMese}%)</span> •{' '}
                  <span className="text-warning-emphasis fw-bold">€ {totaleResiduoMese.toFixed(2)} residui</span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-outline-primary btn-sm fw-semibold"
                onClick={() => onNavigateTab('quote', activeMonth)}
              >
                <i className="bi bi-calendar3-week me-1"></i> Scadenziario Quote ({quoteMeseAttivo.length})
              </button>
              <button
                className="btn btn-primary btn-sm fw-bold shadow-sm"
                onClick={() => onNavigateTab('previsioni')}
              >
                <i className="bi bi-calculator me-1"></i> Analisi Previsione & Budget Spese &rarr;
              </button>
            </div>
          </div>

          <div className="progress mt-3" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${percIncassatoMese === 100 ? 'bg-success' : percIncassatoMese > 50 ? 'bg-primary' : 'bg-warning'}`}
              role="progressbar"
              style={{ width: `${percIncassatoMese}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Tabella Ultime Quote Scadute con Saldo Immediato */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0 text-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-2"></i> Quote Scadute in Attesa di Saldo
                </h5>
                <small className="text-muted">Elenco dei mancati pagamenti con indicazione del tutore legale</small>
              </div>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => onNavigateTab('quote', 'scadute')}
              >
                Vedi Tutte ({quoteScadute.length})
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Atleta</th>
                      <th>Causale & Periodo</th>
                      <th>Scadenza</th>
                      <th>Importo</th>
                      <th className="text-end">Azione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteScadute.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-success">
                          <i className="bi bi-check-circle-fill fs-4 d-block mb-1"></i>
                          Nessuna quota scaduta non pagata in archivio!
                        </td>
                      </tr>
                    ) : (
                      quoteScadute.slice(0, 5).map((q) => {
                        const tess = tesserati.find((t) => t.id === q.tesserato_id);
                        const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
                        const giorni = getGiorniRitardo(q.data_scadenza);
                        const saldo = q.importo - (q.importo_pagato || 0);

                        return (
                          <tr key={q.id}>
                            <td>
                              <strong>{pers?.cognome} {pers?.nome}</strong>
                              {pers?.is_minorenne && (
                                <div className="text-muted small">
                                  <i className="bi bi-shield me-1"></i>Tutore: {pers.tutore_cognome} ({pers.tutore_telefono})
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="small">{q.causale}</span>
                            </td>
                            <td>
                              <span className="badge bg-danger-subtle text-danger fw-semibold">
                                {q.data_scadenza} ({giorni} gg fa)
                              </span>
                            </td>
                            <td>
                              <strong className="text-danger">€ {saldo.toFixed(2)}</strong>
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-success fw-bold"
                                onClick={() => onOpenPagamento(q.tesserato_id, q.id)}
                              >
                                <i className="bi bi-cash me-1"></i> Salda
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Ultimi Pagamenti Incassati */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-clock-history me-2 text-primary"></i> Ultimi Pagamenti Registrati
                </h5>
                <small className="text-muted">Ricevute cassa recenti</small>
              </div>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => onNavigateTab('pagamenti')}
              >
                Tutti i Pagamenti
              </button>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {pagamenti.slice(0, 5).map((p) => {
                  const tess = tesserati.find((t) => t.id === p.tesserato_id);
                  const pers = tess ? persone.find((per) => per.id === tess.persona_id) : null;
                  return (
                    <div key={p.id} className="list-group-item p-3">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div>
                          <strong>{pers?.cognome} {pers?.nome}</strong>
                          <span className="text-muted ms-2 small">({p.ricevuta_numero})</span>
                        </div>
                        <span className="badge bg-success-subtle text-success fs-6 fw-bold">
                          + € {p.importo.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-muted small mb-1">{p.causale}</div>
                      <div className="d-flex justify-content-between align-items-center small text-muted">
                        <span><i className="bi bi-calendar me-1"></i>{p.data_pagamento}</span>
                        <span className="badge bg-light text-dark border text-uppercase">
                          {p.metodo_pagamento}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
