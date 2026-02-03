# API Contract – ApexMart Core

## Backend ↔ Frontend Interface Definition

Base URL: /api/v1  
Authentication: JWT (Access + Refresh Tokens)  
Response Format: Standardized (as defined in SKILL.md)

---

## Global Response Format

All APIs return responses in the following structure:

{
success: boolean,
message: string,
data: object | null,
meta?: {
page: number,
limit: number,
total: number
}
}

---

## Authentication & Authorization

- Access Token: Sent via `Authorization: Bearer <token>`
- Refresh Token: Stored in HttpOnly Cookie
- RBAC enforced on backend
- 401 → Unauthorized
- 403 → Forbidden

---

# AUTHENTICATION APIs

---

## POST /auth/register

Auth: Public  
Roles: Customer

Request:
{
name: string,
email: string,
password: string
}

Response:
{
success,
message,
data: {
user: UserDTO
}
}

---

## POST /auth/login

Auth: Public

Request:
{
email: string,
password: string
}

Response:
{
success,
message,
data: {
accessToken: string,
user: UserDTO
}
}

---

## POST /auth/refresh-token

Auth: Refresh Token (Cookie)

Response:
{
success,
message,
data: {
accessToken: string
}
}

---

## POST /auth/logout

Auth: Authenticated

Response:
{
success,
message,
data: null
}

---

# USER APIs

---

## GET /users/me

Auth: Required  
Roles: Customer, Seller, Admin

Response:
{
success,
message,
data: UserDTO
}

---

## PUT /users/me

Auth: Required  
Roles: Customer, Seller, Admin

Request:
{
name?: string
}

Response:
{
success,
message,
data: UserDTO
}

---

## GET /users

Auth: Required  
Roles: Admin

Query Params:

- page
- limit

Response:
{
success,
message,
data: UserDTO[],
meta
}

---

## GET /users/:id

Auth: Required  
Roles: Admin

Response:
{
success,
message,
data: UserDTO
}

---

# CATEGORY APIs

---

## GET /categories

Auth: Public

Response:
{
success,
message,
data: CategoryDTO[]
}

---

## GET /categories/tree

Auth: Public

Response:
{
success,
message,
data: CategoryTreeDTO[]
}

---

## POST /categories

Auth: Required  
Roles: Admin

Request:
{
name: string,
parentCategoryId?: string
}

Response:
{
success,
message,
data: CategoryDTO
}

---

# PRODUCT APIs

---

## GET /products

Auth: Public

Query Params:

- page
- limit
- category
- minPrice
- maxPrice
- search
- sort

Response:
{
success,
message,
data: ProductDTO[],
meta
}

---

## GET /products/:id

Auth: Public

Response:
{
success,
message,
data: ProductDTO
}

---

## POST /products

Auth: Required  
Roles: Seller, Admin

Request:
{
title: string,
description: string,
price: number,
discountPrice?: number,
stock: number,
categoryId: string,
images: string[]
}

Response:
{
success,
message,
data: ProductDTO
}

---

## PUT /products/:id

Auth: Required  
Roles: Seller, Admin

Response:
{
success,
message,
data: ProductDTO
}

---

## DELETE /products/:id

Auth: Required  
Roles: Admin

Response:
{
success,
message,
data: null
}

---

# CART APIs

---

## GET /cart

Auth: Required  
Roles: Customer

Response:
{
success,
message,
data: CartDTO
}

---

## POST /cart/items

Auth: Required  
Roles: Customer

Request:
{
productId: string,
quantity: number
}

Response:
{
success,
message,
data: CartDTO
}

---

## PUT /cart/items/:productId

Auth: Required  
Roles: Customer

Request:
{
quantity: number
}

Response:
{
success,
message,
data: CartDTO
}

---

## DELETE /cart/items/:productId

Auth: Required  
Roles: Customer

Response:
{
success,
message,
data: CartDTO
}

---

# ORDER APIs

---

## POST /orders

Auth: Required  
Roles: Customer

Request:
{
shippingAddress: {
line1: string,
city: string,
state: string,
pincode: string
}
}

Response:
{
success,
message,
data: OrderDTO
}

---

## GET /orders/my

Auth: Required  
Roles: Customer

Response:
{
success,
message,
data: OrderDTO[]
}

---

## GET /orders/:id

Auth: Required  
Roles: Owner, Admin

Response:
{
success,
message,
data: OrderDTO
}

---

## GET /orders

Auth: Required  
Roles: Admin

Query Params:

- page
- limit

Response:
{
success,
message,
data: OrderDTO[],
meta
}

---

# REVIEW APIs

---

## POST /reviews

Auth: Required  
Roles: Customer

Request:
{
productId: string,
rating: number,
comment?: string
}

Response:
{
success,
message,
data: ReviewDTO
}

---

## GET /reviews/product/:productId

Auth: Public

Response:
{
success,
message,
data: ReviewDTO[]
}

---

# DTO DEFINITIONS (Frontend Reference)

---

UserDTO:
{
id,
name,
email,
role
}

CategoryDTO:
{
id,
name,
parentCategoryId
}

ProductDTO:
{
id,
title,
price,
discountPrice,
images,
ratings,
stock
}

CartDTO:
{
items[],
totalAmount
}

OrderDTO:
{
id,
items[],
totalAmount,
orderStatus,
paymentStatus,
createdAt
}

ReviewDTO:
{
id,
rating,
comment,
user,
createdAt
}

---

End of API Contract
