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
           (SELECT COUNT(*) FROM quote q WHERE q.gruppo_id = g.id AND q.stato != 'annullata') AS num_quote,
           (SELECT COUNT(*) FROM quote q WHERE q.gruppo_id = g.id AND q.stato = 'annullata') AS num_quote_annullate,
           (SELECT COUNT(*) FROM quote q WHERE q.gruppo_id = g.id AND q.stato IN ('da_pagare', 'parziale')) AS num_quote_aperte
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
            Configurazione corsi sportivi, anagrafica squadre e automazione quote mensili per il periodo di attività
        </p>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php?page=iscrizione_gruppo" class="btn btn-outline-primary">
            <i class="bi bi-person-plus me-1"></i> Iscrivi Atleta a Gruppo
        </a>
        <a href="index.php?page=gruppo_nuovo" class="btn btn-primary fw-bold shadow-sm">
            <i class="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
        </a>
    </div>
</div>

<!-- Guida Rapida: Modifica Nome vs Variazione Importo -->
<div class="alert alert-light border shadow-sm p-3 rounded-3 mb-4">
    <div class="d-flex align-items-start gap-3">
        <div class="p-2 bg-primary-subtle text-primary rounded-3 flex-shrink-0">
            <i class="bi bi-lightbulb-fill fs-4"></i>
        </div>
        <div class="small text-secondary">
            <strong class="text-dark d-block mb-1">
                Guida Amministrativa: Rinominare un Gruppo vs Variare l'Importo della Quota
            </strong>
            <div class="row g-2 mt-1">
                <div class="col-md-6">
                    <span class="badge bg-primary text-white me-1">Solo Cambio Nome / Dati</span>
                    Vuoi correggere o aggiornare il nome, la descrizione o l'istruttore del corso? Clicca su 
                    <strong>"Modifica"</strong>. Il gruppo viene rinominato istantaneamente e tutte le quote già emesse o saldate mantengono il loro storico intatto.
                </div>
                <div class="col-md-6">
                    <span class="badge bg-warning text-dark me-1">Variazione Importo a Stagione In Corso</span>
                    Se intendi applicare una nuova tariffa (es. da € 50 a € 65/mese), la regola contabile corretta è cliccare su 
                    <strong>"Disattiva & Quote"</strong>: il corso viene chiuso, le rate future non pagate vengono sgravate in automatico, e crei subito il nuovo gruppo con il nuovo importo.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Griglia Schede Gruppi -->
<?php if (empty($gruppi)): ?>
    <div class="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
        <i class="bi bi-diagram-3 fs-1 mb-3 text-secondary"></i>
        <h5>Nessun gruppo o corso configurato</h5>
        <p class="small mb-3">Crea il tuo primo gruppo sportivo per organizzare atleti, rate mensili e istruttori.</p>
        <div>
            <a href="index.php?page=gruppo_nuovo" class="btn btn-primary">
                <i class="bi bi-plus-lg me-1"></i> Crea Nuovo Gruppo
            </a>
        </div>
    </div>
<?php else: ?>
    <div class="row g-4 mb-4">
        <?php foreach ($gruppi as $g): ?>
            <?php 
                $iscrittiGruppo = $iscrittiPerGruppo[$g['id']] ?? [];
                $numIscritti = count($iscrittiGruppo);
                $isAttivo = isset($g['attivo']) ? (bool)$g['attivo'] : true;
            ?>
            <div class="col-12 col-md-6 col-xl-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-white d-flex flex-column <?= !$isAttivo ? 'opacity-75 border border-dashed' : '' ?>">
                    <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <span class="badge bg-primary-subtle text-primary px-2 py-1">
                                    <?= htmlspecialchars($g['categoria'] ?: 'Corso Sportivo') ?>
                                </span>
                                <?php if ($isAttivo): ?>
                                    <span class="badge bg-success-subtle text-success border border-success-subtle">
                                        <i class="bi bi-check-circle me-1"></i> Attivo
                                    </span>
                                <?php else: ?>
                                    <span class="badge bg-secondary-subtle text-secondary border">
                                        <i class="bi bi-pause-circle me-1"></i> Disattivato
                                    </span>
                                <?php endif; ?>
                            </div>
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
                                <?php if (!empty($g['num_quote_annullate'])): ?>
                                    <span class="text-danger ms-1">(<?= (int)$g['num_quote_annullate'] ?> sgravate)</span>
                                <?php endif; ?>
                            </span>
                        </div>
                    </div>

                    <div class="card-footer bg-white border-top p-3 d-flex flex-wrap gap-2">
                        <!-- Elenco Iscritti -->
                        <button
                            type="button"
                            class="btn btn-outline-secondary btn-sm flex-fill"
                            data-bs-toggle="modal"
                            data-bs-target="#modalIscritti_<?= $g['id'] ?>"
                        >
                            <i class="bi bi-list-ul me-1"></i> Iscritti (<?= $numIscritti ?>)
                        </button>

                        <!-- Modifica Nome e Dati -->
                        <a
                            href="index.php?page=gruppo_nuovo&id=<?= $g['id'] ?>"
                            class="btn btn-outline-primary btn-sm flex-fill fw-semibold"
                            title="Modifica nome, orari o dettagli del corso"
                        >
                            <i class="bi bi-pencil me-1"></i> Modifica
                        </a>

                        <?php if ($isAttivo): ?>
                            <!-- Genera Quote -->
                            <a
                                href="index.php?action=genera_quote&gruppo_id=<?= $g['id'] ?>&redirect=gruppi"
                                class="btn btn-primary btn-sm flex-fill fw-bold"
                                title="Calcola e inserisce automaticamente le quote mensili per tutti gli iscritti"
                                onclick="return confirm('Generare/sincronizzare tutte le rate mensili per gli iscritti di questo gruppo?');"
                            >
                                <i class="bi bi-lightning-charge me-1"></i> Genera Quote
                            </a>

                            <!-- Disattiva & Quote Future -->
                            <button
                                type="button"
                                class="btn btn-outline-warning btn-sm"
                                data-bs-toggle="modal"
                                data-bs-target="#modalDisattivaGruppo_<?= $g['id'] ?>"
                                title="Disattiva corso e sgrova le rate future non saldate"
                            >
                                <i class="bi bi-pause-circle me-1"></i> Disattiva & Quote
                            </button>
                        <?php else: ?>
                            <!-- Riattiva -->
                            <form method="POST" action="index.php?action=riattiva_gruppo" class="d-inline flex-fill">
                                <input type="hidden" name="gruppo_id" value="<?= $g['id'] ?>">
                                <button type="submit" class="btn btn-outline-success btn-sm w-100" title="Riattiva questo corso">
                                    <i class="bi bi-play-circle me-1"></i> Riattiva Corso
                                </button>
                            </form>
                        <?php endif; ?>

                        <!-- Elimina -->
                        <form method="POST" action="index.php?action=elimina_gruppo" class="d-inline" onsubmit="return confirm('Sei sicuro di voler eliminare il gruppo <?= htmlspecialchars(addslashes($g['nome_gruppo'])) ?>? Verranno rimosse le iscrizioni associate.');">
                            <input type="hidden" name="id" value="<?= $g['id'] ?>">
                            <button type="submit" class="btn btn-outline-danger btn-sm px-2" title="Elimina Gruppo">
                                <i class="bi bi-trash"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal Disattivazione Gruppo & Sgravio Quote Future -->
            <?php if ($isAttivo): ?>
                <div class="modal fade" id="modalDisattivaGruppo_<?= $g['id'] ?>" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                            <div class="modal-header bg-warning text-dark py-3 px-4">
                                <h5 class="modal-title fw-bold d-flex align-items-center mb-0">
                                    <i class="bi bi-pause-circle-fill me-2 fs-4"></i>
                                    Disattivazione Corso & Gestione Quote Future
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <form method="POST" action="index.php?action=disattiva_gruppo">
                                <input type="hidden" name="gruppo_id" value="<?= $g['id'] ?>">
                                <div class="modal-body p-4">
                                    <div class="alert alert-info border-info d-flex align-items-start p-3 rounded-3 mb-4 shadow-sm">
                                        <i class="bi bi-info-circle-fill fs-3 text-primary me-3 flex-shrink-0 mt-1"></i>
                                        <div class="small">
                                            <strong class="d-block mb-1 fs-6">Procedura Corretta di Variazione Importo:</strong>
                                            Stai per disattivare il corso <strong>"<?= htmlspecialchars($g['nome_gruppo']) ?>"</strong>.
                                            Lo storico e i pagamenti già effettuati rimarranno registrati e intatti.
                                            Contestualmente puoi <strong>annullare in massa tutte le quote future non saldate</strong> a partire da una data a tua scelta, e poi creare subito il nuovo gruppo con il nuovo importo.
                                        </div>
                                    </div>

                                    <div class="row g-3 mb-4">
                                        <div class="col-md-6">
                                            <label class="form-label fw-bold text-dark">
                                                <i class="bi bi-calendar-x me-1 text-danger"></i> Data Decorrenza Disattivazione *
                                            </label>
                                            <input type="date" name="data_interruzione" class="form-control form-control-lg fw-semibold" value="<?= date('Y-m-d') ?>" required>
                                            <div class="form-text small">Le quote con scadenza pari o successiva a tale data verranno sgravate.</div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label fw-bold text-dark">
                                                <i class="bi bi-chat-left-text me-1 text-secondary"></i> Motivo Sgravio Quote
                                            </label>
                                            <input type="text" name="motivo" class="form-control form-control-lg" value="Rimodulazione corso per variazione tariffa" required>
                                            <div class="form-text small">Annotato sulle note di ciascuna quota annullata.</div>
                                        </div>
                                    </div>

                                    <div class="card border-warning-subtle bg-warning-subtle bg-opacity-25 rounded-3 mb-4 p-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" role="switch" id="chkAnnullaQuote_<?= $g['id'] ?>" name="annulla_quote_future" value="1" checked>
                                            <label class="form-check-label fw-bold text-dark" for="chkAnnullaQuote_<?= $g['id'] ?>">
                                                Annulla automaticamente tutte le quote non ancora saldate (da pagare / parziali) dal giorno specificato in poi
                                            </label>
                                            <div class="text-muted small ps-4">
                                                Attualmente vi sono <strong><?= (int)$g['num_quote_aperte'] ?></strong> quote aperte per questo corso.
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-check form-switch p-3 bg-light rounded-3 border">
                                        <input class="form-check-input ms-0 me-3" type="checkbox" role="switch" id="chkCreaNuovo_<?= $g['id'] ?>" name="crea_nuovo" value="1" checked>
                                        <label class="form-check-label fw-bold text-dark" for="chkCreaNuovo_<?= $g['id'] ?>">
                                            <i class="bi bi-plus-circle text-primary me-1"></i> Apri subito la schermata per creare il nuovo gruppo con il nuovo importo
                                        </label>
                                    </div>
                                </div>
                                <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Annulla</button>
                                    <button type="submit" class="btn btn-danger fw-bold shadow-sm px-4">
                                        <i class="bi bi-check-lg me-1"></i> Conferma Disattivazione Corso
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

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

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
