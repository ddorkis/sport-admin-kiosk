<?php
/**
 * Pagina Dedicata: Inserimento / Modifica Persona & Tutore Minorenni
 * Posizione: /private/pages/persona_nuova.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$persona = null;
$isEditing = false;

if ($id > 0) {
    $stmt = $db->prepare("SELECT * FROM persone WHERE id = ?");
    $stmt->execute([$id]);
    $persona = $stmt->fetch();
    if ($persona) {
        $isEditing = true;
    }
}

// Calcolo età iniziale
$etaIniziale = null;
$isMinorenneIniziale = false;
if (!empty($persona['data_nascita'])) {
    $bday = new DateTime($persona['data_nascita']);
    $today = new DateTime();
    $diff = $today->diff($bday);
    $etaIniziale = $diff->y;
    $isMinorenneIniziale = ($etaIniziale < 18);
}
?>

<div class="container-fluid py-2" style="max-width: 1200px;">
    <!-- Intestazione Pagina con Breadcrumb e Azioni Rapide -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 pb-3 border-bottom">
        <div>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1 text-muted small">
                    <li class="breadcrumb-item">
                        <a href="index.php?page=persone" class="text-decoration-none text-muted">
                            <i class="bi bi-people me-1"></i> Anagrafica Persone
                        </a>
                    </li>
                    <li class="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                        <?= $isEditing ? 'Modifica Anagrafica: ' . htmlspecialchars($persona['cognome'] . ' ' . $persona['nome']) : 'Inserimento Nuova Persona' ?>
                    </li>
                </ol>
            </nav>
            <div class="d-flex align-items-center">
                <a href="index.php?page=persone" class="btn btn-outline-secondary btn-sm me-3 rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 38px; height: 38px;" title="Torna all'elenco persone">
                    <i class="bi bi-arrow-left fs-5"></i>
                </a>
                <div>
                    <h1 class="h3 fw-bold mb-0 text-dark">
                        <?= $isEditing ? 'Modifica Scheda Anagrafica #' . $persona['id'] : 'Nuova Scheda Anagrafica Atleta / Tesserato' ?>
                    </h1>
                    <p class="text-muted small mb-0">
                        <?= $isEditing 
                            ? 'Aggiorna i recapiti, indirizzo, note o dati del tutore legale. I cambiamenti saranno subito attivi.' 
                            : 'Inserisci i dati anagrafici completi. Al salvataggio verrai reindirizzato direttamente all\'elenco o al tesseramento.' ?>
                    </p>
                </div>
            </div>
        </div>

        <div class="d-flex align-items-center gap-2">
            <a href="index.php?page=persone" class="btn btn-outline-secondary px-3">
                <i class="bi bi-x-lg me-1"></i> Annulla
            </a>
            <button type="button" class="btn btn-primary fw-bold px-4 shadow-sm" onclick="document.getElementById('formPersona').submit();">
                <i class="bi bi-check-lg me-1"></i> <?= $isEditing ? 'Salva Modifiche' : 'Salva e Torna alla Lista' ?>
            </button>
        </div>
    </div>

    <!-- Form Anagrafica -->
    <form id="formPersona" method="POST" action="index.php?action=salva_persona">
        <?php if ($isEditing): ?>
            <input type="hidden" name="id" value="<?= $persona['id'] ?>">
        <?php endif; ?>
        <input type="hidden" name="is_minorenne" id="isMinorenneInput" value="<?= $isMinorenneIniziale ? '1' : '0' ?>">

        <div class="row g-4">
            <!-- Colonna Sinistra: Dati Atleta -->
            <div class="col-lg-7">
                <div class="card border-0 shadow-sm rounded-4 mb-4 bg-white">
                    <div class="card-header bg-white py-3 border-bottom">
                        <h5 class="card-title fw-bold mb-0 text-primary d-flex align-items-center">
                            <i class="bi bi-person-badge me-2 fs-5"></i> Dati Anagrafici Atleta
                        </h5>
                    </div>
                    <div class="card-body p-4">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Nome <span class="text-danger">*</span></label>
                                <input type="text" name="nome" class="form-control" placeholder="Es. Sofia" value="<?= htmlspecialchars($persona['nome'] ?? '') ?>" required <?= !$isEditing ? 'autofocus' : '' ?>>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Cognome <span class="text-danger">*</span></label>
                                <input type="text" name="cognome" class="form-control" placeholder="Es. Bianchi" value="<?= htmlspecialchars($persona['cognome'] ?? '') ?>" required>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Codice Fiscale <span class="text-danger">*</span></label>
                                <input type="text" name="codice_fiscale" id="codiceFiscaleInput" class="form-control text-uppercase font-monospace fw-bold" placeholder="16 caratteri alfanumerici" maxlength="16" value="<?= htmlspecialchars($persona['codice_fiscale'] ?? '') ?>" required>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Data di Nascita <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <input type="date" name="data_nascita" id="dataNascitaInput" class="form-control" value="<?= htmlspecialchars($persona['data_nascita'] ?? '') ?>" required onchange="aggiornaEtaETutore()">
                                    <span class="input-group-text bg-light fw-semibold small" id="ageContainer" style="<?= empty($persona['data_nascita']) ? 'display:none;' : '' ?>">
                                        <span id="ageBadge"><?= $etaIniziale !== null ? $etaIniziale . ' anni' : '' ?></span>
                                    </span>
                                </div>
                                <div class="mt-1">
                                    <span id="minorenneStatusBadge" class="badge <?= $isMinorenneIniziale ? 'bg-warning text-dark' : 'bg-success' ?> px-2 py-1" style="<?= empty($persona['data_nascita']) ? 'display:none;' : '' ?>">
                                        <?php if ($isMinorenneIniziale): ?>
                                            <i class="bi bi-shield-exclamation me-1"></i> Atleta Minorenne (Richiede Tutore Legale)
                                        <?php else: ?>
                                            <i class="bi bi-person-check me-1"></i> Atleta Maggiorenne
                                        <?php endif; ?>
                                    </span>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Luogo di Nascita</label>
                                <input type="text" name="luogo_nascita" class="form-control" placeholder="Es. Milano (MI)" value="<?= htmlspecialchars($persona['luogo_nascita'] ?? '') ?>">
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Città di Residenza</label>
                                <input type="text" name="citta" class="form-control" placeholder="Es. Monza (MB)" value="<?= htmlspecialchars($persona['citta'] ?? '') ?>">
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold text-dark">Indirizzo Residenza (Via, Piazza, N. Civico)</label>
                                <input type="text" name="indirizzo" class="form-control" placeholder="Es. Via Roma 42" value="<?= htmlspecialchars($persona['indirizzo'] ?? '') ?>">
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Telefono Atleta (se maggiorenne)</label>
                                <input type="tel" name="telefono" class="form-control" placeholder="Es. 333 1234567" value="<?= htmlspecialchars($persona['telefono'] ?? '') ?>">
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">Email Atleta</label>
                                <input type="email" name="email" class="form-control" placeholder="Es. sofia.bianchi@email.it" value="<?= htmlspecialchars($persona['email'] ?? '') ?>">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Note Aggiuntive -->
                <div class="card border-0 shadow-sm rounded-4 mb-4 bg-white">
                    <div class="card-header bg-white py-3 border-bottom">
                        <h6 class="card-title fw-bold mb-0 text-secondary">
                            <i class="bi bi-sticky me-2"></i> Note & Informazioni Speciali
                        </h6>
                    </div>
                    <div class="card-body p-4">
                        <textarea name="note" class="form-control" rows="3" placeholder="Eventuali annotazioni su taglia pattini, precedenti esperienze sportive, allergie o intolleranze..."><?= htmlspecialchars($persona['note'] ?? '') ?></textarea>
                    </div>
                </div>
            </div>

            <!-- Colonna Destra: Esercente Responsabilità Genitoriale -->
            <div class="col-lg-5">
                <div id="tutoreCard" class="card border-0 shadow-sm rounded-4 mb-4 bg-white <?= $isMinorenneIniziale ? 'border border-warning' : '' ?>">
                    <div id="tutoreHeader" class="card-header py-3 <?= $isMinorenneIniziale ? 'bg-warning-subtle text-dark border-bottom border-warning' : 'bg-white border-bottom' ?>">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="card-title fw-bold mb-0 d-flex align-items-center">
                                <i class="bi bi-shield-shaded me-2 text-warning fs-5"></i>
                                Tutore Legale / Genitore
                            </h5>
                            <span id="tutoreObbligatorioBadge" class="badge bg-warning text-dark fw-bold" style="<?= $isMinorenneIniziale ? '' : 'display:none;' ?>">Obbligatorio</span>
                        </div>
                        <small class="text-muted d-block mt-1">
                            Genitore o tutore legale per tesseramento sportivo e comunicazioni
                        </small>
                    </div>

                    <div class="card-body p-4">
                        <div id="tutoreMaggiorenneInfo" class="alert alert-light border small text-muted mb-3" style="<?= $isMinorenneIniziale ? 'display:none;' : '' ?>">
                            <i class="bi bi-info-circle me-1"></i> Se l'atleta è maggiorenne questa sezione può rimanere vuota.
                        </div>

                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label fw-semibold text-dark">Grado di Parentela / Relazione</label>
                                <select name="tutore_relazione" class="form-select">
                                    <option value="Genitore" <?= ($persona['tutore_relazione'] ?? '') === 'Genitore' ? 'selected' : '' ?>>Genitore</option>
                                    <option value="Madre" <?= ($persona['tutore_relazione'] ?? '') === 'Madre' ? 'selected' : '' ?>>Madre</option>
                                    <option value="Padre" <?= ($persona['tutore_relazione'] ?? '') === 'Padre' ? 'selected' : '' ?>>Padre</option>
                                    <option value="Tutore Legale" <?= ($persona['tutore_relazione'] ?? '') === 'Tutore Legale' ? 'selected' : '' ?>>Tutore Legale / Affidatario</option>
                                    <option value="Altro" <?= ($persona['tutore_relazione'] ?? '') === 'Altro' ? 'selected' : '' ?>>Altro Familiare</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">
                                    Nome Tutore <span class="text-danger tutore-req-star" style="<?= $isMinorenneIniziale ? '' : 'display:none;' ?>">*</span>
                                </label>
                                <input type="text" name="tutore_nome" id="tutoreNomeInput" class="form-control" placeholder="Es. Marco" value="<?= htmlspecialchars($persona['tutore_nome'] ?? '') ?>" <?= $isMinorenneIniziale ? 'required' : '' ?>>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold text-dark">
                                    Cognome Tutore <span class="text-danger tutore-req-star" style="<?= $isMinorenneIniziale ? '' : 'display:none;' ?>">*</span>
                                </label>
                                <input type="text" name="tutore_cognome" id="tutoreCognomeInput" class="form-control" placeholder="Es. Bianchi" value="<?= htmlspecialchars($persona['tutore_cognome'] ?? '') ?>" <?= $isMinorenneIniziale ? 'required' : '' ?>>
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold text-dark">Codice Fiscale Genitore / Tutore</label>
                                <input type="text" name="tutore_cf" id="tutoreCfInput" class="form-control text-uppercase font-monospace" placeholder="Per detrazioni fiscali / intestazione ricevuta" maxlength="16" value="<?= htmlspecialchars($persona['tutore_cf'] ?? '') ?>">
                                <div class="form-text small">Consigliato per l'intestazione delle ricevute fiscali</div>
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold text-dark">
                                    Telefono Tutore (Reperibilità Emergenze) <span class="text-danger tutore-req-star" style="<?= $isMinorenneIniziale ? '' : 'display:none;' ?>">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><i class="bi bi-telephone"></i></span>
                                    <input type="tel" name="tutore_telefono" id="tutoreTelefonoInput" class="form-control" placeholder="Es. 347 9876543" value="<?= htmlspecialchars($persona['tutore_telefono'] ?? '') ?>" <?= $isMinorenneIniziale ? 'required' : '' ?>>
                                </div>
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold text-dark">Email Genitore (Ricevute e comunicazioni)</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><i class="bi bi-envelope"></i></span>
                                    <input type="email" name="tutore_email" class="form-control" placeholder="Es. marco.bianchi@gmail.com" value="<?= htmlspecialchars($persona['tutore_email'] ?? '') ?>">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Azioni Rapide Card -->
                <div class="card border-0 bg-primary bg-opacity-10 rounded-4 p-4 shadow-sm">
                    <div class="d-flex align-items-center mb-3">
                        <i class="bi bi-lightning-charge-fill text-primary fs-4 me-2"></i>
                        <h6 class="fw-bold mb-0 text-primary">Operazione Successiva</h6>
                    </div>
                    <p class="small text-muted mb-3">
                        <?= $isEditing 
                            ? 'Salva le modifiche anagrafiche per applicarle immediatamente all\'atleta in tutto il gestionale.' 
                            : 'Puoi salvare l\'anagrafica e tornare alla lista, oppure registrare contestualmente il tesseramento sportivo.' ?>
                    </p>
                    <div class="d-grid gap-2">
                        <button type="submit" name="action_type" value="save" class="btn btn-primary fw-bold py-2 shadow-sm">
                            <i class="bi bi-check-circle me-1"></i> <?= $isEditing ? 'Salva Modifiche Anagrafica' : "Salva e Torna all'Elenco Persone" ?>
                        </button>
                        <?php if (!$isEditing): ?>
                            <button type="submit" name="action_type" value="save_and_tessera" class="btn btn-success fw-bold py-2 shadow-sm">
                                <i class="bi bi-card-checklist me-1"></i> Salva e Procedi con Tesseramento
                            </button>
                        <?php endif; ?>
                        <a href="index.php?page=persone" class="btn btn-link text-muted text-decoration-none py-1">
                            &larr; Annulla e torna alla lista
                        </a>
                    </div>
                </div>

                <?php if ($isEditing): ?>
                    <div class="card border border-danger-subtle rounded-4 p-3 bg-white shadow-sm mt-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-shield-lock text-danger me-2 fs-5"></i>
                            <h6 class="fw-bold mb-0 text-dark">Privacy & Rimozione Dati</h6>
                        </div>
                        <p class="small text-muted mb-2">
                            Per archiviare, richiedere l'anonimizzazione GDPR (Art. 17) o verificare i vincoli contabili decennali:
                        </p>
                        <a href="index.php?page=persone&search=<?= urlencode($persona['codice_fiscale']) ?>" class="btn btn-outline-danger btn-sm fw-semibold">
                            <i class="bi bi-shield-slash me-1"></i> Gestisci Privacy & GDPR
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </form>
</div>

<script>
function calcolaEta(birthDateStr) {
    if (!birthDateStr) return null;
    const parts = birthDateStr.split('-');
    if (parts.length !== 3) return null;
    const birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function aggiornaEtaETutore() {
    const input = document.getElementById('dataNascitaInput');
    const ageContainer = document.getElementById('ageContainer');
    const ageBadge = document.getElementById('ageBadge');
    const statusBadge = document.getElementById('minorenneStatusBadge');
    const isMinInput = document.getElementById('isMinorenneInput');
    const tutoreCard = document.getElementById('tutoreCard');
    const tutoreHeader = document.getElementById('tutoreHeader');
    const tutoreObbligatorioBadge = document.getElementById('tutoreObbligatorioBadge');
    const tutoreMaggiorenneInfo = document.getElementById('tutoreMaggiorenneInfo');
    const tutoreNomeInput = document.getElementById('tutoreNomeInput');
    const tutoreCognomeInput = document.getElementById('tutoreCognomeInput');
    const tutoreTelefonoInput = document.getElementById('tutoreTelefonoInput');
    const stars = document.querySelectorAll('.tutore-req-star');

    if (!input.value) {
        ageContainer.style.display = 'none';
        statusBadge.style.display = 'none';
        return;
    }

    const age = calcolaEta(input.value);
    if (age === null || isNaN(age)) return;

    ageBadge.textContent = age + ' anni';
    ageContainer.style.display = 'inline-block';
    statusBadge.style.display = 'inline-block';

    const isMin = (age < 18);
    isMinInput.value = isMin ? '1' : '0';

    if (isMin) {
        statusBadge.className = 'badge bg-warning text-dark px-2 py-1';
        statusBadge.innerHTML = '<i class="bi bi-shield-exclamation me-1"></i> Atleta Minorenne (Richiede Tutore Legale)';
        tutoreCard.classList.add('border', 'border-warning');
        tutoreHeader.className = 'card-header py-3 bg-warning-subtle text-dark border-bottom border-warning';
        tutoreObbligatorioBadge.style.display = 'inline-block';
        if (tutoreMaggiorenneInfo) tutoreMaggiorenneInfo.style.display = 'none';
        stars.forEach(s => s.style.display = 'inline');
        tutoreNomeInput.setAttribute('required', 'required');
        tutoreCognomeInput.setAttribute('required', 'required');
        tutoreTelefonoInput.setAttribute('required', 'required');
    } else {
        statusBadge.className = 'badge bg-success px-2 py-1';
        statusBadge.innerHTML = '<i class="bi bi-person-check me-1"></i> Atleta Maggiorenne';
        tutoreCard.classList.remove('border', 'border-warning');
        tutoreHeader.className = 'card-header py-3 bg-white border-bottom';
        tutoreObbligatorioBadge.style.display = 'none';
        if (tutoreMaggiorenneInfo) tutoreMaggiorenneInfo.style.display = 'block';
        stars.forEach(s => s.style.display = 'none');
        tutoreNomeInput.removeAttribute('required');
        tutoreCognomeInput.removeAttribute('required');
        tutoreTelefonoInput.removeAttribute('required');
    }
}

// Converti automaticamente il codice fiscale in maiuscolo
document.getElementById('codiceFiscaleInput')?.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
});
document.getElementById('tutoreCfInput')?.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
});

// Controllo iniziale al caricamento
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dataNascitaInput').value) {
        aggiornaEtaETutore();
    }
});
</script>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
