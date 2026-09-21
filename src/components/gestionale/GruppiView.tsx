import React, { useState } from 'react';
import { Gruppo, GruppoTesserato, Tesserato, Persona, Anno, Quota } from '../../types';

interface Props {
  gruppi: Gruppo[];
  gruppiTesserati: GruppoTesserato[];
  tesserati: Tesserato[];
  persone: Persona[];
  anni: Anno[];
  quote: Quota[];
  onGeneraQuotePerGruppo: (gruppoId: number) => void;
  onOpenNuovoGruppo: () => void;
  onOpenIscrizioneGruppo: () => void;
  onOpenDisiscrizione?: (tesseratoId: number) => void;
}

export const GruppiView: React.FC<Props> = ({
  gruppi,
  gruppiTesserati,
  tesserati,
  persone,
  anni,
  quote,
  onGeneraQuotePerGruppo,
  onOpenNuovoGruppo,
  onOpenIscrizioneGruppo,
  onOpenDisiscrizione
}) => {
  const [selectedGruppoForView, setSelectedGruppoForView] = useState<Gruppo | null>(null);

  const annoAttivo = anni.find((a) => a.attivo) || anni[0];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-diagram-3 text-primary me-2"></i> Gestione Gruppi & Corsi Annuali
          </h2>
          <p className="text-muted small mb-0">
            Configurazione corsi sportivi e generazione quote automatiche mensili per il periodo di attività
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={onOpenIscrizioneGruppo}>
            <i className="bi bi-person-plus me-1"></i> Iscrivi Atleta a Gruppo
          </button>
          <button className="btn btn-primary fw-bold" onClick={onOpenNuovoGruppo}>
            <i className="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
          </button>
        </div>
      </div>

      {/* Regola di Calcolo Automatico Banner Informativo */}
      <div className="alert alert-info border-info d-flex align-items-center mb-4 shadow-sm p-3 rounded-3">
        <i className="bi bi-gear-wide-connected fs-3 me-3 text-primary"></i>
        <div className="small">
          <strong>Automatismo Quote Mensili:</strong> Ogni gruppo ha una data di inizio, una data di fine e una quota mensile.
          Quando un atleta viene iscritto al gruppo (o quando clicchi su <em>"Genera Quote per Iscritti"</em>), il sistema crea in automatico tutte le rate mensili dal mese di inizio al mese di fine, con scadenza al giorno mensile indicato.
        </div>
      </div>

      {/* Griglia Gruppi */}
      <div className="row g-4">
        {gruppi.map((g) => {
          const iscritti = gruppiTesserati.filter((gt) => gt.gruppo_id === g.id);
          const quoteGruppo = quote.filter((q) => q.gruppo_id === g.id);

          return (
            <div key={g.id} className="col-12 col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white d-flex flex-column">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <span className="badge bg-primary-subtle text-primary mb-2 px-2 py-1">
                      {g.categoria}
                    </span>
                    <h5 className="fw-bold text-dark mb-1">{g.nome_gruppo}</h5>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success-subtle text-success fs-6 fw-bold">
                      € {g.quota_mensile.toFixed(2)} / mese
                    </span>
                  </div>
                </div>

                <div className="card-body px-4 py-3 flex-grow-1">
                  <p className="text-muted small mb-3">{g.descrizione || 'Nessuna descrizione specificata.'}</p>

                  <div className="bg-light p-3 rounded-3 small mb-3">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted d-block">Periodo Corso:</span>
                        <strong>{g.data_inizio} &bull; {g.data_fine}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Giorno Scadenza:</span>
                        <strong>Ogni {g.giorno_scadenza_mensile} del mese</strong>
                      </div>
                      <div className="col-12">
                        <span className="text-muted d-block">Istruttore Responsabile:</span>
                        <strong className="text-primary">{g.istruttore || 'Non assegnato'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center small text-muted">
                    <span>
                      <i className="bi bi-people-fill me-1 text-secondary"></i>
                      <strong>{iscritti.length}</strong> atleti iscritti
                    </span>
                    <span>
                      <i className="bi bi-receipt me-1 text-secondary"></i>
                      <strong>{quoteGruppo.length}</strong> quote generate
                    </span>
                  </div>
                </div>

                <div className="card-footer bg-white border-top p-3 d-flex justify-content-between gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm flex-fill"
                    onClick={() => setSelectedGruppoForView(g)}
                  >
                    <i className="bi bi-list-ul me-1"></i> Elenco Iscritti
                  </button>

                  <button
                    className="btn btn-outline-primary btn-sm flex-fill fw-bold"
                    onClick={() => onGeneraQuotePerGruppo(g.id)}
                    title="Calcola e inserisce automaticamente le quote mensili per tutti gli iscritti"
                  >
                    <i className="bi bi-lightning-charge me-1"></i> Genera Quote
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Visualizza Iscritti al Gruppo */}
      {selectedGruppoForView && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-people-fill me-2 text-primary"></i>
                  Atleti Iscritti a: {selectedGruppoForView.nome_gruppo}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedGruppoForView(null)}></button>
              </div>
              <div className="modal-body p-4">
                {gruppiTesserati.filter((gt) => gt.gruppo_id === selectedGruppoForView.id).length === 0 ? (
                  <div className="text-center py-4 text-muted">Nessun atleta attualmente iscritto a questo gruppo.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light small text-uppercase">
                        <tr>
                          <th>Tessera</th>
                          <th>Nominativo</th>
                          <th>Data Iscrizione</th>
                          <th>Minorenne / Tutore</th>
                          <th className="text-end">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gruppiTesserati
                          .filter((gt) => gt.gruppo_id === selectedGruppoForView.id)
                          .map((gt) => {
                            const tess = tesserati.find((t) => t.id === gt.tesserato_id);
                            const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
                            return (
                              <tr key={gt.id}>
                                <td><code>{tess?.numero_tessera}</code></td>
                                <td><strong>{pers?.cognome} {pers?.nome}</strong></td>
                                <td>{gt.data_iscrizione}</td>
                                <td>
                                  {pers?.is_minorenne ? (
                                    <span className="badge bg-warning text-dark">
                                      Minorenne (Tutore: {pers.tutore_cognome} - {pers.tutore_telefono})
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary">Maggiorenne</span>
                                  )}
                                </td>
                                <td className="text-end">
                                  {onOpenDisiscrizione && tess && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      title="Disiscrivi atleta dal corso e gestisci quote future"
                                      onClick={() => {
                                        setSelectedGruppoForView(null);
                                        onOpenDisiscrizione(tess.id);
                                      }}
                                    >
                                      <i className="bi bi-person-x me-1"></i> Disiscrivi
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-secondary" onClick={() => setSelectedGruppoForView(null)}>
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
