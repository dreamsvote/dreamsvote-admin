import { supabase } from './supabase.js'

async function handleLogin(e) {
    e.preventDefault()

    const email    = document.getElementById('username').value
    const password = document.getElementById('password').value
    const btn      = document.querySelector('button[type="submit"]')

    btn.disabled = true
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Signing in...'

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        showToast('Email atau password salah!')
        btn.disabled = false
        btn.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right ml-2"></i>'
        return
    }

    sessionStorage.setItem('dreamsvote_session', data.session.access_token)
    window.location.href = 'dashboard.html'
}

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

function showToast(message) {
    const toast = document.getElementById('toast')
    document.getElementById('toast-message').textContent = message
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}

async function checkExistingSession() {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
        window.location.href = 'dashboard.html'
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession()
    document.getElementById('login-form').addEventListener('submit', handleLogin)
})

window.togglePassword = togglePassword
