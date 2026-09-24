import React, { useState } from 'react';
import { Quota, Tesserato, Persona, Gruppo } from '../../types';
import { isQuotaScaduta, getGiorniRitardo } from '../../utils/storage';

interface Props {
  quote: Quota[];
  tesserati: Tesserato[];
  persone: Persona[];
  gruppi: Gruppo[];
  initialFilter?: string;
  onOpenPagamento: (tesseratoId: number, quotaId: number) => void;
  onAnnullaQuota?: (quota: Quota) => void;
  onNavigateToBilancio?: () => void;
  onSincronizzaQuote?: () => void;
}

export const QuoteView: React.FC<Props> = ({
  quote,
  tesserati,
  persone,
  gruppi,
  initialFilter,
  onOpenPagamento,
  onAnnullaQuota,
  onNavigateToBilancio,
  onSincronizzaQuote
}) => {
  // Modalità di visualizzazione: 'previsione' (Riepilogo e Scadenziario Mensile) o 'tabella' (Elenco Singole Quote)
  const isMonthInitial = initialFilter && initialFilter.startsWith('20');
  const [vistaModalita, setVistaModalita] = useState<'previsione' | 'tabella'>(
    isMonthInitial ? 'tabella' : 'previsione'
  );

  const [soloScadute, setSoloScadute] = useState<boolean>(initialFilter === 'scadute');
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('all');
  const [filterGruppo, setFilterGruppo] = useState<string>('all');
  const [filterMese, setFilterMese] = useState<string>(isMonthInitial ? initialFilter : 'all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Utility nomi mesi
  const formatMese = (m: string) => {
    if (!m) return '';
    const [year, month] = m.split('-');
    const mesiNomi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${mesiNomi[idx] || month} ${year}`;
  };

  // Mesi disponibili calcolati dalle quote
  const mesiDisponibili = Array.from(
    new Set(
      quote
        .map((q) => q.mese_riferimento || q.data_scadenza.substring(0, 7))
        .filter(Boolean)
    )
  ).sort();

  // Quote Scadute
  const quoteScaduteCount = quote.filter(isQuotaScaduta).length;
  const totaleScaduto = quote
    .filter(isQuotaScaduta)
    .reduce((acc, q) => acc + (q.importo - (q.importo_pagato || 0)), 0);

  // Totali Generali Annuali
  const quoteValide = quote.filter((q) => q.stato !== 'annullata');
  const totaleValoreQuoteStagione = quoteValide.reduce((sum, q) => sum + q.importo, 0);
  const totaleIncassatoStagione = quoteValide.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
  const totaleResiduoStagione = totaleValoreQuoteStagione - totaleIncassatoStagione;
  const percentualeIncassoStagione = totaleValoreQuoteStagione > 0
    ? Math.round((totaleIncassatoStagione / totaleValoreQuoteStagione) * 100)
    : 0;

  // Riepilogo Mese per Mese
  const riepilogoPerMese = mesiDisponibili.map((m) => {
    const quoteDelMese = quote.filter(
      (q) => (q.mese_riferimento || q.data_scadenza.substring(0, 7)) === m && q.stato !== 'annullata'
    );
    const totalePrevisto = quoteDelMese.reduce((sum, q) => sum + q.importo, 0);
    const totaleIncassato = quoteDelMese.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
    const totaleResiduo = totalePrevisto - totaleIncassato;
    const scadute = quoteDelMese.filter(isQuotaScaduta);
    const totaleScadutoMese = scadute.reduce((sum, q) => sum + (q.importo - (q.importo_pagato || 0)), 0);
    const pagateCount = quoteDelMese.filter((q) => q.stato === 'pagata').length;
    const parzialiCount = quoteDelMese.filter((q) => q.stato === 'parziale').length;
    const daPagareCount = quoteDelMese.filter((q) => q.stato === 'da_pagare').length;

    // Ripartizione per gruppo in questo mese
    const perGruppo = gruppi.map((grp) => {
      const qGrp = quoteDelMese.filter((q) => q.gruppo_id === grp.id);
      return {
        gruppo: grp,
        count: qGrp.length,
        totale: qGrp.reduce((sum, q) => sum + q.importo, 0)
      };
    }).filter((g) => g.count > 0);

    return {
      mese: m,
      label: formatMese(m),
      totaleQuote: quoteDelMese.length,
      totalePrevisto,
      totaleIncassato,
      totaleResiduo,
      quoteScaduteCount: scadute.length,
      totaleScadutoMese,
      pagateCount,
      parzialiCount,
      daPagareCount,
      perGruppo,
      percentualeIncasso: totalePrevisto > 0 ? Math.round((totaleIncassato / totalePrevisto) * 100) : 0
    };
  });

  // Filtraggio Tabella
  const filtered = quote.filter((q) => {
    const isScaduta = isQuotaScaduta(q);

    if (soloScadute && !isScaduta) return false;

    if (filterStato !== 'all' && q.stato !== filterStato) return false;

    if (filterMese !== 'all') {
      const qMese = q.mese_riferimento || q.data_scadenza.substring(0, 7);
      if (qMese !== filterMese) return false;
    }

    if (filterGruppo !== 'all') {
      if (filterGruppo === 'nessuno' && q.gruppo_id !== null) return false;
      if (filterGruppo !== 'nessuno' && q.gruppo_id !== Number(filterGruppo)) return false;
    }

    if (!search.trim()) return true;

    const tess = tesserati.find((t) => t.id === q.tesserato_id);
    const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
    const s = search.toLowerCase();

    const nominativo = pers ? `${pers.cognome} ${pers.nome}`.toLowerCase() : '';
    const cf = pers ? pers.codice_fiscale.toLowerCase() : '';
    const tutore = pers ? `${pers.tutore_cognome || ''} ${pers.tutore_nome || ''}`.toLowerCase() : '';

    return (
      q.causale.toLowerCase().includes(s) ||
      nominativo.includes(s) ||
      cf.includes(s) ||
      tutore.includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSelezionaMesePerTabella = (m: string) => {
    setFilterMese(m);
    setSoloScadute(false);
    setVistaModalita('tabella');
    setPage(1);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header Principale */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1">
              <i className="bi bi-calendar3 me-1"></i> Controllo Entrate & Scadenze
            </span>
          </div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-cash-stack text-warning me-2"></i> Gestione Quote & Scadenziario Mensile
          </h2>
          <p className="text-muted small mb-0">
            Monitoraggio mensile delle quote da riscuotere per gli atleti iscritti e calcolo previsionale degli incassi
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {onSincronizzaQuote && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onSincronizzaQuote}
              title="Assicura che tutte le rate mensili dei corsi attivi siano generate"
            >
              <i className="bi bi-arrow-repeat me-1"></i> Sincronizza Scadenziario
            </button>
          )}

          {onNavigateToBilancio && (
            <button
              className="btn btn-sm btn-success fw-bold shadow-sm"
              onClick={onNavigateToBilancio}
              title="Passa all'analisi comparativa tra quote e spese previste"
            >
              <i className="bi bi-graph-up-arrow me-1"></i> Previsione Spese & Bilancio &rarr;
            </button>
          )}

          {/* Toggle Esclusivo Quote Scadute Non Pagate */}
          <button
            className={`btn btn-sm ${soloScadute ? 'btn-danger shadow fw-bold' : 'btn-outline-danger'} d-flex align-items-center gap-1`}
            onClick={() => {
              setSoloScadute(!soloScadute);
              if (!soloScadute) {
                setVistaModalita('tabella');
              }
              setPage(1);
            }}
          >
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>Solo Scadute ({quoteScaduteCount})</span>
          </button>
        </div>
      </div>

      {/* TABS SWITCHER: [ PREVISIONE MENSILE ] vs [ TABELLA SINGOLE QUOTE ] */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 flex-wrap gap-2">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              className={`nav-link px-3 py-2 fw-semibold d-flex align-items-center ${
                vistaModalita === 'previsione' ? 'active shadow-sm' : 'bg-white text-dark border'
              }`}
              onClick={() => setVistaModalita('previsione')}
            >
              <i className="bi bi-calendar3-week me-2"></i>
              Previsione & Scadenziario Mensile
              <span className={`badge ms-2 ${vistaModalita === 'previsione' ? 'bg-light text-primary' : 'bg-primary-subtle text-primary'}`}>
                {mesiDisponibili.length} mesi
              </span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link px-3 py-2 fw-semibold d-flex align-items-center ${
                vistaModalita === 'tabella' ? 'active shadow-sm' : 'bg-white text-dark border'
              }`}
              onClick={() => setVistaModalita('tabella')}
            >
              <i className="bi bi-table me-2"></i>
              Elenco Dettagliato Quote
              <span className={`badge ms-2 ${vistaModalita === 'tabella' ? 'bg-light text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                {quote.length}
              </span>
            </button>
          </li>
        </ul>

        {vistaModalita === 'tabella' && filterMese !== 'all' && (
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Filtro Mese Attivo:</span>
            <span className="badge bg-primary px-3 py-2">
              {formatMese(filterMese)}
            </span>
            <button
              className="btn btn-sm btn-link p-0 text-muted"
              onClick={() => setFilterMese('all')}
              title="Rimuovi filtro mese"
            >
              <i className="bi bi-x-circle fs-6"></i>
            </button>
          </div>
        )}
      </div>

      {/* Banner Allerta se filtro quote scadute è attivo */}
      {soloScadute && (
        <div className="alert alert-danger shadow-sm border-danger d-flex justify-content-between align-items-center mb-4 p-3 rounded-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-shield-exclamation fs-3 me-3 text-danger"></i>
            <div>
              <strong>Filtro Attivo: Visualizzazione Insoluti e Quote Scadute!</strong>
              <div className="small">
                Totale credito insoluto da incassare: <strong>€ {totaleScaduto.toFixed(2)}</strong>. Per gli atleti minorenni è mostrato il recapito telefonico del tutore legale per il sollecito.
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-outline-dark" onClick={() => setSoloScadute(false)}>
            Mostra Tutte le Quote
          </button>
        </div>
      )}

      {/* 4 CARD RIASSUNTIVE GLOBALI DELL'ANNO */}
      <div className="row g-3 mb-4">
        {/* Totale Valore Quote Previste */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Quote Annuali Previste</span>
                <h3 className="fw-bold my-1 text-primary">€ {totaleValoreQuoteStagione.toFixed(2)}</h3>
                <div className="small text-muted">{quoteValide.length} rate su {mesiDisponibili.length} mesi</div>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-3">
                <i className="bi bi-calendar-check fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top text-muted small">
              Media mensile: <strong>€ {(totaleValoreQuoteStagione / Math.max(1, mesiDisponibili.length)).toFixed(2)}</strong> / mese
            </div>
          </div>
        </div>

        {/* Totale Già Incassato */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Totale Già Incassato</span>
                <h3 className="fw-bold my-1 text-success">€ {totaleIncassatoStagione.toFixed(2)}</h3>
                <div className="small text-muted">
                  {percentualeIncassoStagione}% dell'importo previsto
                </div>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-3">
                <i className="bi bi-wallet2 fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${percentualeIncassoStagione}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Totale Residuo da Incassare */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Residuo da Incassare</span>
                <h3 className="fw-bold my-1 text-warning-emphasis">€ {totaleResiduoStagione.toFixed(2)}</h3>
                <div className="small text-muted">
                  {quoteValide.filter((q) => q.stato !== 'pagata').length} rate ancora aperte
                </div>
              </div>
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-3">
                <i className="bi bi-hourglass-split fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top text-muted small">
              Entrate programmate per i prossimi mesi
            </div>
          </div>
        </div>

        {/* Quote Scadute Insolute */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-danger border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-danger small fw-bold text-uppercase">Insoluti / Scadute</span>
                <h3 className="fw-bold my-1 text-danger">€ {totaleScaduto.toFixed(2)}</h3>
                <div className="small text-muted">{quoteScaduteCount} rate scadute non saldate</div>
              </div>
              <div className="p-3 bg-danger-subtle text-danger rounded-3">
                <i className="bi bi-exclamation-octagon fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <button
                className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-bold"
                onClick={() => {
                  setSoloScadute(true);
                  setVistaModalita('tabella');
                }}
              >
                Visualizza elenco insoluti &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: PREVISIONE & SCADENZIARIO MENSILE (CALENDARIO DELLE RATE)       */}
      {/* ========================================================================= */}
      {vistaModalita === 'previsione' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>
                Quadro Mensile Incassi ({riepilogoPerMese.length} Mesi)
              </h5>
              <small className="text-muted">
                Clicca su un mese per visualizzare nel dettaglio i nominativi degli atleti e registrare i pagamenti
              </small>
            </div>
          </div>

          <div className="row g-3 mb-4">
            {riepilogoPerMese.map((rm) => {
              const isCompletato = rm.totalePrevisto > 0 && rm.totaleResiduo <= 0;
              const hasScadute = rm.quoteScaduteCount > 0;

              return (
                <div key={rm.mese} className="col-12 col-md-6 col-lg-4 col-xl-3">
                  <div
                    className={`card border-0 shadow-sm rounded-4 h-100 bg-white transition-all ${
                      hasScadute ? 'border-top border-danger border-4' : isCompletato ? 'border-top border-success border-4' : 'border-top border-primary border-4'
                    }`}
                  >
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        {/* Header card mese */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold mb-0 text-dark">{rm.label}</h5>
                            <span className="small text-muted font-monospace">{rm.mese}</span>
                          </div>
                          {isCompletato ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              <i className="bi bi-check-circle-fill me-1"></i> Saldato
                            </span>
                          ) : hasScadute ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              <i className="bi bi-clock-history me-1"></i> {rm.quoteScaduteCount} scadute
                            </span>
                          ) : (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              In programma
                            </span>
                          )}
                        </div>

                        {/* Importi del mese */}
                        <div className="p-3 bg-light rounded-3 my-2 border">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Quote da incassare:</span>
                            <strong className="fs-5 text-dark">€ {rm.totalePrevisto.toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between align-items-center small text-muted">
                            <span>Numero Atleti:</span>
                            <span className="badge bg-white text-dark border">{rm.totaleQuote} corsisti</span>
                          </div>
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between align-items-center small">
                            <span className="text-success fw-semibold">Già incassato:</span>
                            <span className="text-success fw-bold">€ {rm.totaleIncassato.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center small mt-1">
                            <span className="text-muted">Residuo da riscuotere:</span>
                            <span className={`fw-bold ${rm.totaleResiduo > 0 ? (hasScadute ? 'text-danger' : 'text-primary') : 'text-muted'}`}>
                              € {rm.totaleResiduo.toFixed(2)}
                            </span>
                          </div>

                          {/* Barra avanzamento */}
                          <div className="progress mt-2" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar ${isCompletato ? 'bg-success' : rm.percentualeIncasso > 50 ? 'bg-info' : 'bg-warning'}`}
                              role="progressbar"
                              style={{ width: `${rm.percentualeIncasso}%` }}
                            ></div>
                          </div>
                          <div className="text-end text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                            {rm.percentualeIncasso}% incassato
                          </div>
                        </div>

                        {/* Ripartizione per gruppo/corso */}
                        {rm.perGruppo.length > 0 && (
                          <div className="mb-2">
                            <span className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>
                              Corsi attivi nel mese:
                            </span>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {rm.perGruppo.map((g) => (
                                <span
                                  key={g.gruppo.id}
                                  className="badge bg-secondary-subtle text-secondary-emphasis"
                                  style={{ fontSize: '0.72rem' }}
                                  title={`${g.gruppo.nome_gruppo}: ${g.count} atleti (totale € ${g.totale.toFixed(2)})`}
                                >
                                  {g.gruppo.nome_gruppo.split('(')[0].trim()}: {g.count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottone azione per aprire le quote del mese */}
                      <button
                        className="btn btn-sm btn-outline-primary w-100 mt-2 fw-semibold"
                        onClick={() => handleSelezionaMesePerTabella(rm.mese)}
                      >
                        <i className="bi bi-search me-1"></i> Gestisci Quote di {rm.label.split(' ')[0]} &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: ELENCO DETTAGLIATO QUOTE & FILTRI                                */}
      {/* ========================================================================= */}
      {vistaModalita === 'tabella' && (
        <>
          {/* Barra Filtri & Ricerca Avanzata */}
          <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                {/* Ricerca Testuale */}
                <div className="col-md-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per Atleta, Causale, Tutore..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Filtro Mese di Riferimento */}
                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={filterMese}
                    onChange={(e) => {
                      setFilterMese(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">Tutti i Mesi della Stagione</option>
                    {mesiDisponibili.map((m) => (
                      <option key={m} value={m}>
                        {formatMese(m)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Stato Quota */}
                <div className="col-md-2">
                  <select
                    className="form-select form-select-sm"
                    value={filterStato}
                    onChange={(e) => {
                      setFilterStato(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">Tutti gli Stati</option>
                    <option value="da_pagare">Da Pagare (Aperte)</option>
                    <option value="parziale">Pagamento Parziale</option>
                    <option value="pagata">Saldate / Pagate</option>
                    <option value="annullata">Annullate / Sgravate</option>
                  </select>
                </div>

                {/* Filtro Gruppo / Corso */}
                <div className="col-md-2">
                  <select
                    className="form-select form-select-sm"
                    value={filterGruppo}
                    onChange={(e) => {
                      setFilterGruppo(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">Tutti i Gruppi</option>
                    {gruppi.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome_gruppo}
                      </option>
                    ))}
                    <option value="nessuno">Quote Straordinarie / No Gruppo</option>
                  </select>
                </div>

                {/* Conteggio e Reset */}
                <div className="col-md-2 text-end text-muted small d-flex justify-content-end align-items-center gap-2">
                  <span>Record: <strong>{filtered.length}</strong></span>
                  {(filterMese !== 'all' || filterStato !== 'all' || filterGruppo !== 'all' || search || soloScadute) && (
                    <button
                      className="btn btn-sm btn-link p-0 text-muted"
                      onClick={() => {
                        setFilterMese('all');
                        setFilterStato('all');
                        setFilterGruppo('all');
                        setSearch('');
                        setSoloScadute(false);
                      }}
                      title="Azzera tutti i filtri"
                    >
                      Azzera
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabella Quote */}
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-uppercase small">
                  <tr>
                    <th>Scadenza & Mese</th>
                    <th>Stato & Ritardo</th>
                    <th>Atleta Tesserato</th>
                    <th>Gruppo / Corso</th>
                    <th>Causale Quota</th>
                    <th>Importo</th>
                    <th>Saldato</th>
                    <th>Residuo</th>
                    <th className="text-end">Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        Nessuna quota trovata con i filtri selezionati.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((q) => {
                      const tess = tesserati.find((t) => t.id === q.tesserato_id);
                      const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
                      const gruppo = gruppi.find((g) => g.id === q.gruppo_id);

                      const isScaduta = isQuotaScaduta(q);
                      const giorniRitardo = getGiorniRitardo(q.data_scadenza);
                      const residuo = q.importo - (q.importo_pagato || 0);
                      const isAnnullata = q.stato === 'annullata';

                      return (
                        <tr
                          key={q.id}
                          className={
                            isAnnullata
                              ? 'table-light text-muted opacity-75'
                              : isScaduta
                              ? 'table-danger bg-opacity-25'
                              : ''
                          }
                        >
                          <td>
                            <strong className={isAnnullata ? 'text-muted text-decoration-line-through' : isScaduta ? 'text-danger' : 'text-dark'}>
                              {q.data_scadenza}
                            </strong>
                            {q.mese_riferimento && (
                              <div className="small text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                                {formatMese(q.mese_riferimento)}
                              </div>
                            )}
                          </td>
                          <td>
                            {isAnnullata ? (
                              <span className="badge bg-secondary-subtle text-secondary border">
                                <i className="bi bi-x-circle me-1"></i> Annullata
                              </span>
                            ) : isScaduta ? (
                              <span className="badge bg-danger">
                                <i className="bi bi-clock-history me-1"></i>
                                Scaduta da {giorniRitardo} gg!
                              </span>
                            ) : q.stato === 'pagata' ? (
                              <span className="badge bg-success">Saldata</span>
                            ) : q.stato === 'parziale' ? (
                              <span className="badge bg-warning text-dark">Parziale</span>
                            ) : (
                              <span className="badge bg-secondary">In Scadenza</span>
                            )}
                          </td>
                          <td>
                            <strong>{pers?.cognome} {pers?.nome}</strong>
                            {pers?.is_minorenne ? (
                              <div className="small text-muted">
                                <i className="bi bi-shield me-1"></i>
                                Tutore: <strong>{pers.tutore_cognome}</strong> (<a href={`tel:${pers.tutore_telefono}`} className="text-decoration-none">{pers.tutore_telefono}</a>)
                              </div>
                            ) : (
                              <div className="small text-muted">{tess?.numero_tessera}</div>
                            )}
                          </td>
                          <td>
                            <span className="small text-muted">{gruppo?.nome_gruppo || 'Quota Libera'}</span>
                          </td>
                          <td>
                            <div className={`small fw-semibold ${isAnnullata ? 'text-decoration-line-through text-muted' : ''}`}>
                              {q.causale}
                            </div>
                            {q.note && (
                              <div className="small text-secondary fst-italic" style={{ fontSize: '0.78rem' }}>
                                <i className="bi bi-chat-left-text me-1"></i>
                                {q.note}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={isAnnullata ? 'text-decoration-line-through text-muted' : ''}>
                              € {q.importo.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className="text-success">€ {(q.importo_pagato || 0).toFixed(2)}</span>
                          </td>
                          <td>
                            {isAnnullata ? (
                              <span className="badge bg-light text-muted border">€ 0.00 (Sgravata)</span>
                            ) : (
                              <strong className={residuo > 0 ? (isScaduta ? 'text-danger fs-6' : 'text-primary') : 'text-muted'}>
                                € {residuo.toFixed(2)}
                              </strong>
                            )}
                          </td>
                          <td className="text-end">
                            {isAnnullata ? (
                              <span className="badge bg-light text-muted border">Annullata</span>
                            ) : residuo > 0 ? (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-sm btn-success fw-bold"
                                  onClick={() => onOpenPagamento(q.tesserato_id, q.id)}
                                  title="Registra incasso per questa quota"
                                >
                                  <i className="bi bi-cash me-1"></i> Salda
                                </button>
                                {onAnnullaQuota && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => onAnnullaQuota(q)}
                                    title="Annulla o sgravi questa quota (es. per ritiro)"
                                  >
                                    <i className="bi bi-x-circle"></i>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted small">
                                <i className="bi bi-check-all text-success fs-5"></i>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center flex-wrap">
                <span className="text-muted small">
                  Pagina <strong>{currentPage}</strong> di <strong>{totalPages}</strong> ({filtered.length} quote)
                </span>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                      Precedente
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <li key={num} className={`page-item ${currentPage === num ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(num)}>
                        {num}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                      Successiva
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
