<?php
/**
 * Pagina Dedicata: Creazione Nuova Stagione / Anno Sportivo
 * Posizione: /private/pages/anno_nuovo.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Calcolo automatico anno suggerito
$annoCorrenteNum = (int)date('Y');
if ((int)date('n') >= 7) {
    $y1 = $annoCorrenteNum;
    $y2 = $annoCorrenteNum + 1;
} else {
    $y1 = $annoCorrenteNum - 1;
    $y2 = $annoCorrenteNum;
}
$suggeritoAnno = "{$y1}/{$y2}";
$suggeritaDataInizio = "{$y1}-09-01";
$suggeritaDataFine = "{$y2}-06-30";
?>

<!-- Breadcrumb -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="index.php?page=anni" class="text-decoration-none">Stagioni Sportive</a></li>
        <li class="breadcrumb-item active" aria-current="page">Nuova Stagione</li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-calendar-plus text-primary me-2"></i>
            Nuova Stagione Sportiva & Periodo di Lavoro
        </h2>
        <p class="text-muted small mb-0">
            Configura il nuovo anno sociale per avviare le iscrizioni, pianificare i corsi e impostare il budget preventivo
        </p>
    </div>
    <div>
        <a href="index.php?page=anni" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Annulla e Torna all'Elenco
        </a>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-8 col-xl-7">
        <form method="POST" action="index.php?action=salva_anno">
            <input type="hidden" name="return_page" value="anni">

            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-calendar-range text-primary me-2"></i> Configurazione Calendario Stagionale
                    </h5>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="suggerisciProssimoAnno()">
                        <i class="bi bi-magic me-1"></i> Suggerisci Anno Successivo
                    </button>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Denominazione -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Denominazione Anno Sportivo <span class="text-danger">*</span></label>
                            <input type="text" name="anno" id="inputNomeAnno" class="form-control form-control-lg fw-bold font-monospace"
                                   placeholder="es. 2025/2026" value="<?= htmlspecialchars($suggeritoAnno) ?>" required>
                            <div class="form-text small">Utilizza il formato standard con barra (es. 2024/2025 o 2025/2026).</div>
                        </div>

                        <!-- Date Inizio e Fine -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Inizio Stagione <span class="text-danger">*</span></label>
                            <input type="date" name="data_inizio" id="inputDataInizio" class="form-control"
                                   value="<?= $suggeritaDataInizio ?>" required>
                            <div class="form-text small">Di norma 1° Settembre dell'anno di partenza.</div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Fine Stagione <span class="text-danger">*</span></label>
                            <input type="date" name="data_fine" id="inputDataFine" class="form-control"
                                   value="<?= $suggeritaDataFine ?>" required>
                            <div class="form-text small">Di norma 30 Giugno (o 31 Agosto per anno solare).</div>
                        </div>

                        <!-- Flag Attivo Subito -->
                        <div class="col-12">
                            <div class="p-3 bg-light rounded-3 border">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="attivo" value="1" id="checkAttivo" checked>
                                    <label class="form-check-label fw-bold text-dark" for="checkAttivo">
                                        <i class="bi bi-check2-circle text-success me-1"></i> Imposta subito come Anno Sportivo Attivo di Lavoro
                                    </label>
                                </div>
                                <div class="small text-muted mt-1">
                                    Se attivo, tutte le pagine del gestionale (Tesseramenti, Corsi, Quote e Previsioni) opereranno su questa stagione sportiva.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center">
                    <a href="index.php?page=anni" class="btn btn-light border px-4">Annulla</a>
                    <button type="submit" class="btn btn-primary fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i> Crea e Salva Stagione Sportiva
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
function suggerisciProssimoAnno() {
    var curVal = document.getElementById('inputNomeAnno').value;
    var parts = curVal.split('/');
    if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
        var y1 = parseInt(parts[0]) + 1;
        var y2 = parseInt(parts[1]) + 1;
    } else {
        var d = new Date();
        var y1 = d.getFullYear() + 1;
        var y2 = y1 + 1;
    }
    document.getElementById('inputNomeAnno').value = y1 + '/' + y2;
    document.getElementById('inputDataInizio').value = y1 + '-09-01';
    document.getElementById('inputDataFine').value = y2 + '-06-30';
    document.getElementById('checkAttivo').checked = true;
}
</script>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
