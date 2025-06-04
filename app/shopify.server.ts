import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: "2024-10",
  scopes: process.env.SCOPES?.split(",") || [],
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: "public", // Back to public for development
  restResources,
  isEmbeddedApp: false, // Disable embedded mode for development
  useOnlineTokens: false, // Use offline tokens for simpler auth
  exitIframe: {
    name: "Shopify",
    url: "/",
  },
  webhooks: {},
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("[DEBUG] AfterAuth hook started for shop:", session.shop);
      
      try {
        // Skip webhook registration in development
        if (process.env.NODE_ENV !== "development") {
          console.log("[DEBUG] Registering webhooks for production");
          await shopify.registerWebhooks({ session });
        } else {
          console.log("[DEBUG] Skipping webhook registration in development");
        }
        
        // Save or update store information
        console.log("[DEBUG] Saving store information to database");
        await prisma.store.upsert({
          where: { shopDomain: session.shop },
          update: {
            accessToken: session.accessToken!,
            scope: session.scope,
            updatedAt: new Date(),
            improvementApiEnabled: true, // Always enable for all stores
          },
          create: {
            shopDomain: session.shop,
            accessToken: session.accessToken!,
            scope: session.scope,
            improvementApiEnabled: true, // Always enable for all stores
          },
        });
        console.log("[DEBUG] Store information saved successfully");
      } catch (error) {
        console.error("[DEBUG] Error in afterAuth hook:", error);
        // Don't throw the error, just log it to prevent breaking OAuth
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = "2024-10";
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;