<?php
/**
 * Scadenziario Quote Mensili
 * Posizione: /private/pages/quote.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

$search = trim($_GET['search'] ?? '');
$mese = trim($_GET['mese'] ?? '');
$stato = trim($_GET['stato'] ?? '');

$sql = "SELECT q.*, p.nome, p.cognome, t.numero_tessera, g.nome_gruppo
        FROM quote q
        INNER JOIN tesserati t ON q.tesserato_id = t.id
        INNER JOIN persone p ON t.persona_id = p.id
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (p.nome LIKE ? OR p.cognome LIKE ? OR q.causale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
if ($mese !== '') {
    $sql .= " AND q.mese_riferimento = ?";
    $params[] = $mese;
}
if ($stato !== '') {
    $sql .= " AND q.stato = ?";
    $params[] = $stato;
}

$sql .= " ORDER BY q.data_scadenza DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$quote = $stmt->fetchAll();

// Mesi unici per filtro
$mesiDisponibili = $db->query("SELECT DISTINCT mese_riferimento FROM quote WHERE mese_riferimento IS NOT NULL ORDER BY mese_riferimento DESC")->fetchAll(PDO::FETCH_COLUMN);
?>

<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-0"><i class="bi bi-cash-stack me-2 text-primary"></i>Scadenziario Quote Mensili</h2>
        <p class="text-muted small mb-0">Controllo pagamenti, quote emesse e stati di riscossione</p>
    </div>
    <a href="index.php?page=quote_scadute" class="btn btn-outline-danger btn-sm fw-bold">
        <i class="bi bi-exclamation-triangle me-1"></i> Solo Quote Scadute
    </a>
</div>

<!-- Filtri -->
<div class="card border-0 shadow-sm mb-3">
    <div class="card-body py-2">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="quote">
            <div class="col-md-4">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Cerca Atleta o Causale..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="mese" class="form-select form-select-sm">
                    <option value="">Tutti i Mesi</option>
                    <?php foreach ($mesiDisponibili as $m): ?>
                        <option value="<?= $m ?>" <?= $mese===$m?'selected':'' ?>><?= $m ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-3">
                <select name="stato" class="form-select form-select-sm">
                    <option value="">Tutti gli Stati</option>
                    <option value="da_pagare" <?= $stato==='da_pagare'?'selected':'' ?>>Da Pagare</option>
                    <option value="parziale" <?= $stato==='parziale'?'selected':'' ?>>Parziale</option>
                    <option value="pagata" <?= $stato==='pagata'?'selected':'' ?>>Pagata</option>
                    <option value="annullata" <?= $stato==='annullata'?'selected':'' ?>>Annullata</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn btn-sm btn-secondary w-100"><i class="bi bi-filter me-1"></i> Filtra</button>
            </div>
        </form>
    </div>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>Scadenza</th>
                <th>Mese Rif.</th>
                <th>Atleta</th>
                <th>Gruppo / Corso</th>
                <th>Causale</th>
                <th>Importo</th>
                <th>Incassato</th>
                <th>Stato</th>
                <th class="text-end">Azione</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($quote)): ?>
                <tr><td colspan="9" class="text-center py-4 text-muted">Nessuna quota trovata.</td></tr>
            <?php else: foreach ($quote as $q): 
                $isScaduta = ($q['data_scadenza'] < date('Y-m-d')) && ($q['stato'] !== 'pagata' && $q['stato'] !== 'annullata');
            ?>
                <tr>
                    <td>
                        <span class="<?= $isScaduta ? 'text-danger fw-bold' : '' ?>">
                            <?= date('d/m/Y', strtotime($q['data_scadenza'])) ?>
                        </span>
                    </td>
                    <td><code><?= htmlspecialchars($q['mese_riferimento'] ?? '-') ?></code></td>
                    <td><strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong></td>
                    <td><?= htmlspecialchars($q['nome_gruppo'] ?? 'Generale') ?></td>
                    <td><?= htmlspecialchars($q['causale']) ?></td>
                    <td><strong>€ <?= number_format($q['importo'], 2, ',', '.') ?></strong></td>
                    <td><span class="text-success">€ <?= number_format($q['importo_pagato'], 2, ',', '.') ?></span></td>
                    <td>
                        <?php if ($q['stato'] === 'pagata'): ?>
                            <span class="badge bg-success">Pagata</span>
                        <?php elseif ($isScaduta): ?>
                            <span class="badge bg-danger">Scaduta</span>
                        <?php elseif ($q['stato'] === 'parziale'): ?>
                            <span class="badge bg-warning text-dark">Parziale</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Da Pagare</span>
                        <?php endif; ?>
                    </td>
                    <td class="text-end">
                        <?php if ($q['stato'] !== 'pagata'): ?>
                            <a href="index.php?page=pagamenti&paga_quota=<?= $q['id'] ?>" class="btn btn-sm btn-success">
                                <i class="bi bi-cash me-1"></i> Incassa
                            </a>
                        <?php else: ?>
                            <span class="text-muted small"><i class="bi bi-check2-circle text-success"></i> Saldata</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
