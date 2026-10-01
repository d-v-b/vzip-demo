# vzip demos

Live demos of [vzip](https://github.com/d-v-b/vzip), a ZIP container for
byte-range references: **https://d-v-b.github.io/vzip-demo/**

| demo | what it does |
|---|---|
| [tiff to zarr](https://d-v-b.github.io/vzip-demo/tiff-to-zarr/) | Virtualizes a remote (OME-)TIFF into a vzip archive in the browser, serves it as plain Zarr from a service worker, and opens it in Neuroglancer. |

This repository holds only the built sites, one directory per demo, published
with GitHub Pages from the `gh-pages` branch. The source is in
[d-v-b/vzip](https://github.com/d-v-b/vzip) (the TIFF-to-Zarr demo is in
`web/` and is published by `web/pages.sh`) and in the vzip-enabled Neuroglancer
fork, [d-v-b/neuroglancer](https://github.com/d-v-b/neuroglancer/tree/vzip).
