import { supabase } from './supabase.js'
import { getVouchers, createVoucher, deleteVoucher } from './supabase.js'

let vouchers = []

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
    vouchers = await getVouchers()
    renderVouchers()
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

// ... rest of the code (renderVouchers, modal functions, etc.)

// ============================================
// RENDER VOUCHERS
// ============================================
function renderVouchers() {
    const tbody = document.getElementById('vouchers-table-body')
    if (!vouchers.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-gray-400">Belum ada voucher</td></tr>`
        return
    }
    tbody.innerHTML = vouchers.map(v => {
        const isExpired = new Date(v.expiry) < new Date() || (v.max_uses && v.used >= v.max_uses)
        const statusClass = isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
        return `
            <tr class="hover:bg-white/5 transition">
                <td class="px-6 py-4 font-mono font-bold text-primary">${v.code}</td>
                <td class="px-6 py-4 capitalize">${v.type}</td>
                <td class="px-6 py-4 font-bold">${v.type === 'percentage' ? v.value + '%' : '$' + v.value}</td>
                <td class="px-6 py-4">${v.used}${v.max_uses ? '/' + v.max_uses : ''}</td>
                <td class="px-6 py-4 text-gray-400">${v.expiry}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs ${statusClass}">${isExpired ? 'Expired' : 'Active'}</span></td>
                <td class="px-6 py-4">
                    <button onclick="confirmDeleteVoucher(${v.id})" class="text-red-400 hover:text-red-300 transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
    }).join('')
}

// ============================================
// MODAL FUNCTIONS
// ============================================
window.openVoucherModal = function() {
    document.getElementById('voucher-modal').classList.remove('hidden')
    document.getElementById('voucher-expiry').valueAsDate = new Date(Date.now() + 30*24*60*60*1000)
}

window.closeVoucherModal = function() {
    document.getElementById('voucher-modal').classList.add('hidden')
    document.getElementById('voucher-form').reset()
}

window.generateCode = function() {
    document.getElementById('voucher-code').value = 'DV' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ============================================
// SAVE & DELETE
// ============================================
window.saveVoucher = async function(e) {
    e.preventDefault()
    const btn = e.submitter
    btn.disabled = true
    btn.textContent = 'Saving...'

    const newVoucher = {
        code:     document.getElementById('voucher-code').value.toUpperCase(),
        type:     document.getElementById('voucher-type').value,
        value:    parseFloat(document.getElementById('voucher-value').value),
        used:     0,
        max_uses: document.getElementById('voucher-max').value ? parseInt(document.getElementById('voucher-max').value) : null,
        expiry:   document.getElementById('voucher-expiry').value,
        status:   'active'
    }

    const created = await createVoucher(newVoucher)
    if (created) { 
        vouchers.push(created)
        showToast('Voucher created!')
    }

    btn.disabled = false
    btn.textContent = 'Create Voucher'
    closeVoucherModal()
    renderVouchers()
}

window.confirmDeleteVoucher = async function(id) {
    if (confirm('Hapus voucher ini?')) {
        const ok = await deleteVoucher(id)
        if (ok) { 
            vouchers = vouchers.filter(v => v.id !== id)
            renderVouchers()
            showToast('Voucher deleted!')
        }
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('keydown', e => { 
    if (e.key === 'Escape') closeVoucherModal() 
})

document.addEventListener('DOMContentLoaded', init)
