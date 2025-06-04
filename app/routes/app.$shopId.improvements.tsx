import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { Card, Page, Layout, Button, Badge, Thumbnail } from "@shopify/polaris";
import prisma from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopId } = params;
  const { session } = await authenticate.admin(request);
  
  // Verify shop access
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!store || store.shopDomain !== shopId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Get pending improvements
  const improvements = await prisma.improvement.findMany({
    where: {
      status: "pending_approval",
      product: {
        shopDomain: session.shop,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({
    improvements,
    shopDomain: session.shop,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const improvementId = formData.get("improvementId") as string;
  const action = formData.get("action") as string;
  
  const improvement = await prisma.improvement.findFirst({
    where: {
      id: parseInt(improvementId),
      product: {
        shopDomain: session.shop,
      },
    },
    include: {
      product: true,
    },
  });

  if (!improvement) {
    throw new Response("Not found", { status: 404 });
  }

  if (action === "approve") {
    // Update product in Shopify
    const improvedData = improvement.improvedSeo as any || {};
    
    await admin.rest.resources.Product.save({
      session,
      id: improvement.product.productId,
      title: improvement.improvedTitle || improvement.product.title,
      body_html: improvement.improvedDescription || improvement.product.description,
      metafields_global_title_tag: improvedData.title,
      metafields_global_description_tag: improvedData.description,
    });

    // Update improvement status
    await prisma.improvement.update({
      where: { id: improvement.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        appliedAt: new Date(),
      },
    });

    // Update product status
    await prisma.product.update({
      where: { id: improvement.productId },
      data: { status: "improved" },
    });
  } else if (action === "reject") {
    await prisma.improvement.update({
      where: { id: improvement.id },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
      },
    });
  }

  return json({ success: true });
}

export default function ImprovementsReview() {
  const { improvements, shopDomain } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const handleAction = (improvementId: number, action: "approve" | "reject") => {
    const formData = new FormData();
    formData.append("improvementId", improvementId.toString());
    formData.append("action", action);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Page
      title="Product Improvements"
      subtitle={`Shop: ${shopDomain}`}
      backAction={{ url: `/app/${shopDomain}/products` }}
    >
      <Layout>
        {improvements.length === 0 ? (
          <Layout.Section>
            <Card>
              <div className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Pending Improvements
                </h3>
                <p className="text-gray-600">
                  Select products to improve from the products page.
                </p>
                <div className="mt-4">
                  <Button url={`/app/${shopDomain}/products`} primary>
                    Go to Products
                  </Button>
                </div>
              </div>
            </Card>
          </Layout.Section>
        ) : (
          <Layout.Section>
            {improvements.map((improvement) => (
              <Card key={improvement.id} sectioned>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Product */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Original</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {improvement.product.images && (
                        <div className="mb-4">
                          <Thumbnail
                            source={(improvement.product.images as any)[0]?.src || ""}
                            alt={improvement.product.title || ""}
                            size="large"
                          />
                        </div>
                      )}
                      <h4 className="font-semibold mb-2">{improvement.product.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {improvement.product.description || "No description"}
                      </p>
                    </div>
                  </div>

                  {/* Improved Version */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-shopify-green">Improved</h3>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      {improvement.improvedImages && (
                        <div className="mb-4">
                          <Thumbnail
                            source={(improvement.improvedImages as any)[0]?.src || ""}
                            alt={improvement.improvedTitle || ""}
                            size="large"
                          />
                        </div>
                      )}
                      <h4 className="font-semibold mb-2">{improvement.improvedTitle}</h4>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {improvement.improvedDescription || "No description"}
                      </p>
                      
                      {improvement.improvedSeo && (
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <p className="text-xs font-semibold text-blue-900 mb-1">SEO Improvements:</p>
                          <p className="text-xs text-blue-800">
                            Title: {(improvement.improvedSeo as any).title}
                          </p>
                          <p className="text-xs text-blue-800">
                            Description: {(improvement.improvedSeo as any).description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    destructive
                    onClick={() => handleAction(improvement.id, "reject")}
                    loading={fetcher.state === "submitting"}
                  >
                    Reject
                  </Button>
                  <Button
                    primary
                    onClick={() => handleAction(improvement.id, "approve")}
                    loading={fetcher.state === "submitting"}
                  >
                    Approve & Apply
                  </Button>
                </div>
              </Card>
            ))}
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}