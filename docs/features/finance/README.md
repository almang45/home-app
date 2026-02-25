# Finance Feature

A comprehensive personal finance management system inspired by the **Kakeibo** method (Japanese household budgeting philosophy). Track income, expenses, budgets, debts, and subscriptions — all backed by PocketBase.

## Overview

The Finance feature provides a full-featured personal finance dashboard accessible at `/finance`. It helps users understand where their money goes by categorizing spending into meaningful groups (needs, wants, culture, unexpected) and enables monthly reflection.

## Features

### 1. Overview Tab
- Total balance summary across all sources
- Recent transactions list (last 5)
- Quick action buttons (Add Expense, Bulk Add, Import CSV)

### 2. Accounts Tab (`SourceManager`)
- Manage financial sources: bank, savings, credit card, e-wallet, cash
- Track balances per account
- Add/edit/delete sources

### 3. Budget Tab (`BudgetPlanner`)
- Set monthly budgets by category
- Format: `YYYY-MM` per month
- Track spending vs budget

### 4. Debts Tab (`DebtManager`)
- Track payable and receivable debts
- Record remaining amounts and due dates

### 5. Subscriptions Tab (`SubscriptionTracker`)
- Track recurring subscriptions (monthly/yearly)
- Link subscriptions to a payment source
- View next billing date

### 6. Analysis Tab (`MonthlySummary`)
- Monthly income vs expense analysis
- Monthly reflection/notes (Kakeibo-style journaling)

### Transaction Entry
- **Single Transaction**: Via `TransactionForm` dialog
- **Bulk Entry**: Via `BulkTransactionForm` dialog (add multiple transactions at once)
- **CSV Import**: Via `CsvImporter` dialog (import transactions from a spreadsheet)

## Data Architecture

### Backend: PocketBase

All data is stored in PocketBase. The following collections are required:

| Collection | Purpose |
|---|---|
| `finance_sources` | Financial accounts (bank, wallet, etc.) |
| `finance_categories` | Transaction categories (needs, wants, etc.) |
| `finance_subcategories` | Transaction subcategories (health, meals, etc.) |
| `finance_transactions` | Individual income/expense records |
| `finance_budgets` | Monthly budget targets per category |
| `finance_debts` | Debt tracking (payable/receivable) |
| `finance_subscriptions` | Recurring subscription records |
| `finance_reflections` | Monthly Kakeibo reflections |

### Transaction Categories (Kakeibo)

**Expense categories:**
- `needs` – Essential expenses
- `wants` – Discretionary spending
- `culture` – Education, entertainment, self-improvement
- `unexpected` – Unplanned expenses
- `savings` – Money set aside

**Income categories:**
- `salary`, `investments`, `gifts`, `other_income`

### Transaction Types
- `expense` – Debits source balance
- `income` – Credits source balance
- `transfer` – Moves money between sources
- `debt_repayment` – Debt payment (debits source)

### Balance Update Logic

When a transaction is created, the linked source balance is automatically updated:
- `expense`, `debt_repayment`, `transfer` → balance decreases
- `income` → balance increases

## File Structure

```
src/features/finance/
├── index.tsx                    # Re-exports FinanceDashboard
├── components/
│   ├── finance-dashboard.tsx    # Main dashboard with tabs
│   ├── source-manager.tsx       # Account management
│   ├── transaction-form.tsx     # Single transaction dialog
│   ├── bulk-transaction-form.tsx# Multi-transaction dialog
│   ├── csv-importer.tsx         # CSV import dialog
│   ├── budget-planner.tsx       # Budget management
│   ├── debt-manager.tsx         # Debt tracking
│   ├── subscription-tracker.tsx # Subscription management
│   └── monthly-summary.tsx      # Analysis + reflection
└── data/
    ├── schema.ts                # Zod schemas + TypeScript types
    └── api.ts                   # PocketBase API functions

src/routes/_authenticated/finance/
├── route.tsx                    # Layout route
└── index.tsx                    # Dashboard page route
```

## API Functions (`src/features/finance/data/api.ts`)

| Function | Description |
|---|---|
| `getSources()` | Fetch all financial sources |
| `getCategories()` | Fetch all categories |
| `getSubcategories()` | Fetch all subcategories |
| `createSource(data)` | Create a new financial source |
| `updateSource(id, data)` | Update a source |
| `deleteSource(id)` | Delete a source |
| `getTransactions(month?)` | Fetch transactions, optionally filtered by month |
| `createTransaction(data)` | Create transaction + update source balance |
| `createBulkTransactions(data[])` | Create multiple transactions sequentially |
| `getBudgets(month)` | Fetch budgets for a given month |
| `setBudget(data)` | Create or update a budget |
| `getDebts()` | Fetch all debts |
| `createDebt(data)` | Create a debt record |
| `updateDebt(id, data)` | Update a debt |
| `getSubscriptions()` | Fetch all subscriptions |
| `createSubscription(data)` | Create a subscription |
| `getReflection(month)` | Fetch reflection for a month |
| `saveReflection(data)` | Create or update a reflection |

## Type Definitions (`src/features/finance/data/schema.ts`)

```typescript
// Source types
type FinanceSource = { id, name, type, balance, created, updated }
// type = 'bank' | 'savings' | 'credit_card' | 'e_wallet' | 'cash'

// Transaction types
type Transaction = { id, amount, type, category, subcategory, source_id, date, description, expand? }
// type = 'expense' | 'income' | 'transfer' | 'debt_repayment'

// Budget
type Budget = { id, category, amount, month, created, updated }
// month format: 'YYYY-MM'

// Debt
type Debt = { id, name, type, amount, remaining_amount, due_date }
// type = 'payable' | 'receivable'

// Subscription
type Subscription = { id, name, cost, billing_cycle, next_billing_date, source_id, category }
// billing_cycle = 'monthly' | 'yearly'

// Reflection
type Reflection = { id, month, content, created, updated }
```

## PocketBase Setup

### Environment Variable
```bash
# .env.local
VITE_POCKETBASE_URL=http://localhost:8090  # or your production URL
```

### Required Collections

Create these collections in your PocketBase admin UI (`http://localhost:8090/_/`):

**`finance_sources`**
- `user_id` (relation → users)
- `name` (text, required)
- `type` (text: bank | savings | credit_card | e_wallet | cash)
- `balance` (number, default 0)

**`finance_categories`**
- `name` (text, required)
- `type` (text: income | expense)

**`finance_subcategories`**
- `name` (text, required)
- `category_id` (relation → finance_categories)

**`finance_transactions`**
- `user_id` (relation → users)
- `amount` (number, required)
- `type` (text: expense | income | transfer | debt_repayment)
- `category` (relation → finance_categories)
- `subcategory` (relation → finance_subcategories, optional)
- `source_id` (relation → finance_sources)
- `date` (date, required)
- `description` (text, optional)

**`finance_budgets`**
- `user_id` (relation → users)
- `category` (text)
- `amount` (number)
- `month` (text, format YYYY-MM)

**`finance_debts`**
- `user_id` (relation → users)
- `name` (text)
- `type` (text: payable | receivable)
- `amount` (number)
- `remaining_amount` (number)
- `due_date` (date, optional)

**`finance_subscriptions`**
- `user_id` (relation → users)
- `name` (text)
- `cost` (number)
- `billing_cycle` (text: monthly | yearly)
- `next_billing_date` (date)
- `source_id` (relation → finance_sources)
- `category` (text)
- `subcategory` (text, optional)

**`finance_reflections`**
- `user_id` (relation → users)
- `month` (text, format YYYY-MM)
- `content` (text)

## Developer Guidelines

### Adding Finance Features

1. Create new components in `src/features/finance/components/`
2. Add API functions to `src/features/finance/data/api.ts`
3. Add Zod schemas and types to `src/features/finance/data/schema.ts`
4. For new routes, add files under `src/routes/_authenticated/finance/`
5. Update sidebar in `src/components/layout/data/sidebar-data.ts`

### Patterns

```typescript
// Fetch on mount
const fetchData = async () => {
  const [sources, transactions] = await Promise.all([getSources(), getTransactions()])
  setSources(sources)
  setTransactions(transactions)
}

// Create with balance update
await createTransaction(data) // automatically updates source balance

// Upsert pattern (budget, reflection)
await setBudget(data)      // creates or updates based on category + month
await saveReflection(data) // creates or updates based on month
```

## Troubleshooting

### "Failed to load finance data"
- PocketBase is not running or not reachable
- Check `VITE_POCKETBASE_URL` in your `.env` file
- Ensure collections are created in PocketBase

### Transactions not affecting balance
- Verify `source_id` is correctly set in the transaction form
- Check that the source exists in `finance_sources`

### CSV import fails
- Ensure CSV columns match expected format
- Check browser console for parsing errors
