import React from 'react';
import { Associazione, Persona, Tesserato, Pagamento, Anno, Gruppo } from '../../types';

export type TipoDocumentoStampa = 'ricevuta' | 'domanda_iscrizione' | 'richiesta_certificato';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipoDocumento: TipoDocumentoStampa;
  associazione: Associazione;
  persona?: Persona;
  tesserato?: Tesserato;
  pagamento?: Pagamento;
  annoAttivo?: Anno;
  gruppi?: Gruppo[];
}

export const StampaDocumentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tipoDocumento,
  associazione,
  persona,
  tesserato,
  pagamento,
  annoAttivo,
  gruppi = []
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const dataOggi = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getTitoloModal = () => {
    switch (tipoDocumento) {
      case 'ricevuta':
        return `Ricevuta di Pagamento ${pagamento?.ricevuta_numero || ''}`;
      case 'domanda_iscrizione':
        return `Domanda di Iscrizione - ${persona ? `${persona.cognome} ${persona.nome}` : ''}`;
      case 'richiesta_certificato':
        return `Richiesta Certificato Medico - ${persona ? `${persona.cognome} ${persona.nome}` : ''}`;
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Header del modal (nascosto in stampa) */}
          <div className="modal-header bg-dark text-white d-print-none py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-printer-fill text-warning fs-5"></i>
              <h5 className="modal-title fw-bold mb-0">{getTitoloModal()}</h5>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm text-dark fw-bold d-flex align-items-center gap-2 px-3 shadow-sm"
                onClick={handlePrint}
              >
                <i className="bi bi-printer fs-6"></i>
                Stampa / Salva in PDF
              </button>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Chiudi"
              ></button>
            </div>
          </div>

          {/* Corpo stampabile */}
          <div className="modal-body p-4 p-md-5 bg-light printable-document-container">
            {/* FOGLIO A4 STILIZZATO */}
            <div
              className="bg-white p-4 p-md-5 mx-auto rounded shadow-sm border printable-paper"
              style={{
                maxWidth: '820px',
                minHeight: '1050px',
                color: '#212529',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* CARTA INTESTATA ASSOCIAZIONE SPORTIVA */}
              <div className="border-bottom pb-4 mb-4">
                <div className="row align-items-center">
                  <div className="col-8">
                    <h3 className="fw-bold text-primary mb-1 text-uppercase" style={{ letterSpacing: '0.02em' }}>
                      {associazione.denominazione || 'Associazione Sportiva Dilettantistica'}
                    </h3>
                    <div className="text-muted small lh-sm">
                      <div>
                        <i className="bi bi-geo-alt me-1"></i>
                        {associazione.indirizzo}, {associazione.cap} {associazione.comune} ({associazione.provincia})
                      </div>
                      <div className="mt-1">
                        <strong>C.F.:</strong> {associazione.codice_fiscale}
                        {associazione.partita_iva && (
                          <span className="ms-3">
                            <strong>P.IVA:</strong> {associazione.partita_iva}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <strong>Legale Rappresentante:</strong> {associazione.legale_rappresentante}
                      </div>
                      {(associazione.telefono || associazione.email) && (
                        <div className="mt-1">
                          {associazione.telefono && <span className="me-3"><strong>Tel:</strong> {associazione.telefono}</span>}
                          {associazione.email && <span><strong>Email:</strong> {associazione.email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="p-2 border rounded bg-light d-inline-block text-center" style={{ minWidth: '160px' }}>
                      <i className="bi bi-trophy-fill text-warning fs-3 d-block mb-1"></i>
                      <small className="fw-bold text-uppercase d-block" style={{ fontSize: '0.75rem' }}>
                        {associazione.codice_affiliazione || 'Affiliata CONI / EPS'}
                      </small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Anno Sportivo {annoAttivo ? annoAttivo.anno : 'In Corso'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENUTO 1: RICEVUTA DI PAGAMENTO */}
              {tipoDocumento === 'ricevuta' && pagamento && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <span className="badge bg-primary fs-6 px-3 py-2 text-uppercase">
                        Ricevuta di Incasso non Fiscale
                      </span>
                      <div className="text-muted small mt-1">
                        Operazione fuori campo IVA ai sensi dell'art. 4 DPR 633/72 e s.m.i.
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fs-5 fw-bold font-monospace text-primary">
                        N. {pagamento.ricevuta_numero}
                      </div>
                      <div className="small text-muted">Data: {pagamento.data_pagamento}</div>
                    </div>
                  </div>

                  {/* Dati Pagatore / Tesserato */}
                  <div className="card border p-3 mb-4 bg-light">
                    <div className="row g-2 small">
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Ricevuto da / Atleta Tesserato:</strong>
                        <div className="fs-6 fw-bold">
                          {persona ? `${persona.cognome} ${persona.nome}` : 'Socio Tesserato'}
                        </div>
                        {persona && (
                          <div className="text-muted">
                            C.F.: <strong>{persona.codice_fiscale}</strong>
                          </div>
                        )}
                        {tesserato && (
                          <div className="text-muted">
                            Tessera N.: <strong>{tesserato.numero_tessera}</strong>
                          </div>
                        )}
                      </div>

                      <div className="col-sm-6">
                        {persona?.is_minorenne && persona.tutore_nome && (
                          <div>
                            <strong className="text-muted d-block">Esercente la potestà genitoriale / Tutore:</strong>
                            <div className="fw-bold">
                              {persona.tutore_cognome} {persona.tutore_nome}
                            </div>
                            {persona.tutore_cf && (
                              <div className="text-muted">C.F. Tutore: {persona.tutore_cf}</div>
                            )}
                            <div className="text-muted">Grado: {persona.tutore_relazione || 'Genitore'}</div>
                          </div>
                        )}
                        <div className="mt-2">
                          <span className="text-muted">Metodo di Pagamento: </span>
                          <strong className="text-uppercase">{pagamento.metodo_pagamento}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dettaglio Causale e Importo */}
                  <table className="table table-bordered mb-4">
                    <thead className="table-light">
                      <tr>
                        <th>Descrizione / Causale di Pagamento</th>
                        <th className="text-end" style={{ width: '160px' }}>Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3">
                          <strong>{pagamento.causale}</strong>
                          {pagamento.note && (
                            <div className="small text-muted fst-italic mt-1">Note: {pagamento.note}</div>
                          )}
                          <div className="small text-muted mt-1">
                            Quota di partecipazione alle attività istituzionali / sportive sociali.
                          </div>
                        </td>
                        <td className="text-end py-3 fs-5 fw-bold text-success">
                          € {pagamento.importo.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="table-light">
                        <th className="text-end">TOTALE INCASSATO:</th>
                        <th className="text-end fs-4 fw-bold text-primary">
                          € {pagamento.importo.toFixed(2)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Quietanza liberatoria e firme */}
                  <div className="mt-5 pt-4 border-top">
                    <div className="row g-4">
                      <div className="col-6">
                        <small className="text-muted d-block">Luogo e Data:</small>
                        <div className="fw-semibold">{associazione.comune}, {pagamento.data_pagamento}</div>
                        <div className="small text-muted mt-3">
                          Timbro dell'Associazione:
                        </div>
                        <div
                          className="border border-dashed rounded p-3 text-center text-muted small mt-1"
                          style={{ height: '70px' }}
                        >
                          [ Spazio Timbro {associazione.denominazione} ]
                        </div>
                      </div>

                      <div className="col-6 text-end">
                        <small className="text-muted d-block">Per l'Associazione:</small>
                        <div className="fw-bold">{associazione.legale_rappresentante}</div>
                        <div className="small text-muted">(Legale Rappresentante / Ricevente)</div>
                        <div className="mt-4 pt-3 border-bottom d-inline-block" style={{ width: '220px' }}></div>
                        <div className="small text-muted">Firma per quietanza</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENUTO 2: DOMANDA DI ISCRIZIONE / AMMISSIONE A SOCIO */}
              {tipoDocumento === 'domanda_iscrizione' && persona && (
                <div>
                  <div className="text-center mb-4">
                    <h4 className="fw-bold text-uppercase mb-1">
                      Domanda di Ammissione a Socio e Tesseramento
                    </h4>
                    <span className="badge bg-primary px-3 py-1">
                      Anno Sportivo {annoAttivo ? annoAttivo.anno : '2024/2025'}
                    </span>
                  </div>

                  <p className="small mb-3">
                    Al Consiglio Direttivo e al Legale Rappresentante dell'Associazione Sportiva Dilettantistica{' '}
                    <strong>{associazione.denominazione}</strong>:
                  </p>

                  {/* Dati richiedente / Atleta */}
                  <div className="border rounded p-3 mb-3 bg-light">
                    <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                      1. Dati Anagrafici dell'Atleta / Richiedente
                    </h6>
                    <div className="row g-2 small">
                      <div className="col-md-6">
                        <strong>Cognome e Nome:</strong> {persona.cognome} {persona.nome}
                      </div>
                      <div className="col-md-6">
                        <strong>Codice Fiscale:</strong> <span className="font-monospace">{persona.codice_fiscale}</span>
                      </div>
                      <div className="col-md-6">
                        <strong>Nato/a a:</strong> {persona.luogo_nascita} il{' '}
                        {new Date(persona.data_nascita).toLocaleDateString('it-IT')}
                      </div>
                      <div className="col-md-6">
                        <strong>Residente in:</strong> {persona.indirizzo}, {persona.citta}
                      </div>
                      <div className="col-md-6">
                        <strong>Recapito Telefonico:</strong> {persona.telefono || 'Non specificato'}
                      </div>
                      <div className="col-md-6">
                        <strong>Email:</strong> {persona.email || 'Non specificata'}
                      </div>
                      {tesserato && (
                        <div className="col-12 mt-1">
                          <strong>Tesseramento assegnato:</strong> Tessera n. <code>{tesserato.numero_tessera}</code> ({tesserato.tipo_tesseramento})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Se Minorenne: Dati Tutore */}
                  {persona.is_minorenne && (
                    <div className="border rounded p-3 mb-3 bg-light">
                      <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                        2. Dati del Genitore o Esercente la Responsabilità Genitoriale (per atleta minorenne)
                      </h6>
                      <div className="row g-2 small">
                        <div className="col-md-6">
                          <strong>Cognome e Nome Genitore/Tutore:</strong> {persona.tutore_cognome || '—'} {persona.tutore_nome || '—'}
                        </div>
                        <div className="col-md-6">
                          <strong>Codice Fiscale Tutore:</strong> <span className="font-monospace">{persona.tutore_cf || '—'}</span>
                        </div>
                        <div className="col-md-6">
                          <strong>Grado di Parentela:</strong> {persona.tutore_relazione || 'Genitore'}
                        </div>
                        <div className="col-md-6">
                          <strong>Telefono Tutore:</strong> {persona.tutore_telefono || '—'}
                        </div>
                        {persona.tutore_email && (
                          <div className="col-12">
                            <strong>Email Tutore:</strong> {persona.tutore_email}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Corsi e Gruppi Istituzionali */}
                  {gruppi.length > 0 && (
                    <div className="border rounded p-3 mb-3">
                      <h6 className="fw-bold text-primary mb-1">3. Gruppo / Disciplina Sportiva</h6>
                      <div className="small">
                        Attività richiesta:{' '}
                        <strong>{gruppi.map((g) => g.nome_gruppo).join(', ')}</strong>
                      </div>
                    </div>
                  )}

                  {/* Dichiarazioni statutarie e privacy */}
                  <div className="small text-muted mb-4 border p-3 rounded">
                    <p className="mb-2">
                      Il sottoscritto dichiara di aver preso visione dello <strong>Statuto Sociale</strong> e dei{' '}
                      <strong>Regolamenti Interni</strong> dell'Associazione <strong>{associazione.denominazione}</strong> (C.F.{' '}
                      {associazione.codice_fiscale}), di accettarli incondizionatamente e di impegnarsi al versamento delle quote sociali e dei corrispettivi specifici approvati dal Consiglio Direttivo presieduto dal Legale Rappresentante <strong>{associazione.legale_rappresentante}</strong>.
                    </p>
                    <p className="mb-0">
                      <strong>Consenso Privacy (Reg. UE 2016/679 - GDPR):</strong> Si autorizza il trattamento dei dati personali ai fini dell'adempimento degli scopi istituzionali, assicurativi e sportivi dell'associazione.
                    </p>
                  </div>

                  {/* Firme */}
                  <div className="row g-4 pt-2">
                    <div className="col-6">
                      <div className="small text-muted">Luogo e Data:</div>
                      <div className="fw-bold">{associazione.comune}, {dataOggi}</div>
                      <div className="mt-4 pt-3 border-bottom" style={{ width: '220px' }}></div>
                      <div className="small text-muted">
                        Firma del Richiedente {persona.is_minorenne ? '/ Esercente potestà' : ''}
                      </div>
                    </div>

                    <div className="col-6 text-end">
                      <div className="small text-muted">Per Accettazione del Consiglio Direttivo:</div>
                      <div className="fw-bold">{associazione.legale_rappresentante}</div>
                      <div className="small text-muted">Il Legale Rappresentante</div>
                      <div className="mt-4 pt-3 border-bottom d-inline-block" style={{ width: '220px' }}></div>
                      <div className="small text-muted">Timbro e Firma Presidente</div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENUTO 3: RICHIESTA CERTIFICATO MEDICO */}
              {tipoDocumento === 'richiesta_certificato' && persona && (
                <div>
                  <div className="row mb-4">
                    <div className="col-7">
                      <div className="small text-muted">Protocollo Richiesta N.: <strong>CERT-{new Date().getFullYear()}-{persona.id}</strong></div>
                      <div className="small text-muted">Data di emissione: <strong>{dataOggi}</strong></div>
                    </div>
                    <div className="col-5 text-end">
                      <div className="border p-2 rounded bg-light text-start small">
                        <strong>Spett.le Medico:</strong>
                        <div>Al Medico di Medicina Generale /</div>
                        <div>Al Pediatra di Libera Scelta /</div>
                        <div>Al Medico Specialista in Medicina dello Sport</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center my-4">
                    <h4 className="fw-bold text-uppercase border-bottom pb-2">
                      Richiesta di Certificato Medico per Attività Sportiva
                    </h4>
                    <span className="badge bg-secondary px-3 py-1">
                      Ai sensi del D.M. 24/04/2013 e s.m.i. (Attività Sportiva Non Agonistica)
                    </span>
                  </div>

                  <div className="my-4 small lh-lg">
                    <p>
                      La scrivente <strong>{associazione.denominazione}</strong>, con sede legale in{' '}
                      <strong>{associazione.indirizzo} - {associazione.cap} {associazione.comune} ({associazione.provincia})</strong>,
                      Codice Fiscale <strong>{associazione.codice_fiscale}</strong>
                      {associazione.partita_iva && `, Partita IVA ${associazione.partita_iva}`}, affiliata a{' '}
                      <strong>{associazione.codice_affiliazione || 'CONI / EPS'}</strong>, in persona del Legale Rappresentante{' '}
                      <strong>{associazione.legale_rappresentante}</strong>:
                    </p>

                    <div className="p-3 bg-light border rounded my-3">
                      <div className="fs-6 fw-bold text-primary mb-2">ATTESTA CHE:</div>
                      <div>
                        L'atleta <strong>{persona.cognome} {persona.nome}</strong>,
                        {persona.is_minorenne && persona.tutore_nome && (
                          <span> (rappresentato/a dal genitore/tutore {persona.tutore_cognome} {persona.tutore_nome}),</span>
                        )}
                        nato/a a <strong>{persona.luogo_nascita}</strong> il{' '}
                        <strong>{new Date(persona.data_nascita).toLocaleDateString('it-IT')}</strong>,
                        residente in <strong>{persona.indirizzo}, {persona.citta}</strong>,
                        Codice Fiscale <strong className="font-monospace">{persona.codice_fiscale}</strong>:
                      </div>
                      <div className="mt-2 fw-semibold">
                        &bull; È regolarmente iscritto/tesserato presso la nostra associazione per l'Anno Sportivo{' '}
                        {annoAttivo ? annoAttivo.anno : 'in corso'}{' '}
                        {tesserato ? `(Tessera n. ${tesserato.numero_tessera})` : ''};
                      </div>
                      <div className="fw-semibold">
                        &bull; Pratica la disciplina sportiva:{' '}
                        <span className="text-primary">
                          {gruppi.length > 0 ? gruppi.map((g) => g.nome_gruppo).join(', ') : 'Attività Motoria e Sportiva Polivalente'}
                        </span>.
                      </div>
                    </div>

                    <div className="text-center my-4 fw-bold fs-6">
                      PERTANTO SI RICHIEDE IL RILASCIO DEL:
                    </div>

                    <div className="border border-2 border-primary rounded p-3 text-center bg-primary-subtle text-primary-emphasis mb-4">
                      <h5 className="fw-bold mb-1">CERTIFICATO DI IDONEITÀ ALLA PRATICA SPORTIVA NON AGONISTICA</h5>
                      <small>(con tracciato ECG a riposo secondo le vigenti linee guida sanitarie)</small>
                    </div>

                    <p className="text-muted">
                      Si rilascia la presente attestazione su richiesta dell'interessato per gli usi consentiti dalla legge al fine del tesseramento e della tutela sanitaria delle attività sportive.
                    </p>
                  </div>

                  {/* Firma e Timbro */}
                  <div className="row g-4 pt-4 border-top mt-5">
                    <div className="col-6">
                      <div className="small text-muted">Luogo e Data:</div>
                      <div className="fw-bold">{associazione.comune}, {dataOggi}</div>
                      <div className="mt-3 small text-muted">Timbro Associazione:</div>
                      <div
                        className="border border-dashed rounded p-3 text-center text-muted small mt-1"
                        style={{ height: '70px' }}
                      >
                        [ Timbro {associazione.denominazione} ]
                      </div>
                    </div>

                    <div className="col-6 text-end">
                      <div className="small text-muted">Il Legale Rappresentante:</div>
                      <div className="fs-6 fw-bold text-dark mt-1">{associazione.legale_rappresentante}</div>
                      <div className="small text-muted">{associazione.denominazione}</div>
                      <div className="mt-4 pt-3 border-bottom d-inline-block" style={{ width: '220px' }}></div>
                      <div className="small text-muted">Firma</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer del modal (nascosto in stampa) */}
          <div className="modal-footer bg-white d-print-none d-flex justify-content-between p-3">
            <div className="text-muted small">
              <i className="bi bi-info-circle me-1"></i>
              I dati dell'Associazione (denominazione, C.F., P.IVA, indirizzo e legale rappresentante) sono modificabili in <strong>Dati Associazione</strong>.
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Chiudi
              </button>
              <button type="button" className="btn btn-primary fw-bold" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Stampa Documento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
