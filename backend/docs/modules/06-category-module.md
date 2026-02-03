# 06 - Category Module

## Overview

The Category module provides hierarchical category management for organizing products. It supports unlimited nesting levels and prevents circular references.

## API Endpoints

### POST /api/v1/categories

Create category (Admin only).

**Request Body:**

```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "parentCategory": "parent_id_or_null"
}
```

---

### GET /api/v1/categories

List all categories (Public).

---

### GET /api/v1/categories/tree

Get category tree with nested subcategories (Public).

**Response (200):**

```json
{
  "success": true,
  "message": "Category tree fetched successfully",
  "data": [
    {
      "_id": "...",
      "name": "Electronics",
      "slug": "electronics",
      "level": 0,
      "subcategories": [
        {
          "_id": "...",
          "name": "Smartphones",
          "slug": "smartphones",
          "level": 1,
          "subcategories": []
        }
      ]
    }
  ]
}
```

---

### GET /api/v1/categories/:id

Get category by ID (Public).

---

### PUT /api/v1/categories/:id

Update category (Admin only).

---

### DELETE /api/v1/categories/:id

Delete category (Admin only, validates no products associated).

## Features

### Hierarchical Structure

- Parent-child relationships
- Unlimited nesting depth
- Level calculation
- Virtual subcategories field

### Slug Generation

- Automatic URL-friendly slug
- Based on category name
- Unique slugs

### Business Rules

- **Circular Reference Prevention:** Cannot set parent to self or descendant
- **Product Association Check:** Cannot delete category with products
- **Level Calculation:** Automatic depth tracking

### DTOs

- **Basic Response:** ID, name, slug, level
- **Detailed Response:** Includes description, parent, subcategories
- **Tree Response:** Nested structure with all subcategories
- **Minimal Response:** ID and name only

## Authorization

- **Public:** Read access (list, get, tree)
- **Admin:** Full CRUD access

## Testing

- ✅ Create category
- ✅ List categories
- ✅ Get category tree
- ✅ Update category
- ✅ Delete validation (products check)
- ✅ Circular reference prevention
