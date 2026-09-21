import React, { useState } from 'react';
import { Persona } from '../../types';

interface Props {
  persone: Persona[];
  onOpenNuovaPersona: () => void;
  onTesseraPersona: (persona: Persona) => void;
}

export const PersoneView: React.FC<Props> = ({
  persone,
  onOpenNuovaPersona,
  onTesseraPersona
}) => {
  const [search, setSearch] = useState('');
  const [filterMinori, setFilterMinori] = useState<'all' | 'minori' | 'maggiori'>('all');
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = persone.filter((p) => {
    if (filterMinori === 'minori' && !p.is_minorenne) return false;
    if (filterMinori === 'maggiori' && p.is_minorenne) return false;

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const tutore = `${p.tutore_cognome || ''} ${p.tutore_nome || ''}`.toLowerCase();
    return (
      p.nome.toLowerCase().includes(s) ||
      p.cognome.toLowerCase().includes(s) ||
      p.codice_fiscale.toLowerCase().includes(s) ||
      p.telefono.includes(s) ||
      p.email.toLowerCase().includes(s) ||
      tutore.includes(s)
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
            <i className="bi bi-people-fill text-primary me-2"></i> Anagrafica Generale Persone
          </h2>
          <p className="text-muted small mb-0">
            Registro generale atleti con gestione specifica dei dati del tutore legale per minorenni
          </p>
        </div>
        <button className="btn btn-primary fw-bold shadow-sm" onClick={onOpenNuovaPersona}>
          <i className="bi bi-person-plus-fill me-2"></i> Nuova Persona
        </button>
      </div>

      {/* Barra Filtri e Ricerca */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cerca per Nome, Cognome, Codice Fiscale o Tutore..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${filterMinori === 'all' ? 'btn-primary active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterMinori('all'); setPage(1); }}
                >
                  Tutti ({persone.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterMinori === 'minori' ? 'btn-warning text-dark active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterMinori('minori'); setPage(1); }}
                >
                  Minorenni ({persone.filter(p => p.is_minorenne).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterMinori === 'maggiori' ? 'btn-secondary active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterMinori('maggiori'); setPage(1); }}
                >
                  Maggiorenni ({persone.filter(p => !p.is_minorenne).length})
                </button>
              </div>
            </div>

            <div className="col-md-3 text-end text-muted small">
              Visualizzati <strong>{filtered.length}</strong> record
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Persone */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>ID</th>
                <th>Nominativo Atleta</th>
                <th>Codice Fiscale</th>
                <th>Nascita / Età</th>
                <th>Stato Minore</th>
                <th>Tutore Legale Esercente</th>
                <th>Contatti</th>
                <th className="text-end">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    Nessuna persona trovata con i filtri correnti.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const birthDate = new Date(p.data_nascita);
                  const eta = new Date().getFullYear() - birthDate.getFullYear();

                  return (
                    <tr key={p.id}>
                      <td><span className="badge bg-light text-dark border">#{p.id}</span></td>
                      <td>
                        <strong className="fs-6">{p.cognome} {p.nome}</strong>
                        {p.citta && <div className="text-muted small">{p.citta} ({p.indirizzo})</div>}
                      </td>
                      <td>
                        <code>{p.codice_fiscale}</code>
                      </td>
                      <td>
                        <div>{p.data_nascita}</div>
                        <small className="text-muted">{eta} anni</small>
                      </td>
                      <td>
                        {p.is_minorenne ? (
                          <span className="badge bg-warning text-dark px-2 py-1">
                            <i className="bi bi-shield-check me-1"></i>Minorenne
                          </span>
                        ) : (
                          <span className="badge bg-secondary px-2 py-1">Maggiorenne</span>
                        )}
                      </td>
                      <td>
                        {p.is_minorenne ? (
                          <div className="small p-2 bg-light rounded border border-warning-subtle">
                            <strong className="text-dark d-block">
                              <i className="bi bi-person-fill me-1"></i>
                              {p.tutore_cognome} {p.tutore_nome} ({p.tutore_relazione || 'Genitore'})
                            </strong>
                            <div className="text-muted">
                              <i className="bi bi-telephone me-1"></i>
                              <a href={`tel:${p.tutore_telefono}`} className="text-decoration-none fw-semibold">
                                {p.tutore_telefono}
                              </a>
                            </div>
                            {p.tutore_email && (
                              <div className="text-muted">
                                <i className="bi bi-envelope me-1"></i>{p.tutore_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td>
                        <div className="small">
                          {p.telefono && <div><i className="bi bi-telephone me-1"></i>{p.telefono}</div>}
                          {p.email && <div><i className="bi bi-envelope me-1"></i>{p.email}</div>}
                        </div>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-success fw-bold"
                          title="Tessera questo atleta"
                          onClick={() => onTesseraPersona(p)}
                        >
                          <i className="bi bi-card-checklist me-1"></i> Tessera
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
    </div>
  );
};
