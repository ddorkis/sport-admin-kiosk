<?php
/**
 * Dati Associazione Sportiva, Sede Legale & Affiliazioni
 * Posizione: /private/pages/associazione.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$stmt = $db->query("SELECT * FROM associazione WHERE id = 1 LIMIT 1");
$ass = $stmt->fetch() ?: [
    'denominazione' => 'A.S.D. Polisportiva Aurora',
    'codice_fiscale' => '97854120584',
    'partita_iva' => '04859620581',
    'indirizzo' => 'Via dello Sport, 24',
    'cap' => '00153',
    'comune' => 'Roma',
    'provincia' => 'RM',
    'legale_rappresentante' => 'Alessandro Bianchi',
    'telefono' => '06 5894123',
    'email' => 'segreteria@polisportivaurora.it',
    'pec' => 'polisportivaurora@pec.it',
    'codice_affiliazione' => 'FISR / CONI n. 3942',
    'iban' => 'IT60X0542811101000000123456'
];
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-building-gear text-primary me-2"></i> Dati Associazione Sportiva & Federazioni
        </h2>
        <p class="text-muted small mb-0">
            Configurazione ragione sociale, recapiti fiscali, registri sportivi RASD e intestazione documenti
        </p>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
    <div class="card-header bg-white border-bottom py-3 px-4">
        <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-card-heading me-2 text-primary"></i>Anagrafica Fiscale e Sede Legale</h5>
        <small class="text-muted">Questi dati vengono utilizzati nelle ricevute di pagamento, nei moduli di tesseramento e nei prospetti di bilancio</small>
    </div>
    <form method="POST" action="index.php?action=salva_associazione">
        <div class="card-body p-4">
            <div class="row g-3">
                <div class="col-md-8">
                    <label class="form-label fw-bold">Denominazione Ufficiale A.S.D. / S.S.D. <span class="text-danger">*</span></label>
                    <input type="text" name="denominazione" class="form-control" value="<?= htmlspecialchars($ass['denominazione']) ?>" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">Codice Fiscale Ente <span class="text-danger">*</span></label>
                    <input type="text" name="codice_fiscale" class="form-control" value="<?= htmlspecialchars($ass['codice_fiscale']) ?>" required>
                </div>

                <div class="col-md-4">
                    <label class="form-label fw-bold">Partita IVA (se presente)</label>
                    <input type="text" name="partita_iva" class="form-control" value="<?= htmlspecialchars($ass['partita_iva'] ?? '') ?>" placeholder="es. 04859620581">
                </div>
                <div class="col-md-8">
                    <label class="form-label fw-bold">Presidente / Legale Rappresentante <span class="text-danger">*</span></label>
                    <input type="text" name="legale_rappresentante" class="form-control" value="<?= htmlspecialchars($ass['legale_rappresentante']) ?>" required>
                </div>

                <div class="col-md-6">
                    <label class="form-label fw-bold">Indirizzo Sede Legale <span class="text-danger">*</span></label>
                    <input type="text" name="indirizzo" class="form-control" value="<?= htmlspecialchars($ass['indirizzo']) ?>" required>
                </div>
                <div class="col-md-2">
                    <label class="form-label fw-bold">CAP <span class="text-danger">*</span></label>
                    <input type="text" name="cap" class="form-control" value="<?= htmlspecialchars($ass['cap']) ?>" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">Comune Sede <span class="text-danger">*</span></label>
                    <input type="text" name="comune" class="form-control" value="<?= htmlspecialchars($ass['comune']) ?>" required>
                </div>
                <div class="col-md-1">
                    <label class="form-label fw-bold">Prov. <span class="text-danger">*</span></label>
                    <input type="text" name="provincia" class="form-control" value="<?= htmlspecialchars($ass['provincia']) ?>" required maxlength="4">
                </div>

                <div class="col-md-4">
                    <label class="form-label fw-bold">Telefono Segreteria</label>
                    <input type="text" name="telefono" class="form-control" value="<?= htmlspecialchars($ass['telefono'] ?? '') ?>" placeholder="es. 06 1234567">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">Email Segreteria</label>
                    <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($ass['email'] ?? '') ?>" placeholder="es. segreteria@societa.it">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">Posta Elettronica Certificata (PEC)</label>
                    <input type="email" name="pec" class="form-control" value="<?= htmlspecialchars($ass['pec'] ?? '') ?>" placeholder="es. societa@pec.it">
                </div>

                <div class="col-md-6">
                    <label class="form-label fw-bold">Codice Affiliazione Federale / CONI</label>
                    <input type="text" name="codice_affiliazione" class="form-control" value="<?= htmlspecialchars($ass['codice_affiliazione'] ?? '') ?>" placeholder="es. FISR n. 3942 / CSEN n. 45892">
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">Codice IBAN per Bonifici Quote Sociali</label>
                    <input type="text" name="iban" class="form-control font-monospace" value="<?= htmlspecialchars($ass['iban'] ?? '') ?>" placeholder="IT60X0542811101000000123456">
                </div>
            </div>

            <!-- Box informativo Enti Affiliati -->
            <div class="mt-4 pt-3 border-top">
                <h6 class="fw-bold mb-2 text-dark"><i class="bi bi-shield-check me-2 text-success"></i>Enti di Promozione Sportiva (EPS) e Federazioni Riconosciute (FSN/DSA)</h6>
                <p class="small text-muted mb-3">La società è predisposta per operare con FISR, UISP, AICS, CSEN, PGS e con il Registro Nazionale delle Attività Sportive Dilettantistiche (RASD).</p>
                <div class="d-flex flex-wrap gap-2">
                    <span class="badge bg-primary px-3 py-2 fs-6">CONI</span>
                    <span class="badge bg-success px-3 py-2 fs-6">FISR</span>
                    <span class="badge bg-info text-dark px-3 py-2 fs-6">UISP</span>
                    <span class="badge bg-warning text-dark px-3 py-2 fs-6">AICS</span>
                    <span class="badge bg-secondary px-3 py-2 fs-6">CSEN</span>
                    <span class="badge bg-dark px-3 py-2 fs-6">Registro RASD</span>
                </div>
            </div>
        </div>
        <div class="card-footer bg-light px-4 py-3 text-end">
            <button type="submit" class="btn btn-primary fw-bold shadow-sm">
                <i class="bi bi-check-lg me-1"></i> Salva Modifiche Associazione
            </button>
        </div>
    </form>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
