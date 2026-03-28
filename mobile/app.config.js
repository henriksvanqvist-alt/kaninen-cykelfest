// Extends app.json with web-specific config (viewport-fit, theme-color, iOS PWA)
module.exports = ({ config }) => ({
  ...config,
  web: {
    ...config.web,
    themeColor: '#1C4F4A',
    viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
    meta: {
      ...((config.web || {}).meta || {}),
      'apple-mobile-web-app-status-bar-style': {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      'apple-mobile-web-app-capable': {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      'mobile-web-app-capable': {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
    },
  },
});
