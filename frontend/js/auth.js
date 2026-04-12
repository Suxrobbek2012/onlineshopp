// Auth state management
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  isLoggedIn: () => !!localStorage.getItem('token'),
  isAdmin: () => { const u = Auth.getUser(); return u && u.role === 'admin'; },

  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Update navbar based on auth state
  updateNavbar() {
    const user = Auth.getUser();
    const loginLink = document.getElementById('nav-login');
    const registerLink = document.getElementById('nav-register');
    const profileLink = document.getElementById('nav-profile');
    const logoutBtn = document.getElementById('nav-logout');
    const adminLink = document.getElementById('nav-admin');
    const cartBadge = document.getElementById('cart-badge');

    if (Auth.isLoggedIn() && user) {
      if (loginLink) loginLink.classList.add('hidden');
      if (registerLink) registerLink.classList.add('hidden');
      if (profileLink) { profileLink.classList.remove('hidden'); profileLink.textContent = user.fullName || user.username; }
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      if (adminLink) adminLink.classList.toggle('hidden', user.role !== 'admin');
    } else {
      if (loginLink) loginLink.classList.remove('hidden');
      if (registerLink) registerLink.classList.remove('hidden');
      if (profileLink) profileLink.classList.add('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (adminLink) adminLink.classList.add('hidden');
    }
  },

  requireAuth() {
    if (!Auth.isLoggedIn()) {
      var base = window.location.pathname.includes('/admin/') ? '../' : '';
      window.location.href = base + 'login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
      var base = window.location.pathname.includes('/admin/') ? '../' : '';
      window.location.href = base + 'login.html';
      return false;
    }
    // Server-side verify
    api.get('/auth/me').then(function(data) {
      if (!data.user || data.user.role !== 'admin') {
        Auth.clearSession();
        var base = window.location.pathname.includes('/admin/') ? '../' : '';
        window.location.href = base + 'login.html';
      }
    }).catch(function() {
      Auth.clearSession();
      var base = window.location.pathname.includes('/admin/') ? '../' : '';
      window.location.href = base + 'login.html';
    });
    return true;
  }
};

// Logout handler
document.addEventListener('click', (e) => {
  if (e.target.id === 'nav-logout' || e.target.closest('#nav-logout')) {
    Auth.clearSession();
    var base = window.location.pathname.includes('/admin/') ? '../' : '';
    window.location.href = base + 'index.html';
  }
});

window.Auth = Auth;
