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
    }, {
        root: null,
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px"
    });

    elementsToAnimate.forEach(el => elementObserver.observe(el));


    // ========================================================
    // 2. CAPTURE SELECTIONS (Stays on the same page)
    // ========================================================
    const orderButtons = document.querySelectorAll(".btn-order, .btn-mini-order");

    orderButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            let card = e.target.closest(".product-card") || e.target.closest(".price-item-row");
            let name, priceText;

            if (e.target.classList.contains("btn-order")) {
                name = card.querySelector(".product-title").textContent.trim();
                priceText = card.querySelector(".product-price").textContent.trim();
            } else {
                name = card.querySelector(".item-name").textContent.trim();
                priceText = card.querySelector(".item-price").textContent.trim();
            }

            const price = parseFloat(priceText.replace(/[^0-9.-]+/g, ""));
            
            const product = { 
                id: Date.now() + Math.random().toString(36).substr(2, 5),
                name: name, 
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
                <div class="cart-items-container" style="background: #EAEAEA; padding: 25px; border-radius: 12px; display: flex; flex-direction: column; gap: 15px;">
                    <h3 style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #000;">Items in Cart</h3>
                    <div class="cart-items-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
                </div>
            `;

            const itemsList = cartStatusColumn.querySelector(".cart-items-list");

            cart.forEach((item) => {
                const itemRow = document.createElement("div");
                itemRow.className = "cart-item-row";
                itemRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: #FFF; padding: 12px 18px; border-radius: 6px;";
                
                itemRow.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" class="cart-item-checkbox" data-id="${item.id}" checked style="width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 14px; font-weight: 500; color: #3E3A39;">${item.name}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 14px; font-weight: 600; color: #000;">₱${item.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <button class="btn-remove-item" data-id="${item.id}" style="background: #C25E6B; color: #FFF; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; transition: background 0.2s;">Remove</button>
                    </div>
                `;
                itemsList.appendChild(itemRow);
            });

            setupCartEventListeners();
            calculateTotals();
        } else {
            cartStatusColumn.innerHTML = `
                <div class="empty-cart-card">
                    <p>Your cart is empty</p>
                    <a href="collection.html" class="btn-browse">Browse</a>
                </div>
            `;
            updateSummaryDisplay(0, 0.00);
        }
    }

    function setupCartEventListeners() {
        const checkboxes = document.querySelectorAll(".cart-item-checkbox");
        checkboxes.forEach(box => {
            box.addEventListener("change", () => {
                calculateTotals();
            });
        });

        const removeButtons = document.querySelectorAll(".btn-remove-item");
        removeButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
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
        const checkboxes = document.querySelectorAll(".cart-item-checkbox");

        checkboxes.forEach(box => {
            if (box.checked) {
                let itemId = box.getAttribute("data-id");
                let matchedItem = cart.find(item => item.id === itemId);
                if (matchedItem) subtotal += matchedItem.price;
            }
        });

        const serviceSelect = document.getElementById("checkout-service");
        let deliveryFee = 0.00;

        if (subtotal > 0) {
            if (!serviceSelect || serviceSelect.value === "Delivery") {
                deliveryFee = 50.00;
            } else {
                deliveryFee = 0.00;
            }
        }

        updateSummaryDisplay(subtotal, deliveryFee);
        return subtotal;
    }

    function updateSummaryDisplay(subtotal, deliveryFee) {
        const pricingList = document.querySelector(".summary-pricing-list");
        if (!pricingList) return;

        const total = subtotal + deliveryFee;

        pricingList.innerHTML = `
            <div class="pricing-row" style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 12px;">
                <span>Subtotal</span>
                <span>₱${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="pricing-row" style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 12px;">
                <span>Delivery Fee</span>
                <span>₱${deliveryFee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="pricing-row total-row" style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; border-top: 1px solid #D0D0D0; padding-top: 12px;">
                <span>Total</span>
                <span class="price-highlight" style="color: #9E2A2B; font-weight: 700;">₱${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
        `;
    }


    // ========================================================
    // 4. CHECKOUT CLEARANCE & INSTANT PAYMENT/SERVICE TOGGLE
    // ========================================================
    const checkoutForm = document.querySelector(".checkout-form-element");
    const gcashPanel = document.getElementById("gcash-payment-panel");
    const paymentSelect = document.getElementById("checkout-payment");
    const serviceSelect = document.getElementById("checkout-service");

    if (serviceSelect) {
        serviceSelect.addEventListener("change", () => {
            calculateTotals();
        });
    }

    if (paymentSelect) {
        paymentSelect.addEventListener("change", (e) => {
            if (e.target.value === "GCash") {
                gcashPanel.style.display = "block";
            } else {
                gcashPanel.style.display = "none";
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let cart = JSON.parse(sessionStorage.getItem("flories_cart")) || [];
            const checkboxes = document.querySelectorAll(".cart-item-checkbox");
            const checkedBoxes = Array.from(checkboxes).filter(box => box.checked);

            if (cart.length === 0 || checkedBoxes.length === 0) {
                alert("Please select at least one item from your cart to proceed with the order.");
                return;
            }

            const selectedPayment = paymentSelect.value;
            if (!selectedPayment) {
                alert("Please select a payment method to proceed.");
                return;
            }

            if (selectedPayment === "GCash") {
                alert("Processing verified GCash transaction... Order Complete!");
            } else {
                alert("Order Complete! Please prepare cash upon delivery/pickup.");
            }

            let subtotal = calculateTotals();
            let currentDeliveryFee = 0.00;
            if (subtotal > 0 && (!serviceSelect || serviceSelect.value === "Delivery")) {
                currentDeliveryFee = 50.00;
            }
            let totalCost = subtotal + currentDeliveryFee;

            const checkedIds = checkedBoxes.map(box => box.getAttribute("data-id"));
            let itemsOrdered = cart.filter(item => checkedIds.includes(item.id)).map(item => item.name);

            const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
            const deliveryDateInput = document.getElementById("checkout-date").value;
            
            const trackingStatuses = ["Order Placed", "Shipped", "In Transit"];
            const selectedStatus = trackingStatuses[Math.floor(Math.random() * trackingStatuses.length)];
            let progressPercentage = "width-33";
            if (selectedStatus === "Shipped") progressPercentage = "width-66";
            if (selectedStatus === "In Transit") progressPercentage = "width-100";

            const newOrderRecord = {
                orderId: `ORD-2026-${randomOrderNum}`,
                datePlaced: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                estDelivery: deliveryDateInput ? new Date(deliveryDateInput).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Pending",
                items: itemsOrdered,
                total: totalCost,
                status: selectedStatus,
                progress: progressPercentage
            };

            let orderHistory = JSON.parse(localStorage.getItem("flories_orders")) || [];
            orderHistory.unshift(newOrderRecord);
            localStorage.setItem("flories_orders", JSON.stringify(orderHistory));

            let remainingCart = cart.filter(item => !checkedIds.includes(item.id));
            sessionStorage.setItem("flories_cart", JSON.stringify(remainingCart));

            window.location.href = "orders.html";
        });
    }


    // ========================================================
    // 5. DYNAMIC TRACKER LAYOUT GENERATOR (orders.html Only)
    // ========================================================
    const ordersDynamicContainer = document.getElementById("orders-dynamic-container");
    if (ordersDynamicContainer) {
        let orderHistory = JSON.parse(localStorage.getItem("flories_orders")) || [];

        if (orderHistory.length > 0) {
            ordersDynamicContainer.innerHTML = "";

            orderHistory.forEach((order) => {
                let itemsMarkup = order.items.map(item => `<li>${item}</li>`).join("");

                let step2NodeClass = "pending-gray";
                let step3NodeClass = "pending-gray";
                let label2Class = "inactive";
                let label3Class = "inactive";

                if (order.status === "Shipped" || order.status === "In Transit") {
                    step2NodeClass = "done-rose";
                    label2Class = "";
                }
                if (order.status === "In Transit") {
                    step3NodeClass = "done-rose";
                    label3Class = "";
                }

                const orderCardElement = document.createElement("div");
                orderCardElement.className = "order-card";
                
                orderCardElement.innerHTML = `
                    <div class="order-card-meta">
                        <div class="meta-left">
                            <h3>Order ${order.orderId}</h3>
                            <p class="order-date">Placed on ${order.datePlaced}</p>
                            <div class="order-items-summary">
                                <span class="label">Items:</span>
                                <ul>${itemsMarkup}</ul>
                            </div>
                            <p class="order-total-cost">Total: ₱${order.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div class="meta-right text-right">
                            <span class="status-badge ${order.status === 'Order Placed' ? 'text-green' : order.status === 'Shipped' ? 'text-olive' : 'text-rose'}">${order.status}</span>
                            <p class="est-delivery">Est. delivery: ${order.estDelivery}</p>
                        </div>
                    </div>

                    <div class="order-tracking-box">
                        <h4>Order Tracking</h4>
                        <div class="tracking-timeline-wrapper">
                            <div class="timeline-line-bg">
                                <div class="timeline-line-progress ${order.progress}"></div>
                            </div>
                            
                            <div class="timeline-step">
                                <div class="status-node done-rose">🧾</div>
                                <span class="step-label">Order Placed</span>
                            </div>
                            <div class="timeline-step">
                                <div class="status-node ${step2NodeClass}">📦</div>
                                <span class="step-label ${label2Class}">Shipped</span>
                            </div>
                            <div class="timeline-step">
                                <div class="status-node ${step3NodeClass}">🚚</div>
                                <span class="step-label ${label3Class}">In Transit</span>
                            </div>
                            <div class="timeline-step">
                                <div class="status-node pending-gray">✓</div>
                                <span class="step-label inactive">Delivered</span>
                            </div>
                        </div>
                    </div>
                `;
                ordersDynamicContainer.appendChild(orderCardElement);
            });
        }
    }

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-order')) return;
            this.classList.toggle('flipped');
        });
    });
});