import React, { useState } from 'react';
import { Anno } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anni: Anno[];
  annoAttivo?: Anno;
  onSelectAnno: (annoId: number) => void;
  onCreateAnno: (anno: Omit<Anno, 'id'>) => void;
  isKioskMode?: boolean;
}

export const GestioneAnnoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  anni,
  annoAttivo,
  onSelectAnno,
  onCreateAnno,
  isKioskMode = false
}) => {
  const [mostraFormNuovo, setMostraFormNuovo] = useState(false);
  const [nomeAnno, setNomeAnno] = useState('');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [impostaAttivo, setImpostaAttivo] = useState(true);

  if (!isOpen) return null;

  const handleSubmitNuovo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAnno.trim() || !dataInizio || !dataFine) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    onCreateAnno({
      anno: nomeAnno.trim(),
      data_inizio: dataInizio,
      data_fine: dataFine,
      attivo: impostaAttivo
    });

    setNomeAnno('');
    setDataInizio('');
    setDataFine('');
    setMostraFormNuovo(false);
  };

  // Precompila suggerimento anno successivo
  const suggerisciAnnoSuccessivo = () => {
    const currentYear = new Date().getFullYear();
    setNomeAnno(`${currentYear + 1}/${currentYear + 2}`);
    setDataInizio(`${currentYear + 1}-09-01`);
    setDataFine(`${currentYear + 2}-06-30`);
    setMostraFormNuovo(true);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className={`modal-dialog ${isKioskMode ? 'modal-lg' : ''} modal-dialog-centered`}>
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-calendar-range-fill text-warning"></i>
              Cambia Anno Sportivo
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-1">Seleziona l'anno sportivo di lavoro</h6>
                <p className="text-muted small mb-0">
                  I tesseramenti, i gruppi e le statistiche faranno riferimento all'anno selezionato.
                </p>
              </div>
              {!mostraFormNuovo && (
                <button
                  type="button"
                  onClick={suggerisciAnnoSuccessivo}
                  className="btn btn-sm btn-outline-primary fw-semibold d-flex align-items-center gap-1"
                >
                  <i className="bi bi-plus-circle"></i>
                  Nuovo Anno
                </button>
              )}
            </div>

            {/* Elenco Anni Configurati */}
            <div className="list-group mb-4 shadow-sm">
              {anni.map((a) => {
                const isCurrent = a.id === annoAttivo?.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectAnno(a.id);
                      onClose();
                    }}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 cursor-pointer ${
                      isCurrent ? 'border-primary bg-primary-subtle text-primary-emphasis fw-bold' : ''
                    }`}
                    style={{ transition: 'all 0.15s ease' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="fs-4">
                        {isCurrent ? (
                          <i className="bi bi-check-circle-fill text-primary"></i>
                        ) : (
                          <i className="bi bi-circle text-muted"></i>
                        )}
                      </div>
                      <div>
                        <div className="fs-5 fw-bold d-flex align-items-center gap-2">
                          Anno Sportivo {a.anno}
                          {isCurrent && (
                            <span className="badge bg-primary text-white fs-7 py-1 px-2">
                              ATTIVO ATTUALMENTE
                            </span>
                          )}
                        </div>
                        <div className="small text-muted">
                          <i className="bi bi-calendar-event me-1"></i>
                          Dal {new Date(a.data_inizio).toLocaleDateString('it-IT')} al{' '}
                          {new Date(a.data_fine).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      {isCurrent ? 'Selezionato' : 'Seleziona'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Form creazione nuovo anno */}
            {mostraFormNuovo && (
              <div className="card border-primary bg-light p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0">
                    <i className="bi bi-calendar-plus me-1"></i> Crea Nuovo Anno Sportivo
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0"
                    onClick={() => setMostraFormNuovo(false)}
                  >
                    Annulla
                  </button>
                </div>

                <form onSubmit={handleSubmitNuovo}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Nome Anno Sportivo (es. 2025/2026) *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="es. 2025/2026"
                        value={nomeAnno}
                        onChange={(e) => setNomeAnno(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Data Inizio *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dataInizio}
                        onChange={(e) => setDataInizio(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Data Fine *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dataFine}
                        onChange={(e) => setDataFine(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="impostaAttivo"
                          checked={impostaAttivo}
                          onChange={(e) => setImpostaAttivo(e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="impostaAttivo">
                          Imposta subito questo anno come attivo
                        </label>
                      </div>
                    </div>
                    <div className="col-12 text-end">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm me-2"
                        onClick={() => setMostraFormNuovo(false)}
                      >
                        Chiudi
                      </button>
                      <button type="submit" className="btn btn-success btn-sm fw-bold">
                        <i className="bi bi-check-lg me-1"></i> Salva Anno
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
