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
var MERGE_GAP = 1 << 16;
var strictUtf82 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

// src/lv.ts
var utf16 = new TextDecoder("utf-16le");

// src/nd2.ts
var REQUIRED = Symbol("required");

// src/tiff.ts
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

// src/virtualize.ts
var WS = "[ \\t\\r\\n]";
var NAME = "[A-Za-z0-9_.-]+";
var ANAME = `[^ \\t\\r\\n=/>"'<]+`;
var SKIP = "<!--[^]*?(?:-->|$)|<!\\[CDATA\\[[^]*?(?:\\]\\]>|$)|<\\?[^]*?(?:\\?>|$)|<![^]*?(?:>|$)";
var TAG = `<(/?)(?:${NAME}:)?(${NAME})((?:${WS}+${ANAME}${WS}*=${WS}*(?:"[^"]*"|'[^']*'))*)${WS}*(/?)>`;
var SCAN = new RegExp(`(${SKIP})|(${TAG})|<`, "g");
var ATTR = new RegExp(`(${ANAME})${WS}*=${WS}*(?:"([^"]*)"|'([^']*)')`, "g");

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

// demo/demo.ts
var EXAMPLE = "https://ftp.ebi.ac.uk/pub/databases/IDR/idr0096-tratwal-marrowquant/20210609-ftp-ome-tiffs/4000_d11_m5_LT_2%20(20x_01).ome.tiff";
var ND2_EXAMPLE = "https://ftp.ebi.ac.uk/biostudies/fire/S-BIAD/015/S-BIAD3015/Files/1-SR_1_9_6hPre-C_MC1.nd2";
var ND2_ZSTACK_EXAMPLE = "https://ftp.ebi.ac.uk/biostudies/fire/S-BIAD/077/S-BIAD2077/Files/373_230614_A1_Blk_Reg2_40x.nd2";
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
function neuroglancerState(images, axes, scale, shape, chunks, dtype, omero = []) {
  const n = shape.length;
  const dimensions = {};
  axes.forEach((a, i) => {
    if (a.name === "c") return;
    const unit = a.unit ?? "";
    if (unit in METERS) dimensions[a.name] = [scale[i] * METERS[unit], "m"];
    else if (unit in SECONDS) dimensions[a.name] = [scale[i] * SECONDS[unit], "s"];
    else dimensions[a.name] = [scale[i], ""];
  });
  const offset = (img, i) => (img.translation?.[i] ?? 0) / scale[i];
  const position = axes.flatMap((a, i) => a.name === "c" ? [] : [a.name === "t" ? 0 : a.name === "z" ? Math.floor(shape[i] / 2) : offset(images[0], i) + shape[i] / 2]);
  const view = {
    dimensions,
    position,
    displayDimensions: ["x", "y"],
    // With the coordinate space declared, this counts full-resolution voxels
    // per screen pixel.
    crossSectionScale: Math.max(shape[n - 2] / 600, shape[n - 1] / 850),
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
var prefix;
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
  const group = await getJson(`${zarrUrl}zarr.json`);
  const ms = Math.round(performance.now() - t0);
  let imageUrl = zarrUrl;
  let ms0 = group.attributes?.ome?.multiscales?.[0];
  let images = [{ url: zarrUrl, name: "image", translation: translationOf(ms0) }];
  const seriesRow = $("series-row");
  seriesRow.hidden = true;
  if (ms0 === void 0 && group.attributes?.ome?.["bioformats2raw.layout"] !== void 0) {
    const series = (await getJson(`${zarrUrl}OME/zarr.json`)).attributes?.ome?.series ?? [];
    const groups = await Promise.all(series.map((s) => getJson(`${zarrUrl}${s}/zarr.json`)));
    images = series.map((s, i) => {
      const m = groups[i].attributes?.ome?.multiscales?.[0];
      return { url: `${zarrUrl}${s}/`, name: m?.name ?? `series ${s}`, translation: translationOf(m) };
    });
    imageUrl = images[0].url;
    ms0 = groups[0]?.attributes?.ome?.multiscales?.[0];
    if (series.length > 1) {
      const placed = images.every((img) => img.translation !== void 0);
      $("series-count").textContent = `${series.length} images (series ${series[0]}\u2013${series[series.length - 1]}), ` + (placed ? "placed at their stage positions; zoom out in Neuroglancer to see them all." : "without stage positions, so they overlap.");
      seriesRow.hidden = false;
    }
  }
  if (ms0 === void 0) throw new Error("not an OME-Zarr multiscale image");
  const rows = await Promise.all(
    ms0.datasets.map(async (d) => [d.path, await getJson(`${imageUrl}${d.path}/zarr.json`)])
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
  $("zarr-url").textContent = imageUrl;
  const [, level0] = rows[0];
  const scale = ms0.datasets[0].coordinateTransformations?.find(
    (t) => t.type === "scale"
  )?.scale ?? level0.shape.map(() => 1);
  const omero = (await getJson(`${imageUrl}zarr.json`)).attributes?.ome?.omero?.channels ?? [];
  const state = neuroglancerState(
    images,
    ms0.axes,
    scale,
    level0.shape,
    level0.chunk_grid.configuration.chunk_shape,
    level0.data_type,
    omero
  );
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
for (const [id, url] of [["example", EXAMPLE], ["example-nd2", ND2_EXAMPLE], ["example-nd2-zstack", ND2_ZSTACK_EXAMPLE]]) {
  $(id).addEventListener("click", (event) => {
    event.preventDefault();
    input.value = url;
    $("form").requestSubmit();
  });
}
var fromQuery = new URLSearchParams(location.search).get("url");
if (fromQuery) {
  input.value = fromQuery;
  $("form").requestSubmit();
}
//# sourceMappingURL=demo.js.map
