import React, { useState } from 'react';
import { Quota, Tesserato, Persona, Gruppo } from '../../types';
import { isQuotaScaduta, getGiorniRitardo } from '../../utils/storage';

interface Props {
  quote: Quota[];
  tesserati: Tesserato[];
  persone: Persona[];
  gruppi: Gruppo[];
  initialFilter?: string;
  onOpenPagamento: (tesseratoId: number, quotaId: number) => void;
}

export const QuoteView: React.FC<Props> = ({
  quote,
  tesserati,
  persone,
  gruppi,
  initialFilter,
  onOpenPagamento
}) => {
  const [soloScadute, setSoloScadute] = useState<boolean>(initialFilter === 'scadute');
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('all');
  const [filterGruppo, setFilterGruppo] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const quoteScaduteCount = quote.filter(isQuotaScaduta).length;
  const totaleScaduto = quote
    .filter(isQuotaScaduta)
    .reduce((acc, q) => acc + (q.importo - (q.importo_pagato || 0)), 0);

  const filtered = quote.filter((q) => {
    const isScaduta = isQuotaScaduta(q);

    if (soloScadute && !isScaduta) return false;

    if (filterStato !== 'all' && q.stato !== filterStato) return false;

    if (filterGruppo !== 'all') {
      if (filterGruppo === 'nessuno' && q.gruppo_id !== null) return false;
      if (filterGruppo !== 'nessuno' && q.gruppo_id !== Number(filterGruppo)) return false;
    }

    if (!search.trim()) return true;

    const tess = tesserati.find((t) => t.id === q.tesserato_id);
    const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
    const s = search.toLowerCase();

    const nominativo = pers ? `${pers.cognome} ${pers.nome}`.toLowerCase() : '';
    const cf = pers ? pers.codice_fiscale.toLowerCase() : '';
    const tutore = pers ? `${pers.tutore_cognome || ''} ${pers.tutore_nome || ''}`.toLowerCase() : '';

    return (
      q.causale.toLowerCase().includes(s) ||
      nominativo.includes(s) ||
      cf.includes(s) ||
      tutore.includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-cash-stack text-warning me-2"></i> Gestione Quote & Scadenziario
          </h2>
          <p className="text-muted small mb-0">
            Monitoraggio rate mensili calcolate per i gruppi e rilevamento quote scadute non saldate
          </p>
        </div>

        {/* Toggle Esclusivo Quote Scadute Non Pagate */}
        <button
          className={`btn ${soloScadute ? 'btn-danger shadow fw-bold' : 'btn-outline-danger'} d-flex align-items-center gap-2`}
          onClick={() => {
            setSoloScadute(!soloScadute);
            setPage(1);
          }}
        >
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>Solo Scadute Non Pagate ({quoteScaduteCount})</span>
        </button>
      </div>

      {/* Banner Allerta se filtro quote scadute è attivo */}
      {soloScadute && (
        <div className="alert alert-danger shadow-sm border-danger d-flex justify-content-between align-items-center mb-4 p-3 rounded-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-shield-exclamation fs-3 me-3 text-danger"></i>
            <div>
              <strong>Filtro Attivo: Visualizzazione Insoluti e Quote Scadute!</strong>
              <div className="small">
                Totale credito insoluto da incassare: <strong>€ {totaleScaduto.toFixed(2)}</strong>. Per gli atleti minorenni è mostrato il recapito telefonico del tutore legale per il sollecito.
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-outline-dark" onClick={() => setSoloScadute(false)}>
            Mostra Tutte le Quote
          </button>
        </div>
      )}

      {/* Filtri & Ricerca */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cerca per Atleta, Causale, Tutore..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterStato}
                onChange={(e) => {
                  setFilterStato(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tutti gli Stati</option>
                <option value="da_pagare">Da Pagare (Aperte)</option>
                <option value="parziale">Pagamento Parziale</option>
                <option value="pagata">Saldate / Pagate</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterGruppo}
                onChange={(e) => {
                  setFilterGruppo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tutti i Gruppi</option>
                {gruppi.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome_gruppo}
                  </option>
                ))}
                <option value="nessuno">Quote Straordinarie / No Gruppo</option>
              </select>
            </div>

            <div className="col-md-2 text-end text-muted small">
              Record: <strong>{filtered.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Quote */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>Scadenza</th>
                <th>Stato & Ritardo</th>
                <th>Atleta Tesserato</th>
                <th>Gruppo / Corso</th>
                <th>Causale Quota</th>
                <th>Importo</th>
                <th>Saldato</th>
                <th>Residuo</th>
                <th className="text-end">Azione</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    Nessuna quota trovata con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                paginated.map((q) => {
                  const tess = tesserati.find((t) => t.id === q.tesserato_id);
                  const pers = tess ? persone.find((p) => p.id === tess.persona_id) : null;
                  const gruppo = gruppi.find((g) => g.id === q.gruppo_id);

                  const isScaduta = isQuotaScaduta(q);
                  const giorniRitardo = getGiorniRitardo(q.data_scadenza);
                  const residuo = q.importo - (q.importo_pagato || 0);

                  return (
                    <tr key={q.id} className={isScaduta ? 'table-danger bg-opacity-25' : ''}>
                      <td>
                        <strong className={isScaduta ? 'text-danger' : 'text-dark'}>
                          {q.data_scadenza}
                        </strong>
                      </td>
                      <td>
                        {isScaduta ? (
                          <span className="badge bg-danger">
                            <i className="bi bi-clock-history me-1"></i>
                            Scaduta da {giorniRitardo} gg!
                          </span>
                        ) : q.stato === 'pagata' ? (
                          <span className="badge bg-success">Saldata</span>
                        ) : q.stato === 'parziale' ? (
                          <span className="badge bg-warning text-dark">Parziale</span>
                        ) : (
                          <span className="badge bg-secondary">In Scadenza</span>
                        )}
                      </td>
                      <td>
                        <strong>{pers?.cognome} {pers?.nome}</strong>
                        {pers?.is_minorenne ? (
                          <div className="small text-muted">
                            <i className="bi bi-shield me-1"></i>
                            Tutore: <strong>{pers.tutore_cognome}</strong> (<a href={`tel:${pers.tutore_telefono}`} className="text-decoration-none">{pers.tutore_telefono}</a>)
                          </div>
                        ) : (
                          <div className="small text-muted">{tess?.numero_tessera}</div>
                        )}
                      </td>
                      <td>
                        <span className="small text-muted">{gruppo?.nome_gruppo || 'Quota Libera'}</span>
                      </td>
                      <td>
                        <span className="small fw-semibold">{q.causale}</span>
                      </td>
                      <td>
                        <span>€ {q.importo.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="text-success">€ {(q.importo_pagato || 0).toFixed(2)}</span>
                      </td>
                      <td>
                        <strong className={residuo > 0 ? (isScaduta ? 'text-danger fs-6' : 'text-primary') : 'text-muted'}>
                          € {residuo.toFixed(2)}
                        </strong>
                      </td>
                      <td className="text-end">
                        {residuo > 0 ? (
                          <button
                            className="btn btn-sm btn-success fw-bold"
                            onClick={() => onOpenPagamento(q.tesserato_id, q.id)}
                            title="Registra incasso per questa quota"
                          >
                            <i className="bi bi-cash me-1"></i> Salda
                          </button>
                        ) : (
                          <span className="text-muted small">
                            <i className="bi bi-check-all text-success fs-5"></i>
                          </span>
                        )}
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
              Pagina <strong>{currentPage}</strong> di <strong>{totalPages}</strong> ({filtered.length} quote)
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
