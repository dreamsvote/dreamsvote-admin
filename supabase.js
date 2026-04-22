// ================================================
// SUPABASE CONNECTION
// DreamsVote Admin Panel
// ================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// GANTI DENGAN KREDENSIAL ASLI KAMU
const SUPABASE_URL = 'https://cirrufadyvsrswjfvabr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcnJ1ZmFkeXZzcnN3amZ2YWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODI1NzEsImV4cCI6MjA4ODM1ODU3MX0.ZUdsx-I6vzVCMbN7KUiXtNb7pELBp1_BUwxBERMl3-Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ================================================
// PRODUCTS
// ================================================
export async function getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true })
    if (error) console.error('getProducts error:', error)
    return data || []
}

export async function createProduct(product) {
    const { data, error } = await supabase.from('products').insert([product]).select().single()
    if (error) console.error('createProduct error:', error)
    return data
}

export async function updateProduct(id, updates) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
    if (error) console.error('updateProduct error:', error)
    return data
}

export async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    return !error
}

// ================================================
// VOUCHERS
// ================================================
export async function getVouchers() {
    const { data, error } = await supabase.from('vouchers').select('*').order('id', { ascending: true })
    return data || []
}

export async function createVoucher(voucher) {
    const { data, error } = await supabase.from('vouchers').insert([voucher]).select().single()
    return data
}

export async function deleteVoucher(id) {
    const { error } = await supabase.from('vouchers').delete().eq('id', id)
    return !error
}

// ================================================
// ORDERS
// ================================================
export async function getOrders() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    return data || []
}

export async function updateOrderStatus(id, status) {
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
    return data
}

// ================================================
// CUSTOMERS
// ================================================
export async function getCustomers() {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'customer').order('created_at', { ascending: false })
    return data || []
}

// ================================================
// DASHBOARD STATS
// ================================================
export async function getDashboardStats() {
    const [ordersRes, usersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('total, currency, status'),
        supabase.from('users').select('id').eq('role', 'customer'),
        supabase.from('products').select('sold')
    ])

    const orders = ordersRes.data || []
    const revenueUSD = orders.filter(o => o.status === 'completed' && (o.currency === 'USD' || o.currency === '$')).reduce((sum, o) => sum + parseFloat(o.total), 0)
    const revenueIDR = orders.filter(o => o.status === 'completed' && (o.currency === 'IDR' || o.currency === 'Rp')).reduce((sum, o) => sum + parseFloat(o.total), 0)

    return {
        revenueUSD,
        revenueIDR,
        totalOrders: orders.length,
        totalCustomers: (usersRes.data || []).length,
        totalVotesSold: (productsRes.data || []).reduce((sum, p) => sum + (p.sold || 0), 0)
    }
}
