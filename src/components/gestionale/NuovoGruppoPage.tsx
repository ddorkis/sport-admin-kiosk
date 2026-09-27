import React, { useState, useEffect } from 'react';
import { Gruppo, Anno } from '../../types';

interface Props {
  onBack: () => void;
  anni: Anno[];
  initialGruppo?: Gruppo | null;
  onSave: (gruppo: Omit<Gruppo, 'id'>) => void;
  onUpdate?: (gruppo: Gruppo) => void;
}

export const NuovoGruppoPage: React.FC<Props> = ({
  onBack,
  anni,
  initialGruppo,
  onSave,
  onUpdate
}) => {
  const isEditing = Boolean(initialGruppo);
  const annoAttivo = anni.find((a) => a.attivo) || anni[0];

  const [nomeGruppo, setNomeGruppo] = useState(initialGruppo?.nome_gruppo || '');
  const [categoria, setCategoria] = useState(initialGruppo?.categoria || 'Pattinaggio Singolo');
  const [quotaMensile, setQuotaMensile] = useState(initialGruppo ? initialGruppo.quota_mensile.toFixed(2) : '55.00');
  const [giornoScadenza, setGiornoScadenza] = useState(initialGruppo ? initialGruppo.giorno_scadenza_mensile.toString() : '10');
  const [dataInizio, setDataInizio] = useState(initialGruppo?.data_inizio || '2024-09-01');
  const [dataFine, setDataFine] = useState(initialGruppo?.data_fine || '2025-05-31');
  const [istruttore, setIstruttore] = useState(initialGruppo?.istruttore || '');
  const [descrizione, setDescrizione] = useState(initialGruppo?.descrizione || '');
  const [annoId, setAnnoId] = useState<number>(initialGruppo?.anno_id || annoAttivo?.id || 1);
  const [attivo, setAttivo] = useState<boolean>(initialGruppo?.attivo ?? true);

  useEffect(() => {
    if (initialGruppo) {
      setNomeGruppo(initialGruppo.nome_gruppo);
      setCategoria(initialGruppo.categoria);
      setQuotaMensile(initialGruppo.quota_mensile.toFixed(2));
      setGiornoScadenza(initialGruppo.giorno_scadenza_mensile.toString());
      setDataInizio(initialGruppo.data_inizio);
      setDataFine(initialGruppo.data_fine);
      setIstruttore(initialGruppo.istruttore);
      setDescrizione(initialGruppo.descrizione);
      setAnnoId(initialGruppo.anno_id);
      setAttivo(initialGruppo.attivo ?? true);
    }
  }, [initialGruppo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeGruppo.trim()) {
      alert('Inserisci il nome del gruppo / corso.');
      return;
    }

    if (isEditing && initialGruppo && onUpdate) {
      onUpdate({
        ...initialGruppo,
        anno_id: annoId,
        nome_gruppo: nomeGruppo.trim(),
        categoria: categoria.trim() || 'Generale',
        quota_mensile: parseFloat(quotaMensile) || 50,
        giorno_scadenza_mensile: parseInt(giornoScadenza) || 10,
        data_inizio: dataInizio,
        data_fine: dataFine,
        istruttore: istruttore.trim(),
        descrizione: descrizione.trim(),
        attivo
      });
    } else {
      onSave({
        anno_id: annoId,
        nome_gruppo: nomeGruppo.trim(),
        categoria: categoria.trim() || 'Generale',
        quota_mensile: parseFloat(quotaMensile) || 50,
        giorno_scadenza_mensile: parseInt(giornoScadenza) || 10,
        data_inizio: dataInizio,
        data_fine: dataFine,
        istruttore: istruttore.trim(),
        descrizione: descrizione.trim(),
        attivo
      });
    }

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
                {isEditing ? `Modifica Gruppo: ${initialGruppo?.nome_gruppo}` : 'Nuovo Gruppo / Corso'}
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
            <span>{isEditing ? `Modifica Gruppo: ${initialGruppo?.nome_gruppo}` : 'Creazione Nuovo Gruppo / Corso di Pattinaggio'}</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            {isEditing
              ? "Modifica il nome del corso, l'istruttore o gli orari. Le quote già generate e i pagamenti storici rimarranno intatti."
              : "Definisci la quota mensile, il giorno di scadenza e il periodo di attività per l'automazione delle rate."}
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
            <i className="bi bi-check-lg me-1"></i> {isEditing ? 'Salva Modifiche' : 'Salva Corso e Torna alla Lista'}
          </button>
        </div>
      </div>

      {/* Banner Informativo specifico se in modifica */}
      {isEditing && (
        <div className="alert alert-info border-info d-flex align-items-start mb-4 shadow-sm p-3 rounded-3">
          <i className="bi bi-info-circle-fill fs-3 text-primary me-3 flex-shrink-0 mt-1"></i>
          <div className="small">
            <strong className="d-block mb-1 fs-6">Gestione Modifica Nome vs Variazione Importo:</strong>
            <ul className="mb-0 ps-3">
              <li>
                <strong>Vuoi cambiare solo il nome, l'istruttore o la descrizione?</strong> Puoi farlo qui: il nuovo nome verrà associato al corso e mostrato in tutte le viste, senza alterare gli importi delle quote o i pagamenti già registrati.
              </li>
              <li className="mt-1">
                <strong>Vuoi cambiare l'importo mensile a stagione in corso?</strong> La regola contabile corretta è non modificare retroattivamente il gruppo. Ti consigliamo invece di usare la funzione <em>"Disattiva Corso & Quote Future"</em> nell'elenco gruppi (che sgoverà le rate non saldate da oggi in poi) e poi creare un nuovo gruppo con la nuova tariffa.
              </li>
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i> Dati Principali del Corso
                </h5>
                {isEditing && (
                  <span className={`badge ${attivo ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} px-3 py-2`}>
                    {attivo ? 'Corso Attivo' : 'Corso Disattivato'}
                  </span>
                )}
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label fw-semibold text-dark">
                      Nome Gruppo / Squadra <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg fw-bold"
                      placeholder="Es. Pattinaggio Primi Passi Baby, Solo Dance Avanzato"
                      value={nomeGruppo}
                      onChange={(e) => setNomeGruppo(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="form-text small">
                      {isEditing
                        ? "Rinominare il gruppo non altera gli importi delle quote già generate."
                        : "Nome identificativo del corso mostrato nelle ricevute e nei prospetti."}
                    </div>
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
                          {a.anno} {a.attivo ? '(Attivo)' : ''}
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

                  {isEditing && (
                    <div className="col-12 pt-2">
                      <div className="form-check form-switch p-3 bg-light rounded-3 border">
                        <input
                          className="form-check-input ms-0 me-3"
                          type="checkbox"
                          role="switch"
                          id="chkAttivo"
                          checked={attivo}
                          onChange={(e) => setAttivo(e.target.checked)}
                        />
                        <label className="form-check-label fw-bold text-dark" htmlFor="chkAttivo">
                          Corso Attivo (visibile per nuove iscrizioni e generazione quote)
                        </label>
                        <div className="text-muted small ps-5">
                          Se disattivato, il corso non riceverà nuove iscrizioni ma rimarrà disponibile nello storico e nel rendiconto.
                        </div>
                      </div>
                    </div>
                  )}
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
                        step="0.50"
                        min="0"
                        className="form-control fw-bold text-success"
                        value={quotaMensile}
                        onChange={(e) => setQuotaMensile(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-text small">
                      {isEditing
                        ? "Nota: cambiare questo valore influisce solo sulle generazioni future, non sulle quote già generate."
                        : "Importo addebitato a ciascun atleta iscritto per ogni rata mensile."}
                    </div>
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
                    <div className="form-text small">Es. 10 = rata da saldare entro il giorno 10 del mese</div>
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
                <i className="bi bi-check-circle me-1"></i> {isEditing ? 'Salva Modifiche' : 'Crea Gruppo e Torna alla Lista'}
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
