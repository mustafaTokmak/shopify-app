const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileDB {
  constructor(basePath = './data') {
    this.basePath = basePath;
    this.collections = {
      stores: 'stores.json',
      sessions: 'sessions.json',
      webhooks: 'webhooks.json',
      products: 'products.json',
      improvements: 'improvements.json',
      apiTokens: 'api-tokens.json'
    };
    this.initializeDB();
  }

  async initializeDB() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      
      for (const [key, filename] of Object.entries(this.collections)) {
        const filePath = path.join(this.basePath, filename);
        try {
          await fs.access(filePath);
        } catch {
          await fs.writeFile(filePath, '[]', 'utf8');
        }
      }
    } catch (error) {
      console.error('Error initializing file DB:', error);
    }
  }

  async readCollection(collection) {
    const filePath = path.join(this.basePath, this.collections[collection]);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${collection}:`, error);
      return [];
    }
  }

  async writeCollection(collection, data) {
    const filePath = path.join(this.basePath, this.collections[collection]);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async saveStore(shop, accessToken, scope) {
    const stores = await this.readCollection('stores');
    const existingIndex = stores.findIndex(s => s.shop_domain === shop);
    
    const store = {
      id: existingIndex >= 0 ? stores[existingIndex].id : Date.now(),
      shop_domain: shop,
      access_token: this.encrypt(accessToken),
      scope: scope,
      created_at: existingIndex >= 0 ? stores[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    if (existingIndex >= 0) {
      stores[existingIndex] = store;
    } else {
      stores.push(store);
    }

    await this.writeCollection('stores', stores);
    return { ...store, access_token: accessToken };
  }

  async getStore(shop) {
    const stores = await this.readCollection('stores');
    const store = stores.find(s => s.shop_domain === shop && s.is_active);
    if (store) {
      return { ...store, access_token: this.decrypt(store.access_token) };
    }
    return null;
  }

  async deleteStore(shop) {
    const stores = await this.readCollection('stores');
    const storeIndex = stores.findIndex(s => s.shop_domain === shop);
    if (storeIndex >= 0) {
      stores[storeIndex].is_active = false;
      await this.writeCollection('stores', stores);
    }
  }

  async saveWebhook(shop, topic, webhookId) {
    const webhooks = await this.readCollection('webhooks');
    const webhook = {
      id: Date.now(),
      shop_domain: shop,
      topic: topic,
      webhook_id: webhookId,
      created_at: new Date().toISOString()
    };
    
    webhooks.push(webhook);
    await this.writeCollection('webhooks', webhooks);
    return webhook;
  }

  async saveProduct(shopDomain, product) {
    const products = await this.readCollection('products');
    const productData = {
      id: `${shopDomain}_${product.id}`,
      shop_domain: shopDomain,
      product_id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      images: product.images,
      variants: product.variants,
      status: 'pending_improvement',
      created_at: new Date().toISOString()
    };
    
    products.push(productData);
    await this.writeCollection('products', products);
    return productData;
  }

  async getProductsByStatus(shopDomain, status) {
    const products = await this.readCollection('products');
    return products.filter(p => p.shop_domain === shopDomain && p.status === status);
  }

  async updateProductStatus(productId, status) {
    const products = await this.readCollection('products');
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex >= 0) {
      products[productIndex].status = status;
      products[productIndex].updated_at = new Date().toISOString();
      await this.writeCollection('products', products);
      return products[productIndex];
    }
    return null;
  }

  async saveImprovement(productId, improvementData) {
    const improvements = await this.readCollection('improvements');
    const improvement = {
      id: Date.now(),
      product_id: productId,
      improved_title: improvementData.title,
      improved_description: improvementData.description,
      improved_images: improvementData.images,
      status: 'pending_approval',
      created_at: new Date().toISOString()
    };
    
    improvements.push(improvement);
    await this.writeCollection('improvements', improvements);
    return improvement;
  }

  async getImprovementsByStatus(status) {
    const improvements = await this.readCollection('improvements');
    return improvements.filter(i => i.status === status);
  }

  async updateImprovementStatus(improvementId, status) {
    const improvements = await this.readCollection('improvements');
    const index = improvements.findIndex(i => i.id === improvementId);
    
    if (index >= 0) {
      improvements[index].status = status;
      improvements[index].updated_at = new Date().toISOString();
      await this.writeCollection('improvements', improvements);
      return improvements[index];
    }
    return null;
  }

  async saveApiToken(service, token, metadata = {}) {
    const tokens = await this.readCollection('apiTokens');
    const existingIndex = tokens.findIndex(t => t.service === service);
    
    const tokenData = {
      id: existingIndex >= 0 ? tokens[existingIndex].id : Date.now(),
      service: service,
      token: this.encrypt(token),
      metadata: metadata,
      created_at: existingIndex >= 0 ? tokens[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      tokens[existingIndex] = tokenData;
    } else {
      tokens.push(tokenData);
    }

    await this.writeCollection('apiTokens', tokens);
    return { ...tokenData, token: token };
  }

  async getApiToken(service) {
    const tokens = await this.readCollection('apiTokens');
    const token = tokens.find(t => t.service === service);
    if (token) {
      return { ...token, token: this.decrypt(token.token) };
    }
    return null;
  }

  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

const fileDB = new FileDB();

const StoreDB = {
  async saveStore(shop, accessToken, scope) {
    return fileDB.saveStore(shop, accessToken, scope);
  },

  async getStore(shop) {
    return fileDB.getStore(shop);
  },

  async deleteStore(shop) {
    return fileDB.deleteStore(shop);
  },

  async saveWebhook(shop, topic, webhookId) {
    return fileDB.saveWebhook(shop, topic, webhookId);
  }
};

module.exports = { fileDB, StoreDB };