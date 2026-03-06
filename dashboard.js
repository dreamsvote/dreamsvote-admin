import { getDashboardStats } from './supabase.js'
import { supabase } from './supabase.js'

// ============================================
// AUTH CHECK
// ============================================
async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    
    if (!data.session) {
        window.location.replace('login.html')
        return false
    }
    return true
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
// LOGOUT - Global access
// ============================================
window.logout = async function() {
    await supabase.auth.signOut()
    localStorage.removeItem('dreamsvote_remember')
    localStorage.removeItem('sb-cirrufadyvsrswjfvabr-auth-token')
    sessionStorage.clear()
    window.location.replace('login.html')
}

// ============================================
// MOBILE MENU
// ============================================
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu')
    if (menu) menu.classList.toggle('hidden')
}

// ============================================
// INIT DASHBOARD
// ============================================
async function init() {
    // Cek auth dulu sebelum load data
    if (!await checkAuth()) return

    // Highlight nav
    highlightActiveNav()

    try {
        const stats = await getDashboardStats()

        document.getElementById('stat-revenue').textContent  = 'Rp' + stats.totalRevenue.toLocaleString()
        document.getElementById('stat-orders').textContent   = stats.totalOrders.toLocaleString()
        document.getElementById('stat-customers').textContent = stats.totalCustomers.toLocaleString()
        document.getElementById('stat-votes').textContent    = stats.totalVotesSold.toLocaleString()

        initChart()
    } catch (error) {
        console.error('Error loading dashboard:', error)
        showToast('Error loading data', 'error')
    }
}

function initChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d')
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue',
                data: [1200, 1900, 1500, 2200, 1800, 2800, 2450],
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    })
}

// ============================================
// SHOW TOAST
// ============================================
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast')
    const toastMessage = document.getElementById('toast-message')
    const icon = toast.querySelector('i')
    
    if (!toast || !toastMessage) return
    
    toastMessage.textContent = message
    
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark text-red-400 text-xl'
    } else {
        icon.className = 'fa-solid fa-check-circle text-primary text-xl'
    }
    
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}

document.addEventListener('DOMContentLoaded', init)
