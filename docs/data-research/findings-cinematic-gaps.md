# Cinematic gaps: sourced findings (collected 2026-10-17)

**How this was gathered:** I fetched every URL below during this session, using WebFetch or `curl -A "Mozilla/5.0"`. Quotes are verbatim; `...` marks a cut. Where a summarizer could have paraphrased a page, I re-checked the quote against the raw page text using curl and a text search. Anything not checked this way is marked **UNVERIFIED**. Lines marked **DERIVED** are my own arithmetic on sourced numbers, not claims made by any source.

---

## 1. Integrated-GPU particle budgets

### 1a. Measured data points (count, fps, hardware)

The data is thin. I found no sourced measurement of `THREE.Points` or additive point sprites on Intel Iris Xe, UHD 620/630, Radeon Vega 8, 680M/780M, Apple M2 or Apple M3. The integrated-GPU rows that do exist are mostly forum anecdotes, they rarely state resolution or DPR, and several use meshes or quads rather than points. Discrete-GPU rows are included only as reference points.

| GPU | Workload | Count | fps / resolution | URL | Quote |
|---|---|---|---|---|---|
| Apple M1 (MacBook), Chrome | 1M instanced billboard quads (`InstancedBufferGeometry`, `RawShaderMaterial`, opaque, `scale = 0.001`, `setPixelRatio(window.devicePixelRatio)`) | 1,000,000 (`const COUNT = 1000 * 1000;`) | 60 fps; resolution not stated | https://discourse.threejs.org/t/particles-running-terrible-on-chrome/42971 (raw: `/t/42971.json`) | "It's also running at 60fps on Chrome on an M1 MacBook." |
| "2018 Intel MacBook Pro" (GPU model **not stated**; it could be the integrated Iris Plus or a discrete Radeon, **UNVERIFIED**) | same 1M-quad test | 1,000,000 | Safari: 30 fps on a 4K screen. Chrome: hangs (Mugen87 attributes this to Chromium bug 1245448). WebGL1: about 20 fps | same | "running very smoothly in Safari (30fps on a 4K screen & 2018 Intel MacBook Pro)" / "on Chrome (105.0.5195.125) on my Intel Mac, it basically hangs!" / "downgrade to webGL1.0 and it ran about 20fps on Chrome" |
| Apple M1 Mac, Chrome with vsync disabled | "Shaping Particles" morph demo | 36k | 100 fps | https://discourse.threejs.org/t/shaping-particles-morphing-particles-demo-decent-fps/38238 | "I get a smooth 100 FPS on an M1 Mac. However - I don't think the particles are the bottleneck, as I've done some test and my machine has no problem with millions of particles." (the "millions" part is an unmeasured claim) |
| Older Samsung phone | same demo | 36k | 30 fps | same | "I used 36k particles thinking it will be too much for mobiles, but I still get 30 FPS even on older Samsung mobile." |
| Apple M1 Mac mini, Chrome | WebGL Aquarium (webglsamples). Instanced fish meshes, **not points** | 10,000 fish | 60 fps up to 10k fish, then 50 fps; resolution not stated | https://www.pteavstudio.com/forums/topic/24649-simple-graphics-card-test-using-web-browser/ | "Using Chrome my Mac Mini M1 is a solid 60 fps until 10000 fish then drops to 50 fps" |
| NVIDIA GTX 1660 (discrete reference) | same Aquarium | 10,000 fish | 48 fps | same | "Using Chrome my Nvidia 1660 is a solid 60 fps until 10000 fish then drops to 48 fps" |
| Intel HD 4400 (Haswell iGPU, i3-4150), Firefox 33, 2014 | WebGL Aquarium (meshes) | 500 / 1000 / 2000 / 4000 fish | 60 / about 55 / about 45 / about 32 fps | https://web.archive.org/web/20210317135525id_/https://ubuntuforums.org/archive/index.php/t-2255009.html (the live forum host did not resolve) | "I get identical 60 fps for Fish=1 to 500, then it drops by 5 fps (to about 55) for 1000, down another 10 fps (to about 45) for 2000, down another 13 fps (to about 32) for 4000. This machine - using Firefox 33 with i3-4150 processor, Intel HD 4400 integrated graphics." |
| "2015 MacBook Pros with dual graphics cards" (integrated vs discrete **not stated**) | deck.gl ScatterplotLayer (point sprites) | about 1M items; about 10M | 60 fps at about 1M; 10–20 fps near 10M | https://deck.gl/docs/developer-guide/performance | "most basic layers (like ScatterplotLayer ) renders fluidly at 60 FPS during pan and zoom operations up to about 1M (one million) data items, with framerates dropping into low double digits (10-20FPS) when the data sets approach 10M items." |
| GPU not stated ("Tested @ 1080p") | R3F FBO particle lab (README badge) | 65k | 60 fps at 1080p | https://github.com/Kevinparra535/creativedev.particles (README via `gh api`) | "Tested @ 1080p · 60FPS (65k)" |
| NVIDIA GTX 1060 (discrete reference), Firefox | GPGPU/FBO points | 4,000,000 | 75 fps (screenshot labelled 1920×1080) | https://discourse.threejs.org/t/gpgpu-particles-and-the-box/29608 | "The scene of 4 million points runs with 75fps on my GTX1060 (FIrefox)." |
| NVIDIA GTX 1070 + Ryzen 5 2600 (discrete reference) | static ping-pong particles | 16,777,216 | about 30 fps | https://github.com/Alfred-Mountfield/WebGLParticles (README via `gh api`) | "the system easily handled displaying 16,777,216 (4096^2) static particles at ~30 FPS" |
| Windows 7 desktop (GPU not stated), 2015 | oryol instanced 5-vertex "diamond" particles, GPU-updated | about 800k | stays at 60 fps until about 800k | https://news.ycombinator.com/item?id=9333910 | "the second (GPU updates) goes to about 800k particles before dropping below 60fps" / "this depends very much on the target hardware, less on the browser or operating system" |
| iPhone 6+ | same oryol instancing demo | about 150k | stays at 60 fps until about 150k | same | "Running the instancing demo on an iPhone6+ I can get to 150k particles before dropping below 60fps." |
| GeForce 8800 GTX (discrete, 2007): fill-rate evidence, not a count | full-res vs. low-res off-screen particles, 1600×1200, 73-instruction shader | 46.9M vs 2.9M particle pixels | 25 fps vs 61 fps | https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles | Table 23-1: "High resolution 25 46.9 0 ... Low resolution, max z, 4x4 scale 61 2.9 1.9" |

### 1b. Integrated-GPU throughput specs (theoretical, not measured)

| GPU | FP32 | Pixel fill rate | Memory bandwidth (shared with CPU) | URL | Quote / note |
|---|---|---|---|---|---|
| Intel UHD 620 (Kaby Lake-R, e.g. i5-8250U) | not found | not found | 38.4 GB/s | https://en.wikipedia.org/w/index.php?title=List_of_Intel_graphics_processing_units&action=raw | Table row: "UHD Graphics 620 … 1000 … rowspan=3 \| 38.4" (column header: "Memory bandwidth (GB/s)"); core config "192:24:3 (GT2)" |
| Intel UHD 630 (mobile/desktop, 8th–9th gen) | not found | not found | 38.4 / 42.7 GB/s depending on SKU | same | Rows show "192:24:3 (GT2) … 42.7" for i5-8400 to i9-9900K |
| Intel Iris Xe (Tiger Lake, 96 EU) | about 2.1 TFLOPS | 24 pixels/clock (and 48 texels/clock). **DERIVED:** at 1.3–1.4 GHz max clock that is about 31–34 GPixel/s | 68.2 GB/s | AnandTech via Wayback: https://web.archive.org/web/20211216144037id_/https://www.anandtech.com/show/15973/the-intel-xelp-gpu-architecture-deep-dive-building-up-from-the-bottom/3 ; https://en.wikipedia.org/w/index.php?title=Intel_Xe&action=raw ; Intel list (above) | AnandTech: "50% more ROPs, for a total rate of 48 texels/clock and 24 pixels/clock respectively." Wikipedia: "the integrated GPU in Tiger Lake processors has a performance of 2.1 FP32 teraFLOPs." Intel list: i7-1165G7 "1300", i7-1195G7 "1400" MHz; "68.2" GB/s |
| Intel Iris Xe G7 **80 EU** | — | 20 ROPs at 1100 MHz (TechPowerUp meta tag) | — | https://www.techpowerup.com/gpu-specs/iris-xe-graphics-g7-96eu-mobile.c3678 (served a bot-challenge page; only the og:description meta tag was readable, and it describes the 80EU part) | "Intel Tiger Lake GT2, 1100 MHz, 640 Cores, 40 TMUs, 20 ROPs" |
| AMD Radeon 680M (Rembrandt, 12 CU) | 3072 / 3379.2 GFLOPS (base/boost) | 64.0 / 70.4 GP/s | not in table | https://en.wikipedia.org/w/index.php?title=RDNA_2&action=raw | Row "Radeon 680M … 12 CU 768:48:32:12 … 2000 / 2200 … 96.0 / 105.6 [GT/s] … 64.0 / 70.4 [GP/s] … 3072 / 3379.2 [FP32]". Footnote: "Pixel fillrate is calculated as the number of Render Output Units multiplied by the base (or boost) core clock speed." |
| AMD Radeon 780M (Phoenix, 12 CU) | 8,602 GFLOPS (counts RDNA3 dual-issue) | 67.2 GP/s | 128-bit DDR5/LPDDR5(X) | https://en.wikipedia.org/w/index.php?title=RDNA_3&action=raw | Row "Radeon 780M … 768:48:24:12 \| 2,800 \| 134.4 \| 67.2 \| 17,203 \| 8,602" |
| AMD Radeon Vega 8 (integrated) | not found | not found | — | — | TechPowerUp and Notebookcheck returned 403 or a bot challenge |
| Apple M1 (8-core GPU) | 2.6 TFLOPS | **no number published**; Apple only claims leadership | unified memory | https://www.apple.com/newsroom/2020/11/apple-unleashes-m1/ ; https://web.archive.org/web/20201201032000id_/https://www.apple.com/mac/m1/ | "With 2.6 teraflops of throughput, M1 has the world's fastest integrated graphics in a personal computer." / "From teraflops to texture bandwidth to fill rate to power efficiency, this GPU is in a class of its own" |
| Apple M2 (10-core GPU) | 3.6 TFLOPS | not found | — | https://en.wikipedia.org/w/index.php?title=Apple_M2&action=raw | "In total, the M2 GPU contains up to 160 execution units … or 1280 ALUs, which have a maximum floating point (FP32) performance of 3.6 TFLOPs." |
| Apple M3 (base) | not found | not found | — | https://en.wikipedia.org/w/index.php?title=Apple_M3&action=raw | No TFLOPS or fill-rate figure in the article text |

### 1c. Sourced statements: fill rate and overdraw vs. vertex count, blending, and devicePixelRatio

**Particles are typically limited by fill rate and overdraw:**
- NVIDIA, *GPU Gems 3*, ch. 23 (https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles):
  - "Particle systems often consume large amounts of overdraw and fill rate, leading to performance issues."
  - "if these effects fill the screen, overdraw can be almost unbounded and frame rate problems are common"
  - "even a single-particle polygon can easily consume an entire screen's worth of overdraw."
  - On the remedy: "Particles are rendered to an off-screen render target whose size is a fraction of the main frame buffer's size."
- Tooll3 wiki, DrawPoints2 (https://github.com/tooll3/t3/wiki/lib.point.draw.DrawPoints2): "Although drawing points is fast, drawing very large points can lead to high fill rates and can drastically impact render performance."
- deck.gl performance guide (https://deck.gl/docs/developer-guide/performance):
  - "excessive overdraw (drawing many objects/pixels on top of each other) can generate very high fragment counts and thus hurt performance. As an example, a Scatterplot radius of 5 pixels generates ~ 100 pixels per point. If you have a Scatterplot layer with 10 million points, this can result in up to 1 billion fragment shader invocations per frame."
  - "it is possible to render a scatterplot layer with 10M items with reasonable frame rates on recent GPUs, provided that the radius (number of pixels) of each point is small."
- MDN, WebGL best practices (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): "per draw call, fragment shaders generally run many more times than vertex shaders."
- three.js forum, Usnul, 2022-02-07 (https://discourse.threejs.org/t/changing-pixelratio-based-on-fps-good-or-bad-idea/34563): "Dropping resolution (which is what pixelRatio would achieve) would help in case of being "fill-rate" bound, that is, if pixel shader is the bottleneck. If you scene is vertex heavy - it wouldn't help as much, if you scene has a ton of objects and you're bound by the CPU's API cost - dropping resolution would do absolutely nothing."
- three.js forum, Mugen87, 2019-08-13 (https://discourse.threejs.org/t/performance-issue-due-to-fill-rate/9019): "If you lowering the resolution (by decreasing the size of the browser window) and you see no performance improvement, then the application is not fragment shader bound."
  - Same thread: shrinking the window took FPS "from 20FPS to 55FPS". The poster's final diagnosis was draw calls: "Having 2000 draw calls did tamper the performance."
- **Counter-evidence (overdraw cost is not always linear):** pointoverdrawbench (https://git.datenwolf.net/pointoverdrawbench/about/) reports that on a GTX 980 "The drawing times actually reduce with increasing viewport size...". The author treats this as unexplained.

**Blending, sorting and depthWrite with points:**
- Fyrestar, 2020-09-16 (https://discourse.threejs.org/t/problem-when-transparent-points-overlap/18754): "The points need to be sorted before each render call in order to properly blend by alpha, except if you use additive blending then the order doesn't matter."
- Fyrestar, 2020-10-17 (https://discourse.threejs.org/t/a-problem-with-transparency-for-point-geomerty/19863): "Points aren't sorted at all, you need to do this yourself or use additive blending where order doesn't matter. However you should disable depthWrite when working with transparency."
- Imagination/PowerVR, a tile-based GPU (https://docs.imgtec.com/starter-guides/powervr-architecture/html/topics/rules/do-not-use-alpha-blend-unnecessarily.html), as summarized by the fetch tool (**not raw-verified**): "If alpha blending is enabled, then the hardware used to determine a fragment's visibility cannot be used." and "This will likely result in overdraw".
- Apple Metal docs on TBDR, which Apple GPUs use (JSON at https://developer.apple.com/tutorials/data/documentation/metal/tailor-your-apps-for-apple-gpus-and-tile-based-deferred-rendering.json): "Tile memory is fast, temporary storage that resides on the GPU itself. After the GPU finishes rendering each tile into tile memory, it writes the final result to device memory." Listed advantages include "Bandwidth that's many times faster than device memory". I found no Apple statement putting a number on the cost of blended overdraw.

**devicePixelRatio cost:**
- deck.gl (URL above): "If not needed disable Retina/High DPI rendering. It generates 4x the number of pixels (fragments) and can have a big performance impact that depends on which computer or monitor is being used."
- WebGLFundamentals (https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html):
  - "blindly using devicePixelRatio can really slow down your performance. On iPhoneX or iPhone11 window.devicePixelRatio is 3 which means you'll be drawing 9 times as many pixels."
  - "it's a common optimization in games to actually render less pixels than are displayed and let the GPU scale them up."
- MDN (URL above):
  - "A common (and easy) way to trade off quality for speed is rendering into a smaller back buffer, and upscaling the result."
  - "this will cause moire artifacts with non-integer values of devicePixelRatio, as is common with UI scaling on Windows"
- three.js forum (https://discourse.threejs.org/t/low-fps-on-ios-mobile-with-pixel-ration-set-as-window-devicepixelratio/4963):
  - Report: an empty scene ran at 40 fps on iOS with `setPixelRatio(window.devicePixelRatio)` and at 60 fps without it.
  - Mugen87: "If the value is 2 , the resolution is twice as high. Even with simple scenes this can kill performance."
- three.js forum, orion_prime, 2022-02-06 (thread 34563 above): "clearcoat material performance fps is around 27-30 fps with max pixelRatio but if ratio is set to 1 fps is stable at around 57 fps". Same poster, 2022-03-02: "the laptop has dual gpu and browser is using the weaker integrated gpu".
- **three.js r180 source** (`gh api repos/mrdoob/three.js/contents/src/renderers/webgl/WebGLMaterials.js?ref=r180`):
  - `PointsMaterial.size` is multiplied by the pixel ratio: `uniforms.size.value = material.size * pixelRatio;` and `uniforms.scale.value = height * 0.5;`
  - points.glsl.js: `gl_PointSize = size;` … `if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );`
  - Consequence: a built-in PointsMaterial point grows in device pixels as DPR grows. A custom ShaderMaterial that sets `gl_PointSize` directly does not grow unless the shader multiplies by DPR itself (this second point is an inference from the source, not a documented statement).

**Defaults relevant to the stack:**
- R3F `<Canvas>` (https://r3f.docs.pmnd.rs/api/canvas):
  - `dpr` row: "Pixel-ratio, use `window.devicePixelRatio`, or automatic: [min, max] | `[1, 2]`"
  - Renderer defaults: "antialias=true", "alpha=true", "powerPreference=\"high-performance\"" (summarized by the fetch tool).
- three.js `WebGLRenderer` docs (https://threejs.org/docs/pages/WebGLRenderer.html): `powerPreference` "Default is `'default'`."
- MDN getContext (https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext): `"high-performance"`: "Prioritizes rendering performance over power consumption."
- R3F scaling-performance docs (https://r3f.docs.pmnd.rs/advanced/scaling-performance):
  - PerformanceMonitor example: "It starts out with 1.5, if the system falls below the bounds it goes to 1, if it's fast enough it goes to 2."
  - Regression: "you could simply multiply `current` with the pixel ratio to cut down on resolution."
- ANGLE README, the WebGL backend in Chrome (`gh api repos/google/angle/readme`). Platform table: Windows: Direct3D 11 "complete"; macOS: Metal "complete [1]" ("Metal is supported on macOS 10.14+"); desktop GL on Mac "deprecated".

### 1d. DERIVED arithmetic (mine, not a source claim)

These follow deck.gl's "radius → pixels per point" logic.
- A point that is s device-px square costs about s² fragments, so 2 px gives 4, 3 px gives 9 and 4 px gives 16.
- Through three.js `PointsMaterial`, the device-px size is `size × DPR`, so DPR 2 multiplies fragments by 4.
- Screen sizes: 1920×1080 is about 2.07 MP and 3840×2160 is about 8.29 MP.
- Example: 200k additive points at 4 device-px is about 3.2M fragments per frame, roughly 1.5 full 1080p screens of overdraw. GPU Gems' 8800 GTX table above reached 25 fps at 46.9M particle pixels with a heavy 73-instruction shader.
- None of this is measured on an integrated GPU.

---

## 2. Codrops licensing

**Access:** Live https://tympanus.net/codrops/licensing/ returned **HTTP 403** to curl this session (a Cloudflare "Just a moment" page). The Wayback Machine worked.
- CDX query (fetched): https://web.archive.org/cdx/search/cdx?url=tympanus.net/codrops/licensing/&output=json&from=2025&filter=statuscode:200&collapse=digest&limit=60. It lists 200-status captures through 20260804075726 and 20260806145542; earlier queries show captures back to 2012.
- Captures read (raw `id_` mode):
  - 2026-08-06: https://web.archive.org/web/20260806145542id_/https://tympanus.net/codrops/licensing/
  - 2025-10-18: https://web.archive.org/web/20251018110532id_/https://tympanus.net/codrops/licensing/
  - 2024-12-17: https://web.archive.org/web/20241217215232id_/https://tympanus.net/codrops/licensing/
  - 2023-06-06: https://web.archive.org/web/20230606231943id_/https://tympanus.net/codrops/licensing/
  - 2019-07-16: https://web.archive.org/web/20190716072120id_/https://tympanus.net/codrops/licensing/
- The 2024-12, 2025-10 and 2026-08 captures have the same license text.

**Current terms (2024-12 through 2026-08 captures), verbatim:**
> "Our downloadable demos are licensed under the MIT license, if not specifically mentioned otherwise:
> Copyright (c) 2024 Codrops
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND…"
> "Our design freebies can be used in personal or commercial projects with the exception of redistribution, republishing or sale of the item itself, parts of the item, or edited versions."
> "You are free to copy excerpts of our articles but please don't republish entire articles."

(The "MIT license" link points to `https://opensource.org/license/mit/`.)

**2023-06 capture:** "All our downloadable resources are licensed under the MIT license (if not mentioned otherwise): Copyright © 2021 Codrops …", followed by the same MIT text.

**2019-07 capture (older, superseded terms):** "The resources on Codrops can be used freely in personal and commercial projects." / "You don't have to link back to us if it vitiates your work but we appreciate any credit." / "You are not allowed to take our work "as-is" and sell it, redistribute or re-publish it, or sell "pluginized" versions of it." / "You can fork our GitHub repos if you'd like to contribute but please don't republish demos."

**Answers to (a)–(d), each tied to the text above:**
- **(a) Demo code:** "Our downloadable demos are licensed under the MIT license, if not specifically mentioned otherwise". Article prose falls under "free to copy excerpts … don't republish entire articles".
- **(b) Commercial or hackathon use:** The MIT grant covers "use, copy, modify, merge, publish, distribute, sublicense, and/or sell". The page never mentions hackathons (**not found**).
- **(c) Attribution:** The only stated condition is MIT's: "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software." The current page has no separate link-back requirement. The 2019 text said link-back was not required.
- **(d) Do repo LICENSE files override the page?** The page only says "if not specifically mentioned otherwise". It does not mention GitHub repos or LICENSE files. Reading a repo's own license notice as the "specifically mentioned otherwise" case is **my interpretation, not stated**.

**Particle, dissolve and morph demo repos (`gh api repos/OWNER/REPO --jq .license`, this session):**

| Repo | Codrops article | `.license` | LICENSE file? | README license text |
|---|---|---|---|---|
| DGFX/codrops-dreamy-particles | "Crafting a Dreamy Particle Effect with Three.js and GPGPU" (2024-12-19). The archived article links this repo: https://web.archive.org/web/20250120061616id_/https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/ | `null` | none in root listing | No license section. Credits third-party mask models from CGTrader and Sketchfab, whose licenses are separate and **UNVERIFIED** |
| JatinChopra/emissive-dissolve-effect | "Implementing a Dissolve Effect with Shaders and Particles in Three.js" (README links `tympanus.net/codrops/2025/02/17/...`); repo homepage `https://tympanus.net/Tutorials/EmissiveDissolveEffect/` | `null` | **No.** `contents/LICENSE` returned 404 | "## License [MIT](LICENSE)", a dead link |
| codrops/ParticleEffectsButtons | `?p=34685` (2018) | `null` | none in root listing | "This resource can be used freely if integrated or build upon in personal or commercial projects such as websites, web apps and web templates intended for sale. It is not allowed to take the resource "as-is" and sell it, redistribute, re-publish it, or sell "pluginized" versions of it. Free plugins built using this resource should have a visible mention and link to the original work." |
| brunoimbrizi/interactive-particles | "Interactive Particles with Three.js" (2019-01-17) | `null` | none in root listing | Same custom text as ParticleEffectsButtons |
| codrops/WebGLBlobs (comparison) | `?p=52932` | `{"key":"mit",…}` | yes | "MIT License / Copyright (c) 2009 - 2020 [Codrops](https://tympanus.net/codrops)" |
| codrops/CinemaSeatPreview (comparison) | — | `{"key":"mit",…}` | yes | — |

The codrops GitHub org has 349 public repos. GitHub detects MIT for 129 of them and no license for 220 (`gh api --paginate orgs/codrops/repos`, this session). Many WebGL tutorial demos live in the authors' own repos rather than the codrops org.

---

## 3. Iron Man nanotech suit-up: sourced numbers and timing

**Bottom line:** I found **no** sourced figure for the seconds or frames of any suit-up shot, simulation particle counts, or render times. The numbers that do exist are shot counts, team sizes, a shot count for the snap, weapon and damage-stage counts, and descriptions of ordering.

### 3a. Numbers

| Film / suit | Vendor | Fact | URL | Quote |
|---|---|---|---|---|
| Infinity War, Mk 50 (NYC opening) | Framestore | 253 shots covering about the first 12 minutes | https://www.framestore.com/avengersinfinitywar ; https://www.artofvfx.com/?p=21880 | "Framestore completed 253 shots for the opening act" / Roos: "the first 12 minutes or so of the movie" |
| same | Framestore | Team: 160 artists, 26 animators | https://awn.com/vfxworld/framestore-delivers-action-packed-opening-avengers-infinity-war ; artofvfx above | "a team of 160 artists led by VFX supervisor Patric Roos" / "The animation team consisted of 26 artists." |
| same | Framestore | Suit design took about 2 years | framestore.com/avengersinfinitywar | "'Iron Man has a new suit design, which we worked on closely with Marvel for about two years before the design was locked in', says Roos." |
| same | Framestore | Official breakdown reel is 208 s long. This is the reel, not the suit shot | YouTube oEmbed and watch page for https://www.youtube.com/watch?v=V5mS7BHmZJI | Title "Avengers: Infinity War \| VFX Breakdown \| Framestore"; `"lengthSeconds":"208"`; published 2018-08-14; description: "Framestore completed over 250 shots for the opening act…" |
| Infinity War, Mk 50 (Titan) | Wētā | 12 weapons built | https://vfxvoice.com/how-the-avengers-super-powers-became-even-more-super/ | Aitken: "we built 12 different weapons. We got concept art for about four of them" |
| Endgame, Mk 85 | Wētā | 6 damage stages; 494 shots; core team of 570 | https://awn.com/vfxworld/weta-and-thanos-come-full-circle-avengers-endgame ; https://www.artofvfx.com/?p=25772 | "Iron Man goes through six different stages of damage in this film." / "Weta Digital delivered 494 shots for AVENGERS: ENDGAME." / "The core team on the show at Weta Digital was 570 people." |
| Endgame, snap / nano-gauntlet | Wētā | 2 snap shots, about 3 compositors per shot; among the last shots delivered | https://beforesandafters.com/2019/05/14/how-endgames-battle-against-thanos-went-from-greenscreen-stages-to-those-final-epic-shots/ ; https://comicbook.com/marvel/news/avengers-endgame-vfx-interview-matt-aitken-weta-digital | "we had a really great comp'er on each of those two shots. We had support comp'ers working with him… so essentially three comp'ers per shot." / "Those were actually the last shots that we delivered for Endgame." |
| Endgame, quantum suits | Framestore | 301 shots; 310 people (about 210 at peak); 22 Quantum Gate shots | https://www.artofvfx.com/?p=25704 ; https://www.framestore.com/avengersendgame | "SP: 301" / "310 people worked on the show about 210 working together at the peak." / "Quantum Gate… that features in 22 spellbinding shots." |
| Endgame, whole film | Marvel (DeLeeuw) | 2,496 VFX shots; 5,119 across the two films | https://www.artofvfx.com/?p=25647 | "2496." / "After finagling 5119 shots over the course of two films" |

### 3b. Timing, ordering and spread (qualitative, sourced)

- **Mk 50 trigger and spread (Infinity War, NYC):**
  - Motion Picture Association / The Credits, 2018-08 (https://www.motionpictures.org/2018/08/see-how-they-created-iron-mans-nanotech-suit-for-avengers-infinity-war/): "it's already on his person, only entirely invisible to the naked eye. With a tap on the arc reactor in his chest and a swift pull on his hoodie, Tony's nanotech suit pours itself across him in seconds." This is journalistic wording, not a measured duration.
  - Gigazine, describing the Framestore reel (https://gigazine.net/gsc_news/en/20180817-avengers-infinity-war-framestore-vfx-breakdown): "In the mechanism that Iron man suit is deployed when touching the chest reactor ...... Where the suit covers Tony 's body is CG. Robert Downey Jr who plays Tony wears a jacket with a red marker ... ... An animation of the suit is made with this as a mark".
  - Framestore (framestore.com/avengersinfinitywar): "rather than unfolding, it is made up of singular nanobots which move around his body to form a suit. The manifestation of the suit moving around the character needed to look both organic and mechanical… The FX team used a bespoke FX set-up and Houdini to achieve the several layers of simulations and components required to look like a second skin."
  - Liam Russell, Framestore (artofvfx ?p=21880): "one of the shots he's walking in slow motion as the suit builds around him. Slow mo is difficult enough to animate realistically without having to consider how the suit would move with him as it grows."
  - Patric Roos (same): "we needed to come up with a whole new way of describing the suit functionality when turning on and off and describing arbitrary shapes."
- **Wētā's nano look (Infinity War to Endgame):**
  - Aitken, VFX Voice (https://www.vfxvoice.com/?p=13121260): "We developed the look of Iron Man's new Mark 50 Bleeding Edge suit with its nano-tech particles, which we generated with procedural geometry."
  - Aitken, /Film (https://www.slashfilm.com/avengers-endgame-final-battle-vfx), on order of formation: "we used a helmet reveal to re-develop that tech, that's something we're doing in Houdini… It's a combination of particle simulations and fluid simulations, so the material kind of moves around like a fluid metal, like mercury or something. The gag is that it sort of locks in like an underlying grid structure, so it kind of crystalizes and forms a grid… The outer shell of the suit will sort of swell out through that and lock into place."
  - Aitken, ComicBook.com (URL above): "nanoparticles that can kind of form a fluid and move around on the surface of the suit, and reform different weapons, and then kind of solidify and crystallize into a rigid, metal suit." / "really extended it for Endgame for two particular sequences."
  - Aitken, VFX Voice (how-the-avengers… URL above), on loss of material: "Once they get beyond a certain distance from the suit, they can't make it back, so the volume of nano material that Iron Man has to work with gets gradually reduced."
  - Aitken, /Film: "It's really only used in a few key moments in Endgame."
- **Snap effect ordering (Endgame):**
  - Gerardo Aguilera, Wētā FX supervisor (artofvfx ?p=25772): "We created the effect in two main stages. First, we got the timing of the energy coloured lines that we see coming off the stones and moving across the suit. Once that timing and look was approved, we used the same technique for the nano suit, but this time to create the damage. We used the timing of the colour lines to create small "trenches" on the suit that were creating damage as they moved across the suit… the compositors could have control over how fast or slow this damage to the suit was occurring."
  - Aitken (befores & afters URL above): "Getting the bleeding edge tip was the trickiest part, where the suit is trying to reform." / "we actually see it start to crawl up his face." / "our initial pass was way over the top."
- **Quantum suits (Endgame):**
  - DeLeeuw (artofvfx ?p=25647): "The suits could build over the characters body using Stark's bleeding edge technology. We based the effect on Framestore's work from INFINITY WAR on the MK 50 Iron Man armor."
  - Framestore (framestore.com/avengersendgame): "These suits then had to manifest over their original outfits using the nanobot technology Framestore developed for Iron Man's bleeding-edge Infinity War suit. Their helmets… also needed to be built in CG and manifest in the same way over the actor's face." Allman: "We used the nanobot tech to give the impression that it comes out of nowhere."
  - Russell Earl, ILM, via ComicBook.com (https://comicbook.com/marvel/news/avengers-endgame-movie-quantum-realm-suits-vfx-marvel/?nb=1): "it has the sort of nanotech growing out of the time watches". Earl also hedged: "I'm speculating on it" (summarized by the fetch tool).
  - Stuart Penn's shot list (artofvfx ?p=25704) includes "the manifestation of the suits helmets", "a couple of suit manifestation shots" and "Hulk and suit de-manifestations".

---

## UNVERIFIED / not found

- **Gap 1**
  - No sourced count/fps measurement for THREE.Points or additive sprites on **Iris Xe, UHD 620/630, Vega 8, Radeon 680M/780M, Apple M2, Apple M3**.
  - The M1 data covers instanced quads (1M at 60 fps), a 36k morph demo, and Aquarium meshes. None of it is additive points at a stated resolution.
  - The integrated-vs-discrete GPU in the "2018 Intel MacBook Pro" and the "2015 MacBook Pros with dual graphics cards" is **UNVERIFIED**.
  - No published pixel fill rate for Apple M1/M2/M3, Intel UHD 620/630 (Gen9) or Vega 8. TechPowerUp and Notebookcheck returned 403 or a bot challenge, and Intel's Gen11 PDF returned 403.
  - The Iris Xe GPixel/s figure is **DERIVED** (24 px/clk × clock).
  - The PowerVR alpha-blend quotes come from the fetch tool's summary; I did not check them against the raw page.
  - Chrome GPU blocklist (software_rendering_list): not checked.
  - Babylon.js and PlayCanvas: no integrated-GPU particle benchmark found. Babylon's GPU-particle doc uses "1,000,000" only as an example ("you can go crazy with active particles (1,000,000 in this example)").
- **Gap 2**
  - The live licensing page is Cloudflare-blocked; all terms above come from Wayback captures (latest 2026-08-06).
  - The page never explicitly says whether repo LICENSE files override it.
  - The page never mentions hackathons.
  - The licenses of third-party 3D models credited in DGFX/codrops-dreamy-particles were not checked.
  - The JatinChopra repo's README claims MIT, but there is no LICENSE file.
- **Gap 3**
  - **Not found:**
    - suit-up shot duration in seconds or frames (Mk 50, Mk 85, quantum suits)
    - frame counts
    - render times
    - particle or point counts
    - simulation resolution
    - per-sequence shot counts for the suit-up itself
  - "Pours itself across him in seconds" is journalistic wording, not a measurement. The 208 s figure is the length of Framestore's breakdown reel, not of any shot.
  - No fxguide article on the nano suit was found. The befores & afters 2026 *Endgame* retrospective is paywalled. A SIGGRAPH 2018 production session on Infinity War (Marvel, ILM, Wētā, Digital Domain) appeared only in a web-search snippet. I did not fetch it, so it is **UNVERIFIED** and no suit-timing content was found.
