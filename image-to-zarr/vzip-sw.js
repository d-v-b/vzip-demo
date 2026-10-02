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
    const lengthOf = (r) => {
      const v = r.headers.get("Content-Length");
      return r.status === 200 && v !== null && /^\d+$/.test(v) ? Number(v) : void 0;
    };
    let size;
    let headStatus = "failed";
    try {
      const head = await fetch(url, { method: "HEAD", signal });
      headStatus = String(head.status);
      size = lengthOf(head);
    } catch (e) {
      if (signal?.aborted) throw e;
    }
    if (size === void 0) {
      const probe = await fetch(url, { headers: { Range: "bytes=0-0" }, signal });
      const total = probe.headers.get("Content-Range")?.match(/\/(\d+)$/)?.[1];
      await probe.body?.cancel();
      if (probe.status === 206 && total !== void 0) size = Number(total);
    }
    if (size === void 0) {
      const abort = new AbortController();
      signal?.addEventListener("abort", () => abort.abort(), { once: true });
      const full = await fetch(url, { signal: abort.signal });
      if (full.status === 200) size = lengthOf(full);
      abort.abort();
    }
    if (size === void 0) {
      throw new HttpResolutionError(
        `${url}: cannot determine the size (HEAD ${headStatus})`
      );
    }
    return {
      size,
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
    const view2 = new DataView(out.buffer);
    let at = 0;
    for (const [v, w] of fields2) {
      if (w === 2) view2.setUint16(at, v, true);
      else if (w === 4) view2.setUint32(at, v, true);
      else view2.setBigUint64(at, BigInt(v), true);
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
    const view2 = new DataView(comment.buffer);
    view2.setBigUint64(6, BigInt(sources.offset + 30 + sources.name.length), true);
    view2.setBigUint64(14, BigInt(sources.body.length), true);
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
  function parseExtra(extra, view2, base) {
    const blocks = [];
    let at = 0;
    while (at < extra.length) {
      if (at + 4 > extra.length) return void 0;
      const id = view2.getUint16(base + at, true);
      const n = view2.getUint16(base + at + 2, true);
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
      const view2 = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const n = bytes.length;
      let eocd = -1;
      for (const commentLength of [38, 22]) {
        const at2 = n - 22 - commentLength;
        if (at2 >= 0 && view2.getUint32(at2, true) === 101010256 && view2.getUint16(at2 + 20, true) === commentLength) {
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
      let count = BigInt(view2.getUint16(eocd + 10, true));
      let cdSize = BigInt(view2.getUint32(eocd + 12, true));
      let cdOffset = BigInt(view2.getUint32(eocd + 16, true));
      if (view2.getUint16(eocd + 8, true) === U16_ALL2 || count === BigInt(U16_ALL2) || cdSize === BigInt(U32_ALL2) || cdOffset === BigInt(U32_ALL2)) {
        const loc = eocd - 20;
        if (loc < 0 || view2.getUint32(loc, true) !== 117853008) {
          throw new VzipError("archive", "missing zip64 locator");
        }
        const at2 = safe(view2.getBigUint64(loc + 8, true), "zip64 record offset");
        if (at2 + 56 > n || view2.getUint32(at2, true) !== 101075792 || view2.getBigUint64(at2 + 4, true) !== 44n) {
          throw new VzipError("archive", "invalid zip64 end of central directory");
        }
        count = view2.getBigUint64(at2 + 32, true);
        cdSize = view2.getBigUint64(at2 + 40, true);
        cdOffset = view2.getBigUint64(at2 + 48, true);
      }
      void count;
      const cdStart = safe(cdOffset, "central directory offset");
      const cdEnd = cdStart + safe(cdSize, "central directory size");
      if (cdEnd > n) throw new VzipError("archive", "central directory outside the file");
      const entries = /* @__PURE__ */ new Map();
      let at = cdStart;
      while (at < cdEnd) {
        if (at + 46 > cdEnd || view2.getUint32(at, true) !== 33639248) {
          throw new VzipError("archive", `bad central directory record at ${at}`);
        }
        const flags = view2.getUint16(at + 8, true);
        const method = view2.getUint16(at + 10, true);
        const csize = view2.getUint32(at + 20, true);
        const size = view2.getUint32(at + 24, true);
        const nameLen = view2.getUint16(at + 28, true);
        const extraLen = view2.getUint16(at + 30, true);
        const commentLen = view2.getUint16(at + 32, true);
        let offset = view2.getUint32(at + 42, true);
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
        const blocks = parseExtra(extra, view2, extraStart);
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
          if ("data" in r) {
            parts.push(Promise.resolve(r.data.subarray(a - at, b - at)));
          } else {
            const read = { source: r.source, offset: r.offset + lo, length: hi - lo };
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
      for (const run of runs) {
        run.data = this.source({ source: run.source, offset: run.offset, length: run.end - run.offset });
      }
      const chunks = await Promise.all(
        parts.map(async (p) => {
          if (p instanceof Promise) return p;
          const run = runOf.get(p);
          const from = Number(p.offset - run.offset);
          return (await run.data).subarray(from, from + Number(p.length));
        })
      );
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

  // src/lv.ts
  var LVError = class extends Error {
  };
  async function inflate(data) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
    try {
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (e) {
      throw new LVError(`invalid zlib stream in compressed LV data: ${e.message}`);
    }
  }
  var Reader = class {
    bytes;
    view;
    pos = 0;
    constructor(bytes) {
      this.bytes = bytes;
      this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    need(n, end) {
      if (this.pos + n > end) throw new LVError("truncated LV data");
    }
  };
  var utf16 = new TextDecoder("utf-16le");
  var MAX_DEPTH = 100;
  function records(r, end, count, depth) {
    if (depth > MAX_DEPTH) throw new LVError(`LV levels nested more than ${MAX_DEPTH} deep`);
    const out = [];
    while (r.pos < end && (count === void 0 || out.length < count)) {
      const start = r.pos;
      r.need(2, end);
      const type = r.bytes[r.pos];
      const nameLength = r.bytes[r.pos + 1];
      r.pos += 2;
      if (type === 76) throw new LVError("compressed LV record inside a structure");
      r.need(2 * nameLength, end);
      const name = utf16.decode(r.bytes.subarray(r.pos, r.pos + 2 * nameLength)).split("\0", 1)[0];
      r.pos += 2 * nameLength;
      const take = (n) => {
        r.need(n, end);
        const at = r.pos;
        r.pos += n;
        return at;
      };
      let value;
      switch (type) {
        // 64-bit integers beyond 2^53 lose precision here; they are rejected
        // wherever an integer is needed (§4.2), so the exact value never matters.
        case 1:
          value = { type, value: r.bytes[take(1)] !== 0 };
          break;
        case 2:
          value = { type, value: r.view.getInt32(take(4), true) };
          break;
        case 3:
          value = { type, value: r.view.getUint32(take(4), true) };
          break;
        case 4:
          value = { type, value: Number(r.view.getBigInt64(take(8), true)) };
          break;
        case 5:
        case 7:
          value = { type, value: Number(r.view.getBigUint64(take(8), true)) };
          break;
        case 6:
          value = { type, value: r.view.getFloat64(take(8), true) };
          break;
        case 8: {
          const from = r.pos;
          for (; ; ) {
            const at = take(2);
            if (r.view.getUint16(at, true) === 0) break;
          }
          value = { type, value: utf16.decode(r.bytes.subarray(from, r.pos - 2)) };
          break;
        }
        case 9: {
          const n = Number(r.view.getBigUint64(take(8), true));
          const at = take(n);
          value = Array.from(r.bytes.subarray(at, at + n), (b) => ({ type: 3, value: b }));
          break;
        }
        case 11: {
          const items = r.view.getUint32(take(4), true);
          const length = Number(r.view.getBigUint64(take(8), true));
          const levelEnd = start + length;
          if (levelEnd > end || levelEnd < r.pos) throw new LVError("LV level length outside the data");
          const members2 = records(r, levelEnd, items, depth + 1);
          if (members2.length !== items || r.pos !== levelEnd) {
            throw new LVError("LV level records do not end at its length");
          }
          take(8 * items);
          if (members2.length > 0 && members2.every(([k]) => k === "")) {
            value = members2.map(([, v]) => v);
          } else {
            value = new Map(members2);
          }
          break;
        }
        default:
          throw new LVError(`unknown LV record type ${type}`);
      }
      out.push([name, value]);
    }
    return out;
  }
  async function decodeLV(data) {
    if (data.length >= 1 && data[0] === 76) {
      if (data.length < 12) throw new LVError("truncated compressed LV record");
      const inner = await inflate(data.subarray(12));
      if (inner.length >= 1 && inner[0] === 76) throw new LVError("compressed LV data inside compressed LV data");
      data = inner;
    }
    const r = new Reader(data);
    return new Map(records(r, data.length, void 0, 0));
  }

  // src/nd2.ts
  var Nd2Error = class extends Error {
  };
  var CHUNK_MAGIC = 180276954;
  var FILE_SIGNATURE = "ND2 FILE SIGNATURE CHUNK NAME01!";
  var MAP_SIGNATURE = "ND2 CHUNK MAP SIGNATURE 0000001!";
  var FILEMAP_NAME = "ND2 FILEMAP SIGNATURE NAME 0001!";
  var FRAME = /^ImageDataSeq\|(0|[1-9][0-9]*)!$/;
  var MAX_PAYLOAD2 = 65519;
  var ascii = (b) => String.fromCharCode(...b);
  var dv = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var reject2 = (message) => {
    throw new Nd2Error(message);
  };
  function isNd2(head) {
    return head.length >= 4 && dv(head).getUint32(0, true) === CHUNK_MAGIC;
  }
  async function header(read, offset) {
    if (offset > Number.MAX_SAFE_INTEGER) reject2(`chunk offset ${offset} is too large`);
    const v = dv(await read(offset, 16));
    if (v.getUint32(0, true) !== CHUNK_MAGIC) reject2(`no ND2 chunk at ${offset}`);
    const nameLength = v.getUint32(4, true);
    const dataLength = Number(v.getBigUint64(8, true));
    if (dataLength > Number.MAX_SAFE_INTEGER) reject2("chunk length too large");
    const name = ascii(await read(offset + 16, nameLength)).split("\0", 1)[0];
    return { nameLength, dataLength, name };
  }
  var REQUIRED = Symbol("required");
  var isScalar = (v) => !Array.isArray(v) && !(v instanceof Map);
  function missing(what, fallback) {
    return fallback === REQUIRED ? reject2(`missing ${what}`) : fallback;
  }
  function number(v, what, fallback = REQUIRED) {
    if (v === void 0) return missing(what, fallback);
    if (!isScalar(v) || v.type < 2 || v.type > 6) return reject2(`${what} is not a number`);
    const x = v.value;
    if (!Number.isFinite(x)) reject2(`${what} is not finite`);
    return x;
  }
  function integer(v, what, fallback = REQUIRED) {
    if (v === void 0) return missing(what, fallback);
    const x = number(v, what);
    if (!Number.isInteger(x) || x < 0 || x > Number.MAX_SAFE_INTEGER) {
      reject2(`${what} = ${x} is not an integer from 0 to 2^53 - 1`);
    }
    return x;
  }
  function color(v, what, fallback) {
    if (v === void 0) return fallback;
    const x = number(v, what);
    if (!Number.isInteger(x) || x < -(2 ** 31) || x > 2 ** 32 - 1) reject2(`${what} = ${x} is not a color`);
    return x >>> 0;
  }
  function flag(v, what, fallback = REQUIRED) {
    if (v === void 0) return missing(what, fallback);
    if (!isScalar(v) || v.type < 1 || v.type > 5) return reject2(`${what} is not a flag`);
    return v.value !== 0 && v.value !== false;
  }
  function string2(v, what, fallback) {
    if (v === void 0) return fallback;
    if (!isScalar(v) || v.type !== 8) return reject2(`${what} is not a string`);
    return v.value;
  }
  function obj(v, what, fallback = REQUIRED) {
    if (v === void 0) return missing(what, fallback);
    if (!(v instanceof Map)) return reject2(`${what} is not an object`);
    return v;
  }
  function list(v, what) {
    if (v === void 0) return void 0;
    if (!Array.isArray(v)) return reject2(`${what} is not a list`);
    return v;
  }
  function members(v, what) {
    if (v === void 0) return [];
    if (Array.isArray(v)) return v;
    if (v instanceof Map) return [...v.values()];
    return reject2(`${what} is not an object or a list`);
  }
  function valid(items, flags, what) {
    const f = list(flags, what)?.map((x) => flag(x, `${what} entry`));
    return f === void 0 ? items : items.filter((_, i) => i < f.length && f[i]);
  }
  function nodeLoop(node) {
    const type = integer(node.get("eType"), "eType");
    if (![1, 2, 4, 6, 8].includes(type)) reject2(`unsupported experiment loop type ${type}`);
    const pars = obj(node.get("uLoopPars"), "uLoopPars", null);
    const itemValid = list(node.get("pItemValid"), "pItemValid");
    for (const x of itemValid ?? []) flag(x, "pItemValid entry");
    if (pars === null) return void 0;
    let loop;
    let count;
    switch (type) {
      case 1:
        count = integer(pars.get("uiCount"), "uiCount", 0);
        loop = { kind: "t", count, scale: number(pars.get("dPeriod"), "dPeriod", 0) };
        break;
      case 8: {
        const periods = members(pars.get("pPeriod"), "pPeriod").map((p) => obj(p, "pPeriod member"));
        const ok = valid(periods, pars.get("pPeriodValid"), "pPeriodValid");
        count = ok.reduce((n, p) => n + integer(p.get("uiCount"), "uiCount"), 0);
        if (count > Number.MAX_SAFE_INTEGER) reject2("the time loop's count is more than 2^53 - 1");
        const ms = ok.map((p) => number(p.get("dPeriod"), "dPeriod", 0));
        loop = { kind: "t", count, scale: ms.length ? ms[0] : 0 };
        break;
      }
      case 2: {
        const points = valid(members(pars.get("Points"), "Points"), itemValid, "pItemValid").map((q) => obj(q, "Points member"));
        count = points.length;
        const stage = points.map((q) => [number(q.get("dPosX"), "dPosX", null), number(q.get("dPosY"), "dPosY", null)]);
        loop = { kind: "p", count, scale: 0, stage };
        break;
      }
      case 4: {
        count = integer(pars.get("uiCount"), "uiCount", 0);
        let step = Math.abs(number(pars.get("dZStep"), "dZStep", 0));
        const high = number(pars.get("dZHigh"), "dZHigh", 0);
        const low = number(pars.get("dZLow"), "dZLow", 0);
        if (step === 0 && count > 1) step = Math.abs(high - low) / (count - 1);
        if (!Number.isFinite(step)) reject2("the z step is not finite");
        loop = { kind: "z", count, scale: step };
        break;
      }
      default: {
        const own = integer(pars.get("uiCount"), "uiCount", null);
        if (own !== null) count = own;
        else {
          const planes = obj(pars.get("pPlanes"), "pPlanes", null);
          count = planes === null ? 0 : integer(planes.get("uiCount"), "pPlanes/uiCount", 0);
        }
        loop = "spectral";
      }
    }
    return count ? loop : void 0;
  }
  function flattenExperiment(root) {
    const loops = [];
    const visit = (node, depth) => {
      const loop = nodeLoop(node);
      if (loop === void 0) return;
      let childDepth = depth + 1;
      if (loop === "spectral") {
        childDepth = depth;
      } else {
        const last = loops[loops.length - 1];
        if (last === void 0 || last.depth < depth) loops.push({ ...loop, depth });
        else if (last.depth === depth && last.kind === loop.kind && last.count < loop.count) {
          loops[loops.length - 1] = { ...loop, depth };
        }
      }
      for (const child of members(node.get("ppNextLevelEx"), "ppNextLevelEx")) {
        visit(obj(child, "experiment node"), childDepth);
      }
    };
    const check = (node) => {
      nodeLoop(node);
      for (const child of members(node.get("ppNextLevelEx"), "ppNextLevelEx")) check(obj(child, "experiment node"));
    };
    if (root !== void 0) {
      check(obj(root, "SLxExperiment"));
      visit(obj(root, "SLxExperiment"), 0);
    }
    const kinds = loops.map((l) => l.kind);
    if (new Set(kinds).size !== kinds.length) reject2(`repeated loop kinds ${kinds.join(", ")}`);
    return loops;
  }
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
    const [offset, length] = r;
    return (offset ? 1 + varintSize(offset) : 0) + (length ? 1 + varintSize(length) : 0);
  }
  function payloadSize(ranges) {
    if (ranges.length === 1) return rangeSize2(ranges[0]);
    return ranges.reduce((n, range) => {
      const r = rangeSize2(range);
      return n + 1 + varintSize(r) + r;
    }, 0);
  }
  function hexColor(abgr) {
    const h = (v) => v.toString(16).toUpperCase().padStart(2, "0");
    return h(abgr & 255) + h(abgr >>> 8 & 255) + h(abgr >>> 16 & 255);
  }
  async function virtualizeNd2(url, read, fileSize) {
    const sig = await header(read, 0);
    if (sig.name !== FILE_SIGNATURE || sig.nameLength !== 32 || sig.dataLength !== 64) {
      reject2("not an ND2 file (bad signature chunk)");
    }
    const version = ascii(await read(48, 64)).match(/^Ver([0-9]+)\./);
    if (version === null || Number(version[1]) < 3) reject2(`unsupported ND2 version ${ascii(await read(48, 8))}`);
    if (fileSize < 40) reject2("file too short for an ND2 chunk map");
    const tail = await read(fileSize - 40, 40);
    if (ascii(tail.subarray(0, 32)) !== MAP_SIGNATURE) reject2("no ND2 chunk map signature");
    const mapOffset = Number(dv(tail).getBigUint64(32, true));
    const mapHeader = await header(read, mapOffset);
    if (mapHeader.name !== FILEMAP_NAME) reject2("bad ND2 chunk map chunk");
    const mapData = await read(mapOffset + 16 + mapHeader.nameLength, mapHeader.dataLength);
    const chunks = /* @__PURE__ */ new Map();
    for (let pos = 0; ; ) {
      const end = mapData.indexOf(33, pos);
      if (end < 0) reject2("unterminated ND2 chunk map");
      const name = ascii(mapData.subarray(pos, end + 1));
      if (name === MAP_SIGNATURE) break;
      if (end + 17 > mapData.length) reject2("truncated ND2 chunk map record");
      chunks.set(name, Number(dv(mapData).getBigUint64(end + 1, true)));
      pos = end + 17;
    }
    const chunk = async (name) => {
      const offset = chunks.get(name);
      if (offset === void 0) return void 0;
      const h2 = await header(read, offset);
      return decodeLV(await read(offset + 16 + h2.nameLength, h2.dataLength));
    };
    const attributes = await chunk("ImageAttributesLV!");
    if (attributes === void 0) return reject2("no ImageAttributesLV! chunk");
    const attrs = obj(attributes.get("SLxImageAttributes"), "SLxImageAttributes");
    const width = integer(attrs.get("uiWidth"), "uiWidth");
    const height = integer(attrs.get("uiHeight"), "uiHeight");
    const widthBytes = integer(attrs.get("uiWidthBytes"), "uiWidthBytes");
    const comp = integer(attrs.get("uiComp"), "uiComp");
    const bpc = integer(attrs.get("uiBpcInMemory"), "uiBpcInMemory");
    const significant = number(attrs.get("uiBpcSignificant"), "uiBpcSignificant");
    const compression = integer(attrs.get("eCompression"), "eCompression", 2);
    const tileWidth = integer(attrs.get("uiTileWidth"), "uiTileWidth", 0);
    const tileHeight = integer(attrs.get("uiTileHeight"), "uiTileHeight", 0);
    if (Math.min(width, height, comp) < 1 || comp > 1024) {
      reject2("image width and height must be at least 1, and components from 1 to 1024");
    }
    const dataType = { 8: "uint8", 16: "uint16", 32: "float32" }[bpc];
    if (dataType === void 0) reject2(`unsupported bits per component ${bpc}`);
    if (compression === 1) reject2("lossy ND2 compression is not supported");
    if (compression !== 0 && compression !== 2) reject2(`unknown ND2 compression ${compression}`);
    if (tileWidth > 0 && tileWidth !== width || tileHeight > 0 && tileHeight !== height) {
      reject2("tiled ND2 frames are not supported");
    }
    const compressed = compression === 0;
    const rowBytes = width * comp * bpc / 8;
    if (widthBytes < rowBytes) reject2("uiWidthBytes is less than a row");
    if (compressed && widthBytes !== rowBytes) reject2("compressed frames with padded rows are not supported");
    const exp = await chunk("ImageMetadataLV!");
    const loops = flattenExperiment(exp?.get("SLxExperiment"));
    const seq = await chunk("ImageMetadataSeqLV|0!");
    const picture = (seq && obj(seq.get("SLxPictureMetadata"), "SLxPictureMetadata", null)) ?? /* @__PURE__ */ new Map();
    const bCalibrated = flag(picture.get("bCalibrated"), "bCalibrated", false);
    const cal = number(picture.get("dCalibration"), "dCalibration", null);
    let aspect = number(picture.get("dAspect"), "dAspect", 1);
    const [m11, m12, m21, m22] = [["11", 1], ["12", 0], ["21", 0], ["22", 1]].map(([k, fallback]) => number(picture.get(`dStgLgCT${k}`), `dStgLgCT${k}`, fallback));
    const calibrated = bCalibrated && cal !== null && cal > 0;
    if (!(aspect > 0)) aspect = 1;
    const pp = obj(picture.get("sPicturePlanes"), "sPicturePlanes", null) ?? /* @__PURE__ */ new Map();
    const planeCount = integer(pp.get("uiCount"), "uiCount", 0);
    const planeNew = obj(pp.get("sPlaneNew"), "sPlaneNew", null) ?? /* @__PURE__ */ new Map();
    const planes = /* @__PURE__ */ new Map();
    for (const [key, value] of planeNew) {
      const m = key.match(/^a(0|[1-9][0-9]*)$/);
      if (m === null || Number(m[1]) >= planeCount) continue;
      const p2 = obj(value, key);
      planes.set(Number(m[1]), {
        desc: string2(p2.get("sDescription"), "sDescription", ""),
        abgr: color(p2.get("uiColor"), "uiColor", 16777215),
        k: integer(p2.get("uiCompCount"), "uiCompCount", 1)
      });
    }
    let labels = [];
    let colors = [];
    const counts = [...planes.values()].map((p2) => p2.k);
    if (planeCount >= 1 && planes.size === planeCount && counts.every((k) => k === 1 || k === 3) && counts.reduce((a, b2) => a + b2, 0) === comp) {
      for (let i = 0; i < planeCount; i++) {
        const { desc, abgr, k } = planes.get(i);
        if (k === 3) {
          labels.push(`${desc} R`, `${desc} G`, `${desc} B`);
          colors.push("FF0000", "00FF00", "0000FF");
        } else {
          labels.push(desc);
          colors.push(hexColor(abgr));
        }
      }
    } else {
      labels = Array.from({ length: comp }, (_, k) => `C${k}`);
      colors = labels.map(() => "FFFFFF");
    }
    const total = loops.reduce((n, l) => n * l.count, 1);
    if (total > Number.MAX_SAFE_INTEGER) reject2("more than 2^53 - 1 frames");
    const frameOffsets = /* @__PURE__ */ new Map();
    for (const [name, offset] of chunks) {
      const m = name.match(FRAME);
      if (m !== null && Number(m[1]) < total) frameOffsets.set(Number(m[1]), offset);
    }
    const present = [...frameOffsets.keys()].sort((a, b2) => a - b2);
    let h = height;
    let frameChunks;
    if (compressed) {
      frameChunks = async (f) => {
        const o = frameOffsets.get(f);
        const head = await header(read, o);
        if (head.dataLength <= 8) reject2(`compressed frame ${f} has no data`);
        return [[[o + 16 + head.nameLength + 8, head.dataLength - 8]]];
      };
    } else {
      let nameLength = 0;
      if (present.length > 0) {
        const first = await header(read, frameOffsets.get(present[0]));
        const last = await header(read, frameOffsets.get(present[present.length - 1]));
        if (first.nameLength !== last.nameLength) reject2("frame chunk headers differ in name length");
        if (Math.min(first.dataLength, last.dataLength) < 8 + height * widthBytes) {
          reject2("frame chunk too short for its pixels");
        }
        nameLength = first.nameLength;
      }
      const start = (f) => frameOffsets.get(f) + 16 + nameLength + 8;
      const rows = (s, from, to) => Array.from({ length: to - from }, (_, i) => [s + (from + i) * widthBytes, rowBytes]);
      if (widthBytes !== rowBytes && present.length > 0) {
        const far = Math.max(...present.map(start));
        for (h = height; h > 1; h--) {
          if (height % h === 0 && payloadSize(rows(far, height - h, height)) <= MAX_PAYLOAD2) break;
        }
      }
      frameChunks = async (f) => {
        if (widthBytes === rowBytes) return [[[start(f), height * rowBytes]]];
        return Array.from({ length: height / h }, (_, j) => rows(start(f), j * h, j * h + h));
      };
    }
    const loopOf = (kind) => loops.find((l) => l.kind === kind);
    const t = loopOf("t");
    const z = loopOf("z");
    const p = loopOf("p");
    const axes = [];
    if (t) axes.push("t");
    if (comp > 1) axes.push("c");
    if (z) axes.push("z");
    axes.push("y", "x");
    const size = { t: t?.count ?? 1, c: comp, z: z?.count ?? 1, y: height, x: width };
    const chunkSize = { t: 1, c: comp, z: 1, y: h, x: width };
    const period = t && t.scale > 0 ? t.scale : void 0;
    const step = z && z.scale > 0 ? z.scale : void 0;
    const scale = {
      t: period ? period / 1e3 : 1,
      c: 1,
      z: step ?? 1,
      y: calibrated ? cal * aspect : 1,
      x: calibrated ? cal : 1
    };
    if (Object.values(scale).some((v) => !Number.isFinite(v))) reject2("a scale is not finite");
    const unit = {
      t: period ? "second" : void 0,
      z: step ? "micrometer" : void 0,
      y: calibrated ? "micrometer" : void 0,
      x: calibrated ? "micrometer" : void 0
    };
    const type = { t: "time", c: "channel", z: "space", y: "space", x: "space" };
    const codecs = [];
    if (comp > 1) {
      const stored = axes.filter((a) => a !== "c").concat("c");
      codecs.push({ name: "transpose", configuration: { order: stored.map((a) => axes.indexOf(a)) } });
    }
    codecs.push(bpc > 8 ? { name: "bytes", configuration: { endian: "little" } } : { name: "bytes" });
    if (compressed) codecs.push({ name: "zlib", configuration: { level: 1 } });
    const utf83 = new TextEncoder();
    const json = (v) => utf83.encode(JSON.stringify(v, null, 2));
    const group = (attributes2) => json({ zarr_format: 3, node_type: "group", attributes: attributes2 });
    const positions = p?.count ?? 1;
    const det = m11 * m22 - m12 * m21;
    let translations;
    if (p?.stage && calibrated && det !== 0 && p.stage.every(([x, y]) => x !== null && y !== null)) {
      translations = p.stage.map(([sx, sy]) => {
        const u = (m22 * sx - m12 * sy) / det;
        const v = (m11 * sy - m21 * sx) / det;
        const shift = { x: u - width * scale.x / 2, y: v - height * scale.y / 2 };
        if (!Object.values(shift).every(Number.isFinite)) reject2("a stage position is not finite");
        return axes.map((a) => shift[a] ?? 0);
      });
    }
    const entries = [
      { key: "zarr.json", bytes: group({ ome: { version: "0.5", "bioformats2raw.layout": 3 } }) },
      { key: "OME/zarr.json", bytes: group({ ome: { version: "0.5", series: Array.from({ length: positions }, (_, i) => String(i)) } }) }
    ];
    const b = Number.isInteger(significant) && significant >= 1 && significant <= bpc ? significant : bpc;
    const window = dataType === "float32" ? {} : { window: { min: 0, max: 2 ** b - 1, start: 0, end: 2 ** b - 1 } };
    for (let pi = 0; pi < positions; pi++) {
      entries.push({
        key: `${pi}/zarr.json`,
        bytes: group({
          ome: {
            version: "0.5",
            multiscales: [{
              name: `position ${pi}`,
              axes: axes.map((a) => ({ name: a, type: type[a], ...unit[a] ? { unit: unit[a] } : {} })),
              datasets: [{
                path: "0",
                coordinateTransformations: [
                  { type: "scale", scale: axes.map((a) => scale[a]) },
                  ...translations ? [{ type: "translation", translation: translations[pi] }] : []
                ]
              }]
            }],
            omero: {
              channels: labels.map((label, k) => ({ label, color: colors[k], active: true, ...window }))
            }
          }
        })
      });
      entries.push({
        key: `${pi}/0/zarr.json`,
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape: axes.map((a) => size[a]),
          data_type: dataType,
          chunk_grid: { name: "regular", configuration: { chunk_shape: axes.map((a) => chunkSize[a]) } },
          chunk_key_encoding: { name: "default", configuration: { separator: "/" } },
          fill_value: 0,
          codecs,
          dimension_names: axes,
          attributes: {}
        })
      });
    }
    const refs = (await Promise.all(present.map(async (f) => {
      const coords = {};
      let rest = f;
      for (let i = loops.length - 1; i >= 0; i--) {
        coords[loops[i].kind] = rest % loops[i].count;
        rest = Math.floor(rest / loops[i].count);
      }
      return (await frameChunks(f)).map((ranges, j) => {
        for (const [o, n] of ranges) if (o + n > fileSize) reject2(`frame ${f} is outside the file`);
        if (payloadSize(ranges) > MAX_PAYLOAD2) reject2(`frame ${f}'s reference payload exceeds ${MAX_PAYLOAD2} bytes`);
        const index = axes.map((a) => a === "t" || a === "z" ? coords[a] ?? 0 : a === "y" ? j : 0);
        const r = ranges.map(([o, n]) => ({ source: 0, offset: BigInt(o), length: BigInt(n) }));
        return { key: `${coords.p ?? 0}/0/c/${index.join("/")}`, ranges: r };
      });
    }))).flat();
    entries.unshift(...refs);
    return {
      sources: [{ url }],
      entries,
      summary: {
        sizes: Object.fromEntries([
          ...loops.map((l) => [l.kind, l.count]),
          ["c", comp],
          ["y", height],
          ["x", width]
        ]),
        dataType,
        compressed,
        paddedRows: widthBytes !== rowBytes,
        rowBlock: h,
        positions,
        frames: total,
        missing: total - present.length,
        channels: labels
      }
    };
  }

  // src/tiff.ts
  var TiffError = class extends Error {
  };
  var Tag = {
    ImageWidth: 256,
    ImageLength: 257,
    BitsPerSample: 258,
    Compression: 259,
    PhotometricInterpretation: 262,
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
    JPEGTables: 347
  };
  var WANTED = new Set(Object.values(Tag));
  var SCALARS = /* @__PURE__ */ new Set([256, 257, 259, 262, 277, 284, 317, 322, 323]);
  var INTEGER_TYPES = /* @__PURE__ */ new Set([1, 3, 4, 13, 16, 18]);
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
  function u64(view2, at, le2) {
    const v = view2.getBigUint64(at, le2);
    if (v > BigInt(Number.MAX_SAFE_INTEGER)) throw new TiffError("offset too large");
    return Number(v);
  }
  function values(bytes, type, count, le2, tag = 0) {
    const view2 = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (type === 2 || tag === Tag.JPEGTables) return bytes.slice();
    const out = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 1:
        case 7:
          out.push(view2.getUint8(i));
          break;
        case 6:
          out.push(view2.getInt8(i));
          break;
        case 3:
          out.push(view2.getUint16(2 * i, le2));
          break;
        case 8:
          out.push(view2.getInt16(2 * i, le2));
          break;
        case 4:
        case 13:
          out.push(view2.getUint32(4 * i, le2));
          break;
        case 9:
          out.push(view2.getInt32(4 * i, le2));
          break;
        case 16:
        case 18:
          out.push(u64(view2, 8 * i, le2));
          break;
        case 17: {
          const v = view2.getBigInt64(8 * i, le2);
          if (v > BigInt(Number.MAX_SAFE_INTEGER) || v < -BigInt(Number.MAX_SAFE_INTEGER)) {
            throw new TiffError("a tag value is more than 2^53 - 1");
          }
          out.push(Number(v));
          break;
        }
        case 11:
          out.push(view2.getFloat32(4 * i, le2));
          break;
        case 12:
          out.push(view2.getFloat64(8 * i, le2));
          break;
        case 5:
          out.push(view2.getUint32(8 * i, le2) / view2.getUint32(8 * i + 4, le2));
          break;
        case 10:
          out.push(view2.getInt32(8 * i, le2) / view2.getInt32(8 * i + 4, le2));
          break;
        default:
          throw new TiffError(`unknown field type ${type}`);
      }
    }
    return out;
  }
  async function readTiff(read, fileSize) {
    const header2 = await read(0, Math.min(16, fileSize));
    if (header2.length < 8) throw new TiffError("file too short for a TIFF header");
    const order = String.fromCharCode(header2[0], header2[1]);
    if (order !== "II" && order !== "MM") throw new TiffError("not a TIFF file");
    const le2 = order === "II";
    const hview = new DataView(header2.buffer, header2.byteOffset, header2.byteLength);
    const magic = hview.getUint16(2, le2);
    let bigTiff;
    let first;
    if (magic === 42) {
      bigTiff = false;
      first = hview.getUint32(4, le2);
    } else if (magic === 43) {
      if (header2.length < 16 || hview.getUint16(4, le2) !== 8 || hview.getUint16(6, le2) !== 0) {
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
      if (offset < (bigTiff ? 16 : 8)) throw new TiffError(`IFD offset ${offset} is inside the header`);
      if (seen.has(offset)) throw new TiffError(`IFD offset ${offset} read twice`);
      if (seen.size >= 1e5) throw new TiffError("too many IFDs");
      seen.add(offset);
      const cbytes = await read(offset, countSize);
      const cview = new DataView(cbytes.buffer, cbytes.byteOffset, cbytes.byteLength);
      const count = bigTiff ? u64(cview, 0, le2) : cview.getUint16(0, le2);
      const body = await read(offset + countSize, count * entrySize + fieldSize);
      const view2 = new DataView(body.buffer, body.byteOffset, body.byteLength);
      const tags = /* @__PURE__ */ new Map();
      const types = /* @__PURE__ */ new Map();
      const pending = [];
      for (let i = 0; i < count; i++) {
        const at = i * entrySize;
        const tag = view2.getUint16(at, le2);
        if (!WANTED.has(tag) || types.has(tag)) continue;
        const type = view2.getUint16(at + 2, le2);
        const n = bigTiff ? u64(view2, at + 4, le2) : view2.getUint32(at + 4, le2);
        const size = TYPE_SIZE[type];
        const allowed = tag === Tag.ImageDescription ? size !== void 0 : tag === Tag.JPEGTables ? type === 1 || type === 7 : INTEGER_TYPES.has(type);
        if (!allowed) {
          throw new TiffError(`tag ${tag} has field type ${type}`);
        }
        if (SCALARS.has(tag) && n === 0) throw new TiffError(`tag ${tag} has no value`);
        const valueAt = at + 4 + (bigTiff ? 8 : 4);
        if (n * size <= fieldSize) {
          types.set(tag, type);
          tags.set(tag, values(body.subarray(valueAt, valueAt + n * size), type, n, le2, tag));
        } else {
          const where = bigTiff ? u64(view2, valueAt, le2) : view2.getUint32(valueAt, le2);
          types.set(tag, type);
          pending.push(
            read(where, n * size).then((b) => {
              tags.set(tag, values(b, type, n, le2, tag));
            })
          );
        }
      }
      await Promise.all(pending);
      const nextAt = count * entrySize;
      const next = bigTiff ? Number(view2.getBigUint64(nextAt, le2)) : view2.getUint32(nextAt, le2);
      return { ifd: { offset, tags, types, subIfds: [] }, next };
    }
    const ifds = [];
    for (let offset = first; offset !== 0; ) {
      if (offset > Number.MAX_SAFE_INTEGER) throw new TiffError("IFD offset too large");
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

  // src/ndpi.ts
  var MAX_IFDS = 1e5;
  var MAX_PAYLOAD3 = 65519;
  var CHUNK = 1024;
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
  var INTEGER = /* @__PURE__ */ new Set([1, 3, 4, 13, 16, 18]);
  var TAGS = {
    256: [INTEGER, true],
    257: [INTEGER, true],
    258: [INTEGER, false],
    259: [INTEGER, true],
    262: [INTEGER, true],
    277: [INTEGER, true],
    273: [INTEGER, true],
    279: [INTEGER, true],
    282: [/* @__PURE__ */ new Set([5]), true],
    283: [/* @__PURE__ */ new Set([5]), true],
    296: [INTEGER, true],
    65420: [INTEGER, true],
    65421: [/* @__PURE__ */ new Set([11, 12]), true],
    65426: [INTEGER, false],
    65432: [INTEGER, false]
  };
  var reject3 = (message) => {
    throw new TiffError(message);
  };
  var view = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  var u642 = (v, at) => {
    const x = v.getBigUint64(at, true);
    return x > BigInt(Number.MAX_SAFE_INTEGER) ? reject3("an NDPI offset is above 2^53 - 1") : Number(x);
  };
  async function detectNdpi(read, size) {
    if (size < 12) return void 0;
    const head = await read(0, 12);
    if (String.fromCharCode(...head.subarray(0, 4)) !== "II*\0") return void 0;
    const v = Number(view(head).getBigUint64(4, true));
    if (v < 16 || v + 2 > size) return void 0;
    const n = view(await read(v, 2)).getUint16(0, true);
    if (v + 2 + 12 * n > size) return void 0;
    const entries = view(await read(v + 2, 12 * n));
    for (let i = 0; i < n; i++) if (entries.getUint16(12 * i, true) === 65420) return v;
    return void 0;
  }
  async function readIfds(read, first) {
    const seen = /* @__PURE__ */ new Set();
    const ifds = [];
    for (let offset = first; offset !== 0; ) {
      if (offset < 16) reject3(`IFD offset ${offset} is not in the file`);
      if (seen.has(offset)) reject3(`IFD offset ${offset} read twice`);
      if (seen.size >= MAX_IFDS) reject3("too many IFDs");
      seen.add(offset);
      const n = view(await read(offset, 2)).getUint16(0, true);
      const body = await read(offset + 2, 12 * n + 8 + 4 * n);
      const b = view(body);
      const tags = /* @__PURE__ */ new Map();
      for (let i = 0; i < n; i++) {
        const tag = b.getUint16(12 * i, true);
        if (!(tag in TAGS) || tags.has(tag)) continue;
        const type = b.getUint16(12 * i + 2, true);
        const count = b.getUint32(12 * i + 4, true);
        const [allowed, scalar] = TAGS[tag];
        if (!allowed.has(type)) reject3(`tag ${tag} has field type ${type}`);
        if (scalar && count === 0) reject3(`tag ${tag} has no value`);
        const low = b.getUint32(12 * i + 8, true);
        const high = b.getUint32(12 * n + 8 + 4 * i, true);
        const nbytes = count * SIZES[type];
        let values2;
        if (nbytes <= 4) {
          values2 = count === 1 && (type === 4 || type === 13) ? [low + high * 2 ** 32] : decode(body.subarray(12 * i + 8, 12 * i + 8 + nbytes), type, count);
        } else {
          values2 = decode(await read(low + high * 2 ** 32, nbytes), type, count);
        }
        if (INTEGER.has(type) && values2.some((v) => v > Number.MAX_SAFE_INTEGER)) {
          reject3(`tag ${tag} has a value above 2^53 - 1`);
        }
        tags.set(tag, values2);
      }
      ifds.push(tags);
      offset = u642(b, 12 * n);
    }
    if (ifds.length === 0) reject3("no images");
    return ifds;
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
    if (v === void 0) return fallback ?? reject3(`an NDPI image has no ${what}`);
    return v[0];
  }
  function jpegHeader(header2) {
    if (header2[0] !== 255 || header2[1] !== 216) reject3("an NDPI strip does not start with a JPEG SOI marker");
    const v = view(header2);
    let pos = 2;
    let sof;
    let dri;
    for (; ; ) {
      if (pos + 4 > header2.length || header2[pos] !== 255) reject3("malformed JPEG header in an NDPI strip");
      const marker = header2[pos + 1];
      const length = v.getUint16(pos + 2);
      const end = pos + 2 + length;
      if (length < 2 || end > header2.length) reject3("malformed JPEG header in an NDPI strip");
      if (marker === 192) {
        if (sof !== void 0) reject3("an NDPI strip has two SOF0 segments");
        sof = [pos, end];
      } else if (marker >= 193 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
        reject3(`an NDPI strip is not baseline JPEG (marker FF${marker.toString(16).toUpperCase()})`);
      } else if (marker === 221) {
        if (length !== 4) reject3("malformed DRI segment in an NDPI strip");
        dri = v.getUint16(pos + 4);
      } else if (marker === 218) {
        if (end !== header2.length) reject3("an NDPI strip's SOS does not end at McuStarts[0]");
        break;
      }
      pos = end;
    }
    if (sof === void 0 || !dri) return reject3("an NDPI strip has no SOF0 or no restart interval");
    const seg = header2.subarray(sof[0], sof[1]);
    const nf = seg.length > 9 ? seg[9] : 0;
    if (nf === 0 || seg.length !== 10 + 3 * nf) reject3("malformed SOF0 segment in an NDPI strip");
    let horizontal = 0;
    let vertical = 0;
    for (let k = 0; k < nf; k++) {
      horizontal = Math.max(horizontal, seg[11 + 3 * k] >> 4);
      vertical = Math.max(vertical, seg[11 + 3 * k] & 15);
    }
    if (horizontal === 0 || vertical === 0) reject3("an NDPI strip has a sampling factor of 0");
    return [sof[0], sof[1], 8 * horizontal, 8 * vertical, dri];
  }
  async function virtualizeNdpi(url, read, size, first) {
    const ifds = await readIfds(read, first);
    const levels = [];
    for (const tags of ifds) {
      const mag = one(tags, 65421, "Magnification");
      if (!(mag > 0)) continue;
      const w = one(tags, 256, "ImageWidth");
      const h = one(tags, 257, "ImageLength");
      const bits = tags.get(258);
      if (one(tags, 259, "Compression", 1) !== 7 || one(tags, 262, "PhotometricInterpretation") !== 6 || one(tags, 277, "SamplesPerPixel", 1) !== 3 || !bits?.length || bits.some((b) => b !== 8)) {
        reject3("an NDPI level is not 8-bit YCbCr JPEG with 3 samples");
      }
      if (tags.get(273)?.length !== 1 || tags.get(279)?.length !== 1) reject3("an NDPI level does not have exactly one strip");
      const last = levels[levels.length - 1];
      if (last && !(w < last.w && h < last.h)) reject3("NDPI levels do not decrease in size");
      if (levels.some((l) => l.mag === mag)) reject3("NDPI focal planes (two levels with one magnification) are not supported");
      if (Math.min(w, h) < 1) reject3("an NDPI level is empty");
      levels.push({ mag, w, h, tags });
    }
    if (levels.length === 0) reject3("no NDPI levels");
    const base = levels[0];
    const perUnit = { 3: 1e4, 2: 25400 }[one(base.tags, 296, "ResolutionUnit", 2)];
    const physical2 = (tag) => {
      const r = base.tags.get(tag)?.[0];
      return perUnit === void 0 || r === void 0 || r[0] === 0 || r[1] === 0 ? void 0 : perUnit / (r[0] / r[1]);
    };
    const px = physical2(282);
    const py = physical2(283);
    const axes = ["c", "y", "x"];
    const codecs = [{ name: "transpose", configuration: { order: [1, 2, 0] } }, { name: "imagecodecs_jpeg" }];
    const utf83 = new TextEncoder();
    const json = (v) => utf83.encode(JSON.stringify(v, null, 2));
    const entries = [];
    const datasets = [];
    for (const [li, level2] of levels.entries()) {
      const s0 = one(level2.tags, 273, "StripOffsets");
      const n = one(level2.tags, 279, "StripByteCounts");
      if (s0 + n > size || n < 4) reject3("an NDPI strip is outside the file");
      let chunk;
      const refs = [];
      const starts = level2.tags.get(65426);
      if (starts === void 0) {
        chunk = [3, level2.h, level2.w];
        refs.push([`${li}/c/0/0/0`, [[s0, n]]]);
      } else {
        chunk = await intervals(refs, li, read, level2.tags, starts, s0, n, level2.w, level2.h);
      }
      for (const [key, parts] of refs) {
        entries.push({
          key,
          ranges: parts.map((p) => p instanceof Uint8Array ? { data: p } : { source: 0, offset: BigInt(p[0]), length: BigInt(p[1]) })
        });
      }
      entries.push({
        key: `${li}/zarr.json`,
        bytes: json({
          zarr_format: 3,
          node_type: "array",
          shape: [3, level2.h, level2.w],
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
        coordinateTransformations: [{ type: "scale", scale: [1, (py ?? 1) * (base.h / level2.h), (px ?? 1) * (base.w / level2.w)] }]
      });
    }
    const unit = (p) => p === void 0 ? {} : { unit: "micrometer" };
    entries.push({
      key: "zarr.json",
      bytes: json({
        zarr_format: 3,
        node_type: "group",
        attributes: {
          ome: {
            version: "0.5",
            multiscales: [{
              axes: [{ name: "c", type: "channel" }, { name: "y", type: "space", ...unit(py) }, { name: "x", type: "space", ...unit(px) }],
              datasets
            }]
          }
        }
      })
    });
    return {
      sources: [{ url }],
      entries,
      summary: { axes, levels: levels.map((l) => [3, l.h, l.w]), references: entries.length - levels.length - 1, codec: "imagecodecs_jpeg" }
    };
  }
  async function intervals(refs, li, read, tags, startsLow, s0, n, w, h) {
    const high = tags.get(65432);
    if (high !== void 0 && high.length !== startsLow.length) reject3("McuStartsHighBytes and McuStarts differ in length");
    const starts = high === void 0 ? startsLow : startsLow.map((s, i) => s + high[i] * 2 ** 32);
    if (starts.length === 0 || starts[0] < 2 || starts[0] > n) reject3("McuStarts[0] is outside the strip");
    const header2 = await read(s0, starts[0]);
    const [sofStart, sofEnd, mw, mh, interval] = jpegHeader(header2);
    const q = Math.ceil(w / (interval * mw));
    const r = Math.ceil(h / mh);
    if (starts.length !== q * r || starts[starts.length - 1] >= n || starts.some((s, i) => i > 0 && s <= starts[i - 1])) {
      reject3("McuStarts does not match the strip's intervals");
    }
    const ends = starts.map((_, i) => (i + 1 < starts.length ? starts[i + 1] : n) - 2);
    if (starts.some((s, i) => ends[i] <= s)) reject3("an NDPI restart interval is empty");
    const a = Math.min(q, Math.max(1, Math.floor(CHUNK / (interval * mw))));
    const sof = header2.slice(sofStart, sofEnd);
    const chunks = (b2) => {
      const s = sof.slice();
      view(s).setUint16(5, b2 * mh);
      view(s).setUint16(7, a * interval * mw);
      const head = [[s0, sofStart], s, [s0 + sofEnd, starts[0] - sofEnd]];
      const out = [];
      for (let u = 0; u < Math.ceil(r / b2); u++) {
        for (let v = 0; v < Math.ceil(q / a); v++) {
          const parts = [...head];
          let t = 0;
          for (let y = 0; y < b2; y++) {
            for (let x = 0; x < a; x++) {
              const i = Math.min(u * b2 + y, r - 1) * q + Math.min(v * a + x, q - 1);
              if (t) parts.push(Uint8Array.of(255, 208 + (t - 1) % 8));
              parts.push([s0 + starts[i], ends[i] - starts[i]]);
              t++;
            }
          }
          parts.push(Uint8Array.of(255, 217));
          out.push([u, v, parts]);
        }
      }
      return out;
    };
    let b = Math.max(1, Math.min(r, Math.floor(CHUNK / mh)));
    let all = chunks(b);
    while (b > 1 && all.some(([, , parts]) => payloadSize(parts) > MAX_PAYLOAD3)) all = chunks(--b);
    for (const [u, v, parts] of all) {
      if (payloadSize(parts) > MAX_PAYLOAD3) reject3(`an NDPI chunk's reference payload exceeds ${MAX_PAYLOAD3} bytes`);
      refs.push([`${li}/c/0/${u}/${v}`, parts]);
    }
    return [3, b * mh, a * interval * mw];
  }

  // src/virtualize.ts
  var JPEG2000 = /* @__PURE__ */ new Set([33003, 33004, 33005, 34712]);
  var JPEG = 7;
  var MAX_PAYLOAD4 = 65519;
  var ADOBE = [255, 238, 0, 14, 65, 100, 111, 98, 101, 0, 100, 0, 0, 0, 0];
  function jpegPrefix(ifd, spp, photometric) {
    const out = [255, 216];
    if (spp === 3) out.push(...ADOBE, photometric === 2 ? 0 : 1);
    const tables = ifd.tags.get(Tag.JPEGTables);
    if (tables !== void 0) {
      const n = tables.length;
      if (n < 4 || tables[0] !== 255 || tables[1] !== 216 || tables[n - 2] !== 255 || tables[n - 1] !== 217) {
        reject4(`the IFD at ${ifd.offset} has malformed JPEGTables`);
      }
      out.push(...tables.subarray(2, n - 2));
    }
    return Uint8Array.from(out);
  }
  var reject4 = (message) => {
    throw new TiffError(message);
  };
  var WS = "[ \\t\\r\\n]";
  var NAME = "[A-Za-z0-9_.-]+";
  var ANAME = `[^ \\t\\r\\n=/>"'<]+`;
  var SKIP = "<!--[^]*?(?:-->|$)|<!\\[CDATA\\[[^]*?(?:\\]\\]>|$)|<\\?[^]*?(?:\\?>|$)|<![^]*?(?:>|$)";
  var TAG = `<(/?)(?:${NAME}:)?(${NAME})((?:${WS}+${ANAME}${WS}*=${WS}*(?:"[^"]*"|'[^']*'))*)${WS}*(/?)>`;
  var SCAN = new RegExp(`(${SKIP})|(${TAG})|<`, "g");
  var ATTR = new RegExp(`(${ANAME})${WS}*=${WS}*(?:"([^"]*)"|'([^']*)')`, "g");
  var DECIMAL = /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?$/;
  var NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  function decodeXml(s) {
    return s.replace(/&(?:#x([0-9a-fA-F]+)|#([0-9]+)|(lt|gt|amp|quot|apos));/g, (ref, hex, dec, named) => {
      if (named) return NAMED[named];
      const c = hex ? parseInt(hex, 16) : Number(dec);
      if (c === 0 || c >= 55296 && c <= 57343 || c > 1114111) return ref;
      return String.fromCodePoint(c);
    });
  }
  function scan(xml) {
    const tags = [];
    const skipped = [];
    for (const m of xml.matchAll(SCAN)) {
      const start = m.index;
      const end = start + m[0].length;
      if (m[1] !== void 0) {
        skipped.push([start, end]);
      } else if (m[2] !== void 0) {
        const attrs = {};
        for (const a of m[5].matchAll(ATTR)) {
          if (!Object.hasOwn(attrs, a[1])) attrs[a[1]] = decodeXml(a[2] ?? a[3]);
        }
        tags.push({ start, end, closing: m[3] === "/", name: m[4], attrs, selfClosing: m[6] === "/" });
      }
    }
    return { tags, skipped };
  }
  function parseOme(xml) {
    const { tags, skipped } = scan(xml);
    if (!tags.some((t) => !t.closing && t.name === "OME")) return void 0;
    const image = tags.find((t) => !t.closing && t.name === "Image");
    const pi = tags.findIndex((t) => !t.closing && t.name === "Pixels");
    const name = image?.attrs.Name;
    if (pi < 0) return { name, pixels: {}, tiffData: [] };
    const inside = [];
    if (!tags[pi].selfClosing) {
      for (const t of tags.slice(pi + 1)) {
        if (t.closing && t.name === "Pixels") break;
        inside.push(t);
      }
    }
    const text = (start, end) => {
      let out = "";
      let pos = start;
      for (const [a, b] of skipped) {
        if (b <= start || a >= end) continue;
        out += xml.slice(pos, a);
        pos = b;
      }
      return decodeXml(out + xml.slice(pos, end)).replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
    };
    const tiffData = [];
    inside.forEach((t, i) => {
      if (t.closing || t.name !== "TiffData") return;
      const td = { attrs: t.attrs };
      if (!t.selfClosing) {
        for (let j = i + 1; j < inside.length; j++) {
          const u = inside[j];
          if (u.name === "TiffData") break;
          if (!u.closing && u.name === "UUID") {
            if (u.attrs.FileName !== void 0) td.uuid = u.attrs.FileName;
            else if (u.selfClosing) td.uuid = "";
            else {
              const next = tags[tags.indexOf(u) + 1];
              td.uuid = text(u.end, next === void 0 ? xml.length : next.start);
            }
            break;
          }
        }
      }
      tiffData.push(td);
    });
    return { name, pixels: tags[pi].attrs, tiffData };
  }
  function intAttr(attrs, key, fallback, minimum = 0) {
    const v = attrs[key];
    if (v === void 0) return fallback;
    const s = v.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
    if (!/^[0-9]+$/.test(s)) reject4(`${key}="${v}" is not an integer`);
    const n = Number(s);
    if (!Number.isSafeInteger(n)) reject4(`${key}="${v}" is not an integer`);
    if (n < minimum) reject4(`${key}="${v}" is less than ${minimum}`);
    return n;
  }
  function physical(attrs, d) {
    const v = attrs[`PhysicalSize${d}`];
    if (v === void 0 || !DECIMAL.test(v)) return void 0;
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? x : void 0;
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
    "\u212B": "angstrom",
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
    if (bits.length === 0 || bits.some((b) => b !== bits[0]) || bits[0] < 1) {
      reject4("BitsPerSample values are missing, differ or are 0");
    }
    const formats = ifd.tags.get(Tag.SampleFormat) ?? [1];
    if (formats.length === 0 || formats.some((f) => f !== formats[0])) {
      reject4("SampleFormat values are missing or differ");
    }
    const spp = num(ifd, Tag.SamplesPerPixel, 1);
    if (spp < 1) reject4("SamplesPerPixel is 0");
    const planar = spp > 1 ? num(ifd, Tag.PlanarConfiguration, 1) : 1;
    if (planar !== 1 && planar !== 2) reject4(`PlanarConfiguration ${planar}`);
    return {
      bits: bits[0],
      spp,
      sampleFormat: formats[0],
      planar,
      compression: num(ifd, Tag.Compression, 1),
      predictor: num(ifd, Tag.Predictor, 1),
      // For JPEG, PhotometricInterpretation is part of the format (§3.1).
      photometric: num(ifd, Tag.Compression, 1) === JPEG ? ifd.tags.get(Tag.PhotometricInterpretation)?.[0] ?? null : null
    };
  }
  var sameFormat = (a, b) => JSON.stringify(format(a)) === JSON.stringify(format(b));
  var tiled = (ifd) => ifd.tags.has(Tag.TileWidth) && ifd.tags.has(Tag.TileOffsets);
  function checkSize(ifd) {
    if (num(ifd, Tag.ImageWidth) < 1 || num(ifd, Tag.ImageLength) < 1) reject4(`the image at ${ifd.offset} is empty`);
    if (tiled(ifd)) {
      nums(ifd, Tag.TileByteCounts);
      if (num(ifd, Tag.TileWidth) < 1 || num(ifd, Tag.TileLength) < 1) {
        reject4(`the image at ${ifd.offset} has an empty tile size`);
      }
    }
  }
  function level(ifds) {
    for (const i of ifds) {
      checkSize(i);
      format(i);
    }
    const [first] = ifds;
    const stripped = ifds.find((i) => !tiled(i));
    if (stripped !== void 0) {
      reject4(`only tiled TIFFs are supported; the image at ${stripped.offset} is stored in strips`);
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
        reject4("planes of one pyramid level differ in size, tiling or format");
      }
    }
    return l;
  }
  function dtype(bits, sampleFormat) {
    const kind = { 1: "uint", 2: "int", 3: "float" }[sampleFormat];
    if (kind === void 0 || ![8, 16, 32, 64].includes(bits) || kind === "float" && bits < 32) {
      reject4(`unsupported sample type: ${bits}-bit, SampleFormat ${sampleFormat}`);
    }
    return `${kind}${bits}`;
  }
  async function virtualizeTiff(url, read, fileSize) {
    const tiff = await readTiff(read, fileSize);
    const [ifd0] = tiff.ifds;
    if (ifd0 === void 0) reject4("no images");
    const description = ifd0.tags.get(Tag.ImageDescription);
    let raw;
    let ome;
    if (ifd0.types.get(Tag.ImageDescription) === 2 && description instanceof Uint8Array) {
      const nul = description.indexOf(0);
      const d = nul < 0 ? description : description.subarray(0, nul);
      let text;
      try {
        text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(d);
      } catch {
        text = void 0;
      }
      if (text !== void 0) {
        ome = parseOme(text);
        if (ome !== void 0) raw = d;
      }
    }
    const f = format(ifd0);
    if (!JPEG2000.has(f.compression) && f.predictor !== 1) reject4(`unsupported predictor ${f.predictor}`);
    const px = ome?.pixels ?? {};
    const sizeZ = intAttr(px, "SizeZ", 1, 1);
    const sizeT = intAttr(px, "SizeT", 1, 1);
    let sizeC = intAttr(px, "SizeC", f.spp, 1);
    const order = px.DimensionOrder ?? "XYZCT";
    if (ome && !/^XY(ZCT|ZTC|CZT|CTZ|TZC|TCZ)$/.test(order)) reject4(`DimensionOrder ${order}`);
    if (f.spp > 1 && sizeC !== f.spp) {
      if (sizeC === 1) sizeC = f.spp;
      else reject4(`SizeC ${sizeC} with ${f.spp} samples per pixel is not supported`);
    }
    const planeC = f.spp > 1 ? 1 : sizeC;
    const plane = (t, c, z) => (t * planeC + c) * sizeZ + z;
    if (sizeT * planeC * sizeZ > 1e5) reject4(`${sizeT * planeC * sizeZ} planes is more than 100000`);
    const planeIfd = new Array(sizeT * planeC * sizeZ).fill(-1);
    if (ome === void 0) {
      planeIfd[0] = 0;
    } else {
      const size = { Z: sizeZ, C: planeC, T: sizeT };
      const entries2 = ome.tiffData.length > 0 ? ome.tiffData : [{ attrs: {} }];
      const files = new Set(entries2.flatMap((td) => td.uuid === void 0 ? [] : [td.uuid]));
      if (files.size > 1) reject4("multi-file OME-TIFF is not supported");
      for (const td of entries2) {
        const a = td.attrs;
        const pos = { Z: intAttr(a, "FirstZ", 0), C: intAttr(a, "FirstC", 0), T: intAttr(a, "FirstT", 0) };
        if ("ZCT".split("").some((d) => pos[d] >= size[d])) reject4("TiffData starts outside the planes");
        let ifd = intAttr(a, "IFD", 0);
        let count = intAttr(a, "PlaneCount", entries2.length === 1 && a.IFD === void 0 ? planeIfd.length : 1, 1);
        while (count-- > 0) {
          planeIfd[plane(pos.T, pos.C, pos.Z)] = ifd++;
          let stepped = false;
          for (const d of order.slice(2)) {
            if (++pos[d] < size[d]) {
              stepped = true;
              break;
            }
            pos[d] = 0;
          }
          if (!stepped) break;
        }
      }
    }
    if (planeIfd.some((i) => i < 0 || i >= tiff.ifds.length)) reject4("OME-XML planes do not match the TIFF's images");
    const planes = planeIfd.map((i) => tiff.ifds[i]);
    const levels = [];
    if (ifd0.subIfds.length > 0) {
      const s = ifd0.subIfds.length;
      for (const p of planes) {
        if (p.subIfds.length < s) reject4(`the IFD at ${p.offset} has fewer SubIFDs than IFD 0`);
      }
      for (let k = -1; k < s; k++) levels.push(level(planes.map((p) => k < 0 ? p : p.subIfds[k])));
    } else {
      levels.push(level(planes));
      if (ome === void 0) {
        for (const ifd of tiff.ifds.slice(1)) {
          const prev = levels[levels.length - 1];
          if (!tiled(ifd) || !ifd.tags.has(Tag.BitsPerSample)) continue;
          checkSize(ifd);
          if (sameFormat(ifd, ifd0) && num(ifd, Tag.ImageWidth) < prev.width && num(ifd, Tag.ImageLength) < prev.height) {
            levels.push(level([ifd]));
          }
        }
      }
    }
    for (const l of levels) {
      if (!l.ifds.every((i) => sameFormat(i, ifd0))) reject4("pyramid levels differ in sample format or compression");
    }
    const contig = f.spp > 1 && f.planar === 1;
    const axes = [];
    const unit = (d) => physical(px, d) === void 0 ? void 0 : UNITS[px[`PhysicalSize${d}Unit`] ?? "\xB5m"];
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
    } else if (f.compression === JPEG) {
      if (f.bits !== 8 || f.sampleFormat !== 1 || !(f.spp === 1 || f.spp === 3 && f.planar === 1 && (f.photometric === 2 || f.photometric === 6))) {
        reject4(`unsupported JPEG: ${f.bits}-bit, ${f.spp} samples, planar ${f.planar}, photometric ${f.photometric}`);
      }
      codecs = [{ name: "imagecodecs_jpeg" }];
      codecName = "imagecodecs_jpeg";
    } else {
      const bytes = itemsize > 1 ? { name: "bytes", configuration: { endian: tiff.littleEndian ? "little" : "big" } } : { name: "bytes" };
      codecs = [bytes];
      if (f.compression === 8 || f.compression === 32946) {
        codecs.push({ name: "zlib", configuration: { level: 1 } });
        codecName = "zlib";
      } else if (f.compression === 5e4) {
        codecs.push({ name: "zstd", configuration: { level: 0, checksum: false } });
        codecName = "zstd";
      } else if (f.compression === 1) {
        codecName = "bytes";
      } else {
        return reject4(`unsupported compression ${f.compression}`);
      }
    }
    if (contig) {
      const stored = [...axes.keys()].filter((i) => i !== cAxis).concat([cAxis]);
      codecs.unshift({ name: "transpose", configuration: { order: stored } });
    }
    const sources = [{ url }];
    const entries = [];
    const meta = [];
    const utf83 = new TextEncoder();
    const json = (v) => utf83.encode(JSON.stringify(v, null, 2));
    const datasets = [];
    let references = 0;
    const shapes = [];
    const [base] = levels;
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
            const prefix2 = f.compression === JPEG ? jpegPrefix(ifd, f.spp, f.photometric) : void 0;
            const samples = f.spp > 1 && !contig ? f.spp : 1;
            if (offsets.length !== samples * perSample || counts.length !== samples * perSample) {
              reject4(`IFD at ${ifd.offset} has ${offsets.length} tiles, expected ${samples * perSample}`);
            }
            for (let s = 0; s < samples; s++) {
              for (let j = 0; j < perSample; j++) {
                const k = s * perSample + j;
                if (counts[k] === 0) continue;
                if (offsets[k] + counts[k] > fileSize) reject4(`tile ${k} of the IFD at ${ifd.offset} is outside the file`);
                const coords = [];
                if (sizeT > 1) coords.push(t);
                if (sizeC > 1) coords.push(f.spp > 1 ? contig ? 0 : s : c);
                if (sizeZ > 1) coords.push(z);
                coords.push(Math.floor(j / across), j % across);
                let ranges = [[offsets[k], counts[k]]];
                if (prefix2 !== void 0) {
                  if (counts[k] <= 2) reject4(`JPEG tile ${k} of the IFD at ${ifd.offset} is too short`);
                  ranges = [prefix2, [offsets[k] + 2, counts[k] - 2]];
                }
                if (payloadSize(ranges) > MAX_PAYLOAD4) reject4(`tile ${k}'s reference payload exceeds ${MAX_PAYLOAD4} bytes`);
                entries.push({
                  key: `${li}/c/${coords.join("/")}`,
                  ranges: ranges.map((r) => r instanceof Uint8Array ? { data: r } : { source: 0, offset: BigInt(r[0]), length: BigInt(r[1]) })
                });
                references++;
              }
            }
          }
        }
      }
      const scale = axes.map((a) => {
        if (a.name === "y") return (physical(px, "Y") ?? 1) * (base.height / l.height);
        if (a.name === "x") return (physical(px, "X") ?? 1) * (base.width / l.width);
        if (a.name === "z") return physical(px, "Z") ?? 1;
        return 1;
      });
      datasets.push({ path: String(li), coordinateTransformations: [{ type: "scale", scale }] });
    }
    const name = ome?.name || void 0;
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
    if (raw !== void 0) meta.push({ key: "OME/METADATA.ome.xml", bytes: raw.slice(), compress: true });
    return {
      sources,
      entries: [...entries, ...meta],
      summary: { name, axes: axes.map((a) => a.name), levels: shapes, references, codec: codecName }
    };
  }

  // src/image.ts
  var ImageError = class extends Error {
  };
  async function virtualizeImage(url, read, fileSize) {
    const head = await read(0, Math.min(8, fileSize));
    const order = String.fromCharCode(head[0], head[1]);
    if (order === "II" || order === "MM") {
      const first = await detectNdpi(read, fileSize);
      if (first !== void 0) return { format: "ndpi", ...await virtualizeNdpi(url, read, fileSize, first) };
      return { format: "tiff", ...await virtualizeTiff(url, read, fileSize) };
    }
    if (isNd2(head)) return { format: "nd2", ...await virtualizeNd2(url, read, fileSize) };
    throw new ImageError("not a TIFF or ND2 file");
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
  function parseRange(header2, size) {
    const m = header2?.match(/^bytes=(\d*)-(\d*)$/);
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
          const read = blockReader(file.read, file.size);
          const virtual = kind === "tiff" ? await virtualizeTiff(url, read, file.size) : await virtualizeImage(url, read, file.size);
          const bytes = await writeVzip(virtual);
          return {
            archive: await Archive.open(bytes, url, fetchRange),
            filename: `${stem.replace(/\.(ome\.tiff?|tiff?|nd2)$/i, "")}.vzip`
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
      const m = path.match(/^(image|tiff|archive)\/([^/]+)\/(.*)$/);
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
        if (e instanceof Nd2Error || e instanceof LVError) return response(422, `ND2: ${message}`);
        if (e instanceof ImageError) return response(422, message);
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
