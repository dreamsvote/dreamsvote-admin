import { supabase, getDashboardStats, getOrders, getProducts } from './supabase.js'

let chart = null

// ============================================
// INIT
// ============================================
async function init() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }

    loadStats()
    renderChart()
    renderTopProducts()
}

// ============================================
// LOAD STATS
// ============================================
async function loadStats() {
    const stats = await getDashboardStats()
    
    document.getElementById('stat-revenue-usd').textContent = `$${stats.revenueUSD.toLocaleString(undefined, {minimumFractionDigits: 2})}`
    document.getElementById('stat-revenue-idr').textContent = `Rp ${stats.revenueIDR.toLocaleString()}`
    document.getElementById('stat-orders').textContent      = stats.totalOrders.toLocaleString()
    document.getElementById('stat-customers').textContent   = stats.totalCustomers.toLocaleString()
}

// ============================================
// RENDER CHART
// ============================================
async function renderChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d')
    const orders = await getOrders()
    
    // Group by day (last 7 days by default)
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
    }).reverse()

    const dataUSD = last7Days.map(date => {
        return orders
            .filter(o => o.created_at.startsWith(date) && (o.currency === 'USD' || o.currency === '$') && o.status === 'completed')
            .reduce((sum, o) => sum + parseFloat(o.total), 0)
    })

    if (chart) chart.destroy()

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })),
            datasets: [{
                label: 'Revenue (USD)',
                data: dataUSD,
                borderColor: '#8A2A2B',
                backgroundColor: 'rgba(138, 42, 43, 0.05)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8A2A2B',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1E293B',
                    titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                    bodyFont: { family: 'Inter', size: 12 },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => `$${ctx.parsed.y.toLocaleString()}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 10, weight: '600' }, color: '#64748B' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#E2E8F0', drawBorder: false },
                    ticks: { 
                        font: { family: 'Inter', size: 10, weight: '600' }, 
                        color: '#64748B',
                        callback: (v) => '$' + v.toLocaleString()
                    }
                }
            }
        }
    })
}

// ============================================
// TOP PRODUCTS
// ============================================
async function renderTopProducts() {
    const container = document.getElementById('top-products-list')
    const products = await getProducts()
    
    // Sort by sold count
    const top = products.sort((a,b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4)
    
    if (!top.length) {
        container.innerHTML = `<div class="text-center py-6 text-text-muted italic">No sales data yet</div>`
        return
    }

    container.innerHTML = top.map(p => `
        <div class="flex items-center gap-4 group">
            <div class="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center font-bold text-primary text-[10px]">
                ${p.app.substring(0,2)}
            </div>
            <div class="flex-1">
                <h4 class="text-sm font-bold text-text-main truncate">${p.name}</h4>
                <p class="text-[10px] text-text-muted font-bold uppercase tracking-wider">${p.app} • ${p.type}</p>
            </div>
            <div class="text-right">
                <p class="text-sm font-bold text-text-main">${(p.sold || 0).toLocaleString()}</p>
                <p class="text-[9px] text-text-muted font-bold uppercase">Sold</p>
            </div>
        </div>
    `).join('')
}

document.addEventListener('DOMContentLoaded', init)
