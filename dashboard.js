import { getDashboardStats } from './supabase.js'

// ============================================
// AUTH CHECK
// ============================================
function checkAuth() {
    const hasRememberMe = localStorage.getItem('dreamsvote_remember')
    const hasSession = sessionStorage.getItem('dreamsvote_session')
    
    // Redirect ke login jika tidak ada session atau remember me
    if (!hasRememberMe && !hasSession) {
        window.location.href = 'login.html'
        return false
    }
    return true
}

// ============================================
// LOGOUT FUNCTION - Global
// ============================================
window.logout = function() {
    localStorage.removeItem('dreamsvote_remember')
    sessionStorage.removeItem('dreamsvote_session')
    window.location.href = 'login.html'
}

// ============================================
// MOBILE MENU TOGGLE - Global
// ============================================
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu')
    menu.classList.toggle('hidden')
}

// ============================================
// INIT DASHBOARD
// ============================================
async function init() {
    // Cek auth dulu sebelum load data
    if (!checkAuth()) return

    const stats = await getDashboardStats()

    document.getElementById('stat-revenue').textContent  = '$' + stats.totalRevenue.toLocaleString()
    document.getElementById('stat-orders').textContent   = stats.totalOrders.toLocaleString()
    document.getElementById('stat-customers').textContent = stats.totalCustomers.toLocaleString()
    document.getElementById('stat-votes').textContent    = stats.totalVotesSold.toLocaleString()

    initChart()
    
    // Highlight active nav
    highlightActiveNav()
}

function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html'
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('bg-primary/20', 'text-primary', 'border-r-2', 'border-primary')
            link.classList.remove('text-gray-300')
        }
    })
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

document.addEventListener('DOMContentLoaded', init)
