import React, { useState } from 'react';
import { Anno, SpesaPrevisionale, CategoriaSpesa } from '../../types';

interface Props {
  initialSpesa?: SpesaPrevisionale | null;
  annoAttivo?: Anno;
  onBack: () => void;
  onSave: (spesa: Omit<SpesaPrevisionale, 'id'>, idToEdit?: number) => void;
}

const CATEGORIE_SPESA: CategoriaSpesa[] = [
  'Affitto Impianti / Pista',
  'Compensi Tecnici / Allenatori',
  'Tesseramenti & Affiliazioni (FISR/EPS)',
  'Assicurazioni',
  'Materiale Sportivo & Divise',
  'Gare & Trasferte',
  'Amministrazione & Commercialista',
  'Altro'
];

const CATEGORIA_ICONS: Record<CategoriaSpesa, string> = {
  'Affitto Impianti / Pista': 'bi-building',
  'Compensi Tecnici / Allenatori': 'bi-person-badge',
  'Tesseramenti & Affiliazioni (FISR/EPS)': 'bi-patch-check',
  'Assicurazioni': 'bi-shield-check',
  'Materiale Sportivo & Divise': 'bi-bag',
  'Gare & Trasferte': 'bi-trophy',
  'Amministrazione & Commercialista': 'bi-file-earmark-spreadsheet',
  'Altro': 'bi-three-dots'
};

const CATEGORIA_COLORS: Record<CategoriaSpesa, string> = {
  'Affitto Impianti / Pista': 'bg-primary text-white',
  'Compensi Tecnici / Allenatori': 'bg-info text-dark',
  'Tesseramenti & Affiliazioni (FISR/EPS)': 'bg-success text-white',
  'Assicurazioni': 'bg-warning text-dark',
  'Materiale Sportivo & Divise': 'bg-secondary text-white',
  'Gare & Trasferte': 'bg-danger text-white',
  'Amministrazione & Commercialista': 'bg-dark text-white',
  'Altro': 'bg-light text-dark border'
};

export const NuovaSpesaPage: React.FC<Props> = ({
  initialSpesa,
  annoAttivo,
  onBack,
  onSave
}) => {
  const isEditing = !!initialSpesa;

  const [titolo, setTitolo] = useState(initialSpesa?.titolo || '');
  const [categoria, setCategoria] = useState<CategoriaSpesa>(
    initialSpesa?.categoria || 'Affitto Impianti / Pista'
  );
  const [importo, setImporto] = useState<number>(initialSpesa?.importo_mensile || 200);
  const [ricorrente, setRicorrente] = useState<boolean>(
    initialSpesa ? initialSpesa.ricorrente : true
  );
  const [mesiSelezionati, setMesiSelezionati] = useState<string[]>(
    initialSpesa?.mesi || []
  );
  const [note, setNote] = useState(initialSpesa?.note || '');

  // Mesi standard stagione sportiva
  const mesiStagioneDefault = [
    '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'
  ];

  const formatMese = (m: string) => {
    if (!m) return '';
    const [year, month] = m.split('-');
    const mesiNomi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${mesiNomi[idx] || month} ${year}`;
  };

  const toggleMeseSelezionato = (m: string) => {
    if (mesiSelezionati.includes(m)) {
      setMesiSelezionati(mesiSelezionati.filter((item) => item !== m));
    } else {
      setMesiSelezionati([...mesiSelezionati, m]);
    }
  };

  const selezionaTuttiMesi = () => {
    setMesiSelezionati([...mesiStagioneDefault]);
  };

  const deselezionaTuttiMesi = () => {
    setMesiSelezionati([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || importo <= 0) {
      alert('Specificare una descrizione valida e un importo maggiore di zero.');
      return;
    }

    if (!ricorrente && mesiSelezionati.length === 0) {
      alert('Selezionare almeno un mese in cui si verifica la spesa.');
      return;
    }

    onSave(
      {
        titolo: titolo.trim(),
        categoria,
        importo_mensile: importo,
        ricorrente,
        mesi: ricorrente ? [] : mesiSelezionati,
        note: note.trim()
      },
      initialSpesa?.id
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Intestazione e Breadcrumb */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={onBack}
              >
                Previsione & Budget Spese
              </button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {isEditing ? 'Modifica Spesa Previsionale' : 'Nuova Spesa a Budget'}
            </li>
          </ol>
        </nav>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
              <i className="bi bi-receipt text-danger me-2"></i>
              {isEditing ? 'Modifica Voce di Spesa a Budget' : 'Aggiungi Voce di Spesa a Budget'}
            </h2>
            <p className="text-muted small mb-0">
              Pianificazione costi fissi e variabili per la stagione sportiva{' '}
              <strong>{annoAttivo?.anno || '2024/2025'}</strong>
            </p>
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left me-1"></i> Annulla e Torna al Bilancio
          </button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <form onSubmit={handleSubmit}>
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-sliders me-2 text-primary"></i> Dettagli Spesa Previsionale
                </h5>
                <span className={`badge ${CATEGORIA_COLORS[categoria]} px-3 py-2`}>
                  <i className={`bi ${CATEGORIA_ICONS[categoria]} me-1`}></i>
                  {categoria}
                </span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  {/* Titolo / Descrizione */}
                  <div className="col-12">
                    <label className="form-label fw-bold">
                      Descrizione della Voce di Spesa <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg fw-semibold"
                      placeholder="es. Canone Affitto Pista Comunale / Palazzetto dello Sport"
                      value={titolo}
                      onChange={(e) => setTitolo(e.target.value)}
                      required
                    />
                    <div className="form-text small">
                      Inserire una descrizione chiara e identificabile (es. fornitore, canone struttura, materiale).
                    </div>
                  </div>

                  {/* Categoria Spesa */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Categoria di Bilancio <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as CategoriaSpesa)}
                      required
                    >
                      {CATEGORIE_SPESA.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">
                      Utilizzata nei prospetti riepilogativi per il Consiglio Direttivo.
                    </div>
                  </div>

                  {/* Importo Mensile / Occorrenza */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Importo (€) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-bold">€</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control form-control-lg fw-bold text-danger font-monospace"
                        value={importo}
                        onChange={(e) => setImporto(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="form-text small">
                      {ricorrente ? 'Importo calcolato per ogni singolo mese' : 'Importo per ciascun mese selezionato'}
                    </div>
                  </div>

                  <div className="col-12"><hr className="my-2" /></div>

                  {/* Tipologia di Ricorrenza */}
                  <div className="col-12">
                    <label className="form-label fw-bold mb-2">
                      Frequenza di Addebito nella Stagione <span className="text-danger">*</span>
                    </label>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div
                          className={`p-3 border rounded-3 cursor-pointer h-100 ${
                            ricorrente ? 'border-primary bg-primary-subtle' : 'bg-light'
                          }`}
                          onClick={() => setRicorrente(true)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="frequenza"
                              id="freq-ricorrente"
                              checked={ricorrente}
                              onChange={() => setRicorrente(true)}
                            />
                            <label className="form-check-label fw-bold text-dark" htmlFor="freq-ricorrente">
                              Spesa Ricorrente Mensile
                            </label>
                          </div>
                          <p className="small text-muted mb-0 mt-2">
                            La spesa viene computata automaticamente ogni mese della stagione sportiva (da Settembre a Giugno).
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div
                          className={`p-3 border rounded-3 cursor-pointer h-100 ${
                            !ricorrente ? 'border-primary bg-primary-subtle' : 'bg-light'
                          }`}
                          onClick={() => setRicorrente(false)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="frequenza"
                              id="freq-singola"
                              checked={!ricorrente}
                              onChange={() => setRicorrente(false)}
                            />
                            <label className="form-check-label fw-bold text-dark" htmlFor="freq-singola">
                              Mesi Specifici / Una Tantum
                            </label>
                          </div>
                          <p className="small text-muted mb-0 mt-2">
                            Seleziona solo determinati mesi in cui il costo si manifesta (es. assicurazioni a Settembre, kit gara a Ottobre).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selezione Mesi Specifici se non ricorrente */}
                  {!ricorrente && (
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label small fw-bold text-dark mb-0 text-uppercase">
                            Seleziona i Mesi di Applicazione ({mesiSelezionati.length} selezionati):
                          </label>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary py-0 px-2"
                              onClick={selezionaTuttiMesi}
                            >
                              Tutti
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary py-0 px-2"
                              onClick={deselezionaTuttiMesi}
                            >
                              Nessuno
                            </button>
                          </div>
                        </div>

                        <div className="row g-2">
                          {mesiStagioneDefault.map((m) => {
                            const isChecked = mesiSelezionati.includes(m);
                            return (
                              <div key={m} className="col-6 col-sm-4">
                                <div
                                  className={`p-2 border rounded-2 d-flex align-items-center justify-content-between ${
                                    isChecked ? 'bg-white border-primary shadow-xs' : 'bg-white text-muted'
                                  }`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => toggleMeseSelezionato(m)}
                                >
                                  <div className="form-check mb-0">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`chk-${m}`}
                                      checked={isChecked}
                                      onChange={() => toggleMeseSelezionato(m)}
                                    />
                                    <label className="form-check-label small fw-semibold" htmlFor={`chk-${m}`}>
                                      {formatMese(m)}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Note e Dettagli */}
                  <div className="col-12">
                    <label className="form-label fw-bold">Note e Dettagli Fornitore o Convenzione</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="es. Delibera CD n. 4/2024, convenzione oraria stipulata con il Comune, fatturazione trimestrale posticipata..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                    <div className="form-text small">
                      I dettagli appariranno nel fascicolo di bilancio e nelle note di lavoro del Consiglio Direttivo.
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con Azioni */}
              <div className="card-footer bg-light px-4 py-3 d-flex justify-content-between align-items-center">
                <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary fw-bold px-4 py-2 shadow-sm">
                  <i className="bi bi-check-lg me-1"></i>
                  {isEditing ? 'Salva Modifiche Spesa' : 'Inserisci Spesa a Budget'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
