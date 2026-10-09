<?php
// ============================================================
// api/submit_testimony.php
// POST — Lets a customer submit a review for a delivered order
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

require_once '../db.php';

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) jsonResponse(false, 'Invalid request body.');

$orderNumber = trim($body['order_number'] ?? '');
$rating      = (int)($body['rating']       ?? 0);
$message     = trim($body['message']       ?? '');

if (!$orderNumber) jsonResponse(false, 'Order number is required.');
if ($rating < 1 || $rating > 5) jsonResponse(false, 'Rating must be between 1 and 5.');
if (strlen($message) < 10)      jsonResponse(false, 'Please write at least 10 characters.');

$pdo = getDB();

// Verify order exists and is Delivered
$stmt = $pdo->prepare("SELECT id, customer_name, status FROM orders WHERE order_number = :n LIMIT 1");
$stmt->execute([':n' => $orderNumber]);
$order = $stmt->fetch();

if (!$order) jsonResponse(false, 'Order not found. Please check your order number.');
if ($order['status'] !== 'Delivered') jsonResponse(false, 'You can only leave a review after your order has been delivered.');

// Check if already reviewed
$check = $pdo->prepare("SELECT id FROM testimonials WHERE order_number = :n");
$check->execute([':n' => $orderNumber]);
if ($check->fetch()) jsonResponse(false, 'You have already submitted a review for this order.');

// Insert testimonial (pending approval)
$ins = $pdo->prepare("
    INSERT INTO testimonials (order_number, customer_name, rating, message)
    VALUES (:order_number, :customer_name, :rating, :message)
");
$ins->execute([
    ':order_number'  => $orderNumber,
    ':customer_name' => htmlspecialchars($order['customer_name']),
    ':rating'        => $rating,
    ':message'       => htmlspecialchars($message),
]);

jsonResponse(true, 'Thank you for your review! It will appear on our homepage once approved.');
