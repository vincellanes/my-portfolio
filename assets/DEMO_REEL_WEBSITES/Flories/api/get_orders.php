<?php
// ============================================================
// api/get_orders.php
// GET — Returns order history for current session or by email
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

require_once '../db.php';

$pdo = getDB();
$sessionToken = getOrCreateSessionToken();

// Optional: also allow lookup by email for users who switched devices
$emailFilter = trim($_GET['email'] ?? '');

if ($emailFilter && filter_var($emailFilter, FILTER_VALIDATE_EMAIL)) {
    // Fetch by email
    $stmt = $pdo->prepare("
        SELECT id, order_number, customer_name, customer_email,
               delivery_address, delivery_date, payment_method,
               subtotal, delivery_fee, total_amount,
               status, created_at
        FROM orders
        WHERE customer_email = :email
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute([':email' => $emailFilter]);
} else {
    // Fetch by session token (same browser)
    $stmt = $pdo->prepare("
        SELECT id, order_number, customer_name, customer_email,
               delivery_address, delivery_date, payment_method,
               subtotal, delivery_fee, total_amount,
               status, created_at
        FROM orders
        WHERE session_token = :token
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute([':token' => $sessionToken]);
}

$orders = $stmt->fetchAll();

// Attach items to each order
$itemStmt = $pdo->prepare("
    SELECT product_name, unit_price, quantity, line_total
    FROM order_items
    WHERE order_id = :order_id
");

foreach ($orders as &$order) {
    $itemStmt->execute([':order_id' => $order['id']]);
    $order['items'] = $itemStmt->fetchAll();
    unset($order['id']); // don't expose internal DB id
}
unset($order);

jsonResponse(true, 'OK', ['orders' => $orders]);
