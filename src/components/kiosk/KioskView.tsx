import React from 'react';
import { Persona, Tesserato, Gruppo, GruppoTesserato, Quota, Pagamento, Utente, Anno } from '../../types';
import { isQuotaScaduta } from '../../utils/storage';

interface Props {
  user: Utente;
  annoAttivo: Anno | undefined;
  persone: Persona[];
  tesserati: Tesserato[];
  gruppi: Gruppo[];
  quote: Quota[];
  pagamenti: Pagamento[];
  onOpenNuovaPersona: () => void;
  onOpenTesseramento: () => void;
  onOpenIscrizioneGruppo: () => void;
  onOpenPagamento: () => void;
  onOpenCercaAnagrafica: () => void;
  onOpenGestioneAnno: () => void;
  onSwitchToGestionale: () => void;
  onOpenCodeExport: () => void;
  onLogout: () => void;
}

export const KioskView: React.FC<Props> = ({
  user,
  annoAttivo,
  persone,
  tesserati,
  gruppi,
  quote,
  pagamenti,
  onOpenNuovaPersona,
  onOpenTesseramento,
  onOpenIscrizioneGruppo,
  onOpenPagamento,
  onOpenCercaAnagrafica,
  onOpenGestioneAnno,
  onSwitchToGestionale,
  onOpenCodeExport,
  onLogout
}) => {
  // Statistiche rapide Kiosk
  const quoteScaduteCount = quote.filter(isQuotaScaduta).length;
  const totaleIncassato = pagamenti.reduce((sum, p) => sum + p.importo, 0);
  const minorenniCount = persone.filter((p) => p.is_minorenne).length;

  return (
    <div className="min-vh-100 bg-dark text-white d-flex flex-column justify-content-between p-3 p-md-5" style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Barra Superiore Kiosk */}
      <header className="d-flex justify-content-between align-items-center pb-4 border-bottom border-secondary">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-warning text-dark px-3 py-2 fw-bold text-uppercase fs-6">
              <i className="bi bi-display me-1"></i> Postazione Touch Reception
            </span>
            {annoAttivo && (
              <button
                type="button"
                onClick={onOpenGestioneAnno}
                className="badge bg-primary text-white px-3 py-2 fs-6 border-0 cursor-pointer d-flex align-items-center gap-1 shadow-sm"
                title="Clicca per cambiare l'anno sportivo di riferimento"
              >
                <i className="bi bi-calendar-event me-1"></i> Anno Sportivo {annoAttivo.anno}
                <i className="bi bi-arrow-left-right ms-1 small"></i>
              </button>
            )}
          </div>
          <h1 className="h2 fw-bold mb-0 text-light d-flex align-items-center gap-2">
            <i className="bi bi-trophy-fill text-warning"></i> Polisportiva Aurora &bull; Kiosk Desk
          </h1>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button
            onClick={onOpenCodeExport}
            className="btn btn-outline-info btn-lg px-4 fw-semibold shadow-sm"
            title="Visualizza e scarica il codice PHP e script MariaDB"
          >
            <i className="bi bi-file-earmark-code me-2"></i>
            Codice PHP & MariaDB
          </button>

          <button
            onClick={onSwitchToGestionale}
            className="btn btn-light btn-lg px-4 fw-bold shadow-sm"
          >
            <i className="bi bi-table me-2 text-primary"></i>
            Gestionale Amministrativo
          </button>

          <button
            onClick={onLogout}
            className="btn btn-danger btn-lg px-3"
            title="Esci dall'applicazione"
          >
            <i className="bi bi-power"></i>
          </button>
        </div>
      </header>

      {/* Sezione Centrale con i Grandi Tasti Touch */}
      <main className="my-auto py-4">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold text-white mb-2">Operazioni Rapide Reception</h2>
          <p className="lead text-secondary mb-0">
            Tocca uno dei pulsanti per avviare subito l'inserimento anagrafica, tesseramento o incasso quote.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {/* 1. Nuova Persona & Tutore */}
          <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
            <button
              onClick={onOpenNuovaPersona}
              className="btn btn-primary w-100 py-4 px-3 rounded-4 shadow-lg border-2 border-primary-subtle d-flex flex-column align-items-center justify-content-center text-center transition-all h-100"
              style={{ minHeight: '190px' }}
            >
              <i className="bi bi-person-plus-fill display-3 mb-2"></i>
              <span className="fs-5 fw-bold text-white">Nuova Persona</span>
              <small className="text-white-50 mt-1">Anagrafica & Tutore Legale</small>
            </button>
          </div>

          {/* 2. Tesseramento Annuale */}
          <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
            <button
              onClick={onOpenTesseramento}
              className="btn btn-success w-100 py-4 px-3 rounded-4 shadow-lg border-2 border-success-subtle d-flex flex-column align-items-center justify-content-center text-center transition-all h-100"
              style={{ minHeight: '190px' }}
            >
              <i className="bi bi-card-checklist display-3 mb-2"></i>
              <span className="fs-5 fw-bold text-white">Tesseramento</span>
              <small className="text-white-50 mt-1">Numero Tessera & Medico</small>
            </button>
          </div>

          {/* 3. Iscrizione Gruppo & Genera Quote */}
          <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
            <button
              onClick={onOpenIscrizioneGruppo}
              className="btn btn-info text-white w-100 py-4 px-3 rounded-4 shadow-lg border-2 border-info-subtle d-flex flex-column align-items-center justify-content-center text-center transition-all h-100"
              style={{ minHeight: '190px' }}
            >
              <i className="bi bi-diagram-3-fill display-3 mb-2"></i>
              <span className="fs-5 fw-bold">Iscrizione Gruppo</span>
              <small className="text-white-50 mt-1">Calcolo Quote Mensili</small>
            </button>
          </div>

          {/* 4. Registra Pagamento */}
          <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
            <button
              onClick={onOpenPagamento}
              className="btn btn-warning text-dark w-100 py-4 px-3 rounded-4 shadow-lg border-2 border-warning-subtle d-flex flex-column align-items-center justify-content-center text-center transition-all h-100"
              style={{ minHeight: '190px' }}
            >
              <i className="bi bi-cash-coin display-3 mb-2"></i>
              <span className="fs-5 fw-bold">Registra Pagamento</span>
              <small className="text-dark-50 mt-1">Quote o Pagamento Libero</small>
            </button>
          </div>

          {/* 5. Cerca Anagrafica */}
          <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
            <button
              onClick={onOpenCercaAnagrafica}
              className="btn btn-secondary w-100 py-4 px-3 rounded-4 shadow-lg border-2 border-secondary-subtle d-flex flex-column align-items-center justify-content-center text-center transition-all h-100"
              style={{ minHeight: '190px' }}
            >
              <i className="bi bi-search display-3 mb-2 text-info"></i>
              <span className="fs-5 fw-bold text-white">Cerca Anagrafica</span>
              <small className="text-white-50 mt-1">Scheda & Saldo Atleta</small>
            </button>
          </div>
        </div>
      </main>

      {/* Barra Inferiore con Riepilogo Rapido di Cassa e Situazione */}
      <footer className="pt-4 border-top border-secondary">
        <div className="row g-3 text-center">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-secondary bg-opacity-25 rounded-3 border border-secondary">
              <span className="text-secondary small d-block">Totale Atleti Anagrafica</span>
              <strong className="fs-4 text-light">{persone.length}</strong>
              <small className="text-warning-emphasis d-block">({minorenniCount} minorenni con tutore)</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-secondary bg-opacity-25 rounded-3 border border-secondary">
              <span className="text-secondary small d-block">Tesserati Attivi Anno</span>
              <strong className="fs-4 text-success">{tesserati.length}</strong>
              <small className="text-secondary d-block">in {gruppi.length} corsi / gruppi</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-secondary bg-opacity-25 rounded-3 border border-secondary">
              <span className="text-secondary small d-block">Quote Scadute Non Pagate</span>
              <strong className={`fs-4 ${quoteScaduteCount > 0 ? 'text-danger' : 'text-success'}`}>
                {quoteScaduteCount}
              </strong>
              <small className="text-secondary d-block">richiedono sollecito</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-secondary bg-opacity-25 rounded-3 border border-secondary">
              <span className="text-secondary small d-block">Totale Incassato Cassa</span>
              <strong className="fs-4 text-warning">€ {totaleIncassato.toFixed(2)}</strong>
              <small className="text-secondary d-block">({pagamenti.length} ricevute emesse)</small>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 small text-secondary">
          <div>
            Operatore Kiosk: <strong className="text-light">{user.nome}</strong> ({user.username}) &bull; Flag Kiosk: <span className="badge bg-success">Attivo</span>
          </div>
          <div>
            Polisportiva Sport Gestionale &bull; PHP + MariaDB + Bootstrap 5
          </div>
        </div>
      </footer>
    </div>
  );
};
