<?php

define('DB_HOST', 'localhost');    
define('DB_NAME', 'flories_db');   
define('DB_USER', 'root');  
define('DB_PASS', ''); 

define('DELIVERY_FEE', 50.00);

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
            exit;
        }
    }
    return $pdo;
}

// Helper: send JSON response
function jsonResponse(bool $success, string $message, array $data = []): void {
    header('Content-Type: application/json');
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}

// Helper: generate a unique order number like ORD-2026-4821
function generateOrderNumber(): string {
    return 'ORD-' . date('Y') . '-' . strtoupper(substr(uniqid(), -6));
}

// Helper: generate a session token for guest order tracking
function getOrCreateSessionToken(): string {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['flories_token'])) {
        $_SESSION['flories_token'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['flories_token'];
}
