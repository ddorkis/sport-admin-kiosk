<?php
/**
 * Tabella Quote Scadute Non Pagate
 * Posizione: /private/pages/quote_scadute.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Seleziona tutte le quote con scadenza superata e stato non 'pagata'
$sql = "SELECT q.*, t.numero_tessera, p.nome, p.cognome, p.is_minorenne, p.tutore_nome, p.tutore_cognome, p.tutore_telefono,
               g.nome_gruppo, DATEDIFF(CURRENT_DATE, q.data_scadenza) AS giorni_ritardo
        FROM quote q
        INNER JOIN tesserati t ON q.tesserato_id = t.id
        INNER JOIN persone p ON t.persona_id = p.id
        LEFT JOIN gruppi g ON q.gruppo_id = g.id
        WHERE q.data_scadenza < CURRENT_DATE 
          AND q.stato IN ('da_pagare', 'parziale')
        ORDER BY q.data_scadenza ASC";

$stmt = $db->query($sql);
$quoteScadute = $stmt->fetchAll();
?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <h2 class="h3 fw-bold text-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Quote Scadute Non Pagate</h2>
        <p class="text-muted small mb-0">Elenco immediato dei crediti scaduti da sollecitare o incassare</p>
    </div>
    <a href="index.php?page=quote" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i> Torna a Tutte le Quote</a>
</div>

<div class="table-responsive bg-white rounded shadow-sm">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-danger text-danger-emphasis">
            <tr>
                <th>Scadenza</th>
                <th>Giorni Ritardo</th>
                <th>Atleta</th>
                <th>Gruppo</th>
                <th>Causale</th>
                <th>Da Pagare</th>
                <th>Referente / Tutore</th>
                <th class="text-end">Azione</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($quoteScadute)): ?>
                <tr><td colspan="8" class="text-center py-4 text-success"><i class="bi bi-check-circle-fill me-1"></i> Ottimo! Nessuna quota scaduta in sospeso.</td></tr>
            <?php else: foreach ($quoteScadute as $q): 
                $saldo = $q['importo'] - $q['importo_pagato'];
            ?>
                <tr>
                    <td><strong class="text-danger"><?= date('d/m/Y', strtotime($q['data_scadenza'])) ?></strong></td>
                    <td><span class="badge bg-danger"><?= $q['giorni_ritardo'] ?> giorni fa</span></td>
                    <td><strong><?= htmlspecialchars($q['cognome'] . ' ' . $q['nome']) ?></strong> (<?= htmlspecialchars($q['numero_tessera']) ?>)</td>
                    <td><?= htmlspecialchars($q['nome_gruppo'] ?? 'Generale') ?></td>
                    <td><?= htmlspecialchars($q['causale']) ?></td>
                    <td><span class="text-danger fw-bold fs-6">€ <?= number_format($saldo, 2, ',', '.') ?></span></td>
                    <td>
                        <?php if ($q['is_minorenne']): ?>
                            <small>
                                <div><i class="bi bi-shield me-1"></i><strong><?= htmlspecialchars($q['tutore_cognome'] . ' ' . $q['tutore_nome']) ?></strong></div>
                                <div><i class="bi bi-telephone me-1"></i><a href="tel:<?= $q['tutore_telefono'] ?>"><?= $q['tutore_telefono'] ?></a></div>
                            </small>
                        <?php else: ?>
                            <span class="text-muted">Atleta Maggiorenne</span>
                        <?php endif; ?>
                    </td>
                    <td class="text-end">
                        <a href="index.php?page=pagamenti&paga_quota=<?= $q['id'] ?>" class="btn btn-sm btn-success fw-bold">
                            <i class="bi bi-cash me-1"></i> Salda Ora
                        </a>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>
<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
