import { supabase } from './supabase.js'

async function init() {
    // Redirect if already logged in
    const { data } = await supabase.auth.getSession()
    if (data.session) {
        window.location.replace('dashboard.html')
    }
}

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const remember = document.getElementById('remember').checked
    
    const btn = document.getElementById('login-btn')
    btn.disabled = true
    btn.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Signing in...</span>
    `

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })

    if (error) {
        alert('Login failed: ' + error.message)
        btn.disabled = false
        btn.innerHTML = '<span>Sign In to Console</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>'
        if (window.lucide) lucide.createIcons()
    } else {
        if (remember) {
            localStorage.setItem('dreamsvote_remember', 'true')
        }
        window.location.replace('dashboard.html')
    }
}

document.addEventListener('DOMContentLoaded', init)
