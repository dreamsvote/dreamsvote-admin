import { supabase, getCustomers } from './supabase.js'

let customers = []

// ============================================
// INIT
// ============================================
async function init() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }
    
    customers = await getCustomers()
    renderCustomers()
    updateStats()
}

// ============================================
// RENDER CUSTOMERS
// ============================================
function renderCustomers() {
    const tbody = document.getElementById('customer-table-body')
    if (!customers.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-8 py-20 text-center text-text-muted italic">No customers registered</td></tr>`
        return
    }

    tbody.innerHTML = customers.map(c => `
        <tr class="hover:bg-primary-light/30 transition-all">
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <img src="${c.avatar_url || `https://ui-avatars.com/api/?name=${c.full_name || c.username}&background=8A2A2B&color=fff`}" class="w-10 h-10 rounded-xl object-cover border border-border">
                    <div>
                        <p class="font-bold text-text-main leading-none">${c.full_name || 'No Name'}</p>
                        <p class="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-wider">@${c.username}</p>
                    </div>
                </div>
            </td>
            <td class="px-8 py-5">
                <p class="text-xs text-text-main font-medium">${c.email}</p>
                <p class="text-[10px] text-text-muted font-bold">${c.whatsapp || 'No WhatsApp'}</p>
            </td>
            <td class="px-8 py-5 font-bold text-text-main">
                $${parseFloat(c.total_spent || 0).toLocaleString()}
            </td>
            <td class="px-8 py-5 font-bold text-text-main">
                ${parseInt(c.order_count || 0)}
            </td>
            <td class="px-8 py-5">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.is_active !== false ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}">
                    ${c.is_active !== false ? 'Active' : 'Banned'}
                </span>
            </td>
            <td class="px-8 py-5 text-text-muted text-xs font-medium">
                ${new Date(c.created_at).toLocaleDateString()}
            </td>
            <td class="px-8 py-5 text-right">
                <button onclick="viewCustomerDetail('${c.id}')" class="text-text-muted hover:text-primary transition-colors">
                    <i data-lucide="external-link" class="w-5 h-5"></i>
                </button>
            </td>
        </tr>
    `).join('')
    if (window.lucide) lucide.createIcons()
}

function updateStats() {
    document.getElementById('stat-total-users').textContent = customers.length
    document.getElementById('stat-active-today').textContent = Math.floor(customers.length * 0.4) // Mock
    document.getElementById('stat-new-users').textContent = customers.filter(c => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(c.created_at) > weekAgo
    }).length
}

window.viewCustomerDetail = function(id) {
    const c = customers.find(x => x.id === id)
    alert(`Customer detail view for ${c.username} is under development.`)
}

document.addEventListener('DOMContentLoaded', init)
