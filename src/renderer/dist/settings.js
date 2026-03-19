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
  var i3, r3, o3, e3 = {};
  for (o3 in u3)
    "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : e3[o3] = u3[o3];
  if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps)
    for (o3 in l3.defaultProps)
      void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
  return m(l3, e3, i3, r3, null);
}
function m(n2, t3, i3, r3, o3) {
  var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
  return null == o3 && null != l.vnode && l.vnode(e3), e3;
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
  for (var n2, u3, t3, r3, o3, f3, c3, s3 = 1; i.length; )
    i.length > s3 && i.sort(e), n2 = i.shift(), s3 = i.length, n2.__d && (t3 = void 0, r3 = void 0, o3 = (r3 = (u3 = n2).__v).__e, f3 = [], c3 = [], u3.__P && ((t3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(t3), O(u3.__P, t3, r3, u3.__n, u3.__P.namespaceURI, 32 & r3.__u ? [o3] : null, f3, null == o3 ? S(r3) : o3, !!(32 & r3.__u), c3), t3.__v = r3.__v, t3.__.__k[t3.__i] = t3, N(f3, t3, c3), r3.__e = r3.__ = null, t3.__e != o3 && C(t3)));
  $.__r = 0;
}
function I(n2, l3, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
  var a3, h3, y3, w3, d3, g2, _2, m3 = t3 && t3.__k || v, b = l3.length;
  for (f3 = P(u3, l3, m3, f3, b), a3 = 0; a3 < b; a3++)
    null != (y3 = u3.__k[a3]) && (h3 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g2 = O(n2, y3, h3, i3, r3, o3, e3, f3, c3, s3), w3 = y3.__e, y3.ref && h3.ref != y3.ref && (h3.ref && B(h3.ref, null, y3), s3.push(y3.ref, y3.__c || w3, y3)), null == d3 && null != w3 && (d3 = w3), (_2 = !!(4 & y3.__u)) || h3.__k === y3.__k ? f3 = A(y3, f3, n2, _2) : "function" == typeof y3.type && void 0 !== g2 ? f3 = g2 : w3 && (f3 = w3.nextSibling), y3.__u &= -7);
  return u3.__e = d3, f3;
}
function P(n2, l3, u3, t3, i3) {
  var r3, o3, e3, f3, c3, s3 = u3.length, a3 = s3, h3 = 0;
  for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++)
    null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? (f3 = r3 + h3, (o3 = n2.__k[r3] = "string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? m(null, o3, null, null, null) : w(o3) ? m(k, { children: o3 }, null, null, null) : null == o3.constructor && o3.__b > 0 ? m(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : o3).__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = L(o3, u3, f3, a3)) && (a3--, (e3 = u3[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h3-- : i3 < s3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h3-- : c3 == f3 + 1 ? h3++ : (c3 > f3 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
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
  var i3, r3, o3, e3 = n2.key, f3 = n2.type, c3 = l3[u3], s3 = null != c3 && 0 == (2 & c3.__u);
  if (null === c3 && null == n2.key || s3 && e3 == c3.key && f3 == c3.type)
    return u3;
  if (t3 > (s3 ? 1 : 0)) {
    for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; )
      if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f3 == c3.type)
        return o3;
  }
  return -1;
}
function T(n2, l3, u3) {
  "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || y.test(l3) ? u3 : u3 + "px";
}
function j(n2, l3, u3, t3, i3) {
  var r3, o3;
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
      r3 = l3 != (l3 = l3.replace(f, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = c, n2.addEventListener(l3, r3 ? a : s, r3)) : n2.removeEventListener(l3, r3 ? a : s, r3);
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
function O(n2, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
  var a3, h3, p3, v3, y3, _2, m3, b, S2, C3, M2, $2, P2, A3, H, L2, T3, j3 = u3.type;
  if (null != u3.constructor)
    return null;
  128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
  n:
    if ("function" == typeof j3)
      try {
        if (b = u3.props, S2 = "prototype" in j3 && j3.prototype.render, C3 = (a3 = j3.contextType) && i3[a3.__c], M2 = a3 ? C3 ? C3.props.value : a3.__ : i3, t3.__c ? m3 = (h3 = u3.__c = t3.__c).__ = h3.__E : (S2 ? u3.__c = h3 = new j3(b, M2) : (u3.__c = h3 = new x(b, M2), h3.constructor = j3, h3.render = E), C3 && C3.sub(h3), h3.props = b, h3.state || (h3.state = {}), h3.context = M2, h3.__n = i3, p3 = h3.__d = true, h3.__h = [], h3._sb = []), S2 && null == h3.__s && (h3.__s = h3.state), S2 && null != j3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, j3.getDerivedStateFromProps(b, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u3, p3)
          S2 && null == j3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), S2 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
        else {
          if (S2 && null == j3.getDerivedStateFromProps && b !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(b, M2), !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(b, h3.__s, M2) || u3.__v == t3.__v) {
            for (u3.__v != t3.__v && (h3.props = b, h3.state = h3.__s, h3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
              n3 && (n3.__ = u3);
            }), $2 = 0; $2 < h3._sb.length; $2++)
              h3.__h.push(h3._sb[$2]);
            h3._sb = [], h3.__h.length && e3.push(h3);
            break n;
          }
          null != h3.componentWillUpdate && h3.componentWillUpdate(b, h3.__s, M2), S2 && null != h3.componentDidUpdate && h3.__h.push(function() {
            h3.componentDidUpdate(v3, y3, _2);
          });
        }
        if (h3.context = M2, h3.props = b, h3.__P = n2, h3.__e = false, P2 = l.__r, A3 = 0, S2) {
          for (h3.state = h3.__s, h3.__d = false, P2 && P2(u3), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++)
            h3.__h.push(h3._sb[H]);
          h3._sb = [];
        } else
          do {
            h3.__d = false, P2 && P2(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
          } while (h3.__d && ++A3 < 25);
        h3.state = h3.__s, null != h3.getChildContext && (i3 = d(d({}, i3), h3.getChildContext())), S2 && !p3 && null != h3.getSnapshotBeforeUpdate && (_2 = h3.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f3 = I(n2, w(L2) ? L2 : [L2], u3, t3, i3, r3, o3, e3, f3, c3, s3), h3.base = u3.__e, u3.__u &= -161, h3.__h.length && e3.push(h3), m3 && (h3.__E = h3.__ = null);
      } catch (n3) {
        if (u3.__v = null, c3 || null != o3)
          if (n3.then) {
            for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; )
              f3 = f3.nextSibling;
            o3[o3.indexOf(f3)] = null, u3.__e = f3;
          } else {
            for (T3 = o3.length; T3--; )
              g(o3[T3]);
            z(u3);
          }
        else
          u3.__e = t3.__e, u3.__k = t3.__k, n3.then || z(u3);
        l.__e(n3, u3, t3);
      }
    else
      null == o3 && u3.__v == t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : f3 = u3.__e = q(t3.__e, u3, t3, i3, r3, o3, e3, c3, s3);
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
function q(u3, t3, i3, r3, o3, e3, f3, c3, s3) {
  var a3, h3, v3, y3, d3, _2, m3, b = i3.props, k3 = t3.props, x2 = t3.type;
  if ("svg" == x2 ? o3 = "http://www.w3.org/2000/svg" : "math" == x2 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
    for (a3 = 0; a3 < e3.length; a3++)
      if ((d3 = e3[a3]) && "setAttribute" in d3 == !!x2 && (x2 ? d3.localName == x2 : 3 == d3.nodeType)) {
        u3 = d3, e3[a3] = null;
        break;
      }
  }
  if (null == u3) {
    if (null == x2)
      return document.createTextNode(k3);
    u3 = document.createElementNS(o3, x2, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
  }
  if (null == x2)
    b === k3 || c3 && u3.data == k3 || (u3.data = k3);
  else {
    if (e3 = e3 && n.call(u3.childNodes), b = i3.props || p, !c3 && null != e3)
      for (b = {}, a3 = 0; a3 < u3.attributes.length; a3++)
        b[(d3 = u3.attributes[a3]).name] = d3.value;
    for (a3 in b)
      if (d3 = b[a3], "children" == a3)
        ;
      else if ("dangerouslySetInnerHTML" == a3)
        v3 = d3;
      else if (!(a3 in k3)) {
        if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3)
          continue;
        j(u3, a3, null, d3, o3);
      }
    for (a3 in k3)
      d3 = k3[a3], "children" == a3 ? y3 = d3 : "dangerouslySetInnerHTML" == a3 ? h3 = d3 : "value" == a3 ? _2 = d3 : "checked" == a3 ? m3 = d3 : c3 && "function" != typeof d3 || b[a3] === d3 || j(u3, a3, d3, b[a3], o3);
    if (h3)
      c3 || v3 && (h3.__html == v3.__html || h3.__html == u3.innerHTML) || (u3.innerHTML = h3.__html), t3.__k = [];
    else if (v3 && (u3.innerHTML = ""), I("template" == t3.type ? u3.content : u3, w(y3) ? y3 : [y3], t3, i3, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e3, f3, e3 ? e3[0] : i3.__k && S(i3, 0), c3, s3), null != e3)
      for (a3 = e3.length; a3--; )
        g(e3[a3]);
    c3 || (a3 = "value", "progress" == x2 && null == _2 ? u3.removeAttribute("value") : null != _2 && (_2 !== u3[a3] || "progress" == x2 && !_2 || "option" == x2 && _2 != b[a3]) && j(u3, a3, _2, b[a3], o3), a3 = "checked", null != m3 && m3 != u3[a3] && j(u3, a3, m3, b[a3], o3));
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
  var r3, o3, e3, f3;
  t3 == document && (t3 = document.documentElement), l.__ && l.__(u3, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f3 = [], O(t3, u3 = (!r3 && i3 || t3).__k = _(k, null, [u3]), o3 || p, p, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f3), N(e3, u3, f3);
}
n = v.slice, l = { __e: function(n2, l3, u3, t3) {
  for (var i3, r3, o3; l3 = l3.__; )
    if ((i3 = l3.__c) && !i3.__)
      try {
        if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3)
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

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function p2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
}
function d2(n2) {
  return o2 = 1, h2(D2, n2);
}
function h2(n2, u3, i3) {
  var o3 = p2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(void 0, u3), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
    t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r2, !r2.__f)) {
    var f3 = function(n3, t3, r3) {
      if (!o3.__c.__H)
        return true;
      var u4 = o3.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u4.every(function(n4) {
        return !n4.__N;
      }))
        return !c3 || c3.call(this, n3, t3, r3);
      var i4 = o3.__c.props !== n3;
      return u4.forEach(function(n4) {
        if (n4.__N) {
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
        }
      }), c3 && c3.call(this, n3, t3, r3) || i4;
    };
    r2.__f = true;
    var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
    r2.componentWillUpdate = function(n3, t3, r3) {
      if (this.__e) {
        var u4 = c3;
        c3 = void 0, f3(n3, t3, r3), c3 = u4;
      }
      e3 && e3.call(this, n3, t3, r3);
    }, r2.shouldComponentUpdate = f3;
  }
  return o3.__N || o3.__;
}
function y2(n2, u3) {
  var i3 = p2(t2++, 3);
  !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r3) {
  var u3 = p2(t2++, 7);
  return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
}
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
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}
function D2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
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

// src/renderer/components/ui/SettingsGroup.jsx
function SettingsGroup({
  title,
  description,
  children,
  className = ""
}) {
  return /* @__PURE__ */ _("div", { className: `mb-6 ${className}` }, title && /* @__PURE__ */ _("div", { className: "mb-3" }, /* @__PURE__ */ _("h3", { className: "text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide" }, title), description && /* @__PURE__ */ _("p", { className: "text-xs text-[var(--text-muted)] mt-1" }, description)), /* @__PURE__ */ _("div", { className: "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm" }, children));
}

// src/renderer/components/ui/SettingsItem.jsx
function SettingsItem({
  title,
  description,
  children,
  block = false,
  className = "",
  id
}) {
  if (block) {
    return /* @__PURE__ */ _("div", { id, className: `py-4 px-5 border-b border-[var(--border-muted)] last:border-b-0 ${className}` }, /* @__PURE__ */ _("div", { className: "mb-3" }, /* @__PURE__ */ _("div", { className: "text-sm font-medium text-[var(--text-primary)]" }, title), description && /* @__PURE__ */ _("div", { className: "text-xs text-[var(--text-secondary)] mt-1" }, description)), /* @__PURE__ */ _("div", null, children));
  }
  return /* @__PURE__ */ _("div", { id, className: `flex items-center justify-between gap-4 py-4 px-5 border-b border-[var(--border-muted)] last:border-b-0 ${className}` }, /* @__PURE__ */ _("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ _("div", { className: "text-sm font-medium text-[var(--text-primary)]" }, title), description && /* @__PURE__ */ _("div", { className: "text-xs text-[var(--text-secondary)] mt-0.5" }, description)), /* @__PURE__ */ _("div", { className: "flex-shrink-0" }, children));
}

// src/renderer/components/ui/Select.jsx
var sizeClasses = {
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
  const selectClasses = `${baseSelectClasses} ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? "w-full" : ""} ${errorClasses} ${selectClassName}`.trim();
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

// src/renderer/components/ui/Switch.jsx
function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  className = "",
  id,
  ...props
}) {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
  const sizeConfig = {
    sm: { track: "w-8 h-4", knob: "w-3 h-3", translatePx: "16px" },
    md: { track: "w-11 h-6", knob: "w-5 h-5", translatePx: "20px" },
    lg: { track: "w-14 h-7", knob: "w-6 h-6", translatePx: "28px" }
  };
  const cfg = sizeConfig[size] || sizeConfig.md;
  return /* @__PURE__ */ _("div", { className: `flex items-center gap-3 ${className}` }, /* @__PURE__ */ _("label", { className: "relative inline-flex items-center cursor-pointer" }, /* @__PURE__ */ _(
    "input",
    {
      type: "checkbox",
      id: switchId,
      defaultChecked: checked,
      onChange,
      disabled,
      className: "sr-only",
      role: "switch",
      ...props
    }
  ), /* @__PURE__ */ _("div", { className: `${cfg.track} rounded-full switch-track peer-disabled:opacity-50 peer-disabled:cursor-not-allowed` }, /* @__PURE__ */ _(
    "div",
    {
      className: `${cfg.knob} bg-[var(--switch-knob)] rounded-full shadow-md absolute top-0.5 left-0.5 switch-knob`,
      style: { "--switch-translate": cfg.translatePx }
    }
  ))), (label || description) && /* @__PURE__ */ _("div", { className: "flex flex-col" }, label && /* @__PURE__ */ _(
    "label",
    {
      htmlFor: switchId,
      className: "text-sm font-medium text-[var(--text-primary)] cursor-pointer"
    },
    label
  ), description && /* @__PURE__ */ _("span", { className: "text-xs text-[var(--text-secondary)]" }, description)));
}

// src/renderer/components/settings/sections/DisplaySection.jsx
function DisplaySection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-display" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "Display"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Configure display and layout preferences"), /* @__PURE__ */ _(SettingsGroup, { title: "General" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Default Layout",
      description: "Layout shown when app starts"
    },
    /* @__PURE__ */ _(Select, { id: "defaultLayout", fullWidth: true })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Default Theme",
      description: "Color scheme preference"
    },
    /* @__PURE__ */ _(Select, { id: "defaultTheme", className: "w-48" }, /* @__PURE__ */ _("option", { value: "dark" }, "Dark"), /* @__PURE__ */ _("option", { value: "light" }, "Light"), /* @__PURE__ */ _("option", { value: "auto" }, "Auto (System)"))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Canvas Resolution" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Output Resolution",
      description: "Canvas rendering resolution (affects output quality and performance)"
    },
    /* @__PURE__ */ _(Select, { id: "canvasResolution", className: "w-56" }, /* @__PURE__ */ _("option", { value: "1920x1080" }, "1920\xD71080 (Full HD)"), /* @__PURE__ */ _("option", { value: "1280x720" }, "1280\xD7720 (HD)"), /* @__PURE__ */ _("option", { value: "2560x1440" }, "2560\xD71440 (2K)"), /* @__PURE__ */ _("option", { value: "3840x2160" }, "3840\xD72160 (4K)"), /* @__PURE__ */ _("option", { value: "custom" }, "Custom..."))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "External Display" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Auto-Open at Startup",
      description: "Automatically open fullscreen timer on external display if available"
    },
    /* @__PURE__ */ _(Switch, { id: "autoOpenDisplay" })
  )));
}
var DisplaySection_default = DisplaySection;

// src/renderer/components/ui/Input.jsx
var sizeClasses2 = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
  xl: "h-16 px-4 text-3xl font-mono"
  // For timer display inputs
};
function Input({
  label,
  description,
  error,
  type = "text",
  size = "md",
  prefix,
  suffix,
  fullWidth = true,
  className = "",
  inputClassName = "",
  disabled = false,
  required = false,
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const baseInputClasses = `
    bg-[var(--bg-input)]
    border border-[var(--border-default)]
    rounded-lg
    text-[var(--text-primary)]
    placeholder:text-[var(--text-muted)]
    transition-all duration-fast
    focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]" : ""}
  `;
  const inputClasses = [
    baseInputClasses,
    sizeClasses2[size] || sizeClasses2.md,
    fullWidth && !prefix && !suffix ? "w-full" : "",
    prefix ? "rounded-l-none" : "",
    suffix ? "rounded-r-none" : "",
    inputClassName
  ].join(" ").replace(/\s+/g, " ").trim();
  const wrapperClasses = `${fullWidth ? "w-full" : ""} ${className}`;
  return /* @__PURE__ */ _("div", { className: wrapperClasses }, label && /* @__PURE__ */ _(
    "label",
    {
      htmlFor: inputId,
      className: "block text-sm font-medium text-[var(--text-primary)] mb-1.5"
    },
    label,
    required && /* @__PURE__ */ _("span", { className: "text-[var(--color-danger)] ml-1" }, "*")
  ), description && !error && /* @__PURE__ */ _("p", { className: "text-xs text-[var(--text-secondary)] mb-1.5" }, description), /* @__PURE__ */ _("div", { className: `flex ${fullWidth ? "w-full" : ""}` }, prefix && /* @__PURE__ */ _("span", { className: `
            inline-flex items-center px-3
            bg-[var(--bg-muted)] border border-r-0 border-[var(--border-default)]
            rounded-l-lg text-sm text-[var(--text-secondary)]
            ${sizeClasses2[size]?.includes("h-8") ? "h-8" : ""}
            ${sizeClasses2[size]?.includes("h-10") ? "h-10" : ""}
            ${sizeClasses2[size]?.includes("h-12") ? "h-12" : ""}
            ${sizeClasses2[size]?.includes("h-16") ? "h-16" : ""}
          ` }, prefix), /* @__PURE__ */ _(
    "input",
    {
      id: inputId,
      type,
      className: inputClasses,
      disabled,
      required,
      "aria-invalid": error ? "true" : "false",
      "aria-describedby": error ? `${inputId}-error` : description ? `${inputId}-desc` : void 0,
      ...props
    }
  ), suffix && /* @__PURE__ */ _("span", { className: `
            inline-flex items-center px-3
            bg-[var(--bg-muted)] border border-l-0 border-[var(--border-default)]
            rounded-r-lg text-sm text-[var(--text-secondary)]
            ${sizeClasses2[size]?.includes("h-8") ? "h-8" : ""}
            ${sizeClasses2[size]?.includes("h-10") ? "h-10" : ""}
            ${sizeClasses2[size]?.includes("h-12") ? "h-12" : ""}
            ${sizeClasses2[size]?.includes("h-16") ? "h-16" : ""}
          ` }, suffix)), error && /* @__PURE__ */ _("p", { id: `${inputId}-error`, className: "text-xs text-[var(--color-danger)] mt-1.5" }, error));
}

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
var sizeClasses3 = {
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
    sizeClasses3[size] || sizeClasses3.md,
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
var Button_default = Button;

// src/renderer/components/ui/FileUpload.jsx
function FileUpload({
  label,
  description,
  accept,
  fileName,
  onChange,
  onClear,
  buttonText = "Choose file...",
  noFileText = "No file selected",
  icon = "bi-upload",
  disabled = false,
  error,
  className = "",
  id,
  ...props
}) {
  const inputRef = A2(null);
  const fileInputId = id || `file-${Math.random().toString(36).substr(2, 9)}`;
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleChange = (e3) => {
    const file = e3.target.files?.[0];
    if (file && onChange) {
      onChange(file, e3);
    }
  };
  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClear?.();
  };
  return /* @__PURE__ */ _("div", { className }, label && /* @__PURE__ */ _(
    "label",
    {
      className: "block text-sm font-medium text-[var(--text-primary)] mb-1.5"
    },
    label
  ), description && /* @__PURE__ */ _("p", { className: "text-xs text-[var(--text-secondary)] mb-2" }, description), /* @__PURE__ */ _("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ _("div", { className: "flex items-stretch gap-0" }, /* @__PURE__ */ _(
    "input",
    {
      ref: inputRef,
      type: "file",
      id: fileInputId,
      accept,
      onChange: handleChange,
      disabled,
      className: "sr-only",
      ...props
    }
  ), /* @__PURE__ */ _(
    "button",
    {
      type: "button",
      onClick: handleClick,
      disabled,
      className: `
              inline-flex items-center gap-2 px-4 h-10
              bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)]
              border border-[var(--border-default)] border-r-0
              rounded-l-lg
              text-sm font-medium text-[var(--text-primary)]
              transition-colors duration-fast
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            `
    },
    /* @__PURE__ */ _("i", { className: `bi ${icon}`, "aria-hidden": "true" }),
    /* @__PURE__ */ _("span", null, buttonText)
  ), /* @__PURE__ */ _("div", { className: `
            flex-1 flex items-center px-3 h-10
            bg-[var(--bg-input)]
            border border-[var(--border-default)]
            rounded-r-lg
            text-sm
            truncate
            ${fileName ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}
          ` }, fileName || noFileText)), fileName && onClear && /* @__PURE__ */ _(
    Button_default,
    {
      variant: "ghost",
      size: "sm",
      icon: "bi-x-circle",
      onClick: handleClear,
      disabled,
      className: "self-start"
    },
    "Clear"
  )), error && /* @__PURE__ */ _("p", { className: "text-xs text-[var(--color-danger)] mt-1.5" }, error));
}

// src/renderer/components/settings/sections/TimerSection.jsx
function TimerSection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-timer" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "Timer"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Configure default timer behavior"), /* @__PURE__ */ _(SettingsGroup, { title: "Defaults" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Default Countdown Time",
      description: "Starting time when app opens"
    },
    /* @__PURE__ */ _("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "defaultHours",
        min: "0",
        max: "23",
        defaultValue: "0",
        className: "w-16 text-center"
      }
    ), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, ":"), /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "defaultMinutes",
        min: "0",
        max: "59",
        defaultValue: "45",
        className: "w-16 text-center"
      }
    ), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, ":"), /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "defaultSeconds",
        min: "0",
        max: "59",
        defaultValue: "0",
        className: "w-16 text-center"
      }
    ))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Auto-Stop at Zero",
      description: "Stop timer when reaching 00:00:00 (if disabled, timer continues into negative time)"
    },
    /* @__PURE__ */ _(Switch, { id: "autoStopAtZero", checked: true })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Auto-Reset After Completion",
      description: "Automatically reset to default time"
    },
    /* @__PURE__ */ _(Switch, { id: "autoReset" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Sound on Timer End",
      description: "Play notification sound when timer reaches 00:00"
    },
    /* @__PURE__ */ _(Switch, { id: "soundNotification" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Custom Sound File",
      description: "Upload a custom sound file (MP3, WAV, OGG) - Leave empty for default beep"
    },
    /* @__PURE__ */ _("div", { className: "space-y-2" }, /* @__PURE__ */ _("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ _(
      FileUpload,
      {
        id: "customSoundFile",
        accept: "audio/*",
        buttonText: "Choose sound file...",
        icon: "bi-volume-up-fill",
        className: "flex-1"
      }
    ), /* @__PURE__ */ _(
      Button,
      {
        id: "clearCustomSound",
        variant: "ghost",
        icon: "bi-x-circle",
        style: "display: none;"
      },
      "Clear"
    )), /* @__PURE__ */ _("div", { id: "customSoundFileName", className: "text-sm text-[var(--text-secondary)] flex items-center gap-2" }, /* @__PURE__ */ _("i", { className: "bi bi-music-note-beamed" }), /* @__PURE__ */ _("span", null, "No file selected")))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Flash at Zero",
      description: "Flash red background with black text when timer reaches 00:00"
    },
    /* @__PURE__ */ _(Switch, { id: "flashAtZero" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Clock Format",
      description: "Display clock in 12-hour or 24-hour format"
    },
    /* @__PURE__ */ _(Select, { id: "clockFormat", className: "w-48" }, /* @__PURE__ */ _("option", { value: "24h" }, "24-Hour (15:30:45)"), /* @__PURE__ */ _("option", { value: "12h" }, "12-Hour (3:30:45 PM)"))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Warning & Critical States" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Threshold Type",
      description: "Define thresholds by percentage of total time or specific time values"
    },
    /* @__PURE__ */ _(Select, { id: "timerThresholdType", className: "w-48" }, /* @__PURE__ */ _("option", { value: "percentage" }, "Percentage Based"), /* @__PURE__ */ _("option", { value: "time" }, "Time Based"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Warning Threshold",
      description: "Show warning state when remaining time falls below this percentage",
      className: "threshold-percentage"
    },
    /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "warningPercentage",
        defaultValue: "30",
        min: "1",
        max: "99",
        step: "1",
        className: "w-20"
      }
    ), /* @__PURE__ */ _("span", { className: "text-sm text-[var(--text-secondary)]" }, "%"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Critical Threshold",
      description: "Show critical state when remaining time falls below this percentage",
      className: "threshold-percentage"
    },
    /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "criticalPercentage",
        defaultValue: "5",
        min: "1",
        max: "99",
        step: "1",
        className: "w-20"
      }
    ), /* @__PURE__ */ _("span", { className: "text-sm text-[var(--text-secondary)]" }, "%"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Warning Threshold",
      description: "Show warning state when remaining time falls below this time",
      className: "threshold-time hidden"
    },
    /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "warningMinutes",
        defaultValue: "2",
        min: "0",
        max: "59",
        className: "w-16"
      }
    ), /* @__PURE__ */ _("span", { className: "text-xs text-[var(--text-muted)]" }, "Mm"), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, ":"), /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "warningSeconds",
        defaultValue: "0",
        min: "0",
        max: "59",
        className: "w-16"
      }
    ), /* @__PURE__ */ _("span", { className: "text-xs text-[var(--text-muted)]" }, "Ss"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Critical Threshold",
      description: "Show critical state when remaining time falls below this time",
      className: "threshold-time hidden"
    },
    /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "criticalMinutes",
        defaultValue: "0",
        min: "0",
        max: "59",
        className: "w-16"
      }
    ), /* @__PURE__ */ _("span", { className: "text-xs text-[var(--text-muted)]" }, "Mm"), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, ":"), /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "criticalSeconds",
        defaultValue: "30",
        min: "0",
        max: "59",
        className: "w-16"
      }
    ), /* @__PURE__ */ _("span", { className: "text-xs text-[var(--text-muted)]" }, "Ss"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "State Preview",
      description: "How timer states will appear based on your thresholds"
    },
    /* @__PURE__ */ _("div", { className: "timer-state-preview flex gap-3 flex-wrap" }, /* @__PURE__ */ _("div", { className: "state-indicator normal flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("span", { className: "state-color w-3 h-3 rounded-full bg-[var(--color-success)]" }), /* @__PURE__ */ _("div", { className: "state-info text-sm" }, /* @__PURE__ */ _("span", { className: "block font-medium text-[var(--text-primary)]" }, "Normal"), /* @__PURE__ */ _("span", { id: "normalRange", className: "text-xs text-[var(--text-secondary)]" }, "Above 30%"))), /* @__PURE__ */ _("div", { className: "state-indicator warning flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("span", { className: "state-color w-3 h-3 rounded-full bg-[var(--color-warning)]" }), /* @__PURE__ */ _("div", { className: "state-info text-sm" }, /* @__PURE__ */ _("span", { className: "block font-medium text-[var(--text-primary)]" }, "Warning"), /* @__PURE__ */ _("span", { id: "warningRange", className: "text-xs text-[var(--text-secondary)]" }, "5% - 30%"))), /* @__PURE__ */ _("div", { className: "state-indicator critical flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("span", { className: "state-color w-3 h-3 rounded-full bg-[var(--color-danger)]" }), /* @__PURE__ */ _("div", { className: "state-info text-sm" }, /* @__PURE__ */ _("span", { className: "block font-medium text-[var(--text-primary)]" }, "Critical"), /* @__PURE__ */ _("span", { id: "criticalRange", className: "text-xs text-[var(--text-secondary)]" }, "0% - 5%"))), /* @__PURE__ */ _("div", { className: "state-indicator overtime flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("span", { className: "state-color w-3 h-3 rounded-full bg-[var(--color-overtime)]" }), /* @__PURE__ */ _("div", { className: "state-info text-sm" }, /* @__PURE__ */ _("span", { className: "block font-medium text-[var(--text-primary)]" }, "Overtime"), /* @__PURE__ */ _("span", { className: "text-xs text-[var(--text-secondary)]" }, "Negative time"))))
  )));
}
var TimerSection_default = TimerSection;

// src/renderer/components/settings/sections/LayoutsSection.jsx
function LayoutsSection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-layouts" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "Layouts"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Manage custom canvas layouts"), /* @__PURE__ */ _(SettingsGroup, { title: "Layout Creator" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Visual Layout Editor",
      description: "Create and customize layouts with a visual drag-and-drop editor"
    },
    /* @__PURE__ */ _("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ _(
      Button,
      {
        id: "openLayoutCreatorBtn",
        variant: "primary",
        icon: "bi-easel"
      },
      "Open Layout Creator"
    ))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Available Layouts" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Built-in Layouts",
      description: "Default layouts included with the application"
    },
    /* @__PURE__ */ _("div", { className: "layout-list", id: "builtinLayoutsList" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Custom Layouts",
      description: "User-uploaded custom layout files"
    },
    /* @__PURE__ */ _("div", { className: "layout-list", id: "customLayoutsList" }, /* @__PURE__ */ _("div", { className: "p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2" }, /* @__PURE__ */ _("i", { className: "bi bi-info-circle" }), "No custom layouts uploaded yet")),
    /* @__PURE__ */ _("div", { className: "mt-3 hidden", id: "customLayoutsActions" }, /* @__PURE__ */ _(
      Button,
      {
        id: "clearAllCustomLayouts",
        variant: "danger",
        icon: "bi-trash"
      },
      "Clear All Custom Layouts"
    ))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Upload Custom Layout" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Import Layout",
      description: "Upload a custom layout JSON file"
    },
    /* @__PURE__ */ _("div", { className: "space-y-3" }, /* @__PURE__ */ _(
      FileUpload,
      {
        id: "layoutFileInput",
        accept: ".json",
        buttonText: "Choose layout file...",
        icon: "bi-upload"
      }
    ), /* @__PURE__ */ _("div", { id: "layoutFileName", className: "text-sm text-[var(--text-secondary)] hidden" }, /* @__PURE__ */ _("i", { className: "bi bi-file-earmark-code mr-2" }), /* @__PURE__ */ _("span", null, "No file selected")), /* @__PURE__ */ _("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ _(
      Button,
      {
        id: "uploadLayoutBtn",
        variant: "primary",
        icon: "bi-plus-circle",
        disabled: true
      },
      "Add Layout"
    ), /* @__PURE__ */ _(
      Button,
      {
        id: "validateLayoutBtn",
        variant: "ghost",
        icon: "bi-check-circle",
        disabled: true
      },
      "Validate"
    ), /* @__PURE__ */ _(
      Button,
      {
        id: "downloadSampleBtn",
        variant: "ghost",
        icon: "bi-download"
      },
      "Download Sample"
    )))
  )));
}
var LayoutsSection_default = LayoutsSection;

// src/renderer/components/settings/sections/PerformanceSection.jsx
function PerformanceSection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-performance" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "Performance"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Optimize performance and resource usage"), /* @__PURE__ */ _(SettingsGroup, { title: "Rendering Quality" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Canvas Quality",
      description: "Rendering quality affects GPU usage and visual smoothness"
    },
    /* @__PURE__ */ _(Select, { id: "canvasQuality", className: "w-48" }, /* @__PURE__ */ _("option", { value: "high" }, "High \u2014 Best quality, smooth anti-aliasing"), /* @__PURE__ */ _("option", { value: "balanced" }, "Balanced \u2014 Good quality, moderate resources"), /* @__PURE__ */ _("option", { value: "performance" }, "Performance \u2014 Fastest, minimal anti-aliasing"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Frame Rate",
      description: "Higher frame rates use more CPU/GPU"
    },
    /* @__PURE__ */ _(Select, { id: "frameRate", className: "w-48" }, /* @__PURE__ */ _("option", { value: "30" }, "30 FPS (Battery Saver)"), /* @__PURE__ */ _("option", { value: "60" }, "60 FPS (Recommended)"), /* @__PURE__ */ _("option", { value: "120" }, "120 FPS (High Performance)"))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Optimization" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Hardware Acceleration",
      description: "Use GPU for rendering (recommended, requires restart)"
    },
    /* @__PURE__ */ _(Switch, { id: "hardwareAcceleration", checked: true })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Reduce Motion",
      description: "Minimize animations for better performance"
    },
    /* @__PURE__ */ _(Switch, { id: "reduceMotion" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Low Power Mode",
      description: "Reduce resource usage for battery saving (caps at 30 FPS)"
    },
    /* @__PURE__ */ _(Switch, { id: "lowPowerMode" })
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Performance Monitoring" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Current Performance",
      description: "Real-time rendering statistics"
    },
    /* @__PURE__ */ _("div", { id: "performanceStats", className: "mt-2 p-3 rounded-lg bg-[var(--bg-surface-raised)] font-mono text-xs space-y-1" }, /* @__PURE__ */ _("div", { className: "flex justify-between" }, /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, "FPS:"), /* @__PURE__ */ _("span", { id: "statFPS", className: "text-[var(--text-primary)]" }, "--")), /* @__PURE__ */ _("div", { className: "flex justify-between" }, /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, "Render Time:"), /* @__PURE__ */ _("span", { id: "statRenderTime", className: "text-[var(--text-primary)]" }, "--")), /* @__PURE__ */ _("div", { className: "flex justify-between" }, /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, "Dropped Frames:"), /* @__PURE__ */ _("span", { id: "statDroppedFrames", className: "text-[var(--text-primary)]" }, "--")), /* @__PURE__ */ _("div", { className: "flex justify-between" }, /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, "Cache Size:"), /* @__PURE__ */ _("span", { id: "statCacheSize", className: "text-[var(--text-primary)]" }, "--")))
  )));
}
var PerformanceSection_default = PerformanceSection;

// src/renderer/components/settings/sections/VideoInputSection.jsx
function VideoInputSection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-video-input" }, /* @__PURE__ */ _("div", { className: "flex items-center gap-3 mb-2" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)]" }, "Video Input"), /* @__PURE__ */ _(
    "span",
    {
      id: "videoStatus",
      className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]"
    },
    /* @__PURE__ */ _("i", { className: "bi bi-circle-fill text-[8px]" }),
    /* @__PURE__ */ _("span", null, "Inactive")
  )), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Configure HDMI capture card settings"), /* @__PURE__ */ _(SettingsGroup, { title: "Device" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Capture Device",
      description: "Select your HDMI capture card"
    },
    /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _(Select, { id: "videoDeviceSelector", className: "w-56", disabled: true }, /* @__PURE__ */ _("option", { value: "" }, "No devices detected")), /* @__PURE__ */ _(
      Button,
      {
        id: "detectDevices",
        variant: "secondary",
        icon: "bi-arrow-clockwise"
      },
      "Detect"
    ))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      id: "videoPreviewSection",
      className: "hidden",
      title: "Live Preview",
      description: ""
    },
    /* @__PURE__ */ _(
      Button,
      {
        id: "togglePreview",
        variant: "success",
        size: "sm",
        icon: "bi-play-circle-fill",
        className: "mb-3"
      },
      "Start Preview"
    ),
    /* @__PURE__ */ _(
      "div",
      {
        className: "video-preview w-full aspect-video bg-[var(--bg-inset)] rounded-lg flex items-center justify-center text-[var(--text-secondary)]",
        id: "videoPreview"
      },
      /* @__PURE__ */ _("span", null, 'Click "Start Preview" to view device')
    )
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Release Camera When Not in Use",
      description: "Free camera resources on non-video layouts"
    },
    /* @__PURE__ */ _(Switch, { id: "releaseCameraIdle", checked: true })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Mirror Video",
      description: "Flip video horizontally (useful for webcams)"
    },
    /* @__PURE__ */ _(Switch, { id: "mirrorVideo" })
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Quality" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Video Resolution",
      description: "Preferred capture resolution"
    },
    /* @__PURE__ */ _(Select, { id: "videoResolution", className: "w-48" }, /* @__PURE__ */ _("option", { value: "1920x1080" }, "1920\xD71080 (1080p)"), /* @__PURE__ */ _("option", { value: "1280x720" }, "1280\xD7720 (720p)"), /* @__PURE__ */ _("option", { value: "auto" }, "Auto"))
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Video Scaling",
      description: "How video fits the display area"
    },
    /* @__PURE__ */ _(Select, { id: "videoScaling", className: "w-48" }, /* @__PURE__ */ _("option", { value: "contain" }, "Contain (fit inside)"), /* @__PURE__ */ _("option", { value: "cover" }, "Cover (fill, may crop)"), /* @__PURE__ */ _("option", { value: "stretch" }, "Stretch (fill exactly)"), /* @__PURE__ */ _("option", { value: "none" }, "None (original size)"))
  )));
}
var VideoInputSection_default = VideoInputSection;

// src/renderer/components/settings/sections/ApiSection.jsx
function ApiSection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-api" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "API & Integration"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Configure unified API system with REST, WebSocket, and OSC protocols"), /* @__PURE__ */ _(SettingsGroup, { title: "Unified API Server" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Enable Unified API Server",
      description: "Multi-protocol API server with REST HTTP, WebSocket, and OSC support for external control"
    },
    /* @__PURE__ */ _(Switch, { id: "companionServerEnabled" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Server Port",
      description: "Port number for API server (requires restart)"
    },
    /* @__PURE__ */ _(
      Input,
      {
        type: "number",
        id: "companionServerPort",
        min: "1024",
        max: "65535",
        defaultValue: "9999",
        className: "w-24"
      }
    )
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Server Status",
      description: "Current status and endpoint information"
    },
    /* @__PURE__ */ _("div", { className: "server-status-container space-y-3" }, /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _("span", { id: "apiStatusDot", className: "w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" }), /* @__PURE__ */ _("span", { id: "apiStatusText", className: "text-sm text-[var(--text-secondary)]" }, "Checking...")), /* @__PURE__ */ _("div", { id: "apiEndpoints", className: "hidden space-y-2" }, /* @__PURE__ */ _("div", { className: "endpoint-item flex items-center gap-2 text-sm" }, /* @__PURE__ */ _("strong", { className: "text-[var(--text-primary)]" }, "REST API:"), /* @__PURE__ */ _("code", { id: "apiHttpEndpoint", className: "px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs" }, "http://localhost:9999/api"), /* @__PURE__ */ _(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "copy-btn p-1",
        "data-copy-target": "apiHttpEndpoint",
        icon: "bi-clipboard"
      }
    )), /* @__PURE__ */ _("div", { className: "endpoint-item flex items-center gap-2 text-sm" }, /* @__PURE__ */ _("strong", { className: "text-[var(--text-primary)]" }, "WebSocket:"), /* @__PURE__ */ _("code", { id: "apiWsEndpoint", className: "px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs" }, "ws://localhost:8080"), /* @__PURE__ */ _(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "copy-btn p-1",
        "data-copy-target": "apiWsEndpoint",
        icon: "bi-clipboard"
      }
    )), /* @__PURE__ */ _("div", { className: "endpoint-item flex items-center gap-2 text-sm" }, /* @__PURE__ */ _("strong", { className: "text-[var(--text-primary)]" }, "OSC Control:"), /* @__PURE__ */ _("code", { id: "apiOscEndpoint", className: "px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs" }, "osc://localhost:7000"), /* @__PURE__ */ _(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "copy-btn p-1",
        "data-copy-target": "apiOscEndpoint",
        icon: "bi-clipboard"
      }
    ))), /* @__PURE__ */ _(
      Button,
      {
        id: "testApiConnection",
        variant: "ghost",
        size: "sm",
        icon: "bi-arrow-repeat"
      },
      "Test Connection"
    ))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "API Documentation" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Available Endpoints",
      description: "REST API endpoints for timer control"
    },
    /* @__PURE__ */ _("div", { className: "api-docs space-y-2" }, /* @__PURE__ */ _(ApiEndpoint, { method: "GET", path: "/api/timer/state", desc: "Get timer state with warning levels & colors" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/timer/start", desc: "Start the timer" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/timer/stop", desc: "Stop/pause the timer" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/timer/reset", desc: "Reset timer to last set time" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/timer/set-time", desc: "Set time (hours, minutes, seconds or total seconds)" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/timer/adjust", desc: "Adjust time by \xB1seconds" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/message/show", desc: "Display custom message" }), /* @__PURE__ */ _(ApiEndpoint, { method: "POST", path: "/api/layout/change", desc: "Change timer layout" })),
    /* @__PURE__ */ _(
      Button,
      {
        id: "openApiDocs",
        variant: "ghost",
        icon: "bi-book",
        className: "mt-4"
      },
      "View Full Documentation"
    )
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Protocol Support" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Available Protocols",
      description: "Multiple communication protocols for different integration needs"
    },
    /* @__PURE__ */ _("div", { className: "protocol-list space-y-2 text-sm" }, /* @__PURE__ */ _("div", { className: "p-2 rounded bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("strong", { className: "text-[var(--text-primary)]" }, "REST HTTP API"), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, " - Standard web API for custom applications and web integrations")), /* @__PURE__ */ _("div", { className: "p-2 rounded bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("strong", { className: "text-[var(--text-primary)]" }, "WebSocket"), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, " - Real-time bi-directional communication for live updates")), /* @__PURE__ */ _("div", { className: "p-2 rounded bg-[var(--bg-surface-raised)]" }, /* @__PURE__ */ _("strong", { className: "text-[var(--text-primary)]" }, "OSC (Open Sound Control)"), /* @__PURE__ */ _("span", { className: "text-[var(--text-secondary)]" }, " - Professional audio/video control protocol"))),
    /* @__PURE__ */ _("p", { className: "text-xs text-[var(--text-muted)] mt-3" }, "Warning levels and colors are automatically provided in API responses based on your appearance settings.")
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Security" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Allow External Access",
      description: "Allow connections from other devices on the network (not just localhost)"
    },
    /* @__PURE__ */ _(Switch, { id: "companionAllowExternal" })
  ), /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Network Access",
      description: "Local IP addresses for external access"
    },
    /* @__PURE__ */ _("div", { id: "networkAddresses", className: "network-addresses" }, /* @__PURE__ */ _("div", { className: "p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2" }, /* @__PURE__ */ _("i", { className: "bi bi-info-circle" }), "Enable external access to see available network addresses"))
  )));
}
function ApiEndpoint({ method, path, desc }) {
  const methodColors = {
    GET: "bg-[var(--color-success)] text-white",
    POST: "bg-[var(--color-primary)] text-white",
    PUT: "bg-[var(--color-warning)] text-black",
    DELETE: "bg-[var(--color-danger)] text-white"
  };
  return /* @__PURE__ */ _("div", { className: "flex items-center gap-2 text-sm" }, /* @__PURE__ */ _("span", { className: `px-2 py-0.5 rounded text-xs font-semibold ${methodColors[method] || ""}` }, method), /* @__PURE__ */ _("code", { className: "px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs" }, path), /* @__PURE__ */ _("span", { className: "text-[var(--text-muted)] text-xs" }, desc));
}
var ApiSection_default = ApiSection;

// src/renderer/components/settings/sections/AppearanceSection.jsx
function AppearanceSection() {
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-appearance" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "Appearance"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Customize colors and theme"), /* @__PURE__ */ _(SettingsGroup, { title: "Theme" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      title: "Color Theme",
      description: "Choose light or dark appearance"
    },
    /* @__PURE__ */ _(Select, { id: "appearanceTheme", className: "w-40" }, /* @__PURE__ */ _("option", { value: "dark" }, "Dark"), /* @__PURE__ */ _("option", { value: "light" }, "Light"), /* @__PURE__ */ _("option", { value: "auto" }, "Auto (System)"))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Canvas Colors" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Text & Element Colors",
      description: "Customize timer display colors"
    },
    /* @__PURE__ */ _("div", { className: "space-y-4" }, /* @__PURE__ */ _("div", { className: "color-picker-group grid grid-cols-2 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ _(ColorPickerItem, { id: "countdownColor", label: "Timer", defaultValue: "#ffffff" })), /* @__PURE__ */ _("div", { className: "flex items-center justify-between py-3 border-y border-[var(--border-muted)]" }, /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("div", { className: "text-sm font-medium text-[var(--text-primary)]" }, "Match Timer Color"), /* @__PURE__ */ _("div", { className: "text-xs text-[var(--text-secondary)]" }, "Make countdown timer color match the progress bar color")), /* @__PURE__ */ _(Switch, { id: "matchTimerColor" })), /* @__PURE__ */ _("div", { id: "otherColorPickers", className: "color-picker-group grid grid-cols-2 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ _(ColorPickerItem, { id: "clockColor", label: "Clock", defaultValue: "#808080" }), /* @__PURE__ */ _(ColorPickerItem, { id: "elapsedColor", label: "Elapsed", defaultValue: "#808080" }), /* @__PURE__ */ _(ColorPickerItem, { id: "messageColor", label: "Message", defaultValue: "#ffffff" }), /* @__PURE__ */ _(ColorPickerItem, { id: "messageBackgroundColor", label: "Message Background", defaultValue: "#000000" }), /* @__PURE__ */ _(ColorPickerItem, { id: "separatorColor", label: "Separator", defaultValue: "#333333" }), /* @__PURE__ */ _(ColorPickerItem, { id: "backgroundColor", label: "Background", defaultValue: "#000000" })), /* @__PURE__ */ _(
      Button,
      {
        id: "resetDisplayColors",
        variant: "ghost",
        icon: "bi-arrow-clockwise"
      },
      "Reset to Default"
    ))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Progress Bar Colors" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Progress & Warning Colors",
      description: "Colors for progress bar and warning levels based on time remaining. Timer colors will match these when 'Match Timer Color' is enabled."
    },
    /* @__PURE__ */ _("div", { className: "space-y-4" }, /* @__PURE__ */ _("div", { className: "color-picker-group grid grid-cols-2 gap-3" }, /* @__PURE__ */ _(ColorPickerItem, { id: "progressSuccess", label: "Normal (30-100% remaining)", defaultValue: "#4ade80" }), /* @__PURE__ */ _(ColorPickerItem, { id: "progressWarning", label: "Warning (5-30% remaining)", defaultValue: "#f59e0b" }), /* @__PURE__ */ _(ColorPickerItem, { id: "progressDanger", label: "Critical (0-5% remaining)", defaultValue: "#ef4444" }), /* @__PURE__ */ _(ColorPickerItem, { id: "progressOvertime", label: "Overtime (negative time)", defaultValue: "#991b1b" })), /* @__PURE__ */ _(
      Button,
      {
        id: "resetProgressColors",
        variant: "ghost",
        icon: "bi-arrow-clockwise"
      },
      "Reset to Default"
    ))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Cover Image" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Cover Image Overlay",
      description: "Display a custom image that covers the entire display (highest layer, toggle via main UI button)"
    },
    /* @__PURE__ */ _("div", { className: "feature-image-controls space-y-3" }, /* @__PURE__ */ _(
      "div",
      {
        id: "coverImagePreview",
        className: "feature-image-preview aspect-video w-full max-w-sm rounded-lg bg-[var(--bg-inset)] flex items-center justify-center overflow-hidden"
      },
      /* @__PURE__ */ _("div", { className: "feature-image-placeholder text-center p-4" }, /* @__PURE__ */ _("i", { className: "bi bi-image text-4xl text-[var(--border)]" }), /* @__PURE__ */ _("p", { className: "mt-2 text-sm text-[var(--text-secondary)]" }, "No image selected"))
    ), /* @__PURE__ */ _("div", { className: "flex gap-2" }, /* @__PURE__ */ _(
      Button,
      {
        id: "selectCoverImage",
        variant: "ghost",
        icon: "bi-folder-open"
      },
      "Select Image"
    ), /* @__PURE__ */ _(
      Button,
      {
        id: "clearCoverImage",
        variant: "ghost",
        icon: "bi-trash",
        disabled: true
      },
      "Clear Image"
    )))
  )), /* @__PURE__ */ _(SettingsGroup, { title: "Background Image" }, /* @__PURE__ */ _(
    SettingsItem,
    {
      block: true,
      title: "Background Image",
      description: "Display a background image that is always visible (lowest layer, behind all elements)"
    },
    /* @__PURE__ */ _("div", { className: "feature-image-controls space-y-3" }, /* @__PURE__ */ _(
      "div",
      {
        id: "backgroundImagePreview",
        className: "feature-image-preview aspect-video w-full max-w-sm rounded-lg bg-[var(--bg-inset)] flex items-center justify-center overflow-hidden"
      },
      /* @__PURE__ */ _("div", { className: "feature-image-placeholder text-center p-4" }, /* @__PURE__ */ _("i", { className: "bi bi-image text-4xl text-[var(--border)]" }), /* @__PURE__ */ _("p", { className: "mt-2 text-sm text-[var(--text-secondary)]" }, "No image selected"))
    ), /* @__PURE__ */ _("div", { className: "flex gap-2" }, /* @__PURE__ */ _(
      Button,
      {
        id: "selectBackgroundImage",
        variant: "ghost",
        icon: "bi-folder-open"
      },
      "Select Image"
    ), /* @__PURE__ */ _(
      Button,
      {
        id: "clearBackgroundImage",
        variant: "ghost",
        icon: "bi-trash",
        disabled: true
      },
      "Clear Image"
    )))
  )));
}
function ColorPickerItem({ id, label, defaultValue }) {
  return /* @__PURE__ */ _("div", { className: "color-picker-item" }, /* @__PURE__ */ _("label", { className: "block text-xs text-[var(--text-secondary)] mb-1.5" }, label), /* @__PURE__ */ _("div", { className: "color-input-wrapper" }, /* @__PURE__ */ _(
    "input",
    {
      type: "color",
      id,
      defaultValue,
      className: "w-10 h-10 rounded-lg cursor-pointer border border-[var(--border-default)] bg-transparent"
    }
  )));
}
var AppearanceSection_default = AppearanceSection;

// src/renderer/components/settings/sections/ShortcutsSection.jsx
var DEFAULT_SHORTCUTS = {
  "space": { enabled: true, key: "space", description: "Start/Stop timer" },
  "r": { enabled: true, key: "r", description: "Reset timer" },
  "arrowup": { enabled: true, key: "arrowup", description: "Add one minute" },
  "arrowdown": { enabled: true, key: "arrowdown", description: "Subtract one minute" },
  "shift+arrowup": { enabled: true, key: "shift+arrowup", description: "Add 5 minutes" },
  "shift+arrowdown": { enabled: true, key: "shift+arrowdown", description: "Subtract 5 minutes" },
  "ctrl+arrowup": { enabled: true, key: "ctrl+arrowup", description: "Add 10 minutes" },
  "ctrl+arrowdown": { enabled: true, key: "ctrl+arrowdown", description: "Subtract 10 minutes" },
  "f": { enabled: true, key: "f", description: "Flash screen" },
  "m": { enabled: true, key: "m", description: "Toggle sound mute" },
  "i": { enabled: true, key: "i", description: "Toggle feature image" },
  "1": { enabled: true, key: "1", description: "Activate preset 1" },
  "2": { enabled: true, key: "2", description: "Activate preset 2" },
  "3": { enabled: true, key: "3", description: "Activate preset 3" },
  "4": { enabled: true, key: "4", description: "Activate preset 4" },
  "5": { enabled: true, key: "5", description: "Activate preset 5" },
  "6": { enabled: true, key: "6", description: "Activate preset 6" },
  "7": { enabled: true, key: "7", description: "Activate preset 7" },
  "8": { enabled: true, key: "8", description: "Activate preset 8" }
};
var SHORTCUT_GROUPS = [
  {
    title: "Timer Controls",
    keys: ["space", "r", "arrowup", "arrowdown", "shift+arrowup", "shift+arrowdown", "ctrl+arrowup", "ctrl+arrowdown"]
  },
  {
    title: "Actions",
    keys: ["f", "m", "i"]
  },
  {
    title: "Presets",
    keys: ["1", "2", "3", "4", "5", "6", "7", "8"]
  }
];
function formatKey(key) {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return key.split("+").map((k3) => {
    if (isMac && k3 === "ctrl")
      return "\u2303";
    if (isMac && k3 === "alt")
      return "\u2325";
    if (isMac && k3 === "shift")
      return "\u21E7";
    if (isMac && k3 === "meta")
      return "\u2318";
    if (k3 === "arrowup")
      return "\u2191";
    if (k3 === "arrowdown")
      return "\u2193";
    if (k3 === "arrowleft")
      return "\u2190";
    if (k3 === "arrowright")
      return "\u2192";
    if (k3 === "space")
      return "Space";
    return k3.charAt(0).toUpperCase() + k3.slice(1);
  }).join(" ");
}
function ShortcutRow({ shortcutKey, config, onToggle }) {
  return /* @__PURE__ */ _("div", { className: "flex items-center justify-between gap-4 py-3 px-5 border-b border-[var(--border-muted)] last:border-b-0" }, /* @__PURE__ */ _("div", { className: "flex items-center gap-3 flex-1 min-w-0" }, /* @__PURE__ */ _("kbd", { className: "inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md text-xs font-mono text-[var(--text-primary)] shadow-sm" }, formatKey(shortcutKey)), /* @__PURE__ */ _("span", { className: `text-sm ${config.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}` }, config.description)), /* @__PURE__ */ _("label", { className: "relative inline-flex items-center cursor-pointer" }, /* @__PURE__ */ _(
    "input",
    {
      type: "checkbox",
      checked: config.enabled,
      onChange: () => onToggle(shortcutKey),
      className: "sr-only",
      role: "switch"
    }
  ), /* @__PURE__ */ _("div", { className: `w-11 h-6 rounded-full transition-colors duration-200 ${config.enabled ? "bg-[var(--color-primary)]" : "bg-[var(--bg-muted)]"}` }, /* @__PURE__ */ _(
    "div",
    {
      className: "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200",
      style: {
        transform: config.enabled ? "translate(21px, 2px)" : "translate(2px, 2px)"
      }
    }
  ))));
}
function ShortcutsSection() {
  const [shortcuts, setShortcuts] = d2(DEFAULT_SHORTCUTS);
  y2(() => {
    loadShortcuts();
  }, []);
  async function loadShortcuts() {
    try {
      if (window.electron && window.electron.settings) {
        const settings = await window.electron.settings.getAll();
        if (settings.keyboardShortcuts) {
          setShortcuts({ ...DEFAULT_SHORTCUTS, ...settings.keyboardShortcuts });
        }
      }
    } catch (error) {
      console.warn("Could not load shortcut settings:", error);
    }
  }
  async function handleToggle(key) {
    const updated = {
      ...shortcuts,
      [key]: { ...shortcuts[key], enabled: !shortcuts[key].enabled }
    };
    setShortcuts(updated);
    try {
      if (window.electron && window.electron.settings) {
        await window.electron.settings.save("keyboardShortcuts", updated);
      }
    } catch (error) {
      console.error("Error saving shortcut settings:", error);
    }
  }
  async function handleEnableAll() {
    const updated = {};
    for (const [key, config] of Object.entries(shortcuts)) {
      updated[key] = { ...config, enabled: true };
    }
    setShortcuts(updated);
    try {
      if (window.electron && window.electron.settings) {
        await window.electron.settings.save("keyboardShortcuts", updated);
      }
    } catch (error) {
      console.error("Error saving shortcut settings:", error);
    }
  }
  async function handleDisableAll() {
    const updated = {};
    for (const [key, config] of Object.entries(shortcuts)) {
      updated[key] = { ...config, enabled: false };
    }
    setShortcuts(updated);
    try {
      if (window.electron && window.electron.settings) {
        await window.electron.settings.save("keyboardShortcuts", updated);
      }
    } catch (error) {
      console.error("Error saving shortcut settings:", error);
    }
  }
  const enabledCount = Object.values(shortcuts).filter((s3) => s3.enabled).length;
  const totalCount = Object.keys(shortcuts).length;
  return /* @__PURE__ */ _("div", { className: "settings-section", id: "section-shortcuts" }, /* @__PURE__ */ _("h1", { className: "text-2xl font-semibold text-[var(--text-primary)] mb-2" }, "Keyboard Shortcuts"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mb-6" }, "Configure keyboard shortcuts for the timer controls. ", enabledCount, "/", totalCount, " shortcuts enabled."), /* @__PURE__ */ _("div", { className: "flex gap-2 mb-6" }, /* @__PURE__ */ _(
    "button",
    {
      onClick: handleEnableAll,
      className: "px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
    },
    "Enable All"
  ), /* @__PURE__ */ _(
    "button",
    {
      onClick: handleDisableAll,
      className: "px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
    },
    "Disable All"
  )), SHORTCUT_GROUPS.map((group) => /* @__PURE__ */ _(SettingsGroup, { key: group.title, title: group.title }, group.keys.map((key) => shortcuts[key] && /* @__PURE__ */ _(
    ShortcutRow,
    {
      key,
      shortcutKey: key,
      config: shortcuts[key],
      onToggle: handleToggle
    }
  )))));
}
var ShortcutsSection_default = ShortcutsSection;

// src/renderer/components/settings/sections/AboutSection.jsx
function AboutSection() {
  const [version, setVersion] = d2("1.0.0");
  y2(() => {
    window.electron?.getVersion?.().then((v3) => v3 && setVersion(v3));
  }, []);
  return /* @__PURE__ */ _("div", { className: "flex flex-col items-center text-center gap-6 py-8" }, /* @__PURE__ */ _(
    "img",
    {
      src: "../../../assets/rocket-icon_transparent.png",
      alt: "Rocket Timer",
      className: "w-28 h-28 object-contain"
    }
  ), /* @__PURE__ */ _("div", null, /* @__PURE__ */ _("h1", { className: "text-2xl font-bold text-[var(--text-primary)]" }, "Rocket Timer"), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] mt-1" }, "Version ", version)), /* @__PURE__ */ _("p", { className: "text-sm text-[var(--text-secondary)] max-w-sm" }, "The ultimate timer app for events."), /* @__PURE__ */ _("div", { className: "text-xs text-[var(--text-muted)] space-y-1" }, /* @__PURE__ */ _("p", null, "\xA9 2026 50hz Event Solutions"), /* @__PURE__ */ _("p", null, /* @__PURE__ */ _(
    "a",
    {
      href: "mailto:geral@50-hz.com",
      className: "text-[var(--accent)] hover:underline"
    },
    "geral@50-hz.com"
  )), /* @__PURE__ */ _("p", { className: "mt-2" }, "Licensed under the GNU GPL-3.0"), /* @__PURE__ */ _("p", { className: "mt-3 text-[var(--text-secondary)]" }, "Made with \u2764\uFE0F by Andr\xE9 Raimundo")));
}
var AboutSection_default = AboutSection;

// src/renderer/components/settings/SettingsApp.jsx
var SECTIONS = [
  { id: "display", label: "Display", icon: "bi-tv" },
  { id: "timer", label: "Timer", icon: "bi-stopwatch" },
  { id: "layouts", label: "Layouts", icon: "bi-layout-text-window-reverse" },
  { id: "performance", label: "Performance", icon: "bi-lightning" },
  { id: "video-input", label: "Video Input", icon: "bi-camera-video" },
  { id: "api", label: "API & Integration", icon: "bi-plug" },
  { id: "shortcuts", label: "Shortcuts", icon: "bi-keyboard" },
  { id: "appearance", label: "Appearance", icon: "bi-palette" },
  { id: "about", label: "About", icon: "bi-info-circle" }
];
var SECTION_COMPONENTS = {
  "display": DisplaySection_default,
  "timer": TimerSection_default,
  "layouts": LayoutsSection_default,
  "performance": PerformanceSection_default,
  "video-input": VideoInputSection_default,
  "api": ApiSection_default,
  "shortcuts": ShortcutsSection_default,
  "appearance": AppearanceSection_default,
  "about": AboutSection_default
};
function SettingsApp() {
  const [activeSection, setActiveSection] = d2("display");
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };
  const renderAllSections = () => {
    return Object.entries(SECTION_COMPONENTS).map(([id, SectionComponent]) => /* @__PURE__ */ _(
      "div",
      {
        key: id,
        style: { display: activeSection === id ? "block" : "none" }
      },
      /* @__PURE__ */ _(SectionComponent, null)
    ));
  };
  return /* @__PURE__ */ _("div", { className: "settings-container flex h-screen" }, /* @__PURE__ */ _(
    Sidebar,
    {
      items: SECTIONS,
      activeId: activeSection,
      onSelect: handleSectionChange,
      header: /* @__PURE__ */ _("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ _(
        "img",
        {
          src: "../../../assets/rocket-icon_transparent.png",
          alt: "",
          className: "w-7 h-7 object-contain"
        }
      ), /* @__PURE__ */ _("span", { className: "text-sm font-semibold text-[var(--text-primary)]" }, "Preferences"))
    }
  ), /* @__PURE__ */ _("main", { className: "settings-content flex-1 overflow-y-auto" }, /* @__PURE__ */ _("div", { className: "settings-content-inner p-8 max-w-3xl" }, renderAllSections())));
}

// src/renderer/settings.jsx
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
function init() {
  const root = document.getElementById("settings-root");
  if (root) {
    G(/* @__PURE__ */ _(SettingsApp, null), root);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("preact-settings-ready"));
    }, 0);
  }
}
