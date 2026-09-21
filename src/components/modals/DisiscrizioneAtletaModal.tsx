import React, { useState } from 'react';
import { Tesserato, Persona, Gruppo, GruppoTesserato, Quota } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tesserato: Tesserato;
  persona: Persona;
  gruppi: Gruppo[];
  gruppiTesserati: GruppoTesserato[];
  quote: Quota[];
  onConfirmDisiscrizione: (payload: {
    tesseratoId: number;
    gruppoId?: number; // se disiscrive da un gruppo specifico o da tutti
    disiscriviDaTutti: boolean;
    dataRitiro: string;
    motivo: string;
    annullaQuoteFuture: boolean;
    sospendiTessera: boolean;
  }) => void;
}

export const DisiscrizioneAtletaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tesserato,
  persona,
  gruppi,
  gruppiTesserati,
  quote,
  onConfirmDisiscrizione
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [dataRitiro, setDataRitiro] = useState(todayStr);
  const [motivo, setMotivo] = useState('Ritiro volontario / interruzione attività');
  const [annullaQuoteFuture, setAnnullaQuoteFuture] = useState(true);
  const [sospendiTessera, setSospendiTessera] = useState(false);

  // Gruppi a cui è attualmente iscritto questo tesserato
  const userIscrizioni = gruppiTesserati.filter((gt) => gt.tesserato_id === tesserato.id);
  const userGruppi = gruppi.filter((g) => userIscrizioni.some((gt) => gt.gruppo_id === g.id));

  const [selectedTarget, setSelectedTarget] = useState<string>('all'); // 'all' oppure id del gruppo

  if (!isOpen) return null;

  // Calcolo quote future che verrebbero annullate
  const quoteFutureNonSaldate = quote.filter((q) => {
    if (q.tesserato_id !== tesserato.id) return false;
    if (q.stato === 'pagata' || q.stato === 'annullata') return false;
    if (selectedTarget !== 'all' && q.gruppo_id !== Number(selectedTarget)) return false;
    return q.data_scadenza >= dataRitiro;
  });

  const totaleSgravabile = quoteFutureNonSaldate.reduce(
    (acc, q) => acc + (q.importo - (q.importo_pagato || 0)),
    0
  );

  const quoteGiaScadute = quote.filter((q) => {
    if (q.tesserato_id !== tesserato.id) return false;
    if (q.stato === 'pagata' || q.stato === 'annullata') return false;
    if (selectedTarget !== 'all' && q.gruppo_id !== Number(selectedTarget)) return false;
    return q.data_scadenza < dataRitiro;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDisiscrizione({
      tesseratoId: tesserato.id,
      gruppoId: selectedTarget === 'all' ? undefined : Number(selectedTarget),
      disiscriviDaTutti: selectedTarget === 'all',
      dataRitiro,
      motivo,
      annullaQuoteFuture,
      sospendiTessera
    });
    onClose();
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="modal-header bg-danger text-white py-3 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-person-x-fill fs-4 me-2"></i>
              Disiscrizione Corso / Ritiro Atleta
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Box Info Atleta */}
              <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="small text-muted text-uppercase fw-bold">Atleta Selezionato</div>
                  <h4 className="mb-0 fw-bold text-dark">
                    {persona.cognome} {persona.nome}
                  </h4>
                  <div className="small text-muted">
                    Tessera: <strong className="font-monospace text-primary">{tesserato.numero_tessera}</strong> • CF: {persona.codice_fiscale}
                  </div>
                </div>
                {persona.is_minorenne && (
                  <div className="badge bg-warning-subtle text-warning-emphasis border p-2 text-start">
                    <div className="fw-bold">
                      <i className="bi bi-shield-check me-1"></i>Tutore: {persona.tutore_cognome} {persona.tutore_nome}
                    </div>
                    <div className="small text-muted">{persona.tutore_telefono}</div>
                  </div>
                )}
              </div>

              {/* Selezione Ambito di Disiscrizione */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Da quale corso / gruppo desideri disiscrivere l'atleta?
                </label>
                {userGruppi.length === 0 ? (
                  <div className="alert alert-secondary py-2 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    L'atleta non risulta iscritto a nessun gruppo attivo. Potrai comunque sgravare le quote in sospeso.
                  </div>
                ) : userGruppi.length === 1 ? (
                  <div className="p-2 border rounded bg-white d-flex align-items-center gap-2">
                    <i className="bi bi-diagram-3 text-primary fs-5"></i>
                    <div>
                      <strong>{userGruppi[0].nome_gruppo}</strong> ({userGruppi[0].categoria})
                    </div>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                  >
                    <option value="all">Tutti i gruppi a cui è iscritto ({userGruppi.length} corsi)</option>
                    {userGruppi.map((g) => (
                      <option key={g.id} value={g.id}>
                        Solo da: {g.nome_gruppo}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="row g-3 mb-3">
                {/* Data di Ritiro */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Data di Ritiro / Decorrenza Interruzione</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dataRitiro}
                    onChange={(e) => setDataRitiro(e.target.value)}
                    required
                  />
                  <div className="form-text small">
                    Le quote con scadenza a partire da questa data verranno considerate future.
                  </div>
                </div>

                {/* Motivo */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Motivazione Ritiro</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Es. Interruzione volontaria, infortunio, trasferimento..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Box Gestione Automatica Quote */}
              <div className="card border-warning-subtle bg-warning bg-opacity-10 rounded-3 mb-3 p-3">
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="switchAnnullaQuote"
                    checked={annullaQuoteFuture}
                    onChange={(e) => setAnnullaQuoteFuture(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold text-dark" htmlFor="switchAnnullaQuote">
                    Annulla automaticamente le quote mensili future non saldate ({quoteFutureNonSaldate.length} rate)
                  </label>
                </div>
                <p className="small text-muted mb-2">
                  Impostando le quote future come <strong>annullate</strong>, non compariranno più tra le somme da incassare o negli insoluti e ne verrà conservata la traccia contabile.
                </p>

                {quoteFutureNonSaldate.length > 0 && annullaQuoteFuture && (
                  <div className="border rounded bg-white p-2 small mt-2">
                    <div className="fw-bold text-success mb-1">
                      <i className="bi bi-check-circle me-1"></i>
                      Totale quote future che verranno sgravate: <strong>€ {totaleSgravabile.toFixed(2)}</strong>
                    </div>
                    <ul className="mb-0 ps-3 text-muted">
                      {quoteFutureNonSaldate.slice(0, 4).map((q) => (
                        <li key={q.id}>
                          {q.causale} (Scadenza: {q.data_scadenza}) - € {(q.importo - (q.importo_pagato || 0)).toFixed(2)}
                        </li>
                      ))}
                      {quoteFutureNonSaldate.length > 4 && (
                        <li>...e altre {quoteFutureNonSaldate.length - 4} rate</li>
                      )}
                    </ul>
                  </div>
                )}

                {quoteGiaScadute.length > 0 && (
                  <div className="alert alert-light border-danger text-danger py-2 px-3 small mt-2 mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    <strong>Nota:</strong> Ci sono {quoteGiaScadute.length} quote scadute prima della data di ritiro (mesi già frequentati o passati). Queste rimarranno intatte come debito pregresso.
                  </div>
                )}
              </div>

              {/* Opzione Sospensione Tesseramento */}
              <div className="form-check p-3 bg-light border rounded-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="checkSospendiTessera"
                  checked={sospendiTessera}
                  onChange={(e) => setSospendiTessera(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="checkSospendiTessera">
                  <strong>Imposta stato tessera su "Sospeso"</strong> (invece di lasciarlo "Attivo").
                  <span className="d-block text-muted">
                    L'atleta non figurerà tra i praticanti attivi del registro, ma l'anagrafica e la tessera non vengono cancellate.
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="btn btn-danger fw-bold px-4">
                <i className="bi bi-check2-circle me-1"></i>
                Conferma Disiscrizione
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
