# 03 - Auth Module

## Overview

The Auth module handles user authentication, registration, and session management. It uses JWT (JSON Web Tokens) with a dual-token strategy (Access + Refresh) for security and scalability.

## API Endpoints

### POST /api/v1/auth/register

Register a new customer.

- **Request:** `name`, `email`, `password`, `phone` (optional).
- **Security:** Public.

### POST /api/v1/auth/login

Authenticate user and receive tokens.

- **Request:** `email`, `password`.
- **Response:** Access token in body, Refresh token in `httpOnly` cookie.

### POST /api/v1/auth/refresh-token

Generate new access token using a valid refresh token.

- **Security:** Refresh token in cookie or body.

### POST /api/v1/auth/logout

Invalidate the current refresh token and clear cookies.

## Security Features

- **Password Hashing:** Uses `bcryptjs` with a salt factor of 10.
- **JWT Protection:** `jsonwebtoken` for signing and verification.
- **HttpOnly Cookies:** Prevents XSS attacks by keeping refresh tokens out of JavaScript scope (for the refresh token).
- **Rate Limiting:** Protects against brute-force attacks on login/register via `authLimiter`.

## Storage & Flow

1. **Access Token**: Short-lived (15m), stored in memory or client state.
2. **Refresh Token**: Long-lived (7d), stored in `httpOnly` cookie and the database.
3. **Flow**: On login, both tokens are issued. When access token expires, client calls `/refresh-token`.
