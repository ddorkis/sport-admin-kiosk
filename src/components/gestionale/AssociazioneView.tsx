import React, { useState } from 'react';
import { Associazione, EnteAffiliato } from '../../types';

interface Props {
  associazione: Associazione;
  onSaveAssociazione: (updated: Associazione) => void;
  onOpenStampaDemo: (tipo: 'ricevuta' | 'domanda_iscrizione' | 'richiesta_certificato') => void;
}

const EPS_SUGGERITI = [
  { sigla: 'UISP', nome: 'Unione Italiana Sport Per tutti - Settore Pattinaggio' },
  { sigla: 'AICS', nome: 'Associazione Italiana Cultura Sport - Pattinaggio' },
  { sigla: 'CSEN', nome: 'Centro Sportivo Educativo Nazionale' },
  { sigla: 'PGS', nome: 'Polisportive Giovanili Salesiane' },
  { sigla: 'ACSI', nome: 'Associazione Centri Sportivi Italiani' },
  { sigla: 'CSI', nome: 'Centro Sportivo Italiano' }
];

export const AssociazioneView: React.FC<Props> = ({
  associazione,
  onSaveAssociazione,
  onOpenStampaDemo
}) => {
  const [formData, setFormData] = useState<Associazione>({
    ...associazione,
    disciplina: associazione.disciplina || 'Pattinaggio Artistico a Rotelle',
    codice_affiliazione_fisr: associazione.codice_affiliazione_fisr || 'FISR n. 3942',
    registro_rasd: associazione.registro_rasd || 'RASD-RM-048291',
    enti_affiliati: associazione.enti_affiliati && associazione.enti_affiliati.length > 0
      ? associazione.enti_affiliati
      : [
          { id: '1', tipo: 'FSN', sigla: 'FISR', denominazione_estesa: 'Federazione Italiana Sport Rotellistici', codice_societa: '3942', attivo: true },
          { id: '2', tipo: 'EPS', sigla: 'UISP', denominazione_estesa: 'Unione Italiana Sport Per tutti - Pattinaggio', codice_societa: 'UISP-RM-8492', attivo: true },
          { id: '3', tipo: 'EPS', sigla: 'AICS', denominazione_estesa: 'Associazione Italiana Cultura Sport', codice_societa: 'AICS-99321', attivo: true }
        ],
    specialita: associazione.specialita || [
      'Singolo Maschile e Femminile',
      'Solo Dance Internazionale & Naz.',
      'Coppia Artistico & Danza',
      'Gruppi Show, Quartetti & Precision',
      'Avviamento Primi Passi'
    ]
  });

  const [salvato, setSalvato] = useState(false);
  const [nuovoEpsSigla, setNuovoEpsSigla] = useState('');
  const [nuovoEpsCodice, setNuovoEpsCodice] = useState('');
  const [nuovoEpsNome, setNuovoEpsNome] = useState('');

  const handleChange = (field: keyof Associazione, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setSalvato(false);
  };

  const handleToggleEnte = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      enti_affiliati: prev.enti_affiliati.map((e) =>
        e.id === id ? { ...e, attivo: !e.attivo } : e
      )
    }));
    setSalvato(false);
  };

  const handleUpdateCodiceEnte = (id: string, codice: string) => {
    setFormData((prev) => ({
      ...prev,
      enti_affiliati: prev.enti_affiliati.map((e) =>
        e.id === id ? { ...e, codice_societa: codice } : e
      )
    }));
    setSalvato(false);
  };

  const handleRemoveEnte = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      enti_affiliati: prev.enti_affiliati.filter((e) => e.id !== id)
    }));
    setSalvato(false);
  };

  const handleAggiungiEps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoEpsSigla.trim() || !nuovoEpsCodice.trim()) {
      alert('Inserisci la sigla e il codice di affiliazione dell\'ente.');
      return;
    }

    const nuovo: EnteAffiliato = {
      id: 'eps-' + Date.now(),
      tipo: 'EPS',
      sigla: nuovoEpsSigla.trim().toUpperCase(),
      denominazione_estesa: nuovoEpsNome.trim() || undefined,
      codice_societa: nuovoEpsCodice.trim(),
      attivo: true
    };

    setFormData((prev) => ({
      ...prev,
      enti_affiliati: [...prev.enti_affiliati, nuovo]
    }));

    setNuovoEpsSigla('');
    setNuovoEpsCodice('');
    setNuovoEpsNome('');
    setSalvato(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.denominazione.trim() || !formData.codice_fiscale.trim()) {
      alert('Denominazione e Codice Fiscale dell\'Associazione sono obbligatori.');
      return;
    }
    onSaveAssociazione(formData);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 4500);
  };

  const epsAttivi = formData.enti_affiliati.filter(e => e.tipo === 'EPS' && e.attivo);

  return (
    <div className="container-fluid py-4">
      {/* Intestazione Sezione */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h3 fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-building-gear text-primary"></i>
            Dati Associazione Sportiva & Intestazione Stampe
          </h2>
          <p className="text-muted mb-0 small">
            Configurazione ufficiale per <strong>Pattinaggio Artistico a Rotelle</strong>, Federazione <strong>FISR</strong>, Enti di Promozione Sportiva multipli (EPS) e Legale Rappresentante.
            Tutti i dati salvati qui si riflettono automaticamente nelle <strong>ricevute</strong>, nelle <strong>domande di ammissione</strong> e nelle <strong>richieste di visita medica</strong>.
          </p>
        </div>

        {salvato && (
          <div className="alert alert-success py-2 px-3 mb-0 d-flex align-items-center gap-2 shadow-sm animate__animated animate__fadeIn">
            <i className="bi bi-check-circle-fill fs-5"></i>
            <span>Dati salvati con successo e applicati a tutti i documenti!</span>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* COLONNA SINISTRA: Form di configurazione */}
        <div className="col-lg-7">
          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm border-0 rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-shield-shaded"></i>
                  Anagrafica Fiscale e Disciplina Sportiva
                </h5>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Pattinaggio su Rotelle
                </span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  {/* Disciplina */}
                  <div className="col-12">
                    <label className="form-label fw-bold">Disciplina Sportiva Praticata *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-trophy"></i></span>
                      <input
                        type="text"
                        className="form-control fw-semibold"
                        placeholder="Es. Pattinaggio Artistico a Rotelle"
                        value={formData.disciplina}
                        onChange={(e) => handleChange('disciplina', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-text small">Compare nell'intestazione e nelle richieste mediche/domande di tesseramento.</div>
                  </div>

                  {/* Denominazione */}
                  <div className="col-12">
                    <label className="form-label fw-bold">
                      Denominazione Sociale Completa *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-building"></i></span>
                      <input
                        type="text"
                        className="form-control form-control-lg fw-semibold"
                        placeholder="Es. A.S.D. Pattinaggio Artistico Aurora"
                        value={formData.denominazione}
                        onChange={(e) => handleChange('denominazione', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Codice Fiscale & Partita IVA */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Codice Fiscale *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-card-text"></i></span>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="Es. 97854120584"
                        value={formData.codice_fiscale}
                        onChange={(e) => handleChange('codice_fiscale', e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Partita IVA (se attiva)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-receipt"></i></span>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="Es. 04859620581"
                        value={formData.partita_iva}
                        onChange={(e) => handleChange('partita_iva', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Legale Rappresentante */}
                  <div className="col-12">
                    <label className="form-label fw-bold">
                      Legale Rappresentante (Presidente dell'Associazione) *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-person-badge"></i></span>
                      <input
                        type="text"
                        className="form-control fw-semibold"
                        placeholder="Es. Alessandro Bianchi"
                        value={formData.legale_rappresentante}
                        onChange={(e) => handleChange('legale_rappresentante', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-text small">
                      Viene stampato automaticamente con la dicitura di firma su ricevute di pagamento, quietanze, domande di iscrizione e richieste di visita medica.
                    </div>
                  </div>

                  {/* Sede Legale */}
                  <div className="col-12">
                    <label className="form-label fw-bold">Indirizzo Sede Legale *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-geo-alt"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Es. Via dello Sport, 24"
                        value={formData.indirizzo}
                        onChange={(e) => handleChange('indirizzo', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold">CAP *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="00153"
                      value={formData.cap}
                      onChange={(e) => handleChange('cap', e.target.value)}
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label fw-bold">Comune / Città *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Roma"
                      value={formData.comune}
                      onChange={(e) => handleChange('comune', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold">Provincia (Sigla) *</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="RM"
                      value={formData.provincia}
                      onChange={(e) => handleChange('provincia', e.target.value.toUpperCase())}
                      maxLength={2}
                      required
                    />
                  </div>

                  <div className="col-12"><hr className="my-2" /></div>

                  {/* Recapiti Segreteria */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Telefono Segreteria / Pista</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. 06 5894123"
                      value={formData.telefono || ''}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Ufficiale</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="segreteria@pattinaggioaurora.it"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">PEC</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="pattinaggioaurora@pec.it"
                      value={formData.pec || ''}
                      onChange={(e) => handleChange('pec', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">IBAN per Bonifici Quote</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="IT60X0542811101000000123456"
                      value={formData.iban || ''}
                      onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEZIONE: FEDERAZIONE FISR ED ENTI DI PROMOZIONE SPORTIVA (EPS) */}
            <div className="card shadow-sm border-0 rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-award-fill text-warning"></i>
                  Federazione FISR & Enti di Promozione Sportiva (EPS Multipli)
                </h5>
              </div>

              <div className="card-body p-4">
                <p className="text-muted small mb-3">
                  Specificare l'affiliazione principale alla <strong>FISR (Federazione Italiana Sport Rotellistici)</strong> e tutti gli <strong>Enti di Promozione Sportiva</strong> (UISP, AICS, CSEN, PGS, ecc.) presso cui l'associazione è registrata per i circuiti promozionali e gare.
                </p>

                <div className="row g-3 mb-4">
                  {/* FISR */}
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-light">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-danger">FSN Ufficiale</span>
                        <span className="small fw-bold text-danger">FISR</span>
                      </div>
                      <label className="form-label fw-bold small">Codice Società Federale FISR *</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        placeholder="Es. FISR n. 3942"
                        value={formData.codice_affiliazione_fisr || ''}
                        onChange={(e) => handleChange('codice_affiliazione_fisr', e.target.value)}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Federazione Italiana Sport Rotellistici (CONI / World Skate).
                      </small>
                    </div>
                  </div>

                  {/* Registro RASD */}
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-light">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-primary">Registro Nazionale</span>
                        <span className="small fw-bold text-primary">Dipartimento Sport</span>
                      </div>
                      <label className="form-label fw-bold small">Codice Registro RASD</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="Es. RASD-RM-048291"
                        value={formData.registro_rasd || ''}
                        onChange={(e) => handleChange('registro_rasd', e.target.value)}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Registro Nazionale delle Attività Sportive Dilettantistiche.
                      </small>
                    </div>
                  </div>
                </div>

                {/* Elenco EPS Affiliati */}
                <h6 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-people-fill text-primary"></i>
                  Enti di Promozione Sportiva (EPS) Registrati:
                </h6>

                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light small">
                      <tr>
                        <th style={{ width: '60px' }}>Tipo</th>
                        <th style={{ width: '100px' }}>Sigla Ente</th>
                        <th>Denominazione Estesa Ente</th>
                        <th style={{ width: '180px' }}>Codice Società / Affiliazione</th>
                        <th className="text-center" style={{ width: '80px' }}>Stato</th>
                        <th className="text-center" style={{ width: '60px' }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.enti_affiliati.map((ente) => (
                        <tr key={ente.id} className={ente.attivo === false ? 'table-secondary opacity-75' : ''}>
                          <td>
                            <span className={`badge ${ente.tipo === 'FSN' ? 'bg-danger' : 'bg-primary'}`}>
                              {ente.tipo}
                            </span>
                          </td>
                          <td className="fw-bold">{ente.sigla}</td>
                          <td className="small text-muted">{ente.denominazione_estesa || '—'}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm font-monospace"
                              value={ente.codice_societa}
                              onChange={(e) => handleUpdateCodiceEnte(ente.id, e.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className={`btn btn-sm py-0 px-2 ${ente.attivo !== false ? 'btn-success' : 'btn-outline-secondary'}`}
                              onClick={() => handleToggleEnte(ente.id)}
                              title={ente.attivo !== false ? 'Attivo nelle stampe' : 'Disattivato'}
                            >
                              {ente.attivo !== false ? 'Attivo' : 'Off'}
                            </button>
                          </td>
                          <td className="text-center">
                            {ente.tipo === 'EPS' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                onClick={() => handleRemoveEnte(ente.id)}
                                title="Rimuovi questo ente"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Form rapido aggiungi nuovo EPS */}
                <div className="p-3 border rounded-3 bg-light">
                  <h6 className="fw-bold small mb-2 text-primary d-flex align-items-center gap-1">
                    <i className="bi bi-plus-circle"></i> Aggiungi un altro Ente di Promozione Sportiva (EPS)
                  </h6>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold mb-1">Sigla (es. UISP, AICS)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-uppercase"
                        placeholder="Es. UISP"
                        value={nuovoEpsSigla}
                        onChange={(e) => setNuovoEpsSigla(e.target.value)}
                        list="eps-suggestions"
                      />
                      <datalist id="eps-suggestions">
                        {EPS_SUGGERITI.map((s) => (
                          <option key={s.sigla} value={s.sigla}>{s.nome}</option>
                        ))}
                      </datalist>
                    </div>

                    <div className="col-md-5">
                      <label className="form-label small fw-semibold mb-1">Denominazione Estesa (Opzionale)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Es. Unione Italiana Sport Per tutti - Pattinaggio"
                        value={nuovoEpsNome}
                        onChange={(e) => setNuovoEpsNome(e.target.value)}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small fw-semibold mb-1">Codice Affiliazione *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="Es. UISP-RM-8492"
                        value={nuovoEpsCodice}
                        onChange={(e) => setNuovoEpsCodice(e.target.value)}
                      />
                    </div>

                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm w-100"
                        onClick={handleAggiungiEps}
                        title="Aggiungi EPS"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Tutti i dati aggiornati compaiono in tempo reale sui moduli di stampa.</span>
                <button type="submit" className="btn btn-primary fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-2">
                  <i className="bi bi-floppy-fill"></i>
                  Salva Tutti i Dati
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* COLONNA DESTRA: Anteprima Carta Intestata & Test Stampe */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 mb-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-text-fill"></i>
                Anteprima Carta Intestata (Documenti Ufficiali)
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              {/* Carta Intestata */}
              <div className="border border-2 rounded p-3 bg-light shadow-sm mb-4">
                <div className="d-flex align-items-start justify-content-between border-bottom pb-3 mb-3">
                  <div>
                    <div className="badge bg-primary text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>
                      {formData.disciplina || 'Pattinaggio Artistico a Rotelle'}
                    </div>
                    <h5 className="fw-bold text-primary mb-1 text-uppercase">
                      {formData.denominazione || 'A.S.D. Pattinaggio Artistico'}
                    </h5>
                    <div className="text-muted small lh-sm">
                      <div>
                        {formData.indirizzo || 'Via dello Sport'}, {formData.cap || '00000'} {formData.comune || 'Comune'} ({formData.provincia || 'PR'})
                      </div>
                      <div className="mt-1">
                        <strong>C.F.:</strong> {formData.codice_fiscale || '—'}
                        {formData.partita_iva && <span className="ms-2"><strong>P.IVA:</strong> {formData.partita_iva}</span>}
                      </div>
                      <div className="mt-1">
                        <strong>Legale Rappresentante:</strong> {formData.legale_rappresentante || '—'}
                      </div>
                      <div className="mt-1 text-danger fw-semibold">
                        <i className="bi bi-trophy-fill me-1"></i>
                        FISR: {formData.codice_affiliazione_fisr || 'Federazione FISR'}
                      </div>
                      {epsAttivi.length > 0 && (
                        <div className="mt-1 text-primary">
                          <strong>EPS Affiliati:</strong> {epsAttivi.map(e => e.sigla).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <i className="bi bi-award-fill text-warning fs-1"></i>
                </div>

                <div className="bg-white p-2 rounded border small text-muted text-center fst-italic">
                  Questa intestazione compare in cima a tutte le ricevute, domande di iscrizione e lettere mediche.
                </div>

                <div className="mt-3 pt-2 d-flex justify-content-between align-items-center border-top">
                  <div className="small text-muted">
                    Firma: <strong>{formData.legale_rappresentante || 'Presidente'}</strong>
                  </div>
                  <span className="badge bg-success">Configurato</span>
                </div>
              </div>

              {/* Bottoni di Apertura Stampa / Download PDF Diretto */}
              <div>
                <label className="fw-bold small text-uppercase text-muted d-block mb-2">
                  Testa e stampa i 3 documenti con questi dati:
                </label>
                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-success text-start d-flex align-items-center justify-content-between p-3 shadow-xs"
                    onClick={() => onOpenStampaDemo('ricevuta')}
                  >
                    <div>
                      <div className="fw-bold text-success d-flex align-items-center gap-2">
                        <i className="bi bi-receipt-cutoff fs-5"></i>
                        1. Ricevuta di Pagamento
                      </div>
                      <small className="text-muted">Quota corsi su rotelle, tesseramento federale FISR ed EPS</small>
                    </div>
                    <span className="badge bg-success text-white">Stampa / PDF</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary text-start d-flex align-items-center justify-content-between p-3 shadow-xs"
                    onClick={() => onOpenStampaDemo('domanda_iscrizione')}
                  >
                    <div>
                      <div className="fw-bold text-primary d-flex align-items-center gap-2">
                        <i className="bi bi-person-lines-fill fs-5"></i>
                        2. Domanda Iscrizione e Tesseramento FISR/EPS
                      </div>
                      <small className="text-muted">Modulo socio con dati genitore, privacy e disciplina rotelle</small>
                    </div>
                    <span className="badge bg-primary text-white">Stampa / PDF</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger text-start d-flex align-items-center justify-content-between p-3 shadow-xs"
                    onClick={() => onOpenStampaDemo('richiesta_certificato')}
                  >
                    <div>
                      <div className="fw-bold text-danger d-flex align-items-center gap-2">
                        <i className="bi bi-heart-pulse-fill fs-5"></i>
                        3. Richiesta di Certificato Medico
                      </div>
                      <small className="text-muted">Per medico/pediatra: Non agonistico (ECG) o Agonistico Tab. B1 FISR</small>
                    </div>
                    <span className="badge bg-danger text-white">Stampa / PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
