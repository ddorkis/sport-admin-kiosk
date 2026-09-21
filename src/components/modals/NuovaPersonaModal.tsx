import React, { useState } from 'react';
import { Persona } from '../../types';
import { calcolaEta } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Omit<Persona, 'id' | 'data_creazione'>) => Persona;
  onSavedAndTessera?: (persona: Persona) => void;
  isKioskMode?: boolean;
}

export const NuovaPersonaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onSavedAndTessera,
  isKioskMode = false
}) => {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [dataNascita, setDataNascita] = useState('');
  const [luogoNascita, setLuogoNascita] = useState('');
  const [indirizzo, setIndirizzo] = useState('');
  const [citta, setCitta] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  // Tutore Legale
  const [tutoreNome, setTutoreNome] = useState('');
  const [tutoreCognome, setTutoreCognome] = useState('');
  const [tutoreCf, setTutoreCf] = useState('');
  const [tutoreTelefono, setTutoreTelefono] = useState('');
  const [tutoreEmail, setTutoreEmail] = useState('');
  const [tutoreRelazione, setTutoreRelazione] = useState<Persona['tutore_relazione']>('Genitore');

  if (!isOpen) return null;

  const eta = calcolaEta(dataNascita);
  const isMinorenne = Boolean(dataNascita && eta < 18);

  const handleSubmit = (procediConTesseramento: boolean = false) => {
    if (!nome.trim() || !cognome.trim() || !codiceFiscale.trim() || !dataNascita) {
      alert('Per favore compila Nome, Cognome, Codice Fiscale e Data di Nascita.');
      return;
    }

    if (isMinorenne && (!tutoreNome.trim() || !tutoreCognome.trim() || !tutoreTelefono.trim())) {
      alert('Trattandosi di un atleta minorenne, i dati del tutore legale (Nome, Cognome e Telefono) sono obbligatori.');
      return;
    }

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

    // Reset form
    setNome('');
    setCognome('');
    setCodiceFiscale('');
    setDataNascita('');
    setLuogoNascita('');
    setIndirizzo('');
    setCitta('');
    setTelefono('');
    setEmail('');
    setTutoreNome('');
    setTutoreCognome('');
    setTutoreCf('');
    setTutoreTelefono('');
    setTutoreEmail('');
    setNote('');

    onClose();

    if (procediConTesseramento && onSavedAndTessera) {
      onSavedAndTessera(nuovaPersona);
    }
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${isKioskMode ? 'modal-xl' : 'modal-lg'}`}>
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className={`modal-header ${isKioskMode ? 'bg-primary text-white p-4' : 'bg-light p-3'}`}>
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-person-plus-fill me-2 fs-4"></i>
              Inserimento Anagrafica Atleta / Persona
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-3">
              {/* Dati Personali Atleta */}
              <div className="col-12">
                <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">
                  <i className="bi bi-person-bounding-box me-2"></i>Dati Anagrafici Atleta
                </h6>
              </div>

              <div className="col-md-6">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>Nome *</label>
                <input
                  type="text"
                  className={`form-control ${isKioskMode ? 'form-control-lg' : ''}`}
                  placeholder="Es. Mario"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>Cognome *</label>
                <input
                  type="text"
                  className={`form-control ${isKioskMode ? 'form-control-lg' : ''}`}
                  placeholder="Es. Rossi"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>Codice Fiscale *</label>
                <input
                  type="text"
                  className={`form-control ${isKioskMode ? 'form-control-lg' : ''} text-uppercase`}
                  placeholder="RSSMRA12A01H501Z"
                  maxLength={16}
                  value={codiceFiscale}
                  onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className={`form-label fw-semibold ${isKioskMode ? 'fs-5' : ''}`}>Data di Nascita *</label>
                <input
                  type="date"
                  className={`form-control ${isKioskMode ? 'form-control-lg' : ''}`}
                  value={dataNascita}
                  onChange={(e) => setDataNascita(e.target.value)}
                  required
                />
              </div>

              {dataNascita && (
                <div className="col-12">
                  <div className={`alert ${isMinorenne ? 'alert-warning border-warning' : 'alert-info'} d-flex align-items-center mb-0 py-2`}>
                    <i className={`bi ${isMinorenne ? 'bi-exclamation-triangle-fill text-warning fs-4' : 'bi-info-circle-fill text-info fs-5'} me-3`}></i>
                    <div>
                      <strong>Età calcolata: {eta} anni.</strong>{' '}
                      {isMinorenne ? (
                        <span className="fw-semibold">
                          L'atleta è <u>MINORENNE</u>. La normativa richiede obbligatoriamente i dati del tutore legale / genitore.
                        </span>
                      ) : (
                        <span>L'atleta è maggiorenne. I dati del tutore non sono necessari.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="col-md-4">
                <label className="form-label fw-semibold">Luogo di Nascita</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Es. Roma"
                  value={luogoNascita}
                  onChange={(e) => setLuogoNascita(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Indirizzo Residenza</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Via Roma 12"
                  value={indirizzo}
                  onChange={(e) => setIndirizzo(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Città</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Roma"
                  value={citta}
                  onChange={(e) => setCitta(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Telefono Atleta</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Cellulare"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Email Atleta</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="nome@email.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* SEZIONE TUTORE LEGALE SE MINORENNE */}
              {isMinorenne && (
                <div className="col-12 mt-4 p-3 bg-warning bg-opacity-10 border border-warning rounded-3">
                  <h6 className="text-warning-emphasis fw-bold mb-3 d-flex align-items-center">
                    <i className="bi bi-shield-shaded fs-5 me-2"></i>
                    Dati del Tutore Legale / Esercente la Patria Potestà (Obbligatorio per Minorenni)
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Nome Tutore *</label>
                      <input
                        type="text"
                        className={`form-control ${isKioskMode ? 'form-control-lg' : ''}`}
                        placeholder="Nome genitore"
                        value={tutoreNome}
                        onChange={(e) => setTutoreNome(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Cognome Tutore *</label>
                      <input
                        type="text"
                        className={`form-control ${isKioskMode ? 'form-control-lg' : ''}`}
                        placeholder="Cognome genitore"
                        value={tutoreCognome}
                        onChange={(e) => setTutoreCognome(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Grado di Parentela / Ruolo</label>
                      <select
                        className="form-select"
                        value={tutoreRelazione}
                        onChange={(e) => setTutoreRelazione(e.target.value as Persona['tutore_relazione'])}
                      >
                        <option value="Padre">Padre</option>
                        <option value="Madre">Madre</option>
                        <option value="Genitore">Genitore</option>
                        <option value="Tutore Legale">Tutore Legale Nominato</option>
                        <option value="Altro">Altro Delegato</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Codice Fiscale Tutore</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="CF Tutore"
                        maxLength={16}
                        value={tutoreCf}
                        onChange={(e) => setTutoreCf(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Cellulare Tutore (Avvisi/Emergenza) *</label>
                      <input
                        type="tel"
                        className={`form-control ${isKioskMode ? 'form-control-lg' : ''}`}
                        placeholder="340 1234567"
                        value={tutoreTelefono}
                        onChange={(e) => setTutoreTelefono(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Email Tutore (Invio Ricevute/Quote)</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="email.tutore@esempio.it"
                        value={tutoreEmail}
                        onChange={(e) => setTutoreEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="col-12">
                <label className="form-label fw-semibold">Note Sanitarie / Sportive</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Eventuali allergie, certificazioni, liberatorie foto o indicazioni..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          <div className={`modal-footer ${isKioskMode ? 'p-4 bg-light' : 'p-3'}`}>
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Annulla
            </button>
            <button
              type="button"
              className={`btn btn-primary fw-bold px-4 ${isKioskMode ? 'btn-lg' : ''}`}
              onClick={() => handleSubmit(false)}
            >
              <i className="bi bi-check2-circle me-1"></i> Salva Anagrafica
            </button>
            {onSavedAndTessera && (
              <button
                type="button"
                className={`btn btn-success fw-bold px-4 ${isKioskMode ? 'btn-lg' : ''}`}
                onClick={() => handleSubmit(true)}
              >
                <i className="bi bi-card-checklist me-1"></i> Salva e Tessere Subito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
