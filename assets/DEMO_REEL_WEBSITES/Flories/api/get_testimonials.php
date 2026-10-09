<?php
// ============================================================
// api/get_testimonials.php
// GET — Returns approved testimonials for the homepage
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); exit;
}

require_once '../db.php';
$pdo = getDB();

$stmt = $pdo->query("
    SELECT customer_name, rating, message, created_at
    FROM testimonials
    WHERE is_approved = 1
    ORDER BY created_at DESC
    LIMIT 9
");
$rows = $stmt->fetchAll();

jsonResponse(true, 'OK', ['testimonials' => $rows]);
