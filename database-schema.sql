-- Stores table for merchant information
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    scope VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    api_key VARCHAR(255),
    improvement_api_enabled BOOLEAN DEFAULT false
);

-- Session table for online tokens (if using online access mode)
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    shop_domain VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    scope VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_domain) REFERENCES stores(shop_domain) ON DELETE CASCADE
);

-- Webhook registrations
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    webhook_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_domain) REFERENCES stores(shop_domain) ON DELETE CASCADE
);

-- Products table for tracking product improvements
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR(255) NOT NULL,
    product_id BIGINT NOT NULL,
    title VARCHAR(500),
    handle VARCHAR(255),
    description TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    images JSONB,
    variants JSONB,
    status VARCHAR(50) DEFAULT 'pending_improvement',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_domain) REFERENCES stores(shop_domain) ON DELETE CASCADE,
    UNIQUE(shop_domain, product_id)
);

-- Improvements table for storing improved product data
CREATE TABLE improvements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    improved_title VARCHAR(500),
    improved_description TEXT,
    improved_images JSONB,
    improved_seo JSONB,
    status VARCHAR(50) DEFAULT 'pending_approval',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    applied_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- API tokens table for external services
CREATE TABLE api_tokens (
    id SERIAL PRIMARY KEY,
    service VARCHAR(100) NOT NULL,
    token TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service)
);

-- Create indexes for performance
CREATE INDEX idx_stores_shop_domain ON stores(shop_domain);
CREATE INDEX idx_sessions_shop_domain ON sessions(shop_domain);
CREATE INDEX idx_webhooks_shop_domain ON webhooks(shop_domain);
CREATE INDEX idx_products_shop_domain ON products(shop_domain);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_improvements_status ON improvements(status);
CREATE INDEX idx_improvements_product_id ON improvements(product_id);