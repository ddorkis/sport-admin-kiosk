<?php
/**
 * Pagina di Login & Autenticazione
 * Posizione: /private/pages/login.php
 */
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Inserisci sia il nome utente che la password.';
    } else {
        if (loginUser($username, $password)) {
            $u = getCurrentUser();
            if (!empty($u['is_kiosk'])) {
                header('Location: index.php?page=kiosk');
            } else {
                header('Location: index.php?page=gestionale');
            }
            exit;
        } else {
            $error = 'Credenziali non valide. Verifica username e password.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accedi - SportGestionale</title>
    <!-- Bootstrap 5 CSS & Icons (100% Offline in locale) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/bootstrap-icons.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .login-card {
            max-width: 440px;
            width: 100%;
            border-radius: 1.25rem;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
            background: #ffffff;
            overflow: hidden;
        }
        .login-header {
            background: #0d6efd;
            color: #ffffff;
            padding: 2.25rem 2rem 1.75rem;
            text-align: center;
        }
    </style>
</head>
<body class="p-3">
<div class="login-card">
    <div class="login-header">
        <div class="d-inline-flex p-3 bg-white bg-opacity-25 rounded-circle mb-3">
            <i class="bi bi-shield-lock-fill fs-2 text-white"></i>
        </div>
        <h3 class="fw-bold mb-1">SportGestionale</h3>
        <p class="text-white-50 small mb-0">Accesso sicuro al sistema ASD / Polisportiva</p>
    </div>

    <div class="p-4 p-md-5">
        <?php if (!empty($error)): ?>
            <div class="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 mb-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                <div><?= htmlspecialchars($error) ?></div>
            </div>
        <?php endif; ?>

        <form method="POST" action="index.php?page=login">
            <div class="mb-3">
                <label for="username" class="form-label fw-semibold small text-muted">Nome Utente</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control" id="username" name="username" placeholder="es. admin o kiosk" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label for="password" class="form-label fw-semibold small text-muted">Password</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-key"></i></span>
                    <input type="password" class="form-control" id="password" name="password" placeholder="••••••••" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 fw-bold shadow-sm">
                <i class="bi bi-box-arrow-in-right me-1"></i> Accedi
            </button>
        </form>

        <div class="mt-4 pt-3 border-top">
            <h6 class="text-muted small fw-bold text-uppercase mb-2" style="font-size: 0.72rem;">Credenziali Predefinite:</h6>
            <div class="d-flex flex-column gap-2 small">
                <div class="p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Amministratore:</strong> <code>admin</code>
                    </div>
                    <span class="badge bg-secondary-subtle text-secondary">admin123</span>
                </div>
                <div class="p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Desk Reception:</strong> <code>kiosk</code>
                    </div>
                    <span class="badge bg-warning-subtle text-warning-emphasis">admin123</span>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Bootstrap 5 JS Bundle (100% Offline in locale) -->
<script src="assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
