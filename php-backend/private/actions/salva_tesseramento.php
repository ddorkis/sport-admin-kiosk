<?php
/**
 * Nuovo Tesseramento Atleta
 * Posizione: /private/actions/salva_tesseramento.php
 */
if (!defined('PATH_CONFIG')) {
    $cfgPath = getenv('APP_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/config';
    if (file_exists($cfgPath . '/paths.php')) require_once $cfgPath . '/paths.php';
    if (!defined('PATH_CONFIG')) define('PATH_CONFIG', $cfgPath);
}
require_once PATH_CONFIG . '/database.php';
require_once (defined('PATH_INCLUDES') ? PATH_INCLUDES : dirname(__DIR__) . '/includes') . '/auth.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db = getDbConnection();

    $personaId = (int)($_POST['persona_id'] ?? 0);
    $annoId = (int)($_POST['anno_id'] ?? 1);
    $numeroTessera = trim($_POST['numero_tessera'] ?? '');
    $dataTesseramento = !empty($_POST['data_tesseramento']) ? trim($_POST['data_tesseramento']) : date('Y-m-d');
    $tipoTesseramento = $_POST['tipo_tesseramento'] ?? 'Agonista';
    $certificatoScadenza = !empty($_POST['certificato_medico_scadenza']) ? trim($_POST['certificato_medico_scadenza']) : null;
    $stato = $_POST['stato'] ?? 'Attivo';

    if ($personaId <= 0 || empty($numeroTessera)) {
        header('Location: index.php?page=tesserati&err=' . urlencode('Selezionare una persona e inserire il numero di tessera.'));
        exit;
    }

    try {
        // Verifica se persona già tesserata in questo anno
        $stmtCheck = $db->prepare("SELECT id FROM tesserati WHERE persona_id = ? AND anno_id = ?");
        $stmtCheck->execute([$personaId, $annoId]);
        if ($stmtCheck->fetch()) {
            header('Location: index.php?page=tesserati&err=' . urlencode('Questa persona risulta già tesserata per l\'anno sportivo selezionato.'));
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO tesserati (persona_id, anno_id, numero_tessera, data_tesseramento, tipo_tesseramento, certificato_medico_scadenza, stato)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $personaId, $annoId, $numeroTessera, $dataTesseramento, $tipoTesseramento, $certificatoScadenza, $stato
        ]);

        header('Location: index.php?page=tesserati&msg=' . urlencode('Tesseramento registrato con successo.'));
        exit;
    } catch (Exception $e) {
        header('Location: index.php?page=tesserati&err=' . urlencode('Errore salvataggio tesseramento: ' . $e->getMessage()));
        exit;
    }
}
