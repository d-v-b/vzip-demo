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
  async function transform(data, stream) {
    const out = new Response(
      new Blob([data]).stream().pipeThrough(stream)
    );
    return new Uint8Array(await out.arrayBuffer());
  }
  function deflateRaw(data) {
    return transform(data, new CompressionStream("deflate-raw"));
  }
  function inflateRaw(data) {
    return transform(data, new DecompressionStream("deflate-raw"));
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
    const { scheme, authority, path, query, fragment } = split(ref);
    if (scheme !== void 0 && !SCHEME.test(scheme)) return false;
    if (authority !== void 0 && !AUTHORITY.test(authority)) return false;
    if (!PATH.test(path)) return false;
    if (authority !== void 0 && path !== "" && !path.startsWith("/")) {
      return false;
    }
    if (scheme === void 0 && authority === void 0) {
      if (path.split("/", 1)[0].includes(":")) return false;
    }
    for (const part of [query, fragment]) {
      if (part !== void 0 && !QUERY.test(part)) return false;
    }
    return true;
  }
  function removeDotSegments(input) {
    const out = [];
    let path = input;
    while (path !== "") {
      if (path.startsWith("../")) path = path.slice(3);
      else if (path.startsWith("./")) path = path.slice(2);
      else if (path.startsWith("/./")) path = path.slice(2);
      else if (path === "/.") path = "/";
      else if (path.startsWith("/../")) {
        path = path.slice(3);
        out.pop();
      } else if (path === "/..") {
        path = "/";
        out.pop();
      } else if (path === "." || path === "..") path = "";
      else {
        const i = path.indexOf("/", 1);
        const segment = i === -1 ? path : path.slice(0, i);
        path = i === -1 ? "" : path.slice(i);
        out.push(segment);
      }
    }
    return out.join("");
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
    let path;
    if (r.path.startsWith("/")) path = removeDotSegments(r.path);
    else if (b.authority !== void 0 && b.path === "") {
      path = removeDotSegments("/" + r.path);
    } else {
      path = removeDotSegments(
        b.path.slice(0, b.path.lastIndexOf("/") + 1) + r.path
      );
    }
    return compose({
      scheme: b.scheme,
      authority: b.authority,
      path,
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
  async function readHttpRange(url, start, end, pins, signal) {
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
    let response2;
    try {
      response2 = await fetch(url, { headers, signal, redirect: "follow" });
    } catch (e) {
      signal?.throwIfAborted();
      throw new HttpResolutionError(`${url}: ${e.message}`);
    }
    const fail = (message) => {
      throw new HttpResolutionError(`${url}: ${message}`);
    };
    if (response2.redirected) {
      try {
        checkHttpUrl(response2.url);
      } catch (e) {
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
    if (pins.etag !== void 0 && etag !== pins.etag) {
      fail(`ETag ${JSON.stringify(etag)} does not match the pin`);
    }
    if (pins.modifiedNotAfter !== void 0) {
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
      return { data: body.slice(start, end), size: body.length };
    }
    const contentRange = single(response2.headers, "Content-Range");
    if (contentRange === null && response2.type === "cors") {
      if (body.length !== end - start) {
        fail(`206 of ${body.length} bytes for [${start}, ${end})`);
      }
      return { data: body, size: void 0 };
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
    return { data: body, size: total };
  }
  async function openHttpFile(url, signal) {
    const head = await fetch(url, { method: "HEAD", signal });
    const length = head.headers.get("Content-Length");
    if (!head.ok || length === null || !/^\d+$/.test(length)) {
      throw new HttpResolutionError(
        `${url}: cannot determine the size (HEAD ${head.status})`
      );
    }
    return {
      size: Number(length),
      read: async (offset, n) => n === 0 ? new Uint8Array() : (await readHttpRange(url, offset, offset + n, {}, signal)).data
    };
  }

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
    bytes(field, value) {
      this.tag(field, 2);
      this.varint(BigInt(value.length));
      for (const b of value) this.chunks.push(b);
    }
    uint(field, value) {
      this.tag(field, 0);
      this.varint(value);
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
    }
    return w.finish();
  }
  function encodeConcat(parts) {
    const w = new Writer();
    for (const p of parts) w.bytes(1, encodeRange(p));
    return w.finish();
  }
  function encodeSourceTable(sources) {
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
    for (const f of fields(buf)) {
      switch (f.field) {
        case 1:
          source = expect(f, "varint");
          if (source > U32_MAX) throw new MalformedError("source exceeds uint32");
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
      return { data };
    }
    if (source >= BigInt(numSources)) {
      throw new MalformedError(`source ${source} >= ${numSources} sources`);
    }
    if (offset + length > U64_MAX) {
      throw new MalformedError("offset + length exceeds 2^64 - 1");
    }
    return { source: Number(source), offset, length };
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
  function decodeSourceTable(buf) {
    const sources = [];
    for (const f of fields(buf)) {
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
    return sources;
  }

  // src/writer.ts
  var InvalidInputError = class extends Error {
  };
  var SOURCES_KEY = "__vz__/sources";
  var INDEX_KEY = "__vz__/index";
  var RANGE_ID = 31350;
  var CONCAT_ID = 31351;
  var U16_ALL = 65535;
  var U32_ALL = 4294967295;
  var U64_MAX2 = (1n << 64n) - 1n;
  var MAX_PAYLOAD = 65519;
  var STRONG_ETAG2 = /^"[\x21\x23-\x7e]*"$/;
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
      if (s.etag !== void 0 && !STRONG_ETAG2.test(s.etag)) {
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
          total += BigInt(r.data.length);
          continue;
        }
        if (!Number.isInteger(r.source) || r.source < 0 || r.source >= n) {
          reject(`${e.key}: source ${r.source} >= ${n} sources`);
        }
        if (r.offset < 0n || r.length < 0n || r.offset + r.length > U64_MAX2) {
          reject(`${e.key}: range exceeds 2^64 - 1`);
        }
        const size = sourceSize(r.source);
        if (size !== void 0 && r.offset + r.length > size) {
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
      const out = new Uint8Array(this.length);
      let at = 0;
      for (const c of this.chunks) {
        out.set(c, at);
        at += c.length;
      }
      return out;
    }
  };
  function le(fields2) {
    const size = fields2.reduce((n, [, w]) => n + w, 0);
    const out = new Uint8Array(size);
    const view = new DataView(out.buffer);
    let at = 0;
    for (const [v, w] of fields2) {
      if (w === 2) view.setUint16(at, v, true);
      else if (w === 4) view.setUint32(at, v, true);
      else view.setBigUint64(at, BigInt(v), true);
      at += w;
    }
    return out;
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
    const table = encodeSourceTable(desc.sources);
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
    const out = new Out();
    for (const b of built) {
      b.offset = out.length;
      out.push(
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
      out.push(b.name);
      out.push(b.body);
    }
    const cdOffset = out.length;
    for (const b of built) {
      const zip64 = b.offset >= U32_ALL;
      const extra = zip64 ? new Uint8Array([...b.extra, ...le([[1, 2], [8, 2], [b.offset, 8]])]) : b.extra;
      out.push(
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
      out.push(b.name);
      out.push(extra);
    }
    const cdSize = out.length - cdOffset;
    const count = built.length;
    if (count >= U16_ALL || cdSize >= U32_ALL || cdOffset >= U32_ALL) {
      const eocd64 = out.length;
      out.push(
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
      out.push(le([[117853008, 4], [0, 4], [eocd64, 8], [1, 4]]));
    }
    const comment = new Uint8Array(22);
    comment.set(utf82.encode("vzip/0"));
    const view = new DataView(comment.buffer);
    view.setBigUint64(6, BigInt(sources.offset + 30 + sources.name.length), true);
    view.setBigUint64(14, BigInt(sources.body.length), true);
    out.push(
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
    out.push(comment);
    return out.concat();
  }

  // src/archive.ts
  var VzipError = class extends Error {
    errorClass;
    constructor(errorClass, message) {
      super(`vzip ${errorClass} error: ${message}`);
      this.errorClass = errorClass;
    }
  };
  var U16_ALL2 = 65535;
  var U32_ALL2 = 4294967295;
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
    fetchRange;
    constructor(bytes, baseUrl, sources, entries, fetchRange) {
      this.bytes = bytes;
      this.baseUrl = baseUrl;
      this.sources = sources;
      this.entries = entries;
      this.fetchRange = fetchRange;
    }
    /** Opens an archive (spec §8.1); `baseUrl` resolves relative `url` sources. */
    static async open(bytes, baseUrl, fetchRange = (url, start, end, pins) => readHttpRange(url, start, end, pins)) {
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
      if (view.getUint16(eocd + 8, true) === U16_ALL2 || count === BigInt(U16_ALL2) || cdSize === BigInt(U32_ALL2) || cdOffset === BigInt(U32_ALL2)) {
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
        else if (csize === U32_ALL2 || size === U32_ALL2) entry.error = "size field is 0xFFFFFFFF";
        else if (offset === U32_ALL2) {
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
      let sources;
      try {
        sources = decodeSourceTable(
          await inflateRaw(bytes.subarray(sOffset, sOffset + sSize))
        );
      } catch (e) {
        throw new VzipError("archive", `source table: ${e.message}`);
      }
      return new _Archive(bytes, baseUrl, sources, entries, fetchRange);
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
          body = await inflateRaw(stored);
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
      const scheme = getScheme(url);
      if (scheme !== "http" && scheme !== "https") fail(`unsupported scheme in ${url}`);
      try {
        const { data, size } = await this.fetchRange(
          url,
          safe(start, "offset"),
          safe(end, "end"),
          s
        );
        if (s.size !== void 0 && BigInt(size ?? -1) !== s.size) {
          fail(`size pin ${s.size} != ${size ?? "unknown"}`);
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
      let at = 0;
      for (const r of this.ranges(entry)) {
        const n = Number(rangeSize(r));
        const a = Math.max(start, at);
        const b = Math.min(end, at + n);
        if (a < b) {
          const lo = BigInt(a - at);
          const hi = BigInt(b - at);
          parts.push(
            "data" in r ? Promise.resolve(r.data.subarray(a - at, b - at)) : this.source({ source: r.source, offset: r.offset + lo, length: hi - lo })
          );
        }
        at += n;
      }
      const chunks = await Promise.all(parts);
      const out = new Uint8Array(end - start);
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      return out;
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

  // src/tiff.ts
  var TiffError = class extends Error {
  };
  var Tag = {
    NewSubfileType: 254,
    ImageWidth: 256,
    ImageLength: 257,
    BitsPerSample: 258,
    Compression: 259,
    ImageDescription: 270,
    SamplesPerPixel: 277,
    PlanarConfiguration: 284,
    Predictor: 317,
    TileWidth: 322,
    TileLength: 323,
    TileOffsets: 324,
    TileByteCounts: 325,
    SubIFDs: 330,
    SampleFormat: 339
  };
  var WANTED = new Set(Object.values(Tag));
  var TYPE_SIZE = {
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
    return async (offset, length) => {
      if (offset < 0 || offset + length > fileSize) {
        throw new TiffError(`read of [${offset}, ${offset + length}) outside the ${fileSize}-byte file`);
      }
      const out = new Uint8Array(length);
      const first = Math.floor(offset / blockSize);
      const last = Math.floor((offset + Math.max(length, 1) - 1) / blockSize);
      const parts = await Promise.all(
        Array.from({ length: last - first + 1 }, (_, k) => block(first + k))
      );
      for (const [k, data] of parts.entries()) {
        const start = (first + k) * blockSize;
        const a = Math.max(offset, start);
        const b = Math.min(offset + length, start + data.length);
        if (a < b) out.set(data.subarray(a - start, b - start), a - offset);
      }
      return out;
    };
  }
  function u64(view, at, le2) {
    const v = view.getBigUint64(at, le2);
    if (v > BigInt(Number.MAX_SAFE_INTEGER)) throw new TiffError("offset too large");
    return Number(v);
  }
  function values(bytes, type, count, le2) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (type === 2) {
      const end = bytes.indexOf(0);
      return new TextDecoder().decode(end < 0 ? bytes : bytes.subarray(0, end));
    }
    const out = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 1:
        case 7:
          out.push(view.getUint8(i));
          break;
        case 6:
          out.push(view.getInt8(i));
          break;
        case 3:
          out.push(view.getUint16(2 * i, le2));
          break;
        case 8:
          out.push(view.getInt16(2 * i, le2));
          break;
        case 4:
        case 13:
          out.push(view.getUint32(4 * i, le2));
          break;
        case 9:
          out.push(view.getInt32(4 * i, le2));
          break;
        case 16:
        case 18:
          out.push(u64(view, 8 * i, le2));
          break;
        case 17:
          out.push(Number(view.getBigInt64(8 * i, le2)));
          break;
        case 11:
          out.push(view.getFloat32(4 * i, le2));
          break;
        case 12:
          out.push(view.getFloat64(8 * i, le2));
          break;
        case 5:
          out.push(view.getUint32(8 * i, le2) / view.getUint32(8 * i + 4, le2));
          break;
        case 10:
          out.push(view.getInt32(8 * i, le2) / view.getInt32(8 * i + 4, le2));
          break;
        default:
          throw new TiffError(`unknown field type ${type}`);
      }
    }
    return out;
  }
  async function readTiff(read, fileSize) {
    const header = await read(0, Math.min(16, fileSize));
    const order = String.fromCharCode(header[0], header[1]);
    if (order !== "II" && order !== "MM") throw new TiffError("not a TIFF file");
    const le2 = order === "II";
    const hview = new DataView(header.buffer, header.byteOffset, header.byteLength);
    const magic = hview.getUint16(2, le2);
    let bigTiff;
    let first;
    if (magic === 42) {
      bigTiff = false;
      first = hview.getUint32(4, le2);
    } else if (magic === 43) {
      if (header.length < 16 || hview.getUint16(4, le2) !== 8) {
        throw new TiffError("invalid BigTIFF header");
      }
      bigTiff = true;
      first = u64(hview, 8, le2);
    } else {
      throw new TiffError("not a TIFF file");
    }
    const countSize = bigTiff ? 8 : 2;
    const entrySize = bigTiff ? 20 : 12;
    const fieldSize = bigTiff ? 8 : 4;
    const seen = /* @__PURE__ */ new Set();
    async function readIfd(offset) {
      if (seen.has(offset)) throw new TiffError(`IFD cycle at ${offset}`);
      seen.add(offset);
      const cbytes = await read(offset, countSize);
      const cview = new DataView(cbytes.buffer, cbytes.byteOffset, cbytes.byteLength);
      const count = bigTiff ? u64(cview, 0, le2) : cview.getUint16(0, le2);
      if (count > 1 << 16) throw new TiffError(`IFD with ${count} entries`);
      const body = await read(offset + countSize, count * entrySize + fieldSize);
      const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
      const tags = /* @__PURE__ */ new Map();
      const pending = [];
      for (let i = 0; i < count; i++) {
        const at = i * entrySize;
        const tag = view.getUint16(at, le2);
        if (!WANTED.has(tag)) continue;
        const type = view.getUint16(at + 2, le2);
        const n = bigTiff ? u64(view, at + 4, le2) : view.getUint32(at + 4, le2);
        const size = TYPE_SIZE[type];
        if (size === void 0) throw new TiffError(`tag ${tag} has unknown type ${type}`);
        const valueAt = at + 4 + (bigTiff ? 8 : 4);
        if (n * size <= fieldSize) {
          tags.set(tag, values(body.subarray(valueAt, valueAt + n * size), type, n, le2));
        } else {
          const where = bigTiff ? u64(view, valueAt, le2) : view.getUint32(valueAt, le2);
          pending.push(
            read(where, n * size).then((b) => {
              tags.set(tag, values(b, type, n, le2));
            })
          );
        }
      }
      await Promise.all(pending);
      const nextAt = count * entrySize;
      const next = bigTiff ? u64(view, nextAt, le2) : view.getUint32(nextAt, le2);
      return { ifd: { offset, tags, subIfds: [] }, next };
    }
    const ifds = [];
    for (let offset = first; offset !== 0; ) {
      if (ifds.length >= 1e5) throw new TiffError("too many IFDs");
      const { ifd, next } = await readIfd(offset);
      ifds.push(ifd);
      offset = next;
    }
    await Promise.all(
      ifds.map(async (ifd) => {
        const subs = ifd.tags.get(Tag.SubIFDs);
        if (Array.isArray(subs)) {
          ifd.subIfds = await Promise.all(subs.map(async (o) => (await readIfd(o)).ifd));
        }
      })
    );
    return { littleEndian: le2, bigTiff, ifds };
  }
  function num(ifd, tag, fallback) {
    const v = ifd.tags.get(tag);
    if (Array.isArray(v) && v.length > 0) return v[0];
    if (fallback !== void 0) return fallback;
    throw new TiffError(`IFD at ${ifd.offset} has no tag ${tag}`);
  }
  function nums(ifd, tag) {
    const v = ifd.tags.get(tag);
    if (!Array.isArray(v)) throw new TiffError(`IFD at ${ifd.offset} has no tag ${tag}`);
    return v;
  }

  // src/virtualize.ts
  var JPEG2000 = /* @__PURE__ */ new Set([33003, 33004, 33005, 34712]);
  function decodeXml(s) {
    return s.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(amp|lt|gt|quot|apos));/g, (_, hex, dec, named) => hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[named]);
  }
  function attributes(tag) {
    const out = {};
    for (const m of tag.matchAll(/([\w:]+)\s*=\s*"([^"]*)"/g)) out[m[1]] = decodeXml(m[2]);
    return out;
  }
  function parseOmePixels(xml) {
    const image = xml.match(/<(?:\w+:)?Image\b[^>]*>/);
    const start = xml.search(/<(?:\w+:)?Pixels\b/);
    if (start < 0) return void 0;
    const end = xml.indexOf("Pixels>", start);
    const body = xml.slice(start, end < 0 ? void 0 : end);
    const tag = body.match(/^<(?:\w+:)?Pixels\b[^>]*>/)[0];
    const tiffData = [...body.matchAll(/<(?:\w+:)?TiffData\b[^>]*?(\/>|>[\s\S]*?<\/(?:\w+:)?TiffData>)/g)].map(
      (m) => {
        const attrs = attributes(m[0].match(/^<[^>]*>/)[0]);
        const uuid = m[0].match(/<(?:\w+:)?UUID\b[^>]*>/);
        if (uuid && attributes(uuid[0]).FileName !== void 0) attrs.FileName = attributes(uuid[0]).FileName;
        return attrs;
      }
    );
    return { attrs: attributes(tag), tiffData, name: image ? attributes(image[0]).Name : void 0 };
  }
  var UNITS = {
    "\xB5m": "micrometer",
    "um": "micrometer",
    "\u03BCm": "micrometer",
    "nm": "nanometer",
    "mm": "millimeter",
    "cm": "centimeter",
    "m": "meter",
    "\xC5": "angstrom",
    "pm": "picometer",
    "in": "inch",
    "ft": "foot",
    "s": "second",
    "ms": "millisecond",
    "min": "minute",
    "h": "hour"
  };
  function format(ifd) {
    const bits = nums(ifd, Tag.BitsPerSample);
    const spp = num(ifd, Tag.SamplesPerPixel, 1);
    if (bits.some((b) => b !== bits[0])) throw new TiffError("samples of different sizes");
    return {
      bits: bits[0],
      spp,
      sampleFormat: num(ifd, Tag.SampleFormat, 1),
      planar: spp > 1 ? num(ifd, Tag.PlanarConfiguration, 1) : 1,
      compression: num(ifd, Tag.Compression, 1),
      predictor: num(ifd, Tag.Predictor, 1)
    };
  }
  var sameFormat = (a, b) => JSON.stringify(format(a)) === JSON.stringify(format(b));
  var tiled = (ifd) => ifd.tags.has(Tag.TileWidth) && ifd.tags.has(Tag.TileOffsets);
  function level(ifds) {
    const [first] = ifds;
    const stripped = ifds.find((i) => !tiled(i));
    if (stripped !== void 0) {
      throw new TiffError(`only tiled TIFFs are supported; the image at ${stripped.offset} is stored in strips`);
    }
    const l = {
      width: num(first, Tag.ImageWidth),
      height: num(first, Tag.ImageLength),
      tileWidth: num(first, Tag.TileWidth),
      tileHeight: num(first, Tag.TileLength),
      ifds
    };
    for (const ifd of ifds) {
      if (num(ifd, Tag.ImageWidth) !== l.width || num(ifd, Tag.ImageLength) !== l.height || num(ifd, Tag.TileWidth) !== l.tileWidth || num(ifd, Tag.TileLength) !== l.tileHeight || !sameFormat(ifd, first)) {
        throw new TiffError("planes of one pyramid level differ in size, tiling or format");
      }
    }
    return l;
  }
  function dtype(bits, sampleFormat) {
    const kind = { 1: "uint", 2: "int", 3: "float" }[sampleFormat];
    if (kind === void 0 || ![8, 16, 32, 64].includes(bits) || kind === "float" && bits < 32) {
      throw new TiffError(`unsupported sample type: ${bits}-bit, SampleFormat ${sampleFormat}`);
    }
    return `${kind}${bits}`;
  }
  async function virtualizeTiff(url, read, fileSize) {
    const tiff = await readTiff(read, fileSize);
    const [ifd0] = tiff.ifds;
    if (ifd0 === void 0) throw new TiffError("no images");
    const description = ifd0.tags.get(Tag.ImageDescription);
    const xml = typeof description === "string" && description.includes("<OME") ? description : void 0;
    const ome = xml === void 0 ? void 0 : parseOmePixels(xml);
    const f = format(ifd0);
    if (!JPEG2000.has(f.compression) && f.predictor !== 1) {
      throw new TiffError(`unsupported predictor ${f.predictor}`);
    }
    const sizeZ = Number(ome?.attrs.SizeZ ?? 1);
    const sizeT = Number(ome?.attrs.SizeT ?? 1);
    let sizeC = Number(ome?.attrs.SizeC ?? f.spp);
    if (f.spp > 1 && sizeC !== f.spp) {
      if (sizeC === 1) sizeC = f.spp;
      else throw new TiffError(`SizeC ${sizeC} with ${f.spp} samples per pixel is not supported`);
    }
    const planeC = f.spp > 1 ? 1 : sizeC;
    const plane = (t, c, z) => (t * planeC + c) * sizeZ + z;
    const planeIfd = new Array(sizeT * planeC * sizeZ).fill(-1);
    if (ome === void 0) {
      planeIfd[0] = 0;
    } else {
      const order = (ome.attrs.DimensionOrder ?? "XYZCT").slice(2);
      const size = { Z: sizeZ, C: planeC, T: sizeT };
      const step = (pos) => {
        for (const d of order) {
          if (++pos[d] < size[d]) return true;
          pos[d] = 0;
        }
        return false;
      };
      const entries2 = ome.tiffData.length > 0 ? ome.tiffData : [{}];
      for (const td of entries2) {
        if (td.FileName !== void 0) throw new TiffError("multi-file OME-TIFF is not supported");
        const pos = { Z: Number(td.FirstZ ?? 0), C: Number(td.FirstC ?? 0), T: Number(td.FirstT ?? 0) };
        let ifd = Number(td.IFD ?? 0);
        let count = Number(td.PlaneCount ?? (entries2.length === 1 && td.IFD === void 0 ? planeIfd.length : 1));
        while (count-- > 0) {
          planeIfd[plane(pos.T, pos.C, pos.Z)] = ifd++;
          if (!step(pos)) break;
        }
      }
    }
    if (planeIfd.some((i) => i < 0 || i >= tiff.ifds.length)) {
      throw new TiffError("OME-XML planes do not match the TIFF's images");
    }
    const planes = planeIfd.map((i) => tiff.ifds[i]);
    const levels = [];
    if (ifd0.subIfds.length > 0) {
      for (let k = -1; k < ifd0.subIfds.length; k++) {
        levels.push(level(planes.map((p) => k < 0 ? p : p.subIfds[k])));
      }
    } else {
      levels.push(level(planes));
      if (ome === void 0) {
        for (const ifd of tiff.ifds.slice(1)) {
          const prev = levels[levels.length - 1];
          if (tiled(ifd) && sameFormat(ifd, ifd0) && num(ifd, Tag.ImageWidth) < prev.width && num(ifd, Tag.ImageLength) < prev.height) {
            levels.push(level([ifd]));
          }
        }
      }
    }
    for (const l of levels) {
      if (!l.ifds.every(tiled)) throw new TiffError("only tiled TIFFs are supported");
      if (!l.ifds.every((i) => sameFormat(i, ifd0))) {
        throw new TiffError("pyramid levels differ in sample format or compression");
      }
    }
    const contig = f.spp > 1 && f.planar === 1;
    const axes = [];
    const physical = (d) => {
      const v = ome?.attrs[`PhysicalSize${d}`];
      return v === void 0 ? void 0 : Number(v);
    };
    const unit = (d) => physical(d) === void 0 ? void 0 : UNITS[ome?.attrs[`PhysicalSize${d}Unit`] ?? "\xB5m"] ?? void 0;
    if (sizeT > 1) axes.push({ name: "t", type: "time", size: sizeT });
    if (sizeC > 1) axes.push({ name: "c", type: "channel", size: sizeC });
    if (sizeZ > 1) axes.push({ name: "z", type: "space", unit: unit("Z"), size: sizeZ });
    axes.push({ name: "y", type: "space", unit: unit("Y"), size: 0 });
    axes.push({ name: "x", type: "space", unit: unit("X"), size: 0 });
    const cAxis = axes.findIndex((a) => a.name === "c");
    const dataType = dtype(f.bits, f.sampleFormat);
    const itemsize = f.bits / 8;
    let codecs;
    let codecName;
    if (JPEG2000.has(f.compression)) {
      codecs = [{ name: "imagecodecs_jpeg2k" }];
      codecName = "imagecodecs_jpeg2k";
    } else {
      const bytes = itemsize > 1 ? { name: "bytes", configuration: { endian: tiff.littleEndian ? "little" : "big" } } : { name: "bytes" };
      codecs = [bytes];
      if (f.compression === 8 || f.compression === 32946) {
        codecs.push({ name: "zlib", configuration: { level: 6 } });
        codecName = "zlib";
      } else if (f.compression === 5e4) {
        codecs.push({ name: "zstd", configuration: { level: 0, checksum: false } });
        codecName = "zstd";
      } else if (f.compression === 1) {
        codecName = "bytes";
      } else {
        throw new TiffError(`unsupported compression ${f.compression}`);
      }
    }
    if (contig) {
      const order = [...axes.keys()].filter((i) => i !== cAxis).concat([cAxis]);
      codecs.unshift({ name: "transpose", configuration: { order } });
    }
    const sources = [{ url }];
    const entries = [];
    const meta = [];
    const utf83 = new TextEncoder();
    const json = (v) => utf83.encode(JSON.stringify(v, null, 2));
    const datasets = [];
    let references = 0;
    const shapes = [];
    for (const [li, l] of levels.entries()) {
      const shape = axes.map((a) => a.size);
      shape[shape.length - 2] = l.height;
      shape[shape.length - 1] = l.width;
      const chunk = axes.map((a) => a.name === "c" && contig ? f.spp : 1);
      chunk[chunk.length - 2] = l.tileHeight;
      chunk[chunk.length - 1] = l.tileWidth;
      shapes.push(shape);
      meta.push({
        key: `${li}/zarr.json`,
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape,
          data_type: dataType,
          chunk_grid: { name: "regular", configuration: { chunk_shape: chunk } },
          chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
          fill_value: 0,
          codecs,
          dimension_names: axes.map((a) => a.name),
          attributes: {}
        })
      });
      const across = Math.ceil(l.width / l.tileWidth);
      const down = Math.ceil(l.height / l.tileHeight);
      const perSample = across * down;
      for (let t = 0; t < sizeT; t++) {
        for (let c = 0; c < planeC; c++) {
          for (let z = 0; z < sizeZ; z++) {
            const ifd = l.ifds[plane(t, c, z)];
            const offsets = nums(ifd, Tag.TileOffsets);
            const counts = nums(ifd, Tag.TileByteCounts);
            const samples = f.spp > 1 && !contig ? f.spp : 1;
            if (offsets.length !== samples * perSample || counts.length !== offsets.length) {
              throw new TiffError(`IFD at ${ifd.offset} has ${offsets.length} tiles, expected ${samples * perSample}`);
            }
            for (let s = 0; s < samples; s++) {
              for (let j = 0; j < perSample; j++) {
                const k = s * perSample + j;
                if (counts[k] === 0) continue;
                const coords = [];
                if (sizeT > 1) coords.push(t);
                if (sizeC > 1) coords.push(f.spp > 1 ? contig ? 0 : s : c);
                if (sizeZ > 1) coords.push(z);
                coords.push(Math.floor(j / across), j % across);
                const range = { source: 0, offset: BigInt(offsets[k]), length: BigInt(counts[k]) };
                entries.push({ key: `${li}/c/${coords.join("/")}`, ranges: [range] });
                references++;
              }
            }
          }
        }
      }
      const [base] = levels;
      const scale = axes.map((a) => {
        if (a.name === "y") return (physical("Y") ?? 1) * (base.height / l.height);
        if (a.name === "x") return (physical("X") ?? 1) * (base.width / l.width);
        if (a.name === "z") return physical("Z") ?? 1;
        return 1;
      });
      datasets.push({ path: String(li), coordinateTransformations: [{ type: "scale", scale }] });
    }
    const name = ome?.name;
    meta.push({
      key: "zarr.json",
      bytes: json({
        zarr_format: 3,
        node_type: "group",
        attributes: {
          ome: {
            version: "0.5",
            multiscales: [{
              ...name === void 0 ? {} : { name },
              axes: axes.map(({ name: name2, type, unit: unit2 }) => ({ name: name2, type, ...unit2 ? { unit: unit2 } : {} })),
              datasets
            }]
          }
        }
      })
    });
    if (xml !== void 0) {
      meta.push({ key: "OME/METADATA.ome.xml", bytes: utf83.encode(xml), compress: true });
    }
    return {
      sources,
      entries: [...entries, ...meta],
      summary: { name, axes: axes.map((a) => a.name), levels: shapes, references, codec: codecName }
    };
  }

  // src/server.ts
  var ARCHIVE_KEY = "__vz__/archive.vzip";
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
        "Access-Control-Expose-Headers": "Content-Range, Content-Length",
        ...typeof body === "string" ? { "Content-Type": "text/plain; charset=utf-8" } : {},
        ...headers
      }
    });
  }
  function parseRange(header, size) {
    const m = header?.match(/^bytes=(\d*)-(\d*)$/);
    if (!m || m[1] === "" && m[2] === "") return void 0;
    if (m[1] === "") {
      const n = Number(m[2]);
      if (n === 0) return "unsatisfiable";
      return { start: Math.max(0, size - n), end: size };
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? size : Math.min(size, Number(m[2]) + 1);
    if (start >= size || m[2] !== "" && Number(m[2]) < start) return "unsatisfiable";
    return { start, end };
  }
  function makeHandler(options) {
    const {
      prefix: prefix2,
      openFile = openHttpFile,
      fetchRange = (url, start, end, pins) => readHttpRange(url, start, end, pins),
      fetchArchive = async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new HttpResolutionError(`${url}: HTTP ${r.status}`);
        return new Uint8Array(await r.arrayBuffer());
      }
    } = options;
    const opened = /* @__PURE__ */ new Map();
    function open(kind, url) {
      const name = `${kind}/${url}`;
      let p = opened.get(name);
      if (p === void 0) {
        p = (async () => {
          const base = url.split(/[?#]/, 1)[0];
          const stem = decodeURIComponent(base.slice(base.lastIndexOf("/") + 1)) || "archive";
          if (kind === "archive") {
            return { archive: await Archive.open(await fetchArchive(url), url, fetchRange), filename: stem };
          }
          const file = await openFile(url);
          const virtual = await virtualizeTiff(url, blockReader(file.read, file.size), file.size);
          const bytes = await writeVzip(virtual);
          return {
            archive: await Archive.open(bytes, url, fetchRange),
            filename: `${stem.replace(/\.(ome\.)?tiff?$/i, "")}.vzip`
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
      const path = new URL(request.url).pathname.slice(new URL(prefix2).pathname.length);
      const m = path.match(/^(tiff|archive)\/([^/]+)\/(.*)$/);
      if (m === null) return response(404, "not found");
      const [, kind, id] = m;
      let key;
      let url;
      try {
        key = m[3].split("/").map(decodeURIComponent).join("/");
        url = new URL(decodeId(id)).href;
      } catch {
        return response(400, "invalid URL");
      }
      const head = request.method === "HEAD";
      try {
        const { archive, filename } = await open(kind, url);
        if (key === ARCHIVE_KEY) {
          return response(200, head ? null : archive.bytes, {
            "Content-Type": "application/zip",
            "Content-Length": String(archive.bytes.length),
            "Content-Disposition": `attachment; filename="${filename.replaceAll('"', "")}"`
          });
        }
        const entry = key === "" || key.endsWith("/") ? void 0 : archive.lookup(key);
        if (entry === void 0) return response(404, `no key ${key}`);
        const size = archive.size(entry);
        const type = key.endsWith(".json") ? "application/json" : key.endsWith(".xml") ? "application/xml" : "application/octet-stream";
        const range = parseRange(request.headers.get("Range"), size);
        if (range === "unsatisfiable") {
          return response(416, "range not satisfiable", { "Content-Range": `bytes */${size}` });
        }
        const headers = { "Content-Type": type, "Accept-Ranges": "bytes" };
        if (range === void 0) {
          const body2 = head ? null : await archive.read(key);
          return response(200, body2, { ...headers, "Content-Length": String(size) });
        }
        const body = head ? null : await archive.read(key, range.start, range.end);
        return response(206, body, {
          ...headers,
          "Content-Length": String(range.end - range.start),
          "Content-Range": `bytes ${range.start}-${range.end - 1}/${size}`
        });
      } catch (e) {
        const message = e.message;
        if (e instanceof VzipError) {
          const status = e.errorClass === "request" ? 416 : e.errorClass === "resolution" ? 502 : 500;
          return response(status, message);
        }
        if (e instanceof TiffError) return response(422, `TIFF: ${message}`);
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
  self.addEventListener("fetch", (event) => {
    if (event.request.url.startsWith(prefix)) event.respondWith(handle(event.request));
  });
})();
//# sourceMappingURL=vzip-sw.js.map
