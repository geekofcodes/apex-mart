# 07 - Cart Module

## Overview

The Cart module manages user shopping carts in the database, allowing for a persistent shopping experience across sessions and devices.

## API Endpoints

### GET /api/v1/cart

Retrieve the current user's cart items and total prices.

### POST /api/v1/cart/items

Add a product to the cart.

- **Request**: `productId`, `quantity`.

### PUT /api/v1/cart/items/:productId

Update the quantity of an item already in the cart.

### DELETE /api/v1/cart/items/:productId

Remove a specific item from the cart.

### DELETE /api/v1/cart

Clear all items from the cart.

## Features

- **Persistence**: Carts are stored in MongoDB associated with the User ID.
- **Auto-Calculations**: The service automatically recalculates `subtotal` and `total` whenever items are modified.
- **Stock Validation**: Checks product inventory when adding or updating quantities.
- **Validation**: Ensures one cart per user.

## Business Rules

- **Maximum Quantity**: Users cannot add more items than available in stock.
- **Merge Logic**: Adding an existing item in the cart increases its quantity rather than creating a duplicate entry.
- **Cleanup**: Carts are cleared automatically upon successful order completion.
