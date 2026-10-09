<?php
// ============================================================
// admin/dashboard.php — Full Admin Dashboard (Updated)
// Tabs: Orders | Products | Testimonials | Messages
// ============================================================
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: index.php'); exit;
}
require_once '../db.php';
$pdo = getDB();

// ── Handle order status update ────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $allowed = ['Order Placed','Preparing','Shipped','In Transit','Delivered','Cancelled'];
    $s = $_POST['status'] ?? ''; $n = $_POST['order_number'] ?? '';
    if (in_array($s, $allowed) && $n) {
        $pdo->prepare("UPDATE orders SET status=:s WHERE order_number=:n")->execute([':s'=>$s,':n'=>$n]);
    }
    header('Location: dashboard.php?tab=orders'); exit;
}

// ── Handle mark message read ──────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['mark_read'])) {
    $id = (int)($_POST['msg_id'] ?? 0);
    if ($id) $pdo->prepare("UPDATE contact_messages SET is_read=1 WHERE id=:id")->execute([':id'=>$id]);
    header('Location: dashboard.php?tab=messages'); exit;
}

// ── Handle testimonial approval/rejection ─────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['testi_action'])) {
    $id     = (int)($_POST['testi_id'] ?? 0);
    $action = $_POST['testi_action'];
    if ($id) {
        if ($action === 'approve') {
            $pdo->prepare("UPDATE testimonials SET is_approved=1 WHERE id=:id")->execute([':id'=>$id]);
        } elseif ($action === 'reject') {
            $pdo->prepare("DELETE FROM testimonials WHERE id=:id")->execute([':id'=>$id]);
        }
    }
    header('Location: dashboard.php?tab=testimonials'); exit;
}

// ── Handle product delete ─────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_product'])) {
    $id = (int)($_POST['product_id'] ?? 0);
    if ($id) $pdo->prepare("UPDATE products SET deleted_at=NOW(), is_active=0 WHERE id=:id")->execute([':id'=>$id]);
    header('Location: dashboard.php?tab=products'); exit;
}

// ── Handle product add (with image upload) ────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_product'])) {
    $name        = trim(htmlspecialchars($_POST['name'] ?? ''));
    $price       = (float)($_POST['price'] ?? 0);
    $description = trim(htmlspecialchars($_POST['description'] ?? ''));
    $category    = trim(htmlspecialchars($_POST['category'] ?? 'flowers'));
    $imagePath   = ''; $imageType = 'local';
    $addError    = '';

    if ($name && $price > 0) {
        if (!empty($_FILES['image']['name']) && $_FILES['image']['error'] === 0) {
            $allowed = ['image/jpeg','image/png','image/webp','image/gif'];
            $ftype   = mime_content_type($_FILES['image']['tmp_name']);
            if (!in_array($ftype, $allowed)) {
                $addError = 'Only JPG, PNG, WEBP, or GIF images are allowed.';
            } elseif ($_FILES['image']['size'] > 5 * 1024 * 1024) {
                $addError = 'Image must be under 5MB.';
            } else {
                $uploadDir = dirname(__DIR__) . '/uploads/flowers/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                $ext      = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $filename = uniqid('flower_', true) . '.' . $ext;
                if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $filename)) {
                    $imagePath = 'uploads/flowers/' . $filename;
                    $imageType = 'upload';
                } else {
                    $addError = 'Image upload failed. Check folder permissions.';
                }
            }
        } elseif (!empty($_POST['image_url'])) {
            $imagePath = trim($_POST['image_url']);
            $imageType = 'url';
        }

        if (!$addError) {
            $pdo->prepare("INSERT INTO products (name,price,image_path,image_type,description,category) VALUES (:n,:p,:ip,:it,:d,:c)")
                ->execute([':n'=>$name,':p'=>$price,':ip'=>$imagePath,':it'=>$imageType,':d'=>$description,':c'=>$category]);
            header('Location: dashboard.php?tab=products&added=1'); exit;
        }
    } else {
        $addError = 'Name and price are required.';
    }
}

// ── Fetch all data ────────────────────────────────────────
$activeTab = $_GET['tab'] ?? 'orders';

$orders = $pdo->query("
    SELECT o.*, GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', ') AS items_list
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200
")->fetchAll();

$products = $pdo->query("
    SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC
")->fetchAll();

$testimonials = $pdo->query("
    SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 100
")->fetchAll();

$messages = $pdo->query("
    SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200
")->fetchAll();

$unreadCount       = $pdo->query("SELECT COUNT(*) FROM contact_messages WHERE is_read=0")->fetchColumn();
$pendingCount      = $pdo->query("SELECT COUNT(*) FROM orders WHERE status='Order Placed'")->fetchColumn();
$pendingTestiCount = $pdo->query("SELECT COUNT(*) FROM testimonials WHERE is_approved=0")->fetchColumn();

$statusColors = [
    'Order Placed'=>'#2563eb','Preparing'=>'#d97706','Shipped'=>'#7c3aed',
    'In Transit'=>'#0891b2','Delivered'=>'#16a34a','Cancelled'=>'#dc2626',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flories Admin — Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="admin-responsive.css">
<link rel="icon" href="../images/flories_favicon.png" type="image/png">
</head>
<body class="admin-body">
<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <img src="../images/flories_logo_dark.png" alt="Flories Flower Shop Logo" class="admin-logo-image">
      <img src="../images/flories_title_dark.png" alt="Flories Flower Shop Logo" class="admin-title-image">
    </div>
    <!-- Hamburger: visible only on mobile/tablet via CSS -->
    <button class="admin-hamburger" id="adminHamburger" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>
    <nav id="adminNav">
      <a href="?tab=orders"       class="<?= $activeTab==='orders'       ?'active':'' ?>">📦 Orders<?php if($pendingCount>0): ?><span class="badge"><?= $pendingCount ?></span><?php endif; ?></a>
      <a href="?tab=products"     class="<?= $activeTab==='products'     ?'active':'' ?>">🌸 Products</a>
      <a href="?tab=testimonials" class="<?= $activeTab==='testimonials' ?'active':'' ?>">⭐ Reviews<?php if($pendingTestiCount>0): ?><span class="badge"><?= $pendingTestiCount ?></span><?php endif; ?></a>
      <a href="?tab=messages"     class="<?= $activeTab==='messages'     ?'active':'' ?>">✉️ Messages<?php if($unreadCount>0): ?><span class="badge"><?= $unreadCount ?></span><?php endif; ?></a>
      <a href="logout.php" style="color:#f9a8a8; margin-top:4px;">← Log out</a>
    </nav>
    <div class="logout"><a href="logout.php">← Log out</a></div>
  </aside>
  <!-- Overlay to close nav when tapping outside on mobile -->
  <div class="admin-nav-overlay" id="adminOverlay"></div>

  <main class="admin-main">

  <?php /* ===== ORDERS TAB ===== */ if ($activeTab === 'orders'): ?>
    <div class="page-title">Orders</div>
    <div class="page-sub">Manage and update customer orders.</div>
    <div class="stats">
      <?php
        $totalRevenue = array_sum(array_column($orders,'total_amount'));
        $delivered    = count(array_filter($orders, fn($o)=>$o['status']==='Delivered'));
      ?>
      <div class="stat-card"><div class="num"><?= count($orders) ?></div><div class="lbl">Total Orders</div></div>
      <div class="stat-card"><div class="num">₱<?= number_format($totalRevenue,0) ?></div><div class="lbl">Revenue</div></div>
      <div class="stat-card"><div class="num"><?= $delivered ?></div><div class="lbl">Delivered</div></div>
      <div class="stat-card"><div class="num"><?= $pendingCount ?></div><div class="lbl">Pending</div></div>
    </div>
    <div class="table-card">
      <table>
        <thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Delivery Date</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>
          <?php if(empty($orders)): ?>
            <tr><td colspan="9" class="td-empty">No orders yet.</td></tr>
          <?php endif; ?>
          <?php foreach($orders as $order): $c=$statusColors[$order['status']]??'#888'; ?>
          <tr>
            <td><strong><?= htmlspecialchars($order['order_number']) ?></strong></td>
            <td><?= date('M j, Y',strtotime($order['created_at'])) ?></td>
            <td>
              <?= htmlspecialchars($order['customer_name']) ?><br>
              <span class="td-small"><?= htmlspecialchars($order['customer_email']) ?></span>
            </td>
            <td class="items-cell" title="<?= htmlspecialchars($order['items_list']) ?>"><?= htmlspecialchars($order['items_list']) ?></td>
            <td class="admin-amount">₱<?= number_format($order['total_amount'],2) ?></td>
            <td><?= htmlspecialchars($order['payment_method']) ?></td>
            <td><?= $order['delivery_date']?date('M j, Y',strtotime($order['delivery_date'])):'—' ?></td>
            <td><span class="status-pill" style="background:<?= $c ?>"><?= htmlspecialchars($order['status']) ?></span></td>
            <td>
              <form method="POST" class="order-update-form">
                <input type="hidden" name="update_status" value="1">
                <input type="hidden" name="order_number" value="<?= htmlspecialchars($order['order_number']) ?>">
                <select name="status" class="status-select">
                  <?php foreach(array_keys($statusColors) as $s): ?>
                    <option value="<?= $s ?>" <?= $order['status']===$s?'selected':'' ?>><?= $s ?></option>
                  <?php endforeach; ?>
                </select>
                <button class="btn-save" type="submit">Save</button>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

  <?php /* ===== PRODUCTS TAB ===== */ elseif ($activeTab === 'products'): ?>
    <div class="page-title">Products</div>
    <div class="page-sub">Add or remove flowers from your collection.</div>

    <?php if(isset($_GET['added'])): ?>
      <div class="alert-success">✅ Product added successfully!</div>
    <?php endif; ?>
    <?php if(!empty($addError)): ?>
      <div class="alert-error">❌ <?= htmlspecialchars($addError) ?></div>
    <?php endif; ?>

    <!-- Add Product Form -->
    <div class="add-card">
      <h3>➕ Add New Flower</h3>
      <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="add_product" value="1">
        <div class="form-row triple">
          <div class="form-group">
            <label>Flower Name *</label>
            <input type="text" name="name" placeholder="e.g. Red Roses" required>
          </div>
          <div class="form-group">
            <label>Price (₱) *</label>
            <input type="number" name="price" placeholder="e.g. 450" step="0.01" min="1" required>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select name="category">
              <option value="flowers">Flowers</option>
              <option value="bouquet">Bouquet</option>
              <option value="arrangement">Arrangement</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Short description of the flower arrangement..."></textarea>
          </div>
          <div class="form-group">
            <label>Upload Image (JPG/PNG/WEBP, max 5MB)</label>
            <input type="file" name="image" accept="image/*" id="img-file" onchange="previewImg(this)">
            <div class="upload-or">or use URL</div>
            <input type="url" name="image_url" placeholder="https://example.com/flower.jpg" id="img-url">
            <div id="img-preview" class="img-preview">
              <img id="preview-img" src="">
            </div>
          </div>
        </div>
        <button type="submit" class="btn-save btn-save-lg">Add Flower</button>
      </form>
    </div>

    <!-- Products Table -->
    <div class="table-card">
      <table>
        <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Description</th><th>Added</th><th>Action</th></tr></thead>
        <tbody>
          <?php if(empty($products)): ?>
            <tr><td colspan="7" class="td-empty">No products yet. Add one above!</td></tr>
          <?php endif; ?>
          <?php foreach($products as $p): ?>
          <tr>
            <td>
              <?php if($p['image_path']): ?>
                <img src="../<?= htmlspecialchars($p['image_path']) ?>" class="product-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="product-img-placeholder" style="display:none">🌸</div>
              <?php else: ?>
                <div class="product-img-placeholder">🌸</div>
              <?php endif; ?>
            </td>
            <td><strong><?= htmlspecialchars($p['name']) ?></strong></td>
            <td class="admin-amount">₱<?= number_format($p['price'],2) ?></td>
            <td><?= htmlspecialchars($p['category']) ?></td>
            <td class="td-desc"><?= htmlspecialchars(substr($p['description'],0,80)) ?><?= strlen($p['description'])>80?'...':'' ?></td>
            <td class="td-small"><?= date('M j, Y',strtotime($p['created_at'])) ?></td>
            <td>
              <form method="POST" onsubmit="return confirm('Remove this flower from the collection?')">
                <input type="hidden" name="delete_product" value="1">
                <input type="hidden" name="product_id" value="<?= $p['id'] ?>">
                <button type="submit" class="btn-danger">Remove</button>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

  <?php /* ===== TESTIMONIALS TAB ===== */ elseif ($activeTab === 'testimonials'): ?>
    <div class="page-title">Customer Reviews</div>
    <div class="page-sub">Approve reviews to show them on the homepage. Reject to delete.</div>
    <div class="stats">
      <?php
        $approved = count(array_filter($testimonials,fn($t)=>$t['is_approved']));
        $pending  = count(array_filter($testimonials,fn($t)=>!$t['is_approved']));
      ?>
      <div class="stat-card"><div class="num"><?= count($testimonials) ?></div><div class="lbl">Total Reviews</div></div>
      <div class="stat-card"><div class="num"><?= $approved ?></div><div class="lbl">Approved</div></div>
      <div class="stat-card"><div class="num"><?= $pending ?></div><div class="lbl">Pending Approval</div></div>
    </div>
    <div class="table-card">
      <table>
        <thead><tr><th>Date</th><th>Customer</th><th>Order #</th><th>Rating</th><th>Review</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          <?php if(empty($testimonials)): ?>
            <tr><td colspan="7" class="td-empty">No reviews yet.</td></tr>
          <?php endif; ?>
          <?php foreach($testimonials as $t): ?>
          <tr class="<?= $t['is_approved']?'testi-approved':'testi-pending' ?>">
            <td class="td-small"><?= date('M j, Y',strtotime($t['created_at'])) ?></td>
            <td><?= htmlspecialchars($t['customer_name']) ?></td>
            <td class="td-mono"><?= htmlspecialchars($t['order_number']) ?></td>
            <td><span class="stars-display"><?= str_repeat('★',$t['rating']) ?><?= str_repeat('☆',5-$t['rating']) ?></span></td>
            <td class="td-review">
              <div class="review-clamp" title="<?= htmlspecialchars($t['message']) ?>">
                <?= htmlspecialchars($t['message']) ?>
              </div>
            </td>
            <td>
              <?php if($t['is_approved']): ?>
                <span class="status-live">✓ Live</span>
              <?php else: ?>
                <span class="status-pending-label">⏳ Pending</span>
              <?php endif; ?>
            </td>
            <td class="td-action-flex">
              <?php if(!$t['is_approved']): ?>
              <form method="POST">
                <input type="hidden" name="testi_id" value="<?= $t['id'] ?>">
                <input type="hidden" name="testi_action" value="approve">
                <button class="btn-success" type="submit">Approve</button>
              </form>
              <?php endif; ?>
              <form method="POST" onsubmit="return confirm('Delete this review?')">
                <input type="hidden" name="testi_id" value="<?= $t['id'] ?>">
                <input type="hidden" name="testi_action" value="reject">
                <button class="btn-danger" type="submit">Delete</button>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

  <?php /* ===== MESSAGES TAB ===== */ elseif ($activeTab === 'messages'): ?>
    <div class="page-title">Contact Messages</div>
    <div class="page-sub">Messages from the contact form.</div>
    <div class="table-card">
      <table>
        <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Occasion</th><th>Message</th><th>Action</th></tr></thead>
        <tbody>
          <?php if(empty($messages)): ?>
            <tr><td colspan="7" class="td-empty">No messages yet.</td></tr>
          <?php endif; ?>
          <?php foreach($messages as $msg): ?>
          <tr class="<?= !$msg['is_read']?'unread':'' ?>">
            <td><?= date('M j, Y',strtotime($msg['created_at'])) ?></td>
            <td><?= htmlspecialchars($msg['sender_name']) ?></td>
            <td><?= htmlspecialchars($msg['sender_email']) ?></td>
            <td><?= htmlspecialchars($msg['sender_phone']?:'—') ?></td>
            <td><?= htmlspecialchars($msg['occasion']?:'—') ?></td>
            <td class="td-message"><?= nl2br(htmlspecialchars($msg['message'])) ?></td>
            <td>
              <?php if(!$msg['is_read']): ?>
              <form method="POST">
                <input type="hidden" name="mark_read" value="1">
                <input type="hidden" name="msg_id" value="<?= $msg['id'] ?>">
                <button class="btn-read" type="submit">Mark Read</button>
              </form>
              <?php else: ?>
                <span class="status-read">Read</span>
              <?php endif; ?>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>

  </main>
</div>
<script>
function previewImg(input) {
  const preview = document.getElementById('img-preview');
  const img = document.getElementById('preview-img');
  const urlField = document.getElementById('img-url');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; preview.style.display='block'; };
    reader.readAsDataURL(input.files[0]);
    urlField.value = '';
  }
}
document.getElementById('img-url')?.addEventListener('input', function() {
  if (this.value) document.getElementById('img-file').value = '';
});

// ── Hamburger / mobile nav toggle ──
(function () {
  const btn     = document.getElementById('adminHamburger');
  const nav     = document.getElementById('adminNav');
  const overlay = document.getElementById('adminOverlay');
  if (!btn || !nav) return;

  function openNav() {
    nav.classList.add('nav-open');
    btn.classList.add('is-open');
    overlay.classList.add('visible');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    nav.classList.remove('nav-open');
    btn.classList.remove('is-open');
    overlay.classList.remove('visible');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function () {
    nav.classList.contains('nav-open') ? closeNav() : openNav();
  });

  overlay.addEventListener('click', closeNav);

  // Close on nav link click (same-page tab change)
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  // Close if window resizes back to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeNav();
  });
})();
</script>
</body>
</html>
