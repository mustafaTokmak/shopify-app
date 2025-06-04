import { LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    // Validate shop parameter format
    if (shop.includes('.myshopify.com') || shop.includes('.shopify.com')) {
      // Redirect to auth with shop parameter
      return redirect(`/auth?shop=${shop}`);
    } else {
      // Invalid shop format, show error
      return json({ 
        error: "Invalid shop parameter", 
        shopParam: shop,
        expectedFormat: "your-store.myshopify.com" 
      });
    }
  }

  // No shop parameter, show landing page
  return json({ error: null, shopParam: null, expectedFormat: null });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  if (data.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{data.error}</h1>
          <p className="text-gray-600 mb-4">
            You provided: <code className="bg-gray-100 px-2 py-1 rounded">{data.shopParam}</code>
          </p>
          <p className="text-gray-600 mb-6">
            Expected format: <code className="bg-gray-100 px-2 py-1 rounded">{data.expectedFormat}</code>
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">For Development Testing:</h3>
              <p className="text-blue-800 text-sm">
                Try: <code className="bg-blue-100 px-2 py-1 rounded">?shop=testmustadatokmak.myshopify.com</code>
              </p>
            </div>
            <a 
              href="/?shop=testmustadatokmak.myshopify.com" 
              className="inline-block bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark transition-colors"
            >
              Test with Demo Shop
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-shopify-green">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Product Improvement App
        </h1>
        <p className="text-gray-600 mb-6">
          Enhance your Shopify products with AI-powered improvements
        </p>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">For Production:</h3>
            <p className="text-gray-600 text-sm">
              Install this app through your Shopify admin panel
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">For Development:</h3>
            <p className="text-blue-800 text-sm mb-3">
              Skip OAuth and test app features directly
            </p>
            <div className="space-x-2">
              <a 
                href="/dev" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Development Mode
              </a>
              <a 
                href="/?shop=testmustadatokmak.myshopify.com" 
                className="inline-block bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark transition-colors"
              >
                Test OAuth
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Safari Users</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Having issues? Safari's privacy settings can block Shopify apps. 
                  <a href="/safari-help" className="font-medium underline hover:text-yellow-900"> Get help here</a> or use Chrome/Firefox.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            Built with Remix, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}