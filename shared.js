import { supabase } from './supabase.js'

// ============================================
// AUTH CHECK
// ============================================
window.checkAuth = async function() {
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
window.highlightActiveNav = function() {
    const page = window.location.pathname.split('/').pop().replace('.html', '')
    const id = page === 'dashboard' || page === '' ? 'nav-dashboard' : 'nav-' + page
    const navEl = document.getElementById(id)
    if (navEl) {
        navEl.classList.add('active')
    }
}

// ============================================
// LOGOUT
// ============================================
window.logout = async function() {
    await supabase.auth.signOut()
    localStorage.removeItem('dreamsvote_remember')
    window.location.replace('login.html')
}

// ============================================
// SHOW TOAST
// ============================================
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast')
    const toastMessage = document.getElementById('toast-message')
    if (!toast || !toastMessage) return
    
    toastMessage.textContent = message
    
    toast.classList.remove('translate-y-20', 'opacity-0')
    toast.classList.add('translate-y-0', 'opacity-100')
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0')
        toast.classList.remove('translate-y-0', 'opacity-100')
    }, 3000)
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split('/').pop().replace('.html', '')
    if (page === 'login' || page === '' || page === 'index') return
    
    const isAuth = await window.checkAuth()
    if (isAuth) {
        window.highlightActiveNav()
    }
})
