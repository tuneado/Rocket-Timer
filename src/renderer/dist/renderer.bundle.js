// node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var s;
var a;
var h;
var p = {};
var v = [];
var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var w = Array.isArray;
function d(n2, l3) {
  for (var u3 in l3)
    n2[u3] = l3[u3];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _(l3, u3, t3) {
  var i3, r3, o2, e3 = {};
  for (o2 in u3)
    "key" == o2 ? i3 = u3[o2] : "ref" == o2 ? r3 = u3[o2] : e3[o2] = u3[o2];
  if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps)
    for (o2 in l3.defaultProps)
      void 0 === e3[o2] && (e3[o2] = l3.defaultProps[o2]);
  return m(l3, e3, i3, r3, null);
}
function m(n2, t3, i3, r3, o2) {
  var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u : o2, __i: -1, __u: 0 };
  return null == o2 && null != l.vnode && l.vnode(e3), e3;
}
function k(n2) {
  return n2.children;
}
function x(n2, l3) {
  this.props = n2, this.context = l3;
}
function S(n2, l3) {
  if (null == l3)
    return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var u3; l3 < n2.__k.length; l3++)
    if (null != (u3 = n2.__k[l3]) && null != u3.__e)
      return u3.__e;
  return "function" == typeof n2.type ? S(n2) : null;
}
function C(n2) {
  var l3, u3;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
    return C(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
}
function $() {
  for (var n2, u3, t3, r3, o2, f3, c3, s3 = 1; i.length; )
    i.length > s3 && i.sort(e), n2 = i.shift(), s3 = i.length, n2.__d && (t3 = void 0, r3 = void 0, o2 = (r3 = (u3 = n2).__v).__e, f3 = [], c3 = [], u3.__P && ((t3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(t3), O(u3.__P, t3, r3, u3.__n, u3.__P.namespaceURI, 32 & r3.__u ? [o2] : null, f3, null == o2 ? S(r3) : o2, !!(32 & r3.__u), c3), t3.__v = r3.__v, t3.__.__k[t3.__i] = t3, N(f3, t3, c3), r3.__e = r3.__ = null, t3.__e != o2 && C(t3)));
  $.__r = 0;
}
function I(n2, l3, u3, t3, i3, r3, o2, e3, f3, c3, s3) {
  var a3, h2, y3, w3, d2, g2, _2, m3 = t3 && t3.__k || v, b = l3.length;
  for (f3 = P(u3, l3, m3, f3, b), a3 = 0; a3 < b; a3++)
    null != (y3 = u3.__k[a3]) && (h2 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g2 = O(n2, y3, h2, i3, r3, o2, e3, f3, c3, s3), w3 = y3.__e, y3.ref && h2.ref != y3.ref && (h2.ref && B(h2.ref, null, y3), s3.push(y3.ref, y3.__c || w3, y3)), null == d2 && null != w3 && (d2 = w3), (_2 = !!(4 & y3.__u)) || h2.__k === y3.__k ? f3 = A(y3, f3, n2, _2) : "function" == typeof y3.type && void 0 !== g2 ? f3 = g2 : w3 && (f3 = w3.nextSibling), y3.__u &= -7);
  return u3.__e = d2, f3;
}
function P(n2, l3, u3, t3, i3) {
  var r3, o2, e3, f3, c3, s3 = u3.length, a3 = s3, h2 = 0;
  for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++)
    null != (o2 = l3[r3]) && "boolean" != typeof o2 && "function" != typeof o2 ? (f3 = r3 + h2, (o2 = n2.__k[r3] = "string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? m(null, o2, null, null, null) : w(o2) ? m(k, { children: o2 }, null, null, null) : null == o2.constructor && o2.__b > 0 ? m(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : o2).__ = n2, o2.__b = n2.__b + 1, e3 = null, -1 != (c3 = o2.__i = L(o2, u3, f3, a3)) && (a3--, (e3 = u3[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h2-- : i3 < s3 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h2-- : c3 == f3 + 1 ? h2++ : (c3 > f3 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r3] = null;
  if (a3)
    for (r3 = 0; r3 < s3; r3++)
      null != (e3 = u3[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = S(e3)), D(e3, e3));
  return t3;
}
function A(n2, l3, u3, t3) {
  var i3, r3;
  if ("function" == typeof n2.type) {
    for (i3 = n2.__k, r3 = 0; i3 && r3 < i3.length; r3++)
      i3[r3] && (i3[r3].__ = n2, l3 = A(i3[r3], l3, u3, t3));
    return l3;
  }
  n2.__e != l3 && (t3 && (l3 && n2.type && !l3.parentNode && (l3 = S(n2)), u3.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
  do {
    l3 = l3 && l3.nextSibling;
  } while (null != l3 && 8 == l3.nodeType);
  return l3;
}
function L(n2, l3, u3, t3) {
  var i3, r3, o2, e3 = n2.key, f3 = n2.type, c3 = l3[u3], s3 = null != c3 && 0 == (2 & c3.__u);
  if (null === c3 && null == n2.key || s3 && e3 == c3.key && f3 == c3.type)
    return u3;
  if (t3 > (s3 ? 1 : 0)) {
    for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; )
      if (null != (c3 = l3[o2 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f3 == c3.type)
        return o2;
  }
  return -1;
}
function T(n2, l3, u3) {
  "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || y.test(l3) ? u3 : u3 + "px";
}
function j(n2, l3, u3, t3, i3) {
  var r3, o2;
  n:
    if ("style" == l3)
      if ("string" == typeof u3)
        n2.style.cssText = u3;
      else {
        if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3)
          for (l3 in t3)
            u3 && l3 in u3 || T(n2.style, l3, "");
        if (u3)
          for (l3 in u3)
            t3 && u3[l3] == t3[l3] || T(n2.style, l3, u3[l3]);
      }
    else if ("o" == l3[0] && "n" == l3[1])
      r3 = l3 != (l3 = l3.replace(f, "$1")), o2 = l3.toLowerCase(), l3 = o2 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o2.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = c, n2.addEventListener(l3, r3 ? a : s, r3)) : n2.removeEventListener(l3, r3 ? a : s, r3);
    else {
      if ("http://www.w3.org/2000/svg" == i3)
        l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2)
        try {
          n2[l3] = null == u3 ? "" : u3;
          break n;
        } catch (n3) {
        }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u3 ? "" : u3));
    }
}
function F(n2) {
  return function(u3) {
    if (this.l) {
      var t3 = this.l[u3.type + n2];
      if (null == u3.t)
        u3.t = c++;
      else if (u3.t < t3.u)
        return;
      return t3(l.event ? l.event(u3) : u3);
    }
  };
}
function O(n2, u3, t3, i3, r3, o2, e3, f3, c3, s3) {
  var a3, h2, p2, v3, y3, _2, m3, b, S2, C2, M2, $2, P2, A3, H, L2, T2, j3 = u3.type;
  if (null != u3.constructor)
    return null;
  128 & t3.__u && (c3 = !!(32 & t3.__u), o2 = [f3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
  n:
    if ("function" == typeof j3)
      try {
        if (b = u3.props, S2 = "prototype" in j3 && j3.prototype.render, C2 = (a3 = j3.contextType) && i3[a3.__c], M2 = a3 ? C2 ? C2.props.value : a3.__ : i3, t3.__c ? m3 = (h2 = u3.__c = t3.__c).__ = h2.__E : (S2 ? u3.__c = h2 = new j3(b, M2) : (u3.__c = h2 = new x(b, M2), h2.constructor = j3, h2.render = E), C2 && C2.sub(h2), h2.props = b, h2.state || (h2.state = {}), h2.context = M2, h2.__n = i3, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && null == h2.__s && (h2.__s = h2.state), S2 && null != j3.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = d({}, h2.__s)), d(h2.__s, j3.getDerivedStateFromProps(b, h2.__s))), v3 = h2.props, y3 = h2.state, h2.__v = u3, p2)
          S2 && null == j3.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), S2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
        else {
          if (S2 && null == j3.getDerivedStateFromProps && b !== v3 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(b, M2), !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(b, h2.__s, M2) || u3.__v == t3.__v) {
            for (u3.__v != t3.__v && (h2.props = b, h2.state = h2.__s, h2.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
              n3 && (n3.__ = u3);
            }), $2 = 0; $2 < h2._sb.length; $2++)
              h2.__h.push(h2._sb[$2]);
            h2._sb = [], h2.__h.length && e3.push(h2);
            break n;
          }
          null != h2.componentWillUpdate && h2.componentWillUpdate(b, h2.__s, M2), S2 && null != h2.componentDidUpdate && h2.__h.push(function() {
            h2.componentDidUpdate(v3, y3, _2);
          });
        }
        if (h2.context = M2, h2.props = b, h2.__P = n2, h2.__e = false, P2 = l.__r, A3 = 0, S2) {
          for (h2.state = h2.__s, h2.__d = false, P2 && P2(u3), a3 = h2.render(h2.props, h2.state, h2.context), H = 0; H < h2._sb.length; H++)
            h2.__h.push(h2._sb[H]);
          h2._sb = [];
        } else
          do {
            h2.__d = false, P2 && P2(u3), a3 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
          } while (h2.__d && ++A3 < 25);
        h2.state = h2.__s, null != h2.getChildContext && (i3 = d(d({}, i3), h2.getChildContext())), S2 && !p2 && null != h2.getSnapshotBeforeUpdate && (_2 = h2.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f3 = I(n2, w(L2) ? L2 : [L2], u3, t3, i3, r3, o2, e3, f3, c3, s3), h2.base = u3.__e, u3.__u &= -161, h2.__h.length && e3.push(h2), m3 && (h2.__E = h2.__ = null);
      } catch (n3) {
        if (u3.__v = null, c3 || null != o2)
          if (n3.then) {
            for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; )
              f3 = f3.nextSibling;
            o2[o2.indexOf(f3)] = null, u3.__e = f3;
          } else {
            for (T2 = o2.length; T2--; )
              g(o2[T2]);
            z(u3);
          }
        else
          u3.__e = t3.__e, u3.__k = t3.__k, n3.then || z(u3);
        l.__e(n3, u3, t3);
      }
    else
      null == o2 && u3.__v == t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : f3 = u3.__e = q(t3.__e, u3, t3, i3, r3, o2, e3, c3, s3);
  return (a3 = l.diffed) && a3(u3), 128 & u3.__u ? void 0 : f3;
}
function z(n2) {
  n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
}
function N(n2, u3, t3) {
  for (var i3 = 0; i3 < t3.length; i3++)
    B(t3[i3], t3[++i3], t3[++i3]);
  l.__c && l.__c(u3, n2), n2.some(function(u4) {
    try {
      n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
        n3.call(u4);
      });
    } catch (n3) {
      l.__e(n3, u4.__v);
    }
  });
}
function V(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w(n2) ? n2.map(V) : d({}, n2);
}
function q(u3, t3, i3, r3, o2, e3, f3, c3, s3) {
  var a3, h2, v3, y3, d2, _2, m3, b = i3.props, k3 = t3.props, x2 = t3.type;
  if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e3) {
    for (a3 = 0; a3 < e3.length; a3++)
      if ((d2 = e3[a3]) && "setAttribute" in d2 == !!x2 && (x2 ? d2.localName == x2 : 3 == d2.nodeType)) {
        u3 = d2, e3[a3] = null;
        break;
      }
  }
  if (null == u3) {
    if (null == x2)
      return document.createTextNode(k3);
    u3 = document.createElementNS(o2, x2, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
  }
  if (null == x2)
    b === k3 || c3 && u3.data == k3 || (u3.data = k3);
  else {
    if (e3 = e3 && n.call(u3.childNodes), b = i3.props || p, !c3 && null != e3)
      for (b = {}, a3 = 0; a3 < u3.attributes.length; a3++)
        b[(d2 = u3.attributes[a3]).name] = d2.value;
    for (a3 in b)
      if (d2 = b[a3], "children" == a3)
        ;
      else if ("dangerouslySetInnerHTML" == a3)
        v3 = d2;
      else if (!(a3 in k3)) {
        if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3)
          continue;
        j(u3, a3, null, d2, o2);
      }
    for (a3 in k3)
      d2 = k3[a3], "children" == a3 ? y3 = d2 : "dangerouslySetInnerHTML" == a3 ? h2 = d2 : "value" == a3 ? _2 = d2 : "checked" == a3 ? m3 = d2 : c3 && "function" != typeof d2 || b[a3] === d2 || j(u3, a3, d2, b[a3], o2);
    if (h2)
      c3 || v3 && (h2.__html == v3.__html || h2.__html == u3.innerHTML) || (u3.innerHTML = h2.__html), t3.__k = [];
    else if (v3 && (u3.innerHTML = ""), I("template" == t3.type ? u3.content : u3, w(y3) ? y3 : [y3], t3, i3, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e3, f3, e3 ? e3[0] : i3.__k && S(i3, 0), c3, s3), null != e3)
      for (a3 = e3.length; a3--; )
        g(e3[a3]);
    c3 || (a3 = "value", "progress" == x2 && null == _2 ? u3.removeAttribute("value") : null != _2 && (_2 !== u3[a3] || "progress" == x2 && !_2 || "option" == x2 && _2 != b[a3]) && j(u3, a3, _2, b[a3], o2), a3 = "checked", null != m3 && m3 != u3[a3] && j(u3, a3, m3, b[a3], o2));
  }
  return u3;
}
function B(n2, u3, t3) {
  try {
    if ("function" == typeof n2) {
      var i3 = "function" == typeof n2.__u;
      i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
    } else
      n2.current = u3;
  } catch (n3) {
    l.__e(n3, t3);
  }
}
function D(n2, u3, t3) {
  var i3, r3;
  if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || B(i3, null, u3)), null != (i3 = n2.__c)) {
    if (i3.componentWillUnmount)
      try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
    i3.base = i3.__P = null;
  }
  if (i3 = n2.__k)
    for (r3 = 0; r3 < i3.length; r3++)
      i3[r3] && D(i3[r3], u3, t3 || "function" != typeof n2.type);
  t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function E(n2, l3, u3) {
  return this.constructor(n2, u3);
}
function G(u3, t3, i3) {
  var r3, o2, e3, f3;
  t3 == document && (t3 = document.documentElement), l.__ && l.__(u3, t3), o2 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f3 = [], O(t3, u3 = (!r3 && i3 || t3).__k = _(k, null, [u3]), o2 || p, p, t3.namespaceURI, !r3 && i3 ? [i3] : o2 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o2 ? o2.__e : t3.firstChild, r3, f3), N(e3, u3, f3);
}
n = v.slice, l = { __e: function(n2, l3, u3, t3) {
  for (var i3, r3, o2; l3 = l3.__; )
    if ((i3 = l3.__c) && !i3.__)
      try {
        if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o2 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o2 = i3.__d), o2)
          return i3.__E = i3;
      } catch (l4) {
        n2 = l4;
      }
  throw n2;
} }, u = 0, t = function(n2) {
  return null != n2 && null == n2.constructor;
}, x.prototype.setState = function(n2, l3) {
  var u3;
  u3 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u3), this.props)), n2 && d(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), M(this));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
}, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
  return n2.__v.__b - l3.__v.__b;
}, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;

// src/renderer/components/ui/Button.jsx
var variantClasses = {
  primary: `
    bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  secondary: `
    bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
    text-[var(--text-primary)] border-[var(--border-default)]
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  success: `
    bg-[var(--color-success)] hover:opacity-90 active:opacity-80
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  warning: `
    bg-[var(--color-warning)] hover:opacity-90 active:opacity-80
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  danger: `
    bg-[var(--color-danger)] hover:opacity-90 active:opacity-80
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  ghost: `
    bg-transparent hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
    text-[var(--text-primary)] border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  outline: `
    bg-transparent hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
    text-[var(--text-primary)] border-[var(--border-default)]
    hover:scale-105 hover:shadow-lg active:scale-95
  `
};
var sizeClasses = {
  sm: "h-[clamp(1.75rem,3.5vh,2rem)] px-[clamp(0.5rem,1vw,0.75rem)] text-[clamp(0.75rem,1.5vh,0.875rem)] gap-1.5",
  md: "h-[clamp(2rem,4vh,2.5rem)] px-[clamp(0.75rem,1.2vw,1rem)] text-[clamp(0.875rem,1.8vh,0.875rem)] gap-[clamp(0.375rem,0.8vh,0.5rem)]",
  lg: "h-[clamp(2.5rem,5vh,3rem)] px-[clamp(1rem,1.5vw,1.25rem)] text-[clamp(0.875rem,2vh,1rem)] gap-[clamp(0.375rem,0.8vh,0.5rem)]",
  xl: "h-[clamp(3rem,6vh,4rem)] px-[clamp(1.25rem,2vw,1.5rem)] text-[clamp(1rem,2.5vh,1.125rem)] gap-[clamp(0.5rem,1vh,0.75rem)]",
  icon: "h-[clamp(2rem,4vh,2.5rem)] w-[clamp(2rem,4vh,2.5rem)] p-0",
  "icon-sm": "h-[clamp(1.75rem,3.5vh,2rem)] w-[clamp(1.75rem,3.5vh,2rem)] p-0",
  "icon-lg": "h-[clamp(2.5rem,5vh,3rem)] w-[clamp(2.5rem,5vh,3rem)] p-0"
};
function Button({
  children,
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    transition-all duration-fast
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    select-none
  `;
  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.secondary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth ? "w-full" : "",
    className
  ].join(" ").replace(/\s+/g, " ").trim();
  const renderIcon = (iconName, position = "left") => {
    if (!iconName)
      return null;
    return /* @__PURE__ */ _(
      "i",
      {
        className: `bi ${iconName} ${loading && position === "left" ? "hidden" : ""}`,
        "aria-hidden": "true"
      }
    );
  };
  const renderSpinner = () => {
    if (!loading)
      return null;
    return /* @__PURE__ */ _(
      "svg",
      {
        className: "animate-spin h-4 w-4",
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "aria-hidden": "true"
      },
      /* @__PURE__ */ _(
        "circle",
        {
          className: "opacity-25",
          cx: "12",
          cy: "12",
          r: "10",
          stroke: "currentColor",
          strokeWidth: "4"
        }
      ),
      /* @__PURE__ */ _(
        "path",
        {
          className: "opacity-75",
          fill: "currentColor",
          d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        }
      )
    );
  };
  return /* @__PURE__ */ _(
    "button",
    {
      type,
      className: classes,
      disabled: disabled || loading,
      ...props
    },
    loading && renderSpinner(),
    !loading && renderIcon(icon, "left"),
    children && /* @__PURE__ */ _("span", null, children),
    renderIcon(iconRight, "right")
  );
}

// src/renderer/components/ui/Card.jsx
function Card({
  children,
  title,
  icon,
  action,
  className = "",
  noPadding = false,
  ...props
}) {
  const baseClasses = `
    bg-[var(--bg-surface)] 
    border border-[var(--border-default)] 
    rounded-xl 
    shadow-card
    overflow-hidden
  `;
  const classes = [baseClasses, className].join(" ").replace(/\s+/g, " ").trim();
  return /* @__PURE__ */ _("div", { className: classes, ...props }, title && /* @__PURE__ */ _(CardHeader, { title, icon, action }), /* @__PURE__ */ _("div", { className: noPadding ? "" : "p-[clamp(0.5rem,1.2vh,1rem)]" }, children));
}
function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className = ""
}) {
  return /* @__PURE__ */ _("div", { className: `
      flex items-center justify-between
      px-[clamp(0.5rem,1.2vh,1rem)] py-[clamp(0.4rem,1vh,0.75rem)]
      border-b border-[var(--border-muted)]
      bg-[var(--bg-muted)]
      ${className}
    ` }, /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, icon && /* @__PURE__ */ _("i", { className: `bi ${icon} text-[var(--text-secondary)]`, "aria-hidden": "true" }), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("h3", { className: "font-semibold text-[clamp(0.75rem,1.5vh,0.875rem)] text-[var(--text-primary)]" }, title), subtitle && /* @__PURE__ */ _("p", { className: "text-[clamp(0.625rem,1.2vh,0.75rem)] text-[var(--text-secondary)] mt-0.5" }, subtitle))), action && /* @__PURE__ */ _("div", null, action));
}
function CardContent({ children, className = "", noPadding = false }) {
  return /* @__PURE__ */ _("div", { className: `${noPadding ? "" : "p-[clamp(0.5rem,1.2vh,1rem)]"} ${className}` }, children);
}
function CardFooter({ children, className = "" }) {
  return /* @__PURE__ */ _("div", { className: `
      px-[clamp(0.5rem,1.2vh,1rem)] py-[clamp(0.5rem,1vh,0.75rem)]
      border-t border-[var(--border-muted)]
      bg-[var(--bg-muted)]
      flex items-center justify-end gap-[clamp(0.375rem,0.8vh,0.5rem)]
      ${className}
    ` }, children);
}
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u2;
var i2;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function j2() {
  for (var n2; n2 = f2.shift(); )
    if (n2.__P && n2.__H)
      try {
        n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
      } catch (t3) {
        n2.__H.__h = [], c2.__e(t3, n2.__v);
      }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i3 = (r2 = n2.__c).__H;
  i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = void 0;
  })), u2 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
};
var k2 = "function" == typeof requestAnimationFrame;
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u3 = setTimeout(r3, 35);
  k2 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u3 = n2.__c;
  "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}

// src/renderer/components/ui/Select.jsx
var sizeClasses2 = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base"
};
function Select({
  label,
  description,
  error,
  options = [],
  size = "md",
  fullWidth = true,
  placeholder,
  className = "",
  selectClassName = "",
  disabled = false,
  required = false,
  id,
  children,
  ...props
}) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const baseSelectClasses = "appearance-none bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pr-10";
  const errorClasses = error ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]" : "";
  const selectClasses = `${baseSelectClasses} ${sizeClasses2[size] || sizeClasses2.md} ${fullWidth ? "w-full" : ""} ${errorClasses} ${selectClassName}`.trim();
  const wrapperClasses = `${fullWidth ? "w-full" : ""} ${className}`.trim();
  return /* @__PURE__ */ _("div", { className: wrapperClasses }, label && /* @__PURE__ */ _(
    "label",
    {
      htmlFor: selectId,
      className: "block text-sm font-medium text-[var(--text-primary)] mb-1.5"
    },
    label,
    required && /* @__PURE__ */ _("span", { className: "text-[var(--color-danger)] ml-1" }, "*")
  ), description && !error && /* @__PURE__ */ _("p", { className: "text-xs text-[var(--text-secondary)] mb-1.5" }, description), /* @__PURE__ */ _("div", { className: "relative" }, /* @__PURE__ */ _(
    "select",
    {
      id: selectId,
      className: selectClasses,
      disabled,
      required,
      "aria-invalid": error ? "true" : "false",
      ...props
    },
    placeholder && /* @__PURE__ */ _("option", { value: "", disabled: true }, placeholder),
    children || options.map((option) => /* @__PURE__ */ _("option", { key: option.value, value: option.value, disabled: option.disabled }, option.label))
  ), /* @__PURE__ */ _("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" }, /* @__PURE__ */ _("i", { className: "bi bi-chevron-down text-[var(--text-secondary)]", "aria-hidden": "true" }))), error && /* @__PURE__ */ _("p", { className: "text-xs text-[var(--color-danger)] mt-1.5" }, error));
}

// src/renderer/components/ui/Sidebar.jsx
function Sidebar({
  items = [],
  activeId,
  onSelect,
  header,
  footer,
  className = ""
}) {
  return /* @__PURE__ */ _("aside", { className: `w-[200px] flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border-default)] flex flex-col h-full ${className}` }, header && /* @__PURE__ */ _("div", { className: "p-4 border-b border-[var(--border-muted)]" }, header), /* @__PURE__ */ _("nav", { className: "flex-1 py-2 overflow-y-auto" }, items.map((item) => /* @__PURE__ */ _(
    SidebarItem,
    {
      key: item.id,
      icon: item.icon,
      label: item.label,
      active: activeId === item.id,
      onClick: () => onSelect?.(item.id),
      badge: item.badge
    }
  ))), footer && /* @__PURE__ */ _("div", { className: "p-4 border-t border-[var(--border-muted)]" }, footer));
}
function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
  className = ""
}) {
  const buttonClasses = active ? "bg-[var(--nav-active)] text-[var(--nav-active-text)]" : "text-[var(--text-secondary)] hover:bg-[var(--nav-hover)] hover:text-[var(--text-primary)]";
  const badgeClasses = active ? "bg-white/20 text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]";
  return /* @__PURE__ */ _(
    "button",
    {
      type: "button",
      onClick,
      className: `w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors ${buttonClasses} ${className}`
    },
    icon && /* @__PURE__ */ _("i", { className: `bi ${icon} text-base`, "aria-hidden": "true" }),
    /* @__PURE__ */ _("span", { className: "flex-1 truncate" }, label),
    badge && /* @__PURE__ */ _("span", { className: `px-1.5 py-0.5 text-xs font-medium rounded-full ${badgeClasses}` }, badge)
  );
}
Sidebar.Item = SidebarItem;

// src/renderer/components/TimePicker.jsx
function TimePicker() {
  return /* @__PURE__ */ _(Card, { id: "duration-card" }, /* @__PURE__ */ _(
    Card.Header,
    {
      icon: /* @__PURE__ */ _("i", { className: "bi bi-stopwatch-fill" }),
      title: "Set Duration"
    }
  ), /* @__PURE__ */ _(Card.Content, null, /* @__PURE__ */ _("div", { id: "time-inputs-wrapper", className: "flex items-center justify-center gap-[clamp(0.25rem,0.8vw,0.5rem)]" }, /* @__PURE__ */ _("div", { className: "flex flex-col items-center" }, /* @__PURE__ */ _(
    "input",
    {
      className: "w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary",
      style: { border: "2px solid #4a4a4a" },
      type: "number",
      id: "hours",
      defaultValue: "0",
      min: "0",
      max: "99",
      "aria-label": "Hours",
      "aria-describedby": "hours-desc"
    }
  ), /* @__PURE__ */ _("label", { className: "mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary", id: "hours-desc" }, "Hours")), /* @__PURE__ */ _("div", { className: "text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-text-muted pb-[clamp(0.75rem,2vh,1.25rem)]" }, ":"), /* @__PURE__ */ _("div", { className: "flex flex-col items-center" }, /* @__PURE__ */ _(
    "input",
    {
      className: "w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary",
      style: { border: "2px solid #4a4a4a" },
      type: "number",
      id: "minutes",
      defaultValue: "5",
      min: "0",
      max: "59",
      "aria-label": "Minutes",
      "aria-describedby": "minutes-desc"
    }
  ), /* @__PURE__ */ _("label", { className: "mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary", id: "minutes-desc" }, "Minutes")), /* @__PURE__ */ _("div", { className: "text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-text-muted pb-[clamp(0.75rem,2vh,1.25rem)]" }, ":"), /* @__PURE__ */ _("div", { className: "flex flex-col items-center" }, /* @__PURE__ */ _(
    "input",
    {
      className: "w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary",
      style: { border: "2px solid #4a4a4a" },
      type: "number",
      id: "seconds",
      defaultValue: "0",
      min: "0",
      max: "59",
      "aria-label": "Seconds",
      "aria-describedby": "seconds-desc"
    }
  ), /* @__PURE__ */ _("label", { className: "mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary", id: "seconds-desc" }, "Seconds")))));
}

// src/renderer/components/Presets.jsx
function Presets() {
  const presetTimes = [
    [5, 10, 15, 20],
    [25, 30, 45, 60]
  ];
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modifierKey = isMac ? "\u2318" : "Ctrl";
  return /* @__PURE__ */ _(Card, null, /* @__PURE__ */ _(
    Card.Header,
    {
      icon: /* @__PURE__ */ _("i", { className: "bi bi-lightning-fill" }),
      title: "Quick Presets",
      action: /* @__PURE__ */ _("button", { id: "resetPresets", className: "text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm transition-colors" }, /* @__PURE__ */ _("i", { className: "bi bi-arrow-counterclockwise" }), /* @__PURE__ */ _("span", null, "Reset"))
    }
  ), /* @__PURE__ */ _(Card.Content, null, /* @__PURE__ */ _("p", { className: "text-[clamp(0.625rem,1.1vh,0.7rem)] mb-2", style: { color: "var(--text-muted)" } }, modifierKey, " + Click to save preset"), presetTimes.map((row, rowIndex) => /* @__PURE__ */ _("div", { key: rowIndex, className: `grid grid-cols-4 gap-[clamp(0.375rem,0.8vh,0.5rem)] ${rowIndex > 0 ? "mt-[clamp(0.375rem,0.8vh,0.5rem)]" : ""}` }, row.map((minutes) => /* @__PURE__ */ _(
    Button,
    {
      key: minutes,
      variant: "secondary",
      size: "md",
      className: "preset",
      "data-minutes": minutes,
      "aria-label": `Set timer to ${minutes} minutes`,
      title: "Click to set, hold to save"
    },
    minutes < 60 ? `${String(minutes).padStart(2, "0")}:00` : "60:00"
  ))))));
}

// src/renderer/components/MessageCard.jsx
function MessageCard() {
  return /* @__PURE__ */ _(Card, null, /* @__PURE__ */ _(
    Card.Header,
    {
      icon: /* @__PURE__ */ _("i", { className: "bi bi-chat-square-text-fill" }),
      title: "Message",
      action: /* @__PURE__ */ _("span", { id: "charCounter", className: "text-sm text-text-secondary" }, "0/100")
    }
  ), /* @__PURE__ */ _(Card.Content, null, /* @__PURE__ */ _(
    "textarea",
    {
      id: "messageInput",
      className: "w-full px-[clamp(0.5rem,1vw,0.75rem)] py-[clamp(0.375rem,0.8vh,0.5rem)] bg-bg-elevated rounded-lg focus:outline-none resize-none text-text-primary min-h-[clamp(2.5rem,6vh,4rem)]",
      style: { border: "2px solid var(--border-default)" },
      placeholder: "Enter message to display...",
      maxLength: "100",
      "aria-label": "Display message",
      "aria-describedby": "charCounter"
    }
  ), /* @__PURE__ */ _("div", { className: "flex gap-[clamp(0.375rem,0.8vh,0.5rem)] mt-[clamp(0.5rem,1.2vh,0.75rem)]" }, /* @__PURE__ */ _(
    Button,
    {
      id: "displayMessage",
      variant: "secondary",
      className: "flex-1",
      icon: "bi-display-fill",
      "aria-label": "Display message on timer"
    },
    "Display"
  ), /* @__PURE__ */ _(
    Button,
    {
      id: "clearMessage",
      variant: "secondary",
      className: "flex-1",
      icon: "bi-trash-fill",
      "aria-label": "Clear displayed message"
    },
    "Clear"
  ))));
}

// src/renderer/components/LayoutSelector.jsx
function LayoutSelector() {
  return /* @__PURE__ */ _(Card, { className: "mb-0" }, /* @__PURE__ */ _(
    Card.Header,
    {
      icon: /* @__PURE__ */ _("i", { className: "bi bi-layout-three-columns" }),
      title: "Canvas Layout"
    }
  ), /* @__PURE__ */ _(Card.Content, null, /* @__PURE__ */ _(
    Select,
    {
      id: "layoutSelector",
      "aria-label": "Select canvas layout"
    }
  )));
}

// src/renderer/components/StatusFooter.jsx
function StatusFooter() {
  return /* @__PURE__ */ _(Card, { className: "p-3 text-sm" }, /* @__PURE__ */ _("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ _("span", { id: "statusMessage", className: "text-text-secondary" }), /* @__PURE__ */ _("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ _("i", { id: "performanceStatus", className: "bi bi-speedometer2", style: "color: #4ade80;", title: "Performance: Good" }), /* @__PURE__ */ _("i", { id: "cameraStatus", className: "bi bi-camera-video text-text-muted", title: "Camera Inactive" }), /* @__PURE__ */ _("i", { id: "serverStatus", className: "bi bi-broadcast text-text-muted", title: "API Server Inactive" }))));
}

// src/renderer/components/LeftPanel.jsx
function LeftPanel() {
  return /* @__PURE__ */ _(k, null, /* @__PURE__ */ _(TimePicker, null), /* @__PURE__ */ _(Presets, null), /* @__PURE__ */ _(MessageCard, null), /* @__PURE__ */ _(LayoutSelector, null), /* @__PURE__ */ _("div", { className: "mt-auto" }, /* @__PURE__ */ _(StatusFooter, null)));
}

// src/renderer/components/PreviewCanvas.jsx
function PreviewCanvas() {
  return /* @__PURE__ */ _("div", { className: "h-full flex items-center justify-center" }, /* @__PURE__ */ _("canvas", { id: "timerCanvas", style: "display: block; width: 100%; height: auto; max-height: 100%; aspect-ratio: 16 / 9;" }));
}

// src/renderer/components/ControlsRow.jsx
function ControlsRow() {
  return /* @__PURE__ */ _(Card, { className: "mb-[clamp(0.5rem,1.2vh,0.75rem)]" }, /* @__PURE__ */ _(Card.Content, { className: "p-[clamp(0.5rem,1.2vh,0.75rem)]" }, /* @__PURE__ */ _("div", { className: "flex flex-wrap justify-center items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]" }, /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(
    Button,
    {
      id: "startStop",
      variant: "success",
      size: "xl",
      icon: "bi-play-fill",
      "aria-label": "Start timer",
      "aria-keyshortcut": "Space"
    },
    "Start"
  )), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(
    Button,
    {
      id: "reset",
      variant: "danger",
      size: "xl",
      icon: "bi-arrow-clockwise",
      "aria-label": "Reset timer",
      "aria-keyshortcut": "r"
    },
    "Reset"
  )), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("div", { className: "flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]" }, /* @__PURE__ */ _(
    Button,
    {
      id: "addMinute",
      variant: "secondary",
      className: "flex-1 px-[clamp(0.75rem,1.2vw,1rem)]",
      "aria-label": "Add one minute"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-caret-up-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" }),
    /* @__PURE__ */ _("span", { className: "text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold" }, "+1")
  ), /* @__PURE__ */ _(
    Button,
    {
      id: "subtractMinute",
      variant: "secondary",
      className: "flex-1 px-[clamp(0.75rem,1.2vw,1rem)]",
      "aria-label": "Subtract one minute"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-caret-down-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" }),
    /* @__PURE__ */ _("span", { className: "text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold" }, "-1")
  ))), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("div", { className: "flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]" }, /* @__PURE__ */ _(
    Button,
    {
      id: "addFive",
      variant: "secondary",
      className: "flex-1 px-[clamp(0.75rem,1.2vw,1rem)]",
      "aria-label": "Add five minutes"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-caret-up-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" }),
    /* @__PURE__ */ _("span", { className: "text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold" }, "+5")
  ), /* @__PURE__ */ _(
    Button,
    {
      id: "subtractFive",
      variant: "secondary",
      className: "flex-1 px-[clamp(0.75rem,1.2vw,1rem)]",
      "aria-label": "Subtract five minutes"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-caret-down-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" }),
    /* @__PURE__ */ _("span", { className: "text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold" }, "-5")
  ))), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("div", { className: "flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]" }, /* @__PURE__ */ _(
    Button,
    {
      id: "addTen",
      variant: "secondary",
      className: "flex-1 px-[clamp(0.75rem,1.2vw,1rem)]",
      "aria-label": "Add ten minutes"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-caret-up-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" }),
    /* @__PURE__ */ _("span", { className: "text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold" }, "+10")
  ), /* @__PURE__ */ _(
    Button,
    {
      id: "subtractTen",
      variant: "secondary",
      className: "flex-1 px-[clamp(0.75rem,1.2vw,1rem)]",
      "aria-label": "Subtract ten minutes"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-caret-down-fill text-[clamp(0.75rem,1.5vh,0.875rem)]" }),
    /* @__PURE__ */ _("span", { className: "text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold" }, "-10")
  ))), /* @__PURE__ */ _("div", { className: "flex items-stretch" }, /* @__PURE__ */ _("div", { className: "w-0.5 h-[clamp(3rem,6vh,4rem)] bg-border-strong mx-[clamp(0.375rem,0.8vw,0.5rem)]" })), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(
    Button,
    {
      id: "flashButton",
      variant: "secondary",
      size: "icon",
      className: "h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]",
      title: "Flash screen"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-lightning-fill text-[clamp(1rem,2.5vh,1.25rem)]" })
  )), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(
    Button,
    {
      id: "muteSounds",
      variant: "danger",
      size: "icon",
      className: "h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]",
      title: "Unmute"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-volume-mute-fill text-[clamp(1rem,2.5vh,1.25rem)]" })
  )), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _(
    Button,
    {
      id: "coverImage",
      variant: "secondary",
      size: "icon",
      className: "h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]",
      title: "Cover Image"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-image-fill text-[clamp(1rem,2.5vh,1.25rem)]" })
  )))));
}

// src/renderer/components/InfoStats.jsx
function InfoStats() {
  return /* @__PURE__ */ _(Card, { className: "px-[clamp(0.5rem,1.2vh,0.75rem)] py-[clamp(0.375rem,0.8vh,0.5rem)] mb-0" }, /* @__PURE__ */ _("div", { className: "grid grid-cols-4 gap-0" }, /* @__PURE__ */ _("div", { className: "text-center p-[clamp(0.25rem,0.6vh,0.5rem)]" }, /* @__PURE__ */ _("div", { className: "text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" }, "Clock"), /* @__PURE__ */ _("div", { id: "clockTime", className: "text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary" }, "--:--:--")), /* @__PURE__ */ _("div", { className: "text-center p-[clamp(0.25rem,0.6vh,0.5rem)]" }, /* @__PURE__ */ _("div", { className: "text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" }, "Timer"), /* @__PURE__ */ _("div", { id: "timerValue", className: "text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary" }, "--:--")), /* @__PURE__ */ _("div", { className: "text-center p-[clamp(0.25rem,0.6vh,0.5rem)]" }, /* @__PURE__ */ _("div", { className: "text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" }, "Elapsed"), /* @__PURE__ */ _("div", { id: "elapsedTime", className: "text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary" }, "--:--")), /* @__PURE__ */ _("div", { className: "text-center p-[clamp(0.25rem,0.6vh,0.5rem)]" }, /* @__PURE__ */ _("div", { className: "text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" }, "Ends At"), /* @__PURE__ */ _("div", { id: "endsAtTime", className: "text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary" }, "--:--:--"))));
}

// src/renderer/components/RightPanel.jsx
function RightPanel() {
  return /* @__PURE__ */ _(k, null, /* @__PURE__ */ _("div", { id: "preview-container", className: "flex-1 mb-[clamp(0.5rem,1.2vh,0.75rem)] flex flex-col min-h-0" }, /* @__PURE__ */ _(PreviewCanvas, null)), /* @__PURE__ */ _(ControlsRow, null), /* @__PURE__ */ _(InfoStats, null));
}

// src/renderer/components/App.jsx
function App() {
  return /* @__PURE__ */ _("main", { className: "grid grid-cols-3 gap-[clamp(0.5rem,1.5vh,1rem)] p-[clamp(0.5rem,1.5vh,1rem)] h-screen max-h-screen overflow-hidden", role: "main", "aria-label": "Countdown Timer Interface" }, /* @__PURE__ */ _("div", { className: "flex flex-col gap-[clamp(0.375rem,1.2vh,0.75rem)] h-full" }, /* @__PURE__ */ _(LeftPanel, null)), /* @__PURE__ */ _("div", { className: "col-span-2 flex flex-col h-full" }, /* @__PURE__ */ _(RightPanel, null)));
}

// src/renderer/index.jsx
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
function init() {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    G(/* @__PURE__ */ _(App, null), appRoot);
  }
}
/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * UI Component Library
 * Central export for all reusable UI components.
 * Import from this file to use components throughout the app.
 * import { Button, Card, Input, Switch, Select } from './components/ui';
 * /
 */
