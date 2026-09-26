<?php
/**
 * Connessione al Database MariaDB tramite PDO
 * Posizione: /config/database.php (Fuori dalla web root pubblica)
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'gestionale_sportivo');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');
define('DB_CHARSET', 'utf8mb4');

function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Errore critico di connessione a MariaDB: " . htmlspecialchars($e->getMessage()));
        }
    }
    return $pdo;
}
