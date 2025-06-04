import { json } from "@remix-run/node";

export async function loader() {
  return json({});
}

export default function SafariHelp() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Safari Browser Issues</h1>
            <p className="mt-2 text-gray-600">
              Safari has strict privacy settings that can interfere with Shopify apps
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Common Safari Issues:</h3>
              <ul className="text-red-800 text-sm space-y-1">
                <li>• Blocks third-party cookies</li>
                <li>• Prevents cross-site tracking</li>
                <li>• Strict iframe policies</li>
                <li>• Cookie sameSite restrictions</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Solutions for Safari:</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">1. Enable Cross-Site Tracking</h4>
                  <ol className="text-blue-800 text-sm space-y-1 ml-4">
                    <li>1. Open Safari Preferences</li>
                    <li>2. Go to Privacy tab</li>
                    <li>3. Uncheck "Prevent cross-site tracking"</li>
                    <li>4. Uncheck "Block all cookies"</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-blue-900 mb-2">2. Clear Safari Data</h4>
                  <ol className="text-blue-800 text-sm space-y-1 ml-4">
                    <li>1. Safari → Develop → Empty Caches</li>
                    <li>2. Safari → History → Clear History</li>
                    <li>3. Restart Safari</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-blue-900 mb-2">3. Use Development Mode</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    For testing, use our development mode that bypasses OAuth:
                  </p>
                  <a 
                    href="/dev" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open Development Mode
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Recommended Browsers for Shopify Development:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-900">✅ Best:</h4>
                  <ul className="text-green-800 text-sm">
                    <li>• Chrome</li>
                    <li>• Firefox</li>
                    <li>• Edge</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-900">⚠️ Issues:</h4>
                  <ul className="text-green-800 text-sm">
                    <li>• Safari (privacy settings)</li>
                    <li>• Private/Incognito modes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Testing Options:</h3>
              <div className="space-y-2">
                <a href="/dev" className="block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 transition-colors">
                  Development Mode (No OAuth)
                </a>
                <a href="/health" className="block bg-gray-600 text-white px-4 py-2 rounded text-center hover:bg-gray-700 transition-colors">
                  Health Check
                </a>
                <a href="/" className="block bg-shopify-green text-white px-4 py-2 rounded text-center hover:bg-shopify-green-dark transition-colors">
                  Back to Home
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              For production, consider using Chrome or Firefox for the best Shopify development experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}