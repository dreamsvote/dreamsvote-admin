import { supabase } from './supabase.js'

// ============================================
// AUTH CHECK - Redirect ke login kalau tidak ada session
// ============================================
async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    
    if (!data.session) {
        // Cek apakah ada remember me
        const rememberMe = localStorage.getItem('dreamsvote_remember')
        
        if (!rememberMe) {
            // Tidak ada session dan tidak ada remember me → redirect
            window.location.replace('login.html')
            return false
        }
        
        // Ada remember me tapi session expired, coba refresh
        // Supabase seharusnya handle ini otomatis, tapi kalau gagal tetap redirect
        const { data: refreshData } = await supabase.auth.refreshSession()
        if (!refreshData.session) {
            window.location.replace('login.html')
            return false
        }
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
        // Hapus class tambahan yang tidak perlu
        navEl.classList.remove('text-gray-300')
    }
}

// ============================================
// LOGOUT - Bersih semua data
// ============================================
window.logout = async function() {
    // Sign out dari Supabase
    await supabase.auth.signOut()
    
    // Hapus semua local storage
    localStorage.removeItem('dreamsvote_remember')
    localStorage.removeItem('sb-cirrufadyvsrswjfvabr-auth-token') // Supabase auth token
    
    // Hapus session storage
    sessionStorage.clear()
    
    // Redirect ke login
    window.location.replace('login.html')
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu')
    if (menu) menu.classList.toggle('hidden')
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
    
    // Set icon based on type
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark text-red-400 text-xl'
    } else {
        icon.className = 'fa-solid fa-check-circle text-primary text-xl'
    }
    
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split('/').pop().replace('.html', '')
    
    // Skip auth check untuk login page
    if (page === 'login' || page === '' || page === 'index') {
        highlightActiveNav()
        return
    }
    
    // Check auth untuk page lain
    const isAuth = await checkAuth()
    if (!isAuth) return
    
    // Highlight nav aktif
    highlightActiveNav()
})

// Export untuk module
export { checkAuth, highlightActiveNav }
