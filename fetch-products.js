const fetch = require('node-fetch');

async function fetchProducts() {
  const shop = 'testmustadatokmak.myshopify.com';
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  try {
    const response = await fetch(`http://localhost:3000/api/products/${shop}`, {
      headers: {
        'x-shopify-access-token': accessToken
      }
    });
    
    const data = await response.json();
    console.log(`Total products: ${data.length}`);
    console.log('\nProducts:');
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - ${product.vendor}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchProducts();