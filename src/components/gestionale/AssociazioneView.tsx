import React, { useState } from 'react';
import { Associazione } from '../../types';

interface Props {
  associazione: Associazione;
  onSaveAssociazione: (updated: Associazione) => void;
  onOpenStampaDemo: (tipo: 'ricevuta' | 'domanda_iscrizione' | 'richiesta_certificato') => void;
}

export const AssociazioneView: React.FC<Props> = ({
  associazione,
  onSaveAssociazione,
  onOpenStampaDemo
}) => {
  const [formData, setFormData] = useState<Associazione>({ ...associazione });
  const [salvato, setSalvato] = useState(false);

  const handleChange = (field: keyof Associazione, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
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
    setTimeout(() => setSalvato(false), 4000);
  };

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
            Configura i dati anagrafici, fiscali e il legale rappresentante della tua associazione. 
            Questi dati verranno impressi automaticamente su tutte le <strong>ricevute</strong>, 
            <strong>domande di iscrizione</strong> e <strong>richieste di certificato medico</strong>.
          </p>
        </div>

        {salvato && (
          <div className="alert alert-success py-2 px-3 mb-0 d-flex align-items-center gap-2 shadow-sm animate__animated animate__fadeIn">
            <i className="bi bi-check-circle-fill fs-5"></i>
            <span>Dati salvati e applicati a tutte le stampe!</span>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* COLONNA SINISTRA: Form di modifica dati */}
        <div className="col-lg-7">
          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-pencil-square"></i>
                  Anagrafica Fiscale e Sede Legale
                </h5>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  {/* Denominazione */}
                  <div className="col-12">
                    <label className="form-label fw-bold">
                      Denominazione Sociale Completa *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-shield-shaded"></i></span>
                      <input
                        type="text"
                        className="form-control form-control-lg fw-semibold"
                        placeholder="Es. A.S.D. Polisportiva Aurora"
                        value={formData.denominazione}
                        onChange={(e) => handleChange('denominazione', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-text small">Come registrata all'Agenzia delle Entrate e al Registro Nazionale CONI / Sport e Salute.</div>
                  </div>

                  {/* Codice Fiscale & Partita IVA */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Codice Fiscale *
                    </label>
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
                    <label className="form-label fw-bold">
                      Partita IVA (se presente)
                    </label>
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
                      Legale Rappresentante (Presidente) *
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
                    <div className="form-text small">Compare come firmatario su ricevute, domande di iscrizione e lettere di richiesta visita medica.</div>
                  </div>

                  {/* Indirizzo, CAP, Comune, Provincia */}
                  <div className="col-12">
                    <label className="form-label fw-bold">
                      Indirizzo Sede Legale *
                    </label>
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

                  {/* Recapiti aggiuntivi per carta intestata */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Telefono Segreteria</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. 06 5894123"
                      value={formData.telefono || ''}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email / PEC</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="segreteria@polisportivaurora.it"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Affiliazione Federazione / EPS</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Es. CONI / CSEN n. 45892"
                      value={formData.codice_affiliazione || ''}
                      onChange={(e) => handleChange('codice_affiliazione', e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">IBAN Associazione (per quote)</label>
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

              <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Tutti i campi contrassegnati da * sono stampati sui moduli ufficiali.</span>
                <button type="submit" className="btn btn-primary fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-2">
                  <i className="bi bi-floppy-fill"></i>
                  Salva Dati Associazione
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* COLONNA DESTRA: Anteprima Carta Intestata e Test Stampe */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 mb-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-text-fill"></i>
                Anteprima Carta Intestata per Stampe
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              <div className="border border-2 rounded p-3 bg-light shadow-sm">
                <div className="d-flex align-items-start justify-content-between border-bottom pb-3 mb-3">
                  <div>
                    <h5 className="fw-bold text-primary mb-1 text-uppercase">
                      {formData.denominazione || 'NOME ASSOCIAZIONE SPORTIVA'}
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
                      {formData.codice_affiliazione && (
                        <div className="mt-1 text-primary-emphasis">
                          <strong>Affiliazione:</strong> {formData.codice_affiliazione}
                        </div>
                      )}
                    </div>
                  </div>
                  <i className="bi bi-award-fill text-warning fs-1"></i>
                </div>

                <div className="bg-white p-2 rounded border small text-muted text-center fst-italic">
                  Questa intestazione comparirà automaticamente in cima a tutte le stampe cartacee e PDF generati dal gestionale.
                </div>

                <div className="mt-3 pt-2 d-flex justify-content-between align-items-center border-top">
                  <div className="small text-muted">
                    Firma autorizzata: <strong>{formData.legale_rappresentante || 'Presidente'}</strong>
                  </div>
                  <span className="badge bg-success">Configurato</span>
                </div>
              </div>

              {/* Bottoni di Anteprima Diretta delle 3 Stampe Richieste */}
              <div className="mt-4">
                <label className="fw-bold small text-uppercase text-muted d-block mb-2">
                  Testa le stampe ufficiali con questi dati:
                </label>
                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-success text-start d-flex align-items-center justify-content-between p-2 px-3"
                    onClick={() => onOpenStampaDemo('ricevuta')}
                  >
                    <span>
                      <i className="bi bi-receipt-cutoff me-2 fs-5"></i>
                      <strong>1. Ricevuta di Pagamento</strong>
                    </span>
                    <span className="badge bg-success-subtle text-success">Apri Stampa</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary text-start d-flex align-items-center justify-content-between p-2 px-3"
                    onClick={() => onOpenStampaDemo('domanda_iscrizione')}
                  >
                    <span>
                      <i className="bi bi-person-lines-fill me-2 fs-5"></i>
                      <strong>2. Domanda di Iscrizione / Tesseramento</strong>
                    </span>
                    <span className="badge bg-primary-subtle text-primary">Apri Stampa</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger text-start d-flex align-items-center justify-content-between p-2 px-3"
                    onClick={() => onOpenStampaDemo('richiesta_certificato')}
                  >
                    <span>
                      <i className="bi bi-heart-pulse-fill me-2 fs-5"></i>
                      <strong>3. Richiesta di Certificato Medico</strong>
                    </span>
                    <span className="badge bg-danger-subtle text-danger">Apri Stampa</span>
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
