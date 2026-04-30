const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../frontend/cart.html');
let c = fs.readFileSync(filePath, 'utf8');

// Fix cart empty icon - any broken chars in that div
c = c.replace(/<div style="font-size:4rem">[^<]*<\/div>/, '<div style="font-size:4rem">&#128705;</div>');

// Fix modal title - any broken emoji before <span
c = c.replace(/<span class="modal-title">[^<]*<span/, '<span class="modal-title">&#127881; <span');

// Fix modal close button
c = c.replace(/<button class="modal-close">[^<]*<\/button>/, '<button class="modal-close">&#10005;</button>');

// Fix page title
c = c.replace(/<title>[^<]*<\/title>/, '<title>SHOP - Savat</title>');

fs.writeFileSync(filePath, c, 'utf8');
console.log('cart.html fixed!');
console.log('Empty icon:', c.match(/<div style="font-size:4rem">[^<]*<\/div>/)?.[0]);
