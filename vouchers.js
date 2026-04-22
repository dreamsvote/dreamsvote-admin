import { supabase, getVouchers, createVoucher, deleteVoucher } from './supabase.js'

let vouchers = []

// ============================================
// INIT
// ============================================
async function init() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }
    
    vouchers = await getVouchers()
    renderVouchers()
}

// ============================================
// RENDER VOUCHERS
// ============================================
function renderVouchers() {
    const tbody = document.getElementById('voucher-table-body')
    if (!vouchers.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-8 py-20 text-center text-text-muted italic">No vouchers active</td></tr>`
        return
    }

    tbody.innerHTML = vouchers.map(v => `
        <tr class="hover:bg-primary-light/50 transition-all group">
            <td class="px-8 py-5">
                <span class="font-bold text-primary bg-primary-light px-3 py-1 rounded-lg border border-primary/10">${v.code}</span>
            </td>
            <td class="px-8 py-5 text-text-muted font-bold text-xs uppercase tracking-widest">
                ${v.type === 'percentage' ? 'Percent %' : 'Fixed Amt'}
            </td>
            <td class="px-8 py-5 font-bold text-text-main">
                ${v.type === 'percentage' ? v.value + '%' : '$' + parseFloat(v.value).toFixed(2)}
            </td>
            <td class="px-8 py-5">
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-background rounded-full overflow-hidden w-20">
                        <div class="h-full bg-primary" style="width: ${(v.usage / (v.max_uses || 100)) * 100}%"></div>
                    </div>
                    <span class="text-[10px] font-bold text-text-muted">${v.usage || 0}/${v.max_uses || '∞'}</span>
                </div>
            </td>
            <td class="px-8 py-5 text-text-muted font-medium">
                ${new Date(v.expiry_date).toLocaleDateString()}
            </td>
            <td class="px-8 py-5">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${new Date(v.expiry_date) > new Date() ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}">
                    ${new Date(v.expiry_date) > new Date() ? 'Active' : 'Expired'}
                </span>
            </td>
            <td class="px-8 py-5">
                <button onclick="confirmDeleteVoucher(${v.id})" class="text-text-muted hover:text-red-600 transition-colors">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </td>
        </tr>
    `).join('')
    if (window.lucide) lucide.createIcons()
}

window.openVoucherModal = () => document.getElementById('voucher-modal').classList.remove('hidden')
window.closeVoucherModal = () => document.getElementById('voucher-modal').classList.add('hidden')

window.saveVoucher = async (e) => {
    e.preventDefault()
    const data = {
        code: document.getElementById('voucher-code').value.toUpperCase(),
        type: document.getElementById('voucher-type').value,
        value: parseFloat(document.getElementById('voucher-value').value),
        min_order: parseFloat(document.getElementById('voucher-min-order').value),
        max_uses: parseInt(document.getElementById('voucher-max-uses').value) || null,
        expiry_date: document.getElementById('voucher-expiry').value,
        usage: 0
    }
    
    const created = await createVoucher(data)
    if (created) {
        vouchers.push(created)
        renderVouchers()
        closeVoucherModal()
        showToast('Voucher created successfully!')
    }
}

window.confirmDeleteVoucher = async (id) => {
    if (confirm('Delete this voucher?')) {
        const ok = await deleteVoucher(id)
        if (ok) {
            vouchers = vouchers.filter(v => v.id !== id)
            renderVouchers()
            showToast('Voucher deleted!')
        }
    }
}

document.addEventListener('DOMContentLoaded', init)
