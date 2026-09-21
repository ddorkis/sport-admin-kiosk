import React, { useState, useEffect } from 'react';
import { Persona, Tesserato, Quota, Pagamento, Associazione } from '../../types';

interface Props {
  onBack: () => void;
  persone: Persona[];
  tesserati: Tesserato[];
  quote: Quota[];
  associazione: Associazione;
  preselectedQuotaId?: number | null;
  preselectedTesseratoId?: number | null;
  onSave: (data: {
    tesserato_id: number;
    quota_id?: number | null;
    importo: number;
    metodo_pagamento: Pagamento['metodo_pagamento'];
    causale: string;
    note?: string;
  }) => void;
  isKioskMode?: boolean;
}

export const NuovoPagamentoPage: React.FC<Props> = ({
  onBack,
  persone,
  tesserati,
  quote,
  associazione,
  preselectedQuotaId,
  preselectedTesseratoId,
  onSave,
  isKioskMode = false
}) => {
  const [tesseratoId, setTesseratoId] = useState<number>(preselectedTesseratoId || 0);
  const [isQuotaPayment, setIsQuotaPayment] = useState<boolean>(true);
  const [quotaId, setQuotaId] = useState<number | ''>(preselectedQuotaId || '');
  const [importo, setImporto] = useState<string>('');
  const [metodo, setMetodo] = useState<Pagamento['metodo_pagamento']>('contanti');
  const [causaleLibera, setCausaleLibera] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Set default selection when opening
  useEffect(() => {
    if (preselectedQuotaId) {
      const q = quote.find((item) => item.id === preselectedQuotaId);
      if (q) {
        setQuotaId(q.id);
        setTesseratoId(q.tesserato_id);
        setIsQuotaPayment(true);
        const daSaldare = q.importo - (q.importo_pagato || 0);
        setImporto(daSaldare.toString());
      }
    } else if (preselectedTesseratoId) {
      setTesseratoId(preselectedTesseratoId);
    } else if (tesserati.length > 0 && !tesseratoId) {
      setTesseratoId(tesserati[0].id);
    }
  }, [preselectedQuotaId, preselectedTesseratoId, quote, tesserati]);

  // Se l'utente seleziona una quota, auto-imposta l'importo da saldare
  useEffect(() => {
    if (quotaId) {
      const q = quote.find((item) => item.id === Number(quotaId));
      if (q) {
        const daSaldare = q.importo - (q.importo_pagato || 0);
        setImporto(daSaldare.toString());
      }
    }
  }, [quotaId, quote]);

  const currentTesserato = tesserati.find((t) => t.id === tesseratoId);
  const currentPersona = currentTesserato ? persone.find((p) => p.id === currentTesserato.persona_id) : null;

  // Quote aperte per questo tesserato
  const quoteAperteTesserato = quote.filter(
    (q) => q.tesserato_id === tesseratoId && q.stato !== 'pagata' && q.stato !== 'annullata'
  );

  const filteredTesserati = tesserati.filter((t) => {
    const p = persone.find((pers) => pers.id === t.persona_id);
    if (!p) return false;
    const text = `${p.cognome} ${p.nome} ${p.codice_fiscale} ${t.numero_tessera}`.toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!tesseratoId) {
      alert('Seleziona un tesserato.');
      return;
    }

    const numImporto = parseFloat(importo);
    if (isNaN(numImporto) || numImporto <= 0) {
      alert('Inserisci un importo valido maggiore di zero.');
      return;
    }

    let finalCausale = '';
    let finalQuotaId: number | null = null;

    if (isQuotaPayment && quotaId) {
      const q = quote.find((item) => item.id === Number(quotaId));
      if (q) {
        finalCausale = q.causale;
        finalQuotaId = q.id;
      } else {
        finalCausale = 'Pagamento quota corso';
      }
    } else {
      if (!causaleLibera.trim()) {
        alert('Inserisci la causale del pagamento.');
        return;
      }
      finalCausale = causaleLibera.trim();
    }

    onSave({
      tesserato_id: tesseratoId,
      quota_id: finalQuotaId,
      importo: numImporto,
      metodo_pagamento: metodo,
      causale: finalCausale,
      note: note.trim()
    });

    onBack();
  };

  const nextReceiptYear = new Date().getFullYear();

  return (
    <div className="container-fluid py-4 max-w-6xl mx-auto">
      {/* Intestazione con Breadcrumb e Azioni */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 pb-3 border-bottom">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted small">
              <li className="breadcrumb-item">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none text-muted"
                  onClick={onBack}
                >
                  <i className="bi bi-wallet2 me-1"></i> Registro Pagamenti
                </button>
              </li>
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                Registrazione Incasso
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center text-dark">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={onBack}
              title="Torna all'elenco pagamenti"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <span>Registra Nuovo Pagamento / Ricevuta Incasso</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            Registra l'incasso di una quota mensile di corso o un pagamento libero. Al salvataggio verrà emessa la ricevuta e tornerai all'elenco.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary px-3"
            onClick={onBack}
          >
            <i className="bi bi-x-lg me-1"></i> Annulla
          </button>
          <button
            type="button"
            className="btn btn-primary fw-bold px-4 shadow-sm"
            onClick={() => handleSubmit()}
          >
            <i className="bi bi-check-lg me-1"></i> Salva Incasso e Torna alla Lista
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Colonna Sinistra: Selezione Tesserato e Tipo Pagamento */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-person-badge-fill text-primary me-2 fs-5"></i> 1. Seleziona Tesserato
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Cerca tesserato:</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per nominativo, CF o n. tessera..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchFilter('')}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Tesserato / Atleta *</label>
                  <select
                    className="form-select form-select-lg"
                    value={tesseratoId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setTesseratoId(newId);
                      setQuotaId('');
                    }}
                    required
                  >
                    {filteredTesserati.map((t) => {
                      const p = persone.find((pers) => pers.id === t.persona_id);
                      return (
                        <option key={t.id} value={t.id}>
                          {p?.cognome} {p?.nome} — {t.numero_tessera} ({t.tipo_tesseramento})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Scheda Situazione Tesserato */}
                {currentPersona && currentTesserato && (
                  <div className="p-3 bg-light rounded-3 border border-secondary-subtle">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-person-fill me-1 text-primary"></i>
                        {currentPersona.cognome} {currentPersona.nome}
                      </h6>
                      <span className="badge bg-primary">{currentTesserato.numero_tessera}</span>
                    </div>

                    <div className="small text-muted mb-1">
                      <strong>Codice Fiscale:</strong> <code>{currentPersona.codice_fiscale}</code>
                    </div>

                    {currentPersona.is_minorenne && currentPersona.tutore_nome && (
                      <div className="small text-muted mb-1">
                        <strong>Genitore / Tutore:</strong> {currentPersona.tutore_cognome} {currentPersona.tutore_nome} (CF: {currentPersona.tutore_cf || 'N.D.'})
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-top small">
                      <strong>Quote in attesa di pagamento:</strong>{' '}
                      {quoteAperteTesserato.length > 0 ? (
                        <span className="badge bg-danger ms-1">{quoteAperteTesserato.length} rate aperte</span>
                      ) : (
                        <span className="badge bg-success ms-1">Nessuna quota aperta (in regola)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scelta Causale e Quota */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-tag-fill text-primary me-2 fs-5"></i> 2. Tipo di Pagamento & Causale
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    className={`btn py-2 fw-semibold ${isQuotaPayment ? 'btn-primary active' : 'btn-outline-primary'}`}
                    onClick={() => setIsQuotaPayment(true)}
                  >
                    <i className="bi bi-calendar-check me-2"></i> Saldo Quota Corso Mensile
                  </button>
                  <button
                    type="button"
                    className={`btn py-2 fw-semibold ${!isQuotaPayment ? 'btn-primary active' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setIsQuotaPayment(false);
                      setQuotaId('');
                    }}
                  >
                    <i className="bi bi-pencil-square me-2"></i> Pagamento Libero / Extra
                  </button>
                </div>

                {isQuotaPayment ? (
                  <div>
                    <label className="form-label fw-semibold text-dark">
                      Seleziona Rata Quota da Saldare *
                    </label>
                    {quoteAperteTesserato.length === 0 ? (
                      <div className="alert alert-warning small mb-0">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        Questo atleta non ha quote mensili aperte registrate. Puoi selezionare <em>"Pagamento Libero / Extra"</em> sopra per registrare un incasso libero.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {quoteAperteTesserato.map((q) => {
                          const daSaldare = q.importo - (q.importo_pagato || 0);
                          const isSelected = quotaId === q.id;
                          return (
                            <div
                              key={q.id}
                              className={`p-3 rounded-3 border cursor-pointer transition-all ${
                                isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light-subtle bg-light hover:bg-white'
                              }`}
                              onClick={() => setQuotaId(q.id)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="form-check mb-0">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="quotaSelect"
                                    id={`quota_${q.id}`}
                                    checked={isSelected}
                                    onChange={() => setQuotaId(q.id)}
                                  />
                                  <label className="form-check-label fw-bold text-dark ms-1 cursor-pointer" htmlFor={`quota_${q.id}`}>
                                    {q.causale}
                                  </label>
                                </div>
                                <span className="fs-6 fw-bold text-danger">
                                  € {daSaldare.toFixed(2)}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mt-2 small text-muted">
                                <span>Scadenza: {q.data_scadenza}</span>
                                <span>Totale quota: € {q.importo.toFixed(2)} (già versati: € {(q.importo_pagato || 0).toFixed(2)})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="form-label fw-semibold text-dark">Causale Pagamento *</label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Es. Quota Tesseramento Federale FISR 2024/2025"
                      value={causaleLibera}
                      onChange={(e) => setCausaleLibera(e.target.value)}
                      required={!isQuotaPayment}
                    />
                    <div className="d-flex flex-wrap gap-1">
                      <span className="small text-muted me-1">Suggeriti:</span>
                      {[
                        'Tesseramento e Iscrizione Annuale FISR',
                        'Quota Corso Pattinaggio Artistico',
                        'Acquisto Body / Attrezzatura Sociale',
                        'Iscrizione Gara Federale / Trofeo EPS',
                        'Visita Medico Sportiva Sociale'
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setCausaleLibera(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonna Destra: Importo, Metodo e Anteprima Ricevuta */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-cash-coin text-success me-2 fs-5"></i> 3. Dettagli Incasso
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Importo Versato (€) *</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light fw-bold text-success">€</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        className="form-control fw-bold text-success fs-4"
                        placeholder="0.00"
                        value={importo}
                        onChange={(e) => setImporto(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Metodo di Pagamento *</label>
                    <select
                      className="form-select form-select-lg"
                      value={metodo}
                      onChange={(e) => setMetodo(e.target.value as Pagamento['metodo_pagamento'])}
                      required
                    >
                      <option value="contanti">💵 Contanti (Cassa)</option>
                      <option value="pos">💳 POS / Bancomat</option>
                      <option value="bonifico">🏦 Bonifico Bancario</option>
                      <option value="satispay">📱 Satispay / Digitale</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Note Aggiuntive / Riferimento Transazione</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. CRO bonifico, scontrino POS n. 45..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Anteprima Ricevuta Fiscale Non Imponibile */}
            <div className="card border-0 shadow-sm rounded-3 mb-4 bg-light border border-secondary-subtle">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="card-title fw-bold mb-0 text-secondary d-flex align-items-center">
                  <i className="bi bi-file-earmark-text me-2"></i> Anteprima Emissione Ricevuta
                </h6>
                <span className="badge bg-secondary-subtle text-secondary border">
                  Progressivo RIC-{nextReceiptYear}-XXXX
                </span>
              </div>
              <div className="card-body p-4">
                <div className="bg-white p-3 rounded-2 border small">
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <div>
                      <strong className="d-block">{associazione.denominazione}</strong>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Codice Fiscale: {associazione.codice_fiscale} &bull; FISR: {associazione.codice_affiliazione_fisr || '1234'}
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-light text-dark border">RICEVUTA SOCIALE</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-muted">Intestata a:</span>{' '}
                    <strong>
                      {currentPersona?.is_minorenne && currentPersona?.tutore_nome
                        ? `${currentPersona.tutore_cognome} ${currentPersona.tutore_nome} (Genitore per l'atleta ${currentPersona.nome})`
                        : `${currentPersona?.cognome} ${currentPersona?.nome}`}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded">
                    <span>
                      {isQuotaPayment && quotaId
                        ? quote.find((q) => q.id === Number(quotaId))?.causale
                        : causaleLibera || 'Causale versamento'}
                    </span>
                    <strong className="fs-6 text-success">
                      € {parseFloat(importo) > 0 ? parseFloat(importo).toFixed(2) : '0.00'}
                    </strong>
                  </div>

                  <div className="text-muted mt-2 text-center" style={{ fontSize: '0.7rem' }}>
                    Operazione fuori campo IVA ai sensi dell'art. 4 del D.P.R. 633/1972 svolta a favore dei soci e tesserati.
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni Finali */}
            <div className="card border-0 bg-primary bg-opacity-10 rounded-3 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onBack}
                >
                  ← Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary fw-bold px-4 shadow-sm"
                >
                  <i className="bi bi-check-circle me-1"></i> Registra Incasso e Torna alla Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
