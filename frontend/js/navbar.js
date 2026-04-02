// Inject navbar into any page
(function() {
  var isAdmin = window.location.pathname.includes('/admin/');
  var base = isAdmin ? '../' : '';

  var navHTML =
    '<nav class="navbar">' +
    '<div class="nav-container">' +
    '<a href="' + base + 'index.html" class="nav-logo">🛍 SHOP</a>' +
    '<button class="hamburger" id="hamburger" aria-label="Menu">☰</button>' +
    '<ul class="nav-links" id="nav-links">' +
    '<li><a href="' + base + 'index.html" data-i18n="nav.home">Bosh sahifa</a></li>' +
    '<li><a href="' + base + 'shop.html" data-i18n="nav.shop">Do\'kon</a></li>' +
    '<li><a href="' + base + 'news.html" data-i18n="nav.news">Yangiliklar</a></li>' +
    '<li><a href="' + base + 'discounts.html" data-i18n="nav.discounts">Chegirmalar</a></li>' +
    '<li><a href="' + base + 'cart.html" style="position:relative;display:flex;align-items:center;gap:4px">' +
    '<span data-i18n="nav.cart">Savat</span>' +
    '<span class="cart-badge" id="cart-badge" style="display:none">0</span>' +
    '</a></li>' +
    '<li><a href="' + base + 'profile.html" id="nav-profile" class="hidden"></a></li>' +
    '<li><a href="' + base + 'login.html" id="nav-login" data-i18n="nav.login">Kirish</a></li>' +
    '<li><a href="' + base + 'register.html" id="nav-register" data-i18n="nav.register">Ro\'yxatdan o\'tish</a></li>' +
    '<li><a href="' + base + 'admin/index.html" id="nav-admin" class="hidden" data-i18n="nav.admin">Admin</a></li>' +
    '<li><button id="nav-logout" class="btn btn-sm btn-secondary hidden" data-i18n="nav.logout">Chiqish</button></li>' +
    '</ul>' +
    '<div class="nav-actions">' +
    '<div class="lang-switcher">' +
    '<button class="lang-btn" data-lang="uz">🇺🇿 UZ</button>' +
    '<button class="lang-btn" data-lang="ru">🇷🇺 RU</button>' +
    '<button class="lang-btn" data-lang="en">🇬🇧 EN</button>' +
    '</div>' +
    '<button class="theme-toggle" id="theme-toggle" title="Toggle theme">🌙</button>' +
    '</div>' +
    '</div>' +
    '</nav>';

  var placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) placeholder.innerHTML = navHTML;

  // Highlight active link
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    var href = (a.getAttribute('href') || '').split('/').pop();
    if (href === path) a.classList.add('active');
  });

  // Hamburger toggle
  document.addEventListener('click', function(e) {
    if (e.target.id === 'hamburger' || e.target.closest('#hamburger')) {
      var links = document.getElementById('nav-links');
      if (links) links.classList.toggle('open');
    }
    // Close menu on link click (mobile)
    if (e.target.closest('.nav-links a')) {
      var links = document.getElementById('nav-links');
      if (links) links.classList.remove('open');
    }
  });

  // Theme toggle
  document.addEventListener('click', function(e) {
    if (e.target.id === 'theme-toggle') Theme.toggle();
  });

  // Language buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('lang-btn')) {
      I18N.load(e.target.dataset.lang).then(function() {
        // Re-render add to cart buttons after lang change
        document.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
          btn.textContent = I18N.t('shop.add_to_cart');
        });
      });
    }
  });
})();
