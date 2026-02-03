# 05 - Product Module

## Overview

The Product module is the core of the catalog. It manages product listings, inventory (stock), and rich metadata (images, prices, categories).

## API Endpoints

### GET /api/v1/products

List products with advanced filtering.

- **Filters**: `category`, `minPrice`, `maxPrice`, `rating`, `search`.
- **Sorting**: `price` (asc/desc), `newest`, `topRated`.

### GET /api/v1/products/:id

Get full details of a single product.

### POST /api/v1/products (Seller/Admin)

Create a new product.

- Handles multiple image uploads to Cloudinary.

### PUT /api/v1/products/:id (Seller/Admin)

Update product details and stock.

- Validates that sellers can only update their own products.

### DELETE /api/v1/products/:id (Seller/Admin)

Soft-delete product by setting `isActive: false`.

## Features

- **Search**: Case-insensitive text search on name and description.
- **Stock Tracking**: Real-time stock counts that decrease when orders are placed.
- **Image Handling**: Integration with Multer and Cloudinary for optimized image storage.
- **Category Linking**: Products are linked to hierarchical categories.

## Business Rules

- **Draft Mode**: Products can be saved as drafts before being published.
- **Stock Validation**: Orders cannot be placed if stock is insufficient.
- **Seller Isolation**: Sellers can only manage the products they created.
