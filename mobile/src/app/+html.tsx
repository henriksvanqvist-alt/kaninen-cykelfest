import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only — configures the root HTML for every page during
// static rendering (expo export --platform web).
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>Kaninens Cykelfest 2026</title>

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme & status bar */}
        <meta name="theme-color" content="#1C4F4A" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Safari PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cykelfest" />
        <link rel="apple-touch-icon" href="/icon-512.png" />

        {/* Prevent address bar theming on Android */}
        <meta name="msapplication-TileColor" content="#1C4F4A" />

        {/* Disable body scrolling — makes ScrollView work like native */}
        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
html { height: 100%; }
body { height: 100%; height: 100dvh; margin: 0; padding: 0; background-color: #111; overflow: hidden; display: flex; justify-content: center; align-items: stretch; }
#root { display: flex; height: 100%; height: 100dvh; flex: 1; max-width: 430px; width: 100%; margin: 0 auto; overflow: hidden; background-color: #1c4f4a; box-shadow: 0 0 60px rgba(0,0,0,0.5); }
@supports (height: 100svh) {
  body, #root { height: 100svh; }
}
`,
          }}
        />
      </head>
      <body>
        {children}

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function (reg) { console.log('[PWA] SW registered:', reg.scope); })
      .catch(function (err) { console.log('[PWA] SW failed:', err); });
  });
}

// Show "Add to Home Screen" banner if running in browser (not standalone PWA)
(function() {
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (isStandalone) return;
  var dismissed = sessionStorage.getItem('pwa_banner_dismissed');
  if (dismissed) return;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isAndroid = /android/i.test(navigator.userAgent);
  if (!isIOS && !isAndroid) return;

  var banner = document.createElement('div');
  banner.id = 'pwa-banner';
  banner.style.cssText = [
    'position:fixed;bottom:0;left:0;right:0;z-index:99999',
    'background:#1C4F4A;color:#F5EFE0',
    'display:flex;align-items:center;justify-content:space-between',
    'padding:12px 16px;gap:10px',
    'font-family:system-ui,sans-serif;font-size:13px',
    'box-shadow:0 -2px 12px rgba(0,0,0,0.3)',
  ].join(';');

  var msg = isIOS
    ? '📲 Tryck på \u25EB och välj "Lägg till på hemskärmen" för bästa upplevelse'
    : '📲 Installera appen – tryck på menyn och välj "Lägg till på hemskärmen"';

  banner.innerHTML = '<span style="flex:1;line-height:1.4">' + msg + '</span>'
    + '<button onclick="document.getElementById(\'pwa-banner\').remove();sessionStorage.setItem(\'pwa_banner_dismissed\',\'1\')" '
    + 'style="background:rgba(255,255,255,0.15);border:none;color:#F5EFE0;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;white-space:nowrap">Stäng</button>';

  document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(banner);
  });
})();
`,
          }}
        />
      </body>
    </html>
  );
}
