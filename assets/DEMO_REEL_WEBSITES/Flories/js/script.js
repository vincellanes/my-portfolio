// ============================================================
// script.js — Flories Flower Shop (Backend-Connected Version)
// Cart uses sessionStorage; Orders saved to MySQL via PHP API
// ============================================================

// ── CONFIG: point these at your actual hosting path ──────
const API_BASE = 'api'; // relative path; change to full URL if needed
                        // e.g. 'https://yourdomain.com/flories/api'

document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // 1. AUTOMATED SCROLL REVEAL ENGINE
    // ========================================================
    const selectors = "section, .collection-grid, .occasions-list-section, .order-card, .contact-grid-layout, .cart-grid-layout, .featured";
    const elementsToAnimate = document.querySelectorAll(selectors);

    elementsToAnimate.forEach(el => el.classList.add("reveal-on-scroll"));

    const elementObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.05, rootMargin: "0px 0px -40px 0px" });

    elementsToAnimate.forEach(el => elementObserver.observe(el));


    // ========================================================
    // 2. CAPTURE SELECTIONS (Add to Cart — stays in sessionStorage)
    // ========================================================
    const orderButtons = document.querySelectorAll(".btn-order, .btn-mini-order");

    orderButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            let card = e.target.closest(".product-card") || e.target.closest(".price-item-row");
            let name, priceText;

            if (e.target.classList.contains("btn-order")) {
                name      = card.querySelector(".product-title").textContent.trim();
                priceText = card.querySelector(".product-price").textContent.trim();
            } else {
                name      = card.querySelector(".item-name").textContent.trim();
                priceText = card.querySelector(".item-price").textContent.trim();
            }

            const price   = parseFloat(priceText.replace(/[^0-9.-]+/g, ""));
            const product = {
                id:    Date.now() + Math.random().toString(36).substr(2, 5),
                name:  name,
                price: price
            };

            let cart = JSON.parse(sessionStorage.getItem("flories_cart")) || [];
            cart.push(product);
            sessionStorage.setItem("flories_cart", JSON.stringify(cart));

            const originalText = e.target.textContent;
            e.target.textContent = "Added! ✓";
            e.target.style.backgroundColor = "#3E3A39";
            setTimeout(() => {
                e.target.textContent = originalText;
                e.target.style.backgroundColor = "";
            }, 1000);
        });
    });


    // ========================================================
    // 3. RENDER FUNCTIONAL CHECKBOX LIST (cart.html Only)
    // ========================================================
    const cartStatusColumn = document.querySelector(".cart-status-column");
    if (cartStatusColumn) {
        renderCart();
    }

    function renderCart() {
        let cart = JSON.parse(sessionStorage.getItem("flories_cart")) || [];

        if (cart.length > 0) {
            cartStatusColumn.innerHTML = `
                <div class="cart-items-container" style="background:#EAEAEA;padding:25px;border-radius:12px;display:flex;flex-direction:column;gap:15px;">
                    <h3 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:600;margin-bottom:10px;color:#000;">Items in Cart</h3>
                    <div class="cart-items-list" style="display:flex;flex-direction:column;gap:12px;"></div>
                </div>`;

            const itemsList = cartStatusColumn.querySelector(".cart-items-list");

            cart.forEach(item => {
                const itemRow = document.createElement("div");
                itemRow.className = "cart-item-row";
                itemRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:#FFF;padding:12px 18px;border-radius:6px;";
                itemRow.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;">
                        <input type="checkbox" class="cart-item-checkbox" data-id="${item.id}" checked style="width:18px;height:18px;cursor:pointer;">
                        <span style="font-size:14px;font-weight:500;color:#3E3A39;">${item.name}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:15px;">
                        <span style="font-size:14px;font-weight:600;color:#000;">₱${item.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                        <button class="btn-remove-item" data-id="${item.id}" style="background:#C25E6B;color:#FFF;border:none;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:500;cursor:pointer;">Remove</button>
                    </div>`;
                itemsList.appendChild(itemRow);
            });

            setupCartEventListeners();
            calculateTotals();
        } else {
            cartStatusColumn.innerHTML = `
                <div class="empty-cart-card">
                    <p>Your cart is empty</p>
                    <a href="collection.html" class="btn-browse">Browse</a>
                </div>`;
            updateSummaryDisplay(0);
        }
    }

    function setupCartEventListeners() {
        document.querySelectorAll(".cart-item-checkbox").forEach(box => {
            box.addEventListener("change", calculateTotals);
        });
        document.querySelectorAll(".btn-remove-item").forEach(btn => {
            btn.addEventListener("click", e => {
                const targetId = e.target.getAttribute("data-id");
                let cart = JSON.parse(sessionStorage.getItem("flories_cart")) || [];
                cart = cart.filter(item => item.id !== targetId);
                sessionStorage.setItem("flories_cart", JSON.stringify(cart));
                renderCart();
            });
        });
    }

    function calculateTotals() {
        let cart = JSON.parse(sessionStorage.getItem("flories_cart")) || [];
        let subtotal = 0;
        document.querySelectorAll(".cart-item-checkbox").forEach(box => {
            if (box.checked) {
                const matched = cart.find(item => item.id === box.getAttribute("data-id"));
                if (matched) subtotal += matched.price;
            }
        });
        updateSummaryDisplay(subtotal);
        return subtotal;
    }

    function updateSummaryDisplay(subtotal) {
        const pricingList = document.querySelector(".summary-pricing-list");
        if (!pricingList) return;
        const deliveryFee = subtotal > 0 ? 50.00 : 0.00;
        const total = subtotal + deliveryFee;
        pricingList.innerHTML = `
            <div class="pricing-row" style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:12px;">
                <span>Subtotal</span><span>₱${subtotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
            <div class="pricing-row" style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:12px;">
                <span>Delivery Fee</span><span>₱${deliveryFee.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
            <div class="pricing-row total-row" style="display:flex;justify-content:space-between;font-size:16px;font-weight:600;border-top:1px solid #D0D0D0;padding-top:12px;">
                <span>Total</span>
                <span class="price-highlight" style="color:#9E2A2B;font-weight:700;">₱${total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>`;
    }


    // ========================================================
    // 4. CHECKOUT — Posts to PHP API (replaces localStorage)
    // ========================================================
    const checkoutForm  = document.querySelector(".checkout-form-element");
    const gcashPanel    = document.getElementById("gcash-payment-panel");
    const paymentSelect = document.getElementById("checkout-payment");

    if (paymentSelect) {
        paymentSelect.addEventListener("change", e => {
            gcashPanel.style.display = e.target.value === "GCash" ? "block" : "none";
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async e => {
            e.preventDefault();

            // Gather checked cart items
            let cart = JSON.parse(sessionStorage.getItem("flories_cart")) || [];
            const checkedBoxes = Array.from(document.querySelectorAll(".cart-item-checkbox")).filter(b => b.checked);

            if (cart.length === 0 || checkedBoxes.length === 0) {
                alert("Please select at least one item from your cart to proceed.");
                return;
            }

            const selectedPayment = paymentSelect.value;
            if (!selectedPayment) {
                alert("Please select a payment method.");
                return;
            }

            // Build items array from checked boxes
            const checkedIds  = checkedBoxes.map(b => b.getAttribute("data-id"));
            const itemsToSend = cart
                .filter(item => checkedIds.includes(item.id))
                .map(item => ({ name: item.name, price: item.price, qty: 1 }));

            // Collect form values
            const payload = {
                name:           document.getElementById("checkout-name").value.trim(),
                email:          document.getElementById("checkout-email").value.trim(),
                phone:          document.getElementById("checkout-phone").value.trim(),
                address:        document.getElementById("checkout-address").value.trim(),
                delivery_date:  document.getElementById("checkout-date").value,
                special_request:document.getElementById("checkout-request").value.trim(),
                payment_method: selectedPayment,
                items:          itemsToSend,
            };

            // Disable button to prevent double-submit
            const submitBtn = checkoutForm.querySelector(".btn-place-order");
            submitBtn.disabled    = true;
            submitBtn.textContent = "Placing Order…";

            try {
                const res  = await fetch(`${API_BASE}/place_order.php`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload),
                });
                const data = await res.json();

                if (data.success) {
                    // Remove ordered items from cart
                    let remaining = cart.filter(item => !checkedIds.includes(item.id));
                    sessionStorage.setItem("flories_cart", JSON.stringify(remaining));

                    alert(`✅ Order placed!\nOrder #: ${data.order_number}\nTotal: ₱${data.total_amount.toLocaleString('en-US',{minimumFractionDigits:2})}`);
                    window.location.href = "orders.html";
                } else {
                    alert("❌ " + (data.message || "Something went wrong. Please try again."));
                    submitBtn.disabled    = false;
                    submitBtn.textContent = "PLACE ORDER";
                }
            } catch (err) {
                console.error(err);
                alert("❌ Could not connect to the server. Please check your internet connection.");
                submitBtn.disabled    = false;
                submitBtn.textContent = "PLACE ORDER";
            }
        });
    }


    // ========================================================
    // 5. ORDERS PAGE — Fetches from PHP API (replaces localStorage)
    // ========================================================
    const ordersDynamicContainer = document.getElementById("orders-dynamic-container");
    if (ordersDynamicContainer) {
        loadOrders();
    }

    async function loadOrders() {
        ordersDynamicContainer.innerHTML = `<p style="text-align:center;color:#aaa;padding:40px">Loading your orders…</p>`;

        try {
            const res  = await fetch(`${API_BASE}/get_orders.php`);
            const data = await res.json();

            if (!data.success || data.orders.length === 0) {
                ordersDynamicContainer.innerHTML = `
                    <div style="text-align:center;padding:40px;color:#777;">
                        <p>No active orders found. Start adding flowers to track them here!</p>
                    </div>`;

                // Offer lookup by email if user wants
                showEmailLookup();
                return;
            }

            renderOrders(data.orders);
        } catch (err) {
            console.error(err);
            ordersDynamicContainer.innerHTML = `<p style="text-align:center;color:#C25E6B;padding:40px">Could not load orders. Please try again later.</p>`;
        }
    }

    function showEmailLookup() {
        const lookupDiv = document.createElement("div");
        lookupDiv.style.cssText = "text-align:center;margin-top:20px;";
        lookupDiv.innerHTML = `
            <p style="font-size:13px;color:#aaa;margin-bottom:10px">Ordered from a different device?</p>
            <div style="display:inline-flex;gap:8px;">
                <input type="email" id="order-email-lookup" placeholder="Enter your email" style="padding:9px 14px;border:1px solid #ddd;border-radius:8px;font-size:13px;outline:none;">
                <button id="btn-email-lookup" style="background:#9E2A2B;color:#fff;border:none;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500;">Find Orders</button>
            </div>`;
        if (ordersDynamicContainer.parentNode) {
            ordersDynamicContainer.parentNode.appendChild(lookupDiv);
        }

        document.getElementById("btn-email-lookup").addEventListener("click", async () => {
            const email = document.getElementById("order-email-lookup").value.trim();
            if (!email) return;
            const res  = await fetch(`${API_BASE}/get_orders.php?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (data.success && data.orders.length > 0) {
                renderOrders(data.orders);
                lookupDiv.remove();
            } else {
                alert("No orders found for that email address.");
            }
        });
    }

    function renderOrders(orders) {
        ordersDynamicContainer.innerHTML = "";

        const statusColors = {
            "Order Placed": "#2563eb",
            "Preparing":    "#d97706",
            "Shipped":      "#7c3aed",
            "In Transit":   "#0891b2",
            "Delivered":    "#16a34a",
            "Cancelled":    "#dc2626",
        };

        // Map status to progress percentage
        const progressMap = {
            "Order Placed": "width-25",
            "Preparing":    "width-33",
            "Shipped":      "width-66",
            "In Transit":   "width-80",
            "Delivered":    "width-100",
            "Cancelled":    "width-25",
        };

        orders.forEach(order => {
            const status    = order.status;
            const progress  = progressMap[status] || "width-25";
            const color     = statusColors[status] || "#888";

            const step2Done = ["Shipped","In Transit","Delivered"].includes(status);
            const step3Done = ["In Transit","Delivered"].includes(status);
            const step4Done = status === "Delivered";

            const nodeClass = done => done ? "done-rose" : "pending-gray";
            const labelClass = done => done ? "" : "inactive";

            const itemsMarkup = (order.items || []).map(i =>
                `<li>${i.product_name}${i.quantity > 1 ? ` × ${i.quantity}` : ''}</li>`
            ).join("");

            const deliveryDisplay = order.delivery_date
                ? new Date(order.delivery_date).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})
                : "Pending";

            const datePlaced = new Date(order.created_at).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'});

            // Inline review form markup (only for Delivered orders)
            const reviewFormMarkup = status === "Delivered" ? `
                <div class="inline-review-section" id="review-section-${order.order_number}" style="margin-top:20px;border-top:1px solid #eee;padding-top:18px;">
                    <button class="btn-leave-review" onclick="toggleInlineReview('${order.order_number}')"
                        style="background:#9E2A2B;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;">
                        ⭐ Leave a Review
                    </button>
                    <div class="inline-review-form" id="review-form-${order.order_number}" style="display:none;margin-top:16px;background:#fafafa;border-radius:10px;padding:20px;border:1px solid #eee;">
                        <h4 style="font-family:'Playfair Display',serif;font-size:16px;margin-bottom:14px;color:#3E3A39;">Your Review for ${order.order_number}</h4>
                        <div class="form-group-field" style="margin-bottom:12px;">
                            <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px;">Rating</label>
                            <div class="star-picker" id="star-picker-${order.order_number}" style="font-size:24px;cursor:pointer;color:#ccc;letter-spacing:2px;">
                                <span class="star" data-val="1" data-order="${order.order_number}">★</span>
                                <span class="star" data-val="2" data-order="${order.order_number}">★</span>
                                <span class="star" data-val="3" data-order="${order.order_number}">★</span>
                                <span class="star" data-val="4" data-order="${order.order_number}">★</span>
                                <span class="star" data-val="5" data-order="${order.order_number}">★</span>
                            </div>
                            <input type="hidden" id="rating-${order.order_number}" value="0">
                        </div>
                        <div class="form-group-field" style="margin-bottom:12px;">
                            <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px;">Your Review</label>
                            <textarea id="message-${order.order_number}" rows="3" placeholder="Tell us about your experience…"
                                style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:'Poppins',sans-serif;resize:vertical;box-sizing:border-box;"></textarea>
                        </div>
                        <button onclick="submitInlineReview('${order.order_number}')" id="submit-review-${order.order_number}"
                            style="background:#9E2A2B;color:#fff;border:none;padding:9px 22px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Submit Review</button>
                        <p id="feedback-${order.order_number}" style="margin-top:10px;font-size:13px;display:none;"></p>
                    </div>
                </div>` : '';

            const cardEl = document.createElement("div");
            cardEl.className = "order-card";
            cardEl.innerHTML = `
                <div class="order-card-meta">
                    <div class="meta-left">
                        <h3>Order ${order.order_number}</h3>
                        <p class="order-date">Placed on ${datePlaced}</p>
                        <div class="order-items-summary">
                            <span class="label">Items:</span>
                            <ul>${itemsMarkup}</ul>
                        </div>
                        <p class="order-total-cost">Total: ₱${parseFloat(order.total_amount).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                        <p style="font-size:12px;color:#888;margin-top:4px;">Payment: ${order.payment_method}</p>
                    </div>
                    <div class="meta-right text-right">
                        <span class="status-badge" style="background:${color};color:#fff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">${status}</span>
                        <p class="est-delivery">Est. delivery: ${deliveryDisplay}</p>
                    </div>
                </div>
                <div class="order-tracking-box">
                    <h4>Order Tracking</h4>
                    <div class="tracking-timeline-wrapper">
                        <div class="timeline-line-bg">
                            <div class="timeline-line-progress ${progress}"></div>
                        </div>
                        <div class="timeline-step">
                            <div class="status-node done-rose">🧾</div>
                            <span class="step-label">Order Placed</span>
                        </div>
                        <div class="timeline-step">
                            <div class="status-node ${nodeClass(step2Done)}">📦</div>
                            <span class="step-label ${labelClass(step2Done)}">Shipped</span>
                        </div>
                        <div class="timeline-step">
                            <div class="status-node ${nodeClass(step3Done)}">🚚</div>
                            <span class="step-label ${labelClass(step3Done)}">In Transit</span>
                        </div>
                        <div class="timeline-step">
                            <div class="status-node ${nodeClass(step4Done)}">✓</div>
                            <span class="step-label ${labelClass(step4Done)}">Delivered</span>
                        </div>
                    </div>
                </div>
                ${reviewFormMarkup}`;
            ordersDynamicContainer.appendChild(cardEl);
        });

        // Init inline star pickers for all delivered orders
        orders.filter(o => o.status === 'Delivered').forEach(order => {
            const picker = document.getElementById(`star-picker-${order.order_number}`);
            if (!picker) return;
            let selectedRating = 0;
            picker.querySelectorAll('.star').forEach(star => {
                star.style.color = '#ccc';
                star.addEventListener('mouseover', () => highlightInlineStars(picker, +star.dataset.val));
                star.addEventListener('mouseleave', () => highlightInlineStars(picker, selectedRating));
                star.addEventListener('click', () => {
                    selectedRating = +star.dataset.val;
                    document.getElementById(`rating-${order.order_number}`).value = selectedRating;
                    highlightInlineStars(picker, selectedRating);
                });
            });
        });
    }

    function highlightInlineStars(picker, count) {
        picker.querySelectorAll('.star').forEach(s => {
            s.style.color = +s.dataset.val <= count ? '#f59e0b' : '#ccc';
        });
    }

    window.toggleInlineReview = function(orderNum) {
        const form = document.getElementById(`review-form-${orderNum}`);
        const btn  = document.querySelector(`#review-section-${orderNum} .btn-leave-review`);
        if (!form) return;
        const isOpen = form.style.display !== 'none';
        form.style.display = isOpen ? 'none' : 'block';
        if (btn) btn.textContent = isOpen ? '⭐ Leave a Review' : '✕ Close';
    };

    window.submitInlineReview = async function(orderNum) {
        const rating   = +document.getElementById(`rating-${orderNum}`)?.value;
        const message  = document.getElementById(`message-${orderNum}`)?.value.trim();
        const feedback = document.getElementById(`feedback-${orderNum}`);
        const btn      = document.getElementById(`submit-review-${orderNum}`);

        if (!rating)  { showFeedback(feedback, '❌ Please select a star rating.', false); return; }
        if (!message) { showFeedback(feedback, '❌ Please write a review message.', false); return; }

        btn.disabled = true; btn.textContent = 'Submitting…';

        try {
            const res  = await fetch(`${API_BASE}/submit_testimony.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_number: orderNum, rating, message }),
            });
            const data = await res.json();
            showFeedback(feedback, (data.success ? '✅ ' : '❌ ') + data.message, data.success);
            if (data.success) {
                document.getElementById(`message-${orderNum}`).value = '';
                document.getElementById(`rating-${orderNum}`).value = '0';
                const picker = document.getElementById(`star-picker-${orderNum}`);
                if (picker) highlightInlineStars(picker, 0);
                // Replace button with thank you note
                const reviewBtn = document.querySelector(`#review-section-${orderNum} .btn-leave-review`);
                if (reviewBtn) { reviewBtn.textContent = '✅ Review Submitted'; reviewBtn.disabled = true; reviewBtn.style.background = '#16a34a'; }
            }
        } catch(e) {
            showFeedback(feedback, '❌ Could not connect. Try again later.', false);
        } finally {
            if (!btn.textContent.includes('Submitted')) { btn.disabled = false; btn.textContent = 'Submit Review'; }
        }
    };


    // ========================================================
    // 6. CONTACT FORM — Posts to PHP API
    // ========================================================
    const contactForm = document.querySelector(".message-form-element");
    if (contactForm) {
        contactForm.addEventListener("submit", async e => {
            e.preventDefault();

            const payload = {
                name:     document.getElementById("user-name").value.trim(),
                email:    document.getElementById("user-email").value.trim(),
                phone:    document.getElementById("user-phone").value.trim(),
                occasion: document.getElementById("occasion-select").value,
                message:  document.getElementById("user-message").value.trim(),
            };

            const submitBtn = contactForm.querySelector(".btn-submit-message");
            submitBtn.disabled    = true;
            submitBtn.textContent = "Sending…";

            try {
                const res  = await fetch(`${API_BASE}/contact.php`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload),
                });
                const data = await res.json();

                if (data.success) {
                    alert("✅ Message sent! We'll get back to you soon.");
                    contactForm.reset();
                } else {
                    alert("❌ " + (data.message || "Something went wrong."));
                }
            } catch (err) {
                alert("❌ Could not send message. Please try again.");
            } finally {
                submitBtn.disabled    = false;
                submitBtn.textContent = "Send Message";
            }
        });
    }


    // ========================================================
    // 7. FLIP CARD INTERACTION FOR COLLECTIONS
    // ========================================================
    const collectionGrids = document.querySelectorAll('.collection-grid');
    collectionGrids.forEach(grid => {
        const productCards = grid.querySelectorAll('.product-card');
        productCards.forEach(card => {
            if (card.querySelector('.flip-inner')) return;

            const frontHTML = card.innerHTML;
            const title     = card.querySelector('.product-title')?.textContent.trim() || '';
            const imgAlt    = card.querySelector('img')?.alt || '';
            const descText  = card.getAttribute('data-description') || `${title} — ${imgAlt}`;

            card.innerHTML = `
                <div class="flip-inner">
                    <div class="flip-front">${frontHTML}</div>
                    <div class="flip-back">
                        <p class="product-desc-text">${descText}</p>
                        <button class="back-order">ORDER</button>
                    </div>
                </div>`;

            card.addEventListener('click', e => {
                if (e.target.closest('.btn-order') || e.target.closest('.back-order') || e.target.closest('.price-action-wrap')) return;
                card.classList.toggle('is-flipped');
            });

            const addToCart = (btn) => {
                const price   = parseFloat(card.querySelector('.product-price')?.textContent.replace(/[^0-9.-]+/g,'')) || 0;
                const product = { id: Date.now() + Math.random().toString(36).substr(2,5), name: title, price: price };
                let cart = JSON.parse(sessionStorage.getItem('flories_cart')) || [];
                cart.push(product);
                sessionStorage.setItem('flories_cart', JSON.stringify(cart));
                const original = btn.textContent;
                btn.textContent = 'Added! ✓';
                btn.style.backgroundColor = '#3E3A39';
                setTimeout(() => { btn.textContent = original; btn.style.backgroundColor = ''; }, 1000);
            };

            const backBtn  = card.querySelector('.back-order');
            const frontBtn = card.querySelector('.btn-order');

            backBtn.addEventListener('click',  e => { e.stopPropagation(); addToCart(backBtn); });
            if (frontBtn) frontBtn.addEventListener('click', e => { e.stopPropagation(); addToCart(frontBtn); });
        });
    });


    // ========================================================
    // 8. TESTIMONY FORM — Star picker + submit (orders.html)
    // ========================================================
    const starPicker = document.getElementById('star-picker');
    if (starPicker) {
        let selectedRating = 0;

        starPicker.querySelectorAll('.star').forEach(star => {
            star.addEventListener('mouseover', () => highlightStars(+star.dataset.val));
            star.addEventListener('mouseleave', () => highlightStars(selectedRating));
            star.addEventListener('click', () => {
                selectedRating = +star.dataset.val;
                document.getElementById('review-rating').value = selectedRating;
                highlightStars(selectedRating);
            });
        });

        function highlightStars(count) {
            starPicker.querySelectorAll('.star').forEach(s => {
                s.classList.toggle('active', +s.dataset.val <= count);
            });
        }
    }

    window.submitReview = async function () {
        const orderNum = document.getElementById('review-order-num')?.value.trim();
        const rating   = +document.getElementById('review-rating')?.value;
        const message  = document.getElementById('review-message')?.value.trim();
        const feedback = document.getElementById('review-feedback');
        const btn      = document.getElementById('btn-submit-review');

        if (!orderNum) { showFeedback(feedback, '❌ Please enter your order number.', false); return; }
        if (!rating)   { showFeedback(feedback, '❌ Please select a star rating.', false); return; }
        if (!message)  { showFeedback(feedback, '❌ Please write a review message.', false); return; }

        btn.disabled = true; btn.textContent = 'Submitting…';

        try {
            const res  = await fetch(`${API_BASE}/submit_testimony.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_number: orderNum, rating, message }),
            });
            const data = await res.json();
            showFeedback(feedback, (data.success ? '✅ ' : '❌ ') + data.message, data.success);
            if (data.success) {
                document.getElementById('review-order-num').value = '';
                document.getElementById('review-message').value = '';
                document.getElementById('review-rating').value = '0';
                document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
            }
        } catch(e) {
            showFeedback(feedback, '❌ Could not connect. Try again later.', false);
        } finally {
            btn.disabled = false; btn.textContent = 'Submit Review';
        }
    };

    function showFeedback(el, msg, success) {
        if (!el) return;
        el.textContent = msg;
        el.style.display = 'block';
        el.style.color = success ? '#2d6a4f' : '#9E2A2B';
    }


    // ========================================================
    // 9. LOAD LIVE TESTIMONIALS (index.html)
    // ========================================================
    const testiGrid = document.getElementById('testimonial-grid');
    if (testiGrid) {
        fetch(`${API_BASE}/get_testimonials.php`)
            .then(r => r.json())
            .then(data => {
                if (data.success && data.testimonials.length > 0) {
                    testiGrid.innerHTML = data.testimonials.map(t => {
                        const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
                        const date  = new Date(t.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return `
                        <div class="testimonial-card">
                            <div>
                                <div class="stars">${stars}</div>
                                <p class="testimonial-text">"${t.message}"</p>
                            </div>
                            <div class="testimonial-author">
                                ${t.customer_name}
                                <span>Verified Customer · ${date}</span>
                            </div>
                        </div>`;
                    }).join('');
                }
                // If no approved testimonials yet, keep the static fallbacks
            })
            .catch(() => {}); // silently keep static fallbacks on error
    }

}); // end DOMContentLoaded

// ============================================================
// HAMBURGER NAV TOGGLE
// ============================================================
(function () {
    const btn = document.getElementById('hamburger-btn');
    const nav = document.getElementById('main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = nav.classList.toggle('nav-open');
        btn.classList.toggle('is-open', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when a link is tapped
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            nav.classList.remove('nav-open');
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close on outside tap
    document.addEventListener('click', function (e) {
        if (!btn.contains(e.target) && !nav.contains(e.target)) {
            nav.classList.remove('nav-open');
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
})();
