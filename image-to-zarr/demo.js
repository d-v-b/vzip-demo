// src/deflate.ts
var CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
var CRC32C_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 2197175160 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32c(data) {
  let c = 4294967295;
  for (let i = 0; i < data.length; i++) c = CRC32C_TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
var InflateLimitError = class extends Error {
};
async function transform(data, stream) {
  const out2 = new Response(
    new Blob([data]).stream().pipeThrough(stream)
  );
  return new Uint8Array(await out2.arrayBuffer());
}
async function inflateRaw(data, limit) {
  if (limit === void 0) return transform(data, new DecompressionStream("deflate-raw"));
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks = [];
  let n = 0;
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > limit) {
      await reader.cancel().catch(() => {
      });
      throw new InflateLimitError(`inflates to more than ${limit} bytes`);
    }
    chunks.push(value);
  }
  const out2 = new Uint8Array(n);
  let at = 0;
  for (const c of chunks) {
    out2.set(c, at);
    at += c.length;
  }
  return out2;
}

// src/net_browser.ts
function checkedFetch(_check, _policy) {
  return void 0;
}

// src/uri.ts
var PCT = "%[0-9A-Fa-f]{2}";
var UNRESERVED = "A-Za-z0-9\\-._~";
var SUB_DELIMS = "!$&'()*+,;=";
var PCHAR = `(?:[${UNRESERVED}${SUB_DELIMS}:@]|${PCT})`;
var SPLIT = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;
var SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/;
var AUTHORITY = new RegExp(
  `^(?:(?:[${UNRESERVED}${SUB_DELIMS}:]|${PCT})*@)?(?:\\[[0-9A-Fa-f:.vV${UNRESERVED}${SUB_DELIMS}]+\\]|(?:[${UNRESERVED}${SUB_DELIMS}]|${PCT})*)(?::[0-9]*)?$`
);
var PATH = new RegExp(`^(?:${PCHAR}|/)*$`);
var QUERY = new RegExp(`^(?:${PCHAR}|[/?])*$`);
function split(ref) {
  const m = ref.match(SPLIT);
  return {
    scheme: m[1],
    authority: m[2],
    path: m[3],
    query: m[4],
    fragment: m[5]
  };
}
function isUriReference(ref) {
  if (!/^[\x00-\x7f]*$/.test(ref)) return false;
  const { scheme, authority, path: path2, query, fragment } = split(ref);
  if (scheme !== void 0 && !SCHEME.test(scheme)) return false;
  if (authority !== void 0 && !AUTHORITY.test(authority)) return false;
  if (!PATH.test(path2)) return false;
  if (authority !== void 0 && path2 !== "" && !path2.startsWith("/")) {
    return false;
  }
  if (scheme === void 0 && authority === void 0) {
    if (path2.split("/", 1)[0].includes(":")) return false;
  }
  for (const part of [query, fragment]) {
    if (part !== void 0 && !QUERY.test(part)) return false;
  }
  return true;
}
function removeDotSegments(input2) {
  const out2 = [];
  let path2 = input2;
  while (path2 !== "") {
    if (path2.startsWith("../")) path2 = path2.slice(3);
    else if (path2.startsWith("./")) path2 = path2.slice(2);
    else if (path2.startsWith("/./")) path2 = path2.slice(2);
    else if (path2 === "/.") path2 = "/";
    else if (path2.startsWith("/../")) {
      path2 = path2.slice(3);
      out2.pop();
    } else if (path2 === "/..") {
      path2 = "/";
      out2.pop();
    } else if (path2 === "." || path2 === "..") path2 = "";
    else {
      const i = path2.indexOf("/", 1);
      const segment = i === -1 ? path2 : path2.slice(0, i);
      path2 = i === -1 ? "" : path2.slice(i);
      out2.push(segment);
    }
  }
  return out2.join("");
}
function compose(p) {
  let s = p.scheme !== void 0 ? `${p.scheme}:` : "";
  if (p.authority !== void 0) s += `//${p.authority}`;
  s += p.path;
  if (p.query !== void 0) s += `?${p.query}`;
  if (p.fragment !== void 0) s += `#${p.fragment}`;
  return s;
}
function resolveReference(base, ref) {
  if (!isUriReference(ref)) {
    throw new Error(`not a valid URI reference: ${JSON.stringify(ref)}`);
  }
  const b = split(base);
  const r = split(ref);
  if (r.scheme !== void 0) {
    return compose({ ...r, path: removeDotSegments(r.path) });
  }
  if (r.authority !== void 0) {
    return compose({ ...r, scheme: b.scheme, path: removeDotSegments(r.path) });
  }
  if (r.path === "") {
    return compose({
      scheme: b.scheme,
      authority: b.authority,
      path: b.path,
      query: r.query ?? b.query,
      fragment: r.fragment
    });
  }
  let path2;
  if (r.path.startsWith("/")) path2 = removeDotSegments(r.path);
  else if (b.authority !== void 0 && b.path === "") {
    path2 = removeDotSegments("/" + r.path);
  } else {
    path2 = removeDotSegments(
      b.path.slice(0, b.path.lastIndexOf("/") + 1) + r.path
    );
  }
  return compose({
    scheme: b.scheme,
    authority: b.authority,
    path: path2,
    query: r.query,
    fragment: r.fragment
  });
}
function getScheme(url) {
  return split(url).scheme?.toLowerCase();
}
function checkHttpUrl(url) {
  const { authority } = split(url);
  if (authority === void 0 || authority === "") {
    throw new Error(`${url}: empty or absent host`);
  }
  if (authority.includes("@")) throw new Error(`${url}: userinfo in URL`);
  const hostPort = authority.match(/^(\[[^\]]*\]|[^:]*)(?::(.*))?$/);
  if (hostPort[1] === "") throw new Error(`${url}: empty host`);
  const port = hostPort[2];
  if (port !== void 0 && port !== "") {
    if (!/^[0-9]+$/.test(port) || Number(port) > 65535) {
      throw new Error(`${url}: invalid port ${JSON.stringify(port)}`);
    }
  }
}
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function parseImfFixdate(value) {
  if (value === null) return void 0;
  const m = value.match(
    /^([A-Za-z]{3}), (\d{2}) ([A-Za-z]{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/
  );
  if (m === null) return void 0;
  const month = MONTHS.indexOf(m[3]);
  if (!DAYS.includes(m[1]) || month === -1) return void 0;
  const [day, year, hour, minute, second] = [m[2], m[4], m[5], m[6], m[7]].map(
    Number
  );
  if (hour > 23 || minute > 59 || second > 60) return void 0;
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, minute, second === 60 ? 59 : second);
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month) {
    return void 0;
  }
  if (DAYS[date.getUTCDay()] !== m[1]) return void 0;
  return Math.floor(date.getTime() / 1e3) + (second === 60 ? 1 : 0);
}
function formatImfFixdate(seconds) {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCSeconds(Number(seconds));
  const year = date.getUTCFullYear();
  if (!Number.isFinite(date.getTime()) || year < 1 || year > 9999) {
    throw new Error("modified_not_after cannot be written as an HTTP-date");
  }
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${DAYS[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${pad(year, 4)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} GMT`;
}

// src/http.ts
var HttpResolutionError = class extends Error {
};
function single(headers, name) {
  return headers.get(name);
}
async function readHttpRange(url, start, end, pins, signal, options = {}) {
  try {
    checkHttpUrl(url);
  } catch (e) {
    throw new HttpResolutionError(e.message);
  }
  const headers = {
    Range: `bytes=${start}-${end - 1}`,
    // Ignored by browsers (forbidden header); honoured elsewhere.
    "Accept-Encoding": "identity"
  };
  if (pins.etag !== void 0) headers["If-Match"] = pins.etag;
  if (pins.modifiedNotAfter !== void 0) {
    try {
      headers["If-Unmodified-Since"] = formatImfFixdate(pins.modifiedNotAfter);
    } catch (e) {
      throw new HttpResolutionError(e.message);
    }
  }
  let response;
  try {
    response = options.fetch ? await options.fetch(url, { headers, signal }, options.allow) : await fetch(url, { headers, signal, redirect: "follow", cache: "no-store" });
  } catch (e) {
    signal?.throwIfAborted();
    throw new HttpResolutionError(`${url}: ${e.message}`);
  }
  const fail = (message) => {
    throw new HttpResolutionError(`${url}: ${message}`);
  };
  if (response.redirected) {
    try {
      checkHttpUrl(response.url);
      options.allow?.(response.url);
    } catch (e) {
      await response.body?.cancel();
      fail(e.message);
    }
  }
  if (response.status === 412) fail("a pin failed (412)");
  if (response.status === 416)
    fail("the object is shorter than the range (416)");
  if (response.status !== 200 && response.status !== 206) {
    fail(`HTTP ${response.status}`);
  }
  const encoding = response.headers.get("Content-Encoding");
  if (encoding !== null) {
    const values = encoding.split(",").map((v) => v.trim().toLowerCase());
    if (values.length !== 1 || values[0] !== "identity") {
      fail(`response has Content-Encoding ${JSON.stringify(encoding)}`);
    }
  }
  const etag = single(response.headers, "ETag");
  if (etag !== null && etag.includes(",")) fail("more than one ETag field");
  const lastModified = single(response.headers, "Last-Modified");
  if (lastModified !== null && lastModified.split(",").length > 2) {
    fail("more than one Last-Modified field");
  }
  const skip = (header) => header === null && response.type === "cors" && options.unverifiablePins === true;
  if (pins.etag !== void 0 && etag !== pins.etag && !skip(etag)) {
    fail(
      `the ETag is ${JSON.stringify(etag)}, but the archive pins ${pins.etag}: the source changed since the archive was written, or its server does not send the ETag`
    );
  }
  if (pins.modifiedNotAfter !== void 0 && !skip(lastModified)) {
    const t = parseImfFixdate(lastModified);
    if (t === void 0) {
      fail(
        `Last-Modified ${JSON.stringify(lastModified)} is not an IMF-fixdate`
      );
    }
    if (BigInt(t) > pins.modifiedNotAfter)
      fail("Last-Modified is after the pin");
  }
  const body = new Uint8Array(await response.arrayBuffer());
  if (response.status === 200) {
    if (body.length < end) fail(`object is shorter than ${end} bytes`);
    return { data: body.slice(start, end), size: body.length, ...etag !== null ? { etag } : {} };
  }
  const contentRange = single(response.headers, "Content-Range");
  if (contentRange === null && response.type === "cors") {
    if (body.length !== end - start) {
      fail(`206 of ${body.length} bytes for [${start}, ${end})`);
    }
    return { data: body, size: void 0, hidden: true, ...etag !== null ? { etag } : {} };
  }
  if (contentRange === null) fail("206 without Content-Range");
  const m = contentRange.trim().match(/^bytes (\d+)-(\d+)\/(\d+|\*)$/i);
  if (m === null) fail(`invalid Content-Range ${JSON.stringify(contentRange)}`);
  const a = Number(m[1]);
  const z = Number(m[2]);
  const total = m[3] === "*" ? void 0 : Number(m[3]);
  if (a !== start || z !== end - 1 || body.length !== z - a + 1 || total !== void 0 && z >= total) {
    fail(
      `server returned ${JSON.stringify(contentRange)} (${body.length} bytes) for [${start}, ${end})`
    );
  }
  return { data: body, size: total, ...etag !== null ? { etag } : {} };
}

// src/protobuf.ts
var MalformedError = class extends Error {
};
var U64_MAX = (1n << 64n) - 1n;
var U32_MAX = 0xffffffffn;
var utf8 = new TextEncoder();
var strictUtf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
function* fields(buf) {
  let pos = 0;
  const varint = () => {
    let v = 0n;
    for (let i = 0; i < 10; i++) {
      if (pos >= buf.length) throw new MalformedError("truncated varint");
      const b = buf[pos++];
      v |= BigInt(b & 127) << BigInt(7 * i);
      if (!(b & 128)) {
        if (v > U64_MAX) throw new MalformedError("varint exceeds 2^64 - 1");
        return v;
      }
    }
    throw new MalformedError("varint longer than 10 bytes");
  };
  while (pos < buf.length) {
    const key = varint();
    const field = Number(key >> 3n);
    const wireType = Number(key & 7n);
    if (key >> 3n === 0n || key >> 3n > (1n << 29n) - 1n) {
      throw new MalformedError(`invalid field number ${key >> 3n}`);
    }
    let value;
    switch (wireType) {
      case 0:
        value = varint();
        break;
      case 1:
      case 5: {
        const n = wireType === 1 ? 8 : 4;
        if (pos + n > buf.length) throw new MalformedError("truncated field");
        value = buf.subarray(pos, pos + n);
        pos += n;
        break;
      }
      case 2: {
        const n = varint();
        if (BigInt(pos) + n > BigInt(buf.length)) {
          throw new MalformedError("LEN field extends past the message");
        }
        value = buf.subarray(pos, pos + Number(n));
        pos += Number(n);
        break;
      }
      default:
        throw new MalformedError(`wire type ${wireType}`);
    }
    yield { field, wireType, value };
  }
}
function expect(f, kind) {
  if (f.wireType !== (kind === "varint" ? 0 : 2)) {
    throw new MalformedError(`field ${f.field} has wire type ${f.wireType}`);
  }
  return f.value;
}
function string(f) {
  try {
    return strictUtf8.decode(expect(f, "len"));
  } catch (e) {
    if (e instanceof MalformedError) throw e;
    throw new MalformedError(`field ${f.field} is not valid UTF-8`);
  }
}
function decodeRange(buf, numSources) {
  let source = 0n;
  let offset = 0n;
  let length = 0n;
  let data;
  let crc;
  for (const f of fields(buf)) {
    switch (f.field) {
      case 1:
        source = expect(f, "varint");
        if (source > U32_MAX) throw new MalformedError("source exceeds uint32");
        break;
      case 6:
        crc = expect(f, "varint");
        if (crc > U32_MAX) throw new MalformedError("crc32c exceeds uint32");
        break;
      case 3:
        offset = expect(f, "varint");
        break;
      case 4:
        length = expect(f, "varint");
        break;
      case 5:
        data = expect(f, "len");
        break;
    }
  }
  if (data !== void 0) {
    if (source !== 0n || offset !== 0n || length !== 0n) {
      throw new MalformedError("literal range with source, offset or length");
    }
    if (crc !== void 0) throw new MalformedError("literal range with a crc32c");
    return { data };
  }
  if (source >= BigInt(numSources)) {
    throw new MalformedError(`source ${source} >= ${numSources} sources`);
  }
  if (offset + length > U64_MAX) {
    throw new MalformedError("offset + length exceeds 2^64 - 1");
  }
  return crc === void 0 ? { source: Number(source), offset, length } : { source: Number(source), offset, length, crc32c: Number(crc) };
}
function rangeSize(r) {
  return "data" in r ? BigInt(r.data.length) : r.length;
}
function decodeReference(headerId, payload, numSources) {
  if (payload.length > 65519) {
    throw new MalformedError("reference payload exceeds 65519 bytes");
  }
  let parts;
  if (headerId === 31350) {
    parts = [decodeRange(payload, numSources)];
  } else {
    parts = [];
    for (const f of fields(payload)) {
      if (f.field === 1) parts.push(decodeRange(expect(f, "len"), numSources));
    }
  }
  if (parts.reduce((n, p) => n + rangeSize(p), 0n) > U64_MAX) {
    throw new MalformedError("reference size exceeds 2^64 - 1");
  }
  return parts;
}
var STRONG_ETAG = /^"[\x21\x23-\x7e]*"$/;
function decodeTable(buf) {
  const sources = [];
  let revision;
  for (const f of fields(buf)) {
    if (f.field === 2) {
      const v = expect(f, "varint");
      if (v > U32_MAX) throw new MalformedError("revision exceeds uint32");
      revision = Number(v);
      continue;
    }
    if (f.field !== 1) continue;
    const s = {};
    let kind;
    for (const g of fields(expect(f, "len"))) {
      switch (g.field) {
        case 1:
          s.url = string(g);
          kind = "url";
          break;
        case 2:
          s.key = string(g);
          kind = "key";
          break;
        case 3:
          s.data = expect(g, "len");
          kind = "data";
          break;
        case 4:
          s.size = expect(g, "varint");
          break;
        case 5:
          s.etag = string(g);
          break;
        case 6: {
          const v = expect(g, "varint");
          s.modifiedNotAfter = v > (1n << 63n) - 1n ? v - (1n << 64n) : v;
          break;
        }
      }
    }
    if (kind === void 0) throw new MalformedError("a source has no kind");
    for (const k of ["url", "key", "data"]) {
      if (k !== kind) delete s[k];
    }
    if ((kind === "url" || kind === "key") && s[kind] === "") {
      throw new MalformedError(`empty ${kind} source`);
    }
    const pinned = s.size !== void 0 || s.etag !== void 0 || s.modifiedNotAfter !== void 0;
    if (pinned && kind !== "url") {
      throw new MalformedError(`pin on a ${kind} source`);
    }
    if (s.etag !== void 0 && !STRONG_ETAG.test(s.etag)) {
      throw new MalformedError(`etag ${s.etag} is not a strong entity tag`);
    }
    sources.push(s);
  }
  return revision === void 0 ? { sources } : { sources, revision };
}

// src/writer.ts
var RANGE_ID = 31350;
var CONCAT_ID = 31351;
var U64_MAX2 = (1n << 64n) - 1n;
var utf82 = new TextEncoder();

// src/archive.ts
var VzipError = class extends Error {
  errorClass;
  constructor(errorClass, message) {
    super(`vzip ${errorClass} error: ${message}`);
    this.errorClass = errorClass;
  }
};
var DEFAULT_POLICY = {
  schemes: [],
  allowFilesFromRemoteArchives: false,
  allowPrivateHosts: false,
  allowUncheckedProxy: false,
  maxSources: 1 << 22,
  maxReads: 1024,
  maxFormatEntry: 256 << 20,
  unverifiablePins: false
};
function schemeOf(url) {
  const i = url.indexOf(":");
  const s = i < 0 ? "" : url.slice(0, i).toLowerCase();
  return s === "https" ? "http" : s;
}
function matchesPrefix(url, prefix2) {
  if (!url.startsWith(prefix2)) return false;
  const rest = url.slice(prefix2.length);
  if (!(prefix2.endsWith("/") || rest === "" || "/?#".includes(rest[0]))) return false;
  const path2 = url.split(/[?#]/, 1)[0];
  return !/%(2[eEfF]|5[cC])/.test(path2);
}
function parseIPv4(s) {
  const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return void 0;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return void 0;
  return parts.reduce((a, p) => a << 8n | BigInt(p), 0n);
}
function parseIPv6(s) {
  let text2 = s.split("%", 1)[0];
  const tail = [];
  const dotted = text2.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const v4 = parseIPv4(dotted[2]);
    if (v4 === void 0) return void 0;
    tail.push(Number(v4 >> 16n), Number(v4 & 0xffffn));
    text2 = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1);
  }
  const halves = text2.split("::");
  if (halves.length > 2) return void 0;
  const groups = (h) => h === "" ? [] : h.split(":");
  const head = groups(halves[0]);
  const rest = halves.length === 2 ? groups(halves[1]) : [];
  if (![...head, ...rest].every((g) => /^[0-9a-fA-F]{1,4}$/.test(g))) return void 0;
  const n = head.length + rest.length + tail.length;
  if (halves.length === 1 ? n !== 8 : n > 7) return void 0;
  const words = [
    ...head.map((g) => parseInt(g, 16)),
    ...Array(8 - n).fill(0),
    ...rest.map((g) => parseInt(g, 16)),
    ...tail
  ];
  return words.reduce((a, w) => a << 16n | BigInt(w), 0n);
}
function nets(version, list) {
  return list.map((n) => {
    const [addr, len] = n.split("/");
    return [version === 4 ? parseIPv4(addr) : parseIPv6(addr), Number(len)];
  });
}
var CLASSES = [
  ["loopback", nets(4, ["127.0.0.0/8"]), nets(6, ["::1/128"])],
  ["private", nets(4, ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]), nets(6, ["fc00::/7"])],
  ["link-local", nets(4, ["169.254.0.0/16"]), nets(6, ["fe80::/10"])],
  [
    "special",
    nets(4, [
      "0.0.0.0/8",
      "100.64.0.0/10",
      "192.0.0.0/24",
      "192.0.2.0/24",
      "198.18.0.0/15",
      "198.51.100.0/24",
      "203.0.113.0/24",
      "224.0.0.0/3"
    ]),
    nets(6, [
      "::/8",
      "64:ff9b:1::/48",
      "100::/63",
      "2001::/23",
      "2001:db8::/32",
      "3fff::/20",
      "5f00::/16",
      "fec0::/10",
      "ff00::/8"
    ])
  ]
];
var within = (a, bits, [net, len]) => a >> BigInt(bits - len) === net >> BigInt(bits - len);
function classOf(a, version) {
  if (version === 6) {
    if (a >> 32n === 0xffffn || a >> 32n === 0x64ff9b0000000000000000n) return classOf(a & 0xffffffffn, 4);
    if (a >> 112n === 0x2002n) return classOf(a >> 80n & 0xffffffffn, 4);
  }
  for (const [c, v4, v6] of CLASSES) {
    if ((version === 4 ? v4 : v6).some((n) => within(a, version === 4 ? 32 : 128, n))) return c;
  }
  return "public";
}
function addressClass(address2) {
  const v4 = parseIPv4(address2);
  if (v4 !== void 0) return classOf(v4, 4);
  const v6 = address2.includes(":") ? parseIPv6(address2) : void 0;
  return v6 === void 0 ? void 0 : classOf(v6, 6);
}
function hostClass(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return void 0;
  }
  if (host === "localhost" || host.endsWith(".localhost")) return "loopback";
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  return addressClass(host);
}
function validatePolicy(policy) {
  if ((policy.schemes ?? []).some((s) => s.toLowerCase() === "file")) {
    throw new TypeError(
      "Policy.schemes may not name 'file': a local archive reads files already, and a remote one needs the unsafe allowFilesFromRemoteArchives: true"
    );
  }
}
function checkPolicy(policy, base, url) {
  validatePolicy(policy);
  const local = schemeOf(base) === "file";
  const scheme = schemeOf(url);
  if (policy.prefixes !== void 0) {
    if (!policy.prefixes.some((p) => matchesPrefix(url, p))) {
      throw new VzipError("resolution", `${url}: not under an allowed URL prefix (spec \xA78.7)`);
    }
  } else if (scheme === "file") {
    if (!local && !policy.allowFilesFromRemoteArchives) {
      throw new VzipError("resolution", `${url}: an archive opened from a URL may not read local files (spec \xA78.7)`);
    }
  } else if (scheme !== "http" && !(policy.schemes ?? []).some((s) => schemeOf(`${s}:`) === scheme)) {
    throw new VzipError("resolution", `${url}: the scheme '${scheme}' is not allowed (spec \xA78.7)`);
  }
  if (scheme !== "http") return;
  const c = hostClass(url);
  if (c !== void 0) checkClass(policy, url, c);
}
function checkClass(policy, url, c, address2) {
  if (c === "public" || policy.allowPrivateHosts) return;
  const at = address2 === void 0 ? "" : ` (at ${address2})`;
  throw new VzipError(
    "resolution",
    `${url}: the host${at} is a ${c} address, which the reader does not reach without allowPrivateHosts: true (spec \xA78.7)`
  );
}
function checkAddress(policy, url, address2) {
  const c = addressClass(address2);
  if (c === void 0) throw new VzipError("resolution", `${url}: ${address2} is not an IP address`);
  checkClass(policy, url, c, address2);
}
var MERGE_GAP = 1 << 16;
var U16_ALL = 65535;
var U32_ALL = 4294967295;
var strictUtf82 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
function safe(v, what) {
  if (v > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new VzipError("archive", `${what} is too large`);
  }
  return Number(v);
}
function parseExtra(extra, view, base) {
  const blocks = [];
  let at = 0;
  while (at < extra.length) {
    if (at + 4 > extra.length) return void 0;
    const id = view.getUint16(base + at, true);
    const n = view.getUint16(base + at + 2, true);
    if (at + 4 + n > extra.length) return void 0;
    blocks.push({ id, data: extra.subarray(at + 4, at + 4 + n) });
    at += 4 + n;
  }
  return blocks;
}
var Archive = class _Archive {
  bytes;
  baseUrl;
  sources;
  entries;
  /** The spec revision the writer followed, if the archive records one (spec §1.3). */
  revision;
  policy;
  fetchRange;
  /** Sends this archive's requests, checking addresses (rule 3), where the platform allows. */
  netFetch;
  constructor(bytes, baseUrl, sources, entries, fetchRange, policy, revision) {
    this.bytes = bytes;
    this.baseUrl = baseUrl;
    this.sources = sources;
    this.entries = entries;
    this.fetchRange = fetchRange;
    this.policy = policy;
    this.revision = revision;
    this.netFetch = policy.allowPrivateHosts ? void 0 : checkedFetch((url, address2) => checkAddress(policy, url, address2), policy);
  }
  /**
   * Opens an archive (spec §8.1); `baseUrl` resolves relative `url` sources.
   * `policy` (spec §8.7) defaults to `DEFAULT_POLICY`, which allows http(s)
   * sources on public hosts, and for a local archive also `file` sources and
   * loopback and private hosts.
   */
  static async open(bytes, baseUrl, fetchRange = (url, start, end, pins, options) => readHttpRange(url, start, end, pins, void 0, options), policy = {}) {
    validatePolicy(policy);
    const rules = { ...DEFAULT_POLICY, ...policy };
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const n = bytes.length;
    let eocd = -1;
    for (const commentLength of [38, 22]) {
      const at2 = n - 22 - commentLength;
      if (at2 >= 0 && view.getUint32(at2, true) === 101010256 && view.getUint16(at2 + 20, true) === commentLength) {
        eocd = at2;
        break;
      }
    }
    if (eocd < 0) throw new VzipError("archive", "not a vzip archive");
    const comment = bytes.subarray(eocd + 22);
    const magic = new TextDecoder().decode(comment.subarray(0, 6));
    if (!magic.startsWith("vzip/")) {
      throw new VzipError("archive", "not a vzip archive");
    }
    if (magic !== "vzip/0") {
      throw new VzipError("archive", `unsupported version ${magic}`);
    }
    let count = BigInt(view.getUint16(eocd + 10, true));
    let cdSize = BigInt(view.getUint32(eocd + 12, true));
    let cdOffset = BigInt(view.getUint32(eocd + 16, true));
    if (view.getUint16(eocd + 8, true) === U16_ALL || count === BigInt(U16_ALL) || cdSize === BigInt(U32_ALL) || cdOffset === BigInt(U32_ALL)) {
      const loc = eocd - 20;
      if (loc < 0 || view.getUint32(loc, true) !== 117853008) {
        throw new VzipError("archive", "missing zip64 locator");
      }
      const at2 = safe(view.getBigUint64(loc + 8, true), "zip64 record offset");
      if (at2 + 56 > n || view.getUint32(at2, true) !== 101075792 || view.getBigUint64(at2 + 4, true) !== 44n) {
        throw new VzipError("archive", "invalid zip64 end of central directory");
      }
      count = view.getBigUint64(at2 + 32, true);
      cdSize = view.getBigUint64(at2 + 40, true);
      cdOffset = view.getBigUint64(at2 + 48, true);
    }
    void count;
    const cdStart = safe(cdOffset, "central directory offset");
    const cdEnd = cdStart + safe(cdSize, "central directory size");
    if (cdEnd > n) throw new VzipError("archive", "central directory outside the file");
    const entries = /* @__PURE__ */ new Map();
    let at = cdStart;
    while (at < cdEnd) {
      if (at + 46 > cdEnd || view.getUint32(at, true) !== 33639248) {
        throw new VzipError("archive", `bad central directory record at ${at}`);
      }
      const flags = view.getUint16(at + 8, true);
      const method = view.getUint16(at + 10, true);
      const csize = view.getUint32(at + 20, true);
      const size = view.getUint32(at + 24, true);
      const nameLen = view.getUint16(at + 28, true);
      const extraLen = view.getUint16(at + 30, true);
      const commentLen = view.getUint16(at + 32, true);
      let offset = view.getUint32(at + 42, true);
      const end = at + 46 + nameLen + extraLen + commentLen;
      if (end > cdEnd) throw new VzipError("archive", "truncated central directory");
      const nameBytes = bytes.subarray(at + 46, at + 46 + nameLen);
      const extraStart = at + 46 + nameLen;
      const extra = bytes.subarray(extraStart, extraStart + extraLen);
      at = end;
      let key;
      try {
        key = strictUtf82.decode(nameBytes);
      } catch {
        continue;
      }
      if (key === "") continue;
      if (entries.has(key)) throw new VzipError("archive", `duplicate key ${key}`);
      const entry = { key, method, csize, size, bodyOffset: 0 };
      entries.set(key, entry);
      const blocks = parseExtra(extra, view, extraStart);
      const refs = blocks?.filter((b) => b.id === RANGE_ID || b.id === CONCAT_ID) ?? [];
      const zip64 = blocks?.filter((b) => b.id === 1) ?? [];
      if (blocks === void 0) entry.error = "unparseable extra field";
      else if (refs.length > 1) entry.error = "more than one reference block";
      else if (zip64.length > 1) entry.error = "more than one zip64 block";
      else if (csize === U32_ALL || size === U32_ALL) entry.error = "size field is 0xFFFFFFFF";
      else if (offset === U32_ALL) {
        if (zip64.length === 0 || zip64[0].data.length < 8) {
          entry.error = "offset needs a zip64 block";
        } else {
          offset = new DataView(
            zip64[0].data.buffer,
            zip64[0].data.byteOffset
          ).getBigUint64(0, true);
        }
      }
      if (entry.error === void 0 && method !== 0 && method !== 8) {
        entry.error = `compression method ${method}`;
      } else if (entry.error === void 0 && flags & 1) {
        entry.error = "encrypted";
      }
      if (entry.error === void 0 && refs.length === 1) {
        if (method !== 0) entry.error = "reference entry with method 8";
        entry.reference = { headerId: refs[0].id, payload: refs[0].data };
      }
      entry.bodyOffset = typeof offset === "bigint" ? Number(offset) + 30 + nameLen : offset + 30 + nameLen;
    }
    const cview = new DataView(comment.buffer, comment.byteOffset, comment.byteLength);
    const sOffset = safe(cview.getBigUint64(6, true), "sources offset");
    const sSize = safe(cview.getBigUint64(14, true), "sources size");
    if (sOffset + sSize > n) throw new VzipError("archive", "source table outside the file");
    let table;
    try {
      table = decodeTable(
        await inflateRaw(bytes.subarray(sOffset, sOffset + sSize), rules.maxFormatEntry)
      );
    } catch (e) {
      const why = e instanceof InflateLimitError ? `${e.message}; this reader allows ${rules.maxFormatEntry} (spec \xA78.7)` : e.message;
      throw new VzipError("archive", `source table: ${why}`);
    }
    if (table.sources.length > rules.maxSources) {
      throw new VzipError(
        "archive",
        `the source table has ${table.sources.length} sources; this reader allows ${rules.maxSources}`
      );
    }
    return new _Archive(bytes, baseUrl, table.sources, entries, fetchRange, rules, table.revision);
  }
  /** The visible entry for `key`, or undefined (spec §8.2). */
  lookup(key) {
    if (key.startsWith("__vz__/")) return void 0;
    const entry = this.entries.get(key);
    if (entry?.error !== void 0) {
      throw new VzipError("entry", `${JSON.stringify(key)}: ${entry.error}`);
    }
    return entry;
  }
  /** Visible keys, in UTF-8 order. */
  keys() {
    return [...this.entries.keys()].filter((k) => !k.startsWith("__vz__/")).sort((a, b) => compareUtf8(a, b));
  }
  ranges(entry) {
    try {
      return decodeReference(
        entry.reference.headerId,
        entry.reference.payload,
        this.sources.length
      );
    } catch (e) {
      if (!(e instanceof MalformedError)) throw e;
      throw new VzipError("payload", `${JSON.stringify(entry.key)}: ${e.message}`);
    }
  }
  /** Size of an entry's value. */
  size(entry) {
    if (entry.reference === void 0) return entry.size;
    const total = this.ranges(entry).reduce((n, r) => n + rangeSize(r), 0n);
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new VzipError("request", "value is too large for this reader");
    }
    return Number(total);
  }
  async body(entry) {
    const end = entry.bodyOffset + entry.csize;
    if (end > this.bytes.length) {
      throw new VzipError("body", `${entry.key}: body outside the file`);
    }
    const stored = this.bytes.subarray(entry.bodyOffset, end);
    let body = stored;
    if (entry.method === 8) {
      try {
        body = await inflateRaw(stored, entry.size);
      } catch (e) {
        throw new VzipError("body", `${entry.key}: ${e.message}`);
      }
    } else if (entry.csize !== entry.size) {
      throw new VzipError("body", `${entry.key}: STORED sizes differ`);
    }
    if (body.length !== entry.size) {
      throw new VzipError("body", `${entry.key}: inflates to ${body.length} bytes`);
    }
    return body;
  }
  async source(r) {
    const s = this.sources[r.source];
    const start = r.offset;
    const end = r.offset + r.length;
    const fail = (m) => {
      throw new VzipError("resolution", `source ${r.source}: ${m}`);
    };
    if (s.data !== void 0) {
      if (end > BigInt(s.data.length)) fail("range past the end of the data");
      return s.data.subarray(Number(start), Number(end));
    }
    if (s.key !== void 0) {
      const target = this.entries.get(s.key);
      if (target === void 0 || target.reference !== void 0 || target.error) {
        fail(`key ${JSON.stringify(s.key)} is not a bytes entry`);
      }
      const value = await this.body(target);
      if (end > BigInt(value.length)) fail("range past the end of the key's value");
      return value.subarray(Number(start), Number(end));
    }
    let url;
    try {
      url = resolveReference(this.baseUrl, s.url);
    } catch (e) {
      return fail(e.message);
    }
    checkPolicy(this.policy, this.baseUrl, url);
    const scheme = getScheme(url);
    if (scheme !== "http" && scheme !== "https") fail(`unsupported scheme in ${url}`);
    try {
      const { data, size, hidden } = await this.fetchRange(
        url,
        safe(start, "offset"),
        safe(end, "end"),
        s,
        {
          allow: (u2) => checkPolicy(this.policy, this.baseUrl, u2),
          unverifiablePins: this.policy.unverifiablePins,
          ...this.netFetch ? { fetch: this.netFetch } : {}
        }
      );
      const unseen = size === void 0 && hidden === true && this.policy.unverifiablePins;
      if (s.size !== void 0 && !unseen && BigInt(size ?? -1) !== s.size) {
        fail(
          size === void 0 ? `${url}: the archive pins the size ${s.size}, which the response does not give` : `${url}: the source is ${size} bytes, but the archive pins ${s.size}: the source changed since the archive was written`
        );
      }
      return data;
    } catch (e) {
      if (e instanceof HttpResolutionError) fail(e.message);
      throw e;
    }
  }
  /** Bytes `[start, end)` of a visible key's value, or undefined if absent. */
  async read(key, start = 0, end) {
    const entry = this.lookup(key);
    if (entry === void 0) return void 0;
    const size = this.size(entry);
    end ??= size;
    if (start < 0 || end < start || end > size) {
      throw new VzipError("request", `range [${start}, ${end}) of a ${size}-byte value`);
    }
    if (entry.reference === void 0) {
      return (await this.body(entry)).subarray(start, end);
    }
    const parts = [];
    const cuts = [];
    let at = 0;
    for (const r of this.ranges(entry)) {
      const n = Number(rangeSize(r));
      const a = Math.max(start, at);
      const b = Math.min(end, at + n);
      if (a < b) {
        if ("data" in r) {
          parts.push(Promise.resolve(r.data.subarray(a - at, b - at)));
          cuts.push({ lo: 0, hi: b - a });
        } else {
          let read;
          if (r.crc32c === void 0) {
            read = { source: r.source, offset: r.offset + BigInt(a - at), length: BigInt(b - a) };
            cuts.push({ lo: 0, hi: b - a });
          } else {
            read = { source: r.source, offset: r.offset, length: r.length };
            cuts.push({ lo: a - at, hi: b - at, crc: r.crc32c });
          }
          parts.push(this.sources[r.source].url !== void 0 ? read : this.source(read));
        }
      }
      at += n;
    }
    const reads = parts.filter((p) => !(p instanceof Promise));
    const sorted = [...reads].sort((x, y) => x.source - y.source || (x.offset < y.offset ? -1 : x.offset > y.offset ? 1 : 0));
    const runs = [];
    const runOf = /* @__PURE__ */ new Map();
    for (const read of sorted) {
      const last = runs[runs.length - 1];
      const readEnd = read.offset + read.length;
      if (last && last.source === read.source && read.offset - last.end <= BigInt(MERGE_GAP)) {
        if (readEnd > last.end) last.end = readEnd;
      } else {
        runs.push({ source: read.source, offset: read.offset, end: readEnd });
      }
      runOf.set(read, runs[runs.length - 1]);
    }
    if (runs.length > this.policy.maxReads) {
      for (const p of parts) if (p instanceof Promise) p.catch(() => {
      });
      throw new VzipError(
        "request",
        `the value needs ${runs.length} reads; this reader allows ${this.policy.maxReads} (spec \xA78.7)`
      );
    }
    for (const run of runs) {
      run.data = this.source({ source: run.source, offset: run.offset, length: run.end - run.offset });
    }
    const whole = await Promise.all(
      parts.map(async (p) => {
        if (p instanceof Promise) return p;
        const run = runOf.get(p);
        const from = Number(p.offset - run.offset);
        return (await run.data).subarray(from, from + Number(p.length));
      })
    );
    const chunks = whole.map((data, i) => {
      const { lo, hi, crc } = cuts[i];
      if (crc !== void 0 && crc32c(data) !== crc) {
        throw new VzipError(
          "resolution",
          `the bytes read do not match the range's crc32c ${crc} (got ${crc32c(data)}): the source changed since the archive was written`
        );
      }
      return data.subarray(lo, hi);
    });
    const out2 = new Uint8Array(end - start);
    let o = 0;
    for (const c of chunks) {
      out2.set(c, o);
      o += c.length;
    }
    return out2;
  }
};
function compareUtf8(a, b) {
  const x = [...a];
  const y = [...b];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = x[i].codePointAt(0) - y[i].codePointAt(0);
    if (d !== 0) return d;
  }
  return x.length - y.length;
}

// src/virtualize/common.ts
var PROFILES = {
  tiff: ["48e9ac4e-1156-4a62-955e-20467d9c2700", 0, "TIFF"],
  ndpi: ["6cac71ef-dbb2-4acd-b60c-00389aa4238a", 0, "NDPI"],
  nd2: ["59612f14-e314-4207-ba00-8f422ba71490", 0, "ND2"],
  dicom: ["acf17198-e5a5-48d3-8187-22ec4bb40ea5", 0, "DICOM"],
  nifti: ["06e5809d-4d54-4b72-afd0-6bf61a7b4c85", 0, "NIfTI"],
  ims: ["5067a535-8261-4b25-a93c-1985ed333bde", 0, "IMS"],
  n5: ["ad5d4c39-c69e-48f7-a3ef-4cc8c607d416", 0, "N5"],
  zarr2: ["8e792619-d671-4687-ab51-752885dd3ee6", 0, "Zarr v2"],
  "ome-zarr": ["b74ea302-65bb-49ae-b81f-f9bb52cd4eed", 0, "OME-Zarr"],
  safe: ["ef81346c-19e8-42ad-93b0-a279ccaf44c1", 0, "Sentinel-2 SAFE"],
  czi: ["7a0733c7-d4be-4482-a64f-6904d9354ea5", 0, "CZI"]
};
var UUIDS = new Set(Object.values(PROFILES).map(([uuid]) => uuid));
var SOURCE_NODE = "vzip_source";
var MAX_CHUNK = 2 ** 24;
var MAX_PADDING = 2 ** 16 - 2 ** 10;
var SMALL_PADDING = 2 ** 10;
var MAX_TOTAL_PADDING = 2 ** 20;
var RAGGED_CHUNK = 2 ** 20;

// src/virtualize/dicom/dataset.ts
var LONG_VRS = /* @__PURE__ */ new Set(["OB", "OD", "OF", "OL", "OV", "OW", "SQ", "SV", "UC", "UN", "UR", "UT", "UV"]);
var VRS = /* @__PURE__ */ new Set([
  ...LONG_VRS,
  "AE",
  "AS",
  "AT",
  "CS",
  "DA",
  "DS",
  "DT",
  "FD",
  "FL",
  "IS",
  "LO",
  "LT",
  "PN",
  "SH",
  "SL",
  "SS",
  "ST",
  "TM",
  "UI",
  "UL",
  "US"
]);

// ../python/src/vzip/virtualize/dicom/dictionary.json
var dictionary_default = { source: "PS3.6 as shipped by pydicom 3.0.2", tags: { AE: "00000200000003000000040000000600000010300002001600020017000200180008005400080055000810000032102100400001004002410072005E00741234007412362100007021000140", AS: "001010100072005F", AT: "000009010000100500140202002050000020916500209167002800090028000A0028006600280404002807020028072100720026007200520072006000741052040000202200000E300800613008006230080065", CS: "000051300000514000005150000051600000518000005190000051A0000411300004114100041142000414300004150000080005000800080008001C0008004200080052000800530008005600080060000800610008006400080068000801050008010A0008010B0008010F0008022100080303000803070008030A00080403000804050008040A0008040F000804150008041700080426000821100008220000082204000822080008900700089205000892060008920700089208000892090008946000100022001000350010004000100200001021A0001022030010221000102298001200530012006200120084001200850014005000140052001401010014010700140108001402050014201A0014201C001422080014220C0014220E00142228001440040014400A001440130014402600144032001440360014408100145105001451090014511E001600610016007100160073001600790016007A0016007C0016007E0016008000160083001600850016008700160089001610010016100300161004001800150018002000180021001800220018002300180025001800370018003800180039001800420018007100180073001810480018106A00181080001811340018113A001811400018114700181155001811560018115A001811660018118100181191001811B2001811B3001811B4001811B6001811BE001811C000181301001813120018131500181402001814030018149000181491001815000018150800181600001816300018170000181800001818020018202000183100001851000018510100186031001870000018700400187005001870240018703400187050001870600018706400189004001890080018900900189010001890110018901200189014001890150018901600189017001890180018902000189021001890220018902400189025001890260018902700189028001890290018903200189033001890340018903600189037001890430018904400189048001890510018905400189059001890600018906200189064001890650018906700189075001890770018907800189081001890850018909400189100001891010018914700189166001891690018917000189171001891720018917300189174001891770018917800189179001891800018918300189198001891990018920000189214001892360018925000189257001892590018925C001892970018930200189315001893160018932300189333001893340018934200189343001893440018936100189368001893720018937E00189410001894200018942500189427001894350018945700189474001895270018955900189622001896240018972500189738001897550018975600189758001897590018976000189761001897620018976300189764001897650018976600189767001897680018976900189770001898080018980B0018980C0018982800189829001899050018991800189930001899440018994700200020002000600020006200200080002034010020340200209072002092470020924900209250002093070020930B0020930C00209311002200050022000D002200280022003900221009002210100022103900221046002210490022112B00221140002214150022146600221515002216220024001200240037002400390024004000240045002400510024005200240053002400550024005700240059002400610024006200240063002400720024007400240076002400780024008000240086002400930024009500240102002401060024011300240117002401200024012400240338002800040028004000280051002800600028006500280090002803000028030100280302002803030028070100280A020028104000281056002810800028109000281300002813500028135A00281402002814050028140D0028140E0028140F00281410002820020028211000282114002860230028610100287006002870130028701400287019002870210028702500287026002870290028702B00289003002891080028923500289444002894460028945400289474002895370032000A0032000C00321055003400080034000C00380008003A0004003A0205003A0246003A0302003A0316003A0317003A032200400020004000330040003500400252004002610040031800404001004040020040400300404006004040200040404000404041004083030040A0070040A0100040A0400040A0500040A0570040A0800040A0840040A1250040A1300040A1730040A1740040A1940040A2900040A4030040A4910040A4930040A4940040A4960040A6000040A6010040A6030040DB000040DB0B0040E020004400020046003200460036004600380046009200460094004600950046012500460201004602420046024800480010004800110048001200480114004801150048030100500004005000170050001A005200060052002600520031005200390052003A005400390054020200540500005405010054100000541001005410020054100400541006005411000054110200541220005414000054140100620001006200080062001000620013006600090066000D0066000E0066001000686223006864200068700100687002006A0001006A0007006A000D006A000F00700002007000030070000400700005007000120070001500700023007000240070004100700080007001000070022800700242007002430070024400700248007002490070025000700254007002570070027400700278007002790070028200700294007003060070030C00700405007012020070120400701206007012080070120B0070120D0070130200701501007015020070160200701701007018020070190700701A0100701B0600701B0700701B0800701B130072000600720024007200340072003A007200500072006200720208007203040072031000720312007203160072040200720404007204060072043400720500007205100072051600720520007206020072060400720700007207020072070400720706007207100072071200720714007207160072071700720718007410000074102200741025007410320074103400741036007412000074124200741244007412460074140A0076000A0076003600760038008200010082000800820032008200360082003801000410040000150400011004000305040005650400060020000020200000302000004020000062200000632000006520000067200000692000006A20100030201000402010005020100052201000542010006020100080201000A6201000A7201000A8201000A9201001002010011020100140202000202020004020200050202000A0202000A2204000602040007020400072204000802040008220400090204001002050002021000020210000302110001021100020212000102200000122000003220000062200000722000008220000092200000A2200000F220000203002000A3002000C3002004130020051300201053002011130020115300201293002012A3002012E3002012F300400013004000230040004300400053004000A300400143004005430040062300600333006003630060042300600A4300600B2300600C4300800143008002A3008002C300800A330080116300802003008022430080230300A000A300A000C300A0014300A0015300A0020300A0055300A008B300A0090300A0092300A0093300A00B3300A00B8300A00C4300A00C6300A00C7300A00CE300A00D3300A00EE300A00F8300A00FA300A00FB300A0109300A0118300A011F300A0121300A0123300A0126300A0142300A0146300A014C300A0150300A0192300A01A2300A01B0300A01B6300A0200300A0202300A0214300A0229300A0232300A0264300A0288300A0292300A02E0300A02E1300A0308300A0309300A0320300A0338300A0348300A0350300A0393300A0395300A0423300A0432300A0451300A0452300A0511300A0512300A060F300A061A300A061B300A061D300A0637300A0638300A0639300A064E300A064F300A065C300A0663300A066C300A068B300A0701300A0706300A0707300A0708300A0709300A0714300A0723300A0732300A079E300C0112300C0123300C0126300C0129300E0002301000023010000E301000103010001C301000453010004630100047301000483010004F30100059301000633010006830100073301000753010008330100090400800FF400802104008021240100001401000024010100840101009401010124010101440101015401010204010102140101024401010274010102840101031401010394010103A401010424010104440101046401010484010105640101059401010674010106D4010106E401010704010107C54001006", DA: "0008001200080020000800210008002200080023000800240008002500100030001021D0001200860012008700140102001410200014307600144076001440780014407A0014407E001810120018120000181204001812050018700C002034030032003200320034003210000032101000321040003210500038001A0038001C003800200038003000400002004000040040024400400250004020040040A0230040A1100040A1210040A19200700082007200612100004030060008300800243008005430080056300801623008016630080250300A0006300A022C300E00043010004C3010004D400801004008010840080112", DS: "00082130001010200010102200101023001010240010103000140030001400320014003400140054001400560014222A0014222C0014301100143012001430240014302600143028001430710014307200143073001430750014401400144015001440160014401700144018001440190014401A0014401B0014401C0014401D0014402200144024001440280014403100144034001440380014403A0014403C001440520014405700144058001440590014405A0014406200144064001440840014408500144088001440890014408B0014408C0014408D0014408E001440920014409C0014409D0014409F0014510100145102001451030014510400145107001451080014510A0014510C0014510D0014510E00145112001451130014511400145115001451160014511700145118001451190014511A0014511B0014511C0014511D0014511F00160001001600020016000400160005001600090016000D00160010001600210016002200160023001600240016002500160026001600290016003000160031001600320016003300160034001600350016003600160038001600440016004E0016007200160074001600760016007B0016007D0016007F001600810016008400160086001600880016008A0016100200161005001800280018003200180033001800500018006000180061001800720018008000180081001800820018008300180084001800870018008800180090001800930018009400180095001810410018104400181046001810470018104900181050001810600018106300181065001810660018106700181068001810690018107100181074001810750018107600181077001811000018111000181111001811140018112000181121001811300018113100181135001811360018113700181138001811410018114200181143001811440018114500181146001811540018115E0018116200181164001811830018118400181190001811A0001811A2001811A3001811A5001813000018131400181316001813180018141100181412001814130018145000181460001814700018148000181510001815110018152000181521001815300018153100182003001820040018200500182010001820300018310100183102001850120018502200185024001850260018502700185028001850290018503000185040001852100018521200186000001870010018701200187014001870160018701A0018702000187022001870260018702800187030001870320018704200187044001870480018704C00187052001870540018706500188150001881510018936C0018936D0018936E0018937400189375001893830018938400189904002000300020003200200035002000370020005000200110002010410022004E00221630002800300028003100280032002810500028105100281052002810530028211200289520003A001A003A0210003A0212003A0213003A0214003A0215003A0218003A0220003A0221003A0222003A0223003A0311003A0313003A0315003A03240040029400400306004003070040031200400314004003160040072A0040073A0040074A004083020040A1380040A30A004801020048011100480112004801130050001400500016005000180050001900540014005400150054007300540200005412000054120300541210005413000054132000541321005413220054132300541324007001010072007200741004007410380074103A0074140200741403007414070074140820100376202000303002000D3002000E30020010300200113002001230020022300200243002002630020028300200323002003430020042300400083004000C3004000E30040012300400403004004230040052300400583004007030040072300400743006002C300600443006004530060050300600B4300600C630080016300800323008003330080036300800373008003A3008003B3008004230080044300800483008005230080076300800783008007A30080132300801343008013A3008013C300A0018300A001A300A0021300A0022300A0023300A0025300A0026300A0027300A0028300A002A300A002B300A002C300A002D300A0044300A0046300A004A300A004C300A004E300A0051300A0052300A0053300A0082300A0084300A0086300A0091300A0094300A00A2300A00A4300A00B4300A00BA300A00BE300A00D6300A00D8300A00DA300A00DE300A00E2300A00E6300A00E9300A00EA300A00EB300A00EC300A00F2300A00F6300A0100300A0102300A0106300A010C300A010E300A0114300A0115300A011C300A011E300A0120300A0122300A0124300A0125300A0128300A0129300A012A300A012C300A012E300A0130300A0134300A0151300A0152300A0153300A0154300A0155300A01BC300A01D2300A01D4300A01D6300A0218300A021A300A0222300A0224300A0228300A022A300A022B300A0250300A026A300A026C300A0271300A0272300A0274300A0284300A0286300A028C300A0296300A029C300A029E300A02A0300A02A4300A02B8300A02BA300A02C8300A02D2300A02D4300A02D6300A02E2300A0426300A0442300A0680300A0681300A0682300C0008300C0009401010754010107E", DT: "000800150008002A000801060008010700080404000804160008041F001600770016008D001810780018107900181202001812030018907400189151001893690018936A0018951600189517001896230018970100189804001899190018A002003A0314004040050040400800404010004040110040405000404051004040520040A0300040A0320040A0330040A0820040A1200040A13A0040DB060040DB070040E004004400040044000B00440010004401040044010500686226006862700072000A007200630100042004000105040005623006002D3006002E300A0736300A073A300A0741300A0760300C012740101025401010264010102B40101041", FD: "00020038000811630008213400120052001811B7001811B9001811BD00181271001816310018163200181633001816340018163500181636001860280018602A0018602C0018602E001860340018603600186054001890190018903000189035001890520018905300189061001890630018906900189070001890730018907900189082001890870018908900189090001890910018909600189098001891040018910500189106001891550018916800189181001891820018918400189195001891960018921700189218001892200018925400189255001892560018925A0018929500189296001893030018930500189306001893070018930900189310001893110018931300189317001893180018931900189322001893240018932700189328001893300018933200189335001893450018937C00189543001895440018954500189546001895470018954800189549001895500018955100189552001895530018955400189557001895580018960200189603001896040018960500189606001896070018971500189716001897170018971800189719001897200018972100189722001897230018972400189726001897270018980100189805001898220018982300189824001898260018982B0018982D0018982E0018982F0018983000189833001898340018994200189943001899450018994600209153002092510020925200209254002092550020925600209257002093010020930200209308002093090020930A0020930D0022000F002801230028012500281231002812320028140600409212004092130040921400409224004092250040A16100460030004600340046004000460042004600440046004600460060004600620046006300460064004600750046007600460077004601040046010600460114004601150046013700460146004601470048011700500013005000150050001C0050001D00520002005200030052000400520007005200080052000900520011005200130052001400520028005200330052003400640008006862A5006862F2006863460068634700686390006864500068646000686490006864A0006864C0006864D0006864F00068656000686590006865B0006865D0006865F00068661000686620006A0010007002300070030B007003120070130300701305007013060070150300701505007015070070150800701511007015120070160300701604007016050070160600701607007017020070170300701704007017050070170600701A0300701A0500701A0600701B14007200740072010800720330007205120072051400740120007401210074102600741027007410280074102A0074102B0074102C0074102D007413380074133A007800500078006000780090007800A0008000040080000530020106300201073002010F3002012D30020134300800A4300A00C5300A060D300A0612300A0613300A061E300A0624300A0625300A0626300A0627300A0628300A062C300A062E300A0634300A063C300A063D300A0640300A0642300A0643300A0645300A0649300A064A300A064B300A0652300A0653300A0654300A0666300A0669300A066D300A066E300A0679300A067A300A0688300A079B300C0121300C0122300C01243010005030100051301000743010008430100093301000943010009530100096301000993010009A40101073", FL: "000894590010943100180013001813200018204300182044001820460018605A00186060001870360018703800187056001870580018935100189352001893530018940200189403001894040018942600189428001894290018943000189447001894490018945200189461001894630018946400189465001894660018946700189468001894690018947000189471001894730018950800189509001895100018951100189514001895150020915400209155002092410020924500209246002092480022000700220008002200090022000A0022000B0022000C0022000E00220010002200110022001200220013002200140022001E00220030002200320022003500220036002200370022003800220041002200480022004900220055002200560022005700221019002210330022103700221053002210540022105900221121002211220022113000221131002211550022146000221463002214670022146800221517002215270022152800221529002216240022162600221643002216440022164500221646002216490022165000240010002400110024001800240020002400250024002800240046002400540024006600240068002400700024007100240073002400750024007700240079002400810024008700240088002400900024009100240092002400940024009600240098002401000024010300240104002401050024010700240108002401180024012600240341002801220028012400286114002870180028701A0028701D0028701E0028701F002894110028944500289478003A0230003A0245003A0247003A02480046011700460118004602020046020300460204004602050046021200460213004602200046022400460227004602300046023200460234004602360046023800460247004602490046025000460251004602520046025300480001004800020048000300480014005200010066000A0066000C0066001700660018006600190066001A0066001B0066001C006600200066003700660038007000100070001100700014007000220070010300700245007002460070025300700258007002610070026200700273007002840070028500700288007004030072007604000315300600B83008004530080046300800473008006A300A004B300A004F300A0050300A0088300A0089300A008A300A008D300A008E300A008F300A00BB300A00D7300A00D9300A00DB300A00F3300A00F7300A0131300A0132300A0133300A0140300A0144300A0148300A014A300A014E300A0199300A019A300A02E3300A02E4300A02E5300A02E6300A02E7300A02E8300A030A300A030D300A033C300A0356300A0358300A035A300A0364300A0366300A0374300A0382300A0384300A0386300A0388300A038A300A038F300A0394300A0396300A0398300A0399300A0412300A0425300A0433300A0434300A0435300A0436300A0501300A0502300A0503300A0504300A0507300A0508300A0509300A0510300C01154010100440101005401010164010101740101018401010194010101B4010101C4010101D4010102340101043401010604010106140101062401010694010107A", IS: "0000517000081160000821220008212400082128000821290008212A0008214200082143000821440014020600140207001420040014200800142014001422020014220A001422240014222600144033001450020014500400160006001600070016000A0016000B0016000E0016000F00160018001600190016001B0016001C0016001D0016001E0016001F0016002A00160037001600450016008E001800400018007000180074001800750018008600180089001800910018104500181062001810810018108200181083001810840018108600181088001810900018109400181149001811500018115100181152001811530018117000181182001811B50018124000181242001812430018130200181405001814950018160200181604001816060018160800181610001816120018162000181702001817040018170600181708001817100018171200181720001820010018310300183104001831050018505000187010001870110018704600189298002000110020001200200013002000140020001500200016002000170020001800200019002000220020002400200026002000AA0020010000200105002010000020100100201002002010030020100400201005002010700020120000201202002012040020120600201208002012090028000800280034003A0202003A0301003A032700460208005400170054003600540038005402100054120100541202005413100054131100700040007000620070010200720064007410240074105700741404007414060074140C2000001020000060200000612010015421000170300200293002010030040056300600223006002A3006004630060048300600493006008230060084300800223008005A3008006330080064300800723008008230080092300801223008013630080138300801423008015230080223300A0012300A0042300A0071300A0078300A0079300A007A300A0080300A00A0300A00BC300A00C0300A00C8300A00D0300A00D2300A00D5300A00E0300A00E4300A00E7300A00E8300A00ED300A00F0300A00FC300A0104300A0110300A0112300A0182300A0212300A0234300A0240300A0262300A0282300A028A300A0290300A02A1300A02A2300A02B2300A0302300A0304300A0312300A0316300A0330300A0334300A0340300A0344300A0391300A0392300A039A300A0424300A0440300C0006300C0007300C000C300C000E300C0022300C0051300C006A300C00A0300C00C0300C00D0300C00E0300C00F0300C00F4300C00F6300C0100300C0102300C01043010007C", LO: "00000902000800410008007000080080000801010008010400080112000801220008022200080302000810300008103E0008104000081080000810880008109000082132001000200010002100100033001000340010021300100214001002170010022300101000001010400010105000101080001010810010109000102000001021100010215000102152001021F000102201001022920010229500102299001200100012002000120021001200220012003000120031001200320012004000120041001200420012004300120050001200550012006000120063001200710012007200120073001200810012008200140100001402030014020400143074001440A0001440A1001440A20014511100180010001800300018003100180034001810000018100300181004001810050018100600181007001810080018101000181011001810160018101700181018001810190018101A0018101B001810200018102300181030001810400018106100181064001810700018108500181161001811A4001811B0001811B1001811BB001812610018140000181401001818030018501000185020001850210018702A0018702B00189041001890460018905000189175001892520018925B0018925E00189423001894330018952400189525001895260018952800189531001899000018991600189922001899370020002700200070002010200020103F00201040002034040020340600205002002092130020923800209421002094530022102900221065002210660022109300221094002210950022109700221159002212730022145400221616002400690024020200240306002403070024030800240309002800500028005F002800620028040000280401002804030028070000280A04002810540028105500283003002830040028602200287005002870070028700D002870200028702A0032001200321020003210300032103300321060003210700038001000380011003800160038001E003800400038005000380060003800610038006200380102003803000038040000380500003A020C004000070040001200400254004002550040050A004005120040051A0040055100400600004006FA00401002004010040040100500401008004010600040110300402001004020160040201700403001004040360040A0270040A0470040A0600040A3540040A4920042001200420014004400080044000A004400110044001200460012004601390050001B0050001E00500020005411010054110300541104005411050060301000620005006200090066000B0066003100660036006601060068621000686221006862D50068634000686380006863D000686540006A0005007000680070008100700207007002270070022900701A090072000400720008007200100072004000720054007200560072006600720203007202060074100C00741056007412020074120400741222007412300074140B00760001007600030076000600760030007800010078002000780024007800B2008200160082001800820019008200230088090400880910008809120100042604000563040005642000005020300020211000302200000C300200033002012130040006300600043006002630060038300600C830080105300A0003300A0009300A000B300A0016300A0072300A00C2300A00CC300A00F9300A00FE300A010A300A0183300A0184300A0216300A021C300A0226300A0236300A0238300A0244300A0266300A0294300A0298300A02B4300A0322300A033A300A034A300A0354300A0355300A0362300A0372300A0608300A0611300A0615300A0619300A0623300A062A300A079A300C0113301000053010001A3010001E3010002D30100034301000363010003830100054301000563010007740080042400801034008011A40080202401010294010105140101053", LT: "00004000000040100000511000005120000801080008040100080402000804180008400000102155001021B00010400000140046001430990014310000143101001440060014400C0014400F001440820018400000187006001870080018704000187041001870620018942400204000002091580022112C0024004400284000003240000038400000400400004011040040140000402011004024000044000300440009006600040066003200720068007412380100042420100152220000042200000530020123300A007B300A02EB300A078E300A0792300A07943010001D301000864000001040004000400801154010101340101068", OB: "0002000100020031000200350002003600020102000802020008041B0008041C00142210001430800016002B0016004B00160062001600700016008B0016008C0018944500280020002820000034000200340005003400070040A0740040A0890042001100686300007002560070180800720065040001150400012004000310040004040400052004000552401010064010106CFFFCFFFC", OD: "003A032E006600220070150D00701A07007200737FE00009", OF: "001816380022153100640009006600160066002100660125007200670080001000800011300A0664300A0665300A066B56000010560000207FE00008", OL: "0066004000660041006600420066004300660129006A001100720075", OV: "007200817FE000017FE00002", OW: "0028120100281202002812030028120400281211002812120028121300281221002812220028122300281224002814080066002300660024006600250066002900660103007200697FE000207FE000307FE00040", PN: "000800900008009C000810480008105000081060000810700010001000101001001010050010106000102297001401040014200600321032004000060040101000402008004040370040A0670040A0750040A1230040A3070040A352007000840072006A300600A6300E0008400801024008010A4008010C4008011440080119", SH: "0000001000005010000050200002001300080010000800500008009400080100000801020008010300080201000810100008212000082127001021540010216000102180001420160014203200144074001451060014510B0014510F0014511000180024001800850018102200181160001811800018121000181250001812510018126000181801001820020018200600182045001850000018700A0018900500189047001891860018932000200010002090560028006100280063002870040028700C003A0020003A020300400009004000100040001100400242004002430040025300401001004010030040100600401007004010090040200600402007004020090040201000409210004801060054001800540400006A000E0070028900700310007200020072006C008000090088013021000010210001602110009930020002300200203002005230060002300600853008002B300A0002300A0043300A00B2300A00D4300A00DC300A00E1300A00E5300A00EF300A00F5300A0108300A0194300A0198300A01A4300A01A8300A01B8300A021B300A0242300A0263300A0273300A0291300A02B3300A030F300A0318300A0336300A0346300A034C300A0352300A0390300A0421300A067C30100033301000354008004040080200401010074010101A4010101E4010101F4010102A40101052401010544010105540101058", SL: "0018602000186022001860390018603B0018603D0018603F00186041001860430040A1620040A29A0048021E0048021F00700052007000530072007C", SQ: "0004122000080006000800510008006300080082000800960008009D000801090008011000080121000801230008012400080220000803000008030500080310000804000008040600080410000804110008041200080413000804190008041A0008041D0008041E000804200008042100080422000804230008042400080425000810320008103F0008104100081049000810520008106200081072000810840008110000081110000811110008111200081115000811200008112500081130000811340008113A00081140000811450008114A0008114B000811560008116400081198000811990008119A0008119B000812000008125000082112000821330008213500082218000822200008222800082229000822300008224000082242000822440008224600082251000822530008225500082257000822590008225A0008225C0008300100083011000890920008912100089124000891540008921500089237000894100008945800100024001000260010002700100050001001010010010200100201001002150010021600100219001002210010022900101002001010210010110000102161001022020010229300102294001022960012002300120054001200640012008300140106001402000014020100142002001420120014201E00142030001422040014222000143020001430400014306000144002001440080014400E0014401000144011001440200014403000144035001440400014405000144051001440600014407000144080001440830014408600144087001440910014409A001800120018001400180026001800290018002A001800360018100A001811B8001811BA001811BC001811BF001811C10018127200182041001850110018510400186011001890060018904200189045001890490018907600189083001890840018909200189103001891070018911200189114001891150018911700189118001891190018912500189126001891520018917600189197001892260018922700189239001892510018925D001892600018930100189304001893080018931200189314001893210018932500189326001893290018933800189340001893410018934600189360001893620018936300189364001893650018936F001893790018937D001893800018938100189382001894010018940500189406001894070018941200189417001894320018943400189451001894550018945600189462001894720018947600189477001895040018950600189507001895300018953800189541001895420018955500189556001896010018962100189732001897330018973400189735001897360018973700189749001897510018977100189772001898030018980600189807001898090018980D0018980E0018980F00189821001898250018982A0018982C0018983100189832001898350018983600189902001899030018990600189907001899090018990B0018990C0018990D0018990E001899110018991200189913001899140018991B0018991C0018991D0018991F001899200018993100189932001899330018993400189935001899360018993B0018993C0018993D0018993E0018A001002090710020911100209113002091160020917000209171002091720020922100209222002092530020930E0020930F0020931000209450002095290022000600220015002200160022001700220018002200190022001A0022001B0022001C0022001D002200200022002100220022002200310022004200220058002210070022100800221012002210240022102500221028002210350022103600221040002210440022104500221047002210480022104A0022104B002210500022109000221092002210960022110000221101002211030022112500221127002211280022112A0022113200221133002211340022113500221150002211530022121000221211002212120022122000221225002212300022125000221255002212570022126000221262002212650022130000221310002213300022142000221423002214360022144300221445002214500022145800221465002214700022147200221512002215130022151800221525002215260022161200221615002216180022162000221628002216400024001600240021002400240024003200240033002400340024005800240064002400650024006700240083002400850024008900240097002401100024011200240114002401150024012200240317002403200024032500240344002812300028135200281401002814040028140B0028140C00283000002830010028301000283110002850000028610000287000002870080028700A0028700F00287010002870110028701200287015002870160028701C00287022002870230028702400287027002870280028702C0028702D0028702E002891100028913200289145002894150028942200289443002895010028950200289505003210310032103400321064003210650032106700340001003400090034000A0034000B0034000D00380004003800140038004400380064003801000038010100380502003A0200003A0208003A0209003A020A003A0211003A0240003A0242003A0300003A0312003A0318003A0319003A0320003A0321003A0323003A0325003A0326003A0328003A032A003A032C003A032D004000080040000A0040000B004000260040002700400036004000390040003A0040010000400220004002600040027000400275004002810040029300400295004002960040030E00400320004003210040032400400330004003400040044000400441004005000040051300400515004005180040052000400550004005520040055500400560004005620040059A004006100040061200400620004007100040071A004008D8004008DA004008EA004009F80040100A00401011004010120040110100404004004040070040400900404015004040160040401800404019004040210040402200404025004040260040402700404028004040290040403000404031004040320040403300404034004040350040407000404071004040720040407400409092004090940040909600409098004092200040A0200040A0260040A0280040A0430040A0660040A0680040A0700040A0730040A0760040A0780040A07A0040A07C0040A0850040A0880040A0900040A1670040A1680040A1700040A1950040A2960040A3000040A3010040A3130040A3400040A3580040A3600040A3700040A3720040A3750040A3800040A3850040A3900040A4040040A5040040A5250040A7300040A7310040A7320040A7440040A8010040A8060040A8070040A8080040B0200040E0060040E0080040E0210040E0220040E0230040E0240040E0250042001300440007004400130044001900440100004401010044010300440107004401090044010A0046001400460015004600160046001800460028004600470046005000460052004600700046007100460074004600800046009700460098004601000046010100460102004601100046011100460112004601130046011600460121004601220046012300460124004601450046020700460210004602110046021500460218004602440048000800480100004801050048010800480110004801160048012000480200004802070048021A005000100050001200520016005200250052002700520029005400120054001300540016005400220054003200540052005400620054006300540072005402200054022200540300005403020054030400540306005404100054041200540414006030000062000200620003006200070062000A0062000F006200110062001200640002006400050064000F00640010006600020066001100660012006600130066002600660027006600280066002B0066002D0066002E0066002F00660030006600340066003500660101006601020066010400660108006601210066012400660130006601320066013300660134006862220068622400686225006862300068626000686265006862A0006862C0006862E0006862F00068632000686360006863A0006863A4006863A8006863AC006863B0006863E00068640000686430006864700068650000686510006865200068654500686550006865A0006865E000687003006A0002006A0008006A0009006A000A006A000B0070000100700008007000090070005A00700060007000860070008700700209007002310070023200700233007002340070028700700308007003090070030A0070030D007003110070031400700315007003180070031C0070031E0070031F007004020070040400701104007012010070120A00701301007013040070180100701803007018050070180600701901007019030070190500701A0400701A0800701B0100701B0300701B0400701B1100701B120072000C0072000E007200120072002000720022007200300072003E007200800072010200720200007202100072021400720300007204000072042200720424007204270072043000720600007207050074100200741007007410080074100E007410200074103000741040007410420074104400741046007410480074104A0074104C0074104E0074105000741210007412120074121600741220007412240074140100741405007414090074140D0074140E007600080076000C0076000E00760010007600200076003200760034007600400076006000780026007800280078002A00780070007800B0007800B40080000100800002008000030080000800800012008000130082000400820005008200070082000C00820010008200170082002100820022008200340082003500880200040004010400040204000403040005000400055004000551040005612000001E200000A2200000A4200000A8200005002000051020100500201005102010052020200110202001112020013020200140204000102040002020400500205000102050050021000500212000502120007021300010213000152130003021300040213000502130006021300080213000A0213000C02200000D3002003030020040300200503002010130020102300201033002010430020108300201093002010A3002010B3002010C3002010D3002010E300201103002011230020113300201143002011730020118300201193002011A3002011B3002011E3002011F3002012230020124300201253002012630020127300201283002012B3002012C3002013030020131300201323002013330020135300400103004005030040060300600103006001230060014300600163006001830060020300600303006003730060039300600403006004A3006004B3006004C3006004D3006004E3006004F3006008030060086300600A0300600B0300600B6300600B9300600C0300600C9300600CA300600CB300800103008002030080021300800303008004030080041300800503008006030080068300800703008008030080090300800A0300800A1300800A2300800B0300800C0300800D0300800D1300800E0300800F0300800F2300800F4300800F63008010030080110300801203008013030080140300801503008016030080171300801733008022030080240300A0010300A0040300A0048300A0070300A008C300A00B0300A00B6300A00CA300A00D1300A00E3300A00F4300A0107300A0111300A0116300A011A300A0180300A0190300A01A0300A01B4300A0206300A0210300A0230300A0260300A0280300A02B0300A02D0300A02EA300A030C300A0314300A0332300A0342300A0360300A0370300A0380300A03A0300A03A2300A03A4300A03A6300A03A8300A03AA300A03AC300A0401300A0410300A0420300A0431300A0441300A0450300A0453300A0505300A0506300A060A300A0610300A0614300A0616300A0617300A0618300A061C300A061F300A0620300A0621300A0629300A062B300A062D300A062F300A0630300A0631300A0632300A0635300A063A300A063B300A063E300A063F300A0644300A0646300A0647300A064C300A064D300A0651300A0656300A0658300A0659300A065A300A065B300A065D300A0660300A0662300A0667300A0668300A066A300A066F300A0671300A0673300A0677300A0678300A067B300A067E300A067F300A0683300A0684300A0686300A0689300A068A300A0702300A0703300A0715300A0716300A0722300A0731300A0733300A073E300A073F300A0740300A0743300A0744300A0745300A0746300A0761300A0762300A0772300A0774300A0780300A0784300A0787300A0788300A0789300A078A300A078B300A078C300A078D300A078F300A0790300A0791300A0793300A0797300A0798300A0799300A079C300A079D300A079F300A07A0300A07A1300C0002300C0004300C000A300C0020300C0040300C0042300C0050300C0055300C0060300C0080300C00B0300C00F2300C0111300C0114300C0116300C0120300C0125300C01283010000130100003301000043010000730100008301000093010000A301000113010001230100014301000163010001830100019301000213010002330100024301000253010002630100027301000283010002A3010002B3010002C3010002E3010002F301000303010003230100044301000493010004A3010004B3010004E30100055301000573010005B3010005D3010005F3010006030100062301000643010006530100067301000693010006A3010006B3010006C3010006D3010007030100071301000763010007830100079301000803010008130100082301000873010008830100089301000913010009730100098301000A04008005040080111400801174008011840100004401010014010100A4010101140101037401010384010104540101047401010644010106F40101071401010724010107640101077401010794010107B4010107D4FFE0001520092295200923054000100FFFAFFFA", SS: "00189219001894360018943700189438001894390018944000189442001895180018951900281041002861200028950300460135005200300072003C0072007E300A0306", ST: "000800810008009200080114000801150008011600082111000822560008225800120051001400230014002400140025001400280014004200140044001400450014010500141010001410400014201800142206001422220014302200144054001440560014405C001440720014409B0018003A0018908000189185001893730018A0030028135100286190003A0329003A032B00400280004003100040055300400556004011020040A16A0040A2240040A2970040A33A0040A3530040A9920040E0010042001000440001004801070050002100620006006862800068634500700006007002080070030F0072006E0074100600780010008809062010001020100150300200043002012030060006300600283006008830080012300800663008007430080202300A0004300A000E300A00C3300A00DD300A0196300A01A6300A01B2300A01BA300A01D0300A0402300A0422300A0676300A067D300A0730300A0734300A0735300A0742300A07833010000F3010001730100037301000433010005C4008010B400803004008400040101078", SV: "00720082", TM: "000800130008003000080031000800320008003300080034000800350010003200140103001430770014407C00180027001800350018101400181042001810430018107200181073001812010018700E002034050032003300320035003210010032101100321041003210510038001B0038001D003800210038003200400003004000050040024500400251004020050040A0240040A1120040A1220040A193007000830072006B210000503006000930080025300801643008016830080251300A0007300A022E300E000530100085400801014008010940080113", UC: "000801190008030C0008030D0010021200100222001600080016000C0018936700189371001899080018990A0072006F3010001B", UI: "0000000200000003000010000000100100020002000200030002001000020012000200320002003300020100000414320004151000041511000415120004151A00080014000800160008001700080018000800190008001A0008001B00080058000800620008010C0008010D00080117000801180008040E00081150000811550008115A000811670008119500083002000830100008301200089123001810020018100B001820420018991E0020000D0020000E0020005200200200002002420020916100209164002093120020931300280304002811990028121400340003003A031000400554004040230040A0210040A0220040A1240040A1710040A1720040A4020040DB0C0040DB0D0040E0110040E0300040E0310044010200440108006200210064000300687004006A00030070031A0070031B007011010070110200701209007019040072007F0088014004000010040001000400051030060024300600C2300A0013300A0054300A0083300A0609300A0650300A0675300A0700300A0785301000063010000B30100013301000153010001F301000313010003B30100052301000533010006E3010006F", UL: "0000000000000001000200000002003700041200000412020004140000041420000415040004160000080001000803090008030B0008042700081161000811620018106E0018163700186016001860180018601A0018601C0018601E0018603000186032001860380018603A0018603C0018603E001860400018604200186046001860480018604A0018605000186052001860560018605800189095001891270018915900189234001892580018925F00209057002091280020915700209228002215300022164200221658002890010028900200340004003A00100040A1320040A1630040A8020040A8030040A8040040A8050040DB73004200150048000600480007004803020048030300603020006400070066000100660003006600150066001E0066002A0066002C00660105006A000C0070022600700255007002950070150C0072007800741054007413240082000630100092", UR: "0002002600020027000200280008010E000801200008040700080408000804090008040B0008119000287FE0004040730040E01000687005007200710074100A", US: "00000100000001100000012000000700000008000000085000000860000009000000090300001002000010080000102000001021000010220000102300001031000051B00004121200041410000800400008030100080304000803060008030800080414000811960008119700100028001021C000144012001451000016001100160012001600130016001400160015001600160016001A0016002700160028001600390016003A0016003B001600410016004200160043001600460016004700160048001600490016004A0016004C001600750018106C00181244001813100018140400181622001816230018162400186012001860140018602400186026001860440018604C0018604E00186070001890580018906600189093001892310018923200189240001892410018925300189337001893660018936B001893700018937600189377001893780018937A00189441001897290018973900189740001899150018992100189938001899390018993A0020915600209162002091630020951800209536002200010022000200220003002200040024003500240036002400380024004200240048002400500024005600240060002800020028000300280005002800060028001000280011002800120028001400280068002800690028007000280080002800810028008200280091002800920028009300280094002801000028010100280102002801030028020000280402002807100028072000280722002807300028074000281104002814030028140700286010002860200028603000286040002861020028611000286112002870010028700200287003002870090028700B0028700E002870170028701B00289099002894160028950600289507003A0005003A021A003A0231003A0241003A0244004003000040030100400302004003030040A0B00040A1360040A18000480013004800150048020100480202005200120052003600520038005400100054001100540020005400210054003000540031005400330054005000540051005400530054006000540061005400700054007100540080005400810054009000540100005401010054021100540308005413300060300200603008006200040062000B0062000C0062000D0062000E0066001F006862D0006863100068633000686350006863C0006863F0006864100068644000686530007000200070002100700042007000500070005100700066007000670070024100700247007002510070025200700401007011030070120300701205007012070070120C00701309007018040070180700701B02007200140072002800720032007200380072007A0072010000720104007201060072010A0072010C0072010E007202020072020400720212007202160072021800720302007203060072030800720314007203180072032000720420007204210072043200760055007600700076008000760090007600A0007600B0007600C00078002E007800B6007800B8008000060080000704000005200000A0200000A120100120201001302010015E20100160202000102030001020400011204000742200000B300201163002011C3002011D300600B73008006730080172300A0443300A0600300A0601300A0602300A0603300A0604300A0605300A0606300A0607300A060B300A060C300A060E300A0622300A0636300A0641300A0648300A0655300A0657300A065E300A065F300A0661300A0670300A0672300A0674300A0685300A0687300A0704300A0705300A073B300A0773300A0782300A0786300A0795300A0796300C0117300C0118300C01193010000D301000203010002230100029301000393010003A3010003C3010003D3010003E3010003F301000403010004130100042301000583010005E301000663010007D3010007E40101010401010334010103454001004", UT: "0008030E0008030F001002180016000300160017001600200016004D0016004F00160050001600510016007800160082001810090018937B0018937F001899010018990F00189910001899170018991A001899230018992400189941003210660040003100400032004006020040A160004401060062002000660107006A000600720070008200030082000A0082003300820037220000023010000C3010005A301000613010007A3010007B3010007F", UV: "0008040C0008040D0008042800080429007200837FE00003" }, masks: { "002031xx": "CS", "002804x0": "US", "002804x1": "US", "002804x2": "LO", "002804x3": "AT", "002808x0": "CS", "002808x2": "US", "002808x3": "AT", "002808x4": "US", "002808x8": "AT", "1000xxx0": "US", "1000xxx1": "US", "1000xxx2": "US", "1000xxx3": "US", "1000xxx4": "US", "1000xxx5": "US", "1010xxxx": "US", "50xx0005": "US", "50xx0010": "US", "50xx0020": "CS", "50xx0022": "LO", "50xx0030": "SH", "50xx0040": "SH", "50xx0103": "US", "50xx0104": "US", "50xx0105": "US", "50xx0106": "SH", "50xx0110": "US", "50xx0112": "US", "50xx0114": "US", "50xx1001": "CS", "50xx2000": "US", "50xx2002": "US", "50xx2004": "US", "50xx2006": "UL", "50xx2008": "UL", "50xx200A": "UL", "50xx200E": "LT", "50xx2500": "LO", "50xx2600": "SQ", "50xx2610": "US", "60xx0010": "US", "60xx0011": "US", "60xx0012": "US", "60xx0015": "IS", "60xx0022": "LO", "60xx0040": "CS", "60xx0045": "LO", "60xx0050": "SS", "60xx0051": "US", "60xx0052": "US", "60xx0060": "CS", "60xx0061": "SH", "60xx0062": "SH", "60xx0063": "CS", "60xx0066": "AT", "60xx0068": "US", "60xx0069": "US", "60xx0100": "US", "60xx0102": "US", "60xx0110": "CS", "60xx0200": "US", "60xx0800": "CS", "60xx0802": "US", "60xx0803": "AT", "60xx0804": "US", "60xx1001": "CS", "60xx1100": "US", "60xx1101": "US", "60xx1102": "US", "60xx1103": "US", "60xx1200": "US", "60xx1201": "US", "60xx1202": "US", "60xx1203": "US", "60xx1301": "IS", "60xx1302": "DS", "60xx1303": "DS", "60xx1500": "LO", "60xx4000": "LT", "7Fxx0011": "US", "7Fxx0020": "OW", "7Fxx0030": "OW", "7Fxx0040": "OW" } };

// src/virtualize/dicom/source.ts
var MULTI = /* @__PURE__ */ new Set(["AE", "AS", "CS", "DA", "DS", "DT", "IS", "LO", "PN", "SH", "TM", "UC", "UI"]);
var TEXT = /* @__PURE__ */ new Set([...MULTI, "LT", "ST", "UT", "UR"]);
var TAGS = {};
for (const [vr, s] of Object.entries(dictionary_default.tags)) {
  for (let i = 0; i < s.length; i += 8) TAGS[s.slice(i, i + 8)] = vr;
}
var MASKS = Object.entries(dictionary_default.masks);
var INT64 = 2n ** 63n;
var utf83 = new TextEncoder();
var MAX_TEXT = 2 ** 16;
var MAX_MEMBER = 2 ** 14;
var MAX_ROOT = 2 ** 16;
var MAX_CHUNK2 = 2 ** 24;
var MAX_STRUCTURES = 2 ** 16;

// src/virtualize/ims/hdf5.ts
var UNDEFINED2 = (1n << 64n) - 1n;
var MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

// src/virtualize/ims/source.ts
var MAX_VALUE_BYTES = 2 ** 26;
var MAX_ELEMENTS = 2 ** 20;
var MAX_TEXT2 = 2 ** 20;
var BUDGET = 2 ** 16;
var MAX_HEAP = 2 ** 16;
var MAX_COPY = 2 ** 24;
var MAX_SELECTIONS = 2 ** 22;
var MAX_CHUNK3 = 2 ** 24;
var RAGGED_CHUNK2 = 2 ** 20;
var utf84 = new TextEncoder();
var SHUFFLED = ["2", "2,1", "2,3", "2,1,3"];
var REFERENCED = ["", "1", "3", "1,3"];
var ALLOWED = [...REFERENCED, ...SHUFFLED];

// src/virtualize/ir/run.ts
var utf85 = new TextEncoder();

// src/virtualize/ir/source.ts
var OPEN = 1 << 16;
var isNode = typeof process !== "undefined" && process.versions?.node !== void 0;

// src/virtualize/tiff/ifd.ts
var Tag = {
  ImageWidth: 256,
  ImageLength: 257,
  BitsPerSample: 258,
  Compression: 259,
  PhotometricInterpretation: 262,
  FillOrder: 266,
  ImageDescription: 270,
  SamplesPerPixel: 277,
  PlanarConfiguration: 284,
  Predictor: 317,
  TileWidth: 322,
  TileLength: 323,
  TileOffsets: 324,
  TileByteCounts: 325,
  SubIFDs: 330,
  SampleFormat: 339,
  JPEGTables: 347,
  XResolution: 282,
  YResolution: 283,
  ResolutionUnit: 296,
  YCbCrSubsampling: 530
};
var WANTED = new Set(Object.values(Tag));
var TILES = /* @__PURE__ */ new Set([Tag.TileOffsets, Tag.TileByteCounts]);
var USED = new Set([...WANTED].filter((t) => t !== Tag.ImageDescription && t !== Tag.SubIFDs));

// src/virtualize/tiff/tags.ts
var LAYOUT2 = /* @__PURE__ */ new Set([273, 279, 288, 289, 324, 325, 513, 514, 519, 520, 521]);
var MAX_TEXT3 = 2 ** 16;
var IFD_BUDGET = 2 ** 16;
var TOTAL_BUDGET = 2 ** 20;
var MAX_TOTAL_BUDGET = 2 ** 24;
var MAX_CHUNK4 = 2 ** 24;
var utf86 = new TextEncoder();

// src/virtualize/ndpi/virtualize.ts
var NDPI_LAYOUT = /* @__PURE__ */ new Set([...LAYOUT2, 65426, 65432]);

// src/virtualize/nifti/virtualize.ts
var MAX_SAFE2 = BigInt(Number.MAX_SAFE_INTEGER);
var CHUNK_BYTES = 1 << 17;
var MAX_TEXT4 = 2 ** 16;
var EXTENSIONS_BUDGET = 2 ** 14;
var LIST_MOST = Math.floor(EXTENSIONS_BUDGET / 12);
var SCAN = 2 ** 20;
var ECODES = `${SOURCE_NODE}/extensions/ecode`;
var ESIZES = `${SOURCE_NODE}/extensions/esize`;
var EDATA = `${SOURCE_NODE}/extensions/data`;
var ECODE_CHUNK = 2 ** 22;
var RAGGED_CHUNK3 = 2 ** 20;

// src/virtualize/store.ts
var MAX_SAFE3 = Number.MAX_SAFE_INTEGER;
var MAX_DOCUMENT = 1 << 24;
var utf87 = new TextEncoder();
var PREFETCH_BYTES = 64 << 20;

// src/virtualize/n5/virtualize.ts
var MAX_BLOCK = 2 ** 31 - 1;
var UNITS = {
  "\xB5m": "micrometer",
  "\u03BCm": "micrometer",
  um: "micrometer",
  nm: "nanometer",
  mm: "millimeter",
  cm: "centimeter",
  m: "meter",
  "\xC5": "angstrom",
  "\u212B": "angstrom",
  pm: "picometer",
  in: "inch",
  ft: "foot",
  s: "second",
  ms: "millisecond",
  min: "minute",
  h: "hour"
};
var UNIT_NAMES = new Set(Object.values(UNITS));

// src/virtualize/safe/product.ts
var MAX_XML = 1 << 24;

// src/virtualize/safe/jp2.ts
var MAX_REST = 1 << 16;
var MAX_TAIL = 1 << 12;
var BLOCK = 1 << 16;
var SMALL_TILE = 1 << 14;

// src/virtualize/safe/metadata.ts
var MAX_SAFE4 = BigInt(Number.MAX_SAFE_INTEGER);
var utf88 = new TextEncoder();
var MAX_TEXT5 = 1 << 16;

// src/virtualize/safe/zipdir.ts
var MAX_DEFLATED = 1 << 26;
var MAX_INFLATED = 1 << 27;

// src/server.ts
var ARCHIVE_KEY = "__vz__/archive.vzip";
var WORKER_HEADER = "X-Vzip-Worker";
function encodeId(url) {
  let s = "";
  for (const b of new TextEncoder().encode(url)) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

// src/client.ts
async function registerVzipWorker(scriptUrl = "vzip-sw.js", timeoutMs = 1e4) {
  const script = new URL(scriptUrl, location.href).href;
  const registration = await navigator.serviceWorker.register(script);
  const container = navigator.serviceWorker;
  const ours = () => container.controller?.scriptURL === script;
  if (!ours()) {
    await new Promise((resolve, reject2) => {
      const finish = (error) => {
        clearTimeout(timer);
        container.removeEventListener("controllerchange", check);
        if (error) reject2(error);
        else resolve();
      };
      const check = () => {
        if (ours()) finish();
      };
      const timer = setTimeout(
        () => finish(new Error("the vzip service worker did not take control of this page; reload it and try again")),
        timeoutMs
      );
      container.addEventListener("controllerchange", check);
      container.ready.then((r) => r.active?.postMessage("claim"));
      check();
    });
  }
  return new URL("vz/", registration.scope).href;
}
function imageZarrUrl(prefix2, url) {
  return `${prefix2}image/${encodeId(new URL(url).href)}/`;
}
function archiveZarrUrl(prefix2, url) {
  return `${prefix2}archive/${encodeId(new URL(url).href)}/`;
}
function archiveDownloadUrl(zarrUrl) {
  return zarrUrl + ARCHIVE_KEY;
}

// demo/map/jpeg2k_decoder.ts
var HEADER = 16;
var module;
function getModule(url) {
  module ??= WebAssembly.instantiateStreaming(fetch(url), {}).then(
    (r) => r.instance.exports
  );
  return module;
}
async function decodeJpeg2000(wasmUrl, buffer, bytesPerSample, signed) {
  const m = await getModule(wasmUrl);
  const input2 = m.malloc(buffer.byteLength);
  if (input2 === 0) throw new Error("jpeg2000: out of memory");
  let result = 0;
  let resultSize = 0;
  try {
    new Uint8Array(m.memory.buffer).set(buffer, input2);
    result = m.decode(input2, buffer.byteLength, bytesPerSample, signed ? 1 : 0);
    if (result === 0) throw new Error("jpeg2000: out of memory");
    const [width, height, numComponents, bodyLength] = new Uint32Array(
      m.memory.buffer.slice(result, result + HEADER)
    );
    resultSize = HEADER + bodyLength;
    const body = new Uint8Array(m.memory.buffer, result + HEADER, bodyLength);
    if (width === 0) throw new Error(`jpeg2000: ${new TextDecoder().decode(body)}`);
    return { width, height, numComponents, data: body.slice() };
  } finally {
    m.free(input2, buffer.byteLength);
    if (result !== 0) m.free(result, resultSize);
  }
}

// demo/jpegxr_decoder.ts
var HEADER2 = 24;
var ENOSYS = 52;
var env = {
  emscripten_notify_memory_growth: () => {
  },
  clock_time_get: () => ENOSYS,
  fd_write: () => ENOSYS,
  fd_read: () => ENOSYS,
  fd_close: () => ENOSYS,
  fd_seek: () => ENOSYS,
  __syscall_unlinkat: () => -ENOSYS,
  __syscall_rmdir: () => -ENOSYS,
  __syscall_readlinkat: () => -ENOSYS
};
var module2;
function getModule2(url) {
  module2 ??= WebAssembly.instantiateStreaming(fetch(url), { env, wasi_snapshot_preview1: env }).then((r) => {
    const e = r.instance.exports;
    e._initialize();
    return e;
  });
  return module2;
}
async function decodeJpegXr(wasmUrl, buffer) {
  const m = await getModule2(wasmUrl);
  const input2 = m.malloc(buffer.byteLength);
  if (input2 === 0) throw new Error("jpegxr: out of memory");
  let result = 0;
  try {
    new Uint8Array(m.memory.buffer).set(buffer, input2);
    result = m.jpegxr_decode(input2, buffer.byteLength);
    if (result === 0) throw new Error("jpegxr: out of memory");
    const [width, height, numComponents, bytesPerSample, kind, length] = new Uint32Array(
      m.memory.buffer.slice(result, result + HEADER2)
    );
    const body = new Uint8Array(m.memory.buffer, result + HEADER2, length);
    if (width === 0) throw new Error(`jpegxr: ${new TextDecoder().decode(body)}`);
    return { width, height, numComponents, bytesPerSample, isFloat: kind === 1, data: body.slice() };
  } finally {
    m.free(input2);
    if (result !== 0) m.free(result);
  }
}

// demo/contrast.ts
var JPEG2K_WASM = new URL("jpeg2000_decoder.wasm", location.href);
var JPEGXR_WASM = new URL("jpegxr.wasm", location.href);
var TYPES = {
  uint8: [1, (v, i) => v.getUint8(i)],
  int8: [1, (v, i) => v.getInt8(i)],
  uint16: [2, (v, i, le2) => v.getUint16(i, le2)],
  int16: [2, (v, i, le2) => v.getInt16(i, le2)],
  uint32: [4, (v, i, le2) => v.getUint32(i, le2)],
  int32: [4, (v, i, le2) => v.getInt32(i, le2)],
  float32: [4, (v, i, le2) => v.getFloat32(i, le2)],
  float64: [8, (v, i, le2) => v.getFloat64(i, le2)]
};
function tooNarrow(w, dataType) {
  return /int/.test(dataType) && w.end - w.start < 1;
}
function fullRange(w, dataType) {
  if (!/int/.test(dataType) || w.min === void 0 || w.max === void 0 || w.max <= w.min) return false;
  return w.start <= w.min && w.end - w.start >= 0.99 * (w.max - w.min);
}
function usableWindow(w, dataType) {
  return w !== void 0 && !tooNarrow(w, dataType) && !fullRange(w, dataType);
}
async function decodeChunk(meta, encoded) {
  const codecs = meta.codecs.filter((c) => c.name !== "transpose");
  const [first, ...rest] = codecs;
  if (rest.some((c) => c.name !== "gzip" && c.name !== "zlib")) return void 0;
  let bytes = encoded;
  for (const c of [...rest].reverse()) {
    const inflate2 = new DecompressionStream(c.name === "gzip" ? "gzip" : "deflate");
    bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(inflate2)).arrayBuffer());
  }
  const [size] = TYPES[meta.data_type] ?? [0];
  switch (first?.name) {
    case "bytes":
      return [bytes, first.configuration?.endian !== "big"];
    case "imagecodecs_jpeg2k":
      if (size !== 1 && size !== 2) return void 0;
      return [(await decodeJpeg2000(JPEG2K_WASM, bytes, size, /^int/.test(meta.data_type))).data, true];
    case "imagecodecs_jpegxr": {
      const d = await decodeJpegXr(JPEGXR_WASM, bytes);
      return d.bytesPerSample === size ? [d.data, true] : void 0;
    }
  }
  return void 0;
}
function percentiles(bytes, le2, dataType, fill) {
  const [size, get] = TYPES[dataType];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = Math.floor(bytes.length / size);
  const step = Math.max(1, Math.floor(n / 1e5));
  const values = [];
  for (let i = 0; i < n; i += step) {
    const v = get(view, i * size, le2);
    if (v !== fill) values.push(v);
  }
  if (values.length === 0) return void 0;
  values.sort((x, y) => x - y);
  const lo = values[Math.floor(values.length * 0.05)], hi = values[Math.min(values.length - 1, Math.floor(values.length * 0.999))];
  return lo < hi ? [lo, hi] : void 0;
}
async function sampleRanges(url, meta, axes, chunks, channels) {
  if (!TYPES[meta.data_type] || meta.chunk_grid.name !== "regular") return channels?.map(() => void 0) ?? [void 0];
  const c = axes.findIndex((a) => a.name === "c");
  if (channels !== void 0 && (c < 0 || chunks[c] !== 1)) return channels.map(() => void 0);
  const index = meta.shape.map((n, i) => axes[i]?.name === "t" ? 0 : Math.floor(Math.floor(n / 2) / chunks[i]));
  const enc = meta.chunk_key_encoding ?? { name: "default" };
  const sep = enc.configuration?.separator ?? (enc.name === "v2" ? "." : "/");
  const one = async (k) => {
    const at = index.slice();
    if (k !== void 0) at[c] = k;
    const key = enc.name === "v2" ? at.join(sep) || "0" : ["c", ...at].join(sep);
    try {
      const r = await fetch(`${url}${key}`);
      if (!r.ok) return void 0;
      const decoded = await decodeChunk(meta, new Uint8Array(await r.arrayBuffer()));
      return decoded && percentiles(decoded[0], decoded[1], meta.data_type, meta.fill_value);
    } catch {
      return void 0;
    }
  };
  return Promise.all(channels === void 0 ? [one()] : channels.map(one));
}

// demo/demo.ts
var $ = (id) => document.getElementById(id);
var input = $("url");
var status = $("status");
var setStatus = (text2, error = false) => {
  status.textContent = text2;
  status.classList.toggle("error", error);
};
async function getJson(url) {
  const r = await fetch(url);
  if (r.headers.get(WORKER_HEADER) === null) {
    throw new Error(
      `the vzip service worker did not answer this request (HTTP ${r.status} from the network); reload the page and try again`
    );
  }
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}
var SECONDS = { second: 1, millisecond: 1e-3, minute: 60, hour: 3600 };
var METERS = {
  meter: 1,
  millimeter: 1e-3,
  micrometer: 1e-6,
  nanometer: 1e-9,
  picometer: 1e-12,
  angstrom: 1e-10,
  centimeter: 0.01,
  inch: 0.0254,
  foot: 0.3048
};
function imageState(images, axes, scale, shape, chunks, dtype, omero = [], labels = []) {
  let xi = axes.findIndex((a) => a.name === "x");
  let yi = axes.findIndex((a) => a.name === "y");
  if (xi < 0 || yi < 0) [yi, xi] = [axes.length - 2, axes.length - 1];
  const dimensions = {};
  axes.forEach((a, i) => {
    if (a.name === "c") return;
    const unit = a.unit ?? "";
    if (unit in METERS) dimensions[a.name] = [scale[i] * METERS[unit], "m"];
    else if (unit in SECONDS) dimensions[a.name] = [scale[i] * SECONDS[unit], "s"];
    else dimensions[a.name] = [scale[i], ""];
  });
  const offset = (img, i) => (img.translation?.[i] ?? 0) / scale[i];
  const position = axes.flatMap((a, i) => {
    if (a.name === "c") return [];
    const at = offset(images[0], i);
    if (a.name === "t") return [at];
    return [at + (a.name === "z" ? Math.floor(shape[i] / 2) : shape[i] / 2)];
  });
  const view = {
    dimensions,
    position,
    displayDimensions: [axes[xi].name, axes[yi].name],
    // With the coordinate space declared, this counts full-resolution voxels
    // per screen pixel.
    crossSectionScale: Math.max(shape[yi] / 600, shape[xi] / 850),
    layout: "xy"
  };
  const many = images.length > 1;
  const c = axes.findIndex((a) => a.name === "c");
  if (c >= 0 && shape[c] > 1 && shape[c] <= 16 && chunks[c] === shape[c]) {
    const outputDimensions = Object.fromEntries(
      axes.map((a) => a.name === "c" ? ["c^", [1, ""]] : [a.name, dimensions[a.name]])
    );
    const rgb = shape[c] === 3 && dtype === "uint8" && omero.length === 0;
    const shader = rgb ? RGB_SHADER : channelShader(shape[c], omero);
    return {
      layers: images.map((img) => ({
        type: "image",
        source: { url: `${img.url}|zarr3:`, transform: { outputDimensions } },
        name: many ? img.name : rgb ? "image" : "channels",
        opacity: 1,
        shader
      })),
      crossSectionBackgroundColor: "#000000",
      ...view
    };
  }
  const perChannel = (label, i, shader) => images.map((img) => ({
    type: "image",
    source: `${img.url}|zarr3:`,
    name: many ? `${img.name} ${label}` : label,
    opacity: 1,
    blend: "additive",
    localDimensions: { "c'": [1, ""] },
    localPosition: [i],
    shader
  }));
  if (c >= 0 && shape[c] === 3 && dtype === "uint8") {
    const colors = ["v, 0.0, 0.0", "0.0, v, 0.0", "0.0, 0.0, v"];
    return {
      layers: colors.flatMap((rgb, i) => perChannel(
        ["red", "green", "blue"][i],
        i,
        `void main() {
  float v = toNormalized(getDataValue());
  emitRGB(vec3(${rgb}));
}
`
      )),
      crossSectionBackgroundColor: "#000000",
      ...view
    };
  }
  if (c >= 0 && shape[c] > 1 && shape[c] <= 8) {
    const hex = (s) => [0, 2, 4].map((i) => (parseInt(s.slice(i, i + 2), 16) / 255).toFixed(3));
    return {
      layers: Array.from({ length: shape[c] }, (_, i) => {
        const ch = omero[i] ?? {};
        const [r, g, b] = hex(ch.color ?? "FFFFFF");
        const range = ch.window ? `(range=[${ch.window.start}, ${ch.window.end}])` : "";
        return perChannel(
          ch.label ?? `channel ${i}`,
          i,
          `#uicontrol invlerp contrast${range}
void main() {
  emitRGB(vec3(${r}, ${g}, ${b}) * contrast());
}
`
        );
      }).flat(),
      crossSectionBackgroundColor: "#000000",
      ...view
    };
  }
  return {
    layers: images.map((img) => ({ type: "image", source: `${img.url}|zarr3:`, name: many ? img.name : "image" })),
    ...view
  };
}
function neuroglancerState(...args) {
  const state = imageState(...args);
  const labels = args[7] ?? [];
  state.layers.push(...labels.map((l) => ({
    type: "segmentation",
    source: `${l.url}|zarr3:`,
    name: `labels ${l.name}`
  })));
  return state;
}
var RGB_SHADER = `void main() {
  emitRGB(vec3(toNormalized(getDataValue(0)), toNormalized(getDataValue(1)), toNormalized(getDataValue(2))));
}
`;
function channelShader(n, omero) {
  const used = /* @__PURE__ */ new Set();
  const ident = (label, k) => {
    let id = label.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^(?=[^a-z])/, "c");
    if (id === "" || id.length > 40 || used.has(id)) id = `channel${k}`;
    used.add(id);
    return id;
  };
  const controls = [];
  const sum = [];
  for (let k = 0; k < n; k++) {
    const ch = omero[k] ?? {};
    const id = ident(ch.label ?? `channel${k}`, k);
    const range = ch.window ? `, range=[${ch.window.start}, ${ch.window.end}]` : "";
    controls.push(
      `#uicontrol bool ${id}_on checkbox(default=true)`,
      `#uicontrol vec3 ${id}_color color(default="#${(ch.color ?? "FFFFFF").toLowerCase()}")`,
      `#uicontrol invlerp ${id}(channel=${k}${range})`
    );
    sum.push(`  if (${id}_on) rgb += ${id}_color * ${id}();`);
  }
  return `${controls.join("\n")}
void main() {
  vec3 rgb = vec3(0.0);
${sum.join("\n")}
  emitRGB(rgb);
}
`;
}
function translationOf(ms) {
  return ms?.datasets?.[0]?.coordinateTransformations?.find((t) => t.type === "translation")?.translation;
}
function chunkShapeOf(a) {
  const { name, configuration } = a.chunk_grid;
  if (name !== "rectilinear") return configuration.chunk_shape;
  return configuration.chunk_shapes.map(
    (lengths) => typeof lengths === "number" ? lengths : Math.max(...lengths.map((l) => Array.isArray(l) ? l[0] : l))
  );
}
async function omeView(url, ms, label, withLabels = false) {
  const levels = await Promise.all(
    ms.datasets.map(async (d) => ({
      path: d.path,
      url: `${url}${d.path}/`,
      meta: await getJson(`${url}${d.path}/zarr.json`)
    }))
  );
  const scale = ms.datasets[0].coordinateTransformations?.find(
    (t) => t.type === "scale"
  )?.scale ?? levels[0].meta.shape.map(() => 1);
  const group = await getJson(`${url}zarr.json`);
  let labels = [];
  if (withLabels) {
    try {
      const names = (await getJson(`${url}labels/zarr.json`)).attributes?.ome?.labels ?? [];
      labels = names.map((n) => ({ name: n, url: `${url}labels/${n}/` }));
    } catch {
    }
  }
  return {
    label,
    name: ms.name ?? label,
    url,
    images: [{ url, name: ms.name ?? label, translation: translationOf(ms) }],
    axes: ms.axes,
    scale,
    levels,
    omero: group.attributes?.ome?.omero?.channels ?? [],
    labels
  };
}
function arrayView(url, path2, meta) {
  const axes = meta.shape.map((_, i) => ({ name: meta.dimension_names?.[i] ?? `dim_${i}` }));
  const label = path2 === "" ? "the array" : path2;
  return {
    label,
    name: label,
    url,
    images: [{ url, name: path2 || "array" }],
    axes,
    scale: axes.map(() => 1),
    levels: [{ path: path2 || "/", url, meta }],
    omero: [],
    labels: []
  };
}
async function seriesViews(zarrUrl) {
  const series = (await getJson(`${zarrUrl}OME/zarr.json`)).attributes?.ome?.series ?? [];
  const groups = await Promise.all(series.map((s) => getJson(`${zarrUrl}${s}/zarr.json`)));
  const views2 = await Promise.all(series.map((s, i) => {
    const ms = groups[i].attributes?.ome?.multiscales?.[0];
    return omeView(`${zarrUrl}${s}/`, ms, `series ${s}${ms?.name ? ` (${ms.name})` : ""}`);
  }));
  if (views2.length < 2) return views2;
  const key = (v) => {
    const m = v.levels[0].meta;
    const c = v.axes.findIndex((a) => a.name === "c");
    return JSON.stringify([v.axes.map((a) => a.name), m.data_type, c < 0 ? 0 : m.shape[c], c < 0 ? 0 : chunkShapeOf(m)[c]]);
  };
  if (views2.some((v) => key(v) !== key(views2[0]))) {
    views2[0].note = `${views2.length} series of different axes, data types or channels: pick one.`;
    return views2;
  }
  const placed = views2.every((v) => v.images[0].translation !== void 0);
  const all = {
    ...views2[0],
    label: `all ${views2.length} series`,
    url: views2[0].url,
    images: views2.map((v) => v.images[0]),
    labels: [],
    note: `${views2.length} images (series ${series[0]}\u2013${series[series.length - 1]}), ` + (placed ? "placed at their stage positions; zoom out in Neuroglancer to see them all." : "without stage positions, so they overlap.")
  };
  return [all, ...views2];
}
async function listArrays(zarrUrl) {
  const r = await fetch(archiveDownloadUrl(zarrUrl));
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  const archive = await Archive.open(new Uint8Array(await r.arrayBuffer()), zarrUrl, () => {
    throw new Error("not read");
  });
  const paths = archive.keys().filter((k) => (k === "zarr.json" || k.endsWith("/zarr.json")) && !k.startsWith("vzip_source/")).map((k) => k.slice(0, -"zarr.json".length).replace(/\/$/, ""));
  const nodes = await Promise.all(paths.map(async (path2) => ({
    path: path2,
    meta: await getJson(`${zarrUrl}${path2 === "" ? "" : `${path2}/`}zarr.json`)
  })));
  return nodes.filter((n) => n.meta.node_type === "array");
}
var prefix;
var views = [];
function showLevels(rows) {
  $("levels").replaceChildren(
    ...rows.map(({ path: path2, meta: a }) => {
      const tr = document.createElement("tr");
      for (const v of [
        path2,
        a.shape.join(" \xD7 "),
        chunkShapeOf(a).join(" \xD7 ") + (a.chunk_grid.name === "rectilinear" ? " (clipped)" : ""),
        a.data_type,
        a.codecs.map((c) => c.name).join(", ")
      ]) {
        const td = document.createElement("td");
        td.textContent = v;
        tr.append(td);
      }
      return tr;
    })
  );
}
var shown;
async function showView(view) {
  shown = view;
  $("name").textContent = view.name;
  $("zarr-url").textContent = view.url;
  $("view-note").textContent = view.note ?? "";
  showLevels(view.levels);
  const level0 = view.levels[0].meta;
  const dataType = level0.data_type;
  const coarsest = view.levels[view.levels.length - 1];
  const sample = (channels) => sampleRanges(coarsest.url, coarsest.meta, view.axes, chunkShapeOf(coarsest.meta), channels);
  let omero = view.omero;
  const c = view.axes.findIndex((a) => a.name === "c");
  const nc = c >= 0 ? level0.shape[c] : 0;
  if (dataType !== "uint8" && nc > 1 && nc <= 16) {
    const need = Array.from({ length: nc }, (_, k) => k).filter((k) => !usableWindow(omero[k]?.window, dataType));
    const ranges = need.length > 0 ? await sample(need) : [];
    omero = Array.from({ length: nc }, (_, k) => {
      const ch = omero[k] ?? {};
      if (usableWindow(ch.window, dataType)) return ch;
      const r = ranges[need.indexOf(k)];
      if (r !== void 0) return { ...ch, window: { start: r[0], end: r[1] } };
      return { ...ch, window: ch.window && !tooNarrow(ch.window, dataType) ? ch.window : void 0 };
    });
  }
  const state = neuroglancerState(
    view.images,
    view.axes,
    view.scale,
    level0.shape,
    chunkShapeOf(level0),
    dataType,
    omero,
    view.labels
  );
  const plain = state.layers.filter((l) => l.type === "image" && !("shader" in l));
  if (plain.length > 0 && dataType !== "uint8") {
    const [range] = await sample();
    if (range !== void 0) {
      for (const l of plain) {
        Object.assign(l, { shader: `#uicontrol invlerp normalized(range=[${range[0]}, ${range[1]}])
void main() {
  emitGrayscale(normalized());
}
` });
      }
    }
  }
  if (shown !== view) return;
  const ng = $("open-ng");
  ng.hidden = false;
  ng.href = new URL(`neuroglancer/#!${encodeURIComponent(JSON.stringify(state))}`, location.href).href;
}
async function virtualize(url) {
  $("result").hidden = true;
  const here = new URL(location.href);
  here.searchParams.set("url", url);
  history.replaceState(null, "", here);
  setStatus("Starting the service worker\u2026");
  prefix ??= registerVzipWorker(new URL("vzip-sw.js", location.href));
  const p = await prefix;
  const isArchive = /\.vzip(?:[?#]|$)/i.test(url);
  const zarrUrl = isArchive ? archiveZarrUrl(p, url) : imageZarrUrl(p, url);
  setStatus(isArchive ? "Opening the archive\u2026" : "Reading the file's structure\u2026");
  const t0 = performance.now();
  const root = await getJson(`${zarrUrl}zarr.json`);
  const ms = Math.round(performance.now() - t0);
  const attrs = root.attributes ?? {};
  const map = $("open-map");
  const picker = $("view");
  map.hidden = true;
  $("view-row").hidden = true;
  if (attrs.vzip_virtualized?.profile === "safe") {
    const safe2 = attrs.vzip_virtualized.safe ?? {};
    views = [];
    $("name").textContent = `${safe2.PRODUCT_URI ?? url.split("/").pop()} (${safe2.PROCESSING_LEVEL ?? "Sentinel-2"})`;
    $("zarr-url").textContent = zarrUrl;
    $("view-note").textContent = `${safe2.SENSING_TIME ?? ""} ${attrs["proj:code"] ?? ""}`;
    showLevels(await listArrays(zarrUrl));
    $("open-ng").hidden = true;
    map.hidden = false;
    map.href = new URL(`map.html?url=${encodeURIComponent(url)}`, location.href).href;
  } else {
    const ms0 = attrs.ome?.multiscales?.[0];
    if (root.node_type === "array") {
      views = [arrayView(zarrUrl, "", root)];
    } else if (ms0 !== void 0) {
      views = [await omeView(zarrUrl, ms0, ms0.name ?? "image", attrs.vzip_virtualized?.profile === "ome-zarr")];
    } else if (attrs.ome?.["bioformats2raw.layout"] !== void 0) {
      views = await seriesViews(zarrUrl);
    } else {
      views = (await listArrays(zarrUrl)).map(({ path: path2, meta }) => arrayView(`${zarrUrl}${path2}/`, path2, meta));
      if (views.length === 0) throw new Error("no arrays to show");
    }
    if (views.length > 1) {
      picker.replaceChildren(...views.map((v, i) => new Option(v.label, String(i))));
      $("view-row").hidden = false;
    }
    await showView(views[0]);
  }
  $("download").href = archiveDownloadUrl(zarrUrl);
  $("result").hidden = false;
  setStatus(`Ready in ${ms} ms.`);
}
$("view").addEventListener("change", () => {
  showView(views[Number($("view").value)]).catch((e) => setStatus(String(e.message ?? e), true));
});
$("form").addEventListener("submit", (event) => {
  event.preventDefault();
  virtualize(input.value.trim()).catch((e) => setStatus(String(e.message ?? e), true));
});
for (const link of document.querySelectorAll("a[data-url]")) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    input.value = link.dataset.url;
    $("form").requestSubmit();
  });
}
var fromQuery = new URLSearchParams(location.search).get("url");
if (fromQuery) {
  input.value = fromQuery;
  $("form").requestSubmit();
}
//# sourceMappingURL=demo.js.map
