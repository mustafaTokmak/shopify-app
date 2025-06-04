import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  // Development mode - simulate authenticated session
  if (process.env.NODE_ENV === "development") {
    return json({
      shop: "testmustadatokmak.myshopify.com",
      message: "Development mode - simulating authenticated session"
    });
  } else {
    return redirect("/");
  }
}

export default function DevPage() {
  const { shop, message } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
                <p className="mt-1 text-sm text-yellow-700">{message}</p>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Product Improvement App - Dev Mode
          </h1>
          <p className="text-gray-600 mb-6">
            Shop: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{shop}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`/app/${shop}/products`}
              className="block p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <h3 className="font-semibold text-blue-900 mb-2">Product Selection</h3>
              <p className="text-blue-700 text-sm">Browse and select products for improvement</p>
            </a>

            <a
              href={`/app/${shop}/improvements`}
              className="block p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
            >
              <h3 className="font-semibold text-green-900 mb-2">Review Improvements</h3>
              <p className="text-green-700 text-sm">Approve or reject product improvements</p>
            </a>

            <a
              href={`/app/${shop}/settings`}
              className="block p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <h3 className="font-semibold text-purple-900 mb-2">API Settings</h3>
              <p className="text-purple-700 text-sm">Configure improvement API settings</p>
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Development Tools</h3>
            <div className="space-y-2">
              <a href="/health" className="text-blue-600 hover:text-blue-800 block">
                → Health Check
              </a>
              <a href="/" className="text-blue-600 hover:text-blue-800 block">
                → Back to Landing Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}