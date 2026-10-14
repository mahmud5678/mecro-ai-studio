# MECRO AI Studio

A responsive, English-only creative toolkit for GitHub Pages. The interface includes 28 tool cards across image, video, PDF, utility and AI-service categories.

## Publish on GitHub Pages
1. Extract this ZIP.
2. Upload the contents of this folder to the root of your `mecro-ai-studio` repository (upload the files, not the ZIP itself).
3. Commit changes to `main`.
4. In Settings → Pages, select `Deploy from a branch`, branch `main`, folder `/ (root)`.

## Important feature notes
- Browser image tools include compression, format conversion, resizing, cropping, rotation/flip, basic filters, text watermarking, rectangular blur, image info, Base64, favicon, color sampling and images-to-PDF.
- QR Code generation and Images-to-PDF use third-party libraries loaded from CDNs; those tools need an internet connection.
- Video thumbnail capture and WebM export depend on browser support. Video export may omit audio. GIF encoding is not included.
- AI Background Remover and AI Video Generator are clearly marked as requiring a real AI model/provider. They do not pretend to work without an integration.
- Mark Cleaner is only a basic blur operation, not AI inpainting. Use it only on content you own or are authorized to edit. It is not designed to remove ownership/copyright marks from other people's work.
- GitHub Pages is static hosting. Do not place private API keys in `script.js`. Real AI generation, robust background removal and advanced video processing generally need a suitable provider and/or backend.
- This project does not guarantee income. Add monetization only after checking each provider's current terms, privacy obligations, hosting constraints and applicable law.

## Privacy
Image tools process selected files in the browser. Files are not uploaded by these local tools. External CDN libraries are fetched from their providers, and future connected AI services may process user content on their servers; disclose that clearly before adding them.
