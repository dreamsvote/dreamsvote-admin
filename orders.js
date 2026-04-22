import { supabase, getOrders, updateOrderStatus } from './supabase.js'

let orders = []

// --- BIND TO WINDOW IMMEDIATELY ---
window.viewOrderDetail = function(id) {
    const o = orders.find(x => x.id === id)
    const modal = document.getElementById('order-modal')
    const content = document.getElementById('order-details-content')
    const actions = document.getElementById('modal-actions')
    if (!modal || !o) return
    
    document.getElementById('modal-order-id').textContent = `Order #${o.id.substring(0,8).toUpperCase()}`
    
    content.innerHTML = `
        <div class="grid grid-cols-2 gap-8">
            <div class="space-y-6">
                <div>
                    <p class="text-[10px] font-bold text-text-muted uppercase mb-2">Customer</p>
                    <div class="p-4 rounded-xl bg-background border border-border">
                        <p class="font-bold text-sm">${o.user_name || 'Customer'}</p>
                        <p class="text-xs text-text-muted">${o.user_email || ''}</p>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-text-muted uppercase mb-2">Summary</p>
                    <div class="p-4 rounded-xl bg-background border border-border space-y-2">
                        <div class="flex justify-between font-bold text-primary">
                            <span>Total</span>
                            <span>${o.currency==='IDR'?'Rp ':'$'}${o.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <p class="text-[10px] font-bold text-text-muted uppercase mb-2">Proof</p>
                <div class="aspect-square rounded-xl border-2 border-dashed border-border overflow-hidden bg-background">
                    ${o.payment_proof_url ? `<img src="${o.payment_proof_url}" class="w-full h-full object-contain">` : '<p class="text-center p-10 text-xs text-text-muted italic">No proof</p>'}
                </div>
            </div>
        </div>
    `
    
    actions.innerHTML = `
        <button onclick="closeOrderModal()" class="flex-1 py-3 rounded-xl border border-border font-bold text-xs text-text-muted">Close</button>
        ${o.status === 'pending' ? `
            <button onclick="updateStatus('${o.id}', 'completed')" class="flex-[2] btn-primary py-3 rounded-xl font-bold text-xs">Complete Order</button>
        ` : ''}
    `
    modal.classList.remove('hidden')
    if (window.lucide) lucide.createIcons()
}

window.closeOrderModal = () => document.getElementById('order-modal').classList.add('hidden')

window.updateStatus = async (id, status) => {
    const updated = await updateOrderStatus(id, status)
    if (updated) {
        const idx = orders.findIndex(x => x.id === id)
        orders[idx].status = status
        renderOrders()
        window.closeOrderModal()
        showToast(`Order ${status}`)
    }
}

window.viewProof = (url) => window.open(url, '_blank')

// --- RENDERING ---
function renderOrders() {
    const tbody = document.getElementById('order-table-body')
    if (!tbody) return
    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-8 py-10 text-center text-text-muted italic text-xs">No orders found</td></tr>`
        return
    }
    tbody.innerHTML = orders.map(o => `
        <tr class="hover:bg-primary-light/30 transition-all text-xs">
            <td class="px-8 py-4 font-mono">#${o.id.substring(0,8)}</td>
            <td class="px-8 py-4 font-bold">${o.user_name || 'Customer'}</td>
            <td class="px-8 py-4 font-bold text-primary">${o.currency==='IDR'?'Rp ':'$'}${o.total.toLocaleString()}</td>
            <td class="px-8 py-4"><span class="px-2 py-1 rounded text-[9px] font-bold uppercase ${o.status==='completed'?'bg-green-50 text-green-600':'bg-amber-50 text-amber-600'}">${o.status}</span></td>
            <td class="px-8 py-4">${o.payment_proof_url?'<span class="text-primary font-bold">YES</span>':'NO'}</td>
            <td class="px-8 py-4 text-text-muted">${new Date(o.created_at).toLocaleDateString()}</td>
            <td class="px-8 py-4"><button onclick="viewOrderDetail('${o.id}')" class="text-text-muted hover:text-primary"><i data-lucide="eye" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('')
    if (window.lucide) lucide.createIcons()
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return window.location.replace('login.html')
    orders = await getOrders()
    renderOrders()
})
