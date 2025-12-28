-- =========================================
-- Insight AI Platform - PostgreSQL ER Schema
-- =========================================

-- ---------- ENUM TYPES ----------

CREATE TYPE role_enum AS ENUM (
  'USER',
  'INVESTOR',
  'TRADER',
  'ANALYST',
  'ADMIN'
);

CREATE TYPE impact_level_enum AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW'
);

CREATE TYPE asset_type_enum AS ENUM (
  'STOCK',
  'CRYPTO',
  'BOND',
  'COMMODITY',
  'INDEX'
);

CREATE TYPE subscription_status_enum AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'CANCELLED'
);

CREATE TYPE market_type_enum AS ENUM (
  'STOCK',
  'CRYPTO'
);

-- ---------- USERS ----------

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role role_enum NOT NULL,
  preferred_market market_type_enum,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ---------- NEWS ----------

CREATE TABLE news (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(100) NOT NULL,
  publication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  tone INTEGER CHECK (tone BETWEEN -100 AND 100),
  impact_level impact_level_enum
);

-- ---------- ASSETS ----------

CREATE TABLE asset (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type asset_type_enum NOT NULL,
  symbol VARCHAR(10)
);

-- ---------- ANALYSIS ----------

CREATE TABLE analysis (
  id BIGSERIAL PRIMARY KEY,
  impact_score FLOAT CHECK (impact_score BETWEEN 0 AND 100),
  prediction VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  news_id BIGINT NOT NULL,
  asset_id BIGINT,

  CONSTRAINT fk_analysis_news
    FOREIGN KEY (news_id)
    REFERENCES news(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_analysis_asset
    FOREIGN KEY (asset_id)
    REFERENCES asset(id)
);

-- ---------- NOTIFICATIONS ----------

CREATE TABLE notification (
  id BIGSERIAL PRIMARY KEY,
  message VARCHAR(500) NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  user_id BIGINT NOT NULL,

  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ---------- CATEGORIES ----------

CREATE TABLE category (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- ---------- USER ↔ CATEGORY (M:N) ----------

CREATE TABLE user_category (
  user_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,

  PRIMARY KEY (user_id, category_id),

  CONSTRAINT fk_user_category_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_user_category_category
    FOREIGN KEY (category_id)
    REFERENCES category(id)
    ON DELETE CASCADE
);

-- ---------- PLANS ----------

CREATE TABLE plan (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  price FLOAT NOT NULL CHECK (price >= 0),
  description VARCHAR(500),
  features TEXT
);

-- ---------- SUBSCRIPTIONS ----------

CREATE TABLE subscription (
  id BIGSERIAL PRIMARY KEY,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status subscription_status_enum NOT NULL,
  user_id BIGINT NOT NULL,
  plan_id BIGINT NOT NULL,

  CONSTRAINT fk_subscription_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_subscription_plan
    FOREIGN KEY (plan_id)
    REFERENCES plan(id)
);

-- ---------- PAYMENTS ----------

CREATE TABLE payment (
  id BIGSERIAL PRIMARY KEY,
  amount FLOAT NOT NULL CHECK (amount >= 0),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50),
  subscription_id BIGINT NOT NULL,

  CONSTRAINT fk_payment_subscription
    FOREIGN KEY (subscription_id)
    REFERENCES subscription(id)
    ON DELETE CASCADE
);

-- ---------- OPTIONAL INDEXES (performance) ----------

CREATE INDEX idx_news_publication_date ON news(publication_date);
CREATE INDEX idx_analysis_created_at ON analysis(created_at);
CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_subscription_user ON subscription(user_id);
CREATE INDEX idx_payment_subscription ON payment(subscription_id);

-- =========================================
-- End of schema
-- =========================================
