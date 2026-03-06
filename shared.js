// Highlight active nav link based on current page
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    const navEl = document.getElementById('nav-' + page);
    if (navEl) navEl.classList.add('active');
});

function logout() {
    window.location.href = 'login.html';
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}
