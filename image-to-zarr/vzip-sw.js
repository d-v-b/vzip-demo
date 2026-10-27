"use strict";
(() => {
  // <define:__REFKV_PROFILES__>
  var define_REFKV_PROFILES_default = [{ name: "czi", title: "CZI", uuid: "7a0733c7-d4be-4482-a64f-6904d9354ea5", version: 0, kind: "file", sniff: 50, chosen_by: null, suffixes: [".czi"], reference: 20, source: "Zeiss CZI", inputs: "Zeiss CZI files (ZISRAW, file version 1), with uncompressed, JPEG, JPEG XR and Zstd subblocks, mosaics and pyramids", for: "Zeiss CZI files" }, { name: "dicom", title: "DICOM", uuid: "acf17198-e5a5-48d3-8187-22ec4bb40ea5", version: 0, kind: "file", sniff: 10, chosen_by: null, suffixes: [".dcm"], reference: 25, source: "DICOM", inputs: "DICOM Part 10 files with native or JPEG-encapsulated pixel data, including whole-slide images", for: "DICOM files, including whole-slide images" }, { name: "fits", title: "FITS", uuid: "4b0d3a7e-1c52-4f6a-9b8e-2d7f0c6a1e93", version: 0, kind: "file", sniff: 110, chosen_by: null, suffixes: [".fits", ".fz"], reference: null, source: "FITS", inputs: "FITS files: images, multi-extension files, binary and ASCII tables", for: "FITS images and tables (`.fits`, `.fz`)" }, { name: "flac", title: "FLAC", uuid: "e9108d07-b24b-432f-a8ce-09d80c8073b4", version: 0, kind: "file", sniff: 95, chosen_by: null, suffixes: [".flac"], reference: null, source: "FLAC (Free Lossless Audio Codec)", inputs: "FLAC files (`.flac`) of a fixed block size, with their metadata blocks and ID3v2 and ID3v1 tags; one sharded array of integer samples, not an image", for: "FLAC audio files, as a sharded array of samples (`.flac`)" }, { name: "ims", title: "IMS", uuid: "5067a535-8261-4b25-a93c-1985ed333bde", version: 0, kind: "file", sniff: 70, chosen_by: null, suffixes: [".ims"], reference: 25, source: "Imaris IMS", inputs: "Imaris IMS files (HDF5)", for: "Imaris `.ims` files" }, { name: "lif", title: "LIF", uuid: "b099ab1f-f9d4-4276-9006-9ff1193a34b2", version: 0, kind: "file", sniff: 55, chosen_by: null, suffixes: [".lif"], reference: null, source: "Leica LIF", inputs: "Leica LIF files (LAS X and LAS AF, versions 1 and 2): every image of the file's element tree, with interleaved or planar channels, z-stacks, time series and mosaics, uncompressed", for: "Leica LIF files (`.lif`)" }, { name: "mp3", title: "MP3", uuid: "b6cb0047-9448-4fdc-b03e-10dd3d6aa829", version: 0, kind: "file", sniff: 100, chosen_by: null, suffixes: [".mp3"], reference: null, source: "MP3 (MPEG Layer III audio)", inputs: "MPEG-1, MPEG-2 and MPEG-2.5 Layer III audio files (`.mp3`), with their ID3v2, ID3v1 and APE tags; one array of samples, not an image", for: "MP3 audio files, as an array of samples (`.mp3`)" }, { name: "mp4", title: "MP4", uuid: "bbe3f6b9-488d-4d8d-85ce-60a1649dd27e", version: 0, kind: "file", sniff: 85, chosen_by: null, suffixes: [".mp4", ".mov"], reference: null, source: "MP4 and QuickTime (H.264 video, AAC and MP3 audio)", inputs: "MP4 and QuickTime files (`.mp4`, `.m4a`, `.mov`) with H.264 video and AAC or MP3 audio tracks; a group per track, not an image", for: "MP4 and QuickTime video and audio, as arrays of planes and samples (`.mp4`, `.mov`)" }, { name: "mrc", title: "MRC", uuid: "2aacd010-2ed1-4748-bc3c-5dd5e840bbce", version: 0, kind: "file", sniff: 90, chosen_by: null, suffixes: [".mrc"], reference: null, source: "MRC2014", inputs: "MRC2014 files (CCP4 maps, image stacks, volumes and volume stacks)", for: "MRC2014 maps, image stacks, volumes and volume stacks (`.mrc`, `.map`)" }, { name: "mrc-dataset", title: "MRC dataset", uuid: "f139bf4e-7bab-4c3c-9b2d-66ba747f9b93", version: 0, kind: "layout", sniff: null, chosen_by: null, suffixes: [], reference: null, source: "MRC2014, as a dataset", inputs: "", for: "" }, { name: "n5", title: "N5", uuid: "ad5d4c39-c69e-48f7-a3ef-4cc8c607d416", version: 0, kind: "store", sniff: null, chosen_by: null, suffixes: [], reference: 25, source: "N5", inputs: "N5 containers, default-mode blocks", for: "N5 containers on S3" }, { name: "nd2", title: "ND2", uuid: "59612f14-e314-4207-ba00-8f422ba71490", version: 0, kind: "file", sniff: 20, chosen_by: null, suffixes: [".nd2"], reference: 20, source: "Nikon ND2", inputs: "Nikon ND2, format version 3 and later", for: "Nikon NIS-Elements ND2 files" }, { name: "ndpi", title: "NDPI", uuid: "6cac71ef-dbb2-4acd-b60c-00389aa4238a", version: 0, kind: "file", sniff: null, chosen_by: "tiff", suffixes: [".ndpi"], reference: 25, source: "Hamamatsu NDPI", inputs: "Hamamatsu NDPI slides, a TIFF variant with 64-bit offsets", for: "Hamamatsu NDPI whole-slide images" }, { name: "nifti", title: "NIfTI", uuid: "06e5809d-4d54-4b72-afd0-6bf61a7b4c85", version: 0, kind: "file", sniff: 60, chosen_by: null, suffixes: [".nii"], reference: 25, source: "NIfTI-1 and NIfTI-2", inputs: "NIfTI-1 and NIfTI-2 single files (`.nii`)", for: "NIfTI-1 and NIfTI-2 volumes (`.nii`)" }, { name: "nrrd", title: "NRRD", uuid: "23e0c600-8da6-40f1-81e7-ab246e948e88", version: 0, kind: "file", sniff: 95, chosen_by: null, suffixes: [".nhdr", ".nrrd"], reference: null, source: "NRRD (Teem)", inputs: "NRRD files (`.nrrd`) and detached headers with one data file (`.nhdr`), raw or gzip-encoded", for: "NRRD volumes, attached or detached, raw or gzip (`.nrrd`, `.nhdr`)" }, { name: "ome-zarr", title: "OME-Zarr", uuid: "b74ea302-65bb-49ae-b81f-f9bb52cd4eed", version: 0, kind: "store", sniff: null, chosen_by: null, suffixes: [], reference: 25, source: "OME-Zarr 0.4", inputs: "OME-Zarr 0.4 hierarchies on Zarr v2, migrated to OME-Zarr 0.5", for: "OME-Zarr 0.4 hierarchies, migrated to OME-Zarr 0.5 in place" }, { name: "qptiff", title: "QPTIFF", uuid: "329ea136-2f55-4c27-b6f4-8e60ca2109b8", version: 0, kind: "file", sniff: null, chosen_by: "tiff", suffixes: [".qptiff"], reference: null, source: "Akoya QPTIFF", inputs: "Akoya (PerkinElmer) Vectra QPTIFF slides and inForm component data, a TIFF with an XML description per image, in LZW, JPEG or uncompressed tiles or strips", for: "Akoya (PerkinElmer) Vectra multiplex scans and inForm component data" }, { name: "safe", title: "Sentinel-2 SAFE", uuid: "ef81346c-19e8-42ad-93b0-a279ccaf44c1", version: 0, kind: "both", sniff: 80, chosen_by: null, suffixes: [".zip"], reference: 25, source: "Sentinel-2 SAFE (Level-1C, Level-2A)", inputs: "Sentinel-2 Level-1C and Level-2A products: a `.SAFE` directory (a store) or a `.SAFE.zip` file", for: "Sentinel-2 Level-1C and Level-2A products, as a `.SAFE` directory or a `.SAFE.zip`" }, { name: "tiff", title: "TIFF", uuid: "48e9ac4e-1156-4a62-955e-20467d9c2700", version: 0, kind: "file", sniff: 40, chosen_by: null, suffixes: [".tif"], reference: 20, source: "TIFF, OME-TIFF, Aperio SVS", inputs: "TIFF and BigTIFF, including OME-TIFF and JPEG-tiled slides such as Aperio SVS", for: "OME-TIFF, plain TIFF (tiled or in strips), and JPEG-tiled slides such as Aperio SVS" }, { name: "vsi", title: "VSI", uuid: "c0a1d4e6-5b7f-4f3a-9c2d-8e1f6a7b3c45", version: 0, kind: "file", sniff: 30, chosen_by: null, suffixes: [".vsi"], reference: null, source: "Olympus VSI", inputs: "Olympus cellSens VSI slides: a `.vsi` file and the tile files beside it, probed by key (uncompressed, JPEG and JPEG 2000 tiles)", for: "Olympus cellSens whole-slide images (`.vsi` with its tile files)" }, { name: "zarr2", title: "Zarr v2", uuid: "8e792619-d671-4687-ab51-752885dd3ee6", version: 0, kind: "store", sniff: null, chosen_by: null, suffixes: [], reference: 25, source: "Zarr v2", inputs: "Zarr v2 hierarchies", for: "Zarr v2 hierarchies on S3" }];

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
      new Response(data).body.pipeThrough(stream)
    );
    return new Uint8Array(await out2.arrayBuffer());
  }
  function deflateRaw(data) {
    return transform(data, new CompressionStream("deflate-raw"));
  }
  async function inflateRaw(data, limit) {
    if (limit === void 0) return transform(data, new DecompressionStream("deflate-raw"));
    const reader = new Response(data).body.pipeThrough(new DecompressionStream("deflate-raw")).getReader();
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
    const out2 = [];
    let path = input;
    while (path !== "") {
      if (path.startsWith("../")) path = path.slice(3);
      else if (path.startsWith("./")) path = path.slice(2);
      else if (path.startsWith("/./")) path = path.slice(2);
      else if (path === "/.") path = "/";
      else if (path.startsWith("/../")) {
        path = path.slice(3);
        out2.pop();
      } else if (path === "/..") {
        path = "/";
        out2.pop();
      } else if (path === "." || path === "..") path = "";
      else {
        const i = path.indexOf("/", 1);
        const segment = i === -1 ? path : path.slice(0, i);
        path = i === -1 ? "" : path.slice(i);
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
  function inBrowser() {
    const g = globalThis;
    return g.document !== void 0 || g.WorkerGlobalScope !== void 0;
  }
  function fetchFailed(url2, e, browser = inBrowser()) {
    const message = `${url2}: ${e.message}`;
    if (!browser || !(e instanceof TypeError)) return message;
    return `${message}. A browser reports this for a server that does not allow cross-origin reads (no Access-Control-Allow-Origin header for this page) as well as for one it cannot reach`;
  }
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
      throw new HttpResolutionError(fetchFailed(url2, e));
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
      const values = encoding.split(",").map((v) => v.trim().toLowerCase());
      if (values.length !== 1 || values[0] !== "identity") {
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
  var SPEC_REVISION = 11;
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
  var isLarge = (h) => h.size >= U32_ALL || h.csize >= U32_ALL;
  function localHeader(h) {
    const large = isLarge(h);
    const extra = large ? le([[1, 2], [16, 2], [h.size, 8], [h.csize, 8]]) : new Uint8Array();
    return concat([
      le([
        [67324752, 4],
        [large ? 45 : 20, 2],
        [2048, 2],
        [h.method, 2],
        [0, 2],
        [33, 2],
        [h.crc, 4],
        [large ? U32_ALL : h.csize, 4],
        [large ? U32_ALL : h.size, 4],
        [h.name.length, 2],
        [extra.length, 2]
      ]),
      h.name,
      extra
    ]);
  }
  var bodyOffset = (h) => h.offset + 30 + h.name.length + (isLarge(h) ? 20 : 0);
  function centralRecord(h) {
    const large = isLarge(h);
    const farOffset = h.offset >= U32_ALL;
    const values = [];
    if (large) values.push([h.size, 8], [h.csize, 8]);
    if (farOffset) values.push([h.offset, 8]);
    const zip64 = values.length > 0 ? le([[1, 2], [8 * values.length, 2], ...values]) : new Uint8Array();
    const extra = concat([zip64, h.extra]);
    return concat([
      le([
        [33639248, 4],
        [20, 2],
        [zip64.length > 0 ? 45 : 20, 2],
        [2048, 2],
        [h.method, 2],
        [0, 2],
        [33, 2],
        [h.crc, 4],
        [large ? U32_ALL : h.csize, 4],
        [large ? U32_ALL : h.size, 4],
        [h.name.length, 2],
        [extra.length, 2],
        [0, 2],
        [0, 2],
        [0, 2],
        [0, 4],
        [farOffset ? U32_ALL : h.offset, 4]
      ]),
      h.name,
      extra
    ]);
  }
  function endRecords(at, count, cdOffset, cdSize, comment) {
    return concat([
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
      ]),
      le([[117853008, 4], [0, 4], [at, 8], [1, 4]]),
      le([
        [101010256, 4],
        [0, 2],
        [0, 2],
        [U16_ALL, 2],
        [U16_ALL, 2],
        [U32_ALL, 4],
        [U32_ALL, 4],
        [comment.length, 2]
      ]),
      comment
    ]);
  }
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
        if (e.compress && e.bytes.length >= U32_ALL) {
          reject(`${e.key}: an entry of 4 GiB or more must be STORED`);
        }
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
      const out2 = new Uint8Array(this.length);
      let at = 0;
      for (const c of this.chunks) {
        out2.set(c, at);
        at += c.length;
      }
      return out2;
    }
  };
  function concat(parts) {
    const out2 = new Out();
    for (const p of parts) out2.push(p);
    return out2.concat();
  }
  function le(fields2) {
    const size = fields2.reduce((n, [, w]) => n + w, 0);
    const out2 = new Uint8Array(size);
    const view = new DataView(out2.buffer);
    let at = 0;
    for (const [v, w] of fields2) {
      if (w === 2) view.setUint16(at, v, true);
      else if (w === 4) view.setUint32(at, v, true);
      else view.setBigUint64(at, BigInt(v), true);
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
        if (e.compress && body.length >= U32_ALL) {
          reject(`${e.key}: a DEFLATE body of 4 GiB or more would make a large entry that is not STORED`);
        }
        built.push({
          name: utf82.encode(e.key),
          method: e.compress ? 8 : 0,
          crc: crc32(e.bytes),
          size: e.bytes.length,
          csize: body.length,
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
          csize: body.length,
          body,
          extra,
          offset: 0
        });
      }
    }
    const table = encodeSourceTable(desc.sources, SPEC_REVISION);
    const tableBody = await deflateRaw(table);
    if (table.length >= U32_ALL || tableBody.length >= U32_ALL) reject("the source table reaches 4 GiB");
    const sources = {
      name: utf82.encode(SOURCES_KEY),
      method: 8,
      crc: crc32(table),
      size: table.length,
      csize: tableBody.length,
      body: tableBody,
      extra: new Uint8Array(),
      offset: 0
    };
    built.push(sources);
    const out2 = new Out();
    for (const b of built) {
      b.offset = out2.length;
      out2.push(localHeader(b));
      out2.push(b.body);
    }
    const cdOffset = out2.length;
    for (const b of built) out2.push(centralRecord(b));
    const cdSize = out2.length - cdOffset;
    const comment = new Uint8Array(22);
    comment.set(utf82.encode("vzip/0"));
    const view = new DataView(comment.buffer);
    view.setBigUint64(6, BigInt(bodyOffset(sources)), true);
    view.setBigUint64(14, BigInt(sources.csize), true);
    out2.push(endRecords(out2.length, built.length, cdOffset, cdSize, comment));
    return out2.concat();
  }

  // src/archive.ts
  var RefkvError = class extends Error {
    errorClass;
    constructor(errorClass, message) {
      super(`refkv ${errorClass} error: ${message}`);
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
    const path = url2.split(/[?#]/, 1)[0];
    return !/%(2[eEfF]|5[cC])/.test(path);
  }
  function parseIPv4(s) {
    const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return void 0;
    const parts = m.slice(1).map(Number);
    if (parts.some((p) => p > 255)) return void 0;
    return parts.reduce((a, p) => a << 8n | BigInt(p), 0n);
  }
  function parseIPv6(s) {
    let text4 = s.split("%", 1)[0];
    const tail = [];
    const dotted = text4.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) {
      const v4 = parseIPv4(dotted[2]);
      if (v4 === void 0) return void 0;
      tail.push(Number(v4 >> 16n), Number(v4 & 0xffffn));
      text4 = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1);
    }
    const halves = text4.split("::");
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
  function addressClass(address) {
    const v4 = parseIPv4(address);
    if (v4 !== void 0) return classOf(v4, 4);
    const v6 = address.includes(":") ? parseIPv6(address) : void 0;
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
    const local = schemeOf(base) === "file";
    const scheme = schemeOf(url2);
    if (policy.prefixes !== void 0) {
      if (!policy.prefixes.some((p) => matchesPrefix(url2, p))) {
        throw new RefkvError("resolution", `${url2}: not under an allowed URL prefix (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`);
      }
    } else if (scheme === "file") {
      if (!local && !policy.allowFilesFromRemoteArchives) {
        throw new RefkvError("resolution", `${url2}: an archive opened from a URL may not read local files (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`);
      }
    } else if (scheme !== "http" && !(policy.schemes ?? []).some((s) => schemeOf(`${s}:`) === scheme)) {
      throw new RefkvError("resolution", `${url2}: the scheme '${scheme}' is not allowed (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`);
    }
    if (scheme !== "http") return;
    const c = hostClass(url2);
    if (c !== void 0) checkClass(policy, url2, c);
  }
  function checkClass(policy, url2, c, address) {
    if (c === "public" || policy.allowPrivateHosts) return;
    const at = address === void 0 ? "" : ` (at ${address})`;
    throw new RefkvError(
      "resolution",
      `${url2}: the host${at} is a ${c} address, which the reader does not reach without allowPrivateHosts: true (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`
    );
  }
  function checkAddress(policy, url2, address) {
    const c = addressClass(address);
    if (c === void 0) throw new RefkvError("resolution", `${url2}: ${address} is not an IP address`);
    checkClass(policy, url2, c, address);
  }
  var MERGE_GAP = 1 << 16;
  var U32_ALL2 = 4294967295;
  var strictUtf82 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  function safe(v, what) {
    if (v > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new RefkvError("archive", `${what} is too large`);
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
    /**
     * The spec revision the writer followed, if the archive records one (spec §1.3
     * <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#13-versioning>).
     */
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
      this.netFetch = policy.allowPrivateHosts ? void 0 : checkedFetch((url2, address) => checkAddress(policy, url2, address), policy);
    }
    /**
     * Opens an archive (spec §6.1
     * <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#61-opening>); `baseUrl` resolves
     * relative `url` sources.
     * `policy` (spec §6.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)
     * defaults to `DEFAULT_POLICY`, which allows http(s)
     * sources on public hosts, and for a local archive also `file` sources and
     * loopback and private hosts.
     */
    static async open(bytes, baseUrl, fetchRange = (url2, start, end, pins, options) => readHttpRange(url2, start, end, pins, void 0, options), policy = {}) {
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
      if (eocd < 0) throw new RefkvError("archive", "not a vzip archive");
      const comment = bytes.subarray(eocd + 22);
      const magic = new TextDecoder().decode(comment.subarray(0, 6));
      if (!magic.startsWith("vzip/")) {
        throw new RefkvError("archive", "not a vzip archive");
      }
      if (magic !== "vzip/0") {
        throw new RefkvError("archive", `unsupported version ${magic}`);
      }
      const loc = eocd - 20;
      if (loc < 0 || view.getUint32(loc, true) !== 117853008) {
        throw new RefkvError("archive", "no zip64 locator before the end of central directory record");
      }
      const at64 = safe(view.getBigUint64(loc + 8, true), "zip64 record offset");
      if (at64 + 56 > n || view.getUint32(at64, true) !== 101075792 || view.getBigUint64(at64 + 4, true) !== 44n) {
        throw new RefkvError("archive", "invalid zip64 end of central directory");
      }
      const cdSize = view.getBigUint64(at64 + 40, true);
      const cdOffset = view.getBigUint64(at64 + 48, true);
      const cdStart = safe(cdOffset, "central directory offset");
      const cdEnd = cdStart + safe(cdSize, "central directory size");
      if (cdEnd > n) throw new RefkvError("archive", "central directory outside the file");
      const entries = /* @__PURE__ */ new Map();
      let at = cdStart;
      while (at < cdEnd) {
        if (at + 46 > cdEnd || view.getUint32(at, true) !== 33639248) {
          throw new RefkvError("archive", `bad central directory record at ${at}`);
        }
        const flags = view.getUint16(at + 8, true);
        const method = view.getUint16(at + 10, true);
        let csize = view.getUint32(at + 20, true);
        let size = view.getUint32(at + 24, true);
        const nameLen = view.getUint16(at + 28, true);
        const extraLen = view.getUint16(at + 30, true);
        const commentLen = view.getUint16(at + 32, true);
        let offset = view.getUint32(at + 42, true);
        const end = at + 46 + nameLen + extraLen + commentLen;
        if (end > cdEnd) throw new RefkvError("archive", "truncated central directory");
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
        if (entries.has(key)) throw new RefkvError("archive", `duplicate key ${key}`);
        const entry = { key, method, csize, size, bodyOffset: 0 };
        entries.set(key, entry);
        const blocks = parseExtra(extra, view, extraStart);
        const refs = blocks?.filter((b) => b.id === RANGE_ID || b.id === CONCAT_ID) ?? [];
        const zip64 = blocks?.filter((b) => b.id === 1) ?? [];
        const large = size === U32_ALL2 && csize === U32_ALL2;
        const need = (large ? 16 : 0) + (offset === U32_ALL2 ? 8 : 0);
        if (blocks === void 0) entry.error = "unparseable extra field";
        else if (refs.length > 1) entry.error = "more than one reference block";
        else if (zip64.length > 1) entry.error = "more than one zip64 block";
        else if (size === U32_ALL2 !== (csize === U32_ALL2)) {
          entry.error = "exactly one size field is 0xFFFFFFFF";
        } else if (need > 0) {
          if (zip64.length === 0 || zip64[0].data.length < need) {
            entry.error = "zip64 block missing or too short";
          } else {
            const z = new DataView(zip64[0].data.buffer, zip64[0].data.byteOffset, need);
            if (large) {
              size = safe(z.getBigUint64(0, true), "entry size");
              csize = safe(z.getBigUint64(8, true), "entry size");
            }
            if (offset === U32_ALL2) offset = z.getBigUint64(large ? 16 : 0, true);
          }
        }
        if (entry.error === void 0 && method !== 0 && method !== 8) {
          entry.error = `compression method ${method}`;
        } else if (entry.error === void 0 && flags & 1) {
          entry.error = "encrypted";
        } else if (entry.error === void 0 && large && method !== 0) {
          entry.error = "large entry is not STORED";
        }
        if (entry.error === void 0 && refs.length === 1) {
          if (method !== 0) entry.error = "reference entry with method 8";
          else if (large) entry.error = "reference entry is large";
          entry.reference = { headerId: refs[0].id, payload: refs[0].data };
        }
        entry.size = size;
        entry.csize = csize;
        entry.bodyOffset = (typeof offset === "bigint" ? Number(offset) : offset) + 30 + nameLen + (large ? 20 : 0);
      }
      const cview = new DataView(comment.buffer, comment.byteOffset, comment.byteLength);
      const sOffset = safe(cview.getBigUint64(6, true), "sources offset");
      const sSize = safe(cview.getBigUint64(14, true), "sources size");
      if (sOffset + sSize > n) throw new RefkvError("archive", "source table outside the file");
      let table;
      try {
        table = decodeTable(
          await inflateRaw(bytes.subarray(sOffset, sOffset + sSize), rules.maxFormatEntry)
        );
      } catch (e) {
        const why = e instanceof InflateLimitError ? `${e.message}; this reader allows ${rules.maxFormatEntry} (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)` : e.message;
        throw new RefkvError("archive", `source table: ${why}`);
      }
      if (table.sources.length > rules.maxSources) {
        throw new RefkvError(
          "archive",
          `the source table has ${table.sources.length} sources; this reader allows ${rules.maxSources}`
        );
      }
      return new _Archive(bytes, baseUrl, table.sources, entries, fetchRange, rules, table.revision);
    }
    /**
     * The visible entry for `key`, or undefined (spec §6.2
     * <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#62-operations>).
     */
    lookup(key) {
      if (key.startsWith("__vz__/")) return void 0;
      const entry = this.entries.get(key);
      if (entry?.error !== void 0) {
        throw new RefkvError("entry", `${JSON.stringify(key)}: ${entry.error}`);
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
        throw new RefkvError("payload", `${JSON.stringify(entry.key)}: ${e.message}`);
      }
    }
    /** Size of an entry's value. */
    size(entry) {
      if (entry.reference === void 0) return entry.size;
      const total = this.ranges(entry).reduce((n, r) => n + rangeSize(r), 0n);
      if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new RefkvError("request", "value is too large for this reader");
      }
      return Number(total);
    }
    async body(entry) {
      const end = entry.bodyOffset + entry.csize;
      if (end > this.bytes.length) {
        throw new RefkvError("body", `${entry.key}: body outside the file`);
      }
      const stored = this.bytes.subarray(entry.bodyOffset, end);
      let body = stored;
      if (entry.method === 8) {
        try {
          body = await inflateRaw(stored, entry.size);
        } catch (e) {
          throw new RefkvError("body", `${entry.key}: ${e.message}`);
        }
      } else if (entry.csize !== entry.size) {
        throw new RefkvError("body", `${entry.key}: STORED sizes differ`);
      }
      if (body.length !== entry.size) {
        throw new RefkvError("body", `${entry.key}: inflates to ${body.length} bytes`);
      }
      return body;
    }
    async source(r) {
      const s = this.sources[r.source];
      const start = r.offset;
      const end = r.offset + r.length;
      const fail = (m) => {
        throw new RefkvError("resolution", `source ${r.source}: ${m}`);
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
        const { data, size, hidden } = await this.fetchRange(
          url2,
          safe(start, "offset"),
          safe(end, "end"),
          s,
          {
            allow: (u) => checkPolicy(this.policy, this.baseUrl, u),
            unverifiablePins: this.policy.unverifiablePins,
            ...this.netFetch ? { fetch: this.netFetch } : {}
          }
        );
        const unseen = size === void 0 && hidden === true && this.policy.unverifiablePins;
        if (s.size !== void 0 && !unseen && BigInt(size ?? -1) !== s.size) {
          fail(
            size === void 0 ? `${url2}: the archive pins the size ${s.size}, which the response does not give` : `${url2}: the source is ${size} bytes, but the archive pins ${s.size}: the source changed since the archive was written`
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
        throw new RefkvError("request", `range [${start}, ${end}) of a ${size}-byte value`);
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
        throw new RefkvError(
          "request",
          `the value needs ${runs.length} reads; this reader allows ${this.policy.maxReads} (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`
        );
      }
      for (const run of runs) {
        run.data = this.source({ source: run.source, offset: run.offset, length: run.end - run.offset });
      }
      const whole2 = await Promise.all(
        parts.map(async (p) => {
          if (p instanceof Promise) return p;
          const run = runOf.get(p);
          const from = Number(p.offset - run.offset);
          return (await run.data).subarray(from, from + Number(p.length));
        })
      );
      const chunks = whole2.map((data, i) => {
        const { lo, hi, crc } = cuts[i];
        if (crc !== void 0 && crc32c(data) !== crc) {
          throw new RefkvError(
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

  // src/zarrify/profiles_bundled.ts
  var REGISTRY = define_REFKV_PROFILES_default;

  // src/zarrify/profiles.ts
  var REGISTRY2 = REGISTRY;
  var FILE_FORMATS = new Set(
    REGISTRY2.filter((e) => e.kind === "file" || e.kind === "both").map((e) => e.name)
  );

  // src/zarrify/common.ts
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
    return async (offset, length) => {
      if (offset < 0 || offset + length > fileSize) {
        throw new ImageError(`read of [${offset}, ${offset + length}) outside the ${fileSize}-byte file`);
      }
      const out2 = new Uint8Array(length);
      const first = Math.floor(offset / blockSize);
      const last = Math.floor((offset + Math.max(length, 1) - 1) / blockSize);
      const parts = await Promise.all(
        Array.from({ length: last - first + 1 }, (_, k) => block(first + k))
      );
      for (const [k, data] of parts.entries()) {
        const start = (first + k) * blockSize;
        const a = Math.max(offset, start);
        const b = Math.min(offset + length, start + data.length);
        if (a < b) out2.set(data.subarray(a - start, b - start), a - offset);
      }
      return out2;
    };
  }
  var PROFILES = Object.fromEntries(
    REGISTRY2.map((e) => [e.name, [e.uuid, e.version, e.title]])
  );
  var UUIDS = new Set(Object.values(PROFILES).map(([uuid]) => uuid));
  var MAX_CHUNK = 2 ** 24;
  var MAX_PADDING = 2 ** 16 - 2 ** 10;
  var SMALL_PADDING = 2 ** 10;
  var MAX_TOTAL_PADDING = 2 ** 20;
  var RAGGED_CHUNK = 2 ** 20;

  // src/zarrify/ir/wasm_browser.ts
  var url;
  var given;
  async function compileIr() {
    if (given !== void 0) return given;
    const at = url ?? new URL("refkv_ir.wasm", globalThis.location?.href);
    const response2 = await fetch(at);
    if (!response2.ok) throw new Error(`cannot fetch the IR core's wasm module ${String(at)}: HTTP ${response2.status}`);
    if ((response2.headers.get("Content-Type") ?? "").split(";")[0].trim() === "application/wasm") {
      return WebAssembly.compileStreaming(response2);
    }
    return WebAssembly.compile(await response2.arrayBuffer());
  }

  // src/zarrify/ir/wasm.ts
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
  function put(w, bytes) {
    const p = w.vz_alloc(bytes.length) >>> 0;
    new Uint8Array(w.memory.buffer, p, bytes.length).set(bytes);
    return p;
  }
  function out(w, n) {
    return new Uint8Array(w.memory.buffer, w.vz_out() >>> 0, n).slice();
  }

  // src/zarrify/ir/run.ts
  var utf83 = new TextEncoder();
  var text = (b) => new TextDecoder().decode(b);
  function rejection(w, r) {
    return new ImageError(text(out(w, -r)));
  }
  async function zarrifyIr(format, url2, source, options = {}) {
    const w = await ir();
    const f = utf83.encode(format);
    const made = Number(w.vz_run_new(put(w, f), f.length, BigInt(source.size), source.remote ? 1 : 0, source.concurrency));
    if (made < 0) throw rejection(w, made);
    const p = made;
    let live = true;
    try {
      if (!source.multirange) w.vz_run_multirange(p, 0);
      const settings = source.planner;
      if (settings) w.vz_run_settings(p, settings.byteCost ?? -1, BigInt(settings.wholeBelow ?? 1 << 20));
      const head = source.head;
      if (head !== void 0 && head.data.length > 0) {
        w.vz_run_seed(p, BigInt(head.offset), put(w, head.data), head.data.length);
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
      const u = utf83.encode(url2);
      const flags = (options.mirror === false ? 0 : 1) | (options.checksums ? 2 : 0);
      const n = Number(w.vz_run_output(p, put(w, u), u.length, flags));
      if (n < 0) throw rejection(w, n);
      const o = decodeOutput(out(w, n));
      return { format: o.summary.format ?? format, ...o };
    } finally {
      if (live) w.vz_run_free(p);
    }
  }
  function decodeRequests(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let at = 0;
    const u32 = () => (at += 4, v.getUint32(at - 4, true));
    const u64 = () => (at += 8, Number(v.getBigUint64(at - 8, true)));
    const reqs = [];
    for (let k = u32(); k > 0; k--) {
      const spans = [];
      for (let n = u32(); n > 0; n--) spans.push([u64(), u64()]);
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
  function decodeRaw(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let at = 0;
    const u8 = () => v.getUint8(at++);
    const u32 = () => (at += 4, v.getUint32(at - 4, true));
    const u64 = () => (at += 8, v.getBigUint64(at - 8, true));
    const bytes = () => {
      const n = u32();
      at += n;
      return b.slice(at - n, at);
    };
    const str = () => text(bytes());
    if (text(b.subarray(0, 4)) !== "VZO1") throw new Error("not an output of the IR core");
    at = 4;
    const url2 = str();
    const summary = JSON.parse(str());
    const lazy = [];
    for (let n = u32(); n > 0; n--) lazy.push(str());
    const data = [];
    for (let n = u32(); n > 0; n--) data.push(bytes());
    const entries = [];
    for (let n = u32(); n > 0; n--) entries.push([str(), bytes()]);
    const refs = [];
    for (let n = u32(); n > 0; n--) {
      const key = str();
      const parts = [];
      for (let m = u32(); m > 0; m--) {
        const tag = u8();
        if (tag === 0) parts.push({ kind: 0, offset: u64(), length: u64() });
        else if (tag === 1) parts.push({ kind: 1, source: u32(), offset: u64(), length: u64() });
        else if (tag === 2) parts.push({ kind: 2, data: bytes() });
        else if (tag === 3) parts.push({ kind: 3, key: str(), offset: u64(), length: u64() });
        else throw new Error(`unknown part kind ${tag} in the IR core's output`);
      }
      refs.push([key, parts]);
    }
    if (at !== b.length) throw new Error("trailing bytes in the IR core's output");
    return { url: url2, summary, lazy, data, entries, refs };
  }
  function bytesEntry(key, value, lazy) {
    const document = key === "zarr.json" || key.endsWith("/zarr.json");
    const compress = !document || lazy.some((prefix2) => key.startsWith(prefix2));
    return compress ? { key, bytes: value, compress } : { key, bytes: value };
  }
  function decodeOutput(b) {
    const raw = decodeRaw(b);
    const sources = [{ url: raw.url }, ...raw.data.map((data) => ({ data }))];
    const entries = raw.entries.map(([key, value]) => bytesEntry(key, value, raw.lazy));
    for (const [key, parts] of raw.refs) {
      const ranges = parts.map((p) => {
        if (p.kind === 0) return { source: 0, offset: p.offset, length: p.length };
        if (p.kind === 1) return { source: p.source, offset: p.offset, length: p.length };
        if (p.kind === 2) return { data: p.data };
        throw new Error("a reference to a store's object in a file's output");
      });
      entries.push({ key, ranges });
    }
    return { sources, entries, summary: raw.summary };
  }

  // src/zarrify/ir/source.ts
  function readerSource(read, size, options = {}) {
    return {
      size,
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
  var NoResponse = class extends Error {
    error;
    constructor(error) {
      super(error.message);
      this.error = error;
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
    /** The options this source was opened with: a file beside it (a VSI slide's tile files,
     * ir/vsi.ts) is opened with the same policy, headers and limits. */
    options;
    constructor(url2, options = {}) {
      this.url = url2;
      this.options = options;
      const policy = options.policy ?? {};
      this.at = url2;
      this.concurrency = options.concurrency ?? 6;
      this.multirange = options.multirange ?? isNode;
      if (options.planner) this.planner = options.planner;
      this.attempts = options.attempts ?? 6;
      this.baseDelay = options.baseDelay ?? 0.5;
      this.headers = options.headers ?? {};
      this.signal = options.signal;
      const allow = (u) => {
        try {
          checkHttpUrl(u);
        } catch (e) {
          throw new RefkvError("resolution", e.message);
        }
        checkPolicy(policy, url2, u);
      };
      const checked = policy.allowPrivateHosts ? void 0 : checkedFetch((u, address) => {
        try {
          checkAddress(policy, u, address);
        } catch (e) {
          this.refusals.add(e.message);
          throw e;
        }
      }, policy);
      this.send = async (u, headers, signal, cache = "no-store") => {
        const response2 = checked ? await checked(u, { headers, signal }, allow) : await fetch(u, { headers, signal, redirect: "follow", cache });
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
        if (e instanceof RefkvError || e instanceof HttpResolutionError) throw e;
        if (this.refusals.has(e.message)) throw new RefkvError("resolution", e.message);
        (signal ?? this.signal)?.throwIfAborted();
        if (e instanceof TypeError || typeof e.code === "string") throw new NoResponse(e);
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
          if (e instanceof RefkvError || e instanceof HttpResolutionError || e.name === "AbortError") throw e;
          const last = attempt >= this.attempts - 1;
          if (e instanceof Transient) {
            if (last) throw new HttpResolutionError(`${this.url}: HTTP ${e.status} after ${this.attempts} attempts`);
            await this.wait(attempt, e.retryAfter);
          } else {
            if (last) {
              if (e instanceof NoResponse) throw new HttpResolutionError(`${fetchFailed(this.url, e.error)}${causeOf(e.error)}`);
              throw new HttpResolutionError(`${this.url}: ${e.message}${causeOf(e)}`);
            }
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
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 120) * 1e3));
    }
    async read(offset, length) {
      if (length === 0) return new Uint8Array();
      const h = this.head;
      if (h && offset >= h.offset && offset + length <= h.offset + h.data.length) {
        return h.data.subarray(offset - h.offset, offset - h.offset + length);
      }
      return this.single(offset, offset + length);
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
        if (e instanceof RefkvError || e instanceof HttpResolutionError || e.name === "AbortError") throw e;
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
      return Promise.reject(new RefkvError("resolution", e.message));
    }
    if (!/^https?:/i.test(url2)) return Promise.reject(new RefkvError("resolution", `${url2}: not an http(s) URL`));
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
  var latin1 = (b) => Array.from(b, (c) => String.fromCharCode(c)).join("");
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
      for (const line of latin1(body.subarray(k + sep.length, headEnd)).split("\r\n")) {
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

  // src/zarrify/store.ts
  var StoreError = class extends Error {
    /** The store format that refused the input, once one was chosen (the Rust core's store run:
     * `zarr2`, or `ome-zarr` once its 0.4 test passed); none for a rejection before that. */
    format;
    constructor(message, format) {
      super(message);
      if (format !== void 0) this.format = format;
    }
  };
  var StoreLimitError = class extends Error {
  };
  var StoreReadError = class extends Error {
  };
  var reject2 = (message) => {
    throw new StoreError(message);
  };
  var MAX_SAFE = Number.MAX_SAFE_INTEGER;
  var MAX_DOCUMENT = 1 << 24;
  var MAX_DEPTH = 256;
  var MAX_OBJECTS = 1e5;
  var SPLIT2 = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;
  var UNRESERVED2 = /[A-Za-z0-9\-._~]/;
  var PATH_SAFE = /[A-Za-z0-9\-._~!$&'()*+,;=:@/]/;
  var utf84 = new TextEncoder();
  function pct(s, safe2) {
    let out2 = "";
    for (const b of utf84.encode(s)) {
      const c = String.fromCharCode(b);
      out2 += b < 128 && safe2.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
    }
    return out2;
  }
  function objectUrl(storeUrl, key) {
    return storeUrl + pct(key, PATH_SAFE);
  }
  function queryEncode(s) {
    return pct(s, UNRESERVED2);
  }
  function checkStoreUrl(url2) {
    const m = url2.match(SPLIT2);
    if (!isUriReference(url2) || m === null) reject2(`${JSON.stringify(url2)} is not a valid URI`);
    const [, scheme, authority, path, query, fragment] = m;
    if (scheme === void 0 || !["http", "https"].includes(scheme.toLowerCase())) {
      reject2(`store URL ${url2} is not http or https`);
    }
    if (authority === void 0 || authority.includes("@")) reject2(`store URL ${url2} has no authority, or has userinfo`);
    if (query !== void 0 || fragment !== void 0) reject2(`store URL ${url2} has a query or a fragment`);
    if (!path.endsWith("/")) reject2(`store URL ${url2} does not end in /`);
    return [scheme, authority, path];
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
    const [scheme, authority, path] = checkStoreUrl(url2);
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
      prefixPath = path.slice(1);
    } else {
      if (path === "/") reject2(`path-style store URL ${url2} names no bucket`);
      const rest = path.slice(1);
      const i = rest.indexOf("/");
      const bucket = rest.slice(0, i);
      if (bucket === "") reject2(`path-style store URL ${url2} has an empty bucket`);
      endpoint = `${scheme}://${authority}/${bucket}/`;
      prefixPath = rest.slice(i + 1);
    }
    let prefix2 = "";
    try {
      prefix2 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(percentDecode(prefixPath));
    } catch {
      reject2(`the key prefix of ${url2} is not UTF-8`);
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
      if (++this.depth > MAX_DEPTH) this.fail(`elements nest more than ${MAX_DEPTH} deep`);
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
            const value = [];
            for (; ; ) {
              value.push(this.chardata(q));
              if (this.at("&")) value.push(this.reference());
              else if (this.at(q)) {
                this.pos++;
                break;
              } else this.fail("bad attribute value");
            }
            el.attributes.push([name, value.join("")]);
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
  function text2(el) {
    if (el.children.length) reject2(`listing: <${el.name}> has a child element`);
    return el.text.join("");
  }
  function parseListing(body, prefix2) {
    let s = "";
    try {
      s = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body);
    } catch {
      reject2("listing is not UTF-8");
    }
    const root = new Xml(s).document();
    if (root.name !== "ListBucketResult") reject2(`listing root element is <${root.name}>, not <ListBucketResult>`);
    const truncated = root.children.filter((c) => c.name === "IsTruncated");
    if (truncated.length !== 1 || !["true", "false"].includes(text2(truncated[0]))) {
      reject2("listing needs exactly one IsTruncated of true or false");
    }
    const tokens = root.children.filter((c) => c.name === "NextContinuationToken");
    if (tokens.length > 1) reject2("listing has more than one NextContinuationToken");
    const token = tokens.length ? text2(tokens[0]) : void 0;
    const objects = [];
    for (const c of root.children) {
      if (c.name !== "Contents") continue;
      const keys = c.children.filter((x) => x.name === "Key");
      const sizes = c.children.filter((x) => x.name === "Size");
      if (keys.length !== 1 || sizes.length !== 1) reject2("listing Contents needs exactly one Key and one Size");
      const key = text2(keys[0]);
      const size = text2(sizes[0]);
      if (!/^[0-9]+$/.test(size) || size.replace(/^0+/, "").length > 16 || Number(size) > MAX_SAFE) {
        reject2(`listing Size ${JSON.stringify(size.slice(0, 40))} is not a size`);
      }
      if (!key.startsWith(prefix2)) reject2(`listed key ${JSON.stringify(key)} is outside the prefix ${JSON.stringify(prefix2)}`);
      objects.push([key, Number(size)]);
    }
    if (text2(truncated[0]) === "true") {
      if (!token) reject2("truncated listing without a NextContinuationToken");
      if (objects.length === 0) reject2("truncated listing without a Contents");
      return { objects, token };
    }
    return { objects };
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
  function folderMarker(rel, size) {
    return size === 0 && (rel === "" || rel.endsWith("/"));
  }
  var CONCURRENCY = 16;
  var PREFETCH_BYTES = 64 << 20;
  function closeStore(store) {
    store.prefetch?.close();
  }
  function addListed(store, listed, prefix2, seen) {
    store.ignored ??= [];
    store.folders ??= [];
    for (const [key, size] of listed) {
      if (seen.has(key)) reject2(`key ${JSON.stringify(key)} is listed twice`);
      seen.add(key);
      const rel = key.slice(prefix2.length);
      if (!ignored(rel)) store.objects.set(rel, size);
      else if (!folderMarker(rel, size)) store.ignored.push(rel);
      else if (rel && !ignored(rel.slice(0, -1))) store.folders.push(rel);
    }
    store.listed = seen.size;
  }
  function allowStoreUrl(policy, base, url2) {
    try {
      checkHttpUrl(url2);
    } catch (e) {
      throw new RefkvError("resolution", e.message);
    }
    checkPolicy(policy, base, url2);
  }
  function storeFetch(base, policy = {}, headers = {}, check = (u, address) => checkAddress(policy, u, address)) {
    const allow = (u) => allowStoreUrl(policy, base, u);
    const refusals = /* @__PURE__ */ new Set();
    const checked = policy.allowPrivateHosts ? void 0 : checkedFetch((u, address) => {
      try {
        check(u, address);
      } catch (e) {
        refusals.add(e.message);
        throw e;
      }
    }, policy);
    return async (u, init = {}) => {
      allow(u);
      const h = { ...headers, ...init.headers };
      let r;
      try {
        r = checked ? await checked(u, { headers: h, ...init.signal ? { signal: init.signal } : {} }, allow) : await fetch(u, { cache: h.Range === void 0 ? "default" : "no-store", ...init, headers: h, redirect: "follow" });
      } catch (e) {
        if (e instanceof RefkvError || e.name === "AbortError") throw e;
        const message = e.message;
        if (refusals.has(message)) throw new RefkvError("resolution", message);
        if (!checked || e instanceof TypeError || typeof e.code === "string") throw e;
        throw new RefkvError("resolution", `${u}: ${message}`);
      }
      if (r.redirected) {
        try {
          allow(r.url);
        } catch (e) {
          await r.body?.cancel();
          throw e;
        }
      }
      return r;
    };
  }
  async function openHttpStore(url2, { fetch: given2, policy = {}, headers = {}, maxObjects = MAX_OBJECTS, concurrency = CONCURRENCY } = {}) {
    const allow = (u) => allowStoreUrl(policy, url2, u);
    const send = given2 ?? storeFetch(url2, policy, headers);
    const f = async (u, init) => {
      allow(u);
      const r = await send(u, init);
      if (r.redirected) {
        try {
          allow(r.url);
        } catch (e) {
          await r.body?.cancel();
          throw e;
        }
      }
      return r;
    };
    const [endpoint, prefix2] = listingEndpoint(url2);
    const store = {
      url: url2,
      objects: /* @__PURE__ */ new Map(),
      listed: 0,
      requests: 0,
      concurrency,
      async read(key) {
        const size = this.objects.get(key);
        if (size === 0) return new Uint8Array(0);
        const u = objectUrl(url2, key);
        let r;
        try {
          r = await f(u, { headers: { Range: `bytes=0-${size - 1}` } });
        } catch (e) {
          if (e instanceof RefkvError) throw e;
          throw new StoreReadError(`${u}: ${e.message}`);
        }
        if (r.status !== 200 && r.status !== 206) throw new StoreReadError(`${u}: HTTP ${r.status}`);
        const data = new Uint8Array(await r.arrayBuffer());
        if (data.length !== size) throw new StoreReadError(`${u}: read ${data.length} bytes, the listing says ${size}`);
        return data;
      },
      async readRange(key, offset, length) {
        if (length === 0) return new Uint8Array(0);
        const u = objectUrl(url2, key);
        let r;
        try {
          r = await f(u, { headers: { Range: `bytes=${offset}-${offset + length - 1}` } });
        } catch (e) {
          if (e instanceof RefkvError) throw e;
          throw new StoreReadError(`${u}: ${e.message}`);
        }
        if (r.status !== 206 && !(r.status === 200 && offset === 0)) throw new StoreReadError(`${u}: HTTP ${r.status}`);
        const data = new Uint8Array(await r.arrayBuffer());
        if (data.length !== length) throw new StoreReadError(`${u}: read ${data.length} bytes at ${offset}, not ${length}`);
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
        if (e instanceof RefkvError) throw e;
        throw new StoreReadError(`${endpoint + q}: ${e.message}`);
      }
      if (r.status === 408 || r.status === 429 || r.status >= 500) {
        throw new StoreReadError(`${endpoint + q}: HTTP ${r.status}`);
      }
      if (r.status !== 200) reject2(`the store has no listing: ${endpoint + q} answered HTTP ${r.status}`);
      const listing = parseListing(new Uint8Array(await r.arrayBuffer()), prefix2);
      addListed(store, listing.objects, prefix2, seen);
      if (store.listed > maxObjects) throw new StoreLimitError(`the store lists more than ${maxObjects} objects`);
      token = listing.token;
      if (token === void 0) break;
      if (tokens.has(token)) reject2(`the listing gives the continuation token ${JSON.stringify(token.slice(0, 80))} again`);
      tokens.add(token);
    }
    return store;
  }
  function chooseProfile(store) {
    if (store.objects.has(".zarray") || store.objects.has(".zgroup")) return "zarr2";
    if (store.objects.has("attributes.json")) return "n5";
    if (store.objects.has("manifest.safe")) return "safe";
    return reject2(
      "not an N5, Zarr v2 or SAFE store: the root has no .zarray, .zgroup, attributes.json or manifest.safe"
    );
  }
  var MAX_BLOCK = 2 ** 31 - 1;

  // src/zarrify/ir/store.ts
  var utf85 = new TextEncoder();
  var text3 = (b) => new TextDecoder().decode(b);
  function rejection2(w, r, format) {
    return new StoreError(text3(out(w, -r)), format);
  }
  async function zarrifyStoreIr(format, store, options = {}) {
    const w = await ir();
    await store.prefetch?.drain();
    const listing = [...store.objects].sort((a, b) => compareKeys(a[0], b[0]));
    const f = utf85.encode(format);
    const l = utf85.encode(JSON.stringify(listing));
    const concurrency = Math.max(1, options.concurrency ?? store.concurrency ?? 1);
    const made = Number(w.vz_store_new(put(w, f), f.length, put(w, l), l.length, concurrency));
    if (made < 0) throw rejection2(w, made, format);
    const p = made;
    let live = true;
    try {
      const ig = utf85.encode(JSON.stringify([store.ignored ?? [], store.folders ?? []]));
      const g = Number(w.vz_store_ignore(p, put(w, ig), ig.length));
      if (g < 0) throw rejection2(w, g, format);
      for (; ; ) {
        const n2 = Number(w.vz_store_poll(p));
        if (n2 < 0) throw rejection2(w, n2, format);
        if (n2 === 0) break;
        const reqs = decodeRequests2(out(w, n2 - 1));
        if (reqs.length === 0) {
          const keys = JSON.parse(text3(out(w, Number(w.vz_store_probes(p)))));
          for (const key of keys) {
            const size = store.probe ? await store.probe(key) : store.objects.get(key);
            const r = Number(w.vz_store_found(p, BigInt(size ?? -1)));
            if (r < 0) throw rejection2(w, r, format);
            if (size !== void 0) {
              listing.push([key, size]);
              store.objects.set(key, size);
            }
          }
          continue;
        }
        await perform2(w, p, store, listing, reqs, concurrency, format);
      }
      const said = text3(out(w, Number(w.vz_store_profile(p))));
      const decided = said === "ome-zarr" || said === format ? said : format;
      live = false;
      const u = utf85.encode(store.url);
      const n = Number(w.vz_store_output(p, put(w, u), u.length, options.mirror === false ? 0 : 1));
      if (n < 0) throw rejection2(w, n, decided);
      const raw = decodeRaw(out(w, n));
      return { ...storeDesc(raw, new Map(listing)), summary: { ...raw.summary, listingRequests: store.requests } };
    } finally {
      if (live) w.vz_store_free(p);
    }
  }
  function decodeRequests2(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let at = 0;
    const u32 = () => (at += 4, v.getUint32(at - 4, true));
    const u64 = () => (at += 8, Number(v.getBigUint64(at - 8, true)));
    const reqs = [];
    for (let k = u32(); k > 0; k--) {
      const object = u32();
      const spans = [];
      for (let n = u32(); n > 0; n--) spans.push([u64(), u64()]);
      reqs.push([object, spans]);
    }
    return reqs;
  }
  async function perform2(w, p, store, listing, reqs, concurrency, format) {
    let next = 0;
    let failure;
    const worker = async () => {
      while (failure === void 0 && next < reqs.length) {
        const k = next++;
        try {
          const [object, spans] = reqs[k];
          const [key, size] = listing[object];
          const parts = spans.length === 1 && spans[0][0] === 0 && spans[0][1] === size ? [await whole(store, key)] : await Promise.all(spans.map(([a, b]) => readRange(store, key, a, b - a)));
          if (failure !== void 0) return;
          const n = parts.reduce((s, x) => s + x.length, 0);
          const ptr = w.vz_alloc(n) >>> 0;
          const mem = new Uint8Array(w.memory.buffer, ptr, n);
          let at = 0;
          for (const x of parts) {
            mem.set(x, at);
            at += x.length;
          }
          const r = Number(w.vz_store_complete(p, k, ptr, n));
          if (r < 0) throw rejection2(w, r, format);
        } catch (e) {
          failure ??= { error: e };
        }
      }
    };
    await Promise.allSettled(Array.from({ length: Math.max(1, Math.min(concurrency, reqs.length)) }, worker));
    if (failure !== void 0) throw failure.error;
  }
  async function whole(store, key) {
    const kept = store.kept?.get(key);
    store.kept?.delete(key);
    const r = kept ?? store.prefetch?.take(key);
    if (r === void 0) return store.read(key);
    const s = await r;
    if (!s.ok) throw s.error;
    return s.value;
  }
  async function readRange(store, key, offset, length) {
    if (length === 0) return new Uint8Array();
    if (store.readRange) return store.readRange(key, offset, length);
    return (await store.read(key)).subarray(offset, offset + length);
  }
  function storeDesc(raw, sizes) {
    const refs = [...raw.refs].sort((a, b) => compareKeys(a[0], b[0]));
    const objects = /* @__PURE__ */ new Map();
    for (const [, parts] of refs) {
      for (const x of parts) if (x.kind === 3 && !objects.has(x.key)) objects.set(x.key, objects.size);
    }
    const data = /* @__PURE__ */ new Map();
    const entries = raw.entries.map(([key, value]) => bytesEntry(key, value, raw.lazy));
    for (const [key, parts] of refs) {
      const ranges = parts.map((x) => {
        if (x.kind === 3) return { source: objects.get(x.key), offset: x.offset, length: x.length };
        if (x.kind === 2) return { data: x.data };
        if (x.kind === 1) {
          if (!data.has(x.source)) data.set(x.source, objects.size + data.size);
          return { source: data.get(x.source), offset: x.offset, length: x.length };
        }
        throw new Error("a reference to source 0 in a store's output");
      });
      entries.push({ key, ranges });
    }
    const sources = [...objects.keys()].map((k) => {
      const size = sizes.get(k);
      return { url: objectUrl(raw.url, k), ...size !== void 0 ? { size: BigInt(size) } : {} };
    });
    for (const i of data.keys()) sources.push({ data: raw.data[i - 1] });
    return { sources, entries };
  }

  // src/zarrify/ir/vsi.ts
  var BESIDE = { vsi: "VSI", nrrd: "NRRD" };
  function splitVsiUrl(url2, title = "VSI") {
    const base = url2.split(/[?#]/, 1)[0];
    if (base !== url2) throw new ImageError(`${title} input ${JSON.stringify(url2)} has a query or a fragment`);
    const k = base.lastIndexOf("/");
    const name = base.slice(k + 1);
    let key;
    try {
      key = decodeURIComponent(name);
    } catch {
      throw new ImageError(`${title} input ${JSON.stringify(url2)}: its file name is not percent-encoded UTF-8`);
    }
    if (k < 0 || !key || key.includes("/")) throw new ImageError(`${title} input ${JSON.stringify(url2)} names no file`);
    return [base.slice(0, k + 1), key];
  }
  async function probeHttp(url2, options) {
    try {
      return await new HttpSource(url2, options).open();
    } catch (e) {
      if (e instanceof HttpResolutionError && / HTTP 404 /.test(e.message)) return void 0;
      throw e;
    }
  }
  function vsiFiles(url2, source, options = {}, format = "vsi") {
    const title = BESIDE[format];
    const [dir, key] = splitVsiUrl(url2, title);
    const sources = /* @__PURE__ */ new Map([[key, source]]);
    const open = options.open ?? ((k) => {
      if (!/^https?:\/\//.test(dir)) {
        return Promise.reject(new ImageError(`${title} input ${JSON.stringify(url2)}: the files beside it can only be opened at an http(s) URL`));
      }
      return probeHttp(objectUrl(dir, k), options.http ?? (source instanceof HttpSource ? source.options : {}));
    });
    const store = {
      dir,
      key,
      url: dir,
      objects: /* @__PURE__ */ new Map([[key, source.size]]),
      listed: 1,
      requests: 0,
      concurrency: source.concurrency,
      async probe(k) {
        const have = store.objects.get(k);
        if (have !== void 0) return have;
        const s = await open(k);
        if (s === void 0) return void 0;
        sources.set(k, s);
        store.requests++;
        return s.size;
      },
      async read(k) {
        return store.readRange(k, 0, store.objects.get(k) ?? 0);
      },
      async readRange(k, offset, length) {
        const s = sources.get(k);
        if (s === void 0) throw new StoreError(`${k}: not a file of the ${title} input`, format);
        return s.read(offset, length);
      }
    };
    return store;
  }
  async function zarrifyVsi(url2, source, options = {}, format = "vsi") {
    const store = vsiFiles(url2, source, options, format);
    const desc = await zarrifyStoreIr(format, store, { mirror: options.mirror ?? true, concurrency: source.concurrency });
    return { ...desc, store };
  }

  // src/zarrify/index.ts
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
  var NOT_SUPPORTED = "not a file of any supported format";
  async function zarrifySource(url2, source, pins = {}) {
    const exact = (o, n) => source.read(o, n);
    const read = blockReader(exact, source.size);
    const etag = pins.etag ?? (source.etag ? () => source.etag() : void 0);
    return zarrifyWith(url2, { read, size: source.size, exact, source }, { ...pins, ...etag ? { etag } : {} });
  }
  async function zarrifyWith(url2, input, pins) {
    const format = await irFormat(await input.read(0, Math.min(552, input.size)));
    if (format === void 0) throw new ImageError(NOT_SUPPORTED);
    if (format in BESIDE) {
      const beside = format;
      const { store, ...desc2 } = await zarrifyVsi(url2, input.source, pins.open ? { open: pins.open } : {}, beside);
      if (pins.checksums) {
        const keys = new Map([...store.objects.keys()].map((k) => [objectUrl(store.url, k), k]));
        await addChecksums(desc2, (u, o, n) => store.readRange(keys.get(u), o, n));
      }
      return { format: beside, ...desc2 };
    }
    const desc = await zarrifyIr(format, url2, input.source, { checksums: pins.checksums === true });
    const etag = pins.etag?.();
    desc.sources[0] = { ...desc.sources[0], size: BigInt(input.size), ...etag !== void 0 ? { etag } : {} };
    if (pins.checksums) await addChecksums(desc, (_u, o, n) => (input.exact ?? input.read)(o, n));
    return desc;
  }
  async function irFormat(head) {
    const w = await ir();
    const n = Number(w.vz_sniff(put(w, head), head.length));
    return n > 0 ? new TextDecoder().decode(out(w, n)) : void 0;
  }
  function isStoreUrl(url2) {
    return url2.split(/[?#]/, 1)[0].endsWith("/");
  }
  async function zarrifyStore(input, options = {}) {
    if (typeof input !== "string" && (options.policy !== void 0 || options.headers !== void 0)) {
      throw new TypeError("zarrifyStore: a policy applies to a store URL; pass it to openHttpStore for an opened store");
    }
    const store = typeof input === "string" ? await openHttpStore(input, { policy: options.policy ?? {}, headers: options.headers ?? {} }) : input;
    const pins = options;
    const desc = await zarrifyStoreProfile(store);
    if (pins.checksums) {
      const keys = new Map([...store.objects.keys()].map((k) => [objectUrl(store.url, k), k]));
      await addChecksums(desc, async (u, o, n) => {
        const key = keys.get(u);
        return store.readRange ? store.readRange(key, o, n) : (await store.read(key)).subarray(o, o + n);
      });
    }
    return desc;
  }
  async function zarrifyStoreProfile(store) {
    try {
      const chosen = chooseProfile(store);
      if (chosen === "safe") return { format: "safe", ...await zarrifyStoreIr("safe", store) };
      if (chosen === "n5") return { format: "n5", ...await zarrifyStoreIr("n5", store) };
      const desc = await zarrifyStoreIr("zarr2", store);
      return { format: desc.summary.format === "ome-zarr" ? "ome-zarr" : "zarr2", ...desc };
    } finally {
      closeStore(store);
    }
  }

  // src/server.ts
  var STORE_FORMATS = {
    zarr2: "Zarr v2",
    n5: "N5",
    "ome-zarr": "OME-Zarr",
    safe: void 0,
    vsi: "VSI",
    nrrd: "NRRD"
  };
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
      fetchStore,
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
            virtual = await zarrifyStore(await openHttpStore(url2, { policy, ...fetchStore ? { fetch: fetchStore } : {} }));
          } else {
            const source = await openSource(url2);
            if (kind === "tiff") {
              virtual = await zarrifyIr("tiff", url2, source);
              const etag = source.etag?.();
              virtual.sources[0] = { ...virtual.sources[0], size: BigInt(source.size), ...etag !== void 0 ? { etag } : {} };
            } else {
              virtual = await zarrifySource(url2, source);
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
      const path = new URL(request.url).pathname.slice(new URL(prefix2).pathname.length);
      const m = path.match(/^(image|tiff|archive)\/([^/]+)\/(.*)$/);
      if (m === null) return response(404, "not found");
      const [, kind, id] = m;
      let key;
      let url2;
      try {
        key = m[3].split("/").map(decodeURIComponent).join("/");
        url2 = new URL(decodeId(id)).href;
      } catch {
        return response(400, "invalid URL");
      }
      const head = request.method === "HEAD";
      try {
        const { archive, filename } = await open(kind, url2);
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
        if (e instanceof RefkvError) {
          const status = e.errorClass === "request" ? 416 : e.errorClass === "resolution" ? 502 : 500;
          return response(status, message);
        }
        if (e instanceof StoreError && e.format !== void 0) {
          const title = STORE_FORMATS[e.format];
          return response(422, title === void 0 ? message : `${title}: ${message}`);
        }
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
