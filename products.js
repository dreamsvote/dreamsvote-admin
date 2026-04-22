import { supabase } from './supabase.js'
import { getProducts, createProduct, updateProduct, deleteProduct } from './supabase.js'

let products = []

// ============================================
// INIT
// ============================================
async function init() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }
    
    products = await getProducts()
    renderProducts()
}

// ============================================
// FILTER & SEARCH
// ============================================
window.filterProducts = function(type) {
    const btnAll = document.getElementById('filter-all');
    const btnActive = document.getElementById('filter-active');
    const btnLow = document.getElementById('filter-low');
    
    // Reset classes
    [btnAll, btnActive, btnLow].forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('text-text-muted');
    });
    
    // Set active
    const activeBtn = document.getElementById('filter-' + type);
    activeBtn.classList.add('bg-primary', 'text-white');
    activeBtn.classList.remove('text-text-muted');
    
    // Filter logic
    let filtered = [...products];
    if (type === 'active') filtered = products.filter(p => p.status === 'active');
    if (type === 'low')    filtered = products.filter(p => p.stock < 10000);
    
    renderProducts(filtered);
}

// Update renderProducts to accept optional filtered list
function renderProducts(data = products) {
    const grid = document.getElementById('products-grid')
    if (!data.length) {
        grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
            <i data-lucide="package-open" class="w-16 h-16 mb-4"></i>
            <p class="font-bold">No products found</p>
        </div>`
        if (window.lucide) lucide.createIcons()
        return
    }

    grid.innerHTML = data.map(p => {
        const stockPercent = Math.min((p.stock / 100000) * 100, 100)
        let stockColor = 'bg-green-500'
        if (p.stock === 0)        stockColor = 'bg-red-500'
        else if (p.stock < 10000) stockColor = 'bg-amber-500'

        return `
            <div class="card-premium p-6 relative group flex flex-col h-full">
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center font-bold text-primary text-xs">
                        ${p.app ? p.app.substring(0,2) : '??'}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editProduct(${p.id})" class="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary-light hover:text-primary transition-all">
                            <i data-lucide="edit-3" class="w-4 h-4 text-text-muted"></i>
                        </button>
                        <button onclick="confirmDeleteProduct(${p.id})" class="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4 text-text-muted"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex-1">
                    <h3 class="font-display font-bold text-xl mb-1">${p.name}</h3>
                    <p class="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">${p.app} • ${p.type}</p>
                    
                    <div class="grid grid-cols-3 gap-2 mb-6">
                        <div class="p-2 rounded-xl bg-background border border-border text-center">
                            <p class="text-[9px] font-bold text-text-muted uppercase">USD</p>
                            <p class="text-sm font-bold text-primary">$${parseFloat(p.price_usd || 0).toFixed(2)}</p>
                        </div>
                        <div class="p-2 rounded-xl bg-background border border-border text-center">
                            <p class="text-[9px] font-bold text-text-muted uppercase">IDR</p>
                            <p class="text-sm font-bold text-primary">Rp${parseInt(p.price_idr || 0).toLocaleString()}</p>
                        </div>
                        <div class="p-2 rounded-xl bg-background border border-border text-center">
                            <p class="text-[9px] font-bold text-text-muted uppercase">PHP</p>
                            <p class="text-sm font-bold text-primary">₱${parseInt(p.price_php || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <p class="text-[10px] text-text-muted font-bold uppercase mb-4 text-center italic">Per ${parseInt(p.amount || 10000).toLocaleString()} votes</p>
                </div>

                <div class="space-y-2 pt-4 border-t border-border">
                    <div class="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span class="text-text-muted">Stock</span>
                        <span class="${p.stock < 10000 ? 'text-amber-600' : 'text-green-600'}">${parseInt(p.stock || 0).toLocaleString()} votes</span>
                    </div>
                    <div class="h-1.5 bg-background rounded-full overflow-hidden">
                        <div class="h-full ${stockColor} transition-all duration-1000" style="width: ${stockPercent}%"></div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-text-muted'}"></div>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-text-muted">${p.status}</span>
                    </div>
                    <button onclick="toggleStatus(${p.id}, '${p.status === 'active' ? 'inactive' : 'active'}')" class="text-[10px] font-bold text-primary hover:underline">
                        ${p.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                </div>
            </div>
        `
    }).join('')
    if (window.lucide) lucide.createIcons()
}

// Add Search Listener
document.getElementById('search-input')?.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(val) || 
        p.app.toLowerCase().includes(val) || 
        p.type.toLowerCase().includes(val)
    );
    renderProducts(filtered);
});


// ============================================
// MODAL FUNCTIONS
// ============================================
window.openProductModal = function(productId = null) {
    const modal = document.getElementById('product-modal')
    const title = document.getElementById('modal-title')
    const form  = document.getElementById('product-form')
    
    if (productId) {
        const p = products.find(x => x.id === productId)
        title.textContent = 'Edit Product'
        document.getElementById('product-name').value   = p.name
        document.getElementById('product-app').value    = p.app
        document.getElementById('product-type').value   = p.type
        document.getElementById('product-amount').value = p.amount
        document.getElementById('price-usd').value      = p.price_usd
        document.getElementById('price-idr').value      = p.price_idr
        document.getElementById('price-php').value      = p.price_php
        document.getElementById('product-stock').value  = p.stock
        document.querySelector(`input[name="status"][value="${p.status}"]`).checked = true
        form.setAttribute('data-id', p.id)
    } else {
        title.textContent = 'Add Product'
        form.reset()
        form.removeAttribute('data-id')
    }
    modal.classList.remove('hidden')
}

window.closeProductModal = function() {
    document.getElementById('product-modal').classList.add('hidden')
}

// ============================================
// SAVE & DELETE
// ============================================
window.saveProduct = async function(e) {
    e.preventDefault()
    const form = document.getElementById('product-form')
    const id = form.getAttribute('data-id')
    
    const data = {
        name:      document.getElementById('product-name').value,
        app:       document.getElementById('product-app').value,
        type:      document.getElementById('product-type').value,
        amount:    parseInt(document.getElementById('product-amount').value),
        price_usd: parseFloat(document.getElementById('price-usd').value),
        price_idr: parseInt(document.getElementById('price-idr').value),
        price_php: parseInt(document.getElementById('price-php').value),
        stock:     parseInt(document.getElementById('product-stock').value),
        status:    document.querySelector('input[name="status"]:checked').value
    }
    
    const btn = form.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'Saving...'
    
    if (id) {
        const updated = await updateProduct(parseInt(id), data)
        if (updated) { 
            const idx = products.findIndex(p => p.id == id)
            products[idx] = updated
            showToast('Product updated!')
        }
    } else {
        const created = await createProduct({ ...data, sold: 0 })
        if (created) { 
            products.push(created)
            showToast('Product created!')
        }
    }
    
    btn.disabled = false
    btn.textContent = 'Save Product'
    closeProductModal()
    renderProducts()
}

window.editProduct = function(id) { 
    openProductModal(id) 
}

window.confirmDeleteProduct = async function(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const ok = await deleteProduct(id)
        if (ok) { 
            products = products.filter(p => p.id !== id)
            renderProducts()
            showToast('Product deleted!')
        }
    }
}

window.toggleStatus = async function(id, newStatus) {
    const updated = await updateProduct(id, { status: newStatus })
    if (updated) { 
        const idx = products.findIndex(p => p.id === id)
        products[idx].status = newStatus
        renderProducts()
        showToast(`Product ${newStatus}!`)
    }
}

document.addEventListener('DOMContentLoaded', init)
