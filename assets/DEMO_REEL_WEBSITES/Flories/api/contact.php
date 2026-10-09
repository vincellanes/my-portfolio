<?php
// ============================================================
// api/contact.php
// POST — Saves contact form messages to the database
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
if (!$body) {
    jsonResponse(false, 'Invalid request body.');
}

// Validate
$name    = trim(htmlspecialchars($body['name']    ?? ''));
$email   = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$phone   = trim(htmlspecialchars($body['phone']   ?? ''));
$occasion= trim(htmlspecialchars($body['occasion'] ?? ''));
$message = trim(htmlspecialchars($body['message'] ?? ''));

if (!$name)    jsonResponse(false, 'Name is required.');
if (!$email)   jsonResponse(false, 'Valid email is required.');
if (!$message) jsonResponse(false, 'Message is required.');

$pdo  = getDB();
$stmt = $pdo->prepare("
    INSERT INTO contact_messages (sender_name, sender_email, sender_phone, occasion, message)
    VALUES (:name, :email, :phone, :occasion, :message)
");
$stmt->execute([
    ':name'    => $name,
    ':email'   => $email,
    ':phone'   => $phone,
    ':occasion'=> $occasion,
    ':message' => $message,
]);

jsonResponse(true, 'Message sent! We will get back to you soon.');
