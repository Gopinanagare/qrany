# QRDrop • Minimalist Vector QR Code Generator

> Drop anything. Get your QR in seconds.

[![Vercel Deployment Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-black?style=flat&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An ultra-clean, minimalist web application where you can upload documents, imagery, or paste links to construct high-res vector QR codes with zero telemetry and instant offline scanning.

Faithfully implements the **Stitch project "Minimalist QR Code Generator" (ID: 7339313209937678449)** using the Scandinavian Obsidian Utility design system.

---

## ⚡ Features

- **Document & File to QR**: Drag and drop PDFs, DOCX, CSV, spreadsheets, and archives.
- **Photo & Image to QR**: Upload high-resolution images (JPG, PNG, WebP, GIF) with live thumbnail preview.
- **Link & Text to QR**: Instant redirect for URLs, raw text, and one-tap templates for **Wi-Fi credentials** and **Contact vCards**.
- **Dual Sharing Engine**:
  - **Local Wi-Fi Network**: Direct, private transfer over local LAN for instant offline scanning.
  - **Global Public Cloud**: Anonymous CDN cloud hosting via `tmpfiles.org` so your QR code can be scanned anywhere in the world!
- **Mobile QR Receiver Page (`/f/:id`)**: Scanned QR codes open a responsive mobile view with one-tap device download and in-browser preview.
- **Appearance & Precision Customization**:
  - **Dot Geometry**: *Rounded Dots*, *Classic Square*, and *Smooth Blobs*.
  - **Color Palette**: *Obsidian Black*, *Electric Indigo*, *Forest Green*, *Crimson Core*, and custom HEX picker.
  - **Error Correction Level (ECC)**: *L (7%)*, *M (15%)*, *Q (25%)*, *H (30%)*.
  - **Center Watermark**: Embedded badge toggle.
- **Export & Utility**:
  - **PNG (4K Ultra HQ)**: 1024×1024 px raster download.
  - **SVG (Vector Scalable)**: Lossless vector asset for print and production.
  - **PDF Print Flyer**: Formatted printable sheet layout.
  - **Clipboard Copy**: Direct image copy (`ClipboardItem`).
  - **Integrated Camera QR Scanner**: Scan any QR code directly using your webcam or by uploading a screenshot.
  - **Command Palette (<kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>)**: Quick search and tab jumping.
  - **Dark / Light Mode**: Instant theme switching.

---

## 🚀 Instant Vercel Deployment

This project is pre-configured with `vercel.json` for zero-configuration deployment to Vercel:

1. Import this repository into **[Vercel](https://vercel.com/new)**.
2. Select **Other** as Framework Preset (or leave default).
3. Click **Deploy**.

That's it! Your site will be live on Vercel at `https://your-project.vercel.app`.

---

## 💻 Local Development Setup

To run locally with the full Node.js Express server:

```bash
# Clone repository
git clone https://github.com/Gopinanagare/qrany.git
cd qrany

# Install dependencies
npm install

# Start the server
npm start
```

Visit:
- On your computer: `http://localhost:3000`
- On your phone: `http://<your-local-ip>:3000` (automatically displayed in terminal and app)

---

## 🛠️ Tech Stack

- **Design System**: Obsidian Utility (Stitch Design System)
- **Typography**: Plus Jakarta Sans, Inter, JetBrains Mono
- **Styling**: Tailwind CSS + Google Material Symbols
- **QR Engine**: `qr-code-styling` (Vector SVG + Canvas)
- **QR Scanner**: `html5-qrcode`
- **Backend (Local)**: Node.js, Express, Multer, CORS
- **Hosting**: Vercel Static Edge Compatible

---

## 📄 License

MIT License. Free for personal and commercial use.
