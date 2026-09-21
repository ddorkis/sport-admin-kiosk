import React, { useState } from 'react';
import { Gruppo, Anno } from '../../types';

interface Props {
  onBack: () => void;
  anni: Anno[];
  onSave: (gruppo: Omit<Gruppo, 'id'>) => void;
}

export const NuovoGruppoPage: React.FC<Props> = ({
  onBack,
  anni,
  onSave
}) => {
  const annoAttivo = anni.find((a) => a.attivo) || anni[0];

  const [nomeGruppo, setNomeGruppo] = useState('');
  const [categoria, setCategoria] = useState('Pattinaggio Singolo');
  const [quotaMensile, setQuotaMensile] = useState('55.00');
  const [giornoScadenza, setGiornoScadenza] = useState('10');
  const [dataInizio, setDataInizio] = useState('2024-09-01');
  const [dataFine, setDataFine] = useState('2025-05-31');
  const [istruttore, setIstruttore] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [annoId, setAnnoId] = useState<number>(annoAttivo?.id || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeGruppo.trim()) {
      alert('Inserisci il nome del gruppo / corso.');
      return;
    }

    onSave({
      anno_id: annoId,
      nome_gruppo: nomeGruppo.trim(),
      categoria: categoria.trim() || 'Generale',
      quota_mensile: parseFloat(quotaMensile) || 50,
      giorno_scadenza_mensile: parseInt(giornoScadenza) || 10,
      data_inizio: dataInizio,
      data_fine: dataFine,
      istruttore: istruttore.trim(),
      descrizione: descrizione.trim()
    });

    onBack();
  };

  return (
    <div className="container-fluid py-4 max-w-5xl mx-auto">
      {/* Intestazione con Breadcrumb e Azioni */}
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
                  <i className="bi bi-diagram-3 me-1"></i> Gruppi & Corsi Annuali
                </button>
              </li>
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                Nuovo Gruppo / Corso
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center text-dark">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={onBack}
              title="Torna all'elenco gruppi"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <span>Creazione Nuovo Gruppo / Corso di Pattinaggio</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            Definisci la quota mensile, il giorno di scadenza e il periodo di attività per l'automazione delle rate.
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
            <i className="bi bi-check-lg me-1"></i> Salva Corso e Torna alla Lista
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i> Dati Principali del Corso
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label fw-semibold text-dark">Nome Gruppo / Squadra *</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Es. Pattinaggio Primi Passi Baby, Solo Dance Avanzato"
                      value={nomeGruppo}
                      onChange={(e) => setNomeGruppo(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Anno Sportivo</label>
                    <select
                      className="form-select form-select-lg"
                      value={annoId}
                      onChange={(e) => setAnnoId(Number(e.target.value))}
                    >
                      {anni.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.anno}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Specialità / Categoria</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Pattinaggio Artistico Singolo, Solo Dance, Gruppi Show"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Allenatore / Istruttore Federale</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Elena Ferrari (Tecnico FISR 3° Livello)"
                      value={istruttore}
                      onChange={(e) => setIstruttore(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Orari in Pista & Descrizione</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Es. Martedì e Giovedì dalle 16:30 alle 18:00 - Palazzetto Comunale Pista B..."
                      value={descrizione}
                      onChange={(e) => setDescrizione(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Scheda Parametri Finanziari */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-success d-flex align-items-center">
                  <i className="bi bi-cash-stack me-2 fs-5"></i> Parametri Quota & Scadenze
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Quota Mensile Richiesta (€) *</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light text-success fw-bold">€</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="form-control fw-bold text-success"
                        value={quotaMensile}
                        onChange={(e) => setQuotaMensile(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-text small">Importo addebitato a ciascun atleta iscritto</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Giorno di Scadenza del Mese *</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="form-control"
                      value={giornoScadenza}
                      onChange={(e) => setGiornoScadenza(e.target.value)}
                      required
                    />
                    <div className="form-text small">Es. 10 = rata da saldare entro il giorno 10</div>
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-semibold text-dark">Inizio Corso</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataInizio}
                      onChange={(e) => setDataInizio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-semibold text-dark">Fine Corso</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataFine}
                      onChange={(e) => setDataFine(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner info quote automatiche */}
            <div className="alert alert-info border-info small p-3 rounded-3 mb-4 shadow-sm">
              <i className="bi bi-magic me-2 text-primary fs-5"></i>
              <strong>Generazione Automatica Rate:</strong> Quando un atleta viene iscritto al gruppo, il sistema genererà automaticamente tutte le scadenze mensili comprese tra la data di inizio e fine corso.
            </div>

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary fw-bold py-2 shadow-sm"
              >
                <i className="bi bi-check-circle me-1"></i> Crea Gruppo e Torna alla Lista
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary py-2"
                onClick={onBack}
              >
                ← Annulla
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
