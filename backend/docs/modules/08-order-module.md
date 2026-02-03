# 08 - Order Module

## Overview

The Order module handles order processing, fulfillment tracking, and order management. It manages stock deduction, order status lifecycle, and payment tracking.

## API Endpoints

### POST /api/v1/orders

Place order from cart (Authenticated).

**Request Body:**

```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "1234567890",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "cod",
  "taxAmount": 50,
  "shippingFee": 25
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "_id": "...",
    "orderNumber": "ORD-1234567890",
    "items": [...],
    "shippingAddress": {...},
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "subtotal": 200,
    "taxAmount": 50,
    "shippingFee": 25,
    "totalAmount": 275
  }
}
```

**Business Logic:**

1. Validate cart not empty
2. Validate stock for all items
3. Create order with embedded items
4. Reduce product stock
5. Clear user cart
6. Generate order number

---

### GET /api/v1/orders

Get user's orders (Authenticated).

**Query Parameters:**

- `page`, `limit`: Pagination
- `status`: Filter by order status

---

### GET /api/v1/orders/:id

Get order by ID (Authenticated, owner or admin).

---

### GET /api/v1/orders/all

Get all orders (Admin only).

---

### PATCH /api/v1/orders/:id/status

Update order status (Admin only).

**Request Body:**

```json
{
  "orderStatus": "shipped"
}
```

**Status Lifecycle:**

- pending → confirmed → shipped → delivered
- pending → cancelled

**Business Logic:**

- Restore stock if cancelled

---

### PATCH /api/v1/orders/:id/payment

Update payment status (Admin only).

**Request Body:**

```json
{
  "paymentStatus": "paid"
}
```

**Auto-confirm:** Order auto-confirmed when payment is paid

---

### POST /api/v1/orders/:id/cancel

Cancel order (Customer, before shipped).

**Business Logic:**

- Only pending/confirmed orders can be cancelled
- Stock restored to products
- Payment refund initiated if paid

## Features

### Order Schema

- Embedded items (immutable snapshot)
- Embedded shipping address
- Order number (auto-generated)
- Status tracking
- Payment tracking
- Status history

### Order Status

- **PENDING:** Order placed, awaiting confirmation
- **CONFIRMED:** Order confirmed, preparing
- **SHIPPED:** Order shipped
- **DELIVERED:** Order delivered
- **CANCELLED:** Order cancelled

### Payment Status

- **PENDING:** Payment not received
- **PAID:** Payment completed
- **FAILED:** Payment failed

### Business Rules

- **Immutable Items:** Order items cannot be changed after creation
- **Stock Management:** Reduce on order, restore on cancel
- **Cart Clearing:** Cart cleared after successful order
- **Cancellation Window:** Only before shipped

### DTOs

- **List Response:** Summary view
- **Detail Response:** Complete order data
- **Admin Response:** Includes user information

## Authorization

- **Customer:** Place order, view own orders, cancel own orders
- **Admin:** View all orders, update status, update payment

## Testing

- ✅ Place order from cart
- ✅ Stock deduction
- ✅ Cart clearing
- ✅ List user orders
- ✅ Get order by ID
- ✅ Update order status (admin)
- ✅ Cancel order (customer)
- ✅ Stock restoration on cancel
