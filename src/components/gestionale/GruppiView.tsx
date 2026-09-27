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
  onEditGruppo: (gruppo: Gruppo) => void;
  onOpenDisattivaGruppo: (gruppo: Gruppo) => void;
  onRiattivaGruppo: (gruppoId: number) => void;
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
  onOpenDisiscrizione,
  onEditGruppo,
  onOpenDisattivaGruppo,
  onRiattivaGruppo
}) => {
  const [selectedGruppoForView, setSelectedGruppoForView] = useState<Gruppo | null>(null);
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'attivi' | 'disattivati'>('tutti');
  const [searchQuery, setSearchQuery] = useState('');

  const gruppiFiltrati = gruppi.filter((g) => {
    const isAttivo = g.attivo !== false;
    if (filtroStato === 'attivi' && !isAttivo) return false;
    if (filtroStato === 'disattivati' && isAttivo) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNome = g.nome_gruppo.toLowerCase().includes(q);
      const matchCat = g.categoria.toLowerCase().includes(q);
      const matchIstr = (g.istruttore || '').toLowerCase().includes(q);
      if (!matchNome && !matchCat && !matchIstr) return false;
    }
    return true;
  });

  const countAttivi = gruppi.filter((g) => g.attivo !== false).length;
  const countDisattivati = gruppi.filter((g) => g.attivo === false).length;

  return (
    <div className="container-fluid py-4">
      {/* Header Pagina */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-diagram-3 text-primary me-2"></i> Gestione Gruppi & Corsi Annuali
          </h2>
          <p className="text-muted small mb-0">
            Configurazione corsi sportivi, anagrafica squadre e automazione quote mensili per il periodo di attività
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={onOpenIscrizioneGruppo}>
            <i className="bi bi-person-plus me-1"></i> Iscrivi Atleta a Gruppo
          </button>
          <button className="btn btn-primary fw-bold shadow-sm" onClick={onOpenNuovoGruppo}>
            <i className="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
          </button>
        </div>
      </div>

      {/* Guida Rapida: Modifica Nome vs Variazione Importo */}
      <div className="alert alert-light border shadow-sm p-3 rounded-3 mb-4">
        <div className="d-flex align-items-start gap-3">
          <div className="p-2 bg-primary-subtle text-primary rounded-3 flex-shrink-0">
            <i className="bi bi-lightbulb-fill fs-4"></i>
          </div>
          <div className="small text-secondary">
            <strong className="text-dark d-block mb-1">
              Guida Rapida: Rinominare un Gruppo vs Variare l'Importo della Quota
            </strong>
            <div className="row g-2 mt-1">
              <div className="col-md-6">
                <span className="badge bg-primary text-white me-1">Solo Cambio Nome / Dati</span>
                Vuoi correggere o aggiornare il nome, la descrizione o l'istruttore del corso? Clicca su{' '}
                <strong>"Modifica"</strong>. Il gruppo viene rinominato istantaneamente e tutte le quote già emesse o saldate mantengono il loro storico intatto.
              </div>
              <div className="col-md-6">
                <span className="badge bg-warning text-dark me-1">Variazione Importo a Stagione In Corso</span>
                Se intendi applicare una nuova tariffa (es. da € 50 a € 65/mese), la regola contabile corretta è cliccare su{' '}
                <strong>"Disattiva & Quote"</strong>: il corso viene chiuso, le rate future non pagate vengono sgravate in automatico, e crei subito il nuovo gruppo con il nuovo importo.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Filtri e Ricerca */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 bg-white p-3 rounded-3 shadow-sm border">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn btn-sm ${filtroStato === 'tutti' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFiltroStato('tutti')}
          >
            Tutti i Corsi ({gruppi.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filtroStato === 'attivi' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            onClick={() => setFiltroStato('attivi')}
          >
            Attivi ({countAttivi})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filtroStato === 'disattivati' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
            onClick={() => setFiltroStato('disattivati')}
          >
            Disattivati / Conclusi ({countDisattivati})
          </button>
        </div>

        <div className="position-relative" style={{ minWidth: '260px' }}>
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input
            type="text"
            className="form-control form-control-sm ps-5"
            placeholder="Cerca per nome, categoria o coach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Griglia Gruppi */}
      {gruppiFiltrati.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
          <i className="bi bi-diagram-3 fs-1 mb-3 text-secondary opacity-50"></i>
          <h5>Nessun gruppo trovato con i filtri selezionati</h5>
          <p className="small mb-3">Modifica i parametri di ricerca o crea un nuovo gruppo sportivo.</p>
          <div>
            <button className="btn btn-primary" onClick={onOpenNuovoGruppo}>
              <i className="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {gruppiFiltrati.map((g) => {
            const iscritti = gruppiTesserati.filter((gt) => gt.gruppo_id === g.id);
            const quoteGruppo = quote.filter((q) => q.gruppo_id === g.id && q.stato !== 'annullata');
            const quoteAnnullate = quote.filter((q) => q.gruppo_id === g.id && q.stato === 'annullata');
            const isAttivo = g.attivo !== false;

            return (
              <div key={g.id} className="col-12 col-md-6 col-xl-4">
                <div
                  className={`card border-0 shadow-sm rounded-4 h-100 bg-white d-flex flex-column transition-all ${
                    !isAttivo ? 'opacity-75 bg-light-subtle border border-dashed' : ''
                  }`}
                >
                  <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary-subtle text-primary px-2 py-1">
                          {g.categoria}
                        </span>
                        {isAttivo ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-check-circle me-1"></i> Attivo
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">
                            <i className="bi bi-pause-circle me-1"></i> Disattivato
                          </span>
                        )}
                      </div>
                      <h5 className="fw-bold text-dark mb-1 d-flex align-items-center">
                        {g.nome_gruppo}
                      </h5>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success-subtle text-success fs-6 fw-bold">
                        € {g.quota_mensile.toFixed(2)} / mese
                      </span>
                    </div>
                  </div>

                  <div className="card-body px-4 py-3 flex-grow-1">
                    <p className="text-muted small mb-3">
                      {g.descrizione || 'Nessuna descrizione o orario specificato.'}
                    </p>

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
                        <strong>{quoteGruppo.length}</strong> quote attive
                        {quoteAnnullate.length > 0 && (
                          <span className="text-danger ms-1">({quoteAnnullate.length} sgravate)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer bg-white border-top p-3 d-flex flex-wrap gap-2">
                    {/* Pulsante Elenco Iscritti */}
                    <button
                      className="btn btn-outline-secondary btn-sm flex-fill"
                      onClick={() => setSelectedGruppoForView(g)}
                      title="Visualizza gli atleti iscritti a questo corso"
                    >
                      <i className="bi bi-list-ul me-1"></i> Iscritti ({iscritti.length})
                    </button>

                    {/* Pulsante Modifica Nome / Parametri */}
                    <button
                      className="btn btn-outline-primary btn-sm flex-fill fw-semibold"
                      onClick={() => onEditGruppo(g)}
                      title="Modifica nome, istruttore, orari e parametri del corso"
                    >
                      <i className="bi bi-pencil me-1"></i> Modifica
                    </button>

                    {/* Azioni di Stato e Quote */}
                    {isAttivo ? (
                      <>
                        <button
                          className="btn btn-primary btn-sm flex-fill fw-bold"
                          onClick={() => onGeneraQuotePerGruppo(g.id)}
                          title="Calcola e inserisce automaticamente le quote mensili per tutti gli iscritti"
                        >
                          <i className="bi bi-lightning-charge me-1"></i> Genera Quote
                        </button>
                        <button
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => onOpenDisattivaGruppo(g)}
                          title="Disattiva il corso e gestisci l'annullamento automatico delle rate future"
                        >
                          <i className="bi bi-pause-circle me-1"></i> Disattiva & Quote
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-outline-success btn-sm flex-fill"
                        onClick={() => onRiattivaGruppo(g.id)}
                        title="Riattiva questo corso sportivo"
                      >
                        <i className="bi bi-play-circle me-1"></i> Riattiva Corso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-person-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    Nessun atleta attualmente iscritto a questo gruppo.
                  </div>
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
