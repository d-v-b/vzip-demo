# vzip demos

Live demos of [vzip](https://github.com/d-v-b/vzip), a ZIP container for
byte-range references: **https://d-v-b.github.io/vzip-demo/**

| demo | what it does |
|---|---|
| [Image files to Zarr in the browser](https://d-v-b.github.io/vzip-demo/image-to-zarr/) | Paste the URL of a remote image file, such as an (OME-)TIFF or a Nikon ND2: a service worker virtualizes it into a vzip archive in the browser and serves it as plain Zarr, opened here in Neuroglancer. |

This repository holds only the built sites, one directory per demo, published
with GitHub Pages from the `gh-pages` branch. The source is in
[d-v-b/vzip](https://github.com/d-v-b/vzip) (the demos are in `web/` and are
published by `web/pages.sh`) and in the vzip-enabled Neuroglancer fork,
[d-v-b/neuroglancer](https://github.com/d-v-b/neuroglancer/tree/vzip).
