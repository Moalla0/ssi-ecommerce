# Firebase E-Commerce Platform

A production-ready e-commerce platform built with Next.js and Firebase, featuring a powerful administrative dashboard and a high-performance customer storefront.

## 🏗 Project Structure

This project follows a monorepo-style architecture to share logic and types efficiently:

- **/admin**: Next.js administrative dashboard for managing products, categories, orders, and users.
- **/client**: Next.js customer-facing storefront for browsing and purchasing products.
- **/shared**: Common TypeScript interfaces, utilities, and Firebase core configuration shared between apps.

## 🚀 Tech Stack

### Frontend & Framework

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Zustand (Client), React Context (Admin)
- **Charts**: Recharts (Admin Dashboard)
- **Validation**: Zod
- **Forms**: React Hook Form with HookForm Resolvers

### Backend & Infrastructure

- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (with Custom Claims for RBAC)
- **File Storage**: Firebase Storage & Cloudinary (for product images)
- **Server-side Logic**: Next.js Server Actions & API Routes

## 🛠 Setup & Installation

### Prerequisites

- Node.js 20+
- A Firebase Project with Firestore, Auth, and Storage enabled.
- (Optional) A Cloudinary account for external image hosting.

### 1. Clone the repository

```bash
git clone <repository-url>
cd internship
```

### 2. Install dependencies

This project prefers **pnpm** for package management. Install dependencies for each workspace:

```bash
# Install admin dependencies
cd admin && pnpm install

# Install client dependencies
cd ../client && pnpm install
```

### 3. Environment Configuration

Create a `.env` file in both `admin/` and `client/` directories based on the following template:

#### Admin and Client (`.env`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Admin Only (Additional Variables)

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 💻 Development Workflow

To start the development servers:

- **Admin Cabinet**: `cd admin && npm run dev` (defaults to http://localhost:3001)
- **Client Storefront**: `cd client && npm run dev` (defaults to http://localhost:3000)

## 🏗 Architecture Details

### Shared Core

All core types and Firebase initialization logic reside in `/shared`. This ensures that data structures are consistent across both the admin and client applications.

### Security Implementation

- **RBAC**: Administrative access is enforced via Firebase Auth Custom Claims (`admin: true`).
- **Middleware**: The admin application uses Next.js Middleware with `jose` for Edge-runtime JWT verification, preventing unauthorized access to sensitive routes.
- **API Protection**: All administrative API routes (like product scraping) verify the user's identity and permissions before execution.
- **SSRF Prevention**: The product scraping engine includes validation to prevent Server-Side Request Forgery by blocking internal IP ranges and unauthorized protocols.

### Performance & Scalability

- **Pagination**: Large product datasets are handled using cursor-based pagination (`startAfter` in Firestore).
- **Server Actions**: Expensive mutations are handled via Server Actions for improved security and reduced client-side bundle size.
- **Optimization**: Next.js Image Optimization is enabled with a curated domain allowlist for high-performance image loading.

## 📦 Build & Production

To build the applications for production:

```bash
cd admin && npm run build
cd ../client && npm run build
```

To start the production servers:

```bash
npm run start
```

## 🛡 Security Considerations

- **Environment Variables**: Never commit `.env` files. Use secret management in production (e.g., Vercel Secrets, Github Secrets).
- **Firebase Rules**: Ensure your Firestore Security Rules are properly configured to deny global write access and restrict read access based on user roles and document ownership.
- **Admin Promotion**: Promoting a user to admin must be done via the server-side action to ensure Custom Claims are correctly synchronized.

## 📝 Known Limitations

- **Full-Text Search**: Native Firestore does not support full-text search. The current implementation uses simple in-memory filtering for smaller subsets. For large catalogs, integration with a service like Algolia or Meilisearch is recommended.
