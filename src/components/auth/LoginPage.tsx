import React, { useState } from 'react';
import { Utente } from '../../types';

interface Props {
  utenti: Utente[];
  onLogin: (user: Utente) => void;
  onOpenCodeExport: () => void;
}

export const LoginPage: React.FC<Props> = ({ utenti, onLogin, onOpenCodeExport }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const found = utenti.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      setError('Credenziali errate. Utente non trovato in MariaDB.');
      return;
    }

    onLogin(found);
  };

  const handleQuickLogin = (u: Utente) => {
    onLogin(u);
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-3"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      }}
    >
      <div className="card border-0 shadow-2xl rounded-4 bg-white p-4 p-md-5" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 bg-primary bg-opacity-10 text-primary rounded-circle mb-3">
            <i className="bi bi-trophy-fill display-5 text-primary"></i>
          </div>
          <h2 className="fw-bold text-dark mb-1">Polisportiva Aurora</h2>
          <p className="text-muted small">Sistema Gestionale & Kiosk Reception &bull; PHP + MariaDB</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small fw-bold">Nome Utente</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><i className="bi bi-person"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small fw-bold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm mb-3">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Accedi al Sistema
          </button>
        </form>

        {/* Accessi Rapidi Demo per Testare il Flag KIOSK */}
        <div className="border-top pt-3 mt-2">
          <span className="text-muted small d-block text-center mb-2 fw-semibold">
            Test Accesso Rapido (verifica comportamento flag Kiosk):
          </span>
          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-outline-warning text-dark btn-sm d-flex justify-content-between align-items-center"
              onClick={() => handleQuickLogin(utenti.find((u) => u.is_kiosk) || utenti[1])}
            >
              <span>
                <i className="bi bi-display me-2 text-warning"></i>
                <strong>Desk Reception</strong> (<code>is_kiosk=1</code>)
              </span>
              <span className="badge bg-warning text-dark">Modalità Touch</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm d-flex justify-content-between align-items-center"
              onClick={() => handleQuickLogin(utenti.find((u) => !u.is_kiosk) || utenti[0])}
            >
              <span>
                <i className="bi bi-speedometer2 me-2 text-primary"></i>
                <strong>Amministratore</strong> (<code>is_kiosk=0</code>)
              </span>
              <span className="badge bg-primary text-white">Gestionale Completo</span>
            </button>
          </div>
        </div>

        {/* Pulsante per Codice Sorgente */}
        <div className="text-center mt-4 pt-3 border-top">
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none text-secondary"
            onClick={onOpenCodeExport}
          >
            <i className="bi bi-file-earmark-code me-1"></i> Visualizza Script SQL & Codice PHP
          </button>
        </div>
      </div>
    </div>
  );
};
