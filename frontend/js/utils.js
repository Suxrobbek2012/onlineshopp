// ===== Toast notifications =====
var Toast = {
  container: null,
  init: function() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show: function(message, type, duration) {
    type = type || 'info';
    duration = duration || 3500;
    this.init();
    var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
    this.container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(110%)';
      toast.style.transition = '0.3s ease';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 320);
    }, duration);
  },
  success: function(msg) { Toast.show(msg, 'success'); },
  error:   function(msg) { Toast.show(msg, 'error'); },
  warning: function(msg) { Toast.show(msg, 'warning'); },
  info:    function(msg) { Toast.show(msg, 'info'); }
};

// ===== Modal =====
var Modal = {
  open: function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close: function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeAll: function() {
    document.querySelectorAll('.modal-overlay').forEach(function(m) {
      m.classList.remove('open');
    });
  }
};
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
  if (e.target.classList.contains('modal-close')) Modal.closeAll();
});

// ===== Theme =====
var Theme = {
  init: function() {
    var saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateIcon(saved);
  },
  toggle: function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateIcon(next);
  },
  updateIcon: function(theme) {
    document.querySelectorAll('#theme-toggle').forEach(function(btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  }
};

// ===== Cart badge =====
var CartUI = {
  updateBadge: async function() {
    if (!Auth.isLoggedIn()) return;
    try {
      var data = await api.get('/cart');
      var count = (data.cart && data.cart.items)
        ? data.cart.items.reduce(function(s, i) { return s + i.quantity; }, 0)
        : 0;
      document.querySelectorAll('#cart-badge').forEach(function(badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
    } catch(e) {}
  }
};

// ===== Stars =====
function renderStars(rating) {
  var full = Math.floor(rating);
  var half = (rating % 1) >= 0.5;
  var stars = '';
  for (var i = 0; i < 5; i++) {
    if (i < full) stars += '<span class="star">★</span>';
    else if (i === full && half) stars += '<span class="star" style="opacity:0.6">★</span>';
    else stars += '<span style="color:var(--border)">★</span>';
  }
  return stars;
}

// ===== Product Card =====
// Image base URL — api.js dan olinadi
var IMG_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
  ? 'http://localhost:5000'
  : '';

function renderProductCard(product, favorites) {
  favorites = favorites || [];
  var isFav = favorites.indexOf(product._id) !== -1;
  var finalPrice = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price.toFixed(2);

  var imgSrc = null;
  if (product.image) {
    if (product.image.startsWith('http')) {
      imgSrc = product.image;
    } else {
      imgSrc = IMG_BASE + product.image;
    }
  }

  var addToCartText = (window.I18N && I18N.t('shop.add_to_cart') !== 'shop.add_to_cart')
    ? I18N.t('shop.add_to_cart') : 'Add to Cart';

  return '<div class="card product-card" data-id="' + product._id + '">' +
    '<div class="product-badges">' +
    (product.isOnSale && product.discount > 0 ? '<span class="badge badge-sale">-' + product.discount + '%</span>' : '') +
    (product.isFeatured ? '<span class="badge badge-featured">⭐</span>' : '') +
    '</div>' +
    (imgSrc
      ? '<img class="product-img" src="' + imgSrc + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="product-img-placeholder" style="display:none">🛍️</div>'
      : '<div class="product-img-placeholder">🛍️</div>') +
    '<div class="product-body">' +
    '<div class="product-name" title="' + product.name + '">' + product.name + '</div>' +
    '<div style="margin-bottom:0.4rem;font-size:0.8rem">' +
      renderStars(product.rating) +
      ' <span style="color:var(--text-muted)">(' + product.reviewCount + ')</span>' +
    '</div>' +
    '<div class="product-price">' +
      '<span class="price-final">$' + finalPrice + '</span>' +
      (product.discount > 0 ? '<span class="price-original">$' + product.price.toFixed(2) + '</span>' : '') +
    '</div>' +
    '<div class="product-actions">' +
      '<button class="btn btn-primary btn-sm add-to-cart-btn" data-id="' + product._id + '">' + addToCartText + '</button>' +
      '<button class="fav-btn ' + (isFav ? 'active' : '') + '" data-id="' + product._id + '" title="Favorite">' +
        (isFav ? '❤️' : '🤍') +
      '</button>' +
    '</div>' +
    '</div></div>';
}

// ===== Countdown =====
function startCountdown(endDate, el) {
  var update = function() {
    var diff = new Date(endDate) - new Date();
    if (diff <= 0) { el.textContent = 'Tugadi'; return; }
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.textContent =
      String(h).padStart(2, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0');
  };
  update();
  return setInterval(update, 1000);
}

// ===== Country codes =====
var COUNTRY_CODES = [
  {code:'+998',flag:'🇺🇿',name:'UZ — O\'zbekiston'},
  {code:'+7',  flag:'🇷🇺',name:'RU — Rossiya'},
  {code:'+1',  flag:'🇺🇸',name:'US — Amerika'},
  {code:'+44', flag:'🇬🇧',name:'GB — Britaniya'},
  {code:'+49', flag:'🇩🇪',name:'DE — Germaniya'},
  {code:'+33', flag:'🇫🇷',name:'FR — Fransiya'},
  {code:'+86', flag:'🇨🇳',name:'CN — Xitoy'},
  {code:'+81', flag:'🇯🇵',name:'JP — Yaponiya'},
  {code:'+82', flag:'🇰🇷',name:'KR — Koreya'},
  {code:'+91', flag:'🇮🇳',name:'IN — Hindiston'},
  {code:'+55', flag:'🇧🇷',name:'BR — Braziliya'},
  {code:'+52', flag:'🇲🇽',name:'MX — Meksika'},
  {code:'+34', flag:'🇪🇸',name:'ES — Ispaniya'},
  {code:'+39', flag:'🇮🇹',name:'IT — Italiya'},
  {code:'+90', flag:'🇹🇷',name:'TR — Turkiya'},
  {code:'+966',flag:'🇸🇦',name:'SA — Saudiya'},
  {code:'+971',flag:'🇦🇪',name:'AE — BAA'},
  {code:'+92', flag:'🇵🇰',name:'PK — Pokiston'},
  {code:'+994',flag:'🇦🇿',name:'AZ — Ozarbayjon'},
  {code:'+995',flag:'🇬🇪',name:'GE — Gruziya'},
  {code:'+374',flag:'🇦🇲',name:'AM — Armaniston'},
  {code:'+996',flag:'🇰🇬',name:'KG — Qirg\'iziston'},
  {code:'+992',flag:'🇹🇯',name:'TJ — Tojikiston'},
  {code:'+993',flag:'🇹🇲',name:'TM — Turkmaniston'},
  {code:'+375',flag:'🇧🇾',name:'BY — Belarus'},
  {code:'+380',flag:'🇺🇦',name:'UA — Ukraina'},
  {code:'+48', flag:'🇵🇱',name:'PL — Polsha'},
  {code:'+31', flag:'🇳🇱',name:'NL — Niderlandiya'},
  {code:'+46', flag:'🇸🇪',name:'SE — Shvetsiya'},
  {code:'+47', flag:'🇳🇴',name:'NO — Norvegiya'},
  {code:'+45', flag:'🇩🇰',name:'DK — Daniya'},
  {code:'+358',flag:'🇫🇮',name:'FI — Finlandiya'},
  {code:'+41', flag:'🇨🇭',name:'CH — Shveytsariya'},
  {code:'+43', flag:'🇦🇹',name:'AT — Avstriya'},
  {code:'+61', flag:'🇦🇺',name:'AU — Avstraliya'},
  {code:'+64', flag:'🇳🇿',name:'NZ — Yangi Zelandiya'},
  {code:'+54', flag:'🇦🇷',name:'AR — Argentina'},
  {code:'+56', flag:'🇨🇱',name:'CL — Chili'},
  {code:'+57', flag:'🇨🇴',name:'CO — Kolumbiya'},
  {code:'+62', flag:'🇮🇩',name:'ID — Indoneziya'},
  {code:'+63', flag:'🇵🇭',name:'PH — Filippin'},
  {code:'+84', flag:'🇻🇳',name:'VN — Vyetnam'},
  {code:'+66', flag:'🇹🇭',name:'TH — Tailand'},
  {code:'+20', flag:'🇪🇬',name:'EG — Misr'},
  {code:'+234',flag:'🇳🇬',name:'NG — Nigeriya'},
  {code:'+27', flag:'🇿🇦',name:'ZA — Janubiy Afrika'}
];

function buildCountrySelect(selectEl, defaultCode) {
  defaultCode = defaultCode || '+998';
  selectEl.innerHTML = COUNTRY_CODES.map(function(c) {
    return '<option value="' + c.code + '"' + (c.code === defaultCode ? ' selected' : '') + '>' +
      c.flag + ' ' + c.code + ' ' + c.name + '</option>';
  }).join('');
}

// ===== Exports =====
window.Toast = Toast;
window.Modal = Modal;
window.Theme = Theme;
window.CartUI = CartUI;
window.renderStars = renderStars;
window.renderProductCard = renderProductCard;
window.startCountdown = startCountdown;
window.COUNTRY_CODES = COUNTRY_CODES;
window.buildCountrySelect = buildCountrySelect;

// ===== Product Detail Modal =====
var ProductModal = {
  el: null,

  init: function() {
    if (document.getElementById('product-detail-modal')) return;
    var html =
      '<div class="product-modal-overlay" id="product-detail-modal">' +
        '<div class="product-modal" id="product-modal-inner">' +
          '<button class="product-modal-close" id="product-modal-close">✕</button>' +
          '<div id="product-modal-img-wrap"></div>' +
          '<div class="product-modal-body">' +
            '<span class="product-modal-category" id="pm-category"></span>' +
            '<div class="product-modal-name" id="pm-name"></div>' +
            '<div class="product-modal-rating" id="pm-rating"></div>' +
            '<div class="product-modal-price" id="pm-price"></div>' +
            '<div class="product-modal-desc" id="pm-desc"></div>' +
            '<div class="product-modal-stock" id="pm-stock"></div>' +
            '<div class="product-modal-qty">' +
              '<label>Miqdor:</label>' +
              '<div class="qty-input-wrap">' +
                '<button id="pm-qty-minus">−</button>' +
                '<input type="number" id="pm-qty" value="1" min="1" max="99">' +
                '<button id="pm-qty-plus">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="product-modal-actions">' +
              '<button class="btn btn-primary" id="pm-add-cart">🛒 Savatga qo\'shish</button>' +
              '<button class="btn btn-ghost" id="pm-fav">🤍</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    this.el = document.getElementById('product-detail-modal');

    // Close handlers
    document.getElementById('product-modal-close').addEventListener('click', function() {
      ProductModal.close();
    });
    this.el.addEventListener('click', function(e) {
      if (e.target === ProductModal.el) ProductModal.close();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') ProductModal.close();
    });

    // Qty controls
    document.getElementById('pm-qty-minus').addEventListener('click', function() {
      var inp = document.getElementById('pm-qty');
      if (parseInt(inp.value) > 1) inp.value = parseInt(inp.value) - 1;
    });
    document.getElementById('pm-qty-plus').addEventListener('click', function() {
      var inp = document.getElementById('pm-qty');
      if (parseInt(inp.value) < 99) inp.value = parseInt(inp.value) + 1;
    });
  },

  open: async function(productId) {
    this.init();
    try {
      var data = await api.get('/products/' + productId);
      var p = data.product;
      var IMG_BASE = window.IMG_SERVER || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '');
      var imgSrc = p.image ? (p.image.startsWith('http') ? p.image : IMG_BASE + p.image) : null;
      var finalPrice = p.discount > 0 ? (p.price * (1 - p.discount / 100)).toFixed(2) : p.price.toFixed(2);

      // Image
      document.getElementById('product-modal-img-wrap').innerHTML = imgSrc
        ? '<img class="product-modal-img" src="' + imgSrc + '" alt="' + p.name + '">'
        : '<div class="product-modal-img-ph">🛍️</div>';

      // Info
      document.getElementById('pm-category').textContent = p.category;
      document.getElementById('pm-name').textContent = p.name;
      document.getElementById('pm-rating').innerHTML =
        renderStars(p.rating) + ' <span>(' + p.reviewCount + ' ta sharh)</span>';

      var priceHTML = '<span class="price-final">$' + finalPrice + '</span>';
      if (p.discount > 0) {
        priceHTML += '<span class="price-original">$' + p.price.toFixed(2) + '</span>';
        priceHTML += '<span class="price-badge">-' + p.discount + '%</span>';
      }
      document.getElementById('pm-price').innerHTML = priceHTML;
      document.getElementById('pm-desc').textContent = p.description || 'Tavsif mavjud emas.';

      var stockEl = document.getElementById('pm-stock');
      if (p.stock > 0) {
        stockEl.textContent = '✅ Mavjud (' + p.stock + ' ta)';
        stockEl.className = 'product-modal-stock in';
      } else {
        stockEl.textContent = '❌ Tugagan';
        stockEl.className = 'product-modal-stock out';
      }

      // Reset qty
      document.getElementById('pm-qty').value = 1;

      // Fav state
      var user = Auth.getUser();
      var favs = user ? (user.favorites || []) : [];
      var isFav = favs.indexOf(p._id) !== -1 || favs.some(function(f) { return (f._id || f) === p._id; });
      var favBtn = document.getElementById('pm-fav');
      favBtn.textContent = isFav ? '❤️' : '🤍';
      favBtn.onclick = async function() {
        if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; return; }
        try {
          await api.post('/users/' + user.id + '/favorites/' + p._id, {});
          isFav = !isFav;
          favBtn.textContent = isFav ? '❤️' : '🤍';
          // Update card fav buttons
          document.querySelectorAll('.fav-btn[data-id="' + p._id + '"]').forEach(function(b) {
            b.classList.toggle('active', isFav);
            b.textContent = isFav ? '❤️' : '🤍';
          });
        } catch(e) { Toast.error(e.message); }
      };

      // Add to cart
      var addBtn = document.getElementById('pm-add-cart');
      addBtn.onclick = async function() {
        if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; return; }
        var qty = parseInt(document.getElementById('pm-qty').value) || 1;
        addBtn.disabled = true;
        try {
          await api.post('/cart', { productId: p._id, quantity: qty });
          Toast.success(qty + ' ta mahsulot savatga qo\'shildi!');
          CartUI.updateBadge();
          addBtn.textContent = '✓ Qo\'shildi';
          setTimeout(function() {
            addBtn.disabled = false;
            addBtn.textContent = '🛒 Savatga qo\'shish';
          }, 1500);
        } catch(e) { Toast.error(e.message); addBtn.disabled = false; }
      };

      // Open
      this.el.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch(e) {
      Toast.error('Mahsulot ma\'lumotlari yuklanmadi');
    }
  },

  close: function() {
    if (this.el) this.el.classList.remove('open');
    document.body.style.overflow = '';
  }
};

window.ProductModal = ProductModal;
