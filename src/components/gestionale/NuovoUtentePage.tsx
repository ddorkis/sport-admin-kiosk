import React, { useState } from 'react';
import { Utente } from '../../types';

interface Props {
  onBack: () => void;
  onSave: (utente: Omit<Utente, 'id'>) => void;
}

export const NuovoUtentePage: React.FC<Props> = ({
  onBack,
  onSave
}) => {
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [ruolo, setRuolo] = useState<Utente['ruolo']>('operatore');
  const [isKiosk, setIsKiosk] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nome.trim()) {
      alert('Compila username e nome.');
      return;
    }

    onSave({
      username: username.trim(),
      nome: nome.trim(),
      ruolo,
      is_kiosk: isKiosk,
      attivo: true
    });

    onBack();
  };

  return (
    <div className="container-fluid py-4 max-w-4xl mx-auto">
      {/* Intestazione */}
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
                  <i className="bi bi-person-gear me-1"></i> Utenti & Kiosk
                </button>
              </li>
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                Nuovo Utente
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center text-dark">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={onBack}
              title="Torna all'elenco utenti"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <span>Creazione Nuovo Profilo Utente / Reception Kiosk</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            Configura le credenziali di accesso, il ruolo amministrativo e l'eventuale avvio automatico in modalità Kiosk.
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
            onClick={handleSubmit}
          >
            <i className="bi bi-check-lg me-1"></i> Crea Utente e Torna alla Lista
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center">
              <i className="bi bi-person-plus-fill me-2 fs-5"></i> Dati Profilo e Permessi
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark">Nome Completo / Postazione *</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Es. Desk Reception Ingresso, Maria Rossi"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark">Username per il Login *</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Es. desk_pattinaggio, segreteria"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold text-dark">Ruolo Operativo</label>
                <select
                  className="form-select"
                  value={ruolo}
                  onChange={(e) => setRuolo(e.target.value as Utente['ruolo'])}
                >
                  <option value="desk">Desk / Reception Totem (Accesso rapido incassi e anagrafica)</option>
                  <option value="operatore">Operatore Segreteria (Gestione completa tesserati e corsi)</option>
                  <option value="admin">Amministratore Completo (Accesso a tutte le impostazioni)</option>
                </select>
              </div>

              <div className="col-12 p-3 bg-light rounded-3 border mt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    id="pageIsKiosk"
                    checked={isKiosk}
                    onChange={(e) => setIsKiosk(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="pageIsKiosk">
                    Attiva Flag Modalità KIOSK Reception Touch
                  </label>
                </div>
                <small className="text-muted d-block mt-1 ms-4">
                  Se abilitato, al login questo utente verrà indirizzato automaticamente alla schermata a grandi tasti touch per reception o tablet.
                </small>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onBack}
              >
                ← Annulla
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-bold px-4 shadow-sm"
              >
                <i className="bi bi-check-circle me-1"></i> Crea Utente e Torna alla Lista
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
