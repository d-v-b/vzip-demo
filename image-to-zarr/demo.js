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
function removeDotSegments(input2) {
  const out2 = [];
  let path = input2;
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
function inBrowser() {
  const g = globalThis;
  return g.document !== void 0 || g.WorkerGlobalScope !== void 0;
}
function fetchFailed(url, e, browser = inBrowser()) {
  const message = `${url}: ${e.message}`;
  if (!browser || !(e instanceof TypeError)) return message;
  return `${message}. A browser reports this for a server that does not allow cross-origin reads (no Access-Control-Allow-Origin header for this page) as well as for one it cannot reach`;
}
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
    throw new HttpResolutionError(fetchFailed(url, e));
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
function schemeOf(url) {
  const i = url.indexOf(":");
  const s = i < 0 ? "" : url.slice(0, i).toLowerCase();
  return s === "https" ? "http" : s;
}
function matchesPrefix(url, prefix2) {
  if (!url.startsWith(prefix2)) return false;
  const rest = url.slice(prefix2.length);
  if (!(prefix2.endsWith("/") || rest === "" || "/?#".includes(rest[0]))) return false;
  const path = url.split(/[?#]/, 1)[0];
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
  let text = s.split("%", 1)[0];
  const tail = [];
  const dotted = text.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const v4 = parseIPv4(dotted[2]);
    if (v4 === void 0) return void 0;
    tail.push(Number(v4 >> 16n), Number(v4 & 0xffffn));
    text = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1);
  }
  const halves = text.split("::");
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
      throw new RefkvError("resolution", `${url}: not under an allowed URL prefix (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`);
    }
  } else if (scheme === "file") {
    if (!local && !policy.allowFilesFromRemoteArchives) {
      throw new RefkvError("resolution", `${url}: an archive opened from a URL may not read local files (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`);
    }
  } else if (scheme !== "http" && !(policy.schemes ?? []).some((s) => schemeOf(`${s}:`) === scheme)) {
    throw new RefkvError("resolution", `${url}: the scheme '${scheme}' is not allowed (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`);
  }
  if (scheme !== "http") return;
  const c = hostClass(url);
  if (c !== void 0) checkClass(policy, url, c);
}
function checkClass(policy, url, c, address) {
  if (c === "public" || policy.allowPrivateHosts) return;
  const at = address === void 0 ? "" : ` (at ${address})`;
  throw new RefkvError(
    "resolution",
    `${url}: the host${at} is a ${c} address, which the reader does not reach without allowPrivateHosts: true (spec \xA76.7 <https://github.com/d-v-b/refkv/blob/main/spec/refkv.md#67-reader-policy>)`
  );
}
function checkAddress(policy, url, address) {
  const c = addressClass(address);
  if (c === void 0) throw new RefkvError("resolution", `${url}: ${address} is not an IP address`);
  checkClass(policy, url, c, address);
}
var MERGE_GAP = 1 << 16;
var U32_ALL = 4294967295;
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
    this.netFetch = policy.allowPrivateHosts ? void 0 : checkedFetch((url, address) => checkAddress(policy, url, address), policy);
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
      const large = size === U32_ALL && csize === U32_ALL;
      const need = (large ? 16 : 0) + (offset === U32_ALL ? 8 : 0);
      if (blocks === void 0) entry.error = "unparseable extra field";
      else if (refs.length > 1) entry.error = "more than one reference block";
      else if (zip64.length > 1) entry.error = "more than one zip64 block";
      else if (size === U32_ALL !== (csize === U32_ALL)) {
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
          if (offset === U32_ALL) offset = z.getBigUint64(large ? 16 : 0, true);
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
          allow: (u) => checkPolicy(this.policy, this.baseUrl, u),
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
var PROFILES = Object.fromEntries(
  REGISTRY2.map((e) => [e.name, [e.uuid, e.version, e.title]])
);
var UUIDS = new Set(Object.values(PROFILES).map(([uuid]) => uuid));
var MAX_CHUNK = 2 ** 24;
var MAX_PADDING = 2 ** 16 - 2 ** 10;
var SMALL_PADDING = 2 ** 10;
var MAX_TOTAL_PADDING = 2 ** 20;
var RAGGED_CHUNK = 2 ** 20;

// src/zarrify/ir/run.ts
var utf83 = new TextEncoder();

// src/zarrify/ir/source.ts
var OPEN = 1 << 16;
var isNode = typeof process !== "undefined" && process.versions?.node !== void 0;

// src/zarrify/store.ts
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MAX_DOCUMENT = 1 << 24;
var utf84 = new TextEncoder();
var PREFETCH_BYTES = 64 << 20;
var MAX_BLOCK = 2 ** 31 - 1;

// src/zarrify/ir/store.ts
var utf85 = new TextEncoder();

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
    await new Promise((resolve, reject) => {
      const finish = (error) => {
        clearTimeout(timer);
        container.removeEventListener("controllerchange", check);
        if (error) reject(error);
        else resolve();
      };
      const check = () => {
        if (ours()) finish();
      };
      const timer = setTimeout(
        () => finish(new Error("the refkv service worker did not take control of this page; reload it and try again")),
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

// ../demo/map/jpeg2k_decoder.ts
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

// ../demo/jpegxr_decoder.ts
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

// ../demo/contrast.ts
var JPEG2K_WASM = new URL("jpeg2000_decoder.wasm", location.href);
var JPEGXR_WASM = new URL("jpegxr.wasm", location.href);
var TYPES = {
  uint8: [1, (v, i) => v.getUint8(i)],
  int8: [1, (v, i) => v.getInt8(i)],
  uint16: [2, (v, i, le) => v.getUint16(i, le)],
  int16: [2, (v, i, le) => v.getInt16(i, le)],
  uint32: [4, (v, i, le) => v.getUint32(i, le)],
  int32: [4, (v, i, le) => v.getInt32(i, le)],
  float32: [4, (v, i, le) => v.getFloat32(i, le)],
  float64: [8, (v, i, le) => v.getFloat64(i, le)]
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
  if (rest.some((c) => c.name !== "gzip" && c.name !== "numcodecs.zlib")) return void 0;
  let bytes = encoded;
  for (const c of [...rest].reverse()) {
    const inflate = new DecompressionStream(c.name === "gzip" ? "gzip" : "deflate");
    bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(inflate)).arrayBuffer());
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
function percentiles(bytes, le, dataType, fill) {
  const [size, get] = TYPES[dataType];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = Math.floor(bytes.length / size);
  const step = Math.max(1, Math.floor(n / 1e5));
  const values = [];
  for (let i = 0; i < n; i += step) {
    const v = get(view, i * size, le);
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

// ../demo/demo.ts
var $ = (id) => document.getElementById(id);
var input = $("url");
var status = $("status");
var setStatus = (text, error = false) => {
  status.textContent = text;
  status.classList.toggle("error", error);
};
async function getJson(url) {
  const r = await fetch(url);
  if (r.headers.get(WORKER_HEADER) === null) {
    throw new Error(
      `the refkv service worker did not answer this request (HTTP ${r.status} from the network); reload the page and try again`
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
function imageState(images, axes, scale, shape, dtype, omero = [], labels = []) {
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
    if (a.name === "t" || a.name === "time") return [at];
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
  if (c >= 0 && shape[c] > 1 && shape[c] <= MAX_CHANNELS) {
    const outputDimensions = Object.fromEntries(
      axes.map((a) => a.name === "c" ? ["c^", [1, ""]] : [a.name, dimensions[a.name]])
    );
    const rgb = shape[c] === 3 && dtype === "uint8" && omero.length === 0;
    const shader = rgb ? RGB_SHADER : channelShader(shape[c], omero);
    return {
      layers: images.map((img) => ({
        type: "image",
        source: { url: img.url, transform: { outputDimensions } },
        name: many ? img.name : rgb ? "image" : "channels",
        opacity: 1,
        shader
      })),
      crossSectionBackgroundColor: "#000000",
      ...view
    };
  }
  return {
    layers: images.map((img) => ({ type: "image", source: img.url, name: many ? img.name : "image" })),
    ...view
  };
}
var MAX_CHANNELS = 16;
function neuroglancerState(...args) {
  const state = imageState(...args);
  const labels = args[6] ?? [];
  state.layers.push(...labels.map((l) => ({
    type: "segmentation",
    source: l.url,
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
function arrayView(url, path, meta) {
  const axes = meta.shape.map((_, i) => ({ name: meta.dimension_names?.[i] ?? `dim_${i}` }));
  const label = path === "" ? "the array" : path;
  return {
    label,
    name: label,
    url,
    images: [{ url, name: path || "array" }],
    axes,
    scale: axes.map(() => 1),
    levels: [{ path: path || "/", url, meta }],
    omero: [],
    labels: []
  };
}
async function videoViews(zarrUrl, mp4) {
  const tracks = (mp4.tracks ?? []).filter((t) => t.path !== null && t.handler === "vide");
  return Promise.all(tracks.map(async (t) => {
    const url = `${zarrUrl}${t.path}/y/`;
    const view = arrayView(url, `${t.path}/y`, await getJson(`${url}zarr.json`));
    view.label = `${t.path} (luma)`;
    return view;
  }));
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
    return JSON.stringify([v.axes.map((a) => a.name), m.data_type, c < 0 ? 0 : m.shape[c]]);
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
  const paths = archive.keys().filter((k) => (k === "zarr.json" || k.endsWith("/zarr.json")) && !k.startsWith("refkv_source/")).map((k) => k.slice(0, -"zarr.json".length).replace(/\/$/, ""));
  const nodes = await Promise.all(paths.map(async (path) => ({
    path,
    meta: await getJson(`${zarrUrl}${path === "" ? "" : `${path}/`}zarr.json`)
  })));
  return nodes.filter((n) => n.meta.node_type === "array");
}
var prefix;
var views = [];
function neuroglancerSource(shown2, url) {
  if (!shown2.isArchive) return `${url}|zarr3:`;
  if (!url.startsWith(shown2.zarrUrl)) throw new Error(`${url} is not under ${shown2.zarrUrl}`);
  const path = url.slice(shown2.zarrUrl.length).split("/").map(encodeURIComponent).join("/");
  return `${shown2.url}|vzip:${path}|zarr3:`;
}
function showLevels(rows) {
  $("levels").replaceChildren(
    ...rows.map(({ path, meta: a }) => {
      const tr = document.createElement("tr");
      for (const v of [
        path,
        a.shape.join(" \xD7 "),
        chunkShapeOf(a).join(" \xD7 ") + (a.chunk_grid.name === "rectilinear" ? " (at most; rectilinear)" : ""),
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
  const source = (url) => neuroglancerSource(view.input, url);
  $("share-local").hidden = view.input.isArchive;
  $("share-archive").hidden = !view.input.isArchive;
  $("name").textContent = view.name;
  $("zarr-url").textContent = source(view.url);
  $("view-note").textContent = view.note ?? "";
  showLevels(view.levels);
  const level0 = view.levels[0].meta;
  const dataType = level0.data_type;
  const coarsest = view.levels[view.levels.length - 1];
  const sample = (channels) => sampleRanges(coarsest.url, coarsest.meta, view.axes, chunkShapeOf(coarsest.meta), channels);
  let omero = view.omero;
  const c = view.axes.findIndex((a) => a.name === "c");
  const nc = c >= 0 ? level0.shape[c] : 0;
  if (dataType !== "uint8" && nc > 1 && nc <= MAX_CHANNELS) {
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
    view.images.map((img) => ({ ...img, url: source(img.url) })),
    view.axes,
    view.scale,
    level0.shape,
    dataType,
    omero,
    view.labels.map((l) => ({ ...l, url: source(l.url) }))
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
async function zarrify(url) {
  $("result").hidden = true;
  const here = new URL(location.href);
  here.searchParams.set("url", url);
  history.replaceState(null, "", here);
  setStatus("Starting the service worker\u2026");
  prefix ??= registerVzipWorker(new URL("vzip-sw.js", location.href));
  const p = await prefix;
  const isArchive = /\.vzip(?:[?#]|$)/i.test(url);
  const zarrUrl = isArchive ? archiveZarrUrl(p, url) : imageZarrUrl(p, url);
  const opened = { url, zarrUrl, isArchive };
  setStatus(isArchive ? "Opening the archive\u2026" : "Reading the file's structure\u2026");
  const t0 = performance.now();
  const root = await getJson(`${zarrUrl}zarr.json`);
  const ms = Math.round(performance.now() - t0);
  const attrs = root.attributes ?? {};
  const map = $("open-map");
  const picker = $("view");
  map.hidden = true;
  $("view-row").hidden = true;
  if (attrs.refkv_zarrified?.profile === "safe") {
    const safe2 = attrs.refkv_zarrified.safe ?? {};
    views = [];
    $("name").textContent = `${safe2.PRODUCT_URI ?? url.split("/").pop()} (${safe2.PROCESSING_LEVEL ?? "Sentinel-2"})`;
    $("zarr-url").textContent = neuroglancerSource(opened, zarrUrl);
    $("view-note").textContent = `${safe2.SENSING_TIME ?? ""} ${attrs["proj:code"] ?? ""}`;
    showLevels(await listArrays(zarrUrl));
    $("open-ng").hidden = true;
    $("share-local").hidden = true;
    $("share-archive").hidden = true;
    map.hidden = false;
    map.href = new URL(`map.html?url=${encodeURIComponent(url)}`, location.href).href;
  } else {
    const ms0 = attrs.ome?.multiscales?.[0];
    let found;
    if (root.node_type === "array") {
      found = [arrayView(zarrUrl, "", root)];
    } else if (attrs.refkv_zarrified?.profile === "mp4") {
      found = await videoViews(zarrUrl, attrs.refkv_zarrified.mp4 ?? {});
      if (found.length === 0) throw new Error("no video track to show (audio is not displayed)");
    } else if (ms0 !== void 0) {
      found = [await omeView(zarrUrl, ms0, ms0.name ?? "image", attrs.refkv_zarrified?.profile === "ome-zarr")];
    } else if (attrs.ome?.["bioformats2raw.layout"] !== void 0) {
      found = await seriesViews(zarrUrl);
    } else {
      found = (await listArrays(zarrUrl)).map(({ path, meta }) => arrayView(`${zarrUrl}${path}/`, path, meta));
      if (found.length === 0) throw new Error("no arrays to show");
    }
    views = found.map((v) => ({ ...v, input: opened }));
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
  zarrify(input.value.trim()).catch((e) => setStatus(String(e.message ?? e), true));
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
