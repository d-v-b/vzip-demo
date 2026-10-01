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

// src/uri.ts
var PCT = "%[0-9A-Fa-f]{2}";
var UNRESERVED = "A-Za-z0-9\\-._~";
var SUB_DELIMS = "!$&'()*+,;=";
var PCHAR = `(?:[${UNRESERVED}${SUB_DELIMS}:@]|${PCT})`;
var AUTHORITY = new RegExp(
  `^(?:(?:[${UNRESERVED}${SUB_DELIMS}:]|${PCT})*@)?(?:\\[[0-9A-Fa-f:.vV${UNRESERVED}${SUB_DELIMS}]+\\]|(?:[${UNRESERVED}${SUB_DELIMS}]|${PCT})*)(?::[0-9]*)?$`
);
var PATH = new RegExp(`^(?:${PCHAR}|/)*$`);
var QUERY = new RegExp(`^(?:${PCHAR}|[/?])*$`);

// src/protobuf.ts
var U64_MAX = (1n << 64n) - 1n;
var utf8 = new TextEncoder();
var strictUtf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

// src/writer.ts
var U64_MAX2 = (1n << 64n) - 1n;
var utf82 = new TextEncoder();

// src/archive.ts
var strictUtf82 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

// src/tiff.ts
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

// src/server.ts
var ARCHIVE_KEY = "__vz__/archive.vzip";
function encodeId(url) {
  let s = "";
  for (const b of new TextEncoder().encode(url)) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

// src/client.ts
async function registerVzipWorker(scriptUrl = "vzip-sw.js") {
  const registration = await navigator.serviceWorker.register(scriptUrl);
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller === null) {
    await new Promise(
      (resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true })
    );
  }
  return new URL("vz/", registration.scope).href;
}
function tiffZarrUrl(prefix2, url) {
  return `${prefix2}tiff/${encodeId(new URL(url).href)}/`;
}
function archiveZarrUrl(prefix2, url) {
  return `${prefix2}archive/${encodeId(new URL(url).href)}/`;
}
function archiveDownloadUrl(zarrUrl) {
  return zarrUrl + ARCHIVE_KEY;
}

// demo/demo.ts
var EXAMPLE = "https://ftp.ebi.ac.uk/pub/databases/IDR/idr0096-tratwal-marrowquant/20210609-ftp-ome-tiffs/4000_d11_m5_LT_2%20(20x_01).ome.tiff";
var $ = (id) => document.getElementById(id);
var input = $("url");
var status = $("status");
var setStatus = (text, error = false) => {
  status.textContent = text;
  status.classList.toggle("error", error);
};
async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}
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
function neuroglancerState(zarrUrl, axes, scale, shape, dtype) {
  const source = `${zarrUrl}|zarr3:`;
  const n = shape.length;
  const extent = (i) => shape[i] * scale[i] * (METERS[axes[i].unit ?? ""] ?? 1);
  const view = { crossSectionScale: Math.max(extent(n - 2) / 600, extent(n - 1) / 850), layout: "xy" };
  const c = axes.findIndex((a) => a.name === "c");
  if (c >= 0 && shape[c] === 3 && dtype === "uint8") {
    const colors = ["v, 0.0, 0.0", "0.0, v, 0.0", "0.0, 0.0, v"];
    return {
      layers: colors.map((rgb, i) => ({
        type: "image",
        source,
        name: ["red", "green", "blue"][i],
        opacity: 1,
        blend: "additive",
        localDimensions: { "c'": [1, ""] },
        localPosition: [i],
        shader: `void main() {
  float v = toNormalized(getDataValue());
  emitRGB(vec3(${rgb}));
}
`
      })),
      crossSectionBackgroundColor: "#000000",
      ...view
    };
  }
  return { layers: [{ type: "image", source, name: "image" }], ...view };
}
var prefix;
async function virtualize(url) {
  $("result").hidden = true;
  setStatus("Starting the service worker\u2026");
  prefix ??= registerVzipWorker(new URL("vzip-sw.js", location.href));
  const p = await prefix;
  const isArchive = /\.vzip(?:[?#]|$)/i.test(url);
  const zarrUrl = isArchive ? archiveZarrUrl(p, url) : tiffZarrUrl(p, url);
  setStatus(isArchive ? "Opening the archive\u2026" : "Reading the TIFF's directories\u2026");
  const t0 = performance.now();
  const group = await getJson(`${zarrUrl}zarr.json`);
  const ms = Math.round(performance.now() - t0);
  const ms0 = group.attributes?.ome?.multiscales?.[0];
  if (ms0 === void 0) throw new Error("not an OME-Zarr multiscale image");
  const rows = await Promise.all(
    ms0.datasets.map(async (d) => [d.path, await getJson(`${zarrUrl}${d.path}/zarr.json`)])
  );
  const tbody = $("levels");
  tbody.replaceChildren(
    ...rows.map(([path, a]) => {
      const tr = document.createElement("tr");
      for (const v of [
        path,
        a.shape.join(" \xD7 "),
        a.chunk_grid.configuration.chunk_shape.join(" \xD7 "),
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
  $("name").textContent = ms0.name ?? url.split("/").pop();
  $("zarr-url").textContent = zarrUrl;
  const [, level0] = rows[0];
  const scale = ms0.datasets[0].coordinateTransformations?.find(
    (t) => t.type === "scale"
  )?.scale ?? level0.shape.map(() => 1);
  const state = neuroglancerState(zarrUrl, ms0.axes, scale, level0.shape, level0.data_type);
  $("open-ng").href = new URL(
    `neuroglancer/#!${encodeURIComponent(JSON.stringify(state))}`,
    location.href
  ).href;
  $("download").href = archiveDownloadUrl(zarrUrl);
  $("result").hidden = false;
  setStatus(`Ready in ${ms} ms.`);
}
$("form").addEventListener("submit", (event) => {
  event.preventDefault();
  virtualize(input.value.trim()).catch((e) => setStatus(String(e.message ?? e), true));
});
$("example").addEventListener("click", (event) => {
  event.preventDefault();
  input.value = EXAMPLE;
  $("form").requestSubmit();
});
var fromQuery = new URLSearchParams(location.search).get("url");
if (fromQuery) {
  input.value = fromQuery;
  $("form").requestSubmit();
}
//# sourceMappingURL=demo.js.map
