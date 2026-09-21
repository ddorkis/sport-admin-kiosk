import React, { useState } from 'react';
import { Persona, Tesserato, Gruppo } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persone: Persona[];
  tesserati: Tesserato[];
  gruppi: Gruppo[];
  preselectedTesseratoId?: number | null;
  onSave: (tesseratoId: number, gruppoId: number) => void;
  isKioskMode?: boolean;
}

export const IscrizioneGruppoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  persone,
  tesserati,
  gruppi,
  preselectedTesseratoId,
  onSave,
  isKioskMode = false
}) => {
  const [tesseratoId, setTesseratoId] = useState<number>(preselectedTesseratoId || (tesserati[0]?.id || 0));
  const [gruppoId, setGruppoId] = useState<number>(gruppi[0]?.id || 0);

  if (!isOpen) return null;

  const currentTesserato = tesserati.find((t) => t.id === tesseratoId);
  const currentPersona = currentTesserato ? persone.find((p) => p.id === currentTesserato.persona_id) : null;
  const currentGruppo = gruppi.find((g) => g.id === gruppoId);

  const handleSubmit = () => {
    if (!tesseratoId || !gruppoId) {
      alert('Seleziona sia il tesserato che il gruppo sportivo.');
      return;
    }
    onSave(tesseratoId, gruppoId);
    onClose();
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
      <div className={`modal-dialog modal-dialog-centered ${isKioskMode ? 'modal-lg' : ''}`}>
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className={`modal-header ${isKioskMode ? 'bg-primary text-white p-4' : 'bg-light p-3'}`}>
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-diagram-3-fill me-2 fs-4"></i>
              Iscrizione a Gruppo & Generazione Quote Mensili
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            <div className="alert alert-info d-flex align-items-start mb-4">
              <i className="bi bi-info-circle-fill fs-4 me-3 mt-1 text-primary"></i>
              <div>
                <strong className="d-block mb-1">Calcolo Automatico delle Quote:</strong>
                In conformità alle regole del gruppo, l'iscrizione genererà in automatico una quota per ciascun mese compreso tra la data di inizio e la data di fine del corso (es. € {currentGruppo?.quota_mensile || 0}/mese), con scadenza fissata al giorno {currentGruppo?.giorno_scadenza_mensile || 10} di ogni mese.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Seleziona Tesserato *</label>
              <select
                className={`form-select ${isKioskMode ? 'form-select-lg' : ''}`}
                value={tesseratoId}
                onChange={(e) => setTesseratoId(Number(e.target.value))}
              >
                {tesserati.map((t) => {
                  const p = persone.find((pers) => pers.id === t.persona_id);
                  return (
                    <option key={t.id} value={t.id}>
                      {p?.cognome} {p?.nome} ({t.numero_tessera}) {p?.is_minorenne ? '[Minorenne]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {currentPersona && (
              <div className="card bg-light border-0 p-3 mb-3 rounded-3">
                <div className="small">
                  <strong>{currentPersona.cognome} {currentPersona.nome}</strong> - CF: {currentPersona.codice_fiscale}
                  {currentPersona.is_minorenne && (
                    <div className="text-warning-emphasis mt-1">
                      <i className="bi bi-shield me-1"></i>Tutore: {currentPersona.tutore_cognome} {currentPersona.tutore_nome} ({currentPersona.tutore_telefono})
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Seleziona Gruppo Sportivo *</label>
              <select
                className={`form-select ${isKioskMode ? 'form-select-lg' : ''}`}
                value={gruppoId}
                onChange={(e) => setGruppoId(Number(e.target.value))}
              >
                {gruppi.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome_gruppo} - € {g.quota_mensile.toFixed(2)}/mese ({g.categoria})
                  </option>
                ))}
              </select>
            </div>

            {currentGruppo && (
              <div className="card border-primary p-3 rounded-3 bg-white">
                <h6 className="fw-bold text-primary mb-2">{currentGruppo.nome_gruppo}</h6>
                <div className="row g-2 small">
                  <div className="col-6">
                    <span className="text-muted">Quota Mensile:</span>{' '}
                    <strong className="text-success fs-6">€ {currentGruppo.quota_mensile.toFixed(2)}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Giorno Scadenza:</span>{' '}
                    <strong>Ogni {currentGruppo.giorno_scadenza_mensile} del mese</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Data Inizio:</span>{' '}
                    <strong>{currentGruppo.data_inizio}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Data Fine:</span>{' '}
                    <strong>{currentGruppo.data_fine}</strong>
                  </div>
                  <div className="col-12 mt-1">
                    <span className="text-muted">Istruttore:</span>{' '}
                    <strong>{currentGruppo.istruttore || 'Non assegnato'}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`modal-footer ${isKioskMode ? 'p-4 bg-light' : 'p-3'}`}>
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Annulla
            </button>
            <button
              type="button"
              className={`btn btn-primary fw-bold px-4 ${isKioskMode ? 'btn-lg' : ''}`}
              onClick={handleSubmit}
            >
              <i className="bi bi-check2-circle me-1"></i> Iscrivi e Genera Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
