/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/*.css"],
  serverModuleFormat: "esm",
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_lazyRouteDiscovery: true,
    v3_singleFetch: true,
  },
  serverDependenciesToBundle: [
    "@shopify/shopify-app-remix",
    "@shopify/shopify-app-remix/server",
    "@shopify/shopify-app-session-storage",
    "@shopify/shopify-api",
  ],
};