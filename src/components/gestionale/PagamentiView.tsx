import React, { useState } from 'react';
import { Pagamento, Tesserato, Persona, Quota, Associazione } from '../../types';

interface Props {
  pagamenti: Pagamento[];
  tesserati: Tesserato[];
  persone: Persona[];
  quote: Quota[];
  associazione: Associazione;
  onOpenNuovoPagamento: () => void;
  onOpenStampaUfficiale?: (pagamento: Pagamento) => void;
}

export const PagamentiView: React.FC<Props> = ({
  pagamenti,
  tesserati,
  persone,
  quote,
  associazione,
  onOpenNuovoPagamento,
  onOpenStampaUfficiale
}) => {
  const [filterTipo, setFilterTipo] = useState<'all' | 'quota' | 'extra'>('all');
  const [filterMetodo, setFilterMetodo] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [ricevutaModal, setRicevutaModal] = useState<Pagamento | null>(null);
  const perPage = 8;

  const totaleIncassato = pagamenti.reduce((acc, p) => acc + p.importo, 0);

  const filtered = pagamenti.filter((p) => {
    if (filterTipo === 'quota' && p.quota_id === null) return false;
    if (filterTipo === 'extra' && p.quota_id !== null) return false;

    if (filterMetodo !== 'all' && p.metodo_pagamento !== filterMetodo) return false;

    if (!search.trim()) return true;

    const tess = tesserati.find((t) => t.id === p.tesserato_id);
    const pers = tess ? persone.find((per) => per.id === tess.persona_id) : null;
    const s = search.toLowerCase();

    const nominativo = pers ? `${pers.cognome} ${pers.nome}`.toLowerCase() : '';
    const cf = pers ? pers.codice_fiscale.toLowerCase() : '';

    return (
      p.ricevuta_numero.toLowerCase().includes(s) ||
      p.causale.toLowerCase().includes(s) ||
      nominativo.includes(s) ||
      cf.includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-wallet2 text-success me-2"></i> Registro Pagamenti & Cassa
          </h2>
          <p className="text-muted small mb-0">
            Tracciamento incassi per quote mensili dei corsi e pagamenti extra non riconducibili a quote (divise, visite, eventi)
          </p>
        </div>
        <button className="btn btn-warning text-dark fw-bold shadow-sm" onClick={onOpenNuovoPagamento}>
          <i className="bi bi-cash-coin me-2"></i> Registra Incasso
        </button>
      </div>

      {/* Box Riepilogo */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
            <span className="text-muted small fw-semibold">Totale Generale Incassato</span>
            <h4 className="fw-bold text-success my-1">€ {totaleIncassato.toFixed(2)}</h4>
            <span className="text-muted small">{pagamenti.length} ricevute registrate</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
            <span className="text-muted small fw-semibold">Incassi da Quote Corsi</span>
            <h4 className="fw-bold text-primary my-1">
              € {pagamenti.filter((p) => p.quota_id !== null).reduce((sum, p) => sum + p.importo, 0).toFixed(2)}
            </h4>
            <span className="text-muted small">{pagamenti.filter((p) => p.quota_id !== null).length} pagamenti a saldo rette</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
            <span className="text-muted small fw-semibold">Incassi Extra (Non Quote)</span>
            <h4 className="fw-bold text-dark my-1">
              € {pagamenti.filter((p) => p.quota_id === null).reduce((sum, p) => sum + p.importo, 0).toFixed(2)}
            </h4>
            <span className="text-muted small">{pagamenti.filter((p) => p.quota_id === null).length} entrate libere (kit, visite, ecc.)</span>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cerca per Ricevuta, Atleta, Causale..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="btn-group w-100 btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${filterTipo === 'all' ? 'btn-secondary active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterTipo('all'); setPage(1); }}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  className={`btn ${filterTipo === 'quota' ? 'btn-primary active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterTipo('quota'); setPage(1); }}
                >
                  Relativi a Quote
                </button>
                <button
                  type="button"
                  className={`btn ${filterTipo === 'extra' ? 'btn-dark active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterTipo('extra'); setPage(1); }}
                >
                  Pagamenti Extra / Liberi
                </button>
              </div>
            </div>

            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterMetodo}
                onChange={(e) => {
                  setFilterMetodo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tutti i Metodi</option>
                <option value="contanti">Contanti</option>
                <option value="pos">POS / Carta</option>
                <option value="bonifico">Bonifico</option>
                <option value="satispay">Satispay</option>
              </select>
            </div>

            <div className="col-md-2 text-end text-muted small">
              Trovati: <strong>{filtered.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Pagamenti */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>Ricevuta</th>
                <th>Data & Ora</th>
                <th>Atleta / Tesserato</th>
                <th>Tipologia Incasso</th>
                <th>Causale Pagamento</th>
                <th>Metodo</th>
                <th>Importo</th>
                <th className="text-end">Dettagli</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    Nessun pagamento registrato con i filtri correnti.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const tess = tesserati.find((t) => t.id === p.tesserato_id);
                  const pers = tess ? persone.find((per) => per.id === tess.persona_id) : null;
                  const isQuota = p.quota_id !== null;

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong className="font-monospace text-primary">{p.ricevuta_numero}</strong>
                      </td>
                      <td>
                        <div className="small text-muted">{p.data_pagamento}</div>
                      </td>
                      <td>
                        <strong>{pers?.cognome} {pers?.nome}</strong>
                        {pers?.is_minorenne && (
                          <div className="small text-muted">
                            Tutore: {pers.tutore_cognome} ({pers.tutore_telefono})
                          </div>
                        )}
                      </td>
                      <td>
                        {isQuota ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            <i className="bi bi-calendar-check me-1"></i> Quota Corso
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">
                            <i className="bi bi-bag-plus me-1"></i> Entrata Libera
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="small fw-semibold">{p.causale}</span>
                        {p.note && <div className="text-muted small fst-italic">Note: {p.note}</div>}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border text-uppercase small">
                          {p.metodo_pagamento}
                        </span>
                      </td>
                      <td>
                        <strong className="text-success fs-6">+ € {p.importo.toFixed(2)}</strong>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          title="Visualizza Ricevuta"
                          onClick={() => setRicevutaModal(p)}
                        >
                          <i className="bi bi-receipt me-1"></i> Ricevuta
                        </button>
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

      {/* Modal Ricevuta Cassa */}
      {ricevutaModal && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex={-1} style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-receipt-cutoff me-2"></i> Ricevuta di Pagamento
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setRicevutaModal(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="border border-2 border-dashed p-4 rounded-3 bg-light">
                  <h4 className="fw-bold mb-1 text-primary text-uppercase">{associazione.denominazione}</h4>
                  <div className="text-muted small mb-1">
                    {associazione.indirizzo} &bull; {associazione.cap} {associazione.comune} ({associazione.provincia})
                  </div>
                  <div className="text-muted small mb-3">
                    C.F. <strong>{associazione.codice_fiscale}</strong>
                    {associazione.partita_iva && <span> &bull; P.IVA <strong>{associazione.partita_iva}</strong></span>}
                    <span className="d-block mt-1">Legale Rappresentante: <strong>{associazione.legale_rappresentante}</strong></span>
                  </div>

                  <div className="badge bg-primary fs-6 px-3 py-2 mb-3">
                    Ricevuta N. {ricevutaModal.ricevuta_numero}
                  </div>

                  <div className="text-start small mb-3">
                    <div className="row g-2">
                      <div className="col-6 text-muted">Data incasso:</div>
                      <div className="col-6 fw-bold text-end">{ricevutaModal.data_pagamento}</div>

                      <div className="col-6 text-muted">Atleta / Socio:</div>
                      <div className="col-6 fw-bold text-end">
                        {persone.find(p => p.id === tesserati.find(t => t.id === ricevutaModal.tesserato_id)?.persona_id)?.cognome}{' '}
                        {persone.find(p => p.id === tesserati.find(t => t.id === ricevutaModal.tesserato_id)?.persona_id)?.nome}
                      </div>

                      <div className="col-6 text-muted">Metodo:</div>
                      <div className="col-6 fw-bold text-end text-uppercase">{ricevutaModal.metodo_pagamento}</div>

                      <div className="col-12 border-top pt-2 text-muted">Causale:</div>
                      <div className="col-12 fw-semibold">{ricevutaModal.causale}</div>

                      {ricevutaModal.note && (
                        <>
                          <div className="col-12 text-muted">Note:</div>
                          <div className="col-12 fst-italic">{ricevutaModal.note}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <span className="text-muted small text-uppercase">Importo Ricevuto</span>
                    <h2 className="display-6 fw-bold text-success mb-0">
                      € {ricevutaModal.importo.toFixed(2)}
                    </h2>
                  </div>

                  <div className="mt-3 pt-3 border-top text-end small text-muted">
                    Firma per quietanza: <strong>{associazione.legale_rappresentante}</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light d-flex justify-content-between">
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={() => window.print()}>
                    <i className="bi bi-printer me-1"></i> Stampa Rapida
                  </button>
                  {onOpenStampaUfficiale && (
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        const cur = ricevutaModal;
                        setRicevutaModal(null);
                        onOpenStampaUfficiale(cur);
                      }}
                    >
                      <i className="bi bi-file-earmark-pdf me-1"></i> Modulo A4 Ufficiale
                    </button>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={() => setRicevutaModal(null)}>
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
