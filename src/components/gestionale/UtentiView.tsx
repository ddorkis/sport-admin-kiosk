import React, { useState } from 'react';
import { Utente } from '../../types';

interface Props {
  utenti: Utente[];
  currentUser: Utente;
  onToggleKioskFlag: (userId: number) => void;
  onOpenNuovoUtente: () => void;
  onSwitchUser: (user: Utente) => void;
}

export const UtentiView: React.FC<Props> = ({
  utenti,
  currentUser,
  onToggleKioskFlag,
  onOpenNuovoUtente,
  onSwitchUser
}) => {
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
        <button className="btn btn-primary fw-bold" onClick={onOpenNuovoUtente}>
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
    </div>
  );
};
