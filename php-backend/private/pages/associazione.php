<?php
/**
 * Dati Associazione Sportiva, Sede Legale, Affiliazioni FISR / EPS Multipli & Anteprima Carta Intestata
 * Posizione: /private/pages/associazione.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Assicura l'esistenza delle colonne per disciplina, affiliazioni ed EPS multipli
try {
    $db->exec("ALTER TABLE associazione ADD COLUMN IF NOT EXISTS disciplina VARCHAR(100) NULL DEFAULT 'Pattinaggio Artistico a Rotelle'");
    $db->exec("ALTER TABLE associazione ADD COLUMN IF NOT EXISTS codice_affiliazione_fisr VARCHAR(80) NULL DEFAULT 'FISR n. 3942'");
    $db->exec("ALTER TABLE associazione ADD COLUMN IF NOT EXISTS registro_rasd VARCHAR(80) NULL DEFAULT 'RASD-RM-048291'");
    $db->exec("ALTER TABLE associazione ADD COLUMN IF NOT EXISTS enti_affiliati_json TEXT NULL");
} catch (Exception $e) {}

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
    'codice_affiliazione' => 'CONI / FISR n. 3942',
    'iban' => 'IT60X0542811101000000123456',
    'disciplina' => 'Pattinaggio Artistico a Rotelle',
    'codice_affiliazione_fisr' => 'FISR n. 3942',
    'registro_rasd' => 'RASD-RM-048291',
    'enti_affiliati_json' => ''
];

$disciplina = $ass['disciplina'] ?? 'Pattinaggio Artistico a Rotelle';
$codiceFisr = $ass['codice_affiliazione_fisr'] ?? 'FISR n. 3942';
$registroRasd = $ass['registro_rasd'] ?? 'RASD-RM-048291';

// Enti Affiliati (FSN FISR ed EPS multipli come UISP, AICS, CSEN, PGS)
$entiDefault = [
    ['id' => '1', 'tipo' => 'FSN', 'sigla' => 'FISR', 'denominazione_estesa' => 'Federazione Italiana Sport Rotellistici', 'codice_societa' => $codiceFisr ?: '3942', 'attivo' => true],
    ['id' => '2', 'tipo' => 'EPS', 'sigla' => 'UISP', 'denominazione_estesa' => 'Unione Italiana Sport Per tutti - Pattinaggio', 'codice_societa' => 'UISP-RM-8492', 'attivo' => true],
    ['id' => '3', 'tipo' => 'EPS', 'sigla' => 'AICS', 'denominazione_estesa' => 'Associazione Italiana Cultura Sport', 'codice_societa' => 'AICS-99321', 'attivo' => true]
];

$entiAffiliati = $entiDefault;
if (!empty($ass['enti_affiliati_json'])) {
    $dec = json_decode($ass['enti_affiliati_json'], true);
    if (is_array($dec) && count($dec) > 0) {
        $entiAffiliati = $dec;
    }
}
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-building-gear text-primary me-2"></i> Dati Associazione Sportiva & Intestazione Stampe
        </h2>
        <p class="text-muted small mb-0">
            Configurazione ufficiale per <strong><?= htmlspecialchars($disciplina) ?></strong>, Federazione <strong>FISR</strong>, Enti di Promozione Sportiva multipli (EPS) e Legale Rappresentante.
            Tutti i dati si riflettono automaticamente nelle <strong>ricevute</strong>, nelle <strong>domande di ammissione</strong> e nelle <strong>richieste di visita medica</strong>.
        </p>
    </div>
</div>

<div class="row g-4">
    <!-- COLONNA SINISTRA: Form di Configurazione Ufficiale -->
    <div class="col-lg-7">
        <form method="POST" action="index.php?action=salva_associazione" id="formAssociazione">
            <input type="hidden" name="enti_affiliati_json" id="inputEntiJson" value="<?= htmlspecialchars(json_encode($entiAffiliati)) ?>">

            <!-- Card 1: Anagrafica Fiscale e Disciplina -->
            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-primary d-flex align-items-center">
                        <i class="bi bi-shield-shaded me-2"></i> Anagrafica Fiscale e Disciplina Sportiva
                    </h5>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" id="badgeDisciplina">
                        <?= htmlspecialchars($disciplina) ?>
                    </span>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Disciplina -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Disciplina Sportiva Praticata <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-trophy"></i></span>
                                <input type="text" name="disciplina" id="fieldDisciplina" class="form-control fw-semibold" value="<?= htmlspecialchars($disciplina) ?>" placeholder="Es. Pattinaggio Artistico a Rotelle" required oninput="aggiornaAnteprimaLive()">
                            </div>
                            <div class="form-text small">Compare nell'intestazione e nelle richieste mediche/domande di tesseramento.</div>
                        </div>

                        <!-- Denominazione Sociale -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Denominazione Sociale Completa <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-building"></i></span>
                                <input type="text" name="denominazione" id="fieldDenominazione" class="form-control form-control-lg fw-semibold" value="<?= htmlspecialchars($ass['denominazione']) ?>" placeholder="Es. A.S.D. Pattinaggio Artistico Aurora" required oninput="aggiornaAnteprimaLive()">
                            </div>
                        </div>

                        <!-- Codice Fiscale & P.IVA -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Codice Fiscale Ente <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-card-text"></i></span>
                                <input type="text" name="codice_fiscale" id="fieldCf" class="form-control font-monospace" value="<?= htmlspecialchars($ass['codice_fiscale']) ?>" placeholder="Es. 97854120584" required oninput="aggiornaAnteprimaLive()">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Partita IVA (se attiva)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-receipt"></i></span>
                                <input type="text" name="partita_iva" id="fieldPiva" class="form-control font-monospace" value="<?= htmlspecialchars($ass['partita_iva'] ?? '') ?>" placeholder="Es. 04859620581" oninput="aggiornaAnteprimaLive()">
                            </div>
                        </div>

                        <!-- Legale Rappresentante -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Legale Rappresentante (Presidente dell'Associazione) <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-person-badge"></i></span>
                                <input type="text" name="legale_rappresentante" id="fieldPresidente" class="form-control fw-semibold" value="<?= htmlspecialchars($ass['legale_rappresentante']) ?>" placeholder="Es. Alessandro Bianchi" required oninput="aggiornaAnteprimaLive()">
                            </div>
                            <div class="form-text small">Viene stampato automaticamente con la dicitura di firma su ricevute di pagamento, quietanze, domande di iscrizione e richieste di visita medica.</div>
                        </div>

                        <!-- Sede Legale -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Indirizzo Sede Legale <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light"><i class="bi bi-geo-alt"></i></span>
                                <input type="text" name="indirizzo" id="fieldIndirizzo" class="form-control" value="<?= htmlspecialchars($ass['indirizzo']) ?>" placeholder="Es. Via dello Sport, 24" required oninput="aggiornaAnteprimaLive()">
                            </div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">CAP <span class="text-danger">*</span></label>
                            <input type="text" name="cap" id="fieldCap" class="form-control" value="<?= htmlspecialchars($ass['cap']) ?>" placeholder="00153" maxlength="5" required oninput="aggiornaAnteprimaLive()">
                        </div>
                        <div class="col-md-5">
                            <label class="form-label fw-bold">Comune Sede <span class="text-danger">*</span></label>
                            <input type="text" name="comune" id="fieldComune" class="form-control" value="<?= htmlspecialchars($ass['comune']) ?>" placeholder="Roma" required oninput="aggiornaAnteprimaLive()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Prov. <span class="text-danger">*</span></label>
                            <input type="text" name="provincia" id="fieldProv" class="form-control text-uppercase" value="<?= htmlspecialchars($ass['provincia']) ?>" placeholder="RM" maxlength="4" required oninput="aggiornaAnteprimaLive()">
                        </div>

                        <div class="col-12"><hr class="my-2"></div>

                        <!-- Recapiti Segreteria -->
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Telefono Segreteria / Pista</label>
                            <input type="text" name="telefono" id="fieldTel" class="form-control" value="<?= htmlspecialchars($ass['telefono'] ?? '') ?>" placeholder="Es. 06 5894123" oninput="aggiornaAnteprimaLive()">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Email Segreteria</label>
                            <input type="email" name="email" id="fieldEmail" class="form-control" value="<?= htmlspecialchars($ass['email'] ?? '') ?>" placeholder="segreteria@societa.it" oninput="aggiornaAnteprimaLive()">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Posta Elettronica Certificata (PEC)</label>
                            <input type="email" name="pec" id="fieldPec" class="form-control" value="<?= htmlspecialchars($ass['pec'] ?? '') ?>" placeholder="societa@pec.it" oninput="aggiornaAnteprimaLive()">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Codice IBAN per Bonifici Quote Sociali</label>
                            <input type="text" name="iban" id="fieldIban" class="form-control font-monospace" value="<?= htmlspecialchars($ass['iban'] ?? '') ?>" placeholder="IT60X0542811101000000123456" oninput="aggiornaAnteprimaLive()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Federazione FISR ed Enti di Promozione Sportiva (EPS Multipli) -->
            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4">
                    <h5 class="fw-bold mb-0 text-primary d-flex align-items-center">
                        <i class="bi bi-award-fill text-warning me-2"></i> Federazione FISR & Enti di Promozione Sportiva (EPS Multipli)
                    </h5>
                </div>
                <div class="card-body p-4">
                    <p class="text-muted small mb-3">
                        Specificare l'affiliazione principale alla <strong>FISR (Federazione Italiana Sport Rotellistici)</strong> e tutti gli <strong>Enti di Promozione Sportiva</strong> (UISP, AICS, CSEN, PGS, ecc.) presso cui l'associazione è registrata per i circuiti promozionali e gare.
                    </p>

                    <div class="row g-3 mb-4">
                        <!-- FISR -->
                        <div class="col-md-6">
                            <div class="p-3 border rounded-3 bg-light h-100">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <span class="badge bg-danger">FSN Ufficiale</span>
                                    <span class="small fw-bold text-danger">FISR</span>
                                </div>
                                <label class="form-label fw-bold small">Codice Società Federale FISR *</label>
                                <input type="text" name="codice_affiliazione_fisr" id="fieldCodiceFisr" class="form-control fw-bold" value="<?= htmlspecialchars($codiceFisr) ?>" placeholder="Es. FISR n. 3942" oninput="aggiornaAnteprimaLive()">
                                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">Federazione Italiana Sport Rotellistici (CONI / World Skate).</small>
                            </div>
                        </div>

                        <!-- Registro RASD -->
                        <div class="col-md-6">
                            <div class="p-3 border rounded-3 bg-light h-100">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <span class="badge bg-primary">Registro Nazionale</span>
                                    <span class="small fw-bold text-primary">Dipartimento Sport</span>
                                </div>
                                <label class="form-label fw-bold small">Codice Registro RASD</label>
                                <input type="text" name="registro_rasd" id="fieldRasd" class="form-control font-monospace" value="<?= htmlspecialchars($registroRasd) ?>" placeholder="Es. RASD-RM-048291" oninput="aggiornaAnteprimaLive()">
                                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">Registro Nazionale delle Attività Sportive Dilettantistiche.</small>
                            </div>
                        </div>
                    </div>

                    <!-- Elenco EPS Affiliati -->
                    <h6 class="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                        <i class="bi bi-people-fill text-primary"></i> Enti di Promozione Sportiva (EPS) Registrati:
                    </h6>

                    <div class="table-responsive mb-3">
                        <table class="table table-sm table-bordered align-middle mb-0" id="tabellaEnti">
                            <thead class="table-light small">
                                <tr>
                                    <th style="width: 70px;">Tipo</th>
                                    <th style="width: 100px;">Sigla Ente</th>
                                    <th>Denominazione Estesa Ente</th>
                                    <th style="width: 180px;">Codice Società / Affiliazione</th>
                                    <th class="text-center" style="width: 80px;">Stato</th>
                                    <th class="text-center" style="width: 60px;">Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="tbodyEnti">
                                <!-- Generato via JavaScript -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Form rapido aggiungi nuovo EPS -->
                    <div class="p-3 border rounded-3 bg-light">
                        <h6 class="fw-bold small mb-2 text-primary d-flex align-items-center gap-1">
                            <i class="bi bi-plus-circle"></i> Aggiungi un altro Ente di Promozione Sportiva (EPS)
                        </h6>
                        <div class="row g-2 align-items-end">
                            <div class="col-md-3">
                                <label class="form-label small fw-semibold mb-1">Sigla (es. UISP, AICS)</label>
                                <input type="text" class="form-control form-control-sm text-uppercase" id="newEpsSigla" placeholder="Es. UISP" list="eps-suggestions">
                                <datalist id="eps-suggestions">
                                    <option value="UISP">Unione Italiana Sport Per tutti</option>
                                    <option value="AICS">Associazione Italiana Cultura Sport</option>
                                    <option value="CSEN">Centro Sportivo Educativo Nazionale</option>
                                    <option value="PGS">Polisportive Giovanili Salesiane</option>
                                    <option value="ACSI">Associazione Centri Sportivi Italiani</option>
                                    <option value="CSI">Centro Sportivo Italiano</option>
                                </datalist>
                            </div>
                            <div class="col-md-5">
                                <label class="form-label small fw-semibold mb-1">Denominazione Estesa (Opzionale)</label>
                                <input type="text" class="form-control form-control-sm" id="newEpsNome" placeholder="Es. Unione Italiana Sport Per tutti - Pattinaggio">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-semibold mb-1">Codice Affiliazione *</label>
                                <input type="text" class="form-control form-control-sm font-monospace" id="newEpsCodice" placeholder="Es. UISP-RM-8492">
                            </div>
                            <div class="col-md-1">
                                <button type="button" class="btn btn-primary btn-sm w-100" onclick="aggiungiNuovoEps()" title="Aggiungi EPS">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-light px-4 py-3 d-flex justify-content-between align-items-center">
                    <span class="text-muted small">Tutti i dati aggiornati compaiono in tempo reale sui moduli di stampa.</span>
                    <button type="submit" class="btn btn-primary fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-2">
                        <i class="bi bi-check-lg"></i> Salva Modifiche Associazione
                    </button>
                </div>
            </div>
        </form>
    </div>

    <!-- COLONNA DESTRA: Anteprima Carta Intestata & Test Stampe -->
    <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white mb-4 sticky-top" style="top: 20px;">
            <div class="card-header bg-primary text-white py-3 px-4 rounded-top-4">
                <h5 class="card-title fw-bold mb-0 d-flex align-items-center gap-2">
                    <i class="bi bi-file-earmark-text-fill"></i> Anteprima Carta Intestata (Documenti Ufficiali)
                </h5>
            </div>
            <div class="card-body p-4 bg-white">
                <!-- Carta Intestata Box -->
                <div class="border border-2 rounded-3 p-3 bg-light shadow-sm mb-4" id="boxCartaIntestata">
                    <div class="d-flex align-items-start justify-content-between border-bottom pb-3 mb-3">
                        <div>
                            <div class="badge bg-primary text-uppercase mb-1" id="previewDisciplina" style="font-size: 0.7rem;">
                                <?= htmlspecialchars($disciplina) ?>
                            </div>
                            <h5 class="fw-bold text-primary mb-1 text-uppercase" id="previewDenominazione">
                                <?= htmlspecialchars($ass['denominazione']) ?>
                            </h5>
                            <div class="text-muted small lh-sm">
                                <div id="previewIndirizzo">
                                    <?= htmlspecialchars($ass['indirizzo']) ?>, <?= htmlspecialchars($ass['cap']) ?> <?= htmlspecialchars($ass['comune']) ?> (<?= htmlspecialchars($ass['provincia']) ?>)
                                </div>
                                <div class="mt-1">
                                    <strong>C.F.:</strong> <span id="previewCf"><?= htmlspecialchars($ass['codice_fiscale']) ?></span>
                                    <span id="previewPivaWrap" class="<?= !empty($ass['partita_iva']) ? '' : 'd-none' ?>">
                                        | <strong>P.IVA:</strong> <span id="previewPiva"><?= htmlspecialchars($ass['partita_iva'] ?? '') ?></span>
                                    </span>
                                </div>
                                <div class="mt-1">
                                    <strong>Legale Rappresentante:</strong> <span id="previewPresidente"><?= htmlspecialchars($ass['legale_rappresentante']) ?></span>
                                </div>
                                <div class="mt-1 text-danger fw-semibold">
                                    <i class="bi bi-trophy-fill me-1"></i>
                                    FISR: <span id="previewFisr"><?= htmlspecialchars($codiceFisr) ?></span>
                                </div>
                                <div class="mt-1 text-primary" id="previewEpsWrap">
                                    <strong>EPS Affiliati:</strong> <span id="previewEpsText">UISP • AICS</span>
                                </div>
                            </div>
                        </div>
                        <i class="bi bi-award-fill text-warning fs-1"></i>
                    </div>

                    <div class="bg-white p-2 rounded border small text-muted text-center fst-italic">
                        Questa intestazione compare in cima a tutte le ricevute, domande di iscrizione e lettere mediche.
                    </div>

                    <div class="mt-3 pt-2 d-flex justify-content-between align-items-center border-top">
                        <div class="small text-muted">
                            Firma: <strong id="previewFirmaPresidente"><?= htmlspecialchars($ass['legale_rappresentante']) ?></strong>
                        </div>
                        <span class="badge bg-success">Configurato</span>
                    </div>
                </div>

                <!-- Bottoni di Apertura Stampa / Download PDF Diretto -->
                <div>
                    <label class="fw-bold small text-uppercase text-muted d-block mb-2">
                        Testa e stampa i 3 documenti con questi dati:
                    </label>
                    <div class="d-flex flex-column gap-2">
                        <button type="button" class="btn btn-outline-success text-start d-flex align-items-center justify-content-between p-3 rounded-3" data-bs-toggle="modal" data-bs-target="#modalTestRicevuta">
                            <div>
                                <div class="fw-bold text-success d-flex align-items-center gap-2">
                                    <i class="bi bi-receipt-cutoff fs-5"></i> 1. Ricevuta di Pagamento
                                </div>
                                <small class="text-muted">Quota corsi su rotelle, tesseramento federale FISR ed EPS</small>
                            </div>
                            <span class="badge bg-success text-white">Stampa / PDF</span>
                        </button>

                        <button type="button" class="btn btn-outline-primary text-start d-flex align-items-center justify-content-between p-3 rounded-3" data-bs-toggle="modal" data-bs-target="#modalTestIscrizione">
                            <div>
                                <div class="fw-bold text-primary d-flex align-items-center gap-2">
                                    <i class="bi bi-person-lines-fill fs-5"></i> 2. Domanda Iscrizione e Tesseramento FISR/EPS
                                </div>
                                <small class="text-muted">Modulo socio con dati genitore, privacy e disciplina rotelle</small>
                            </div>
                            <span class="badge bg-primary text-white">Stampa / PDF</span>
                        </button>

                        <button type="button" class="btn btn-outline-danger text-start d-flex align-items-center justify-content-between p-3 rounded-3" data-bs-toggle="modal" data-bs-target="#modalTestVisitaMedica">
                            <div>
                                <div class="fw-bold text-danger d-flex align-items-center gap-2">
                                    <i class="bi bi-heart-pulse-fill fs-5"></i> 3. Richiesta di Certificato Medico
                                </div>
                                <small class="text-muted">Per medico/pediatra: Non agonistico (ECG) o Agonistico Tab. B1 FISR</small>
                            </div>
                            <span class="badge bg-danger text-white">Stampa / PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================================== -->
<!-- MODALI PER ANTEPRIMA E STAMPA DEI 3 DOCUMENTI UFFICIALI -->
<!-- ============================================================================== -->

<!-- 1. MODAL: TEST RICEVUTA DI PAGAMENTO -->
<div class="modal fade" id="modalTestRicevuta" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-success text-white">
                <h5 class="modal-title fw-bold"><i class="bi bi-receipt me-2"></i>1. Ricevuta di Pagamento Ufficiale</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 bg-white" id="printAreaRicevuta">
                <!-- Intestazione -->
                <div class="border-bottom pb-3 mb-3 d-flex justify-content-between align-items-start">
                    <div>
                        <div class="badge bg-primary text-uppercase mb-1 modal-print-disciplina"><?= htmlspecialchars($disciplina) ?></div>
                        <h4 class="fw-bold text-primary mb-1 modal-print-denominazione"><?= htmlspecialchars($ass['denominazione']) ?></h4>
                        <div class="small text-muted modal-print-sede"><?= htmlspecialchars($ass['indirizzo']) ?>, <?= htmlspecialchars($ass['cap']) ?> <?= htmlspecialchars($ass['comune']) ?> (<?= htmlspecialchars($ass['provincia']) ?>)</div>
                        <div class="small text-muted">C.F.: <span class="modal-print-cf"><?= htmlspecialchars($ass['codice_fiscale']) ?></span> | Tel: <span class="modal-print-tel"><?= htmlspecialchars($ass['telefono'] ?? '-') ?></span></div>
                        <div class="small text-danger fw-semibold">Affiliazione Federale: <span class="modal-print-fisr"><?= htmlspecialchars($codiceFisr) ?></span></div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success fs-6 px-3 py-2">RICEVUTA N. 2024/001</span>
                        <div class="small text-muted mt-1">Data: <?= date('d/m/Y') ?></div>
                    </div>
                </div>

                <!-- Dati Pagatore -->
                <div class="p-3 bg-light rounded-3 mb-3 border">
                    <h6 class="fw-bold text-dark mb-2">Ricevuto Da:</h6>
                    <div class="row g-2 small">
                        <div class="col-sm-6"><strong>Atleta / Socio:</strong> Rossi Marco</div>
                        <div class="col-sm-6"><strong>Codice Fiscale:</strong> RSSMRC12A01H501Z</div>
                        <div class="col-sm-6"><strong>Tutore Legale:</strong> Rossi Giuseppe (Padre)</div>
                        <div class="col-sm-6"><strong>Numero Tessera:</strong> TESS-2024-001</div>
                    </div>
                </div>

                <!-- Dettaglio Quota -->
                <table class="table table-bordered mb-3">
                    <thead class="table-light small">
                        <tr>
                            <th>Descrizione della Prestazione / Quota Istituzionale</th>
                            <th class="text-end" style="width: 120px;">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>Quota Corso Mensile e Tesseramento Federale</strong>
                                <div class="small text-muted">Corso Pattinaggio Artistico - Mese di Ottobre. Operazione istituzionale de-commercializzata ex art. 148 TUIR e D.Lgs 36/2021.</div>
                            </td>
                            <td class="text-end fw-bold text-success fs-6">€ 60,00</td>
                        </tr>
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <th class="text-end">TOTALE INCASSATO:</th>
                            <th class="text-end text-success fs-5">€ 60,00</th>
                        </tr>
                    </tfoot>
                </table>

                <div class="small text-muted mb-4">
                    Metodo di pagamento: <strong>Contanti / POS</strong> • Esente IVA ex art. 4 D.P.R. 633/1972 e s.m.i.
                </div>

                <!-- Firma -->
                <div class="row pt-3 border-top mt-4">
                    <div class="col-6">
                        <small class="text-muted d-block">Timbro della Società</small>
                        <div class="border rounded p-3 text-center text-muted small mt-1" style="height: 70px;">Timbro A.S.D.</div>
                    </div>
                    <div class="col-6 text-end">
                        <small class="text-muted d-block">Firma del Legale Rappresentante</small>
                        <div class="fw-bold mt-4 modal-print-presidente"><?= htmlspecialchars($ass['legale_rappresentante']) ?></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                <button type="button" class="btn btn-success fw-bold" onclick="stampaElemento('printAreaRicevuta')">
                    <i class="bi bi-printer me-1"></i> Stampa Ricevuta
                </button>
            </div>
        </div>
    </div>
</div>

<!-- 2. MODAL: TEST DOMANDA ISCRIZIONE -->
<div class="modal fade" id="modalTestIscrizione" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title fw-bold"><i class="bi bi-person-lines-fill me-2"></i>2. Domanda di Ammissione a Socio e Tesseramento FISR / EPS</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 bg-white" id="printAreaIscrizione">
                <!-- Intestazione -->
                <div class="border-bottom pb-3 mb-3 text-center">
                    <div class="badge bg-primary text-uppercase mb-1 modal-print-disciplina"><?= htmlspecialchars($disciplina) ?></div>
                    <h3 class="fw-bold text-primary mb-0 modal-print-denominazione"><?= htmlspecialchars($ass['denominazione']) ?></h3>
                    <div class="small text-muted modal-print-sede"><?= htmlspecialchars($ass['indirizzo']) ?> - <?= htmlspecialchars($ass['cap']) ?> <?= htmlspecialchars($ass['comune']) ?> (<?= htmlspecialchars($ass['provincia']) ?>) • C.F. <span class="modal-print-cf"><?= htmlspecialchars($ass['codice_fiscale']) ?></span></div>
                    <div class="small text-muted">Affiliata a: <strong class="modal-print-fisr"><?= htmlspecialchars($codiceFisr) ?></strong> • Registro RASD: <strong><?= htmlspecialchars($registroRasd) ?></strong></div>
                </div>

                <h4 class="fw-bold text-center text-dark my-3">DOMANDA DI ISCRIZIONE E TESSERAMENTO SPORTIVO</h4>

                <p class="small text-justify mb-3">
                    Il/La sottoscritto/a, in proprio o in qualità di genitore/tutore legale dell'atleta minorenne, chiede l'ammissione a socio dell'associazione 
                    <strong class="modal-print-denominazione"><?= htmlspecialchars($ass['denominazione']) ?></strong> e il contestuale tesseramento per la stagione sportiva in corso 
                    per la disciplina di <strong class="modal-print-disciplina"><?= htmlspecialchars($disciplina) ?></strong> presso la 
                    <strong>FISR</strong> e gli Enti di Promozione Sportiva riconosciuti dal CONI/CIP.
                </p>

                <div class="border rounded p-3 mb-3 bg-light small">
                    <h6 class="fw-bold text-dark border-bottom pb-1">Dati Anagrafici Atleta:</h6>
                    <div class="row g-2">
                        <div class="col-4">Cognome e Nome: <strong>Rossi Marco</strong></div>
                        <div class="col-4">Nato a: <strong>Roma</strong> il <strong>12/05/2012</strong></div>
                        <div class="col-4">Codice Fiscale: <strong>RSSMRC12A01H501Z</strong></div>
                        <div class="col-6">Residenza: <strong>Via Appia Nuova, 120 - Roma</strong></div>
                        <div class="col-6">Telefono Referente: <strong>338 1234567</strong></div>
                    </div>
                </div>

                <div class="border rounded p-3 mb-3 bg-light small">
                    <h6 class="fw-bold text-dark border-bottom pb-1">Dichiarazione Tutore Minorenne:</h6>
                    <p class="mb-0">
                        Il sottoscritto <strong>Rossi Giuseppe</strong>, in qualità di <strong>Padre</strong>, autorizza la partecipazione alle attività sportive e si impegna a fornire tempestivamente il certificato medico di idoneità in corso di validità.
                    </p>
                </div>

                <div class="border rounded p-3 mb-4 bg-light small">
                    <h6 class="fw-bold text-dark border-bottom pb-1">Informativa Privacy e Diritti di Immagine (GDPR UE 2016/679):</h6>
                    <p class="mb-0 text-muted" style="font-size: 0.8rem;">
                        I dati personali saranno trattati per la gestione del rapporto associativo, assicurativo e federale. Si autorizza la pubblicazione di foto/video relativi alle esibizioni sportive sui canali istituzionali dell'ente.
                    </p>
                </div>

                <div class="row pt-3 border-top mt-4">
                    <div class="col-6">
                        <small class="text-muted d-block">Luogo e Data</small>
                        <div class="fw-bold mt-2"><?= htmlspecialchars($ass['comune']) ?>, <?= date('d/m/Y') ?></div>
                    </div>
                    <div class="col-6 text-end">
                        <small class="text-muted d-block">Firma del Genitore / Socio</small>
                        <div class="border-bottom mx-auto mt-4" style="width: 200px;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                <button type="button" class="btn btn-primary fw-bold" onclick="stampaElemento('printAreaIscrizione')">
                    <i class="bi bi-printer me-1"></i> Stampa Domanda
                </button>
            </div>
        </div>
    </div>
</div>

<!-- 3. MODAL: TEST RICHIESTA CERTIFICATO MEDICO -->
<div class="modal fade" id="modalTestVisitaMedica" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title fw-bold"><i class="bi bi-heart-pulse me-2"></i>3. Richiesta Certificato Medico Ufficiale</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 bg-white" id="printAreaVisitaMedica">
                <!-- Intestazione -->
                <div class="border-bottom pb-3 mb-4">
                    <div class="badge bg-primary text-uppercase mb-1 modal-print-disciplina"><?= htmlspecialchars($disciplina) ?></div>
                    <h3 class="fw-bold text-primary mb-0 modal-print-denominazione"><?= htmlspecialchars($ass['denominazione']) ?></h3>
                    <div class="small text-muted modal-print-sede"><?= htmlspecialchars($ass['indirizzo']) ?> - <?= htmlspecialchars($ass['cap']) ?> <?= htmlspecialchars($ass['comune']) ?> (<?= htmlspecialchars($ass['provincia']) ?>)</div>
                    <div class="small text-muted">C.F. <span class="modal-print-cf"><?= htmlspecialchars($ass['codice_fiscale']) ?></span> • FISR: <strong class="modal-print-fisr"><?= htmlspecialchars($codiceFisr) ?></strong></div>
                </div>

                <div class="text-end mb-4">
                    <p class="mb-0 small text-muted"><?= htmlspecialchars($ass['comune']) ?>, <?= date('d/m/Y') ?></p>
                    <p class="fw-bold mb-0">Al Chiar.mo Medico Curante / Pediatra di Libera Scelta</p>
                    <p class="small text-muted">o Specialista in Medicina dello Sport</p>
                </div>

                <h5 class="fw-bold text-dark mb-3">OGGETTO: Richiesta di Certificato Medico di Idoneità all'Attività Sportiva</h5>

                <p class="small text-justify mb-3">
                    Con la presente, la scrivente <strong><span class="modal-print-denominazione"><?= htmlspecialchars($ass['denominazione']) ?></span></strong>, affiliata alla 
                    <strong>Federazione Italiana Sport Rotellistici (FISR)</strong> e agli Enti di Promozione Sportiva riconosciuti dal CONI, 
                    chiede il rilascio del certificato di idoneità all'attività sportiva per il proprio tesserato:
                </p>

                <div class="p-3 bg-light rounded-3 border mb-4">
                    <div class="row g-2 small">
                        <div class="col-sm-6">Cognome e Nome: <strong>Rossi Marco</strong></div>
                        <div class="col-sm-6">Codice Fiscale: <strong>RSSMRC12A01H501Z</strong></div>
                        <div class="col-sm-6">Nato/a il: <strong>12/05/2012</strong></div>
                        <div class="col-sm-6">Disciplina: <strong class="modal-print-disciplina"><?= htmlspecialchars($disciplina) ?></strong></div>
                    </div>
                </div>

                <h6 class="fw-bold text-dark mb-2">Tipologia di Visita Richiesta:</h6>
                <div class="p-3 border rounded-3 mb-4 small">
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="tipoVisitaDemo" checked id="visita1">
                        <label class="form-check-label fw-bold" for="visita1">
                            Attività Sportiva NON Agonistica (D.M. 24/04/2013 e s.m.i.)
                        </label>
                        <small class="text-muted d-block">Comprensivo di esame obiettivo, misurazione pressione ed elettrocardiogramma (ECG) a riposo.</small>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="tipoVisitaDemo" id="visita2">
                        <label class="form-check-label fw-bold" for="visita2">
                            Attività Sportiva AGONISTICA (D.M. 18/02/1982 - Tabella B1 FISR Pattinaggio)
                        </label>
                        <small class="text-muted d-block">Visita specialistica di medicina dello sport con ECG sotto sforzo, spirometria ed esame urine.</small>
                    </div>
                </div>

                <div class="row pt-4 border-top mt-4">
                    <div class="col-6">
                        <small class="text-muted d-block">Timbro della Società</small>
                        <div class="border rounded p-3 text-center text-muted small mt-1" style="height: 70px;">Timbro A.S.D.</div>
                    </div>
                    <div class="col-6 text-end">
                        <small class="text-muted d-block">Il Presidente / Legale Rappresentante</small>
                        <div class="fw-bold mt-4 modal-print-presidente"><?= htmlspecialchars($ass['legale_rappresentante']) ?></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                <button type="button" class="btn btn-danger fw-bold" onclick="stampaElemento('printAreaVisitaMedica')">
                    <i class="bi bi-printer me-1"></i> Stampa Richiesta
                </button>
            </div>
        </div>
    </div>
</div>

<script>
// Stato enti affiliati
var entiList = <?= json_encode($entiAffiliati) ?>;

function renderTabellaEnti() {
    var tbody = document.getElementById('tbodyEnti');
    if (!tbody) return;
    tbody.innerHTML = '';

    entiList.forEach(function(ente, index) {
        var tr = document.createElement('tr');
        if (ente.attivo === false) {
            tr.className = 'table-secondary opacity-75';
        }

        var isFsn = ente.tipo === 'FSN';
        var badgeTipo = isFsn ? '<span class="badge bg-danger">FSN</span>' : '<span class="badge bg-primary">EPS</span>';

        tr.innerHTML = 
            '<td>' + badgeTipo + '</td>' +
            '<td class="fw-bold">' + escapeHtml(ente.sigla) + '</td>' +
            '<td class="small text-muted">' + escapeHtml(ente.denominazione_estesa || '—') + '</td>' +
            '<td>' +
                '<input type="text" class="form-control form-control-sm font-monospace" value="' + escapeHtml(ente.codice_societa || '') + '" onchange="aggiornaCodiceEnte(' + index + ', this.value)">' +
            '</td>' +
            '<td class="text-center">' +
                '<button type="button" class="btn btn-sm py-0 px-2 ' + (ente.attivo !== false ? 'btn-success' : 'btn-outline-secondary') + '" onclick="toggleStatoEnte(' + index + ')">' +
                    (ente.attivo !== false ? 'Attivo' : 'Off') +
                '</button>' +
            '</td>' +
            '<td class="text-center">' +
                (!isFsn ? '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" onclick="rimuoviEnte(' + index + ')" title="Elimina"><i class="bi bi-trash"></i></button>' : '<span class="text-muted small">—</span>') +
            '</td>';

        tbody.appendChild(tr);
    });

    // Sincronizza input hidden
    var hidden = document.getElementById('inputEntiJson');
    if (hidden) {
        hidden.value = JSON.stringify(entiList);
    }

    aggiornaAnteprimaLive();
}

function toggleStatoEnte(idx) {
    if (entiList[idx]) {
        entiList[idx].attivo = (entiList[idx].attivo === false) ? true : false;
        renderTabellaEnti();
    }
}

function aggiornaCodiceEnte(idx, val) {
    if (entiList[idx]) {
        entiList[idx].codice_societa = val.trim();
        var hidden = document.getElementById('inputEntiJson');
        if (hidden) hidden.value = JSON.stringify(entiList);
    }
}

function rimuoviEnte(idx) {
    if (confirm('Rimuovere questo ente di promozione sportiva affiliato?')) {
        entiList.splice(idx, 1);
        renderTabellaEnti();
    }
}

function aggiungiNuovoEps() {
    var siglaInput = document.getElementById('newEpsSigla');
    var nomeInput = document.getElementById('newEpsNome');
    var codiceInput = document.getElementById('newEpsCodice');

    var sigla = siglaInput.value.trim().toUpperCase();
    var nome = nomeInput.value.trim();
    var codice = codiceInput.value.trim();

    if (!sigla || !codice) {
        alert('Specificare almeno la Sigla (es. UISP, AICS) e il Codice di Affiliazione dell\'ente.');
        return;
    }

    var nuovo = {
        id: 'eps-' + Date.now(),
        tipo: 'EPS',
        sigla: sigla,
        denominazione_estesa: nome || undefined,
        codice_societa: codice,
        attivo: true
    };

    entiList.push(nuovo);
    siglaInput.value = '';
    nomeInput.value = '';
    codiceInput.value = '';

    renderTabellaEnti();
}

function aggiornaAnteprimaLive() {
    var disc = document.getElementById('fieldDisciplina').value || 'Pattinaggio Artistico a Rotelle';
    var denom = document.getElementById('fieldDenominazione').value || 'A.S.D. Polisportiva Aurora';
    var cf = document.getElementById('fieldCf').value || '97854120584';
    var piva = document.getElementById('fieldPiva').value || '';
    var pres = document.getElementById('fieldPresidente').value || 'Alessandro Bianchi';
    var ind = document.getElementById('fieldIndirizzo').value || 'Via dello Sport, 24';
    var cap = document.getElementById('fieldCap').value || '00153';
    var com = document.getElementById('fieldComune').value || 'Roma';
    var prov = document.getElementById('fieldProv').value || 'RM';
    var fisr = document.getElementById('fieldCodiceFisr').value || 'FISR n. 3942';

    // Badge disciplina
    var bD = document.getElementById('badgeDisciplina');
    if (bD) bD.textContent = disc;

    // Box anteprima
    setText('previewDisciplina', disc);
    setText('previewDenominazione', denom);
    setText('previewIndirizzo', ind + ', ' + cap + ' ' + com + ' (' + prov.toUpperCase() + ')');
    setText('previewCf', cf.toUpperCase());
    setText('previewPresidente', pres);
    setText('previewFirmaPresidente', pres);
    setText('previewFisr', fisr);

    var pivaWrap = document.getElementById('previewPivaWrap');
    if (pivaWrap) {
        if (piva) {
            pivaWrap.classList.remove('d-none');
            setText('previewPiva', piva);
        } else {
            pivaWrap.classList.add('d-none');
        }
    }

    // EPS attivi
    var epsAttivi = entiList.filter(function(e) { return e.tipo === 'EPS' && e.attivo !== false; });
    var epsWrap = document.getElementById('previewEpsWrap');
    if (epsWrap) {
        if (epsAttivi.length > 0) {
            epsWrap.classList.remove('d-none');
            setText('previewEpsText', epsAttivi.map(function(e) { return e.sigla; }).join(' • '));
        } else {
            epsWrap.classList.add('d-none');
        }
    }

    // Aggiorna anche testi nei modali di stampa
    setAllText('.modal-print-disciplina', disc);
    setAllText('.modal-print-denominazione', denom);
    setAllText('.modal-print-sede', ind + ', ' + cap + ' ' + com + ' (' + prov.toUpperCase() + ')');
    setAllText('.modal-print-cf', cf.toUpperCase());
    setAllText('.modal-print-presidente', pres);
    setAllText('.modal-print-fisr', fisr);
}

function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
}

function setAllText(selector, txt) {
    var els = document.querySelectorAll(selector);
    els.forEach(function(el) { el.textContent = txt; });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function stampaElemento(id) {
    var content = document.getElementById(id);
    if (!content) return;
    
    var win = window.open('', '', 'width=900,height=700');
    win.document.write('<!DOCTYPE html><html><head><title>Stampa Documento</title>');
    win.document.write('<link href="assets/css/bootstrap.min.css" rel="stylesheet">');
    win.document.write('<style>body{padding:25px;background:#fff;} @media print{button{display:none;}}</style>');
    win.document.write('</head><body>');
    win.document.write(content.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(function() {
        win.print();
        win.close();
    }, 400);
}

document.addEventListener('DOMContentLoaded', function() {
    renderTabellaEnti();
});
</script>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
