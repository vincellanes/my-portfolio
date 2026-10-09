<?php
// ============================================================
// api/delete_product.php
// POST — Admin removes a flower from the collection (soft delete)
// ============================================================
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

require_once '../db.php';

$body = json_decode(file_get_contents('php://input'), true);
$id   = (int)($body['id'] ?? 0);

if (!$id) jsonResponse(false, 'Product ID is required.');

$pdo  = getDB();

// Soft delete — keeps order history intact
$stmt = $pdo->prepare("UPDATE products SET deleted_at = NOW(), is_active = 0 WHERE id = :id");
$stmt->execute([':id' => $id]);

if ($stmt->rowCount() === 0) jsonResponse(false, 'Product not found.');

jsonResponse(true, 'Product removed from collection.');
