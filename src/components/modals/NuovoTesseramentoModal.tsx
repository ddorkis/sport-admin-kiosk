import React, { useState, useEffect } from 'react';
import { Persona, Anno, Tesserato, Gruppo } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persone: Persona[];
  anni: Anno[];
  gruppi: Gruppo[];
  tesseratiEsistenti: Tesserato[];
  preselectedPersonaId?: number | null;
  onSave: (data: {
    persona_id: number;
    anno_id: number;
    numero_tessera: string;
    tipo_tesseramento: Tesserato['tipo_tesseramento'];
    certificato_medico_scadenza: string;
    gruppo_id?: number | null;
  }) => void;
  isKioskMode?: boolean;
}

export const NuovoTesseramentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  persone,
  anni,
  gruppi,
  tesseratiEsistenti,
  preselectedPersonaId,
  onSave,
  isKioskMode = false
}) => {
  const annoAttivo = anni.find((a) => a.attivo) || anni[0];

  const [personaId, setPersonaId] = useState<number>(preselectedPersonaId || 0);
  const [annoId, setAnnoId] = useState<number>(annoAttivo?.id || 1);
  const [numeroTessera, setNumeroTessera] = useState('');
  const [tipoTesseramento, setTipoTesseramento] = useState<Tesserato['tipo_tesseramento']>('Agonista');
  const [certificatoScadenza, setCertificatoScadenza] = useState('');
  const [gruppoId, setGruppoId] = useState<number | ''>('');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (preselectedPersonaId) {
      setPersonaId(preselectedPersonaId);
    } else if (persone.length > 0 && personaId === 0) {
      setPersonaId(persone[0].id);
    }
  }, [preselectedPersonaId, persone]);

  useEffect(() => {
    // Genera automaticamente un numero tessera progressivo
    const count = tesseratiEsistenti.length + 1;
    const annoStr = annoAttivo ? annoAttivo.anno.replace('/', '-') : '2024';
    setNumeroTessera(`TESS-${annoStr.substring(0, 4)}-${String(count).padStart(3, '0')}`);

    // Default scadenza certificato medico tra 1 anno
    const unAnnoDopo = new Date();
    unAnnoDopo.setFullYear(unAnnoDopo.getFullYear() + 1);
    setCertificatoScadenza(unAnnoDopo.toISOString().substring(0, 10));
  }, [isOpen, tesseratiEsistenti.length]);

  if (!isOpen) return null;

  const selectedPersona = persone.find((p) => p.id === personaId);
  const selectedGruppo = gruppi.find((g) => g.id === Number(gruppoId));

  const filteredPersone = persone.filter((p) => {
    const text = `${p.cognome} ${p.nome} ${p.codice_fiscale}`.toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const handleSubmit = () => {
    if (!personaId) {
      alert('Seleziona una persona da tesserare.');
      return;
    }

    // Controlla se la persona è già tesserata in questo anno
    const giaTesserato = tesseratiEsistenti.some(
      (t) => t.persona_id === personaId && t.anno_id === annoId
    );
    if (giaTesserato) {
      alert('Attenzione: questa persona è già registrata come tesserata per l\'anno sportivo selezionato!');
      return;
    }

    if (!numeroTessera.trim()) {
      alert('Inserisci il numero di tessera.');
      return;
    }

    onSave({
      persona_id: personaId,
      anno_id: annoId,
      numero_tessera: numeroTessera.trim(),
      tipo_tesseramento: tipoTesseramento,
      certificato_medico_scadenza: certificatoScadenza,
      gruppo_id: gruppoId ? Number(gruppoId) : null
    });

    onClose();
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
      <div className={`modal-dialog modal-dialog-centered ${isKioskMode ? 'modal-xl' : 'modal-lg'}`}>
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className={`modal-header ${isKioskMode ? 'bg-success text-white p-4' : 'bg-light p-3'}`}>
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-card-checklist me-2 fs-4"></i>
              Nuovo Tesseramento Annuale
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-3">
              {/* Selezione Persona */}
              <div className="col-12">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>
                  Seleziona Atleta / Persona *
                </label>
                <div className="input-group mb-2">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filtra per cognome, nome o codice fiscale..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
                <select
                  className={`form-select ${isKioskMode ? 'form-select-lg' : ''}`}
                  value={personaId}
                  onChange={(e) => setPersonaId(Number(e.target.value))}
                >
                  <option value={0}>-- Seleziona una persona dall'anagrafica --</option>
                  {filteredPersone.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cognome} {p.nome} ({p.codice_fiscale}) {p.is_minorenne ? '[MINORENNE - Tutore: ' + (p.tutore_cognome || '') + ']' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPersona && (
                <div className="col-12">
                  <div className="card bg-light border-0 p-3 rounded-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <h6 className="fw-bold mb-1">
                          {selectedPersona.cognome} {selectedPersona.nome}
                        </h6>
                        <span className="text-muted small me-3">
                          <i className="bi bi-person-badge me-1"></i>CF: {selectedPersona.codice_fiscale}
                        </span>
                        <span className="text-muted small">
                          <i className="bi bi-calendar me-1"></i>Nato il: {selectedPersona.data_nascita}
                        </span>
                      </div>
                      <div>
                        {selectedPersona.is_minorenne ? (
                          <span className="badge bg-warning text-dark px-3 py-2">
                            <i className="bi bi-shield-check me-1"></i>Minorenne (Tutore: {selectedPersona.tutore_cognome} {selectedPersona.tutore_nome} - Tel: {selectedPersona.tutore_telefono})
                          </span>
                        ) : (
                          <span className="badge bg-secondary px-3 py-2">Maggiorenne</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Anno Sportivo */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Anno Sportivo *</label>
                <select
                  className={`form-select ${isKioskMode ? 'form-select-lg' : ''}`}
                  value={annoId}
                  onChange={(e) => setAnnoId(Number(e.target.value))}
                >
                  {anni.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.anno} {a.attivo ? '(Anno Attivo)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Numero Tessera */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Numero Tessera *</label>
                <input
                  type="text"
                  className={`form-control ${isKioskMode ? 'form-control-lg' : ''} fw-bold`}
                  value={numeroTessera}
                  onChange={(e) => setNumeroTessera(e.target.value)}
                  required
                />
              </div>

              {/* Tipologia Tesseramento */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Tipo Tesseramento</label>
                <select
                  className="form-select"
                  value={tipoTesseramento}
                  onChange={(e) => setTipoTesseramento(e.target.value as Tesserato['tipo_tesseramento'])}
                >
                  <option value="Agonista">Agonista (Visita Medico-Sportiva B1)</option>
                  <option value="Non Agonista">Non Agonista (Certificato Buona Salute)</option>
                  <option value="Promozionale">Promozionale / Avviamento</option>
                  <option value="Socio / Dirigente">Socio / Dirigente / Tecnico</option>
                </select>
              </div>

              {/* Scadenza Certificato Medico */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Scadenza Certificato Medico *</label>
                <input
                  type="date"
                  className="form-control"
                  value={certificatoScadenza}
                  onChange={(e) => setCertificatoScadenza(e.target.value)}
                  required
                />
              </div>

              {/* Iscrizione Diretta a un Gruppo (Opzionale ma molto comoda!) */}
              <div className="col-12 mt-3 p-3 bg-primary bg-opacity-10 border border-primary rounded-3">
                <label className="form-label fw-bold text-primary mb-1">
                  <i className="bi bi-diagram-3-fill me-1"></i>Iscrivi anche a un Gruppo Sportivo (Opzionale)
                </label>
                <p className="text-muted small mb-2">
                  Se selezioni un gruppo, il sistema genererà automaticamente anche il piano delle quote mensili previste!
                </p>
                <select
                  className={`form-select ${isKioskMode ? 'form-select-lg' : ''}`}
                  value={gruppoId}
                  onChange={(e) => setGruppoId(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">-- Nessun gruppo ora (solo tesseramento base) --</option>
                  {gruppi.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome_gruppo} - € {g.quota_mensile.toFixed(2)}/mese ({g.categoria})
                    </option>
                  ))}
                </select>

                {selectedGruppo && (
                  <div className="alert alert-light border mt-2 mb-0 py-2 small">
                    <i className="bi bi-info-circle text-primary me-1"></i>
                    <strong>Gruppo: {selectedGruppo.nome_gruppo}</strong> &bull; Quota mensile: € {selectedGruppo.quota_mensile.toFixed(2)} &bull; Scadenza mensile: giorno {selectedGruppo.giorno_scadenza_mensile} &bull; Periodo: dal {selectedGruppo.data_inizio} al {selectedGruppo.data_fine}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`modal-footer ${isKioskMode ? 'p-4 bg-light' : 'p-3'}`}>
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Annulla
            </button>
            <button
              type="button"
              className={`btn btn-success fw-bold px-4 ${isKioskMode ? 'btn-lg' : ''}`}
              onClick={handleSubmit}
            >
              <i className="bi bi-check-lg me-1"></i> Conferma Tesseramento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
