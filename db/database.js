const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const StoreDB = {
  async saveStore(shop, accessToken, scope) {
    const query = `
      INSERT INTO stores (shop_domain, access_token, scope)
      VALUES ($1, $2, $3)
      ON CONFLICT (shop_domain) 
      DO UPDATE SET 
        access_token = $2,
        scope = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(query, [shop, accessToken, scope]);
    return result.rows[0];
  },

  async getStore(shop) {
    const query = 'SELECT * FROM stores WHERE shop_domain = $1 AND is_active = true';
    const result = await pool.query(query, [shop]);
    return result.rows[0];
  },

  async deleteStore(shop) {
    const query = 'UPDATE stores SET is_active = false WHERE shop_domain = $1';
    await pool.query(query, [shop]);
  },

  async saveWebhook(shop, topic, webhookId) {
    const query = `
      INSERT INTO webhooks (shop_domain, topic, webhook_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    const result = await pool.query(query, [shop, topic, webhookId]);
    return result.rows[0];
  }
};

module.exports = { pool, StoreDB };