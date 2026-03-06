function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (username === 'admin' && password === 'admin123') {
        // Simpan data jika Remember Me dicentang
        if (rememberMe) {
            localStorage.setItem('dreamsvote_remember', JSON.stringify({
                username: username,
                timestamp: new Date().getTime()
            }));
        } else {
            localStorage.removeItem('dreamsvote_remember');
        }
        
        // Simpan session login
        sessionStorage.setItem('dreamsvote_session', 'active');
        
        window.location.href = 'dashboard.html';
    } else {
        showToast('Invalid credentials!');
    }
}

function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

// Cek remember me saat halaman dimuat - redirect langsung ke dashboard
window.addEventListener('DOMContentLoaded', function() {
    const saved = localStorage.getItem('dreamsvote_remember');
    
    if (saved) {
        const data = JSON.parse(saved);
        // Cek apakah data masih valid (30 hari)
        const daysPassed = (new Date().getTime() - data.timestamp) / (1000 * 60 * 60 * 24);
        
        if (daysPassed < 30) {
            // Auto login ke dashboard
            sessionStorage.setItem('dreamsvote_session', 'active');
            window.location.href = 'dashboard.html';
            return; // Stop eksekusi
        } else {
            // Hapus data expired
            localStorage.removeItem('dreamsvote_remember');
        }
    }
    
    // Jika tidak ada remember me, cek session biasa
    if (sessionStorage.getItem('dreamsvote_session') === 'active') {
        window.location.href = 'dashboard.html';
    }
});
