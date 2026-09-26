<?php
/**
 * Pagina Dedicata: Inserimento e Modifica Spesa a Budget Previsionale
 * Posizione: /private/pages/spesa_nuova.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Determina Anno Sportivo di Lavoro
$annoId = isset($_GET['anno_id']) ? (int)$_GET['anno_id'] : ($annoAttivo['id'] ?? 1);
$stmtAnno = $db->prepare("SELECT * FROM anno WHERE id = ?");
$stmtAnno->execute([$annoId]);
$annoSelezionato = $stmtAnno->fetch() ?: $annoAttivo;

// Categorie Spesa Standard
$categorieSpesa = [
    'Affitto Impianti / Pista' => ['icon' => 'bi-building', 'color' => 'bg-primary text-white'],
    'Compensi Tecnici / Allenatori' => ['icon' => 'bi-person-badge', 'color' => 'bg-info text-dark'],
    'Tesseramenti & Affiliazioni (FISR/EPS)' => ['icon' => 'bi-patch-check', 'color' => 'bg-success text-white'],
    'Assicurazioni' => ['icon' => 'bi-shield-check', 'color' => 'bg-warning text-dark'],
    'Materiale Sportivo & Divise' => ['icon' => 'bi-bag', 'color' => 'bg-secondary text-white'],
    'Gare & Trasferte' => ['icon' => 'bi-trophy', 'color' => 'bg-danger text-white'],
    'Amministrazione & Commercialista' => ['icon' => 'bi-file-earmark-spreadsheet', 'color' => 'bg-dark text-white'],
    'Altro' => ['icon' => 'bi-three-dots', 'color' => 'bg-light text-dark border']
];

// Se presente parametro ?id=..., recupera la spesa per la modifica
$isEditing = false;
$spesa = [
    'id' => null,
    'titolo' => '',
    'categoria' => 'Affitto Impianti / Pista',
    'importo_mensile' => '200.00',
    'ricorrente' => 1,
    'mesi_json' => '[]',
    'note' => ''
];

if (!empty($_GET['id'])) {
    $spesaId = (int)$_GET['id'];
    $stmtSpesa = $db->prepare("SELECT * FROM spese_previsionali WHERE id = ?");
    $stmtSpesa->execute([$spesaId]);
    $recSpesa = $stmtSpesa->fetch();
    if ($recSpesa) {
        $isEditing = true;
        $spesa = $recSpesa;
        $annoId = (int)$spesa['anno_id'];
    }
}

// Calcolo elenco mesi della stagione attiva
$tuttiMesi = [];
if (!empty($annoSelezionato['data_inizio']) && !empty($annoSelezionato['data_fine'])) {
    $cur = strtotime(substr($annoSelezionato['data_inizio'], 0, 7) . '-01');
    $end = strtotime(substr($annoSelezionato['data_fine'], 0, 7) . '-01');
    while ($cur <= $end) {
        $tuttiMesi[] = date('Y-m', $cur);
        $cur = strtotime('+1 month', $cur);
    }
}
if (empty($tuttiMesi)) {
    $tuttiMesi = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
}

$mesiSelezionati = [];
if (!empty($spesa['mesi_json'])) {
    $decoded = json_decode($spesa['mesi_json'], true);
    if (is_array($decoded)) {
        $mesiSelezionati = $decoded;
    }
}
if ($spesa['ricorrente']) {
    $mesiSelezionati = $tuttiMesi;
}

function getNomeMeseLocal($m) {
    if (!$m) return '';
    $parts = explode('-', $m);
    if (count($parts) < 2) return $m;
    $nomi = [
        '01' => 'Gennaio', '02' => 'Febbraio', '03' => 'Marzo', '04' => 'Aprile',
        '05' => 'Maggio', '06' => 'Giugno', '07' => 'Luglio', '08' => 'Agosto',
        '09' => 'Settembre', '10' => 'Ottobre', '11' => 'Novembre', '12' => 'Dicembre'
    ];
    return ($nomi[$parts[1]] ?? $parts[1]) . ' ' . $parts[0];
}
?>

<!-- Breadcrumb di navigazione -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="index.php?page=previsioni" class="text-decoration-none">Previsione & Budget</a></li>
        <li class="breadcrumb-item active" aria-current="page"><?= $isEditing ? 'Modifica Spesa Previsionale' : 'Nuova Spesa a Budget' ?></li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi <?= $isEditing ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-danger' ?> me-2"></i>
            <?= $isEditing ? 'Modifica Voce di Spesa a Budget' : 'Aggiungi Voce di Spesa a Budget' ?>
        </h2>
        <p class="text-muted small mb-0">
            Pianificazione costi fissi, noleggi, tecnici e oneri di gestione per la stagione sportiva <strong><?= htmlspecialchars($annoSelezionato['anno']) ?></strong>
        </p>
    </div>
    <div>
        <a href="index.php?page=previsioni" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Annulla e Torna al Bilancio
        </a>
    </div>
</div>

<div class="row g-4">
    <!-- Colonna Sinistra: Modulo Inserimento/Modifica -->
    <div class="col-lg-8">
        <form method="POST" action="index.php?action=salva_spesa" id="formSpesa">
            <?php if ($isEditing): ?>
                <input type="hidden" name="id" value="<?= (int)$spesa['id'] ?>">
            <?php endif; ?>
            <input type="hidden" name="anno_id" value="<?= (int)$annoId ?>">

            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-sliders me-2 text-primary"></i> Dettagli e Classificazione Costo
                    </h5>
                    <span class="badge bg-secondary-subtle text-secondary px-3 py-2">
                        Stagione <?= htmlspecialchars($annoSelezionato['anno']) ?>
                    </span>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Titolo / Descrizione -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Descrizione della Voce di Spesa <span class="text-danger">*</span></label>
                            <input type="text" name="titolo" id="spesaTitolo" class="form-control form-control-lg fw-semibold"
                                   placeholder="es. Canone Affitto Pista Comunale / Palazzetto dello Sport"
                                   value="<?= htmlspecialchars($spesa['titolo']) ?>" required oninput="aggiornaAnteprima()">
                            <div class="form-text small">Indicare fornitore, ente o causale specifica (es. Ufficio Sport, Compenso Tecnico, Polizza).</div>
                        </div>

                        <!-- Categoria Spesa -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Categoria di Bilancio <span class="text-danger">*</span></label>
                            <select name="categoria" id="spesaCategoria" class="form-select form-select-lg" required onchange="aggiornaAnteprima()">
                                <?php foreach ($categorieSpesa as $catName => $catMeta): ?>
                                    <option value="<?= htmlspecialchars($catName) ?>" <?= ($spesa['categoria'] === $catName ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($catName) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="form-text small">Utilizzata per i grafici e il sinottico del Consiglio Direttivo.</div>
                        </div>

                        <!-- Importo Mensile / Singola Occorrenza -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Importo Mensile / Singolo (€) <span class="text-danger">*</span></label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-light fw-bold">€</span>
                                <input type="number" step="0.50" min="0.01" name="importo_mensile" id="spesaImporto"
                                       class="form-control fw-bold text-danger font-monospace"
                                       value="<?= htmlspecialchars((string)$spesa['importo_mensile']) ?>" required oninput="aggiornaAnteprima()">
                            </div>
                            <div class="form-text small">Costo unitario per ciascun mese in cui si applica la voce.</div>
                        </div>

                        <div class="col-12"><hr class="my-2 text-muted"></div>

                        <!-- Tipologia Ricorrenza -->
                        <div class="col-12">
                            <label class="form-label fw-bold mb-2">Frequenza di Addebito nella Stagione <span class="text-danger">*</span></label>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="p-3 border rounded-3 h-100 cursor-pointer" id="cardRicorrente" onclick="selezionaRicorrenza(1)">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="ricorrente" id="radioRicorrente1" value="1" <?= (!empty($spesa['ricorrente']) ? 'checked' : '') ?> onchange="cambiaRicorrenza(1)">
                                            <label class="form-check-label fw-bold text-dark" for="radioRicorrente1">
                                                <i class="bi bi-arrow-repeat text-primary me-1"></i> Ricorrente Ogni Mese
                                            </label>
                                        </div>
                                        <p class="small text-muted mb-0 mt-2">
                                            Applicata in modo continuo su tutti i <?= count($tuttiMesi) ?> mesi della stagione sportiva (es. canone pista, compenso mensile fisso).
                                        </p>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="p-3 border rounded-3 h-100 cursor-pointer" id="cardNonRicorrente" onclick="selezionaRicorrenza(0)">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="ricorrente" id="radioRicorrente0" value="0" <?= (empty($spesa['ricorrente']) ? 'checked' : '') ?> onchange="cambiaRicorrenza(0)">
                                            <label class="form-check-label fw-bold text-dark" for="radioRicorrente0">
                                                <i class="bi bi-calendar-check text-info me-1"></i> Solo in Mesi Specifici
                                            </label>
                                        </div>
                                        <p class="small text-muted mb-0 mt-2">
                                            Per spese stagionali, una tantum o concentrate in determinati periodi (es. gare di primavera, affiliazioni di inizio anno, divise).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Box Selezione Mesi Specifici -->
                        <div class="col-12 <?= (!empty($spesa['ricorrente']) ? 'd-none' : '') ?>" id="boxMesiSpecifici">
                            <div class="bg-light p-3 rounded-4 border">
                                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div>
                                        <h6 class="fw-bold mb-0 text-dark">
                                            <i class="bi bi-calendar3 me-1 text-primary"></i> Seleziona i mesi in cui addebitare il costo:
                                        </h6>
                                        <small class="text-muted">Spunta i singoli mesi previsti nel calendario della stagione</small>
                                    </div>
                                    <div class="btn-group btn-group-sm">
                                        <button type="button" class="btn btn-outline-secondary" onclick="impostaTuttiMesi(true)">Seleziona Tutti</button>
                                        <button type="button" class="btn btn-outline-secondary" onclick="impostaTuttiMesi(false)">Deseleziona Tutti</button>
                                    </div>
                                </div>

                                <div class="row g-2">
                                    <?php foreach ($tuttiMesi as $m): ?>
                                        <div class="col-6 col-md-4">
                                            <div class="form-check bg-white p-2 rounded-2 border">
                                                <input class="form-check-input mese-chk ms-1" type="checkbox" name="mesi[]" value="<?= $m ?>" id="chk_<?= $m ?>"
                                                       <?= (in_array($m, $mesiSelezionati) ? 'checked' : '') ?> onchange="aggiornaAnteprima()">
                                                <label class="form-check-label small fw-semibold ms-2" for="chk_<?= $m ?>">
                                                    <?= getNomeMeseLocal($m) ?>
                                                </label>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>

                        <!-- Note Fornitore / Convenzione -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Note & Estremi Convenzione / Accordi</label>
                            <textarea name="note" id="spesaNote" class="form-control" rows="3"
                                      placeholder="es. Pagamento concordato trimestrale con bonifico; delibera Consiglio Direttivo del 15/09/2024"><?= htmlspecialchars($spesa['note']) ?></textarea>
                            <div class="form-text small">Note interne ad uso della segreteria e del tesoriere.</div>
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <a href="index.php?page=previsioni" class="btn btn-light border px-4">
                        Annulla
                    </a>
                    <button type="submit" class="btn btn-primary fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i>
                        <?= $isEditing ? 'Salva Modifiche Spesa' : 'Conferma e Inserisci nel Budget' ?>
                    </button>
                </div>
            </div>
        </form>
    </div>

    <!-- Colonna Destra: Scheda Riepilogo Calcolo e Impatto a Budget -->
    <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white sticky-top" style="top: 20px;">
            <div class="card-header bg-white border-bottom py-3">
                <h5 class="fw-bold mb-0 text-dark d-flex align-items-center">
                    <i class="bi bi-calculator text-primary me-2"></i> Riepilogo Impatto Finanziario
                </h5>
                <small class="text-muted">Proiezione automatica a fine stagione</small>
            </div>

            <div class="card-body p-4">
                <div class="text-center p-3 rounded-4 bg-light border mb-3">
                    <small class="text-muted text-uppercase fw-semibold d-block mb-1">Costo Totale Annuale Stimato</small>
                    <h2 class="fw-bold text-danger mb-0 font-monospace" id="anteprimaTotaleAnnuale">€ 0.00</h2>
                    <span class="badge bg-secondary-subtle text-secondary mt-2 px-2 py-1" id="anteprimaMesiBadge">
                        10 mesi inclusi
                    </span>
                </div>

                <div class="list-group list-group-flush small mb-3">
                    <div class="list-group-item d-flex justify-content-between px-0">
                        <span class="text-muted">Categoria:</span>
                        <strong id="anteprimaCategoriaText"><?= htmlspecialchars($spesa['categoria']) ?></strong>
                    </div>
                    <div class="list-group-item d-flex justify-content-between px-0">
                        <span class="text-muted">Importo Unitario:</span>
                        <strong id="anteprimaImportoUnitario" class="font-monospace">€ 200.00</strong>
                    </div>
                    <div class="list-group-item d-flex justify-content-between px-0">
                        <span class="text-muted">Frequenza:</span>
                        <strong id="anteprimaFrequenzaText">Ogni Mese</strong>
                    </div>
                    <div class="list-group-item d-flex justify-content-between px-0">
                        <span class="text-muted">Stagione Riferimento:</span>
                        <strong><?= htmlspecialchars($annoSelezionato['anno']) ?></strong>
                    </div>
                </div>

                <div class="alert alert-info py-2 px-3 small border-info rounded-3 mb-0">
                    <i class="bi bi-info-circle-fill me-1"></i>
                    <strong>Nota Amministrativa:</strong> Questa spesa verrà inclusa nel piano di cassa mensile e confrontata con gli incassi delle quote atleti nel <em>Sinottico per il Consiglio Direttivo</em>.
                </div>
            </div>
        </div>
    </div>
</div>

<script>
const tuttiMesiCount = <?= count($tuttiMesi) ?>;

function selezionaRicorrenza(val) {
    if (val === 1) {
        document.getElementById('radioRicorrente1').checked = true;
        cambiaRicorrenza(1);
    } else {
        document.getElementById('radioRicorrente0').checked = true;
        cambiaRicorrenza(0);
    }
}

function cambiaRicorrenza(val) {
    const box = document.getElementById('boxMesiSpecifici');
    const cardRic = document.getElementById('cardRicorrente');
    const cardNonRic = document.getElementById('cardNonRicorrente');
    
    if (val === 1) {
        box.classList.add('d-none');
        cardRic.classList.add('border-primary', 'bg-primary-subtle');
        cardNonRic.classList.remove('border-primary', 'bg-primary-subtle');
    } else {
        box.classList.remove('d-none');
        cardNonRic.classList.add('border-primary', 'bg-primary-subtle');
        cardRic.classList.remove('border-primary', 'bg-primary-subtle');
    }
    aggiornaAnteprima();
}

function impostaTuttiMesi(stato) {
    const checks = document.querySelectorAll('.mese-chk');
    checks.forEach(c => c.checked = stato);
    aggiornaAnteprima();
}

function aggiornaAnteprima() {
    const cat = document.getElementById('spesaCategoria').value;
    const imp = parseFloat(document.getElementById('spesaImporto').value) || 0;
    const isRic = document.getElementById('radioRicorrente1').checked;

    let numMesi = 0;
    if (isRic) {
        numMesi = tuttiMesiCount;
    } else {
        numMesi = document.querySelectorAll('.mese-chk:checked').length;
    }

    const totale = imp * numMesi;

    document.getElementById('anteprimaCategoriaText').textContent = cat;
    document.getElementById('anteprimaImportoUnitario').textContent = '€ ' + imp.toFixed(2);
    document.getElementById('anteprimaTotaleAnnuale').textContent = '€ ' + totale.toFixed(2);
    document.getElementById('anteprimaFrequenzaText').textContent = isRic ? 'Ogni Mese' : numMesi + ' mesi selezionati';
    document.getElementById('anteprimaMesiBadge').textContent = numMesi + ' mesi a budget';
}

document.addEventListener('DOMContentLoaded', function() {
    cambiaRicorrenza(<?= !empty($spesa['ricorrente']) ? 1 : 0 ?>);
    aggiornaAnteprima();
});
</script>

<?php
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php';
?>
