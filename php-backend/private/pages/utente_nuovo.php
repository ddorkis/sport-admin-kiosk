<?php
/**
 * Pagina Dedicata: Nuovo Utente / Operatore Kiosk
 * Posizione: /private/pages/utente_nuovo.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
?>

<!-- Breadcrumb -->
<nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.php?page=gestionale" class="text-decoration-none">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="index.php?page=utenti" class="text-decoration-none">Utenti & Kiosk</a></li>
        <li class="breadcrumb-item active" aria-current="page">Nuovo Utente</li>
    </ol>
</nav>

<!-- Header della Pagina -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <div>
        <h2 class="h3 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-person-gear text-primary me-2"></i>
            Nuovo Profilo Utente / Postazione
        </h2>
        <p class="text-muted small mb-0">
            Crea credenziali per operatori, amministratori o configura un terminale touch Kiosk per la reception
        </p>
    </div>
    <div>
        <a href="index.php?page=utenti" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Annulla e Torna agli Utenti
        </a>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-8 col-xl-7">
        <form method="POST" action="index.php?action=salva_utente">
            <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div class="card-header bg-white border-bottom py-3 px-4">
                    <h5 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-shield-lock text-primary me-2"></i> Credenziali e Permessi
                    </h5>
                </div>

                <div class="card-body p-4">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Nome Utente (Username) <span class="text-danger">*</span></label>
                            <input type="text" name="username" class="form-control font-monospace" placeholder="es. desk.reception" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Nome Completo / Operatore <span class="text-danger">*</span></label>
                            <input type="text" name="nome" class="form-control" placeholder="es. Reception Desk 1" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Password Iniziale</label>
                            <input type="password" name="password" class="form-control" placeholder="Default: password">
                            <div class="form-text small">Lascia vuoto per impostare la password predefinita: 'password'.</div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Ruolo Operativo <span class="text-danger">*</span></label>
                            <select name="ruolo" class="form-select" required>
                                <option value="operatore" selected>Operatore Segreteria (Gestione ordinaria)</option>
                                <option value="desk">Desk Reception (Accoglienza & Pagamenti)</option>
                                <option value="admin">Amministratore Completo</option>
                            </select>
                        </div>

                        <div class="col-12">
                            <div class="p-3 bg-light rounded-3 border">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="is_kiosk" id="chkKiosk" value="1">
                                    <label class="form-check-label fw-bold text-dark" for="chkKiosk">
                                        <i class="bi bi-tablet-landscape text-warning me-1"></i> Abilita Avvio Diretto in Modalità KIOSK
                                    </label>
                                </div>
                                <div class="small text-muted mt-1">
                                    Se attivo, al momento del login l'utente viene indirizzato all'interfaccia semplificata touch-screen per tablet da reception.
                                </div>
                            </div>
                        </div>

                        <div class="col-12">
                            <label class="form-label fw-bold">Stato Profilo</label>
                            <select name="attivo" class="form-select">
                                <option value="1" selected>Attivo (Può effettuare l'accesso)</option>
                                <option value="0">Disattivato</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center">
                    <a href="index.php?page=utenti" class="btn btn-light border px-4">Annulla</a>
                    <button type="submit" class="btn btn-primary fw-bold px-4 shadow-sm">
                        <i class="bi bi-check-circle me-1"></i> Crea Utente
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
