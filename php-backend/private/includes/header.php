<?php
$headerDb = function_exists('getDbConnection') ? getDbConnection() : null;
$annoAttivo = null;
$scaduteCount = 0;
if ($headerDb) {
    try {
        $annoAttivo = $headerDb->query("SELECT * FROM anno WHERE attivo = 1 LIMIT 1")->fetch();
        $scaduteCount = (int)$headerDb->query("SELECT COUNT(*) FROM quote WHERE stato != 'pagata' AND stato != 'annullata' AND data_scadenza < CURDATE()")->fetchColumn();
    } catch (Exception $e) {}
}
if (!$annoAttivo) {
    $annoAttivo = ['anno' => '2024/2025'];
}
?>
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
            display: flex;
            align-items: center;
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
    <div class="d-flex align-items-center gap-2">
        <span class="fw-bold"><i class="bi bi-trophy-fill text-warning me-1"></i> SportGestionale</span>
        <span class="badge bg-light text-primary small"><?= htmlspecialchars($annoAttivo['anno']) ?></span>
    </div>
    <a href="index.php?page=kiosk" class="btn btn-warning btn-sm text-dark fw-bold"><i class="bi bi-tablet-landscape"></i></a>
</div>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar per Desktop (>= md: sempre aperta a sinistra) -->
        <nav class="col-md-3 col-lg-2 d-none d-md-flex flex-column sidebar p-3 sticky-top" style="height: 100vh; overflow-y: auto;">
            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-primary-subtle">
                <i class="bi bi-trophy-fill text-warning fs-3"></i>
                <div>
                    <span class="fs-6 fw-bold text-white d-block lh-1">SportGestionale</span>
                    <span class="badge bg-white text-primary mt-1" style="font-size: 0.7rem;">Anno: <?= htmlspecialchars($annoAttivo['anno']) ?></span>
                </div>
            </div>
            
            <ul class="nav flex-column mb-auto">
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='gestionale'?'active':'') ?>" href="index.php?page=gestionale">
                        <i class="bi bi-speedometer2 me-2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='persone'?'active':'') ?>" href="index.php?page=persone">
                        <i class="bi bi-people me-2"></i> Persone & Tutori
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='tesserati'?'active':'') ?>" href="index.php?page=tesserati">
                        <i class="bi bi-card-checklist me-2"></i> Tesserati
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='gruppi'?'active':'') ?>" href="index.php?page=gruppi">
                        <i class="bi bi-diagram-3 me-2"></i> Gruppi & Corsi
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='quote'||$page==='quote_scadute'?'active':'') ?>" href="index.php?page=quote">
                        <i class="bi bi-cash-stack me-2"></i> Quote Mensili
                        <?php if ($scaduteCount > 0): ?>
                            <span class="badge bg-danger rounded-pill ms-auto px-2 py-1" style="font-size: 0.65rem;"><?= $scaduteCount ?> scadute</span>
                        <?php endif; ?>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='previsioni'?'active':'') ?>" href="index.php?page=previsioni">
                        <i class="bi bi-graph-up-arrow me-2 text-warning"></i> Previsione & Budget
                        <span class="badge bg-success-subtle text-success border border-success-subtle ms-auto" style="font-size: 0.65rem;">Bilancio</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='pagamenti'?'active':'') ?>" href="index.php?page=pagamenti">
                        <i class="bi bi-wallet2 me-2"></i> Pagamenti
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='utenti'?'active':'') ?>" href="index.php?page=utenti">
                        <i class="bi bi-person-gear me-2"></i> Utenti & Kiosk
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page==='associazione'?'active':'') ?>" href="index.php?page=associazione">
                        <i class="bi bi-building-gear me-2"></i> Dati Associazione
                    </a>
                </li>
            </ul>

            <div class="pt-3 border-top border-primary-subtle d-flex flex-column gap-2">
                <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold btn-sm shadow-sm w-100">
                    <i class="bi bi-tablet-landscape me-1"></i> Modalità KIOSK
                </a>
                <div class="d-flex justify-content-between align-items-center text-white-50 small mt-2">
                    <span class="text-truncate" style="max-width: 100px;"><?= htmlspecialchars($user['nome'] ?? 'Utente') ?></span>
                    <a href="index.php?page=logout" class="btn btn-outline-light btn-sm" title="Disconnetti"><i class="bi bi-box-arrow-right"></i></a>
                </div>
            </div>
        </nav>

        <!-- Offcanvas Sidebar per Mobile (< md) -->
        <div class="offcanvas offcanvas-start bg-primary text-white" tabindex="-1" id="sidebarOffcanvas">
            <div class="offcanvas-header border-bottom border-primary-subtle">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-trophy-fill text-warning fs-4"></i>
                    <div>
                        <h6 class="offcanvas-title fw-bold text-white mb-0">SportGestionale</h6>
                        <small class="text-white-50">Anno: <?= htmlspecialchars($annoAttivo['anno']) ?></small>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body d-flex flex-column">
                <ul class="nav flex-column mb-auto">
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='gestionale'?'fw-bold':'') ?>" href="index.php?page=gestionale"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='persone'?'fw-bold':'') ?>" href="index.php?page=persone"><i class="bi bi-people me-2"></i> Persone & Tutori</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='tesserati'?'fw-bold':'') ?>" href="index.php?page=tesserati"><i class="bi bi-card-checklist me-2"></i> Tesserati</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='gruppi'?'fw-bold':'') ?>" href="index.php?page=gruppi"><i class="bi bi-diagram-3 me-2"></i> Gruppi & Corsi</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='quote'||$page==='quote_scadute'?'fw-bold':'') ?>" href="index.php?page=quote"><i class="bi bi-cash-stack me-2"></i> Quote Mensili</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='previsioni'?'fw-bold':'') ?>" href="index.php?page=previsioni"><i class="bi bi-graph-up-arrow me-2 text-warning"></i> Previsione & Budget</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='pagamenti'?'fw-bold':'') ?>" href="index.php?page=pagamenti"><i class="bi bi-wallet2 me-2"></i> Pagamenti</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='utenti'?'fw-bold':'') ?>" href="index.php?page=utenti"><i class="bi bi-person-gear me-2"></i> Utenti & Kiosk</a></li>
                    <li class="nav-item"><a class="nav-link text-white <?= ($page==='associazione'?'fw-bold':'') ?>" href="index.php?page=associazione"><i class="bi bi-building-gear me-2"></i> Dati Associazione</a></li>
                </ul>
                <div class="pt-3 border-top border-primary-subtle">
                    <a href="index.php?page=kiosk" class="btn btn-warning text-dark fw-bold w-100 mb-2">Modalità KIOSK</a>
                    <a href="index.php?page=logout" class="btn btn-outline-light w-100">Disconnetti</a>
                </div>
            </div>
        </div>

        <!-- Contenuto Principale Pagina -->
        <main class="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4">
            <?php if (!empty($_GET['msg'])): ?>
                <div class="alert alert-success alert-dismissible fade show shadow-sm d-flex align-items-center mb-4" role="alert">
                    <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                    <div><?= htmlspecialchars($_GET['msg']) ?></div>
                    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>
            <?php if (!empty($_GET['err'])): ?>
                <div class="alert alert-danger alert-dismissible fade show shadow-sm d-flex align-items-center mb-4" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <div><?= htmlspecialchars($_GET['err']) ?></div>
                    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>
