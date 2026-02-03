# 04 - User Module

## Overview

The User module manages user profiles, role assignments, and administrative user oversight. It provides endpoints for users to manage their own data and for admins to manage the entire user base.

## API Endpoints

### GET /api/v1/users/me

Get the profile of the currently logged-in user.

### PUT /api/v1/users/me

Update personal profile details (name, phone, avatar, address).

### PATCH /api/v1/users/change-password

Change account password (requires current password).

### GET /api/v1/users (Admin)

List all users with pagination and filtering.

### GET /api/v1/users/:id (Admin)

Get detailed information about a specific user.

### PUT /api/v1/users/:id (Admin)

Update any user's details including role and active status.

### DELETE /api/v1/users/:id (Admin)

Soft-delete (deactivate) or hard-delete a user account.

## Features

- **Profile Management**: Users can update non-sensitive information.
- **RBAC**: Role-based access control (Admin, Seller, Customer).
- **Stat Tracking**: Admins can see user registration trends and active counts.

## Business Rules

- **Self-Service**: Users can only update their own profile (except for admins).
- **Role Constraints**: Users cannot change their own role to 'admin' via standard profile updates.
- **Validation**: Strict Joi schemas for profile updates and password complexity.
