import React, { useState, useEffect } from 'react';
import { Tesserato, Persona, Gruppo } from '../../types';

interface Props {
  onBack: () => void;
  tesserati: Tesserato[];
  persone: Persona[];
  gruppi: Gruppo[];
  preselectedTesseratoId?: number | null;
  onSave: (data: {
    tesserato_id: number;
    gruppo_id: number;
    data_iscrizione: string;
    note?: string;
    genera_quote_automatiche: boolean;
  }) => void;
  isKioskMode?: boolean;
}

export const NuovaIscrizioneGruppoPage: React.FC<Props> = ({
  onBack,
  tesserati,
  persone,
  gruppi,
  preselectedTesseratoId,
  onSave,
  isKioskMode = false
}) => {
  const [tesseratoId, setTesseratoId] = useState<number>(preselectedTesseratoId || 0);
  const [gruppoId, setGruppoId] = useState<number>(gruppi[0]?.id || 0);
  const [dataIscrizione, setDataIscrizione] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [note, setNote] = useState('');
  const [generaQuote, setGeneraQuote] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (preselectedTesseratoId) {
      setTesseratoId(preselectedTesseratoId);
    } else if (tesserati.length > 0 && !tesseratoId) {
      setTesseratoId(tesserati[0].id);
    }
  }, [preselectedTesseratoId, tesserati]);

  const selectedTesserato = tesserati.find((t) => t.id === tesseratoId);
  const selectedPersona = selectedTesserato
    ? persone.find((p) => p.id === selectedTesserato.persona_id)
    : null;
  const selectedGruppo = gruppi.find((g) => g.id === gruppoId);

  const filteredTesserati = tesserati.filter((t) => {
    const p = persone.find((pers) => pers.id === t.persona_id);
    if (!p) return false;
    const text = `${p.cognome} ${p.nome} ${t.numero_tessera}`.toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!tesseratoId || !gruppoId) {
      alert('Seleziona sia il tesserato che il gruppo.');
      return;
    }

    onSave({
      tesserato_id: tesseratoId,
      gruppo_id: gruppoId,
      data_iscrizione: dataIscrizione,
      note: note.trim(),
      genera_quote_automatiche: generaQuote
    });

    onBack();
  };

  return (
    <div className="container-fluid py-4 max-w-5xl mx-auto">
      {/* Intestazione */}
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
                  <i className="bi bi-diagram-3 me-1"></i> Corsi & Gruppi
                </button>
              </li>
              <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                Iscrizione Atleta a Corso
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center text-dark">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={onBack}
              title="Torna all'elenco"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <span>Iscrizione Atleta a Gruppo di Pattinaggio</span>
          </h1>
          <p className="text-muted small mb-0 ms-md-5 ps-md-2">
            Inserisci l'atleta nel gruppo prescelto e genera automaticamente il piano quote mensili.
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
            onClick={() => handleSubmit()}
          >
            <i className="bi bi-check-lg me-1"></i> Conferma Iscrizione e Torna alla Lista
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-person-fill text-primary me-2 fs-5"></i> 1. Seleziona Atleta Tesserato
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Cerca atleta:</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per nominativo o tessera..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchFilter('')}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Atleta Tesserato *</label>
                  <select
                    className="form-select form-select-lg"
                    value={tesseratoId}
                    onChange={(e) => setTesseratoId(Number(e.target.value))}
                    required
                  >
                    {filteredTesserati.map((t) => {
                      const p = persone.find((pers) => pers.id === t.persona_id);
                      return (
                        <option key={t.id} value={t.id}>
                          {p?.cognome} {p?.nome} ({t.numero_tessera})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedPersona && (
                  <div className="p-3 bg-light rounded-3 border border-secondary-subtle">
                    <h6 className="fw-bold mb-1 text-dark">
                      {selectedPersona.cognome} {selectedPersona.nome}
                    </h6>
                    <div className="small text-muted mb-1">
                      Tessera: <code>{selectedTesserato?.numero_tessera}</code> &bull; Tipo: {selectedTesserato?.tipo_tesseramento}
                    </div>
                    <div className="small text-muted">
                      Data Nascita: {selectedPersona.data_nascita} ({selectedPersona.is_minorenne ? 'Minorenne' : 'Maggiorenne'})
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-calendar-check text-primary me-2 fs-5"></i> 2. Dettagli Iscrizione
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Data di Iscrizione *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dataIscrizione}
                      onChange={(e) => setDataIscrizione(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Note Aggiuntive</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. Iscrizione di metà quadrimestre, orari concordati..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="bi bi-diagram-3-fill text-success me-2 fs-5"></i> 3. Seleziona Gruppo / Corso
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Gruppo / Corso di Destinazione *</label>
                  <select
                    className="form-select form-select-lg"
                    value={gruppoId}
                    onChange={(e) => setGruppoId(Number(e.target.value))}
                    required
                  >
                    {gruppi.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome_gruppo} ({g.categoria}) &bull; € {g.quota_mensile.toFixed(2)}/mese
                      </option>
                    ))}
                  </select>
                </div>

                {selectedGruppo && (
                  <div className="p-3 bg-light rounded-3 border border-secondary-subtle mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 text-dark">{selectedGruppo.nome_gruppo}</h6>
                      <span className="badge bg-success fs-6">€ {selectedGruppo.quota_mensile.toFixed(2)} / mese</span>
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Disciplina:</strong> {selectedGruppo.categoria}
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Periodo:</strong> dal {selectedGruppo.data_inizio} al {selectedGruppo.data_fine}
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Scadenza mensile:</strong> ogni giorno {selectedGruppo.giorno_scadenza_mensile} del mese
                    </div>
                    {selectedGruppo.istruttore && (
                      <div className="small text-muted">
                        <strong>Istruttore:</strong> {selectedGruppo.istruttore}
                      </div>
                    )}
                  </div>
                )}

                {/* Opzione generazione automatica */}
                <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25 mb-3">
                  <div className="form-check form-switch mb-1">
                    <input
                      className="form-check-input cursor-pointer"
                      type="checkbox"
                      id="switchGenera"
                      checked={generaQuote}
                      onChange={(e) => setGeneraQuote(e.target.checked)}
                    />
                    <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="switchGenera">
                      Genera automaticamente tutte le quote mensili
                    </label>
                  </div>
                  <small className="text-muted d-block ms-4">
                    Verrà creata una scadenza mensile di € {selectedGruppo ? selectedGruppo.quota_mensile.toFixed(2) : '50.00'} per ciascun mese compreso tra la data di iscrizione e la fine del corso.
                  </small>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold py-2 shadow-sm"
                  >
                    <i className="bi bi-check-circle me-1"></i> Conferma Iscrizione e Torna alla Lista
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onBack}
                  >
                    ← Annulla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
