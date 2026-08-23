/* Dark Charts — tiny SVG chart renderer. No dependencies, ~5 KB.
   Charts are declared in HTML and rendered on DOMContentLoaded:

     <div class="chart" data-chart="line" data-values="4,8,6,11,9,14"></div>

   Every renderer returns SVG markup, so you can also call
   DarkCharts.line([...]) yourself and inject it wherever you like. */
(function (global) {
  'use strict';

  function scale(vals, h, pad) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max === min) { max = min + 1; }
    var span = max - min;
    return function (v) { return h - pad - ((v - min) / span) * (h - pad * 2); };
  }

  function points(vals, w, h, pad) {
    var y = scale(vals, h, pad);
    var step = vals.length > 1 ? w / (vals.length - 1) : w;
    return vals.map(function (v, i) { return [i * step, y(v)]; });
  }

  function pathFrom(pts, smooth) {
    if (!pts.length) return '';
    if (!smooth) {
      return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2;
      d += ' C' + mx.toFixed(1) + ' ' + a[1].toFixed(1) + ',' +
                  mx.toFixed(1) + ' ' + b[1].toFixed(1) + ',' +
                  b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    return d;
  }

  var API = {
    /* line / area chart */
    line: function (vals, opt) {
      opt = opt || {};
      var w = opt.width || 600, h = opt.height || 160, pad = 10,
          series = opt.series || 1, smooth = opt.smooth !== false,
          area = opt.area !== false, grid = opt.grid !== false;
      var pts = points(vals, w, h, pad);
      var d = pathFrom(pts, smooth);
      var g = '';
      if (grid) {
        g = '<g class="grid">';
        for (var i = 0; i <= 3; i++) {
          var y = pad + (i * (h - pad * 2) / 3);
          g += '<line x1="0" y1="' + y.toFixed(1) + '" x2="' + w + '" y2="' + y.toFixed(1) + '"/>';
        }
        g += '</g>';
      }
      var a = '';
      if (area) {
        a = '<path class="area s' + series + '" d="' + d +
            ' L' + w + ' ' + h + ' L0 ' + h + ' Z"/>';
      }
      var last = pts[pts.length - 1];
      var dot = opt.dot === false ? '' :
        '<circle class="dot s' + series + '" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '"/>';
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img">' +
             g + a + '<path class="line s' + series + '" d="' + d + '"/>' + dot + '</svg>';
    },

    /* vertical bars */
    bars: function (vals, opt) {
      opt = opt || {};
      var w = opt.width || 600, h = opt.height || 160, pad = 8,
          series = opt.series || 1, gap = opt.gap == null ? 6 : opt.gap;
      var max = Math.max.apply(null, vals) || 1;
      var bw = (w - gap * (vals.length - 1)) / vals.length;
      var out = '';
      vals.forEach(function (v, i) {
        var bh = Math.max(2, (v / max) * (h - pad));
        out += '<rect class="bar s' + series + '" x="' + (i * (bw + gap)).toFixed(1) +
               '" y="' + (h - bh).toFixed(1) + '" width="' + bw.toFixed(1) +
               '" height="' + bh.toFixed(1) + '"/>';
      });
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img">' + out + '</svg>';
    },

    /* donut — pct 0..100 */
    donut: function (pct, opt) {
      opt = opt || {};
      var size = opt.size || 150, series = opt.series || 1, r = size / 2 - 12,
          c = 2 * Math.PI * r, on = (Math.min(100, Math.max(0, pct)) / 100) * c;
      return '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img">' +
        '<circle class="track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r.toFixed(1) + '"/>' +
        '<circle class="arc s' + series + '" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r.toFixed(1) +
        '" stroke-dasharray="' + on.toFixed(1) + ' ' + (c - on).toFixed(1) + '"/>' +
        '<text class="center-label" x="' + size / 2 + '" y="' + (size / 2 + 2) + '">' + Math.round(pct) + '%</text>' +
        (opt.label ? '<text class="center-sub" x="' + size / 2 + '" y="' + (size / 2 + 20) + '">' + opt.label + '</text>' : '') +
        '</svg>';
    },

    /* sparkline — inline, no axes */
    spark: function (vals, opt) {
      opt = opt || {};
      var w = opt.width || 88, h = opt.height || 24, pad = 3;
      var pts = points(vals, w, h, pad);
      var d = pathFrom(pts, true);
      var fill = opt.fill ? '<path class="fill" d="' + d + ' L' + w + ' ' + h + ' L0 ' + h + ' Z"/>' : '';
      return '<svg class="spark ' + (opt.trend || '') + '" viewBox="0 0 ' + w + ' ' + h +
             '" preserveAspectRatio="none" role="img">' + fill + '<path d="' + d + '"/></svg>';
    }
  };

  /* declarative rendering */
  function nums(s) {
    return (s || '').split(',').map(function (x) { return parseFloat(x.trim()); })
                    .filter(function (n) { return !isNaN(n); });
  }

  function render(root) {
    (root || document).querySelectorAll('[data-chart]').forEach(function (el) {
      var kind = el.getAttribute('data-chart');
      var vals = nums(el.getAttribute('data-values'));
      var opt = {
        series: parseInt(el.getAttribute('data-series') || '1', 10),
        height: parseInt(el.getAttribute('data-height') || '0', 10) || undefined,
        label: el.getAttribute('data-label') || undefined,
        trend: el.getAttribute('data-trend') || undefined,
        fill: el.getAttribute('data-fill') === 'true',
        area: el.getAttribute('data-area') !== 'false',
        grid: el.getAttribute('data-grid') !== 'false'
      };
      var html = '';
      if (kind === 'line') html = API.line(vals, opt);
      else if (kind === 'bars') html = API.bars(vals, opt);
      else if (kind === 'donut') html = API.donut(vals[0] || 0, opt);
      else if (kind === 'spark') html = API.spark(vals, opt);
      if (html) el.insertAdjacentHTML('beforeend', html);
    });
  }

  API.render = render;
  global.DarkCharts = API;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { render(); });
  } else { render(); }
})(window);
