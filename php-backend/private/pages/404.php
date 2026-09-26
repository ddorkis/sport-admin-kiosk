<?php
/**
 * Errore 404 - Pagina non trovata
 * Posizione: /private/pages/404.php
 */
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/header.php';
?>
<div class="text-center py-5">
    <div class="display-1 fw-bold text-muted mb-2">404</div>
    <h3 class="fw-bold mb-3">Pagina non trovata</h3>
    <p class="text-muted mb-4">La sezione richiesta non esiste o non è accessibile con i tuoi permessi.</p>
    <a href="index.php?page=gestionale" class="btn btn-primary px-4 fw-bold">
        <i class="bi bi-speedometer2 me-1"></i> Torna alla Dashboard
    </a>
</div>
<?php require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : __DIR__ . '/../includes') . '/footer.php'; ?>
