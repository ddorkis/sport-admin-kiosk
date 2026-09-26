import React, { useState } from 'react';
import { Persona, Tesserato, Pagamento, Quota } from '../../types';
import { PrivacyGdprModal } from '../modals/PrivacyGdprModal';

interface Props {
  persone: Persona[];
  tesserati: Tesserato[];
  pagamenti: Pagamento[];
  quote: Quota[];
  onOpenNuovaPersona: () => void;
  onTesseraPersona: (persona: Persona) => void;
  onModificaPersona: (persona: Persona) => void;
  onDeletePermanent: (personaId: number) => void;
  onToggleArchive: (personaId: number, archive: boolean) => void;
  onAnonymizeGdpr: (personaId: number) => void;
}

export const PersoneView: React.FC<Props> = ({
  persone,
  tesserati,
  pagamenti,
  quote,
  onOpenNuovaPersona,
  onTesseraPersona,
  onModificaPersona,
  onDeletePermanent,
  onToggleArchive,
  onAnonymizeGdpr
}) => {
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<'attivi' | 'minori' | 'maggiori' | 'archiviati' | 'tutti'>('attivi');
  const [privacyModalPersona, setPrivacyModalPersona] = useState<Persona | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 6;

  const countArchiviati = persone.filter((p) => p.attivo === false).length;
  const countAnonimizzati = persone.filter((p) => p.anonimizzato_gdpr === true).length;

  const filtered = persone.filter((p) => {
    const isArchived = p.attivo === false;

    if (filterStato === 'attivi' && isArchived) return false;
    if (filterStato === 'minori' && (!p.is_minorenne || isArchived)) return false;
    if (filterStato === 'maggiori' && (p.is_minorenne || isArchived)) return false;
    if (filterStato === 'archiviati' && !isArchived) return false;

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const tutore = `${p.tutore_cognome || ''} ${p.tutore_nome || ''}`.toLowerCase();
    return (
      p.nome.toLowerCase().includes(s) ||
      p.cognome.toLowerCase().includes(s) ||
      p.codice_fiscale.toLowerCase().includes(s) ||
      (p.telefono && p.telefono.includes(s)) ||
      (p.email && p.email.toLowerCase().includes(s)) ||
      tutore.includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="container-fluid py-4">
      {/* Intestazione */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center">
            <i className="bi bi-people-fill text-primary me-2"></i> Anagrafica Generale Persone
          </h2>
          <p className="text-muted small mb-0">
            Registro generale atleti, gestione minorenni con tutori legali e conformità GDPR / Diritto all'Oblio
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

            <div className="col-md-7">
              <div className="btn-group w-100 flex-wrap" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${filterStato === 'attivi' ? 'btn-primary active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterStato('attivi'); setPage(1); }}
                >
                  Soci Attivi ({persone.filter(p => p.attivo !== false).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterStato === 'minori' ? 'btn-warning text-dark active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterStato('minori'); setPage(1); }}
                >
                  Minorenni ({persone.filter(p => p.is_minorenne && p.attivo !== false).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterStato === 'maggiori' ? 'btn-secondary active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterStato('maggiori'); setPage(1); }}
                >
                  Maggiorenni ({persone.filter(p => !p.is_minorenne && p.attivo !== false).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterStato === 'archiviati' ? 'btn-dark active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterStato('archiviati'); setPage(1); }}
                  title="Persone archiviate o anonimizzate a norma GDPR"
                >
                  <i className="bi bi-archive me-1"></i> Archiviati / GDPR ({countArchiviati})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterStato === 'tutti' ? 'btn-outline-dark active fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterStato('tutti'); setPage(1); }}
                >
                  Tutti ({persone.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Persone */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Atleta / Socio</th>
                <th>Codice Fiscale</th>
                <th>Data Nascita</th>
                <th>Tipologia</th>
                <th>Esercente Tutela (Minorenni)</th>
                <th>Contatti</th>
                <th className="text-end" style={{ width: '220px' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    Nessuna anagrafica trovata con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const isArchived = p.attivo === false;
                  const isAnonymized = p.anonimizzato_gdpr === true;

                  return (
                    <tr key={p.id} className={isArchived ? 'table-light opacity-75' : ''}>
                      <td>
                        <span className="badge bg-light text-secondary border">#{p.id}</span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">
                          {p.cognome} {p.nome}
                          {isAnonymized && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle ms-2 small">
                              <i className="bi bi-shield-slash me-1"></i>GDPR
                            </span>
                          )}
                          {isArchived && !isAnonymized && (
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle ms-2 small">
                              <i className="bi bi-archive me-1"></i>Archiviato
                            </span>
                          )}
                        </div>
                        {p.citta && <div className="small text-muted">{p.citta}</div>}
                      </td>
                      <td>
                        <code className="text-dark bg-light px-2 py-1 rounded small">
                          {p.codice_fiscale}
                        </code>
                      </td>
                      <td>
                        <span className="small">{p.data_nascita}</span>
                      </td>
                      <td>
                        {p.is_minorenne ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                            <i className="bi bi-shield-check me-1"></i>Minorenne
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">
                            Maggiorenne
                          </span>
                        )}
                      </td>
                      <td>
                        {p.is_minorenne ? (
                          <div className="small">
                            <div className="fw-semibold text-dark">
                              {p.tutore_cognome} {p.tutore_nome}
                              <span className="badge bg-light text-secondary border ms-1">
                                {p.tutore_relazione || 'Genitore'}
                              </span>
                            </div>
                            {p.tutore_telefono && (
                              <div className="text-muted">
                                <i className="bi bi-telephone me-1"></i>{p.tutore_telefono}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td>
                        <div className="small">
                          {p.telefono && <div><i className="bi bi-telephone me-1 text-muted"></i>{p.telefono}</div>}
                          {p.email && <div><i className="bi bi-envelope me-1 text-muted"></i>{p.email}</div>}
                        </div>
                      </td>
                      <td className="text-end text-nowrap">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="Modifica anagrafica, recapiti e tutore"
                            onClick={() => onModificaPersona(p)}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Modifica
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-success fw-semibold"
                            title="Tessera questo atleta"
                            onClick={() => onTesseraPersona(p)}
                            disabled={isArchived}
                          >
                            <i className="bi bi-card-checklist me-1"></i> Tessera
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Gestione Privacy, Archiviazione o Eliminazione GDPR"
                            onClick={() => setPrivacyModalPersona(p)}
                          >
                            <i className="bi bi-shield-lock"></i>
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

      {/* Modal Privacy & GDPR */}
      <PrivacyGdprModal
        isOpen={Boolean(privacyModalPersona)}
        onClose={() => setPrivacyModalPersona(null)}
        persona={privacyModalPersona}
        tesserati={tesserati}
        pagamenti={pagamenti}
        quote={quote}
        onDeletePermanent={onDeletePermanent}
        onToggleArchive={onToggleArchive}
        onAnonymizeGdpr={onAnonymizeGdpr}
      />
    </div>
  );
};
