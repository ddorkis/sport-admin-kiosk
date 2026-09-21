import React, { useState } from 'react';
import { Persona, Tesserato, Gruppo, GruppoTesserato, Quota, Pagamento } from '../../types';
import { isQuotaScaduta, getGiorniRitardo } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persone: Persona[];
  tesserati: Tesserato[];
  gruppi: Gruppo[];
  gruppiTesserati: GruppoTesserato[];
  quote: Quota[];
  pagamenti: Pagamento[];
  onOpenPagamento: (tesseratoId: number, quotaId?: number) => void;
  isKioskMode?: boolean;
}

export const CercaAnagraficaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  persone,
  tesserati,
  gruppi,
  gruppiTesserati,
  quote,
  pagamenti,
  onOpenPagamento,
  isKioskMode = false
}) => {
  const [query, setQuery] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);

  if (!isOpen) return null;

  const filteredPersone = persone.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const tess = tesserati.find((t) => t.persona_id === p.id);
    const numTess = tess?.numero_tessera.toLowerCase() || '';
    const tutore = `${p.tutore_cognome || ''} ${p.tutore_nome || ''}`.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.cognome.toLowerCase().includes(q) ||
      p.codice_fiscale.toLowerCase().includes(q) ||
      p.telefono.includes(q) ||
      tutore.includes(q) ||
      numTess.includes(q)
    );
  });

  const selectedPersona = selectedPersonaId
    ? persone.find((p) => p.id === selectedPersonaId)
    : filteredPersone[0] || null;

  const tesserato = selectedPersona
    ? tesserati.find((t) => t.persona_id === selectedPersona.id)
    : null;

  const athleteGroups = tesserato
    ? gruppiTesserati
        .filter((gt) => gt.tesserato_id === tesserato.id)
        .map((gt) => gruppi.find((g) => g.id === gt.gruppo_id))
        .filter(Boolean) as Gruppo[]
    : [];

  const athleteQuotes = tesserato
    ? quote.filter((q) => q.tesserato_id === tesserato.id)
    : [];

  const athletePayments = tesserato
    ? pagamenti.filter((p) => p.tesserato_id === tesserato.id)
    : [];

  const quoteAperte = athleteQuotes.filter((q) => q.stato !== 'pagata' && q.stato !== 'annullata');
  const quoteScadute = quoteAperte.filter(isQuotaScaduta);
  const totaleDaSaldare = quoteAperte.reduce((sum, q) => sum + (q.importo - (q.importo_pagato || 0)), 0);

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${isKioskMode ? 'modal-xl' : 'modal-lg'}`}>
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className={`modal-header ${isKioskMode ? 'bg-info text-white p-4' : 'bg-light p-3'}`}>
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-search me-2 fs-4"></i>
              Ricerca Anagrafica & Scheda Atleta
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            {/* Input di Ricerca Veloce */}
            <div className="input-group input-group-lg mb-4 shadow-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-primary fs-4"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 fs-5"
                placeholder="Digita Nome, Cognome, CF, Tessera o Tutore..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button className="btn btn-outline-secondary" onClick={() => setQuery('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>

            <div className="row g-3">
              {/* Lista Risultati (Colonna Sinistra) */}
              <div className="col-md-5">
                <label className="form-label text-muted small fw-bold text-uppercase">
                  Risultati ({filteredPersone.length})
                </label>
                <div className="list-group shadow-sm overflow-auto" style={{ maxHeight: '420px' }}>
                  {filteredPersone.length === 0 ? (
                    <div className="p-3 text-muted text-center">Nessun nominativo trovato.</div>
                  ) : (
                    filteredPersone.map((p) => {
                      const isSelected = selectedPersona?.id === p.id;
                      const tess = tesserati.find((t) => t.persona_id === p.id);
                      const tQuotes = tess ? quote.filter((q) => q.tesserato_id === tess.id && q.stato !== 'pagata') : [];
                      const hasScadute = tQuotes.some(isQuotaScaduta);

                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`list-group-item list-group-item-action p-3 text-start ${
                            isSelected ? 'active text-white' : ''
                          }`}
                          onClick={() => setSelectedPersonaId(p.id)}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong className="fs-6">{p.cognome} {p.nome}</strong>
                            {hasScadute && (
                              <span className="badge bg-danger rounded-pill">Quote Scadute!</span>
                            )}
                          </div>
                          <div className={`small ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                            {p.codice_fiscale} &bull; {p.is_minorenne ? 'Minorenne' : 'Maggiorenne'}
                          </div>
                          {tess && (
                            <div className="mt-1">
                              <span className={`badge ${isSelected ? 'bg-light text-dark' : 'bg-primary-subtle text-primary'} me-1`}>
                                {tess.numero_tessera}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Scheda Dettaglio (Colonna Destra) */}
              <div className="col-md-7">
                {selectedPersona ? (
                  <div className="card border-0 bg-light p-3 rounded-4 shadow-sm h-100">
                    <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                      <div>
                        <h4 className="fw-bold mb-1">{selectedPersona.cognome} {selectedPersona.nome}</h4>
                        <div className="text-muted small">
                          CF: <code>{selectedPersona.codice_fiscale}</code> &bull; Nato il: {selectedPersona.data_nascita}
                        </div>
                      </div>
                      <div>
                        {selectedPersona.is_minorenne ? (
                          <span className="badge bg-warning text-dark px-3 py-2 fs-6">
                            <i className="bi bi-shield-check me-1"></i>Minorenne
                          </span>
                        ) : (
                          <span className="badge bg-secondary px-3 py-2 fs-6">Maggiorenne</span>
                        )}
                      </div>
                    </div>

                    {/* Dati Tutore Legale se Minorenne */}
                    {selectedPersona.is_minorenne && (
                      <div className="alert alert-warning py-2 px-3 mb-3 border-warning">
                        <div className="fw-bold text-dark">
                          <i className="bi bi-person-fill-lock me-1"></i> Tutore: {selectedPersona.tutore_cognome} {selectedPersona.tutore_nome} ({selectedPersona.tutore_relazione || 'Genitore'})
                        </div>
                        <div className="small mt-1 text-secondary">
                          <i className="bi bi-telephone me-1"></i> Tel: <a href={`tel:${selectedPersona.tutore_telefono}`} className="fw-bold text-dark">{selectedPersona.tutore_telefono}</a> &bull; {selectedPersona.tutore_email}
                        </div>
                      </div>
                    )}

                    {/* Stato Tesseramento */}
                    <div className="mb-3">
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1">Tesseramento</span>
                      {tesserato ? (
                        <div className="bg-white p-2 rounded border small d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{tesserato.numero_tessera}</strong> ({tesserato.tipo_tesseramento})
                            <div className="text-muted">
                              Certificato Medico Scadenza: <strong className={tesserato.certificato_medico_scadenza < '2025-01-01' ? 'text-danger' : 'text-success'}>{tesserato.certificato_medico_scadenza}</strong>
                            </div>
                          </div>
                          <span className="badge bg-success">{tesserato.stato}</span>
                        </div>
                      ) : (
                        <div className="bg-white p-2 rounded border text-danger small">
                          Non ancora tesserato per l'anno in corso.
                        </div>
                      )}
                    </div>

                    {/* Gruppi Assegnati */}
                    <div className="mb-3">
                      <span className="text-muted small fw-bold text-uppercase d-block mb-1">Gruppi / Corsi</span>
                      {athleteGroups.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {athleteGroups.map((g) => (
                            <span key={g.id} className="badge bg-primary px-2 py-1">
                              {g.nome_gruppo} (€ {g.quota_mensile}/m)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small">Nessun gruppo assegnato</span>
                      )}
                    </div>

                    {/* Stato Quote & Saldo */}
                    <div className="mt-auto pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <span className="text-muted small d-block">Saldo Totale in Sospeso</span>
                          <span className={`fs-4 fw-bold ${totaleDaSaldare > 0 ? 'text-danger' : 'text-success'}`}>
                            € {totaleDaSaldare.toFixed(2)}
                          </span>
                        </div>
                        {quoteScadute.length > 0 && (
                          <span className="badge bg-danger p-2">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            {quoteScadute.length} Quote Scadute
                          </span>
                        )}
                      </div>

                      {quoteAperte.length > 0 && (
                        <div className="list-group list-group-flush mb-3 small bg-white rounded border">
                          {quoteAperte.slice(0, 3).map((q) => {
                            const scaduta = isQuotaScaduta(q);
                            const ritardo = getGiorniRitardo(q.data_scadenza);
                            return (
                              <div key={q.id} className="list-group-item d-flex justify-content-between align-items-center py-1">
                                <div>
                                  <span className={scaduta ? 'text-danger fw-bold' : ''}>
                                    {scaduta ? '🚨 ' : ''}{q.causale}
                                  </span>
                                  {scaduta && <span className="badge bg-danger-subtle text-danger ms-1">({ritardo} gg fa)</span>}
                                </div>
                                <span className="fw-bold">€ {(q.importo - (q.importo_pagato || 0)).toFixed(2)}</span>
                              </div>
                            );
                          })}
                          {quoteAperte.length > 3 && (
                            <div className="list-group-item text-muted text-center py-1 small">
                              + altre {quoteAperte.length - 3} quote
                            </div>
                          )}
                        </div>
                      )}

                      {tesserato && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-warning text-dark fw-bold w-100 py-2"
                            onClick={() => {
                              onClose();
                              onOpenPagamento(tesserato.id);
                            }}
                          >
                            <i className="bi bi-cash-coin me-1"></i> Registra Incasso / Salda Quote
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center text-muted">
                    Seleziona un'anagrafica dalla lista a sinistra.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`modal-footer ${isKioskMode ? 'p-4 bg-light' : 'p-3'}`}>
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
