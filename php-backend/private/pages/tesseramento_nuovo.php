<?php
/**
 * Pagina Dedicata: Nuovo Tesseramento Atleta / Socio
 * Posizione: /private/pages/tesseramento_nuovo.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$preselectedPersonaId = isset($_GET['persona_id']) ? (int)$_GET['persona_id'] : 0;
$annoIdAttivo = $annoAttivo['id'] ?? 1;

// Recupero anagrafiche e anni
$elencoPersone = $db->query("SELECT id, nome, cognome, codice_fiscale, is_minorenne, tutore_nome, tutore_cognome FROM persone ORDER BY cognome ASC, nome ASC")->fetchAll();
$elencoAnni = $db->query("SELECT id, anno, attivo FROM anno ORDER BY id DESC")->fetchAll();
$elencoGruppi = $db->prepare("SELECT id, nome_gruppo, categoria, quota_mensile FROM gruppi WHERE anno_id = ? ORDER BY nome_gruppo ASC");
$elencoGruppi->execute([$annoIdAttivo]);
$gruppi = $elencoGruppi->fetchAll();

// Conteggio per numero tessera progressivo
$countTess = $db->query("SELECT COUNT(*) FROM tesserati")->fetchColumn();
$nextNum = $countTess + 1;
$annoStr = !empty($annoAttivo['anno']) ? explode('/', $annoAttivo['anno'])[0] : date('Y');
$numeroTesseraDefault = "TESS-{$annoStr}-" . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
$dataScadenzaMedicaDefault = date('Y-m-d', strtotime('+1 year'));
?>

<!-- Breadcrumb -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="index.php?page=tesserati" class="text-decoration-none">Tesserati</a></li>
        <li class="breadcrumb-item active" aria-current="page">Nuovo Tesseramento</li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-card-checklist text-primary me-2"></i>
            Nuovo Tesseramento Sportivo
        </h2>
        <p class="text-muted small mb-0">
            Associa un atleta all'anno sportivo <strong><?= htmlspecialchars($annoAttivo['anno'] ?? 'Corrente') ?></strong>, assegna il numero di tessera e la copertura assicurativa
        </p>
    </div>
    <div>
        <a href="index.php?page=tesserati" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Annulla e Torna all'Elenco
        </a>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-9 col-xl-8">
        <form method="POST" action="index.php?action=salva_tesseramento">
            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-person-badge text-primary me-2"></i> Dati del Tesseramento Federale / Sociale
                    </h5>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                        Stagione <?= htmlspecialchars($annoAttivo['anno'] ?? '') ?>
                    </span>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Selezione Persona con pulsante rapido nuova persona -->
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <label class="form-label fw-bold mb-0">Atleta da Tesserare <span class="text-danger">*</span></label>
                                <a href="index.php?page=persona_nuova" class="small text-decoration-none fw-semibold">
                                    <i class="bi bi-person-plus-fill me-1"></i> + Registra Nuova Persona
                                </a>
                            </div>
                            <select name="persona_id" class="form-select form-select-lg" required>
                                <option value="">-- Seleziona Persona dall'Anagrafica --</option>
                                <?php foreach ($elencoPersone as $p): ?>
                                    <option value="<?= $p['id'] ?>" <?= ($p['id'] == $preselectedPersonaId ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?> (CF: <?= htmlspecialchars($p['codice_fiscale']) ?>)
                                        <?= !empty($p['is_minorenne']) ? ' - [Minorenne]' : '' ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="form-text small">Se l'atleta non è presente nell'elenco, registralo prima nell'anagrafica.</div>
                        </div>

                        <!-- Anno Sportivo -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Anno Sportivo di Riferimento <span class="text-danger">*</span></label>
                            <select name="anno_id" class="form-select" required>
                                <?php foreach ($elencoAnni as $a): ?>
                                    <option value="<?= $a['id'] ?>" <?= (!empty($a['attivo']) ? 'selected' : '') ?>>
                                        Stagione <?= htmlspecialchars($a['anno']) ?> <?= (!empty($a['attivo']) ? '(Attivo)' : '') ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <!-- Numero Tessera -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Numero di Tessera Sociale / FISR <span class="text-danger">*</span></label>
                            <input type="text" name="numero_tessera" class="form-control font-monospace fw-bold"
                                   value="<?= htmlspecialchars($numeroTesseraDefault) ?>" required>
                            <div class="form-text small">Generato progressivo automatico, modificabile con numero federale FISR.</div>
                        </div>

                        <!-- Data Tesseramento -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Emissione Tesseramento <span class="text-danger">*</span></label>
                            <input type="date" name="data_tesseramento" class="form-control" value="<?= date('Y-m-d') ?>" required>
                        </div>

                        <!-- Tipo Tesseramento -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Tipologia Tesseramento <span class="text-danger">*</span></label>
                            <select name="tipo_tesseramento" class="form-select" required>
                                <option value="Agonista">Agonista (Gare e Campionati Federali)</option>
                                <option value="Non Agonista" selected>Non Agonista (Attività Formativa e Corsi)</option>
                                <option value="Promozionale">Promozionale / Avviamento</option>
                                <option value="Socio / Dirigente">Socio / Dirigente / Tecnico</option>
                            </select>
                        </div>

                        <!-- Scadenza Certificato Medico -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Scadenza Certificato Medico</label>
                            <input type="date" name="certificato_medico_scadenza" class="form-control" value="<?= $dataScadenzaMedicaDefault ?>">
                            <div class="form-text small">Impostata a 1 anno per monitorare le scadenze e gli avvisi automatici.</div>
                        </div>

                        <!-- Stato Tesseramento -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Stato Iniziale</label>
                            <select name="stato" class="form-select">
                                <option value="Attivo" selected>Attivo (Regolare)</option>
                                <option value="Sospeso">Sospeso (In attesa di visita o documenti)</option>
                                <option value="Scaduto">Scaduto</option>
                            </select>
                        </div>

                        <!-- Opzionale: Iscrizione Immediata a un Gruppo / Corso -->
                        <?php if (!empty($gruppi)): ?>
                            <div class="col-12">
                                <div class="p-3 bg-light rounded-3 border">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="chkIscriviGruppo" onchange="document.getElementById('boxGruppo').classList.toggle('d-none', !this.checked)">
                                        <label class="form-check-label fw-bold text-dark" for="chkIscriviGruppo">
                                            <i class="bi bi-diagram-3-fill text-primary me-1"></i> Iscrivi subito l'atleta a un Gruppo / Corso
                                        </label>
                                    </div>
                                    <div id="boxGruppo" class="d-none mt-2">
                                        <label class="form-label small fw-semibold">Seleziona Corso:</label>
                                        <select name="gruppo_id" class="form-select form-select-sm">
                                            <option value="">-- Nessun gruppo al momento --</option>
                                            <?php foreach ($gruppi as $g): ?>
                                                <option value="<?= $g['id'] ?>">
                                                    <?= htmlspecialchars($g['nome_gruppo']) ?> (<?= htmlspecialchars($g['categoria']) ?>) - € <?= number_format($g['quota_mensile'], 2) ?>/mese
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                        <div class="form-text small text-muted">L'iscrizione calcolerà automaticamente le rate mensili del corso.</div>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center">
                    <a href="index.php?page=tesserati" class="btn btn-light border px-4">Annulla</a>
                    <button type="submit" class="btn btn-primary fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i> Conferma e Registra Tesseramento
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
