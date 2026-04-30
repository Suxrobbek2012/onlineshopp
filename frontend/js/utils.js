// ===== Toast =====
var Toast = {
  container: null,
  init: function() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show: function(msg, type, duration) {
    type = type || 'info'; duration = duration || 3500;
    this.init();
    var icons = { success: '[OK]', error: '[!]', warning: '[!]', info: '[i]' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + (icons[type]||'[i]') + '</span><span>' + msg + '</span>';
    this.container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(110%)';
      toast.style.transition = '0.3s ease';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 320);
    }, duration);
  },
  success: function(m) { Toast.show(m, 'success'); },
  error:   function(m) { Toast.show(m, 'error'); },
  warning: function(m) { Toast.show(m, 'warning'); },
  info:    function(m) { Toast.show(m, 'info'); }
};

// ===== Modal =====
var Modal = {
  open:     function(id) { var e=document.getElementById(id); if(e) e.classList.add('open'); },
  close:    function(id) { var e=document.getElementById(id); if(e) e.classList.remove('open'); },
  closeAll: function() { document.querySelectorAll('.modal-overlay').forEach(function(m){ m.classList.remove('open'); }); }
};
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
  if (e.target.classList.contains('modal-close')) Modal.closeAll();
});

// ===== Theme =====
var Theme = {
  init: function() {
    var s = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', s);
    this.updateIcon(s);
  },
  toggle: function() {
    var c = document.documentElement.getAttribute('data-theme');
    var n = c === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('theme', n);
    this.updateIcon(n);
  },
  updateIcon: function(t) {
    document.querySelectorAll('#theme-toggle').forEach(function(b) {
      b.innerHTML = t === 'dark' ? '&#9728;' : '&#9790;';
    });
  }
};

// ===== Cart badge =====
var CartUI = {
  updateBadge: async function() {
    document.querySelectorAll('#cart-badge').forEach(function(b){ b.textContent='0'; b.style.display='none'; });
    if (!window.Auth || !Auth.isLoggedIn()) return;
    try {
      var data = await api.get('/cart');
      var count = (data.cart && data.cart.items)
        ? data.cart.items.reduce(function(s,i){ return s+i.quantity; }, 0) : 0;
      document.querySelectorAll('#cart-badge').forEach(function(b){
        b.textContent = count;
        b.style.display = count > 0 ? 'flex' : 'none';
      });
    } catch(_) {}
  }
};

// ===== Helpers =====
function escapeHtml(v) {
  return String(v==null?'':v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function renderStars(rating) {
  var full = Math.floor(rating), half = (rating%1)>=0.5, s='';
  for (var i=0;i<5;i++) {
    if (i<full) s+='<span class="star">&#9733;</span>';
    else if (i===full&&half) s+='<span class="star" style="opacity:0.6">&#9733;</span>';
    else s+='<span style="color:var(--border)">&#9733;</span>';
  }
  return s;
}

var IMG_BASE = (window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'||window.location.protocol==='file:')
  ? 'http://localhost:5000' : '';

function getImageUrl(path) {
  if (!path) return '';
  // External URL (http/https)
  if (String(path).startsWith('http')) return path;
  // Base64 data URL
  if (String(path).startsWith('data:')) return path;
  // Local path
  return IMG_BASE + path;
}

function getUserFavoriteIds(user) {
  if (!user||!Array.isArray(user.favorites)) return [];
  return user.favorites.map(function(f){ return f&&typeof f==='object'?(f._id||f.id):f; }).filter(Boolean);
}

// ===== Product Card =====
function renderProductCard(product, favorites) {
  favorites = favorites || [];
  var isFav = favorites.indexOf(product._id) !== -1;
  var finalPrice = product.discount > 0
    ? (product.price*(1-product.discount/100)).toFixed(2)
    : product.price.toFixed(2);
  var imgSrc = product.image ? getImageUrl(product.image) : null;
  var safeName = escapeHtml(product.name);
  var addText = (window.I18N && I18N.t('shop.add_to_cart') !== 'shop.add_to_cart')
    ? I18N.t('shop.add_to_cart') : 'Savatga';

  return '<div class="card product-card" data-id="'+product._id+'">' +
    '<div class="product-badges">' +
      (product.isOnSale&&product.discount>0 ? '<span class="badge badge-sale">-'+product.discount+'%</span>' : '') +
      (product.isFeatured ? '<span class="badge badge-featured">&#9733;</span>' : '') +
    '</div>' +
    (imgSrc
      ? '<img class="product-img" src="'+escapeHtml(imgSrc)+'" alt="'+safeName+'" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="product-img-placeholder" style="display:none">&#128717;</div>'
      : '<div class="product-img-placeholder">&#128717;</div>') +
    '<div class="product-body">' +
      '<div class="product-name" title="'+safeName+'">'+safeName+'</div>' +
      '<div style="margin-bottom:0.4rem;font-size:0.8rem">'+renderStars(product.rating)+
        ' <span style="color:var(--text-muted)">('+product.reviewCount+')</span></div>' +
      '<div class="product-price">' +
        '<span class="price-final">$'+finalPrice+'</span>' +
        (product.discount>0 ? '<span class="price-original">$'+product.price.toFixed(2)+'</span>' : '') +
      '</div>' +
      '<div class="product-actions">' +
        '<button class="btn btn-primary btn-sm add-to-cart-btn" data-id="'+product._id+'">'+escapeHtml(addText)+'</button>' +
        '<button class="fav-btn '+(isFav?'active':'')+'" data-id="'+product._id+'" title="Favorite">' +
          (isFav ? '&#10084;' : '&#9825;') +
        '</button>' +
      '</div>' +
    '</div></div>';
}

// ===== Countdown =====
function startCountdown(endDate, el) {
  var update = function() {
    var diff = new Date(endDate) - new Date();
    if (diff<=0) { el.textContent='Tugadi'; return; }
    var h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
    el.textContent = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  };
  update(); return setInterval(update, 1000);
}

// ===== Country codes =====
var COUNTRY_CODES = [
  {code:'+998',name:'UZ - Ozbekiston'},{code:'+7',name:'RU - Rossiya'},
  {code:'+1',name:'US - Amerika'},{code:'+44',name:'GB - Britaniya'},
  {code:'+49',name:'DE - Germaniya'},{code:'+33',name:'FR - Fransiya'},
  {code:'+86',name:'CN - Xitoy'},{code:'+81',name:'JP - Yaponiya'},
  {code:'+82',name:'KR - Koreya'},{code:'+91',name:'IN - Hindiston'},
  {code:'+55',name:'BR - Braziliya'},{code:'+52',name:'MX - Meksika'},
  {code:'+34',name:'ES - Ispaniya'},{code:'+39',name:'IT - Italiya'},
  {code:'+90',name:'TR - Turkiya'},{code:'+966',name:'SA - Saudiya'},
  {code:'+971',name:'AE - BAA'},{code:'+92',name:'PK - Pokiston'},
  {code:'+994',name:'AZ - Ozarbayjon'},{code:'+995',name:'GE - Gruziya'},
  {code:'+374',name:'AM - Armaniston'},{code:'+996',name:'KG - Qirgiziston'},
  {code:'+992',name:'TJ - Tojikiston'},{code:'+993',name:'TM - Turkmaniston'},
  {code:'+375',name:'BY - Belarus'},{code:'+380',name:'UA - Ukraina'},
  {code:'+48',name:'PL - Polsha'},{code:'+31',name:'NL - Niderlandiya'},
  {code:'+46',name:'SE - Shvetsiya'},{code:'+47',name:'NO - Norvegiya'},
  {code:'+61',name:'AU - Avstraliya'},{code:'+64',name:'NZ - Yangi Zelandiya'}
];

function buildCountrySelect(selectEl, defaultCode) {
  defaultCode = defaultCode || '+998';
  selectEl.innerHTML = COUNTRY_CODES.map(function(c) {
    return '<option value="'+c.code+'"'+(c.code===defaultCode?' selected':'')+'>'+c.code+' '+c.name+'</option>';
  }).join('');
}

// ===== Product Detail Modal =====
var ProductModal = {
  el: null,
  init: function() {
    if (document.getElementById('product-detail-modal')) return;
    var html =
      '<div class="product-modal-overlay" id="product-detail-modal">' +
        '<div class="product-modal">' +
          '<button class="product-modal-close" id="product-modal-close">&#10005;</button>' +
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
                '<button id="pm-qty-minus">&#8722;</button>' +
                '<input type="number" id="pm-qty" value="1" min="1" max="99">' +
                '<button id="pm-qty-plus">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="product-modal-actions">' +
              '<button class="btn btn-primary" id="pm-add-cart">Savatga qo\'shish</button>' +
              '<button class="btn btn-ghost" id="pm-fav">&#9825;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    this.el = document.getElementById('product-detail-modal');
    document.getElementById('product-modal-close').addEventListener('click', function(){ ProductModal.close(); });
    this.el.addEventListener('click', function(e){ if(e.target===ProductModal.el) ProductModal.close(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') ProductModal.close(); });
    document.getElementById('pm-qty-minus').addEventListener('click', function(){
      var i=document.getElementById('pm-qty'); if(parseInt(i.value)>1) i.value=parseInt(i.value)-1;
    });
    document.getElementById('pm-qty-plus').addEventListener('click', function(){
      var i=document.getElementById('pm-qty'); if(parseInt(i.value)<99) i.value=parseInt(i.value)+1;
    });
  },
  open: async function(productId) {
    this.init();
    try {
      var data = await api.get('/products/'+productId);
      var p = data.product;
      var imgSrc = p.image ? getImageUrl(p.image) : null;
      var finalPrice = p.discount>0 ? (p.price*(1-p.discount/100)).toFixed(2) : p.price.toFixed(2);

      document.getElementById('product-modal-img-wrap').innerHTML = imgSrc
        ? '<img class="product-modal-img" src="'+escapeHtml(imgSrc)+'" alt="'+escapeHtml(p.name)+'">'
        : '<div class="product-modal-img-ph">&#128717;</div>';

      document.getElementById('pm-category').textContent = p.category;
      document.getElementById('pm-name').textContent = p.name;
      document.getElementById('pm-rating').innerHTML = renderStars(p.rating)+' <span>('+p.reviewCount+' ta sharh)</span>';

      var priceHTML = '<span class="price-final">$'+finalPrice+'</span>';
      if (p.discount>0) priceHTML += '<span class="price-original">$'+p.price.toFixed(2)+'</span><span class="price-badge">-'+p.discount+'%</span>';
      document.getElementById('pm-price').innerHTML = priceHTML;
      document.getElementById('pm-desc').textContent = p.description || 'Tavsif mavjud emas.';

      var stockEl = document.getElementById('pm-stock');
      if (p.stock>0) { stockEl.textContent='Mavjud ('+p.stock+' ta)'; stockEl.className='product-modal-stock in'; }
      else { stockEl.textContent='Tugagan'; stockEl.className='product-modal-stock out'; }

      document.getElementById('pm-qty').value = 1;

      var user = Auth.getUser();
      var favIds = getUserFavoriteIds(user);
      var isFav = favIds.indexOf(p._id) !== -1;
      var favBtn = document.getElementById('pm-fav');
      favBtn.innerHTML = isFav ? '&#10084;' : '&#9825;';
      favBtn.onclick = async function() {
        if (!Auth.isLoggedIn()) { window.location.href='login.html'; return; }
        try {
          await api.post('/users/'+user.id+'/favorites/'+p._id, {});
          isFav = !isFav;
          favBtn.innerHTML = isFav ? '&#10084;' : '&#9825;';
          document.querySelectorAll('.fav-btn[data-id="'+p._id+'"]').forEach(function(b){
            b.classList.toggle('active', isFav);
            b.innerHTML = isFav ? '&#10084;' : '&#9825;';
          });
        } catch(e) { Toast.error(e.message); }
      };

      var addBtn = document.getElementById('pm-add-cart');
      addBtn.onclick = async function() {
        if (!Auth.isLoggedIn()) { window.location.href='login.html'; return; }
        var qty = parseInt(document.getElementById('pm-qty').value)||1;
        addBtn.disabled = true;
        try {
          await api.post('/cart', { productId: p._id, quantity: qty });
          Toast.success(qty+' ta mahsulot savatga qo\'shildi!');
          CartUI.updateBadge();
          addBtn.textContent = 'Qo\'shildi!';
          setTimeout(function(){ addBtn.disabled=false; addBtn.textContent='Savatga qo\'shish'; }, 1500);
        } catch(e) { Toast.error(e.message); addBtn.disabled=false; }
      };

      this.el.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch(_) { Toast.error('Mahsulot yuklanmadi'); }
  },
  close: function() {
    if (this.el) this.el.classList.remove('open');
    document.body.style.overflow = '';
  }
};

window.Toast = Toast;
window.Modal = Modal;
window.Theme = Theme;
window.CartUI = CartUI;
window.escapeHtml = escapeHtml;
window.getImageUrl = getImageUrl;
window.getUserFavoriteIds = getUserFavoriteIds;
window.renderStars = renderStars;
window.renderProductCard = renderProductCard;
window.startCountdown = startCountdown;
window.COUNTRY_CODES = COUNTRY_CODES;
window.buildCountrySelect = buildCountrySelect;
window.ProductModal = ProductModal;
