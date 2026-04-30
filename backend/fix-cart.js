const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/cart.html');
let content = fs.readFileSync(filePath, 'utf8');

// Fix qty-minus button - replace any broken minus char with HTML entity
content = content.replace(/qty-minus[^>]*>[^<]{1,10}<\/button>/g, (match) => {
  return match.replace(/>([^<]+)<\/button>/, '>&#8722;</button>');
});

// Fix remove-item button - replace any broken trash icon
content = content.replace(/remove-item[^>]*>[^<]{1,10}<\/button>/g, (match) => {
  return match.replace(/>([^<]+)<\/button>/, '>&#128465;</button>');
});

// Fix cart-img-ph placeholder
content = content.replace(/cart-img-ph[^>]*>[^<]{1,20}<\/div>/g, (match) => {
  return match.replace(/>([^<]+)<\/div>/, '>&#128717;</div>');
});

// Fix modal title emoji
content = content.replace(/modal-title[^>]*>[^<]{1,10}\s*<span/g, (match) => {
  return match.replace(/>[^<]+\s*<span/, '>&#127881; <span');
});

// Fix modal close button
content = content.replace(/modal-close[^>]*>[^<]{1,10}<\/button>/g, (match) => {
  return match.replace(/>([^<]+)<\/button>/, '>&#10005;</button>');
});

// Fix title encoding
content = content.replace(/SHOP\s*[^\s<"]{1,5}\s*Cart/, 'SHOP - Cart');

fs.writeFileSync(filePath, content, 'utf8');
console.log('cart.html fixed!');
