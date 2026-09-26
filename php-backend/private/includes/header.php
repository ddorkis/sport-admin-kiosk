<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestionale Sportivo</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body { background-color: #f8f9fa; }
        .sidebar {
            min-height: 100vh;
            background-color: #0d6efd;
            color: #fff;
        }
        .sidebar .nav-link {
            color: rgba(255, 255, 255, 0.85);
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.25rem;
        }
        .sidebar .nav-link:hover, .sidebar .nav-link.active {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.2);
        }
        .sidebar .nav-link.active {
            background-color: #fff;
            color: #0d6efd !important;
            font-weight: 600;
        }
        .table-responsive { box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); border-radius: 0.5rem; background: #fff; }
    </style>
</head>
<body>

<!-- Barra mobile con hamburger (< md) -->
<div class="d-md-none bg-primary text-white p-3 d-flex justify-content-between align-items-center sticky-top shadow-sm">
    <button class="btn btn-primary border border-light-subtle btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
        <i class="bi bi-list fs-5"></i>
    </button>
    <span class="fw-bold"><i class="bi bi-trophy-fill text-warning me-1"></i> SportGestionale</span>
    <a href="index.php?page=kiosk" class="btn btn-warning btn-sm text-dark fw-bold"><i class="bi bi-tablet-landscape"></i></a>
</div>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar per Desktop (>= md: sempre aperta a sinistra) -->
        <nav class="col-md-3 col-lg-2 d-none d-md-flex flex-column sidebar p-3 sticky-top" style="height: 100vh; overflow-y: auto;">
            <div class="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom border-primary-subtle">
                <i class="bi bi-trophy-fill text-warning fs-3"></i>
                <span class="fs-5 fw-bold text-white">SportGestionale</span>
            </div>
            
            <ul class="nav flex-column mb-auto">
                <li class="nav-item"><a class="nav-link <?= ($page==='gestionale'?'active':'') ?>" href="index.php?page=gestionale"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='persone'?'active':'') ?>" href="index.php?page=persone"><i class="bi bi-people me-2"></i> Persone</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='tesserati'?'active':'') ?>" href="index.php?page=tesserati"><i class="bi bi-card-checklist me-2"></i> Tesserati</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='gruppi'?'active':'') ?>" href="index.php?page=gruppi"><i class="bi bi-diagram-3 me-2"></i> Gruppi</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='quote'||$page==='quote_scadute'?'active':'') ?>" href="index.php?page=quote"><i class="bi bi-cash-stack me-2"></i> Quote</a></li>
                <li class="nav-item"><a class="nav-link <?= ($page==='pagamenti'?'active':'') ?>" href="index.php?page=pagamenti"><i class="bi bi-wallet2 me-2"></i> Pagamenti</a></li>
            </ul>

            <div class="pt-3 border-top border-primary-subtle d-flex flex-column gap-2">
                <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold btn-sm shadow-sm w-100">
                    <i class="bi bi-tablet-landscape me-1"></i> Modalità KIOSK
                </a>
                <div class="d-flex justify-content-between align-items-center text-white-50 small mt-2">
                    <span><?= htmlspecialchars($user['nome']) ?></span>
                    <a href="index.php?page=logout" class="btn btn-outline-light btn-sm"><i class="bi bi-box-arrow-right"></i></a>
                </div>
            </div>
        </nav>

        <!-- Offcanvas Sidebar per Mobile (< md) -->
        <div class="offcanvas offcanvas-start bg-primary text-white" tabindex="-1" id="sidebarOffcanvas">
            <div class="offcanvas-header border-bottom border-primary-subtle">
                <h5 class="offcanvas-title fw-bold text-white"><i class="bi bi-trophy-fill text-warning me-2"></i>SportGestionale</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body d-flex flex-column">
                <ul class="nav flex-column mb-auto">
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='gestionale'?'fw-bold':'') ?>" href="index.php?page=gestionale"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='persone'?'fw-bold':'') ?>" href="index.php?page=persone"><i class="bi bi-people me-2"></i> Persone</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='tesserati'?'fw-bold':'') ?>" href="index.php?page=tesserati"><i class="bi bi-card-checklist me-2"></i> Tesserati</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='gruppi'?'fw-bold':'') ?>" href="index.php?page=gruppi"><i class="bi bi-diagram-3 me-2"></i> Gruppi</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='quote'||$page==='quote_scadute'?'fw-bold':'') ?>" href="index.php?page=quote"><i class="bi bi-cash-stack me-2"></i> Quote</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='pagamenti'?'fw-bold':'') ?>" href="index.php?page=pagamenti"><i class="bi bi-wallet2 me-2"></i> Pagamenti</a></li>
                </ul>
                <div class="pt-3 border-top border-primary-subtle">
                    <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold w-100 mb-2">Modalità KIOSK</a>
                    <a href="index.php?page=logout" class="btn btn-outline-light w-100">Disconnetti</a>
                </div>
            </div>
        </div>

        <!-- Contenuto Principale Pagina -->
        <main class="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4">
