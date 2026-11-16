// Fast CommonMark 0.31.2 + GFM 0.29 Markdown parser.
// parse(markdown) returns exactly the HTML marked 18.1.3 renders with its
// default options (GFM on, async off). Dependency-free, single module.
// Architecture: a block parser builds a small tree (collecting link reference
// definitions), then a direct renderer walks it; inline content is rendered
// straight to a string by a hand-rolled scanner (no token objects).

// ------------------------------------------------------------------ entities

// Named entities that occur in the CommonMark spec examples and the GFM
// generated documents, plus the common Latin-1 / symbol set for safety.
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©',
  reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘',
  rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', dagger: '†',
  Dagger: '‡', bull: '•', permil: '‰', prime: '′', Prime: '″', oline: '‾',
  frasl: '⁄', euro: '€', pound: '£', yen: '¥', cent: '¢', curren: '¤',
  brvbar: '¦', uml: '¨', ordf: 'ª', ordm: 'º', iexcl: '¡', iquest: '¿',
  not: '¬', shy: '­', macr: '¯', acute: '´', cedil: '¸', sup1: '¹',
  sup2: '²', sup3: '³', times: '×', divide: '÷', minus: '−', lowast: '∗',
  radic: '√', infin: '∞', cap: '∩', cup: '∪', int: '∫', sim: '∼',
  cong: '≅', asymp: '≈', ne: '≠', equiv: '≡', le: '≤', ge: '≥',
  sub: '⊂', sup: '⊃', nsub: '⊄', sube: '⊆', supe: '⊇', oplus: '⊕',
  otimes: '⊗', perp: '⊥', sdot: '⋅', lceil: '⌈', rceil: '⌉', lfloor: '⌊',
  rfloor: '⌋', lang: '⟨', rang: '⟩', loz: '◊', spades: '♠', clubs: '♣',
  hearts: '♥', diams: '♦', ensp: ' ', emsp: ' ', thinsp: ' ', zwnj: '‌',
  zwj: '‍', lrm: '‎', rlm: '‏', sbquo: '‚', bdquo: '„', circ: 'ˆ',
  tilde: '˜', alefsym: 'ℵ', larr: '←', uarr: '↑', rarr: '→', darr: '↓',
  harr: '↔', crarr: '↵', forall: '∀', part: '∂', exist: '∃', empty: '∅',
  nabla: '∇', isin: '∈', notin: '∉', ni: '∋', prod: '∏', sum: '∑',
  prop: '∝', ang: '∠', and: '∧', or: '∨', there4: '∴', Alpha: 'Α',
  Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η',
  Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν',
  Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ',
  Upsilon: 'Υ', Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω', alpha: 'α',
  beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigmaf: 'ς', sigma: 'σ',
  tau: 'τ', upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  thetasym: 'ϑ', upsih: 'ϒ', piv: 'ϖ', AElig: 'Æ', aelig: 'æ',
  Aacute: 'Á', aacute: 'á', Acirc: 'Â', acirc: 'â', Agrave: 'À',
  agrave: 'à', Aring: 'Å', aring: 'å', Atilde: 'Ã', atilde: 'ã',
  Auml: 'Ä', auml: 'ä', Ccedil: 'Ç', ccedil: 'ç', Eacute: 'É',
  eacute: 'é', Ecirc: 'Ê', ecirc: 'ê', Egrave: 'È', egrave: 'è',
  Euml: 'Ë', euml: 'ë', Iacute: 'Í', iacute: 'í', Icirc: 'Î',
  icirc: 'î', Igrave: 'Ì', igrave: 'ì', Iuml: 'Ï', iuml: 'ï',
  Ntilde: 'Ñ', ntilde: 'ñ', Oacute: 'Ó', oacute: 'ó', Ocirc: 'Ô',
  ocirc: 'ô', Ograve: 'Ò', ograve: 'ò', Otilde: 'Õ', otilde: 'õ',
  Ouml: 'Ö', ouml: 'ö', Oslash: 'Ø', oslash: 'ø', Uacute: 'Ú',
  uacute: 'ú', Ucirc: 'Û', ucirc: 'û', Ugrave: 'Ù', ugrave: 'ù',
  Uuml: 'Ü', uuml: 'ü', Yacute: 'Ý', yacute: 'ý', yuml: 'ÿ',
  szlig: 'ß', THORN: 'Þ', thorn: 'þ', eth: 'ð', ETH: 'Ð', frac12: '½',
  frac14: '¼', frac34: '¾', plusmn: '±', deg: '°', micro: 'µ',
  middot: '·', para: '¶', sect: '§', Dcaron: 'Ď', dcaron: 'ď',
  HilbertSpace: 'ℋ', DifferentialD: 'ⅆ', ClockwiseContourIntegral: '∲',
  ngE: '≧̸', oelig: 'œ', OElig: 'Œ', scaron: 'š', Scaron: 'Š',
  fnof: 'ƒ', Yuml: 'Ÿ', yacute2: 'ý', 'Tab;': '\t', 'NewLine;': '\n',
};

// ------------------------------------------------------------------ utilities

function escapeHtml(s, encode) {
  // encode=true: escape & < > " '. encode=false (text / href): escape < > " '
  // and & only when it does NOT start a valid-looking entity reference
  // (&word; or &#...; / &#x...;), matching marked's escapeTestNoEncode.
  let out = '';
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s.charCodeAt(i);
    if (c === 38) { // &
      if (encode) { out += '&amp;'; i++; continue; }
      // keep & when followed by #digits; / #x hex; / word;
      let j = i + 1;
      if (s[j] === '#') {
        j++;
        if (s[j] === 'x' || s[j] === 'X') {
          j++;
          let k = j;
          while (k < n && /[A-Fa-f0-9]/.test(s[k]) && k - j < 6) k++;
          if (k > j && s[k] === ';') { out += s.slice(i, k + 1); i = k + 1; continue; }
        } else {
          let k = j;
          while (k < n && s[k] >= '0' && s[k] <= '9' && k - j < 7) k++;
          if (k > j && s[k] === ';') { out += s.slice(i, k + 1); i = k + 1; continue; }
        }
      } else {
        let k = j;
        while (k < n && /[\w]/.test(s[k])) k++;
        if (k > j && s[k] === ';') { out += s.slice(i, k + 1); i = k + 1; continue; }
      }
      out += '&amp;'; i++; continue;
    }
    if (c === 60) { out += '&lt;'; i++; continue; }
    if (c === 62) { out += '&gt;'; i++; continue; }
    if (c === 34) { out += '&quot;'; i++; continue; }
    if (c === 39) { out += '&#39;'; i++; continue; }
    out += s[i]; i++;
  }
  return out;
}

function isAsciiPunct(ch) {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  return (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
}

const RE_PUNCT = /[\p{P}\p{S}]/u;
// Fast path: ASCII punctuation by range; only non-ASCII chars pay for
// the Unicode-property regex (flanking runs this on every delimiter).
function isPunct(ch) {
  if (ch === '') return false;
  const c = ch.charCodeAt(0);
  if (c < 128) return (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
  return RE_PUNCT.test(ch);
}
function isSpace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}
// Fast path: ASCII whitespace by direct check; only non-ASCII chars pay
// for the /\s/ regex.
function isWhitespace(ch) {
  if (ch === '') return false;
  const c = ch.charCodeAt(0);
  if (c < 128) return c === 32 || c === 9 || c === 10 || c === 13 || c === 12 || c === 11;
  return /\s/.test(ch);
}

// Decode numeric character references only (marked's `Ie`): &#123; and
// &#x1F; become the character (or U+FFFD when invalid). Named entities are
// NOT decoded by marked anywhere -- they pass through untouched.
function decodeNumericRefs(s) {
  if (s.indexOf('&') === -1) return s;
  return s.replace(/&#(\d{1,7}|[Xx][A-Fa-f0-9]{1,6});/g, (m, body) => {
    let cp;
    if (body[0] === 'x' || body[0] === 'X') cp = parseInt(body.slice(1), 16);
    else cp = parseInt(body, 10);
    if (!cp || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) return '�';
    return String.fromCodePoint(cp);
  });
}

function normalizeLabel(label) {
  return label.trim().replace(/\s+/g, ' ').toLowerCase().toUpperCase().toLowerCase();
}

function encodeUrl(href) {
  try { return encodeURI(href).replace(/%25/g, '%'); } catch (e) { return null; }
}

// __APPEND_POINT__

// ------------------------------------------------------------------ inline
// Node types: 0 text, 1 em, 2 strong, 3 del, 4 link, 5 image, 6 code,
// 7 html, 8 br, 9 softbreak. Text nodes hold raw source text; rendering
// decodes numeric refs and escapes.

const RE_AUTOLINK_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s\x00-\x1f<>]*/;
const RE_AUTOLINK_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/;
const RE_TAG_OPEN = /^<[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?)*\s*\/?>/;
const RE_TAG_CLOSE = /^<\/[a-zA-Z][a-zA-Z0-9-]*\s*>/;
const RE_COMMENT = /^<!--(?:-?>|[\s\S]*?-->)/;
const RE_PI = /^<\?[\s\S]*?\?>/;
const RE_DECL = /^<![a-zA-Z]+\s[^>]*>/;
const RE_CDATA = /^<!\[CDATA\[[\s\S]*?\]\]>/;

// Find the end of a code span starting at src[i] (a run of backticks).
// Returns {end, text} or null.
function parseCodeSpan(src, i) {
  const n = src.length;
  let j = i;
  while (j < n && src[j] === '`') j++;
  const runLen = j - i;
  const closer = '`'.repeat(runLen);
  // find matching run of exactly runLen backticks
  let k = j;
  while (k < n) {
    const idx = src.indexOf('`', k);
    if (idx === -1) return null;
    let e = idx;
    while (e < n && src[e] === '`') e++;
    const len = e - idx;
    if (len === runLen) {
      let text = src.slice(j, idx).replace(/\n/g, ' ');
      // strip one leading/trailing space if both present and not all spaces
      if (text.length >= 2 && text[0] === ' ' && text[text.length - 1] === ' ' && /[^ ]/.test(text)) {
        text = text.slice(1, -1);
      }
      return { end: e, text };
    }
    k = e;
  }
  return null;
}

// Match an inline HTML tag / comment / PI / declaration / CDATA at src[i].
// Returns the matched string or null.
function matchHtmlTag(src, i) {
  const rest = src.slice(i);
  let m;
  if (rest.startsWith('<!--')) {
    m = RE_COMMENT.exec(rest);
    if (m) return m[0];
    // unterminated comment: CommonMark says it runs to end of line/input
    const nl = rest.indexOf('\n');
    return nl === -1 ? rest : rest.slice(0, nl);
  }
  if (rest.startsWith('<?')) {
    m = RE_PI.exec(rest);
    return m ? m[0] : null;
  }
  if (rest.startsWith('<![CDATA[')) {
    m = RE_CDATA.exec(rest);
    return m ? m[0] : null;
  }
  if (rest.startsWith('<!')) {
    m = RE_DECL.exec(rest);
    return m ? m[0] : null;
  }
  if (rest.startsWith('</')) {
    m = RE_TAG_CLOSE.exec(rest);
    return m ? m[0] : null;
  }
  m = RE_TAG_OPEN.exec(rest);
  return m ? m[0] : null;
}

// Match an autolink <...> at src[i]. Returns {end, href, text} or null.
function matchAutolink(src, i) {
  // src[i] === '<'
  const rest = src.slice(i + 1);
  const gt = rest.indexOf('>');
  if (gt === -1) return null;
  const inner = rest.slice(0, gt);
  if (inner.indexOf(' ') !== -1 || inner.indexOf('\n') !== -1 || inner === '') return null;
  // scheme:...
  const m = RE_AUTOLINK_SCHEME.exec(inner);
  if (m && m[0] === inner) {
    return { end: i + 1 + gt + 1, href: inner, text: inner };
  }
  // email
  const em = RE_AUTOLINK_EMAIL.exec(inner);
  if (em && em[0] === inner) {
    return { end: i + 1 + gt + 1, href: 'mailto:' + inner, text: inner };
  }
  return null;
}

// Parse a link destination starting at src[i] (after '(' or after '[' label).
// Returns {dest, end} where end is the index just past the destination, or null.
function parseLinkDest(src, i) {
  const n = src.length;
  let j = i;
  while (j < n && (src[j] === ' ' || src[j] === '\t' || src[j] === '\n')) j++;
  if (j >= n) return null;
  if (src[j] === '<') {
    // <...> destination, may contain spaces, no unescaped < or newline
    let k = j + 1;
    let out = '';
    while (k < n && src[k] !== '>') {
      if (src[k] === '\n') return null;
      if (src[k] === '\\' && k + 1 < n && isAsciiPunct(src[k + 1])) { out += src[k + 1]; k += 2; continue; }
      if (src[k] === '<') return null;
      out += src[k]; k++;
    }
    if (k >= n) return null;
    return { dest: out, end: k + 1 };
  }
  // bare destination: no spaces/control chars, balanced parens
  let depth = 0;
  let k = j;
  let out = '';
  while (k < n) {
    const c = src[k];
    if (c === ' ' || c === '\t' || c === '\n' || c.charCodeAt(0) < 32) break;
    if (c === '\\' && k + 1 < n && isAsciiPunct(src[k + 1])) { out += src[k + 1]; k += 2; continue; }
    if (c === '(') { depth++; out += c; k++; continue; }
    if (c === ')') {
      if (depth === 0) break;
      depth--; out += c; k++; continue;
    }
    out += c; k++;
  }
  if (k === j) return null; // empty destination (but "()" is allowed as empty? handled by caller)
  return { dest: out, end: k };
}

// Parse a link title starting at src[i]. Returns {title, end} or null.
// Title must be "..." or '...' or (...).
function parseLinkTitle(src, i) {
  const n = src.length;
  let j = i;
  while (j < n && (src[j] === ' ' || src[j] === '\t' || src[j] === '\n')) j++;
  if (j >= n) return null;
  const q = src[j];
  if (q !== '"' && q !== "'" && q !== '(') return null;
  const close = q === '(' ? ')' : q;
  let k = j + 1;
  let out = '';
  while (k < n) {
    const c = src[k];
    if (c === '\\' && k + 1 < n && isAsciiPunct(src[k + 1])) { out += src[k + 1]; k += 2; continue; }
    if (c === close) return { title: out, end: k + 1 };
    if (q === "'" && c === '\n') {
      // single-quoted title may span lines but not blank lines
      if (src[k + 1] === '\n') return null;
    }
    if (q === '"' && c === '\n') return null;
    if (q === '(' && c === '(') return null;
    out += c; k++;
  }
  return null;
}

// Find the matching ']' for a '[' at src[i], accounting for nested brackets
// and code spans. Returns the index of ']' or -1.
function findClosingBracket(src, i) {
  const n = src.length;
  let depth = 0;
  let k = i;
  while (k < n) {
    const c = src[k];
    if (c === '\\') { k += 2; continue; }
    if (c === '`') {
      const cs = parseCodeSpan(src, k);
      if (cs) { k = cs.end; continue; }
      k++; continue;
    }
    if (c === '[') { depth++; k++; continue; }
    if (c === ']') {
      depth--;
      if (depth === 0) return k;
      k++; continue;
    }
    k++;
  }
  return -1;
}

// Parse inline content to an HTML string. links is the reference map
// (label -> {href, title}). This is the CommonMark delimiter-stack
// algorithm, rendering directly (no token objects).
// Recursively check whether a node list contains a real markdown link
// (t===4 without autolink). Autolinks (GFM url/email and <...>) do NOT
// block an outer link — marked's linkEmitted is set only by [text](dest)
// and reference links. Images (t===5) do not count either.
function containsLink(nodes) {
  for (const nd of nodes) {
    if (nd.t === 4 && !nd.autolink) return true;
    if (nd.c && containsLink(nd.c)) return true;
  }
  return false;
}

// True when src[k..] is only whitespace (spaces/tabs/newlines) to the end.
// Implements the (?!\s*$) lookahead in marked's br regex.
function onlyWhitespaceToEnd(src, k) {
  for (let p = k; p < src.length; p++) {
    const ch = src[p];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') return false;
  }
  return true;
}

// True when `text` contains a backtick run with no later backtick run to
// close it. marked's link-label regex only admits backticks as part of a
// code span (`+(?!`)[^`]*?`+(?!`)`), and the two runs need not have the
// same length — a run is "closed" by any later run. A trailing lone run
// means the whole [text](dest) is not a link (F2).
function hasLoneBacktick(text) {
  const n = text.length;
  let i = 0;
  while (i < n) {
    if (text[i] !== '`') { i++; continue; }
    let j = i;
    while (j < n && text[j] === '`') j++;
    // find any later backtick run to close this one
    let k = j, found = false;
    while (k < n) {
      if (text[k] === '`') {
        let e = k;
        while (e < n && text[e] === '`') e++;
        found = true; i = e; break;
      }
      k++;
    }
    if (!found) return true;
  }
  return false;
}

function inlineToHtml(src, links, inLink = false) {
  const n = src.length;
  const items = []; // node list: {t, ...}
  let buf = '';
  let inRawBlock = false; // inside <pre>/<code>/<kbd>/<script>: text is raw
  const flushText = () => {
    if (buf !== '') {
      items.push(inRawBlock ? { t: 0, s: buf, raw: true } : { t: 0, s: buf });
      buf = '';
    }
  };

  // Delimiter stack (doubly linked list via prev/next on entries).
  let delimFirst = null, delimLast = null;
  const addDelim = (node, ch, len, canOpen, canClose) => {
    const d = { node, ch, len, canOpen, canClose, prev: delimLast, next: null };
    if (delimLast) delimLast.next = d; else delimFirst = d;
    delimLast = d;
    return d;
  };
  const removeDelim = (d) => {
    if (d.prev) d.prev.next = d.next; else delimFirst = d.next;
    if (d.next) d.next.prev = d.prev; else delimLast = d.prev;
  };

  // flanking info for a delimiter run at [i, i+len)
  const flanking = (i, len) => {
    const before = i > 0 ? src[i - 1] : '';
    const after = i + len < n ? src[i + len] : '';
    const beforeWs = before === '' || isWhitespace(before);
    const afterWs = after === '' || isWhitespace(after);
    const beforePunct = before !== '' && isPunct(before);
    const afterPunct = after !== '' && isPunct(after);
    const leftFlanking = !afterWs && (!afterPunct || beforeWs || beforePunct);
    const rightFlanking = !beforeWs && (!beforePunct || afterWs || afterPunct);
    return { before, after, leftFlanking, rightFlanking };
  };

  let i = 0;
  while (i < n) {
    const c = src[i];

    // backslash escape: the escaped char is its own node so it renders
    // with encode=true (an escaped '&' becomes '&amp;' even before 'ouml;'
    // — cm-014). It must not merge into the plain text buffer.
    if (c === '\\' && i + 1 < n && isAsciiPunct(src[i + 1])) {
      flushText();
      items.push({ t: 10, s: src[i + 1] });
      i += 2; continue;
    }
    // (backslash + newline hard break is handled below, with the space-run
    // break, so the next line's leading spaces are consumed.)
    // code span
    if (c === '`') {
      const cs = parseCodeSpan(src, i);
      if (cs) {
        flushText();
        items.push({ t: 6, s: cs.text });
        i = cs.end; continue;
      }
      // No closing run of the same length: the whole opening run is literal
      // text (do not retry a shorter run inside it — cm-347).
      let j = i;
      while (j < n && src[j] === '`') j++;
      buf += src.slice(i, j); i = j; continue;
    }
    // hard break: 2+ spaces + newline, or backslash + newline.
    // marked's br regex: /^( {2,}|\\\\)\n(?!\s*$)[ \t]*/ — the break is
    // only a break when the rest is not all whitespace, and it consumes
    // the next line's leading spaces/tabs.
    if (c === ' ') {
      let j = i;
      while (j < n && src[j] === ' ') j++;
      if (j - i >= 2 && j < n && src[j] === '\n' && !onlyWhitespaceToEnd(src, j + 1)) {
        let m = j + 1;
        while (m < n && (src[m] === ' ' || src[m] === '\t')) m++;
        flushText(); items.push({ t: 8 });
        i = m; continue;
      }
      buf += src.slice(i, j); i = j; continue;
    }
    if (c === '\\' && i + 1 < n && src[i + 1] === '\n' && !onlyWhitespaceToEnd(src, i + 2)) {
      let m = i + 2;
      while (m < n && (src[m] === ' ' || src[m] === '\t')) m++;
      flushText(); items.push({ t: 8 });
      i = m; continue;
    }
    // newline = soft break
    if (c === '\n') {
      flushText(); items.push({ t: 9 }); i++; continue;
    }
    // HTML tag or autolink
    if (c === '<') {
      const al = matchAutolink(src, i);
      if (al) {
        flushText();
        items.push({ t: 4, href: al.href, title: null, autolink: true, text: al.text });
        i = al.end; continue;
      }
      const tag = matchHtmlTag(src, i);
      if (tag) {
        flushText();
        items.push({ t: 7, s: tag });
        // track raw blocks: <pre>, <code>, <kbd>, <script> (and their ends)
        const low = tag.toLowerCase();
        if (/^<(pre|code|kbd|script)(\s|>)/.test(low)) inRawBlock = true;
        else if (/^<\/(pre|code|kbd|script)(\s|>)/.test(low)) inRawBlock = false;
        i += tag.length; continue;
      }
      buf += c; i++; continue;
    }
    // emphasis / strikethrough delimiter runs
    if (c === '*' || c === '_' || c === '~') {
      let j = i;
      while (j < n && src[j] === c) j++;
      const len = j - i;
      const { leftFlanking, rightFlanking, before, after } = flanking(i, len);
      let canOpen, canClose;
      if (c === '_') {
        canOpen = leftFlanking && (!rightFlanking || isPunct(before));
        canClose = rightFlanking && (!leftFlanking || isPunct(after));
      } else {
        canOpen = leftFlanking;
        canClose = rightFlanking;
      }
      // For '~', only runs of 1-2 count as del delimiters; longer runs are literal.
      if (c === '~' && len > 2) {
        buf += src.slice(i, j); i = j; continue;
      }
      flushText();
      const node = { t: 0, s: src.slice(i, j) };
      items.push(node);
      addDelim(node, c, len, canOpen, canClose);
      i = j; continue;
    }
    // link / image
    if (c === '[' || (c === '!' && src[i + 1] === '[')) {
      const isImage = c === '!';
      const openIdx = isImage ? i + 1 : i;
      const closeIdx = findClosingBracket(src, openIdx);
      if (closeIdx !== -1) {
        const labelText = src.slice(openIdx + 1, closeIdx);
        // A lone backtick in the label means the [text](dest) is not a link
        // at all (marked's label regex only admits balanced code spans).
        if (hasLoneBacktick(labelText)) {
          buf += c; i++; continue;
        }
        // try inline link: ](
        let after = closeIdx + 1;
        let dest = null, title = null, endPos = -1;
        let fullRefTried = false; // a syntactically valid [text][ref] was attempted
        if (src[after] === '(') {
          // inline link destination + optional title + ')'
          let k = after + 1;
          // skip whitespace/newlines
          while (k < n && (src[k] === ' ' || src[k] === '\t' || src[k] === '\n')) k++;
          if (k < n && src[k] === ')') {
            dest = ''; endPos = k + 1;
          } else {
            const d = parseLinkDest(src, k);
            if (d) {
              let m = d.end;
              while (m < n && (src[m] === ' ' || src[m] === '\t')) m++;
              if (m < n && src[m] === '\n') {
                let m2 = m;
                while (m2 < n && (src[m2] === ' ' || src[m2] === '\t' || src[m2] === '\n')) m2++;
                const t = parseLinkTitle(src, m2);
                if (t) {
                  let e = t.end;
                  while (e < n && (src[e] === ' ' || src[e] === '\t' || src[e] === '\n')) e++;
                  if (e < n && src[e] === ')') { dest = d.dest; title = t.title; endPos = e + 1; }
                } else if (m2 < n && src[m2] === ')') { dest = d.dest; endPos = m2 + 1; }
              } else {
                const t = parseLinkTitle(src, m);
                if (t) {
                  let e = t.end;
                  while (e < n && (src[e] === ' ' || src[e] === '\t' || src[e] === '\n')) e++;
                  if (e < n && src[e] === ')') { dest = d.dest; title = t.title; endPos = e + 1; }
                } else if (m < n && src[m] === ')') { dest = d.dest; endPos = m + 1; }
              }
            }
          }
        } else if (src[after] === '[') {
          // reference link [text][ref]
          const refClose = src.indexOf(']', after + 1);
          if (refClose !== -1) {
            fullRefTried = true;
            const refLabel = src.slice(after + 1, refClose);
            const key = normalizeLabel(refLabel === '' ? labelText : refLabel);
            const ref = links[key];
            if (ref) { dest = ref.href; title = ref.title; endPos = refClose + 1; }
          }
        } else {
          // shortcut reference link [text]
          const key = normalizeLabel(labelText);
          const ref = links[key];
          if (ref) { dest = ref.href; title = ref.title; endPos = closeIdx + 1; }
        }
        if (dest === null) {
          if (fullRefTried) {
            // [text][ref] matched syntactically but the ref is undefined:
            // marked emits just '[' as text and does NOT fall back to the
            // shortcut reference (cm-571).
            buf += c; i++; continue;
          }
          // The inline '(' form failed (e.g. '(not a link)'), or the full
          // reference failed: fall back to the shortcut reference [text].
          const key = normalizeLabel(labelText);
          const ref = links[key];
          if (ref) { dest = ref.href; title = ref.title; endPos = closeIdx + 1; }
        }
        if (dest !== null) {
          // marked's Be check: if the link text contains a '<' that starts a
          // tag/autolink extending past the ']', do not form the link.
          // The tag/autolink is matched against the FULL source from the '<',
          // so a tag whose quoted attribute swallows the '](...)' is caught.
          let blocked = false;
          if (labelText.indexOf('<') !== -1) {
            for (let p = 0; p < labelText.length; p++) {
              if (labelText[p] === '\\') { p++; continue; }
              if (labelText[p] === '`') {
                const cs = parseCodeSpan(labelText, p);
                if (cs) { p = cs.end - 1; continue; }
              }
              if (labelText[p] === '<') {
                const m = matchAutolink(src, openIdx + 1 + p) || matchHtmlTag(src, openIdx + 1 + p);
                if (m) {
                  const len = typeof m === 'string' ? m.length : (m.end - (openIdx + 1 + p));
                  if (len > labelText.length - p) { blocked = true; break; }
                  p += len - 1;
                }
              }
            }
          }
          if (!blocked) {
            flushText();
            const children = parseInlineNodes(labelText, links, true);
            // marked's linkEmitted rule: if the link text contains a link,
            // the outer link is not formed (no nested links). Images do not
            // block (an image inside a link is fine).
            if (!isImage && containsLink(children)) {
              // treat the '[' as literal text and continue scanning after it
              buf += c; i++; continue;
            }
            if (isImage) {
              items.push({ t: 5, href: dest, title, altNodes: children });
            } else {
              items.push({ t: 4, href: dest, title, c: children });
            }
            i = endPos; continue;
          }
        }
      }
      // not a link: literal
      buf += c; i++; continue;
    }
    // GFM extended autolinks (only when not inside a link).
    // Scheme (http/https/ftp) is case-insensitive; www. is lowercase only.
    // Inside link text, GFM url autolinks are suppressed (marked's inLink).
    if (!inLink && (c === 'w' || c === 'h' || c === 'H' || c === 'f' || c === 'F')) {
      // check word boundary before
      const prev = i > 0 ? src[i - 1] : '';
      const okBoundary = prev === '' || isWhitespace(prev) || isPunct(prev);
      if (okBoundary) {
        const rest = src.slice(i);
        let m = null;
        if (rest.startsWith('www.')) {
          m = /^www\.(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*/.exec(rest);
        } else {
          m = /^(?:https?|ftp):\/\/(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*/i.exec(rest);
        }
        if (m) {
          let url = m[0];
          // backpedal: strip trailing punctuation / unbalanced parens
          url = backpedalUrl(url);
          if (url) {
            flushText();
            const href = url.startsWith('www.') ? 'http://' + url : url;
            items.push({ t: 4, href, title: null, autolink: true, text: url });
            i += url.length; continue;
          }
        }
      }
      // No URL here: fall through so the email check can still match
      // (e.g. 'foo@bar.baz' starts with 'f').
    }
    // GFM email autolink (incl. mailto:/xmpp: scheme forms).
    // Suppressed inside link text (marked's inLink).
    // Cheap pre-check: a bare email must contain '@' in the current word
    // (no whitespace before it), so skip the slice+regex when there is
    // no '@' ahead in this word. The scheme forms are checked first.
    if (!inLink && (isEmailStart(src, i) || src.startsWith('mailto:', i) || src.startsWith('xmpp:', i))) {
      const prev = i > 0 ? src[i - 1] : '';
      const okBoundary = prev === '' || isWhitespace(prev) || isPunct(prev);
      if (okBoundary) {
        // scheme form: mailto:foo@bar.baz / xmpp:foo@bar.baz (whole thing is the link)
        if (src.startsWith('mailto:', i) || src.startsWith('xmpp:', i)) {
          const m = RE_GFM_EMAIL_PROTO.exec(src.slice(i));
          if (m) {
            flushText();
            items.push({ t: 4, href: m[0], title: null, autolink: true, text: m[0] });
            i += m[0].length; continue;
          }
        }
        const atIdx = src.indexOf('@', i);
        if (atIdx !== -1 && atIdx - i <= 64) {
          let hasWs = false;
          for (let k = i; k < atIdx; k++) {
            const ch = src[k];
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '<') { hasWs = true; break; }
          }
          if (!hasWs) {
            const m = RE_GFM_EMAIL.exec(src.slice(i));
            if (m) {
              flushText();
              items.push({ t: 4, href: 'mailto:' + m[0], title: null, autolink: true, text: m[0] });
              i += m[0].length; continue;
            }
          }
        }
      }
      // No email here: fall through to the ordinary character handling.
    }
    // ordinary character
    buf += c; i++;
  }
  flushText();

  // ---- emphasis / strikethrough resolution (delimiter stack) ----
  resolveEmphasis(items, delimFirst, delimLast);

  return items;
}

// Recursively parse inline content into a node list (used for link text).
function parseInlineNodes(src, links, inLink = false) {
  return inlineToHtml(src, links, inLink);
}

function isEmailStart(src, i) {
  const c = src[i];
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '.' || c === '_' || c === '%' || c === '+' || c === '-';
}

// marked's GFM _backpedal regex, applied in a loop until fixed point.
// Trims trailing punctuation / unbalanced parens / entity-like &...; tails.
const RE_BACKPEDAL = /(?:[^?!.,:;*_'\"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'\"~)]+(?!$))+/;
function backpedalUrl(url) {
  let prev;
  do {
    prev = url;
    url = RE_BACKPEDAL.exec(url)?.[0] ?? '';
  } while (url !== prev);
  return url;
}

// marked's GFM email pattern (domain labels may be a single char).
const RE_GFM_EMAIL = /^[A-Za-z0-9._+\-]+@[A-Za-z0-9\-_]+(?:\.[A-Za-z0-9\-_]*[A-Za-z0-9])+(?![\w\-])/;
const RE_GFM_EMAIL_PROTO = /^(?:mailto:|xmpp:)[A-Za-z0-9._+\-]+@[A-Za-z0-9\-_]+(?:\.[A-Za-z0-9\-_]*[A-Za-z0-9])+(?![\w\-])(?:\/[A-Za-z0-9@.]+)?/;

// ------------------------------------------------------------------- block
// Block grammar: marked 18.1.3's GFM block rules, verbatim. The tokenizer
// mirrors marked's Tokenizer + Lexer.blockTokens; rendering is direct.

const BLOCK_TAGS = 'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul';

const R = {
  newline: new RegExp("^(?:[ \\t]*(?:\\n|$))+"),
  code: new RegExp("^((?: {4}| {0,3}\\t)[^\\n]+(?:\\n(?:[ \\t]*(?:\\n|$))*)?)+"),
  fences: new RegExp("^ {0,3}(`{3,}(?=[^`\\n]*(?:\\n|$))|~{3,})([^\\n]*)(?:\\n|$)(?:|([\\s\\S]*?)(?:\\n|$))(?: {0,3}(?:(?=`)\\1`*|(?=~)\\1~*) *(?=\\n|$)|$)"),
  heading: new RegExp("^ {0,3}(#{1,6})(?=\\s|$)(.*)(?:\\n+|$)"),
  hr: new RegExp("^ {0,3}((?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)"),
  list: new RegExp("^( {0,3}(?:[*+-]|\\d{1,9}[.)]))([ \\t][^\\n]*?)?(?:\\n|$)"),
  text: new RegExp("^[^\\n]+"),
  def: new RegExp("^ {0,3}\\[((?!\\s*\\])(?:\\\\[\\s\\S]|[^\\[\\]\\\\\\n]|\\n(?![ \\t]*\\n))+)\\]: *(?:\\n[ \\t]*)?([^<\\s][^\\s]*|<.*?>)(?:(?: +(?:\\n[ \\t]*)?| *\\n[ \\t]*)((?:\"(?:\\\\[\\s\\S]|[^\"\\\\])*\"|'(?:\\\\[\\s\\S]|[^'\\\\\\n]|\\n(?!\\n))*'|\\((?:\\\\[\\s\\S]|[^()\\\\])*\\))))? *(?:\\n+|$)"),
  table: new RegExp("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n| {0,3}((?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)| {0,3}#{1,6}(?:\\s|$)| {0,3}>|(?: {4}| {0,3}\t)[^\\n]| {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)| {0,3}(?:[*+-]|1[.)])[ \\t]| {0,3}(?:<\\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?: +|\\n|\\/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)).*(?:\\n|$))*)\\n*|$)"),
  lheading: new RegExp("^(?! {0,3}(?:[*+-]|\\d{1,9}[.)]) |(?: {4}| {0,3}\\t)| {0,3}(?:`{3,}|~{3,})| {0,3}>| {0,3}#{1,6}(?:\\s|$)| {0,3}<[^\\n>]+>\\n| {0,3}\\|?(?:[:\\- ]*\\|)+[\\:\\- ]*\\n)((?:.|\\n(?!\\s*?\\n| {0,3}(?:[*+-]|\\d{1,9}[.)]) | {0,3}(?:`{3,}|~{3,})| {0,3}>| {0,3}#{1,6}(?:\\s|$)| {0,3}(?:(?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)| {0,3}<[^\\n>]+>\\n| {0,3}\\|?(?:[:\\- ]*\\|)+[\\:\\- ]*\\n))+?)\\n {0,3}(=+|-+)[ \\t]*(?:\\n+|$)"),
  paragraph: new RegExp("^([^\\n]+(?:\\n(?! {0,3}((?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)| {0,3}#{1,6}(?:\\s|$)| {0,3}>| {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)| {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]| {0,3}(?:<\\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?: +|\\n|\\/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)| *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n| {0,3}((?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)| {0,3}#{1,6}(?:\\s|$)| {0,3}>|(?: {4}| {0,3}\t)[^\\n]| {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)| {0,3}(?:[*+-]|1[.)])[ \\t]| {0,3}(?:<\\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?: +|\\n|\\/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)).*(?:\\n|$))*)\\n*|$)|[ \\t]+\\n)[^\\n]+)*)"),
  blockquote: new RegExp("^( {0,3}> ?(?:(?![ \\t]*(?:\\n|$))(([^\\n]+(?:\\n(?! {0,3}((?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)| {0,3}#{1,6}(?:\\s|$)| {0,3}>| {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)| {0,3}(?:[*+-]|\\d{1,9}[.)])(?:[ \\t]|\\n|$)| {0,3}(?:<\\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?: +|\\n|\\/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)|[ \\t]+\\n)[^\\n]+)*))|[^\\n]*)(?:\\n|$))+"),
  html: new RegExp("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:<\\/\\1>[^\\n]*\\n*|$)|<!--(?:-?>|[\\s\\S]*?(?:-->|$))[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|<\\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:[ \\t]+|\\n|\\/?>|$)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?: +[a-zA-Z:_][\\w.:-]*(?: *= *\"[^\"\\n]*\"| *= *'[^'\\n]*'| *= *[^\\s\"'=<>`]+)?)*? *\\/?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<\\/[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i"),
};

const O = {
  codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  endingSpaceTabChar: /[ \t]$/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  leadingSpaceTab: /^[ \t]+/,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+)[ \t]*)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  blockquoteMarkerWhitespace: /^( {0,3}>)([ \t]+)/gm,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\][ \t]+\S/,
  listReplaceTask: /^\[[ xX]\][ \t]+/,
  listTaskCheckbox: /\[[ xX]\]/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
};

// Cache the indent-based regexes: clampIndent() yields only 0..3, and
// tokList builds them on every item — constructing a RegExp per call was
// the top hotspot in the profile.
const _reCache = new Map();
function cachedRe(key, make) {
  let re = _reCache.get(key);
  if (!re) { re = make(); _reCache.set(key, re); }
  return re;
}
function listItemRegex(bull) {
  return cachedRe('li:' + bull, () => new RegExp(`^( {0,3}${bull})((?:[ \t][^\\n]*)?(?:\\n|$))`));
}
// marked's D(): clamps the indent to [0,3] via max(0,min(3,t-1)). All
// block-start regexes are built through D, so they match at most R-1
// spaces: a block indented by the full item indent is inside the item.
function clampIndent(indent) {
  return Math.max(0, Math.min(3, indent - 1));
}
function nextBulletRegex(indent) {
  const c = clampIndent(indent);
  return cachedRe('nb:' + c, () => new RegExp(`^ {0,${c}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`));
}
function hrRegex(indent) {
  const c = clampIndent(indent);
  return cachedRe('hr:' + c, () => new RegExp(`^ {0,${c}}((?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\\*[ \t]*){3,})(?:\\n+|$)`));
}
function fencesBeginRegex(indent) {
  const c = clampIndent(indent);
  return cachedRe('fe:' + c, () => new RegExp(`^ {0,${c}}(?:\`\`\`|~~~)`));
}
function headingBeginRegex(indent) {
  const c = clampIndent(indent);
  return cachedRe('hd:' + c, () => new RegExp(`^ {0,${c}}#{1,6}(?:\\s|$)`));
}
function htmlBeginRegex(indent) {
  const c = clampIndent(indent);
  return cachedRe('ht:' + c, () => new RegExp(`^ {0,${c}}(?:</?(?:${BLOCK_TAGS})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`, 'i'));
}
function blockquoteBeginRegex(indent) {
  const c = clampIndent(indent);
  return cachedRe('bq:' + c, () => new RegExp(`^ {0,${c}}>`));
}

// expand tabs to spaces (marked's J), starting at column `col`.
function expandTabs(str, col = 0) {
  let out = '';
  let c = col;
  for (const ch of str) {
    if (ch === '\t') {
      const n = 4 - (c % 4);
      out += ' '.repeat(n);
      c += n;
    } else {
      out += ch;
      c++;
    }
  }
  return out;
}

// rtrim: remove trailing occurrences of `ch` (marked's `L` with no flag).
function rtrim(str, ch) {
  let n = str.length;
  while (n > 0 && str[n - 1] === ch) n--;
  return str.slice(0, n);
}

// trim trailing blank lines, keeping at most 2 newlines (marked's `ge`)
function trimBlankLines(str) {
  const lines = str.split('\n');
  let t = lines.length - 1;
  while (t >= 0 && O.blankLine.test(lines[t])) t--;
  return lines.length - t <= 2 ? str : lines.slice(0, t + 1).join('\n');
}

// split a table row into cells (marked's `de`)
function splitCells(row, count) {
  const t = row.replace(/\|/g, (m, off, s) => {
    let escaped = false;
    let p = off;
    while (--p >= 0 && s[p] === '\\') escaped = !escaped;
    return escaped ? '|' : ' |';
  });
  const cells = t.split(' |');
  let s = 0;
  if (cells[0].trim() === '') cells.shift();
  if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
  if (count) {
    if (cells.length > count) cells.splice(count);
    else while (cells.length < count) cells.push('');
  }
  for (; s < cells.length; s++) cells[s] = cells[s].trim().replace(/\\\|/g, '|');
  return cells;
}

// find matching close paren for an open paren at index (marked's `ke`):
// returns the index of the matching ')' or -1 (unbalanced) or -2 (unclosed)
function matchParen(str, open, close) {
  if (str.indexOf(open[0]) === -1 && str.indexOf(close[0]) === -1) return -1;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') { i++; continue; }
    if (str[i] === open[0]) depth++;
    else if (str[i] === close[0]) {
      depth--;
      if (depth < 0) return i;
    }
  }
  return depth > 0 ? -2 : -1;
}

// Resolve emphasis/del using the delimiter linked list.
// Process delimiters in forward order (first to last): for each closer,
// match the nearest preceding opener. Forward order is what makes nested
// emphasis resolve inside-out (the inner closer matches before the outer).
function resolveEmphasis(items, delimFirst, delimLast) {
  if (!delimFirst) return;
  let current = delimFirst;
  while (current) {
    const next = current.next;
    if (current.canClose && current.len > 0) {
      // look for the nearest opener before current with the same char
      let opener = current.prev;
      let found = null;
      while (opener) {
        if (opener.ch === current.ch && opener.canOpen && opener.len > 0) {
          const oddMatch = (opener.canClose || current.canOpen) &&
            ((opener.len + current.len) % 3 === 0) &&
            (opener.len % 3 !== 0 || current.len % 3 !== 0);
          if (!oddMatch) { found = opener; break; }
        }
        opener = opener.prev;
      }
      if (found) {
        const use = (found.len >= 2 && current.len >= 2) ? 2 : 1;
        const oi = items.indexOf(found.node);
        const ci = items.indexOf(current.node);
        if (oi !== -1 && ci !== -1 && ci > oi) {
          const children = items.slice(oi + 1, ci);
          found.node.s = found.node.s.slice(0, found.node.s.length - use);
          current.node.s = current.node.s.slice(use);
          const rep = [];
          if (found.node.s !== '') rep.push(found.node);
          const nodeType = current.ch === '~' ? 3 : (use === 2 ? 2 : 1);
          rep.push({ t: nodeType, c: children });
          if (current.node.s !== '') rep.push(current.node);
          items.splice(oi, ci - oi + 1, ...rep);
          // Delimiters whose nodes are now inside the new em/strong node
          // are trapped there: unlink them from the stack so they cannot
          // match a closer outside it (cm-470).
          const childSet = new Set(children);
          let d = delimFirst;
          while (d) {
            const nx = d.next;
            if (childSet.has(d.node)) {
              if (d.prev) d.prev.next = d.next;
              if (d.next) d.next.prev = d.prev;
            }
            d = nx;
          }
        }
        found.len -= use;
        current.len -= use;
        if (found.len === 0) {
          if (found.prev) found.prev.next = found.next;
          if (found.next) found.next.prev = found.prev;
        }
        if (current.len === 0) {
          if (current.prev) current.prev.next = current.next;
          if (current.next) current.next.prev = current.prev;
          current = next;
          continue;
        }
        // closer still has length: it may match another opener; re-examine
        // it by staying on it (do not advance), but avoid infinite loop:
        // after a successful match the closer's remaining run is shorter,
        // so re-checking it against earlier openers is correct.
        continue;
      }
    }
    current = next;
  }
}

// Render an inline node list to HTML.
function renderInline(nodes) {
  let out = '';
  for (const nd of nodes) {
    switch (nd.t) {
      case 0: // text
        out += nd.raw ? nd.s : escapeHtml(decodeNumericRefs(nd.s), false);
        break;
      case 1: out += '<em>' + renderInline(nd.c) + '</em>'; break;
      case 2: out += '<strong>' + renderInline(nd.c) + '</strong>'; break;
      case 3: out += '<del>' + renderInline(nd.c) + '</del>'; break;
      case 4: { // link
        if (nd.autolink) {
          const href = encodeUrl(nd.href);
          if (href === null) { out += escapeHtml(nd.text, true); break; }
          out += '<a href="' + escapeHtml(href, true) + '">' + escapeHtml(nd.text, true) + '</a>';
        } else {
          const href = encodeUrl(nd.href);
          if (href === null) { out += renderInline(nd.c); break; }
          out += '<a href="' + escapeHtml(href, false) + '"';
          if (nd.title) out += ' title="' + escapeHtml(nd.title, false) + '"';
          out += '>' + renderInline(nd.c) + '</a>';
        }
        break;
      }
      case 5: { // image
        const href = encodeUrl(nd.href);
        if (href === null) { out += escapeHtml(plainText(nd.altNodes), false); break; }
        const alt = escapeHtml(decodeNumericRefs(plainText(nd.altNodes)), false);
        out += '<img src="' + escapeHtml(href, false) + '" alt="' + alt + '"';
        if (nd.title) out += ' title="' + escapeHtml(nd.title, false) + '"';
        out += '>';
        break;
      }
      case 6: out += '<code>' + escapeHtml(nd.s, true) + '</code>'; break;
      case 7: out += nd.s; break;
      case 8: out += '<br>'; break;
      case 9: out += '\n'; break;
      case 10: out += escapeHtml(nd.s, true); break; // backslash-escaped char
    }
  }
  return out;
}

// Plain-text rendering of inline nodes (for image alt text).
function plainText(nodes) {
  let out = '';
  for (const nd of nodes) {
    switch (nd.t) {
      case 0: out += nd.s; break;
      case 1: case 2: case 3: case 4: out += plainText(nd.c); break;
      case 5: out += plainText(nd.altNodes); break;
      case 6: out += nd.s; break;
      case 7: out += nd.s; break;
      case 8: out += ''; break;
      case 9: out += '\n'; break;
      case 10: out += nd.s; break;
    }
  }
  return out;
}

// ------------------------------------------------------- block tokenizers
// Each returns a block token or null. `ctx` is { links, state:{top} }.
// Inline content is stored as `text` (source) and rendered at render time.

function tokSpace(src) {
  const t = R.newline.exec(src);
  if (t && t[0].length > 0) return { type: 'space', raw: t[0] };
  return null;
}

function tokCode(src) {
  const t = R.code.exec(src);
  if (t) {
    const raw = trimBlankLines(t[0]);
    const text = raw.replace(O.codeRemoveIndent, '');
    return { type: 'code', raw, text, lang: undefined };
  }
  return null;
}

function tokFences(src) {
  const t = R.fences.exec(src);
  if (t) {
    const raw = t[0];
    let text = t[3] || '';
    // indent compensation: if the fence is indented, dedent the content
    const m = raw.match(O.indentCodeCompensation);
    if (m) {
      const indent = m[1];
      text = text.split('\n').map(line => {
        const mm = line.match(O.beginningSpace);
        if (!mm) return line;
        return line.slice(Math.min(mm[0].length, indent.length));
      }).join('\n');
    }
    const lang = t[2] ? t[2].trim().replace(/\\([\p{P}\p{S}])/gu, '$1') : t[2];
    return { type: 'code', raw, text, lang };
  }
  return null;
}

function tokHeading(src) {
  const t = R.heading.exec(src);
  if (t) {
    let text = t[2].trim();
    if (O.endingHash.test(text)) {
      const s = rtrim(text, '#');
      if (!s || O.endingSpaceTabChar.test(s)) text = s.trim();
    }
    return { type: 'heading', raw: rtrim(t[0], '\n'), depth: t[1].length, text };
  }
  return null;
}

function tokHr(src) {
  const t = R.hr.exec(src);
  if (t) return { type: 'hr', raw: rtrim(t[0], '\n') };
  return null;
}

function tokHtml(src) {
  const t = R.html.exec(src);
  if (t) {
    const raw = trimBlankLines(t[0]);
    return { type: 'html', raw, pre: t[1] === 'pre' || t[1] === 'script' || t[1] === 'style', text: raw };
  }
  return null;
}

function tokDef(src) {
  const t = R.def.exec(src);
  if (t) {
    if (!O.startAngleBracket.test(t[2]) && matchParen(t[2], '(', ')') !== -1) return null;
    const tag = normalizeLabel(t[1]);
    const href = t[2] ? t[2].replace(O.hrefBrackets, '$1').replace(/\\([\p{P}\p{S}])/gu, '$1') : '';
    const title = t[3] ? t[3].substring(1, t[3].length - 1).replace(/\\([\p{P}\p{S}])/gu, '$1') : t[3];
    return { type: 'def', raw: rtrim(t[0], '\n'), tag, href, title };
  }
  return null;
}

function tokTable(src, ctx) {
  const t = R.table.exec(src);
  if (!t || !O.tableDelimiter.test(t[2])) return null;
  const header = splitCells(t[1]);
  const alignRaw = t[2].replace(O.tableAlignChars, '').split('|');
  const rowsRaw = t[3] && t[3].trim() ? t[3].replace(O.tableRowBlankLine, '').split('\n') : [];
  const table = { type: 'table', raw: rtrim(t[0], '\n'), header: [], align: [], rows: [] };
  if (header.length !== alignRaw.length) return null;
  for (const a of alignRaw) {
    if (O.tableAlignRight.test(a)) table.align.push('right');
    else if (O.tableAlignCenter.test(a)) table.align.push('center');
    else if (O.tableAlignLeft.test(a)) table.align.push('left');
    else table.align.push(null);
  }
  for (let i = 0; i < header.length; i++) {
    table.header.push({ text: header[i], align: table.align[i] });
  }
  for (const r of rowsRaw) {
    table.rows.push(splitCells(r, header.length).map((cell, j) => ({ text: cell, align: table.align[j] })));
  }
  return table;
}

function tokLheading(src) {
  const t = R.lheading.exec(src);
  if (t) {
    const text = t[1].trim();
    return { type: 'heading', raw: rtrim(t[0], '\n'), depth: t[2].charAt(0) === '=' ? 1 : 2, text };
  }
  return null;
}

function tokParagraph(src) {
  const t = R.paragraph.exec(src);
  if (t) {
    const text = t[1].charAt(t[1].length - 1) === '\n' ? t[1].slice(0, -1) : t[1];
    return { type: 'paragraph', raw: t[0], text };
  }
  return null;
}

function tokText(src) {
  const t = R.text.exec(src);
  if (t) return { type: 'text', raw: t[0], text: t[0] };
  return null;
}

function tokBlockquote(src, ctx) {
  const t = R.blockquote.exec(src);
  if (!t) return null;
  let lines = rtrim(t[0], '\n').split('\n');
  let raw = '', text = '';
  const tokens = [];
  while (lines.length > 0) {
    let inQuote = false;
    const current = [];
    let p;
    for (p = 0; p < lines.length; p++) {
      if (O.blockquoteStart.test(lines[p])) { current.push(lines[p]); inQuote = true; }
      else if (!inQuote) current.push(lines[p]);
      else break;
    }
    lines = lines.slice(p);
    const chunk = current.join('\n');
    const cleaned = chunk
      .replace(O.blockquoteMarkerWhitespace, (m, b, ws) => b + expandTabs(ws, b.length))
      .replace(O.blockquoteSetextReplace, '\n    $1')
      .replace(O.blockquoteSetextReplace2, '');
    raw = raw ? raw + '\n' + chunk : chunk;
    text = text ? text + '\n' + cleaned : cleaned;
    const savedTop = ctx.state.top;
    ctx.state.top = true;
    blockTokens(cleaned, tokens, true, ctx);
    ctx.state.top = savedTop;
    if (lines.length === 0) break;
    const last = tokens[tokens.length - 1];
    if (last && (last.type === 'code' || last.type === 'heading' || last.type === 'hr' || last.type === 'html' || last.type === 'table')) break;
    if (last && last.type === 'blockquote') {
      const bq = last;
      const rest = lines.join('\n');
      const merged = bq.raw + '\n' + rest.replace(O.blockquoteSetextReplace2, '');
      const inner = tokBlockquote(merged, ctx);
      tokens[tokens.length - 1] = inner;
      const remaining = merged.substring(inner.raw.length).replace(/^\n/, '');
      const remLines = remaining ? remaining.split('\n').length : 0;
      const consumed = remLines ? lines.slice(0, -remLines) : lines;
      if (consumed.length > 0) raw = raw + '\n' + consumed.join('\n');
      text = text.substring(0, text.length - bq.text.length) + inner.text;
      lines = lines.slice(consumed.length);
      if (lines.length > 0 && O.blockquoteStart.test(lines[0])) continue;
      break;
    } else if (last && last.type === 'list') {
      const lst = last;
      const rest = lst.raw + '\n' + lines.join('\n');
      const inner = tokList(rest, ctx);
      tokens[tokens.length - 1] = inner;
      const extra = inner.raw.length > lst.raw.length
        ? rest.slice(lst.raw.length + 1, inner.raw.length).split('\n').length : 0;
      if (extra > 0) {
        const y = lines.slice(0, extra).join('\n');
        raw = raw + '\n' + y;
        text = text + '\n' + y;
      }
      lines = lines.slice(extra);
      continue;
    }
    // Last token is a paragraph/text/space (or anything else): do NOT break.
    // The loop continues so lazy continuation lines (no '>') are collected
    // on the next iteration and merged into the paragraph by blockTokens.
  }
  return { type: 'blockquote', raw, tokens, text };
}

function tokList(src, ctx) {
  const t0 = R.list.exec(src);
  if (!t0) return null;
  let srcRest = src;
  const consumed0 = () => src.length - srcRest.length;
  const bull = t0[1].trim();
  const ordered = bull.length > 1;
  const list = {
    type: 'list', raw: '', ordered,
    start: ordered ? +bull.slice(0, -1) : '',
    loose: false, items: [],
  };
  let bullRe = ordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
  const itemRe = listItemRegex(bullRe);
  let sawDoubleBlank = false;
  while (srcRest) {
    let isEmpty = false;
    let itemText = '';
    const m = itemRe.exec(srcRest);
    if (!m || R.hr.test(srcRest)) break;
    const startPos = consumed0();
    srcRest = srcRest.substring(m[0].length);
    // m[2] is the rest of the first line plus a possible trailing '\n'
    // (the regex ends with (?:\n|$)); strip that newline.
    let firstLine = (m[2] || '');
    if (firstLine.charCodeAt(firstLine.length - 1) === 10) firstLine = firstLine.slice(0, -1);
    const bullLen = m[1].length;
    // expandTabs only changes tabs; skip the replace when there is no tab.
    let content = firstLine.indexOf('\t') === -1 ? firstLine : firstLine.replace(O.leadingSpaceTab, v => expandTabs(v, bullLen));
    let nl0 = srcRest.indexOf('\n');
    let nextLine = nl0 === -1 ? srcRest : srcRest.slice(0, nl0);
    let contentBlank = !content.trim();
    let indent;
    if (contentBlank) {
      indent = bullLen + 1;
    } else {
      indent = content.search(O.nonSpaceChar);
      if (indent > 4) indent = 1;
      itemText = content.slice(indent);
      indent += bullLen;
    }
    if (contentBlank && O.blankLine.test(nextLine)) {
      srcRest = srcRest.substring(nextLine.length + 1);
      isEmpty = true;
    }
    if (!isEmpty) {
      const nextBullet = nextBulletRegex(indent);
      const hrRe = hrRegex(indent);
      const fencesRe = fencesBeginRegex(indent);
      const headingRe = headingBeginRegex(indent);
      const htmlRe = htmlBeginRegex(indent);
      const bqRe = blockquoteBeginRegex(indent);
      while (srcRest) {
        const nl = srcRest.indexOf('\n');
        let line = nl === -1 ? srcRest : srcRest.slice(0, nl);
        let expanded;
        nextLine = line;
        expanded = line.indexOf('\t') === -1 ? line : line.replace(O.leadingSpaceTab, v => expandTabs(v));
        if (fencesRe.test(line) || headingRe.test(line) || htmlRe.test(line) || bqRe.test(line) || nextBullet.test(line) || hrRe.test(line)) break;
        if (expanded.search(O.nonSpaceChar) >= indent || !line.trim()) {
          itemText += '\n' + expanded.slice(indent);
        } else {
          if (contentBlank || (content.indexOf('\t') === -1 ? content : content.replace(O.tabCharGlobal, '    ')).search(O.nonSpaceChar) >= 4 ||
              fencesRe.test(content) || headingRe.test(content) || htmlRe.test(content) || hrRe.test(content)) break;
          const setext = /^ {0,3}(?:=+|-+) *$/.test(line) && R.lheading.test(content + '\n' + line);
          itemText += '\n' + (setext ? '    ' + expanded.replace(/^ {0,3}/, '') : line);
        }
        contentBlank = !line.trim();
        srcRest = nl === -1 ? '' : srcRest.substring(nl + 1);
        content = expanded.slice(indent);
      }
    }
    const itemRaw = src.slice(startPos, consumed0());
    if (!list.loose) {
      if (sawDoubleBlank) list.loose = true;
      else if (O.doubleBlankLine.test(itemRaw)) sawDoubleBlank = true;
    }
    list.items.push({
      type: 'list_item', raw: itemRaw,
      task: O.listIsTask.test(itemText),
      loose: false, text: itemText, tokens: [],
    });
  }
  const lastItem = list.items[list.items.length - 1];
  if (lastItem) {
    lastItem.raw = lastItem.raw.trimEnd();
    lastItem.text = lastItem.text.trimEnd();
  } else {
    return null;
  }
  list.raw = src.slice(0, consumed0()).trimEnd();
  // Recursively parse each item's content (state.top = false: no paragraphs).
  for (const item of list.items) {
    ctx.state.top = false;
    item.tokens = blockTokens(item.text, [], false, ctx);
    ctx.state.top = true;
    if (!list.loose) {
      const spaces = item.tokens.filter(tok => tok.type === 'space');
      if (spaces.length > 0 && spaces.some(tok => O.anyLine.test(tok.raw))) list.loose = true;
    }
  }
  // Task list items: strip the marker, attach a checkbox.
  for (const item of list.items) {
    const first = item.tokens[0];
    if (item.task && first && (first.type === 'text' || first.type === 'paragraph')) {
      item.text = item.text.replace(O.listReplaceTask, '');
      first.raw = first.raw.replace(O.listReplaceTask, '');
      first.text = first.text.replace(O.listReplaceTask, '');
      const cb = O.listTaskCheckbox.exec(item.raw);
      if (cb) {
        const checked = cb[0] !== '[ ]';
        item.checked = checked;
        const cbRaw = cb[0] + ' ';
        if (list.loose) {
          // checkbox goes inside the first paragraph/text token
          first.checkbox = { checked, raw: cbRaw };
        } else {
          item.tokens.unshift({ type: 'checkbox', raw: cbRaw, checked });
        }
      }
    } else if (item.task) {
      item.task = false;
    }
  }
  if (list.loose) {
    for (const item of list.items) {
      item.loose = true;
      for (const tok of item.tokens) if (tok.type === 'text') tok.type = 'paragraph';
    }
  }
  return list;
}

// The main block tokenizer loop (marked's Lexer.blockTokens).
// Returns the token array. `links` is filled with reference definitions.
function blockTokens(src, tokens, topFlag, ctx) {
  let top = topFlag;
  let minLen = Infinity;
  while (src) {
    if (src.length < minLen) minLen = src.length;
    else throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    let tok = null;
    if ((tok = tokSpace(src))) {
      src = src.substring(tok.raw.length);
      const last = tokens[tokens.length - 1];
      if (tok.raw.length === 1 && last !== undefined) last.raw += '\n';
      else tokens.push(tok);
      continue;
    }
    if ((tok = tokCode(src))) {
      src = src.substring(tok.raw.length);
      const last = tokens[tokens.length - 1];
      if (last && (last.type === 'paragraph' || last.type === 'text')) {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + tok.raw;
        last.text += '\n' + tok.text;
      } else tokens.push(tok);
      continue;
    }
    if ((tok = tokFences(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokHeading(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokHr(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokBlockquote(src, ctx))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokList(src, ctx))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokHtml(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokDef(src))) {
      src = src.substring(tok.raw.length);
      const last = tokens[tokens.length - 1];
      if (last && (last.type === 'paragraph' || last.type === 'text')) {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + tok.raw;
        last.text += '\n' + tok.raw;
      } else {
        if (!ctx.links[tok.tag]) ctx.links[tok.tag] = { href: tok.href, title: tok.title };
        tokens.push(tok);
      }
      continue;
    }
    if ((tok = tokTable(src, ctx))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((tok = tokLheading(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if (ctx.state.top && (tok = tokParagraph(src))) {
      const last = tokens[tokens.length - 1];
      if (top && last && last.type === 'paragraph') {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + tok.raw;
        last.text += '\n' + tok.text;
      } else {
        tokens.push(tok);
      }
      top = false;
      src = src.substring(tok.raw.length);
      continue;
    }
    if ((tok = tokText(src))) {
      src = src.substring(tok.raw.length);
      const last = tokens[tokens.length - 1];
      if (last && last.type === 'text') {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + tok.raw;
        last.text += '\n' + tok.text;
      } else {
        tokens.push(tok);
      }
      continue;
    }
    if (src) throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
  }
  ctx.state.top = true;
  return tokens;
}

// ------------------------------------------------------------ block render
// Renders a block token list to HTML. `links` is the reference map.

function renderBlocks(tokens, links) {
  let out = '';
  for (const tok of tokens) {
    switch (tok.type) {
      case 'space': break;
      case 'hr': out += '<hr>\n'; break;
      case 'heading':
        out += '<h' + tok.depth + '>' + renderInline(inlineToHtml(tok.text, links)) + '</h' + tok.depth + '>\n';
        break;
      case 'code': {
        const lang = (tok.lang || '').match(/^\S*/)[0];
        const text = tok.text ? tok.text.replace(/\n$/, '') + '\n' : '';
        out += lang
          ? '<pre><code class="language-' + escapeHtml(lang) + '">' + escapeHtml(text, true) + '</code></pre>\n'
          : '<pre><code>' + escapeHtml(text, true) + '</code></pre>\n';
        break;
      }
      case 'table': {
        let head = '';
        for (const cell of tok.header) {
          head += renderTableCell(cell, true, links);
        }
        let body = '';
        for (const row of tok.rows) {
          let rowHtml = '';
          for (const cell of row) rowHtml += renderTableCell(cell, false, links);
          body += '<tr>\n' + rowHtml + '</tr>\n';
        }
        if (body) body = '<tbody>' + body + '</tbody>';
        out += '<table>\n<thead>\n<tr>\n' + head + '</tr>\n</thead>\n' + body + '</table>\n';
        break;
      }
      case 'blockquote':
        out += '<blockquote>\n' + renderBlocks(tok.tokens, links) + '</blockquote>\n';
        break;
      case 'list': {
        const tag = tok.ordered ? 'ol' : 'ul';
        const start = tok.ordered && tok.start !== 1 ? ' start="' + tok.start + '"' : '';
        let items = '';
        for (const item of tok.items) items += renderListItem(item, tok.loose, links);
        out += '<' + tag + start + '>\n' + items + '</' + tag + '>\n';
        break;
      }
      case 'checkbox': {
        out += '<input ' + (tok.checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"> ';
        break;
      }
      case 'html': out += tok.text; break;
      case 'def': break;
      case 'paragraph': {
        let inner = '';
        if (tok.checkbox) {
          inner += '<input ' + (tok.checkbox.checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"> ';
        }
        inner += renderInline(inlineToHtml(tok.text, links));
        out += '<p>' + inner + '</p>\n';
        break;
      }
      case 'text': {
        // text token: render inline, with a leading checkbox if attached
        let inner = '';
        if (tok.checkbox) {
          inner += '<input ' + (tok.checkbox.checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"> ';
        }
        inner += renderInline(inlineToHtml(tok.text, links));
        out += inner;
        break;
      }
    }
  }
  return out;
}

function renderTableCell(cell, isHeader, links) {
  const tag = isHeader ? 'th' : 'td';
  const inner = renderInline(inlineToHtml(cell.text, links));
  return (cell.align ? '<' + tag + ' align="' + cell.align + '">' : '<' + tag + '>') + inner + '</' + tag + '>\n';
}

function renderListItem(item, loose, links) {
  let inner = '';
  // Tight list: checkbox token is already first in item.tokens (rendered by renderBlocks).
  // Loose list: checkbox is attached to the first paragraph/text token.
  inner += renderBlocks(item.tokens, links);
  return '<li>' + inner + '</li>\n';
}

// --------------------------------------------------------------------- entry

export function parse(markdown) {
  const src = markdown.replace(/\r\n|\r/g, '\n');
  const ctx = { links: Object.create(null), state: { top: true } };
  const tokens = blockTokens(src, [], false, ctx);
  return renderBlocks(tokens, ctx.links);
}
