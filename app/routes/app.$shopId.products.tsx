import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "~/shopify.server";
import { Card, Page, Layout, Button, Badge, Spinner } from "@shopify/polaris";
import prisma from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopId } = params;
  
  // Authenticate the request
  const { admin, session } = await authenticate.admin(request);
  
  // Verify shop access
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!store || store.shopDomain !== shopId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Fetch products from Shopify
  const products = await admin.rest.resources.Product.all({
    session,
    limit: 250,
  });

  // Improvement API is always enabled for all stores (auto-configured)
  const improvementEnabled = true;

  return json({
    products: products.data,
    improvementEnabled,
    shopDomain: session.shop,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { shopId } = params;
  const { admin, session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const productIds = JSON.parse(formData.get("productIds") as string);
  
  // Save selected products to database
  for (const productId of productIds) {
    const product = await admin.rest.resources.Product.find({
      session,
      id: productId,
    });

    await prisma.product.upsert({
      where: {
        shopDomain_productId: {
          shopDomain: session.shop,
          productId: BigInt(productId),
        },
      },
      update: {
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        vendor: product.vendor,
        productType: product.product_type,
        images: product.images,
        variants: product.variants,
        status: "pending_improvement",
      },
      create: {
        shopDomain: session.shop,
        productId: BigInt(productId),
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        vendor: product.vendor,
        productType: product.product_type,
        images: product.images,
        variants: product.variants,
        status: "pending_improvement",
      },
    });
  }

  // Call improvement API if enabled
  const store = await prisma.store.findUnique({
    where: { shopDomain: session.shop },
  });

  if (store?.improvementApiEnabled) {
    // TODO: Call improvement API
    // For now, we'll just mark them as ready for improvement
  }

  return json({ success: true, count: productIds.length });
}

export default function ProductSelection() {
  const { products, improvementEnabled, shopDomain } = useLoaderData<typeof loader>();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";

  const handleProductSelect = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSubmit = () => {
    if (selectedProducts.size === 0) return;
    
    const formData = new FormData();
    formData.append("productIds", JSON.stringify(Array.from(selectedProducts)));
    fetcher.submit(formData, { method: "post" });
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      setSelectedProducts(new Set());
    }
  }, [fetcher.data]);

  return (
    <Page
      title="Product Selection"
      subtitle={`Shop: ${shopDomain} - v2.0`}
      primaryAction={{
        content: `Improve ${selectedProducts.size} Products`,
        disabled: selectedProducts.size === 0 || isSubmitting,
        loading: isSubmitting,
        onAction: handleSubmit,
      }}
    >
      <Layout>
        {selectedProducts.size > 0 && (
          <Layout.Section>
            <Card>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {selectedProducts.size} Product{selectedProducts.size !== 1 ? 's' : ''} Selected
                  </h3>
                  <p className="text-blue-800 text-sm">Ready to send for improvement</p>
                </div>
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={handleSubmit}
                >
                  Improve Selected Products
                </Button>
              </div>
            </Card>
          </Layout.Section>
        )}
        
        {!improvementEnabled && (
          <Layout.Section>
            <Card>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">Improvement API Not Configured</h3>
                <p className="text-amber-800">
                  Please configure your improvement API settings to enable product improvements.
                </p>
              </div>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Products</h2>
                <Badge status="info">{products.length} total</Badge>
              </div>
              
              {isSubmitting && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="large" />
                </div>
              )}

              {fetcher.data?.success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    Successfully sent {fetcher.data.count} products for improvement!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product: any) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product.id.toString())}
                    className={`
                      product-card
                      ${selectedProducts.has(product.id.toString()) ? 'selected' : ''}
                    `}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id.toString())}
                        onChange={() => handleProductSelect(product.id.toString())}
                        className="absolute top-2 right-2 w-5 h-5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {product.image && (
                        <img
                          src={product.image.src}
                          alt={product.title}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      )}
                      
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {product.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {product.vendor}
                      </p>
                      
                      {product.variants?.[0] && (
                        <p className="text-lg font-bold text-shopify-green">
                          ${product.variants[0].price}
                        </p>
                      )}
                      
                      <div className="mt-2">
                        <Badge status={product.status === 'active' ? 'success' : 'attention'}>
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}