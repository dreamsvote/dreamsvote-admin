import { supabase, getVouchers, createVoucher, deleteVoucher } from './supabase.js'

let vouchers = []

// --- BIND TO WINDOW IMMEDIATELY ---
window.openVoucherModal = () => document.getElementById('voucher-modal').classList.remove('hidden')
window.closeVoucherModal = () => document.getElementById('voucher-modal').classList.add('hidden')

window.saveVoucher = async (e) => {
    if (e) e.preventDefault()
    const data = {
        code: document.getElementById('voucher-code').value.toUpperCase(),
        type: document.getElementById('voucher-type').value,
        value: parseFloat(document.getElementById('voucher-value').value),
        min_order: parseFloat(document.getElementById('voucher-min-order').value),
        max_uses: parseInt(document.getElementById('voucher-max-uses').value) || null,
        expiry_date: document.getElementById('voucher-expiry').value,
        usage: 0
    }
    
    const btn = document.querySelector('#voucher-form button[type="submit"]')
    if (btn) btn.disabled = true
    
    const created = await createVoucher(data)
    if (created) {
        vouchers.push(created)
        renderVouchers()
        window.closeVoucherModal()
        showToast('Voucher created!')
    }
    if (btn) btn.disabled = false
}

window.confirmDeleteVoucher = async (id) => {
    if (confirm('Delete this voucher?')) {
        const ok = await deleteVoucher(id)
        if (ok) {
            vouchers = vouchers.filter(v => v.id !== id)
            renderVouchers()
            showToast('Deleted!')
        }
    }
}

// --- RENDERING ---
function renderVouchers() {
    const tbody = document.getElementById('voucher-table-body')
    if (!tbody) return
    if (!vouchers.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-8 py-10 text-center text-text-muted italic text-xs">No vouchers active</td></tr>`
        return
    }
    tbody.innerHTML = vouchers.map(v => `
        <tr class="hover:bg-primary-light/30 transition-all">
            <td class="px-8 py-4"><span class="font-bold text-primary bg-primary-light px-2 py-1 rounded text-xs">${v.code}</span></td>
            <td class="px-8 py-4 text-xs font-bold text-text-muted uppercase">${v.type}</td>
            <td class="px-8 py-4 font-bold">${v.type==='percentage'?v.value+'%':'$'+v.value}</td>
            <td class="px-8 py-4 text-xs">${v.usage||0}/${v.max_uses||'∞'}</td>
            <td class="px-8 py-4 text-xs">${v.expiry_date}</td>
            <td class="px-8 py-4">
                <span class="px-2 py-1 rounded-full text-[9px] font-bold uppercase ${new Date(v.expiry_date)>new Date()?'bg-green-50 text-green-600':'bg-red-50 text-red-600'}">
                    ${new Date(v.expiry_date)>new Date()?'Active':'Expired'}
                </span>
            </td>
            <td class="px-8 py-4"><button onclick="confirmDeleteVoucher(${v.id})" class="text-text-muted hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('')
    if (window.lucide) lucide.createIcons()
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return window.location.replace('login.html')
    vouchers = await getVouchers()
    renderVouchers()
})
