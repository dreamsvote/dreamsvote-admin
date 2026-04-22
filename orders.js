import { supabase } from './supabase.js'

let orders = []
let currentFilter = 'all'
let currentOrderId = null

// ================================================
// INIT
// ================================================
async function init() {
    await loadOrders()
}

async function loadOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*)`)
        .order('created_at', { ascending: false })

    if (error) { console.error(error); return }
    orders = data || []
    updateStats()
    renderOrders()
}

// ================================================
// STATS
// ================================================
function updateStats() {
    document.getElementById('stat-total').textContent     = orders.length
    document.getElementById('stat-pending').textContent   = orders.filter(o => o.status === 'pending').length
    document.getElementById('stat-completed').textContent = orders.filter(o => o.status === 'completed').length
    document.getElementById('stat-noproof').textContent   = orders.filter(o => !o.proof_url).length
}

// ================================================
// RENDER
// ================================================
function renderOrders() {
    const search = document.getElementById('search-input').value.toLowerCase()
    const tbody  = document.getElementById('orders-tbody')

    let filtered = orders
    if (currentFilter !== 'all') filtered = filtered.filter(o => o.status === currentFilter)
    if (search) filtered = filtered.filter(o =>
        o.order_code?.toLowerCase().includes(search) ||
        o.customer_name?.toLowerCase().includes(search) ||
        o.customer_email?.toLowerCase().includes(search)
    )

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400">
            <i class="fa-solid fa-box-open text-5xl mb-4 block text-gray-600"></i>
            Tidak ada order
        </td></tr>`
        return
    }

    tbody.innerHTML = filtered.map(o => {
        const statusClass = {
            pending:         'status-pending',
            waiting_payment: 'status-waiting',
            paid:            'status-paid',
            processing:      'status-processing',
            completed:       'status-completed',
            cancelled:       'status-cancelled'
        }[o.status] || 'status-pending'

        const statusLabel = {
            pending:         'Pending',
            waiting_payment: 'Waiting Payment',
            paid:            'Paid',
            processing:      'Processing',
            completed:       'Completed',
            cancelled:       'Cancelled'
        }[o.status] || o.status

        const hasProof   = !!o.proof_url
        const proofClass = hasProof ? 'proof-uploaded' : 'proof-not-yet'
        const proofLabel = hasProof ? 'Uploaded' : 'Not Yet'

        const proofBtn = hasProof
            ? `<a href="${o.proof_url}" target="_blank" onclick="event.stopPropagation()"
                class="px-3 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition">
                <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>Open
               </a>`
            : `<span class="text-gray-600 text-xs">—</span>`

        const date = new Date(o.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

        return `
            <tr onclick="openDetailModal('${o.id}')" class="hover:bg-white/5 transition">
                <td class="px-4 py-3 font-mono font-bold text-primary text-xs">${o.order_code}</td>
                <td class="px-4 py-3">
                    <p class="font-medium">${o.customer_name}</p>
                    <p class="text-xs text-gray-400">${o.customer_email}</p>
                </td>
                <td class="px-4 py-3 font-bold">$${parseFloat(o.total).toFixed(2)}</td>
                <td class="px-4 py-3"><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td class="px-4 py-3"><span class="status-badge ${proofClass}">${proofLabel}</span></td>
                <td class="px-4 py-3">${proofBtn}</td>
                <td class="px-4 py-3 text-gray-400 text-xs">${date}</td>
                <td class="px-4 py-3">
                    <button onclick="event.stopPropagation(); openDetailModal('${o.id}')"
                        class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition">
                        Detail
                    </button>
                </td>
            </tr>
        `
    }).join('')
}

// ================================================
// FILTER & SEARCH
// ================================================
window.setFilter = function(filter, el) {
    currentFilter = filter
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'))
    el.classList.add('active')
    renderOrders()
}

window.filterOrders = renderOrders

// ================================================
// DETAIL MODAL
// ================================================
window.openDetailModal = function(orderId) {
    const o = orders.find(x => x.id === orderId)
    if (!o) return
    currentOrderId = orderId

    document.getElementById('modal-order-id').textContent   = o.order_code
    document.getElementById('modal-order-date').textContent = new Date(o.created_at).toLocaleString('id-ID')
    document.getElementById('modal-customer-name').textContent  = o.customer_name || '-'
    document.getElementById('modal-customer-email').textContent = o.customer_email || '-'
    document.getElementById('modal-customer-wa').textContent    = o.customer_whatsapp || '-'
    document.getElementById('modal-subtotal').textContent = '$' + parseFloat(o.subtotal || 0).toFixed(2)
    document.getElementById('modal-total').textContent    = '$' + parseFloat(o.total).toFixed(2)

    // Discount
    const discountRow = document.getElementById('modal-discount-row')
    if (o.discount && o.discount > 0) {
        discountRow.classList.remove('hidden')
        document.getElementById('modal-discount').textContent = '-$' + parseFloat(o.discount).toFixed(2)
    } else {
        discountRow.classList.add('hidden')
    }

    // Items
    const items = o.order_items || []
    document.getElementById('modal-items').innerHTML = items.map(item => `
        <div class="flex justify-between text-sm">
            <span class="text-gray-300">${item.product_name} <span class="text-gray-500">x${item.quantity}</span></span>
            <span class="font-medium">$${parseFloat(item.subtotal).toFixed(2)}</span>
        </div>
    `).join('') || '<p class="text-gray-500 text-sm">Tidak ada item</p>'

    // Schedule
    const schedSection = document.getElementById('modal-schedule-section')
    if (o.scheduled_date) {
        schedSection.classList.remove('hidden')
        document.getElementById('modal-sched-date').textContent = o.scheduled_date
        document.getElementById('modal-sched-kst').textContent  = o.scheduled_kst || '-'
        document.getElementById('modal-sched-wib').textContent  = o.scheduled_wib || '-'
    } else {
        schedSection.classList.add('hidden')
    }

    // Proof
    const proofInput = document.getElementById('modal-proof-input')
    const proofLink  = document.getElementById('modal-proof-link')
    const proofUrl   = document.getElementById('modal-proof-url')
    proofInput.value = o.proof_url || ''
    if (o.proof_url) {
        proofLink.classList.remove('hidden')
        proofUrl.href = o.proof_url
    } else {
        proofLink.classList.add('hidden')
    }

    document.getElementById('detail-modal').classList.remove('hidden')
}

window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.add('hidden')
    currentOrderId = null
}

window.saveProof = async function() {
    const url = document.getElementById('modal-proof-input').value.trim()
    if (!url) return

    const { error } = await supabase
        .from('orders')
        .update({ proof_url: url })
        .eq('id', currentOrderId)

    if (!error) {
        const idx = orders.findIndex(o => o.id === currentOrderId)
        orders[idx].proof_url = url

        const proofLink = document.getElementById('modal-proof-link')
        const proofUrl  = document.getElementById('modal-proof-url')
        proofLink.classList.remove('hidden')
        proofUrl.href = url

        showToast('Proof link disimpan!')
        renderOrders()
    }
}

window.updateStatus = async function(status) {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', currentOrderId)

    if (!error) {
        const idx = orders.findIndex(o => o.id === currentOrderId)
        orders[idx].status = status
        showToast('Status diupdate!')
        closeDetailModal()
        updateStats()
        renderOrders()
    }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailModal() })
document.addEventListener('DOMContentLoaded', init)
