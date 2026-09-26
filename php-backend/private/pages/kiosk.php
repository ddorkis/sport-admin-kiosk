<?php
/**
 * Interfaccia KIOSK (Pulsanti Grandi per Touch Screen / Desk Reception)
 * Posizione: /private/pages/kiosk.php
 */
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postazione Kiosk Sportiva</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); min-height: 100vh; color: #f8fafc; }
        .kiosk-btn {
            min-height: 150px;
            font-size: 1.35rem;
            font-weight: 700;
            border-radius: 1.25rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.15);
        }
        .kiosk-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.6);
        }
        .kiosk-icon { font-size: 3.5rem; margin-bottom: 0.5rem; }
    </style>
</head>
<body class="p-3 p-md-5">
<div class="container-fluid max-w-6xl">
    <!-- Header Kiosk -->
    <div class="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom border-secondary">
        <div>
            <span class="badge bg-warning text-dark px-3 py-2 fs-6 fw-bold mb-2">
                <i class="bi bi-display me-1"></i> MODALITÀ TOTEM / RECEPTION
            </span>
            <h1 class="h2 fw-bold text-white mb-0">Sport Desk Accoglienza</h1>
        </div>
        <div class="d-flex gap-2">
            <a href="index.php?page=gestionale" class="btn btn-outline-light btn-lg px-4">
                <i class="bi bi-gear-fill me-2"></i> Vai al Gestionale
            </a>
            <a href="index.php?page=logout" class="btn btn-danger btn-lg px-4">
                <i class="bi bi-power me-2"></i> Esci
            </a>
        </div>
    </div>

    <!-- Griglia dei 4 Bottoni Grandi Kiosk -->
    <div class="row g-4 mb-4">
        <!-- 1. Inserimento Persona e Tutore -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-primary w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalNuovaPersona">
                <i class="bi bi-person-plus-fill kiosk-icon"></i>
                <span>Nuova Persona</span>
                <small class="fw-normal text-white-50 fs-6 mt-1">Anagrafica & Tutore Minorenni</small>
            </button>
        </div>

        <!-- 2. Nuovo Tesseramento -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-success w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalTesseramento">
                <i class="bi bi-card-heading kiosk-icon"></i>
                <span>Tesseramento</span>
                <small class="fw-normal text-white-50 fs-6 mt-1">Assegna Anno e Tessera</small>
            </button>
        </div>

        <!-- 3. Registra Pagamento Rapido -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-warning text-dark w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalPagamentoRapido">
                <i class="bi bi-cash-coin kiosk-icon"></i>
                <span>Registra Pagamento</span>
                <small class="fw-normal text-dark-50 fs-6 mt-1">Quota mensile o cassa libera</small>
            </button>
        </div>

        <!-- 4. Cerca Anagrafica / Stato Atleta -->
        <div class="col-md-6 col-lg-3">
            <button class="btn btn-info text-white w-100 kiosk-btn" data-bs-toggle="modal" data-bs-target="#modalCercaAnagrafica">
                <i class="bi bi-search kiosk-icon"></i>
                <span>Cerca Anagrafica</span>
                <small class="fw-normal text-white-50 fs-6 mt-1">Stato quote e pagamenti</small>
            </button>
        </div>
    </div>
</div>
<!-- Bootstrap 5 JS Bundle (100% Offline in locale) -->
<script src="assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
