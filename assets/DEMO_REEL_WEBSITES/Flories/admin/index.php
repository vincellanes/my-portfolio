<?php
// ============================================================
// admin/index.php — Admin Login
// ============================================================
session_start();
require_once '../db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username && $password) {
        $pdo  = getDB();
        $stmt = $pdo->prepare("SELECT id, password_hash FROM admin_users WHERE username = :u LIMIT 1");
        $stmt->execute([':u' => $username]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password_hash'])) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_id']        = $admin['id'];
            header('Location: dashboard.php');
            exit;
        }
    }
    $error = 'Invalid username or password.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flories Admin — Login</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="admin-responsive.css">
<link rel="icon" href="../images/flories_favicon.png" type="image/png">
</head>
<body class="login-page">
<div class="login-card">
  <div class="brand">🌸 Flories</div>
  <h1>Admin Login</h1>
  <p>Sign in to manage orders and messages.</p>
  <?php if ($error): ?>
    <div class="login-error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>
  <form method="POST">
    <label for="username">Username</label>
    <input type="text" id="username" name="username" placeholder="admin" required autocomplete="username">
    <label for="password">Password</label>
    <input type="password" id="password" name="password" placeholder="••••••••" required autocomplete="current-password">
    <button class="btn-login" type="submit">Sign In</button>
  </form>
</div>
</body>
</html>
