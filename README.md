# DreamKit Studio — Premium Local-First Developer SaaS Suite

> Zero Latency. Zero Cloud Egress. 100% In-Browser Privacy.
> Built with React 19, Vite, Tailwind CSS, WebAssembly, and Web Audio API.

---

## ✨ Overview

**DreamKit Studio** is a modern, high-performance developer suite featuring an editorial, bespoke SaaS landing page as the primary entrance, followed by 42+ local-first developer productivity utilities. 

Every engine runs entirely inside client-side browser memory—no network egress, no telemetry, and no account required.

### 🌟 Key Highlights

1. **Flagship SaaS Landing Page (Primary Entry)**
   - **Bespoke UI Layout**: Dark-first glassmorphism, gradient accents, and subtle typography hierarchy (non-generic, non-template).
   - **Interactive macOS Dev Console**: Live interactive format, minify, and schema tabs right in the hero section.
   - **Metrics Proof Strip**: Real-time counter metrics (42+ tools, 0ms latency, 100% private, 45k+ engineers).
   - **Asymmetric Bento Grid**: Showcases WebAssembly audio demuxing, contrast science, and client sandboxing.
   - **Live Interactive Playground**: In-situ live JSON validator and beautifier with instant copy.
   - **CLI & Docker Switcher**: One-click copy commands for `npx`, `curl`, `docker`, and `npm`.
   - **Head-to-Head Comparison Matrix**: DreamKit vs. typical cloud developer utilities.
   - **Interactive ROI Calculator**: Real-time time & cost savings calculator tailored to team size.
   - **Wall of Love Testimonials**: Real-world engineer quotes with tags and credibility badges.
   - **Tiered Pricing Table**: Monthly and Annual toggle with a 25% discount switch and full feature matrices.
   - **FAQ Accordion & Enterprise Footer**: Clear HIPAA/SOC2/GDPR compliance answers and multi-column navigational footer.
   - **Firebase Authentication**: Seamless Google (Gmail) and standard Email/Password sign-in, registration, and password recovery.

2. **42+ Local-First Developer Utilities**
   - **Code & Formatters**: JSON Formatter, JSON Minifier, YAML, XML, HTML, CSS, JavaScript, SQL, HTML Table Generator.
   - **Encoders & Converters**: Base64, URL Encoder, JSON ↔ XML, JSON ↔ CSV, UUID Generator, Lorem Ipsum.
   - **Media & Audio**: Video-to-Audio Extractor (WAV/MP3/OGG demuxing), Color Palette Suite (WCAG contrast audit & Tailwind token export), Image Compressor, Image Resizer/Cropper, Format Converter, Watermark, Grayscale, Blur, Pixelator, Social Resizer, Favicon Generator, SVG Optimizer, Placeholder Generator.
   - **PDF & Documents**: PDF Compressor, PDF Merger, PDF Splitter, Watermark, Digital Signatures, OCR Rasterizer, Grayscale Converter.
   - **Analysis & Security**: JWT Debugger, HTTP Status Codes, Regex Tester, SERP Google Preview, Robots.txt & Sitemap, Schema Markup Validator, SEO Audit Suite, QR Code Generator, Word Counter.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Code Editor Engine**: [@uiw/react-codemirror](https://uiwjs.github.io/react-codemirror/) with `@codemirror/lang-json` and `@codemirror/theme-one-dark`
- **Audio Demuxing Engine**: Browser-native Web Audio API (`OfflineAudioContext`, `AudioBuffer`)
- **PDF Engine**: Client-side `pdf-lib` and Canvas rendering

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+` or higher (tested on Node v22)
- npm `v9+` or higher

### Installation

```bash
# Clone or navigate to the repository
cd dreamkit

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser. The SaaS Landing Page loads as the primary default view. Clicking **"Launch Studio"** or selecting any individual tool opens the full interactive developer workspace.

---

## 🔒 Privacy & Architecture Guarantee

```
Everything stays in your browser. Zero cloud egress. Zero tracking.
```

- **Local RAM Execution**: Processing is executed inside the browser's JavaScript and WebAssembly sandbox.
- **Air-Gapped Friendly**: Functions fully offline once loaded.
- **Zero Telemetry**: No third-party analytics trackers, cookies, or cloud databases.

---

## 📄 License

MIT &copy; DreamKit Studio Inc.
