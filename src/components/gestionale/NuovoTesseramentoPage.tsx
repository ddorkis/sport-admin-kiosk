import React, { useState, useEffect } from 'react';
import { Persona, Anno, Tesserato, Gruppo } from '../../types';

interface Props {
  onBack: () => void;
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
  onOpenNuovaPersona?: () => void;
  isKioskMode?: boolean;
}

export const NuovoTesseramentoPage: React.FC<Props> = ({
  onBack,
  persone,
  anni,
  gruppi,
  tesseratiEsistenti,
  preselectedPersonaId,
  onSave,
  onOpenNuovaPersona,
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
  }, [annoAttivo, tesseratiEsistenti.length]);

  const selectedPersona = persone.find((p) => p.id === personaId);
  const selectedGruppo = gruppi.find((g) => g.id === Number(gruppoId));

  const filteredPersone = persone.filter((p) => {
    const text = `${p.cognome} ${p.nome} ${p.codice_fiscale}`.toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const giaTesserato = Boolean(
    personaId && tesseratiEsistenti.some((t) => t.persona_id === personaId && t.anno_id === annoId)
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!personaId) {
      alert('Seleziona una persona da tesserare.');
      return;
    }

    if (giaTesserato) {
      alert('Attenzione: questa persona risulta già tesserata per l\'anno sportivo selezionato!');
      return;
    }

    if (!numeroTessera.trim()) {
      alert('Inserisci il numero di tessera federale o promozionale.');
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

    onBack();
  };

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
                  <i className="bi bi-card-checklist me-1"></i> Registro Tesserati
                </button>
              </li>
              <li className="breadcrumb-item active text-success fw-semibold" aria-current="page">
                Nuovo Tesseramento Sportivo
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center text-dark">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={onBack}
              title="Torna all'elenco tesserati"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <span>Nuovo Tesseramento Sportivo FISR / EPS</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            Collega un atleta presente in anagrafica all'anno sportivo, assegna la tessera, registra la visita medica e il corso.
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
            className="btn btn-success fw-bold px-4 shadow-sm"
            onClick={() => handleSubmit()}
            disabled={giaTesserato}
          >
            <i className="bi bi-check-lg me-1"></i> Salva e Torna alla Lista
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Sezione 1: Selezione Atleta */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-person-check-fill me-2 text-success fs-5"></i> 1. Seleziona Atleta da Anagrafica
                </h5>
                {onOpenNuovaPersona && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm fw-semibold"
                    onClick={onOpenNuovaPersona}
                  >
                    <i className="bi bi-person-plus me-1"></i> Crea Nuova Anagrafica
                  </button>
                )}
              </div>
              <div className="card-body p-4">
                {/* Campo di ricerca rapida */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Cerca atleta:</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filtra per cognome, nome o CF..."
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
                  <label className="form-label fw-semibold text-dark">Seleziona Atleta *</label>
                  <select
                    className="form-select form-select-lg"
                    value={personaId}
                    onChange={(e) => setPersonaId(Number(e.target.value))}
                    required
                  >
                    {filteredPersone.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.cognome} {p.nome} — {p.codice_fiscale} ({p.is_minorenne ? 'Minorenne' : 'Maggiorenne'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scheda Riepilogo Atleta Selezionato */}
                {selectedPersona && (
                  <div className={`p-3 rounded-3 border ${giaTesserato ? 'bg-danger-subtle border-danger' : 'bg-light border-secondary-subtle'}`}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-person-circle me-2 text-primary"></i>
                        {selectedPersona.cognome} {selectedPersona.nome}
                      </h6>
                      <span className={`badge ${selectedPersona.is_minorenne ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {selectedPersona.is_minorenne ? 'Minorenne' : 'Maggiorenne'}
                      </span>
                    </div>

                    <div className="small text-muted mb-1">
                      <strong>Codice Fiscale:</strong> <code>{selectedPersona.codice_fiscale}</code>
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Nascita:</strong> {selectedPersona.data_nascita} ({selectedPersona.luogo_nascita || 'N.D.'})
                    </div>
                    {selectedPersona.is_minorenne && selectedPersona.tutore_nome && (
                      <div className="small text-muted mt-2 pt-2 border-top border-secondary-subtle">
                        <strong>Tutore:</strong> {selectedPersona.tutore_cognome} {selectedPersona.tutore_nome} ({selectedPersona.tutore_relazione}) &bull; Tel: {selectedPersona.tutore_telefono}
                      </div>
                    )}

                    {giaTesserato && (
                      <div className="alert alert-danger mb-0 mt-3 p-2 small d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
                        <span>Questo atleta è già tesserato per l'anno sportivo selezionato. Non è possibile duplicare il tesseramento.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sezione 2: Dati Federali e Corso */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-award-fill me-2 text-success fs-5"></i> 2. Dati Tesseramento & Visita Medica
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Anno Sportivo *</label>
                    <select
                      className="form-select"
                      value={annoId}
                      onChange={(e) => setAnnoId(Number(e.target.value))}
                      required
                    >
                      {anni.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.anno} {a.attivo ? '(Attivo)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Tipo Tesseramento *</label>
                    <select
                      className="form-select"
                      value={tipoTesseramento}
                      onChange={(e) => setTipoTesseramento(e.target.value as Tesserato['tipo_tesseramento'])}
                      required
                    >
                      <option value="Agonista">Agonista (Gare Federali FISR/EPS)</option>
                      <option value="Non Agonista">Non Agonista (Attività Corsi)</option>
                      <option value="Promozionale">Promozionale / Primi Passi</option>
                      <option value="Socio / Dirigente">Socio / Dirigente / Ufficiale</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Numero Tessera Federale / Codice *</label>
                    <input
                      type="text"
                      className="form-control font-monospace fw-bold"
                      value={numeroTessera}
                      onChange={(e) => setNumeroTessera(e.target.value)}
                      required
                    />
                    <div className="form-text small">Generato in automatico ma modificabile se assegnato dalla FISR</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Data Scadenza Certificato Medico *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={certificatoScadenza}
                      onChange={(e) => setCertificatoScadenza(e.target.value)}
                      required
                    />
                    <div className="form-text small">
                      {tipoTesseramento === 'Agonista'
                        ? 'Obbligatorio certificato medico agonistico Tabella B1 (Sport Rotellistici).'
                        : 'Certificato medico per attività non agonistica con ECG.'}
                    </div>
                  </div>

                  <div className="col-12 pt-2 border-top">
                    <label className="form-label fw-semibold text-dark">
                      Iscrizione a Gruppo / Corso (Opzionale)
                    </label>
                    <select
                      className="form-select"
                      value={gruppoId}
                      onChange={(e) => setGruppoId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">-- Nessun gruppo associato per ora --</option>
                      {gruppi.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome_gruppo} ({g.categoria}) &bull; Quota: € {g.quota_mensile.toFixed(2)}/mese
                        </option>
                      ))}
                    </select>
                    {selectedGruppo && (
                      <div className="alert alert-info py-2 px-3 mt-2 small mb-0 rounded-2">
                        <i className="bi bi-info-circle me-1"></i>
                        <strong>Automatismo Quote:</strong> L'atleta verrà iscritto a <em>{selectedGruppo.nome_gruppo}</em> e verranno predisposte le scadenze mensili da € {selectedGruppo.quota_mensile.toFixed(2)}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra Azioni Finali */}
            <div className="card border-0 bg-light rounded-3 p-3 text-end">
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
                  className="btn btn-success fw-bold px-4 shadow-sm"
                  disabled={giaTesserato}
                >
                  <i className="bi bi-check-circle me-1"></i> Conferma Tesseramento e Torna alla Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
