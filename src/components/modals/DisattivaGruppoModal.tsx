import React, { useState } from 'react';
import { Gruppo, GruppoTesserato, Quota, Tesserato, Persona } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gruppo: Gruppo | null;
  gruppiTesserati: GruppoTesserato[];
  quote: Quota[];
  tesserati: Tesserato[];
  persone: Persona[];
  onConfirmDisattiva: (params: {
    gruppoId: number;
    dataInterruzione: string;
    annullaQuoteFuture: boolean;
    motivo: string;
    creaNuovoSubito: boolean;
  }) => void;
}

export const DisattivaGruppoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gruppo,
  gruppiTesserati,
  quote,
  tesserati,
  persone,
  onConfirmDisattiva
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [dataInterruzione, setDataInterruzione] = useState(todayStr);
  const [motivo, setMotivo] = useState('Rimodulazione corso / variazione importo mensile');
  const [annullaQuoteFuture, setAnnullaQuoteFuture] = useState(true);
  const [creaNuovoSubito, setCreaNuovoSubito] = useState(true);

  if (!isOpen || !gruppo) return null;

  // Iscritti al gruppo
  const iscritti = gruppiTesserati.filter((gt) => gt.gruppo_id === gruppo.id);

  // Quote future o non saldate collegate a questo gruppo
  const quoteFutureNonSaldate = quote.filter((q) => {
    if (q.gruppo_id !== gruppo.id) return false;
    if (q.stato === 'pagata' || q.stato === 'annullata') return false;
    return q.data_scadenza >= dataInterruzione;
  });

  const totaleSgravabile = quoteFutureNonSaldate.reduce(
    (acc, q) => acc + (q.importo - (q.importo_pagato || 0)),
    0
  );

  // Quote passate già saldate (che rimangono valide e intatte)
  const quoteGiaSaldate = quote.filter(
    (q) => q.gruppo_id === gruppo.id && q.stato === 'pagata'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDisattiva({
      gruppoId: gruppo.id,
      dataInterruzione,
      annullaQuoteFuture,
      motivo: motivo.trim() || 'Rimodulazione corso per variazione tariffa',
      creaNuovoSubito
    });
    onClose();
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="modal-header bg-warning text-dark py-3 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center mb-0">
              <i className="bi bi-pause-circle-fill me-2 fs-4"></i>
              Disattivazione Corso & Gestione Quote Future
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Banner esplicativo regola contabile */}
              <div className="alert alert-info border-info d-flex align-items-start p-3 rounded-3 mb-4 shadow-sm">
                <i className="bi bi-info-circle-fill fs-3 text-primary me-3 flex-shrink-0 mt-1"></i>
                <div className="small">
                  <strong className="d-block mb-1 fs-6">Procedura Corretta di Variazione Importo o Chiusura Corso:</strong>
                  Stai per disattivare il corso <strong>"{gruppo.nome_gruppo}"</strong> (€ {gruppo.quota_mensile.toFixed(2)}/mese).
                  <br />
                  Questa procedura preserva lo storico contabile e le <strong>{quoteGiaSaldate.length} quote già saldate</strong> (ricevute e rendiconto restano intatti).
                  Contestualmente, puoi <strong>annullare in automatico le rate future</strong> non ancora pagate da questa data in avanti,
                  per poi creare il nuovo gruppo con il nuovo importo.
                </div>
              </div>

              {/* Dati del corso da disattivare */}
              <div className="bg-light p-3 rounded-3 mb-4 border">
                <div className="row g-2 align-items-center">
                  <div className="col-md-6">
                    <span className="text-muted d-block small">Corso Sportivo:</span>
                    <strong className="fs-6 text-dark">{gruppo.nome_gruppo}</strong>
                    <span className="badge bg-secondary ms-2">{gruppo.categoria}</span>
                  </div>
                  <div className="col-md-3">
                    <span className="text-muted d-block small">Tariffa Attuale:</span>
                    <strong className="text-primary fs-6">€ {gruppo.quota_mensile.toFixed(2)} / mese</strong>
                  </div>
                  <div className="col-md-3">
                    <span className="text-muted d-block small">Atleti Iscritti:</span>
                    <strong>{iscritti.length} atleti</strong>
                  </div>
                </div>
              </div>

              {/* Configurazione Data e Regole di Sgravio */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark">
                    <i className="bi bi-calendar-x me-1 text-danger"></i> Data Decorrenza Disattivazione / Variazione *
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-lg fw-semibold"
                    value={dataInterruzione}
                    onChange={(e) => setDataInterruzione(e.target.value)}
                    required
                  />
                  <div className="form-text small">
                    Le rate con scadenza pari o successiva a questa data verranno considerate "future".
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark">
                    <i className="bi bi-chat-left-text me-1 text-secondary"></i> Motivo Annullamento Quote
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="es. Variazione tariffa corso / rimodulazione orari"
                    required
                  />
                  <div className="form-text small">
                    Verrà annotato nelle note di ciascuna quota annullata a fini di trasparenza.
                  </div>
                </div>
              </div>

              {/* Box Riepilogo Quote da Annullare */}
              <div className="card border-warning-subtle bg-warning-subtle bg-opacity-25 rounded-3 mb-4 p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center">
                    <i className="bi bi-receipt-cutoff me-2 text-warning fs-5"></i>
                    Quote Future Interessate dallo Sgravio
                  </h6>
                  <span className="badge bg-warning text-dark fs-6">
                    {quoteFutureNonSaldate.length} rate &bull; Totale: € {totaleSgravabile.toFixed(2)}
                  </span>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="chkAnnullaFuture"
                    checked={annullaQuoteFuture}
                    onChange={(e) => setAnnullaQuoteFuture(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold text-dark" htmlFor="chkAnnullaFuture">
                    Annulla automaticamente tutte le {quoteFutureNonSaldate.length} quote non saldate dal {dataInterruzione} in poi
                  </label>
                  <div className="text-muted small ps-4">
                    Le quote verranno contrassegnate come "Annullata" senza eliminare le registrazioni, garantendo la tracciabilità contabile.
                  </div>
                </div>

                {quoteFutureNonSaldate.length > 0 && annullaQuoteFuture && (
                  <div className="bg-white rounded-2 p-2 border small" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    <table className="table table-sm table-borderless mb-0">
                      <thead>
                        <tr className="text-muted border-bottom">
                          <th>Atleta</th>
                          <th>Causale</th>
                          <th>Scadenza</th>
                          <th className="text-end">Importo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteFutureNonSaldate.slice(0, 10).map((q) => {
                          const tess = tesserati.find((t) => t.id === q.tesserato_id);
                          const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
                          return (
                            <tr key={q.id}>
                              <td>{pers ? `${pers.cognome} ${pers.nome}` : `Tessera #${q.tesserato_id}`}</td>
                              <td>{q.causale}</td>
                              <td>{q.data_scadenza}</td>
                              <td className="text-end fw-bold text-danger">€ {q.importo.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {quoteFutureNonSaldate.length > 10 && (
                      <div className="text-center text-muted py-1 small">
                        ...ed altre {quoteFutureNonSaldate.length - 10} quote mensili
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Opzione Creazione Nuovo Gruppo */}
              <div className="form-check form-switch p-3 bg-light rounded-3 border">
                <input
                  className="form-check-input ms-0 me-3"
                  type="checkbox"
                  role="switch"
                  id="chkCreaNuovo"
                  checked={creaNuovoSubito}
                  onChange={(e) => setCreaNuovoSubito(e.target.checked)}
                />
                <label className="form-check-label fw-bold text-dark" htmlFor="chkCreaNuovo">
                  <i className="bi bi-plus-circle text-primary me-1"></i>
                  Apri subito la creazione del Nuovo Gruppo con il nuovo importo
                </label>
                <div className="text-muted small ps-5">
                  Dopo aver disattivato questo corso e sgravato le quote, verrai reindirizzato direttamente alla schermata di creazione del nuovo gruppo.
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="btn btn-danger fw-bold shadow-sm px-4">
                <i className="bi bi-check-lg me-1"></i> Conferma Disattivazione Corso
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
