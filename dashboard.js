import { getDashboardStats, getProducts, getVouchers, createOrder, getPaymentAccounts } from './supabase.js'
import { supabase } from './supabase.js'

// ... existing code (checkAuth, highlightActiveNav, logout, toggleMobileMenu) ...

// ============================================
// ORDER MANAGEMENT
// ============================================
let availableProducts = []
let currentVoucher = null
let orderItems = []

async function init() {
    if (!await checkAuth()) return
    highlightActiveNav()

    try {
        const stats = await getDashboardStats()
        document.getElementById('stat-revenue').textContent  = 'Rp' + stats.totalRevenue.toLocaleString()
        document.getElementById('stat-orders').textContent   = stats.totalOrders.toLocaleString()
        document.getElementById('stat-customers').textContent = stats.totalCustomers.toLocaleString()
        document.getElementById('stat-votes').textContent    = stats.totalVotesSold.toLocaleString()

        initChart()
        
        // Load products for order modal
        availableProducts = await getProducts()
    } catch (error) {
        console.error('Error loading dashboard:', error)
        showToast('Error loading data', 'error')
    }
}

// ============================================
// ORDER MODAL FUNCTIONS
// ============================================
window.openOrderModal = function() {
    document.getElementById('order-modal').classList.remove('hidden')
    document.getElementById('order-form').reset()
    orderItems = []
    currentVoucher = null
    document.getElementById('order-products-container').innerHTML = ''
    document.getElementById('voucher-message').textContent = ''
    updateOrderSummary()
    addProductRow() // Add first row
}

window.closeOrderModal = function() {
    document.getElementById('order-modal').classList.add('hidden')
}

window.addProductRow = function() {
    const container = document.getElementById('order-products-container')
    const rowId = Date.now()
    
    const row = document.createElement('div')
    row.className = 'flex gap-3 items-start'
    row.id = `product-row-${rowId}`
    row.innerHTML = `
        <select onchange="updateProductPrice(${rowId})" id="product-select-${rowId}" class="input-field flex-1 px-4 py-3 rounded-xl text-white" required>
            <option value="">Select product</option>
            ${availableProducts.filter(p => p.status === 'active' && p.stock > 0).map(p => 
                `<option value="${p.id}" data-price="${p.price}" data-stock="${p.stock}">${p.app} - ${p.name} (Rp${p.price} / 100 votes)</option>`
            ).join('')}
        </select>
        <input type="number" id="product-qty-${rowId}" min="1" value="1" onchange="updateOrderSummary()" class="input-field w-24 px-4 py-3 rounded-xl text-white" placeholder="Qty" required>
        <button type="button" onclick="removeProductRow(${rowId})" class="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition">
            <i class="fa-solid fa-trash"></i>
        </button>
    `
    container.appendChild(row)
    orderItems.push({ id: rowId, productId: null, price: 0, qty: 1 })
}

window.removeProductRow = function(rowId) {
    const row = document.getElementById(`product-row-${rowId}`)
    if (row) {
        row.remove()
        orderItems = orderItems.filter(item => item.id !== rowId)
        updateOrderSummary()
    }
}

window.updateProductPrice = function(rowId) {
    const select = document.getElementById(`product-select-${rowId}`)
    const option = select.options[select.selectedIndex]
    const price = parseFloat(option.dataset.price) || 0
    
    const item = orderItems.find(i => i.id === rowId)
    if (item) {
        item.productId = select.value
        item.price = price
    }
    updateOrderSummary()
}

window.updateOrderSummary = function() {
    let subtotal = 0
    
    orderItems.forEach(item => {
        const qtyInput = document.getElementById(`product-qty-${item.id}`)
        if (qtyInput) {
            item.qty = parseInt(qtyInput.value) || 1
            subtotal += item.price * item.qty
        }
    })
    
    let discount = 0
    if (currentVoucher) {
        if (currentVoucher.type === 'percentage') {
            discount = subtotal * (currentVoucher.value / 100)
        } else {
            discount = currentVoucher.value
        }
        discount = Math.min(discount, subtotal)
    }
    
    const total = subtotal - discount
    
    document.getElementById('order-subtotal').textContent = 'Rp' + subtotal.toLocaleString()
    document.getElementById('order-discount').textContent = '-Rp' + discount.toLocaleString()
    document.getElementById('order-total').textContent = 'Rp' + total.toLocaleString()
}

window.applyVoucher = async function() {
    const code = document.getElementById('order-voucher').value.trim().toUpperCase()
    const msgEl = document.getElementById('voucher-message')
    
    if (!code) {
        msgEl.textContent = 'Enter voucher code'
        msgEl.className = 'text-xs mt-1 text-red-400'
        return
    }
    
    const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .eq('status', 'active')
        .single()
    
    if (!voucher) {
        msgEl.textContent = 'Invalid voucher code'
        msgEl.className = 'text-xs mt-1 text-red-400'
        currentVoucher = null
    } else if (new Date(voucher.expiry) < new Date()) {
        msgEl.textContent = 'Voucher expired'
        msgEl.className = 'text-xs mt-1 text-red-400'
        currentVoucher = null
    } else if (voucher.max_uses && voucher.used >= voucher.max_uses) {
        msgEl.textContent = 'Voucher limit reached'
        msgEl.className = 'text-xs mt-1 text-red-400'
        currentVoucher = null
    } else {
        currentVoucher = voucher
        msgEl.textContent = `✓ ${voucher.type === 'percentage' ? voucher.value + '%' : 'Rp' + voucher.value} discount applied`
        msgEl.className = 'text-xs mt-1 text-green-400'
    }
    
    updateOrderSummary()
}

window.saveOrder = async function(e) {
    e.preventDefault()
    
    const customerName = document.getElementById('order-customer-name').value
    const customerEmail = document.getElementById('order-customer-email').value
    const customerWhatsapp = document.getElementById('order-customer-whatsapp').value
    const paymentMethod = document.getElementById('order-payment-method').value
    const notes = document.getElementById('order-notes').value
    
    // Validate products
    const validItems = orderItems.filter(item => item.productId && item.qty > 0)
    if (validItems.length === 0) {
        showToast('Please select at least one product', 'error')
        return
    }
    
    // Calculate totals
    let subtotal = 0
    validItems.forEach(item => {
        subtotal += item.price * item.qty
    })
    
    let discount = 0
    if (currentVoucher) {
        discount = currentVoucher.type === 'percentage' 
            ? subtotal * (currentVoucher.value / 100)
            : currentVoucher.value
        discount = Math.min(discount, subtotal)
    }
    
    const total = subtotal - discount
    
    // Create order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: customerName,
            customer_email: customerEmail,
            customer_whatsapp: customerWhatsapp,
            subtotal: subtotal,
            discount: discount,
            total: total,
            voucher_id: currentVoucher?.id || null,
            voucher_code: currentVoucher?.code || null,
            payment_method: paymentMethod,
            notes: notes,
            status: 'pending'
        })
        .select()
        .single()
    
    if (orderError) {
        console.error('Order error:', orderError)
        showToast('Failed to create order', 'error')
        return
    }
    
    // Create order items
    const orderItemsData = validItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: availableProducts.find(p => p.id == item.productId)?.name,
        product_app: availableProducts.find(p => p.id == item.productId)?.app,
        quantity: item.qty,
        price: item.price,
        subtotal: item.price * item.qty
    }))
    
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)
    
    if (itemsError) {
        console.error('Order items error:', itemsError)
        showToast('Failed to add order items', 'error')
        return
    }
    
    // Update voucher usage
    if (currentVoucher) {
        await supabase
            .from('vouchers')
            .update({ used: currentVoucher.used + 1 })
            .eq('id', currentVoucher.id)
    }
    
    // Update product stock
    for (const item of validItems) {
        const product = availableProducts.find(p => p.id == item.productId)
        await supabase
            .from('products')
            .update({ 
                stock: product.stock - item.qty,
                sold: (product.sold || 0) + item.qty
            })
            .eq('id', item.productId)
    }
    
    showToast('Order created successfully!')
    closeOrderModal()
    
    // Refresh dashboard stats
    const stats = await getDashboardStats()
    document.getElementById('stat-revenue').textContent  = 'Rp' + stats.totalRevenue.toLocaleString()
    document.getElementById('stat-orders').textContent   = stats.totalOrders.toLocaleString()
    document.getElementById('stat-votes').textContent    = stats.totalVotesSold.toLocaleString()
}

// ============================================
// INIT DASHBOARD
// ============================================
async function init() {
    // Cek auth dulu sebelum load data
    if (!await checkAuth()) return

    // Highlight nav
    highlightActiveNav()

    try {
        const stats = await getDashboardStats()

        document.getElementById('stat-revenue').textContent  = 'Rp' + stats.totalRevenue.toLocaleString()
        document.getElementById('stat-orders').textContent   = stats.totalOrders.toLocaleString()
        document.getElementById('stat-customers').textContent = stats.totalCustomers.toLocaleString()
        document.getElementById('stat-votes').textContent    = stats.totalVotesSold.toLocaleString()

        initChart()
    } catch (error) {
        console.error('Error loading dashboard:', error)
        showToast('Error loading data', 'error')
    }
}

function initChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d')
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue',
                data: [1200, 1900, 1500, 2200, 1800, 2800, 2450],
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    })
}

// ============================================
// SHOW TOAST
// ============================================
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast')
    const toastMessage = document.getElementById('toast-message')
    const icon = toast.querySelector('i')
    
    if (!toast || !toastMessage) return
    
    toastMessage.textContent = message
    
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark text-red-400 text-xl'
    } else {
        icon.className = 'fa-solid fa-check-circle text-primary text-xl'
    }
    
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}

document.addEventListener('DOMContentLoaded', init)
