import { supabase, getOrders, updateOrderStatus } from './supabase.js'

let orders = []

// ============================================
// INIT
// ============================================
async function init() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }
    
    orders = await getOrders()
    renderOrders()
    updateStats()
}

// ============================================
// RENDER ORDERS
// ============================================
function renderOrders() {
    const tbody = document.getElementById('order-table-body')
    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-8 py-20 text-center text-text-muted italic">No orders found</td></tr>`
        return
    }

    tbody.innerHTML = orders.map(o => `
        <tr class="hover:bg-primary-light/30 transition-all">
            <td class="px-8 py-5 font-mono text-xs font-bold text-text-main">#${o.id.substring(0,8).toUpperCase()}</td>
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-bold text-[10px] text-primary">
                        ${o.user_name ? o.user_name.substring(0,2).toUpperCase() : 'CU'}
                    </div>
                    <div>
                        <p class="font-bold text-text-main leading-none">${o.user_name || 'Customer'}</p>
                        <p class="text-[10px] text-text-muted mt-1 font-medium">${o.user_email || ''}</p>
                    </div>
                </div>
            </td>
            <td class="px-8 py-5 font-bold text-text-main">
                ${o.currency === 'IDR' || o.currency === 'Rp' ? 'Rp ' + parseInt(o.total).toLocaleString() : '$' + parseFloat(o.total).toFixed(2)}
            </td>
            <td class="px-8 py-5">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest 
                    ${o.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' : 
                      o.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                      'bg-red-50 text-red-600 border border-red-100'}">
                    ${o.status}
                </span>
            </td>
            <td class="px-8 py-5">
                ${o.payment_proof_url ? 
                    `<button onclick="viewProof('${o.payment_proof_url}')" class="text-primary hover:underline text-[10px] font-bold flex items-center gap-1">
                        <i data-lucide="image" class="w-3 h-3"></i>VIEW PROOF
                    </button>` : 
                    `<span class="text-text-muted text-[10px] font-bold italic">NO PROOF</span>`
                }
            </td>
            <td class="px-8 py-5 text-text-muted text-xs font-medium">
                ${new Date(o.created_at).toLocaleDateString()}
            </td>
            <td class="px-8 py-5">
                <button onclick="viewOrderDetail('${o.id}')" class="w-8 h-8 rounded-lg hover:bg-background flex items-center justify-center transition-colors">
                    <i data-lucide="eye" class="w-5 h-5 text-text-muted"></i>
                </button>
            </td>
        </tr>
    `).join('')
    if (window.lucide) lucide.createIcons()
}

function updateStats() {
    document.getElementById('stat-total-orders').textContent     = orders.length
    document.getElementById('stat-pending-orders').textContent   = orders.filter(o => o.status === 'pending').length
    document.getElementById('stat-completed-orders').textContent = orders.filter(o => o.status === 'completed').length
    document.getElementById('stat-proof-needed').textContent     = orders.filter(o => !o.payment_proof_url && o.status === 'pending').length
}

window.viewOrderDetail = function(id) {
    const o = orders.find(x => x.id === id)
    const modal = document.getElementById('order-modal')
    const content = document.getElementById('order-details-content')
    const actions = document.getElementById('modal-actions')
    
    document.getElementById('modal-order-id').textContent = `Order #${o.id.substring(0,8).toUpperCase()}`
    
    content.innerHTML = `
        <div class="grid grid-cols-2 gap-8">
            <div class="space-y-6">
                <div>
                    <p class="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Customer Information</p>
                    <div class="p-4 rounded-2xl bg-background border border-border">
                        <p class="font-bold text-text-main">${o.user_name || 'Customer'}</p>
                        <p class="text-sm text-text-muted">${o.user_email || 'No email'}</p>
                        <p class="text-sm text-text-muted mt-1">${o.user_whatsapp || 'No WhatsApp'}</p>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Order Summary</p>
                    <div class="p-4 rounded-2xl bg-background border border-border space-y-3">
                        ${(o.order_items || []).map(item => `
                            <div class="flex justify-between text-sm">
                                <span class="text-text-muted">${item.quantity}x ${item.product_name}</span>
                                <span class="font-bold">${o.currency === 'IDR' ? 'Rp ' + parseInt(item.subtotal).toLocaleString() : '$' + parseFloat(item.subtotal).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="pt-3 border-t border-border flex justify-between">
                            <span class="font-bold text-text-main">Total Amount</span>
                            <span class="font-bold text-primary text-lg">${o.currency === 'IDR' ? 'Rp ' + parseInt(o.total).toLocaleString() : '$' + parseFloat(o.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <p class="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Payment Proof</p>
                <div class="aspect-[3/4] rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-background">
                    ${o.payment_proof_url ? 
                        `<img src="${o.payment_proof_url}" class="w-full h-full object-contain">` : 
                        `<div class="text-center p-6"><i data-lucide="image-off" class="w-10 h-10 text-text-muted mx-auto mb-2"></i><p class="text-xs text-text-muted font-bold">NO PROOF UPLOADED</p></div>`
                    }
                </div>
            </div>
        </div>
    `
    
    actions.innerHTML = `
        <button onclick="closeOrderModal()" class="flex-1 py-4 rounded-xl border border-border font-bold text-text-muted hover:bg-white transition-colors">Close</button>
        ${o.status === 'pending' ? `
            <button onclick="updateStatus('${o.id}', 'cancelled')" class="flex-1 py-4 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 transition-colors">Reject</button>
            <button onclick="updateStatus('${o.id}', 'completed')" class="flex-[2] btn-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20">Approve & Complete</button>
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
        updateStats()
        closeOrderModal()
        showToast(`Order marked as ${status}`)
    }
}

window.viewProof = (url) => window.open(url, '_blank')

document.addEventListener('DOMContentLoaded', init)
