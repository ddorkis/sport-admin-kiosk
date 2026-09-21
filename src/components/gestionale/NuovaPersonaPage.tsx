import React, { useState } from 'react';
import { Persona } from '../../types';
import { calcolaEta } from '../../utils/storage';

interface Props {
  onBack: () => void;
  onSave?: (persona: Omit<Persona, 'id' | 'data_creazione'>) => Persona;
  onUpdate?: (persona: Persona) => void;
  initialPersona?: Persona | null;
  onSavedAndTessera?: (persona: Persona) => void;
  isKioskMode?: boolean;
}

export const NuovaPersonaPage: React.FC<Props> = ({
  onBack,
  onSave,
  onUpdate,
  initialPersona,
  onSavedAndTessera,
  isKioskMode = false
}) => {
  const isEditing = Boolean(initialPersona);

  const [nome, setNome] = useState(initialPersona?.nome || '');
  const [cognome, setCognome] = useState(initialPersona?.cognome || '');
  const [codiceFiscale, setCodiceFiscale] = useState(initialPersona?.codice_fiscale || '');
  const [dataNascita, setDataNascita] = useState(initialPersona?.data_nascita || '');
  const [luogoNascita, setLuogoNascita] = useState(initialPersona?.luogo_nascita || '');
  const [indirizzo, setIndirizzo] = useState(initialPersona?.indirizzo || '');
  const [citta, setCitta] = useState(initialPersona?.citta || '');
  const [telefono, setTelefono] = useState(initialPersona?.telefono || '');
  const [email, setEmail] = useState(initialPersona?.email || '');
  const [note, setNote] = useState(initialPersona?.note || '');

  // Tutore Legale
  const [tutoreNome, setTutoreNome] = useState(initialPersona?.tutore_nome || '');
  const [tutoreCognome, setTutoreCognome] = useState(initialPersona?.tutore_cognome || '');
  const [tutoreCf, setTutoreCf] = useState(initialPersona?.tutore_cf || '');
  const [tutoreTelefono, setTutoreTelefono] = useState(initialPersona?.tutore_telefono || '');
  const [tutoreEmail, setTutoreEmail] = useState(initialPersona?.tutore_email || '');
  const [tutoreRelazione, setTutoreRelazione] = useState<Persona['tutore_relazione']>(
    initialPersona?.tutore_relazione || 'Genitore'
  );

  const eta = calcolaEta(dataNascita);
  const isMinorenne = Boolean(dataNascita && eta < 18);

  const handleSubmit = (procediConTesseramento: boolean = false) => {
    if (!nome.trim() || !cognome.trim() || !codiceFiscale.trim() || !dataNascita) {
      alert('Per favore compila i campi obbligatori: Nome, Cognome, Codice Fiscale e Data di Nascita.');
      return;
    }

    if (isMinorenne && (!tutoreNome.trim() || !tutoreCognome.trim() || !tutoreTelefono.trim())) {
      alert('Trattandosi di un atleta minorenne, i dati del tutore legale (Nome, Cognome e Telefono del genitore) sono obbligatori.');
      return;
    }

    if (isEditing && initialPersona && onUpdate) {
      const updatedPersona: Persona = {
        ...initialPersona,
        nome: nome.trim(),
        cognome: cognome.trim(),
        codice_fiscale: codiceFiscale.trim().toUpperCase(),
        data_nascita: dataNascita,
        luogo_nascita: luogoNascita.trim(),
        indirizzo: indirizzo.trim(),
        citta: citta.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        is_minorenne: isMinorenne,
        tutore_nome: isMinorenne ? tutoreNome.trim() : undefined,
        tutore_cognome: isMinorenne ? tutoreCognome.trim() : undefined,
        tutore_cf: isMinorenne ? tutoreCf.trim().toUpperCase() : undefined,
        tutore_telefono: isMinorenne ? tutoreTelefono.trim() : undefined,
        tutore_email: isMinorenne ? tutoreEmail.trim() : undefined,
        tutore_relazione: isMinorenne ? tutoreRelazione : undefined,
        note: note.trim()
      };
      onUpdate(updatedPersona);
      if (procediConTesseramento && onSavedAndTessera) {
        onSavedAndTessera(updatedPersona);
      } else {
        onBack();
      }
      return;
    }

    if (onSave) {
      const nuovaPersona = onSave({
        nome: nome.trim(),
        cognome: cognome.trim(),
        codice_fiscale: codiceFiscale.trim().toUpperCase(),
        data_nascita: dataNascita,
        luogo_nascita: luogoNascita.trim(),
        indirizzo: indirizzo.trim(),
        citta: citta.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        is_minorenne: isMinorenne,
        tutore_nome: isMinorenne ? tutoreNome.trim() : undefined,
        tutore_cognome: isMinorenne ? tutoreCognome.trim() : undefined,
        tutore_cf: isMinorenne ? tutoreCf.trim().toUpperCase() : undefined,
        tutore_telefono: isMinorenne ? tutoreTelefono.trim() : undefined,
        tutore_email: isMinorenne ? tutoreEmail.trim() : undefined,
        tutore_relazione: isMinorenne ? tutoreRelazione : undefined,
        note: note.trim()
      });

      if (procediConTesseramento && onSavedAndTessera) {
        onSavedAndTessera(nuovaPersona);
      } else {
        onBack();
      }
    }
  };

  return (
    <div className="container-fluid py-4 max-w-6xl mx-auto">
      {/* Intestazione Pagina con Breadcrumb e Pulsanti */}
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
                  <i className="bi bi-people me-1"></i> Anagrafica Persone
                </button>
              </li>
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                {isEditing ? `Modifica Anagrafica: ${initialPersona?.cognome} ${initialPersona?.nome}` : 'Inserimento Nuova Persona'}
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center text-dark">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={onBack}
              title="Torna all'elenco persone"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <span>{isEditing ? `Modifica Scheda Anagrafica #${initialPersona?.id}` : 'Nuova Scheda Anagrafica Atleta / Tesserato'}</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            {isEditing
              ? 'Aggiorna i recapiti, indirizzo, note o dati del tutore legale. I cambiamenti saranno subito attivi.'
              : "Inserisci i dati anagrafici completi. Al salvataggio verrai reindirizzato direttamente all'elenco aggiornato."}
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
            onClick={() => handleSubmit(false)}
          >
            <i className="bi bi-check-lg me-1"></i> {isEditing ? 'Salva Modifiche' : 'Salva e Torna alla Lista'}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        <div className="row g-4">
          {/* Colonna Sinistra: Dati Atleta */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center">
                  <i className="bi bi-person-badge me-2 fs-5"></i> Dati Anagrafici Atleta
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Nome *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Sofia"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Cognome *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Bianchi"
                      value={cognome}
                      onChange={(e) => setCognome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Codice Fiscale *</label>
                    <input
                      type="text"
                      className="form-control text-uppercase font-monospace fw-bold"
                      placeholder="16 caratteri alfanumerici"
                      maxLength={16}
                      value={codiceFiscale}
                      onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Data di Nascita *</label>
                    <div className="input-group">
                      <input
                        type="date"
                        className="form-control"
                        value={dataNascita}
                        onChange={(e) => setDataNascita(e.target.value)}
                        required
                      />
                      {dataNascita && (
                        <span className="input-group-text bg-light fw-semibold small">
                          {eta} anni
                        </span>
                      )}
                    </div>
                    {dataNascita && (
                      <div className="mt-1">
                        {isMinorenne ? (
                          <span className="badge bg-warning text-dark px-2 py-1">
                            <i className="bi bi-shield-exclamation me-1"></i> Atleta Minorenne (Richiede Tutore Legale)
                          </span>
                        ) : (
                          <span className="badge bg-success px-2 py-1">
                            <i className="bi bi-person-check me-1"></i> Atleta Maggiorenne
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Luogo di Nascita</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Milano (MI)"
                      value={luogoNascita}
                      onChange={(e) => setLuogoNascita(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Città di Residenza</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Monza (MB)"
                      value={citta}
                      onChange={(e) => setCitta(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Indirizzo Residenza (Via, Piazza, N. Civico)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Via Roma 42"
                      value={indirizzo}
                      onChange={(e) => setIndirizzo(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Telefono Atleta (se maggiorenne)</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Es. 333 1234567"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Email Atleta</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Es. sofia.bianchi@email.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note Aggiuntive */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="card-title fw-bold mb-0 text-secondary">
                  <i className="bi bi-sticky me-2"></i> Note & Informazioni Speciali
                </h6>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Eventuali annotazioni su taglia pattini, precedenti esperienze sportive, allergie o intolleranze..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Colonna Destra: Tutore Legale / Esercente Responsabilità Genitoriale */}
          <div className="col-lg-5">
            <div className={`card border-0 shadow-sm rounded-3 mb-4 ${isMinorenne ? 'border border-warning' : ''}`}>
              <div className={`card-header py-3 ${isMinorenne ? 'bg-warning-subtle text-dark border-bottom border-warning' : 'bg-white border-bottom'}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title fw-bold mb-0 d-flex align-items-center">
                    <i className="bi bi-shield-shaded me-2 text-warning fs-5"></i>
                    Esercente Responsabilità Genitoriale
                  </h5>
                  {isMinorenne && (
                    <span className="badge bg-warning text-dark fw-bold">Obbligatorio</span>
                  )}
                </div>
                <small className="text-muted d-block mt-1">
                  Genitore o tutore legale per tesseramento FISR e comunicazioni
                </small>
              </div>

              <div className="card-body p-4">
                {!isMinorenne && (
                  <div className="alert alert-light border small text-muted mb-3">
                    <i className="bi bi-info-circle me-1"></i> Se l'atleta è maggiorenne questa sezione può rimanere vuota.
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Grado di Parentela / Relazione</label>
                    <select
                      className="form-select"
                      value={tutoreRelazione}
                      onChange={(e) => setTutoreRelazione(e.target.value as Persona['tutore_relazione'])}
                    >
                      <option value="Genitore">Genitore</option>
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Tutore Legale">Tutore Legale / Affidatario</option>
                      <option value="Altro">Altro Familiare</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">
                      Nome Genitore / Tutore {isMinorenne && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Marco"
                      value={tutoreNome}
                      onChange={(e) => setTutoreNome(e.target.value)}
                      required={isMinorenne}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">
                      Cognome Genitore / Tutore {isMinorenne && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Bianchi"
                      value={tutoreCognome}
                      onChange={(e) => setTutoreCognome(e.target.value)}
                      required={isMinorenne}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">
                      Codice Fiscale Genitore / Tutore
                    </label>
                    <input
                      type="text"
                      className="form-control text-uppercase font-monospace"
                      placeholder="Per detrazioni fiscali / ricevuta"
                      maxLength={16}
                      value={tutoreCf}
                      onChange={(e) => setTutoreCf(e.target.value.toUpperCase())}
                    />
                    <div className="form-text small">Consigliato per l'intestazione delle ricevute fiscali A4</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">
                      Telefono Tutore (Reperibilità Emergenze) {isMinorenne && <span className="text-danger">*</span>}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-telephone"></i></span>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Es. 347 9876543"
                        value={tutoreTelefono}
                        onChange={(e) => setTutoreTelefono(e.target.value)}
                        required={isMinorenne}
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">
                      Email Genitore (per ricevute e comunicazioni)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Es. marco.bianchi@gmail.com"
                        value={tutoreEmail}
                        onChange={(e) => setTutoreEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni Rapide Form Card */}
            <div className="card border-0 bg-primary bg-opacity-10 rounded-3 p-3">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-lightning-charge-fill text-primary fs-4 me-2"></i>
                <h6 className="fw-bold mb-0 text-primary">Operazione Successiva</h6>
              </div>
              <p className="small text-muted mb-3">
                {isEditing
                  ? 'Salva le modifiche anagrafiche per applicarle immediatamente all’atleta in tutto il gestionale.'
                  : 'Puoi salvare l\'anagrafica e tornare alla lista, oppure registrare contestualmente il tesseramento sportivo FISR.'}
              </p>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-primary fw-bold py-2 shadow-sm"
                  onClick={() => handleSubmit(false)}
                >
                  <i className="bi bi-check-circle me-1"></i> {isEditing ? 'Salva Modifiche Anagrafica' : "Salva e Torna all'Elenco Persone"}
                </button>
                {!isEditing && onSavedAndTessera && (
                  <button
                    type="button"
                    className="btn btn-outline-success fw-bold py-2"
                    onClick={() => handleSubmit(true)}
                  >
                    <i className="bi bi-card-checklist me-1"></i> Salva e Procedi con Tesseramento
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-link text-muted text-decoration-none py-1"
                  onClick={onBack}
                >
                  ← Annulla e torna alla lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
