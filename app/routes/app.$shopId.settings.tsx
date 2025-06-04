import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { Card, Page, Layout, TextField, Button, Banner, Checkbox } from "@shopify/polaris";
import prisma from "~/db.server";
import crypto from "crypto";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopId } = params;
  const { session } = await authenticate.admin(request);
  
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!store || store.shopDomain !== shopId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Get global API settings
  const apiToken = await prisma.apiToken.findUnique({
    where: { service: "improvement_api" },
  });

  return json({
    shopDomain: session.shop,
    apiKey: store.apiKey || "",
    improvementApiEnabled: store.improvementApiEnabled,
    globalApiEndpoint: process.env.IMPROVEMENT_API_URL || "",
    hasGlobalApiKey: !!apiToken,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const apiKey = formData.get("apiKey") as string;
  const improvementApiEnabled = formData.get("improvementApiEnabled") === "true";
  const globalApiKey = formData.get("globalApiKey") as string;
  
  // Update store settings
  await prisma.store.update({
    where: { shopDomain: session.shop },
    data: {
      apiKey,
      improvementApiEnabled,
    },
  });

  // Update global API key if provided
  if (globalApiKey && globalApiKey !== "********") {
    const encryptedKey = encrypt(globalApiKey);
    
    await prisma.apiToken.upsert({
      where: { service: "improvement_api" },
      create: {
        service: "improvement_api",
        token: encryptedKey,
        metadata: {
          endpoint: process.env.IMPROVEMENT_API_URL,
        },
      },
      update: {
        token: encryptedKey,
        metadata: {
          endpoint: process.env.IMPROVEMENT_API_URL,
        },
      },
    });
  }

  return json({ success: true });
}

function encrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || "default-encryption-key-32-chars!",
    "salt",
    32
  );
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return iv.toString("hex") + ":" + encrypted;
}

export default function Settings() {
  const { shopDomain, apiKey, improvementApiEnabled, globalApiEndpoint, hasGlobalApiKey } = 
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  
  const isSubmitting = fetcher.state === "submitting";
  const saved = fetcher.data?.success;

  return (
    <Page
      title="API Settings"
      subtitle={`Shop: ${shopDomain}`}
      backAction={{ url: `/app/${shopDomain}/products` }}
    >
      <Layout>
        {saved && (
          <Layout.Section>
            <Banner
              title="Settings saved successfully"
              status="success"
              onDismiss={() => {}}
            />
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <fetcher.Form method="post">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Shop API Key</h2>
                  <TextField
                    label="API Key for this shop"
                    name="apiKey"
                    defaultValue={apiKey}
                    helpText="This key identifies your shop when making API requests"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-4">
                  <Checkbox
                    label="Enable Product Improvement API"
                    helpText="When enabled, selected products will be sent to the improvement API"
                    name="improvementApiEnabled"
                    defaultChecked={improvementApiEnabled}
                  />
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h2 className="text-lg font-semibold">Global API Configuration</h2>
                  
                  <TextField
                    label="API Endpoint"
                    value={globalApiEndpoint}
                    helpText="Configured in environment variables"
                    disabled
                  />

                  <TextField
                    label="Global API Key"
                    name="globalApiKey"
                    type="password"
                    defaultValue={hasGlobalApiKey ? "********" : ""}
                    helpText="Enter a new key to update, or leave as is to keep current"
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex justify-end">
                  <Button submit primary loading={isSubmitting}>
                    Save Settings
                  </Button>
                </div>
              </div>
            </fetcher.Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div className="p-6">
              <h3 className="text-md font-semibold mb-4">API Integration Guide</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. Enable the Product Improvement API above</p>
                <p>2. Select products from the Products page</p>
                <p>3. Products will be sent to: <code className="bg-gray-100 px-2 py-1 rounded">{globalApiEndpoint}</code></p>
                <p>4. Review and approve improvements on the Improvements page</p>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}