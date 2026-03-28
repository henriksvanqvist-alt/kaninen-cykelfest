#!/usr/bin/env node
// Patches dist/index.html after expo export to add PWA/viewport fixes
const fs = require('fs');
const path = require('path');

// 0. Copy PWA icon to dist/
const iconSrc = path.join(__dirname, 'assets', 'images', 'kaninen-icon.png');
const iconDst = path.join(__dirname, 'dist', 'kaninen-icon.png');
fs.copyFileSync(iconSrc, iconDst);
console.log('✓ kaninen-icon.png copied to dist/');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// 1. Fix viewport to include viewport-fit=cover
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />'
);

// 2. Add apple PWA meta tags + icons after viewport (only if not already present)
if (!html.includes('apple-mobile-web-app-capable')) {
  html = html.replace(
    /(<meta name="viewport"[^>]*>)/,
    `$1
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Kaninens Cykelfest" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="apple-touch-icon" href="/kaninen-icon.png" />
    <link rel="icon" type="image/png" href="/kaninen-icon.png" />`
  );
}

// 3. Replace the expo-reset style block with our fixed version
const newStyles = `    <style id="expo-reset">
      html,
      body {
        height: 100%;
        height: 100svh;
        background-color: #F5EFE0;
      }
      body {
        overflow: hidden;
        overscroll-behavior: none;
        position: fixed;
        width: 100%;
      }
      #root {
        display: flex;
        height: 100%;
        height: 100svh;
        flex: 1;
        overflow: hidden;
      }
    </style>`;

html = html.replace(/<style id="expo-reset">[\s\S]*?<\/style>/, newStyles);

// 4. Write manifest.json and inject link
const manifest = {
  name: 'Kaninens Cykelfest',
  short_name: 'Cykelfest',
  start_url: '/',
  display: 'standalone',
  background_color: '#1C4F4A',
  theme_color: '#1C4F4A',
  icons: [
    { src: '/kaninen-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
fs.writeFileSync(path.join(__dirname, 'dist', 'manifest.json'), JSON.stringify(manifest, null, 2));
if (!html.includes('manifest.json')) {
  html = html.replace('</head>', '  <link rel="manifest" href="/manifest.json" />\n</head>');
}

fs.writeFileSync(htmlPath, html);
console.log('✓ dist/index.html patched');
console.log('✓ manifest.json written');

// 5. Recreate vercel.json (expo export deletes it every time)
const vercelJson = {
  buildCommand: null,
  installCommand: null,
  framework: null,
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
};
fs.writeFileSync(
  path.join(__dirname, 'dist', 'vercel.json'),
  JSON.stringify(vercelJson, null, 2)
);
console.log('✓ dist/vercel.json recreated');
