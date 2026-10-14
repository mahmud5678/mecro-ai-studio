# MECRO AI Studio

A responsive, English-language image tools website designed to be hosted on GitHub Pages. All image work in this starter version happens locally in the visitor's browser; images are not uploaded to a server.

## Included tools

- **Mark Cleaner** — a simple brush-based retouch/softening tool. It is not AI inpainting and may not reconstruct complex details.
- **Background Remover** — colour-sampling removal for plain or similar-coloured backgrounds. It is not a full AI segmentation model.
- **Image Enhancer** — brightness, contrast and saturation adjustments.
- **Image Compressor** — exports JPEG/WebP with quality settings.
- **Image Converter** — exports PNG, JPEG or WebP.
- **Image Resizer** — exports at custom pixel dimensions.

## Publish on GitHub Pages

1. Extract `MECRO-AI-Studio.zip` on your device.
2. Open your GitHub repository and upload `index.html`, `style.css`, `script.js` and `README.md` to the repository root.
3. Commit the upload.
4. In the repository, open **Settings → Pages**. Choose **Deploy from a branch**, select your main branch and the root folder, then save.
5. Wait for GitHub Pages to publish the site.

## Important limitations

This is a static front-end project; it does not include real AI models or a backend. Full AI background removal, generative object removal/inpainting, and AI upscaling require a model or a secure server/API integration. Do not put private API keys in browser JavaScript. Never claim an AI feature is active until it is connected and tested.

The Mark Cleaner is intended for minor retouching of images you own or are authorized to edit. Do not use it to remove copyright notices or ownership marks from someone else's work. The background remover works best on plain backgrounds and may produce imperfect edges.

## Monetization

This ZIP does not include ads, subscriptions, payment processing or analytics. Add and test those separately once the site is live and you have reviewed the provider's eligibility, privacy and terms requirements. Hosting a static site does not guarantee income.
