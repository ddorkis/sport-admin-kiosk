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

export const Sidebar: React.FC<Props> = ({
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAnnoDropdownOpen, setIsAnnoDropdownOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setIsMobileOpen(false);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      badge: null
    },
    {
      id: 'persone',
      label: 'Persone & Tutori',
      icon: 'bi-people',
      badge: null
    },
    {
      id: 'tesserati',
      label: 'Tesserati',
      icon: 'bi-card-checklist',
      badge: null
    },
    {
      id: 'gruppi',
      label: 'Gruppi & Corsi',
      icon: 'bi-diagram-3',
      badge: null
    },
    {
      id: 'quote',
      label: 'Quote Mensili',
      icon: 'bi-cash-stack',
      badge:
        quoteScaduteCount > 0 ? (
          <span className="badge bg-danger rounded-pill px-2 py-1 ms-auto">
            {quoteScaduteCount} scadute
          </span>
        ) : null
    },
    {
      id: 'previsioni',
      label: 'Previsione & Budget',
      icon: 'bi-graph-up-arrow',
      badge: (
        <span className="badge bg-success-subtle text-success border border-success-subtle px-1 py-0 ms-auto" style={{ fontSize: '0.7rem' }}>
          Bilancio
        </span>
      )
    },
    {
      id: 'pagamenti',
      label: 'Pagamenti',
      icon: 'bi-wallet2',
      badge: null
    },
    {
      id: 'utenti',
      label: 'Utenti & Kiosk',
      icon: 'bi-person-gear',
      badge: null
    },
    {
      id: 'associazione',
      label: 'Dati Associazione',
      icon: 'bi-building-gear',
      badge: null
    }
  ];

  return (
    <>
      {/* BARRA SUPERIORE MOBILE (Visibile solo sotto md / sm) */}
      <div className="d-md-none bg-primary text-white px-3 py-2 d-flex align-items-center justify-content-between sticky-top shadow-sm z-3">
        <div className="d-flex align-items-center gap-2">
          {/* Bottone Hamburger classico */}
          <button
            type="button"
            className="btn btn-primary btn-sm border border-light-subtle d-flex align-items-center justify-content-center p-2"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Apri menu laterale"
            title="Apri menu"
          >
            <i className="bi bi-list fs-5"></i>
          </button>

          <span
            className="fw-bold d-flex align-items-center gap-2 cursor-pointer"
            onClick={() => handleNavClick('dashboard')}
          >
            <i className="bi bi-trophy-fill text-warning fs-5"></i>
            <span className="fs-6">SportGestionale</span>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {annoAttivo && (
            <span
              className="badge bg-light text-primary border cursor-pointer py-1 px-2"
              onClick={onOpenGestioneAnno}
              title="Cambia Anno Sportivo"
            >
              <i className="bi bi-calendar3 me-1"></i>
              {annoAttivo.anno}
            </span>
          )}

          <button
            onClick={onSwitchToKiosk}
            className="btn btn-warning btn-sm text-dark fw-bold py-1 px-2"
            title="Passa a Kiosk"
          >
            <i className="bi bi-tablet-landscape-fill"></i>
          </button>
        </div>
      </div>

      {/* BACKDROP SFONDO MOBILE (Chiude il menu se cliccato) */}
      {isMobileOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR LATERALE (Fissa/Sempre aperta su PC >= md, Drawer a comparsa su Mobile < md) */}
      <aside
        className={`sidebar-container bg-primary text-white d-flex flex-column shadow ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        style={{
          width: '270px',
          minWidth: '270px',
          zIndex: 1045
        }}
      >
        {/* Intestazione Sidebar con Logo e pulsante chiusura mobile */}
        <div className="p-3 border-bottom border-primary-subtle d-flex align-items-center justify-content-between">
          <div
            className="d-flex align-items-center gap-2 cursor-pointer"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="bg-warning text-dark rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-trophy-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-bold fs-6 lh-1">SportGestionale</div>
              <small className="text-white-50" style={{ fontSize: '0.72rem' }}>Pannello Amministrazione</small>
            </div>
          </div>

          {/* Pulsante chiusura solo su mobile */}
          <button
            type="button"
            className="btn-close btn-close-white d-md-none"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Chiudi menu"
          ></button>
        </div>

        {/* Selettore Anno Sportivo Interattivo nella Sidebar */}
        <div className="px-3 pt-3 pb-2">
          <label className="text-white-50 small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            Anno Sportivo di Lavoro
          </label>
          <div className="dropdown position-relative">
            <button
              className="btn btn-sm btn-light text-primary fw-bold w-100 d-flex align-items-center justify-content-between shadow-sm py-2 px-3 border-0"
              type="button"
              onClick={() => setIsAnnoDropdownOpen(!isAnnoDropdownOpen)}
              title="Cambia anno o gestisci anni"
            >
              <span className="d-flex align-items-center gap-2 text-truncate">
                <i className="bi bi-calendar-check-fill text-primary"></i>
                <span>{annoAttivo ? annoAttivo.anno : 'Seleziona Anno'}</span>
              </span>
              <i className="bi bi-chevron-down small text-muted"></i>
            </button>

            {isAnnoDropdownOpen && (
              <div
                className="dropdown-menu show position-absolute w-100 shadow-lg border-0 mt-1 p-2"
                style={{ zIndex: 1055 }}
              >
                <div className="dropdown-header small text-uppercase fw-bold text-muted px-2 py-1" style={{ fontSize: '0.72rem' }}>
                  Anni Sportivi
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

        {/* Voci di Navigazione Principali */}
        <div className="p-3 flex-grow-1 overflow-y-auto">
          <div className="text-white-50 small fw-bold text-uppercase mb-2 px-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            Menu Principale
          </div>
          <ul className="nav flex-column gap-1">
            {navItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'persone' && activeTab === 'nuova_persona') ||
                (item.id === 'tesserati' && activeTab === 'nuovo_tesseramento') ||
                (item.id === 'gruppi' && (activeTab === 'nuovo_gruppo' || activeTab === 'iscrizione_gruppo')) ||
                (item.id === 'pagamenti' && activeTab === 'nuovo_pagamento') ||
                (item.id === 'utenti' && activeTab === 'nuovo_utente') ||
                (item.id === 'previsioni' && (activeTab === 'nuova_spesa' || activeTab === 'sinottico_cd'));
              return (
                <li className="nav-item" key={item.id}>
                  <button
                    type="button"
                    className={`nav-link w-100 d-flex align-items-center text-start border-0 rounded-3 py-2 px-3 transition-all ${
                      isActive
                        ? 'bg-white text-primary fw-bold shadow-sm'
                        : 'text-white text-opacity-90 hover-nav-item'
                    }`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <i className={`bi ${item.icon} fs-5 me-3 ${isActive ? 'text-primary' : 'text-white-50'}`}></i>
                    <span className="flex-grow-1">{item.label}</span>
                    {item.badge}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sezione Inferiore: Kiosk, Codice PHP e Profilo Utente */}
        <div className="p-3 border-top border-primary-subtle bg-primary-subtle bg-opacity-10 d-flex flex-column gap-2">
          {/* Tasto Switch a Kiosk Mode */}
          <button
            onClick={() => {
              onSwitchToKiosk();
              setIsMobileOpen(false);
            }}
            className="btn btn-warning text-dark fw-bold w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm py-2"
            title="Passa all'interfaccia Touch a bottoni grandi"
          >
            <i className="bi bi-tablet-landscape-fill fs-5"></i>
            <span>Modalità KIOSK</span>
          </button>

          {/* Tasto Codice PHP & MariaDB */}
          <button
            onClick={() => {
              onOpenCodeExport();
              setIsMobileOpen(false);
            }}
            className="btn btn-outline-light btn-sm fw-semibold w-100 d-flex align-items-center justify-content-center gap-2 py-2"
            title="Visualizza codice PHP & script MariaDB"
          >
            <i className="bi bi-code-slash"></i>
            <span>Codice PHP / MariaDB</span>
          </button>

          {/* Info Utente Attivo e Logout */}
          <div className="d-flex align-items-center justify-content-between pt-2 mt-1 border-top border-primary-subtle">
            <div className="d-flex align-items-center gap-2 text-truncate me-2">
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold small"
                style={{ width: '32px', height: '32px', minWidth: '32px' }}
              >
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="text-truncate">
                <div className="small fw-semibold text-white text-truncate lh-1">{user.nome}</div>
                <div className="text-white-50" style={{ fontSize: '0.7rem' }}>
                  {user.ruolo} {user.is_kiosk ? '• kiosk' : ''}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline-light btn-sm p-1 px-2"
              title="Disconnetti"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
