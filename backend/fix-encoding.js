const fs = require('fs');
const path = require('path');

const files = [
  '../frontend/cart.html',
  '../frontend/index.html',
  '../frontend/shop.html',
  '../frontend/profile.html',
  '../frontend/login.html',
  '../frontend/register.html',
  '../frontend/news.html',
  '../frontend/discounts.html',
  '../frontend/js/utils.js',
  '../frontend/js/navbar.js',
];

// Buzilgan encoding -> to'g'ri HTML entity
const replacements = [
  ['\u0440\u0434\u0436\u0441\u0440', '&#128717;'],  // shopping bag
  ['\u0432\u0449\u0435', '&#10005;'],                // x close
  ['\u0432\u0430\u0434\u0430\u0430', '&#8722;'],     // minus
  ['\u0432\u0430\u0434\u0430\u0430\u0430', '&#8722;'],
];

files.forEach(f => {
  const fullPath = path.join(__dirname, f);
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // Replace all non-ASCII garbage that looks like encoding errors
    // Pattern: sequences of Cyrillic chars that shouldn't be in HTML/JS
    const fixed = content.replace(/[\u0400-\u04FF\u0440\u0434\u0436\u0441\u0440\u0432\u0449\u0435\u0430\u0434\u0430\u0430]{2,}/g, (match) => {
      // Keep actual Uzbek/Russian text (longer words)
      if (match.length > 4) return match;
      return '';
    });

    if (fixed !== content) {
      fs.writeFileSync(fullPath, fixed, 'utf8');
      console.log('Fixed:', f);
    } else {
      console.log('OK:', f);
    }
  } catch(e) {
    console.log('Skip:', f, e.message);
  }
});

console.log('Done!');
