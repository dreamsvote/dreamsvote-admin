import { supabase } from './supabase.js'

// ============================================
// CHECK EXISTING SESSION
// ============================================
async function checkExistingSession() {
    const { data } = await supabase.auth.getSession()
    
    // Kalau ada session aktif, langsung ke dashboard
    if (data.session) {
        window.location.replace('dashboard.html')
        return
    }
    
    // Kalau ada remember me tapi session expired, tetap di login page
    // (Supabase handle session refresh otomatis)
}

// ============================================
// HANDLE LOGIN
// ============================================
async function handleLogin(e) {
    e.preventDefault()

    const email      = document.getElementById('username').value
    const password   = document.getElementById('password').value
    const rememberMe = document.getElementById('remember-me').checked
    const btn        = document.querySelector('button[type="submit"]')

    btn.disabled = true
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Signing in...'

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        showToast('Email atau password salah!')
        btn.disabled = false
        btn.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right ml-2"></i>'
        return
    }

    // Simpan remember me preference
    if (rememberMe) {
        localStorage.setItem('dreamsvote_remember', 'true')
        // Set session persistence to local (survive browser restart)
        await supabase.auth.setSession(data.session)
    } else {
        localStorage.removeItem('dreamsvote_remember')
        // Session only for current tab
    }

    window.location.replace('dashboard.html')
}

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================
function togglePassword() {
    const input = document.getElementById('password')
    const icon  = document.getElementById('eye-icon')
    if (input.type === 'password') {
        input.type = 'text'
        icon.classList.replace('fa-eye', 'fa-eye-slash')
    } else {
        input.type = 'password'
        icon.classList.replace('fa-eye-slash', 'fa-eye')
    }
}

// ============================================
// SHOW TOAST
// ============================================
function showToast(message) {
    const toast = document.getElementById('toast')
    document.getElementById('toast-message').textContent = message
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession()
    document.getElementById('login-form').addEventListener('submit', handleLogin)
})

// Export untuk global access
window.togglePassword = togglePassword
