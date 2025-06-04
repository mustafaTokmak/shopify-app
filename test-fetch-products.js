const fetch = require('node-fetch');

async function testFetchProducts() {
  const shop = 'your-shop.myshopify.com';
  const accessToken = 'your-access-token';
  
  try {
    const response = await fetch(`http://localhost:3000/api/products/${shop}`, {
      headers: {
        'x-shopify-access-token': accessToken
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    console.log(`Found ${products.length} products`);
    console.log('First product:', products[0]);
  } catch (error) {
    console.error('Error:', error);
  }
}

console.log('To test product fetching:');
console.log('1. Replace "your-shop.myshopify.com" with your actual shop domain');
console.log('2. Replace "your-access-token" with a valid access token');
console.log('3. Run: node test-fetch-products.js');
console.log('\nAlternatively, visit http://localhost:3000/auth?shop=your-shop.myshopify.com to authenticate');