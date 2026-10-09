<?php
// ============================================================
// api/add_product.php
// POST (multipart/form-data) — Admin adds a new flower product
// Session-protected: must be logged in as admin
// ============================================================
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

require_once '../db.php';

$name        = trim($_POST['name']        ?? '');
$price       = (float)($_POST['price']    ?? 0);
$description = trim($_POST['description'] ?? '');
$category    = trim($_POST['category']    ?? 'flowers');

if (!$name)        jsonResponse(false, 'Product name is required.');
if ($price <= 0)   jsonResponse(false, 'Price must be greater than 0.');

// Handle image upload
$imagePath  = '';
$imageType  = 'local';

if (!empty($_FILES['image']['name'])) {
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $ftype   = mime_content_type($_FILES['image']['tmp_name']);

    if (!in_array($ftype, $allowed)) {
        jsonResponse(false, 'Only JPG, PNG, WEBP, or GIF images are allowed.');
    }
    if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
        jsonResponse(false, 'Image must be under 5MB.');
    }

    $uploadDir = dirname(__DIR__) . '/uploads/flowers/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $ext       = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename  = uniqid('flower_', true) . '.' . strtolower($ext);
    $dest      = $uploadDir . $filename;

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
        jsonResponse(false, 'Failed to save image. Check folder permissions.');
    }

    $imagePath = 'uploads/flowers/' . $filename;
    $imageType = 'upload';

} elseif (!empty($_POST['image_url'])) {
    $imagePath = trim($_POST['image_url']);
    $imageType = 'url';
}

$pdo  = getDB();
$stmt = $pdo->prepare("
    INSERT INTO products (name, price, image_path, image_type, description, category)
    VALUES (:name, :price, :image_path, :image_type, :description, :category)
");
$stmt->execute([
    ':name'        => htmlspecialchars($name),
    ':price'       => $price,
    ':image_path'  => $imagePath,
    ':image_type'  => $imageType,
    ':description' => htmlspecialchars($description),
    ':category'    => htmlspecialchars($category),
]);

$newId = $pdo->lastInsertId();
jsonResponse(true, 'Product added successfully!', ['product_id' => $newId, 'image_path' => $imagePath]);
