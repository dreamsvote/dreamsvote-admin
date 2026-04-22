import { supabase, getProducts, createProduct, updateProduct, deleteProduct } from './supabase.js'

let products = []

// --- BIND FUNCTIONS TO WINDOW IMMEDIATELY ---
window.openProductModal = function(productId = null) {
    const modal = document.getElementById('product-modal')
    const title = document.getElementById('modal-title')
    const form  = document.getElementById('product-form')
    if (!modal || !form) return

    if (productId) {
        const p = products.find(x => x.id === productId)
        if (p) {
            title.textContent = 'Edit Product'
            document.getElementById('product-name').value   = p.name
            document.getElementById('product-app').value    = p.app
            document.getElementById('product-type').value   = p.type
            document.getElementById('product-amount').value = p.amount
            document.getElementById('price-usd').value      = p.price_usd
            document.getElementById('price-idr').value      = p.price_idr
            document.getElementById('price-php').value      = p.price_php
            document.getElementById('product-stock').value  = p.stock
            const radio = document.querySelector(`input[name="status"][value="${p.status}"]`)
            if (radio) radio.checked = true
            form.setAttribute('data-id', p.id)
        }
    } else {
        title.textContent = 'Add Product'
        form.reset()
        form.removeAttribute('data-id')
    }
    modal.classList.remove('hidden')
}

window.closeProductModal = function() {
    const modal = document.getElementById('product-modal')
    if (modal) modal.classList.add('hidden')
}

window.saveProduct = async function(e) {
    if (e) e.preventDefault()
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
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    
    try {
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
        closeProductModal()
        renderProducts()
    } catch (err) {
        console.error(err)
        showToast('Error saving product', 'error')
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Save Product'; }
    }
}

window.editProduct = (id) => window.openProductModal(id)

window.confirmDeleteProduct = async function(id) {
    if (confirm('Are you sure?')) {
        const ok = await deleteProduct(id)
        if (ok) { 
            products = products.filter(p => p.id !== id)
            renderProducts()
            showToast('Deleted!')
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

window.filterProducts = function(type) {
    const btns = ['all', 'active', 'low']
    btns.forEach(b => {
        const el = document.getElementById('filter-' + b)
        if (el) el.className = (b === type) ? 'px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white' : 'px-6 py-2 rounded-lg text-sm font-bold text-text-muted hover:text-primary transition-all'
    })
    
    let filtered = products
    if (type === 'active') filtered = products.filter(p => p.status === 'active')
    if (type === 'low')    filtered = products.filter(p => p.stock < 10000)
    renderProducts(filtered)
}

// --- RENDERING ---
function renderProducts(data = products) {
    const grid = document.getElementById('products-grid')
    if (!grid) return
    if (!data.length) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-text-muted opacity-50"><p>No products found</p></div>`
        return
    }
    grid.innerHTML = data.map(p => `
        <div class="card-premium p-6 flex flex-col h-full">
            <div class="flex justify-between items-start mb-6">
                <div class="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center font-bold text-primary text-xs">${(p.app||'??').substring(0,2)}</div>
                <div class="flex gap-2">
                    <button onclick="editProduct(${p.id})" class="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary-light transition-all"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="confirmDeleteProduct(${p.id})" class="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-red-50 transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="flex-1">
                <h3 class="font-display font-bold text-lg mb-1">${p.name}</h3>
                <p class="text-text-muted text-[10px] font-bold uppercase mb-4">${p.app} • ${p.type}</p>
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="p-2 rounded-xl bg-background border border-border text-center"><p class="text-[8px] font-bold text-text-muted">USD</p><p class="text-xs font-bold text-primary">$${parseFloat(p.price_usd||0).toFixed(2)}</p></div>
                    <div class="p-2 rounded-xl bg-background border border-border text-center"><p class="text-[8px] font-bold text-text-muted">IDR</p><p class="text-xs font-bold text-primary">Rp${(p.price_idr||0).toLocaleString()}</p></div>
                    <div class="p-2 rounded-xl bg-background border border-border text-center"><p class="text-[8px] font-bold text-text-muted">PHP</p><p class="text-xs font-bold text-primary">₱${(p.price_php||0).toLocaleString()}</p></div>
                </div>
                <p class="text-[9px] text-text-muted text-center italic mb-4">Per ${(p.amount||0).toLocaleString()} votes</p>
            </div>
            <div class="mt-auto pt-4 border-t border-border flex justify-between items-center">
                <span class="text-[10px] font-bold uppercase ${p.status==='active'?'text-green-600':'text-text-muted'}">${p.status}</span>
                <button onclick="toggleStatus(${p.id}, '${p.status==='active'?'inactive':'active'}')" class="text-[10px] font-bold text-primary hover:underline">${p.status==='active'?'Disable':'Enable'}</button>
            </div>
        </div>
    `).join('')
    if (window.lucide) lucide.createIcons()
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return window.location.replace('login.html')
    products = await getProducts()
    renderProducts()
})
