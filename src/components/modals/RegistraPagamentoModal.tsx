import React, { useState, useEffect } from 'react';
import { Persona, Tesserato, Quota, Pagamento } from '../../types';
import { isQuotaScaduta } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persone: Persona[];
  tesserati: Tesserato[];
  quote: Quota[];
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

export const RegistraPagamentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  persone,
  tesserati,
  quote,
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
  const [ricevutaGenerata, setRicevutaGenerata] = useState<Pagamento | null>(null);

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

  if (!isOpen) return null;

  const currentTesserato = tesserati.find((t) => t.id === tesseratoId);
  const currentPersona = currentTesserato ? persone.find((p) => p.id === currentTesserato.persona_id) : null;

  // Quote aperte per questo tesserato
  const quoteAperteTesserato = quote.filter(
    (q) => q.tesserato_id === tesseratoId && q.stato !== 'pagata' && q.stato !== 'annullata'
  );

  const handleSubmit = () => {
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
        finalCausale = `Incasso ${q.causale}`;
        finalQuotaId = q.id;
      }
    } else {
      if (!causaleLibera.trim()) {
        alert('Inserisci la causale per questo pagamento libero / non riconducibile a quota (es. Kit gara, Visita medica, Quota iscrizione)');
        return;
      }
      finalCausale = causaleLibera.trim();
      finalQuotaId = null;
    }

    onSave({
      tesserato_id: tesseratoId,
      quota_id: finalQuotaId,
      importo: numImporto,
      metodo_pagamento: metodo,
      causale: finalCausale,
      note: note.trim()
    });

    onClose();
  };

  const importiRapidi = [20, 30, 45, 50, 60, 100];

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
      <div className={`modal-dialog modal-dialog-centered ${isKioskMode ? 'modal-xl' : 'modal-lg'}`}>
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className={`modal-header ${isKioskMode ? 'bg-warning text-dark p-4' : 'bg-light p-3'}`}>
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-cash-coin me-2 fs-4"></i>
              Registrazione Pagamento / Incasso
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-3">
              {/* Selezione Tesserato */}
              <div className="col-12">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>
                  Seleziona Atleta / Tesserato *
                </label>
                <select
                  className={`form-select ${isKioskMode ? 'form-select-lg' : ''}`}
                  value={tesseratoId}
                  onChange={(e) => {
                    const newTessId = Number(e.target.value);
                    setTesseratoId(newTessId);
                    setQuotaId('');
                  }}
                >
                  <option value={0}>-- Seleziona atleta tesserato --</option>
                  {tesserati.map((t) => {
                    const p = persone.find((pers) => pers.id === t.persona_id);
                    return (
                      <option key={t.id} value={t.id}>
                        {p?.cognome} {p?.nome} - {t.numero_tessera} {p?.is_minorenne ? '(Minorenne)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Informazioni Atleta e Tutore */}
              {currentPersona && (
                <div className="col-12">
                  <div className="card bg-light border-0 p-3 rounded-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <strong className="fs-6">{currentPersona.cognome} {currentPersona.nome}</strong>
                        <span className="text-muted ms-2">({currentTesserato?.numero_tessera})</span>
                        {currentPersona.is_minorenne && (
                          <div className="text-warning-emphasis small mt-1">
                            <i className="bi bi-shield-shaded me-1"></i>
                            Tutore Legale: <strong>{currentPersona.tutore_cognome} {currentPersona.tutore_nome}</strong> (Tel: {currentPersona.tutore_telefono})
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <span className="badge bg-secondary">
                          {quoteAperteTesserato.length} Quote in sospeso
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tipo di Pagamento: Quota o Extra */}
              <div className="col-12">
                <label className="form-label fw-semibold d-block">Tipo di Pagamento *</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${isQuotaPayment ? 'btn-primary active fw-bold' : 'btn-outline-primary'} py-2`}
                    onClick={() => setIsQuotaPayment(true)}
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    Relativo a una Quota Mensile / Corso
                  </button>
                  <button
                    type="button"
                    className={`btn ${!isQuotaPayment ? 'btn-primary active fw-bold' : 'btn-outline-primary'} py-2`}
                    onClick={() => {
                      setIsQuotaPayment(false);
                      setQuotaId('');
                    }}
                  >
                    <i className="bi bi-bag-plus me-2"></i>
                    Pagamento Libero / Non Quota (Kit, Visita, Evento)
                  </button>
                </div>
              </div>

              {/* Se Relativo a Quota */}
              {isQuotaPayment ? (
                <div className="col-12 p-3 bg-light rounded-3 border">
                  <label className="form-label fw-semibold">Seleziona Quota da Saldare *</label>
                  {quoteAperteTesserato.length === 0 ? (
                    <div className="alert alert-success mb-0 py-2">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Questo atleta non ha quote mensili aperte o scadute da pagare!
                    </div>
                  ) : (
                    <select
                      className="form-select form-select-lg"
                      value={quotaId}
                      onChange={(e) => setQuotaId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">-- Seleziona una quota in sospeso --</option>
                      {quoteAperteTesserato.map((q) => {
                        const scaduta = isQuotaScaduta(q);
                        const daSaldare = q.importo - (q.importo_pagato || 0);
                        return (
                          <option key={q.id} value={q.id}>
                            {scaduta ? '🚨 [SCADUTA] ' : '⏳ '} {q.causale} - Da saldare: € {daSaldare.toFixed(2)} (Scadenza: {q.data_scadenza})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              ) : (
                /* Pagamento Libero non riconducibile a quota */
                <div className="col-12 p-3 bg-light rounded-3 border">
                  <label className="form-label fw-semibold">Causale Pagamento Extra *</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Es. Acquisto Kit Gara Ufficiale, Visita Medico-Sportiva, Quota Torneo"
                    value={causaleLibera}
                    onChange={(e) => setCausaleLibera(e.target.value)}
                  />
                  <div className="form-text">
                    Questo pagamento verrà registrato in cassa come entrata libera, senza chiudere quote mensili.
                  </div>
                </div>
              )}

              {/* Importo e Scorciatoie Touch */}
              <div className="col-md-6">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>Importo (€) *</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text fw-bold">€</span>
                  <input
                    type="number"
                    step="0.50"
                    className="form-control fw-bold text-primary"
                    placeholder="0.00"
                    value={importo}
                    onChange={(e) => setImporto(e.target.value)}
                    required
                  />
                </div>
                {/* Tasti Rapidi per Kiosk */}
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {importiRapidi.map((imp) => (
                    <button
                      key={imp}
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setImporto(imp.toString())}
                    >
                      € {imp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metodo di Pagamento */}
              <div className="col-md-6">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>Metodo di Pagamento *</label>
                <div className="row g-2">
                  {[
                    { id: 'contanti', label: 'Contanti', icon: 'bi-cash' },
                    { id: 'pos', label: 'POS / Carta', icon: 'bi-credit-card' },
                    { id: 'bonifico', label: 'Bonifico', icon: 'bi-bank' },
                    { id: 'satispay', label: 'Satispay', icon: 'bi-phone' },
                  ].map((m) => (
                    <div key={m.id} className="col-6">
                      <button
                        type="button"
                        className={`btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 ${
                          metodo === m.id ? 'btn-success fw-bold shadow-sm' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setMetodo(m.id as Pagamento['metodo_pagamento'])}
                      >
                        <i className={`bi ${m.icon}`}></i>
                        {m.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note / Rif. Ricevuta */}
              <div className="col-12">
                <label className="form-label fw-semibold">Note / Pagatore (Opzionale)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Es. Ricevuto da Papà Giuseppe, transazione POS #1234"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={`modal-footer ${isKioskMode ? 'p-4 bg-light' : 'p-3'}`}>
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Annulla
            </button>
            <button
              type="button"
              className={`btn btn-warning text-dark fw-bold px-5 ${isKioskMode ? 'btn-lg' : ''}`}
              onClick={handleSubmit}
            >
              <i className="bi bi-check2-circle me-1"></i> Registra ed Emetti Ricevuta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
