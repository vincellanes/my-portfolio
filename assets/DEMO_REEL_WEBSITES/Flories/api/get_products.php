<?php
// ============================================================
// api/get_products.php
// GET — Returns active products from the database
// No limit by default; pass ?limit=N to cap results
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); exit;
}

require_once '../db.php';
$pdo = getDB();

$category = trim($_GET['category'] ?? '');
// Only apply a LIMIT when explicitly requested (e.g. index.html uses ?limit=3)
// Collection page sends no limit so it gets every product — JS paginates client-side
$hasLimit = isset($_GET['limit']) && (int)$_GET['limit'] > 0;
$limit    = $hasLimit ? max(1, (int)$_GET['limit']) : null;

$where = "WHERE is_active = 1 AND deleted_at IS NULL";

if ($category && $limit) {
    $stmt = $pdo->prepare("SELECT id, name, price, image_path, image_type, description, category FROM products $where AND category = :cat ORDER BY created_at DESC LIMIT :lim");
    $stmt->bindValue(':cat', $category, PDO::PARAM_STR);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
} elseif ($category) {
    $stmt = $pdo->prepare("SELECT id, name, price, image_path, image_type, description, category FROM products $where AND category = :cat ORDER BY created_at DESC");
    $stmt->bindValue(':cat', $category, PDO::PARAM_STR);
} elseif ($limit) {
    $stmt = $pdo->prepare("SELECT id, name, price, image_path, image_type, description, category FROM products $where ORDER BY created_at DESC LIMIT :lim");
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
} else {
    // No limit — return ALL active products; collection.html paginates client-side
    $stmt = $pdo->prepare("SELECT id, name, price, image_path, image_type, description, category FROM products $where ORDER BY created_at DESC");
}

$stmt->execute();
$products = $stmt->fetchAll();

jsonResponse(true, 'OK', ['products' => $products]);
