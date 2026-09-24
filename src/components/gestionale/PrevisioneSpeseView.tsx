import React, { useState } from 'react';
import { Quota, Gruppo, Anno, Associazione, SpesaPrevisionale, CategoriaSpesa } from '../../types';
import { isQuotaScaduta } from '../../utils/storage';
import { StampaProspettoCdModal } from '../modals/StampaProspettoCdModal';

interface Props {
  annoAttivo?: Anno;
  quote: Quota[];
  gruppi: Gruppo[];
  spese: SpesaPrevisionale[];
  associazione: Associazione;
  onSaveSpesa: (spesa: Omit<SpesaPrevisionale, 'id'>, idToEdit?: number) => void;
  onDeleteSpesa: (id: number) => void;
  onNavigateTab: (tab: string, filter?: string) => void;
}

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

const CATEGORIA_ICONS: Record<CategoriaSpesa, string> = {
  'Affitto Impianti / Pista': 'bi-building',
  'Compensi Tecnici / Allenatori': 'bi-person-badge',
  'Tesseramenti & Affiliazioni (FISR/EPS)': 'bi-patch-check',
  'Assicurazioni': 'bi-shield-check',
  'Materiale Sportivo & Divise': 'bi-bag',
  'Gare & Trasferte': 'bi-trophy',
  'Amministrazione & Commercialista': 'bi-file-earmark-spreadsheet',
  'Altro': 'bi-three-dots'
};

const CATEGORIA_COLORS: Record<CategoriaSpesa, string> = {
  'Affitto Impianti / Pista': 'bg-primary text-white',
  'Compensi Tecnici / Allenatori': 'bg-info text-dark',
  'Tesseramenti & Affiliazioni (FISR/EPS)': 'bg-success text-white',
  'Assicurazioni': 'bg-warning text-dark',
  'Materiale Sportivo & Divise': 'bg-secondary text-white',
  'Gare & Trasferte': 'bg-danger text-white',
  'Amministrazione & Commercialista': 'bg-dark text-white',
  'Altro': 'bg-light text-dark border'
};

export const PrevisioneSpeseView: React.FC<Props> = ({
  annoAttivo,
  quote,
  gruppi,
  spese,
  associazione,
  onSaveSpesa,
  onDeleteSpesa,
  onNavigateTab
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpesa, setEditingSpesa] = useState<SpesaPrevisionale | null>(null);
  const [stampaCdModalOpen, setStampaCdModalOpen] = useState(false);

  // Form state
  const [titolo, setTitolo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaSpesa>('Affitto Impianti / Pista');
  const [importo, setImporto] = useState<number>(100);
  const [ricorrente, setRicorrente] = useState(true);
  const [mesiSelezionati, setMesiSelezionati] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Simulatore scenario (aggiustamenti ipotetici)
  const [simulatoreAperto, setSimulatoreAperto] = useState(false);
  const [variazioneQuotePercentuale, setVariazioneQuotePercentuale] = useState(0); // es. +10% o -10%
  const [variazioneSpesePercentuale, setVariazioneSpesePercentuale] = useState(0);

  // 1. Individua i mesi della stagione sportiva attiva
  const mesiStagioneDefault = [
    '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'
  ];

  const mesiDalleQuote = Array.from(
    new Set(
      quote
        .map((q) => q.mese_riferimento || q.data_scadenza.substring(0, 7))
        .filter(Boolean)
    )
  );

  const tuttiMesi = Array.from(new Set([...mesiStagioneDefault, ...mesiDalleQuote])).sort();

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

  // 2. Calcolo entrate e uscite mese per mese
  let progressivoCassa = 0;

  const pianoMesi = tuttiMesi.map((m) => {
    // Quote del mese
    const quoteMese = quote.filter(
      (q) => (q.mese_riferimento || q.data_scadenza.substring(0, 7)) === m && q.stato !== 'annullata'
    );
    const entrateBase = quoteMese.reduce((sum, q) => sum + q.importo, 0);
    const incassatoEffettivo = quoteMese.reduce((sum, q) => sum + (q.importo_pagato || 0), 0);
    const residuoDaIncassare = entrateBase - incassatoEffettivo;
    const scaduteMese = quoteMese.filter(isQuotaScaduta);
    const totaleScadutoMese = scaduteMese.reduce((sum, q) => sum + (q.importo - (q.importo_pagato || 0)), 0);

    // Spese del mese
    const speseMese = spese.filter((s) => {
      if (s.ricorrente) return true;
      return s.mesi.includes(m);
    });
    const usciteBase = speseMese.reduce((sum, s) => sum + s.importo_mensile, 0);

    // Con simulatore
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
      quoteScaduteCount: scaduteMese.length,
      totaleScadutoMese,
      speseCount: speseMese.length,
      speseElenco: speseMese,
      usciteBase,
      usciteSimulate,
      saldoMese,
      progressivoCassa
    };
  });

  // Totali complessivi annuali
  const totaleEntrateStagione = pianoMesi.reduce((sum, p) => sum + p.entrateSimulate, 0);
  const totaleUsciteStagione = pianoMesi.reduce((sum, p) => sum + p.usciteSimulate, 0);
  const saldoFinaleStagione = totaleEntrateStagione - totaleUsciteStagione;
  const totaleIncassatoReale = pianoMesi.reduce((sum, p) => sum + p.incassatoEffettivo, 0);
  const totaleResiduoReale = pianoMesi.reduce((sum, p) => sum + p.residuoDaIncassare, 0);
  const tassoCopertura = totaleUsciteStagione > 0 ? (totaleEntrateStagione / totaleUsciteStagione) * 100 : 100;

  // Ripartizione spese per categoria
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

  // Apertura modale nuova spesa
  const handleOpenNuovaSpesa = () => {
    setEditingSpesa(null);
    setTitolo('');
    setCategoria('Affitto Impianti / Pista');
    setImporto(100);
    setRicorrente(true);
    setMesiSelezionati(tuttiMesi);
    setNote('');
    setModalOpen(true);
  };

  // Apertura modale modifica spesa
  const handleEditSpesa = (spesa: SpesaPrevisionale) => {
    setEditingSpesa(spesa);
    setTitolo(spesa.titolo);
    setCategoria(spesa.categoria);
    setImporto(spesa.importo_mensile);
    setRicorrente(spesa.ricorrente);
    setMesiSelezionati(spesa.mesi || []);
    setNote(spesa.note || '');
    setModalOpen(true);
  };

  const handleSaveSpesaModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || importo <= 0) return;

    onSaveSpesa(
      {
        anno_id: annoAttivo ? annoAttivo.id : 1,
        titolo: titolo.trim(),
        categoria,
        importo_mensile: Number(importo),
        ricorrente,
        mesi: ricorrente ? tuttiMesi : mesiSelezionati,
        note: note.trim()
      },
      editingSpesa ? editingSpesa.id : undefined
    );

    setModalOpen(false);
  };

  const toggleMeseSelezionato = (m: string) => {
    if (mesiSelezionati.includes(m)) {
      setMesiSelezionati(mesiSelezionati.filter((x) => x !== m));
    } else {
      setMesiSelezionati([...mesiSelezionati, m]);
    }
  };

  const handleStampaProspetto = () => {
    setStampaCdModalOpen(true);
  };

  return (
    <div className="container-fluid py-4">
      {/* Intestazione Principale */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fs-6">
              <i className="bi bi-calculator me-1"></i> Controllo di Gestione ASD
            </span>
            <span className="badge bg-secondary-subtle text-secondary px-3 py-2 fs-6">
              Stagione Sportiva {annoAttivo?.anno || '2024/2025'}
            </span>
          </div>
          <h2 className="h3 fw-bold mt-2 mb-1 d-flex align-items-center">
            <i className="bi bi-graph-up-arrow text-success me-2"></i> Previsione Incassi Quote & Budget Spese
          </h2>
          <p className="text-muted small mb-0">
            Pianificazione finanziaria mensile: confronta le entrate stimate dalle quote dei corsisti con le uscite di gestione per verificare la sostenibilità economica.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className={`btn btn-sm ${simulatoreAperto ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => setSimulatoreAperto(!simulatoreAperto)}
            title="Apri simulatore di scenari"
          >
            <i className="bi bi-sliders me-1"></i> Simulatore Scenario
          </button>

          <button
            className="btn btn-sm btn-outline-dark"
            onClick={handleStampaProspetto}
            title="Stampa prospetto previsionale A4 per il Consiglio Direttivo"
          >
            <i className="bi bi-printer me-1"></i> Stampa Prospetto CD
          </button>

          <button
            className="btn btn-sm btn-primary fw-bold shadow-sm"
            onClick={handleOpenNuovaSpesa}
          >
            <i className="bi bi-plus-circle me-1"></i> Aggiungi Voce di Spesa
          </button>
        </div>
      </div>

      {/* Pannello Simulatore Scenario Espandibile */}
      {simulatoreAperto && (
        <div className="card border-info bg-info-subtle shadow-sm mb-4 rounded-3">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                <i className="bi bi-magic me-2"></i> Simulatore di Sensibilità Finanziaria (Stress Test ASD)
              </h6>
              <button
                className="btn btn-sm btn-link text-decoration-none p-0 text-muted"
                onClick={() => {
                  setVariazioneQuotePercentuale(0);
                  setVariazioneSpesePercentuale(0);
                }}
              >
                Ripristina Valori Reali
              </button>
            </div>
            <p className="small text-muted mb-3">
              Modifica i parametri per verificare l'impatto sul saldo di fine anno in caso di nuove iscrizioni, ritiri o aumenti dei costi di pista e tecnici:
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Variazione Entrate Quote: <strong className={variazioneQuotePercentuale >= 0 ? 'text-success' : 'text-danger'}>
                    {variazioneQuotePercentuale > 0 ? `+${variazioneQuotePercentuale}` : variazioneQuotePercentuale}%
                  </strong>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="-30"
                  max="30"
                  step="5"
                  value={variazioneQuotePercentuale}
                  onChange={(e) => setVariazioneQuotePercentuale(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>-30% (ritiri)</span>
                  <span>0% (base)</span>
                  <span>+30% (nuovi iscritti)</span>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Variazione Spese & Uscite: <strong className={variazioneSpesePercentuale > 0 ? 'text-danger' : 'text-success'}>
                    {variazioneSpesePercentuale > 0 ? `+${variazioneSpesePercentuale}` : variazioneSpesePercentuale}%
                  </strong>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="-20"
                  max="40"
                  step="5"
                  value={variazioneSpesePercentuale}
                  onChange={(e) => setVariazioneSpesePercentuale(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>-20% (taglio spese)</span>
                  <span>0% (base)</span>
                  <span>+40% (rincaro pista/tecnici)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 GRANDI KPI FINANZIARI PREVISIONALI */}
      <div className="row g-3 mb-4">
        {/* Entrate Quote Totali */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Entrate Quote Previste</span>
                <h3 className="fw-bold my-1 text-primary">€ {totaleEntrateStagione.toFixed(2)}</h3>
                <div className="small text-muted">
                  <span className="text-success fw-bold">€ {totaleIncassatoReale.toFixed(2)}</span> incassati •{' '}
                  <span className="text-muted">€ {totaleResiduoReale.toFixed(2)}</span> da riscuotere
                </div>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-3">
                <i className="bi bi-cash-coin fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
              <span className="text-muted small">Quote attive: {quote.filter((q) => q.stato !== 'annullata').length}</span>
              <button
                className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                onClick={() => onNavigateTab('quote')}
              >
                Vedi Scadenziario &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Uscite / Spese Totali */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-danger border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Uscite / Spese Stimate</span>
                <h3 className="fw-bold my-1 text-danger">€ {totaleUsciteStagione.toFixed(2)}</h3>
                <div className="small text-muted">
                  {spese.length} voci di costo preventivate su {tuttiMesi.length} mesi
                </div>
              </div>
              <div className="p-3 bg-danger-subtle text-danger rounded-3">
                <i className="bi bi-cart-x fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
              <span className="text-muted small">Media: € {(totaleUsciteStagione / Math.max(1, tuttiMesi.length)).toFixed(2)}/mese</span>
              <a href="#voci-spesa" className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-semibold">
                Dettaglio Costi &darr;
              </a>
            </div>
          </div>
        </div>

        {/* Saldo Netto Previsionale */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className={`card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start ${saldoFinaleStagione >= 0 ? 'border-success' : 'border-danger'} border-4`}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Saldo Finale Previsto</span>
                <h3 className={`fw-bold my-1 ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                  {saldoFinaleStagione >= 0 ? '+' : ''}€ {saldoFinaleStagione.toFixed(2)}
                </h3>
                <span className={`badge ${saldoFinaleStagione >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  {saldoFinaleStagione >= 0 ? (
                    <><i className="bi bi-check-circle-fill me-1"></i> In Utile / Surplus</>
                  ) : (
                    <><i className="bi bi-exclamation-triangle-fill me-1"></i> Disavanzo / Deficit</>
                  )}
                </span>
              </div>
              <div className={`p-3 ${saldoFinaleStagione >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-3`}>
                <i className={`bi ${saldoFinaleStagione >= 0 ? 'bi-piggy-bank' : 'bi-shield-exclamation'} fs-3`}></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top text-muted small">
              {saldoFinaleStagione >= 0
                ? 'Margine economico positivo a copertura di imprevisti'
                : 'Attenzione: le spese superano le entrate stimate dalle quote!'}
            </div>
          </div>
        </div>

        {/* Tasso di Copertura Costi */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Tasso Copertura Costi</span>
                <h3 className="fw-bold my-1 text-dark">{tassoCopertura.toFixed(1)}%</h3>
                <div className="progress mt-2" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${tassoCopertura >= 100 ? 'bg-success' : 'bg-danger'}`}
                    role="progressbar"
                    style={{ width: `${Math.min(100, tassoCopertura)}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-3">
                <i className="bi bi-percent fs-3"></i>
              </div>
            </div>
            <div className="mt-3 pt-2 border-top text-muted small">
              {tassoCopertura >= 100
                ? 'Ogni 100€ di spesa è coperto da quote'
                : 'Mancano quote a sufficienza per coprire i costi!'}
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE 1: TABELLA PREVISIONALE MESE PER MESE (CASH FLOW) */}
      <div className="card border-0 shadow-sm rounded-4 bg-white mb-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
              <i className="bi bi-calendar3-range text-primary me-2"></i> Flusso di Cassa & Scadenziario Mese per Mese
            </h5>
            <small className="text-muted">
              Quante quote devi incassare per ciascun mese della stagione sportiva rispetto alle spese previste
            </small>
          </div>
          <span className="badge bg-light text-dark border">
            {tuttiMesi.length} Mesi Analizzati
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th>Mese di Riferimento</th>
                <th className="text-center">N° Quote</th>
                <th>Entrate Previste da Quote</th>
                <th>Stato Incassi Quote</th>
                <th>Uscite / Spese Previste</th>
                <th className="text-end">Margine Mese</th>
                <th className="text-end">Cassa Cumulata</th>
                <th className="text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {pianoMesi.map((p) => {
                const percIncassato = p.entrateBase > 0 ? Math.round((p.incassatoEffettivo / p.entrateBase) * 100) : 0;
                const isPositivo = p.saldoMese >= 0;
                const isCassaPositiva = p.progressivoCassa >= 0;

                return (
                  <tr key={p.mese}>
                    <td>
                      <div className="fw-bold text-dark">{p.label}</div>
                      <small className="text-muted font-monospace">{p.mese}</small>
                    </td>

                    <td className="text-center">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                        {p.quoteCount} atleti
                      </span>
                    </td>

                    <td>
                      <div className="fw-bold text-dark">
                        € {p.entrateSimulate.toFixed(2)}
                      </div>
                      {variazioneQuotePercentuale !== 0 && (
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          Base: € {p.entrateBase.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td style={{ minWidth: '180px' }}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-success fw-bold">€ {p.incassatoEffettivo.toFixed(0)}</span>
                        <span className="text-muted">Residuo: <strong>€ {p.residuoDaIncassare.toFixed(0)}</strong></span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${percIncassato === 100 ? 'bg-success' : percIncassato > 50 ? 'bg-info' : 'bg-warning'}`}
                          style={{ width: `${percIncassato}%` }}
                        ></div>
                      </div>
                      {p.quoteScaduteCount > 0 && (
                        <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-exclamation-circle-fill me-1"></i>
                          {p.quoteScaduteCount} scadute (€ {p.totaleScadutoMese.toFixed(0)})
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="fw-bold text-danger">
                        € {p.usciteSimulate.toFixed(2)}
                      </div>
                      <small className="text-muted">
                        {p.speseCount} voci costo
                      </small>
                    </td>

                    <td className="text-end">
                      <span className={`fw-bold ${isPositivo ? 'text-success' : 'text-danger'}`}>
                        {isPositivo ? '+' : ''}€ {p.saldoMese.toFixed(2)}
                      </span>
                    </td>

                    <td className="text-end">
                      <span className={`badge px-2 py-1 ${isCassaPositiva ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                        {isCassaPositiva ? '+' : ''}€ {p.progressivoCassa.toFixed(2)}
                      </span>
                    </td>

                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onNavigateTab('quote', p.mese)}
                        title="Vedi le quote di questo mese nello scadenziario"
                      >
                        <i className="bi bi-eye me-1"></i> Quote
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td>TOTALE STAGIONALE</td>
                <td className="text-center">{quote.filter((q) => q.stato !== 'annullata').length} quote</td>
                <td className="text-primary">€ {totaleEntrateStagione.toFixed(2)}</td>
                <td>
                  <span className="text-success">€ {totaleIncassatoReale.toFixed(2)} incassati</span>
                </td>
                <td className="text-danger">€ {totaleUsciteStagione.toFixed(2)}</td>
                <td className={`text-end ${saldoFinaleStagione >= 0 ? 'text-success' : 'text-danger'}`}>
                  {saldoFinaleStagione >= 0 ? '+' : ''}€ {saldoFinaleStagione.toFixed(2)}
                </td>
                <td className="text-end">
                  <span className={`badge ${saldoFinaleStagione >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                    {saldoFinaleStagione >= 0 ? '+' : ''}€ {saldoFinaleStagione.toFixed(2)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="row g-4" id="voci-spesa">
        {/* SEZIONE 2: GESTIONE DETTAGLIATA VOCI DI SPESA */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-list-check text-danger me-2"></i> Voci di Spesa Preventivate ({spese.length})
                </h5>
                <small className="text-muted">Costi operativi per pista, compensi istruttori, federazione FISR e gestione</small>
              </div>

              <button
                className="btn btn-sm btn-outline-danger fw-bold"
                onClick={handleOpenNuovaSpesa}
              >
                <i className="bi bi-plus-lg me-1"></i> Nuova Spesa
              </button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Voce di Costo & Categoria</th>
                      <th>Importo Mensile / Singolo</th>
                      <th>Frequenza & Mesi</th>
                      <th>Totale Annuo Stimato</th>
                      <th className="text-end">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spese.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted">
                          Nessuna voce di spesa inserita. Clicca su "Aggiungi Voce di Spesa" per iniziare.
                        </td>
                      </tr>
                    ) : (
                      spese.map((s) => {
                        const mesiApplicati = s.ricorrente ? tuttiMesi.length : s.mesi.length;
                        const totaleVoce = s.importo_mensile * mesiApplicati;

                        return (
                          <tr key={s.id}>
                            <td>
                              <div className="fw-bold text-dark">{s.titolo}</div>
                              <span className={`badge ${CATEGORIA_COLORS[s.categoria]} px-2 py-1 mt-1`}>
                                <i className={`bi ${CATEGORIA_ICONS[s.categoria]} me-1`}></i>
                                {s.categoria}
                              </span>
                              {s.note && <div className="text-muted small mt-1">{s.note}</div>}
                            </td>

                            <td>
                              <strong className="text-danger">€ {s.importo_mensile.toFixed(2)}</strong>
                            </td>

                            <td>
                              {s.ricorrente ? (
                                <span className="badge bg-secondary-subtle text-secondary border">
                                  <i className="bi bi-arrow-repeat me-1"></i> Ogni Mese ({mesiApplicati} mesi)
                                </span>
                              ) : (
                                <div>
                                  <span className="badge bg-info-subtle text-info-emphasis border">
                                    {s.mesi.length} mesi specifici
                                  </span>
                                  <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                    {s.mesi.map((m) => formatMese(m)).join(', ')}
                                  </div>
                                </div>
                              )}
                            </td>

                            <td>
                              <strong className="text-dark">€ {totaleVoce.toFixed(2)}</strong>
                            </td>

                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => handleEditSpesa(s)}
                                  title="Modifica voce"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => {
                                    if (window.confirm(`Vuoi davvero eliminare la spesa "${s.titolo}"?`)) {
                                      onDeleteSpesa(s.id);
                                    }
                                  }}
                                  title="Elimina voce"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
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

        {/* SEZIONE 3: RIPARTIZIONE SPESE PER CATEGORIA */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                <i className="bi bi-pie-chart text-primary me-2"></i> Ripartizione Costi per Categoria
              </h5>
              <small className="text-muted">Dove vanno a finire le quote incassate</small>
            </div>

            <div className="card-body p-3">
              {spesePerCategoria.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Nessun dato di spesa disponibile.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {spesePerCategoria.map((cat) => (
                    <div key={cat.categoria}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold small d-flex align-items-center">
                          <i className={`bi ${CATEGORIA_ICONS[cat.categoria]} me-2 text-primary`}></i>
                          {cat.categoria}
                        </span>
                        <span className="fw-bold small">€ {cat.totale.toFixed(2)} ({cat.percentuale}%)</span>
                      </div>
                      <div className="progress" style={{ height: '7px' }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${cat.percentuale}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold small mb-2 d-flex align-items-center text-dark">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i> Suggerimento per l'ASD:
                    </h6>
                    <p className="small text-muted mb-0">
                      I corsi di <strong>Avviamento</strong> e <strong>Agonismo</strong> coprono tipicamente i costi fissi dell'affitto pista e dei tecnici. Assicurati che il numero minimo di iscritti per corso garantisca almeno il pareggio mensile (break-even).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALE INSERIMENTO / MODIFICA SPESA PREVISIONALE */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calculator me-2"></i>
                  {editingSpesa ? 'Modifica Voce di Spesa' : 'Nuova Voce di Spesa Prevista'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSaveSpesaModal}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Titolo o Descrizione della Spesa *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="es. Canone Affitto Pista Comunale, Compenso Istruttore, ecc."
                      value={titolo}
                      onChange={(e) => setTitolo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Categoria di Spesa *</label>
                      <select
                        className="form-select"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as CategoriaSpesa)}
                      >
                        {CATEGORIE_SPESA.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Importo Previsto (€) *</label>
                      <div className="input-group">
                        <span className="input-group-text">€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control"
                          value={importo}
                          onChange={(e) => setImporto(Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Frequenza della Spesa</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="freq-ricorrente"
                        name="frequenza"
                        checked={ricorrente}
                        onChange={() => setRicorrente(true)}
                      />
                      <label className="form-check-label" htmlFor="freq-ricorrente">
                        <strong>Ricorrente Mensile</strong> (applicata ogni mese della stagione sportiva)
                      </label>
                    </div>

                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="freq-singola"
                        name="frequenza"
                        checked={!ricorrente}
                        onChange={() => setRicorrente(false)}
                      />
                      <label className="form-check-label" htmlFor="freq-singola">
                        <strong>Mesi Specifici / Una Tantum</strong> (seleziona i singoli mesi di addebito)
                      </label>
                    </div>
                  </div>

                  {!ricorrente && (
                    <div className="mb-3 p-3 bg-light rounded-3 border">
                      <label className="form-label small fw-bold text-muted mb-2">
                        Seleziona i Mesi di Applicazione:
                      </label>
                      <div className="row g-2">
                        {tuttiMesi.map((m) => (
                          <div key={m} className="col-6 col-sm-4">
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`mese-${m}`}
                                checked={mesiSelezionati.includes(m)}
                                onChange={() => toggleMeseSelezionato(m)}
                              />
                              <label className="form-check-label small" htmlFor={`mese-${m}`}>
                                {formatMese(m)}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Note & Dettagli (opzionale)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="es. Convenzione oraria, delibera CD, modalità pagamento..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-danger fw-bold">
                    <i className="bi bi-check-circle me-1"></i>
                    {editingSpesa ? 'Salva Modifiche' : 'Salva Voce di Spesa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODALE STAMPA & DOWNLOAD PDF PROSPETTO CONSIGLIO DIRETTIVO */}
      <StampaProspettoCdModal
        isOpen={stampaCdModalOpen}
        onClose={() => setStampaCdModalOpen(false)}
        associazione={associazione}
        annoAttivo={annoAttivo}
        quote={quote}
        spese={spese}
        gruppi={gruppi}
        variazioneQuotePercentuale={variazioneQuotePercentuale}
        variazioneSpesePercentuale={variazioneSpesePercentuale}
      />
    </div>
  );
};
