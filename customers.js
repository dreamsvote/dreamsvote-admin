import { supabase } from './supabase.js'

let customers = []
let customerOrders = {}
let currentCustomerId = null
let currentFilter = 'all'

const AVATAR_COLORS = [
    'bg-purple-500', 'bg-pink-500', 'bg-blue-500',
    'bg-green-500', 'bg-yellow-500', 'bg-red-500'
]

function getAvatarColor(str) {
    let hash = 0
    for (let c of str) hash += c.charCodeAt(0)
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name) {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

// ================================================
// INIT
// ================================================
async function init() {
    await loadCustomers()
}

async function loadCustomers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

    if (error) { console.error(error); return }
    customers = users || []

    // Load orders per customer
    const { data: orders } = await supabase
        .from('orders')
        .select('user_id, status, total')

    if (orders) {
        customerOrders = {}
        orders.forEach(o => {
            if (!customerOrders[o.user_id]) customerOrders[o.user_id] = []
            customerOrders[o.user_id].push(o)
        })
    }

    updateStats()
    renderCustomers()
}

// ================================================
// STATS
// ================================================
function updateStats() {
    const totalOrders  = Object.values(customerOrders).flat().length
    const totalRevenue = Object.values(customerOrders).flat()
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0)

    document.getElementById('stat-total').textContent   = customers.length
    document.getElementById('stat-active').textContent  = customers.filter(c => c.is_active).length
    document.getElementById('stat-orders').textContent  = totalOrders
    document.getElementById('stat-revenue').textContent = '$' + totalRevenue.toFixed(2)
}

// ================================================
// RENDER
// ================================================
function renderCustomers() {
    const search = document.getElementById('search-input').value.toLowerCase()
    const tbody  = document.getElementById('customers-tbody')

    let filtered = customers
    if (currentFilter === 'active')   filtered = filtered.filter(c => c.is_active)
    if (currentFilter === 'inactive') filtered = filtered.filter(c => !c.is_active)
    if (search) filtered = filtered.filter(c =>
        c.full_name?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.username?.toLowerCase().includes(search)
    )

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400">
            <i class="fa-solid fa-users text-5xl mb-4 block text-gray-600"></i>
            Tidak ada customer
        </td></tr>`
        return
    }

    tbody.innerHTML = filtered.map(c => {
        const orders       = customerOrders[c.id] || []
        const totalSpent   = orders.filter(o => o.status === 'completed').reduce((s, o) => s + parseFloat(o.total || 0), 0)
        const avatarColor  = getAvatarColor(c.email || c.id)
        const initials     = getInitials(c.full_name || c.username || c.email)
        const joinDate     = new Date(c.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

        return `
            <tr onclick="openDetailModal('${c.id}')" class="hover:bg-white/5 transition">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <div class="customer-avatar ${avatarColor} text-white text-xs">${initials}</div>
                        <div>
                            <p class="font-medium">${c.full_name || '-'}</p>
                            <p class="text-xs text-gray-400">${c.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-gray-300">@${c.username || '-'}</td>
                <td class="px-4 py-3 text-gray-300">${c.whatsapp || '-'}</td>
                <td class="px-4 py-3 font-medium">${orders.length}</td>
                <td class="px-4 py-3 font-bold text-primary">$${totalSpent.toFixed(2)}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        ${c.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3 text-gray-400 text-xs">${joinDate}</td>
                <td class="px-4 py-3">
                    <button onclick="event.stopPropagation(); openDetailModal('${c.id}')"
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
    renderCustomers()
}

window.filterCustomers = renderCustomers

// ================================================
// DETAIL MODAL
// ================================================
window.openDetailModal = async function(customerId) {
    const c = customers.find(x => x.id === customerId)
    if (!c) return
    currentCustomerId = customerId

    const avatarColor = getAvatarColor(c.email || c.id)
    const initials    = getInitials(c.full_name || c.username || c.email)

    const avatarEl = document.getElementById('modal-avatar')
    avatarEl.className = `customer-avatar text-white font-bold ${avatarColor}`
    avatarEl.textContent = initials

    document.getElementById('modal-name').textContent    = c.full_name || '-'
    document.getElementById('modal-email').textContent   = c.email || '-'
    document.getElementById('modal-username').textContent = '@' + (c.username || '-')
    document.getElementById('modal-wa').textContent      = c.whatsapp || '-'
    document.getElementById('modal-joined').textContent  = new Date(c.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })
    document.getElementById('modal-status').innerHTML    = `<span class="px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${c.is_active ? 'Active' : 'Inactive'}</span>`

    // Order stats
    const orders    = customerOrders[c.id] || []
    const completed = orders.filter(o => o.status === 'completed')
    const spent     = completed.reduce((s, o) => s + parseFloat(o.total || 0), 0)

    document.getElementById('modal-total-orders').textContent = orders.length
    document.getElementById('modal-completed').textContent    = completed.length
    document.getElementById('modal-spent').textContent        = '$' + spent.toFixed(2)

    // Recent orders
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('order_code, total, status, created_at')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5)

    const statusColor = { completed:'text-green-400', cancelled:'text-red-400', pending:'text-yellow-400', processing:'text-pink-400' }

    document.getElementById('modal-recent-orders').innerHTML = recentOrders?.length
        ? recentOrders.map(o => `
            <div class="flex justify-between items-center text-sm py-1">
                <span class="font-mono text-primary text-xs">${o.order_code}</span>
                <span class="${statusColor[o.status] || 'text-gray-400'} text-xs capitalize">${o.status}</span>
                <span class="font-bold">$${parseFloat(o.total).toFixed(2)}</span>
            </div>
          `).join('')
        : '<p class="text-gray-500 text-sm">Belum ada order</p>'

    document.getElementById('detail-modal').classList.remove('hidden')
}

window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.add('hidden')
    currentCustomerId = null
}

window.toggleCustomerStatus = async function() {
    const c = customers.find(x => x.id === currentCustomerId)
    if (!c) return

    const newStatus = !c.is_active
    const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', currentCustomerId)

    if (!error) {
        c.is_active = newStatus
        showToast(`Customer ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`)
        closeDetailModal()
        updateStats()
        renderCustomers()
    }
}

window.deleteCustomer = async function() {
    if (!confirm('Yakin hapus customer ini? Semua data ordernya juga akan terhapus!')) return

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', currentCustomerId)

    if (!error) {
        customers = customers.filter(c => c.id !== currentCustomerId)
        showToast('Customer dihapus!')
        closeDetailModal()
        updateStats()
        renderCustomers()
    }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailModal() })
document.addEventListener('DOMContentLoaded', init)
