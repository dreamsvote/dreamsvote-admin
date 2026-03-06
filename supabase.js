// ================================================
// SUPABASE CONNECTION
// DreamsVote Admin Panel
// ================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://cirrufadyvsrswjfvabr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_bIPdZ3HTIl6tqeOhUBGQtA_aP6mlmiY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ================================================
// PRODUCTS
// ================================================

export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true })
    if (error) console.error('getProducts error:', error)
    return data || []
}

export async function createProduct(product) {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()
    if (error) console.error('createProduct error:', error)
    return data
}

export async function updateProduct(id, updates) {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) console.error('updateProduct error:', error)
    return data
}

export async function deleteProduct(id) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
    if (error) console.error('deleteProduct error:', error)
    return !error
}

// ================================================
// VOUCHERS
// ================================================

export async function getVouchers() {
    const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('id', { ascending: true })
    if (error) console.error('getVouchers error:', error)
    return data || []
}

export async function createVoucher(voucher) {
    const { data, error } = await supabase
        .from('vouchers')
        .insert([voucher])
        .select()
        .single()
    if (error) console.error('createVoucher error:', error)
    return data
}

export async function deleteVoucher(id) {
    const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id)
    if (error) console.error('deleteVoucher error:', error)
    return !error
}

// ================================================
// ORDERS
// ================================================

export async function getOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                product_name,
                product_app,
                quantity,
                price,
                subtotal
            )
        `)
        .order('created_at', { ascending: false })
    if (error) console.error('getOrders error:', error)
    return data || []
}

export async function updateOrderStatus(id, status) {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
    if (error) console.error('updateOrderStatus error:', error)
    return data
}

// ================================================
// CUSTOMERS
// ================================================

export async function getCustomers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
    if (error) console.error('getCustomers error:', error)
    return data || []
}

// ================================================
// PAYMENT ACCOUNTS
// ================================================

export async function getPaymentAccounts() {
    const { data, error } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('is_active', true)
    if (error) console.error('getPaymentAccounts error:', error)
    return data || []
}

// ================================================
// DASHBOARD STATS
// ================================================

export async function getDashboardStats() {
    const [ordersRes, usersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('total, status, created_at'),
        supabase.from('users').select('id, created_at').eq('role', 'customer'),
        supabase.from('products').select('sold')
    ])

    const orders   = ordersRes.data   || []
    const users    = usersRes.data    || []
    const products = productsRes.data || []

    const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)

    const totalOrders    = orders.length
    const totalCustomers = users.length
    const totalVotesSold = products.reduce((sum, p) => sum + (p.sold || 0), 0)

    return { totalRevenue, totalOrders, totalCustomers, totalVotesSold }
}

// ================================================
// AUTH STATE LISTENER
// ================================================

supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event)
    
    if (event === 'SIGNED_OUT') {
        // Pastikan redirect ke login kalau sign out
        const currentPage = window.location.pathname.split('/').pop()
        if (currentPage !== 'login.html' && currentPage !== '') {
            window.location.replace('login.html')
        }
    }
    
    if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
    }
})


// ================================================
// ORDERS
// ================================================

export async function createOrder(orderData) {
    const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()
    if (error) console.error('createOrder error:', error)
    return data
}
