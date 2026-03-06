import { getDashboardStats } from './supabase.js'

async function init() {
    const stats = await getDashboardStats()

    document.getElementById('stat-revenue').textContent  = '$' + stats.totalRevenue.toLocaleString()
    document.getElementById('stat-orders').textContent   = stats.totalOrders.toLocaleString()
    document.getElementById('stat-customers').textContent = stats.totalCustomers.toLocaleString()
    document.getElementById('stat-votes').textContent    = stats.totalVotesSold.toLocaleString()

    initChart()
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

// PERBAIKI FUNGSI LOGOUT INI
function logout() {
    // Redirect ke halaman login
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', init)
