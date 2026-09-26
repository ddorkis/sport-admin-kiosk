<?php
/**
 * Gestione Tabella Persone con Minorenni, Tutori e Privacy/GDPR
 * Posizione: /private/pages/persone.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';

$db = getDbConnection();
$search = trim($_GET['search'] ?? '');
$filterMinori = $_GET['minorenne'] ?? '';
$filterStato = $_GET['stato'] ?? 'attivi';

// Paginazione
$pageNumber = max(1, (int)($_GET['p'] ?? 1));
$perPage = 10;
$offset = ($pageNumber - 1) * $perPage;

$where = "WHERE 1=1";
$params = [];

if ($search !== '') {
    $where .= " AND (nome LIKE ? OR cognome LIKE ? OR codice_fiscale LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filterMinori !== '') {
    $where .= " AND is_minorenne = ?";
    $params[] = (int)$filterMinori;
}

if ($filterStato === 'attivi') {
    $where .= " AND (attivo = 1 OR attivo IS NULL)";
} elseif ($filterStato === 'archiviati') {
    $where .= " AND attivo = 0";
} elseif ($filterStato === 'gdpr') {
    $where .= " AND anonimizzato_gdpr = 1";
}

$stmtCount = $db->prepare("SELECT COUNT(*) FROM persone $where");
$stmtCount->execute($params);
$totalRecords = $stmtCount->fetchColumn();
$totalPages = max(1, ceil($totalRecords / $perPage));

$stmt = $db->prepare("SELECT * FROM persone $where ORDER BY cognome, nome LIMIT $perPage OFFSET $offset");
$stmt->execute($params);
$persone = $stmt->fetchAll();

// Mappa delle ricevute contabili collegate a fini di controllo fiscale 10 anni (Art. 2220 C.C.)
$personaIds = array_column($persone, 'id');
$pagamentiMap = [];
if (!empty($personaIds)) {
    $inClause = implode(',', array_fill(0, count($personaIds), '?'));
    $stmtPag = $db->prepare("
        SELECT t.persona_id, COUNT(p.id) as tot_ricevute, COALESCE(SUM(p.importo), 0) as tot_importo
        FROM pagamenti p
        INNER JOIN tesserati t ON p.tesserato_id = t.id
        WHERE t.persona_id IN ($inClause)
        GROUP BY t.persona_id
    ");
    $stmtPag->execute($personaIds);
    foreach ($stmtPag->fetchAll() as $row) {
        $pagamentiMap[$row['persona_id']] = [
            'count' => (int)$row['tot_ricevute'],
            'totale' => (float)$row['tot_importo']
        ];
    }
}

// Conteggi per tab badge
$totAttivi = (int)$db->query("SELECT COUNT(*) FROM persone WHERE (attivo = 1 OR attivo IS NULL)")->fetchColumn();
$totArchiviati = (int)$db->query("SELECT COUNT(*) FROM persone WHERE attivo = 0")->fetchColumn();
$totGdpr = (int)$db->query("SELECT COUNT(*) FROM persone WHERE anonimizzato_gdpr = 1")->fetchColumn();

$msg = $_GET['msg'] ?? '';
$err = $_GET['err'] ?? '';
?>

<?php if ($msg): ?>
    <div class="alert alert-success alert-dismissible fade show shadow-sm rounded-3 mb-4" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <strong><?= htmlspecialchars($msg === 'creato' ? 'Nuova anagrafica registrata con successo!' : ($msg === 'modificato' ? 'Scheda anagrafica aggiornata!' : $msg)) ?></strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>

<?php if ($err): ?>
    <div class="alert alert-danger alert-dismissible fade show shadow-sm rounded-3 mb-4" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
        <strong><?= htmlspecialchars($err) ?></strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1"><i class="bi bi-people-fill me-2 text-primary"></i>Anagrafica Generale Persone</h2>
        <p class="text-muted small mb-0">Gestione soci, atleti minorenni con tutori e conformità GDPR / Diritto all'Oblio</p>
    </div>
    <a href="index.php?page=persona_nuova" class="btn btn-primary fw-bold shadow-sm">
        <i class="bi bi-person-plus-fill me-1"></i> Nuova Persona
    </a>
</div>

<!-- Filtri di ricerca e stato -->
<div class="card border-0 shadow-sm rounded-3 mb-4 bg-white">
    <div class="card-body p-3">
        <form method="GET" class="row g-2 align-items-center">
            <input type="hidden" name="page" value="persone">
            <div class="col-md-4">
                <div class="input-group">
                    <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
                    <input type="text" name="search" class="form-control form-control-sm border-start-0" placeholder="Cerca per Nome, Cognome o CF..." value="<?= htmlspecialchars($search) ?>">
                </div>
            </div>
            <div class="col-md-3">
                <select name="minorenne" class="form-select form-select-sm">
                    <option value="">Tutti (Minorenni e Maggiorenni)</option>
                    <option value="1" <?= $filterMinori==='1'?'selected':'' ?>>Solo Minorenni (con Tutore)</option>
                    <option value="0" <?= $filterMinori==='0'?'selected':'' ?>>Solo Maggiorenni</option>
                </select>
            </div>
            <div class="col-md-3">
                <select name="stato" class="form-select form-select-sm">
                    <option value="attivi" <?= $filterStato==='attivi'?'selected':'' ?>>Solo Soci Attivi (<?= $totAttivi ?>)</option>
                    <option value="archiviati" <?= $filterStato==='archiviati'?'selected':'' ?>>Archiviati / Nascosti (<?= $totArchiviati ?>)</option>
                    <option value="gdpr" <?= $filterStato==='gdpr'?'selected':'' ?>>Anonimizzati GDPR (<?= $totGdpr ?>)</option>
                    <option value="tutti" <?= $filterStato==='tutti'?'selected':'' ?>>Tutti (Attivi + Archiviati)</option>
                </select>
            </div>
            <div class="col-md-2 d-flex gap-1">
                <button type="submit" class="btn btn-sm btn-secondary w-100 fw-semibold"><i class="bi bi-filter me-1"></i> Filtra</button>
                <?php if ($search !== '' || $filterMinori !== '' || $filterStato !== 'attivi'): ?>
                    <a href="index.php?page=persone" class="btn btn-sm btn-outline-danger" title="Resetta filtri"><i class="bi bi-x-lg"></i></a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Tabella Paginata -->
<div class="table-responsive bg-white rounded-4 shadow-sm mb-4">
    <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Nominativo Atleta / Socio</th>
                <th>Codice Fiscale</th>
                <th>Nascita</th>
                <th>Tipo Atleta</th>
                <th>Tutore Legale (Minorenni)</th>
                <th>Contatti</th>
                <th class="text-end">Azioni</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($persone)): ?>
                <tr><td colspan="8" class="text-center py-5 text-muted">Nessuna persona trovata con i filtri selezionati.</td></tr>
            <?php else: foreach ($persone as $p): 
                $isArchived = isset($p['attivo']) && ((int)$p['attivo'] === 0);
                $isGdpr = !empty($p['anonimizzato_gdpr']);
                $pagData = $pagamentiMap[$p['id']] ?? ['count' => 0, 'totale' => 0.0];
                $hasReceipts = ($pagData['count'] > 0);
            ?>
                <tr class="<?= $isArchived ? 'table-light opacity-75' : '' ?>">
                    <td><span class="badge bg-light text-secondary border">#<?= $p['id'] ?></span></td>
                    <td>
                        <div class="fw-bold text-dark">
                            <?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?>
                            <?php if ($isGdpr): ?>
                                <span class="badge bg-danger-subtle text-danger border border-danger-subtle ms-1 small"><i class="bi bi-shield-slash me-1"></i>GDPR</span>
                            <?php elseif ($isArchived): ?>
                                <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle ms-1 small"><i class="bi bi-archive me-1"></i>Archiviato</span>
                            <?php endif; ?>
                        </div>
                        <?php if (!empty($p['citta'])): ?>
                            <div class="small text-muted"><?= htmlspecialchars($p['citta']) ?></div>
                        <?php endif; ?>
                    </td>
                    <td><code><?= htmlspecialchars($p['codice_fiscale']) ?></code></td>
                    <td><?= !empty($p['data_nascita']) && $p['data_nascita'] !== '1970-01-01' ? date('d/m/Y', strtotime($p['data_nascita'])) : '-' ?></td>
                    <td>
                        <?php if ($p['is_minorenne']): ?>
                            <span class="badge bg-warning text-dark"><i class="bi bi-shield-check me-1"></i>Minorenne</span>
                        <?php else: ?>
                            <span class="badge bg-secondary">Maggiorenne</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($p['is_minorenne']): ?>
                            <div><strong><?= htmlspecialchars($p['tutore_cognome'] . ' ' . $p['tutore_nome']) ?></strong> <span class="badge bg-light text-secondary border"><?= htmlspecialchars($p['tutore_relazione'] ?? 'Tutore') ?></span></div>
                            <small class="text-muted"><i class="bi bi-telephone"></i> <?= htmlspecialchars($p['tutore_telefono'] ?? '-') ?></small>
                        <?php else: ?>
                            <span class="text-muted">-</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <small>
                            <div><i class="bi bi-telephone text-muted"></i> <?= htmlspecialchars($p['telefono'] ?? '-') ?></div>
                            <div><i class="bi bi-envelope text-muted"></i> <?= htmlspecialchars($p['email'] ?? '-') ?></div>
                        </small>
                    </td>
                    <td class="text-end text-nowrap">
                        <div class="btn-group btn-group-sm">
                            <a href="index.php?page=persona_nuova&id=<?= $p['id'] ?>" class="btn btn-outline-primary" title="Modifica Scheda Anagrafica">
                                <i class="bi bi-pencil"></i> Modifica
                            </a>
                            <a href="index.php?page=tesserati&nuovo_tess=1&persona_id=<?= $p['id'] ?>" class="btn btn-outline-success <?= $isArchived ? 'disabled' : '' ?>" title="Registra Tesseramento">
                                <i class="bi bi-card-checklist"></i> Tessera
                            </a>
                            <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#modalPrivacy<?= $p['id'] ?>" title="Gestione Privacy, Archiviazione o Eliminazione GDPR">
                                <i class="bi bi-shield-lock"></i>
                            </button>
                        </div>

                        <!-- MODAL PRIVACY & GDPR PER QUESTA PERSONA -->
                        <div class="modal fade text-start" id="modalPrivacy<?= $p['id'] ?>" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered modal-lg">
                                <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                                    <div class="modal-header bg-dark text-white p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="bi bi-shield-lock-fill text-warning fs-4"></i>
                                            <div>
                                                <h5 class="modal-title fw-bold mb-0">Gestione Privacy, Eliminazione & GDPR</h5>
                                                <small class="text-secondary">Diritto all'Oblio (Art. 17 GDPR) e vincoli di conservazione contabile (Art. 2220 C.C.)</small>
                                            </div>
                                        </div>
                                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                    </div>

                                    <div class="modal-body p-4 bg-light">
                                        <!-- Dati Soggetto -->
                                        <div class="card border-0 shadow-sm rounded-3 mb-3 bg-white p-3">
                                            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                                <div>
                                                    <span class="badge bg-light text-dark border mb-1">ID Anagrafica #<?= $p['id'] ?></span>
                                                    <h5 class="fw-bold mb-0 text-dark"><?= htmlspecialchars($p['cognome'] . ' ' . $p['nome']) ?></h5>
                                                    <div class="small text-muted font-monospace"><?= htmlspecialchars($p['codice_fiscale']) ?></div>
                                                    <?php if ($p['is_minorenne']): ?>
                                                        <div class="small text-warning-emphasis fw-semibold mt-1">
                                                            <i class="bi bi-shield-check me-1"></i>Minorenne • Tutore: <?= htmlspecialchars($p['tutore_cognome'] . ' ' . $p['tutore_nome']) ?> (<?= htmlspecialchars($p['tutore_relazione'] ?? 'Genitore') ?>)
                                                        </div>
                                                    <?php endif; ?>
                                                </div>
                                                <div class="text-end">
                                                    <div class="small text-muted">Stato contabile:</div>
                                                    <div class="fw-bold text-dark"><?= $pagData['count'] ?> ricevute emesse</div>
                                                    <div class="small fw-semibold text-success">Totale: € <?= number_format($pagData['totale'], 2, ',', '.') ?></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Quadro Normativo -->
                                        <?php if ($hasReceipts): ?>
                                            <div class="alert alert-warning border-warning shadow-sm rounded-3 mb-3 p-3 d-flex align-items-start gap-2">
                                                <i class="bi bi-exclamation-triangle-fill fs-4 text-warning flex-shrink-0 mt-1"></i>
                                                <div class="small">
                                                    <strong class="d-block text-dark fw-bold mb-1">Vincolo di Conservazione Fiscale Decennale (Art. 2220 C.C. & DPR 600/73)</strong>
                                                    Per questa persona risultano registrati <strong><?= $pagData['count'] ?> pagamenti contabili</strong> per un totale di <strong>€ <?= number_format($pagData['totale'], 2, ',', '.') ?></strong>. La legge fiscale impone la conservazione obbligatoria per 10 anni. Per ottemperare alla richiesta di cancellazione dati dell'interessato (Art. 17 GDPR), si deve procedere con l'<strong>Anonimizzazione GDPR</strong>.
                                                </div>
                                            </div>
                                        <?php else: ?>
                                            <div class="alert alert-info border-info shadow-sm rounded-3 mb-3 p-3 d-flex align-items-start gap-2">
                                                <i class="bi bi-info-circle-fill fs-4 text-info flex-shrink-0 mt-1"></i>
                                                <div class="small">
                                                    <strong class="d-block text-dark fw-bold mb-1">Nessuna Ricevuta Contabile Emessa</strong>
                                                    Per questo nominativo non risultano pagamenti registrati. È possibile procedere sia con l'archiviazione che con l'<strong>eliminazione fisica definitiva</strong>.
                                                </div>
                                            </div>
                                        <?php endif; ?>

                                        <!-- Le 3 Opzioni -->
                                        <div class="row g-3">
                                            <!-- Opzione 1: Archiviazione / Ripristino -->
                                            <div class="col-12">
                                                <div class="card border rounded-3 p-3 bg-white">
                                                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <div>
                                                            <h6 class="fw-bold mb-0 text-dark">
                                                                <?= $isArchived ? '1. Ripristina Anagrafica tra i Soci Attivi' : '1. Nascondi / Archivia Anagrafica (Soft Delete)' ?>
                                                            </h6>
                                                            <small class="text-muted">
                                                                <?= $isArchived ? 'Riporta la persona e il tutore tra le anagrafiche attive e operabili.' : 'Nasconde la persona dalle liste ordinarie, dai corsi e dal Kiosk, mantenendo intatti storico e ricevute.' ?>
                                                            </small>
                                                        </div>
                                                        <form method="POST" action="index.php?action=elimina_persona">
                                                            <input type="hidden" name="id" value="<?= $p['id'] ?>">
                                                            <input type="hidden" name="action_mode" value="<?= $isArchived ? 'ripristina' : 'archivia' ?>">
                                                            <button type="submit" class="btn btn-sm <?= $isArchived ? 'btn-outline-primary' : 'btn-outline-secondary' ?> fw-semibold">
                                                                <?= $isArchived ? 'Ripristina' : 'Archivia / Nascondi' ?>
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Opzione 2: Anonimizzazione GDPR -->
                                            <div class="col-12">
                                                <div class="card border rounded-3 p-3 bg-white">
                                                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <div>
                                                            <div class="d-flex align-items-center gap-2">
                                                                <h6 class="fw-bold mb-0 text-dark">2. Anonimizzazione GDPR (Art. 17 Diritto all'Oblio)</h6>
                                                                <span class="badge bg-warning text-dark small">Consigliato GDPR</span>
                                                            </div>
                                                            <small class="text-muted">
                                                                Cancella definitivamente Nome, Cognome, Telefono, Email, Indirizzo e <strong>TUTTI i dati del Tutore</strong>. Mantiene i numeri di ricevuta intestati ad "ANONIMO" per conformità decennale ex art. 2220 C.C.
                                                            </small>
                                                        </div>
                                                        <?php if ($isGdpr): ?>
                                                            <span class="badge bg-success py-2 px-3"><i class="bi bi-check2-circle me-1"></i>Già Anonimizzato</span>
                                                        <?php else: ?>
                                                            <form method="POST" action="index.php?action=elimina_persona" onsubmit="return confirm('Confermi l\'anonimizzazione irreversibile dei dati personali e del tutore a norma GDPR (Art. 17)?');">
                                                                <input type="hidden" name="id" value="<?= $p['id'] ?>">
                                                                <input type="hidden" name="action_mode" value="anonimizza_gdpr">
                                                                <button type="submit" class="btn btn-sm btn-outline-warning text-dark fw-bold">
                                                                    Anonimizza Dati GDPR
                                                                </button>
                                                            </form>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Opzione 3: Eliminazione Definitiva -->
                                            <div class="col-12">
                                                <div class="card border rounded-3 p-3 bg-white">
                                                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <div>
                                                            <h6 class="fw-bold mb-0 <?= $hasReceipts ? 'text-muted' : 'text-danger' ?>">
                                                                3. Eliminazione Fisica Definitiva (Hard Delete)
                                                            </h6>
                                                            <small class="text-muted">
                                                                <?= $hasReceipts ? 'Non consentita per legge: documenti contabili obbligatori per 10 anni (utilizza l\'Anonimizzazione).' : 'Cancella fisicamente l\'anagrafica dal database. Possibile perché non risultano ricevute di cassa.' ?>
                                                            </small>
                                                        </div>
                                                        <?php if ($hasReceipts): ?>
                                                            <button class="btn btn-sm btn-light border text-muted" disabled>Non Consentito</button>
                                                        <?php else: ?>
                                                            <form method="POST" action="index.php?action=elimina_persona" onsubmit="return confirm('Sei sicuro di voler eliminare DEFINITIVAMENTE questa persona dal database? L\'operazione non è reversibile.');">
                                                                <input type="hidden" name="id" value="<?= $p['id'] ?>">
                                                                <input type="hidden" name="action_mode" value="elimina_definitivo">
                                                                <button type="submit" class="btn btn-sm btn-outline-danger fw-bold">
                                                                    Elimina Definitivo
                                                                </button>
                                                            </form>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="modal-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
                                        <span class="small text-muted"><i class="bi bi-shield-check me-1 text-success"></i> Conforme GDPR e Codice Civile Italiano</span>
                                        <button type="button" class="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Chiudi</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>

<?php if ($totalPages > 1): ?>
    <div class="d-flex justify-content-between align-items-center mt-3">
        <small class="text-muted">Totale anagrafiche: <?= $totalRecords ?> (Pagina <?= $pageNumber ?> di <?= $totalPages ?>)</small>
        <ul class="pagination pagination-sm mb-0">
            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                <li class="page-item <?= $i === $pageNumber ? 'active' : '' ?>">
                    <a class="page-link" href="index.php?page=persone&p=<?= $i ?>&search=<?= urlencode($search) ?>&minorenne=<?= urlencode($filterMinori) ?>&stato=<?= urlencode($filterStato) ?>"><?= $i ?></a>
                </li>
            <?php endfor; ?>
        </ul>
    </div>
<?php endif; ?>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
