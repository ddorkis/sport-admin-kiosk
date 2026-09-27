<?php
/**
 * Pagina Dedicata: Registrazione Incasso & Quietanza di Pagamento
 * Posizione: /private/pages/pagamento_nuovo.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$preselectedTessId = isset($_GET['tesserato_id']) ? (int)$_GET['tesserato_id'] : 0;
$preselectedQuotaId = isset($_GET['quota_id']) ? (int)$_GET['quota_id'] : 0;
$returnTo = isset($_GET['from']) && in_array($_GET['from'], ['quote', 'quote_scadute', 'kiosk']) ? $_GET['from'] : 'pagamenti';

// Recupero quote aperte per pre-selezione
$selectedQuota = null;
if ($preselectedQuotaId > 0) {
    $stmtQ = $db->prepare("
        SELECT q.*, p.nome, p.cognome, t.numero_tessera, g.nome_gruppo
        FROM quote q
        INNER JOIN tesserati t ON q.tesserato_id = t.id
        INNER JOIN persone p ON t.persona_id = p.id
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE q.id = ?
    ");
    $stmtQ->execute([$preselectedQuotaId]);
    $selectedQuota = $stmtQ->fetch();
    if ($selectedQuota) {
        $preselectedTessId = (int)$selectedQuota['tesserato_id'];
    }
}

// Recupero elenco tesserati con quote da saldare
$stmtT = $db->query("
    SELECT t.id AS tesserato_id, t.numero_tessera, p.nome, p.cognome, p.codice_fiscale,
           (SELECT COUNT(*) FROM quote q WHERE q.tesserato_id = t.id AND q.stato != 'pagata' AND q.stato != 'annullata') AS num_quote_aperte
    FROM tesserati t
    INNER JOIN persone p ON t.persona_id = p.id
    ORDER BY p.cognome ASC, p.nome ASC
");
$tesserati = $stmtT->fetchAll();

// Recupero quote aperte del tesserato selezionato
$quoteTesserato = [];
if ($preselectedTessId > 0) {
    $stmtQT = $db->prepare("
        SELECT q.*, g.nome_gruppo
        FROM quote q
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE q.tesserato_id = ? AND q.stato != 'pagata' AND q.stato != 'annullata'
        ORDER BY q.data_scadenza ASC
    ");
    $stmtQT->execute([$preselectedTessId]);
    $quoteTesserato = $stmtQT->fetchAll();
}

$residuoPredefinito = '';
$causalePredefinita = '';
if ($selectedQuota) {
    $residuo = (float)$selectedQuota['importo'] - (float)($selectedQuota['importo_pagato'] ?? 0);
    $residuoPredefinito = number_format(max(0, $residuo), 2, '.', '');
    $causalePredefinita = "Saldo " . $selectedQuota['causale'];
}
?>

<!-- Breadcrumb -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="index.php?page=<?= $returnTo ?>" class="text-decoration-none"><?= $returnTo === 'quote' ? 'Quote Mensili' : 'Pagamenti' ?></a></li>
        <li class="breadcrumb-item active" aria-current="page">Registra Incasso</li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-wallet2 text-success me-2"></i>
            Registrazione Incasso & Emissione Quietanza
        </h2>
        <p class="text-muted small mb-0">
            Registra il versamento della quota atleta, aggiorna lo scadenziario e genera la ricevuta fiscale per le detrazioni
        </p>
    </div>
    <div>
        <a href="index.php?page=<?= $returnTo ?>" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Annulla e Torna Indietro
        </a>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-9 col-xl-8">
        <form method="POST" action="index.php?action=registra_pagamento">
            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-cash-coin text-success me-2"></i> Dati del Pagamento e Quietanza
                    </h5>
                    <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                        Data Incasso: <?= date('d/m/Y') ?>
                    </span>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <!-- Tesserato -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Seleziona Atleta / Socio <span class="text-danger">*</span></label>
                            <select name="tesserato_id" id="selectTesserato" class="form-select form-select-lg" required onchange="cambiaTesserato(this.value)">
                                <option value="">-- Seleziona Atleta --</option>
                                <?php foreach ($tesserati as $t): ?>
                                    <option value="<?= $t['tesserato_id'] ?>" <?= ($t['tesserato_id'] == $preselectedTessId ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($t['cognome'] . ' ' . $t['nome']) ?> (Tessera: <?= htmlspecialchars($t['numero_tessera']) ?> - CF: <?= htmlspecialchars($t['codice_fiscale']) ?>)
                                        <?= $t['num_quote_aperte'] > 0 ? " - [{$t['num_quote_aperte']} quote da saldare]" : '' ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <!-- Selezione Quota Collegata (se presente) -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Quota / Rata Collegata (Opzionale)</label>
                            <select name="quota_id" id="selectQuota" class="form-select" onchange="selezionaQuota(this)">
                                <option value="">-- Incasso Libero / Quota Non in Elenco --</option>
                                <?php foreach ($quoteTesserato as $q): 
                                    $residuoQ = (float)$q['importo'] - (float)($q['importo_pagato'] ?? 0);
                                ?>
                                    <option value="<?= $q['id'] ?>"
                                            data-importo="<?= number_format(max(0, $residuoQ), 2, '.', '') ?>"
                                            data-causale="Saldo <?= htmlspecialchars($q['causale']) ?>"
                                            <?= ($q['id'] == $preselectedQuotaId ? 'selected' : '') ?>>
                                        <?= htmlspecialchars($q['causale']) ?> (Scadenza: <?= date('d/m/Y', strtotime($q['data_scadenza'])) ?>) - Residuo: € <?= number_format($residuoQ, 2) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="form-text small">Selezionando una quota, lo stato della rata verrà aggiornato automaticamente a 'pagata' o 'parziale'.</div>
                        </div>

                        <!-- Importo Pagato -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Importo Incassato (€) <span class="text-danger">*</span></label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-light fw-bold">€</span>
                                <input type="number" step="0.50" min="0.01" name="importo" id="inputImporto"
                                       class="form-control fw-bold text-success font-monospace"
                                       value="<?= htmlspecialchars($residuoPredefinito ?: '55.00') ?>" required>
                            </div>
                            <div class="form-text small">Importo effettivamente versato per la quietanza.</div>
                        </div>

                        <!-- Metodo di Pagamento -->
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Metodo di Pagamento <span class="text-danger">*</span></label>
                            <select name="metodo_pagamento" class="form-select form-select-lg" required>
                                <option value="contanti">Contanti</option>
                                <option value="pos" selected>POS / Carta di Debito o Credito (Tracciabile)</option>
                                <option value="bonifico">Bonifico Bancario (Tracciabile)</option>
                                <option value="satispay">Satispay (Tracciabile)</option>
                            </select>
                            <div class="form-text small">I pagamenti tracciabili permettono la detrazione fiscale al genitore.</div>
                        </div>

                        <!-- Causale Ricevuta -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Causale Ricevuta / Quietanza <span class="text-danger">*</span></label>
                            <input type="text" name="causale" id="inputCausale" class="form-control"
                                   placeholder="es. Quota mensile corso pattinaggio Ottobre 2024"
                                   value="<?= htmlspecialchars($causalePredefinita ?: 'Quota frequenza attività sportiva') ?>" required>
                        </div>

                        <!-- Note / Riferimenti Bonifico -->
                        <div class="col-12">
                            <label class="form-label fw-bold">Note Aggiuntive / CRO Bonifico / Ricevuta POS</label>
                            <textarea name="note" class="form-control" rows="2"
                                      placeholder="es. Transazione POS n. 094821; saldato dal papà Mario Rossi"></textarea>
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center">
                    <a href="index.php?page=<?= $returnTo ?>" class="btn btn-light border px-4">Annulla</a>
                    <button type="submit" class="btn btn-success fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i> Conferma Incasso ed Emetti Quietanza
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
function cambiaTesserato(tessId) {
    if (!tessId) return;
    window.location.href = 'index.php?page=pagamento_nuovo&tesserato_id=' + tessId + '&from=<?= $returnTo ?>';
}

function selezionaQuota(sel) {
    const opt = sel.options[sel.selectedIndex];
    if (opt && opt.dataset.importo) {
        document.getElementById('inputImporto').value = opt.dataset.importo;
    }
    if (opt && opt.dataset.causale) {
        document.getElementById('inputCausale').value = opt.dataset.causale;
    }
}
</script>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
