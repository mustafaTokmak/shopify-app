require('dotenv').config();
const express = require('express');
require('@shopify/shopify-api/adapters/node');
const { shopifyApi } = require('@shopify/shopify-api');
const { ApiVersion } = require('@shopify/shopify-api');
const { fileDB } = require('./db/file-db');

const app = express();
const PORT = process.env.PORT || 3000;

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.SHOPIFY_APP_URL.replace(/https?:\/\//, ''),
  apiVersion: ApiVersion.October24,
});

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Shopify Product Fetcher App</h1>
        <p>Since OAuth requires HTTPS, you can test the product fetch API directly:</p>
        <ol>
          <li>Get an access token from your Shopify admin</li>
          <li>Or use the test endpoint: <a href="/test-products">Test Products Fetch</a></li>
        </ol>
      </body>
    </html>
  `);
});

app.get('/test-products', async (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Test Product Fetching</h1>
        <p>To fetch products, make a request to:</p>
        <code>GET /api/products/your-store.myshopify.com</code>
        <p>With header: x-shopify-access-token: your-token</p>
        <br>
        <p>You can get a temporary access token by:</p>
        <ol>
          <li>Going to your Shopify Admin</li>
          <li>Settings → Apps and sales channels → Develop apps</li>
          <li>Create a private app or use existing one</li>
          <li>Get the Admin API access token</li>
        </ol>
      </body>
    </html>
  `);
});

app.get('/api/products/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    const accessToken = req.headers['x-shopify-access-token'];
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const client = new shopify.clients.Rest({
      session: {
        shop: shop,
        accessToken: accessToken
      }
    });

    const products = await client.get({
      path: 'products',
      query: { limit: 250 }
    });

    res.json(products.body.products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/auth', (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const redirectUrl = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SCOPES}&redirect_uri=${redirectUrl}`;

  res.redirect(installUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send('Required parameters missing');
  }

  try {
    const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const accessTokenData = await accessTokenResponse.json();
    
    // Save to database if you have it configured
    // const { StoreDB } = require('./db/database');
    // await StoreDB.saveStore(shop, accessTokenData.access_token, process.env.SCOPES);

    res.send(`
      <html>
        <body>
          <h1>Authentication successful!</h1>
          <p>Shop: ${shop}</p>
          <p>Access Token: ${accessTokenData.access_token}</p>
          <p>You can now use this access token to fetch products.</p>
          <br>
          <p>Example API call:</p>
          <code>
            GET http://localhost:3000/api/products/${shop}<br>
            Headers: x-shopify-access-token: ${accessTokenData.access_token}
          </code>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Product improvement endpoint
app.post('/api/products/improve', async (req, res) => {
  try {
    const { shopDomain, products } = req.body;
    const accessToken = req.headers['x-shopify-access-token'];
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Save products to file DB
    for (const product of products) {
      await fileDB.saveProduct(shopDomain, product);
    }

    // Get API settings
    const apiSettings = await fileDB.getApiToken('improvement_api');
    
    if (apiSettings && apiSettings.metadata.endpoint) {
      // Call improvement API (placeholder for now)
      // In real implementation, you would call the actual API
      for (const product of products) {
        const productRecord = await fileDB.getProductsByStatus(shopDomain, 'pending_improvement');
        const savedProduct = productRecord.find(p => p.product_id === product.id);
        
        // Simulate improvement data
        const improvementData = {
          title: `Improved: ${product.title}`,
          description: `Enhanced description for ${product.title}. This product features premium quality and exceptional value.`,
          images: product.images
        };
        
        await fileDB.saveImprovement(savedProduct.id, improvementData);
        await fileDB.updateProductStatus(savedProduct.id, 'improvement_pending');
      }
    }

    res.json({ success: true, message: `${products.length} products sent for improvement` });
  } catch (error) {
    console.error('Error improving products:', error);
    res.status(500).json({ error: 'Failed to process product improvements' });
  }
});

// Get pending improvements
app.get('/api/improvements/pending', async (req, res) => {
  try {
    const improvements = await fileDB.getImprovementsByStatus('pending_approval');
    
    // Format the response
    const formattedImprovements = [];
    for (const improvement of improvements) {
      const products = await fileDB.readCollection('products');
      const product = products.find(p => p.id === improvement.product_id);
      
      if (product) {
        formattedImprovements.push({
          id: improvement.id,
          original: {
            title: product.title,
            description: product.description,
            image: product.images && product.images[0] ? product.images[0].src : null
          },
          improved: {
            title: improvement.improved_title,
            description: improvement.improved_description,
            image: improvement.improved_images && improvement.improved_images[0] ? improvement.improved_images[0].src : null
          }
        });
      }
    }
    
    res.json(formattedImprovements);
  } catch (error) {
    console.error('Error fetching improvements:', error);
    res.status(500).json({ error: 'Failed to fetch improvements' });
  }
});

// Approve improvement
app.post('/api/improvements/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const improvement = await fileDB.updateImprovementStatus(parseInt(id), 'approved');
    
    if (improvement) {
      // In real implementation, you would update the Shopify product here
      res.json({ success: true, message: 'Improvement approved' });
    } else {
      res.status(404).json({ error: 'Improvement not found' });
    }
  } catch (error) {
    console.error('Error approving improvement:', error);
    res.status(500).json({ error: 'Failed to approve improvement' });
  }
});

// Reject improvement
app.post('/api/improvements/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const improvement = await fileDB.updateImprovementStatus(parseInt(id), 'rejected');
    
    if (improvement) {
      res.json({ success: true, message: 'Improvement rejected' });
    } else {
      res.status(404).json({ error: 'Improvement not found' });
    }
  } catch (error) {
    console.error('Error rejecting improvement:', error);
    res.status(500).json({ error: 'Failed to reject improvement' });
  }
});

// API settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await fileDB.getApiToken('improvement_api');
    if (settings) {
      res.json({
        endpoint: settings.metadata.endpoint || '',
        token: settings.token ? true : false
      });
    } else {
      res.json({ endpoint: '', token: false });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { endpoint, token } = req.body;
    
    if (token && token !== '********') {
      await fileDB.saveApiToken('improvement_api', token, { endpoint });
    } else if (endpoint) {
      const existing = await fileDB.getApiToken('improvement_api');
      if (existing) {
        await fileDB.saveApiToken('improvement_api', existing.token, { endpoint });
      }
    }
    
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Shopify app listening on port ${PORT}`);
});