import React, { useState } from 'react';
import { Utente, Anno } from '../../types';

interface Props {
  user: Utente;
  annoAttivo?: Anno;
  anni: Anno[];
  onSelectAnno: (annoId: number) => void;
  onOpenGestioneAnno: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchToKiosk: () => void;
  onOpenCodeExport: () => void;
  quoteScaduteCount: number;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  annoAttivo,
  anni,
  onSelectAnno,
  onOpenGestioneAnno,
  activeTab,
  onSelectTab,
  onSwitchToKiosk,
  onOpenCodeExport,
  quoteScaduteCount,
  onLogout
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAnnoDropdownOpen, setIsAnnoDropdownOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setIsNavOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container-fluid px-3 px-lg-4">
        <div className="d-flex align-items-center">
          <a
            className="navbar-brand fw-bold d-flex align-items-center gap-2 cursor-pointer mb-0 me-2"
            onClick={() => handleNavClick('dashboard')}
            role="button"
          >
            <i className="bi bi-trophy-fill text-warning fs-4"></i>
            <span>SportGestionale</span>
          </a>

          {/* Selettore Anno Sportivo Interattivo */}
          <div className="dropdown position-relative">
            <button
              className="btn btn-sm btn-light text-primary fw-bold d-flex align-items-center gap-1 shadow-sm border py-1 px-2"
              type="button"
              onClick={() => setIsAnnoDropdownOpen(!isAnnoDropdownOpen)}
              title="Clicca per cambiare anno sportivo o configurarne uno nuovo"
            >
              <i className="bi bi-calendar-check-fill text-primary"></i>
              <span>{annoAttivo ? `Anno ${annoAttivo.anno}` : 'Seleziona Anno'}</span>
              <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.75rem' }}></i>
            </button>

            {isAnnoDropdownOpen && (
              <div
                className="dropdown-menu show position-absolute shadow-lg border-0 mt-2 p-2"
                style={{ minWidth: '220px', zIndex: 1050 }}
              >
                <div className="dropdown-header small text-uppercase fw-bold text-muted px-2 py-1">
                  Seleziona Anno Sportivo
                </div>
                {anni.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      onSelectAnno(a.id);
                      setIsAnnoDropdownOpen(false);
                    }}
                    className={`dropdown-item d-flex justify-content-between align-items-center rounded px-2 py-2 mb-1 ${
                      a.id === annoAttivo?.id ? 'active fw-bold' : ''
                    }`}
                  >
                    <span>
                      <i className="bi bi-calendar3 me-2"></i>
                      {a.anno}
                    </span>
                    {a.id === annoAttivo?.id && (
                      <span className="badge bg-light text-primary">Attivo</span>
                    )}
                  </button>
                ))}
                <div className="dropdown-divider my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnnoDropdownOpen(false);
                    onOpenGestioneAnno();
                  }}
                  className="dropdown-item d-flex align-items-center text-primary fw-semibold rounded px-2 py-2"
                >
                  <i className="bi bi-gear-fill me-2"></i>
                  Gestisci / Crea Anni...
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Toggler per dispositivi mobili e schermi compatti */}
        <button
          className={`navbar-toggler ${isNavOpen ? '' : 'collapsed'}`}
          type="button"
          onClick={() => setIsNavOpen(!isNavOpen)}
          aria-controls="navbarContent"
          aria-expanded={isNavOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Container menu con classe show controllata via React */}
        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 pt-2 pt-lg-0">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 ${activeTab === 'dashboard' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <i className="bi bi-speedometer2 me-2 text-warning"></i> Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 ${activeTab === 'persone' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('persone')}
              >
                <i className="bi bi-people me-2"></i> Persone & Tutori
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 ${activeTab === 'tesserati' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('tesserati')}
              >
                <i className="bi bi-card-checklist me-2 text-success"></i> Tesserati
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 ${activeTab === 'gruppi' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('gruppi')}
              >
                <i className="bi bi-diagram-3 me-2 text-info"></i> Gruppi & Corsi
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 position-relative ${activeTab === 'quote' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('quote')}
              >
                <i className="bi bi-cash-stack me-2 text-warning"></i> Quote Mensili
                {quoteScaduteCount > 0 && (
                  <span className="badge bg-danger ms-2 rounded-pill">
                    {quoteScaduteCount} scadute!
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 ${activeTab === 'pagamenti' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('pagamenti')}
              >
                <i className="bi bi-wallet2 me-2 text-success"></i> Pagamenti
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-start text-decoration-none w-100 ${activeTab === 'utenti' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavClick('utenti')}
              >
                <i className="bi bi-person-gear me-2"></i> Utenti & Kiosk
              </button>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2 flex-wrap pb-3 pb-lg-0 border-top border-primary-subtle pt-3 pt-lg-0 border-lg-0">
            {/* Tasto Kiosk Mode */}
            <button
              onClick={() => {
                onSwitchToKiosk();
                setIsNavOpen(false);
              }}
              className="btn btn-warning text-dark fw-bold btn-sm shadow-sm d-flex align-items-center"
              title="Passa all'interfaccia Touch a bottoni grandi"
            >
              <i className="bi bi-tablet-landscape-fill me-1"></i>
              Modalità KIOSK
            </button>

            {/* Tasto Codice PHP & DB */}
            <button
              onClick={() => {
                onOpenCodeExport();
                setIsNavOpen(false);
              }}
              className="btn btn-outline-light btn-sm fw-semibold d-flex align-items-center"
              title="Visualizza codice PHP & script MariaDB"
            >
              <i className="bi bi-code-slash me-1"></i>
              Codice PHP / MariaDB
            </button>

            {/* Utente Info & Logout */}
            <div className="text-white-50 small ms-2 d-none d-md-inline">
              <span className="text-light fw-semibold">{user.nome}</span>
              {user.is_kiosk && <span className="badge bg-info text-dark ms-1">kiosk</span>}
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline-light btn-sm"
              title="Disconnetti"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
