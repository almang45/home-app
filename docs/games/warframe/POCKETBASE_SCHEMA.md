# PocketBase Collections Schema for Warframe Tracker

## Overview

This document defines the PocketBase collections required for the Warframe Tracker feature. The schema supports multi-user data with proper authentication and authorization.

---

## Collections

### 1. `warframe_owned_items`

Tracks items that users own (warframes, weapons, etc.)

**Fields:**
- `id` (text, primary key, auto-generated)
- `user_id` (relation to `users`, required)
- `unique_name` (text, required) - Warframe API unique identifier
- `item_name` (text, required) - Display name
- `category` (text, required) - "Warframes", "Primary", "Secondary", etc.
- `created` (date, auto)
- `updated` (date, auto)

**Indexes:**
- `idx_user_unique` on (`user_id`, `unique_name`) - UNIQUE
- `idx_user_category` on (`user_id`, `category`)

**API Rules:**
```javascript
// List/Search
@request.auth.id != "" && user_id = @request.auth.id

// View
@request.auth.id != "" && user_id = @request.auth.id

// Create
@request.auth.id != "" && @request.data.user_id = @request.auth.id

// Update
@request.auth.id != "" && user_id = @request.auth.id

// Delete
@request.auth.id != "" && user_id = @request.auth.id
```

---

### 2. `warframe_mastered_items`

Tracks items that users have mastered (reached max rank)

**Fields:**
- `id` (text, primary key, auto-generated)
- `user_id` (relation to `users`, required)
- `unique_name` (text, required)
- `item_name` (text, required)
- `category` (text, required)
- `created` (date, auto)
- `updated` (date, auto)

**Indexes:**
- `idx_user_unique` on (`user_id`, `unique_name`) - UNIQUE
- `idx_user_category` on (`user_id`, `category`)

**API Rules:** (same as `warframe_owned_items`)

---

### 3. `warframe_wishlist`

Tracks items users want to build/acquire

**Fields:**
- `id` (text, primary key, auto-generated)
- `user_id` (relation to `users`, required)
- `unique_name` (text, required)
- `item_name` (text, required)
- `category` (text, required)
- `priority` (number, default: 2) - 1=High, 2=Medium, 3=Low
- `created` (date, auto)
- `updated` (date, auto)

**Indexes:**
- `idx_user_unique` on (`user_id`, `unique_name`) - UNIQUE
- `idx_user_priority` on (`user_id`, `priority`)

**API Rules:** (same as `warframe_owned_items`)

---

### 4. `warframe_resource_inventory`

Tracks quantities of resources/materials users have

**Fields:**
- `id` (text, primary key, auto-generated)
- `user_id` (relation to `users`, required)
- `unique_name` (text, required) - Resource unique identifier
- `resource_name` (text, required) - Display name (e.g., "Orokin Cell")
- `quantity` (number, default: 0)
- `created` (date, auto)
- `updated` (date, auto)

**Indexes:**
- `idx_user_unique` on (`user_id`, `unique_name`) - UNIQUE

**API Rules:** (same as `warframe_owned_items`)

---

## Collection Creation Scripts

### Using PocketBase Admin UI

1. Navigate to: `http://localhost:8090/_/` (or your PocketBase URL)
2. Go to **Collections** → **New Collection**
3. Create each collection with the fields and rules defined above

### Using PocketBase JavaScript SDK (Migration Script)

```javascript
// pb-migrations/warframe-tracker-collections.js

migrate((db) => {
  // 1. warframe_owned_items
  const ownedCollection = new Collection({
    name: 'warframe_owned_items',
    type: 'base',
    schema: [
      {
        name: 'user_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        }
      },
      {
        name: 'unique_name',
        type: 'text',
        required: true,
      },
      {
        name: 'item_name',
        type: 'text',
        required: true,
      },
      {
        name: 'category',
        type: 'text',
        required: true,
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_user_unique ON warframe_owned_items (user_id, unique_name)',
      'CREATE INDEX idx_user_category ON warframe_owned_items (user_id, category)'
    ],
    listRule: '@request.auth.id != "" && user_id = @request.auth.id',
    viewRule: '@request.auth.id != "" && user_id = @request.auth.id',
    createRule: '@request.auth.id != "" && @request.data.user_id = @request.auth.id',
    updateRule: '@request.auth.id != "" && user_id = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user_id = @request.auth.id',
  })
  
  db.saveCollection(ownedCollection)
  
  // 2. warframe_mastered_items
  const masteredCollection = new Collection({
    name: 'warframe_mastered_items',
    type: 'base',
    schema: [
      {
        name: 'user_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        }
      },
      {
        name: 'unique_name',
        type: 'text',
        required: true,
      },
      {
        name: 'item_name',
        type: 'text',
        required: true,
      },
      {
        name: 'category',
        type: 'text',
        required: true,
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_user_unique ON warframe_mastered_items (user_id, unique_name)',
      'CREATE INDEX idx_user_category ON warframe_mastered_items (user_id, category)'
    ],
    listRule: '@request.auth.id != "" && user_id = @request.auth.id',
    viewRule: '@request.auth.id != "" && user_id = @request.auth.id',
    createRule: '@request.auth.id != "" && @request.data.user_id = @request.auth.id',
    updateRule: '@request.auth.id != "" && user_id = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user_id = @request.auth.id',
  })
  
  db.saveCollection(masteredCollection)
  
  // 3. warframe_wishlist
  const wishlistCollection = new Collection({
    name: 'warframe_wishlist',
    type: 'base',
    schema: [
      {
        name: 'user_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        }
      },
      {
        name: 'unique_name',
        type: 'text',
        required: true,
      },
      {
        name: 'item_name',
        type: 'text',
        required: true,
      },
      {
        name: 'category',
        type: 'text',
        required: true,
      },
      {
        name: 'priority',
        type: 'number',
        required: false,
        options: {
          min: 1,
          max: 3,
        }
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_user_unique ON warframe_wishlist (user_id, unique_name)',
      'CREATE INDEX idx_user_priority ON warframe_wishlist (user_id, priority)'
    ],
    listRule: '@request.auth.id != "" && user_id = @request.auth.id',
    viewRule: '@request.auth.id != "" && user_id = @request.auth.id',
    createRule: '@request.auth.id != "" && @request.data.user_id = @request.auth.id',
    updateRule: '@request.auth.id != "" && user_id = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user_id = @request.auth.id',
  })
  
  db.saveCollection(wishlistCollection)
  
  // 4. warframe_resource_inventory
  const resourcesCollection = new Collection({
    name: 'warframe_resource_inventory',
    type: 'base',
    schema: [
      {
        name: 'user_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        }
      },
      {
        name: 'unique_name',
        type: 'text',
        required: true,
      },
      {
        name: 'resource_name',
        type: 'text',
        required: true,
      },
      {
        name: 'quantity',
        type: 'number',
        required: true,
        options: {
          min: 0,
        }
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_user_unique ON warframe_resource_inventory (user_id, unique_name)'
    ],
    listRule: '@request.auth.id != "" && user_id = @request.auth.id',
    viewRule: '@request.auth.id != "" && user_id = @request.auth.id',
    createRule: '@request.auth.id != "" && @request.data.user_id = @request.auth.id',
    updateRule: '@request.auth.id != "" && user_id = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user_id = @request.auth.id',
  })
  
  db.saveCollection(resourcesCollection)
})
```

---

## Environment Variables

Add to `.env` (development):
```bash
VITE_POCKETBASE_URL=http://localhost:8090
```

Add to `.env.production` (production):
```bash
VITE_POCKETBASE_URL=https://your-pocketbase-domain.com
```

---

## Data Model Summary

```
User (PocketBase Auth)
  ├── warframe_owned_items (many)
  ├── warframe_mastered_items (many)
  ├── warframe_wishlist (many)
  └── warframe_resource_inventory (many)
```

**Relationships:**
- All collections have a `user_id` foreign key to PocketBase users
- `cascadeDelete: true` ensures user data is cleaned up when user is deleted
- Unique indexes prevent duplicate entries per user

**Data Flow:**
1. **Local (Dev):** Data stored in `localStorage` with prefix `wf-tracker-`
2. **Production:** Data synced to PocketBase collections with user authentication
3. **Migration:** Export/Import tool converts between localStorage and PocketBase formats

---

## Next Steps

1. ✅ Create collections in PocketBase (manual or migration script)
2. ⏳ Implement export/import data utility
3. ⏳ Update `tracker-storage.ts` to detect environment and use appropriate backend
4. ⏳ Add authentication flow for production use
5. ⏳ Test data synchronization

---

## Security Considerations

1. **Authentication Required:** All API rules require `@request.auth.id != ""`
2. **User Isolation:** Users can only access their own data via `user_id` check
3. **No Public Access:** No anonymous reads/writes allowed
4. **Cascade Delete:** User deletion removes all associated Warframe data
5. **Input Validation:** PocketBase validates field types and constraints

---

## Storage Estimates

Assuming average user:
- 50 owned items × 100 bytes = 5 KB
- 30 mastered items × 100 bytes = 3 KB
- 10 wishlist items × 100 bytes = 1 KB
- 50 resources × 80 bytes = 4 KB

**Total per user: ~13 KB**

For 1,000 users: **~13 MB**  
For 10,000 users: **~130 MB**

PocketBase handles this easily with built-in SQLite database.
