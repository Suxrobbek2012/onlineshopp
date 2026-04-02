// i18n — Internationalization
var I18N = {
  current: localStorage.getItem('lang') || 'uz',
  translations: {},

  load: async function(lang) {
    if (!this.translations[lang]) {
      try {
        // relative path - works with any static server
        var base = window.location.pathname.includes('/admin/') ? '../' : '';
        var res = await fetch(base + 'i18n/' + lang + '.json');
        this.translations[lang] = await res.json();
      } catch(e) {
        console.warn('i18n load error:', e);
        this.translations[lang] = {};
      }
    }
    this.current = lang;
    localStorage.setItem('lang', lang);
    this.apply();
  },

  t: function(key) {
    var keys = key.split('.');
    var val = this.translations[this.current];
    for (var i = 0; i < keys.length; i++) {
      if (!val) return key;
      val = val[keys[i]];
    }
    return val || key;
  },

  apply: function() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var text = I18N.t(key);
      if (text !== key) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var text = I18N.t(el.getAttribute('data-i18n-placeholder'));
      if (text) el.placeholder = text;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      var text = I18N.t(el.getAttribute('data-i18n-title'));
      if (text) el.title = text;
    });
    // Update active lang button
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.lang === I18N.current);
    });
    // Update html lang attribute
    document.documentElement.lang = I18N.current;
  },

  init: async function() {
    await this.load(this.current);
  }
};

window.I18N = I18N;
