const fs = require('fs');
const path = require('path');

const htmlFiles = [
  '../frontend/cart.html',
  '../frontend/index.html', 
  '../frontend/shop.html',
  '../frontend/profile.html',
  '../frontend/login.html',
  '../frontend/register.html',
  '../frontend/news.html',
  '../frontend/discounts.html',
  '../frontend/admin/index.html',
  '../frontend/admin/products.html',
  '../frontend/admin/orders.html',
  '../frontend/admin/users.html',
  '../frontend/admin/news.html',
  '../frontend/admin/coupons.html',
];

const jsFiles = [
  '../frontend/js/utils.js',
  '../frontend/js/navbar.js',
  '../frontend/js/auth.js',
  '../frontend/js/api.js',
  '../frontend/js/i18n.js',
];

function fixContent(content) {
  // Fix all broken multi-byte sequences that appear as Cyrillic garbage
  // These are UTF-8 bytes misread as Windows-1252
  
  // Common broken patterns -> correct HTML entities
  const fixes = [
    // Minus sign (−) broken as в€'
    [/в€['']/g, '&#8722;'],
    [/в€'/g, '&#8722;'],
    // Trash icon broken
    [/рџ—['']/g, '&#128465;'],
    [/рџ—'/g, '&#128465;'],
    // Shopping cart/bag
    [/рџ›['']/g, '&#128717;'],
    [/рџ›'/g, '&#128717;'],
    [/рџ›ЌпёЏ/g, '&#128717;'],
    // Party popper
    [/рџЋ‰/g, '&#127881;'],
    // X close
    [/вњ•/g, '&#10005;'],
    // Heart
    [/вќ¤пёЏ/g, '&#10084;'],
    [/рџ¤Ќ/g, '&#9825;'],
    // Star
    [/в…/g, '&#9733;'],
    // Check
    [/вњ…/g, '&#10003;'],
    [/вњ"/g, '&#10003;'],
    // Em dash
    [/вЂ"/g, '-'],
    [/вЂ"/g, '-'],
    // Arrow
    [/вЂ"/g, '->'],
    // Broken title chars
    [/SHOP\s+вЂ"\s+/g, 'SHOP - '],
    [/SHOP\s+[^\w\s<"]{1,5}\s+/g, 'SHOP - '],
    // Cart empty icon
    [/рџ›'/g, '&#128705;'],
    // Generic broken 2-4 char Cyrillic sequences (not real Uzbek/Russian words)
    [/[рвЂ][џ\u0434\u0436\u0441\u0440\u0449\u0435\u0430\u0430\u0430][^\s<'"]{0,6}/g, (m) => {
      if (m.length <= 6) return '';
      return m;
    }],
  ];

  fixes.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });

  return content;
}

[...htmlFiles, ...jsFiles].forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const fixed = fixContent(content);
    if (fixed !== content) {
      fs.writeFileSync(fullPath, fixed, 'utf8');
      console.log('Fixed:', relPath);
    } else {
      console.log('Clean:', relPath);
    }
  } catch(e) {
    console.log('Skip:', relPath);
  }
});

console.log('\nAll done!');
