import React, { useState } from 'react';
import { Persona, Tesserato, Anno, Gruppo, GruppoTesserato, Quota } from '../../types';

interface Props {
  persone: Persona[];
  tesserati: Tesserato[];
  anni: Anno[];
  gruppi: Gruppo[];
  gruppiTesserati: GruppoTesserato[];
  quote: Quota[];
  onOpenNuovoTesseramento: () => void;
  onOpenIscrizioneGruppo: (tesseratoId: number) => void;
  onOpenPagamento: (tesseratoId: number) => void;
  onViewQuotes: (tesseratoId: number) => void;
  onPrintDomandaIscrizione?: (tesseratoId: number) => void;
  onPrintRichiestaCertificato?: (tesseratoId: number) => void;
}

export const TesseratiView: React.FC<Props> = ({
  persone,
  tesserati,
  anni,
  gruppi,
  gruppiTesserati,
  quote,
  onOpenNuovoTesseramento,
  onOpenIscrizioneGruppo,
  onOpenPagamento,
  onViewQuotes,
  onPrintDomandaIscrizione,
  onPrintRichiestaCertificato
}) => {
  const annoAttivo = anni.find((a) => a.attivo) || anni[0];
  const [selectedAnnoId, setSelectedAnnoId] = useState<number>(annoAttivo?.id || 1);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = tesserati.filter((t) => {
    if (selectedAnnoId && t.anno_id !== selectedAnnoId) return false;
    if (!search.trim()) return true;

    const p = persone.find((pers) => pers.id === t.persona_id);
    if (!p) return false;

    const s = search.toLowerCase();
    return (
      t.numero_tessera.toLowerCase().includes(s) ||
      p.nome.toLowerCase().includes(s) ||
      p.cognome.toLowerCase().includes(s) ||
      p.codice_fiscale.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const checkCertificato = (dataScadenza: string) => {
    if (!dataScadenza) return { label: 'Mancante', class: 'bg-danger' };
    const today = new Date().toISOString().substring(0, 10);
    if (dataScadenza < today) return { label: 'Scaduto!', class: 'bg-danger' };

    const unMeseDopo = new Date();
    unMeseDopo.setDate(unMeseDopo.getDate() + 30);
    const unMeseStr = unMeseDopo.toISOString().substring(0, 10);

    if (dataScadenza < unMeseStr) return { label: 'In Scadenza', class: 'bg-warning text-dark' };
    return { label: 'Valido', class: 'bg-success' };
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-card-checklist text-success me-2"></i> Registro Tesserati Annuale
          </h2>
          <p className="text-muted small mb-0">
            Tesseramento atleti per anno sportivo, scadenze visite mediche e assegnazione ai gruppi
          </p>
        </div>
        <button className="btn btn-success fw-bold shadow-sm" onClick={onOpenNuovoTesseramento}>
          <i className="bi bi-plus-circle me-2"></i> Nuovo Tesseramento
        </button>
      </div>

      {/* Filtri */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <label className="form-label text-muted small mb-1 fw-bold">Anno Sportivo</label>
              <select
                className="form-select form-select-sm"
                value={selectedAnnoId}
                onChange={(e) => {
                  setSelectedAnnoId(Number(e.target.value));
                  setPage(1);
                }}
              >
                {anni.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.anno} {a.attivo ? '(Corrente)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted small mb-1 fw-bold">Cerca Atleta o Tessera</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome, Cognome, Codice Fiscale, Numero Tessera..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-3 text-end pt-3">
              <span className="text-muted small">
                Trovati <strong>{filtered.length}</strong> tesserati
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Tesserati */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>Numero Tessera</th>
                <th>Atleta</th>
                <th>Data Tesseramento</th>
                <th>Tipo</th>
                <th>Certificato Medico</th>
                <th>Gruppi Assegnati</th>
                <th>Quote Aperte</th>
                <th className="text-end">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    Nessun tesserato trovato per l'anno sportivo selezionato.
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const p = persone.find((pers) => pers.id === t.persona_id);
                  const cert = checkCertificato(t.certificato_medico_scadenza);

                  const assignedGroupIds = gruppiTesserati
                    .filter((gt) => gt.tesserato_id === t.id)
                    .map((gt) => gt.gruppo_id);
                  const userGroups = gruppi.filter((g) => assignedGroupIds.includes(g.id));

                  const userQuotes = quote.filter((q) => q.tesserato_id === t.id);
                  const quoteAperte = userQuotes.filter((q) => q.stato !== 'pagata');
                  const daSaldare = quoteAperte.reduce((acc, q) => acc + (q.importo - (q.importo_pagato || 0)), 0);

                  return (
                    <tr key={t.id}>
                      <td>
                        <strong className="text-primary font-monospace">{t.numero_tessera}</strong>
                        <div><span className="badge bg-success-subtle text-success">{t.stato}</span></div>
                      </td>
                      <td>
                        <strong className="fs-6">{p?.cognome} {p?.nome}</strong>
                        {p?.is_minorenne ? (
                          <div className="small text-warning-emphasis">
                            <i className="bi bi-shield-check me-1"></i>Tutore: {p.tutore_cognome} ({p.tutore_telefono})
                          </div>
                        ) : (
                          <div className="text-muted small">{p?.email || p?.telefono}</div>
                        )}
                      </td>
                      <td>{t.data_tesseramento}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{t.tipo_tesseramento}</span>
                      </td>
                      <td>
                        <div>{t.certificato_medico_scadenza || 'Mancante'}</div>
                        <span className={`badge ${cert.class} small`}>{cert.label}</span>
                      </td>
                      <td>
                        {userGroups.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {userGroups.map((g) => (
                              <span key={g.id} className="badge bg-primary-subtle text-primary border">
                                {g.nome_gruppo}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">Nessun gruppo</span>
                        )}
                      </td>
                      <td>
                        {quoteAperte.length > 0 ? (
                          <div>
                            <span className="badge bg-danger-subtle text-danger fw-bold">
                              {quoteAperte.length} in sospeso
                            </span>
                            <div className="small fw-bold text-danger">€ {daSaldare.toFixed(2)}</div>
                          </div>
                        ) : (
                          <span className="badge bg-success-subtle text-success">Regolare</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {onPrintDomandaIscrizione && (
                            <button
                              className="btn btn-outline-secondary"
                              title="Stampa Domanda di Iscrizione e Tesseramento"
                              onClick={() => onPrintDomandaIscrizione(t.id)}
                            >
                              <i className="bi bi-file-earmark-text text-primary"></i>
                            </button>
                          )}
                          {onPrintRichiestaCertificato && (
                            <button
                              className="btn btn-outline-secondary"
                              title="Stampa Richiesta Certificato Medico"
                              onClick={() => onPrintRichiestaCertificato(t.id)}
                            >
                              <i className="bi bi-file-medical text-danger"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-primary"
                            title="Iscrivi ad un altro gruppo"
                            onClick={() => onOpenIscrizioneGruppo(t.id)}
                          >
                            <i className="bi bi-diagram-3"></i>
                          </button>
                          <button
                            className="btn btn-outline-warning text-dark"
                            title="Incassa Pagamento"
                            onClick={() => onOpenPagamento(t.id)}
                          >
                            <i className="bi bi-cash-coin"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center flex-wrap">
            <span className="text-muted small">
              Pagina <strong>{currentPage}</strong> di <strong>{totalPages}</strong> ({filtered.length} totali)
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                  Precedente
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <li key={num} className={`page-item ${currentPage === num ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(num)}>
                    {num}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                  Successiva
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
