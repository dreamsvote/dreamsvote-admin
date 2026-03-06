import { supabase } from './supabase.js'

// Highlight active nav
document.addEventListener('DOMContentLoaded', async () => {
    // Cek session
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.href = 'login.html'
        return
    }

    // Highlight nav aktif
    const page = window.location.pathname.split('/').pop().replace('.html', '')
    const navEl = document.getElementById('nav-' + page)
    if (navEl) navEl.classList.add('active')
})

window.logout = async function() {
    await supabase.auth.signOut()
    sessionStorage.removeItem('dreamsvote_session')
    window.location.href = 'login.html'
}

window.toggleMobileMenu = function() {
    document.getElementById('mobile-menu').classList.toggle('hidden')
}

window.showToast = function(message) {
    const toast = document.getElementById('toast')
    document.getElementById('toast-message').textContent = message
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}
