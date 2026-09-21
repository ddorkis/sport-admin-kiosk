import React, { useState } from 'react';
import { Quota, Persona, Tesserato } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quota: Quota;
  persona?: Persona | null;
  tesserato?: Tesserato | null;
  onConfirmAnnulla: (quotaId: number, motivazione: string) => void;
}

export const AnnullaQuotaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quota,
  persona,
  tesserato,
  onConfirmAnnulla
}) => {
  const [motivazione, setMotivazione] = useState('Ritiro / Interruzione attività');

  if (!isOpen) return null;

  const residuo = quota.importo - (quota.importo_pagato || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAnnulla(quota.id, motivazione);
    onClose();
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="modal-header bg-warning text-dark py-3 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-x-circle-fill fs-5 me-2 text-danger"></i>
              Annullamento Quota / Rata
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="small text-muted text-uppercase fw-bold">Dettagli Rata</div>
                <div className="fs-5 fw-bold text-dark mt-1">{quota.causale}</div>
                {persona && (
                  <div className="text-secondary small">
                    Atleta: <strong>{persona.cognome} {persona.nome}</strong> {tesserato && `(${tesserato.numero_tessera})`}
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                  <span className="small text-muted">Scadenza: <strong>{quota.data_scadenza}</strong></span>
                  <span className="badge bg-danger-subtle text-danger fs-6 fw-bold">
                    Residuo: € {residuo.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Motivazione dell'Annullamento</label>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  {[
                    'Ritiro / Interruzione attività',
                    'Infortunio con certificato medico',
                    'Sgravio / Esenzione autorizzata',
                    'Errore inserimento / Duplicato'
                  ].map((motivoPreset) => (
                    <button
                      key={motivoPreset}
                      type="button"
                      className={`btn btn-xs rounded-pill small py-1 px-2 ${
                        motivazione === motivoPreset ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setMotivazione(motivoPreset)}
                    >
                      {motivoPreset}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Inserisci la motivazione dell'annullamento..."
                  value={motivazione}
                  onChange={(e) => setMotivazione(e.target.value)}
                  required
                />
                <div className="form-text small">
                  La quota non verrà eliminata fisicamente per garantire la trasparenza amministrativa, ma verrà contrassegnata come <strong>annullata</strong> con questa motivazione e azzerata dagli importi esigibili.
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Chiudi
              </button>
              <button type="submit" className="btn btn-danger fw-bold">
                <i className="bi bi-x-circle me-1"></i>
                Conferma Annullamento Quota
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
