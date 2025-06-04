# Shopify Product Improvement App

A modern Shopify app built with Remix, TypeScript, and Tailwind CSS that allows merchants to improve their product listings using AI-powered enhancement APIs.

## Features

- 🛍️ **Product Selection**: Browse and select products from your Shopify store
- 🤖 **AI Enhancement**: Send products to improvement APIs for automatic enhancement
- 👁️ **Review Interface**: Compare original vs improved product data
- ✅ **Approval Workflow**: Approve or reject improvements before applying to store
- 🔒 **Secure Authentication**: OAuth integration with Shopify
- 🗄️ **Database Storage**: PostgreSQL with Prisma ORM

## Tech Stack

- **Framework**: Remix
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Authentication**: Shopify OAuth
- **Deployment**: Docker + GitHub Actions

## Deployment

This app is configured for automatic deployment using GitHub Actions and Docker.

### Production URL
- **App URL**: https://5.189.174.110:3003
- **OAuth Callback**: https://5.189.174.110:3003/auth/callback

## Development

1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run database migrations: `npx prisma db push`
4. Start development server: `npm run dev`

## Environment Variables

See `.env.production.example` for required environment variables.