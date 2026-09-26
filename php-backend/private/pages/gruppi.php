<?php
/**
 * Gestione Gruppi & Corsi Sportivi Annuali
 * Posizione: /private/pages/gruppi.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
$db = getDbConnection();

// Recupera anni sportivi e anno attivo
$anni = $db->query("SELECT * FROM anno ORDER BY id DESC")->fetchAll();
$annoAttivoId = $annoAttivo['id'] ?? ($anni[0]['id'] ?? 1);

// Recupera gruppi con conteggio iscritti e quote generate
$stmt = $db->prepare("
    SELECT g.*, a.anno,
           (SELECT COUNT(*) FROM gruppi_tesserati gt WHERE gt.gruppo_id = g.id) AS num_iscritti,
           (SELECT COUNT(*) FROM quote q WHERE q.gruppo_id = g.id AND q.stato != 'annullata') AS num_quote
    FROM gruppi g
    INNER JOIN anno a ON g.anno_id = a.id
    ORDER BY g.id DESC
");
$stmt->execute();
$gruppi = $stmt->fetchAll();

// Recupera tutti i tesserati dell'anno per l'iscrizione rapida
$stmtT = $db->prepare("
    SELECT t.id AS tesserato_id, t.numero_tessera, p.nome, p.cognome, p.is_minorenne
    FROM tesserati t
    INNER JOIN persone p ON t.persona_id = p.id
    WHERE t.stato = 'Attivo'
    ORDER BY p.cognome ASC, p.nome ASC
");
$stmtT->execute();
$tesseratiAttivi = $stmtT->fetchAll();

// Recupera tutti gli iscritti con dettagli persona per ciascun gruppo
$stmtIscritti = $db->query("
    SELECT gt.id AS iscrizione_id, gt.gruppo_id, gt.data_iscrizione, gt.note,
           t.id AS tesserato_id, t.numero_tessera,
           p.nome, p.cognome, p.is_minorenne, p.tutore_nome, p.tutore_cognome, p.tutore_telefono
    FROM gruppi_tesserati gt
    INNER JOIN tesserati t ON gt.tesserato_id = t.id
    INNER JOIN persone p ON t.persona_id = p.id
    ORDER BY p.cognome ASC, p.nome ASC
");
$tuttiIscritti = $stmtIscritti->fetchAll();
$iscrittiPerGruppo = [];
foreach ($tuttiIscritti as $isc) {
    $iscrittiPerGruppo[$isc['gruppo_id']][] = $isc;
}
?>

<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-diagram-3 text-primary me-2"></i> Gestione Gruppi & Corsi Annuali
        </h2>
        <p class="text-muted small mb-0">
            Configurazione corsi sportivi e generazione quote automatiche mensili per il periodo di attività
        </p>
    </div>
    <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#modalIscriviGruppo">
            <i class="bi bi-person-plus me-1"></i> Iscrivi Atleta a Gruppo
        </button>
        <button class="btn btn-primary fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#modalNuovoGruppo">
            <i class="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
        </button>
    </div>
</div>

<!-- Banner Informativo Automatismo Quote -->
<div class="alert alert-info border-info d-flex align-items-center mb-4 shadow-sm p-3 rounded-3">
    <i class="bi bi-gear-wide-connected fs-2 me-3 text-primary flex-shrink-0"></i>
    <div class="small">
        <strong>Automatismo Quote Mensili:</strong> Ogni gruppo ha una data di inizio, una data di fine e una quota mensile.
        Quando un atleta viene iscritto al gruppo (o quando clicchi su <em>"Genera Quote"</em>), il sistema calcola e inserisce automaticamente tutte le rate mensili dal mese di inizio al mese di fine, con scadenza al giorno mensile indicato.
    </div>
</div>

<!-- Griglia Schede Gruppi -->
<?php if (empty($gruppi)): ?>
    <div class="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
        <i class="bi bi-diagram-3 fs-1 mb-3 text-secondary"></i>
        <h5>Nessun gruppo o corso configurato</h5>
        <p class="small mb-3">Crea il tuo primo gruppo sportivo per organizzare atleti, rate mensili e istruttori.</p>
        <div>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalNuovoGruppo">
                <i class="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
            </button>
        </div>
    </div>
<?php else: ?>
    <div class="row g-4 mb-4">
        <?php foreach ($gruppi as $g): ?>
            <?php 
                $iscrittiGruppo = $iscrittiPerGruppo[$g['id']] ?? [];
                $numIscritti = count($iscrittiGruppo);
            ?>
            <div class="col-12 col-md-6 col-xl-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-white d-flex flex-column">
                    <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
                        <div>
                            <span class="badge bg-primary-subtle text-primary mb-2 px-2 py-1">
                                <?= htmlspecialchars($g['categoria'] ?: 'Corso Sportivo') ?>
                            </span>
                            <h5 class="fw-bold text-dark mb-1"><?= htmlspecialchars($g['nome_gruppo']) ?></h5>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-success-subtle text-success fs-6 fw-bold">
                                € <?= number_format($g['quota_mensile'], 2, ',', '.') ?> / mese
                            </span>
                        </div>
                    </div>

                    <div class="card-body px-4 py-3 flex-grow-1">
                        <p class="text-muted small mb-3"><?= htmlspecialchars($g['descrizione'] ?: 'Nessuna descrizione specificata.') ?></p>

                        <div class="bg-light p-3 rounded-3 small mb-3">
                            <div class="row g-2">
                                <div class="col-6">
                                    <span class="text-muted d-block">Periodo Corso:</span>
                                    <strong><?= date('d/m/Y', strtotime($g['data_inizio'])) ?> &bull; <?= date('d/m/Y', strtotime($g['data_fine'])) ?></strong>
                                </div>
                                <div class="col-6">
                                    <span class="text-muted d-block">Giorno Scadenza:</span>
                                    <strong>Ogni <?= (int)$g['giorno_scadenza_mensile'] ?> del mese</strong>
                                </div>
                                <div class="col-12">
                                    <span class="text-muted d-block">Istruttore Responsabile:</span>
                                    <strong class="text-primary"><?= htmlspecialchars($g['istruttore'] ?: 'Non assegnato') ?></strong>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center small text-muted">
                            <span>
                                <i class="bi bi-people-fill me-1 text-secondary"></i>
                                <strong><?= $numIscritti ?></strong> atleti iscritti
                            </span>
                            <span>
                                <i class="bi bi-receipt me-1 text-secondary"></i>
                                <strong><?= (int)$g['num_quote'] ?></strong> quote attive
                            </span>
                        </div>
                    </div>

                    <div class="card-footer bg-white border-top p-3 d-flex flex-wrap gap-2">
                        <button
                            type="button"
                            class="btn btn-outline-secondary btn-sm flex-fill"
                            data-bs-toggle="modal"
                            data-bs-target="#modalIscritti_<?= $g['id'] ?>"
                        >
                            <i class="bi bi-list-ul me-1"></i> Elenco Iscritti (<?= $numIscritti ?>)
                        </button>

                        <a
                            href="index.php?action=genera_quote&gruppo_id=<?= $g['id'] ?>&redirect=gruppi"
                            class="btn btn-outline-primary btn-sm flex-fill fw-bold"
                            title="Calcola e inserisce automaticamente le quote mensili per tutti gli iscritti"
                            onclick="return confirm('Generare/sincronizzare tutte le rate mensili per gli iscritti di questo gruppo?');"
                        >
                            <i class="bi bi-lightning-charge me-1"></i> Genera Quote
                        </a>

                        <form method="POST" action="index.php?action=elimina_gruppo" class="d-inline" onsubmit="return confirm('Sei sicuro di voler eliminare il gruppo <?= htmlspecialchars(addslashes($g['nome_gruppo'])) ?>? Verranno rimosse le iscrizioni associate.');">
                            <input type="hidden" name="id" value="<?= $g['id'] ?>">
                            <button type="submit" class="btn btn-outline-danger btn-sm px-2" title="Elimina Gruppo">
                                <i class="bi bi-trash"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal Elenco Iscritti Gruppo -->
            <div class="modal fade" id="modalIscritti_<?= $g['id'] ?>" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 rounded-4 shadow">
                        <div class="modal-header bg-light">
                            <h5 class="modal-title fw-bold">
                                <i class="bi bi-people-fill me-2 text-primary"></i>
                                Atleti Iscritti a: <?= htmlspecialchars($g['nome_gruppo']) ?>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <?php if (empty($iscrittiGruppo)): ?>
                                <div class="text-center py-4 text-muted">
                                    <i class="bi bi-person-x fs-1 d-block mb-2 text-secondary"></i>
                                    Nessun atleta attualmente iscritto a questo gruppo.
                                </div>
                            <?php else: ?>
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead class="table-light small text-uppercase">
                                            <tr>
                                                <th>Tessera</th>
                                                <th>Nominativo</th>
                                                <th>Data Iscrizione</th>
                                                <th>Stato / Tutore</th>
                                                <th class="text-end">Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($iscrittiGruppo as $isc): ?>
                                                <tr>
                                                    <td><code><?= htmlspecialchars($isc['numero_tessera']) ?></code></td>
                                                    <td><strong><?= htmlspecialchars($isc['cognome'] . ' ' . $isc['nome']) ?></strong></td>
                                                    <td><?= date('d/m/Y', strtotime($isc['data_iscrizione'])) ?></td>
                                                    <td>
                                                        <?php if ($isc['is_minorenne']): ?>
                                                            <span class="badge bg-warning text-dark">
                                                                Minorenne (Tutore: <?= htmlspecialchars($isc['tutore_cognome'] . ' ' . $isc['tutore_nome'] . ($isc['tutore_telefono'] ? ' - ' . $isc['tutore_telefono'] : '')) ?>)
                                                            </span>
                                                        <?php else: ?>
                                                            <span class="badge bg-secondary">Maggiorenne</span>
                                                        <?php endif; ?>
                                                    </td>
                                                    <td class="text-end">
                                                        <form method="POST" action="index.php?action=disiscrivi_gruppo" class="d-inline" onsubmit="return confirm('Disiscrivere questo atleta dal gruppo?');">
                                                            <input type="hidden" name="gruppo_id" value="<?= $g['id'] ?>">
                                                            <input type="hidden" name="tesserato_id" value="<?= $isc['tesserato_id'] ?>">
                                                            <input type="hidden" name="annulla_quote_future" value="1">
                                                            <button type="submit" class="btn btn-sm btn-outline-danger" title="Disiscrivi atleta dal corso e annulla quote non saldate future">
                                                                <i class="bi bi-person-x me-1"></i> Disiscrivi
                                                            </button>
                                                        </form>
                                                    </td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<!-- MODAL: CREA NUOVO GRUPPO -->
<div class="modal fade" id="modalNuovoGruppo" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title fw-bold">
                    <i class="bi bi-plus-circle me-2"></i> Crea Nuovo Gruppo o Corso Sportivo
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="index.php?action=salva_gruppo">
                <div class="modal-body p-4">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <label class="form-label fw-bold">Nome Gruppo / Corso <span class="text-danger">*</span></label>
                            <input type="text" name="nome_gruppo" class="form-control" placeholder="es. Basket Under 14 Maschile, Pattinaggio Base" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Anno Sportivo <span class="text-danger">*</span></label>
                            <select name="anno_id" class="form-select" required>
                                <?php foreach ($anni as $a): ?>
                                    <option value="<?= $a['id'] ?>" <?= (!empty($a['attivo']) ? 'selected' : '') ?>><?= htmlspecialchars($a['anno']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Categoria Disciplina</label>
                            <input type="text" name="categoria" class="form-control" placeholder="es. Giovanile, Avviamento, Agonistica">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Istruttore / Allenatore Responsabile</label>
                            <input type="text" name="istruttore" class="form-control" placeholder="es. Coach Marco Rossi">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Quota Mensile Richiesta (€) <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text">€</span>
                                <input type="number" step="0.50" name="quota_mensile" class="form-control" value="60.00" required>
                                <span class="input-group-text">/ mese</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Giorno di Scadenza Rate <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text">Ogni</span>
                                <input type="number" min="1" max="28" name="giorno_scadenza_mensile" class="form-control" value="10" required>
                                <span class="input-group-text">del mese</span>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Inizio Corso <span class="text-danger">*</span></label>
                            <input type="date" name="data_inizio" class="form-control" value="2024-09-01" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Data Fine Corso <span class="text-danger">*</span></label>
                            <input type="date" name="data_fine" class="form-control" value="2025-05-31" required>
                        </div>

                        <div class="col-12">
                            <label class="form-label fw-bold">Descrizione / Giorni e Orari Allenamento</label>
                            <textarea name="descrizione" class="form-control" rows="2" placeholder="es. Allenamenti Lunedì e Mercoledì dalle 17:00 alle 18:30 presso Palazzetto dello Sport"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="submit" class="btn btn-primary fw-bold"><i class="bi bi-check-lg me-1"></i> Salva e Crea Gruppo</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- MODAL: ISCRIVI ATLETA A GRUPPO -->
<div class="modal fade" id="modalIscriviGruppo" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title fw-bold">
                    <i class="bi bi-person-plus me-2"></i> Iscrivi Atleta a Gruppo
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="index.php?action=iscrivi_gruppo">
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Seleziona Corso / Gruppo <span class="text-danger">*</span></label>
                        <select name="gruppo_id" class="form-select" required>
                            <option value="">-- Seleziona un gruppo --</option>
                            <?php foreach ($gruppi as $g): ?>
                                <option value="<?= $g['id'] ?>">
                                    <?= htmlspecialchars($g['nome_gruppo']) ?> (€ <?= number_format($g['quota_mensile'], 2) ?>/mese)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Seleziona Atleta Tesserato <span class="text-danger">*</span></label>
                        <select name="tesserato_id" class="form-select" required>
                            <option value="">-- Seleziona atleta --</option>
                            <?php foreach ($tesseratiAttivi as $t): ?>
                                <option value="<?= $t['tesserato_id'] ?>">
                                    <?= htmlspecialchars($t['cognome'] . ' ' . $t['nome']) ?> (Tessera: <?= htmlspecialchars($t['numero_tessera']) ?><?= $t['is_minorenne'] ? ' - Minorenne' : '' ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Data Iscrizione</label>
                        <input type="date" name="data_iscrizione" class="form-control" value="<?= date('Y-m-d') ?>" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Note Iscrizione</label>
                        <input type="text" name="note" class="form-control" placeholder="es. Iscrizione con prova completata">
                    </div>

                    <div class="form-check p-3 bg-light rounded-3">
                        <input class="form-check-input" type="checkbox" name="genera_quote" value="1" id="checkGeneraQuote" checked>
                        <label class="form-check-label small fw-bold" for="checkGeneraQuote">
                            Genera subito automaticamente tutte le rate mensili del corso per questo atleta
                        </label>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="submit" class="btn btn-primary fw-bold"><i class="bi bi-check-lg me-1"></i> Conferma Iscrizione</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
