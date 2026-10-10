import React, { useState } from 'react';
import { Persona, Tesserato, Pagamento, Quota } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona | null;
  tesserati: Tesserato[];
  pagamenti: Pagamento[];
  quote: Quota[];
  onDeletePermanent: (personaId: number) => void;
  onToggleArchive: (personaId: number, archive: boolean) => void;
  onAnonymizeGdpr: (personaId: number) => void;
}

export const PrivacyGdprModal: React.FC<Props> = ({
  isOpen,
  onClose,
  persona,
  tesserati,
  pagamenti,
  quote,
  onDeletePermanent,
  onToggleArchive,
  onAnonymizeGdpr
}) => {
  const [confirmStep, setConfirmStep] = useState<'none' | 'delete' | 'anonymize' | 'archive'>('none');

  if (!isOpen || !persona) return null;

  // Calcolo collegamenti storici e fiscali
  const tessIds = tesserati.filter((t) => t.persona_id === persona.id).map((t) => t.id);
  const userPagamenti = pagamenti.filter((p) => tessIds.includes(p.tesserato_id));
  const userQuote = quote.filter((q) => tessIds.includes(q.tesserato_id));
  const totaleIncassato = userPagamenti.reduce((sum, p) => sum + p.importo, 0);

  const hasFiscalReceipts = userPagamenti.length > 0;
  const isArchived = persona.attivo === false;
  const isAnonymized = persona.anonimizzato_gdpr === true;

  const handleClose = () => {
    setConfirmStep('none');
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden" style={{ whiteSpace: 'normal', wordBreak: 'normal' }}>
          {/* Header */}
          <div className="modal-header bg-dark text-white p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 flex-grow-1 pe-2" style={{ minWidth: 0 }}>
              <div className="p-2 bg-danger bg-opacity-25 rounded-3 text-warning flex-shrink-0">
                <i className="bi bi-shield-lock-fill fs-4"></i>
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <h5 className="modal-title fw-bold mb-0 text-break">Gestione Privacy, Eliminazione & GDPR</h5>
                <small className="text-secondary text-break d-block">Diritto all'Oblio (Art. 17 GDPR) e vincoli di conservazione contabile (Art. 2220 C.C.)</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white flex-shrink-0" onClick={handleClose}></button>
          </div>

          <div className="modal-body p-4 bg-light">
            {/* Scheda Anagrafica Selezionata */}
            <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
              <div className="d-flex justify-content-between align-items-start flex-column flex-sm-row gap-3">
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <span className="badge bg-light text-dark border mb-1">ID Anagrafica #{persona.id}</span>
                  <h5 className="fw-bold mb-1 text-dark text-break">
                    {persona.cognome} {persona.nome}
                    {isAnonymized && <span className="badge bg-danger ms-2"><i className="bi bi-person-x me-1"></i>Anonimizzato GDPR</span>}
                    {isArchived && !isAnonymized && <span className="badge bg-secondary ms-2"><i className="bi bi-archive me-1"></i>Archiviato</span>}
                  </h5>
                  <div className="small text-muted font-monospace">{persona.codice_fiscale}</div>
                  {persona.is_minorenne && (
                    <div className="small text-warning-emphasis fw-semibold mt-1 text-break">
                      <i className="bi bi-shield-check me-1"></i>Minorenne • Tutore: {persona.tutore_cognome} {persona.tutore_nome} ({persona.tutore_relazione || 'Genitore'}) • Tel: {persona.tutore_telefono || '-'}
                    </div>
                  )}
                </div>

                <div className="text-sm-end text-start flex-shrink-0">
                  <div className="small text-muted">Stato contabile:</div>
                  <div className="fw-bold text-dark">{userPagamenti.length} ricevute emesse</div>
                  <div className="small fw-semibold text-success">Totale: € {totaleIncassato.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Quadro Normativo Spiegato chiaramente */}
            {hasFiscalReceipts ? (
              <div className="alert alert-warning border-warning shadow-sm rounded-3 mb-4 p-3 d-flex align-items-start gap-3">
                <i className="bi bi-exclamation-triangle-fill fs-3 text-warning flex-shrink-0 mt-1"></i>
                <div className="small flex-grow-1 text-break" style={{ minWidth: 0, whiteSpace: 'normal', lineHeight: '1.5' }}>
                  <strong className="d-block text-dark fw-bold mb-1">
                    Vincolo di Conservazione Fiscale Decennale (Art. 2220 Codice Civile & DPR 600/73)
                  </strong>
                  Per questa persona risultano registrati <strong>{userPagamenti.length} pagamenti contabili</strong> per un totale di <strong>€ {totaleIncassato.toFixed(2)}</strong>.
                  La legge fiscale obbliga l'associazione a conservare le ricevute e le scritture contabili per <strong>almeno 10 anni</strong>. 
                  L'eliminazione fisica totale distruggerebbe i riferimenti fiscali di cassa. Per ottemperare alla richiesta di cancellazione dati dell'interessato (Art. 17 GDPR), si deve procedere con l'<strong>Anonimizzazione GDPR</strong>.
                </div>
              </div>
            ) : (
              <div className="alert alert-info border-info shadow-sm rounded-3 mb-4 p-3 d-flex align-items-start gap-3">
                <i className="bi bi-info-circle-fill fs-3 text-info flex-shrink-0 mt-1"></i>
                <div className="small flex-grow-1 text-break" style={{ minWidth: 0, whiteSpace: 'normal', lineHeight: '1.5' }}>
                  <strong className="d-block text-dark fw-bold mb-1">Nessuna Ricevuta Fiscale Collegata</strong>
                  Per questo nominativo non risultano registrati incassi o ricevute contabili. È pertanto possibile sia l'archiviazione temporanea che l'<strong>eliminazione fisica definitiva</strong> immediata.
                </div>
              </div>
            )}

            {/* LE 3 OPZIONI */}
            <div className="row g-3">
              {/* Opzione 1: Archiviazione (Nascondi / Ripristina) */}
              <div className="col-12">
                <div className={`card border rounded-3 p-3 bg-white ${confirmStep === 'archive' ? 'border-primary shadow' : ''}`}>
                  <div className="d-flex justify-content-between align-items-sm-center align-items-start flex-column flex-sm-row gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="p-2 bg-secondary bg-opacity-10 text-secondary rounded-3 flex-shrink-0 mt-1">
                        <i className={`bi ${isArchived ? 'bi-box-arrow-up' : 'bi-eye-slash'} fs-4`}></i>
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <h6 className="fw-bold mb-1 text-dark text-break">
                          {isArchived ? '1. Ripristina Anagrafica Tra i Soci Attivi' : '1. Nascondi / Archivia Anagrafica (Soft Delete)'}
                        </h6>
                        <p className="small text-muted mb-0 text-break" style={{ whiteSpace: 'normal', lineHeight: '1.45' }}>
                          {isArchived 
                            ? 'Riporta la persona e il tutore tra le anagrafiche attive e operabili.'
                            : 'Nasconde la persona dalle liste quotidiane, dai corsi e dal Kiosk, mantenendo intatti storico e ricevute.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ms-sm-auto align-self-sm-center align-self-stretch text-end">
                      {confirmStep === 'archive' ? (
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmStep('none')}>
                            Annulla
                          </button>
                          <button
                            className="btn btn-sm btn-primary fw-bold"
                            onClick={() => {
                              onToggleArchive(persona.id, !isArchived);
                              handleClose();
                            }}
                          >
                            Conferma {isArchived ? 'Ripristino' : 'Archiviazione'}
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`btn btn-sm ${isArchived ? 'btn-outline-primary' : 'btn-outline-secondary'} fw-semibold`}
                          onClick={() => setConfirmStep('archive')}
                        >
                          {isArchived ? 'Ripristina' : 'Archivia / Nascondi'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Opzione 2: Anonimizzazione GDPR (Art. 17 Diritto all'Oblio) */}
              <div className="col-12">
                <div className={`card border rounded-3 p-3 bg-white ${confirmStep === 'anonymize' ? 'border-warning shadow' : ''}`}>
                  <div className="d-flex justify-content-between align-items-sm-center align-items-start flex-column flex-sm-row gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="p-2 bg-warning bg-opacity-10 text-warning-emphasis rounded-3 flex-shrink-0 mt-1">
                        <i className="bi bi-shield-slash-fill fs-4"></i>
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                          <h6 className="fw-bold mb-0 text-dark text-break">2. Anonimizzazione GDPR (Art. 17 Diritto all'Oblio)</h6>
                          <span className="badge bg-warning text-dark small">Consigliato GDPR</span>
                        </div>
                        <p className="small text-muted mb-0 text-break" style={{ whiteSpace: 'normal', lineHeight: '1.45' }}>
                          Rimuove definitivamente Nome, Cognome, Telefono, Email, Indirizzo e <strong>TUTTI i dati del Tutore</strong>. 
                          Mantiene i numeri progressivi delle ricevute fiscali intestate ad "ANONIMO" per conformità decennale ex art. 2220 C.C.
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ms-sm-auto align-self-sm-center align-self-stretch text-end">
                      {isAnonymized ? (
                        <span className="badge bg-success py-2 px-3"><i className="bi bi-check2-circle me-1"></i>Già Anonimizzato</span>
                      ) : confirmStep === 'anonymize' ? (
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmStep('none')}>
                            Annulla
                          </button>
                          <button
                            className="btn btn-sm btn-warning text-dark fw-bold"
                            onClick={() => {
                              onAnonymizeGdpr(persona.id);
                              handleClose();
                            }}
                          >
                            <i className="bi bi-check-lg me-1"></i> Conferma Anonimizzazione
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-warning text-dark fw-semibold"
                          onClick={() => setConfirmStep('anonymize')}
                        >
                          Anonimizza Dati
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Opzione 3: Eliminazione Definitiva (Hard Delete) */}
              <div className="col-12">
                <div className={`card border rounded-3 p-3 bg-white ${confirmStep === 'delete' ? 'border-danger shadow' : ''}`}>
                  <div className="d-flex justify-content-between align-items-sm-center align-items-start flex-column flex-sm-row gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                      <div className={`p-2 rounded-3 flex-shrink-0 mt-1 ${hasFiscalReceipts ? 'bg-light text-muted' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        <i className="bi bi-trash3-fill fs-4"></i>
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                          <h6 className={`fw-bold mb-0 text-break ${hasFiscalReceipts ? 'text-muted' : 'text-danger'}`}>
                            3. Eliminazione Fisica Definitiva (Hard Delete)
                          </h6>
                          {hasFiscalReceipts && <span className="badge bg-danger small">Non consentita per legge</span>}
                        </div>
                        <p className="small text-muted mb-0 text-break" style={{ whiteSpace: 'normal', lineHeight: '1.45' }}>
                          {hasFiscalReceipts
                            ? 'Bloccata per la presenza di documenti contabili obbligatori per 10 anni. Utilizza l\'Anonimizzazione GDPR sopra.'
                            : 'Cancella definitivamente la persona dal database. Consentito perché non risultano ricevute contabili collegate.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ms-sm-auto align-self-sm-center align-self-stretch text-end">
                      {hasFiscalReceipts ? (
                        <button className="btn btn-sm btn-light border text-muted" disabled title="Bloccato per obblighi fiscali decennali">
                          Non Consentito
                        </button>
                      ) : confirmStep === 'delete' ? (
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmStep('none')}>
                            Annulla
                          </button>
                          <button
                            className="btn btn-sm btn-danger fw-bold"
                            onClick={() => {
                              onDeletePermanent(persona.id);
                              handleClose();
                            }}
                          >
                            <i className="bi bi-trash me-1"></i> Conferma Eliminazione Definitiva
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold"
                          onClick={() => setConfirmStep('delete')}
                        >
                          Elimina Definitivo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="small text-muted text-break flex-grow-1" style={{ minWidth: 0 }}>
              <i className="bi bi-shield-check me-1 text-success"></i> Sistema conforme a Regolamento UE 2016/679 (GDPR) e Codice Civile Italiano.
            </span>
            <button type="button" className="btn btn-secondary px-4 flex-shrink-0" onClick={handleClose}>
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
