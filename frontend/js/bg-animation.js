/**
 * SHOP — Dense Interactive Triangle Mesh
 * Kichik, zich uchburchaklar — mouse/touch reactive
 */
(function () {
  'use strict';

  var canvas, ctx, W, H;
  var points = [];
  var mouse = { x: -9999, y: -9999 };
  var animId, resizeTimer;
  var isDark = false;

  /* ── Config ─────────────────────────────────────────── */
  var CFG = {
    cellSize:    52,        // grid cell size — kichikroq = ko'proq nuqta
    jitter:      0.55,      // random offset per cell
    maxDist:     80,        // max line distance (kichik = kichik uchburchak)
    mouseR:      130,       // mouse influence radius
    mouseForce:  0.18,
    speed:       0.30,
    ptRadius:    1.6,
    lineW:       0.55,
    lineAlpha:   0.22,
    fillAlpha:   0.055,
    nearLineA:   0.70,
    nearFillA:   0.18,
    col: {
      light: { pt:'124,58,237',  ln:'124,58,237',  fi:'139,92,246'  },
      dark:  { pt:'167,139,250', ln:'139,92,246',  fi:'109,40,217'  }
    }
  };

  function gc() { return isDark ? CFG.col.dark : CFG.col.light; }

  /* ── Point ───────────────────────────────────────────── */
  function Pt(x, y) {
    this.ox = x; this.oy = y;
    this.x  = x; this.y  = y;
    this.vx = (Math.random() - 0.5) * CFG.speed;
    this.vy = (Math.random() - 0.5) * CFG.speed;
  }
  Pt.prototype.tick = function () {
    var dx = this.x - mouse.x, dy = this.y - mouse.y;
    var d  = Math.sqrt(dx * dx + dy * dy);
    if (d < CFG.mouseR && d > 0.5) {
      var f = (1 - d / CFG.mouseR) * CFG.mouseForce * 3;
      this.vx += (dx / d) * f;
      this.vy += (dy / d) * f;
    }
    this.vx += (this.ox - this.x) * 0.022;
    this.vy += (this.oy - this.y) * 0.022;
    this.vx *= 0.90; this.vy *= 0.90;
    this.x  += this.vx; this.y  += this.vy;
  };

  /* ── Init points (dense grid) ────────────────────────── */
  function initPoints() {
    points = [];
    var cs = CFG.cellSize;
    var cols = Math.ceil(W / cs) + 1;
    var rows = Math.ceil(H / cs) + 1;
    for (var r = 0; r <= rows; r++) {
      for (var c = 0; c <= cols; c++) {
        var bx = c * cs;
        var by = r * cs;
        var jx = (Math.random() - 0.5) * cs * CFG.jitter;
        var jy = (Math.random() - 0.5) * cs * CFG.jitter;
        points.push(new Pt(
          Math.max(0, Math.min(W, bx + jx)),
          Math.max(0, Math.min(H, by + jy))
        ));
      }
    }
  }

  /* ── Draw ────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var c   = gc();
    var md2 = CFG.maxDist * CFG.maxDist;
    var n   = points.length;

    for (var i = 0; i < n; i++) points[i].tick();

    /* lines + triangles */
    for (var i = 0; i < n - 1; i++) {
      var pi = points[i];
      for (var j = i + 1; j < n; j++) {
        var pj = points[j];
        var dx = pi.x - pj.x, dy = pi.y - pj.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > md2) continue;

        var t   = 1 - d2 / md2;          // 0..1 proximity
        var mxi = (pi.x + pj.x) * 0.5 - mouse.x;
        var myi = (pi.y + pj.y) * 0.5 - mouse.y;
        var md  = Math.sqrt(mxi * mxi + myi * myi);
        var hot = md < CFG.mouseR;

        /* triangle fill with third neighbour */
        for (var k = j + 1; k < n; k++) {
          var pk = points[k];
          var ax = pi.x - pk.x, ay = pi.y - pk.y;
          var bx2= pj.x - pk.x, by2= pj.y - pk.y;
          if (ax*ax+ay*ay > md2) continue;
          if (bx2*bx2+by2*by2 > md2) continue;
          var fa = hot ? CFG.nearFillA * t : CFG.fillAlpha * t;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.lineTo(pk.x, pk.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(' + c.fi + ',' + Math.min(fa, 0.25) + ')';
          ctx.fill();
          break;
        }

        /* line */
        var la = hot ? CFG.nearLineA * t : CFG.lineAlpha * t;
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);
        ctx.strokeStyle = 'rgba(' + c.ln + ',' + la + ')';
        ctx.lineWidth   = hot ? CFG.lineW * 2 : CFG.lineW;
        ctx.stroke();
      }
    }

    /* dots */
    for (var i = 0; i < n; i++) {
      var p  = points[i];
      var dx = p.x - mouse.x, dy = p.y - mouse.y;
      var d  = Math.sqrt(dx * dx + dy * dy);
      var hot= d < CFG.mouseR;
      var r  = hot ? CFG.ptRadius * 2.2 : CFG.ptRadius;
      var a  = hot ? 0.95 : 0.40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + c.pt + ',' + a + ')';
      ctx.fill();
      if (hot) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.5, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + c.pt + ',0.10)';
        ctx.fill();
      }
    }

    animId = requestAnimationFrame(draw);
  }

  /* ── Resize ──────────────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initPoints, 150);
  }

  /* ── Events ──────────────────────────────────────────── */
  function onMove(e)  { mouse.x = e.clientX; mouse.y = e.clientY; }
  function onTouch(e) {
    if (e.touches.length) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }
  function onTouchEnd() {
    setTimeout(function () { mouse.x = -9999; mouse.y = -9999; }, 1200);
  }
  function watchTheme() {
    isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  }

  /* ── Bootstrap ───────────────────────────────────────── */
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0'
    });
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');

    watchTheme();
    resize();
    draw();

    window.addEventListener('resize',    resize,     { passive: true });
    window.addEventListener('mousemove', onMove,     { passive: true });
    window.addEventListener('touchmove', onTouch,    { passive: true });
    window.addEventListener('touchend',  onTouchEnd, { passive: true });

    new MutationObserver(function (ms) {
      ms.forEach(function (m) { if (m.attributeName === 'data-theme') watchTheme(); });
    }).observe(document.documentElement, { attributes: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.BgAnimation = { stop: function () { cancelAnimationFrame(animId); } };
})();
