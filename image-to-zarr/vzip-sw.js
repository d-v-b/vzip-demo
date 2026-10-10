"use strict";
(() => {
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
  function crc32(data) {
    let c = 4294967295;
    for (const b of data) c = CRC_TABLE[(c ^ b) & 255] ^ c >>> 8;
    return (c ^ 4294967295) >>> 0;
  }
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
  function deflateRaw(data) {
    return transform(data, new CompressionStream("deflate-raw"));
  }
  async function inflateRaw(data, limit) {
    if (limit === void 0) return transform(data, new DecompressionStream("deflate-raw"));
    const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
    const chunks = [];
    let n = 0;
    for (; ; ) {
      const { done, value: value2 } = await reader.read();
      if (done) break;
      n += value2.length;
      if (n > limit) {
        await reader.cancel().catch(() => {
        });
        throw new InflateLimitError(`inflates to more than ${limit} bytes`);
      }
      chunks.push(value2);
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
  function removeDotSegments(input) {
    const out2 = [];
    let path2 = input;
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
  function getScheme(url2) {
    return split(url2).scheme?.toLowerCase();
  }
  function checkHttpUrl(url2) {
    const { authority } = split(url2);
    if (authority === void 0 || authority === "") {
      throw new Error(`${url2}: empty or absent host`);
    }
    if (authority.includes("@")) throw new Error(`${url2}: userinfo in URL`);
    const hostPort = authority.match(/^(\[[^\]]*\]|[^:]*)(?::(.*))?$/);
    if (hostPort[1] === "") throw new Error(`${url2}: empty host`);
    const port = hostPort[2];
    if (port !== void 0 && port !== "") {
      if (!/^[0-9]+$/.test(port) || Number(port) > 65535) {
        throw new Error(`${url2}: invalid port ${JSON.stringify(port)}`);
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
  function parseImfFixdate(value2) {
    if (value2 === null) return void 0;
    const m = value2.match(
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
  async function readHttpRange(url2, start, end, pins, signal, options = {}) {
    try {
      checkHttpUrl(url2);
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
    let response2;
    try {
      response2 = options.fetch ? await options.fetch(url2, { headers, signal }, options.allow) : await fetch(url2, { headers, signal, redirect: "follow", cache: "no-store" });
    } catch (e) {
      signal?.throwIfAborted();
      throw new HttpResolutionError(`${url2}: ${e.message}`);
    }
    const fail = (message) => {
      throw new HttpResolutionError(`${url2}: ${message}`);
    };
    if (response2.redirected) {
      try {
        checkHttpUrl(response2.url);
        options.allow?.(response2.url);
      } catch (e) {
        await response2.body?.cancel();
        fail(e.message);
      }
    }
    if (response2.status === 412) fail("a pin failed (412)");
    if (response2.status === 416)
      fail("the object is shorter than the range (416)");
    if (response2.status !== 200 && response2.status !== 206) {
      fail(`HTTP ${response2.status}`);
    }
    const encoding = response2.headers.get("Content-Encoding");
    if (encoding !== null) {
      const values2 = encoding.split(",").map((v) => v.trim().toLowerCase());
      if (values2.length !== 1 || values2[0] !== "identity") {
        fail(`response has Content-Encoding ${JSON.stringify(encoding)}`);
      }
    }
    const etag = single(response2.headers, "ETag");
    if (etag !== null && etag.includes(",")) fail("more than one ETag field");
    const lastModified = single(response2.headers, "Last-Modified");
    if (lastModified !== null && lastModified.split(",").length > 2) {
      fail("more than one Last-Modified field");
    }
    const skip = (header) => header === null && response2.type === "cors" && options.unverifiablePins === true;
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
    const body = new Uint8Array(await response2.arrayBuffer());
    if (response2.status === 200) {
      if (body.length < end) fail(`object is shorter than ${end} bytes`);
      return { data: body.slice(start, end), size: body.length, ...etag !== null ? { etag } : {} };
    }
    const contentRange = single(response2.headers, "Content-Range");
    if (contentRange === null && response2.type === "cors") {
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
  var STRONG_ETAG = /^"[\x21\x23-\x7e]*"$/;
  var EtagLog = class {
    seen = /* @__PURE__ */ new Set();
    saw(etag) {
      this.seen.add(etag);
      const strong = [...this.seen].filter((e) => e !== null && !e.startsWith("W/"));
      if (strong.length > 1) {
        throw new HttpResolutionError(`the object changed while it was read (ETags ${strong.sort().join(", ")})`);
      }
    }
    /** The object's strong ETag, if every response gave the same one. */
    pin() {
      if (this.seen.size !== 1) return void 0;
      const [etag] = this.seen;
      return etag !== null && STRONG_ETAG.test(etag) ? etag : void 0;
    }
  };

  // src/protobuf.ts
  var MalformedError = class extends Error {
  };
  var U64_MAX = (1n << 64n) - 1n;
  var U32_MAX = 0xffffffffn;
  var Writer = class {
    chunks = [];
    varint(v) {
      if (v < 0n) v &= U64_MAX;
      do {
        let b = Number(v & 0x7fn);
        v >>= 7n;
        if (v !== 0n) b |= 128;
        this.chunks.push(b);
      } while (v !== 0n);
    }
    tag(field, wireType) {
      this.varint(BigInt(field << 3 | wireType));
    }
    bytes(field, value2) {
      this.tag(field, 2);
      this.varint(BigInt(value2.length));
      for (const b of value2) this.chunks.push(b);
    }
    uint(field, value2) {
      this.tag(field, 0);
      this.varint(value2);
    }
    finish() {
      return Uint8Array.from(this.chunks);
    }
  };
  var utf8 = new TextEncoder();
  function encodeRange(r) {
    const w = new Writer();
    if ("data" in r) {
      w.bytes(5, r.data);
    } else {
      if (r.source !== 0) w.uint(1, BigInt(r.source));
      if (r.offset !== 0n) w.uint(3, r.offset);
      if (r.length !== 0n) w.uint(4, r.length);
      if (r.crc32c !== void 0) w.uint(6, BigInt(r.crc32c));
    }
    return w.finish();
  }
  function encodeConcat(parts) {
    const w = new Writer();
    for (const p of parts) w.bytes(1, encodeRange(p));
    return w.finish();
  }
  function encodeSourceTable(sources, revision) {
    const w = new Writer();
    for (const s of sources) {
      const m = new Writer();
      if (s.url !== void 0) m.bytes(1, utf8.encode(s.url));
      else if (s.key !== void 0) m.bytes(2, utf8.encode(s.key));
      else if (s.data !== void 0) m.bytes(3, s.data);
      if (s.size !== void 0) m.uint(4, s.size);
      if (s.etag !== void 0) m.bytes(5, utf8.encode(s.etag));
      if (s.modifiedNotAfter !== void 0) m.uint(6, s.modifiedNotAfter);
      w.bytes(1, m.finish());
    }
    if (revision !== void 0) w.uint(2, BigInt(revision));
    return w.finish();
  }
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
      const key2 = varint();
      const field = Number(key2 >> 3n);
      const wireType = Number(key2 & 7n);
      if (key2 >> 3n === 0n || key2 >> 3n > (1n << 29n) - 1n) {
        throw new MalformedError(`invalid field number ${key2 >> 3n}`);
      }
      let value2;
      switch (wireType) {
        case 0:
          value2 = varint();
          break;
        case 1:
        case 5: {
          const n = wireType === 1 ? 8 : 4;
          if (pos + n > buf.length) throw new MalformedError("truncated field");
          value2 = buf.subarray(pos, pos + n);
          pos += n;
          break;
        }
        case 2: {
          const n = varint();
          if (BigInt(pos) + n > BigInt(buf.length)) {
            throw new MalformedError("LEN field extends past the message");
          }
          value2 = buf.subarray(pos, pos + Number(n));
          pos += Number(n);
          break;
        }
        default:
          throw new MalformedError(`wire type ${wireType}`);
      }
      yield { field, wireType, value: value2 };
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
    let length2 = 0n;
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
          length2 = expect(f, "varint");
          break;
        case 5:
          data = expect(f, "len");
          break;
      }
    }
    if (data !== void 0) {
      if (source !== 0n || offset !== 0n || length2 !== 0n) {
        throw new MalformedError("literal range with source, offset or length");
      }
      if (crc !== void 0) throw new MalformedError("literal range with a crc32c");
      return { data };
    }
    if (source >= BigInt(numSources)) {
      throw new MalformedError(`source ${source} >= ${numSources} sources`);
    }
    if (offset + length2 > U64_MAX) {
      throw new MalformedError("offset + length exceeds 2^64 - 1");
    }
    return crc === void 0 ? { source: Number(source), offset, length: length2 } : { source: Number(source), offset, length: length2, crc32c: Number(crc) };
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
  var STRONG_ETAG2 = /^"[\x21\x23-\x7e]*"$/;
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
      if (s.etag !== void 0 && !STRONG_ETAG2.test(s.etag)) {
        throw new MalformedError(`etag ${s.etag} is not a strong entity tag`);
      }
      sources.push(s);
    }
    return revision === void 0 ? { sources } : { sources, revision };
  }

  // src/writer.ts
  var InvalidInputError = class extends Error {
  };
  var SPEC_REVISION = 10;
  var SOURCES_KEY = "__vz__/sources";
  var INDEX_KEY = "__vz__/index";
  var RANGE_ID = 31350;
  var CONCAT_ID = 31351;
  var U16_ALL = 65535;
  var U32_ALL = 4294967295;
  var U64_MAX2 = (1n << 64n) - 1n;
  var MAX_PAYLOAD = 65519;
  var STRONG_ETAG3 = /^"[\x21\x23-\x7e]*"$/;
  var utf82 = new TextEncoder();
  var reject = (message) => {
    throw new InvalidInputError(message);
  };
  function referenceBlock(ranges) {
    return ranges.length === 1 ? { id: RANGE_ID, payload: encodeRange(ranges[0]) } : { id: CONCAT_ID, payload: encodeConcat(ranges) };
  }
  function validate(desc) {
    const n = desc.sources.length;
    const byKey = /* @__PURE__ */ new Map();
    for (const e of desc.entries) {
      if (e.key === "") reject("empty key");
      if (!e.key.isWellFormed()) reject(`key ${JSON.stringify(e.key)} is not valid Unicode`);
      if (utf82.encode(e.key).length > U16_ALL) reject(`key longer than 65535 bytes`);
      if (e.key === SOURCES_KEY || e.key === INDEX_KEY) reject(`${e.key} is a format entry`);
      if (byKey.has(e.key)) reject(`duplicate key ${JSON.stringify(e.key)}`);
      byKey.set(e.key, e);
    }
    for (const [i, s] of desc.sources.entries()) {
      const kinds = [s.url, s.key, s.data].filter((k) => k !== void 0);
      if (kinds.length !== 1) reject(`source ${i} must have exactly one of url, key, data`);
      const pinned = s.size !== void 0 || s.etag !== void 0 || s.modifiedNotAfter !== void 0;
      if (pinned && s.url === void 0) reject(`source ${i}: pin on a non-url source`);
      if (s.etag !== void 0 && !STRONG_ETAG3.test(s.etag)) {
        reject(`source ${i}: etag ${s.etag} is not a strong entity tag`);
      }
      if (s.url !== void 0 && (s.url === "" || !isUriReference(s.url))) {
        reject(`source ${i}: url ${JSON.stringify(s.url)} is not a URI reference`);
      }
      if (s.key !== void 0) {
        const target = byKey.get(s.key);
        if (s.key === "") reject(`source ${i}: empty key`);
        if (target === void 0 || !("bytes" in target)) {
          reject(`source ${i}: key ${JSON.stringify(s.key)} is not a bytes entry`);
        }
      }
    }
    const sourceSize = (i) => {
      const s = desc.sources[i];
      if (s.data !== void 0) return BigInt(s.data.length);
      if (s.key !== void 0) return BigInt(byKey.get(s.key).bytes.length);
      return void 0;
    };
    for (const e of desc.entries) {
      if ("bytes" in e) {
        if (e.bytes.length >= U32_ALL) reject(`${e.key}: too large`);
        continue;
      }
      let total = 0n;
      for (const r of e.ranges) {
        if ("data" in r) {
          if (r.crc32c !== void 0) {
            reject(`${e.key}: a literal range with a crc32c`);
          }
          total += BigInt(r.data.length);
          continue;
        }
        if (r.crc32c !== void 0 && !(Number.isInteger(r.crc32c) && r.crc32c >= 0 && r.crc32c <= U32_ALL)) {
          reject(`${e.key}: crc32c ${r.crc32c} is not a uint32`);
        }
        if (!Number.isInteger(r.source) || r.source < 0 || r.source >= n) {
          reject(`${e.key}: source ${r.source} >= ${n} sources`);
        }
        if (r.offset < 0n || r.length < 0n || r.offset + r.length > U64_MAX2) {
          reject(`${e.key}: range exceeds 2^64 - 1`);
        }
        const size2 = sourceSize(r.source);
        if (size2 !== void 0 && r.offset + r.length > size2) {
          reject(`${e.key}: range [${r.offset}, ${r.offset + r.length}) past the end of source ${r.source}`);
        }
        total += r.length;
      }
      if (total > U64_MAX2) reject(`${e.key}: value size exceeds 2^64 - 1`);
      if (referenceBlock(e.ranges).payload.length > MAX_PAYLOAD) {
        reject(`${e.key}: reference payload exceeds ${MAX_PAYLOAD} bytes`);
      }
    }
  }
  var Out = class {
    chunks = [];
    length = 0;
    push(b) {
      this.chunks.push(b);
      this.length += b.length;
    }
    concat() {
      const out2 = new Uint8Array(this.length);
      let at = 0;
      for (const c of this.chunks) {
        out2.set(c, at);
        at += c.length;
      }
      return out2;
    }
  };
  function le(fields2) {
    const size2 = fields2.reduce((n, [, w]) => n + w, 0);
    const out2 = new Uint8Array(size2);
    const view5 = new DataView(out2.buffer);
    let at = 0;
    for (const [v, w] of fields2) {
      if (w === 2) view5.setUint16(at, v, true);
      else if (w === 4) view5.setUint32(at, v, true);
      else view5.setBigUint64(at, BigInt(v), true);
      at += w;
    }
    return out2;
  }
  async function writeVzip(desc) {
    validate(desc);
    const mirror = desc.mirror ?? true;
    const built = [];
    for (const e of desc.entries) {
      if ("bytes" in e) {
        const body = e.compress ? await deflateRaw(e.bytes) : e.bytes;
        if (body.length >= U32_ALL) reject(`${e.key}: compressed body too large`);
        built.push({
          name: utf82.encode(e.key),
          method: e.compress ? 8 : 0,
          crc: crc32(e.bytes),
          size: e.bytes.length,
          body,
          extra: new Uint8Array(),
          offset: 0
        });
      } else {
        const { id, payload } = referenceBlock(e.ranges);
        const body = mirror ? payload : new Uint8Array();
        const extra = new Uint8Array(4 + payload.length);
        extra.set(le([[id, 2], [payload.length, 2]]));
        extra.set(payload, 4);
        built.push({
          name: utf82.encode(e.key),
          method: 0,
          crc: crc32(body),
          size: body.length,
          body,
          extra,
          offset: 0
        });
      }
    }
    const table = encodeSourceTable(desc.sources, SPEC_REVISION);
    const sources = {
      name: utf82.encode(SOURCES_KEY),
      method: 8,
      crc: crc32(table),
      size: table.length,
      body: await deflateRaw(table),
      extra: new Uint8Array(),
      offset: 0
    };
    built.push(sources);
    const out2 = new Out();
    for (const b of built) {
      b.offset = out2.length;
      out2.push(
        le([
          [67324752, 4],
          [20, 2],
          [2048, 2],
          [b.method, 2],
          [0, 2],
          [33, 2],
          [b.crc, 4],
          [b.body.length, 4],
          [b.size, 4],
          [b.name.length, 2],
          [0, 2]
        ])
      );
      out2.push(b.name);
      out2.push(b.body);
    }
    const cdOffset = out2.length;
    for (const b of built) {
      const zip64 = b.offset >= U32_ALL;
      const extra = zip64 ? new Uint8Array([...b.extra, ...le([[1, 2], [8, 2], [b.offset, 8]])]) : b.extra;
      out2.push(
        le([
          [33639248, 4],
          [20, 2],
          [zip64 ? 45 : 20, 2],
          [2048, 2],
          [b.method, 2],
          [0, 2],
          [33, 2],
          [b.crc, 4],
          [b.body.length, 4],
          [b.size, 4],
          [b.name.length, 2],
          [extra.length, 2],
          [0, 2],
          [0, 2],
          [0, 2],
          [0, 4],
          [zip64 ? U32_ALL : b.offset, 4]
        ])
      );
      out2.push(b.name);
      out2.push(extra);
    }
    const cdSize = out2.length - cdOffset;
    const count = built.length;
    if (count >= U16_ALL || cdSize >= U32_ALL || cdOffset >= U32_ALL) {
      const eocd64 = out2.length;
      out2.push(
        le([
          [101075792, 4],
          [44, 8],
          [20, 2],
          [45, 2],
          [0, 4],
          [0, 4],
          [count, 8],
          [count, 8],
          [cdSize, 8],
          [cdOffset, 8]
        ])
      );
      out2.push(le([[117853008, 4], [0, 4], [eocd64, 8], [1, 4]]));
    }
    const comment = new Uint8Array(22);
    comment.set(utf82.encode("vzip/0"));
    const view5 = new DataView(comment.buffer);
    view5.setBigUint64(6, BigInt(sources.offset + 30 + sources.name.length), true);
    view5.setBigUint64(14, BigInt(sources.body.length), true);
    out2.push(
      le([
        [101010256, 4],
        [0, 2],
        [0, 2],
        [Math.min(count, U16_ALL), 2],
        [Math.min(count, U16_ALL), 2],
        [Math.min(cdSize, U32_ALL), 4],
        [Math.min(cdOffset, U32_ALL), 4],
        [comment.length, 2]
      ])
    );
    out2.push(comment);
    return out2.concat();
  }

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
  function schemeOf(url2) {
    const i = url2.indexOf(":");
    const s = i < 0 ? "" : url2.slice(0, i).toLowerCase();
    return s === "https" ? "http" : s;
  }
  function matchesPrefix(url2, prefix2) {
    if (!url2.startsWith(prefix2)) return false;
    const rest = url2.slice(prefix2.length);
    if (!(prefix2.endsWith("/") || rest === "" || "/?#".includes(rest[0]))) return false;
    const path2 = url2.split(/[?#]/, 1)[0];
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
    let text5 = s.split("%", 1)[0];
    const tail = [];
    const dotted = text5.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) {
      const v4 = parseIPv4(dotted[2]);
      if (v4 === void 0) return void 0;
      tail.push(Number(v4 >> 16n), Number(v4 & 0xffffn));
      text5 = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1);
    }
    const halves = text5.split("::");
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
  function hostClass(url2) {
    let host;
    try {
      host = new URL(url2).hostname.toLowerCase().replace(/\.$/, "");
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
  function checkPolicy(policy, base, url2) {
    validatePolicy(policy);
    const local2 = schemeOf(base) === "file";
    const scheme = schemeOf(url2);
    if (policy.prefixes !== void 0) {
      if (!policy.prefixes.some((p) => matchesPrefix(url2, p))) {
        throw new VzipError("resolution", `${url2}: not under an allowed URL prefix (spec \xA78.7)`);
      }
    } else if (scheme === "file") {
      if (!local2 && !policy.allowFilesFromRemoteArchives) {
        throw new VzipError("resolution", `${url2}: an archive opened from a URL may not read local files (spec \xA78.7)`);
      }
    } else if (scheme !== "http" && !(policy.schemes ?? []).some((s) => schemeOf(`${s}:`) === scheme)) {
      throw new VzipError("resolution", `${url2}: the scheme '${scheme}' is not allowed (spec \xA78.7)`);
    }
    if (scheme !== "http") return;
    const c = hostClass(url2);
    if (c !== void 0) checkClass(policy, url2, c);
  }
  function checkClass(policy, url2, c, address2) {
    if (c === "public" || policy.allowPrivateHosts) return;
    const at = address2 === void 0 ? "" : ` (at ${address2})`;
    throw new VzipError(
      "resolution",
      `${url2}: the host${at} is a ${c} address, which the reader does not reach without allowPrivateHosts: true (spec \xA78.7)`
    );
  }
  function checkAddress(policy, url2, address2) {
    const c = addressClass(address2);
    if (c === void 0) throw new VzipError("resolution", `${url2}: ${address2} is not an IP address`);
    checkClass(policy, url2, c, address2);
  }
  var MERGE_GAP = 1 << 16;
  var U16_ALL2 = 65535;
  var U32_ALL2 = 4294967295;
  var strictUtf82 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  function safe(v, what) {
    if (v > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new VzipError("archive", `${what} is too large`);
    }
    return Number(v);
  }
  function parseExtra(extra, view5, base) {
    const blocks = [];
    let at = 0;
    while (at < extra.length) {
      if (at + 4 > extra.length) return void 0;
      const id = view5.getUint16(base + at, true);
      const n = view5.getUint16(base + at + 2, true);
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
      this.netFetch = policy.allowPrivateHosts ? void 0 : checkedFetch((url2, address2) => checkAddress(policy, url2, address2), policy);
    }
    /**
     * Opens an archive (spec §8.1); `baseUrl` resolves relative `url` sources.
     * `policy` (spec §8.7) defaults to `DEFAULT_POLICY`, which allows http(s)
     * sources on public hosts, and for a local archive also `file` sources and
     * loopback and private hosts.
     */
    static async open(bytes, baseUrl, fetchRange = (url2, start, end, pins, options) => readHttpRange(url2, start, end, pins, void 0, options), policy = {}) {
      validatePolicy(policy);
      const rules = { ...DEFAULT_POLICY, ...policy };
      const view5 = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const n = bytes.length;
      let eocd = -1;
      for (const commentLength of [38, 22]) {
        const at2 = n - 22 - commentLength;
        if (at2 >= 0 && view5.getUint32(at2, true) === 101010256 && view5.getUint16(at2 + 20, true) === commentLength) {
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
      let count = BigInt(view5.getUint16(eocd + 10, true));
      let cdSize = BigInt(view5.getUint32(eocd + 12, true));
      let cdOffset = BigInt(view5.getUint32(eocd + 16, true));
      if (view5.getUint16(eocd + 8, true) === U16_ALL2 || count === BigInt(U16_ALL2) || cdSize === BigInt(U32_ALL2) || cdOffset === BigInt(U32_ALL2)) {
        const loc = eocd - 20;
        if (loc < 0 || view5.getUint32(loc, true) !== 117853008) {
          throw new VzipError("archive", "missing zip64 locator");
        }
        const at2 = safe(view5.getBigUint64(loc + 8, true), "zip64 record offset");
        if (at2 + 56 > n || view5.getUint32(at2, true) !== 101075792 || view5.getBigUint64(at2 + 4, true) !== 44n) {
          throw new VzipError("archive", "invalid zip64 end of central directory");
        }
        count = view5.getBigUint64(at2 + 32, true);
        cdSize = view5.getBigUint64(at2 + 40, true);
        cdOffset = view5.getBigUint64(at2 + 48, true);
      }
      void count;
      const cdStart = safe(cdOffset, "central directory offset");
      const cdEnd = cdStart + safe(cdSize, "central directory size");
      if (cdEnd > n) throw new VzipError("archive", "central directory outside the file");
      const entries = /* @__PURE__ */ new Map();
      let at = cdStart;
      while (at < cdEnd) {
        if (at + 46 > cdEnd || view5.getUint32(at, true) !== 33639248) {
          throw new VzipError("archive", `bad central directory record at ${at}`);
        }
        const flags = view5.getUint16(at + 8, true);
        const method = view5.getUint16(at + 10, true);
        const csize = view5.getUint32(at + 20, true);
        const size2 = view5.getUint32(at + 24, true);
        const nameLen = view5.getUint16(at + 28, true);
        const extraLen = view5.getUint16(at + 30, true);
        const commentLen = view5.getUint16(at + 32, true);
        let offset = view5.getUint32(at + 42, true);
        const end = at + 46 + nameLen + extraLen + commentLen;
        if (end > cdEnd) throw new VzipError("archive", "truncated central directory");
        const nameBytes = bytes.subarray(at + 46, at + 46 + nameLen);
        const extraStart = at + 46 + nameLen;
        const extra = bytes.subarray(extraStart, extraStart + extraLen);
        at = end;
        let key2;
        try {
          key2 = strictUtf82.decode(nameBytes);
        } catch {
          continue;
        }
        if (key2 === "") continue;
        if (entries.has(key2)) throw new VzipError("archive", `duplicate key ${key2}`);
        const entry2 = { key: key2, method, csize, size: size2, bodyOffset: 0 };
        entries.set(key2, entry2);
        const blocks = parseExtra(extra, view5, extraStart);
        const refs = blocks?.filter((b) => b.id === RANGE_ID || b.id === CONCAT_ID) ?? [];
        const zip64 = blocks?.filter((b) => b.id === 1) ?? [];
        if (blocks === void 0) entry2.error = "unparseable extra field";
        else if (refs.length > 1) entry2.error = "more than one reference block";
        else if (zip64.length > 1) entry2.error = "more than one zip64 block";
        else if (csize === U32_ALL2 || size2 === U32_ALL2) entry2.error = "size field is 0xFFFFFFFF";
        else if (offset === U32_ALL2) {
          if (zip64.length === 0 || zip64[0].data.length < 8) {
            entry2.error = "offset needs a zip64 block";
          } else {
            offset = new DataView(
              zip64[0].data.buffer,
              zip64[0].data.byteOffset
            ).getBigUint64(0, true);
          }
        }
        if (entry2.error === void 0 && method !== 0 && method !== 8) {
          entry2.error = `compression method ${method}`;
        } else if (entry2.error === void 0 && flags & 1) {
          entry2.error = "encrypted";
        }
        if (entry2.error === void 0 && refs.length === 1) {
          if (method !== 0) entry2.error = "reference entry with method 8";
          entry2.reference = { headerId: refs[0].id, payload: refs[0].data };
        }
        entry2.bodyOffset = typeof offset === "bigint" ? Number(offset) + 30 + nameLen : offset + 30 + nameLen;
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
    lookup(key2) {
      if (key2.startsWith("__vz__/")) return void 0;
      const entry2 = this.entries.get(key2);
      if (entry2?.error !== void 0) {
        throw new VzipError("entry", `${JSON.stringify(key2)}: ${entry2.error}`);
      }
      return entry2;
    }
    /** Visible keys, in UTF-8 order. */
    keys() {
      return [...this.entries.keys()].filter((k) => !k.startsWith("__vz__/")).sort((a, b) => compareUtf8(a, b));
    }
    ranges(entry2) {
      try {
        return decodeReference(
          entry2.reference.headerId,
          entry2.reference.payload,
          this.sources.length
        );
      } catch (e) {
        if (!(e instanceof MalformedError)) throw e;
        throw new VzipError("payload", `${JSON.stringify(entry2.key)}: ${e.message}`);
      }
    }
    /** Size of an entry's value. */
    size(entry2) {
      if (entry2.reference === void 0) return entry2.size;
      const total = this.ranges(entry2).reduce((n, r) => n + rangeSize(r), 0n);
      if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new VzipError("request", "value is too large for this reader");
      }
      return Number(total);
    }
    async body(entry2) {
      const end = entry2.bodyOffset + entry2.csize;
      if (end > this.bytes.length) {
        throw new VzipError("body", `${entry2.key}: body outside the file`);
      }
      const stored = this.bytes.subarray(entry2.bodyOffset, end);
      let body = stored;
      if (entry2.method === 8) {
        try {
          body = await inflateRaw(stored, entry2.size);
        } catch (e) {
          throw new VzipError("body", `${entry2.key}: ${e.message}`);
        }
      } else if (entry2.csize !== entry2.size) {
        throw new VzipError("body", `${entry2.key}: STORED sizes differ`);
      }
      if (body.length !== entry2.size) {
        throw new VzipError("body", `${entry2.key}: inflates to ${body.length} bytes`);
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
        const value2 = await this.body(target);
        if (end > BigInt(value2.length)) fail("range past the end of the key's value");
        return value2.subarray(Number(start), Number(end));
      }
      let url2;
      try {
        url2 = resolveReference(this.baseUrl, s.url);
      } catch (e) {
        return fail(e.message);
      }
      checkPolicy(this.policy, this.baseUrl, url2);
      const scheme = getScheme(url2);
      if (scheme !== "http" && scheme !== "https") fail(`unsupported scheme in ${url2}`);
      try {
        const { data, size: size2, hidden } = await this.fetchRange(
          url2,
          safe(start, "offset"),
          safe(end, "end"),
          s,
          {
            allow: (u2) => checkPolicy(this.policy, this.baseUrl, u2),
            unverifiablePins: this.policy.unverifiablePins,
            ...this.netFetch ? { fetch: this.netFetch } : {}
          }
        );
        const unseen = size2 === void 0 && hidden === true && this.policy.unverifiablePins;
        if (s.size !== void 0 && !unseen && BigInt(size2 ?? -1) !== s.size) {
          fail(
            size2 === void 0 ? `${url2}: the archive pins the size ${s.size}, which the response does not give` : `${url2}: the source is ${size2} bytes, but the archive pins ${s.size}: the source changed since the archive was written`
          );
        }
        return data;
      } catch (e) {
        if (e instanceof HttpResolutionError) fail(e.message);
        throw e;
      }
    }
    /** Bytes `[start, end)` of a visible key's value, or undefined if absent. */
    async read(key2, start = 0, end) {
      const entry2 = this.lookup(key2);
      if (entry2 === void 0) return void 0;
      const size2 = this.size(entry2);
      end ??= size2;
      if (start < 0 || end < start || end > size2) {
        throw new VzipError("request", `range [${start}, ${end}) of a ${size2}-byte value`);
      }
      if (entry2.reference === void 0) {
        return (await this.body(entry2)).subarray(start, end);
      }
      const parts = [];
      const cuts = [];
      let at = 0;
      for (const r of this.ranges(entry2)) {
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
      const sorted3 = [...reads].sort((x, y) => x.source - y.source || (x.offset < y.offset ? -1 : x.offset > y.offset ? 1 : 0));
      const runs = [];
      const runOf = /* @__PURE__ */ new Map();
      for (const read of sorted3) {
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
  var ImageError = class extends Error {
  };
  function blockReader(read, fileSize, blockSize = 1 << 16) {
    const blocks = /* @__PURE__ */ new Map();
    const block = (i) => {
      let b = blocks.get(i);
      if (b === void 0) {
        const start = i * blockSize;
        b = read(start, Math.min(blockSize, fileSize - start));
        blocks.set(i, b);
      }
      return b;
    };
    return async (offset, length2) => {
      if (offset < 0 || offset + length2 > fileSize) {
        throw new ImageError(`read of [${offset}, ${offset + length2}) outside the ${fileSize}-byte file`);
      }
      const out2 = new Uint8Array(length2);
      const first = Math.floor(offset / blockSize);
      const last = Math.floor((offset + Math.max(length2, 1) - 1) / blockSize);
      const parts = await Promise.all(
        Array.from({ length: last - first + 1 }, (_, k) => block(first + k))
      );
      for (const [k, data] of parts.entries()) {
        const start = (first + k) * blockSize;
        const a = Math.max(offset, start);
        const b = Math.min(offset + length2, start + data.length);
        if (a < b) out2.set(data.subarray(a - start, b - start), a - offset);
      }
      return out2;
    };
  }
  var MAX_PAYLOAD2 = 65519;
  function varintSize(v) {
    let n = 1;
    while (v >= 128) {
      v = Math.floor(v / 128);
      n++;
    }
    return n;
  }
  function rangeSize2(r) {
    if (r instanceof Uint8Array) return 1 + varintSize(r.length) + r.length;
    const [source, offset, length2] = r.length === 3 ? r : [0, ...r];
    return [source, offset, length2].reduce((n, v) => n + (v ? 1 + varintSize(v) : 0), 0);
  }
  function payloadSize(ranges) {
    if (ranges.length === 1) return rangeSize2(ranges[0]);
    return ranges.reduce((n, range) => {
      const r = rangeSize2(range);
      return n + 1 + varintSize(r) + r;
    }, 0);
  }
  var DataSources = class {
    sources = [];
    index = /* @__PURE__ */ new Map();
    /** A range of all of `value`, adding it as a source the first time it is used. */
    range(value2) {
      const key2 = Array.from(value2, (b) => String.fromCharCode(b)).join("");
      let i = this.index.get(key2);
      if (i === void 0) {
        this.sources.push(value2.slice());
        i = this.sources.length;
        this.index.set(key2, i);
      }
      return [i, 0, value2.length];
    }
    /** The output's source table: `url`, then the data sources. */
    table(url2) {
      return [{ url: url2 }, ...this.sources.map((data) => ({ data }))];
    }
  };
  function toRange(p) {
    if (p instanceof Uint8Array) return { data: p };
    const [source, offset, length2] = p.length === 3 ? p : [0, ...p];
    return { source, offset: BigInt(offset), length: BigInt(length2) };
  }
  var CONVENTION_KEY = "vzip_virtualized";
  var REVISION = 24;
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
  function convention(profile) {
    const [uuid, version, title] = PROFILES[profile];
    const tag = `virtualize-${profile}-v${version}`;
    const [ref, blob] = version === 0 ? ["heads/main", "main"] : [`tags/${tag}`, tag];
    return {
      uuid,
      schema_url: `https://raw.githubusercontent.com/d-v-b/vzip/refs/${ref}/spec/virtualize/${profile}/schema.json`,
      spec_url: `https://github.com/d-v-b/vzip/blob/${blob}/spec/virtualize/${profile}.md`,
      name: CONVENTION_KEY,
      description: `The Zarr layout of a ${title} source virtualized by vzip, and the source's metadata`
    };
  }
  function rootProperty(profile, url2, revision = REVISION) {
    const version = PROFILES[profile][1];
    return { profile, version, ...version === 0 ? { revision } : {}, source: { url: url2 } };
  }
  function declare(attributes, profile, url2, own, revision = REVISION) {
    const value2 = url2 === void 0 ? {} : rootProperty(profile, url2, revision);
    if (own !== void 0 && Object.keys(own).length > 0) value2[profile] = own;
    if (Object.keys(value2).length === 0) return { ...attributes };
    return { ...attributes, zarr_conventions: [convention(profile)], [CONVENTION_KEY]: value2 };
  }
  function setMember(o, key2, value2) {
    Object.defineProperty(o, key2, { value: value2, enumerable: true, writable: true, configurable: true });
  }
  function jsonNumber(v) {
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    if (typeof v === "bigint") return v <= max && v >= -max ? Number(v) : v.toString();
    if (Number.isNaN(v)) return "NaN";
    if (!Number.isFinite(v)) return v > 0 ? "Infinity" : "-Infinity";
    return v;
  }
  function decodeText(b) {
    try {
      return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(b);
    } catch {
      let s = "";
      for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
      return s;
    }
  }
  function textJson(b) {
    try {
      return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(b);
    } catch {
      return { latin1: latin1(b) };
    }
  }
  function latin1(b) {
    let s = "";
    for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
    return s;
  }
  function jsonText(b) {
    const nul = b.indexOf(0);
    return textJson(nul < 0 ? b : b.subarray(0, nul));
  }
  function stringifyJson(v) {
    const raw = JSON;
    return JSON.stringify(
      v,
      (_k, x) => typeof x === "number" && Number.isInteger(x) && Math.abs(x) > Number.MAX_SAFE_INTEGER && Math.abs(x) < 1e21 ? raw.rawJSON(BigInt(x).toString()) : x
    );
  }
  function base64(b) {
    let s = "";
    for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
    return btoa(s);
  }
  var SOURCE_NODE = "vzip_source";
  var MAX_PAYLOAD_BYTES = 65519;
  var MAX_CHUNK = 2 ** 24;
  function planEntries(prefix2, p) {
    const oneByte = p.dataType === "uint8" || p.dataType === "int8";
    const doc = {
      zarr_format: 3,
      node_type: "array",
      shape: p.shape,
      data_type: p.dataType,
      chunk_grid: { name: "regular", configuration: { chunk_shape: p.chunkShape } },
      chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
      fill_value: p.fill ?? 0,
      codecs: [
        oneByte ? { name: "bytes" } : { name: "bytes", configuration: { endian: p.endian ?? "little" } },
        ...p.compressor ? [p.compressor] : []
      ],
      ...p.dims !== void 0 ? { dimension_names: p.dims } : {},
      attributes: p.attributes ?? {}
    };
    const out2 = [
      { key: `${prefix2}/${p.path}/zarr.json`, bytes: new TextEncoder().encode(stringifyJson(doc)), compress: true }
    ];
    for (const [coords, c] of p.chunks) {
      const key2 = coords === "" ? `${prefix2}/${p.path}/c` : `${prefix2}/${p.path}/c/${coords}`;
      out2.push(c instanceof Uint8Array ? { key: key2, bytes: c, compress: true } : { key: key2, ranges: c.map(toRange) });
    }
    return out2;
  }
  function blobChunks(offset, length2) {
    const k = Math.ceil(length2 / MAX_CHUNK);
    const size2 = Math.ceil(length2 / k);
    const chunks = /* @__PURE__ */ new Map();
    for (let i = 0; i < k; i++) {
      const n = Math.min(size2, length2 - i * size2);
      chunks.set(String(i), n < size2 ? [[offset + i * size2, n], new Uint8Array(size2 - n)] : [[offset + i * size2, n]]);
    }
    return [size2, chunks];
  }
  function emitPlans(plans, nodeAttributes) {
    const utf89 = new TextEncoder();
    const group2 = (attributes) => utf89.encode(stringifyJson({ zarr_format: 3, node_type: "group", attributes }));
    const out2 = [{ key: `${SOURCE_NODE}/zarr.json`, bytes: group2(nodeAttributes), compress: true }];
    const groups = /* @__PURE__ */ new Set();
    for (const a of plans) {
      const parts = a.path.split("/");
      for (let k = 1; k < parts.length; k++) groups.add(parts.slice(0, k).join("/"));
    }
    for (const g of [...groups].sort()) out2.push({ key: `${SOURCE_NODE}/${g}/zarr.json`, bytes: group2({}), compress: true });
    for (const a of plans) out2.push(...planEntries(SOURCE_NODE, a));
    return out2;
  }
  var MAX_PADDING = 2 ** 16 - 2 ** 10;
  var SMALL_PADDING = 2 ** 10;
  var MAX_TOTAL_PADDING = 2 ** 20;
  function planGrid(offset, shape, item, deepen = true, limit = MAX_CHUNK) {
    if (item > limit) throw new Error(`an element of more than ${limit} bytes`);
    const chunks = /* @__PURE__ */ new Map();
    const large = [];
    if (shape.includes(0)) return [shape.map((v) => Math.max(1, v)), chunks, large];
    if (shape.length === 0) return [[], /* @__PURE__ */ new Map([["", [[offset, item]]]]), large];
    let a = 0, slab = shape.slice(1).reduce((p, v) => p * v, item);
    while (slab > limit) slab /= shape[++a];
    let n, k, c;
    for (; ; ) {
      n = shape[a];
      k = Math.ceil(n / Math.floor(limit / slab));
      c = Math.ceil(n / k);
      let bestPad = Infinity, bestC = c;
      for (let q = k; q <= Math.min(2 * k, n); q++) {
        const cq = Math.ceil(n / q);
        const pad = (Math.ceil(n / cq) * cq - n) * slab;
        if (pad < bestPad) [bestPad, bestC] = [pad, cq];
        if (pad <= SMALL_PADDING) break;
      }
      const outer = shape.slice(0, a).reduce((p, v) => p * v, 1);
      const total = shape.reduce((p, v) => p * v, item);
      const fits = bestPad <= MAX_PADDING && bestPad * outer <= Math.max(MAX_TOTAL_PADDING, Math.floor(total / 64));
      if (fits) c = bestC;
      if (fits || !deepen || a === shape.length - 1) break;
      slab /= shape[++a];
    }
    const tail = "/0".repeat(shape.length - a - 1);
    const outerCount = shape.slice(0, a).reduce((p, v) => p * v, 1);
    for (let base = 0; base < outerCount; base++) {
      const coords = [];
      for (let j = a - 1, rest = base; j >= 0; j--) {
        coords.unshift(rest % shape[j]);
        rest = Math.floor(rest / shape[j]);
      }
      for (let q = 0; q < Math.ceil(n / c); q++) {
        const m = Math.min(c, n - q * c);
        const parts = [[offset + (base * n + q * c) * slab, m * slab]];
        const key2 = [...coords, q].join("/") + tail;
        if (m < c) {
          parts.push(new Uint8Array((c - m) * slab));
          if (payloadSize(parts) > MAX_PAYLOAD_BYTES) large.push(key2);
        }
        chunks.set(key2, parts);
      }
    }
    return [[...new Array(a).fill(1), c, ...shape.slice(a + 1)], chunks, large];
  }
  async function gridChunks(offset, shape, item, read, limit = MAX_CHUNK) {
    const [chunkShape, chunks, large] = planGrid(offset, shape, item, true, limit);
    const out2 = new Map(chunks);
    for (const key2 of large) {
      const [[at, n], pad] = chunks.get(key2);
      const copy = new Uint8Array(n + pad.length);
      copy.set(await read(at, n));
      out2.set(key2, copy);
    }
    return [chunkShape, out2];
  }
  function rowChunks(offset, rows, rowBytes, rowCoords = "") {
    if (rowBytes > MAX_CHUNK) throw new Error("a row of more than 2^24 bytes");
    const [shape, chunks, large] = planGrid(offset, [rows, rowBytes], 1, false);
    if (large.length) throw new Error("an edge chunk whose padding does not fit in a payload");
    return [shape[0], new Map([...chunks].map(([k, v]) => [`${k.split("/")[0]}${rowCoords}`, v]))];
  }
  var RAGGED_CHUNK = 2 ** 20;
  async function familyPlans(path2, members, read, count, ragged = false) {
    count ??= members.reduce((m, [i]) => Math.max(m, i), -1) + 1;
    const lengths = new Set(members.map(([, , d]) => d));
    if (lengths.size === 1 && !lengths.has(0) && !ragged) {
      const [length2] = lengths;
      const ordered = [...members].sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
      if (ordered.length === count && ordered.every(([i, o], j) => i === j && o === ordered[0][1] + j * length2)) {
        const [chunkShape, chunks] = await gridChunks(ordered[0][1], [count, length2], 1, read);
        return [{ path: path2, dataType: "uint8", shape: [count, length2], chunkShape, dims: ["index", "byte"], chunks }];
      }
      if (length2 <= MAX_CHUNK) {
        return [{
          path: path2,
          dataType: "uint8",
          shape: [count, length2],
          chunkShape: [1, length2],
          dims: ["index", "byte"],
          chunks: new Map(members.map(([i, o, d]) => [`${i}/0`, [[o, d]]]))
        }];
      }
    }
    const byIndex2 = /* @__PURE__ */ new Map();
    for (const [i, o, d] of members) if (!byIndex2.has(i)) byIndex2.set(i, [o, d]);
    const starts = [];
    const pieces = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      starts.push(total);
      const m = byIndex2.get(i);
      if (m !== void 0) {
        pieces.push([total, m[0], m[1]]);
        total += m[1];
      }
    }
    starts.push(total);
    const offsets = new Uint8Array(8 * (count + 1));
    starts.forEach((x, i) => new DataView(offsets.buffer).setBigInt64(8 * i, BigInt(x), true));
    const [offsetShape, cut] = await gridChunks(0, [count + 1], 8, async (o, n) => offsets.slice(o, o + n));
    const offsetChunks = /* @__PURE__ */ new Map();
    for (const [k, v] of cut) {
      if (v instanceof Uint8Array) {
        offsetChunks.set(k, v);
        continue;
      }
      const parts = v.map((r) => r instanceof Uint8Array ? r : offsets.subarray(r[0], r[0] + r[1]));
      const chunk = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
      let at = 0;
      for (const p of parts) {
        chunk.set(p, at);
        at += p.length;
      }
      offsetChunks.set(k, chunk);
    }
    const plans = [{
      path: `${path2}/offsets`,
      dataType: "int64",
      shape: [count + 1],
      chunkShape: offsetShape,
      dims: ["index"],
      chunks: offsetChunks
    }];
    if (total > 0) {
      const sizeC = Math.ceil(total / Math.ceil(total / RAGGED_CHUNK));
      const dataChunks = /* @__PURE__ */ new Map();
      let first = 0;
      for (let c = 0; c < Math.ceil(total / sizeC); c++) {
        const lo = c * sizeC;
        const hi = Math.min(total, (c + 1) * sizeC);
        while (first < pieces.length && pieces[first][0] + pieces[first][2] <= lo) first++;
        const ranges = [];
        for (let p = first; p < pieces.length && pieces[p][0] < hi; p++) {
          const [at, o, d] = pieces[p];
          if (at + d <= lo) continue;
          const start = o + Math.max(lo, at) - at;
          const n = Math.min(hi, at + d) - Math.max(lo, at);
          const last = ranges[ranges.length - 1];
          if (last !== void 0 && last[0] + last[1] === start) last[1] += n;
          else ranges.push([start, n]);
        }
        if (hi - lo < sizeC) ranges.push(new Uint8Array(sizeC - (hi - lo)));
        if (payloadSize(ranges) > MAX_PAYLOAD_BYTES) {
          const parts = await Promise.all(ranges.map((r) => r instanceof Uint8Array ? r : read(r[0], r[1])));
          const copy = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
          let at = 0;
          for (const p of parts) {
            copy.set(p, at);
            at += p.length;
          }
          dataChunks.set(String(c), copy);
        } else {
          dataChunks.set(String(c), ranges);
        }
      }
      plans.push({ path: `${path2}/data`, dataType: "uint8", shape: [total], chunkShape: [sizeC], dims: ["byte"], chunks: dataChunks });
    }
    return plans;
  }

  // src/virtualize/dicom/dataset.ts
  var DicomError = class extends Error {
  };
  var reject2 = (message) => {
    throw new DicomError(message);
  };
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
  var UNDEFINED = 4294967295;
  var ITEM = 4294893568;
  var ITEM_END = 4294893581;
  var SEQUENCE_END = 4294893789;
  var PIXEL_DATA = 2145386512;
  var WALKED = /* @__PURE__ */ new Set([1375769129, 2658576]);
  var MAX_DEPTH = 64;
  var tagName = (tag) => {
    const h = (v) => v.toString(16).toUpperCase().padStart(4, "0");
    return `(${h(Math.floor(tag / 65536))},${h(tag % 65536)})`;
  };
  var IMPLICIT_LE = { explicit: false, little: true };
  var EXPLICIT_LE = { explicit: true, little: true };
  var dv = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var Walker = class {
    read;
    size;
    constructor(read, size2) {
      this.read = read;
      this.size = size2;
    }
    /** The element at `pos`, whose header must end by `end` (§6.1). */
    async header(pos, end, enc) {
      if (pos + 8 > end) reject2(`the element at ${pos} runs past its container`);
      const b = dv(await this.read(pos, 8));
      const group2 = b.getUint16(0, enc.little);
      const tag = group2 * 65536 + b.getUint16(2, enc.little);
      if (group2 === 65534 || !enc.explicit) {
        return { tag, vr: null, value: pos + 8, length: b.getUint32(4, enc.little), little: enc.little };
      }
      const vr = String.fromCharCode(b.getUint8(4), b.getUint8(5));
      if (!VRS.has(vr)) reject2(`unknown VR ${JSON.stringify(vr)} at ${pos}`);
      if (LONG_VRS.has(vr)) {
        if (pos + 12 > end) reject2(`the element at ${pos} runs past its container`);
        const length2 = dv(await this.read(pos + 8, 4)).getUint32(0, enc.little);
        return { tag, vr, value: pos + 12, length: length2, little: enc.little };
      }
      return { tag, vr, value: pos + 8, length: b.getUint16(6, enc.little), little: enc.little };
    }
    /** The File Meta Information, and where the dataset starts (§6.2). */
    async meta() {
      const elements = /* @__PURE__ */ new Map();
      let pos = 132;
      while (pos + 2 <= this.size && dv(await this.read(pos, 2)).getUint16(0, true) === 2) {
        const el = await this.header(pos, this.size, EXPLICIT_LE);
        if (el.length === UNDEFINED) reject2(`meta element ${tagName(el.tag)} has an undefined length`);
        if (el.value + el.length > this.size) reject2(`meta element ${tagName(el.tag)} runs past the end of the file`);
        if (!elements.has(el.tag)) elements.set(el.tag, el);
        pos = el.value + el.length;
      }
      return [elements, pos];
    }
    /** The elements from `pos`: to `end` (defined), or to an item delimiter
     * within `end` (§6.3). The top-level dataset stops at Pixel Data, whose
     * header is the last one read. */
    async dataset(pos, end, defined, enc, depth2, top = false) {
      const elements = /* @__PURE__ */ new Map();
      for (; ; ) {
        if (defined && pos === end) return [elements, pos];
        if (top && pos >= end) reject2("no Pixel Data element");
        const el = await this.header(pos, end, enc);
        if (Math.floor(el.tag / 65536) === 65534) {
          if (el.tag === ITEM_END && !defined && !top) {
            if (el.length !== 0) reject2(`the item delimiter at ${pos} has a nonzero length`);
            return [elements, el.value];
          }
          reject2(`unexpected ${tagName(el.tag)} at ${pos}`);
        }
        if (top && el.tag === PIXEL_DATA) {
          if (!elements.has(el.tag)) elements.set(el.tag, el);
          return [elements, el.value];
        }
        if (el.length === UNDEFINED) {
          if (enc.explicit && el.vr !== "SQ" && el.vr !== "UN" && !(el.tag === PIXEL_DATA && (el.vr === "OB" || el.vr === "OW"))) {
            reject2(`${tagName(el.tag)} with VR ${el.vr} has an undefined length`);
          }
          if (el.tag === PIXEL_DATA) {
            pos = (await this.fragments(el.value, end, enc.little))[1];
          } else {
            const inner = el.vr === "UN" ? IMPLICIT_LE : enc;
            [el.items, pos] = await this.sequence(el.value, null, end, inner, depth2);
          }
        } else {
          if (el.value + el.length > end) reject2(`${tagName(el.tag)} at ${pos} runs past its container`);
          if (WALKED.has(el.tag)) {
            if (enc.explicit && el.vr !== "SQ") reject2(`${tagName(el.tag)} has VR ${el.vr}, not SQ`);
            [el.items] = await this.sequence(el.value, el.value + el.length, end, enc, depth2);
          }
          pos = el.value + el.length;
        }
        if (!elements.has(el.tag)) elements.set(el.tag, el);
      }
    }
    /** A sequence's items: to `end` if its length is defined, else to a
     * sequence delimiter within `limit` (§6.3). */
    async sequence(pos, end, limit, enc, depth2) {
      const container = end ?? limit;
      const items = [];
      for (; ; ) {
        if (end !== null && pos === end) return [items, pos];
        const el = await this.header(pos, container, enc);
        if (end === null && el.tag === SEQUENCE_END) {
          if (el.length !== 0) reject2(`the sequence delimiter at ${pos} has a nonzero length`);
          return [items, el.value];
        }
        if (el.tag !== ITEM) reject2(`expected an item at ${pos}, found ${tagName(el.tag)}`);
        if (depth2 + 1 > MAX_DEPTH) reject2(`items nested more than ${MAX_DEPTH} deep`);
        let ds;
        if (el.length === UNDEFINED) {
          [ds, pos] = await this.dataset(el.value, container, false, enc, depth2 + 1);
        } else {
          if (el.value + el.length > container) reject2(`the item at ${pos} runs past its container`);
          [ds] = await this.dataset(el.value, el.value + el.length, true, enc, depth2 + 1);
          pos = el.value + el.length;
        }
        items.push(ds);
      }
    }
    /** The items of a fragment sequence at `pos`, as [item offset, data
     * offset, data length], and where the sequence ends (§6.5). */
    async fragments(pos, limit, little) {
      const items = [];
      for (; ; ) {
        if (pos + 8 > limit) reject2(`the fragment sequence runs past its container at ${pos}`);
        const b = dv(await this.read(pos, 8));
        const tag = b.getUint16(0, little) * 65536 + b.getUint16(2, little);
        const length2 = b.getUint32(4, little);
        if (tag === SEQUENCE_END) {
          if (length2 !== 0) reject2(`the sequence delimiter at ${pos} has a nonzero length`);
          return [items, pos + 8];
        }
        if (tag !== ITEM) reject2(`expected a fragment item at ${pos}, found ${tagName(tag)}`);
        if (length2 === UNDEFINED || pos + 8 + length2 > limit) {
          reject2(`the fragment at ${pos} has an undefined length or runs past its container`);
        }
        items.push([pos, pos + 8, length2]);
        pos += 8 + length2;
      }
    }
  };

  // ../python/src/vzip/virtualize/dicom/dictionary.json
  var dictionary_default = { source: "PS3.6 as shipped by pydicom 3.0.2", tags: { AE: "00000200000003000000040000000600000010300002001600020017000200180008005400080055000810000032102100400001004002410072005E00741234007412362100007021000140", AS: "001010100072005F", AT: "000009010000100500140202002050000020916500209167002800090028000A0028006600280404002807020028072100720026007200520072006000741052040000202200000E300800613008006230080065", CS: "000051300000514000005150000051600000518000005190000051A0000411300004114100041142000414300004150000080005000800080008001C0008004200080052000800530008005600080060000800610008006400080068000801050008010A0008010B0008010F0008022100080303000803070008030A00080403000804050008040A0008040F000804150008041700080426000821100008220000082204000822080008900700089205000892060008920700089208000892090008946000100022001000350010004000100200001021A0001022030010221000102298001200530012006200120084001200850014005000140052001401010014010700140108001402050014201A0014201C001422080014220C0014220E00142228001440040014400A001440130014402600144032001440360014408100145105001451090014511E001600610016007100160073001600790016007A0016007C0016007E0016008000160083001600850016008700160089001610010016100300161004001800150018002000180021001800220018002300180025001800370018003800180039001800420018007100180073001810480018106A00181080001811340018113A001811400018114700181155001811560018115A001811660018118100181191001811B2001811B3001811B4001811B6001811BE001811C000181301001813120018131500181402001814030018149000181491001815000018150800181600001816300018170000181800001818020018202000183100001851000018510100186031001870000018700400187005001870240018703400187050001870600018706400189004001890080018900900189010001890110018901200189014001890150018901600189017001890180018902000189021001890220018902400189025001890260018902700189028001890290018903200189033001890340018903600189037001890430018904400189048001890510018905400189059001890600018906200189064001890650018906700189075001890770018907800189081001890850018909400189100001891010018914700189166001891690018917000189171001891720018917300189174001891770018917800189179001891800018918300189198001891990018920000189214001892360018925000189257001892590018925C001892970018930200189315001893160018932300189333001893340018934200189343001893440018936100189368001893720018937E00189410001894200018942500189427001894350018945700189474001895270018955900189622001896240018972500189738001897550018975600189758001897590018976000189761001897620018976300189764001897650018976600189767001897680018976900189770001898080018980B0018980C0018982800189829001899050018991800189930001899440018994700200020002000600020006200200080002034010020340200209072002092470020924900209250002093070020930B0020930C00209311002200050022000D002200280022003900221009002210100022103900221046002210490022112B00221140002214150022146600221515002216220024001200240037002400390024004000240045002400510024005200240053002400550024005700240059002400610024006200240063002400720024007400240076002400780024008000240086002400930024009500240102002401060024011300240117002401200024012400240338002800040028004000280051002800600028006500280090002803000028030100280302002803030028070100280A020028104000281056002810800028109000281300002813500028135A00281402002814050028140D0028140E0028140F00281410002820020028211000282114002860230028610100287006002870130028701400287019002870210028702500287026002870290028702B00289003002891080028923500289444002894460028945400289474002895370032000A0032000C00321055003400080034000C00380008003A0004003A0205003A0246003A0302003A0316003A0317003A032200400020004000330040003500400252004002610040031800404001004040020040400300404006004040200040404000404041004083030040A0070040A0100040A0400040A0500040A0570040A0800040A0840040A1250040A1300040A1730040A1740040A1940040A2900040A4030040A4910040A4930040A4940040A4960040A6000040A6010040A6030040DB000040DB0B0040E020004400020046003200460036004600380046009200460094004600950046012500460201004602420046024800480010004800110048001200480114004801150048030100500004005000170050001A005200060052002600520031005200390052003A005400390054020200540500005405010054100000541001005410020054100400541006005411000054110200541220005414000054140100620001006200080062001000620013006600090066000D0066000E0066001000686223006864200068700100687002006A0001006A0007006A000D006A000F00700002007000030070000400700005007000120070001500700023007000240070004100700080007001000070022800700242007002430070024400700248007002490070025000700254007002570070027400700278007002790070028200700294007003060070030C00700405007012020070120400701206007012080070120B0070120D0070130200701501007015020070160200701701007018020070190700701A0100701B0600701B0700701B0800701B130072000600720024007200340072003A007200500072006200720208007203040072031000720312007203160072040200720404007204060072043400720500007205100072051600720520007206020072060400720700007207020072070400720706007207100072071200720714007207160072071700720718007410000074102200741025007410320074103400741036007412000074124200741244007412460074140A0076000A0076003600760038008200010082000800820032008200360082003801000410040000150400011004000305040005650400060020000020200000302000004020000062200000632000006520000067200000692000006A20100030201000402010005020100052201000542010006020100080201000A6201000A7201000A8201000A9201001002010011020100140202000202020004020200050202000A0202000A2204000602040007020400072204000802040008220400090204001002050002021000020210000302110001021100020212000102200000122000003220000062200000722000008220000092200000A2200000F220000203002000A3002000C3002004130020051300201053002011130020115300201293002012A3002012E3002012F300400013004000230040004300400053004000A300400143004005430040062300600333006003630060042300600A4300600B2300600C4300800143008002A3008002C300800A330080116300802003008022430080230300A000A300A000C300A0014300A0015300A0020300A0055300A008B300A0090300A0092300A0093300A00B3300A00B8300A00C4300A00C6300A00C7300A00CE300A00D3300A00EE300A00F8300A00FA300A00FB300A0109300A0118300A011F300A0121300A0123300A0126300A0142300A0146300A014C300A0150300A0192300A01A2300A01B0300A01B6300A0200300A0202300A0214300A0229300A0232300A0264300A0288300A0292300A02E0300A02E1300A0308300A0309300A0320300A0338300A0348300A0350300A0393300A0395300A0423300A0432300A0451300A0452300A0511300A0512300A060F300A061A300A061B300A061D300A0637300A0638300A0639300A064E300A064F300A065C300A0663300A066C300A068B300A0701300A0706300A0707300A0708300A0709300A0714300A0723300A0732300A079E300C0112300C0123300C0126300C0129300E0002301000023010000E301000103010001C301000453010004630100047301000483010004F30100059301000633010006830100073301000753010008330100090400800FF400802104008021240100001401000024010100840101009401010124010101440101015401010204010102140101024401010274010102840101031401010394010103A401010424010104440101046401010484010105640101059401010674010106D4010106E401010704010107C54001006", DA: "0008001200080020000800210008002200080023000800240008002500100030001021D0001200860012008700140102001410200014307600144076001440780014407A0014407E001810120018120000181204001812050018700C002034030032003200320034003210000032101000321040003210500038001A0038001C003800200038003000400002004000040040024400400250004020040040A0230040A1100040A1210040A19200700082007200612100004030060008300800243008005430080056300801623008016630080250300A0006300A022C300E00043010004C3010004D400801004008010840080112", DS: "00082130001010200010102200101023001010240010103000140030001400320014003400140054001400560014222A0014222C0014301100143012001430240014302600143028001430710014307200143073001430750014401400144015001440160014401700144018001440190014401A0014401B0014401C0014401D0014402200144024001440280014403100144034001440380014403A0014403C001440520014405700144058001440590014405A0014406200144064001440840014408500144088001440890014408B0014408C0014408D0014408E001440920014409C0014409D0014409F0014510100145102001451030014510400145107001451080014510A0014510C0014510D0014510E00145112001451130014511400145115001451160014511700145118001451190014511A0014511B0014511C0014511D0014511F00160001001600020016000400160005001600090016000D00160010001600210016002200160023001600240016002500160026001600290016003000160031001600320016003300160034001600350016003600160038001600440016004E0016007200160074001600760016007B0016007D0016007F001600810016008400160086001600880016008A0016100200161005001800280018003200180033001800500018006000180061001800720018008000180081001800820018008300180084001800870018008800180090001800930018009400180095001810410018104400181046001810470018104900181050001810600018106300181065001810660018106700181068001810690018107100181074001810750018107600181077001811000018111000181111001811140018112000181121001811300018113100181135001811360018113700181138001811410018114200181143001811440018114500181146001811540018115E0018116200181164001811830018118400181190001811A0001811A2001811A3001811A5001813000018131400181316001813180018141100181412001814130018145000181460001814700018148000181510001815110018152000181521001815300018153100182003001820040018200500182010001820300018310100183102001850120018502200185024001850260018502700185028001850290018503000185040001852100018521200186000001870010018701200187014001870160018701A0018702000187022001870260018702800187030001870320018704200187044001870480018704C00187052001870540018706500188150001881510018936C0018936D0018936E0018937400189375001893830018938400189904002000300020003200200035002000370020005000200110002010410022004E00221630002800300028003100280032002810500028105100281052002810530028211200289520003A001A003A0210003A0212003A0213003A0214003A0215003A0218003A0220003A0221003A0222003A0223003A0311003A0313003A0315003A03240040029400400306004003070040031200400314004003160040072A0040073A0040074A004083020040A1380040A30A004801020048011100480112004801130050001400500016005000180050001900540014005400150054007300540200005412000054120300541210005413000054132000541321005413220054132300541324007001010072007200741004007410380074103A0074140200741403007414070074140820100376202000303002000D3002000E30020010300200113002001230020022300200243002002630020028300200323002003430020042300400083004000C3004000E30040012300400403004004230040052300400583004007030040072300400743006002C300600443006004530060050300600B4300600C630080016300800323008003330080036300800373008003A3008003B3008004230080044300800483008005230080076300800783008007A30080132300801343008013A3008013C300A0018300A001A300A0021300A0022300A0023300A0025300A0026300A0027300A0028300A002A300A002B300A002C300A002D300A0044300A0046300A004A300A004C300A004E300A0051300A0052300A0053300A0082300A0084300A0086300A0091300A0094300A00A2300A00A4300A00B4300A00BA300A00BE300A00D6300A00D8300A00DA300A00DE300A00E2300A00E6300A00E9300A00EA300A00EB300A00EC300A00F2300A00F6300A0100300A0102300A0106300A010C300A010E300A0114300A0115300A011C300A011E300A0120300A0122300A0124300A0125300A0128300A0129300A012A300A012C300A012E300A0130300A0134300A0151300A0152300A0153300A0154300A0155300A01BC300A01D2300A01D4300A01D6300A0218300A021A300A0222300A0224300A0228300A022A300A022B300A0250300A026A300A026C300A0271300A0272300A0274300A0284300A0286300A028C300A0296300A029C300A029E300A02A0300A02A4300A02B8300A02BA300A02C8300A02D2300A02D4300A02D6300A02E2300A0426300A0442300A0680300A0681300A0682300C0008300C0009401010754010107E", DT: "000800150008002A000801060008010700080404000804160008041F001600770016008D001810780018107900181202001812030018907400189151001893690018936A0018951600189517001896230018970100189804001899190018A002003A0314004040050040400800404010004040110040405000404051004040520040A0300040A0320040A0330040A0820040A1200040A13A0040DB060040DB070040E004004400040044000B00440010004401040044010500686226006862700072000A007200630100042004000105040005623006002D3006002E300A0736300A073A300A0741300A0760300C012740101025401010264010102B40101041", FD: "00020038000811630008213400120052001811B7001811B9001811BD00181271001816310018163200181633001816340018163500181636001860280018602A0018602C0018602E001860340018603600186054001890190018903000189035001890520018905300189061001890630018906900189070001890730018907900189082001890870018908900189090001890910018909600189098001891040018910500189106001891550018916800189181001891820018918400189195001891960018921700189218001892200018925400189255001892560018925A0018929500189296001893030018930500189306001893070018930900189310001893110018931300189317001893180018931900189322001893240018932700189328001893300018933200189335001893450018937C00189543001895440018954500189546001895470018954800189549001895500018955100189552001895530018955400189557001895580018960200189603001896040018960500189606001896070018971500189716001897170018971800189719001897200018972100189722001897230018972400189726001897270018980100189805001898220018982300189824001898260018982B0018982D0018982E0018982F0018983000189833001898340018994200189943001899450018994600209153002092510020925200209254002092550020925600209257002093010020930200209308002093090020930A0020930D0022000F002801230028012500281231002812320028140600409212004092130040921400409224004092250040A16100460030004600340046004000460042004600440046004600460060004600620046006300460064004600750046007600460077004601040046010600460114004601150046013700460146004601470048011700500013005000150050001C0050001D00520002005200030052000400520007005200080052000900520011005200130052001400520028005200330052003400640008006862A5006862F2006863460068634700686390006864500068646000686490006864A0006864C0006864D0006864F00068656000686590006865B0006865D0006865F00068661000686620006A0010007002300070030B007003120070130300701305007013060070150300701505007015070070150800701511007015120070160300701604007016050070160600701607007017020070170300701704007017050070170600701A0300701A0500701A0600701B14007200740072010800720330007205120072051400740120007401210074102600741027007410280074102A0074102B0074102C0074102D007413380074133A007800500078006000780090007800A0008000040080000530020106300201073002010F3002012D30020134300800A4300A00C5300A060D300A0612300A0613300A061E300A0624300A0625300A0626300A0627300A0628300A062C300A062E300A0634300A063C300A063D300A0640300A0642300A0643300A0645300A0649300A064A300A064B300A0652300A0653300A0654300A0666300A0669300A066D300A066E300A0679300A067A300A0688300A079B300C0121300C0122300C01243010005030100051301000743010008430100093301000943010009530100096301000993010009A40101073", FL: "000894590010943100180013001813200018204300182044001820460018605A00186060001870360018703800187056001870580018935100189352001893530018940200189403001894040018942600189428001894290018943000189447001894490018945200189461001894630018946400189465001894660018946700189468001894690018947000189471001894730018950800189509001895100018951100189514001895150020915400209155002092410020924500209246002092480022000700220008002200090022000A0022000B0022000C0022000E00220010002200110022001200220013002200140022001E00220030002200320022003500220036002200370022003800220041002200480022004900220055002200560022005700221019002210330022103700221053002210540022105900221121002211220022113000221131002211550022146000221463002214670022146800221517002215270022152800221529002216240022162600221643002216440022164500221646002216490022165000240010002400110024001800240020002400250024002800240046002400540024006600240068002400700024007100240073002400750024007700240079002400810024008700240088002400900024009100240092002400940024009600240098002401000024010300240104002401050024010700240108002401180024012600240341002801220028012400286114002870180028701A0028701D0028701E0028701F002894110028944500289478003A0230003A0245003A0247003A02480046011700460118004602020046020300460204004602050046021200460213004602200046022400460227004602300046023200460234004602360046023800460247004602490046025000460251004602520046025300480001004800020048000300480014005200010066000A0066000C0066001700660018006600190066001A0066001B0066001C006600200066003700660038007000100070001100700014007000220070010300700245007002460070025300700258007002610070026200700273007002840070028500700288007004030072007604000315300600B83008004530080046300800473008006A300A004B300A004F300A0050300A0088300A0089300A008A300A008D300A008E300A008F300A00BB300A00D7300A00D9300A00DB300A00F3300A00F7300A0131300A0132300A0133300A0140300A0144300A0148300A014A300A014E300A0199300A019A300A02E3300A02E4300A02E5300A02E6300A02E7300A02E8300A030A300A030D300A033C300A0356300A0358300A035A300A0364300A0366300A0374300A0382300A0384300A0386300A0388300A038A300A038F300A0394300A0396300A0398300A0399300A0412300A0425300A0433300A0434300A0435300A0436300A0501300A0502300A0503300A0504300A0507300A0508300A0509300A0510300C01154010100440101005401010164010101740101018401010194010101B4010101C4010101D4010102340101043401010604010106140101062401010694010107A", IS: "0000517000081160000821220008212400082128000821290008212A0008214200082143000821440014020600140207001420040014200800142014001422020014220A001422240014222600144033001450020014500400160006001600070016000A0016000B0016000E0016000F00160018001600190016001B0016001C0016001D0016001E0016001F0016002A00160037001600450016008E001800400018007000180074001800750018008600180089001800910018104500181062001810810018108200181083001810840018108600181088001810900018109400181149001811500018115100181152001811530018117000181182001811B50018124000181242001812430018130200181405001814950018160200181604001816060018160800181610001816120018162000181702001817040018170600181708001817100018171200181720001820010018310300183104001831050018505000187010001870110018704600189298002000110020001200200013002000140020001500200016002000170020001800200019002000220020002400200026002000AA0020010000200105002010000020100100201002002010030020100400201005002010700020120000201202002012040020120600201208002012090028000800280034003A0202003A0301003A032700460208005400170054003600540038005402100054120100541202005413100054131100700040007000620070010200720064007410240074105700741404007414060074140C2000001020000060200000612010015421000170300200293002010030040056300600223006002A3006004630060048300600493006008230060084300800223008005A3008006330080064300800723008008230080092300801223008013630080138300801423008015230080223300A0012300A0042300A0071300A0078300A0079300A007A300A0080300A00A0300A00BC300A00C0300A00C8300A00D0300A00D2300A00D5300A00E0300A00E4300A00E7300A00E8300A00ED300A00F0300A00FC300A0104300A0110300A0112300A0182300A0212300A0234300A0240300A0262300A0282300A028A300A0290300A02A1300A02A2300A02B2300A0302300A0304300A0312300A0316300A0330300A0334300A0340300A0344300A0391300A0392300A039A300A0424300A0440300C0006300C0007300C000C300C000E300C0022300C0051300C006A300C00A0300C00C0300C00D0300C00E0300C00F0300C00F4300C00F6300C0100300C0102300C01043010007C", LO: "00000902000800410008007000080080000801010008010400080112000801220008022200080302000810300008103E0008104000081080000810880008109000082132001000200010002100100033001000340010021300100214001002170010022300101000001010400010105000101080001010810010109000102000001021100010215000102152001021F000102201001022920010229500102299001200100012002000120021001200220012003000120031001200320012004000120041001200420012004300120050001200550012006000120063001200710012007200120073001200810012008200140100001402030014020400143074001440A0001440A1001440A20014511100180010001800300018003100180034001810000018100300181004001810050018100600181007001810080018101000181011001810160018101700181018001810190018101A0018101B001810200018102300181030001810400018106100181064001810700018108500181161001811A4001811B0001811B1001811BB001812610018140000181401001818030018501000185020001850210018702A0018702B00189041001890460018905000189175001892520018925B0018925E00189423001894330018952400189525001895260018952800189531001899000018991600189922001899370020002700200070002010200020103F00201040002034040020340600205002002092130020923800209421002094530022102900221065002210660022109300221094002210950022109700221159002212730022145400221616002400690024020200240306002403070024030800240309002800500028005F002800620028040000280401002804030028070000280A04002810540028105500283003002830040028602200287005002870070028700D002870200028702A0032001200321020003210300032103300321060003210700038001000380011003800160038001E003800400038005000380060003800610038006200380102003803000038040000380500003A020C004000070040001200400254004002550040050A004005120040051A0040055100400600004006FA00401002004010040040100500401008004010600040110300402001004020160040201700403001004040360040A0270040A0470040A0600040A3540040A4920042001200420014004400080044000A004400110044001200460012004601390050001B0050001E00500020005411010054110300541104005411050060301000620005006200090066000B0066003100660036006601060068621000686221006862D50068634000686380006863D000686540006A0005007000680070008100700207007002270070022900701A090072000400720008007200100072004000720054007200560072006600720203007202060074100C00741056007412020074120400741222007412300074140B00760001007600030076000600760030007800010078002000780024007800B2008200160082001800820019008200230088090400880910008809120100042604000563040005642000005020300020211000302200000C300200033002012130040006300600043006002630060038300600C830080105300A0003300A0009300A000B300A0016300A0072300A00C2300A00CC300A00F9300A00FE300A010A300A0183300A0184300A0216300A021C300A0226300A0236300A0238300A0244300A0266300A0294300A0298300A02B4300A0322300A033A300A034A300A0354300A0355300A0362300A0372300A0608300A0611300A0615300A0619300A0623300A062A300A079A300C0113301000053010001A3010001E3010002D30100034301000363010003830100054301000563010007740080042400801034008011A40080202401010294010105140101053", LT: "00004000000040100000511000005120000801080008040100080402000804180008400000102155001021B00010400000140046001430990014310000143101001440060014400C0014400F001440820018400000187006001870080018704000187041001870620018942400204000002091580022112C0024004400284000003240000038400000400400004011040040140000402011004024000044000300440009006600040066003200720068007412380100042420100152220000042200000530020123300A007B300A02EB300A078E300A0792300A07943010001D301000864000001040004000400801154010101340101068", OB: "0002000100020031000200350002003600020102000802020008041B0008041C00142210001430800016002B0016004B00160062001600700016008B0016008C0018944500280020002820000034000200340005003400070040A0740040A0890042001100686300007002560070180800720065040001150400012004000310040004040400052004000552401010064010106CFFFCFFFC", OD: "003A032E006600220070150D00701A07007200737FE00009", OF: "001816380022153100640009006600160066002100660125007200670080001000800011300A0664300A0665300A066B56000010560000207FE00008", OL: "0066004000660041006600420066004300660129006A001100720075", OV: "007200817FE000017FE00002", OW: "0028120100281202002812030028120400281211002812120028121300281221002812220028122300281224002814080066002300660024006600250066002900660103007200697FE000207FE000307FE00040", PN: "000800900008009C000810480008105000081060000810700010001000101001001010050010106000102297001401040014200600321032004000060040101000402008004040370040A0670040A0750040A1230040A3070040A352007000840072006A300600A6300E0008400801024008010A4008010C4008011440080119", SH: "0000001000005010000050200002001300080010000800500008009400080100000801020008010300080201000810100008212000082127001021540010216000102180001420160014203200144074001451060014510B0014510F0014511000180024001800850018102200181160001811800018121000181250001812510018126000181801001820020018200600182045001850000018700A0018900500189047001891860018932000200010002090560028006100280063002870040028700C003A0020003A020300400009004000100040001100400242004002430040025300401001004010030040100600401007004010090040200600402007004020090040201000409210004801060054001800540400006A000E0070028900700310007200020072006C008000090088013021000010210001602110009930020002300200203002005230060002300600853008002B300A0002300A0043300A00B2300A00D4300A00DC300A00E1300A00E5300A00EF300A00F5300A0108300A0194300A0198300A01A4300A01A8300A01B8300A021B300A0242300A0263300A0273300A0291300A02B3300A030F300A0318300A0336300A0346300A034C300A0352300A0390300A0421300A067C30100033301000354008004040080200401010074010101A4010101E4010101F4010102A40101052401010544010105540101058", SL: "0018602000186022001860390018603B0018603D0018603F00186041001860430040A1620040A29A0048021E0048021F00700052007000530072007C", SQ: "0004122000080006000800510008006300080082000800960008009D000801090008011000080121000801230008012400080220000803000008030500080310000804000008040600080410000804110008041200080413000804190008041A0008041D0008041E000804200008042100080422000804230008042400080425000810320008103F0008104100081049000810520008106200081072000810840008110000081110000811110008111200081115000811200008112500081130000811340008113A00081140000811450008114A0008114B000811560008116400081198000811990008119A0008119B000812000008125000082112000821330008213500082218000822200008222800082229000822300008224000082242000822440008224600082251000822530008225500082257000822590008225A0008225C0008300100083011000890920008912100089124000891540008921500089237000894100008945800100024001000260010002700100050001001010010010200100201001002150010021600100219001002210010022900101002001010210010110000102161001022020010229300102294001022960012002300120054001200640012008300140106001402000014020100142002001420120014201E00142030001422040014222000143020001430400014306000144002001440080014400E0014401000144011001440200014403000144035001440400014405000144051001440600014407000144080001440830014408600144087001440910014409A001800120018001400180026001800290018002A001800360018100A001811B8001811BA001811BC001811BF001811C10018127200182041001850110018510400186011001890060018904200189045001890490018907600189083001890840018909200189103001891070018911200189114001891150018911700189118001891190018912500189126001891520018917600189197001892260018922700189239001892510018925D001892600018930100189304001893080018931200189314001893210018932500189326001893290018933800189340001893410018934600189360001893620018936300189364001893650018936F001893790018937D001893800018938100189382001894010018940500189406001894070018941200189417001894320018943400189451001894550018945600189462001894720018947600189477001895040018950600189507001895300018953800189541001895420018955500189556001896010018962100189732001897330018973400189735001897360018973700189749001897510018977100189772001898030018980600189807001898090018980D0018980E0018980F00189821001898250018982A0018982C0018983100189832001898350018983600189902001899030018990600189907001899090018990B0018990C0018990D0018990E001899110018991200189913001899140018991B0018991C0018991D0018991F001899200018993100189932001899330018993400189935001899360018993B0018993C0018993D0018993E0018A001002090710020911100209113002091160020917000209171002091720020922100209222002092530020930E0020930F0020931000209450002095290022000600220015002200160022001700220018002200190022001A0022001B0022001C0022001D002200200022002100220022002200310022004200220058002210070022100800221012002210240022102500221028002210350022103600221040002210440022104500221047002210480022104A0022104B002210500022109000221092002210960022110000221101002211030022112500221127002211280022112A0022113200221133002211340022113500221150002211530022121000221211002212120022122000221225002212300022125000221255002212570022126000221262002212650022130000221310002213300022142000221423002214360022144300221445002214500022145800221465002214700022147200221512002215130022151800221525002215260022161200221615002216180022162000221628002216400024001600240021002400240024003200240033002400340024005800240064002400650024006700240083002400850024008900240097002401100024011200240114002401150024012200240317002403200024032500240344002812300028135200281401002814040028140B0028140C00283000002830010028301000283110002850000028610000287000002870080028700A0028700F00287010002870110028701200287015002870160028701C00287022002870230028702400287027002870280028702C0028702D0028702E002891100028913200289145002894150028942200289443002895010028950200289505003210310032103400321064003210650032106700340001003400090034000A0034000B0034000D00380004003800140038004400380064003801000038010100380502003A0200003A0208003A0209003A020A003A0211003A0240003A0242003A0300003A0312003A0318003A0319003A0320003A0321003A0323003A0325003A0326003A0328003A032A003A032C003A032D004000080040000A0040000B004000260040002700400036004000390040003A0040010000400220004002600040027000400275004002810040029300400295004002960040030E00400320004003210040032400400330004003400040044000400441004005000040051300400515004005180040052000400550004005520040055500400560004005620040059A004006100040061200400620004007100040071A004008D8004008DA004008EA004009F80040100A00401011004010120040110100404004004040070040400900404015004040160040401800404019004040210040402200404025004040260040402700404028004040290040403000404031004040320040403300404034004040350040407000404071004040720040407400409092004090940040909600409098004092200040A0200040A0260040A0280040A0430040A0660040A0680040A0700040A0730040A0760040A0780040A07A0040A07C0040A0850040A0880040A0900040A1670040A1680040A1700040A1950040A2960040A3000040A3010040A3130040A3400040A3580040A3600040A3700040A3720040A3750040A3800040A3850040A3900040A4040040A5040040A5250040A7300040A7310040A7320040A7440040A8010040A8060040A8070040A8080040B0200040E0060040E0080040E0210040E0220040E0230040E0240040E0250042001300440007004400130044001900440100004401010044010300440107004401090044010A0046001400460015004600160046001800460028004600470046005000460052004600700046007100460074004600800046009700460098004601000046010100460102004601100046011100460112004601130046011600460121004601220046012300460124004601450046020700460210004602110046021500460218004602440048000800480100004801050048010800480110004801160048012000480200004802070048021A005000100050001200520016005200250052002700520029005400120054001300540016005400220054003200540052005400620054006300540072005402200054022200540300005403020054030400540306005404100054041200540414006030000062000200620003006200070062000A0062000F006200110062001200640002006400050064000F00640010006600020066001100660012006600130066002600660027006600280066002B0066002D0066002E0066002F00660030006600340066003500660101006601020066010400660108006601210066012400660130006601320066013300660134006862220068622400686225006862300068626000686265006862A0006862C0006862E0006862F00068632000686360006863A0006863A4006863A8006863AC006863B0006863E00068640000686430006864700068650000686510006865200068654500686550006865A0006865E000687003006A0002006A0008006A0009006A000A006A000B0070000100700008007000090070005A00700060007000860070008700700209007002310070023200700233007002340070028700700308007003090070030A0070030D007003110070031400700315007003180070031C0070031E0070031F007004020070040400701104007012010070120A00701301007013040070180100701803007018050070180600701901007019030070190500701A0400701A0800701B0100701B0300701B0400701B1100701B120072000C0072000E007200120072002000720022007200300072003E007200800072010200720200007202100072021400720300007204000072042200720424007204270072043000720600007207050074100200741007007410080074100E007410200074103000741040007410420074104400741046007410480074104A0074104C0074104E0074105000741210007412120074121600741220007412240074140100741405007414090074140D0074140E007600080076000C0076000E00760010007600200076003200760034007600400076006000780026007800280078002A00780070007800B0007800B40080000100800002008000030080000800800012008000130082000400820005008200070082000C00820010008200170082002100820022008200340082003500880200040004010400040204000403040005000400055004000551040005612000001E200000A2200000A4200000A8200005002000051020100500201005102010052020200110202001112020013020200140204000102040002020400500205000102050050021000500212000502120007021300010213000152130003021300040213000502130006021300080213000A0213000C02200000D3002003030020040300200503002010130020102300201033002010430020108300201093002010A3002010B3002010C3002010D3002010E300201103002011230020113300201143002011730020118300201193002011A3002011B3002011E3002011F3002012230020124300201253002012630020127300201283002012B3002012C3002013030020131300201323002013330020135300400103004005030040060300600103006001230060014300600163006001830060020300600303006003730060039300600403006004A3006004B3006004C3006004D3006004E3006004F3006008030060086300600A0300600B0300600B6300600B9300600C0300600C9300600CA300600CB300800103008002030080021300800303008004030080041300800503008006030080068300800703008008030080090300800A0300800A1300800A2300800B0300800C0300800D0300800D1300800E0300800F0300800F2300800F4300800F63008010030080110300801203008013030080140300801503008016030080171300801733008022030080240300A0010300A0040300A0048300A0070300A008C300A00B0300A00B6300A00CA300A00D1300A00E3300A00F4300A0107300A0111300A0116300A011A300A0180300A0190300A01A0300A01B4300A0206300A0210300A0230300A0260300A0280300A02B0300A02D0300A02EA300A030C300A0314300A0332300A0342300A0360300A0370300A0380300A03A0300A03A2300A03A4300A03A6300A03A8300A03AA300A03AC300A0401300A0410300A0420300A0431300A0441300A0450300A0453300A0505300A0506300A060A300A0610300A0614300A0616300A0617300A0618300A061C300A061F300A0620300A0621300A0629300A062B300A062D300A062F300A0630300A0631300A0632300A0635300A063A300A063B300A063E300A063F300A0644300A0646300A0647300A064C300A064D300A0651300A0656300A0658300A0659300A065A300A065B300A065D300A0660300A0662300A0667300A0668300A066A300A066F300A0671300A0673300A0677300A0678300A067B300A067E300A067F300A0683300A0684300A0686300A0689300A068A300A0702300A0703300A0715300A0716300A0722300A0731300A0733300A073E300A073F300A0740300A0743300A0744300A0745300A0746300A0761300A0762300A0772300A0774300A0780300A0784300A0787300A0788300A0789300A078A300A078B300A078C300A078D300A078F300A0790300A0791300A0793300A0797300A0798300A0799300A079C300A079D300A079F300A07A0300A07A1300C0002300C0004300C000A300C0020300C0040300C0042300C0050300C0055300C0060300C0080300C00B0300C00F2300C0111300C0114300C0116300C0120300C0125300C01283010000130100003301000043010000730100008301000093010000A301000113010001230100014301000163010001830100019301000213010002330100024301000253010002630100027301000283010002A3010002B3010002C3010002E3010002F301000303010003230100044301000493010004A3010004B3010004E30100055301000573010005B3010005D3010005F3010006030100062301000643010006530100067301000693010006A3010006B3010006C3010006D3010007030100071301000763010007830100079301000803010008130100082301000873010008830100089301000913010009730100098301000A04008005040080111400801174008011840100004401010014010100A4010101140101037401010384010104540101047401010644010106F40101071401010724010107640101077401010794010107B4010107D4FFE0001520092295200923054000100FFFAFFFA", SS: "00189219001894360018943700189438001894390018944000189442001895180018951900281041002861200028950300460135005200300072003C0072007E300A0306", ST: "000800810008009200080114000801150008011600082111000822560008225800120051001400230014002400140025001400280014004200140044001400450014010500141010001410400014201800142206001422220014302200144054001440560014405C001440720014409B0018003A0018908000189185001893730018A0030028135100286190003A0329003A032B00400280004003100040055300400556004011020040A16A0040A2240040A2970040A33A0040A3530040A9920040E0010042001000440001004801070050002100620006006862800068634500700006007002080070030F0072006E0074100600780010008809062010001020100150300200043002012030060006300600283006008830080012300800663008007430080202300A0004300A000E300A00C3300A00DD300A0196300A01A6300A01B2300A01BA300A01D0300A0402300A0422300A0676300A067D300A0730300A0734300A0735300A0742300A07833010000F3010001730100037301000433010005C4008010B400803004008400040101078", SV: "00720082", TM: "000800130008003000080031000800320008003300080034000800350010003200140103001430770014407C00180027001800350018101400181042001810430018107200181073001812010018700E002034050032003300320035003210010032101100321041003210510038001B0038001D003800210038003200400003004000050040024500400251004020050040A0240040A1120040A1220040A193007000830072006B210000503006000930080025300801643008016830080251300A0007300A022E300E000530100085400801014008010940080113", UC: "000801190008030C0008030D0010021200100222001600080016000C0018936700189371001899080018990A0072006F3010001B", UI: "0000000200000003000010000000100100020002000200030002001000020012000200320002003300020100000414320004151000041511000415120004151A00080014000800160008001700080018000800190008001A0008001B00080058000800620008010C0008010D00080117000801180008040E00081150000811550008115A000811670008119500083002000830100008301200089123001810020018100B001820420018991E0020000D0020000E0020005200200200002002420020916100209164002093120020931300280304002811990028121400340003003A031000400554004040230040A0210040A0220040A1240040A1710040A1720040A4020040DB0C0040DB0D0040E0110040E0300040E0310044010200440108006200210064000300687004006A00030070031A0070031B007011010070110200701209007019040072007F0088014004000010040001000400051030060024300600C2300A0013300A0054300A0083300A0609300A0650300A0675300A0700300A0785301000063010000B30100013301000153010001F301000313010003B30100052301000533010006E3010006F", UL: "0000000000000001000200000002003700041200000412020004140000041420000415040004160000080001000803090008030B0008042700081161000811620018106E0018163700186016001860180018601A0018601C0018601E0018603000186032001860380018603A0018603C0018603E001860400018604200186046001860480018604A0018605000186052001860560018605800189095001891270018915900189234001892580018925F00209057002091280020915700209228002215300022164200221658002890010028900200340004003A00100040A1320040A1630040A8020040A8030040A8040040A8050040DB73004200150048000600480007004803020048030300603020006400070066000100660003006600150066001E0066002A0066002C00660105006A000C0070022600700255007002950070150C0072007800741054007413240082000630100092", UR: "0002002600020027000200280008010E000801200008040700080408000804090008040B0008119000287FE0004040730040E01000687005007200710074100A", US: "00000100000001100000012000000700000008000000085000000860000009000000090300001002000010080000102000001021000010220000102300001031000051B00004121200041410000800400008030100080304000803060008030800080414000811960008119700100028001021C000144012001451000016001100160012001600130016001400160015001600160016001A0016002700160028001600390016003A0016003B001600410016004200160043001600460016004700160048001600490016004A0016004C001600750018106C00181244001813100018140400181622001816230018162400186012001860140018602400186026001860440018604C0018604E00186070001890580018906600189093001892310018923200189240001892410018925300189337001893660018936B001893700018937600189377001893780018937A00189441001897290018973900189740001899150018992100189938001899390018993A0020915600209162002091630020951800209536002200010022000200220003002200040024003500240036002400380024004200240048002400500024005600240060002800020028000300280005002800060028001000280011002800120028001400280068002800690028007000280080002800810028008200280091002800920028009300280094002801000028010100280102002801030028020000280402002807100028072000280722002807300028074000281104002814030028140700286010002860200028603000286040002861020028611000286112002870010028700200287003002870090028700B0028700E002870170028701B00289099002894160028950600289507003A0005003A021A003A0231003A0241003A0244004003000040030100400302004003030040A0B00040A1360040A18000480013004800150048020100480202005200120052003600520038005400100054001100540020005400210054003000540031005400330054005000540051005400530054006000540061005400700054007100540080005400810054009000540100005401010054021100540308005413300060300200603008006200040062000B0062000C0062000D0062000E0066001F006862D0006863100068633000686350006863C0006863F0006864100068644000686530007000200070002100700042007000500070005100700066007000670070024100700247007002510070025200700401007011030070120300701205007012070070120C00701309007018040070180700701B02007200140072002800720032007200380072007A0072010000720104007201060072010A0072010C0072010E007202020072020400720212007202160072021800720302007203060072030800720314007203180072032000720420007204210072043200760055007600700076008000760090007600A0007600B0007600C00078002E007800B6007800B8008000060080000704000005200000A0200000A120100120201001302010015E20100160202000102030001020400011204000742200000B300201163002011C3002011D300600B73008006730080172300A0443300A0600300A0601300A0602300A0603300A0604300A0605300A0606300A0607300A060B300A060C300A060E300A0622300A0636300A0641300A0648300A0655300A0657300A065E300A065F300A0661300A0670300A0672300A0674300A0685300A0687300A0704300A0705300A073B300A0773300A0782300A0786300A0795300A0796300C0117300C0118300C01193010000D301000203010002230100029301000393010003A3010003C3010003D3010003E3010003F301000403010004130100042301000583010005E301000663010007D3010007E40101010401010334010103454001004", UT: "0008030E0008030F001002180016000300160017001600200016004D0016004F00160050001600510016007800160082001810090018937B0018937F001899010018990F00189910001899170018991A001899230018992400189941003210660040003100400032004006020040A160004401060062002000660107006A000600720070008200030082000A0082003300820037220000023010000C3010005A301000613010007A3010007B3010007F", UV: "0008040C0008040D0008042800080429007200837FE00003" }, masks: { "002031xx": "CS", "002804x0": "US", "002804x1": "US", "002804x2": "LO", "002804x3": "AT", "002808x0": "CS", "002808x2": "US", "002808x3": "AT", "002808x4": "US", "002808x8": "AT", "1000xxx0": "US", "1000xxx1": "US", "1000xxx2": "US", "1000xxx3": "US", "1000xxx4": "US", "1000xxx5": "US", "1010xxxx": "US", "50xx0005": "US", "50xx0010": "US", "50xx0020": "CS", "50xx0022": "LO", "50xx0030": "SH", "50xx0040": "SH", "50xx0103": "US", "50xx0104": "US", "50xx0105": "US", "50xx0106": "SH", "50xx0110": "US", "50xx0112": "US", "50xx0114": "US", "50xx1001": "CS", "50xx2000": "US", "50xx2002": "US", "50xx2004": "US", "50xx2006": "UL", "50xx2008": "UL", "50xx200A": "UL", "50xx200E": "LT", "50xx2500": "LO", "50xx2600": "SQ", "50xx2610": "US", "60xx0010": "US", "60xx0011": "US", "60xx0012": "US", "60xx0015": "IS", "60xx0022": "LO", "60xx0040": "CS", "60xx0045": "LO", "60xx0050": "SS", "60xx0051": "US", "60xx0052": "US", "60xx0060": "CS", "60xx0061": "SH", "60xx0062": "SH", "60xx0063": "CS", "60xx0066": "AT", "60xx0068": "US", "60xx0069": "US", "60xx0100": "US", "60xx0102": "US", "60xx0110": "CS", "60xx0200": "US", "60xx0800": "CS", "60xx0802": "US", "60xx0803": "AT", "60xx0804": "US", "60xx1001": "CS", "60xx1100": "US", "60xx1101": "US", "60xx1102": "US", "60xx1103": "US", "60xx1200": "US", "60xx1201": "US", "60xx1202": "US", "60xx1203": "US", "60xx1301": "IS", "60xx1302": "DS", "60xx1303": "DS", "60xx1500": "LO", "60xx4000": "LT", "7Fxx0011": "US", "7Fxx0020": "OW", "7Fxx0030": "OW", "7Fxx0040": "OW" } };

  // src/virtualize/dicom/source.ts
  var MULTI = /* @__PURE__ */ new Set(["AE", "AS", "CS", "DA", "DS", "DT", "IS", "LO", "PN", "SH", "TM", "UC", "UI"]);
  var TEXT = /* @__PURE__ */ new Set([...MULTI, "LT", "ST", "UT", "UR"]);
  var LEADING = /* @__PURE__ */ new Set(["AE", "AS", "CS", "DA", "DS", "DT", "IS", "LO", "PN", "SH", "TM", "UI"]);
  var NUMBERS = {
    FL: [4, (v, at, le3) => v.getFloat32(at, le3)],
    FD: [8, (v, at, le3) => v.getFloat64(at, le3)],
    SL: [4, (v, at, le3) => v.getInt32(at, le3)],
    SS: [2, (v, at, le3) => v.getInt16(at, le3)],
    UL: [4, (v, at, le3) => v.getUint32(at, le3)],
    US: [2, (v, at, le3) => v.getUint16(at, le3)],
    SV: [8, (v, at, le3) => v.getBigInt64(at, le3)],
    UV: [8, (v, at, le3) => v.getBigUint64(at, le3)]
  };
  var DECIMAL = /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?$/;
  var INTEGER = /^[+-]?[0-9]+$/;
  var PN_GROUPS = ["Alphabetic", "Ideographic", "Phonetic"];
  var CHARSET = 524293;
  var MULTIBYTE = /* @__PURE__ */ new Set(["GB18030", "GBK", "ISO 2022 IR 58", "ISO 2022 IR 87", "ISO 2022 IR 149", "ISO 2022 IR 159"]);
  var CHARSET_SPLIT = /* @__PURE__ */ new Set(["LO", "PN", "SH", "UC"]);
  var TAGS = {};
  for (const [vr, s] of Object.entries(dictionary_default.tags)) {
    for (let i = 0; i < s.length; i += 8) TAGS[s.slice(i, i + 8)] = vr;
  }
  var MASKS = Object.entries(dictionary_default.masks);
  function dictionaryVr(tag) {
    const group2 = Math.floor(tag / 65536);
    const element2 = tag % 65536;
    if (group2 & 1) return element2 >= 16 && element2 <= 255 ? "LO" : void 0;
    const k = tag.toString(16).toUpperCase().padStart(8, "0");
    if (k in TAGS) return TAGS[k];
    for (const [mask, vr] of MASKS) {
      if ([...mask].every((m, i) => m === "x" || m === k[i])) return vr;
    }
    return void 0;
  }
  var key = (tag) => tag.toString(16).toUpperCase().padStart(8, "0");
  var sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  function isMultibyte(value2) {
    return latin1(value2).split("\\").some((v) => MULTIBYTE.has(v.replace(/^[ \0]+|[ \0]+$/g, "")));
  }
  var DECIMAL_PARTS = /^([+-]?)([0-9]*)(?:\.([0-9]*))?(?:[eE]([+-]?)([0-9]+))?$/;
  var MAX_EXPONENT_DIGITS = 5;
  var MAX_INTEGER_DIGITS = 16;
  function decimalKey(t) {
    const m = DECIMAL_PARTS.exec(t);
    const frac = m[3] ?? "";
    const digits = (m[2] + frac).replace(/^0+/, "");
    if (digits === "") return "0";
    const exponentDigits = (m[5] ?? "").replace(/^0+/, "");
    if (exponentDigits.length > MAX_EXPONENT_DIGITS) return void 0;
    const stripped = digits.replace(/0+$/, "");
    const exponent = (m[4] === "-" ? -1 : 1) * Number(exponentDigits || "0") - frac.length + digits.length - stripped.length;
    return `${m[1] === "-" ? "-" : ""}${stripped}e${exponent}`;
  }
  function dsNumber(t) {
    if (!DECIMAL.test(t)) return void 0;
    const k = decimalKey(t);
    if (k === void 0) return void 0;
    const v = Number(t);
    if (!Number.isFinite(v) || k !== decimalKey(String(v))) return void 0;
    return v;
  }
  function isNumber(t) {
    const negative = t[0] === "-";
    const digits = t.replace(/^[+-]/, "").replace(/^0+/, "");
    if (digits.length > MAX_INTEGER_DIGITS) return (negative ? "-" : "") + digits;
    return jsonNumber(BigInt(negative ? `-${digits || "0"}` : digits || "0"));
  }
  var INT64 = 2n ** 63n;
  function typedValues(vr, data) {
    const parts = [];
    let from = 0;
    for (let i = 0; i <= data.length; i++) {
      if (i === data.length || data[i] === 92) {
        parts.push(data.subarray(from, i));
        from = i + 1;
      }
    }
    const out2 = new Uint8Array(8 * parts.length);
    const view5 = new DataView(out2.buffer);
    for (const [k, b] of parts.entries()) {
      let s = 0;
      let e = b.length;
      while (e > s && (b[e - 1] === 32 || b[e - 1] === 0)) e--;
      while (s < e && b[s] === 32) s++;
      if (b.subarray(s, e).some((c) => c >= 128)) return void 0;
      const t = latin1(b.subarray(s, e));
      if (vr === "DS") {
        const v = dsNumber(t);
        if (v === void 0) return void 0;
        view5.setFloat64(8 * k, v, true);
      } else {
        if (!INTEGER.test(t) || t.replace(/^[+-]/, "").replace(/^0+/, "").length > 19) return void 0;
        const v = BigInt(t);
        if (v < -INT64 || v >= INT64) return void 0;
        view5.setBigInt64(8 * k, v, true);
      }
    }
    return [vr === "DS" ? "float64" : "int64", out2];
  }
  function textValue(vr, b) {
    let s = 0;
    let e = b.length;
    while (e > s && (b[e - 1] === 32 || b[e - 1] === 0)) e--;
    if (LEADING.has(vr)) while (s < e && b[s] === 32) s++;
    if (s === e) return null;
    const t = textJson(b.subarray(s, e));
    if (typeof t !== "string") return t;
    if (vr === "PN") {
      const parts = [];
      let rest = t;
      for (let i = 0; i < 2; i++) {
        const at = rest.indexOf("=");
        if (at < 0) break;
        parts.push(rest.slice(0, at));
        rest = rest.slice(at + 1);
      }
      parts.push(rest);
      const groups = Object.fromEntries(parts.map((g, i) => [PN_GROUPS[i], g]).filter(([, g]) => g));
      return Object.keys(groups).length ? groups : null;
    }
    if (vr === "DS") return dsNumber(t) ?? t;
    if (vr === "IS" && INTEGER.test(t)) return isNumber(t);
    return t;
  }
  var valueSize = (vr) => vr === "AT" ? 4 : NUMBERS[vr]?.[0];
  function valueJson(vr, data, little, multibyte = false) {
    if (data.length === 0) return { vr };
    const view5 = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (TEXT.has(vr)) {
      if (multibyte && CHARSET_SPLIT.has(vr)) return { vr, InlineBinary: base64(data) };
      const parts = [];
      if (MULTI.has(vr)) {
        let from = 0;
        for (let i = 0; i <= data.length; i++) {
          if (i === data.length || data[i] === 92) {
            parts.push(data.subarray(from, i));
            from = i + 1;
          }
        }
      } else parts.push(data);
      return { vr, Value: parts.map((p) => textValue(vr, p)) };
    }
    const size2 = valueSize(vr);
    if (size2 !== void 0 && data.length % size2) return { vr, InlineBinary: base64(data) };
    if (vr === "AT") {
      const out2 = [];
      const h = (v) => v.toString(16).toUpperCase().padStart(4, "0");
      for (let at = 0; at < data.length; at += 4) out2.push(h(view5.getUint16(at, little)) + h(view5.getUint16(at + 2, little)));
      return { vr, Value: out2 };
    }
    const num2 = NUMBERS[vr];
    if (num2 !== void 0) {
      const [n, get3] = num2;
      const out2 = [];
      for (let at = 0; at < data.length; at += n) out2.push(jsonNumber(get3(view5, at, little)));
      return { vr, Value: out2 };
    }
    return { vr, InlineBinary: base64(data) };
  }
  var utf83 = new TextEncoder();
  var jsonSize = (v) => utf83.encode(JSON.stringify(v)).length;
  var BINARY = {
    OB: ["uint8", 1],
    UN: ["uint8", 1],
    OW: ["uint16", 2],
    OF: ["float32", 4],
    OD: ["float64", 8],
    OL: ["uint32", 4],
    OV: ["uint64", 8]
  };
  var NUMERIC_TYPES = {
    FL: "float32",
    FD: "float64",
    SL: "int32",
    SS: "int16",
    UL: "uint32",
    US: "uint16",
    SV: "int64",
    UV: "uint64"
  };
  var INLINE = 64;
  var MAX_TEXT = 2 ** 16;
  var MAX_MEMBER = 2 ** 14;
  var MAX_ROOT = 2 ** 16;
  var PADDING = 4294770684;
  var EOT_TAGS = /* @__PURE__ */ new Set([2145386497, 2145386498]);
  var MAX_CHUNK2 = 2 ** 24;
  var ITEM_SIZES = {
    uint8: 1,
    int16: 2,
    uint16: 2,
    int32: 4,
    uint32: 4,
    float32: 4,
    float64: 8,
    int64: 8,
    uint64: 8
  };
  var PER_FRAME = "52009230";
  var GATHER_ITEMS = 64;
  var ITEMS = "items";
  var GATHERED = "value";
  var STRUCTURE = "structure";
  var MAX_PATHS = 1024;
  var MAX_STRUCTURES = 2 ** 16;
  var MAX_COST = 16;
  var AS_BYTES = ["InlineBinary", "BulkDataURI", "Gathered"];
  var dimension = (dataType3) => dataType3 === "uint8" ? "byte" : "value";
  var GroupLengths = class {
    // group, key, value, where the run starts, and the value's gathered extent
    open;
    closed = [];
    // key, value, the run's length, extent
    /** An element of tag `tag` starts at `pos`. */
    step(tag, pos) {
      if (this.open !== void 0 && Math.floor(tag / 65536) !== this.open[0]) this.close(pos);
    }
    close(pos) {
      if (this.open === void 0) return;
      const [, k, value2, start, extent2] = this.open;
      this.closed.push([k, value2, pos - start, extent2]);
      this.open = void 0;
    }
    /** After the first element of its tag in the dataset, a group length (`extent`: its
     * value, when gathered). */
    async begin(el, enc, read, extent2) {
      const group2 = Math.floor(el.tag / 65536);
      let value2;
      if (group2 % 2 === 0 && el.length === 4 && (!enc.explicit || el.vr === "UL")) {
        const b = await read(el.value, 4);
        value2 = new DataView(b.buffer, b.byteOffset, 4).getUint32(0, el.little);
      }
      this.open = [group2, key(el.tag), value2, el.value + el.length, extent2];
    }
    /** The dataset's elements end at `pos`: drops the group lengths that are layout. */
    finish(pos, out2) {
      this.close(pos);
      const duplicated = new Set((out2.duplicates ?? []).flatMap((d) => Object.keys(d)));
      for (const [k, value2, length2, extent2] of this.closed) {
        if (value2 !== void 0 && value2 === length2 && !duplicated.has(k)) {
          delete out2[k];
          if (extent2 !== void 0) extent2.dropped = true;
        }
      }
    }
  };
  var Translator = class {
    arrays = [];
    // the families of encapsulated pixel data in items
    extents = [];
    // every other array
    // The top-level dataset, and the tags of the offset tables omitted from it as
    // layout: a later element of such a tag is a duplicate.
    top;
    omitted = /* @__PURE__ */ new Set();
    // The path of the gathered sequence whose items are being walked.
    within;
    read;
    walker;
    constructor(read, size2) {
      this.read = read;
      this.walker = new Walker(read, size2);
    }
    mark() {
      return [this.arrays.length, this.extents.length];
    }
    rollback([a, e]) {
      this.arrays.length = a;
      this.extents.length = e;
    }
    array(vr, path2, offset, n, dataType3 = "uint8", size2 = 1, little = true) {
      const attribute = { vr, BulkDataURI: `${SOURCE_NODE}/${path2}` };
      this.extents.push({ path: path2, attribute, offset, n, dataType: dataType3, size: size2, little });
      return attribute;
    }
    /** A value of an item of a gathered sequence, gathered with the others of its path
     * (spec/virtualize/dicom.md §5). */
    async gather(vr, el, path2) {
      const inner = path2.slice(this.within.length + 1);
      const slash = inner.indexOf("/");
      const n = el.length;
      let [dataType3, size2] = Object.hasOwn(BINARY, vr) ? BINARY[vr] : Object.hasOwn(NUMERIC_TYPES, vr) ? [NUMERIC_TYPES[vr], valueSize(vr)] : ["uint8", 1];
      if (n % size2) [dataType3, size2] = ["uint8", 1];
      const values2 = (vr === "DS" || vr === "IS") && n <= MAX_TEXT ? typedValues(vr, await this.read(el.value, n)) : void 0;
      this.extents.push({
        path: path2,
        attribute: {},
        offset: el.value,
        n,
        dataType: dataType3,
        size: size2,
        little: el.little || dataType3 === "uint8",
        values: values2,
        item: Number(inner.slice(0, slash)),
        rest: inner.slice(slash + 1)
      });
      return { vr, Gathered: true };
    }
    /** An element of defined length with VR `vr`: not a sequence, or the bytes of one
     * that breaks a rule (`SQ`). */
    async member(vr, el, path2, multibyte) {
      const n = el.length;
      if (n === 0) return { vr };
      if (this.within !== void 0) return this.gather(vr, el, path2);
      const size2 = valueSize(vr);
      if (Object.hasOwn(BINARY, vr) || vr === "SQ" || size2 !== void 0 && n % size2) {
        if (n <= INLINE) return { vr, InlineBinary: base64(await this.read(el.value, n)) };
        let [dataType3, s] = BINARY[vr] ?? ["uint8", 1];
        if (n % s) [dataType3, s] = ["uint8", 1];
        return this.array(vr, path2, el.value, n, dataType3, s, el.little);
      }
      if (Object.hasOwn(NUMERIC_TYPES, vr) && Math.floor(n / size2) > INLINE) {
        return this.array(vr, path2, el.value, n, NUMERIC_TYPES[vr], size2, el.little);
      }
      if (TEXT.has(vr) && n > MAX_TEXT) return this.array(vr, path2, el.value, n);
      const data = await this.read(el.value, n);
      if (vr === "DS" || vr === "IS") {
        let values2 = 1;
        for (const b of data) if (b === 92) values2++;
        if (values2 > INLINE) return this.array(vr, path2, el.value, n);
      }
      return valueJson(vr, data, el.little, multibyte);
    }
    /** A sequence of defined length; if it breaks a rule, its bytes. */
    async sequenceOrBytes(ifBytes, el, enc, end, depth2, path2, multibyte) {
      const mark = this.mark();
      try {
        const [attribute] = await this.items(el, el.value + el.length, end, enc, depth2, path2, multibyte, ifBytes);
        return attribute;
      } catch (e) {
        if (!(e instanceof DicomError)) throw e;
        this.rollback(mark);
        return this.member(ifBytes, el, path2, multibyte);
      }
    }
    /** An element of defined length. */
    async defined(el, enc, end, depth2, path2, multibyte) {
      if (!enc.explicit || el.vr === "UN") {
        if (el.vr === "UN") el = { ...el, little: true };
        const vr = dictionaryVr(el.tag) ?? "UN";
        return vr === "SQ" ? this.sequenceOrBytes("UN", el, enc.explicit ? IMPLICIT_LE : enc, end, depth2, path2, multibyte) : this.member(vr, el, path2, multibyte);
      }
      if (el.vr === "SQ") return this.sequenceOrBytes("SQ", el, enc, end, depth2, path2, multibyte);
      return this.member(el.vr, el, path2, multibyte);
    }
    /** Translates the element `el` of the dataset `out`, at path `base` and within
     * `end`, into it, and returns where the next element starts. An element with a tag
     * already in `out` goes to its `duplicates`. */
    async element(el, enc, out2, end, depth2, base, multibyte) {
      const k = key(el.tag);
      const duplicates = out2.duplicates ?? [];
      const duplicate = k in out2 || out2 === this.top && this.omitted.has(k);
      const path2 = duplicate ? `${base}/duplicates/${duplicates.length}/${k}` : `${base}/${k}`;
      let pos;
      let attribute;
      if (el.length === UNDEFINED) {
        if (enc.explicit && el.vr !== "SQ" && el.vr !== "UN" && !(el.tag === PIXEL_DATA && (el.vr === "OB" || el.vr === "OW"))) {
          throw new DicomError(`undefined length with VR ${el.vr}`);
        }
        if (el.tag === PIXEL_DATA) {
          let fragments;
          [fragments, pos] = await this.walker.fragments(el.value, end, enc.little);
          attribute = { vr: el.vr ?? "OB" };
          if (fragments.length > 0) {
            const members = fragments.map(([, o, n], i) => [i, o, n]);
            this.arrays.push(...await familyPlans(path2, members, this.read));
            attribute.BulkDataURI = `${SOURCE_NODE}/${path2}`;
          }
        } else {
          const inner = el.vr === "UN" ? IMPLICIT_LE : enc;
          [attribute, pos] = await this.items(
            el,
            null,
            end,
            inner,
            depth2,
            path2,
            multibyte,
            enc.explicit && el.vr === "SQ" ? "SQ" : "UN"
          );
        }
      } else {
        if (el.value + el.length > end) throw new DicomError(`the element at ${el.value} runs past its container`);
        pos = el.value + el.length;
        if (el.tag === PADDING) return pos;
        attribute = await this.defined(el, enc, end, depth2, path2, multibyte);
      }
      if (enc.explicit && !enc.little && el.vr === "UN" && AS_BYTES.some((k2) => k2 in attribute)) {
        attribute.LittleEndian = true;
      }
      if (duplicate) {
        duplicates.push({ [k]: attribute });
        out2.duplicates = duplicates;
      } else {
        out2[k] = attribute;
      }
      return pos;
    }
    /** `element`, for the element at `pos`, keeping track of the dataset's group lengths. */
    async translate(el, enc, out2, end, depth2, base, multibyte, pos, groups) {
      groups.step(el.tag, pos);
      const first = !(key(el.tag) in out2);
      const planned = this.extents.length;
      const after = await this.element(el, enc, out2, end, depth2, base, multibyte);
      if (el.tag % 65536 === 0 && el.length !== UNDEFINED && first && key(el.tag) in out2) {
        await groups.begin(el, enc, this.read, this.extents.length > planned ? this.extents[this.extents.length - 1] : void 0);
      }
      return after;
    }
    async meta(start) {
      const out2 = {};
      const groups = new GroupLengths();
      let pos = 132;
      while (pos < start) {
        const el = await this.walker.header(pos, start, EXPLICIT_LE);
        pos = await this.translate(el, EXPLICIT_LE, out2, start, 0, "meta", false, pos, groups);
      }
      groups.finish(pos, out2);
      return sorted(out2);
    }
    /** An item's dataset, under the character set of the dataset that holds it
     * (`multibyte`) unless its own Specific Character Set says otherwise. */
    async dataset(pos, end, defined, enc, depth2, base, multibyte = false) {
      const out2 = {};
      const groups = new GroupLengths();
      let charset = false;
      for (; ; ) {
        if (defined && pos === end) {
          groups.finish(pos, out2);
          return [sorted(out2), pos];
        }
        const el = await this.walker.header(pos, end, enc);
        if (Math.floor(el.tag / 65536) === 65534) {
          if (el.tag === ITEM_END && !defined && el.length === 0) {
            groups.finish(pos, out2);
            return [sorted(out2), el.value];
          }
          throw new DicomError(`unexpected item tag at ${pos}`);
        }
        pos = await this.translate(el, enc, out2, end, depth2, base, multibyte, pos, groups);
        if (el.tag === CHARSET && el.length !== UNDEFINED && !charset) {
          charset = true;
          multibyte = isMultibyte(await this.read(el.value, el.length));
        }
      }
    }
    /** A sequence's attribute, and where it ends: its items, or, gathered (the top-level
     * Per-frame Functional Groups Sequence, or one of more than 64 items outside a
     * gathered item), its structures, unless it is past the bounds of one, when it keeps
     * its bytes (`ifBytes`). */
    async items(el, end, limit, enc, depth2, path2, multibyte, ifBytes) {
      if (this.within !== void 0) {
        const [items2, pos2] = await this.sequence(el.value, end, limit, enc, depth2, path2, multibyte);
        return [{ vr: "SQ", Value: items2 }, pos2];
      }
      const mark = this.mark();
      if (path2 !== `dataset/${PER_FRAME}`) {
        const [some, pos2] = await this.sequence(el.value, end, limit, enc, depth2, path2, multibyte, GATHER_ITEMS);
        if (some !== void 0) return [{ vr: "SQ", Value: some }, pos2];
        this.rollback(mark);
      }
      this.within = path2;
      let items;
      let pos;
      try {
        [items, pos] = await this.sequence(el.value, end, limit, enc, depth2, path2, multibyte);
      } finally {
        this.within = void 0;
      }
      const length2 = (end ?? pos - 8) - el.value;
      const attribute = await this.gathered(path2, items, mark, length2);
      if (attribute === void 0) {
        this.rollback(mark);
        return [await this.member(ifBytes, { ...el, length: length2 }, path2, multibyte), pos];
      }
      return [attribute, pos];
    }
    /** The attribute of the gathered sequence at `path`, whose `length` bytes hold
     * `items`, with its arrays planned; or undefined when it is past the bounds
     * (spec/virtualize/dicom.md §5, Bounds). */
    async gathered(path2, items, mark, length2) {
      const count = items.length;
      const columns = /* @__PURE__ */ new Map();
      for (const e of this.extents.slice(mark[1])) {
        if (e.dropped) continue;
        if (!columns.has(e.rest)) columns.set(e.rest, []);
        columns.get(e.rest).push([e.item, e]);
      }
      const structures = [];
      const index2 = /* @__PURE__ */ new Map();
      const each = new Uint8Array(4 * count);
      const view5 = new DataView(each.buffer);
      for (const [i, item] of items.entries()) {
        const k = JSON.stringify(item);
        if (!index2.has(k)) {
          index2.set(k, structures.length);
          structures.push(item);
        }
        view5.setInt32(4 * i, index2.get(k), true);
      }
      let cost = 0;
      for (const members of columns.values()) cost += gatheredCost(members, count);
      if (columns.size > MAX_PATHS || jsonSize(structures) > MAX_STRUCTURES || cost > MAX_COST * length2) return void 0;
      this.extents.length = mark[1];
      for (const [rest, members] of columns) {
        this.arrays.push(...await gatheredPlans(`${path2}/${ITEMS}/${rest}/${GATHERED}`, members, count, this.read));
      }
      if (count === 0) return { vr: "SQ", Value: [] };
      this.arrays.push(await copiedPlan(`${path2}/${ITEMS}/${STRUCTURE}`, "int32", [count], ["index"], each, 4));
      return { vr: "SQ", Structures: structures };
    }
    /** A sequence's items, and where it ends; with `most`, undefined at the item after
     * the first `most`. */
    async sequence(pos, end, limit, enc, depth2, base, multibyte, most) {
      const container = end ?? limit;
      const items = [];
      for (; ; ) {
        if (end !== null && pos === end) return [items, pos];
        const el = await this.walker.header(pos, container, enc);
        if (end === null && el.tag === SEQUENCE_END && el.length === 0) return [items, el.value];
        if (el.tag !== ITEM || depth2 + 1 > MAX_DEPTH) throw new DicomError(`expected an item at ${pos}`);
        if (most !== void 0 && items.length === most) return [void 0, pos];
        const path2 = `${base}/${items.length}`;
        let ds;
        if (el.length === UNDEFINED) {
          [ds, pos] = await this.dataset(el.value, container, false, enc, depth2 + 1, path2, multibyte);
        } else {
          if (el.value + el.length > container) throw new DicomError(`the item at ${pos} runs past its container`);
          [ds] = await this.dataset(el.value, el.value + el.length, true, enc, depth2 + 1, path2, multibyte);
          pos = el.value + el.length;
        }
        items.push(ds);
      }
    }
    /** The arrays. */
    plans() {
      const plans = [...this.arrays];
      for (const e of this.extents) {
        const [rows, chunks] = rowChunks(e.offset, e.n / e.size, e.size);
        plans.push({
          path: e.path,
          dataType: e.dataType,
          shape: [e.n / e.size],
          chunkShape: [rows],
          dims: [dimension(e.dataType)],
          chunks,
          endian: e.little ? "little" : "big"
        });
      }
      return plans;
    }
  };
  function gatheredKind(members) {
    const kind = (e) => e.values !== void 0 ? [e.values[0], e.values[1].length, true] : [e.dataType, e.n, e.little];
    const [dataType3, n, little] = kind(members[0][1]);
    if (members.every(([, e]) => {
      const k = kind(e);
      return k[0] === dataType3 && k[1] === n && k[2] === little;
    }) && n <= MAX_CHUNK2) return [dataType3, n, little];
    const length2 = members[0][1].n;
    if (members.every(([, e]) => e.n === length2) && length2 <= MAX_CHUNK2) return ["uint8", length2, true];
    return void 0;
  }
  function gatheredCost(members, count) {
    const kind = gatheredKind(members);
    if (kind === void 0) return 8 * (count + 1) + members.reduce((a, [, e]) => a + e.n, 0);
    return (2 * members.length < count ? members.length : count) * kind[1];
  }
  async function gatheredPlans(path2, members, count, read) {
    const kind = gatheredKind(members);
    if (kind !== void 0) {
      const [dataType3, n, little] = kind;
      const rows = new Map(members.map(([i, e]) => [i, e.values !== void 0 && dataType3 !== "uint8" ? e.values[1] : [e.offset, e.n]]));
      const size2 = ITEM_SIZES[dataType3];
      return [await gatheredRows(path2, dataType3, size2, count, n / size2, rows, little, read)];
    }
    return familyPlans(path2, members.map(([i, e]) => [i, e.offset, e.n]), read, count, true);
  }
  var concat = (parts) => {
    const out2 = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) {
      out2.set(p, at);
      at += p.length;
    }
    return out2;
  };
  async function gatheredRows(path2, dataType3, size2, count, m, rows, little, read) {
    const row = m * size2;
    const dims = ["index", dimension(dataType3)];
    const endian = little ? "little" : "big";
    const ordered = [...rows].sort(([a], [b]) => a - b);
    const first = ordered[0][1];
    if (ordered.length === count && !(first instanceof Uint8Array) && ordered.every(([, r], j) => !(r instanceof Uint8Array) && r[0] === first[0] + j * row)) {
      const [chunkShape, chunks2] = await gridChunks(first[0], [count, m], size2, read);
      return { path: path2, dataType: dataType3, shape: [count, m], chunkShape, dims, chunks: chunks2, endian };
    }
    const k = Math.ceil(count / Math.max(1, Math.floor(MAX_PAYLOAD2 / Math.max(16, row + 8))));
    const c = 2 * rows.size >= count ? Math.ceil(count / k) : 1;
    const chunks = /* @__PURE__ */ new Map();
    for (const q of [...new Set([...rows.keys()].map((i) => Math.floor(i / c)))].sort((a, b) => a - b)) {
      const parts = [];
      for (let i = q * c; i < (q + 1) * c; i++) {
        const r = rows.get(i) ?? new Uint8Array(row);
        const last = parts[parts.length - 1];
        if (!(r instanceof Uint8Array)) {
          const [o, n] = r;
          if (last !== void 0 && "range" in last && last.range[0] + last.range[1] === o) {
            last.range[1] += n;
          } else {
            parts.push({ range: [o, n] });
          }
        } else if (last !== void 0 && "bytes" in last) {
          last.bytes.push(r);
        } else {
          parts.push({ bytes: [r] });
        }
      }
      const ranges = parts.map((p) => "range" in p ? p.range : concat(p.bytes));
      if (payloadSize(ranges) > MAX_PAYLOAD2) {
        chunks.set(`${q}/0`, concat(await Promise.all(ranges.map((r) => r instanceof Uint8Array ? r : read(r[0], r[1])))));
      } else {
        chunks.set(`${q}/0`, ranges);
      }
    }
    return { path: path2, dataType: dataType3, shape: [count, m], chunkShape: [c, m], dims, chunks, endian };
  }
  async function copiedPlan(path2, dataType3, shape, dims, packed, item) {
    const [chunkShape, cut] = await gridChunks(0, shape, item, async (o, n) => packed.slice(o, o + n));
    const chunks = /* @__PURE__ */ new Map();
    for (const [k, v] of cut) {
      chunks.set(k, v instanceof Uint8Array ? v : concat(v.map((r) => r instanceof Uint8Array ? r : packed.subarray(r[0], r[0] + r[1]))));
    }
    return { path: path2, dataType: dataType3, shape, chunkShape, dims, chunks };
  }
  var objectSize = (sizes) => 2 + Math.max(sizes.size - 1, 0) + [...sizes].reduce((a, [k, n]) => a + jsonSize(k) + 1 + n, 0);
  function moveLarge(root, node) {
    const sizes = {};
    for (const [name, members] of Object.entries(root)) {
      sizes[name] = /* @__PURE__ */ new Map();
      for (const k of Object.keys(members)) {
        const n = jsonSize(members[k]);
        if (n > MAX_MEMBER) {
          (node[name] ??= {})[k] = members[k];
          delete members[k];
        } else {
          sizes[name].set(k, n);
        }
      }
    }
    const order = Object.keys(root);
    let total = Object.values(sizes).reduce((a, s) => a + objectSize(s), 0);
    const largest = Object.entries(sizes).flatMap(([name, s]) => [...s].map(([k, n]) => ({ name, k, n }))).sort((a, b) => b.n - a.n || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0) || order.indexOf(a.name) - order.indexOf(b.name));
    for (const { name, k, n } of largest) {
      if (total <= MAX_ROOT) break;
      const left = sizes[name];
      total -= jsonSize(k) + 1 + n + (left.size > 1 ? 1 : 0);
      left.delete(k);
      (node[name] ??= {})[k] = root[name][k];
      delete root[name][k];
    }
  }
  async function sourceMetadata(read, size2, start, encoding, pixelEnd, pixelExtra, unreferenced, eotLayout = false, fragments, offsetTable = false) {
    const t = new Translator(read, size2);
    const root = {};
    const preamble = await read(0, 128);
    if (preamble.some((b) => b !== 0)) root.preamble = base64(preamble);
    const meta = await t.meta(start);
    const dataset2 = {};
    t.top = dataset2;
    const groups = new GroupLengths();
    const seen = /* @__PURE__ */ new Set();
    let multibyte = false;
    let charset = false;
    for (let pos = start; ; ) {
      const el = await t.walker.header(pos, size2, encoding);
      if (el.tag === PIXEL_DATA) {
        groups.step(el.tag, pos);
        seen.add(el.tag);
        dataset2[key(el.tag)] = { vr: el.vr ?? "OW" };
        break;
      }
      if (eotLayout && EOT_TAGS.has(el.tag) && !seen.has(el.tag)) {
        groups.step(el.tag, pos);
        t.omitted.add(key(el.tag));
        pos = el.value + el.length;
      } else {
        pos = await t.translate(el, encoding, dataset2, size2, 0, "dataset", multibyte, pos, groups);
      }
      seen.add(el.tag);
      if (el.tag === CHARSET && el.length !== UNDEFINED && !charset) {
        charset = true;
        multibyte = isMultibyte(await read(el.value, el.length));
      }
    }
    let tailStart = pixelEnd;
    let mark = t.mark();
    try {
      for (let pos = pixelEnd; pos < size2; ) {
        const el = await t.walker.header(pos, size2, encoding);
        if (Math.floor(el.tag / 65536) === 65534 || seen.has(el.tag)) throw new DicomError("not an element of the dataset");
        pos = await t.translate(el, encoding, dataset2, size2, 0, "dataset", multibyte, pos, groups);
        seen.add(el.tag);
        tailStart = pos;
        mark = t.mark();
      }
    } catch (e) {
      if (!(e instanceof DicomError)) throw e;
      t.rollback(mark);
    }
    groups.finish(tailStart, dataset2);
    const node = {};
    if (PER_FRAME in dataset2) {
      node.dataset = { [PER_FRAME]: dataset2[PER_FRAME] };
      delete dataset2[PER_FRAME];
    }
    moveLarge({ meta, dataset: dataset2 }, node);
    root.meta = sorted(meta);
    root.dataset = sorted(dataset2);
    if (pixelExtra !== void 0) root.pixel_extra = t.array("OB", "pixel_extra", ...pixelExtra).BulkDataURI;
    const plans = [];
    if (unreferenced !== void 0) {
      plans.push(...await familyPlans("pixel_unreferenced", unreferenced[0], read, unreferenced[1]));
      root.pixel_unreferenced = `${SOURCE_NODE}/pixel_unreferenced`;
      if (unreferenced[2]) root.pixel_unreferenced_headers = true;
    }
    if (fragments !== void 0) {
      const packed = new Uint8Array(16 * fragments.length);
      const view5 = new DataView(packed.buffer);
      fragments.forEach(([f, length2], j) => {
        view5.setBigInt64(16 * j, BigInt(f), true);
        view5.setBigInt64(16 * j + 8, BigInt(length2), true);
      });
      plans.push(await copiedPlan("pixel_fragments", "int64", [fragments.length, 2], ["index", "value"], packed, 8));
      root.pixel_fragments = `${SOURCE_NODE}/pixel_fragments`;
    }
    if (offsetTable) root.pixel_offset_table = true;
    if (tailStart < size2) root.trailing = t.array("UN", "trailing", tailStart, size2 - tailStart).BulkDataURI;
    plans.push(...t.plans());
    const out2 = {};
    for (const name of ["meta", "dataset"]) if (node[name] !== void 0) out2[name] = sorted(node[name]);
    return [root, out2, plans];
  }

  // src/virtualize/dicom/virtualize.ts
  var SYNTAXES = /* @__PURE__ */ new Map([
    ["1.2.840.10008.1.2", [IMPLICIT_LE, null]],
    ["1.2.840.10008.1.2.1", [EXPLICIT_LE, null]],
    ["1.2.840.10008.1.2.2", [{ explicit: true, little: false }, null]],
    ["1.2.840.10008.1.2.4.50", [EXPLICIT_LE, "jpeg"]],
    ["1.2.840.10008.1.2.4.90", [EXPLICIT_LE, "jpeg2k"]],
    ["1.2.840.10008.1.2.4.91", [EXPLICIT_LE, "jpeg2k"]]
  ]);
  var WHOLE_SLIDE = "1.2.840.10008.5.1.4.1.1.77.1.6";
  var MONOCHROME = ["MONOCHROME1", "MONOCHROME2"];
  var PHOTOMETRIC = {
    "null 1": MONOCHROME,
    "null 3": ["RGB"],
    "jpeg 1": MONOCHROME,
    "jpeg 3": ["RGB", "YBR_FULL", "YBR_FULL_422"],
    "jpeg2k 1": MONOCHROME,
    "jpeg2k 3": ["RGB", "YBR_ICT", "YBR_RCT"]
  };
  var ADOBE = [255, 216, 255, 238, 0, 14, 65, 100, 111, 98, 101, 0, 100, 0, 0, 0, 0];
  var DECIMAL2 = /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?$/;
  var INTEGER2 = /^([+-]?)([0-9]+)$/;
  var latin12 = (b) => {
    let s = "";
    for (const c of b) s += String.fromCharCode(c);
    return s;
  };
  var dv2 = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  function isDicom(head) {
    return head.length >= 132 && latin12(head.subarray(128, 132)) === "DICM";
  }
  var Values = class {
    read;
    ds;
    constructor(read, ds) {
      this.read = read;
      this.ds = ds ?? /* @__PURE__ */ new Map();
    }
    element(tag, vrs) {
      const el = this.ds.get(tag);
      if (el === void 0 || el.length === 0) return void 0;
      if (el.vr !== null && !vrs.includes(el.vr)) reject2(`${tagName(tag)} has VR ${el.vr}, not ${vrs.join(" or ")}`);
      if (el.length === UNDEFINED) reject2(`${tagName(tag)} has an undefined length`);
      return el;
    }
    async integer(tag, vr) {
      const el = this.element(tag, [vr]);
      if (el === void 0) return void 0;
      const n = vr === "US" ? 2 : 4;
      if (el.length % n) reject2(`${tagName(tag)} has a length that is not a multiple of ${n}`);
      const v = dv2(await this.read(el.value, n));
      return n === 2 ? v.getUint16(0, el.little) : v.getUint32(0, el.little);
    }
    /** The first value of an AT attribute, as a tag. */
    async tag(tag) {
      const el = this.element(tag, ["AT"]);
      if (el === void 0) return void 0;
      if (el.length % 4) reject2(`${tagName(tag)} has a length that is not a multiple of 4`);
      const v = dv2(await this.read(el.value, 4));
      return v.getUint16(0, el.little) * 65536 + v.getUint16(2, el.little);
    }
    async integers64(tag) {
      const el = this.element(tag, ["OV"]);
      if (el === void 0) return void 0;
      if (el.length % 8) reject2(`${tagName(tag)} has a length that is not a multiple of 8`);
      const v = dv2(await this.read(el.value, el.length));
      return Array.from({ length: el.length / 8 }, (_, i) => {
        const x = v.getBigUint64(8 * i, el.little);
        if (x > BigInt(Number.MAX_SAFE_INTEGER)) reject2(`${tagName(tag)} has a value above 2^53 - 1`);
        return Number(x);
      });
    }
    async strings(tag, vr) {
      const el = this.element(tag, [vr]);
      if (el === void 0) return void 0;
      const bytes = await this.read(el.value, el.length);
      const out2 = [];
      let start = 0;
      for (let i = 0; i <= bytes.length; i++) {
        if (i < bytes.length && bytes[i] !== 92) continue;
        let a = start;
        let b = i;
        while (a < b && (bytes[a] === 32 || bytes[a] === 0)) a++;
        while (b > a && (bytes[b - 1] === 32 || bytes[b - 1] === 0)) b--;
        out2.push(latin12(bytes.subarray(a, b)));
        start = i + 1;
      }
      return out2;
    }
    async string(tag, vr) {
      return (await this.strings(tag, vr))?.[0];
    }
    async integerString(tag) {
      const value2 = await this.string(tag, "IS");
      if (value2 === void 0) return void 0;
      const m = value2.match(INTEGER2);
      if (m === null) return reject2(`${tagName(tag)} is not an integer string: ${JSON.stringify(value2)}`);
      const digits = m[2].replace(/^0+(?=.)/, "");
      const magnitude = digits.length > 16 ? Infinity : Number(digits);
      return m[1] === "-" && magnitude !== 0 ? -magnitude : magnitude;
    }
    /** The string values as numbers, null for an invalid one. */
    async decimals(tag) {
      const values2 = await this.strings(tag, "DS");
      return values2?.map((v) => {
        const x = DECIMAL2.test(v) ? Number(v) : null;
        return x !== null && Number.isFinite(x) ? x : null;
      });
    }
  };
  function need(value2, what) {
    return value2 === void 0 ? reject2(`missing ${what}`) : value2;
  }
  async function virtualizeDicom(url2, read, fileSize) {
    if (fileSize < 132 || latin12(await read(128, 4)) !== "DICM") reject2("not a DICOM file");
    const walker = new Walker(read, fileSize);
    const [meta, start] = await walker.meta();
    const syntax = need(await new Values(read, meta).string(131088, "UI"), "Transfer Syntax UID");
    const known = SYNTAXES.get(syntax);
    if (known === void 0) return reject2(`unsupported transfer syntax ${syntax}`);
    const [encoding, codec] = known;
    const [top] = await walker.dataset(start, fileSize, false, encoding, 0, true);
    const pixel = top.get(PIXEL_DATA);
    let measures;
    const shared = top.get(1375769129);
    if (shared?.items?.length) {
      const pm = shared.items[0].get(2658576);
      if (pm?.items?.length) measures = pm.items[0];
    }
    const v = new Values(read, top);
    const m = new Values(read, measures);
    const sopClass = await v.string(524310, "UI");
    const organization = await v.string(2134801, "CS");
    const sppValue = await v.integer(2621442, "US");
    const photometricValue = await v.string(2621444, "CS");
    const planar = await v.integer(2621446, "US");
    const frames = await v.integerString(2621448);
    const rowsValue = await v.integer(2621456, "US");
    const columnsValue = await v.integer(2621457, "US");
    const bitsAllocatedValue = await v.integer(2621696, "US");
    const bitsStoredValue = await v.integer(2621697, "US");
    const highBit = await v.integer(2621698, "US");
    const representationValue = await v.integer(2621699, "US");
    const center = await v.decimals(2625616);
    const width = await v.decimals(2625617);
    const intercept = await v.decimals(2625618);
    const slope = await v.decimals(2625619);
    const increment = await v.tag(2621449);
    const frameTime = await v.decimals(1577059);
    const totalColumns = await v.integer(4718598, "UL");
    const totalRows = await v.integer(4718599, "UL");
    const opticalPaths = await v.integer(4719362, "UL");
    const focalPlanes = await v.integer(4719363, "UL");
    const eot = await v.integers64(2145386497);
    const eotLengths = await v.integers64(2145386498);
    if (pixel.vr !== null && pixel.vr !== "OB" && pixel.vr !== "OW") reject2(`Pixel Data has VR ${pixel.vr}`);
    const fg = /* @__PURE__ */ new Map();
    for (const tag of [2621488, 1573e3]) {
      const inItem = await m.decimals(tag);
      const atTop = await v.decimals(tag);
      fg.set(tag, inItem ?? atTop);
    }
    const spp = need(sppValue, "Samples per Pixel");
    const photometric = need(photometricValue, "Photometric Interpretation");
    const rows = need(rowsValue, "Rows");
    const columns = need(columnsValue, "Columns");
    const bitsAllocated = need(bitsAllocatedValue, "Bits Allocated");
    const bitsStored = need(bitsStoredValue, "Bits Stored");
    const representation = need(representationValue, "Pixel Representation");
    if (rows < 1 || columns < 1) reject2("Rows and Columns must be at least 1");
    if (spp !== 1 && spp !== 3) reject2(`unsupported Samples per Pixel ${spp}`);
    if (spp === 3 && planar !== 0 && planar !== 1) {
      reject2(`Planar Configuration ${planar ?? "None"} with 3 samples per pixel`);
    }
    const n = frames ?? 1;
    if (!(n >= 1 && n <= Number.MAX_SAFE_INTEGER)) reject2(`Number of Frames ${n} is not from 1 to 2^53 - 1`);
    if (bitsStored < 1 || bitsStored > bitsAllocated) {
      reject2(`Bits Stored ${bitsStored} is not from 1 to Bits Allocated ${bitsAllocated}`);
    }
    if (highBit !== void 0 && highBit !== bitsStored - 1) reject2(`High Bit ${highBit} is not Bits Stored - 1`);
    if (representation !== 0 && representation !== 1) reject2(`unsupported Pixel Representation ${representation}`);
    const allowedBits = codec === null ? [8, 16, 32] : codec === "jpeg" ? [8] : [8, 16];
    if (!allowedBits.includes(bitsAllocated)) reject2(`unsupported Bits Allocated ${bitsAllocated}`);
    if (codec === "jpeg" && (bitsStored !== 8 || representation !== 0)) {
      reject2("JPEG Baseline needs 8 unsigned bits stored");
    }
    if (!PHOTOMETRIC[`${codec} ${spp}`].includes(photometric)) {
      reject2(`unsupported Photometric Interpretation ${JSON.stringify(photometric)} with ${spp} samples per pixel`);
    }
    const dataType3 = `${representation === 0 ? "u" : ""}int${bitsAllocated}`;
    const wholeSlide = sopClass === WHOLE_SLIDE;
    let widthPx = columns;
    let heightPx = rows;
    let across = 1;
    if (wholeSlide) {
      if (organization !== "TILED_FULL") {
        reject2("a whole-slide image whose Dimension Organization Type is not TILED_FULL");
      }
      widthPx = need(totalColumns, "Total Pixel Matrix Columns");
      heightPx = need(totalRows, "Total Pixel Matrix Rows");
      if (widthPx < 1 || heightPx < 1) reject2("the total pixel matrix must be at least 1 by 1");
      if ((opticalPaths ?? 1) !== 1) reject2(`${opticalPaths} optical paths`);
      if ((focalPlanes ?? 1) !== 1) reject2(`${focalPlanes} focal planes`);
      across = Math.ceil(widthPx / columns);
      const down = Math.ceil(heightPx / rows);
      if (n !== across * down) reject2(`${n} frames for ${down} by ${across} tiles`);
    }
    const planarNative = codec === null && spp === 3 && planar === 1;
    const frameSize = rows * columns * spp * (bitsAllocated / 8);
    const frameRanges = [];
    let pixelEnd = 0;
    let pixelExtra;
    let unreferenced;
    let fragmentLengths;
    let offsetTable = false;
    if (codec === null) {
      if (pixel.length === UNDEFINED) reject2("native Pixel Data with an undefined length");
      if (pixel.value + pixel.length > fileSize) {
        reject2(`Pixel Data's ${pixel.length} bytes run past the end of the ${fileSize}-byte file`);
      }
      if (pixel.length < n * frameSize) {
        reject2(`Pixel Data has ${pixel.length} bytes, less than ${n} frames of ${frameSize}`);
      }
      if (!encoding.little && bitsAllocated === 8 && pixel.vr === "OW") reject2("8-bit Pixel Data of VR OW in big endian");
      for (let f = 0; f < n; f++) frameRanges.push([[pixel.value + f * frameSize, frameSize]]);
      pixelEnd = pixel.value + pixel.length;
      const extra = pixel.length - n * frameSize;
      if (extra > 1 || extra === 1 && (await read(pixelEnd - 1, 1))[0] !== 0) pixelExtra = [pixel.value + n * frameSize, extra];
    } else {
      if (pixel.length !== UNDEFINED) reject2("encapsulated Pixel Data with a defined length");
      if (pixel.value + 8 > fileSize) reject2("no Basic Offset Table");
      const head = dv2(await read(pixel.value, 8));
      const botLength = head.getUint32(4, true);
      if (head.getUint16(0, true) * 65536 + head.getUint16(2, true) !== ITEM || botLength === UNDEFINED || botLength % 4) {
        reject2("the Basic Offset Table is not an item of a multiple of 4 bytes");
      }
      const q = pixel.value + 8 + botLength;
      let fragments;
      if (eot !== void 0 || eotLengths !== void 0) {
        if (eot === void 0 || eotLengths === void 0) {
          return reject2("an Extended Offset Table without its lengths, or lengths without the table");
        }
        if (eot.length !== n || eotLengths.length !== n) {
          reject2("the Extended Offset Table does not have one value per frame");
        }
        if (botLength !== 0) reject2("an Extended Offset Table with a Basic Offset Table");
        fragments = eot.map((o, f) => [[q + o + 8, eotLengths[f]]]);
        for (const [[o, length2]] of fragments) {
          if (o + length2 > fileSize) reject2(`range [${o}, ${o + length2}) outside the ${fileSize}-byte file`);
        }
        let headers = true;
        for (const [f, o] of eot.entries()) {
          const d = dv2(await read(q + o, 8));
          if (d.getUint16(0, true) !== 65534 || d.getUint16(2, true) !== 57344 || d.getUint32(4, true) !== eotLengths[f]) {
            headers = false;
            break;
          }
        }
        const spans = eot.map((o, f) => [q + o, 8 + eotLengths[f]]).sort(([a, m2], [b, l]) => a - b || m2 - l);
        if (spans.some(([a, m2], i) => i + 1 < spans.length && a + m2 > spans[i + 1][0])) {
          reject2("the Extended Offset Table's frames overlap");
        }
        const items = eot.map((o, f) => headers ? [q + o, 8 + eotLengths[f]] : [q + o + 8, eotLengths[f]]).sort(([a, m2], [b, l]) => a - b || m2 - l);
        const members = [];
        pixelEnd = q;
        for (const [k, [o, length2]] of items.entries()) {
          members.push([k, pixelEnd, Math.max(0, o - pixelEnd)]);
          pixelEnd = Math.max(pixelEnd, o + length2);
        }
        if (members.some(([, , m2]) => m2 > 0)) unreferenced = [members, n, !headers];
        if (pixelEnd + 8 <= fileSize) {
          const d = dv2(await read(pixelEnd, 8));
          if (d.getUint16(0, true) === 65534 && d.getUint16(2, true) === 57565 && d.getUint32(4, true) === 0) pixelEnd += 8;
        }
      } else {
        const walked = await walker.fragments(pixel.value, fileSize, true);
        pixelEnd = walked[1];
        const items = walked[0].slice(1);
        if (items.length === 0) reject2("encapsulated Pixel Data without fragments");
        const botData = dv2(await read(pixel.value + 8, botLength));
        const bot = Array.from({ length: botLength / 4 }, (_, i) => botData.getUint32(4 * i, true));
        const data = items.map(([, o, length2]) => [o, length2]);
        if (bot.length > 0) {
          const position = new Map(items.map(([p], i) => [p - q, i]));
          if (bot.length !== n) reject2(`the Basic Offset Table has ${bot.length} offsets for ${n} frames`);
          if (bot[0] !== 0 || bot.some((o, i) => i > 0 && bot[i - 1] >= o)) {
            reject2("the Basic Offset Table does not start at 0 and increase");
          }
          if (bot.some((o) => !position.has(o))) reject2("a Basic Offset Table offset is not a fragment's");
          const bounds2 = [...bot.map((o) => position.get(o)), items.length];
          fragments = Array.from({ length: n }, (_, f) => data.slice(bounds2[f], bounds2[f + 1]));
        } else if (items.length === n) {
          fragments = data.map((d) => [d]);
        } else if (n === 1) {
          fragments = [data];
        } else {
          return reject2(`${items.length} fragments for ${n} frames without an offset table`);
        }
        offsetTable = bot.length > 0;
        if (fragments.some((frags) => frags.length > 1)) {
          fragmentLengths = fragments.flatMap((frags, f) => frags.map(([, length2]) => [f, length2]));
        }
      }
      for (const [f, frags] of fragments.entries()) {
        let ranges = frags.filter(([, length2]) => length2 > 0);
        if (ranges.length === 0) reject2(`frame ${f} has no data`);
        if (codec === "jpeg" && spp === 3) {
          const [o, length2] = ranges[0];
          if (length2 <= 2) reject2(`frame ${f}'s first fragment is too short for a JPEG stream`);
          const soi = await read(o, 2);
          if (soi[0] !== 255 || soi[1] !== 216) {
            reject2(`frame ${f}'s first fragment does not start with a JPEG SOI marker (FF D8)`);
          }
          const prefix2 = Uint8Array.from([...ADOBE, photometric === "RGB" ? 0 : 1]);
          ranges = [prefix2, [o + 2, length2 - 2], ...ranges.slice(1)];
        }
        frameRanges.push(ranges);
      }
    }
    const fa = increment === 1577059 || increment === 1577061 ? "t" : "z";
    const axes = [];
    if (spp === 3) axes.push("c");
    if (!wholeSlide && n > 1) axes.push(fa);
    axes.push("y", "x");
    const shape = { c: 3, [fa]: n, y: heightPx, x: widthPx };
    const chunkShape = { c: planarNative ? 1 : 3, [fa]: 1, y: rows, x: columns };
    const codecs = [];
    if (spp === 3 && !planarNative) {
      const stored = axes.filter((a) => a !== "c").concat("c");
      codecs.push({ name: "transpose", configuration: { order: stored.map((a) => axes.indexOf(a)) } });
    }
    if (codec === null) {
      codecs.push(bitsAllocated > 8 ? { name: "bytes", configuration: { endian: encoding.little ? "little" : "big" } } : { name: "bytes" });
    } else {
      codecs.push({ name: `imagecodecs_${codec}` });
    }
    const spacing = fg.get(2621488);
    const usable = spacing !== void 0 && spacing.length === 2 && spacing.every((s) => s !== null && s > 0);
    const between = fg.get(1573e3);
    const step = between !== void 0 && between[0] !== null && between[0] > 0 ? between[0] : void 0;
    const ft = frameTime?.[0];
    const period = increment === 1577059 && ft !== void 0 && ft !== null && ft > 0 ? ft / 1e3 : void 0;
    const scale = {
      c: 1,
      z: step ?? 1,
      t: period ?? 1,
      y: usable ? spacing[0] : 1,
      x: usable ? spacing[1] : 1
    };
    const unit = {
      z: step ? "millimeter" : void 0,
      t: period ? "second" : void 0,
      y: usable ? "millimeter" : void 0,
      x: usable ? "millimeter" : void 0
    };
    const type = { c: "channel", t: "time", z: "space", y: "space", x: "space" };
    const low = representation === 0 ? 0 : -(2 ** (bitsStored - 1));
    const high = representation === 0 ? 2 ** bitsStored - 1 : 2 ** (bitsStored - 1) - 1;
    let windowStart = low;
    let windowEnd = high;
    if (spp === 1 && center?.[0] != null && width?.[0] != null) {
      const c = center[0];
      const w = width[0];
      const k = intercept === void 0 ? 0 : intercept[0];
      const s = slope === void 0 ? 1 : slope[0];
      if (w >= 1 && k !== null && s !== null && s !== 0) {
        windowStart = (c - w / 2 - k) / s;
        windowEnd = (c + w / 2 - k) / s;
        if (s < 0) [windowStart, windowEnd] = [windowEnd, windowStart];
        if (!Number.isFinite(windowStart) || !Number.isFinite(windowEnd)) reject2("the VOI window is not finite");
      }
    }
    const window2 = { min: low, max: high, start: windowStart, end: windowEnd };
    const channels = spp === 1 ? [{ label: "gray", color: "FFFFFF", active: true, window: window2, ...photometric === "MONOCHROME1" ? { inverted: true } : {} }] : [["R", "FF0000"], ["G", "00FF00"], ["B", "0000FF"]].map(([label, color]) => ({ label, color, active: true, window: window2 }));
    const utf89 = new TextEncoder();
    const json = (value2) => utf89.encode(stringifyJson(value2));
    const [rootMeta, nodeMeta, plans] = await sourceMetadata(
      read,
      fileSize,
      start,
      encoding,
      pixelEnd,
      pixelExtra,
      unreferenced,
      codec !== null && eot !== void 0,
      fragmentLengths,
      offsetTable
    );
    const entries = [];
    if (Object.keys(nodeMeta).length > 0 || plans.length > 0) {
      entries.push(...emitPlans(plans, declare({}, "dicom", void 0, Object.keys(nodeMeta).length > 0 ? nodeMeta : void 0)));
    }
    const metadataEntries = entries.length;
    for (const [f, ranges] of frameRanges.entries()) {
      const [row, col] = wholeSlide ? [Math.floor(f / across), f % across] : [0, 0];
      for (let s = 0; s < (planarNative ? 3 : 1); s++) {
        let part = ranges;
        if (planarNative) {
          const [o, length2] = ranges[0];
          part = [[o + s * (length2 / 3), length2 / 3]];
        }
        for (const r of part) {
          if (!(r instanceof Uint8Array) && r[0] + r[1] > fileSize) {
            reject2(`range [${r[0]}, ${r[0] + r[1]}) outside the ${fileSize}-byte file`);
          }
        }
        if (payloadSize(part) > MAX_PAYLOAD2) reject2(`frame ${f}'s reference payload exceeds ${MAX_PAYLOAD2} bytes`);
        const coords = { c: s, [fa]: f, y: row, x: col };
        entries.push({
          key: `0/c/${axes.map((a) => coords[a]).join("/")}`,
          ranges: part.map((r) => r instanceof Uint8Array ? { data: r } : { source: 0, offset: BigInt(r[0]), length: BigInt(r[1]) })
        });
      }
    }
    const references = entries.length - metadataEntries;
    entries.push(
      {
        key: "zarr.json",
        bytes: json({
          zarr_format: 3,
          node_type: "group",
          attributes: declare({
            ome: {
              version: "0.5",
              multiscales: [{
                axes: axes.map((a) => ({ name: a, type: type[a], ...unit[a] ? { unit: unit[a] } : {} })),
                datasets: [{ path: "0", coordinateTransformations: [{ type: "scale", scale: axes.map((a) => scale[a]) }] }]
              }],
              omero: { channels }
            }
          }, "dicom", url2, rootMeta)
        })
      },
      {
        key: "0/zarr.json",
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape: axes.map((a) => shape[a]),
          data_type: dataType3,
          chunk_grid: { name: "regular", configuration: { chunk_shape: axes.map((a) => chunkShape[a]) } },
          chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
          fill_value: 0,
          codecs,
          dimension_names: axes,
          attributes: {}
        })
      }
    );
    return {
      sources: [{ url: url2 }],
      entries,
      summary: {
        axes,
        shape: axes.map((a) => shape[a]),
        dataType: dataType3,
        transferSyntax: syntax,
        photometric,
        frames: n,
        wholeSlide,
        references
      }
    };
  }

  // src/virtualize/ims/hdf5.ts
  var ImsError = class extends Error {
  };
  var reject3 = (message) => {
    throw new ImsError(message);
  };
  var SIGNATURE = [137, 72, 68, 70, 13, 10, 26, 10];
  var UNDEFINED2 = (1n << 64n) - 1n;
  var MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  var MAX_BLOCKS = 1e3;
  var MAX_HEADERS = 4096;
  var MAX_BTREE2_DEPTH = 16;
  var RECORD_SIZES = { 1: 24, 5: 11, 8: 17 };
  var DATASPACE = 1;
  var LINK_INFO = 2;
  var DATATYPE = 3;
  var FILL_VALUE = 5;
  var LINK = 6;
  var LAYOUT = 8;
  var FILTERS = 11;
  var ATTRIBUTE = 12;
  var CONTINUATION = 16;
  var SYMBOL_TABLE = 17;
  var ATTRIBUTE_INFO = 21;
  var EXTERNAL_FILES = 7;
  function le2(data, at, n) {
    if (at < 0 || at + n > data.length) reject3("truncated HDF5 structure");
    let v = 0n;
    for (let i = n - 1; i >= 0; i--) v = v << 8n | BigInt(data[at + i]);
    return v;
  }
  function u(data, at, n) {
    return Number(le2(data, at, n));
  }
  function address(v) {
    if (v === UNDEFINED2) return void 0;
    if (v > MAX_SAFE) reject3(`HDF5 address ${v} is too large`);
    return Number(v);
  }
  function length(v) {
    if (v > MAX_SAFE) reject3(`HDF5 length ${v} is too large`);
    return Number(v);
  }
  function log2(v) {
    return BigInt(v).toString(2).length - 1;
  }
  function latin13(b) {
    let s = "";
    for (const x of b) s += String.fromCharCode(x);
    return s;
  }
  function untilNul(b) {
    const end = b.indexOf(0);
    return end < 0 ? b : b.subarray(0, end);
  }
  function parseDatatype(d) {
    const cv = u(d, 0, 1);
    if (cv >> 4 < 1 || cv >> 4 > 5) reject3(`unsupported datatype message version ${cv >> 4}`);
    return { cls: cv & 15, size: u(d, 4, 4), bits: u(d, 1, 3), props: d.subarray(8) };
  }
  function parseDataspace(d) {
    const version = u(d, 0, 1), rank = u(d, 1, 1), flags = u(d, 2, 1);
    let kind, p;
    if (version === 1) {
      [kind, p] = [rank ? 1 : 0, 8];
    } else if (version === 2) {
      [kind, p] = [u(d, 3, 1), 4];
      if (kind > 2 || kind !== 1 && rank !== 0) reject3(`invalid dataspace type ${kind}`);
    } else {
      return reject3(`unsupported dataspace message version ${version}`);
    }
    const dims = Array.from({ length: rank }, (_, i) => length(le2(d, p + 8 * i, 8)));
    const maxdims = flags & 1 ? Array.from({ length: rank }, (_, i) => le2(d, p + 8 * (rank + i), 8)) : null;
    return { dims: kind === 2 ? null : dims, maxdims };
  }
  var Hdf5 = class _Hdf5 {
    read;
    size;
    root = 0;
    headers = /* @__PURE__ */ new Map();
    heaps = /* @__PURE__ */ new Map();
    // Per global heap collection: each object's address and size, as numbers (no array per object).
    collections = /* @__PURE__ */ new Map();
    constructor(read, size2) {
      this.read = read;
      this.size = size2;
    }
    static async open(read, size2) {
      const f = new _Hdf5(async (offset, n) => {
        if (offset < 0 || offset + n > size2) reject3(`read of [${offset}, ${offset + n}) outside the ${size2}-byte file`);
        return read(offset, n);
      }, size2);
      const head = await f.read(0, 9);
      if (!SIGNATURE.every((b, i) => head[i] === b)) reject3("not an HDF5 file");
      const version = head[8];
      let sb, baseAt, sizes, rootAt;
      if (version === 0 || version === 1) {
        sb = await f.read(0, version === 1 ? 76 : 72);
        baseAt = version === 1 ? 28 : 24;
        [sizes, rootAt] = [[sb[13], sb[14]], baseAt + 40];
      } else if (version === 2 || version === 3) {
        sb = await f.read(0, 48);
        [baseAt, sizes, rootAt] = [12, [sb[9], sb[10]], 36];
      } else {
        return reject3(`unsupported HDF5 superblock version ${version}`);
      }
      if (sizes[0] !== 8 || sizes[1] !== 8) {
        reject3(`HDF5 offsets and lengths of ${sizes[0]} and ${sizes[1]} bytes are not supported`);
      }
      if (le2(sb, baseAt, 8) !== 0n) reject3("HDF5 base address is not 0");
      const root = address(le2(sb, rootAt, 8));
      if (root === void 0) return reject3("no HDF5 root group");
      f.root = root;
      return f;
    }
    // ---- object headers (§8.2)
    header(at) {
      let h = this.headers.get(at);
      if (h === void 0) {
        if (this.headers.size >= MAX_HEADERS) this.headers.clear();
        h = this.readHeader(at);
        this.headers.set(at, h);
      }
      return h;
    }
    async readHeader(at) {
      const read = this.read;
      let blocks, v2, messageHeader;
      if (latin13(await read(at, 4)) === "OHDR") {
        const prefix2 = await read(at, 6);
        if (prefix2[4] !== 2) reject3(`unsupported object header version ${prefix2[4]}`);
        const flags = prefix2[5];
        const p = at + 6 + (flags & 32 ? 16 : 0) + (flags & 16 ? 4 : 0);
        const n = 1 << (flags & 3);
        const first = length(le2(await read(p, n), 0, n));
        await read(p + n, first + 4);
        [blocks, v2, messageHeader] = [[[p + n, first]], true, flags & 4 ? 6 : 4];
      } else {
        const prefix2 = await read(at, 16);
        if (prefix2[0] !== 1) reject3(`no object header at ${at}`);
        [blocks, v2, messageHeader] = [[[at + 16, u(prefix2, 8, 4)]], false, 8];
      }
      const messages = [];
      const seen = /* @__PURE__ */ new Set([blocks[0][0]]);
      for (let i = 0; i < blocks.length; i++) {
        const [start, n] = blocks[i];
        const data = await read(start, n);
        let pos = 0;
        while (pos < n) {
          if (n - pos < messageHeader) {
            if (v2) break;
            reject3("truncated object header message");
          }
          const [type, size2, mflags] = v2 ? [data[pos], u(data, pos + 1, 2), data[pos + 3]] : [u(data, pos, 2), u(data, pos + 2, 2), data[pos + 4]];
          const body = pos + messageHeader;
          if (body + size2 > n) reject3("object header message runs past its block");
          pos = body + size2;
          const mdata = data.subarray(body, pos);
          if (type !== CONTINUATION) {
            messages.push({ type, flags: mflags, data: mdata, offset: start + body });
            continue;
          }
          if (mflags & 2) reject3("shared continuation message");
          const to = address(le2(mdata, 0, 8));
          const ln = length(le2(mdata, 8, 8));
          if (to === void 0) return reject3("continuation to an undefined address");
          let block;
          if (v2) {
            if (ln < 8 || latin13(await read(to, 4)) !== "OCHK") reject3(`no continuation block at ${to}`);
            await read(to, ln);
            block = [to + 4, ln - 8];
          } else {
            block = [to, ln];
          }
          if (seen.has(block[0])) reject3(`object header block at ${to} read twice`);
          if (blocks.length >= MAX_BLOCKS) reject3("too many object header blocks");
          seen.add(block[0]);
          blocks.push(block);
        }
      }
      return messages;
    }
    static message(messages, type, required) {
      const found = messages.filter((m) => m.type === type);
      if (found.length > 1) reject3(`object header has ${found.length} messages of type ${type}`);
      if (found.length === 0) return required ? reject3(`object header has no message of type ${type}`) : void 0;
      if (found[0].flags & 2) reject3(`shared message of type ${type}`);
      return found[0].data;
    }
    /** The datatype message of the committed datatype that a shared datatype
     * message leads to, and its object header (§8.9). */
    async committed(shared) {
      const version = u(shared, 0, 1);
      let at;
      if (version === 1) at = address(le2(shared, 8, 8));
      else if (version === 2 || version === 3 && u(shared, 1, 1) === 2) at = address(le2(shared, 2, 8));
      else return reject3("a datatype shared other than as a committed datatype");
      if (at === void 0) return reject3("a shared datatype at an undefined address");
      return [_Hdf5.message(await this.header(at), DATATYPE, true), at];
    }
    /** The datatype message of an object header, through a committed datatype
     * when it is shared, and that datatype's object header (§8.9). */
    async datatype(messages) {
      const found = messages.filter((m) => m.type === DATATYPE);
      if (found.length !== 1) reject3(`object header has ${found.length} messages of type ${DATATYPE}`);
      if (found[0].flags & 2) return this.committed(found[0].data);
      return [found[0].data, void 0];
    }
    // ---- groups (§8.3)
    /** A group's links. */
    async links(at) {
      const messages = await this.header(at);
      const table = _Hdf5.message(messages, SYMBOL_TABLE, false);
      const info = _Hdf5.message(messages, LINK_INFO, false);
      if (table !== void 0 && info !== void 0) reject3("group has both a symbol table and link info");
      const links = /* @__PURE__ */ new Map();
      const add = ([name, target]) => {
        if (links.has(name)) reject3(`group has two links named ${JSON.stringify(name)}`);
        links.set(name, target);
      };
      if (table !== void 0) {
        const btree = address(le2(table, 0, 8));
        const heap = address(le2(table, 8, 8));
        if (btree === void 0 || heap === void 0) return reject3("symbol table with an undefined address");
        const names = await this.localHeap(heap);
        for (const [, snod] of await this.btree1(btree, 0, 8)) {
          const head = await this.read(snod, 8);
          if (latin13(head.subarray(0, 4)) !== "SNOD" || head[4] !== 1) reject3(`no symbol table node at ${snod}`);
          const count = u(head, 6, 2);
          const entries = await this.read(snod + 8, 40 * count);
          for (let k = 0; k < count; k++) {
            const offset = le2(entries, 40 * k, 8);
            const end = offset < BigInt(names.length) ? names.indexOf(0, Number(offset)) : -1;
            if (end < 0) reject3("link name outside the local heap");
            const target = address(le2(entries, 40 * k + 8, 8));
            if (target === void 0) return reject3("symbol table entry with an undefined address");
            add([latin13(names.subarray(Number(offset), end)), { hard: target }]);
          }
        }
      } else if (info !== void 0) {
        if (u(info, 0, 1) !== 0) reject3("unsupported link info message version");
        const p = 2 + (u(info, 1, 1) & 1 ? 8 : 0);
        const heap = address(le2(info, p, 8));
        const btree = address(le2(info, p + 8, 8));
        if (heap === void 0) {
          for (const m of messages) {
            if (m.type !== LINK) continue;
            if (m.flags & 2) reject3("shared link message");
            add(parseLink(m.data));
          }
        } else {
          if (btree === void 0) return reject3("dense links without a name index");
          const fh = await this.fractalHeap(heap);
          for (const record of await this.btree2(btree, 5)) add(parseLink(await fh.get(record.subarray(4))));
        }
      } else {
        reject3(`object at ${at} is not a group`);
      }
      return links;
    }
    /** The object header that the link `name` of a group leads to (§8.3). */
    async follow(links, name) {
      const target = links.get(name);
      if (target === void 0 || "other" in target) return reject3(`link ${JSON.stringify(name)} is neither hard nor soft`);
      if ("hard" in target) return target.hard;
      const path2 = target.soft;
      if (!path2.startsWith("/")) reject3(`soft link ${JSON.stringify(name)} to a relative path`);
      let at = this.root;
      for (const part of path2 === "/" ? [] : path2.slice(1).split("/")) {
        const step = (await this.links(at)).get(part);
        if (step === void 0 || !("hard" in step)) {
          return reject3(`soft link ${JSON.stringify(name)} to ${JSON.stringify(path2)} does not resolve through hard links`);
        }
        at = step.hard;
      }
      return at;
    }
    async localHeap(at) {
      const head = await this.read(at, 32);
      if (latin13(head.subarray(0, 4)) !== "HEAP" || head[4] !== 0) reject3(`no local heap at ${at}`);
      const data = address(le2(head, 24, 8));
      if (data === void 0) return reject3("local heap without a data segment");
      return this.read(data, length(le2(head, 8, 8)));
    }
    /** The children of the leaves of the version 1 B-tree at `at`, each with
     * its key (the key before it) (§8.3, §8.5). */
    async btree1(at, nodeType, keySize, seen = /* @__PURE__ */ new Set(), level3) {
      if (seen.has(at)) reject3(`B-tree node at ${at} read twice`);
      seen.add(at);
      const head = await this.read(at, 24);
      if (latin13(head.subarray(0, 4)) !== "TREE" || head[4] !== nodeType) {
        reject3(`no B-tree node of type ${nodeType} at ${at}`);
      }
      const nodeLevel = head[5], entries = u(head, 6, 2);
      if (level3 !== void 0 && nodeLevel !== level3) reject3(`B-tree node at ${at} has level ${nodeLevel}, not ${level3}`);
      const step = keySize + 8;
      const body = await this.read(at + 24, entries * step + keySize);
      const out2 = [];
      for (let i = 0; i < entries; i++) {
        const child = address(le2(body, i * step + keySize, 8));
        if (child === void 0) return reject3("B-tree child with an undefined address");
        if (nodeLevel > 0) {
          for (const found of await this.btree1(child, nodeType, keySize, seen, nodeLevel - 1)) out2.push(found);
          continue;
        }
        if (nodeType === 0) {
          if (seen.has(child)) reject3(`symbol table node at ${child} read twice`);
          seen.add(child);
        }
        out2.push([body.subarray(i * step, i * step + keySize), child]);
      }
      return out2;
    }
    // ---- version 2 B-trees and fractal heaps (§8.4)
    /** The records of the version 2 B-tree at `at`, which MUST have type `type`
     * and a record size in `sizes` (by default the type's, RECORD_SIZES). */
    async btree2(at, type, sizes) {
      const h = await this.read(at, 38);
      if (latin13(h.subarray(0, 4)) !== "BTHD" || h[4] !== 0 || h[5] !== type) {
        reject3(`no version 2 B-tree of type ${type} at ${at}`);
      }
      const nodeSize = u(h, 6, 4), recordSize = u(h, 10, 2), depth2 = u(h, 12, 2);
      const root = address(le2(h, 16, 8));
      const rootCount = u(h, 24, 2);
      if (depth2 > MAX_BTREE2_DEPTH) reject3(`version 2 B-tree depth ${depth2}`);
      if (!(sizes ?? [RECORD_SIZES[type]]).includes(recordSize) || nodeSize < 10 + recordSize) {
        reject3("invalid version 2 B-tree node or record size");
      }
      const leafMax = Math.floor((nodeSize - 10) / recordSize);
      const countSize = Math.floor(log2(leafMax) / 8) + 1;
      const cum = [BigInt(leafMax)], cumSize = [0], pointer = [0];
      for (let d = 1; d <= depth2; d++) {
        pointer.push(8 + countSize + (d > 1 ? cumSize[d - 1] : 0));
        const most = Math.floor((nodeSize - 10 - pointer[d]) / (recordSize + pointer[d]));
        if (most < 1) reject3("version 2 B-tree nodes too small");
        cum.push(BigInt(most + 1) * cum[d - 1] + BigInt(most));
        cumSize.push(Math.floor(log2(cum[d]) / 8) + 1);
      }
      const records2 = [];
      const seen = /* @__PURE__ */ new Set();
      const node = async (nodeAt, count, d) => {
        if (seen.has(nodeAt)) reject3(`B-tree node at ${nodeAt} read twice`);
        seen.add(nodeAt);
        const data = await this.read(nodeAt, 6 + count * recordSize + (d ? (count + 1) * pointer[d] : 0));
        if (latin13(data.subarray(0, 4)) !== (d ? "BTIN" : "BTLF") || data[4] !== 0 || data[5] !== type) {
          reject3(`no version 2 B-tree node at ${nodeAt}`);
        }
        for (let k = 0; k < count; k++) records2.push(data.subarray(6 + k * recordSize, 6 + (k + 1) * recordSize));
        let p = 6 + count * recordSize;
        for (let k = 0; k < (d ? count + 1 : 0); k++) {
          const child = address(le2(data, p, 8));
          if (child === void 0) return reject3("B-tree child with an undefined address");
          await node(child, u(data, p + 8, countSize), d - 1);
          p += pointer[d];
        }
      };
      if (root !== void 0) await node(root, rootCount, depth2);
      return records2;
    }
    fractalHeap(at) {
      let h = this.heaps.get(at);
      if (h === void 0) {
        h = FractalHeap.open(this, at);
        this.heaps.set(at, h);
      }
      return h;
    }
    // ---- attributes (§8.6)
    /** An object's attributes: name -> attribute message; `where` receives name ->
     * the message's address in the file. */
    async attributes(at, where2) {
      const messages = await this.header(at);
      const out2 = /* @__PURE__ */ new Map();
      const add = (data, offset) => {
        const name = attributeName(data);
        if (out2.has(name)) reject3(`two attributes named ${JSON.stringify(name)}`);
        out2.set(name, data);
        where2?.set(name, offset);
      };
      for (const m of messages) {
        if (m.type !== ATTRIBUTE) continue;
        if (m.flags & 2) reject3("shared attribute message");
        add(m.data, m.offset);
      }
      const info = _Hdf5.message(messages, ATTRIBUTE_INFO, false);
      if (info !== void 0) {
        if (u(info, 0, 1) !== 0) reject3("unsupported attribute info message version");
        const p = 2 + (u(info, 1, 1) & 1 ? 2 : 0);
        const heap = address(le2(info, p, 8));
        const btree = address(le2(info, p + 8, 8));
        if (heap !== void 0) {
          if (btree === void 0) return reject3("dense attributes without a name index");
          const fh = await this.fractalHeap(heap);
          for (const record of await this.btree2(btree, 8)) {
            if (record[8] & 2) reject3("shared dense attribute");
            const [objectAt, n] = await fh.where(record.subarray(0, 8));
            add(await this.read(objectAt, n), objectAt);
          }
        }
      }
      return out2;
    }
    // ---- datasets (§8.5)
    /** A dataset: a chunked one with a zero fill value (§8.5), or, with
     * `anyLayout`, one of any layout and fill value (the source metadata). */
    async dataset(at, anyLayout = false) {
      const messages = await this.header(at);
      const space = parseDataspace(_Hdf5.message(messages, DATASPACE, true));
      const [typeMessage, named] = anyLayout ? await this.datatype(messages) : [_Hdf5.message(messages, DATATYPE, true), void 0];
      const datatype = parseDatatype(typeMessage);
      const fillMessage = _Hdf5.message(messages, FILL_VALUE, false);
      const filters = parseFilters(_Hdf5.message(messages, FILTERS, false));
      const layout = _Hdf5.message(messages, LAYOUT, true);
      let fill = fillMessage !== void 0 ? fillValue(fillMessage) : void 0;
      if (anyLayout && fill !== void 0 && fill.length !== 0 && fill.length !== datatype.size) {
        reject3("the fill value is not of the datatype's size");
      }
      if (fill !== void 0 && fill.length === 0) fill = void 0;
      if (!anyLayout && fill !== void 0 && fill.some((b) => b !== 0)) reject3("the fill value is not zero");
      if (space.dims === null) {
        if (!anyLayout) return reject3("dataset with a null dataspace");
        return {
          dims: null,
          maxdims: null,
          datatype,
          chunk: [],
          grid: [],
          filters,
          index: "btree1",
          indexAddress: void 0,
          singleSize: void 0,
          layout: "null",
          compact: new Uint8Array(0),
          dataAddress: void 0,
          fill,
          typeMessage,
          named
        };
      }
      const rank = space.dims.length;
      const version = u(layout, 0, 1), cls = u(layout, 1, 1);
      if (version < 3 || version > 5) reject3(`unsupported layout message version ${version}`);
      if (cls === 3) reject3("a virtual dataset, whose data is in other datasets");
      if (cls !== 2 && anyLayout && (cls === 0 || cls === 1)) {
        const ds = {
          dims: space.dims,
          maxdims: space.maxdims,
          datatype,
          chunk: [],
          grid: [],
          filters,
          index: "btree1",
          indexAddress: void 0,
          singleSize: void 0,
          layout: cls === 0 ? "compact" : "contiguous",
          compact: new Uint8Array(0),
          dataAddress: void 0,
          fill,
          typeMessage,
          named
        };
        if (cls === 0) {
          const n = u(layout, 2, 2);
          if (4 + n > layout.length) reject3("truncated compact dataset");
          ds.compact = layout.subarray(4, 4 + n);
        } else {
          ds.dataAddress = address(le2(layout, 2, 8));
          length(le2(layout, 10, 8));
        }
        return ds;
      }
      if (cls !== 2) reject3(`dataset layout class ${cls} is not chunked`);
      let singleSize, singleMask = 0, rawEdges = false;
      let index2, indexAddress, ndims, dims;
      if (version === 3) {
        ndims = u(layout, 2, 1);
        [index2, indexAddress] = ["btree1", address(le2(layout, 3, 8))];
        dims = Array.from({ length: ndims }, (_, i) => le2(layout, 11 + 4 * i, 4));
      } else {
        const flags = u(layout, 2, 1), enc = u(layout, 4, 1);
        ndims = u(layout, 3, 1);
        if (enc < 1 || enc > 8) reject3(`invalid chunk dimension size length ${enc}`);
        dims = Array.from({ length: ndims }, (_, i) => le2(layout, 5 + enc * i, enc));
        let p = 5 + enc * ndims;
        const itype = u(layout, p, 1);
        p += 1;
        if (itype === 1) {
          index2 = "single";
          if (flags & 2) {
            singleSize = length(le2(layout, p, 8));
            singleMask = u(layout, p + 8, 4);
            p += 12;
          }
        } else if (itype === 2) {
          index2 = "implicit";
        } else if (itype === 3) {
          index2 = "farray";
          le2(layout, p, 1);
          p += 1;
        } else if (itype === 4) {
          index2 = "earray";
          le2(layout, p, 5);
          p += 5;
        } else if (itype === 5) {
          index2 = "btree2";
          le2(layout, p, 6);
          p += 6;
        } else {
          return reject3(`unsupported chunk index type ${itype}`);
        }
        indexAddress = address(le2(layout, p, 8));
        rawEdges = filters.length > 0 && (flags & 1) !== 0;
        if (filters.length && index2 === "single" && !(flags & 2)) reject3("single filtered chunk without its size");
        if (filters.length && index2 === "implicit") reject3("implicit chunk index with filters");
      }
      if (ndims !== rank + 1 || dims[ndims - 1] !== BigInt(datatype.size)) {
        reject3("chunk dimensions do not match the dataspace and datatype");
      }
      const chunkDims = dims.slice(0, -1);
      if (chunkDims.some((c) => c < 1n || c > MAX_SAFE)) reject3("a chunk dimension is not from 1 to 2^53 - 1");
      const chunk = chunkDims.map(Number);
      const grid3 = [];
      let total = 1;
      for (const [i, n] of space.dims.entries()) {
        grid3.push(Math.ceil(n / chunk[i]));
        total *= grid3[i];
        if (total > Number.MAX_SAFE_INTEGER) reject3("more than 2^53 - 1 chunks");
      }
      return {
        dims: space.dims,
        maxdims: space.maxdims,
        datatype,
        chunk,
        grid: grid3,
        filters,
        index: index2,
        indexAddress,
        singleSize,
        layout: "chunked",
        compact: new Uint8Array(0),
        dataAddress: void 0,
        fill,
        typeMessage,
        named,
        singleMask,
        rawEdges
      };
    }
    // ---- the global heap (§8.9)
    /** The [address, size] of the object `index` of the global heap collection at `at`. */
    async globalObject(at, index2) {
      let objects = this.collections.get(at);
      if (objects === void 0) {
        objects = (async () => {
          const head = await this.read(at, 16);
          if (latin13(head.subarray(0, 4)) !== "GCOL" || head[4] !== 1) reject3(`no global heap collection at ${at}`);
          const size2 = length(le2(head, 8, 8));
          if (size2 < 16 || at + size2 > this.size) reject3("a global heap collection outside the file");
          const data = await this.read(at, size2);
          const where3 = /* @__PURE__ */ new Map(), sizes2 = /* @__PURE__ */ new Map();
          let p = 16;
          while (p + 16 <= size2) {
            const i = u(data, p, 2), n = length(le2(data, p + 8, 8));
            if (i === 0) break;
            if (p + 16 + n > size2) reject3("a global heap object outside its collection");
            if (!where3.has(i)) {
              where3.set(i, at + p + 16);
              sizes2.set(i, n);
            }
            p += 16 + pad8(n);
          }
          return [where3, sizes2];
        })();
        this.collections.set(at, objects);
      }
      const [where2, sizes] = await objects;
      const found = where2.get(index2);
      if (found === void 0) return reject3(`no global heap object ${index2} at ${at}`);
      return [found, sizes.get(index2)];
    }
    /** The allocated chunks: grid coordinates (joined by "/") -> [address, size] (§8.5). A
     * chunk's filter mask MUST be 0, unless `masks` receives the chunks' that are not (§8.9); a
     * partial edge chunk stored unfiltered has every filter's bit set. */
    async chunks(ds, masks) {
      const out2 = /* @__PURE__ */ new Map();
      const nbytes = ds.chunk.reduce((n, c) => n * BigInt(c), BigInt(ds.datatype.size));
      const filtered = ds.filters.length > 0;
      const add = (coords, at2, size2, mask = 0) => {
        const key2 = coords.join("/");
        if (ds.rawEdges && coords.some((c, i) => (c + 1) * ds.chunk[i] > ds.dims[i])) {
          mask = 2 ** ds.filters.length - 1;
        }
        if (mask) {
          if (masks === void 0) reject3("a chunk's filter mask is not 0");
          masks.set(key2, mask);
        }
        if (out2.has(key2)) reject3(`chunk ${showCoords(coords)} indexed twice`);
        if (!filtered && size2 !== nbytes) reject3(`unfiltered chunk ${showCoords(coords)} of ${size2} bytes, not ${nbytes}`);
        if (size2 < 1n) reject3(`chunk ${showCoords(coords)} is empty`);
        if (BigInt(at2) + size2 > BigInt(this.size)) reject3(`chunk ${showCoords(coords)} lies outside the file`);
        out2.set(key2, [at2, Number(size2)]);
      };
      const at = ds.indexAddress;
      if (at === void 0) return out2;
      const rank = ds.dims.length;
      if (ds.index === "btree1") {
        for (const [key2, child] of await this.btree1(at, 1, 8 + 8 * (rank + 1))) {
          const size2 = le2(key2, 0, 4), mask = u(key2, 4, 4);
          const offsets = Array.from({ length: rank + 1 }, (_, i) => le2(key2, 8 + 8 * i, 8));
          const bad = offsets[rank] !== 0n || ds.chunk.some((c, i) => offsets[i] % BigInt(c) !== 0n || offsets[i] >= BigInt(ds.dims[i]));
          if (bad) reject3(`invalid chunk offset ${showCoords(offsets)}`);
          add(ds.chunk.map((c, i) => Number(offsets[i]) / c), child, size2, mask);
        }
      } else if (ds.index === "single") {
        if (ds.grid.some((g) => g !== 1)) reject3("single chunk index for more than one chunk");
        add(new Array(rank).fill(0), at, filtered ? BigInt(ds.singleSize) : nbytes, filtered ? ds.singleMask ?? 0 : 0);
      } else if (ds.index === "implicit") {
        const maxgrid = this.implicit(ds);
        const total = product(ds.grid);
        for (let i = 0; i < total; i++) {
          const coords = unravel(i, ds.grid);
          add(coords, at + ravel(coords, maxgrid) * Number(nbytes), nbytes);
        }
      } else if (ds.index === "farray") {
        await this.fixedArray(ds, at, filtered, nbytes, add);
      } else if (ds.index === "earray") {
        await this.extensibleArray(ds, at, filtered, nbytes, add);
      } else {
        await this.btree2Chunks(ds, at, filtered, nbytes, add);
      }
      return out2;
    }
    /** The maximum grid of an implicit chunk index, whose last chunk MUST lie within the file (§8.5). */
    implicit(ds) {
      const maxgrid = maxGrid(ds, false);
      const nbytes = ds.chunk.reduce((n, c) => n * BigInt(c), BigInt(ds.datatype.size));
      if (product(ds.grid) && BigInt(ds.indexAddress) + BigInt(ravel(ds.grid.map((g) => g - 1), maxgrid) + 1) * nbytes > BigInt(this.size)) {
        reject3("an implicit chunk index past the end of the file");
      }
      return maxgrid;
    }
    /** An array index's entry: [the chunk's address or undefined, its size, its filter mask] (§8.5). */
    entry(data, k, entry2, filtered, nbytes) {
      const chunkAt = address(le2(data, k * entry2, 8));
      if (chunkAt === void 0 || !filtered) return [chunkAt, nbytes, 0];
      return [chunkAt, BigInt(length(le2(data, k * entry2 + 8, entry2 - 12))), u(data, k * entry2 + entry2 - 4, 4)];
    }
    async btree2Chunks(ds, at, filtered, nbytes, add) {
      const rank = ds.dims.length;
      const sizes = filtered ? Array.from({ length: 8 }, (_, i) => 13 + 8 * rank + i) : [8 + 8 * rank];
      for (const record of await this.btree2(at, filtered ? 11 : 10, sizes)) {
        const chunkAt = address(le2(record, 0, 8));
        if (chunkAt === void 0) return reject3("a chunk record with an undefined address");
        let p = 8, size2 = nbytes, mask = 0;
        if (filtered) {
          const n = record.length - 12 - 8 * rank;
          size2 = BigInt(length(le2(record, 8, n)));
          mask = u(record, 8 + n, 4);
          p += n + 4;
        }
        const coords = Array.from({ length: rank }, (_, i) => le2(record, p + 8 * i, 8));
        if (coords.some((c, i) => c >= BigInt(ds.grid[i]))) reject3(`invalid chunk coordinates ${showCoords(coords)}`);
        add(coords.map(Number), chunkAt, size2, mask);
      }
    }
    async extensibleArray(ds, at, filtered, nbytes, add) {
      const maxgrid = maxGrid(ds, true);
      const unlimited = maxgrid.flatMap((m, i) => m === void 0 ? [i] : []);
      if (unlimited.length !== 1) reject3("an extensible array index without exactly one unlimited dimension");
      const u2 = unlimited[0];
      const others = maxgrid.flatMap((_, i) => i === u2 ? [] : [i]);
      const otherGrid = others.map((i) => maxgrid[i]);
      const down = product(otherGrid);
      const limit = ds.grid[u2] * down;
      const h = await this.read(at, 68);
      if (latin13(h.subarray(0, 4)) !== "EAHD" || h[4] !== 0) reject3(`no extensible array header at ${at}`);
      const [client, entry2, bits, ibCount, dbMin, sbMin, pageBits] = [h[5], h[6], h[7], h[8], h[9], h[10], h[11]];
      if (client !== Number(filtered) || (filtered ? entry2 < 13 || entry2 > 20 : entry2 !== 8)) {
        reject3("the extensible array does not match the dataset");
      }
      const power = (v) => v >= 1 && (v & v - 1) === 0;
      if (!(power(dbMin) && power(sbMin) && log2(dbMin) <= bits && bits <= 64 && pageBits <= 64)) {
        reject3("invalid extensible array parameters");
      }
      const iblock = address(le2(h, 60, 8));
      if (iblock === void 0) return;
      const offsetSize = Math.floor((bits + 7) / 8);
      const page = 2 ** pageBits;
      const nsblks = 1 + bits - log2(dbMin);
      const ibSblks = 2 * log2(sbMin);
      const ibDblks = 2 * (sbMin - 1);
      if (ibSblks > nsblks) reject3("invalid extensible array parameters");
      const found = (first, data, n) => {
        for (let k2 = 0; k2 < n; k2++) {
          const [chunkAt, size2, mask] = this.entry(data, k2, entry2, filtered, nbytes);
          if (chunkAt === void 0) continue;
          const rest = first + k2;
          const coords = new Array(maxgrid.length).fill(0);
          coords[u2] = Math.floor(rest / down);
          unravel(rest % down, otherGrid).forEach((c, j) => {
            coords[others[j]] = c;
          });
          if (coords.every((c, i) => c < ds.grid[i])) add(coords, chunkAt, size2, mask);
        }
      };
      const dataBlock = async (blockAt, first, n, pages, d) => {
        const prefix2 = 14 + offsetSize;
        const head2 = await this.read(blockAt, prefix2);
        if (latin13(head2.subarray(0, 4)) !== "EADB" || head2[4] !== 0 || head2[5] !== client) {
          reject3(`no extensible array data block at ${blockAt}`);
        }
        const want = Math.min(n, limit - first);
        if (n <= page) {
          found(first, await this.read(blockAt + prefix2, want * entry2), want);
          return;
        }
        if (pages === void 0) reject3("a paged extensible array data block in the index block");
        const npages = n / page;
        for (let j = 0; j < npages && j * page < want; j++) {
          const bit = d * npages + j;
          if (pages[Math.floor(bit / 8)] & 128 >> bit % 8) {
            const m = Math.min(page, want - j * page);
            found(first + j * page, await this.read(blockAt + prefix2 + 4 + j * (page * entry2 + 4), m * entry2), m);
          }
        }
      };
      const head = await this.read(iblock, 14);
      if (latin13(head.subarray(0, 4)) !== "EAIB" || head[4] !== 0 || head[5] !== client) {
        reject3(`no extensible array index block at ${iblock}`);
      }
      const body = await this.read(iblock + 14, ibCount * entry2 + 8 * ibDblks + 8 * (nsblks - ibSblks));
      found(0, body, Math.min(ibCount, limit));
      const dblks = body.subarray(ibCount * entry2, ibCount * entry2 + 8 * ibDblks);
      const sblks = body.subarray(ibCount * entry2 + 8 * ibDblks);
      let start = ibCount, k = 0;
      for (let s = 0; s < nsblks; s++) {
        const count = 2 ** Math.floor(s / 2), n = 2 ** Math.floor((s + 1) / 2) * dbMin;
        if (start >= limit) break;
        const needed = Math.min(count, Math.ceil((limit - start) / n));
        if (s < ibSblks) {
          for (let d = 0; d < needed; d++) {
            const blockAt = address(le2(dblks, 8 * (k + d), 8));
            if (blockAt !== void 0) await dataBlock(blockAt, start + d * n, n, void 0, d);
          }
          k += count;
        } else {
          const sblock = address(le2(sblks, 8 * (s - ibSblks), 8));
          if (sblock !== void 0) {
            const npages = n > page ? n / page : 0;
            const bitmap = count * Math.ceil(npages / 8);
            const prefix2 = 14 + offsetSize;
            const shead = await this.read(sblock, prefix2 + bitmap + 8 * count);
            if (latin13(shead.subarray(0, 4)) !== "EASB" || shead[4] !== 0 || shead[5] !== client) {
              reject3(`no extensible array super block at ${sblock}`);
            }
            const pages = shead.subarray(prefix2, prefix2 + bitmap);
            for (let d = 0; d < needed; d++) {
              const blockAt = address(le2(shead, prefix2 + bitmap + 8 * d, 8));
              if (blockAt !== void 0) await dataBlock(blockAt, start + d * n, n, pages, d);
            }
          }
        }
        start += count * n;
      }
    }
    /** The mappings of a virtual dataset's layout message, from the global heap (§8.9). */
    async virtualMapping(layout) {
      if (![4, 5].includes(u(layout, 0, 1)) || u(layout, 1, 1) !== 3) reject3("not a virtual dataset layout");
      const at = address(le2(layout, 2, 8));
      if (at === void 0) return [];
      const [where2, n] = await this.globalObject(at, u(layout, 10, 4));
      const d = await this.read(where2, n);
      if (u(d, 0, 1) !== 0) reject3("unsupported virtual dataset mapping version");
      const count = le2(d, 1, 8);
      let p = 9;
      const out2 = [];
      for (let i = 0n; i < count; i++) {
        const names = [];
        for (let j = 0; j < 2; j++) {
          const end = d.indexOf(0, p);
          if (end < 0) reject3("truncated virtual dataset mapping");
          names.push(textJson(d.subarray(p, end)));
          p = end + 1;
        }
        let source, selection;
        [source, p] = parseSelection(d, p);
        [selection, p] = parseSelection(d, p);
        out2.push({ file: names[0], dataset: names[1], source, selection });
      }
      return out2;
    }
    async fixedArray(ds, at, filtered, nbytes, add) {
      const maxgrid = maxGrid(ds, false);
      const h = await this.read(at, 28);
      if (latin13(h.subarray(0, 4)) !== "FAHD" || h[4] !== 0) reject3(`no fixed array header at ${at}`);
      const client = h[5], entry2 = h[6], pageBits = h[7], count = le2(h, 8, 8);
      const total = product(maxgrid);
      if (client !== Number(filtered) || count !== BigInt(total)) reject3("the fixed array does not match the dataset");
      if (filtered ? entry2 < 13 || entry2 > 20 : entry2 !== 8) reject3(`invalid fixed array entry size ${entry2}`);
      const block = address(le2(h, 16, 8));
      if (block === void 0) return;
      const prefix2 = await this.read(block, 14);
      if (latin13(prefix2.subarray(0, 4)) !== "FADB" || prefix2[4] !== 0 || prefix2[5] !== client) {
        reject3(`no fixed array data block at ${block}`);
      }
      const pages = [];
      if (BigInt(total) > 1n << BigInt(pageBits)) {
        const page = 2 ** pageBits;
        const npages = Math.ceil(total / page);
        const bitmap = await this.read(block + 14, Math.ceil(npages / 8));
        const start = block + 14 + bitmap.length + 4;
        for (let j = 0; j < npages; j++) {
          if (bitmap[j >> 3] & 128 >> j % 8) {
            pages.push([j * page, Math.min(page, total - j * page), start + j * (page * entry2 + 4)]);
          }
        }
      } else {
        pages.push([0, total, block + 14]);
      }
      for (const [first, n, pageAt] of pages) {
        const data = await this.read(pageAt, n * entry2);
        for (let k = 0; k < n; k++) {
          const [chunkAt, size2, mask] = this.entry(data, k, entry2, filtered, nbytes);
          if (chunkAt === void 0) continue;
          const coords = unravel(first + k, maxgrid);
          if (coords.every((c, i) => c < ds.grid[i])) add(coords, chunkAt, size2, mask);
        }
      }
    }
  };
  var product = (values2) => values2.reduce((n, v) => n * v, 1);
  var showCoords = (values2) => `[${values2.join(", ")}]`;
  function unravel(i, grid3) {
    const coords = new Array(grid3.length).fill(0);
    for (let k = grid3.length - 1; k >= 0; k--) {
      coords[k] = i % grid3[k];
      i = Math.floor(i / grid3[k]);
    }
    return coords;
  }
  function ravel(coords, grid3) {
    return coords.reduce((i, c, k) => i * grid3[k] + c, 0);
  }
  function maxGrid(ds, unlimited) {
    if (ds.maxdims === null) return [...ds.grid];
    const out2 = ds.maxdims.map((m, i) => {
      if (m === UNDEFINED2 && unlimited) return void 0;
      if (m === UNDEFINED2 || m > MAX_SAFE || m < BigInt(ds.dims[i])) {
        return reject3("a maximum dimension that the chunk index does not allow");
      }
      return Math.ceil(Number(m) / ds.chunk[i]);
    });
    if (out2.reduce((n, g) => n * BigInt(g ?? 1), 1n) > MAX_SAFE) reject3("more than 2^53 - 1 chunks");
    return out2;
  }
  var FractalHeap = class _FractalHeap {
    f;
    idLength = 0;
    width = 0n;
    start = 0n;
    root;
    rootRows = 0;
    offsetSize = 0;
    lengthSize = 0;
    directRows = 0;
    hugeTree;
    hugeObjects;
    blocks = /* @__PURE__ */ new Set();
    constructor(f) {
      this.f = f;
    }
    static async open(f, at) {
      const heap = new _FractalHeap(f);
      const h = await f.read(at, 146);
      if (latin13(h.subarray(0, 4)) !== "FRHP" || h[4] !== 0) reject3(`no fractal heap at ${at}`);
      heap.idLength = u(h, 5, 2);
      const filters = u(h, 7, 2), maxManaged = u(h, 10, 4);
      heap.width = le2(h, 110, 2);
      heap.start = BigInt(length(le2(h, 112, 8)));
      const maxDirect = BigInt(length(le2(h, 120, 8)));
      const heapBits = u(h, 128, 2);
      heap.root = address(le2(h, 132, 8));
      heap.rootRows = u(h, 140, 2);
      if (filters) reject3("filtered fractal heaps are not supported");
      const power = (v) => v >= 1n && (v & v - 1n) === 0n;
      if (!(power(heap.width) && power(heap.start) && power(maxDirect) && maxDirect >= heap.start && heapBits >= 1 && heapBits <= 64 && maxManaged >= 1)) {
        reject3("invalid fractal heap parameters");
      }
      heap.offsetSize = Math.floor((heapBits + 7) / 8);
      heap.lengthSize = Math.min(Math.floor((log2(maxDirect) + 7) / 8), Math.floor(log2(maxManaged) / 8) + 1);
      heap.directRows = log2(maxDirect) - log2(heap.start) + 2;
      heap.hugeTree = address(le2(h, 22, 8));
      return heap;
    }
    /** The object with this heap ID. */
    async get(id) {
      return this.f.read(...await this.where(id));
    }
    /** The [address, size] of the object with this heap ID: one run of the file. */
    async where(id) {
      if (id.length !== this.idLength) reject3("invalid fractal heap ID");
      const kind = id[0] >> 4;
      if (kind === 1) return this.huge(le2(id, 1, Math.min(this.idLength - 1, 8)));
      if (kind !== 0 || id.length < 1 + this.offsetSize + this.lengthSize) {
        reject3("only managed and huge fractal heap objects are supported");
      }
      const offset = le2(id, 1, this.offsetSize);
      const n = le2(id, 1 + this.offsetSize, this.lengthSize);
      if (this.root === void 0) return reject3("empty fractal heap");
      const [block, start, size2] = this.rootRows === 0 ? [this.root, 0n, this.start] : await this.locate(this.root, this.rootRows, 0n, offset);
      if (!this.blocks.has(`${block} ${start}`)) {
        const head = await this.f.read(block, 13 + this.offsetSize);
        if (latin13(head.subarray(0, 4)) !== "FHDB" || head[4] !== 0 || le2(head, 13, this.offsetSize) !== start) {
          reject3(`no fractal heap direct block at ${block}`);
        }
        this.blocks.add(`${block} ${start}`);
      }
      if (offset < start || offset + n > start + size2) reject3("fractal heap object outside its block");
      return [block + Number(offset - start), Number(n)];
    }
    /** The huge object with this key, from the huge objects' B-tree. */
    async huge(key2) {
      if (this.hugeObjects === void 0) {
        if (this.hugeTree === void 0) return reject3("huge fractal heap object without a B-tree");
        const objects = /* @__PURE__ */ new Map();
        for (const record of await this.f.btree2(this.hugeTree, 1)) {
          const at = address(le2(record, 0, 8)), n = length(le2(record, 8, 8)), k = le2(record, 16, 8);
          if (at === void 0 || objects.has(k)) return reject3("invalid huge object record");
          objects.set(k, [at, n]);
        }
        this.hugeObjects = objects;
      }
      const object = this.hugeObjects.get(key2);
      if (object === void 0) return reject3(`no huge fractal heap object ${key2}`);
      return object;
    }
    /** The direct block [address, heap offset, size] holding `offset`, under the
     * indirect block at `at` with `rows` rows starting at `start`. */
    async locate(at, rows, start, offset) {
      const head = await this.f.read(at, 13 + this.offsetSize);
      if (latin13(head.subarray(0, 4)) !== "FHIB" || head[4] !== 0 || le2(head, 13, this.offsetSize) !== start) {
        reject3(`no fractal heap indirect block at ${at}`);
      }
      let pos = start;
      for (let r = 0; r < rows; r++) {
        const size2 = r === 0 ? this.start : this.start << BigInt(r - 1);
        if (offset < pos + size2 * this.width) {
          const col = (offset - pos) / size2;
          const entryAt = BigInt(at + 13 + this.offsetSize) + 8n * (BigInt(r) * this.width + col);
          if (entryAt + 8n > BigInt(this.f.size)) reject3("fractal heap block entry outside the file");
          const child = address(le2(await this.f.read(Number(entryAt), 8), 0, 8));
          if (child === void 0) return reject3("fractal heap object in an unallocated block");
          if (r < this.directRows) return [child, pos + col * size2, size2];
          const childRows = log2(size2) - log2(this.start * this.width) + 1;
          if (childRows < 1) reject3("invalid fractal heap indirect block");
          return this.locate(child, childRows, pos + col * size2, offset);
        }
        pos += size2 * this.width;
      }
      return reject3("fractal heap offset outside the heap");
    }
  };
  function parseLink(d) {
    if (u(d, 0, 1) !== 1) reject3("unsupported link message version");
    const flags = u(d, 1, 1);
    let p = 2, kind = 0;
    if (flags & 8) kind = u(d, p++, 1);
    p += (flags & 4 ? 8 : 0) + (flags & 16 ? 1 : 0);
    const n = 1 << (flags & 3);
    const nameLength = le2(d, p, n);
    p += n;
    if (BigInt(p) + nameLength > BigInt(d.length)) reject3("truncated link message");
    const end = p + Number(nameLength);
    const name = latin13(d.subarray(p, end));
    if (kind === 1) {
      const m = u(d, end, 2);
      if (end + 2 + m > d.length) reject3("truncated soft link");
      return [name, { soft: latin13(d.subarray(end + 2, end + 2 + m)) }];
    }
    if (kind !== 0) {
      const m = end + 2 <= d.length ? u(d, end, 2) : void 0;
      return [name, { other: kind, value: m !== void 0 && end + 2 + m <= d.length ? d.subarray(end + 2, end + 2 + m) : null }];
    }
    const target = address(le2(d, end, 8));
    if (target === void 0) return reject3("hard link to an undefined address");
    return [name, { hard: target }];
  }
  function attributeLayout(d) {
    const version = u(d, 0, 1);
    if (version < 1 || version > 3) reject3(`unsupported attribute message version ${version}`);
    return [version > 1 ? u(d, 1, 1) : 0, u(d, 2, 2), u(d, 4, 2), u(d, 6, 2), version === 3 ? 9 : 8];
  }
  function attributeName(d) {
    const [, nameSize, , , p] = attributeLayout(d);
    if (p + nameSize > d.length) reject3("truncated attribute message");
    return latin13(untilNul(d.subarray(p, p + nameSize)));
  }
  var pad8 = (n) => Math.ceil(n / 8) * 8;
  function attributeValue(d) {
    const [typeMessage, , data] = attributeParts(d);
    return [parseDatatype(typeMessage), data];
  }
  function attributeParts(d) {
    const [flags, nameSize, typeSize, spaceSize, start] = attributeLayout(d);
    if (flags & 3) reject3("attribute with a shared datatype or dataspace");
    const pad = u(d, 0, 1) === 1 ? pad8 : (n2) => n2;
    let p = start + pad(nameSize);
    if (p + typeSize > d.length) reject3("truncated attribute message");
    const typeMessage = d.subarray(p, p + typeSize);
    const datatype = parseDatatype(typeMessage);
    p += pad(typeSize);
    if (p + spaceSize > d.length) reject3("truncated attribute message");
    const space = parseDataspace(d.subarray(p, p + spaceSize));
    p += pad(spaceSize);
    if (space.dims === null) return reject3("attribute with a null dataspace");
    const n = space.dims.reduce((k, x) => k * BigInt(x), 1n) * BigInt(datatype.size);
    if (BigInt(p) + n > BigInt(d.length)) reject3("truncated attribute data");
    return [typeMessage, space.dims, d.subarray(p, p + Number(n))];
  }
  function attributeSharedType(d) {
    const [flags, nameSize, typeSize, , start] = attributeLayout(d);
    if (!(flags & 1)) return void 0;
    const pad = u(d, 0, 1) === 1 ? pad8 : (n) => n;
    const p = start + pad(nameSize);
    if (p + typeSize > d.length) reject3("truncated attribute message");
    return d.subarray(p, p + typeSize);
  }
  function attributeFull(d, committed) {
    const [flags, nameSize, typeSize, spaceSize, start] = attributeLayout(d);
    if (flags & 2) reject3("an attribute with a shared dataspace");
    const pad = u(d, 0, 1) === 1 ? pad8 : (n2) => n2;
    let p = start + pad(nameSize);
    if (p + typeSize > d.length) reject3("truncated attribute message");
    let typeMessage = d.subarray(p, p + typeSize);
    if (flags & 1) {
      if (committed === void 0) return reject3("an attribute with a shared datatype");
      typeMessage = committed;
    }
    const datatype = parseDatatype(typeMessage);
    p += pad(typeSize);
    if (p + spaceSize > d.length) reject3("truncated attribute message");
    const space = parseDataspace(d.subarray(p, p + spaceSize));
    p += pad(spaceSize);
    if (space.dims === null) return [typeMessage, null, new Uint8Array(0), p];
    const n = space.dims.reduce((k, x) => k * BigInt(x), 1n) * BigInt(datatype.size);
    if (BigInt(p) + n > BigInt(d.length)) reject3("truncated attribute data");
    return [typeMessage, space.dims, d.subarray(p, p + Number(n)), p];
  }
  function fillValue(d) {
    const version = u(d, 0, 1);
    let size2, p;
    if (version === 1 || version === 2) {
      if (version === 2 && !u(d, 3, 1)) return new Uint8Array(0);
      [size2, p] = [u(d, 4, 4), 8];
    } else if (version === 3) {
      if (!(u(d, 1, 1) & 32)) return new Uint8Array(0);
      [size2, p] = [u(d, 2, 4), 6];
    } else {
      return reject3(`unsupported fill value message version ${version}`);
    }
    if (p + size2 > d.length) reject3("truncated fill value message");
    return d.subarray(p, p + size2);
  }
  function parseFilters(d) {
    if (d === void 0) return [];
    const version = u(d, 0, 1), count = u(d, 1, 1);
    if (version !== 1 && version !== 2) reject3(`unsupported filter pipeline message version ${version}`);
    let p = version === 1 ? 8 : 2;
    const ids = [];
    for (let i = 0; i < count; i++) {
      const id = u(d, p, 2);
      let nameLength = 0;
      if (version === 1 || id >= 256) {
        nameLength = u(d, p + 2, 2);
        p += 4;
      } else {
        p += 2;
      }
      const values2 = u(d, p + 2, 2);
      p += 4;
      p += version === 1 ? pad8(nameLength) : nameLength;
      p += 4 * values2 + (version === 1 && values2 % 2 ? 4 : 0);
      if (p > d.length) reject3("truncated filter pipeline message");
      ids.push(id);
    }
    return ids;
  }
  function parseSelection(d, p) {
    const kind = u(d, p, 4), version = u(d, p + 4, 4);
    p += 8;
    let flags = 0, enc;
    if (kind === 0 || kind === 3) {
      if (version !== 1) reject3(`unsupported selection version ${version}`);
      le2(d, p, 8);
      return [{ select: kind === 0 ? "none" : "all" }, p + 8];
    }
    if (kind === 1) {
      if (version === 1) [enc, p] = [4, p + 8];
      else if (version === 2) [enc, p] = [u(d, p, 1), p + 1];
      else return reject3(`unsupported selection version ${version}`);
    } else if (kind === 2) {
      if (version === 1) [enc, p] = [4, p + 8];
      else if (version === 2) [flags, enc, p] = [u(d, p, 1), 8, p + 5];
      else if (version === 3) [flags, enc, p] = [u(d, p, 1), u(d, p + 1, 1), p + 2];
      else return reject3(`unsupported selection version ${version}`);
      if (flags & ~1) reject3("unknown selection flags");
    } else {
      return reject3(`unknown selection type ${kind}`);
    }
    if (![2, 4, 8].includes(enc)) reject3(`invalid selection encoding size ${enc}`);
    const rank = u(d, p, 4);
    p += 4;
    const ones = (1n << BigInt(8 * enc)) - 1n;
    if (!(flags & 1) && rank === 0) reject3("a selection of rank 0");
    const values2 = (q, n2) => Array.from({ length: n2 }, (_, i) => jsonNumber(le2(d, q + enc * i, enc)));
    if (flags & 1) {
      if (4 * rank * enc > d.length - p) reject3("truncated selection");
      const names = ["start", "stride", "count", "block"];
      const out2 = { select: "hyperslab", rank };
      const lists = names.map(() => []);
      for (let i = 0; i < rank; i++) {
        for (let j = 0; j < 4; j++) {
          const v = le2(d, p + enc * (4 * i + j), enc);
          lists[j].push(j >= 2 && v === ones ? "unlimited" : jsonNumber(v));
        }
      }
      names.forEach((name, j) => {
        out2[name] = lists[j];
      });
      return [out2, p + 4 * rank * enc];
    }
    const n = le2(d, p, enc);
    p += enc;
    const width = (kind === 2 ? 2 : 1) * rank * enc;
    if (n > BigInt(d.length - p) || n * BigInt(width) > BigInt(d.length - p)) reject3("truncated selection");
    const count = Number(n);
    if (kind === 1) {
      const points = Array.from({ length: count }, (_, i) => values2(p + width * i, rank));
      return [{ select: "points", rank, points }, p + count * width];
    }
    const blocks = Array.from({ length: count }, (_, i) => [values2(p + width * i, rank), values2(p + width * i + rank * enc, rank)]);
    return [{ select: "hyperslab", rank, blocks }, p + count * width];
  }

  // src/virtualize/ims/source.ts
  var MAX_VALUE_BYTES = 2 ** 26;
  var MAX_OBJECTS = 1e5;
  var PER_IMAGE = 5;
  var MAX_ELEMENTS = 2 ** 20;
  var MAX_DEPTH2 = 16;
  var INLINE2 = 64;
  var MAX_TEXT2 = 2 ** 20;
  var MAX_RAW = 4096;
  var BUDGET = 2 ** 16;
  var MAX_HEAP = 2 ** 16;
  var MAX_COPY = 2 ** 24;
  var MAX_SELECTIONS = 2 ** 22;
  var MAX_CHUNK3 = 2 ** 24;
  var VLEN_REASON = "variable-length data of references or variable-length data";
  var RAGGED_CHUNK2 = 2 ** 20;
  var PADDING2 = ["null-terminated", "null-padded", "space-padded"];
  var CHARSETS = ["ascii", "utf-8"];
  var IEEE = {
    2: [15, 10, 5, 15, 0, 10],
    4: [31, 23, 8, 127, 0, 23],
    8: [63, 52, 11, 1023, 0, 52]
  };
  var ZLIB = { name: "zlib", configuration: { level: 1 } };
  var reject4 = (message) => {
    throw new ImsError(message);
  };
  var bytesOf = (latin15) => Uint8Array.from(latin15, (c) => c.charCodeAt(0));
  var product2 = (dims) => dims.reduce((n, v) => n * v, 1);
  var choice = (names, i) => i < names.length ? names[i] : i;
  function memberName(d, q, version) {
    const end = d.indexOf(0, q);
    if (end < 0) reject4("truncated datatype");
    return [decodeText(d.subarray(q, end)), version < 3 ? q + Math.floor((end - q + 8) / 8) * 8 : end + 1];
  }
  function bounds(d, q, n) {
    if (q < 0 || q + n > d.length) reject4("truncated HDF5 structure");
  }
  function describeType(d, p = 0, depth2 = 0) {
    if (depth2 > MAX_DEPTH2) reject4("datatypes nested too deeply");
    const cv = u(d, p, 1);
    const cls = cv & 15, version = cv >> 4;
    if (version < 1 || version > 5) reject4(`unsupported datatype message version ${version}`);
    const bits = u(d, p + 1, 3), size2 = u(d, p + 4, 4);
    let q = p + 8;
    const order = bits & 1 ? "big" : "little";
    if (cls === 0 || cls === 4) {
      const offset = u(d, q, 2), precision = u(d, q + 2, 2);
      const t = { class: cls === 0 ? "integer" : "bitfield", size: size2, order };
      if (cls === 0) t.signed = Boolean(bits & 8);
      if (offset || precision !== 8 * size2 || bits & 6) {
        Object.assign(t, { offset, precision, padding: [bits >> 1 & 1, bits >> 2 & 1] });
      }
      return [t, q + 4];
    }
    if (cls === 1) {
      const offset = u(d, q, 2), precision = u(d, q + 2, 2);
      const eloc = u(d, q + 4, 1), esize = u(d, q + 5, 1), mloc = u(d, q + 6, 1), msize = u(d, q + 7, 1);
      const bias = u(d, q + 8, 4);
      const sign = bits >> 8 & 255, norm = bits >> 4 & 3;
      const t = { class: "float", size: size2, order: bits & 64 ? "vax" : order };
      const ieee = IEEE[size2];
      if (bits & 78 || norm !== 2 || offset || precision !== 8 * size2 || ieee === void 0 || [sign, eloc, esize, bias, mloc, msize].some((v, i) => v !== ieee[i])) {
        t.layout = {
          offset,
          precision,
          sign,
          exponent: [eloc, esize, bias],
          mantissa: [mloc, msize, norm],
          padding: [bits >> 1 & 1, bits >> 2 & 1, bits >> 3 & 1]
        };
      }
      return [t, q + 12];
    }
    if (cls === 2) return [{ class: "time", size: size2, order, precision: u(d, q, 2) }, q + 2];
    if (cls === 3) {
      return [{ class: "string", size: size2, padding: choice(PADDING2, bits & 15), charset: choice(CHARSETS, bits >> 4 & 15) }, q];
    }
    if (cls === 5) {
      const n = bits & 255;
      if (n) bounds(d, q, n);
      return [{ class: "opaque", size: size2, tag: jsonText(d.subarray(q, q + n)) }, q + n];
    }
    if (cls === 6) {
      const members = [];
      for (let k = 0; k < (bits & 65535); k++) {
        let name, offset, member;
        [name, q] = memberName(d, q, version);
        if (version >= 3) {
          const w = size2 ? Math.ceil(size2.toString(2).length / 8) : 1;
          offset = u(d, q, w);
          [member, q] = describeType(d, q + w, depth2 + 1);
        } else if (version === 2) {
          offset = u(d, q, 4);
          [member, q] = describeType(d, q + 4, depth2 + 1);
        } else {
          offset = u(d, q, 4);
          const rank = u(d, q + 4, 1);
          if (rank > 4) reject4("a compound member of more than 4 dimensions");
          const dims = Array.from({ length: rank }, (_, i) => u(d, q + 16 + 4 * i, 4));
          [member, q] = describeType(d, q + 32, depth2 + 1);
          if (rank) member = { class: "array", size: member.size * product2(dims), shape: dims, base: member };
        }
        members.push({ name, offset, type: member });
      }
      return [{ class: "compound", size: size2, members }, q];
    }
    if (cls === 7) return [{ class: "reference", size: size2, kind: bits & 15 }, q];
    if (cls === 8) {
      let base;
      [base, q] = describeType(d, q, depth2 + 1);
      if (base.class !== "integer") reject4("an enumeration of a datatype that is not an integer");
      const names = [];
      for (let k = 0; k < (bits & 65535); k++) {
        let name;
        [name, q] = memberName(d, q, version);
        names.push(name);
      }
      const n = base.size;
      if (names.length && n) bounds(d, q, names.length * n);
      const values2 = {};
      names.forEach((name, i) => {
        if (!Object.hasOwn(values2, name)) setMember(values2, name, integer(base, d.subarray(q + i * n, q + (i + 1) * n)));
      });
      return [{ class: "enum", size: size2, base, members: values2 }, q + names.length * n];
    }
    if (cls === 9) {
      let base;
      [base, q] = describeType(d, q, depth2 + 1);
      const t = { class: "variable-length", size: size2, base };
      if ((bits & 15) === 1) {
        Object.assign(t, { string: true, padding: choice(PADDING2, bits >> 4 & 15), charset: choice(CHARSETS, bits >> 8 & 15) });
      }
      return [t, q];
    }
    if (cls === 10) {
      const rank = u(d, q, 1);
      let dims;
      if (version < 3) {
        dims = Array.from({ length: rank }, (_, i) => u(d, q + 4 + 4 * i, 4));
        q += 4 + 8 * rank;
      } else {
        dims = Array.from({ length: rank }, (_, i) => u(d, q + 1 + 4 * i, 4));
        q += 1 + 4 * rank;
      }
      let base;
      [base, q] = describeType(d, q, depth2 + 1);
      return [{ class: "array", size: size2, shape: dims, base }, q];
    }
    return reject4(`unknown datatype class ${cls}`);
  }
  function integer(t, b) {
    let v = 0n;
    const bytes = t.order === "big" ? [...b] : [...b].reverse();
    for (const x of bytes) v = v << 8n | BigInt(x);
    if (t.signed && b.length && v >= 1n << BigInt(8 * b.length - 1)) v -= 1n << BigInt(8 * b.length);
    return jsonNumber(v);
  }
  function numeric(t) {
    if (t.order !== "little" && t.order !== "big") return void 0;
    if (t.class === "integer" && !("offset" in t) && [1, 2, 4, 8].includes(t.size)) {
      return `${t.signed ? "int" : "uint"}${8 * t.size}`;
    }
    if (t.class === "float" && !("layout" in t) && [2, 4, 8].includes(t.size)) return `float${8 * t.size}`;
    return void 0;
  }
  function element(t) {
    if (t.class === "enum") return element(t.base);
    if (t.class === "array") {
      const inner = element(t.base);
      return inner !== void 0 ? [inner[0], [...t.shape, ...inner[1]]] : void 0;
    }
    return numeric(t) !== void 0 ? [t, []] : void 0;
  }
  function half(v) {
    const sign = v & 32768 ? -1 : 1, exp = v >> 10 & 31, frac = v & 1023;
    if (exp === 0) return sign * 2 ** -14 * (frac / 1024);
    if (exp === 31) return frac ? NaN : sign * Infinity;
    return sign * 2 ** (exp - 15) * (1 + frac / 1024);
  }
  function numbers(t, count, data) {
    const type = numeric(t);
    if (type === void 0) return void 0;
    const little = t.order === "little";
    const view5 = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const out2 = [];
    for (let i = 0; i < count; i++) {
      const at = i * t.size;
      switch (type) {
        case "int8":
          out2.push(view5.getInt8(at));
          break;
        case "uint8":
          out2.push(view5.getUint8(at));
          break;
        case "int16":
          out2.push(view5.getInt16(at, little));
          break;
        case "uint16":
          out2.push(view5.getUint16(at, little));
          break;
        case "int32":
          out2.push(view5.getInt32(at, little));
          break;
        case "uint32":
          out2.push(view5.getUint32(at, little));
          break;
        case "int64":
          out2.push(jsonNumber(view5.getBigInt64(at, little)));
          break;
        case "uint64":
          out2.push(jsonNumber(view5.getBigUint64(at, little)));
          break;
        case "float16":
          out2.push(jsonNumber(half(view5.getUint16(at, little))));
          break;
        case "float32":
          out2.push(jsonNumber(view5.getFloat32(at, little)));
          break;
        default:
          out2.push(jsonNumber(view5.getFloat64(at, little)));
      }
    }
    return out2;
  }
  function holdsAddresses(t) {
    if (t.class === "reference" || t.class === "variable-length") return true;
    if (t.class === "compound") return t.members.some((m) => holdsAddresses(m.type));
    return t.class === "array" && holdsAddresses(t.base);
  }
  function nodeName(key2) {
    return key2 !== "" && key2 !== "." && key2 !== ".." && key2 !== "zarr.json" && !key2.startsWith("__") && !key2.includes("/");
  }
  function elementText(e, padding) {
    const pad = padding === "space-padded" ? 32 : 0;
    let end = e.length;
    while (end > 0 && e[end - 1] === pad) end--;
    const text5 = e.subarray(0, end);
    return text5.includes(0) ? void 0 : text5;
  }
  function put(entry2, dims, values2) {
    if (dims.length === 0) {
      entry2.value = values2[0];
    } else {
      if (dims.length !== 1) entry2.shape = dims;
      entry2.value = values2;
    }
    return entry2;
  }
  var CANONICAL_NAN = { 2: 0x7e00n, 4: 0x7fc00000n, 8: 0x7ff8000000000000n };
  function exactFill(base, fill) {
    const size2 = base !== void 0 ? base.size : 1;
    for (let i = size2; i < fill.length; i += size2) {
      for (let j = 0; j < size2; j++) if (fill[i + j] !== fill[j]) return void 0;
    }
    if (base === void 0) return fill[0];
    const first = fill.subarray(0, size2);
    const big = base.order === "big";
    let bits = 0n;
    for (const x of big ? [...first] : [...first].reverse()) bits = bits << 8n | BigInt(x);
    if (base.class === "integer") {
      if (base.signed && bits >= 1n << BigInt(8 * size2 - 1)) bits -= 1n << BigInt(8 * size2);
      return Number.isSafeInteger(Number(bits)) && BigInt(Number(bits)) === bits ? Number(bits) : JSON.rawJSON(bits.toString());
    }
    const v = numbers(base, 1, first)[0];
    if (v === "NaN") return bits === CANONICAL_NAN[size2] ? "NaN" : void 0;
    if (v === 0 && bits >> BigInt(8 * size2 - 1)) return void 0;
    return v;
  }
  async function inflate(data, size2) {
    const chunks = [];
    let total = 0;
    try {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
      const reader = stream.getReader();
      for (; ; ) {
        const { done, value: value2 } = await reader.read();
        if (done) break;
        total += value2.length;
        if (total > size2) {
          await reader.cancel();
          break;
        }
        chunks.push(value2);
      }
    } catch {
      total = -1;
    }
    if (total !== size2) reject4("a chunk that does not decode to its size");
    const out2 = new Uint8Array(size2);
    let p = 0;
    for (const c of chunks) {
      out2.set(c, p);
      p += c.length;
    }
    return out2;
  }
  function scatter(out2, dims, e, chunk, chunkShape, origin) {
    const rank = dims.length;
    if (rank === 0) {
      out2.set(chunk.subarray(0, e));
      return;
    }
    const run = Math.min(chunkShape[rank - 1], dims[rank - 1] - origin[rank - 1]) * e;
    const index2 = new Array(rank - 1).fill(0);
    for (; ; ) {
      if (index2.every((v, i2) => origin[i2] + v < dims[i2])) {
        let src = 0, dst = 0;
        for (let i2 = 0; i2 < rank - 1; i2++) {
          src = src * chunkShape[i2] + index2[i2];
          dst = dst * dims[i2] + origin[i2] + index2[i2];
        }
        src = src * chunkShape[rank - 1] * e;
        dst = (dst * dims[rank - 1] + origin[rank - 1]) * e;
        out2.set(chunk.subarray(src, src + run), dst);
      }
      let i = rank - 2;
      for (; i >= 0; i--) {
        index2[i]++;
        if (index2[i] < chunkShape[i]) break;
        index2[i] = 0;
      }
      if (i < 0) return;
    }
  }
  var joinKey = (coords) => coords.join("/");
  var splitKey = (key2) => key2 === "" ? [] : key2.split("/").map(Number);
  function exactNumbers(t, count, data) {
    const values2 = numbers(t, count, data);
    if (values2 === void 0 || t.class !== "float") return values2;
    const size2 = t.size;
    const nan = CANONICAL_NAN[size2], sign = t.order === "big" ? 0 : size2 - 1;
    for (let i = 0; i < values2.length; i++) {
      const b = data.subarray(i * size2, (i + 1) * size2);
      let bits = 0n;
      for (const x of t.order === "big" ? [...b] : [...b].reverse()) bits = bits << 8n | BigInt(x);
      if (values2[i] === "NaN" && bits !== nan || values2[i] === 0 && b[sign] & 128) return void 0;
    }
    return values2;
  }
  function byCodePoint(a, b) {
    const x = [...a], y = [...b];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      const d = x[i].codePointAt(0) - y[i].codePointAt(0);
      if (d) return d;
    }
    return x.length - y.length;
  }
  function canonical(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
    const o = v;
    return `{${Object.keys(o).sort(byCodePoint).map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  var utf84 = new TextEncoder();
  var size = (v) => utf84.encode(canonical(v)).length;
  function column(t) {
    if (t.class === "variable-length" && !holdsAddresses(t.base)) return "family";
    if (t.class === "reference" && t.kind === 0 && t.size === 8) return "paths";
    if (t.class === "reference" && t.kind === 1 && t.size === 12) return "regions";
    return void 0;
  }
  function refAddress(b) {
    const v = le2(b, 0, 8);
    return v > 0n && v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : void 0;
  }
  function unshuffle(data, item) {
    const n = Math.floor(data.length / item);
    if (item <= 1 || n <= 1) return data;
    const out2 = new Uint8Array(data.length);
    for (let j = 0; j < item; j++) for (let i = 0; i < n; i++) out2[i * item + j] = data[j * n + i];
    out2.set(data.subarray(n * item), n * item);
    return out2;
  }
  function shapeWith(entry2, dims, more) {
    if (dims.length !== 1) entry2.shape = dims;
    return Object.assign(entry2, more);
  }
  var KEYED = ["attributes", "names", "links", "images", "datatypes", "unsupported"];
  var LISTS = ["attribute_collisions", "collisions"];
  function merge(s, entry2) {
    for (const [k, v] of Object.entries(entry2)) {
      if (KEYED.includes(k) && v !== null) {
        const into = s[k] ??= {};
        for (const [key2, value2] of Object.entries(v)) setMember(into, key2, value2);
      } else if (LISTS.includes(k)) {
        (s[k] ??= []).push(...v);
      } else {
        s[k] = v;
      }
    }
  }
  var SHUFFLED = ["2", "2,1", "2,3", "2,1,3"];
  var REFERENCED = ["", "1", "3", "1,3"];
  var ALLOWED = [...REFERENCED, ...SHUFFLED];
  var Doc = class {
    s;
    entries = [];
    constructor(s) {
      this.s = s;
    }
  };
  function otherLink(kind, value2) {
    if (value2 === null) return { user: { type: kind, value: null } };
    if (kind === 64 && value2.length && value2[0] === 0) {
      const fileEnd = value2.indexOf(0, 1);
      const pathEnd = fileEnd > 0 ? value2.indexOf(0, fileEnd + 1) : -1;
      if (pathEnd === value2.length - 1) {
        return { external: { file: textJson(value2.subarray(1, fileEnd)), path: textJson(value2.subarray(fileEnd + 1, pathEnd)) } };
      }
    }
    return { user: { type: kind, value: base64(value2) } };
  }
  function bytesFamily(path2, values2) {
    const count = values2.length;
    const lengths = new Set(values2.map((v) => v.length));
    if (lengths.size === 1 && !lengths.has(0) && Math.max(...lengths) <= MAX_COPY) {
      const [length2] = lengths;
      return [{
        path: path2,
        dataType: "uint8",
        shape: [count, length2],
        chunkShape: [1, length2],
        dims: ["index", "byte"],
        chunks: new Map(values2.map((v, i) => [`${i}/0`, v]))
      }];
    }
    const offsets = new Uint8Array(8 * (count + 1));
    const view5 = new DataView(offsets.buffer);
    let total = 0;
    values2.forEach((v, i) => {
      view5.setBigInt64(8 * i, BigInt(total), true);
      total += v.length;
    });
    view5.setBigInt64(8 * count, BigInt(total), true);
    const plans = [{
      path: `${path2}/offsets`,
      dataType: "int64",
      shape: [count + 1],
      chunkShape: [count + 1],
      dims: ["index"],
      chunks: /* @__PURE__ */ new Map([["0", offsets]])
    }];
    if (total > 0) {
      const blob = new Uint8Array(total);
      let at = 0;
      for (const v of values2) {
        blob.set(v, at);
        at += v.length;
      }
      const size2 = Math.ceil(total / Math.ceil(total / RAGGED_CHUNK2));
      const chunks = /* @__PURE__ */ new Map();
      for (let c = 0; c < Math.ceil(total / size2); c++) {
        const chunk = new Uint8Array(size2);
        chunk.set(blob.subarray(c * size2, (c + 1) * size2));
        chunks.set(String(c), chunk);
      }
      plans.push({ path: `${path2}/data`, dataType: "uint8", shape: [total], chunkShape: [size2], dims: ["byte"], chunks });
    }
    return plans;
  }
  var Tree = class {
    used = 0;
    selections = 0;
    // bytes of selections read for region references (MAX_SELECTIONS)
    regions = /* @__PURE__ */ new Map();
    // "collection index" -> [object header, selection]
    objects = 0;
    seen = /* @__PURE__ */ new Map();
    // object header -> the path where the walk met it
    order = /* @__PURE__ */ new Map();
    // object header -> its place in the walk, its index in the object table
    parents = [];
    // the object table: each object's parent's index (-1 for the root)
    names = [];
    // and its key
    groups = [];
    // [path under the node, source metadata]
    plans = [];
    attributePlans = [];
    attributeGroups = [];
    docs = [];
    jobs = [];
    // arrays built once the object table is known
    arrays = 0;
    // attributes/<i> numbered so far
    spills = 0;
    // spilled/<i> numbered so far
    f;
    read;
    images;
    constructor(f, read, images) {
      this.f = f;
      this.read = read;
      this.images = images;
    }
    /** Numbers an object the walk meets, in the object table (§5.7). */
    meet(at, path2, parent, key2) {
      this.order.set(at, this.order.size);
      this.seen.set(at, path2);
      this.parents.push(parent === void 0 ? -1 : this.order.get(parent));
      this.names.push(utf84.encode(key2));
    }
    /** The index in the object table of the object at `at`, or null. */
    indexOf(at) {
      return at !== void 0 ? this.order.get(at) ?? null : null;
    }
    doc(s) {
      const d = new Doc(s);
      this.docs.push(d);
      return d;
    }
    /** A datatype's members (§5.2): its description, or, when it is named and the
     * walk met the committed datatype, its path alone. */
    typePart(t, named) {
      if (named === void 0) return { datatype: t };
      const index2 = this.order.get(named);
      return index2 !== void 0 ? { named: index2 } : { named: null, datatype: t };
    }
    // ---- attributes (§5.3)
    /** An object's attributes, in ascending byte order of their names: [key, name
     * as a text value when it must be given, message, collision, the message's
     * address], or null when they cannot be read. */
    async attributeItems(at) {
      let raw;
      const where2 = /* @__PURE__ */ new Map();
      try {
        raw = await this.f.attributes(at, where2);
      } catch (e) {
        if (e instanceof ImsError) return null;
        throw e;
      }
      const items = [];
      const keys = /* @__PURE__ */ new Set();
      for (const name of [...raw.keys()].sort()) {
        const bytes = bytesOf(name);
        const key2 = decodeText(bytes), text5 = textJson(bytes);
        const clash = keys.has(key2);
        keys.add(key2);
        items.push([key2, clash || typeof text5 !== "string" ? text5 : void 0, raw.get(name), clash, where2.get(name)]);
      }
      return items;
    }
    /** An attribute's value and its cost, held as JSON only within `room` (§5.6). */
    async attributeEntry(item, room) {
      const [key2, name, raw, clash, at] = item;
      const cost = (v) => size(v) + (clash ? 0 : size(key2));
      const value2 = await this.attribute(raw, name, (v) => cost(v) <= room, at);
      return [value2, cost(value2)];
    }
    /** An attribute's value; held as JSON when not large and `fits` allows it.
     * `at` is the message's address, so that the array form references its data. */
    async attribute(raw, name, fits, at) {
      let typeMessage, dims, data, named, t, start;
      try {
        const shared = attributeSharedType(raw);
        let committed;
        if (shared !== void 0) [committed, named] = await this.f.committed(shared);
        [typeMessage, dims, data, start] = attributeFull(raw, committed);
        [t] = describeType(typeMessage);
      } catch (e) {
        if (!(e instanceof ImsError)) throw e;
        return { reason: e.message, ...name !== void 0 ? { name } : {} };
      }
      const entry2 = this.typePart(t, named);
      if (name !== void 0) entry2.name = name;
      if (dims === null) {
        entry2.shape = null;
        return entry2;
      }
      if (this.used + data.length > MAX_VALUE_BYTES) return shapeWith(entry2, dims, { reason: "over the budget of attribute data" });
      this.used += data.length;
      const count = product2(dims);
      if (t.size === 0 && count > MAX_TEXT2) return shapeWith(entry2, dims, { reason: "more than 2^20 elements of no bytes" });
      let held, large, array2;
      const selections = this.selections;
      try {
        [held, large, array2] = await this.forms(t, dims, data, count, name === void 0 && named === void 0, at + start);
      } catch (e) {
        if (!(e instanceof ImsError)) throw e;
        this.selections = selections;
        return shapeWith(entry2, dims, { reason: e.message });
      }
      if (held !== void 0 && !large) {
        const value2 = Array.isArray(held) ? held[1] : { ...entry2, ...held };
        if (fits(value2)) return value2;
      }
      const path2 = `attributes/${this.arrays++}`;
      return Object.assign(entry2, array2(path2));
    }
    /** [the attribute's value as JSON, or undefined; whether it is large; the
     * array form, a function of its path giving its members] (§5.3). The file
     * holds the data at `at`, where the array form references it. */
    async forms(t, dims, data, count, plain, at) {
      const cls = t.class;
      if (cls === "string") {
        const array3 = (path2) => {
          this.jobs.push(["data", path2, "uint8", [data.length], 1, at, "little"]);
          return { array: path2, ...dims.length === 1 && dims[0] === data.length ? {} : { shape: dims } };
        };
        if (data.length > MAX_TEXT2) return [void 0, true, array3];
        let large = false;
        if (dims.length === 1 && t.size === 1 && !data.includes(0)) {
          const text5 = textJson(data);
          if (plain && t.size === 1 && t.padding === "null-terminated" && t.charset === "ascii") return [["bare", text5], large, array3];
          return [{ value: text5 }, large, array3];
        }
        const texts = [];
        if (t.size === 0) {
          for (let i = 0; i < count; i++) texts.push(new Uint8Array(0));
        } else {
          for (let i = 0; i < data.length; i += t.size) texts.push(elementText(data.subarray(i, i + t.size), t.padding));
        }
        if (!texts.includes(void 0)) return [put({}, dims, texts.map((b) => textJson(b))), large, array3];
        large ||= data.length > MAX_RAW;
        return [dataForm(dims, data), large, array3];
      }
      if (numeric(t) !== void 0) {
        const array3 = (path2) => {
          this.jobs.push(["data", path2, numeric(t), dims, t.size, at, t.order]);
          return shapeWith({}, dims, { array: path2 });
        };
        if (count > INLINE2) return [void 0, true, array3];
        const values2 = exactNumbers(t, count, data);
        if (values2 === void 0) return [dataForm(dims, data), data.length > MAX_RAW, array3];
        return [put({}, dims, values2), false, array3];
      }
      if (cls === "variable-length" && !holdsAddresses(t.base)) {
        const heap = [];
        for (let i = 0; i < count; i++) heap.push(await this.heapObject(t, data.subarray(16 * i, 16 * i + 16)));
        const array3 = (path2) => {
          this.jobs.push(["family", path2, heap, count]);
          return shapeWith({}, dims, { array: path2 });
        };
        if (heap.reduce((n, [, k]) => n + k, 0) > MAX_HEAP) return [void 0, true, array3];
        const values2 = [];
        for (const [where2, n] of heap) values2.push(vlenValue(t, await this.heapBytes(where2, n, true)));
        return [put({}, dims, values2), false, array3];
      }
      if (column(t) === "paths") {
        const refs = Array.from({ length: count }, (_, i) => refAddress(data.subarray(8 * i, 8 * i + 8)));
        const array3 = (path2) => {
          this.jobs.push(["index", path2, refs, dims, void 0, false]);
          return shapeWith({}, dims, { array: path2 });
        };
        return [put({}, dims, refs.map((a) => this.indexOf(a))), count > INLINE2, array3];
      }
      if (holdsAddresses(t)) {
        const n = t.size;
        const values2 = [];
        for (let i = 0; i < count; i++) values2.push(await this.structured(t, data.subarray(i * n, (i + 1) * n), true));
        const array3 = (path2) => {
          const text5 = utf84.encode(canonical(dims.length ? values2 : values2[0]));
          this.attributeArray(path2, "uint8", [text5.length], 1, text5, "little");
          return { json: path2, ...dims.length > 1 ? { shape: dims } : {} };
        };
        return [put({}, dims, values2), false, array3];
      }
      const array2 = (path2) => {
        this.jobs.push(["data", path2, "uint8", [...dims, t.size], 1, at, "little"]);
        return { array: path2, shape: dims };
      };
      if (data.length > MAX_RAW) return [void 0, true, array2];
      return [dataForm(dims, data), false, array2];
    }
    /** [address, size] of a variable-length element's bytes. */
    async heapObject(t, ref) {
      const n = u(ref, 0, 4), at = address(le2(ref, 4, 8));
      const size2 = t.string ? n : n * t.base.size;
      if (!n) return [0, 0];
      if (at === void 0) return reject4("a variable-length element at an undefined address");
      const [where2, stored] = await this.f.globalObject(at, u(ref, 12, 4));
      if (stored < size2) reject4("a variable-length element longer than its heap object");
      return [where2, size2];
    }
    /** Bytes of the global heap; `counted` reads them within the budget of attribute data. */
    async heapBytes(where2, n, counted) {
      if (counted) {
        if (this.used + n > MAX_VALUE_BYTES) reject4("over the budget of attribute data");
        this.used += n;
      }
      return n ? this.read(where2, n) : new Uint8Array(0);
    }
    /** An element of a datatype that holds addresses, as JSON (§5.3). */
    async structured(t, b, counted) {
      if (!holdsAddresses(t)) {
        if (numeric(t) !== void 0) {
          const v = exactNumbers(t, 1, b);
          if (v !== void 0) return v[0];
        }
        return base64(b);
      }
      if (t.class === "reference") {
        const kind = column(t);
        if (kind === "paths") return this.indexOf(refAddress(b));
        if (kind === "regions") return this.regionValue(await this.region(b));
        return reject4("a reference that is neither an object nor a region reference");
      }
      if (t.class === "variable-length") {
        const data = await this.heapBytes(...await this.heapObject(t, b), counted);
        if (!holdsAddresses(t.base)) return vlenValue(t, data);
        const n2 = t.base.size, out3 = [];
        for (let i = 0; i < u(b, 0, 4); i++) out3.push(await this.structured(t.base, data.subarray(i * n2, (i + 1) * n2), counted));
        return out3;
      }
      if (t.class === "compound") {
        const out3 = {};
        for (const m of t.members) {
          const mt = m.type, o = m.offset;
          if (o + mt.size > b.length) reject4("a compound member outside its compound");
          if (Object.hasOwn(out3, m.name)) reject4("compound members of the same name");
          setMember(out3, m.name, await this.structured(mt, b.subarray(o, o + mt.size), counted));
        }
        return out3;
      }
      const n = t.base.size, count = product2(t.shape);
      if (n * count > b.length) reject4("an array larger than its datatype");
      const out2 = [];
      for (let i = 0; i < count; i++) out2.push(await this.structured(t.base, b.subarray(i * n, (i + 1) * n), counted));
      return out2;
    }
    /** A region reference's [object header address, selection], or null for the
     * null reference (§8.9). Each reference counts the size of its global heap
     * object against the budget of selections; each object is read once. */
    async region(b) {
      const at = address(le2(b, 0, 8));
      if (at === void 0 || at === 0) return null;
      const index2 = u(b, 8, 4), key2 = `${at} ${index2}`;
      const [where2, n] = await this.f.globalObject(at, index2);
      if (this.selections + n > MAX_SELECTIONS) reject4("over the budget of region selections");
      this.selections += n;
      let found = this.regions.get(key2);
      if (found === void 0) {
        const d = n ? await this.read(where2, n) : new Uint8Array(0);
        found = [refAddress(d), parseSelection(d, 8)[0]];
        this.regions.set(key2, found);
      }
      return found;
    }
    /** A region reference as JSON (§5.3): null, or its object's index and its selection. */
    regionValue(found) {
      return found === null ? null : { object: this.indexOf(found[0]), selection: found[1] };
    }
    /** A copy of in-memory data as an array (conventions §7). */
    attributeArray(path2, dataType3, shape, item, data, endian, attributes, plans) {
      const [chunkShape, ranges] = planGrid(0, shape, item);
      const chunks = /* @__PURE__ */ new Map();
      for (const [k, parts] of ranges) {
        const pieces = parts.map((p) => p instanceof Uint8Array ? p : data.subarray(p[0], p[0] + p[1]));
        const c = new Uint8Array(pieces.reduce((n, p) => n + p.length, 0));
        let at = 0;
        for (const p of pieces) {
          c.set(p, at);
          at += p.length;
        }
        chunks.set(k, c);
      }
      (plans ?? this.attributePlans).push({
        path: path2,
        dataType: dataType3,
        shape,
        chunkShape,
        dims: void 0,
        chunks,
        fill: 0,
        endian,
        attributes
      });
    }
    attributeFamily(path2, plans) {
      if (plans[0].path !== path2) this.attributeGroups.push(path2);
      this.attributePlans.push(...plans);
    }
    // ---- settling the documents (§5.6)
    async settle(doc) {
      let kept = 0, spilling = false;
      const spilled = [];
      const offer = (entry2, cost) => {
        if (!spilling && kept + cost <= BUDGET) {
          merge(doc.s, entry2);
          kept += cost;
        } else {
          spilling = true;
          spilled.push(entry2);
        }
      };
      const room = () => spilling ? Number.MAX_SAFE_INTEGER : BUDGET - kept;
      const keyed = (section, key2, value2) => {
        const inner = {};
        setMember(inner, key2, value2);
        return { [section]: inner };
      };
      for (const e of doc.entries) {
        if (e[0] === "type") {
          const part = this.typePart(e[1], e[2]);
          offer(part, size(part));
        } else if (e[0] === "set") {
          offer(e[1], size(e[1]));
        } else if (e[0] === "keyed") {
          offer(keyed(e[1], e[2], e[3]), size(e[2]) + size(e[3]));
        } else if (e[0] === "list") {
          offer({ [e[1]]: [e[2]] }, size(e[2]));
        } else if (e[0] === "attrs") {
          if (e[1] === null) offer({ attributes: null }, size(null));
          for (const item of e[1] ?? []) {
            const [value2, cost] = await this.attributeEntry(item, room());
            offer(item[3] ? { attribute_collisions: [value2] } : keyed("attributes", item[0], value2), cost);
          }
        } else {
          const [, section, key2, make, items] = e;
          const value2 = make();
          let cost = size(key2) + size(value2);
          if (items === null) {
            value2.attributes = null;
            cost += size(null);
          }
          const held = {};
          const collided = [];
          for (const item of items ?? []) {
            const [v, c] = await this.attributeEntry(item, room() - cost);
            cost += c;
            if (item[3]) collided.push(v);
            else setMember(held, item[0], v);
          }
          if (Object.keys(held).length) value2.attributes = held;
          if (collided.length) value2.attribute_collisions = collided;
          offer(keyed(section, key2, value2), cost);
        }
      }
      if (spilled.length) {
        const path2 = `spilled/${this.spills++}`;
        doc.s.spilled = path2;
        this.attributeFamily(path2, bytesFamily(path2, spilled.map((e) => utf84.encode(canonical(e)))));
      }
    }
    /** Settles every document, then builds the object table and the arrays of indexes into it. */
    async finish() {
      for (const d of this.docs) await this.settle(d);
      const parents = new Uint8Array(4 * this.parents.length);
      this.parents.forEach((p, i) => new DataView(parents.buffer).setInt32(4 * i, p, true));
      this.attributeArray("objects/parent", "int32", [this.parents.length], 4, parents, "little");
      this.attributeFamily("objects/name", bytesFamily("objects/name", this.names));
      for (const job of this.jobs) {
        if (job[0] === "index") {
          const [, path2, refs, dims, s, dataset2] = job;
          const data = new Uint8Array(4 * refs.length);
          const view5 = new DataView(data.buffer);
          refs.forEach((a, i) => view5.setInt32(4 * i, a !== void 0 ? this.order.get(a) ?? -1 : -1, true));
          this.attributeArray(path2, "int32", dims, 4, data, "little", s, dataset2 ? this.plans : void 0);
        } else if (job[0] === "regions") {
          const [, path2, regions, s] = job;
          const texts = regions.map((r) => utf84.encode(canonical(this.regionValue(r))));
          this.family(path2, bytesFamily(path2, texts), s);
        } else if (job[0] === "data") {
          const [, path2, dataType3, shape, item, at, endian] = job;
          const [chunkShape, chunks] = await gridChunks(at, shape, item, this.read);
          this.attributePlans.push({ path: path2, dataType: dataType3, shape, chunkShape, dims: void 0, chunks, fill: 0, endian });
        } else {
          const [, path2, heap, count] = job;
          this.attributeFamily(path2, await familyPlans(path2, heap.map(([w, n], i) => [i, w, n]), this.read, count));
        }
      }
    }
    // ---- datasets (§5.4)
    /** A dataset's array, or its group: a family, a compound of several, or a null dataspace. */
    async dataset(at, path2) {
      const f = this.f;
      if ((await f.header(at)).some((m) => m.type === EXTERNAL_FILES)) reject4("its data is in external files");
      const ds = await f.dataset(at, true);
      const [t] = describeType(ds.typeMessage);
      const s = {};
      const doc = this.doc(s);
      doc.entries.push(["type", t, ds.named]);
      const attributes = ["attrs", await this.attributeItems(at)];
      if (ds.dims === null) {
        doc.entries.push(["set", { shape: null }]);
        if (ds.fill !== void 0 && !holdsAddresses(t)) doc.entries.push(["set", { fill: base64(ds.fill) }]);
        doc.entries.push(attributes);
        this.groups.push([path2, s]);
        return;
      }
      const count = product2(ds.dims);
      if (holdsAddresses(t)) {
        const kind = column(t);
        if (kind === void 0 && t.class !== "compound") {
          reject4(t.class === "variable-length" ? VLEN_REASON : t.class === "reference" ? "a reference that is neither an object nor a region reference" : "a datatype that holds references or variable-length data");
        }
        if (count > MAX_ELEMENTS) reject4(`more than ${MAX_ELEMENTS} elements that hold addresses`);
        if (kind !== void 0) {
          if (kind !== "paths") doc.entries.push(["set", { shape: ds.dims }]);
          doc.entries.push(attributes);
          const n = t.size;
          await this.column(path2, t, kind, await this.stored(ds, n * count), n, 0, count, ds.dims, s);
          return;
        }
        await this.compound(ds, t, path2, count, s);
        doc.entries.push(attributes);
        return;
      }
      const e = element(t);
      let base, extra, dataType3, endian, item;
      if (e !== void 0) {
        [base, extra] = e;
        [dataType3, endian, item] = [numeric(base), base.order, base.size];
      } else {
        [base, extra, dataType3, endian, item] = [void 0, [t.size], "uint8", "little", 1];
      }
      let fill = 0;
      if (ds.fill !== void 0) {
        const exact = exactFill(base, ds.fill);
        if (exact === void 0) doc.entries.push(["set", { fill: base64(ds.fill) }]);
        else fill = exact;
      }
      doc.entries.push(attributes);
      const shape = [...ds.dims, ...extra];
      const size2 = count * t.size;
      const zeros = (n) => new Array(n).fill(0);
      let compressor3;
      let chunkShape;
      let chunks = /* @__PURE__ */ new Map();
      if (ds.layout === "chunked") {
        const pipeline = ds.filters.join(",");
        if (!ALLOWED.includes(pipeline)) reject4(`unsupported HDF5 filters [${ds.filters.join(", ")}]`);
        chunkShape = [...ds.chunk, ...extra];
        const nbytes = product2(ds.chunk) * t.size;
        const implicit = ds.index === "implicit" ? await this.implicit(ds, shape, item, t.size) : void 0;
        if (implicit !== void 0) {
          [chunkShape, chunks] = implicit;
        } else {
          const masks = /* @__PURE__ */ new Map();
          const found = [...await f.chunks(ds, masks)].map(([k, ref]) => [splitKey(k), ref, masks.get(k) ?? 0]);
          found.sort(([a], [b]) => {
            for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
            return 0;
          });
          if (REFERENCED.includes(pipeline) && masks.size === 0) {
            compressor3 = ds.filters.includes(1) ? ZLIB : void 0;
            for (const [k, [where2, n0]] of found) {
              const n = n0 - (ds.filters.includes(3) ? 4 : 0);
              if (n < 1 || !ds.filters.includes(1) && n !== nbytes) reject4(`chunk ${showCoords(k)} of ${n} bytes, not ${nbytes}`);
              chunks.set(joinKey([...k, ...zeros(extra.length)]), [[where2, n]]);
            }
          } else {
            if (found.length * nbytes > MAX_COPY) reject4("data to decode of more than 2^24 bytes");
            for (const [k, [where2, n], mask] of found) {
              chunks.set(joinKey([...k, ...zeros(extra.length)]), await this.decodeChunk(ds, await this.read(where2, n), nbytes, mask));
            }
          }
        }
      } else if (ds.layout === "contiguous") {
        if (ds.dataAddress !== void 0 && ds.dataAddress + size2 > f.size) reject4("data outside the file");
        if (size2 === 0 || ds.dataAddress === void 0) {
          chunkShape = shape.map((v) => Math.max(1, v));
        } else {
          [chunkShape, chunks] = await gridChunks(ds.dataAddress, shape, item, this.read);
        }
      } else {
        if (ds.compact.length < size2) reject4("truncated compact dataset");
        chunkShape = shape.map((v) => Math.max(1, v));
        if (size2) chunks.set(joinKey(zeros(shape.length)), ds.compact.slice(0, size2));
      }
      this.plans.push({ path: path2, dataType: dataType3, shape, chunkShape, dims: void 0, chunks, fill, attributes: s, endian, compressor: compressor3 });
    }
    /** [chunk shape, chunks] of an implicitly indexed dataset (§5.4) whose chunks
     * are its elements in row-major order: cut as contiguous values; or whose
     * chunk shape is 1 but along its last dimension: a chunk per row, its chunks'
     * adjacent runs one range. Undefined for any other. */
    async implicit(ds, shape, item, size2) {
      const dims = ds.dims, rank = dims.length;
      if (ds.indexAddress === void 0 || dims.includes(0)) return void 0;
      const maxgrid = this.f.implicit(ds);
      const nbytes = product2(ds.chunk) * size2;
      if (rank === 0 || maxgrid.slice(1).every((m, i) => m === ds.grid[i + 1]) && rowMajor(ds)) {
        return gridChunks(ds.indexAddress, shape, item, this.read);
      }
      const n = dims[rank - 1] * size2;
      if (ds.chunk.slice(0, -1).some((c) => c !== 1) || ds.grid[rank - 1] < 2 || n > MAX_CHUNK3) return void 0;
      const chunks = /* @__PURE__ */ new Map();
      const tail = new Array(shape.length - rank).fill(0);
      const outer = ds.grid.slice(0, -1);
      for (let i = 0; i < product2(outer); i++) {
        const coords = unravel(i, outer);
        chunks.set(joinKey([...coords, 0, ...tail]), [[ds.indexAddress + ravel([...coords, 0], maxgrid) * nbytes, n]]);
      }
      return [[...new Array(rank - 1).fill(1), dims[rank - 1], ...shape.slice(rank)], chunks];
    }
    /** Elements that hold addresses as an array (§5.4): a family of their
     * variable-length values, the indexes of the objects they refer to in the
     * object table, or a family of region references. Element `i` of the
     * `count` is the bytes of `data` at `i * stride + offset`, read in place
     * (no copy or view of each is kept: memory per element is its result's). */
    async column(path2, t, kind, data, stride, offset, count, dims, s) {
      const n = t.size;
      const element2 = (i) => data.subarray(i * stride + offset, i * stride + offset + n);
      if (kind === "family") {
        const members = [];
        for (let i = 0; i < count; i++) members.push([i, ...await this.heapObject(t, element2(i))]);
        this.family(path2, await familyPlans(path2, members, this.read, count), s);
      } else if (kind === "paths") {
        this.jobs.push(["index", path2, Array.from({ length: count }, (_, i) => refAddress(element2(i))), dims, s, true]);
      } else {
        const regions = [];
        for (let i = 0; i < count; i++) regions.push(await this.region(element2(i)));
        this.jobs.push(["regions", path2, regions, s]);
      }
    }
    /** A compound dataset with members that hold addresses (§5.4): the group of its
     * bytes, those members' zeroed, and of each such member's array. */
    async compound(ds, t, path2, count, s) {
      const members = [];
      t.members.forEach((m, i) => {
        if (!holdsAddresses(m.type)) return;
        const kind = column(m.type);
        if (kind === void 0 || m.offset + m.type.size > t.size) {
          reject4("a compound member that holds addresses other than as variable-length data or a reference");
        }
        members.push([i, m.offset, m.type, kind]);
      });
      const n = t.size;
      if (count * n > MAX_COPY) reject4("a compound of more than 2^24 bytes");
      const data = (await this.stored(ds, count * n)).slice();
      for (const [i, o, mt, kind] of members) await this.column(`${path2}/${i}`, mt, kind, data, n, o, count, ds.dims, void 0);
      for (const [, o, mt] of members) for (let k = 0; k < count; k++) data.fill(0, k * n + o, k * n + o + mt.size);
      this.attributeArray(`${path2}/data`, "uint8", [...ds.dims, n], 1, data, "little", void 0, this.plans);
      this.groups.push([path2, s]);
    }
    /** A family (conventions §7) with its source metadata: on its 2-D array, or on its group. */
    family(path2, plans, s) {
      if (plans.length && plans[0].path === path2) plans[0].attributes = s;
      else this.groups.push([path2, s ?? {}]);
      this.plans.push(...plans);
    }
    /** A chunk's bytes, its filters undone: Fletcher32's checksum removed, deflate
     * inflated (one zlib stream of the chunk's size) and the shuffle undone, but
     * for the filters its filter mask skips. */
    async decodeChunk(ds, data, nbytes, mask) {
      if (!ALLOWED.includes(ds.filters.join(","))) reject4(`unsupported HDF5 filters [${ds.filters.join(", ")}]`);
      const filters = ds.filters.filter((_, i) => !(i < 32 && mask >>> i & 1));
      if (filters.includes(3)) data = data.length > 4 ? data.subarray(0, data.length - 4) : new Uint8Array(0);
      if (filters.includes(1)) data = await inflate(data, nbytes);
      if (data.length !== nbytes) reject4("a chunk that does not decode to its size");
      return filters.includes(2) ? unshuffle(data, ds.datatype.size) : data;
    }
    /** The whole data of a dataset of `size` bytes, read and decoded. */
    async stored(ds, size2) {
      const f = this.f;
      if (ds.layout === "compact") {
        if (ds.compact.length < size2) reject4("truncated compact dataset");
        return ds.compact.subarray(0, size2);
      }
      if (ds.layout === "contiguous") {
        if (ds.dataAddress === void 0) return new Uint8Array(size2);
        if (ds.dataAddress + size2 > f.size) reject4("data outside the file");
        return this.read(ds.dataAddress, size2);
      }
      if (!ALLOWED.includes(ds.filters.join(","))) reject4(`unsupported HDF5 filters [${ds.filters.join(", ")}]`);
      const e = ds.datatype.size;
      const chunkBytes = product2(ds.chunk) * e;
      if (chunkBytes > MAX_COPY) reject4("a chunk of more than 2^24 bytes to decode");
      const out2 = new Uint8Array(size2);
      const masks = /* @__PURE__ */ new Map();
      const found = [...await f.chunks(ds, masks)].map(([k, ref]) => [splitKey(k), ref, masks.get(k) ?? 0]);
      found.sort(([a], [b]) => {
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
        return 0;
      });
      for (const [key2, [at, n], mask] of found) {
        const data = await this.decodeChunk(ds, await this.read(at, n), chunkBytes, mask);
        scatter(out2, ds.dims, e, data, ds.chunk, key2.map((c, i) => c * ds.chunk[i]));
      }
      return out2;
    }
    // ---- unsupported objects (§5.5)
    /** What can be read of an object that is not mapped: its datatype, shape,
     * fill value, external files or virtual mappings, and attributes. */
    async unsupported(at, reason) {
      const f = this.f;
      const record = {};
      let messages;
      try {
        messages = await f.header(at);
      } catch (e) {
        if (e instanceof ImsError) return [() => ({ reason }), []];
        throw e;
      }
      const types = new Set(messages.map((m) => m.type));
      let typed2;
      const attempt = async (step) => {
        try {
          await step();
        } catch (e) {
          if (!(e instanceof ImsError)) throw e;
        }
      };
      if (types.has(LAYOUT) || types.has(DATATYPE)) {
        await attempt(async () => {
          const [typeMessage, named] = await f.datatype(messages);
          typed2 = [describeType(typeMessage)[0], named];
        });
      }
      if (types.has(LAYOUT)) {
        await attempt(() => {
          record.shape = parseDataspace(Hdf5.message(messages, DATASPACE, true)).dims;
        });
        await attempt(() => {
          const message = Hdf5.message(messages, FILL_VALUE, false);
          const fill = message !== void 0 ? fillValue(message) : new Uint8Array(0);
          if (fill.length && typed2 !== void 0 && !holdsAddresses(typed2[0])) record.fill = base64(fill);
        });
        await attempt(async () => {
          const efl = Hdf5.message(messages, EXTERNAL_FILES, false);
          if (efl !== void 0) record.external = await this.externalFiles(efl);
        });
        await attempt(async () => {
          const layout = Hdf5.message(messages, LAYOUT, true);
          if (u(layout, 1, 1) === 3) record.virtual = await f.virtualMapping(layout);
        });
      }
      const make = () => ({ reason, ...typed2 !== void 0 ? this.typePart(...typed2) : {}, ...record });
      return [make, await this.attributeItems(at)];
    }
    /** The files of an external data files message (§8.9). */
    async externalFiles(d) {
      if (u(d, 0, 1) !== 1) reject4("unsupported external data files message version");
      const used = u(d, 6, 2), heap = address(le2(d, 8, 8));
      if (heap === void 0) return reject4("external data files without a local heap");
      const names = await this.f.localHeap(heap);
      const out2 = [];
      for (let i = 0; i < used; i++) {
        const p = 16 + 24 * i;
        const offset = le2(d, p, 8);
        const end = offset < BigInt(names.length) ? names.indexOf(0, Number(offset)) : -1;
        if (end < 0) reject4("an external file name outside the local heap");
        out2.push({
          file: textJson(names.subarray(Number(offset), end)),
          offset: jsonNumber(le2(d, p + 8, 8)),
          size: jsonNumber(le2(d, p + 16, 8))
        });
      }
      return out2;
    }
    // ---- groups (§5.1)
    async kind(at) {
      const types = new Set((await this.f.header(at)).map((m) => m.type));
      if (types.has(LAYOUT)) return "dataset";
      if (types.has(SYMBOL_TABLE) || types.has(LINK_INFO)) return "group";
      if (types.has(DATATYPE)) return "datatype";
      return reject4("an object that is not a group, a dataset or a named datatype");
    }
    async walk() {
      const f = this.f;
      this.meet(f.root, "/", void 0, "");
      this.objects = 1;
      const stack = [[f.root, "/", "hdf5"]];
      while (stack.length) {
        const [at, path2, zpath] = stack.pop();
        const s = {};
        const doc = this.doc(s);
        doc.entries.push(["attrs", await this.attributeItems(at)]);
        const links = await f.links(at);
        const keys = /* @__PURE__ */ new Set();
        let overflow = 0;
        const children = [];
        for (const name of [...links.keys()].sort()) {
          const bytes = bytesOf(name);
          const key2 = decodeText(bytes), text5 = textJson(bytes);
          if (keys.has(key2)) {
            doc.entries.push(["list", "collisions", text5]);
            continue;
          }
          keys.add(key2);
          if (typeof text5 !== "string") doc.entries.push(["keyed", "names", key2, text5]);
          const target = links.get(name);
          const child = (path2 !== "/" ? path2 : "") + "/" + key2, zchild = `${zpath}/${key2}`;
          if ("soft" in target) {
            doc.entries.push(["keyed", "links", key2, { soft: textJson(bytesOf(target.soft)) }]);
          } else if ("other" in target) {
            doc.entries.push(["keyed", "links", key2, otherLink(target.other, target.value)]);
          } else if (this.seen.has(target.hard)) {
            doc.entries.push(["keyed", "links", key2, { hard: this.order.get(target.hard) }]);
          } else if (this.objects >= MAX_OBJECTS + PER_IMAGE * this.images.size) {
            overflow++;
          } else {
            this.objects++;
            this.meet(target.hard, child, at, key2);
            try {
              await this.member(target.hard, child, zchild, key2, doc, children);
            } catch (e) {
              if (!(e instanceof ImsError)) throw e;
              doc.entries.push(["member", "unsupported", key2, ...await this.unsupported(target.hard, e.message)]);
            }
          }
        }
        if (overflow) s.overflow = overflow;
        this.groups.push([zpath, s]);
        for (const child of children.reverse()) stack.push(child);
      }
      await this.finish();
    }
    /** A group's member: a named datatype, an image dataset, or (named as a Zarr
     * node) a group (walked later) or a dataset. */
    async member(at, path2, zpath, key2, doc, children) {
      const kind = await this.kind(at);
      if (kind === "datatype") {
        const t = describeType(Hdf5.message(await this.f.header(at), DATATYPE, true))[0];
        doc.entries.push(["member", "datatypes", key2, () => ({ datatype: t }), await this.attributeItems(at)]);
        return;
      }
      const image = this.images.get(at);
      if (image !== void 0) {
        doc.entries.push(["member", "images", key2, () => ({ ...image }), await this.attributeItems(at)]);
        return;
      }
      if (!nodeName(key2)) reject4("the name is not a Zarr node name");
      if (kind === "group") {
        await this.f.links(at);
        children.push([at, path2, zpath]);
        return;
      }
      const mark = [
        this.plans.length,
        this.groups.length,
        this.docs.length,
        this.jobs.length,
        this.attributePlans.length,
        this.attributeGroups.length,
        this.selections
      ];
      try {
        await this.dataset(at, zpath);
      } catch (e) {
        this.selections = mark[6];
        this.plans.length = mark[0];
        this.groups.length = mark[1];
        this.docs.length = mark[2];
        this.jobs.length = mark[3];
        this.attributePlans.length = mark[4];
        this.attributeGroups.length = mark[5];
        throw e;
      }
    }
    /** The source metadata node's entries. */
    entries() {
      const group2 = (key2, attributes) => ({ key: `${key2}/zarr.json`, bytes: utf84.encode(stringifyJson({ zarr_format: 3, node_type: "group", attributes })), compress: true });
      const out2 = [group2(SOURCE_NODE, {})];
      for (const [path2, s] of this.groups) {
        out2.push(group2(`${SOURCE_NODE}/${path2}`, Object.keys(s).length ? declare({}, "ims", void 0, s) : {}));
      }
      if (this.arrays) out2.push(group2(`${SOURCE_NODE}/attributes`, {}));
      if (this.spills) out2.push(group2(`${SOURCE_NODE}/spilled`, {}));
      out2.push(group2(`${SOURCE_NODE}/objects`, {}));
      for (const path2 of this.attributeGroups) out2.push(group2(`${SOURCE_NODE}/${path2}`, {}));
      for (const a of [...this.plans, ...this.attributePlans]) {
        const entries = planEntries(SOURCE_NODE, {
          ...a,
          attributes: a.attributes && Object.keys(a.attributes).length ? declare({}, "ims", void 0, a.attributes) : void 0
        });
        for (const e of entries) out2.push(e);
      }
      return out2;
    }
  };
  function rowMajor(ds) {
    const dims = ds.dims;
    let a = 0;
    dims.forEach((n, i) => {
      if (ds.chunk[i] !== n) a = i;
    });
    if (ds.chunk.slice(0, a).some((c) => c !== 1)) return false;
    return dims[a] % ds.chunk[a] === 0 || product2(dims.slice(0, a)) === 1;
  }
  function vlenValue(t, data) {
    if (t.string) return textJson(data);
    const values2 = exactNumbers(t.base, t.base.size ? Math.floor(data.length / t.base.size) : 0, data);
    return values2 !== void 0 ? values2 : base64(data);
  }
  function dataForm(dims, data) {
    return { data: base64(data), ...dims.length !== 1 ? { shape: dims } : {} };
  }
  async function sourceTree(f, read, images) {
    const tree = new Tree(f, read, images);
    await tree.walk();
    return tree;
  }

  // src/virtualize/ims/virtualize.ts
  var MAX_LEVELS = 64;
  var MAX_DATASETS = 1e5;
  var MAX_CHANNELS = 64;
  var MAX_NAME = 256;
  var DECIMAL3 = /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?$/;
  var DIGITS = /^[0-9]+$/;
  var TIMESTAMP = /^([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]+))?$/;
  var LENGTH_UNITS = {
    "\xB5m": "micrometer",
    "\u03BCm": "micrometer",
    "um": "micrometer",
    "nm": "nanometer",
    "mm": "millimeter",
    "cm": "centimeter",
    "m": "meter",
    "\xC5": "angstrom",
    "\u212B": "angstrom",
    "pm": "picometer",
    "in": "inch",
    "ft": "foot"
  };
  var reject5 = (message) => {
    throw new ImsError(message);
  };
  var trim = (s) => s.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
  function text(attrs, name) {
    const d = attrs.get(name);
    if (d === void 0) return void 0;
    const [datatype, data] = attributeValue(d);
    if (datatype.cls !== 3) reject5(`attribute ${name} is not a string`);
    const raw = untilNul(data);
    try {
      return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw);
    } catch {
      return latin13(raw);
    }
  }
  function decimal(s) {
    if (s === void 0 || !DECIMAL3.test(trim(s))) return void 0;
    const v = Number(trim(s));
    return Number.isFinite(v) ? v : void 0;
  }
  function decimals(s, n) {
    if (s === void 0) return void 0;
    const parts = trim(s).split(/[ \t\r\n]+/);
    if (parts.length !== n) return void 0;
    const values2 = parts.map(decimal);
    return values2.every((v) => v !== void 0) ? values2 : void 0;
  }
  function days(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    const era = Math.floor(y / 400);
    const yoe = y - era * 400;
    const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function timestamp(s) {
    const m = s === void 0 ? null : s.match(TIMESTAMP);
    if (m === null) return void 0;
    const [y, mo, d, h, mi, sec] = m.slice(1, 7).map(Number);
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= monthDays[mo - 1] && h <= 23 && mi <= 59 && sec <= 59)) {
      return void 0;
    }
    return [days(y, mo, d) * 86400 + h * 3600 + mi * 60 + sec, Number("0." + (m[7] ?? "0"))];
  }
  function dataType(dt) {
    const order = dt.bits & 1 ? "big" : "little";
    if (dt.cls === 0 && (dt.size === 1 || dt.size === 2 || dt.size === 4)) {
      if (u(dt.props, 0, 2) !== 0 || u(dt.props, 2, 2) !== 8 * dt.size) reject5("fixed-point data with padding bits");
      const bits = 8 * dt.size;
      const byteOrder = bits > 8 ? order : void 0;
      if (dt.bits & 8) return [`int${bits}`, byteOrder, [-(2 ** (bits - 1)), 2 ** (bits - 1) - 1]];
      return [`uint${bits}`, byteOrder, [0, 2 ** bits - 1]];
    }
    if (dt.cls === 1 && dt.size === 4) {
      const props = [u(dt.props, 0, 2), u(dt.props, 2, 2), ...dt.props.subarray(4, 8), u(dt.props, 8, 4)];
      if (dt.bits & 64 || (dt.bits >> 4 & 3) !== 2 || (dt.bits >> 8 & 255) !== 31 || props.join() !== [0, 32, 23, 8, 0, 23, 127].join()) {
        reject5("floating-point data that is not IEEE binary32");
      }
      return ["float32", order, void 0];
    }
    return reject5(`unsupported HDF5 datatype (class ${dt.cls}, ${dt.size} bytes)`);
  }
  async function virtualizeIms(url2, read, fileSize) {
    const f = await Hdf5.open(read, fileSize);
    const follow = async (links, name2) => {
      if (!links.has(name2)) reject5(`no ${name2}`);
      return f.follow(links, name2);
    };
    const root = await f.links(f.root);
    if (!root.has("DataSet")) reject5("not an Imaris file (no DataSet group)");
    const dataset2 = await f.links(await follow(root, "DataSet"));
    if (!dataset2.has("ResolutionLevel 0")) reject5("not an Imaris file (no ResolutionLevel 0)");
    let levels = 0;
    while (dataset2.has(`ResolutionLevel ${levels}`)) {
      levels++;
      if (levels > MAX_LEVELS) reject5(`more than ${MAX_LEVELS} resolution levels`);
    }
    const level0 = await f.links(await follow(dataset2, "ResolutionLevel 0"));
    let times = 0;
    while (level0.has(`TimePoint ${times}`)) times++;
    if (times === 0) reject5("no TimePoint 0");
    const firstTime = await f.links(await follow(level0, "TimePoint 0"));
    let channels = 0;
    while (firstTime.has(`Channel ${channels}`)) channels++;
    if (channels === 0) reject5("no Channel 0");
    if (levels * times * channels > MAX_DATASETS) reject5(`more than ${MAX_DATASETS} datasets`);
    let type;
    const levelInfo = [];
    const chunkRefs = [];
    const images = /* @__PURE__ */ new Map();
    for (let r = 0; r < levels; r++) {
      const links = r === 0 ? level0 : await f.links(await follow(dataset2, `ResolutionLevel ${r}`));
      let info;
      for (let t = 0; t < times; t++) {
        const timeLinks = r === 0 && t === 0 ? firstTime : await f.links(await follow(links, `TimePoint ${t}`));
        for (let c = 0; c < channels; c++) {
          const channel = await follow(timeLinks, `Channel ${c}`);
          const attrs = await f.attributes(channel);
          const sizes = ["Z", "Y", "X"].map((axis) => {
            const s = text(attrs, `ImageSize${axis}`);
            const v = s === void 0 || !DIGITS.test(trim(s)) ? 0 : Number(trim(s));
            if (!(v >= 1 && v <= Number.MAX_SAFE_INTEGER)) reject5(`ImageSize${axis} of level ${r} is not a positive integer`);
            return v;
          });
          const dataAt = await follow(await f.links(channel), "Data");
          const ds = await f.dataset(dataAt);
          images.set(dataAt, { level: r, t, c, shape: [...ds.dims] });
          const dt = dataType(ds.datatype);
          if (ds.dims.length !== 3) reject5(`a dataset of level ${r} is not 3-dimensional`);
          if (sizes.some((s, i) => s > ds.dims[i])) reject5(`the image of level ${r} is larger than its dataset`);
          if (!(ds.filters.length === 0 || ds.filters.length === 1 && ds.filters[0] === 1)) {
            reject5(`unsupported HDF5 filters [${ds.filters.join(", ")}]`);
          }
          if (type === void 0) type = dt;
          else if (dt[0] !== type[0] || dt[1] !== type[1]) reject5("the datasets have different data types");
          const here = { sizes, chunk: ds.chunk, compressed: ds.filters.length > 0 };
          if (info === void 0) info = here;
          else if (JSON.stringify(here) !== JSON.stringify(info)) {
            reject5(`the datasets of level ${r} differ in size, chunk shape or filters`);
          }
          for (const [key2, ref] of await f.chunks(ds)) chunkRefs.push([r, t, c, key2.split("/").map(Number), ref]);
        }
      }
      levelInfo.push(info);
    }
    const [dtype, endian, range] = type;
    const meta = root.has("DataSetInfo") ? await f.links(await follow(root, "DataSetInfo")) : /* @__PURE__ */ new Map();
    const metaAttrs = async (name2) => {
      if (!meta.has(name2)) return /* @__PURE__ */ new Map();
      const at = await f.follow(meta, name2);
      await f.links(at);
      return f.attributes(at);
    };
    const image = await metaAttrs("Image");
    const extMin = [0, 1, 2].map((i) => decimal(text(image, `ExtMin${i}`)));
    const extMax = [0, 1, 2].map((i) => decimal(text(image, `ExtMax${i}`)));
    const unitText = text(image, "Unit");
    const bytes = (s) => new TextEncoder().encode(s).length;
    let name = text(image, "Name");
    if (name !== void 0 && bytes(name) > MAX_NAME) name = void 0;
    const labels = [], colors = [], ranges = [];
    for (let c = 0; c < (channels <= MAX_CHANNELS ? channels : 0); c++) {
      const attrs = await metaAttrs(`Channel ${c}`);
      const label = text(attrs, "Name");
      labels.push(label && bytes(label) <= MAX_NAME ? label : `Channel ${c}`);
      const rgb = decimals(text(attrs, "Color"), 3);
      colors.push(rgb !== void 0 && rgb.every((v) => v >= 0 && v <= 1) ? rgb.map((v) => Math.floor(v * 255 + 0.5).toString(16).toUpperCase().padStart(2, "0")).join("") : "FFFFFF");
      ranges.push(decimals(text(attrs, "ColorRange"), 2));
    }
    const timeAttrs = await metaAttrs("TimeInfo");
    let period;
    if (times > 1) {
      const first = timestamp(text(timeAttrs, "TimePoint1"));
      const last = timestamp(text(timeAttrs, `TimePoint${times}`));
      if (first !== void 0 && last !== void 0) {
        const elapsed = last[0] - first[0] + (last[1] - first[1]);
        if (elapsed > 0) period = elapsed / (times - 1);
      }
    }
    const z0 = levelInfo[0].sizes[0];
    const hasZ = z0 > 1 || levelInfo.some((l) => l.chunk[0] > 1);
    const axes = [...times > 1 ? ["t"] : [], ...channels > 1 ? ["c"] : [], ...hasZ ? ["z"] : [], "y", "x"];
    if (z0 === 1 && levelInfo.some((l) => l.sizes[0] !== 1)) reject5("a level has more than one z plane, and level 0 has one");
    const unit = !unitText ? "micrometer" : Object.hasOwn(LENGTH_UNITS, unitText) ? LENGTH_UNITS[unitText] : void 0;
    const extent2 = {};
    for (const [axis, i] of [["x", 0], ["y", 1], ["z", 2]]) {
      if (extMin[i] === void 0 || extMax[i] === void 0) continue;
      const e = extMax[i] - extMin[i];
      if (!Number.isFinite(e)) reject5(`ExtMax${i} - ExtMin${i} is not finite`);
      if (e > 0) extent2[axis] = e;
    }
    const spatial = axes.filter((a) => a === "z" || a === "y" || a === "x");
    const units = { t: period !== void 0 ? "second" : void 0 };
    for (const a of spatial) units[a] = a in extent2 ? unit : void 0;
    const types = { t: "time", c: "channel", z: "space", y: "space", x: "space" };
    const translation = spatial.every((a) => a in extent2) ? axes.map((a) => a === "x" ? extMin[0] : a === "y" ? extMin[1] : a === "z" ? extMin[2] : 0) : void 0;
    const utf89 = new TextEncoder();
    const json = (v) => utf89.encode(stringifyJson(v));
    const datasets = levelInfo.map((l, r) => {
      const n = { z: l.sizes[0], y: l.sizes[1], x: l.sizes[2] };
      const scale = axes.map((a) => a === "t" ? period ?? 1 : a === "c" ? 1 : a in extent2 ? extent2[a] / n[a] : 1);
      return {
        path: String(r),
        coordinateTransformations: [
          { type: "scale", scale },
          ...translation ? [{ type: "translation", translation }] : []
        ]
      };
    });
    const omeroChannels = labels.map((label, k) => {
      const rng = ranges[k];
      let window2 = {};
      if (range !== void 0) {
        const [start, end] = rng ?? range;
        window2 = { window: { min: range[0], max: range[1], start, end } };
      } else if (rng !== void 0) {
        window2 = { window: { min: rng[0], max: rng[1], start: rng[0], end: rng[1] } };
      }
      return { label, color: colors[k], active: true, ...window2 };
    });
    const entries = [{
      key: "zarr.json",
      bytes: json({
        zarr_format: 3,
        node_type: "group",
        attributes: declare({
          ome: {
            version: "0.5",
            multiscales: [{
              ...name ? { name } : {},
              axes: axes.map((a) => ({ name: a, type: types[a], ...units[a] ? { unit: units[a] } : {} })),
              datasets
            }],
            ...channels <= MAX_CHANNELS ? { omero: { channels: omeroChannels } } : {}
          }
        }, "ims", url2)
      })
    }];
    for (const [r, l] of levelInfo.entries()) {
      const shape = { t: times, c: channels, z: l.sizes[0], y: l.sizes[1], x: l.sizes[2] };
      const chunkShape = { t: 1, c: 1, z: l.chunk[0], y: l.chunk[1], x: l.chunk[2] };
      entries.push({
        key: `${r}/zarr.json`,
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape: axes.map((a) => shape[a]),
          data_type: dtype,
          chunk_grid: { name: "regular", configuration: { chunk_shape: axes.map((a) => chunkShape[a]) } },
          chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
          fill_value: 0,
          codecs: [
            endian ? { name: "bytes", configuration: { endian } } : { name: "bytes" },
            ...l.compressed ? [{ name: "zlib", configuration: { level: 1 } }] : []
          ],
          dimension_names: axes,
          attributes: {}
        })
      });
    }
    let chunks = 0;
    for (const [r, t, c, coords, [offset, length2]] of chunkRefs) {
      const { sizes, chunk } = levelInfo[r];
      if (coords.some((i, k) => i * chunk[k] >= sizes[k])) continue;
      const index2 = { t, c, z: coords[0], y: coords[1], x: coords[2] };
      const ranges2 = [{ source: 0, offset: BigInt(offset), length: BigInt(length2) }];
      entries.push({ key: `${r}/c/${axes.map((a) => index2[a]).join("/")}`, ranges: ranges2 });
      chunks++;
    }
    for (const e of (await sourceTree(f, f.read, images)).entries()) entries.push(e);
    return {
      sources: [{ url: url2 }],
      entries,
      summary: {
        levels,
        sizes: { t: times, c: channels, z: levelInfo[0].sizes[0], y: levelInfo[0].sizes[1], x: levelInfo[0].sizes[2] },
        dataType: dtype,
        chunkShape: levelInfo[0].chunk,
        compressed: levelInfo.map((l) => l.compressed),
        chunks,
        channels: labels
      }
    };
  }

  // src/virtualize/ir/wasm_browser.ts
  var url;
  async function compileIr() {
    const at = url ?? new URL("vzip_ir.wasm", globalThis.location?.href);
    const response2 = await fetch(at);
    if (!response2.ok) throw new Error(`cannot fetch the IR core's wasm module ${String(at)}: HTTP ${response2.status}`);
    if ((response2.headers.get("Content-Type") ?? "").split(";")[0].trim() === "application/wasm") {
      return WebAssembly.compileStreaming(response2);
    }
    return WebAssembly.compile(await response2.arrayBuffer());
  }

  // src/virtualize/ir/wasm.ts
  var instance;
  function ir() {
    instance ??= (async () => {
      const module = await compileIr();
      const { exports } = await WebAssembly.instantiate(module, {});
      return exports;
    })();
    instance.catch(() => instance = void 0);
    return instance;
  }
  function put2(w, bytes) {
    const p = w.vz_alloc(bytes.length) >>> 0;
    new Uint8Array(w.memory.buffer, p, bytes.length).set(bytes);
    return p;
  }
  function out(w, n) {
    return new Uint8Array(w.memory.buffer, w.vz_out() >>> 0, n).slice();
  }

  // src/virtualize/ir/run.ts
  var CODES = { nd2: 0, tiff: 1, czi: 2 };
  var utf85 = new TextEncoder();
  var text2 = (b) => new TextDecoder().decode(b);
  function rejection(w, r) {
    return new ImageError(text2(out(w, -r)));
  }
  async function virtualizeIr(format, url2, source, options = {}) {
    const w = await ir();
    const p = w.vz_run_new(CODES[format], BigInt(source.size), source.remote ? 1 : 0, source.concurrency);
    let live = true;
    try {
      if (!source.multirange) w.vz_run_multirange(p, 0);
      const settings = source.planner;
      if (settings) w.vz_run_settings(p, settings.byteCost ?? -1, BigInt(settings.wholeBelow ?? 1 << 20));
      const head = source.head;
      if (head !== void 0 && head.data.length > 0) {
        w.vz_run_seed(p, BigInt(head.offset), put2(w, head.data), head.data.length);
        w.vz_run_observe(p, BigInt(head.data.length), head.seconds);
      }
      for (; ; ) {
        options.signal?.throwIfAborted();
        const r = Number(w.vz_run_poll(p));
        if (r < 0) throw rejection(w, r);
        if (r === 0) break;
        await perform(w, p, source, decodeRequests(out(w, r - 1)), options.signal);
      }
      live = false;
      const u2 = utf85.encode(url2);
      const n = Number(w.vz_run_output(p, put2(w, u2), u2.length, options.mirror === false ? 0 : 1));
      if (n < 0) throw rejection(w, n);
      return { format, ...decodeOutput(out(w, n)) };
    } finally {
      if (live) w.vz_run_free(p);
    }
  }
  function decodeRequests(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let at = 0;
    const u322 = () => (at += 4, v.getUint32(at - 4, true));
    const u643 = () => (at += 8, Number(v.getBigUint64(at - 8, true)));
    const reqs = [];
    for (let k = u322(); k > 0; k--) {
      const spans = [];
      for (let n = u322(); n > 0; n--) spans.push([u643(), u643()]);
      reqs.push(spans);
    }
    return reqs;
  }
  async function perform(w, p, source, reqs, signal) {
    const abort = new AbortController();
    const onAbort = () => abort.abort(signal?.reason);
    signal?.addEventListener("abort", onAbort, { once: true });
    let next = 0;
    let failure;
    const worker = async () => {
      while (failure === void 0 && next < reqs.length) {
        const k = next++;
        try {
          const t = performance.now();
          const parts = await source.fetch(reqs[k], abort.signal);
          const seconds = (performance.now() - t) / 1e3;
          if (failure !== void 0) return;
          let r;
          if (parts === null) {
            r = Number(w.vz_run_complete(p, k, 0, 0, 0, seconds));
          } else {
            const n = parts.reduce((s, x) => s + x.length, 0);
            const ptr = w.vz_alloc(n) >>> 0;
            const mem = new Uint8Array(w.memory.buffer, ptr, n);
            let at = 0;
            for (const x of parts) {
              mem.set(x, at);
              at += x.length;
            }
            r = Number(w.vz_run_complete(p, k, 1, ptr, n, seconds));
          }
          if (r < 0) throw rejection(w, r);
        } catch (e) {
          failure ??= { error: e };
          abort.abort();
        }
      }
    };
    const workers = Array.from({ length: Math.max(1, Math.min(source.concurrency, reqs.length)) }, worker);
    await Promise.allSettled(workers);
    signal?.removeEventListener("abort", onAbort);
    if (failure !== void 0) throw failure.error;
  }
  function decodeOutput(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let at = 0;
    const u8 = () => v.getUint8(at++);
    const u322 = () => (at += 4, v.getUint32(at - 4, true));
    const u643 = () => (at += 8, v.getBigUint64(at - 8, true));
    const bytes = () => {
      const n = u322();
      at += n;
      return b.slice(at - n, at);
    };
    const str = () => text2(bytes());
    if (text2(b.subarray(0, 4)) !== "VZO1") throw new Error("not an output of the IR core");
    at = 4;
    const url2 = str();
    const summary = JSON.parse(str());
    const lazy = [];
    for (let n = u322(); n > 0; n--) lazy.push(str());
    const sources = [{ url: url2 }];
    for (let n = u322(); n > 0; n--) sources.push({ data: bytes() });
    const entries = [];
    for (let n = u322(); n > 0; n--) {
      const key2 = str();
      const value2 = bytes();
      const document = key2 === "zarr.json" || key2.endsWith("/zarr.json");
      const compress = !document || lazy.some((prefix2) => key2.startsWith(prefix2));
      entries.push(compress ? { key: key2, bytes: value2, compress } : { key: key2, bytes: value2 });
    }
    for (let n = u322(); n > 0; n--) {
      const key2 = str();
      const ranges = [];
      for (let m = u322(); m > 0; m--) {
        const tag = u8();
        if (tag === 0) ranges.push({ source: 0, offset: u643(), length: u643() });
        else if (tag === 1) ranges.push({ source: u322(), offset: u643(), length: u643() });
        else if (tag === 2) ranges.push({ data: bytes() });
        else throw new Error(`unknown part kind ${tag} in the IR core's output`);
      }
      entries.push({ key: key2, ranges });
    }
    if (at !== b.length) throw new Error("trailing bytes in the IR core's output");
    return { sources, entries, summary };
  }

  // src/virtualize/ir/source.ts
  function readerSource(read, size2, options = {}) {
    return {
      size: size2,
      remote: false,
      concurrency: options.concurrency ?? 4,
      multirange: false,
      fetch: (spans) => Promise.all(spans.map(([a, b]) => b > a ? read(a, b - a) : Promise.resolve(new Uint8Array()))),
      read: (o, n) => n > 0 ? read(o, n) : Promise.resolve(new Uint8Array()),
      ...options.etag ? { etag: options.etag } : {}
    };
  }
  var OPEN = 1 << 16;
  var RETRY = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
  var Transient = class extends Error {
    status;
    retryAfter;
    constructor(status, retryAfter) {
      super(`HTTP ${status}`);
      this.status = status;
      this.retryAfter = retryAfter;
    }
  };
  var isNode = typeof process !== "undefined" && process.versions?.node !== void 0;
  var HttpSource = class {
    remote = true;
    concurrency;
    multirange;
    planner;
    size = 0;
    head;
    /** Where requests go: the URL, then where its redirects led. */
    at;
    /** Retries made, and requests sent. */
    retries = 0;
    requests = 0;
    etags = new EtagLog();
    send;
    refusals = /* @__PURE__ */ new Set();
    attempts;
    baseDelay;
    headers;
    signal;
    url;
    constructor(url2, options = {}) {
      this.url = url2;
      const policy = options.policy ?? {};
      this.at = url2;
      this.concurrency = options.concurrency ?? 6;
      this.multirange = options.multirange ?? isNode;
      if (options.planner) this.planner = options.planner;
      this.attempts = options.attempts ?? 6;
      this.baseDelay = options.baseDelay ?? 0.5;
      this.headers = options.headers ?? {};
      this.signal = options.signal;
      const allow = (u2) => {
        try {
          checkHttpUrl(u2);
        } catch (e) {
          throw new VzipError("resolution", e.message);
        }
        checkPolicy(policy, url2, u2);
      };
      const checked = policy.allowPrivateHosts ? void 0 : checkedFetch((u2, address2) => {
        try {
          checkAddress(policy, u2, address2);
        } catch (e) {
          this.refusals.add(e.message);
          throw e;
        }
      }, policy);
      this.send = async (u2, headers, signal, cache = "no-store") => {
        const response2 = checked ? await checked(u2, { headers, signal }, allow) : await fetch(u2, { headers, signal, redirect: "follow", cache });
        if (response2.redirected) {
          try {
            allow(response2.url);
          } catch (e) {
            await response2.body?.cancel();
            throw e;
          }
        }
        return response2;
      };
    }
    /** Checks the URL, then reads its first `OPEN` bytes: the size, and the bytes the run is seeded with. */
    async open() {
      const t = performance.now();
      const response2 = await this.retry(() => this.get(`bytes=0-${OPEN - 1}`, void 0, "default"));
      const seconds = (performance.now() - t) / 1e3;
      if (response2.status === 416) {
        await response2.body?.cancel();
        this.size = 0;
        return this;
      }
      if (response2.status !== 206) {
        await response2.body?.cancel();
        throw new HttpResolutionError(`${this.url}: HTTP ${response2.status} for a range of its first bytes`);
      }
      const crange = response2.headers.get("Content-Range");
      const body = await this.body(response2);
      const m = crange?.trim().match(/^bytes (\d+)-(\d+)\/(\d+)$/i);
      if (m && Number(m[1]) === 0 && body.length === Number(m[2]) + 1) {
        this.size = Number(m[3]);
      } else if (crange === null && response2.type === "cors") {
        this.size = body.length < OPEN ? body.length : await this.headSize();
      } else {
        throw new HttpResolutionError(`${this.url}: Content-Range ${JSON.stringify(crange)} for ${body.length} bytes of [0, ${OPEN})`);
      }
      if (body.length > this.size) throw new HttpResolutionError(`${this.url}: ${body.length} bytes of a ${this.size}-byte object`);
      this.head = { offset: 0, data: body, seconds };
      return this;
    }
    async headSize() {
      const r = await fetch(this.at, { method: "HEAD", signal: this.signal });
      const v = r.headers.get("Content-Length");
      if (r.status !== 200 || v === null || !/^\d+$/.test(v)) {
        throw new HttpResolutionError(`${this.url}: cannot determine the size (HEAD ${r.status})`);
      }
      return Number(v);
    }
    etag() {
      return this.etags.pin();
    }
    /** One GET of a range (redirects followed and checked); a 429 or 5xx is a Transient. */
    async get(range, signal, cache) {
      this.requests++;
      const headers = { ...this.headers, Range: range, "Accept-Encoding": "identity" };
      let response2;
      try {
        response2 = await this.send(this.at, headers, signal ?? this.signal, cache);
      } catch (e) {
        if (e instanceof VzipError || e instanceof HttpResolutionError) throw e;
        if (this.refusals.has(e.message)) throw new VzipError("resolution", e.message);
        (signal ?? this.signal)?.throwIfAborted();
        if (e instanceof TypeError || typeof e.code === "string") throw e;
        throw new HttpResolutionError(`${this.url}: ${e.message}`);
      }
      if (response2.redirected && response2.url) this.at = response2.url;
      if (RETRY.has(response2.status)) {
        await response2.body?.cancel();
        throw new Transient(response2.status, response2.headers.get("Retry-After"));
      }
      if (response2.status === 200 || response2.status === 206) {
        const encoding = response2.headers.get("Content-Encoding");
        if (encoding !== null && encoding.trim().toLowerCase() !== "identity") {
          await response2.body?.cancel();
          throw new HttpResolutionError(`${this.url}: response has Content-Encoding ${JSON.stringify(encoding)}`);
        }
        const etag = response2.headers.get("ETag");
        if (etag !== null && etag.includes(",")) {
          await response2.body?.cancel();
          throw new HttpResolutionError(`${this.url}: more than one ETag field`);
        }
        this.etags.saw(etag);
      }
      return response2;
    }
    async body(response2) {
      return new Uint8Array(await response2.arrayBuffer());
    }
    async retry(f) {
      for (let attempt = 0; ; attempt++) {
        try {
          return await f();
        } catch (e) {
          if (e instanceof VzipError || e instanceof HttpResolutionError || e.name === "AbortError") throw e;
          const last = attempt >= this.attempts - 1;
          if (e instanceof Transient) {
            if (last) throw new HttpResolutionError(`${this.url}: HTTP ${e.status} after ${this.attempts} attempts`);
            await this.wait(attempt, e.retryAfter);
          } else {
            if (last) throw new HttpResolutionError(`${this.url}: ${e.message}${causeOf(e)}`);
            await this.wait(attempt, null);
          }
        }
      }
    }
    async wait(attempt, retryAfter) {
      let delay = this.baseDelay * 2 ** attempt * (0.5 + Math.random());
      if (retryAfter !== null) {
        const s = retryAfter.trim();
        if (/^\d+$/.test(s)) delay = Math.max(delay, Number(s));
        else {
          const when = Date.parse(s);
          if (!Number.isNaN(when)) delay = Math.max(delay, (when - Date.now()) / 1e3);
        }
      }
      this.retries++;
      await new Promise((resolve2) => setTimeout(resolve2, Math.min(delay, 120) * 1e3));
    }
    async read(offset, length2) {
      if (length2 === 0) return new Uint8Array();
      const h = this.head;
      if (h && offset >= h.offset && offset + length2 <= h.offset + h.data.length) {
        return h.data.subarray(offset - h.offset, offset - h.offset + length2);
      }
      return this.single(offset, offset + length2);
    }
    single(a, b, signal) {
      return this.retry(async () => {
        const response2 = await this.get(`bytes=${a}-${b - 1}`, signal);
        if (response2.status !== 206) {
          await response2.body?.cancel();
          throw new HttpResolutionError(`${this.url}: HTTP ${response2.status} for [${a}, ${b})`);
        }
        const crange = response2.headers.get("Content-Range");
        const body = await this.body(response2);
        const m = crange?.trim().match(/^bytes (\d+)-(\d+)\/(\d+|\*)$/i);
        const hidden = crange === null && response2.type === "cors";
        if (body.length !== b - a || !hidden && (!m || Number(m[1]) !== a || Number(m[2]) !== b - 1)) {
          throw new HttpResolutionError(`${this.url}: HTTP 206 with Content-Range ${JSON.stringify(crange)}, ${body.length} bytes for [${a}, ${b})`);
        }
        return body;
      });
    }
    async fetch(spans, signal) {
      if (spans.length === 1) return [await this.single(spans[0][0], spans[0][1], signal)];
      const range = "bytes=" + spans.map(([a, b]) => `${a}-${b - 1}`).join(",");
      let got;
      try {
        const response2 = await this.get(range, signal);
        const ctype = response2.headers.get("Content-Type") ?? "";
        if (response2.status !== 206 || !/multipart\/byteranges/i.test(ctype)) {
          await response2.body?.cancel();
          return null;
        }
        got = multipartParts(await this.body(response2), ctype);
      } catch (e) {
        if (e instanceof VzipError || e instanceof HttpResolutionError || e.name === "AbortError") throw e;
        return null;
      }
      if (got === null) return null;
      return spans.map(([a, b]) => {
        const data = got.get(`${a}-${b}`);
        if (data === void 0) throw new HttpResolutionError(`${this.url}: the multipart answer lacks [${a}, ${b})`);
        return data;
      });
    }
  };
  function causeOf(e) {
    const cause = e.cause;
    return cause ? ` (${cause.code ?? cause.message ?? String(cause)})` : "";
  }
  function openHttpSource(url2, options = {}) {
    try {
      checkHttpUrl(url2);
    } catch (e) {
      return Promise.reject(new VzipError("resolution", e.message));
    }
    if (!/^https?:/i.test(url2)) return Promise.reject(new VzipError("resolution", `${url2}: not an http(s) URL`));
    try {
      checkPolicy(options.policy ?? {}, url2, url2);
    } catch (e) {
      return Promise.reject(e);
    }
    return new HttpSource(url2, options).open();
  }
  function indexOf(hay, needle, from) {
    outer: for (let i = from; i + needle.length <= hay.length; i++) {
      for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  }
  var latin14 = (b) => Array.from(b, (c) => String.fromCharCode(c)).join("");
  function multipartParts(body, ctype) {
    const m = ctype.match(/boundary=("?)([^";]+)\1/i);
    const out2 = /* @__PURE__ */ new Map();
    if (!m) return out2;
    const sep = new TextEncoder().encode(`--${m[2].trim()}`);
    const crlf2 = new TextEncoder().encode("\r\n\r\n");
    let pos = 0;
    for (; ; ) {
      const k = indexOf(body, sep, pos);
      if (k < 0 || body[k + sep.length] === 45 && body[k + sep.length + 1] === 45) return out2;
      const headEnd = indexOf(body, crlf2, k);
      if (headEnd < 0) return out2;
      let start;
      let end = 0;
      for (const line of latin14(body.subarray(k + sep.length, headEnd)).split("\r\n")) {
        const i = line.indexOf(":");
        if (i < 0 || line.slice(0, i).trim().toLowerCase() !== "content-range") continue;
        const r = line.slice(i + 1).trim().match(/^bytes (\d+)-(\d+)\//i);
        if (r) [start, end] = [Number(r[1]), Number(r[2]) + 1];
      }
      if (start === void 0) return out2;
      const at = headEnd + 4;
      if (at + end - start > body.length) return out2;
      out2.set(`${start}-${end}`, body.slice(at, at + end - start));
      pos = at + end - start;
    }
  }

  // src/virtualize/tiff/ifd.ts
  var TiffError = class extends Error {
  };
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
  var SIZES = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    6: 1,
    7: 1,
    8: 2,
    9: 4,
    10: 8,
    11: 4,
    12: 8,
    13: 4,
    16: 8,
    17: 8,
    18: 8
  };
  var LAYOUT2 = /* @__PURE__ */ new Set([273, 279, 288, 289, 324, 325, 513, 514, 519, 520, 521]);
  var TABLES = [[519, "jpeg_q_tables"], [520, "jpeg_dc_tables"], [521, "jpeg_ac_tables"]];
  var POINTERS = { 34665: "exif", 34853: "gps", 40965: "interoperability" };
  var SUBIFDS = 330;
  var GLOBAL_PARAMETERS = 400;
  var UNSIGNED = /* @__PURE__ */ new Set([1, 3, 4, 13, 16, 18]);
  var MAX_DEPTH3 = 4;
  var MAX_IFDS = 1e5;
  var MAX_POINTED = 1e4;
  var INLINE3 = 64;
  var MAX_TEXT3 = 2 ** 16;
  var IFD_BUDGET = 2 ** 16;
  var TOTAL_BUDGET = 2 ** 20;
  var MAX_TOTAL_BUDGET = 2 ** 24;
  var MAX_CHUNK4 = 2 ** 24;
  var DTYPES = {
    1: "uint8",
    7: "uint8",
    6: "int8",
    2: "uint8",
    3: "uint16",
    8: "int16",
    4: "uint32",
    13: "uint32",
    9: "int32",
    16: "uint64",
    18: "uint64",
    17: "int64",
    11: "float32",
    12: "float64",
    5: "uint32",
    10: "int32"
  };
  function valueJson2(data, type, count, le3) {
    if (type === 2) return textJson(data.length > 0 && data[data.length - 1] === 0 ? data.subarray(0, -1) : data);
    const view5 = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (type === 5 || type === 10) {
      const out3 = [];
      for (let i = 0; i < count; i++) {
        out3.push(type === 5 ? [view5.getUint32(8 * i, le3), view5.getUint32(8 * i + 4, le3)] : [view5.getInt32(8 * i, le3), view5.getInt32(8 * i + 4, le3)]);
      }
      return out3;
    }
    const out2 = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 1:
        case 7:
          out2.push(view5.getUint8(i));
          break;
        case 3:
          out2.push(view5.getUint16(2 * i, le3));
          break;
        case 4:
        case 13:
          out2.push(view5.getUint32(4 * i, le3));
          break;
        case 6:
          out2.push(view5.getInt8(i));
          break;
        case 8:
          out2.push(view5.getInt16(2 * i, le3));
          break;
        case 9:
          out2.push(view5.getInt32(4 * i, le3));
          break;
        case 11:
          out2.push(jsonNumber(view5.getFloat32(4 * i, le3)));
          break;
        case 12:
          out2.push(jsonNumber(view5.getFloat64(8 * i, le3)));
          break;
        case 16:
        case 18:
          out2.push(jsonNumber(view5.getBigUint64(8 * i, le3)));
          break;
        case 17:
          out2.push(jsonNumber(view5.getBigInt64(8 * i, le3)));
          break;
      }
    }
    return out2;
  }
  var utf86 = new TextEncoder();
  var jsonSize2 = (v) => utf86.encode(JSON.stringify(v)).length;
  function leastSize(e) {
    const count = Number(e.count);
    if (e.type === 2) return count + 1;
    return e.type === 5 || e.type === 10 ? 6 * count + 1 : 2 * count + 1;
  }
  var hex = (b) => Array.from(b ?? [], (x) => x.toString(16).padStart(2, "0")).join("");
  var where = (e) => `${e.type},${e.count},${hex(e.field)}`;
  var Translator2 = class {
    arrays = [];
    groups = /* @__PURE__ */ new Map();
    recorded = /* @__PURE__ */ new Map();
    // offset -> path
    numbers = /* @__PURE__ */ new Map();
    // path -> record number
    referenced = /* @__PURE__ */ new Set();
    // the paths a pointer's array refers to
    tries = 0;
    // the offsets tried through pointer tags
    failed = /* @__PURE__ */ new Set();
    // the offsets tried that led to no IFD
    total;
    // what is left of the total budget
    kept = /* @__PURE__ */ new Map();
    // the families kept, by the entries that locate them
    pointerArrays = /* @__PURE__ */ new Map();
    // (type, count, field) -> (numbers, path)
    resolved = /* @__PURE__ */ new Map();
    // (type, count, field, deep) -> (tries, paths)
    starts = [];
    // the extents of the IFDs recorded, merged, sorted
    ends = [];
    read;
    size;
    le;
    layout;
    table;
    entriesAt;
    constructor(read, size2, le3, layout = LAYOUT2, table = /* @__PURE__ */ new Set(), entriesAt, recorded = []) {
      this.read = read;
      this.size = size2;
      this.le = le3;
      this.layout = layout;
      this.table = table;
      this.entriesAt = entriesAt;
      this.total = Math.min(MAX_TOTAL_BUDGET, TOTAL_BUDGET + size2);
      for (const [offset, , path2] of recorded) {
        if (!this.recorded.has(offset)) this.recorded.set(offset, path2);
        this.numbers.set(path2, this.numbers.size);
      }
      for (const [offset, end] of [...recorded].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
        const last = this.ends.length - 1;
        if (last >= 0 && offset < this.ends[last]) this.ends[last] = Math.max(this.ends[last], end);
        else {
          this.starts.push(offset);
          this.ends.push(end);
        }
      }
    }
    /** The number of recorded extents that start before `at`. */
    before(at) {
      let lo = 0;
      let hi = this.starts.length;
      while (lo < hi) {
        const mid = lo + hi >> 1;
        if (this.starts[mid] < at) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    }
    /** Whether [start, end) overlaps the extent of an IFD recorded. */
    overlaps(start, end) {
      const i = this.before(end) - 1;
      return i >= 0 && this.ends[i] > start;
    }
    /** An entry's integer values, if it has them within the file (for the layout and pointer tags). */
    async value(e) {
      if (e.value !== void 0) return e.value.map(Number);
      const size2 = SIZES[e.type];
      if (size2 === void 0 || !UNSIGNED.has(e.type)) return void 0;
      const count = Number(e.count);
      const n = size2 * count;
      let data;
      if (e.inline !== void 0) data = e.inline.subarray(0, n);
      else if (e.offset !== void 0 && e.offset + n <= this.size) data = await this.read(e.offset, n);
      else return void 0;
      const view5 = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return Array.from({ length: count }, (_, i) => {
        switch (e.type) {
          case 1:
            return view5.getUint8(i);
          case 3:
            return view5.getUint16(2 * i, this.le);
          case 4:
          case 13:
            return view5.getUint32(4 * i, this.le);
          default:
            return Number(view5.getBigUint64(8 * i, this.le));
        }
      });
    }
    pointer(e) {
      if (e.tag === SUBIFDS || Object.hasOwn(POINTERS, e.tag)) return UNSIGNED.has(e.type);
      if (e.tag === GLOBAL_PARAMETERS && e.type === 4) return true;
      return (e.type === 13 || e.type === 18) && !this.table.has(e.tag) && !this.layout.has(e.tag);
    }
    /** Whether a value of JSON `size` is JSON within the IFD's `budget` and the total
     * (spec/virtualize/tiff.md §5); either way, it spends the total. */
    spend(budget, size2) {
      const fits = size2 <= budget[0] && size2 <= this.total;
      if (fits) budget[0] -= size2;
      this.total -= Math.min(size2, this.total);
      return fits;
    }
    /** Records the IFD at `path` (and its image data if `data`), and the IFDs its pointer tags
     * lead to; returns its source metadata. */
    async ifd(entries, path2, depth2 = 0, data = true) {
      const first = /* @__PURE__ */ new Map();
      const later = [];
      for (const e of entries) {
        if (first.has(e.tag)) later.push(e);
        else first.set(e.tag, e);
      }
      const tags = {};
      const out2 = { tags };
      this.groups.set(path2, out2);
      const budget = [IFD_BUDGET];
      const same = {};
      const pointers = {};
      for (const tag of [...first.keys()].sort((a, b) => a - b)) {
        const e = first.get(tag);
        if (this.pointer(e)) pointers[String(tag)] = await this.follow(e, path2, depth2, budget, same);
        else if (!this.layout.has(tag)) tags[String(tag)] = await this.tag(e, `${path2}/${tag}`, budget);
      }
      if (Object.keys(pointers).length > 0) out2.pointers = pointers;
      const duplicates = later.filter((e) => !this.pointer(e) && !this.layout.has(e.tag));
      if (duplicates.length > 0) {
        const items = [];
        for (const [k, e] of duplicates.entries()) {
          items.push({ tag: e.tag, ...await this.tag(e, `${path2}/duplicates/${k}`, budget) });
        }
        out2.duplicates = items;
      }
      if (first.has(513) && first.has(514)) {
        const start = await this.value(first.get(513));
        const length2 = await this.value(first.get(514));
        if (start !== void 0 && length2 !== void 0 && start.length > 0 && length2.length > 0 && length2[0] >= 1 && start[0] + length2[0] <= this.size) {
          const [chunk, chunks] = blobChunks(start[0], length2[0]);
          this.arrays.push({
            path: `${path2}/jpeg_interchange`,
            dataType: "uint8",
            shape: [length2[0]],
            chunkShape: [chunk],
            dims: ["byte"],
            chunks
          });
        }
      }
      for (const [tag, name] of TABLES) {
        if (first.has(tag)) await this.tables(first.get(tag), path2, name, tag === 519, same);
      }
      const tiles = first.has(324) && first.has(325);
      const strips = first.has(273) && first.has(279);
      if (data && (tiles || strips)) {
        await this.family(first.get(tiles ? 324 : 273), first.get(tiles ? 325 : 279), path2, "data", same);
      }
      if (tiles && strips) await this.family(first.get(273), first.get(279), path2, "strips", same);
      if (Object.keys(same).length > 0) out2.same_as = same;
      return out2;
    }
    /** The family `<path>/<name>` of `members()`, or, when a family with the same `key` was
     * kept earlier, the member `name` of `same`: its path. */
    async keep(key2, path2, name, same, members) {
      const known = this.kept.get(key2);
      if (known !== void 0) {
        if (known !== null) same[name] = known;
        return;
      }
      const found = await members();
      const kept = found !== void 0 && found.length > 0;
      this.kept.set(key2, kept ? `${path2}/${name}` : null);
      if (kept) this.arrays.push(...await familyPlans(`${path2}/${name}`, found, this.read));
    }
    /** Old-style JPEG tables (JPEGQTables, JPEGDCTables, JPEGACTables): member i of the
     * family at `path/name` is the table at value i, 64 bytes for a quantization table, else
     * 16 bytes of counts and as many values as they sum to (spec/virtualize/tiff.md §5). */
    async tables(e, path2, name, quantization, same) {
      await this.keep(`${quantization ? "q" : "huffman"},${where(e)}`, path2, name, same, async () => {
        const offsets = await this.value(e);
        if (offsets === void 0) return void 0;
        const members = [];
        for (const [i, o] of offsets.entries()) {
          let n = 64;
          if (!quantization) {
            if (o + 16 > this.size) continue;
            n = 16 + (await this.read(o, 16)).reduce((a, b) => a + b, 0);
          }
          if (o + n <= this.size) members.push([i, o, n]);
        }
        return members;
      });
    }
    /** Strips or tiles as the family of bytes `<path>/<name>` (spec/virtualize/tiff.md §5). */
    async family(offsets, counts, path2, name, same) {
      await this.keep(`data,${where(offsets)},${where(counts)}`, path2, name, same, async () => {
        const o = await this.value(offsets);
        const n = await this.value(counts);
        if (o === void 0 || n === void 0) return void 0;
        const members = [];
        for (let i = 0; i < Math.min(o.length, n.length); i++) {
          if (n[i] > 0 && o[i] + n[i] <= this.size) members.push([i, o[i], n[i]]);
        }
        return members;
      });
    }
    /** A pointer tag: its type, count and the IFDs it leads to, as paths (at most INLINE
     * values, within the budget) or as the record numbers of the array <path>/<tag>. */
    async follow(e, path2, depth2, budget, same) {
      const m = { type: e.type, count: jsonNumber(e.count) };
      const name = e.tag === SUBIFDS ? "subifds" : POINTERS[e.tag] ?? `ifd_${e.tag}`;
      const memo = `${where(e)},${depth2 < MAX_DEPTH3}`;
      const done = this.resolved.get(memo);
      let paths;
      if (done !== void 0 && done[0] === this.tries) paths = done[1];
      else {
        const values2 = await this.value(e);
        if (values2 === void 0) return m;
        paths = [];
        for (const [j, at] of values2.entries()) {
          paths.push(await this.lead(
            at,
            e.tag === SUBIFDS || values2.length > 1 ? `${path2}/${name}/${j}` : `${path2}/${name}`,
            depth2
          ));
        }
        this.resolved.set(memo, [this.tries, paths]);
      }
      if (paths.length <= INLINE3 && this.spend(budget, jsonSize2(paths))) {
        m.ifds = paths;
        return m;
      }
      const n = paths.length;
      const packed = new Uint8Array(4 * n);
      const view5 = new DataView(packed.buffer);
      for (const [i, p] of paths.entries()) view5.setInt32(4 * i, p === null ? -1 : this.numbers.get(p), true);
      const key2 = where(e);
      const earlier = this.pointerArrays.get(key2) ?? [];
      this.pointerArrays.set(key2, earlier);
      for (const [other, at] of earlier) {
        if (other.length === packed.length && other.every((b, i) => b === packed[i])) {
          same[String(e.tag)] = at;
          return m;
        }
      }
      earlier.push([packed, `${path2}/${e.tag}`]);
      for (const p of paths) if (p !== null) this.referenced.add(p);
      const k = Math.ceil(4 * n / MAX_CHUNK4);
      const c = Math.ceil(n / k);
      const chunks = /* @__PURE__ */ new Map();
      for (let q = 0; q < k; q++) {
        const bytes = new Uint8Array(4 * c);
        bytes.set(packed.subarray(4 * q * c, Math.min(4 * n, 4 * (q + 1) * c)));
        chunks.set(String(q), bytes);
      }
      this.arrays.push({ path: `${path2}/${e.tag}`, dataType: "int32", shape: [n], chunkShape: [c], dims: ["value"], chunks });
      return m;
    }
    /** The path of the IFD a pointer value `at` leads to, recording it at `child` (and
     * translating it) when it is new (spec/virtualize/tiff.md §5), or null. */
    async lead(at, child, depth2) {
      const known = this.recorded.get(at);
      if (known !== void 0) return known;
      if (this.failed.has(at) || depth2 >= MAX_DEPTH3 || this.recorded.size >= MAX_IFDS || this.tries >= MAX_POINTED || this.entriesAt === void 0) return null;
      this.tries++;
      const found = await this.entriesAt(at);
      if (found === void 0 || found[0] === 0 || this.overlaps(at, found[1])) {
        this.failed.add(at);
        return null;
      }
      this.recorded.set(at, child);
      this.numbers.set(child, this.numbers.size);
      const i = this.before(at);
      this.starts.splice(i, 0, at);
      this.ends.splice(i, 0, found[1]);
      await this.ifd(await found[2](), child, depth2 + 1);
      return child;
    }
    /** A tag as JSON; a large value, or one past the budget, is the array at `array`,
     * referenced where the file holds it. */
    async tag(e, array2, budget) {
      const m = { type: e.type, count: jsonNumber(e.count) };
      const size2 = SIZES[e.type];
      if (size2 === void 0) {
        m.field = base64(e.field ?? new Uint8Array());
        return m;
      }
      const nbytes = BigInt(size2) * e.count;
      if (e.value !== void 0) {
        m.value = e.value.map(jsonNumber);
        return m;
      }
      const count = Number(e.count);
      if (e.inline !== void 0) {
        m.value = valueJson2(e.inline.subarray(0, Number(nbytes)), e.type, count, this.le);
        return m;
      }
      if (e.offset === void 0 || BigInt(e.offset) + nbytes > BigInt(this.size)) return m;
      const small = e.type === 2 && nbytes <= BigInt(MAX_TEXT3) || e.type !== 2 && e.count <= BigInt(INLINE3);
      if (small) {
        if (leastSize(e) > this.total) this.total = 0;
        else {
          const value2 = valueJson2(await this.read(e.offset, Number(nbytes)), e.type, count, this.le);
          if (this.spend(budget, jsonSize2(value2))) {
            m.value = value2;
            return m;
          }
        }
      }
      const pair = e.type === 5 || e.type === 10;
      const [rows, chunks] = rowChunks(e.offset, count, size2, pair ? "/0" : "");
      this.arrays.push({
        path: array2,
        dataType: DTYPES[e.type],
        shape: pair ? [count, 2] : [count],
        chunkShape: pair ? [rows, 2] : [rows],
        dims: pair ? ["value", "part"] : ["value"],
        chunks,
        endian: this.le ? "little" : "big"
      });
      return m;
    }
    /** The source metadata node (with its own source metadata `node`), one group per
     * IFD, and the arrays. */
    emit(profile, node) {
      for (const p of this.referenced) this.groups.get(p).record = this.numbers.get(p);
      const group2 = (attributes) => utf86.encode(stringifyJson({ zarr_format: 3, node_type: "group", attributes }));
      const parents = /* @__PURE__ */ new Set();
      for (const p of this.groups.keys()) {
        const parts = p.split("/");
        for (let k = 1; k < parts.length; k++) parents.add(parts.slice(0, k).join("/"));
      }
      const out2 = emitPlans([], declare({}, profile, void 0, node));
      const holders = /* @__PURE__ */ new Set();
      for (const a of this.arrays) {
        const parts = a.path.split("/");
        for (let k = 1; k < parts.length; k++) holders.add(parts.slice(0, k).join("/"));
      }
      for (const g of [...holders].sort()) {
        if (!parents.has(g) && !this.groups.has(g)) out2.push({ key: `${SOURCE_NODE}/${g}/zarr.json`, bytes: group2({}), compress: true });
      }
      for (const a of this.arrays) for (const e of planEntries(SOURCE_NODE, a)) out2.push(e);
      for (const p of [...parents].sort()) if (!this.groups.has(p)) out2.push({ key: `${SOURCE_NODE}/${p}/zarr.json`, bytes: group2({}), compress: true });
      for (const [p, s] of this.groups) {
        out2.push({ key: `${SOURCE_NODE}/${p}/zarr.json`, bytes: group2(declare({}, profile, void 0, s)), compress: true });
      }
      return out2;
    }
  };

  // src/virtualize/ndpi/virtualize.ts
  var MAX_IFDS2 = 1e5;
  var NDPI_LAYOUT = /* @__PURE__ */ new Set([...LAYOUT2, 65426, 65432]);
  var CHUNK = 1024;
  var MAX_SIDE = 65535;
  var SIZES2 = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    6: 1,
    7: 1,
    8: 2,
    9: 4,
    10: 8,
    11: 4,
    12: 8,
    13: 4,
    16: 8,
    17: 8,
    18: 8
  };
  var INTEGER3 = /* @__PURE__ */ new Set([1, 3, 4, 13, 16, 18]);
  var OFFSET = /* @__PURE__ */ new Set([3, 4, 8, 9]);
  var TAGS2 = {
    256: [INTEGER3, true],
    257: [INTEGER3, true],
    258: [INTEGER3, false],
    259: [INTEGER3, true],
    262: [INTEGER3, true],
    277: [INTEGER3, true],
    273: [INTEGER3, true],
    279: [INTEGER3, true],
    282: [/* @__PURE__ */ new Set([5]), true],
    283: [/* @__PURE__ */ new Set([5]), true],
    296: [INTEGER3, true],
    65420: [INTEGER3, true],
    65421: [/* @__PURE__ */ new Set([11, 12]), true],
    65422: [OFFSET, true],
    65423: [OFFSET, true],
    65426: [INTEGER3, false],
    65432: [INTEGER3, false]
  };
  var reject6 = (message) => {
    throw new TiffError(message);
  };
  var view = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var u64 = (v, at) => {
    const x = v.getBigUint64(at, true);
    return x > BigInt(Number.MAX_SAFE_INTEGER) ? reject6("an NDPI offset is above 2^53 - 1") : Number(x);
  };
  async function detectNdpi(read, size2) {
    if (size2 < 12) return void 0;
    const head = await read(0, 12);
    if (String.fromCharCode(...head.subarray(0, 4)) !== "II*\0") return void 0;
    const v = Number(view(head).getBigUint64(4, true));
    if (v < 16 || v + 2 > size2) return void 0;
    const n = view(await read(v, 2)).getUint16(0, true);
    if (v + 2 + 12 * n > size2) return void 0;
    const entries = view(await read(v + 2, 12 * n));
    for (let i = 0; i < n; i++) if (entries.getUint16(12 * i, true) === 65420) return v;
    return void 0;
  }
  async function readIfds(read, size2, first) {
    const seen = /* @__PURE__ */ new Set();
    const ifds = [];
    const entries = [];
    for (let offset = first; offset !== 0; ) {
      if (offset < 16) reject6(`IFD offset ${offset} is not in the file`);
      if (seen.has(offset)) reject6(`IFD offset ${offset} read twice`);
      if (seen.size >= MAX_IFDS2) reject6("too many IFDs");
      seen.add(offset);
      const n = view(await read(offset, 2)).getUint16(0, true);
      const body = await read(offset + 2, 12 * n + 8 + 4 * n);
      const b = view(body);
      const fields2 = /* @__PURE__ */ new Map();
      const mine = [];
      for (let i = 0; i < n; i++) {
        const tag = b.getUint16(12 * i, true);
        mine.push(entry(body, n, i));
        if (!(tag in TAGS2) || fields2.has(tag)) continue;
        const type = b.getUint16(12 * i + 2, true);
        const count = b.getUint32(12 * i + 4, true);
        const [allowed, scalar] = TAGS2[tag];
        if (!allowed.has(type)) reject6(`tag ${tag} has field type ${type}`);
        if (scalar && count === 0) reject6(`tag ${tag} has no value`);
        const low = b.getUint32(12 * i + 8, true);
        const high = b.getUint32(12 * n + 8 + 4 * i, true);
        if (count * SIZES2[type] <= 4) {
          fields2.set(tag, { type, count, inline: body.slice(12 * i + 8, 12 * i + 12), high });
        } else if (low + high * 2 ** 32 + count * SIZES2[type] > size2) {
          reject6(`the value of tag ${tag} is outside the file`);
        } else {
          fields2.set(tag, { type, count, high, offset: low + high * 2 ** 32 });
        }
      }
      ifds.push(fields2);
      entries.push(mine);
      offset = u64(b, 12 * n);
    }
    if (ifds.length === 0) reject6("no images");
    return { ifds, entries, offsets: [...seen] };
  }
  function values(read) {
    const memo = /* @__PURE__ */ new Map();
    const one3 = async (tag, f) => {
      const n = TAGS2[tag][1] ? 1 : f.count;
      let out2;
      if (f.inline !== void 0) {
        out2 = f.count === 1 && (f.type === 4 || f.type === 13) ? [view(f.inline).getUint32(0, true) + f.high * 2 ** 32] : decode(f.inline.subarray(0, n * SIZES2[f.type]), f.type, n);
      } else {
        const key2 = `${f.type},${n},${f.offset}`;
        out2 = memo.get(key2) ?? decode(await read(f.offset, n * SIZES2[f.type]), f.type, n);
        memo.set(key2, out2);
      }
      if (INTEGER3.has(f.type) && out2.some((v) => v > Number.MAX_SAFE_INTEGER)) {
        reject6(`tag ${tag} has a value above 2^53 - 1`);
      }
      return out2;
    };
    return async (fields2, only) => {
      const out2 = /* @__PURE__ */ new Map();
      for (const [tag, f] of fields2) if (only === void 0 || only.has(tag)) out2.set(tag, await one3(tag, f));
      return out2;
    };
  }
  function entry(body, n, i) {
    const b = view(body);
    const tag = b.getUint16(12 * i, true);
    const type = b.getUint16(12 * i + 2, true);
    const count = b.getUint32(12 * i + 4, true);
    const low = body.subarray(12 * i + 8, 12 * i + 12);
    const high = body.subarray(12 * n + 8 + 4 * i, 12 * n + 12 + 4 * i);
    const field = new Uint8Array(8);
    field.set(low, 0);
    field.set(high, 4);
    const where2 = BigInt(b.getUint32(12 * i + 8, true)) + (BigInt(b.getUint32(12 * n + 8 + 4 * i, true)) << 32n);
    if (SIZES2[type] !== void 0 && count * SIZES2[type] <= 4) {
      return {
        tag,
        type,
        count: BigInt(count),
        inline: low.slice(),
        field,
        value: count === 1 && (type === 4 || type === 13) ? [where2] : void 0
      };
    }
    return { tag, type, count: BigInt(count), offset: Number(where2), field };
  }
  var extent = (n) => 2 + 16 * n + 8;
  function entriesReader(read, size2) {
    return async (offset) => {
      if (offset < 16 || offset + 2 > size2) return void 0;
      const n = view(await read(offset, 2)).getUint16(0, true);
      if (offset + extent(n) > size2) return void 0;
      return [n, offset + extent(n), async () => {
        const body = await read(offset + 2, 16 * n + 8);
        return Array.from({ length: n }, (_, i) => entry(body, n, i));
      }];
    };
  }
  function decode(bytes, type, count) {
    const v = view(bytes);
    if (type === 5) return Array.from({ length: count }, (_, i) => [v.getUint32(8 * i, true), v.getUint32(8 * i + 4, true)]);
    return Array.from({ length: count }, (_, i) => {
      switch (type) {
        case 1:
          return v.getUint8(i);
        case 3:
          return v.getUint16(2 * i, true);
        case 8:
          return v.getInt16(2 * i, true);
        case 9:
          return v.getInt32(4 * i, true);
        case 4:
        case 13:
          return v.getUint32(4 * i, true);
        case 11:
          return v.getFloat32(4 * i, true);
        case 12:
          return v.getFloat64(8 * i, true);
        default:
          return Number(v.getBigUint64(8 * i, true));
      }
    });
  }
  function one(tags, tag, what, fallback) {
    const v = tags.get(tag);
    if (v === void 0) return fallback ?? reject6(`an NDPI image has no ${what}`);
    return v[0];
  }
  function jpegHeader(header) {
    if (header[0] !== 255 || header[1] !== 216) reject6("an NDPI strip does not start with a JPEG SOI marker");
    const v = view(header);
    let pos = 2;
    let sof;
    let dri;
    for (; ; ) {
      if (pos + 4 > header.length || header[pos] !== 255) reject6("malformed JPEG header in an NDPI strip");
      const marker = header[pos + 1];
      const length2 = v.getUint16(pos + 2);
      const end = pos + 2 + length2;
      if (length2 < 2 || end > header.length) reject6("malformed JPEG header in an NDPI strip");
      if (marker === 192) {
        if (sof !== void 0) reject6("an NDPI strip has two SOF0 segments");
        sof = [pos, end];
      } else if (marker >= 193 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
        reject6(`an NDPI strip is not baseline JPEG (marker FF${marker.toString(16).toUpperCase()})`);
      } else if (marker === 221) {
        if (length2 !== 4) reject6("malformed DRI segment in an NDPI strip");
        dri = v.getUint16(pos + 4);
      } else if (marker === 218) {
        if (end !== header.length) reject6("an NDPI strip's SOS does not end at McuStarts[0]");
        break;
      }
      pos = end;
    }
    if (sof === void 0 || !dri) return reject6("an NDPI strip has no SOF0 or no restart interval");
    const seg = header.subarray(sof[0], sof[1]);
    const nf = seg.length > 9 ? seg[9] : 0;
    if (nf === 0 || seg.length !== 10 + 3 * nf) reject6("malformed SOF0 segment in an NDPI strip");
    let horizontal = 0;
    let vertical = 0;
    for (let k = 0; k < nf; k++) {
      horizontal = Math.max(horizontal, seg[11 + 3 * k] >> 4);
      vertical = Math.max(vertical, seg[11 + 3 * k] & 15);
    }
    if (horizontal === 0 || vertical === 0) reject6("an NDPI strip has a sampling factor of 0");
    return [sof[0], sof[1], 8 * horizontal, 8 * vertical, dri];
  }
  async function virtualizeNdpi(url2, read, size2, first) {
    const { ifds, entries: ifdEntries, offsets } = await readIfds(read, size2, first);
    const load = values(read);
    const levels = [];
    for (const [k, fields2] of ifds.entries()) {
      const mag = one(await load(fields2, /* @__PURE__ */ new Set([65421])), 65421, "Magnification");
      if (!(mag > 0)) continue;
      const tags = await load(fields2);
      const w = one(tags, 256, "ImageWidth");
      const h = one(tags, 257, "ImageLength");
      const bits = tags.get(258);
      if (one(tags, 259, "Compression", 1) !== 7 || one(tags, 262, "PhotometricInterpretation") !== 6 || one(tags, 277, "SamplesPerPixel", 1) !== 3 || !bits?.length || bits.some((b) => b !== 8)) {
        reject6("an NDPI level is not 8-bit YCbCr JPEG with 3 samples");
      }
      if (fields2.get(273)?.count !== 1 || fields2.get(279)?.count !== 1) reject6("an NDPI level does not have exactly one strip");
      const last = levels[levels.length - 1];
      if (last && !(w < last.w && h < last.h)) reject6("NDPI levels do not decrease in size");
      if (levels.some((l) => l.mag === mag)) reject6("NDPI focal planes (two levels with one magnification) are not supported");
      if (Math.min(w, h) < 1) reject6("an NDPI level is empty");
      levels.push({ mag, w, h, tags, ifd: k });
    }
    if (levels.length === 0) reject6("no NDPI levels");
    const base = levels[0];
    const perUnit = { 3: 1e4, 2: 25400 }[one(base.tags, 296, "ResolutionUnit", 0)];
    const physical = (tag) => {
      const r = base.tags.get(tag)?.[0];
      if (perUnit === void 0 || r === void 0 || r[0] === 0 || r[1] === 0) return void 0;
      const pixel = perUnit / (r[0] / r[1]);
      return pixel < 25.4 ? pixel : void 0;
    };
    const px = physical(282);
    const py = physical(283);
    const axes = ["c", "y", "x"];
    const codecs = [{ name: "transpose", configuration: { order: [1, 2, 0] } }, { name: "imagecodecs_jpeg" }];
    const utf89 = new TextEncoder();
    const json = (v) => utf89.encode(stringifyJson(v));
    const entries = [];
    const data = new DataSources();
    const datasets = [];
    for (const [li, level3] of levels.entries()) {
      const s0 = one(level3.tags, 273, "StripOffsets");
      const n = one(level3.tags, 279, "StripByteCounts");
      if (s0 + n > size2) reject6("an NDPI strip is outside the file");
      if (n < 4) reject6(`an NDPI strip of ${n} bytes is shorter than 4`);
      let chunk;
      const refs = [];
      const starts = level3.tags.get(65426);
      if (starts === void 0) {
        chunk = [3, level3.h, level3.w];
        refs.push([`${li}/c/0/0/0`, [[s0, n]]]);
      } else {
        [chunk, level3.sof0] = await intervals(refs, data, li, read, level3.tags, starts, s0, n, level3.w, level3.h);
      }
      for (const [key2, parts] of refs) {
        entries.push({ key: key2, ranges: parts.map(toRange) });
      }
      entries.push({
        key: `${li}/zarr.json`,
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape: [3, level3.h, level3.w],
          data_type: "uint8",
          chunk_grid: { name: "regular", configuration: { chunk_shape: chunk } },
          chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
          fill_value: 0,
          codecs,
          dimension_names: axes,
          attributes: {}
        })
      });
      datasets.push({
        path: String(li),
        coordinateTransformations: [{ type: "scale", scale: [1, (py ?? 1) * (base.h / level3.h), (px ?? 1) * (base.w / level3.w)] }]
      });
    }
    const unit = (p) => p === void 0 ? {} : { unit: "micrometer" };
    const offsetX = base.tags.get(65422)?.[0];
    const offsetY = base.tags.get(65423)?.[0];
    if (px !== void 0 && py !== void 0 && offsetX !== void 0 && offsetY !== void 0) {
      const translation = [0, offsetY / 1e3 - base.h * py / 2, offsetX / 1e3 - base.w * px / 2];
      for (const d of datasets) d.coordinateTransformations.push({ type: "translation", translation });
    }
    entries.push({
      key: "zarr.json",
      bytes: json({
        zarr_format: 3,
        node_type: "group",
        attributes: declare({
          ome: {
            version: "0.5",
            multiscales: [{
              axes: [{ name: "c", type: "channel" }, { name: "y", type: "space", ...unit(py) }, { name: "x", type: "space", ...unit(px) }],
              datasets
            }]
          }
        }, "ndpi", url2)
      })
    });
    const summary = { axes, levels: levels.map((l) => [3, l.h, l.w]), references: entries.length - levels.length - 1, codec: "imagecodecs_jpeg" };
    const translate = new Translator2(
      read,
      size2,
      true,
      NDPI_LAYOUT,
      new Set(Object.keys(TAGS2).map(Number)),
      entriesReader(read, size2),
      offsets.map((o, k) => [o, o + extent(ifdEntries[k].length), `ifds/${k}`])
    );
    const mapped = new Map(levels.map((l) => [l.ifd, l]));
    for (const [k, e] of ifdEntries.entries()) {
      const group2 = await translate.ifd(e, `ifds/${k}`, 0, !mapped.has(k));
      const sof0 = mapped.get(k)?.sof0;
      if (sof0 !== void 0) group2.sof0 = base64(sof0);
    }
    for (const e of translate.emit("ndpi", { ifd_count: ifds.length })) entries.push(e);
    return {
      sources: data.table(url2),
      entries,
      summary
    };
  }
  async function intervals(refs, data, li, read, tags, startsLow, s0, n, w, h) {
    const high = tags.get(65432);
    if (high !== void 0 && high.length !== startsLow.length) reject6("McuStartsHighBytes and McuStarts differ in length");
    const starts = high === void 0 ? startsLow : startsLow.map((s, i) => s + high[i] * 2 ** 32);
    if (starts.length === 0 || starts[0] < 2 || starts[0] > n) reject6("McuStarts[0] is outside the strip");
    const header = await read(s0, starts[0]);
    const [sofStart, sofEnd, mw, mh, interval] = jpegHeader(header);
    const q = Math.ceil(w / (interval * mw));
    const r = Math.ceil(h / mh);
    if (starts.length !== q * r || starts[starts.length - 1] >= n || starts.some((s, i) => i > 0 && s <= starts[i - 1])) {
      reject6("McuStarts does not match the strip's intervals");
    }
    const ends = starts.map((_, i) => (i + 1 < starts.length ? starts[i + 1] : n) - 2);
    if (starts.some((s, i) => ends[i] <= s)) reject6("an NDPI restart interval is empty");
    const a = Math.min(q, Math.max(1, Math.floor(CHUNK / (interval * mw))));
    if (a * interval * mw > MAX_SIDE) reject6(`an NDPI chunk would be ${a * interval * mw} pixels wide, more than ${MAX_SIDE}`);
    const sof = header.slice(sofStart, sofEnd);
    const before = data.range(header.subarray(0, sofStart));
    const after = data.range(header.subarray(sofEnd));
    const chunks = (b2) => {
      const s = sof.slice();
      view(s).setUint16(5, b2 * mh);
      view(s).setUint16(7, a * interval * mw);
      const head = [before, s, after];
      const out2 = [];
      for (let u2 = 0; u2 < Math.ceil(r / b2); u2++) {
        for (let v = 0; v < Math.ceil(q / a); v++) {
          const parts = [...head];
          let t = 0;
          for (let y = 0; y < b2; y++) {
            for (let x = 0; x < a; x++) {
              const i = Math.min(u2 * b2 + y, r - 1) * q + Math.min(v * a + x, q - 1);
              if (t) parts.push(Uint8Array.of(255, 208 + (t - 1) % 8));
              parts.push([s0 + starts[i], ends[i] - starts[i]]);
              t++;
            }
          }
          parts.push(Uint8Array.of(255, 217));
          out2.push([u2, v, parts]);
        }
      }
      return out2;
    };
    let b = Math.max(1, Math.min(r, Math.floor(CHUNK / mh)));
    let all = chunks(b);
    while (b > 1 && all.some(([, , parts]) => payloadSize(parts) > MAX_PAYLOAD2)) all = chunks(--b);
    if (b * mh > MAX_SIDE) reject6(`an NDPI chunk would be ${b * mh} pixels high, more than ${MAX_SIDE}`);
    for (const [u2, v, parts] of all) {
      if (payloadSize(parts) > MAX_PAYLOAD2) reject6(`an NDPI chunk's reference payload exceeds ${MAX_PAYLOAD2} bytes`);
      refs.push([`${li}/c/0/${u2}/${v}`, parts]);
    }
    return [[3, b * mh, a * interval * mw], sof];
  }

  // src/virtualize/nifti/virtualize.ts
  var NiftiError = class extends Error {
  };
  var reject7 = (message) => {
    throw new NiftiError(message);
  };
  var view2 = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var MAX_SAFE2 = BigInt(Number.MAX_SAFE_INTEGER);
  var CHUNK_BYTES = 1 << 17;
  var MAX_CHANNELS2 = 64;
  var LAYOUTS = {
    1: {
      length: 348,
      dim: [40, "i16", 8],
      datatype: [70, "i16"],
      bitpix: [72, "i16"],
      pixdim: [76, "f32", 8],
      vox_offset: [108, "f32"],
      scl_slope: [112, "f32"],
      scl_inter: [116, "f32"],
      xyzt_units: [123, "u8"],
      cal_max: [124, "f32"],
      cal_min: [128, "f32"],
      qform_code: [252, "i16"],
      sform_code: [254, "i16"],
      quatern: [256, "f32", 3],
      qoffset: [268, "f32", 3],
      srow: [280, "f32", 12]
    },
    2: {
      length: 540,
      dim: [16, "i64", 8],
      datatype: [12, "i16"],
      bitpix: [14, "i16"],
      pixdim: [104, "f64", 8],
      vox_offset: [168, "i64"],
      scl_slope: [176, "f64"],
      scl_inter: [184, "f64"],
      xyzt_units: [500, "i32"],
      cal_max: [192, "f64"],
      cal_min: [200, "f64"],
      qform_code: [344, "i32"],
      sform_code: [348, "i32"],
      quatern: [352, "f64", 3],
      qoffset: [376, "f64", 3],
      srow: [400, "f64", 12]
    }
  };
  var HEADER_FIELDS = {
    1: [
      ["sizeof_hdr", 0, "i32"],
      ["data_type", 4, "s10"],
      ["db_name", 14, "s18"],
      ["extents", 32, "i32"],
      ["session_error", 36, "i16"],
      ["regular", 38, "s1"],
      ["dim_info", 39, "u8"],
      ["dim", 40, "i16", 8],
      ["intent_p1", 56, "f32"],
      ["intent_p2", 60, "f32"],
      ["intent_p3", 64, "f32"],
      ["intent_code", 68, "i16"],
      ["datatype", 70, "i16"],
      ["bitpix", 72, "i16"],
      ["slice_start", 74, "i16"],
      ["pixdim", 76, "f32", 8],
      ["vox_offset", 108, "f32"],
      ["scl_slope", 112, "f32"],
      ["scl_inter", 116, "f32"],
      ["slice_end", 120, "i16"],
      ["slice_code", 122, "u8"],
      ["xyzt_units", 123, "u8"],
      ["cal_max", 124, "f32"],
      ["cal_min", 128, "f32"],
      ["slice_duration", 132, "f32"],
      ["toffset", 136, "f32"],
      ["glmax", 140, "i32"],
      ["glmin", 144, "i32"],
      ["descrip", 148, "s80"],
      ["aux_file", 228, "s24"],
      ["qform_code", 252, "i16"],
      ["sform_code", 254, "i16"],
      ["quatern_b", 256, "f32"],
      ["quatern_c", 260, "f32"],
      ["quatern_d", 264, "f32"],
      ["qoffset_x", 268, "f32"],
      ["qoffset_y", 272, "f32"],
      ["qoffset_z", 276, "f32"],
      ["srow_x", 280, "f32", 4],
      ["srow_y", 296, "f32", 4],
      ["srow_z", 312, "f32", 4],
      ["intent_name", 328, "s16"],
      ["magic", 344, "s4"]
    ],
    2: [
      ["sizeof_hdr", 0, "i32"],
      ["magic", 4, "s8"],
      ["datatype", 12, "i16"],
      ["bitpix", 14, "i16"],
      ["dim", 16, "i64", 8],
      ["intent_p1", 80, "f64"],
      ["intent_p2", 88, "f64"],
      ["intent_p3", 96, "f64"],
      ["pixdim", 104, "f64", 8],
      ["vox_offset", 168, "i64"],
      ["scl_slope", 176, "f64"],
      ["scl_inter", 184, "f64"],
      ["cal_max", 192, "f64"],
      ["cal_min", 200, "f64"],
      ["slice_duration", 208, "f64"],
      ["toffset", 216, "f64"],
      ["slice_start", 224, "i64"],
      ["slice_end", 232, "i64"],
      ["descrip", 240, "s80"],
      ["aux_file", 320, "s24"],
      ["qform_code", 344, "i32"],
      ["sform_code", 348, "i32"],
      ["quatern_b", 352, "f64"],
      ["quatern_c", 360, "f64"],
      ["quatern_d", 368, "f64"],
      ["qoffset_x", 376, "f64"],
      ["qoffset_y", 384, "f64"],
      ["qoffset_z", 392, "f64"],
      ["srow_x", 400, "f64", 4],
      ["srow_y", 432, "f64", 4],
      ["srow_z", 464, "f64", 4],
      ["slice_code", 496, "i32"],
      ["xyzt_units", 500, "i32"],
      ["intent_code", 504, "i32"],
      ["intent_name", 508, "s16"],
      ["dim_info", 524, "u8"],
      ["unused_str", 525, "s15"]
    ]
  };
  var TEXT_CODES = /* @__PURE__ */ new Set([4, 6, 8, 32, 44]);
  var INLINE4 = 64;
  var MAX_TEXT4 = 2 ** 16;
  var EXTENSIONS_BUDGET = 2 ** 14;
  var LIST_MOST = Math.floor(EXTENSIONS_BUDGET / 12);
  var SCAN = 2 ** 20;
  var ECODES = `${SOURCE_NODE}/extensions/ecode`;
  var ESIZES = `${SOURCE_NODE}/extensions/esize`;
  var EDATA = `${SOURCE_NODE}/extensions/data`;
  var ECODE_CHUNK = 2 ** 22;
  var SIZES3 = { u8: 1, i16: 2, i32: 4, i64: 8, f32: 4, f64: 8 };
  var DATATYPES = {
    2: ["uint8", 8, 1],
    4: ["int16", 16, 1],
    8: ["int32", 32, 1],
    16: ["float32", 32, 1],
    64: ["float64", 64, 1],
    256: ["int8", 8, 1],
    512: ["uint16", 16, 1],
    768: ["uint32", 32, 1],
    1024: ["int64", 64, 1],
    1280: ["uint64", 64, 1],
    128: ["uint8", 24, 3],
    2304: ["uint8", 32, 4]
  };
  var UNSUPPORTED = {
    1: "BINARY",
    32: "COMPLEX64",
    1536: "FLOAT128",
    1792: "COMPLEX128",
    2048: "COMPLEX256"
  };
  var SPACE_UNITS = { 1: "meter", 2: "millimeter", 3: "micrometer" };
  var TIME_UNITS = { 8: "second", 16: "millisecond", 24: "microsecond" };
  var COLORS = [["R", "FF0000"], ["G", "00FF00"], ["B", "0000FF"], ["A", "FFFFFF"]];
  var TYPES = { t: "time", c: "channel", z: "space", y: "space", x: "space" };
  var ascii = (b) => String.fromCharCode(...b);
  function detectNifti(head) {
    if (head.length < 12) return void 0;
    const v = view2(head);
    const sizes = [v.getInt32(0, true), v.getInt32(0, false)];
    if (sizes.includes(348) && head.length >= 348 && ascii(head.subarray(344, 348)) === "n+1\0") return 1;
    if (sizes.includes(540) && ascii(head.subarray(4, 12)) === "n+2\0\r\n\n") return 2;
    return void 0;
  }
  var valid = (v) => Number.isFinite(v) && v > 0;
  var textEsize = (length2) => Math.ceil((length2 + 8) / 16) * 16;
  var jsonSize3 = (value2) => new TextEncoder().encode(JSON.stringify(value2)).length;
  async function readChain(read, little, start, v) {
    let esizes = new Int32Array(64);
    let ecodes = new Int32Array(64);
    let count = 0;
    let q = start;
    chain: while (q + 8 <= v) {
      const block = await read(q, Math.min(SCAN, v - q));
      const at = view2(block);
      let p = 0;
      while (p + 8 <= block.length) {
        const esize = at.getInt32(p, little);
        if (esize < 8 || q + p + esize > v) {
          q += p;
          break chain;
        }
        if (count === esizes.length) {
          const [s, c] = [new Int32Array(2 * count), new Int32Array(2 * count)];
          s.set(esizes);
          c.set(ecodes);
          [esizes, ecodes] = [s, c];
        }
        esizes[count] = esize;
        ecodes[count++] = at.getInt32(p + 4, little);
        p += esize;
      }
      q += p;
    }
    return [esizes.subarray(0, count), ecodes.subarray(0, count), q];
  }
  function extensionText(ecode, data) {
    if (!TEXT_CODES.has(ecode) || data === void 0) return void 0;
    const nul = data.indexOf(0);
    if (nul >= 0 && !data.subarray(nul + 1).every((x) => x === 0)) return void 0;
    const head = nul < 0 ? data : data.subarray(0, nul);
    return [textJson(head), head.length];
  }
  async function extensionsValue(read, little, endian, start, end, esizes, ecodes) {
    const count = esizes.length;
    if (count <= LIST_MOST) {
      const extensions = [];
      const plans2 = [];
      let size3 = 1;
      let at = start + 8;
      for (let i = 0; i < count && size3 <= EXTENSIONS_BUDGET; i++) {
        const n = esizes[i] - 8;
        const entry2 = { ecode: ecodes[i] };
        const data = n <= MAX_TEXT4 ? await read(at, n) : void 0;
        const text5 = extensionText(ecodes[i], data);
        if (text5 !== void 0) {
          entry2.text = text5[0];
          if (n + 8 !== textEsize(text5[1])) entry2.esize = n + 8;
        } else if (n <= INLINE4) {
          entry2.edata = base64(data);
        } else {
          const path2 = `extensions/${i}`;
          const [rows, chunks] = rowChunks(at, n, 1);
          plans2.push({ path: path2, dataType: "uint8", shape: [n], chunkShape: [rows], dims: ["byte"], chunks });
          entry2.data = `${SOURCE_NODE}/${path2}`;
        }
        extensions.push(entry2);
        size3 += jsonSize3(entry2) + 1;
        at += n + 8;
      }
      if (size3 <= EXTENSIONS_BUDGET) return [extensions, plans2];
    }
    const compact = { ecode: ECODES, esize: ESIZES, data: EDATA };
    const inline = /* @__PURE__ */ new Map();
    let size2 = jsonSize3(compact);
    for (let i = 0, at = start + 8; i < count; at += esizes[i++]) {
      const least = String(i).length + 2 + 1 + 2 + (inline.size > 0 ? 1 : ',"text":{}'.length);
      if (size2 + least > EXTENSIONS_BUDGET) break;
      const n = esizes[i] - 8;
      if (!TEXT_CODES.has(ecodes[i]) || n > MAX_TEXT4) continue;
      const text5 = extensionText(ecodes[i], await read(at, n));
      if (text5 === void 0) continue;
      const more = least - 2 + jsonSize3(text5[0]);
      if (size2 + more <= EXTENSIONS_BUDGET) {
        inline.set(i, text5[0]);
        size2 += more;
      }
    }
    if (inline.size > 0) compact.text = Object.fromEntries(inline);
    const k = Math.ceil(count / ECODE_CHUNK);
    const c = Math.ceil(count / k);
    const plans = [];
    for (const [name, column2] of [["ecode", ecodes], ["esize", esizes]]) {
      const values2 = new Uint8Array(k * c * 4);
      const out2 = view2(values2);
      column2.forEach((x, i) => out2.setInt32(4 * i, x, little));
      plans.push({
        path: `extensions/${name}`,
        dataType: "int32",
        shape: [count],
        chunkShape: [c],
        dims: ["index"],
        endian,
        chunks: new Map(Array.from({ length: k }, (_, j) => [String(j), values2.slice(j * c * 4, (j + 1) * c * 4)]))
      });
    }
    plans.push(...await dataFamily("extensions/data", window(read, end), start, esizes, inline));
    return [compact, plans];
  }
  var RAGGED_CHUNK3 = 2 ** 20;
  var term = (r) => payloadSize([r, r]) / 2;
  async function dataFamily(path2, read, start, esizes, inline) {
    const count = esizes.length;
    const starts = new Float64Array(count + 1);
    let total = 0;
    for (let i = 0; i < count; i++) {
      starts[i] = total;
      if (!inline.has(i)) total += esizes[i] - 8;
    }
    starts[count] = total;
    const offsets = new Uint8Array(8 * (count + 1));
    const out2 = view2(offsets);
    starts.forEach((x, i) => {
      out2.setUint32(8 * i, x % 2 ** 32, true);
      out2.setUint32(8 * i + 4, Math.floor(x / 2 ** 32), true);
    });
    const [offsetShape, cut] = await gridChunks(0, [count + 1], 8, async (o, n) => offsets.slice(o, o + n));
    const offsetChunks = /* @__PURE__ */ new Map();
    for (const [key2, v] of cut) {
      offsetChunks.set(key2, v instanceof Uint8Array ? v : concat2(v.map((r) => r instanceof Uint8Array ? r : offsets.subarray(r[0], r[0] + r[1]))));
    }
    const plans = [{
      path: `${path2}/offsets`,
      dataType: "int64",
      shape: [count + 1],
      chunkShape: offsetShape,
      dims: ["index"],
      chunks: offsetChunks
    }];
    if (total === 0) return plans;
    const sizeC = Math.ceil(total / Math.ceil(total / RAGGED_CHUNK3));
    const dataChunks = /* @__PURE__ */ new Map();
    let first = 0;
    let source = start;
    for (let c = 0; c < Math.ceil(total / sizeC); c++) {
      const lo = c * sizeC;
      const hi = Math.min(total, (c + 1) * sizeC);
      while (first < count && (inline.has(first) || starts[first + 1] <= lo)) source += esizes[first++];
      const ranges = [];
      let fixed = 0;
      let copy;
      let filled = 0;
      for (let i = first, o = source; i < count && starts[i] < hi; o += esizes[i++]) {
        if (inline.has(i) || starts[i + 1] <= lo) continue;
        const at = starts[i];
        const begin = o + 8 + Math.max(lo, at) - at;
        const n = Math.min(hi, starts[i + 1]) - Math.max(lo, at);
        const last = ranges[ranges.length - 1];
        if (copy !== void 0) {
          copy.set(await read(begin, n), filled);
          filled += n;
        } else if (last !== void 0 && last[0] + last[1] === begin) {
          last[1] += n;
        } else {
          if (last !== void 0) fixed += term(last);
          ranges.push([begin, n]);
        }
        if (copy === void 0 && ranges.length > 1 && fixed + term(ranges[ranges.length - 1]) > MAX_PAYLOAD_BYTES) {
          copy = new Uint8Array(sizeC);
          for (const [o2, n2] of ranges) {
            copy.set(await read(o2, n2), filled);
            filled += n2;
          }
        }
      }
      const pad = hi - lo < sizeC ? [new Uint8Array(sizeC - (hi - lo))] : [];
      if (copy !== void 0) {
        dataChunks.set(String(c), copy);
        continue;
      }
      ranges.push(...pad);
      if (payloadSize(ranges) > MAX_PAYLOAD_BYTES) {
        const parts = [];
        for (const r of ranges) parts.push(r instanceof Uint8Array ? r : await read(r[0], r[1]));
        dataChunks.set(String(c), concat2(parts));
      } else {
        dataChunks.set(String(c), ranges);
      }
    }
    plans.push({ path: `${path2}/data`, dataType: "uint8", shape: [total], chunkShape: [sizeC], dims: ["byte"], chunks: dataChunks });
    return plans;
  }
  function window(read, end) {
    let start = 0;
    let data = new Uint8Array();
    return async (offset, length2) => {
      if (!(start <= offset && offset + length2 <= start + data.length)) {
        start = offset;
        data = await read(offset, Math.max(length2, Math.min(SCAN, end - offset)));
      }
      return data.subarray(offset - start, offset - start + length2);
    };
  }
  function concat2(parts) {
    const out2 = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) {
      out2.set(p, at);
      at += p.length;
    }
    return out2;
  }
  async function allZero(read, start, end) {
    for (; start < end; start += SCAN) {
      if (!(await read(start, Math.min(SCAN, end - start))).every((x) => x === 0)) return false;
    }
    return true;
  }
  async function virtualizeNifti(url2, read, fileSize) {
    const version = detectNifti(await read(0, Math.min(552, fileSize)));
    if (version === void 0) return reject7("not a NIfTI-1 or NIfTI-2 single file");
    const layout = LAYOUTS[version];
    const length2 = layout.length;
    if (fileSize < length2) reject7(`file too short for a ${length2}-byte NIfTI-${version} header`);
    const header = view2(await read(0, length2));
    const little = header.getInt32(0, true) === length2;
    const one3 = (at, kind) => {
      switch (kind) {
        case "u8":
          return header.getUint8(at);
        case "i16":
          return header.getInt16(at, little);
        case "i32":
          return header.getInt32(at, little);
        case "i64":
          return header.getBigInt64(at, little);
        case "f32":
          return header.getFloat32(at, little);
        case "f64":
          return header.getFloat64(at, little);
      }
    };
    const field = (name) => one3(layout[name][0], layout[name][1]);
    const fields2 = (name) => {
      const [at, kind, count] = layout[name];
      const size2 = { u8: 1, i16: 2, i32: 4, i64: 8, f32: 4, f64: 8 }[kind];
      return Array.from({ length: count }, (_, i) => one3(at + i * size2, kind));
    };
    const num2 = (name) => Number(field(name));
    const nums = (name) => fields2(name).map(Number);
    const dim = fields2("dim").map(BigInt);
    const n = Number(dim[0]);
    if (!(n >= 1 && n <= 7)) reject7(`dim[0] = ${dim[0]} is not from 1 to 7`);
    const sizes = Array(8).fill(1n);
    for (let i = 1; i <= n; i++) {
      if (dim[i] < 1n || dim[i] > MAX_SAFE2) reject7(`dim[${i}] = ${dim[i]} is not from 1 to 2^53 - 1`);
      sizes[i] = dim[i];
    }
    if (sizes[6] !== 1n || sizes[7] !== 1n) reject7("dimensions 6 and 7 must have size 1");
    const code = num2("datatype");
    const bitpix = num2("bitpix");
    if (code in UNSUPPORTED) reject7(`unsupported NIfTI datatype ${code} (${UNSUPPORTED[code]})`);
    if (!(code in DATATYPES)) reject7(`unknown NIfTI datatype ${code}`);
    const [dataType3, bits, samples] = DATATYPES[code];
    if (bitpix !== bits) reject7(`bitpix ${bitpix} does not match datatype ${code}`);
    const color = samples > 1;
    if (color && n >= 5) reject7("color data with a fifth dimension");
    const rawOffset = field("vox_offset");
    let vox;
    if (typeof rawOffset === "number") {
      if (!Number.isInteger(rawOffset)) reject7(`vox_offset ${rawOffset} is not an integer`);
      vox = BigInt(rawOffset);
    } else {
      vox = rawOffset;
    }
    if (vox < BigInt(length2 + 4) || vox > MAX_SAFE2) reject7(`vox_offset ${vox} is not from ${length2 + 4} to 2^53 - 1`);
    const b = bits / 8;
    const total = sizes[1] * sizes[2] * sizes[3] * sizes[4] * sizes[5] * BigInt(b);
    if (total > MAX_SAFE2 || vox + total > BigInt(fileSize)) {
      reject7(`the ${total}-byte voxel data at ${vox} is outside the ${fileSize}-byte file`);
    }
    const [X, Y, Z, T, C] = sizes.slice(1, 6).map(Number);
    const v = Number(vox);
    let scaling;
    if (!color) {
      const slope = num2("scl_slope");
      const inter = num2("scl_inter");
      if (Number.isFinite(slope) && slope !== 0) scaling = [slope, Number.isFinite(inter) ? inter : 0];
    }
    const nontrivial = scaling !== void 0 && (scaling[0] !== 1 || scaling[1] !== 0);
    const unitsCode = num2("xyzt_units");
    const space = SPACE_UNITS[unitsCode & 7];
    const time = TIME_UNITS[unitsCode & 56];
    const pixdim = nums("pixdim");
    let affine = null;
    let diagonal;
    let offset;
    if (num2("sform_code") > 0) {
      affine = "sform";
      const s = nums("srow");
      if (s.every(Number.isFinite) && [1, 2, 4, 6, 8, 9].every((k) => s[k] === 0) && s[0] > 0 && s[5] > 0 && s[10] > 0) {
        diagonal = [s[0], s[5], s[10]];
        offset = [s[3], s[7], s[11]];
      }
    } else if (num2("qform_code") > 0) {
      affine = "qform";
      const q2 = nums("quatern");
      const o = nums("qoffset");
      if (q2.every((x) => x === 0) && !(pixdim[0] < 0) && pixdim.slice(1, 4).every(valid) && o.every(Number.isFinite)) {
        diagonal = pixdim.slice(1, 4);
        offset = o;
      }
    }
    const scale = { t: valid(pixdim[4]) ? pixdim[4] : 1, c: 1 };
    const unit = { t: valid(pixdim[4]) ? time : void 0 };
    ["x", "y", "z"].forEach((a, k) => {
      const s = diagonal ? diagonal[k] : pixdim[k + 1];
      scale[a] = valid(s) ? s : 1;
      unit[a] = valid(s) ? space : void 0;
    });
    let channels;
    if (color) {
      channels = COLORS.slice(0, samples).map(([label, color2]) => ({
        label,
        color: color2,
        active: true,
        window: { min: 0, max: 255, start: 0, end: 255 }
      }));
    } else {
      let lo = num2("cal_min");
      let hi = num2("cal_max");
      if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo && C <= MAX_CHANNELS2) {
        if (scaling) {
          const [s, i] = scaling;
          const a = (lo - i) / s;
          const c = (hi - i) / s;
          [lo, hi] = a <= c ? [a, c] : [c, a];
        }
        if (Number.isFinite(lo) && Number.isFinite(hi)) {
          channels = Array.from({ length: C }, (_, k) => ({
            label: `C${k}`,
            color: "FFFFFF",
            active: true,
            window: { min: lo, max: hi, start: lo, end: hi }
          }));
        }
      }
    }
    const axes = [];
    if (n >= 4) axes.push("t");
    if (n >= 5 || color) axes.push("c");
    if (n >= 3) axes.push("z");
    axes.push("y", "x");
    const shape = { t: T, c: color ? samples : C, z: Z, y: Y, x: X };
    const stored = [...n >= 5 ? ["c"] : [], ...axes.filter((a) => a !== "c"), ...color ? ["c"] : []];
    const [grid3, voxelChunks] = await gridChunks(v, stored.map((a) => shape[a]), b / samples, read, CHUNK_BYTES);
    const chunkShape = Object.fromEntries(stored.map((a, i) => [a, grid3[i]]));
    const translation = diagonal ? axes.map((a) => a === "x" ? offset[0] : a === "y" ? offset[1] : a === "z" ? offset[2] : 0) : void 0;
    const endian = little ? "little" : "big";
    const codecs = [];
    if (stored.join() !== axes.join()) {
      codecs.push({ name: "transpose", configuration: { order: stored.map((a) => axes.indexOf(a)) } });
    }
    codecs.push(bits / samples > 8 ? { name: "bytes", configuration: { endian } } : { name: "bytes" });
    const utf89 = new TextEncoder();
    const json = (x) => utf89.encode(stringifyJson(x));
    const ome = {
      version: "0.5",
      multiscales: [{
        axes: axes.map((a) => ({ name: a, type: TYPES[a], ...unit[a] ? { unit: unit[a] } : {} })),
        datasets: [{
          path: "0",
          coordinateTransformations: [
            { type: "scale", scale: axes.map((a) => scale[a]) },
            ...translation ? [{ type: "translation", translation }] : []
          ]
        }]
      }],
      ...channels ? { omero: { channels } } : {}
    };
    const floatJson = (at, kind) => {
      const bits2 = kind === "f32" ? BigInt(header.getUint32(at, little)) : header.getBigUint64(at, little);
      const v2 = Number(one3(at, kind));
      const canonical2 = kind === "f32" ? 0x7fc00000n : 0x7ff8000000000000n;
      if (Object.is(v2, -0) || Number.isNaN(v2) && bits2 !== canonical2) {
        return { bits: bits2.toString(16).padStart(kind === "f32" ? 8 : 16, "0") };
      }
      return jsonNumber(v2);
    };
    const headerJson = {};
    const headerRest = {};
    for (const [name, at, kind, count] of HEADER_FIELDS[version]) {
      if (kind[0] === "s") {
        const raw = new Uint8Array(header.buffer, header.byteOffset + at, Number(kind.slice(1)));
        const nul = raw.indexOf(0);
        headerJson[name] = textJson(nul < 0 ? raw : raw.subarray(0, nul));
        const tail = nul < 0 ? new Uint8Array() : raw.subarray(nul + 1);
        if (name !== "magic" && tail.some((x) => x !== 0)) headerRest[name] = base64(tail);
      } else {
        const k = kind;
        const value2 = (p) => k === "f32" || k === "f64" ? floatJson(p, k) : jsonNumber(one3(p, k));
        headerJson[name] = count === void 0 ? value2(at) : Array.from({ length: count }, (_, i) => value2(at + i * SIZES3[k]));
      }
    }
    const meta = { nifti_version: version, byte_order: endian, header: headerJson };
    if (Object.keys(headerRest).length > 0) meta.header_rest = headerRest;
    const extender = await read(length2, 4);
    if (!(extender[0] <= 1 && extender[1] === 0 && extender[2] === 0 && extender[3] === 0)) {
      meta.extender = base64(extender);
    }
    const extended = extender[0] !== 0;
    const plans = [];
    const bytesPlan = (path2, at, n2) => {
      const [rows, chunks2] = rowChunks(at, n2, 1);
      return { path: path2, dataType: "uint8", shape: [n2], chunkShape: [rows], dims: ["byte"], chunks: chunks2 };
    };
    let q = length2 + 4;
    if (extended) {
      const [esizes, ecodes, end2] = await readChain(read, little, q, v);
      const [value2, more] = await extensionsValue(read, little, endian, q, end2, esizes, ecodes);
      meta.extensions = value2;
      plans.push(...more);
      q = end2;
    }
    if (q < v && !await allZero(read, q, v)) {
      if (extended) meta.extensions_truncated = true;
      plans.push(bytesPlan("unparsed", q, v - q));
      meta.unparsed = `${SOURCE_NODE}/unparsed`;
    }
    const end = v + Number(total);
    if (end < fileSize) {
      plans.push(bytesPlan("trailing", end, fileSize - end));
      meta.trailing = `${SOURCE_NODE}/trailing`;
    }
    if (nontrivial) meta.scaling = { slope: scaling[0], inter: scaling[1] };
    if (affine !== null) meta.affine = { form: affine, applied: diagonal !== void 0 };
    const attributes = declare({ ome }, "nifti", url2, meta);
    const entries = [];
    for (const [coords, parts] of voxelChunks) {
      const at = coords.split("/");
      const key2 = `0/c/${axes.map((a) => at[stored.indexOf(a)]).join("/")}`;
      entries.push(parts instanceof Uint8Array ? { key: key2, bytes: parts, compress: true } : { key: key2, ranges: parts.map(toRange) });
    }
    const chunks = entries.length;
    entries.push(
      { key: "zarr.json", bytes: json({ zarr_format: 3, node_type: "group", attributes }) },
      {
        key: "0/zarr.json",
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape: axes.map((a) => shape[a]),
          data_type: dataType3,
          chunk_grid: { name: "regular", configuration: { chunk_shape: axes.map((a) => chunkShape[a]) } },
          chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
          fill_value: 0,
          codecs,
          dimension_names: axes,
          attributes: {}
        })
      }
    );
    if (plans.length > 0) entries.push(...emitPlans(plans, declare({}, "nifti", void 0)));
    return {
      sources: [{ url: url2 }],
      entries,
      summary: {
        version,
        byteOrder: endian,
        sizes: Object.fromEntries(axes.map((a) => [a, shape[a]])),
        dataType: dataType3,
        color,
        chunkShape: axes.map((a) => chunkShape[a]),
        chunks,
        scaling: nontrivial ? { slope: scaling[0], inter: scaling[1] } : null,
        affine,
        translation: translation !== void 0,
        extensions: extender[0] !== 0
      }
    };
  }

  // src/virtualize/store.ts
  var StoreError = class extends Error {
  };
  var StoreLimitError = class extends Error {
  };
  var StoreReadError = class extends Error {
  };
  var reject8 = (message) => {
    throw new StoreError(message);
  };
  var MAX_SAFE3 = Number.MAX_SAFE_INTEGER;
  var MAX_DOCUMENT = 1 << 24;
  var MAX_DEPTH4 = 256;
  var MAX_OBJECTS2 = 1e5;
  var SPLIT2 = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;
  var UNRESERVED2 = /[A-Za-z0-9\-._~]/;
  var PATH_SAFE = /[A-Za-z0-9\-._~!$&'()*+,;=:@/]/;
  var utf87 = new TextEncoder();
  function pct(s, safe2) {
    let out2 = "";
    for (const b of utf87.encode(s)) {
      const c = String.fromCharCode(b);
      out2 += b < 128 && safe2.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
    }
    return out2;
  }
  function objectUrl(storeUrl, key2) {
    return storeUrl + pct(key2, PATH_SAFE);
  }
  function queryEncode(s) {
    return pct(s, UNRESERVED2);
  }
  function checkStoreUrl(url2) {
    const m = url2.match(SPLIT2);
    if (!isUriReference(url2) || m === null) reject8(`${JSON.stringify(url2)} is not a valid URI`);
    const [, scheme, authority, path2, query, fragment] = m;
    if (scheme === void 0 || !["http", "https"].includes(scheme.toLowerCase())) {
      reject8(`store URL ${url2} is not http or https`);
    }
    if (authority === void 0 || authority.includes("@")) reject8(`store URL ${url2} has no authority, or has userinfo`);
    if (query !== void 0 || fragment !== void 0) reject8(`store URL ${url2} has a query or a fragment`);
    if (!path2.endsWith("/")) reject8(`store URL ${url2} does not end in /`);
    return [scheme, authority, path2];
  }
  function percentDecode(s) {
    const out2 = [];
    for (let i = 0; i < s.length; ) {
      if (s[i] === "%") {
        out2.push(parseInt(s.slice(i + 1, i + 3), 16));
        i += 3;
      } else {
        out2.push(s.charCodeAt(i));
        i += 1;
      }
    }
    return Uint8Array.from(out2);
  }
  function listingEndpoint(url2) {
    const [scheme, authority, path2] = checkStoreUrl(url2);
    let host = authority;
    if (host.startsWith("[")) host = host.slice(0, host.indexOf("]") + 1);
    else if (host.includes(":")) host = host.slice(0, host.lastIndexOf(":"));
    host = host.toLowerCase();
    const labels = host.split(".");
    const virtual = host.endsWith(".amazonaws.com") && labels.slice(1).some((l) => l === "s3" || l.startsWith("s3-"));
    let endpoint;
    let prefixPath;
    if (virtual) {
      endpoint = `${scheme}://${authority}/`;
      prefixPath = path2.slice(1);
    } else {
      if (path2 === "/") reject8(`path-style store URL ${url2} names no bucket`);
      const rest = path2.slice(1);
      const i = rest.indexOf("/");
      const bucket = rest.slice(0, i);
      if (bucket === "") reject8(`path-style store URL ${url2} has an empty bucket`);
      endpoint = `${scheme}://${authority}/${bucket}/`;
      prefixPath = rest.slice(i + 1);
    }
    let prefix2 = "";
    try {
      prefix2 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(percentDecode(prefixPath));
    } catch {
      reject8(`the key prefix of ${url2} is not UTF-8`);
    }
    return [endpoint, prefix2];
  }
  function isChar(c) {
    return c === 9 || c === 10 || c === 13 || c >= 32 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
  }
  var NAME_START = /[A-Za-z_:]/;
  var NAME_CHAR = /[A-Za-z0-9_:.-]/;
  var WS = /* @__PURE__ */ new Set([" ", "	", "\r", "\n"]);
  var ENTITIES = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
  var Xml = class {
    pos = 0;
    depth = 0;
    // of the element being read
    s;
    what;
    error;
    constructor(s, what = "listing", error = (m) => new StoreError(m)) {
      this.s = s;
      this.what = what;
      this.error = error;
    }
    fail(why) {
      throw this.error(`${this.what} is not well formed: ${why} at ${this.pos}`);
    }
    ws() {
      while (this.pos < this.s.length && WS.has(this.s[this.pos])) this.pos++;
    }
    at(t) {
      return this.s.startsWith(t, this.pos);
    }
    chars(t) {
      for (const ch of t) {
        const c = ch.codePointAt(0);
        if (!isChar(c)) this.fail(`character U+${c.toString(16).toUpperCase().padStart(4, "0")}`);
      }
    }
    comment() {
      const end = this.s.indexOf("--", this.pos + 4);
      if (end < 0 || !this.s.startsWith("-->", end)) this.fail("bad comment");
      this.chars(this.s.slice(this.pos + 4, end));
      this.pos = end + 3;
    }
    misc() {
      for (; ; ) {
        this.ws();
        if (this.at("<!--")) this.comment();
        else return;
      }
    }
    name() {
      const start = this.pos;
      if (start >= this.s.length || !NAME_START.test(this.s[start])) this.fail("expected a name");
      this.pos++;
      while (this.pos < this.s.length && NAME_CHAR.test(this.s[this.pos])) this.pos++;
      return this.s.slice(start, this.pos);
    }
    reference() {
      const end = this.s.indexOf(";", this.pos);
      if (end < 0) this.fail("unterminated reference");
      const body = this.s.slice(this.pos + 1, end);
      this.pos = end + 1;
      if (Object.hasOwn(ENTITIES, body)) return ENTITIES[body];
      let v;
      if (/^#x[0-9a-fA-F]+$/.test(body)) v = body.length < 12 ? parseInt(body.slice(2), 16) : -1;
      else if (/^#[0-9]+$/.test(body)) v = body.length < 12 ? parseInt(body.slice(1), 10) : -1;
      else this.fail(`unknown reference &${body};`);
      if (!isChar(v)) this.fail(`reference &${body}; is not a character`);
      return String.fromCodePoint(v);
    }
    chardata(stop) {
      const start = this.pos;
      while (this.pos < this.s.length && this.s[this.pos] !== "<" && this.s[this.pos] !== "&" && this.s[this.pos] !== stop) this.pos++;
      const t = this.s.slice(start, this.pos);
      this.chars(t);
      return t;
    }
    element() {
      if (!this.at("<")) this.fail("expected an element");
      if (++this.depth > MAX_DEPTH4) this.fail(`elements nest more than ${MAX_DEPTH4} deep`);
      const el = this.elementBody();
      this.depth--;
      return el;
    }
    elementBody() {
      this.pos++;
      const el = { name: this.name(), children: [], text: [], attributes: [] };
      const s = this.s;
      for (; ; ) {
        if (this.pos < s.length && WS.has(s[this.pos])) {
          this.ws();
          if (this.pos < s.length && NAME_START.test(s[this.pos])) {
            const name = this.name();
            this.ws();
            if (!this.at("=")) this.fail("expected =");
            this.pos++;
            this.ws();
            const q = this.pos < s.length ? s[this.pos] : "";
            if (q !== "'" && q !== '"') this.fail("expected a quoted value");
            this.pos++;
            const value2 = [];
            for (; ; ) {
              value2.push(this.chardata(q));
              if (this.at("&")) value2.push(this.reference());
              else if (this.at(q)) {
                this.pos++;
                break;
              } else this.fail("bad attribute value");
            }
            el.attributes.push([name, value2.join("")]);
            continue;
          }
        }
        break;
      }
      if (this.at("/>")) {
        this.pos += 2;
        return el;
      }
      if (!this.at(">")) this.fail("expected >");
      this.pos++;
      for (; ; ) {
        if (this.pos >= s.length) this.fail("unterminated element");
        if (this.at("</")) {
          this.pos += 2;
          if (this.name() !== el.name) this.fail("mismatched end tag");
          this.ws();
          if (!this.at(">")) this.fail("expected >");
          this.pos++;
          return el;
        }
        if (this.at("<!--")) this.comment();
        else if (this.at("<!") || this.at("<?")) this.fail("unsupported markup");
        else if (this.at("<")) el.children.push(this.element());
        else if (this.at("&")) el.text.push(this.reference());
        else {
          const t = this.chardata("<");
          if (t.includes("]]>")) this.fail("]]> in character data");
          el.text.push(t);
        }
      }
    }
    document() {
      this.ws();
      if (this.at("<?xml") && this.pos + 5 < this.s.length && WS.has(this.s[this.pos + 5])) {
        const end = this.s.indexOf("?>", this.pos + 5);
        if (end < 0) this.fail("unterminated XML declaration");
        this.chars(this.s.slice(this.pos, end));
        this.pos = end + 2;
      }
      this.misc();
      const root = this.element();
      this.misc();
      if (this.pos !== this.s.length) this.fail("content after the root element");
      return root;
    }
  };
  function parseXml(s, what, error) {
    return new Xml(s, what, error).document();
  }
  function text3(el) {
    if (el.children.length) reject8(`listing: <${el.name}> has a child element`);
    return el.text.join("");
  }
  function parseListing(body, prefix2) {
    let s = "";
    try {
      s = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body);
    } catch {
      reject8("listing is not UTF-8");
    }
    const root = new Xml(s).document();
    if (root.name !== "ListBucketResult") reject8(`listing root element is <${root.name}>, not <ListBucketResult>`);
    const truncated = root.children.filter((c) => c.name === "IsTruncated");
    if (truncated.length !== 1 || !["true", "false"].includes(text3(truncated[0]))) {
      reject8("listing needs exactly one IsTruncated of true or false");
    }
    const tokens = root.children.filter((c) => c.name === "NextContinuationToken");
    if (tokens.length > 1) reject8("listing has more than one NextContinuationToken");
    const token = tokens.length ? text3(tokens[0]) : void 0;
    const objects = [];
    for (const c of root.children) {
      if (c.name !== "Contents") continue;
      const keys = c.children.filter((x) => x.name === "Key");
      const sizes = c.children.filter((x) => x.name === "Size");
      if (keys.length !== 1 || sizes.length !== 1) reject8("listing Contents needs exactly one Key and one Size");
      const key2 = text3(keys[0]);
      const size2 = text3(sizes[0]);
      if (!/^[0-9]+$/.test(size2) || size2.replace(/^0+/, "").length > 16 || Number(size2) > MAX_SAFE3) {
        reject8(`listing Size ${JSON.stringify(size2.slice(0, 40))} is not a size`);
      }
      if (!key2.startsWith(prefix2)) reject8(`listed key ${JSON.stringify(key2)} is outside the prefix ${JSON.stringify(prefix2)}`);
      objects.push([key2, Number(size2)]);
    }
    if (text3(truncated[0]) === "true") {
      if (!token) reject8("truncated listing without a NextContinuationToken");
      if (objects.length === 0) reject8("truncated listing without a Contents");
      return { objects, token };
    }
    return { objects };
  }
  function checkNumbers(v) {
    if (typeof v === "number") {
      if (!Number.isFinite(v)) reject8("JSON number is not finite in binary64");
    } else if (Array.isArray(v)) {
      for (const x of v) checkNumbers(x);
    } else if (v !== null && typeof v === "object") {
      for (const x of Object.values(v)) checkNumbers(x);
    }
  }
  var RawJSON = JSON;
  var INTEGER4 = /^-?(?:0|[1-9][0-9]*)$/;
  var NoSourceText = class extends Error {
    constructor() {
      super("JSON.parse gives the reviver no source text (needs JSON.parse source text access, as in Node 21+)");
    }
  };
  function keepIntegers(_key, value2, context) {
    if (typeof value2 !== "number") return value2;
    if (context?.source === void 0) throw new NoSourceText();
    if (!INTEGER4.test(context.source)) return Object.is(value2, -0) ? RawJSON.rawJSON("-0.0") : value2;
    if (Object.is(value2, -0)) return 0;
    if (Math.abs(value2) <= MAX_SAFE3 || !Number.isFinite(value2)) return value2;
    return RawJSON.rawJSON(context.source);
  }
  function isRawInteger(v) {
    return v !== null && typeof v === "object" && RawJSON.isRawJSON(v);
  }
  function parseJson(data) {
    if (data.length > MAX_DOCUMENT) reject8(`JSON document of ${data.length} bytes exceeds ${MAX_DOCUMENT}`);
    if (data[0] === 239 && data[1] === 187 && data[2] === 191) reject8("JSON document starts with a byte order mark");
    let s = "";
    try {
      s = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(data);
    } catch {
      reject8("JSON document is not UTF-8");
    }
    if (nesting(s) > MAX_DEPTH4) reject8(`JSON nests more than ${MAX_DEPTH4} deep`);
    let v = null;
    try {
      v = JSON.parse(s, keepIntegers);
    } catch (e) {
      if (e instanceof NoSourceText) throw e;
      reject8(`invalid JSON: ${e.message}`);
    }
    checkNumbers(v);
    return v;
  }
  function nesting(s) {
    let depth2 = 0, deepest = 0, open = true;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c === 34 && open) {
        let j = i + 1;
        while (j < s.length && s.charCodeAt(j) !== 34) j += s.charCodeAt(j) === 92 ? 2 : 1;
        if (j >= s.length) open = false;
        else i = j;
      } else if (c === 91 || c === 123) {
        deepest = Math.max(deepest, ++depth2);
      } else if (c === 93 || c === 125) {
        depth2--;
      }
    }
    return deepest;
  }
  function show(v) {
    return String(JSON.stringify(v));
  }
  function isNumber2(v) {
    return typeof v === "number" || isRawInteger(v);
  }
  function num(v) {
    return isRawInteger(v) ? Number(v.rawJSON) : v;
  }
  function asInt(v, lo = -MAX_SAFE3, hi = MAX_SAFE3) {
    if (isRawInteger(v)) v = num(v) + 0;
    if (typeof v !== "number" || !Number.isInteger(v) || Math.abs(v) > MAX_SAFE3) return void 0;
    return v >= lo && v <= hi ? v : void 0;
  }
  function isObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v) && !RawJSON.isRawJSON(v);
  }
  function has(o, k) {
    return Object.hasOwn(o, k);
  }
  function without(o, drop) {
    return Object.fromEntries(Object.entries(o).filter(([k]) => !drop.includes(k)));
  }
  function compareKeys(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const x = a.codePointAt(i);
      const y = b.codePointAt(i);
      if (x !== y) return x < y ? -1 : 1;
      if (x > 65535) i++;
    }
    return a.length - b.length;
  }
  function ignored(rel) {
    return rel === "" || rel.endsWith("/") || rel.split("/").some((s) => s === "" || s === "." || s === "..");
  }
  function folderMarker(rel, size2) {
    return size2 === 0 && (rel === "" || rel.endsWith("/"));
  }
  var CONCURRENCY = 16;
  var PREFETCH_BYTES = 64 << 20;
  var settle = (p) => p.then((value2) => ({ ok: true, value: value2 }), (error) => ({ ok: false, error }));
  var Prefetch = class {
    #queue;
    #pos = 0;
    #size;
    #state = /* @__PURE__ */ new Map();
    #result = /* @__PURE__ */ new Map();
    #held = 0;
    #running = 0;
    #closed = false;
    #read;
    #concurrency;
    #budget;
    #wanted;
    /** `wanted(key)` is false for a key the profile will not read after all, and undefined
     * while that is not known yet (asked again after each document the profile reads). */
    constructor(read, plan, concurrency, budget, wanted) {
      this.#read = read;
      this.#concurrency = concurrency;
      this.#budget = budget;
      this.#wanted = wanted;
      this.#queue = plan.map(([k]) => k);
      this.#size = new Map(plan);
      for (const [k] of plan) this.#state.set(k, "queued");
      this.#pump();
    }
    #pump() {
      while (!this.#closed && this.#running < this.#concurrency && this.#pos < this.#queue.length) {
        const key2 = this.#queue[this.#pos];
        if (this.#state.get(key2) !== "queued") {
          this.#pos++;
          continue;
        }
        const wanted = this.#wanted === void 0 ? true : this.#wanted(key2);
        if (wanted === void 0) return;
        if (!wanted) {
          this.#state.delete(key2);
          this.#pos++;
          continue;
        }
        const size2 = this.#size.get(key2);
        if (this.#held > 0 && this.#held + size2 > this.#budget) return;
        this.#pos++;
        this.#state.set(key2, "started");
        this.#held += size2;
        this.#running++;
        const r = settle(this.#read(key2));
        this.#result.set(key2, r);
        void r.then(() => {
          this.#running--;
          this.#pump();
        });
      }
    }
    /** The result of reading `key`; undefined if it was not planned, was taken already, or
     * was not started (the caller reads it). */
    take(key2) {
      const state = this.#state.get(key2);
      this.#state.delete(key2);
      let r;
      if (state === "started") {
        r = this.#result.get(key2);
        this.#result.delete(key2);
        void r.then(() => {
          this.#held -= this.#size.get(key2);
          this.#pump();
        });
      }
      this.#pump();
      return r;
    }
    close() {
      this.#closed = true;
    }
  };
  function prefetchDocuments(store, keys, wanted) {
    if ((store.concurrency ?? 1) <= 1 || store.prefetch !== void 0) return;
    const plan = [];
    for (const k of new Set(keys)) {
      const size2 = store.objects.get(k);
      if (size2 > 0 && size2 <= MAX_DOCUMENT) plan.push([k, size2]);
    }
    store.prefetch = new Prefetch((k) => store.read(k), plan, store.concurrency, store.prefetchBytes ?? PREFETCH_BYTES, wanted);
  }
  function closeStore(store) {
    store.prefetch?.close();
  }
  function addListed(store, listed, prefix2, seen) {
    store.ignored ??= [];
    store.folders ??= [];
    for (const [key2, size2] of listed) {
      if (seen.has(key2)) reject8(`key ${JSON.stringify(key2)} is listed twice`);
      seen.add(key2);
      const rel = key2.slice(prefix2.length);
      if (!ignored(rel)) store.objects.set(rel, size2);
      else if (!folderMarker(rel, size2)) store.ignored.push(rel);
      else if (rel && !ignored(rel.slice(0, -1))) store.folders.push(rel);
    }
    store.listed = seen.size;
  }
  async function readDocument(store, key2, { keep = false } = {}) {
    const size2 = store.objects.get(key2);
    if (size2 > MAX_DOCUMENT) reject8(`${key2}: JSON document of ${size2} bytes exceeds ${MAX_DOCUMENT}`);
    if (!size2) return parseJson(new Uint8Array(0));
    const kept = store.kept ??= /* @__PURE__ */ new Map();
    const r = kept.get(key2) ?? store.prefetch?.take(key2) ?? settle(store.read(key2));
    if (keep) kept.set(key2, r);
    else kept.delete(key2);
    const s = await r;
    if (!s.ok) throw s.error;
    return parseJson(s.value);
  }
  async function openHttpStore(url2, { fetch: f = (u2, i) => fetch(u2, i), maxObjects = MAX_OBJECTS2, concurrency = CONCURRENCY } = {}) {
    const [endpoint, prefix2] = listingEndpoint(url2);
    const store = {
      url: url2,
      objects: /* @__PURE__ */ new Map(),
      listed: 0,
      requests: 0,
      concurrency,
      async read(key2) {
        const size2 = this.objects.get(key2);
        if (size2 === 0) return new Uint8Array(0);
        const u2 = objectUrl(url2, key2);
        let r;
        try {
          r = await f(u2, { headers: { Range: `bytes=0-${size2 - 1}` } });
        } catch (e) {
          throw new StoreReadError(`${u2}: ${e.message}`);
        }
        if (r.status !== 200 && r.status !== 206) throw new StoreReadError(`${u2}: HTTP ${r.status}`);
        const data = new Uint8Array(await r.arrayBuffer());
        if (data.length !== size2) throw new StoreReadError(`${u2}: read ${data.length} bytes, the listing says ${size2}`);
        return data;
      },
      async readRange(key2, offset, length2) {
        if (length2 === 0) return new Uint8Array(0);
        const u2 = objectUrl(url2, key2);
        let r;
        try {
          r = await f(u2, { headers: { Range: `bytes=${offset}-${offset + length2 - 1}` } });
        } catch (e) {
          throw new StoreReadError(`${u2}: ${e.message}`);
        }
        if (r.status !== 206 && !(r.status === 200 && offset === 0)) throw new StoreReadError(`${u2}: HTTP ${r.status}`);
        const data = new Uint8Array(await r.arrayBuffer());
        if (data.length !== length2) throw new StoreReadError(`${u2}: read ${data.length} bytes at ${offset}, not ${length2}`);
        return data;
      }
    };
    const seen = /* @__PURE__ */ new Set();
    const tokens = /* @__PURE__ */ new Set();
    let token;
    for (; ; ) {
      let q = `?list-type=2&prefix=${queryEncode(prefix2)}`;
      if (token !== void 0) q += `&continuation-token=${queryEncode(token)}`;
      store.requests++;
      let r;
      try {
        r = await f(endpoint + q);
      } catch (e) {
        throw new StoreReadError(`${endpoint + q}: ${e.message}`);
      }
      if (r.status === 408 || r.status === 429 || r.status >= 500) {
        throw new StoreReadError(`${endpoint + q}: HTTP ${r.status}`);
      }
      if (r.status !== 200) reject8(`the store has no listing: ${endpoint + q} answered HTTP ${r.status}`);
      const listing = parseListing(new Uint8Array(await r.arrayBuffer()), prefix2);
      addListed(store, listing.objects, prefix2, seen);
      if (store.listed > maxObjects) throw new StoreLimitError(`the store lists more than ${maxObjects} objects`);
      token = listing.token;
      if (token === void 0) break;
      if (tokens.has(token)) reject8(`the listing gives the continuation token ${JSON.stringify(token.slice(0, 80))} again`);
      tokens.add(token);
    }
    return store;
  }
  function chooseProfile(store) {
    if (store.objects.has(".zarray") || store.objects.has(".zgroup")) return "zarr2";
    if (store.objects.has("attributes.json")) return "n5";
    if (store.objects.has("manifest.safe")) return "safe";
    return reject8(
      "not an N5, Zarr v2 or SAFE store: the root has no .zarray, .zgroup, attributes.json or manifest.safe"
    );
  }
  function depth(path2) {
    return path2 === "" ? 0 : path2.split("/").length;
  }
  function join(parent, name) {
    return parent === "" ? name : `${parent}/${name}`;
  }
  function parentOf(path2) {
    const i = path2.lastIndexOf("/");
    return i < 0 ? "" : path2.slice(0, i);
  }
  function byDepth(paths) {
    return [...paths].sort((a, b) => depth(a) - depth(b) || compareKeys(a, b));
  }
  var PathTrie = class _PathTrie {
    children = /* @__PURE__ */ new Map();
    value = void 0;
    add(path2, value2) {
      let node = this;
      if (path2 !== "") {
        for (const s of path2.split("/")) {
          let child = node.children.get(s);
          if (child === void 0) node.children.set(s, child = new _PathTrie());
          node = child;
        }
      }
      node.value = value2;
    }
    /** [value, j] of the nearest proper ancestor of the key with segments `segs`
     * that has a value, at the path `segs.slice(0, j)`; or undefined. */
    nearest(segs) {
      let node = this;
      let best;
      if (this.value !== void 0 && !(segs.length === 1 && segs[0] === "")) best = [this.value, 0];
      for (let j = 0; j < segs.length - 1; j++) {
        node = node.children.get(segs[j]);
        if (node === void 0) break;
        if (node.value !== void 0) best = [node.value, j + 1];
      }
      return best;
    }
  };
  function insideArray(path2, arrays) {
    return arrays.nearest(path2.split("/")) !== void 0;
  }
  function implicitGroups(nodes) {
    const all = new Set(nodes);
    const out2 = /* @__PURE__ */ new Set();
    for (const path2 of all) {
      let i = path2.length;
      while (i > 0) {
        i = path2.lastIndexOf("/", i - 1);
        const p = i > 0 ? path2.slice(0, i) : "";
        if (all.has(p) || out2.has(p)) break;
        out2.add(p);
        i = Math.max(i, 0);
      }
    }
    return out2;
  }
  function canonicalIndex(s, limit) {
    return /^(0|[1-9][0-9]{0,16})$/.test(s) && Number(s) < limit;
  }
  function grid(shape, chunks) {
    return shape.map((s, i) => Number((BigInt(s) + BigInt(chunks[i]) - 1n) / BigInt(chunks[i])));
  }
  function findChunks(objects, arrays) {
    const trie = new PathTrie();
    for (const [path2, test] of arrays) trie.add(path2, test);
    const out2 = [];
    for (const [key2, size2] of objects) {
      const segs = key2.split("/");
      const found = trie.nearest(segs);
      if (found !== void 0 && found[0](segs.slice(found[1]).join("/"))) out2.push([key2, size2]);
    }
    return out2.sort((a, b) => compareKeys(a[0], b[0]));
  }
  var docKey = (path2) => join(path2, "zarr.json");
  function declareNodes(docs, profile, url2, omes = /* @__PURE__ */ new Map()) {
    for (const [key2, doc] of docs) {
      const path2 = key2.slice(0, key2.length - "zarr.json".length).replace(/\/$/, "");
      const node = doc;
      const target = omes.has(path2) ? { ome: omes.get(path2) } : {};
      const attributes = declare(
        target,
        profile,
        path2 === "" ? url2 : void 0,
        node.attributes
      );
      docs.set(key2, { ...node, attributes });
    }
  }
  var SOURCE_GROUP = "vzip_source";
  var OBJECTS = "vzip_source/objects/";
  var EMPTY_KEY = "vzip_source/empty.json";
  var NODE_NAME = /^(?:zarr\.json|\.zarray|\.zgroup)~*$/;
  function objectKey(key2) {
    return OBJECTS + key2 + (NODE_NAME.test(key2.slice(key2.lastIndexOf("/") + 1)) ? "~" : "");
  }
  function sourceMetadata2(attributes, metadata, unversioned = []) {
    const s = {};
    if (Object.keys(attributes).length) s.attributes = attributes;
    if (Object.keys(metadata).length) s.metadata = metadata;
    if (unversioned.length) s.unversioned = unversioned;
    return s;
  }
  function keepObjects(result, objects, used, nodes, fail, ignoredKeys = []) {
    const empty = [...objects].filter(([k, n]) => n === 0 && !used.has(k)).map(([k]) => k).sort(compareKeys);
    const kept = [...objects].filter(([k, n]) => n > 0 && !used.has(k));
    const ignored2 = [...ignoredKeys].sort(compareKeys);
    if (kept.length === 0 && empty.length === 0 && ignored2.length === 0) return 0;
    const own = empty.length || ignored2.length ? { ...empty.length ? { empty } : {}, ...ignored2.length ? { ignored: ignored2 } : {} } : void 0;
    const root = result.docs.get(docKey(""));
    if (root.node_type !== "array") {
      for (const p of nodes) {
        if (p === SOURCE_GROUP || p.startsWith(SOURCE_GROUP + "/")) {
          fail(`the node ${p} is where the store's other objects go (${OBJECTS}...)`);
        }
      }
      const profile = root.attributes[CONVENTION_KEY].profile;
      result.docs.set(docKey(SOURCE_GROUP), { zarr_format: 3, node_type: "group", attributes: declare({}, profile, void 0, own) });
    } else if (own) {
      result.docs.set(EMPTY_KEY, own);
    }
    result.origins ??= /* @__PURE__ */ new Map();
    for (const [k] of kept) result.origins.set(objectKey(k), k);
    result.chunks = [...result.chunks, ...kept.map(([k, n]) => [objectKey(k), n])].sort((a, b) => compareKeys(a[0], b[0]));
    return kept.length;
  }
  function storeArchive(url2, { docs, chunks, origins }) {
    for (const key2 of [...docs.keys(), ...chunks.map(([k]) => k)]) {
      if (utf87.encode(key2).length > 65535) reject8("an output key is longer than 65535 bytes");
      if (key2.startsWith("__vz__/")) reject8(`output key ${JSON.stringify(key2)} is in the reserved __vz__/ space`);
    }
    const entries = chunks.map(([key2, size2], i) => ({
      key: key2,
      ranges: [{ source: i, offset: 0n, length: BigInt(size2) }]
    }));
    for (const [key2, doc] of docs) {
      const compress = key2.startsWith(SOURCE_GROUP + "/");
      entries.push({ key: key2, bytes: utf87.encode(stringifyJson(doc)), ...compress ? { compress } : {} });
    }
    return { sources: chunks.map(([key2, size2]) => ({ url: objectUrl(url2, origins?.get(key2) ?? key2), size: BigInt(size2) })), entries };
  }
  var GROUP_IMPLICIT = () => ({ zarr_format: 3, node_type: "group", attributes: {} });

  // src/virtualize/n5/virtualize.ts
  var N5Error = class extends Error {
  };
  var reject9 = (message) => {
    throw new N5Error(message);
  };
  var DATA_TYPES = {
    uint8: 1,
    int8: 1,
    uint16: 2,
    int16: 2,
    uint32: 4,
    int32: 4,
    float32: 4,
    uint64: 8,
    int64: 8,
    float64: 8
  };
  var BLOSC_NAMES = ["blosclz", "lz4", "lz4hc", "snappy", "zlib", "zstd"];
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
  var LAYOUT_KEYS = ["dimensions", "blockSize", "dataType", "compression", "compressionType", "n5"];
  function bloscCodec(c, typesize, shuffles, fail) {
    const cname = c.cname;
    const clevel = asInt(c.clevel, 0, 9);
    const shuffle = asInt(c.shuffle);
    const blocksize = asInt(has(c, "blocksize") ? c.blocksize : 0, 0, MAX_BLOCK);
    if (typeof cname !== "string" || !BLOSC_NAMES.includes(cname)) fail(`blosc cname ${JSON.stringify(cname)} is not supported`);
    if (clevel === void 0) fail(`blosc clevel ${JSON.stringify(c.clevel)} is not an integer from 0 to 9`);
    if (shuffle === void 0 || !shuffles.has(shuffle)) fail(`blosc shuffle ${JSON.stringify(c.shuffle)} is not supported`);
    if (blocksize === void 0) fail(`blosc blocksize ${JSON.stringify(c.blocksize)} is not supported`);
    let s = shuffles.get(shuffle);
    if (s === "auto") s = typesize === 1 ? "bitshuffle" : "shuffle";
    return { name: "blosc", configuration: { cname, clevel, shuffle: s, typesize, blocksize } };
  }
  var SHUFFLES = /* @__PURE__ */ new Map([[0, "noshuffle"], [1, "shuffle"], [2, "bitshuffle"]]);
  var LEVELS = { gzip: [-1, 9, 6], zstd: [-131072, 22, 3] };
  function level(t, compression) {
    const [lo, hi, dflt] = LEVELS[t];
    if (!has(compression, "level")) return dflt;
    const v = asInt(compression.level, lo, hi);
    if (v === void 0) return reject9(`${t} level ${show(compression.level).slice(0, 20)} is not an integer from ${lo} to ${hi}`);
    return v === -1 && t === "gzip" ? 6 : v;
  }
  function compressor(compression, b) {
    const t = compression.type;
    let codec;
    let carried;
    if (t === "raw") {
      codec = void 0;
      carried = ["type"];
    } else if (t === "gzip") {
      const z = has(compression, "useZlib") ? compression.useZlib : false;
      if (typeof z !== "boolean") reject9(`gzip useZlib ${JSON.stringify(z)} is not a boolean`);
      codec = { name: z ? "zlib" : "gzip", configuration: { level: level(t, compression) } };
      carried = ["type", "useZlib", "level"];
    } else if (t === "zstd") {
      codec = { name: "zstd", configuration: { level: level(t, compression), checksum: false } };
      carried = ["type", "level"];
    } else if (t === "blosc") {
      codec = bloscCodec(compression, b, SHUFFLES, reject9);
      carried = ["type", "cname", "clevel", "shuffle", "blocksize"];
    } else {
      return reject9(`N5 compression ${JSON.stringify(t)} is not supported`);
    }
    return [codec, without(compression, carried)];
  }
  function dataset(path2, doc) {
    const dims = doc.dimensions;
    const block = doc.blockSize;
    const dtype = doc.dataType;
    if (!Array.isArray(dims) || dims.length < 1 || dims.length > 32 || dims.some((d) => asInt(d, 0) === void 0)) {
      reject9(`${path2}: dimensions ${show(dims).slice(0, 80)} is not 1 to 32 sizes`);
    }
    const n = dims.length;
    if (!Array.isArray(block) || block.length !== n || block.some((x) => asInt(x, 1, MAX_BLOCK) === void 0)) {
      reject9(`${path2}: blockSize ${show(block).slice(0, 80)} is not ${n} block sizes`);
    }
    if (typeof dtype !== "string" || !has(DATA_TYPES, dtype)) {
      reject9(`${path2}: dataType ${show(dtype).slice(0, 40)} is not supported`);
    }
    let compression;
    if (has(doc, "compression")) {
      const c2 = doc.compression;
      if (!isObject(c2) || typeof c2.type !== "string") reject9(`${path2}: compression is not an object with a string type`);
      compression = c2;
    } else if (typeof doc.compressionType === "string") {
      compression = { type: doc.compressionType };
    } else {
      return reject9(`${path2}: no compression`);
    }
    const b = DATA_TYPES[dtype];
    const inner = [
      { name: "transpose", configuration: { order: Array.from({ length: n }, (_, i) => n - 1 - i) } },
      b > 1 ? { name: "bytes", configuration: { endian: "big" } } : { name: "bytes" }
    ];
    const [c, extra] = compressor(compression, b);
    if (c !== void 0) inner.push(c);
    const meta = {};
    if (has(doc, "n5")) meta.n5 = doc.n5;
    if (Object.keys(extra).length) meta.compression = extra;
    if (has(doc, "compression") && has(doc, "compressionType")) meta.compressionType = doc.compressionType;
    return {
      zarr_format: 3,
      node_type: "array",
      shape: dims.map((v) => asInt(v)),
      data_type: dtype,
      chunk_grid: { name: "regular", configuration: { chunk_shape: block.map((v) => asInt(v)) } },
      chunk_key_encoding: { name: "v2", configuration: { separator: "/" } },
      fill_value: 0,
      codecs: [{ name: "n5_default", configuration: { codecs: inner } }],
      // The source metadata (spec/virtualize/n5.md §5): the document without its layout
      // members, and what of those the zarr.json does not reproduce.
      attributes: sourceMetadata2(without(doc, LAYOUT_KEYS), meta)
    };
  }
  var AXIS_TYPES = { x: "space", y: "space", z: "space", t: "time", c: "channel" };
  function levelPath(p) {
    return typeof p === "string" && p !== "" && p.split("/").every((s) => s !== "" && s !== "." && s !== "..");
  }
  function validAxes(names) {
    if (names.some((a) => a === "") || new Set(names).size !== names.length) return false;
    const kinds = names.map((a) => has(AXIS_TYPES, a) ? AXIS_TYPES[a] : "custom");
    let i = 0;
    if (i < kinds.length && kinds[i] === "time") i++;
    if (i < kinds.length && (kinds[i] === "channel" || kinds[i] === "custom")) i++;
    const rest = kinds.slice(i);
    return rest.length >= 2 && rest.length <= 3 && rest.every((k) => k === "space");
  }
  function unitOf(u2) {
    if (typeof u2 !== "string") return null;
    if (UNIT_NAMES.has(u2)) return u2;
    return has(UNITS, u2) ? UNITS[u2] : null;
  }
  function omeMultiscale(name, axes, units, paths, scales, translations) {
    const ms = {};
    if (name !== null) ms.name = name;
    ms.axes = axes.map((a, i) => ({
      name: a,
      ...has(AXIS_TYPES, a) ? { type: AXIS_TYPES[a] } : {},
      ...units[i] !== null ? { unit: units[i] } : {}
    }));
    ms.datasets = paths.map((p, i) => ({
      path: p,
      coordinateTransformations: [
        { type: "scale", scale: scales[i] },
        ...translations !== null ? [{ type: "translation", translation: translations[i] }] : []
      ]
    }));
    return { version: "0.5", multiscales: [ms] };
  }
  function numbers2(v, n, positive = false) {
    if (!Array.isArray(v) || v.length !== n || !v.every(isNumber2)) return void 0;
    const xs = v.map(num);
    if (positive && !xs.every((x) => x > 0)) return void 0;
    return xs;
  }
  function strings(v, n) {
    return Array.isArray(v) && v.length === n && v.every((x) => typeof x === "string");
  }
  function cosem(g, attrs, ndim, docs) {
    const ms = attrs.multiscales;
    if (!Array.isArray(ms) || ms.length === 0 || !isObject(ms[0])) return void 0;
    const m = ms[0];
    const ds = m.datasets;
    if (!Array.isArray(ds) || ds.length === 0 || !ds.every(isObject)) return void 0;
    const levels = [];
    for (const d of ds) {
      const p = d.path;
      if (!levelPath(p) || !ndim.has(join(g, p))) return void 0;
      const n = ndim.get(join(g, p));
      const t = has(d, "transform") ? d.transform : docs.get(join(g, p)).transform;
      if (!isObject(t)) return void 0;
      let axes2 = t.axes;
      let scale = numbers2(t.scale, n, true);
      let translate = has(t, "translate") ? numbers2(t.translate, n) : new Array(n).fill(0);
      let units = has(t, "units") ? t.units : new Array(n).fill(null);
      const order = has(t, "order") ? t.order : "C";
      if (!strings(axes2, n) || scale === void 0 || translate === void 0 || order !== "C" && order !== "F") {
        return void 0;
      }
      if (has(t, "units") && !strings(units, n)) return void 0;
      let ax = axes2;
      let un = units;
      if (order === "C") {
        ax = ax.slice().reverse();
        scale = scale.slice().reverse();
        translate = translate.slice().reverse();
        un = un.slice().reverse();
      }
      axes2 = ax;
      units = un;
      levels.push([p, ax, scale, translate, un]);
    }
    const key2 = (x) => JSON.stringify(x);
    if (levels.some((lv) => key2(lv[1]) !== key2(levels[0][1]) || key2(lv[4]) !== key2(levels[0][4]))) return void 0;
    const axes = levels[0][1];
    if (!validAxes(axes)) return void 0;
    const name = typeof m.name === "string" ? m.name : null;
    return [
      omeMultiscale(
        name,
        axes,
        levels[0][4].map(unitOf),
        levels.map((lv) => lv[0]),
        levels.map((lv) => lv[2]),
        levels.map((lv) => lv[3])
      ),
      levels.map((lv) => join(g, lv[0])),
      axes
    ];
  }
  function n5Viewer(g, attrs, ndim, docs) {
    const s0 = join(g, "s0");
    if (!ndim.has(s0)) return void 0;
    const n = ndim.get(s0);
    let levels;
    let factors;
    if (has(attrs, "scales")) {
      const scales2 = attrs.scales;
      if (!Array.isArray(scales2) || scales2.length === 0) return void 0;
      const fs = scales2.map((f) => numbers2(f, n, true));
      if (fs.some((f) => f === void 0)) return void 0;
      factors = fs;
      levels = factors.map((_, i) => join(g, `s${i}`));
      if (levels.some((lv) => ndim.get(lv) !== n)) return void 0;
    } else {
      if (!ndim.has(join(g, "s1"))) return void 0;
      levels = [];
      while (ndim.has(join(g, `s${levels.length}`))) levels.push(join(g, `s${levels.length}`));
      factors = [];
      for (const [i, lv] of levels.entries()) {
        if (ndim.get(lv) !== n) return void 0;
        const doc = docs.get(lv);
        if (i === 0 && !has(doc, "downsamplingFactors")) {
          factors.push(new Array(n).fill(1));
          continue;
        }
        const f = numbers2(doc.downsamplingFactors, n, true);
        if (f === void 0) return void 0;
        factors.push(f);
      }
    }
    const resDoc = has(attrs, "pixelResolution") ? attrs : has(docs.get(s0), "pixelResolution") ? docs.get(s0) : void 0;
    let unit = null;
    let r;
    if (resDoc === void 0) {
      r = new Array(n).fill(1);
    } else {
      const pr = resDoc.pixelResolution;
      if (isObject(pr)) {
        r = numbers2(pr.dimensions, n, true);
        if (has(pr, "unit")) {
          if (typeof pr.unit !== "string") return void 0;
          unit = pr.unit;
        }
      } else {
        r = numbers2(pr, n, true);
      }
      if (r === void 0) return void 0;
    }
    let axes;
    if (has(attrs, "axes")) {
      if (!strings(attrs.axes, n)) return void 0;
      axes = attrs.axes;
    } else if (n === 2 || n === 3) {
      axes = ["x", "y", "z"].slice(0, n);
    } else {
      return void 0;
    }
    if (!validAxes(axes)) return void 0;
    const u2 = unitOf(unit);
    const units = axes.map((a) => AXIS_TYPES[a] === "space" && has(AXIS_TYPES, a) ? u2 : null);
    const scales = factors.map((f) => f.map((x, j) => r[j] * x));
    if (scales.some((s) => s.some((v) => !Number.isFinite(v)))) reject9("a scale is not finite");
    const translations = factors.map((f) => f.map((x, j) => (x - 1) / 2 * r[j]));
    const paths = levels.map((lv) => g === "" ? lv : lv.slice(g.length + 1));
    return [omeMultiscale(null, axes, units, paths, scales, translations), levels, axes];
  }
  async function virtualizeN5(store) {
    const objects = store.objects;
    const candidates = [];
    for (const key2 of objects.keys()) {
      if (key2 === "attributes.json") candidates.push("");
      else if (key2.endsWith("/attributes.json")) candidates.push(key2.slice(0, -"/attributes.json".length));
    }
    const docs = /* @__PURE__ */ new Map();
    const datasets = /* @__PURE__ */ new Set();
    const trie = new PathTrie();
    const groupPaths = [];
    const readOrder = byDepth(candidates);
    const isCandidate = new Set(candidates);
    const wanted = (key2) => {
      let p = parentOf(key2);
      let known = true;
      while (p !== "") {
        p = parentOf(p);
        if (!isCandidate.has(p)) continue;
        if (datasets.has(p)) return false;
        known &&= docs.has(p);
      }
      return known ? true : void 0;
    };
    prefetchDocuments(store, readOrder.map((p) => join(p, "attributes.json")), wanted);
    for (const path2 of readOrder) {
      if (insideArray(path2, trie)) continue;
      const doc = await readDocument(store, join(path2, "attributes.json"));
      if (!isObject(doc)) reject9(`${join(path2, "attributes.json")} is not a JSON object`);
      docs.set(path2, doc);
      if (has(doc, "dimensions")) {
        datasets.add(path2);
        trie.add(path2, true);
      } else groupPaths.push(path2);
    }
    const implicit = implicitGroups(docs.keys());
    const arrays = /* @__PURE__ */ new Map();
    for (const path2 of [...datasets].sort()) arrays.set(path2, dataset(path2 || "/", docs.get(path2)));
    const ndim = new Map([...arrays].map(([p, a]) => [p, a.shape.length]));
    const groups = /* @__PURE__ */ new Map();
    for (const path2 of groupPaths) {
      const doc = docs.get(path2);
      groups.set(path2, {
        zarr_format: 3,
        node_type: "group",
        attributes: sourceMetadata2(without(doc, ["n5"]), has(doc, "n5") ? { n5: doc.n5 } : {})
      });
    }
    const images = [];
    const named = /* @__PURE__ */ new Map();
    const omes = /* @__PURE__ */ new Map();
    const order = [...groups.keys()].sort(compareKeys);
    for (const g of order) {
      const attrs = docs.get(g);
      if (has(attrs, "ome")) continue;
      let found = cosem(g, attrs, ndim, docs);
      let convention2 = "cosem";
      if (found === void 0) {
        found = n5Viewer(g, attrs, ndim, docs);
        convention2 = "n5-viewer";
      }
      if (found === void 0) continue;
      const [ome, levels, axes] = found;
      if (levels.some((lv) => named.has(lv) && JSON.stringify(named.get(lv)) !== JSON.stringify(axes))) continue;
      omes.set(g, ome);
      images.push({ path: g, convention: convention2 });
      for (const lv of levels) if (!named.has(lv)) named.set(lv, axes.slice());
    }
    for (const [path2, names] of named) arrays.get(path2).dimension_names = names;
    const out2 = /* @__PURE__ */ new Map();
    for (const path2 of implicit) out2.set(docKey(path2), GROUP_IMPLICIT());
    for (const [path2, doc] of groups) out2.set(docKey(path2), doc);
    for (const [path2, doc] of arrays) out2.set(docKey(path2), doc);
    declareNodes(out2, "n5", store.url, omes);
    const tests = /* @__PURE__ */ new Map();
    for (const [path2, a] of arrays) {
      const g = grid(a.shape, a.chunk_grid.configuration.chunk_shape);
      tests.set(path2, (rest) => {
        const parts = rest.split("/");
        return parts.length === g.length && parts.every((s, i) => canonicalIndex(s, g[i]));
      });
    }
    const all = findChunks(objects, tests);
    const chunks = all.filter(([, n]) => n > 0);
    const result = { docs: out2, chunks };
    const used = /* @__PURE__ */ new Set([...[...docs.keys()].map((p) => join(p, "attributes.json")), ...chunks.map(([k]) => k)]);
    const others = keepObjects(result, objects, used, [...docs.keys(), ...implicit], reject9, store.ignored);
    return {
      ...result,
      summary: {
        groups: groups.size + implicit.size,
        arrays: arrays.size,
        chunks: chunks.length,
        emptyChunks: all.length - chunks.length,
        objects: objects.size,
        otherObjects: others,
        images,
        listingRequests: store.requests
      }
    };
  }

  // src/virtualize/zarr2/virtualize.ts
  var Zarr2Error = class extends Error {
  };
  var reject10 = (message) => {
    throw new Zarr2Error(message);
  };
  var TYPES2 = {
    b1: "bool",
    i1: "int8",
    u1: "uint8",
    i2: "int16",
    u2: "uint16",
    f2: "float16",
    i4: "int32",
    u4: "uint32",
    f4: "float32",
    i8: "int64",
    u8: "uint64",
    f8: "float64"
  };
  var FLOAT_MAX = { 2: 65504, 4: 34028234663852886e22, 8: Infinity };
  var SHUFFLES2 = /* @__PURE__ */ new Map([[0, "noshuffle"], [1, "shuffle"], [2, "bitshuffle"], [-1, "auto"]]);
  function dataType2(dtype) {
    const m = typeof dtype === "string" ? dtype.match(/^([<>|])([biuf])([1248])$/) : null;
    if (m === null || !has(TYPES2, m[2] + m[3])) reject10(`dtype ${show(dtype).slice(0, 60)} is not supported`);
    const [, order, kind, size2] = m;
    const b = Number(size2);
    if (b > 1 && order === "|") reject10(`dtype ${dtype} has no byte order`);
    return [TYPES2[kind + size2], b, order];
  }
  var ZARRAY_READ = [
    "zarr_format",
    "shape",
    "chunks",
    "dtype",
    "order",
    "compressor",
    "filters",
    "fill_value",
    "dimension_separator"
  ];
  var NEG_ZERO = { 2: "0x8000", 4: "0x80000000", 8: "0x8000000000000000" };
  var LEVELS2 = { zlib: [-1, 9, 1], gzip: [-1, 9, 1], zstd: [-131072, 22, 0] };
  function fillValue2(v, dt, b) {
    if (v === null) return dt === "bool" ? false : 0;
    if (dt === "bool") {
      if (typeof v === "boolean") return v;
    } else if (dt.startsWith("int") || dt.startsWith("uint")) {
      const bits = 8 * b;
      const [lo, hi] = dt.startsWith("u") ? [0, 2 ** bits - 1] : [-(2 ** (bits - 1)), 2 ** (bits - 1) - 1];
      const i = asInt(v, lo, hi);
      if (i !== void 0) return i;
    } else {
      if (v === "NaN" || v === "Infinity" || v === "-Infinity") return v;
      if (isNumber2(v) && Math.abs(num(v)) <= FLOAT_MAX[b]) {
        return Object.is(num(v), -0) ? NEG_ZERO[b] : num(v);
      }
    }
    return reject10(`fill_value ${show(v).slice(0, 40)} is not a ${dt}`);
  }
  function level2(id, c) {
    const [lo, hi, dflt] = LEVELS2[id];
    if (!has(c, "level")) return dflt;
    const v = asInt(c.level, lo, hi);
    if (v === void 0) return reject10(`${id} level ${show(c.level).slice(0, 20)} is not an integer from ${lo} to ${hi}`);
    return v === -1 && id !== "zstd" ? 6 : v;
  }
  function compressor2(c, b) {
    if (c === null) return [void 0, {}];
    if (!isObject(c) || typeof c.id !== "string") reject10("compressor is not null or an object with a string id");
    const cc = c;
    const id = cc.id;
    let codec;
    let carried;
    if (id === "zlib" || id === "gzip") {
      codec = { name: id, configuration: { level: level2(id, cc) } };
      carried = ["id", "level"];
    } else if (id === "zstd") {
      const checksum = has(cc, "checksum") ? cc.checksum : false;
      if (typeof checksum !== "boolean") reject10(`zstd checksum ${show(checksum).slice(0, 20)} is not a boolean`);
      codec = { name: "zstd", configuration: { level: level2(id, cc), checksum } };
      carried = ["id", "level", "checksum"];
    } else if (id === "blosc") {
      codec = bloscCodec(cc, b, SHUFFLES2, reject10);
      carried = ["id", "cname", "clevel", "shuffle", "blocksize"];
      if (asInt(cc.shuffle) === -1) carried = carried.filter((k) => k !== "shuffle");
    } else {
      return reject10(`compressor ${JSON.stringify(id)} is not supported`);
    }
    return [codec, without(cc, carried)];
  }
  var get = (o, k) => has(o, k) ? o[k] : null;
  function array(path2, z, attrs) {
    if (!isObject(z)) reject10(`${path2}/.zarray is not a JSON object`);
    const zz = z;
    if (asInt(zz.zarr_format) !== 2) reject10(`${path2}/.zarray: zarr_format is not 2`);
    const shape = zz.shape;
    const chunks = zz.chunks;
    if (!Array.isArray(shape) || shape.length > 32 || shape.some((s) => asInt(s, 0) === void 0)) {
      reject10(`${path2}: shape ${show(shape).slice(0, 80)} is not up to 32 sizes`);
    }
    const n = shape.length;
    if (!Array.isArray(chunks) || chunks.length !== n || chunks.some((c2) => asInt(c2, 1) === void 0)) {
      reject10(`${path2}: chunks ${show(chunks).slice(0, 80)} is not ${n} chunk sizes`);
    }
    const [dt, b, byteorder] = dataType2(get(zz, "dtype"));
    const order = zz.order;
    if (order !== "C" && order !== "F") reject10(`${path2}: order ${show(order).slice(0, 20)} is not C or F`);
    const filters = get(zz, "filters");
    if (filters !== null && !(Array.isArray(filters) && filters.length === 0)) reject10(`${path2}: filters are not supported`);
    let sep = get(zz, "dimension_separator");
    if (sep === null) sep = ".";
    if (sep !== "." && sep !== "/") reject10(`${path2}: dimension_separator ${show(sep).slice(0, 20)} is not . or /`);
    const fill = fillValue2(get(zz, "fill_value"), dt, b);
    const codecs = [];
    if (order === "F" && n >= 2) {
      codecs.push({ name: "transpose", configuration: { order: Array.from({ length: n }, (_, i) => n - 1 - i) } });
    }
    codecs.push(b === 1 ? { name: "bytes" } : { name: "bytes", configuration: { endian: byteorder === "<" ? "little" : "big" } });
    const [c, extra] = compressor2(get(zz, "compressor"), b);
    if (c !== void 0) codecs.push(c);
    const meta = without(zz, ZARRAY_READ);
    const fv = get(zz, "fill_value");
    if (fv === null) meta.fill_value = null;
    else if (dt.startsWith("float") && isRawInteger(fv) && Math.abs(num(fv)) > Number.MAX_SAFE_INTEGER) meta.fill_value = fv;
    if (Object.keys(extra).length) meta.compressor = extra;
    return [{
      zarr_format: 3,
      node_type: "array",
      shape: shape.map((v) => asInt(v)),
      data_type: dt,
      chunk_grid: { name: "regular", configuration: { chunk_shape: chunks.map((v) => asInt(v)) } },
      chunk_key_encoding: { name: "v2", configuration: { separator: sep } },
      fill_value: fill,
      codecs,
      attributes: attrs
    }, sep, meta];
  }
  function nodesOf(objects) {
    const candidates = /* @__PURE__ */ new Map();
    for (const key2 of objects.keys()) {
      const i = key2.lastIndexOf("/");
      const head = i < 0 ? "" : key2.slice(0, i);
      const name = key2.slice(i + 1);
      if (name === ".zarray" || name === ".zgroup") {
        const kind = name === ".zarray" ? "array" : "group";
        if ((candidates.get(head) ?? kind) !== kind) reject10(`${head || "/"} has both .zarray and .zgroup`);
        candidates.set(head, kind);
      }
    }
    const nodes = /* @__PURE__ */ new Map();
    const arrayPaths = new PathTrie();
    for (const path2 of byDepth(candidates.keys())) {
      if (insideArray(path2, arrayPaths)) continue;
      nodes.set(path2, candidates.get(path2));
      if (candidates.get(path2) === "array") arrayPaths.add(path2, true);
    }
    return nodes;
  }
  function prefetch(store) {
    let nodes;
    try {
      nodes = nodesOf(store.objects);
    } catch (e) {
      if (e instanceof Zarr2Error) return;
      throw e;
    }
    const keys = [];
    for (const path2 of [...nodes.keys()].sort(compareKeys)) {
      keys.push(join(path2, nodes.get(path2) === "array" ? ".zarray" : ".zgroup"));
      if (store.objects.has(join(path2, ".zattrs"))) keys.push(join(path2, ".zattrs"));
    }
    prefetchDocuments(store, keys);
  }
  async function readHierarchy(store) {
    const objects = store.objects;
    const nodes = nodesOf(objects);
    const implicit = implicitGroups(nodes.keys());
    prefetch(store);
    const h = { arrays: /* @__PURE__ */ new Map(), seps: /* @__PURE__ */ new Map(), groups: /* @__PURE__ */ new Map(), implicit, meta: /* @__PURE__ */ new Map(), documents: /* @__PURE__ */ new Set() };
    const attributes = async (path2) => {
      const key2 = join(path2, ".zattrs");
      if (!objects.has(key2)) return {};
      h.documents.add(key2);
      const a = await readDocument(store, key2);
      if (!isObject(a)) reject10(`${key2} is not a JSON object`);
      return a;
    };
    for (const path2 of [...nodes.keys()].sort(compareKeys)) {
      if (nodes.get(path2) === "array") {
        h.documents.add(join(path2, ".zarray"));
        const [doc, sep, meta] = array(path2 || "/", await readDocument(store, join(path2, ".zarray")), await attributes(path2));
        h.arrays.set(path2, doc);
        h.seps.set(path2, sep);
        h.meta.set(path2, meta);
      } else {
        h.documents.add(join(path2, ".zgroup"));
        const g = await readDocument(store, join(path2, ".zgroup"));
        if (!isObject(g) || asInt(g.zarr_format) !== 2) reject10(`${join(path2, ".zgroup")}: zarr_format is not 2`);
        h.groups.set(path2, await attributes(path2));
        h.meta.set(path2, without(g, ["zarr_format"]));
      }
    }
    return h;
  }
  function chunkObjects(store, h) {
    const tests = /* @__PURE__ */ new Map();
    for (const [path2, a] of h.arrays) {
      const g = grid(a.shape, a.chunk_grid.configuration.chunk_shape);
      const sep = h.seps.get(path2);
      tests.set(path2, (rest) => {
        if (g.length === 0) return rest === "0";
        if (sep === "." && rest.includes("/")) return false;
        const parts = rest.split(sep);
        return parts.length === g.length && parts.every((s, i) => canonicalIndex(s, g[i]));
      });
    }
    return findChunks(store.objects, tests);
  }
  function hierarchyOutput(store, h, groups, arrays, profile, extra = [], omes = /* @__PURE__ */ new Map(), unversioned = /* @__PURE__ */ new Map()) {
    const docs = /* @__PURE__ */ new Map();
    for (const path2 of h.implicit) docs.set(docKey(path2), GROUP_IMPLICIT());
    for (const [path2, attributes] of groups) {
      docs.set(docKey(path2), { zarr_format: 3, node_type: "group", attributes: sourceMetadata2(attributes, h.meta.get(path2), unversioned.get(path2)) });
    }
    for (const [path2, doc] of arrays) {
      const d = doc;
      docs.set(docKey(path2), { ...d, attributes: sourceMetadata2(d.attributes, h.meta.get(path2)) });
    }
    declareNodes(docs, profile, store.url, omes);
    const all = chunkObjects(store, h);
    const chunks = [...all, ...extra].filter(([, n]) => n > 0).sort((a, b) => compareKeys(a[0], b[0]));
    const result = { docs, chunks };
    const used = /* @__PURE__ */ new Set([...h.documents, ...all.filter(([, n]) => n > 0).map(([k]) => k), ...extra.filter(([, n]) => n > 0).map(([k]) => k)]);
    const others = keepObjects(result, store.objects, used, [...h.arrays.keys(), ...h.groups.keys(), ...h.implicit], reject10, store.ignored);
    return [result, all, others];
  }
  async function virtualizeZarr2(store) {
    const h = await readHierarchy(store);
    const [result, all, others] = hierarchyOutput(store, h, h.groups, h.arrays, "zarr2");
    const chunks = all.filter(([, n]) => n > 0).length;
    return {
      ...result,
      summary: {
        groups: h.groups.size + h.implicit.size,
        arrays: h.arrays.size,
        chunks,
        emptyChunks: all.length - chunks,
        objects: store.objects.size,
        otherObjects: others,
        listingRequests: store.requests
      }
    };
  }

  // src/virtualize/ome-zarr/virtualize.ts
  var OmeZarrError = class extends Error {
  };
  var reject11 = (message) => {
    throw new OmeZarrError(message);
  };
  var OME_KEYS = ["multiscales", "omero", "labels", "image-label", "plate", "well", "bioformats2raw.layout"];
  var VERSIONED = /* @__PURE__ */ new Set(["omero", "image-label", "plate", "well"]);
  var LABEL_TYPES = /* @__PURE__ */ new Set(["int8", "uint8", "int16", "uint16", "int32", "uint32", "int64", "uint64"]);
  var KINDS = /^t?o?s{2,3}$/;
  var HEX6 = /^[0-9A-Fa-f]{6}$/;
  var ALNUM = /^[A-Za-z0-9]+$/;
  var get2 = (o, k) => has(o, k) ? o[k] : void 0;
  function relPath(p) {
    return typeof p === "string" && p !== "" && p.split("/").every((s) => s !== "" && s !== "." && s !== "..");
  }
  var isInt = (v, lo) => asInt(v, lo) !== void 0;
  function multiscales04(a) {
    const ms = get2(a, "multiscales");
    return Array.isArray(ms) && ms.some((m) => isObject(m) && get2(m, "version") === "0.4");
  }
  function version04(a, key2) {
    const v = get2(a, key2);
    return isObject(v) && get2(v, "version") === "0.4";
  }
  async function declares04(store) {
    const objects = store.objects;
    prefetch(store);
    const attrs = async (path2) => {
      if (!objects.has(join(path2, ".zgroup")) || !objects.has(join(path2, ".zattrs"))) return void 0;
      const a2 = await readDocument(store, join(path2, ".zattrs"), { keep: true });
      return isObject(a2) ? a2 : void 0;
    };
    if (objects.has(".zarray")) return false;
    const a = await attrs("");
    if (a === void 0) return false;
    if (multiscales04(a) || version04(a, "plate") || version04(a, "well")) return true;
    if (!has(a, "bioformats2raw.layout")) return false;
    let q;
    if (has(a, "plate")) {
      const plate = a.plate;
      const wells = isObject(plate) ? get2(plate, "wells") : void 0;
      if (Array.isArray(wells) && wells.length > 0 && isObject(wells[0]) && relPath(get2(wells[0], "path"))) {
        const w = wells[0].path;
        const wa = await attrs(w);
        const well = wa !== void 0 ? get2(wa, "well") : void 0;
        const images = isObject(well) ? get2(well, "images") : void 0;
        if (Array.isArray(images) && images.length > 0 && isObject(images[0]) && relPath(get2(images[0], "path"))) {
          q = join(w, images[0].path);
        }
      }
    } else {
      q = "0";
      const oa = await attrs("OME");
      const series = oa !== void 0 ? get2(oa, "series") : void 0;
      if (Array.isArray(series) && series.length > 0 && relPath(series[0])) q = series[0];
    }
    if (q === void 0) return false;
    const qa = await attrs(q);
    return qa !== void 0 && multiscales04(qa);
  }
  function resolve(base, rel) {
    const segs = base === "" ? [] : base.split("/");
    for (const s of rel.split("/")) {
      if (s === "" || s === ".") continue;
      if (s === "..") {
        if (segs.length === 0) return void 0;
        segs.pop();
      } else {
        segs.push(s);
      }
    }
    return segs.join("/");
  }
  function transforms(where2, ts, n) {
    if (!Array.isArray(ts) || ts.length !== 1 && ts.length !== 2 || !ts.every(isObject)) {
      reject11(`${where2}: coordinateTransformations is not one or two transformation objects`);
    }
    const [s, t] = ts;
    if (get2(s, "type") !== "scale") reject11(`${where2}: the first transformation is not a scale`);
    const scale = get2(s, "scale");
    if (!(Array.isArray(scale) && scale.length === n && scale.every(isNumber2))) reject11(`${where2}: the scale is not ${n} numbers`);
    if (t !== void 0) {
      if (get2(t, "type") !== "translation") reject11(`${where2}: the second transformation is not a translation`);
      const tr = get2(t, "translation");
      if (!(Array.isArray(tr) && tr.length === n && tr.every(isNumber2))) reject11(`${where2}: the translation is not ${n} numbers`);
    }
    return scale.map(num);
  }
  function checkVersion(where2, o) {
    if (has(o, "version") && o.version !== "0.4") reject11(`${where2}: version ${show(o.version).slice(0, 20)} is not 0.4`);
  }
  var sorted2 = (xs) => [...xs].sort(compareKeys);
  var lastSegment = (p) => p.slice(p.lastIndexOf("/") + 1);
  async function virtualizeOmeZarr(store) {
    const h = await readHierarchy(store);
    const attrs = h.groups;
    const arrays = h.arrays;
    for (const path2 of sorted2(attrs.keys())) {
      if (has(attrs.get(path2), "ome")) reject11(`${path2 || "/"}: the group already has an \`ome\` attribute`);
    }
    const collections = sorted2([...attrs.keys()].filter((p) => has(attrs.get(p), "bioformats2raw.layout")));
    const seriesGroups = new Set(collections.map((c) => join(c, "OME")).filter((o) => attrs.has(o) && has(attrs.get(o), "series")));
    const omeGroups = sorted2([...attrs.keys()].filter((p) => seriesGroups.has(p) || OME_KEYS.some((k) => has(attrs.get(p), k))));
    const images = new Set([...attrs.keys()].filter((p) => has(attrs.get(p), "multiscales")));
    const levels = [];
    const multiscales = /* @__PURE__ */ new Map();
    for (const g of sorted2(images)) {
      const ms = attrs.get(g).multiscales;
      const where2 = `${g || "/"}: multiscales`;
      if (!Array.isArray(ms) || ms.length === 0 || !ms.every(isObject)) reject11(`${where2} is not a nonempty array of objects`);
      multiscales.set(g, ms);
      ms.forEach((m, i) => {
        const w = `${where2}[${i}]`;
        checkVersion(w, m);
        const axes = get2(m, "axes");
        if (!Array.isArray(axes) || axes.length < 2 || axes.length > 5 || !axes.every(isObject)) {
          reject11(`${w}: axes is not 2 to 5 axis objects`);
        }
        const ax = axes;
        if (!ax.every((a) => typeof get2(a, "name") === "string")) reject11(`${w}: an axis name is not a string`);
        const axisNames = ax.map((a) => a.name);
        if (new Set(axisNames).size !== axisNames.length) reject11(`${w}: axis names ${show(axisNames)} are not distinct`);
        let kinds = "";
        for (const a of ax) {
          const t = get2(a, "type");
          if (t !== void 0 && t !== null && typeof t !== "string") reject11(`${w}: axis type ${show(t).slice(0, 20)} is not a string`);
          kinds += t === "space" ? "s" : t === "time" ? "t" : "o";
        }
        if (!KINDS.test(kinds)) {
          reject11(`${w}: axis types ${show(ax.map((a) => get2(a, "type") ?? null))} are not [time], [channel or custom], then 2 or 3 space`);
        }
        const n = ax.length;
        const datasets = get2(m, "datasets");
        if (!Array.isArray(datasets) || datasets.length === 0 || !datasets.every(isObject)) {
          reject11(`${w}: datasets is not a nonempty array of objects`);
        }
        let prev;
        datasets.forEach((d, j) => {
          const wd = `${w}.datasets[${j}]`;
          const p = get2(d, "path");
          if (!relPath(p)) reject11(`${wd}: path ${show(p).slice(0, 40)} is not a relative path`);
          const target = join(g, p);
          if (!arrays.has(target)) reject11(`${wd}: ${target} is not an array`);
          const rank = arrays.get(target).shape.length;
          if (rank !== n) reject11(`${wd}: ${target} has ${rank} dimensions, not ${n}`);
          const scale = transforms(wd, get2(d, "coordinateTransformations"), n);
          if (prev !== void 0 && scale.some((b, k) => b < prev[k])) {
            reject11(`${wd}: the scale ${show(scale)} is smaller than the previous level's ${show(prev)}`);
          }
          prev = scale;
          levels.push([g, i, j, target, axisNames]);
        });
        if (has(m, "coordinateTransformations")) transforms(w, m.coordinateTransformations, n);
      });
    }
    for (const g of omeGroups) {
      const a = attrs.get(g);
      if (!has(a, "omero")) continue;
      const o = a.omero;
      const w = `${g || "/"}: omero`;
      const channels = isObject(o) ? get2(o, "channels") : void 0;
      if (!Array.isArray(channels) || !channels.every(isObject)) reject11(`${w}: channels is not an array of objects`);
      for (const c of channels) {
        const color = get2(c, "color");
        if (!(typeof color === "string" && HEX6.test(color))) reject11(`${w}: channel color ${show(color).slice(0, 20)} is not 6 hexadecimal digits`);
        const win = get2(c, "window");
        if (!isObject(win) || !["min", "max", "start", "end"].every((k) => isNumber2(get2(win, k)))) {
          reject11(`${w}: a channel window does not have numbers min, max, start and end`);
        }
      }
    }
    const labelImages = /* @__PURE__ */ new Set();
    const kept = /* @__PURE__ */ new Map();
    const keptKey = (g, i) => `${g}\0${i}`;
    for (const g of omeGroups) {
      const a = attrs.get(g);
      if (has(a, "labels")) {
        const ls = a.labels;
        if (!Array.isArray(ls)) reject11(`${g || "/"}: labels is not an array`);
        for (const x of ls) {
          if (!relPath(x) || !images.has(join(g, x))) reject11(`${g || "/"}: label ${show(x).slice(0, 40)} is not the path of an image`);
          labelImages.add(join(g, x));
        }
      }
      if (has(a, "image-label")) {
        const il = a["image-label"];
        const w = `${g || "/"}: image-label`;
        if (!isObject(il)) reject11(`${w} is not an object`);
        const l = il;
        checkVersion(w, l);
        if (!images.has(g)) reject11(`${w}: the group has no multiscales`);
        labelImages.add(g);
        for (const key2 of ["colors", "properties"]) {
          if (!has(l, key2)) continue;
          const items = l[key2];
          if (!Array.isArray(items) || !items.every((c) => isObject(c) && isInt(get2(c, "label-value")))) {
            reject11(`${w}: ${key2} is not an array of objects with an integer label-value`);
          }
        }
        if (has(l, "colors")) {
          const colors = l.colors;
          const values2 = colors.map((c) => c["label-value"]);
          if (new Set(values2).size !== values2.length) reject11(`${w}: colors label-values are not unique`);
          for (const c of colors) {
            if (has(c, "rgba") && !(Array.isArray(c.rgba) && c.rgba.length === 4 && c.rgba.every((x) => asInt(x, 0, 255) !== void 0))) {
              reject11(`${w}: rgba ${show(c.rgba).slice(0, 40)} is not four integers from 0 to 255`);
            }
          }
        }
        if (has(l, "source")) {
          const src = l.source;
          if (!isObject(src) || has(src, "image") && typeof src.image !== "string") reject11(`${w}: source is not an object with a string image`);
        }
      }
    }
    for (const x of sorted2(labelImages)) {
      const il = get2(attrs.get(x), "image-label");
      const src = isObject(il) ? get2(il, "source") : void 0;
      const rel = isObject(src) ? get2(src, "image") : void 0;
      const source = resolve(x, rel ?? "../../");
      if (rel !== void 0 && (source === void 0 || !images.has(source))) reject11(`${x}: the label's source image ${show(rel)} is not an image`);
      if (source !== void 0 && images.has(source)) {
        const n = multiscales.get(source)[0].datasets.length;
        multiscales.get(x).forEach((m, i) => {
          const k = m.datasets.length;
          if (k < n) reject11(`${x}: the label image has ${k} levels, fewer than its image ${source || "/"}'s ${n}`);
          if (k > n) kept.set(keptKey(x, i), n);
        });
      }
      for (const [i, m] of multiscales.get(x).entries()) {
        for (const d of m.datasets.slice(0, kept.get(keptKey(x, i)))) {
          const level3 = join(x, d.path);
          const dt = arrays.get(level3).data_type;
          if (!LABEL_TYPES.has(dt)) reject11(`${level3}: label data type ${dt} is not an integer type`);
        }
      }
    }
    const wells = new Set([...attrs.keys()].filter((p) => has(attrs.get(p), "well")));
    const wellImages = /* @__PURE__ */ new Map();
    for (const g of sorted2(wells)) {
      const wl = attrs.get(g).well;
      const w = `${g || "/"}: well`;
      if (!isObject(wl)) reject11(`${w} is not an object`);
      checkVersion(w, wl);
      const ims = get2(wl, "images");
      if (!Array.isArray(ims) || !ims.every(isObject)) reject11(`${w}: images is not an array of objects`);
      const paths = ims.map((i) => get2(i, "path"));
      for (const i of ims) {
        const p = get2(i, "path");
        if (!(typeof p === "string" && ALNUM.test(p))) reject11(`${w}: image path ${show(p).slice(0, 40)} is not alphanumeric`);
        if (!images.has(join(g, p))) reject11(`${w}: ${join(g, p)} is not an image`);
        if (has(i, "acquisition") && !isInt(i.acquisition)) reject11(`${w}: acquisition ${show(i.acquisition).slice(0, 20)} is not an integer`);
      }
      if (new Set(paths).size !== paths.length) reject11(`${w}: image paths are not unique`);
      wellImages.set(g, ims);
    }
    const plates = sorted2([...attrs.keys()].filter((p) => has(attrs.get(p), "plate")));
    for (const g of plates) {
      const pl = attrs.get(g).plate;
      const w = `${g || "/"}: plate`;
      if (!isObject(pl)) reject11(`${w} is not an object`);
      const p = pl;
      checkVersion(w, p);
      const named = {};
      for (const key2 of ["columns", "rows"]) {
        const items = get2(p, key2);
        if (!Array.isArray(items) || !items.every(isObject)) reject11(`${w}: ${key2} is not an array of objects`);
        const ns = items.map((c) => get2(c, "name"));
        if (!ns.every((x) => typeof x === "string" && ALNUM.test(x))) reject11(`${w}: a ${key2.slice(0, -1)} name is not alphanumeric`);
        if (new Set(ns).size !== ns.length) reject11(`${w}: ${key2.slice(0, -1)} names are not unique`);
        named[key2] = ns;
      }
      if (has(p, "field_count") && asInt(p.field_count, 1) === void 0) reject11(`${w}: field_count ${show(p.field_count).slice(0, 20)} is not a positive integer`);
      if (has(p, "name") && typeof p.name !== "string") reject11(`${w}: name is not a string`);
      let ids;
      if (has(p, "acquisitions")) {
        const acq = p.acquisitions;
        if (!Array.isArray(acq) || !acq.every(isObject)) reject11(`${w}: acquisitions is not an array of objects`);
        for (const a of acq) {
          if (asInt(get2(a, "id"), 0) === void 0) reject11(`${w}: acquisition id ${show(get2(a, "id")).slice(0, 20)} is not an integer from 0`);
          if (has(a, "maximumfieldcount") && asInt(a.maximumfieldcount, 1) === void 0) reject11(`${w}: maximumfieldcount is not a positive integer`);
          for (const k of ["name", "description"]) if (has(a, k) && typeof a[k] !== "string") reject11(`${w}: acquisition ${k} is not a string`);
          for (const k of ["starttime", "endtime"]) if (has(a, k) && !isInt(a[k])) reject11(`${w}: acquisition ${k} is not an integer`);
        }
        ids = acq.map((a) => a.id);
        if (new Set(ids).size !== ids.length) reject11(`${w}: acquisition ids are not unique`);
      }
      const ws = get2(p, "wells");
      if (!Array.isArray(ws) || !ws.every(isObject)) reject11(`${w}: wells is not an array of objects`);
      for (const x of ws) {
        const r = asInt(get2(x, "rowIndex"), 0);
        const c = asInt(get2(x, "columnIndex"), 0);
        const path2 = get2(x, "path");
        if (r === void 0 || c === void 0 || r >= named.rows.length || c >= named.columns.length) {
          reject11(`${w}: well rowIndex or columnIndex is not an index of rows or columns`);
        }
        if (path2 !== `${named.rows[r]}/${named.columns[c]}`) {
          reject11(`${w}: well path ${show(path2).slice(0, 40)} is not row ${named.rows[r]}/column ${named.columns[c]}`);
        }
        const wp = join(g, path2);
        if (!wells.has(wp)) reject11(`${w}: ${wp} is not a well`);
        if (ids !== void 0) {
          for (const i of wellImages.get(wp)) {
            if (has(i, "acquisition")) {
              if (!ids.includes(i.acquisition)) reject11(`${wp}: acquisition ${show(i.acquisition)} is not one of the plate's`);
            } else if (ids.length > 1) {
              reject11(`${wp}: an image has no acquisition, and the plate has several`);
            }
          }
        }
      }
    }
    for (const g of collections) {
      const a = attrs.get(g);
      if (asInt(a["bioformats2raw.layout"]) !== 3) reject11(`${g || "/"}: bioformats2raw.layout is not 3`);
      const ome = join(g, "OME");
      if (seriesGroups.has(ome)) {
        const series = attrs.get(ome).series;
        if (!Array.isArray(series) || !series.every((s) => relPath(s) && images.has(join(g, s)))) {
          reject11(`${ome}: series is not an array of image paths`);
        }
      } else if (!has(a, "plate")) {
        const numbered = [...images].filter((p) => p !== g && parentOf(p) === g && canonicalIndex(lastSegment(p), 2 ** 53)).map((p) => Number(lastSegment(p))).sort((x, y) => x - y);
        if (numbered.length === 0 || numbered.some((v, i) => v !== i)) reject11(`${g || "/"}: the images are not numbered consecutively from 0`);
      }
    }
    const names = /* @__PURE__ */ new Map();
    for (const [g, i, j, target, axisNames] of levels) {
      if (j >= (kept.get(keptKey(g, i)) ?? j + 1)) continue;
      if (!names.has(target)) names.set(target, axisNames);
      else if (show(names.get(target)) !== show(axisNames)) {
        reject11(`${target} is a level of images with axes ${show(names.get(target))} and ${show(axisNames)}`);
      }
    }
    let dropped = 0;
    for (const [k, n] of kept) {
      const [g, i] = [k.slice(0, k.lastIndexOf("\0")), Number(k.slice(k.lastIndexOf("\0") + 1))];
      dropped += multiscales.get(g)[i].datasets.length - n;
    }
    const groups = /* @__PURE__ */ new Map();
    const omes = /* @__PURE__ */ new Map();
    const unversioned = /* @__PURE__ */ new Map();
    const omeSet = new Set(omeGroups);
    for (const [path2, a] of attrs) {
      if (!omeSet.has(path2)) {
        groups.set(path2, a);
        continue;
      }
      const keys = seriesGroups.has(path2) ? [...OME_KEYS, "series"] : OME_KEYS;
      const ome = { version: "0.5" };
      const restored = /* @__PURE__ */ new Set();
      const bare = [];
      for (const k of keys) {
        if (!has(a, k)) continue;
        let v = a[k];
        if (k === "multiscales") {
          const ms = v;
          if (!ms.some((_, i) => kept.has(keptKey(path2, i)))) {
            if (ms.every((m) => get2(m, "version") === "0.4")) {
              restored.add(k);
            } else if (ms.every((m) => !has(m, "version"))) {
              restored.add(k);
              bare.push(k);
            }
          }
          v = ms.map((m, i) => {
            const out2 = without(m, ["version"]);
            const n = kept.get(keptKey(path2, i));
            if (n !== void 0) out2.datasets = m.datasets.slice(0, n);
            return out2;
          });
        } else if (VERSIONED.has(k)) {
          if (get2(v, "version") === "0.4") {
            restored.add(k);
          } else if (!has(v, "version")) {
            restored.add(k);
            bare.push(k);
          }
          v = without(v, ["version"]);
        } else {
          restored.add(k);
        }
        ome[k] = v;
      }
      groups.set(path2, without(a, [...restored]));
      omes.set(path2, ome);
      if (bare.length) unversioned.set(path2, bare);
    }
    const docs = /* @__PURE__ */ new Map();
    for (const [path2, doc] of arrays) {
      const names_ = names.get(path2);
      docs.set(path2, names_ === void 0 ? doc : { ...without(doc, ["attributes"]), dimension_names: names_, attributes: doc.attributes });
    }
    const xml = collections.map((c) => join(join(c, "OME"), "METADATA.ome.xml")).filter((k) => store.objects.has(k)).map((k) => [k, store.objects.get(k)]);
    const [result, all, others] = hierarchyOutput(store, h, groups, docs, "ome-zarr", xml, omes, unversioned);
    const nonempty = all.filter(([, n]) => n > 0).length;
    let fields2 = 0;
    for (const v of wellImages.values()) fields2 += v.length;
    return {
      ...result,
      summary: {
        groups: attrs.size + h.implicit.size,
        arrays: arrays.size,
        chunks: nonempty,
        emptyChunks: all.length - nonempty,
        objects: store.objects.size,
        images: images.size,
        labels: labelImages.size,
        droppedLabelLevels: dropped,
        plates: plates.length,
        wells: wells.size,
        fields: fields2,
        omeXml: xml.filter(([, n]) => n > 0).length,
        otherObjects: others,
        listingRequests: store.requests
      }
    };
  }

  // src/virtualize/safe/product.ts
  var SafeError = class extends Error {
  };
  var reject12 = (m) => {
    throw new SafeError(m);
  };
  var MAX_XML = 1 << 24;
  var MAX_U32 = 4294967295;
  var MARKER = "_$folder$";
  var LEVELS3 = {
    "MTD_MSIL1C.xml": ["L1C", "Level-1C_User_Product", "Level-1C_Tile_ID"],
    "MTD_MSIL2A.xml": ["L2A", "Level-2A_User_Product", "Level-2A_Tile_ID"]
  };
  var GRANULE = "General_Info/Product_Info/Product_Organisation/Granule_List/Granule";
  var ALIASES = {
    Product_Info: "L2A_Product_Info",
    Product_Organisation: "L2A_Product_Organisation",
    IMAGE_FILE: "IMAGE_FILE_2A",
    PRODUCT_URI: "PRODUCT_URI_2A",
    Product_Image_Characteristics: "L2A_Product_Image_Characteristics",
    QUANTIFICATION_VALUES_LIST: "L1C_L2A_Quantification_Values_List",
    BOA_QUANTIFICATION_VALUE: "L2A_BOA_QUANTIFICATION_VALUE",
    AOT_QUANTIFICATION_VALUE: "L2A_AOT_QUANTIFICATION_VALUE",
    WVP_QUANTIFICATION_VALUE: "L2A_WVP_QUANTIFICATION_VALUE",
    Scene_Classification_List: "L2A_Scene_Classification_List",
    Scene_Classification_ID: "L2A_Scene_Classification_ID",
    SCENE_CLASSIFICATION_TEXT: "L2A_SCENE_CLASSIFICATION_TEXT",
    SCENE_CLASSIFICATION_INDEX: "L2A_SCENE_CLASSIFICATION_INDEX",
    TILE_ID: "TILE_ID_2A"
  };
  var DECIMAL4 = /^[+-]?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;
  var POSITIVE = /^[1-9][0-9]*$/;
  var local = (name) => name.slice(name.lastIndexOf(":") + 1);
  function kids(el, name) {
    const alias = Object.hasOwn(ALIASES, name) ? ALIASES[name] : name;
    return el.children.filter((c) => {
      const n = local(c.name);
      return n === name || n === alias;
    });
  }
  function path(el, p) {
    let found = [el];
    for (const name of p.split("/")) found = found.flatMap((e) => kids(e, name));
    return found;
  }
  function attr(el, name) {
    return el.attributes.find(([n]) => n === name)?.[1];
  }
  function text4(el) {
    if (el.children.length) return void 0;
    return el.text.join("").replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
  }
  function one2(els, what) {
    if (els.length !== 1) reject12(`${what}: ${els.length} elements where there must be one`);
    return els[0];
  }
  function layoutText(el, what) {
    const t = text4(el);
    return t === void 0 ? reject12(`${what} has a child element`) : t;
  }
  function parseDocument(data, what) {
    if (data[0] === 239 && data[1] === 187 && data[2] === 191) reject12(`${what} starts with a byte order mark`);
    let s = "";
    try {
      s = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(data);
    } catch {
      reject12(`${what} is not UTF-8`);
    }
    return parseXml(s, what, (m) => new SafeError(m));
  }
  function folders(keys, directories = []) {
    const all = [...keys];
    const markers = new Set(all.filter((k) => k.endsWith(MARKER) && k.length > MARKER.length));
    const named = /* @__PURE__ */ new Set([
      ...[...markers].map((k) => k.slice(0, -MARKER.length)),
      ...directories.filter((d) => d.length > 1).map((d) => d.slice(0, -1))
    ]);
    const parents = /* @__PURE__ */ new Set();
    for (const k of [...all, ...named]) for (let i = k.indexOf("/"); i > 0; i = k.indexOf("/", i + 1)) parents.add(k.slice(0, i));
    return [markers, [...named].filter((d) => !parents.has(d)).sort(compareKeys)];
  }
  var isXml = (key2) => key2 === "manifest.safe" || key2.endsWith(".xml") || key2.endsWith(".xsd");
  function u32(t, what) {
    if (!POSITIVE.test(t) || t.length > 10 || Number(t) > MAX_U32) {
      reject12(`${what} ${JSON.stringify(t.slice(0, 40))} is not a positive integer below 2^32`);
    }
    return Number(t);
  }
  function productLevel(sizes) {
    const found = Object.keys(LEVELS3).filter((k) => sizes.has(k));
    if (found.length !== 1) {
      reject12("not a SAFE product of the compact format: the root has " + (found.length ? "both MTD_MSIL1C.xml and MTD_MSIL2A.xml" : "no MTD_MSIL1C.xml or MTD_MSIL2A.xml (products before December 2016 are not supported)"));
    }
    if (!sizes.has("manifest.safe")) reject12("a SAFE product has no manifest.safe");
    return found[0];
  }
  async function readProduct(sizes, whole) {
    const key2 = productLevel(sizes);
    const [level3, rootName, tileName] = LEVELS3[key2];
    if (sizes.get(key2) > MAX_XML) reject12(`${key2} is larger than 2^24 bytes`);
    const root = parseDocument(await whole(key2), key2);
    if (local(root.name) !== rootName) reject12(`${key2}'s root element is not ${rootName}`);
    const files = path(root, GRANULE).flatMap((granule) => kids(granule, "IMAGE_FILE"));
    if (!files.length) reject12(`${key2}: no granule has an IMAGE_FILE`);
    const images = [];
    const seen = /* @__PURE__ */ new Set();
    let g;
    for (const el of files) {
      const f = layoutText(el, `${key2}: an IMAGE_FILE`);
      const parts = f.split("/");
      if (parts.length < 4 || parts[0] !== "GRANULE" || parts.includes("")) {
        reject12(`${key2}: IMAGE_FILE ${JSON.stringify(f.slice(0, 200))} is not GRANULE/<g>/<directory>/<file>`);
      }
      if (g === void 0) g = parts[1];
      else if (parts[1] !== g) reject12(`${key2}: the image files are in two granule directories`);
      if (seen.has(f)) reject12(`${key2}: IMAGE_FILE ${JSON.stringify(f.slice(0, 200))} is listed twice`);
      seen.add(f);
      if (parts[2] !== "IMG_DATA") continue;
      if (!sizes.has(f + ".jp2")) reject12(`the band file ${f.slice(0, 200)}.jp2 is not in the product`);
      images.push({ text: f, key: f + ".jp2", basename: parts[parts.length - 1] });
    }
    if (!images.length) reject12(`${key2}: no image file is in IMG_DATA`);
    const tileKey = `GRANULE/${g}/MTD_TL.xml`;
    if (!sizes.has(tileKey)) reject12(`the tile metadata ${tileKey.slice(0, 200)} is not in the product`);
    if (sizes.get(tileKey) > MAX_XML) reject12("the tile metadata is larger than 2^24 bytes");
    const tile = parseDocument(await whole(tileKey), "MTD_TL.xml");
    if (local(tile.name) !== tileName) reject12(`the tile metadata's root element is not ${tileName}`);
    return {
      level: level3,
      metadataKey: key2,
      metadata: root,
      granule: g,
      images,
      tileKey,
      tile,
      geocoding: geocoding(tile)
    };
  }
  function geocoding(tile) {
    const tg = one2(path(tile, "Geometric_Info/Tile_Geocoding"), "MTD_TL.xml: Geometric_Info/Tile_Geocoding");
    const code = layoutText(one2(kids(tg, "HORIZONTAL_CS_CODE"), "Tile_Geocoding/HORIZONTAL_CS_CODE"), "HORIZONTAL_CS_CODE");
    if (!/^EPSG:[0-9]+$/.test(code)) reject12(`HORIZONTAL_CS_CODE ${JSON.stringify(code.slice(0, 40))} is not EPSG: and digits`);
    const sizes = /* @__PURE__ */ new Map();
    const texts = /* @__PURE__ */ new Map();
    const sizeEls = kids(tg, "Size");
    if (!sizeEls.length) reject12("Tile_Geocoding has no Size");
    for (const el of sizeEls) {
      const rt = attr(el, "resolution");
      if (rt === void 0) reject12("a Size has no resolution");
      const r = u32(rt, "a Size's resolution");
      if (sizes.has(r)) reject12(`two Sizes have the resolution ${r}`);
      const rows = u32(layoutText(one2(kids(el, "NROWS"), "Size/NROWS"), "NROWS"), "NROWS");
      const cols = u32(layoutText(one2(kids(el, "NCOLS"), "Size/NCOLS"), "NCOLS"), "NCOLS");
      sizes.set(r, [rows, cols]);
      texts.set(r, rt);
    }
    const positions = /* @__PURE__ */ new Map();
    const geos = kids(tg, "Geoposition");
    for (const [r, rt] of texts) {
      const el = one2(geos.filter((g) => attr(g, "resolution") === rt), `Geoposition of resolution ${rt}`);
      const vals = ["ULX", "ULY", "XDIM", "YDIM"].map((name) => {
        const t = layoutText(one2(kids(el, name), `Geoposition/${name}`), name);
        const v = DECIMAL4.test(t) ? Number(t) : NaN;
        if (!Number.isFinite(v)) reject12(`Geoposition ${name} ${JSON.stringify(t.slice(0, 40))} is not a finite decimal number`);
        return v;
      });
      if (vals[2] === 0 || vals[3] === 0) reject12("a Geoposition's XDIM or YDIM is 0");
      positions.set(r, vals);
    }
    return { code, sizes, positions, element: tg };
  }
  function bandName(basename, r) {
    let b = basename;
    const suffix = `_${r}m`;
    if (b.endsWith(suffix)) b = b.slice(0, -suffix.length);
    const name = b.slice(b.lastIndexOf("_") + 1);
    if (!/^[A-Za-z0-9]+$/.test(name)) {
      reject12(`the band name ${JSON.stringify(name.slice(0, 40))} of ${JSON.stringify(basename.slice(0, 100))} is not ASCII letters and digits`);
    }
    return name;
  }
  function resolution(geo, width, height, key2) {
    const found = [...geo.sizes].filter(([, [rows, cols]]) => rows === height && cols === width).map(([r]) => r);
    if (found.length !== 1) {
      reject12(`the band file ${key2.slice(0, 200)} (${width} \xD7 ${height}) matches ${found.length ? "several" : "no"} resolution of the tile geocoding`);
    }
    return found[0];
  }

  // src/virtualize/safe/jp2.ts
  var MAX_BOXES = 1024;
  var MAX_REST = 1 << 16;
  var MAX_TAIL = 1 << 12;
  var BLOCK = 1 << 16;
  var SMALL_TILE = 1 << 14;
  var SOC = 65359;
  var SIZ = 65361;
  var SOT = 65424;
  var EOC = 65497;
  var COD = 65362;
  var COC = 65363;
  var QCD = 65372;
  var ALLOWED2 = /* @__PURE__ */ new Set([COD, COC, QCD, 65373, 65374, 65375, 65379, 65380]);
  var NAMES = { 65365: "TLM", 65367: "PLM", 65376: "PPM", 65360: "CAP", 65369: "CPF" };
  var reject13 = (m) => {
    throw new SafeError(m);
  };
  var view3 = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var u16 = (b, at = 0) => view3(b).getUint16(at);
  var Reader = class {
    start = 0;
    data = new Uint8Array(0);
    requests = 0;
    raw;
    base;
    n;
    constructor(raw, base, n) {
      this.raw = raw;
      this.base = base;
      this.n = n;
    }
    async read(offset, length2, ahead = BLOCK) {
      if (offset < 0 || offset + length2 > this.n) {
        reject13(`a band file read of [${offset}, ${offset + length2}) is outside its ${this.n} bytes`);
      }
      if (this.start <= offset && offset + length2 <= this.start + this.data.length) {
        return this.data.subarray(offset - this.start, offset - this.start + length2);
      }
      const size2 = Math.min(this.n - offset, Math.max(length2, ahead));
      this.requests++;
      this.data = await this.raw(this.base + offset, size2);
      this.start = offset;
      return this.data.subarray(0, length2);
    }
  };
  function grid2(cs) {
    return [Math.ceil(cs.width / cs.tileW), Math.ceil(cs.height / cs.tileH)];
  }
  async function boxes(r) {
    const n = r.n;
    let o = 0;
    for (let i = 0; i < MAX_BOXES; i++) {
      if (o + 8 > n) reject13("a band file is not a JP2 file: its boxes end without a jp2c box");
      const head = await r.read(o, 8);
      const lbox = view3(head).getUint32(0);
      const tbox = String.fromCharCode(...head.subarray(4, 8));
      if (i === 0) {
        const sig2 = lbox === 12 && tbox === "jP  " ? await r.read(o + 8, 4) : void 0;
        if (sig2 === void 0 || sig2[0] !== 13 || sig2[1] !== 10 || sig2[2] !== 135 || sig2[3] !== 10) {
          reject13("a band file is not a JP2 file: no JPEG 2000 signature box");
        }
      }
      let length2, hl;
      if (lbox === 1) {
        if (o + 16 > n) reject13("a JP2 box's XLBox is beyond the file");
        const xl = view3(await r.read(o + 8, 8)).getBigUint64(0);
        if (xl < 16n) reject13(`a JP2 box's XLBox is ${xl}, less than 16`);
        length2 = xl > BigInt(Number.MAX_SAFE_INTEGER) ? Infinity : Number(xl);
        hl = 16;
      } else if (lbox === 0) {
        [length2, hl] = [n - o, 8];
      } else {
        [length2, hl] = [lbox, 8];
        if (length2 < 8) reject13(`a JP2 box's LBox is ${length2}`);
      }
      if (o + length2 > n) reject13("a JP2 box reaches beyond the file");
      if (i === 1 && tbox !== "ftyp") reject13("a band file's second box is not ftyp");
      if (tbox === "jp2c") {
        if (o + length2 !== n) reject13("a band file's jp2c box does not end at the end of the file");
        return o + hl;
      }
      o += length2;
    }
    return reject13(`a band file has no jp2c box in its first ${MAX_BOXES} boxes`);
  }
  function coding(seg, at, scod, what) {
    const levels = seg[at];
    if (levels > 32) reject13(`${what} has ${levels} decomposition levels, more than 32`);
    const pp = [];
    for (let r = 0; r <= levels; r++) {
      const b = scod & 1 ? seg[at + 5 + r] : 255;
      pp.push([b & 15, b >> 4]);
    }
    return [levels, pp];
  }
  async function mainHeader(r, c0) {
    const c1 = r.n;
    if (c0 + 4 > c1 || u16(await r.read(c0, 2)) !== SOC) reject13("a band file's codestream does not start with SOC");
    if (u16(await r.read(c0 + 2, 2)) !== SIZ) reject13("a band file's codestream has no SIZ marker after SOC");
    if (c0 + 6 > c1) reject13("a band file's SIZ marker is truncated");
    const lsiz = u16(await r.read(c0 + 4, 2));
    if (c0 + 4 + lsiz > c1 || lsiz < 41) reject13("a band file's SIZ segment is truncated");
    const siz = (await r.read(c0 + 2, 2 + lsiz)).slice();
    const v = view3(siz);
    const rsiz = v.getUint16(4);
    const [xs, ys, xo, yo, xt, yt, xto, yto] = [6, 10, 14, 18, 22, 26, 30, 34].map((at) => v.getUint32(at));
    const csiz = v.getUint16(38);
    if (lsiz !== 38 + 3 * csiz) reject13(`a band file's Lsiz ${lsiz} is not 38 + 3 \xD7 Csiz`);
    if (rsiz & 49152) reject13("a band file uses JPEG 2000 Part 2 or High Throughput (Rsiz)");
    if (xo || yo || xto || yto) reject13("a band file's image or tile origin is not 0");
    if (!(xs && ys && xt && yt)) reject13("a band file's image or tile size is 0");
    if (csiz !== 1 && csiz !== 3) reject13(`a band file has ${csiz} components, not 1 or 3`);
    const comps = Array.from({ length: csiz }, (_, c) => siz.subarray(40 + 3 * c, 43 + 3 * c));
    if (new Set(comps.map((c) => c[0])).size !== 1) reject13("a band file's components differ in precision or sign");
    if (comps[0][0] & 128) reject13("a band file's components are signed");
    const precision = (comps[0][0] & 127) + 1;
    if (precision > 16) reject13(`a band file's components have ${precision} bits, more than 16`);
    if (comps.some((c) => c[1] !== 1 || c[2] !== 1)) reject13("a band file's components are subsampled");
    let pos = c0 + 4 + lsiz;
    let cod;
    let qcd = 0;
    const cocs = /* @__PURE__ */ new Map();
    for (; ; ) {
      if (pos + 2 > c1) reject13("a band file's main header has no SOT");
      const marker = u16(await r.read(pos, 2));
      if (marker === SOT) break;
      if (!ALLOWED2.has(marker)) {
        reject13(`a band file's main header has a ${NAMES[marker] ?? marker.toString(16).toUpperCase()} marker`);
      }
      if (pos + 4 > c1) reject13("a band file's main header marker segment is truncated");
      const length2 = u16(await r.read(pos + 2, 2));
      if (length2 < 2 || pos + 2 + length2 > c1) reject13("a band file's main header marker segment is truncated");
      const seg = await r.read(pos + 4, length2 - 2);
      if (marker === COD) {
        if (cod !== void 0) reject13("a band file's main header has two COD markers");
        if (length2 < 12) reject13("a band file's COD segment is truncated");
        const scod = seg[0], layers = u16(seg, 2);
        if (scod > 1) reject13("a band file's COD uses SOP or EPH markers, or precinct anchors (Scod)");
        if (layers < 1) reject13("a band file's COD has no layers");
        if (length2 !== (scod ? 13 + seg[5] : 12)) reject13("a band file's COD segment has the wrong length");
        cod = [layers, coding(seg, 5, scod, "a band file's COD")];
      } else if (marker === COC) {
        if (length2 < 9) reject13("a band file's COC segment is truncated");
        const c = seg[0], scoc = seg[1];
        if (c >= csiz || cocs.has(c)) reject13("a band file's COC names no component, or one already named");
        if (scoc > 1) reject13("a band file's COC has a bad Scoc");
        if (length2 !== (scoc ? 10 + seg[2] : 9)) reject13("a band file's COC segment has the wrong length");
        cocs.set(c, coding(seg, 2, scoc, "a band file's COC"));
      } else if (marker === QCD) {
        qcd++;
      }
      pos += 2 + length2;
    }
    if (cod === void 0 || qcd !== 1) reject13("a band file's main header does not have exactly one COD and one QCD");
    const restStart = c0 + 4 + lsiz;
    if (pos - restStart > MAX_REST) reject13(`a band file's main header is more than ${MAX_REST} bytes`);
    const rest = (await r.read(restStart, pos - restStart)).slice();
    const cs = {
      n: r.n,
      c0,
      siz,
      rest,
      width: xs,
      height: ys,
      tileW: xt,
      tileH: yt,
      components: csiz,
      precision,
      layers: cod[0],
      coding: Array.from({ length: csiz }, (_, c) => cocs.get(c) ?? cod[1]),
      tiles: [[pos, 0]]
    };
    const [nx, ny] = grid2(cs);
    if (nx * ny > 65535) reject13(`a band file has ${nx * ny} tiles, more than 65535`);
    return cs;
  }
  async function walk(r, cs) {
    const c1 = r.n;
    const [nx, ny] = grid2(cs);
    let s = cs.tiles[0][0];
    const tiles = [];
    let ahead = BLOCK;
    for (let k = 0; k < nx * ny; k++) {
      if (s + 12 > c1) reject13(`a band file's tile-part ${k} is beyond the codestream`);
      const v = view3(await r.read(s, 12, ahead));
      if (v.getUint16(0) !== SOT || v.getUint16(2) !== 10) reject13(`a band file has no SOT marker segment for tile ${k}`);
      const isot = v.getUint16(4), psot = v.getUint32(6), tpsot = v.getUint8(10), tnsot = v.getUint8(11);
      if (isot !== k) reject13(`a band file's tile-parts are not in raster order (tile ${isot} where ${k} is)`);
      if (psot < 14) reject13(`a band file's tile-part ${k} has Psot ${psot}`);
      if (tpsot !== 0 || tnsot !== 1) reject13(`a band file's tile ${k} has more than one tile-part`);
      if (s + psot > c1 - 2) reject13(`a band file's tile-part ${k} reaches beyond the codestream`);
      tiles.push([s, psot]);
      ahead = psot <= SMALL_TILE ? BLOCK : 12;
      s += psot;
    }
    if (s + 2 !== c1 || u16(await r.read(s, 2, 2)) !== EOC) {
      reject13("a band file's codestream does not end with EOC after its last tile-part");
    }
    cs.tiles = tiles;
  }
  async function readBand(raw, base, n) {
    const r = new Reader(raw, base, n);
    const cs = await mainHeader(r, await boxes(r));
    await walk(r, cs);
    return [cs, r.requests];
  }
  function nprec(z0, z1, d, e) {
    const a = Math.ceil(z0 / 2 ** d), b = Math.ceil(z1 / 2 ** d);
    return b > a ? Math.ceil(b / 2 ** e) - Math.floor(a / 2 ** e) : 0;
  }
  function emptyPackets(cs, x0, x1, y0, y1) {
    let n = 0;
    for (const [levels, pp] of cs.coding) {
      for (let res = 0; res <= levels; res++) {
        n += nprec(x0, x1, levels - res, pp[res][0]) * nprec(y0, y1, levels - res, pp[res][1]);
      }
    }
    return cs.layers * n;
  }
  function area(cs, t) {
    const [nx] = grid2(cs);
    const T = cs.tileW, U = cs.tileH;
    const x0 = t % nx * T, y0 = Math.floor(t / nx) * U;
    const w = Math.min(T, cs.width - x0), h = Math.min(U, cs.height - y0);
    if (x0 + T > 4294967295 || y0 + U > 4294967295) reject13("a chunk's image area reaches beyond 2^32 \u2212 1");
    return [x0, y0, w, h, Math.ceil(T / w), Math.ceil(U / h)];
  }
  function tailPackets(cs, t) {
    const [x0, y0, w, h, a, b] = area(cs, t);
    const T = cs.tileW, U = cs.tileH;
    const tooLong = `the empty tiles of a chunk of tile ${t} would take more than ${MAX_TAIL} bytes`;
    if (2 + 14 * (a * b - 1) > MAX_TAIL) reject13(tooLong);
    const out2 = [];
    let length2 = 2;
    for (let k = 1; k < a * b; k++) {
      const i = k % a, j = Math.floor(k / a);
      const e = emptyPackets(cs, x0 + i * w, Math.min(x0 + (i + 1) * w, x0 + T), y0 + j * h, Math.min(y0 + (j + 1) * h, y0 + U));
      length2 += 14 + e;
      if (!(length2 <= MAX_TAIL)) reject13(tooLong);
      out2.push(e);
    }
    return out2;
  }
  function tailLength(cs, t) {
    return tailPackets(cs, t).reduce((m, e) => m + 14 + e, 2);
  }
  function chunkParts(cs, t) {
    const [x0, y0, w, h, a, b] = area(cs, t);
    const T = cs.tileW, U = cs.tileH;
    const packets = tailPackets(cs, t);
    const head = new Uint8Array(2 + cs.siz.length);
    head.set([255, 79]);
    head.set(cs.siz, 2);
    const hv = new DataView(head.buffer);
    hv.setUint16(6, 0);
    [x0 + T, y0 + U, x0, y0, w, h, x0, y0].forEach((x, i) => hv.setUint32(8 + 4 * i, x));
    const [s, psot] = cs.tiles[t];
    const sot = sotSegment(0, psot);
    const tail = new Uint8Array(packets.reduce((m, e) => m + 14 + e, 2));
    let at = 0;
    for (const [i, e] of packets.entries()) {
      tail.set(sotSegment(i + 1, 14 + e), at);
      tail.set([255, 147], at + 12);
      at += 14 + e;
    }
    tail.set([255, 217], at);
    return [head, sot, [s + 12, psot - 12], tail, a * b > 1];
  }
  function sotSegment(isot, psot) {
    const b = new Uint8Array(12);
    const v = new DataView(b.buffer);
    v.setUint16(0, SOT);
    v.setUint16(2, 10);
    v.setUint16(4, isot);
    v.setUint32(6, psot);
    v.setUint8(10, 0);
    v.setUint8(11, 1);
    return b;
  }

  // src/virtualize/safe/metadata.ts
  var PROJ = {
    uuid: "f17cb550-5864-4468-aeb7-f3180cfb622f",
    schema_url: "https://raw.githubusercontent.com/zarr-conventions/proj/refs/tags/v0.1/schema.json",
    spec_url: "https://github.com/zarr-conventions/proj/blob/v0.1/README.md",
    name: "proj",
    description: "Coordinate reference system information for geospatial data"
  };
  var SPATIAL = {
    uuid: "689b58e2-cf7b-45e0-9fff-9cfc0883d6b4",
    schema_url: "https://raw.githubusercontent.com/zarr-conventions/spatial/refs/tags/v0.1/schema.json",
    spec_url: "https://github.com/zarr-conventions/spatial/blob/v0.1/README.md",
    name: "spatial",
    description: "Spatial coordinate information"
  };
  var MULTISCALES = {
    uuid: "d35379db-88df-4056-af3a-620245f8e347",
    schema_url: "https://raw.githubusercontent.com/zarr-conventions/multiscales/refs/tags/v0.1/schema.json",
    spec_url: "https://github.com/zarr-conventions/multiscales/blob/v0.1/README.md",
    name: "multiscales",
    description: "Multiscale layout of zarr datasets"
  };
  var DEG = 'ANGLEUNIT["degree",0.0174532925199433]';
  var M = 'LENGTHUNIT["metre",1]';
  function wkt2(code) {
    const m = /^EPSG:([1-9][0-9]{4})$/.exec(code);
    if (m === null) return void 0;
    const c = Number(m[1]);
    let z, h;
    if (c >= 32601 && c <= 32660) [z, h] = [c - 32600, "N"];
    else if (c >= 32701 && c <= 32760) [z, h] = [c - 32700, "S"];
    else return void 0;
    const members = ["Transit", "G730", "G873", "G1150", "G1674", "G1762", "G2139", "G2296"].map((g) => `MEMBER["World Geodetic System 1984 (${g})"]`).join(",");
    return `PROJCRS["WGS 84 / UTM zone ${z}${h}",BASEGEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble",${members},ELLIPSOID["WGS 84",6378137,298.257223563,${M}],ENSEMBLEACCURACY[2.0]],PRIMEM["Greenwich",0,${DEG}],ID["EPSG",4326]],CONVERSION["UTM zone ${z}${h}",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,${DEG},ID["EPSG",8801]],PARAMETER["Longitude of natural origin",${6 * z - 183},${DEG},ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1],ID["EPSG",8805]],PARAMETER["False easting",500000,${M},ID["EPSG",8806]],PARAMETER["False northing",${h === "N" ? 0 : 1e7},${M},ID["EPSG",8807]]],CS[Cartesian,2],AXIS["(E)",east,ORDER[1],${M}],AXIS["(N)",north,ORDER[2],${M}],ID["EPSG",${c}]]`;
  }
  function gridOf(geo, r) {
    const [rows, cols] = geo.sizes.get(r);
    const [ulx, uly, xdim, ydim] = geo.positions.get(r);
    const x1 = ulx + xdim * cols, y1 = uly + ydim * rows;
    return [
      [xdim, 0, ulx, 0, ydim, uly],
      [rows, cols],
      [Math.min(ulx, x1), Math.min(uly, y1), Math.max(ulx, x1), Math.max(uly, y1)]
    ];
  }
  function crs(geo) {
    const w = wkt2(geo.code);
    return w === void 0 ? { "proj:code": geo.code } : { "proj:code": geo.code, "proj:wkt2": w };
  }
  function groupAttributes(geo, r) {
    const [transform2, shape, bbox] = gridOf(geo, r);
    return {
      zarr_conventions: [PROJ, SPATIAL],
      ...crs(geo),
      "spatial:dimensions": ["y", "x"],
      "spatial:transform": transform2,
      "spatial:shape": shape,
      "spatial:bbox": bbox,
      "spatial:registration": "pixel"
    };
  }
  function rootGeozarr(product3, resolutions) {
    const geo = product3.geocoding;
    const members = { ...crs(geo), "spatial:bbox": gridOf(geo, resolutions[0])[2] };
    if (product3.level !== "L2A") return [[PROJ, SPATIAL], members];
    members["spatial:dimensions"] = ["y", "x"];
    members["spatial:registration"] = "pixel";
    members.multiscales = {
      layout: resolutions.map((r) => ({ asset: `r${r}m`, "spatial:shape": gridOf(geo, r)[1], "spatial:transform": gridOf(geo, r)[0] }))
    };
    return [[MULTISCALES, PROJ, SPATIAL], members];
  }
  var MAX_SAFE4 = BigInt(Number.MAX_SAFE_INTEGER);
  function typed(t) {
    if (!DECIMAL4.test(t)) return t;
    if (/[.eE]/.test(t)) return jsonNumber(Number(t));
    const sign = t[0] === "-" ? "-" : "";
    const digits = t.replace(/^[+-]/, "").replace(/^0+/, "") || "0";
    if (digits.length > 16 || BigInt(digits) > MAX_SAFE4) return sign + digits;
    return Number(sign + digits) + 0;
  }
  function value(els) {
    if (els.length !== 1) return void 0;
    const t = text4(els[0]);
    return t === void 0 ? void 0 : typed(t);
  }
  function string2(els) {
    return els.length === 1 ? text4(els[0]) : void 0;
  }
  function measure(els) {
    const v = value(els);
    if (v === void 0) return void 0;
    const unit = attr(els[0], "unit");
    return unit === void 0 ? v : { value: v, unit };
  }
  function index(t) {
    return t !== void 0 && /^[0-9]{1,9}$/.test(t) ? Number(t) : void 0;
  }
  var byIndex = (els, name, i) => els.filter((e) => index(attr(e, name)) === i);
  function put3(out2, key2, v) {
    if (v === void 0) return;
    if (Array.isArray(v) && v.length === 0) return;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return;
    out2[key2] = v;
  }
  var MAX_RECORDS = 64;
  function records(els, names) {
    if (els.length > MAX_RECORDS) return void 0;
    return els.map((el) => {
      const rec = {};
      for (const n of names) put3(rec, n, value(kids(el, n)));
      return rec;
    });
  }
  function characteristics(product3) {
    const found = path(product3.metadata, "General_Info/Product_Image_Characteristics");
    return found.length === 1 ? found[0] : void 0;
  }
  function bandMetadata(product3, imageText, name, siz) {
    const s = { IMAGE_FILE: imageText };
    const x = characteristics(product3);
    const l2a = product3.level === "L2A";
    const m = /^B([0-9])([0-9])$/.exec(name);
    const pb = m ? "B" + (m[1] === "0" ? m[2] : m[1] + m[2]) : name === "B8A" ? "B8A" : void 0;
    if (x !== void 0 && pb !== void 0) {
      const infos = path(x, "Spectral_Information_List/Spectral_Information").filter((e) => attr(e, "physicalBand") === pb && index(attr(e, "bandId")) !== void 0);
      if (infos.length === 1) {
        const info = infos[0];
        const i = index(attr(info, "bandId"));
        s.bandId = i;
        s.physicalBand = pb;
        put3(s, "RESOLUTION", value(kids(info, "RESOLUTION")));
        const wl = kids(info, "Wavelength");
        if (wl.length === 1) {
          const w = {};
          for (const n of ["MIN", "MAX", "CENTRAL"]) put3(w, n, measure(kids(wl[0], n)));
          put3(s, "Wavelength", w);
        }
        put3(s, "PHYSICAL_GAINS", value(byIndex(kids(x, "PHYSICAL_GAINS"), "bandId", i)));
        put3(s, "SOLAR_IRRADIANCE", measure(byIndex(path(x, "Reflectance_Conversion/Solar_Irradiance_List/SOLAR_IRRADIANCE"), "bandId", i)));
        if (l2a) {
          put3(s, "BOA_QUANTIFICATION_VALUE", measure(path(x, "QUANTIFICATION_VALUES_LIST/BOA_QUANTIFICATION_VALUE")));
          put3(s, "BOA_ADD_OFFSET", value(byIndex(path(x, "BOA_ADD_OFFSET_VALUES_LIST/BOA_ADD_OFFSET"), "band_id", i)));
        } else {
          put3(s, "QUANTIFICATION_VALUE", measure(kids(x, "QUANTIFICATION_VALUE")));
          put3(s, "RADIO_ADD_OFFSET", value(byIndex(path(x, "Radiometric_Offset_List/RADIO_ADD_OFFSET"), "band_id", i)));
        }
      }
    }
    if (x !== void 0 && l2a) {
      if (name === "AOT" || name === "WVP") {
        put3(s, `${name}_QUANTIFICATION_VALUE`, measure(path(x, `QUANTIFICATION_VALUES_LIST/${name}_QUANTIFICATION_VALUE`)));
      } else if (name === "SCL") {
        put3(s, "Scene_Classification_List", records(
          path(x, "Scene_Classification_List/Scene_Classification_ID"),
          ["SCENE_CLASSIFICATION_TEXT", "SCENE_CLASSIFICATION_INDEX"]
        ));
      }
    }
    s.siz = siz;
    return s;
  }
  function rootMetadata(product3) {
    const s = {};
    const info = path(product3.metadata, "General_Info/Product_Info");
    for (const n of ["PRODUCT_URI", "PROCESSING_LEVEL", "PRODUCT_TYPE", "PROCESSING_BASELINE"]) {
      put3(s, n, string2(info.flatMap((e) => kids(e, n))));
    }
    const x = characteristics(product3);
    if (x !== void 0) {
      put3(s, "Special_Values", records(kids(x, "Special_Values"), ["SPECIAL_VALUE_TEXT", "SPECIAL_VALUE_INDEX"]));
      put3(s, "U", value(path(x, "Reflectance_Conversion/U")));
    }
    for (const n of ["TILE_ID", "SENSING_TIME"]) put3(s, n, string2(path(product3.tile, `General_Info/${n}`)));
    for (const n of ["HORIZONTAL_CS_NAME", "HORIZONTAL_CS_CODE"]) put3(s, n, string2(kids(product3.geocoding.element, n)));
    return s;
  }
  var BUDGET2 = 65536;
  var utf88 = new TextEncoder();
  var jsonSize4 = (v) => utf88.encode(JSON.stringify(v)).length;
  var MAX_TEXT5 = 1 << 16;
  var READ_AHEAD = 16;
  async function chooseTexts(xmlSizes, readTexts, lists, order) {
    const keySize = new Map([...xmlSizes.keys()].map((k) => [k, jsonSize4(k)]));
    const fixed = lists.filter(([, v]) => v.length).map(([n, v]) => jsonSize4(n) + 1 + 2 + v.reduce((a, k) => a + jsonSize4(k), 0) + v.length - 1);
    const nameXml = jsonSize4("xml"), nameArrays = jsonSize4("xml_arrays");
    const texts = /* @__PURE__ */ new Map();
    let xmlTotal = 0;
    let arraysTotal = [...keySize.values()].reduce((a, b) => a + b, 0) + keySize.size - 1;
    let nArrays = keySize.size;
    const size2 = (xt, nText, at, na) => {
      const members = [...fixed];
      if (nText) members.push(nameXml + 1 + 2 + xt);
      if (na) members.push(nameArrays + 1 + 2 + at);
      return 2 + members.reduce((a, b) => a + b, 0) + Math.max(0, members.length - 1);
    };
    const fits = (k) => size2(xmlTotal, texts.size, 0, 0) + xmlSizes.get(k) <= BUDGET2;
    const candidates = [...xmlSizes.keys()].filter((k) => xmlSizes.get(k) <= MAX_TEXT5).sort((a, b) => xmlSizes.get(a) - xmlSizes.get(b) || order(a, b));
    let i = 0;
    while (i < candidates.length && fits(candidates[i])) {
      const batch = [];
      while (i + batch.length < candidates.length && batch.length < READ_AHEAD && fits(candidates[i + batch.length])) {
        batch.push(candidates[i + batch.length]);
      }
      const values2 = await readTexts(batch);
      for (const [j, k] of batch.entries()) {
        i++;
        if (!fits(k)) break;
        const xt = xmlTotal + keySize.get(k) + 1 + jsonSize4(values2[j]) + (texts.size ? 1 : 0);
        const at = arraysTotal - keySize.get(k) - (nArrays > 1 ? 1 : 0);
        if (size2(xt, texts.size + 1, at, nArrays - 1) <= BUDGET2) {
          texts.set(k, values2[j]);
          [xmlTotal, arraysTotal, nArrays] = [xt, at, nArrays - 1];
        }
      }
    }
    return texts;
  }

  // src/virtualize/safe/zipdir.ts
  var MAX_TAIL2 = 65557;
  var MAX_DEFLATED = 1 << 26;
  var MAX_INFLATED = 1 << 27;
  var reject14 = (m) => {
    throw new SafeError(m);
  };
  var view4 = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var sig = (b, at, s) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));
  var EOCD = "PK";
  var LOCATOR = "PK\x07";
  var ZIP64 = "PK";
  var CENTRAL = "PK";
  var LOCAL = "PK";
  function u642(v, at) {
    const x = v.getBigUint64(at, true);
    return x > BigInt(Number.MAX_SAFE_INTEGER) ? reject14("a zip file's offset or size is above 2^53 \u2212 1") : Number(x);
  }
  function zip64Values(extra, wanted) {
    const v = view4(extra);
    for (let p = 0; p + 4 <= extra.length; ) {
      const id = v.getUint16(p, true), size2 = v.getUint16(p + 2, true);
      if (p + 4 + size2 > extra.length) break;
      if (id === 1) {
        if (size2 < 8 * wanted) reject14("a zip entry's ZIP64 extra field is too short");
        return Array.from({ length: wanted }, (_, i) => u642(v, p + 4 + 8 * i));
      }
      p += 4 + size2;
    }
    return reject14("a zip entry needs a ZIP64 extra field and has none");
  }
  async function centralDirectory(read, n) {
    const tailLen = Math.min(n, MAX_TAIL2);
    const tail = await read(n - tailLen, tailLen);
    const tv = view4(tail);
    let at = tail.length - 4;
    for (; ; at--) {
      if (at < 0) reject14("not a zip file: no end of central directory record");
      if (sig(tail, at, EOCD) && at + 22 <= tail.length && at + 22 + tv.getUint16(at + 20, true) === tail.length) break;
    }
    const eocd = n - tailLen + at;
    const [disk, cdDisk, here0, count0] = [4, 6, 8, 10].map((o) => tv.getUint16(at + o, true));
    let [cdSize, cdOffset] = [12, 16].map((o) => tv.getUint32(at + o, true));
    let here = here0, count = count0;
    if (disk || cdDisk) reject14("a zip file that spans several disks");
    if (here !== count) reject14("a zip file's entry counts differ");
    let end = eocd;
    if (count === 65535 || cdSize === 4294967295 || cdOffset === 4294967295) {
      if (eocd < 20) reject14("a ZIP64 zip file has no ZIP64 end of central directory locator");
      const loc = await read(eocd - 20, 20);
      const lv = view4(loc);
      const rec = u642(lv, 8);
      if (!sig(loc, 0, LOCATOR) || lv.getUint32(4, true) !== 0 || lv.getUint32(16, true) !== 1) {
        reject14("a ZIP64 zip file has no valid ZIP64 end of central directory locator");
      }
      if (rec + 56 > eocd - 20) reject14("a zip file's ZIP64 end of central directory record is outside it");
      const body = await read(rec, 56);
      const bv = view4(body);
      if (!sig(body, 0, ZIP64)) reject14("a zip file has no ZIP64 end of central directory record where its locator says");
      if (bv.getUint32(16, true) || bv.getUint32(20, true)) reject14("a zip file that spans several disks");
      here = u642(bv, 24);
      count = u642(bv, 32);
      cdSize = u642(bv, 40);
      cdOffset = u642(bv, 48);
      if (here !== count) reject14("a zip file's entry counts differ");
      end = rec;
    }
    if (cdOffset + cdSize !== end) reject14("a zip file's central directory does not end where its end records start");
    const cd = await read(cdOffset, cdSize);
    const v = view4(cd);
    const entries = [];
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (p + 46 > cd.length || !sig(cd, p, CENTRAL)) reject14("a zip file's central directory has fewer entries than it says");
      const flags = v.getUint16(p + 8, true), method = v.getUint16(p + 10, true), crc = v.getUint32(p + 16, true);
      let cs = v.getUint32(p + 20, true), us = v.getUint32(p + 24, true), lho = v.getUint32(p + 42, true);
      const nn = v.getUint16(p + 28, true), ne = v.getUint16(p + 30, true), nc = v.getUint16(p + 32, true);
      const diskNo = v.getUint16(p + 34, true);
      if (p + 46 + nn + ne + nc > cd.length) reject14("a zip file's central directory entry is truncated");
      const rawName = cd.subarray(p + 46, p + 46 + nn);
      const extra = cd.subarray(p + 46 + nn, p + 46 + nn + ne);
      const wanted = [us, cs, lho].map((x) => x === 4294967295);
      if (wanted.some((w) => w)) {
        const values2 = zip64Values(extra, wanted.filter((w) => w).length);
        if (wanted[0]) us = values2.shift();
        if (wanted[1]) cs = values2.shift();
        if (wanted[2]) lho = values2.shift();
      }
      if (diskNo) reject14("a zip entry on another disk");
      if (flags & 65) reject14("a zip entry is encrypted");
      let name = "";
      try {
        name = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(rawName);
      } catch {
        reject14("a zip entry's name is not UTF-8");
      }
      entries.push({ name, flags, method, crc, cs, us, lho, ds: -1 });
      p += 46 + nn + ne + nc;
    }
    if (p !== cd.length) reject14("a zip file's central directory has more bytes than its entries");
    return { entries, cdOffset };
  }
  function productEntries(d) {
    const names = /* @__PURE__ */ new Set();
    let root;
    const objects = /* @__PURE__ */ new Map();
    const ignored2 = [];
    const dirs = [];
    for (const e of d.entries) {
      if (names.has(e.name)) reject14(`a zip file has two entries named ${JSON.stringify(e.name)}`);
      names.add(e.name);
      const i = e.name.indexOf("/");
      const head = i < 0 ? e.name : e.name.slice(0, i);
      if (i < 0 || !head.endsWith(".SAFE")) reject14(`a zip entry ${JSON.stringify(e.name.slice(0, 200))} is not under a .SAFE directory`);
      const key2 = e.name.slice(i + 1);
      if (root === void 0) root = head;
      else if (head !== root) reject14("a zip file has entries under two root directories");
      if (key2 === "" || key2.endsWith("/")) {
        if (e.us) ignored2.push(key2);
        if (key2) dirs.push(key2);
        continue;
      }
      if (key2.includes("\\") || key2.split("/").some((s) => s === "" || s === "." || s === "..")) {
        reject14(`a zip entry's name ${JSON.stringify(e.name.slice(0, 200))} has an empty, . or .. segment, or a backslash`);
      }
      objects.set(key2, e);
    }
    if (root === void 0) reject14("an empty zip file");
    return [root, objects, ignored2, dirs];
  }
  async function locate(read, d, objects) {
    const todo = [...objects.values()].filter((e) => e.us);
    for (const e of todo) if (e.lho + 30 > d.cdOffset) reject14("a zip entry's local header is beyond the entries");
    const heads = await Promise.all(todo.map((e) => read(e.lho, 30)));
    for (const [i, e] of todo.entries()) {
      const head = heads[i];
      if (!sig(head, 0, LOCAL)) reject14("a zip entry has no local header where the central directory says");
      const hv = view4(head);
      e.ds = e.lho + 30 + hv.getUint16(26, true) + hv.getUint16(28, true);
      if (e.ds + e.cs > d.cdOffset) reject14("a zip entry's data reaches beyond the entries");
    }
    let end = 0;
    for (const e of [...todo].sort((x, y) => x.lho - y.lho)) {
      if (e.lho < end) reject14("two zip entries' local headers and data overlap");
      end = e.ds + e.cs;
    }
  }
  async function inflate2(data, e) {
    const out2 = new Uint8Array(e.us);
    let n = 0;
    try {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const reader = stream.getReader();
      for (; ; ) {
        const { done, value: value2 } = await reader.read();
        if (done) break;
        if (n + value2.length > e.us) {
          await reader.cancel();
          reject14("a zip entry's deflate stream does not end at its compressed size with its size");
        }
        out2.set(value2, n);
        n += value2.length;
      }
    } catch (err) {
      if (err instanceof SafeError) throw err;
      reject14(`a zip entry's deflate stream is invalid: ${err.message}`);
    }
    if (n !== e.us) reject14("a zip entry's deflate stream does not end at its compressed size with its size");
    if (crc32(out2) !== e.crc) reject14("a zip entry's CRC-32 does not match its bytes");
    return out2;
  }

  // src/virtualize/safe/virtualize.ts
  var PROFILE = "safe";
  var WORKERS = 16;
  var MAX_ENTRIES = 1e5;
  var reject15 = (m) => {
    throw new SafeError(m);
  };
  async function pool(items, n, f) {
    const out2 = new Array(items.length);
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out2[i] = await f(items[i]);
      }
    }));
    return out2;
  }
  function cached(f) {
    const memo = /* @__PURE__ */ new Map();
    const get3 = (key2) => {
      let p = memo.get(key2);
      if (p === void 0) memo.set(key2, p = f(key2));
      return p;
    };
    return Object.assign(get3, { peek: (key2) => memo.get(key2) });
  }
  function storeObjects(store) {
    const reads = [0, 0];
    if (store.readRange === void 0) throw new Error("the store has no range reads");
    return {
      form: "store",
      sizes: new Map(store.objects),
      ignored: [...store.ignored ?? []],
      directories: [...store.folders ?? []],
      listingRequests: store.requests,
      reads,
      whole: cached(async (key2) => {
        reads[0]++;
        reads[1] += store.objects.get(key2);
        return store.read(key2);
      }),
      raw: (key2) => [async (o, n) => {
        reads[0]++;
        reads[1] += n;
        return store.readRange(key2, o, n);
      }, 0],
      where: (key2) => [key2, 0],
      copied: async () => void 0
    };
  }
  async function zipObjects(read, size2, exact) {
    const d = await centralDirectory(read, size2);
    if (d.entries.length > MAX_ENTRIES) throw new Error(`the zip file has more than ${MAX_ENTRIES} entries`);
    const [, entries, ignored2, directories] = productEntries(d);
    const deflated = /* @__PURE__ */ new Set();
    let inflatedTotal = 0;
    for (const [k, e2] of entries) {
      if (!e2.us) continue;
      if (e2.method === 0) {
        if (e2.cs !== e2.us) reject15(`the stored zip entry ${k.slice(0, 200)} has a compressed size other than its size`);
      } else if (e2.method === 8) {
        if (!isXml(k)) reject15(`the zip entry ${k.slice(0, 200)} is compressed: only XML documents may be`);
        if (e2.us > MAX_DEFLATED) reject15(`the deflated XML document ${k.slice(0, 200)} is larger than 2^26 bytes`);
        deflated.add(k);
        inflatedTotal += e2.us;
      } else {
        reject15(`the zip entry ${k.slice(0, 200)} has the compression method ${e2.method}`);
      }
    }
    if (inflatedTotal > MAX_INFLATED) reject15("the deflated XML documents are larger than 2^27 bytes together");
    await locate(read, d, entries);
    const e = (k) => entries.get(k);
    const inflated = async (k) => inflate2(await read(e(k).ds, e(k).cs), e(k));
    const whole = cached(async (key2) => deflated.has(key2) ? inflated(key2) : read(e(key2).ds, e(key2).us));
    return {
      form: "zip",
      sizes: new Map([...entries].map(([k, x]) => [k, x.us])),
      ignored: ignored2,
      directories,
      listingRequests: 0,
      reads: [0, 0],
      whole: (key2) => whole(key2),
      raw: (key2) => [exact, e(key2).ds],
      where: (key2) => [0, e(key2).ds],
      copied: async (key2) => deflated.has(key2) ? whole.peek(key2) ?? inflated(key2) : void 0
    };
  }
  var latin1Key = (b) => {
    let s = "";
    for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
    return s;
  };
  function group(attributes = {}) {
    return { zarr_format: 3, node_type: "group", attributes };
  }
  function bytesArray(n, size2) {
    return {
      zarr_format: 3,
      node_type: "array",
      shape: [n],
      data_type: "uint8",
      chunk_grid: { name: "regular", configuration: { chunk_shape: [size2] } },
      chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
      fill_value: 0,
      codecs: [{ name: "bytes" }],
      dimension_names: ["byte"],
      attributes: {}
    };
  }
  async function virtualizeProduct(url2, objects) {
    const [markers, emptyDirs] = folders(objects.sizes.keys(), objects.directories);
    const sizes = new Map([...objects.sizes].filter(([k]) => !markers.has(k)));
    const product3 = await readProduct(sizes, (k) => objects.whole(k));
    const streams = await pool(product3.images, WORKERS, async (image) => {
      const [raw, base] = objects.raw(image.key);
      return (await readBand(raw, base, sizes.get(image.key)))[0];
    });
    const bands = [];
    const names = /* @__PURE__ */ new Set();
    for (const [i, image] of product3.images.entries()) {
      const cs = streams[i];
      const r = resolution(product3.geocoding, cs.width, cs.height, image.key);
      const name = bandName(image.basename, r);
      if (names.has(`${r}/${name}`)) reject15(`two band files at ${r} m have the band name ${name}`);
      names.add(`${r}/${name}`);
      bands.push({ image, cs, resolution: r, name });
    }
    const bandKeys = new Set(bands.map((b) => b.image.key));
    const keys = [...sizes.keys()].sort(compareKeys);
    const empty = keys.filter((k) => sizes.get(k) === 0);
    const xmlKeys = keys.filter((k) => sizes.get(k) && !bandKeys.has(k) && isXml(k));
    const others = keys.filter((k) => sizes.get(k) && !bandKeys.has(k) && !isXml(k));
    const ignored2 = [...objects.ignored].sort(compareKeys);
    const texts = await chooseTexts(
      new Map(xmlKeys.map((k) => [k, sizes.get(k)])),
      (batch) => pool(batch, WORKERS, async (k) => textJson(await objects.whole(k))),
      [["empty", empty], ["empty_dirs", emptyDirs], ["ignored", ignored2]],
      compareKeys
    );
    const inText = new Set(texts.keys());
    const arrays = xmlKeys.filter((k) => !inText.has(k));
    const docs = /* @__PURE__ */ new Map();
    const refs = /* @__PURE__ */ new Map();
    const bytesEntries = /* @__PURE__ */ new Map();
    const resolutions = [...new Set(bands.map((b) => b.resolution))].sort((a, b) => a - b);
    const [cmos, geo] = rootGeozarr(product3, resolutions);
    docs.set("zarr.json", group({
      zarr_conventions: [convention(PROFILE), ...cmos],
      [CONVENTION_KEY]: { ...rootProperty(PROFILE, url2), [PROFILE]: rootMetadata(product3) },
      ...geo
    }));
    for (const r of resolutions) docs.set(`r${r}m/zarr.json`, group(groupAttributes(product3.geocoding, r)));
    let chunks = 0, edge = 0, tileParts = 0;
    for (const b of bands) {
      const cs = b.cs, path2 = `r${b.resolution}m/${b.name}`, three = cs.components === 3;
      const s = bandMetadata(product3, b.image.text, b.name, base64(cs.siz));
      docs.set(`${path2}/zarr.json`, {
        zarr_format: 3,
        node_type: "array",
        shape: three ? [3, cs.height, cs.width] : [cs.height, cs.width],
        data_type: cs.precision <= 8 ? "uint8" : "uint16",
        chunk_grid: { name: "regular", configuration: { chunk_shape: three ? [3, cs.tileH, cs.tileW] : [cs.tileH, cs.tileW] } },
        chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
        fill_value: 0,
        codecs: three ? [{ name: "transpose", configuration: { order: [1, 2, 0] } }, { name: "imagecodecs_jpeg2k" }] : [{ name: "imagecodecs_jpeg2k" }],
        dimension_names: three ? ["c", "y", "x"] : ["y", "x"],
        attributes: declare({}, PROFILE, void 0, s)
      });
      const [src, base] = objects.where(b.image.key);
      const rest = { shared: cs.rest };
      const [nx] = grid2(cs);
      let total = 0;
      for (let t = 0; t < cs.tiles.length; t++) total += tailLength(cs, t);
      if (total > cs.n) {
        reject15(`the empty tiles of ${b.image.key.slice(0, 200)}'s chunks would take ${total} bytes, more than the band file's ${cs.n}`);
      }
      for (let t = 0; t < cs.tiles.length; t++) {
        const [head, sot, [o, n], tail, padded] = chunkParts(cs, t);
        refs.set(
          `${path2}/c/${three ? "0/" : ""}${Math.floor(t / nx)}/${t % nx}`,
          [head, rest, sot, [src, base + o, n], padded ? { shared: tail } : tail]
        );
        chunks++;
        if (padded) edge++;
      }
      tileParts += cs.tiles.length;
    }
    const referenced = (path2, key2, start, n) => {
      const [src, base] = objects.where(key2);
      const [size2, cut] = blobChunks(base + start, n);
      docs.set(`${path2}/zarr.json`, bytesArray(n, size2));
      for (const [i, parts] of cut) {
        refs.set(`${path2}/c/${i}`, parts.map((p) => p instanceof Uint8Array ? p : [src, p[0], p[1]]));
      }
    };
    const S = {};
    if (inText.size) S.xml = Object.fromEntries([...inText].sort(compareKeys).map((k) => [k, texts.get(k)]));
    if (arrays.length) S.xml_arrays = arrays;
    if (empty.length) S.empty = empty;
    if (emptyDirs.length) S.empty_dirs = emptyDirs;
    if (ignored2.length) S.ignored = ignored2;
    docs.set(`${SOURCE_NODE}/zarr.json`, group(declare({}, PROFILE, void 0, S)));
    if (arrays.length) {
      docs.set(`${SOURCE_NODE}/xml/zarr.json`, group());
      for (const [i, k] of arrays.entries()) {
        const data2 = await objects.copied(k);
        if (data2 === void 0) {
          referenced(`${SOURCE_NODE}/xml/${i}`, k, 0, sizes.get(k));
          continue;
        }
        const [size2, cut] = blobChunks(0, data2.length);
        docs.set(`${SOURCE_NODE}/xml/${i}/zarr.json`, bytesArray(data2.length, size2));
        for (const j of cut.keys()) {
          const chunk = new Uint8Array(size2);
          chunk.set(data2.subarray(Number(j) * size2, (Number(j) + 1) * size2));
          bytesEntries.set(`${SOURCE_NODE}/xml/${i}/c/${j}`, chunk);
        }
      }
    }
    docs.set(`${SOURCE_NODE}/jp2/zarr.json`, group());
    for (const r of resolutions) docs.set(`${SOURCE_NODE}/jp2/r${r}m/zarr.json`, group());
    for (const b of bands) referenced(`${SOURCE_NODE}/jp2/r${b.resolution}m/${b.name}`, b.image.key, 0, b.cs.c0);
    for (const k of others) {
      const [src, base] = objects.where(k);
      refs.set(objectKey(k), [[src, base, sizes.get(k)]]);
    }
    const utf89 = new TextEncoder();
    for (const key2 of [...docs.keys(), ...refs.keys(), ...bytesEntries.keys()]) {
      if (utf89.encode(key2).length > 65535) reject15("an output key is longer than 65535 bytes");
      if (key2.startsWith("__vz__/")) reject15(`output key ${JSON.stringify(key2.slice(0, 200))} is in the reserved __vz__/ space`);
    }
    const refKeys = [...refs.keys()].sort(compareKeys);
    let urls;
    const index2 = /* @__PURE__ */ new Map();
    if (objects.form === "zip") {
      urls = [url2];
      index2.set(0, 0);
    } else {
      const objs = [...new Set(refKeys.flatMap((k) => refs.get(k).filter((r) => Array.isArray(r)).map((r) => r[0])))].sort(compareKeys);
      urls = objs.map((o) => objectUrl(url2, o));
      objs.forEach((o, i) => index2.set(o, i));
    }
    const data = /* @__PURE__ */ new Map();
    const entries = [];
    for (const k of refKeys) {
      const ranges = refs.get(k).map((r) => {
        if (r instanceof Uint8Array) return r;
        if (Array.isArray(r)) return [index2.get(r[0]), r[1], r[2]];
        const key2 = latin1Key(r.shared);
        let d = data.get(key2);
        if (d === void 0) data.set(key2, d = [urls.length + data.size, r.shared]);
        return [d[0], 0, r.shared.length];
      });
      if (payloadSize(ranges) > MAX_PAYLOAD2) reject15(`the reference payload of ${k.slice(0, 200)} is over ${MAX_PAYLOAD2} bytes`);
      entries.push({ key: k, ranges: ranges.map(toRange) });
    }
    for (const [k, v] of bytesEntries) entries.push({ key: k, bytes: v, compress: true });
    for (const [k, v] of docs) {
      entries.push({ key: k, bytes: utf89.encode(stringifyJson(v)), ...k.startsWith(SOURCE_NODE + "/") ? { compress: true } : {} });
    }
    const summary = {
      level: product3.level,
      form: objects.form,
      groups: resolutions.length,
      bands: bands.length,
      chunks,
      edgeChunks: edge,
      dataSources: data.size,
      objects: objects.sizes.size,
      folderMarkers: markers.size,
      emptyDirs: emptyDirs.length,
      xmlText: inText.size,
      xmlArrays: arrays.length,
      otherObjects: others.length,
      emptyObjects: empty.length,
      tileParts,
      listingRequests: objects.listingRequests,
      readRequests: objects.reads[0],
      readBytes: objects.reads[1]
    };
    const sized = new Map(objects.form === "zip" ? [] : [...objects.sizes].map(([k, n]) => [objectUrl(url2, k), n]));
    const source = (u2) => sized.has(u2) ? { url: u2, size: BigInt(sized.get(u2)) } : { url: u2 };
    return { sources: [...urls.map(source), ...[...data.values()].map(([, d]) => ({ data: d }))], entries, summary };
  }
  function virtualizeSafeStore(store) {
    return virtualizeProduct(store.url, storeObjects(store));
  }
  async function virtualizeSafeZip(url2, read, size2, exact = read) {
    const reads = [0, 0];
    const counted = (o, n) => {
      reads[0]++;
      reads[1] += n;
      return exact(o, n);
    };
    const objects = await zipObjects(read, size2, counted);
    objects.reads = reads;
    return virtualizeProduct(url2, objects);
  }
  var isZip = (head) => head[0] === 80 && head[1] === 75 && head[2] === 3 && head[3] === 4;

  // src/virtualize/index.ts
  async function addChecksums(desc, read) {
    for (const e of desc.entries) {
      if (!("ranges" in e)) continue;
      for (const r of e.ranges) {
        if ("data" in r || r.crc32c !== void 0) continue;
        const url2 = desc.sources[r.source].url;
        if (url2 !== void 0) r.crc32c = crc32c(await read(url2, Number(r.offset), Number(r.length)));
      }
    }
  }
  var NOT_SUPPORTED = "not a TIFF, NDPI, ND2, DICOM, NIfTI, IMS, CZI or SAFE zip file";
  function isTiffMagic(head) {
    const magic = Array.from(head.subarray(0, 4), (b) => b.toString(16).padStart(2, "0")).join("");
    return ["49492a00", "4d4d002a", "49492b00", "4d4d002b"].includes(magic);
  }
  var HDF5 = [137, 72, 68, 70, 13, 10, 26, 10];
  async function virtualizeSource(url2, source, pins = {}) {
    const exact = (o, n) => source.read(o, n);
    const read = blockReader(exact, source.size);
    const etag = pins.etag ?? (source.etag ? () => source.etag() : void 0);
    return virtualizeWith(url2, { read, size: source.size, exact, source }, { ...pins, ...etag ? { etag } : {} });
  }
  async function virtualizeWith(url2, input, pins) {
    const desc = await virtualizeFile(url2, input);
    const etag = pins.etag?.();
    desc.sources[0] = { ...desc.sources[0], size: BigInt(input.size), ...etag !== void 0 ? { etag } : {} };
    if (pins.checksums) await addChecksums(desc, (_u, o, n) => (input.exact ?? input.read)(o, n));
    return desc;
  }
  function irFormat(head) {
    if (isTiffMagic(head)) return "tiff";
    if (head.length >= 4 && head[0] === 218 && head[1] === 206 && head[2] === 190 && head[3] === 10) return "nd2";
    if (head.length >= 16 && String.fromCharCode(...head.subarray(0, 16)) === "ZISRAWFILE\0\0\0\0\0\0") return "czi";
    return void 0;
  }
  async function virtualizeFile(url2, { read, size: fileSize, exact, source }) {
    const head = await read(0, Math.min(552, fileSize));
    if (isDicom(head)) return { format: "dicom", ...await virtualizeDicom(url2, read, fileSize) };
    if (isTiffMagic(head)) {
      const first = await detectNdpi(read, fileSize);
      if (first !== void 0) return { format: "ndpi", ...await virtualizeNdpi(url2, read, fileSize, first) };
    }
    const ir2 = irFormat(head);
    if (ir2 === "tiff" || ir2 === "nd2") return virtualizeIr(ir2, url2, source);
    if (HDF5.every((b, i) => head[i] === b)) return { format: "ims", ...await virtualizeIms(url2, read, fileSize) };
    if (detectNifti(head) !== void 0) return { format: "nifti", ...await virtualizeNifti(url2, read, fileSize) };
    if (ir2 === "czi") return virtualizeIr(ir2, url2, source);
    if (isZip(head)) return { format: "safe", ...await virtualizeSafeZip(url2, read, fileSize, exact ?? read) };
    throw new ImageError(NOT_SUPPORTED);
  }
  function isStoreUrl(url2) {
    return url2.split(/[?#]/, 1)[0].endsWith("/");
  }
  async function virtualizeStore(store, pins = {}) {
    const desc = await virtualizeStoreProfile(store);
    if (pins.checksums) {
      const keys = new Map([...store.objects.keys()].map((k) => [objectUrl(store.url, k), k]));
      await addChecksums(desc, async (u2, o, n) => {
        const key2 = keys.get(u2);
        return store.readRange ? store.readRange(key2, o, n) : (await store.read(key2)).subarray(o, o + n);
      });
    }
    return desc;
  }
  async function virtualizeStoreProfile(store) {
    try {
      const chosen = chooseProfile(store);
      if (chosen === "safe") return { format: "safe", ...await virtualizeSafeStore(store) };
      let format = chosen;
      if (format === "zarr2" && await declares04(store)) format = "ome-zarr";
      const result = format === "n5" ? await virtualizeN5(store) : format === "ome-zarr" ? await virtualizeOmeZarr(store) : await virtualizeZarr2(store);
      return { format, ...storeArchive(store.url, result), summary: result.summary };
    } finally {
      closeStore(store);
    }
  }

  // src/server.ts
  var ARCHIVE_KEY = "__vz__/archive.vzip";
  var WORKER_HEADER = "X-Vzip-Worker";
  function decodeId(id) {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`invalid id ${id}`);
    const s = atob(id.replaceAll("-", "+").replaceAll("_", "/"));
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(s, (c) => c.charCodeAt(0))
    );
  }
  function response(status, body, headers = {}) {
    return new Response(body, {
      status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": `Content-Range, Content-Length, ${WORKER_HEADER}`,
        [WORKER_HEADER]: "1",
        ...typeof body === "string" ? { "Content-Type": "text/plain; charset=utf-8" } : {},
        ...headers
      }
    });
  }
  function parseRange(header, size2) {
    const m = header?.match(/^bytes=(\d*)-(\d*)$/);
    if (!m || m[1] === "" && m[2] === "") return void 0;
    if (m[1] === "") {
      const n = Number(m[2]);
      if (n === 0) return "unsatisfiable";
      return { start: Math.max(0, size2 - n), end: size2 };
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? size2 : Math.min(size2, Number(m[2]) + 1);
    if (start >= size2 || m[2] !== "" && Number(m[2]) < start) return "unsatisfiable";
    return { start, end };
  }
  function makeHandler(options) {
    const {
      prefix: prefix2,
      fetchStore = (u2, i) => fetch(u2, i),
      fetchRange = (url2, start, end, pins, options2) => readHttpRange(url2, start, end, pins, void 0, options2),
      policy = {},
      openSource = options.openFile ? async (url2) => {
        const file = await options.openFile(url2);
        return readerSource(file.read, file.size, file.etag ? { etag: file.etag } : {});
      } : (url2) => openHttpSource(url2, { policy }),
      fetchArchive = async (url2) => {
        const r = await fetch(url2);
        if (!r.ok) throw new HttpResolutionError(`${url2}: HTTP ${r.status}`);
        return new Uint8Array(await r.arrayBuffer());
      }
    } = options;
    const opened = /* @__PURE__ */ new Map();
    function open(kind, url2) {
      const name = `${kind}/${url2}`;
      let p = opened.get(name);
      if (p === void 0) {
        p = (async () => {
          const base = url2.split(/[?#]/, 1)[0];
          const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
          const stem = decodeURIComponent(trimmed.slice(trimmed.lastIndexOf("/") + 1)) || "archive";
          if (kind === "archive") {
            return { archive: await Archive.open(await fetchArchive(url2), url2, fetchRange, policy), filename: stem };
          }
          let virtual;
          if (kind === "image" && isStoreUrl(url2)) {
            virtual = await virtualizeStore(await openHttpStore(url2, { fetch: fetchStore }));
          } else {
            const source = await openSource(url2);
            if (kind === "tiff") {
              virtual = await virtualizeIr("tiff", url2, source);
              const etag = source.etag?.();
              virtual.sources[0] = { ...virtual.sources[0], size: BigInt(source.size), ...etag !== void 0 ? { etag } : {} };
            } else {
              virtual = await virtualizeSource(url2, source);
            }
          }
          const bytes = await writeVzip(virtual);
          return {
            archive: await Archive.open(bytes, url2, fetchRange, { ...policy, unverifiablePins: true }),
            filename: `${stem.replace(/\.(ome\.tiff?|tiff?|nd2|n5|zarr)$/i, "")}.vzip`
          };
        })();
        opened.set(name, p);
        p.catch(() => opened.delete(name));
      }
      return p;
    }
    return async function handle2(request) {
      if (!request.url.startsWith(prefix2)) return response(404, "not found");
      if (request.method !== "GET" && request.method !== "HEAD") {
        return response(405, "method not allowed", { Allow: "GET, HEAD" });
      }
      const path2 = new URL(request.url).pathname.slice(new URL(prefix2).pathname.length);
      const m = path2.match(/^(image|tiff|archive)\/([^/]+)\/(.*)$/);
      if (m === null) return response(404, "not found");
      const [, kind, id] = m;
      let key2;
      let url2;
      try {
        key2 = m[3].split("/").map(decodeURIComponent).join("/");
        url2 = new URL(decodeId(id)).href;
      } catch {
        return response(400, "invalid URL");
      }
      const head = request.method === "HEAD";
      try {
        const { archive, filename } = await open(kind, url2);
        if (key2 === ARCHIVE_KEY) {
          return response(200, head ? null : archive.bytes, {
            "Content-Type": "application/zip",
            "Content-Length": String(archive.bytes.length),
            "Content-Disposition": `attachment; filename="${filename.replaceAll('"', "")}"`
          });
        }
        const entry2 = key2 === "" || key2.endsWith("/") ? void 0 : archive.lookup(key2);
        if (entry2 === void 0) return response(404, `no key ${key2}`);
        const size2 = archive.size(entry2);
        const type = key2.endsWith(".json") ? "application/json" : key2.endsWith(".xml") ? "application/xml" : "application/octet-stream";
        const range = parseRange(request.headers.get("Range"), size2);
        if (range === "unsatisfiable") {
          return response(416, "range not satisfiable", { "Content-Range": `bytes */${size2}` });
        }
        const headers = { "Content-Type": type, "Accept-Ranges": "bytes" };
        if (range === void 0) {
          const body2 = head ? null : await archive.read(key2);
          return response(200, body2, { ...headers, "Content-Length": String(size2) });
        }
        const body = head ? null : await archive.read(key2, range.start, range.end);
        return response(206, body, {
          ...headers,
          "Content-Length": String(range.end - range.start),
          "Content-Range": `bytes ${range.start}-${range.end - 1}/${size2}`
        });
      } catch (e) {
        const message = e.message;
        if (e instanceof VzipError) {
          const status = e.errorClass === "request" ? 416 : e.errorClass === "resolution" ? 502 : 500;
          return response(status, message);
        }
        if (e instanceof TiffError) return response(422, `TIFF: ${message}`);
        if (e instanceof DicomError) return response(422, `DICOM: ${message}`);
        if (e instanceof NiftiError) return response(422, `NIfTI: ${message}`);
        if (e instanceof ImsError) return response(422, `IMS: ${message}`);
        if (e instanceof N5Error) return response(422, `N5: ${message}`);
        if (e instanceof Zarr2Error) return response(422, `Zarr v2: ${message}`);
        if (e instanceof OmeZarrError) return response(422, `OME-Zarr: ${message}`);
        if (e instanceof SafeError) return response(422, `SAFE: ${message}`);
        if (e instanceof StoreError) return response(422, `store: ${message}`);
        if (e instanceof ImageError) return response(422, message);
        if (e instanceof StoreLimitError) return response(507, message);
        if (e instanceof StoreReadError) return response(502, message);
        if (e instanceof HttpResolutionError) return response(502, message);
        return response(500, message);
      }
    };
  }

  // src/sw.ts
  var prefix = new URL("vz/", self.registration.scope).href;
  var handle = makeHandler({ prefix });
  self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
  self.addEventListener("message", (event) => {
    if (event.data === "claim") event.waitUntil(self.clients.claim());
  });
  self.addEventListener("fetch", (event) => {
    if (event.request.url.startsWith(prefix)) event.respondWith(handle(event.request));
  });
})();
//# sourceMappingURL=vzip-sw.js.map
