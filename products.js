import { supabase } from './supabase.js'
import { getProducts, createProduct, updateProduct, deleteProduct } from './supabase.js'

let products = []

// ============================================
// AUTH CHECK & INIT
// ============================================
async function init() {
    // Cek auth dulu
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }
    
    // Highlight nav
    highlightActiveNav()
    
    // Load data
    products = await getProducts()
    renderProducts()
}

// ============================================
// HIGHLIGHT ACTIVE NAV
// ============================================
function highlightActiveNav() {
    const page = window.location.pathname.split('/').pop().replace('.html', '')
    const navEl = document.getElementById('nav-' + page)
    if (navEl) {
        navEl.classList.add('active')
        navEl.classList.remove('text-gray-300')
    }
}


// ============================================
// RENDER PRODUCTS
// ============================================
function renderProducts() {
    const grid = document.getElementById('products-grid')
    if (!products.length) {
        grid.innerHTML = `<div class="col-span-3 text-center text-gray-400 py-12">
            <i class="fa-solid fa-box-open text-5xl mb-4 block"></i>
            Belum ada produk
        </div>`
        return
    }

    grid.innerHTML = products.map(p => {
        const stockPercent = Math.min((p.stock / 60000) * 100, 100)
        let stockColor = 'bg-green-500'
        if (p.stock === 0)        stockColor = 'bg-red-500'
        else if (p.stock < 10000) stockColor = 'bg-yellow-500'

        return `
            <div class="glass rounded-2xl p-6 border border-white/5 card-hover relative group">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary">
                        ${p.app.substring(0,2)}
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onclick="editProduct(${p.id})" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary/20 flex items-center justify-center transition">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="confirmDeleteProduct(${p.id})" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition text-red-400">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
                <h3 class="font-bold text-lg mb-1">${p.name}</h3>
                <p class="text-gray-400 text-sm mb-4">${p.app} • ${p.type}</p>
                <div class="flex justify-between items-end mb-4">
                    <div>
                        <p class="text-2xl font-bold text-primary">$${parseFloat(p.price).toFixed(2)}</p>
                        <p class="text-xs text-gray-500">per 100 votes</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium">${(p.sold || 0).toLocaleString()}</p>
                        <p class="text-xs text-gray-500">sold</p>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between text-xs">
                        <span class="text-gray-400">Stock</span>
                        <span class="${p.stock < 10000 ? 'text-yellow-400' : 'text-green-400'}">${p.stock.toLocaleString()} votes</span>
                    </div>
                    <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full ${stockColor} transition-all duration-500" style="width: ${stockPercent}%"></div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <label class="switch">
                        <input type="checkbox" ${p.status === 'active' ? 'checked' : ''} onchange="toggleStatus(${p.id}, this.checked)">
                        <span class="slider"></span>
                    </label>
                    <span class="text-xs ${p.status === 'active' ? 'text-green-400' : 'text-gray-500'}">${p.status === 'active' ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
        `
    }).join('')
}

// ============================================
// MODAL FUNCTIONS
// ============================================
window.openProductModal = function(productId = null) {
    const modal = document.getElementById('product-modal')
    const title = document.getElementById('product-modal-title')
    const form  = document.getElementById('product-form')
    
    if (productId) {
        const p = products.find(x => x.id === productId)
        title.textContent = 'Edit Product'
        document.getElementById('product-id').value    = p.id
        document.getElementById('product-name').value  = p.name
        document.getElementById('product-app').value   = p.app
        document.getElementById('product-type').value  = p.type
        document.getElementById('product-price').value = p.price
        document.getElementById('product-stock').value = p.stock
        document.querySelector(`input[name="status"][value="${p.status}"]`).checked = true
    } else {
        title.textContent = 'Add Product'
        form.reset()
        document.getElementById('product-id').value = ''
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
    const id = document.getElementById('product-id').value
    const data = {
        name:   document.getElementById('product-name').value,
        app:    document.getElementById('product-app').value,
        type:   document.getElementById('product-type').value,
        price:  parseFloat(document.getElementById('product-price').value),
        stock:  parseInt(document.getElementById('product-stock').value),
        status: document.querySelector('input[name="status"]:checked').value
    }
    const btn = e.submitter
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
    if (confirm('Yakin hapus produk ini?')) {
        const ok = await deleteProduct(id)
        if (ok) { 
            products = products.filter(p => p.id !== id)
            renderProducts()
            showToast('Product deleted!')
        }
    }
}

window.toggleStatus = async function(id, checked) {
    const status = checked ? 'active' : 'inactive'
    const updated = await updateProduct(id, { status })
    if (updated) { 
        const idx = products.findIndex(p => p.id === id)
        products[idx].status = status
        renderProducts()
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('keydown', e => { 
    if (e.key === 'Escape') closeProductModal() 
})

document.addEventListener('DOMContentLoaded', init)
