import { Outlet, useLoaderData, useMatches } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    polarisTranslations: await import(
      "@shopify/polaris/locales/en.json"
    ).then((module) => module.default),
  });
}

export default function App() {
  const { apiKey, polarisTranslations } = useLoaderData<typeof loader>();

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    </PolarisAppProvider>
  );
}