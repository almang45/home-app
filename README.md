# Shadcn Admin Dashboard

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](public/images/shadcn-admin.png)

[![Sponsored by Clerk](https://img.shields.io/badge/Sponsored%20by-Clerk-5b6ee1?logo=clerk)](https://go.clerk.com/GttUAaK)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support
- **Finance Tracker** - Kakeibo-style personal finance management
- **Inventory Manager** - Home supplies tracker with AI receipt scanning
- **HTML Viewer** - Browse and open local HTML files

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)

**Backend/BaaS:** [PocketBase](https://pocketbase.io) (optional, required for Finance and Inventory features)

**AI:** [Google Gemini](https://ai.google.dev/) (optional, used for receipt scanning in Inventory)

## Special Features

### Finance Tracker

A Kakeibo-style personal finance management system. Track income and expenses across multiple accounts, plan budgets, manage debts, and reflect on monthly spending.

**Key Features:**
- Track owned accounts: bank, savings, credit card, e-wallet, cash
- Log transactions with Kakeibo categories (needs, wants, culture, unexpected)
- Monthly budget planning per category
- Debt tracker (payable and receivable)
- Subscription manager with billing cycle tracking
- Monthly analysis and reflection journal
- Bulk transaction entry and CSV import

**Documentation:** See [docs/features/finance](./docs/features/finance/README.md)

**Route:** `/finance`

---

### Inventory Manager

Track home supplies and groceries with stock levels, low-stock alerts, and purchase history. Use AI to scan receipts automatically.

**Key Features:**
- Item catalog with stock levels and minimum thresholds
- Low stock alerts with visual indicators
- Record shopping trips with multi-item support
- AI receipt scanning via Google Gemini (auto-fill store, date, items)
- Purchase history grouped by shopping trip
- PDF shopping list generation
- Bulk add new items

**Documentation:** See [docs/features/inventory](./docs/features/inventory/README.md)

**Routes:**
- `/inventory/supplies` - Item catalog and stock management
- `/inventory/purchases` - Log and view purchase history

---

### HTML Viewer

Browse and open static HTML files stored in `public/html-files/`. Useful for self-contained reports, prototypes, and documents.

**Documentation:** See [docs/features/html-viewer](./docs/features/html-viewer/README.md)

**Route:** `/html-viewer`

## Run Locally

Clone the project

```bash
  git clone https://github.com/satnaing/shadcn-admin.git
```

Go to the project directory

```bash
  cd shadcn-admin
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [satnaingdev@gmail.com](mailto:satnaingdev@gmail.com).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - authentication and user management for the modern web

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
