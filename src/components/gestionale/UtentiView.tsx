import React, { useState } from 'react';
import { Utente } from '../../types';

interface Props {
  utenti: Utente[];
  currentUser: Utente;
  onToggleKioskFlag: (userId: number) => void;
  onCreaUtente: (utente: Omit<Utente, 'id'>) => void;
  onSwitchUser: (user: Utente) => void;
}

export const UtentiView: React.FC<Props> = ({
  utenti,
  currentUser,
  onToggleKioskFlag,
  onCreaUtente,
  onSwitchUser
}) => {
  const [isCreating, setIsCreating] = useState(false);
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

    onCreaUtente({
      username: username.trim(),
      nome: nome.trim(),
      ruolo,
      is_kiosk: isKiosk,
      attivo: true
    });

    setIsCreating(false);
    setUsername('');
    setNome('');
    setIsKiosk(false);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-person-gear text-primary me-2"></i> Gestione Utenti & Flag Modalità KIOSK
          </h2>
          <p className="text-muted small mb-0">
            Controllo accessi e configurazione della modalità Kiosk per reception, tablet o totem
          </p>
        </div>
        <button className="btn btn-primary fw-bold" onClick={() => setIsCreating(true)}>
          <i className="bi bi-person-plus-fill me-1"></i> Nuovo Utente
        </button>
      </div>

      {/* Spiegazione del Flag KIOSK */}
      <div className="alert alert-warning border-warning shadow-sm d-flex align-items-start mb-4 p-3 rounded-3">
        <i className="bi bi-info-circle-fill fs-3 me-3 text-warning-emphasis mt-1"></i>
        <div>
          <strong className="d-block mb-1">Come funziona il flag "Modalità KIOSK":</strong>
          Gli utenti che hanno la spunta <strong>Modalità Kiosk</strong> abilitata (come l'utente <code>kiosk</code> per la reception) vengono automaticamente reindirizzati all'interfaccia Touch a bottoni grandi subito dopo il login. Gli utenti amministratori (come <code>admin</code>) entrano nel gestionale completo e possono comunque commutare in Kiosk in ogni momento con il pulsante dedicato nella barra in alto.
        </div>
      </div>

      {/* Tabella Utenti */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Nome Completo</th>
                <th>Ruolo</th>
                <th>Flag Modalità Kiosk</th>
                <th>Comportamento al Login</th>
                <th className="text-end">Simula Login</th>
              </tr>
            </thead>
            <tbody>
              {utenti.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <tr key={u.id} className={isCurrent ? 'table-primary bg-opacity-10' : ''}>
                    <td><span className="badge bg-light text-dark border">#{u.id}</span></td>
                    <td>
                      <code className="fs-6">{u.username}</code>
                      {isCurrent && <span className="badge bg-primary ms-2">Connesso</span>}
                    </td>
                    <td><strong>{u.nome}</strong></td>
                    <td>
                      <span className="badge bg-light text-dark border text-uppercase">{u.ruolo}</span>
                    </td>
                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          role="switch"
                          id={`kioskSwitch-${u.id}`}
                          checked={u.is_kiosk}
                          onChange={() => onToggleKioskFlag(u.id)}
                        />
                        <label className="form-check-label small fw-semibold cursor-pointer" htmlFor={`kioskSwitch-${u.id}`}>
                          {u.is_kiosk ? (
                            <span className="badge bg-warning text-dark"><i className="bi bi-tablet-landscape me-1"></i>Kiosk Attivo</span>
                          ) : (
                            <span className="text-muted">Disattivato (Gestionale)</span>
                          )}
                        </label>
                      </div>
                    </td>
                    <td>
                      {u.is_kiosk ? (
                        <span className="text-warning-emphasis small fw-semibold">
                          <i className="bi bi-arrow-right-circle me-1"></i>
                          Apre direttamente l'interfaccia Touch Kiosk
                        </span>
                      ) : (
                        <span className="text-secondary small">
                          <i className="bi bi-table me-1"></i>
                          Apre la dashboard del Gestionale
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${isCurrent ? 'btn-secondary disabled' : 'btn-outline-primary fw-bold'}`}
                        onClick={() => onSwitchUser(u)}
                        disabled={isCurrent}
                      >
                        {isCurrent ? 'In uso' : 'Accedi come'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Creazione Nuovo Utente */}
      {isCreating && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-person-plus-fill me-2"></i> Nuovo Account Utente
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setIsCreating(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Nome Completo *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Es. Desk Reception 2, Maria Rossi"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Es. totem_ingresso, segreteria2"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Ruolo</label>
                      <select
                        className="form-select"
                        value={ruolo}
                        onChange={(e) => setRuolo(e.target.value as Utente['ruolo'])}
                      >
                        <option value="desk">Desk / Reception Totem</option>
                        <option value="operatore">Operatore Segreteria</option>
                        <option value="admin">Amministratore Completo</option>
                      </select>
                    </div>

                    <div className="col-12 p-3 bg-light rounded-3 border">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="modalIsKiosk"
                          checked={isKiosk}
                          onChange={(e) => setIsKiosk(e.target.checked)}
                        />
                        <label className="form-check-label fw-bold" htmlFor="modalIsKiosk">
                          Attiva Flag Modalità KIOSK
                        </label>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Se abilitato, l'utente vedrà subito i grandi tasti touch per la reception dopo il login.
                      </small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Crea Utente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
