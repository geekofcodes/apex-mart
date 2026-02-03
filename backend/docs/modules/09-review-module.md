# 09 - Review Module

## Overview

The Review module allows customers to share feedback and rate products they have purchased, contributing to the product's overall visibility and trustworthiness.

## API Endpoints

### POST /api/v1/reviews

Create a new review for a product.

- **Business Logic**: Verified purchase check (only users who had the product 'Delivered' can review, if configured).

### GET /api/v1/reviews/product/:productId

List all reviews for a specific product with pagination.

### GET /api/v1/reviews/product/:productId/stats

Get aggregated rating stats (average rating, count of 5-star, 4-star, etc.).

### PATCH /api/v1/reviews/:id

Update an existing review's comment or rating.

### DELETE /api/v1/reviews/:id

Delete a review (Owner or Admin only).

## Features

- **Average Calculation**: Automatically updates the `averageRating` and `totalReviews` on the `Product` model using MongoDB Post-save hooks.
- **Verified Purchase**: Logic to verify if the user has a successful order for the product.
- **Duplicate Prevention**: One user can only review a specific product once.

## Business Rules

- **Ownership**: Users can only edit or delete their own reviews.
- **Moderation**: Deleted reviews are soft-deleted to maintain statistical integrity if necessary.
