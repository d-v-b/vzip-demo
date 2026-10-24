# refkv demos

Live demos of [refkv](https://github.com/d-v-b/refkv), reference semantics for key-value storage: **https://d-v-b.github.io/vzip-demo/**

| demo | what it does |
|---|---|
| [Image files to Zarr in the browser](https://d-v-b.github.io/vzip-demo/image-to-zarr/) | Paste the URL of a remote image file or store, such as an OME-TIFF, a Zeiss CZI, a DICOM, an N5 or a Sentinel-2 SAFE product: a service worker virtualizes it into a vzip archive in the browser and serves it as plain Zarr, opened here in Neuroglancer or on a map. |

This repository holds only the built sites, one directory per demo, published
with GitHub Pages from the `gh-pages` branch. The source is in
[d-v-b/refkv](https://github.com/d-v-b/refkv) (the demos are in `demo/`, built from `js/`, and are
published by `demo/pages.sh`) and in the vzip-enabled Neuroglancer fork,
[d-v-b/neuroglancer](https://github.com/d-v-b/neuroglancer/tree/vzip).
