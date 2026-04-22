import { supabase } from './supabase.js'

// ============================================
// CHECK EXISTING SESSION - Hanya kalau remember me
// ============================================
async function checkExistingSession() {
    const rememberMe = localStorage.getItem('dreamsvote_remember')
    
    // Kalau tidak ada remember me, tetap di login page
    if (!rememberMe) {
        return
    }
    
    // Kalau remember me ada, cek session
    const { data } = await supabase.auth.getSession()
    
    if (data.session) {
        window.location.replace('dashboard.html')
    }
    // Kalau session expired tapi remember me ada, biarkan di login page
    // User harus login ulang
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
    } else {
        localStorage.removeItem('dreamsvote_remember')
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
