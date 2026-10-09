<?php
// ============================================================
// api/place_order.php
// POST — Accepts cart items + checkout form, saves to MySQL
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // tighten to your domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

require_once '../db.php';

// ── Parse incoming JSON body ──────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    jsonResponse(false, 'Invalid request body.');
}

// ── Validate required fields ──────────────────────────────
$required = ['name', 'email', 'phone', 'address', 'delivery_date', 'payment_method', 'items'];
foreach ($required as $field) {
    if (empty($body[$field])) {
        jsonResponse(false, "Missing required field: $field");
    }
}

$items = $body['items'];
if (!is_array($items) || count($items) === 0) {
    jsonResponse(false, 'Cart is empty.');
}

$allowedPayments = ['COD', 'GCash'];
if (!in_array($body['payment_method'], $allowedPayments)) {
    jsonResponse(false, 'Invalid payment method.');
}

// ── Calculate totals (server-side — never trust the client) ──
$subtotal = 0;
foreach ($items as $item) {
    if (!isset($item['name'], $item['price'], $item['qty'])) {
        jsonResponse(false, 'Malformed item data.');
    }
    $subtotal += (float)$item['price'] * (int)$item['qty'];
}
$deliveryFee  = DELIVERY_FEE;
$totalAmount  = $subtotal + $deliveryFee;

// ── Sanitize inputs ──────────────────────────────────────
$name           = trim(htmlspecialchars($body['name']));
$email          = filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL);
$phone          = trim(htmlspecialchars($body['phone']));
$address        = trim(htmlspecialchars($body['address']));
$deliveryDate   = trim($body['delivery_date']);
$specialRequest = trim(htmlspecialchars($body['special_request'] ?? ''));
$paymentMethod  = $body['payment_method'];

if (!$email) jsonResponse(false, 'Invalid email address.');

// ── Insert order into DB ─────────────────────────────────
$pdo         = getDB();
$orderNumber = generateOrderNumber();
$sessionToken = getOrCreateSessionToken();

try {
    $pdo->beginTransaction();

    // Insert main order row
    $stmt = $pdo->prepare("
        INSERT INTO orders
            (order_number, customer_name, customer_email, customer_phone,
             delivery_address, delivery_date, special_request,
             payment_method, subtotal, delivery_fee, total_amount, session_token)
        VALUES
            (:order_number, :name, :email, :phone,
             :address, :delivery_date, :special_request,
             :payment_method, :subtotal, :delivery_fee, :total_amount, :session_token)
    ");
    $stmt->execute([
        ':order_number'   => $orderNumber,
        ':name'           => $name,
        ':email'          => $email,
        ':phone'          => $phone,
        ':address'        => $address,
        ':delivery_date'  => $deliveryDate ?: null,
        ':special_request'=> $specialRequest,
        ':payment_method' => $paymentMethod,
        ':subtotal'       => $subtotal,
        ':delivery_fee'   => $deliveryFee,
        ':total_amount'   => $totalAmount,
        ':session_token'  => $sessionToken,
    ]);

    $orderId = $pdo->lastInsertId();

    // Insert each item
    $itemStmt = $pdo->prepare("
        INSERT INTO order_items (order_id, product_name, unit_price, quantity, line_total)
        VALUES (:order_id, :product_name, :unit_price, :quantity, :line_total)
    ");
    foreach ($items as $item) {
        $qty       = max(1, (int)$item['qty']);
        $unitPrice = (float)$item['price'];
        $itemStmt->execute([
            ':order_id'    => $orderId,
            ':product_name'=> trim(htmlspecialchars($item['name'])),
            ':unit_price'  => $unitPrice,
            ':quantity'    => $qty,
            ':line_total'  => $unitPrice * $qty,
        ]);
    }

    $pdo->commit();

    jsonResponse(true, 'Order placed successfully!', [
        'order_number' => $orderNumber,
        'total_amount' => $totalAmount,
        'status'       => 'Order Placed',
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    jsonResponse(false, 'Failed to save order. Please try again.');
}
