import PocketBase from 'pocketbase';

// You can run this script with: npx tsx --env-file=.env scripts/setup-pocketbase.ts

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Error: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function main() {
    try {
        console.log(`Connecting to PocketBase at ${PB_URL}...`);
        await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Authenticated as Admin.');

        await pb.collections.update('finance_transactions', {
            name: 'finance_transactions',
            type: 'base',
            listRule: 'user_id = @request.auth.id',
            viewRule: 'user_id = @request.auth.id',
            createRule: 'user_id = @request.auth.id',
            updateRule: 'user_id = @request.auth.id',
            deleteRule: 'user_id = @request.auth.id',
            fields: [
                { name: 'amount', type: 'number', required: true },
                {
                    name: 'type', type: 'select', required: true,
                    values: ['expense', 'income', 'transfer', 'debt_repayment']
                },
                {
                    name: 'category', type: 'select', required: true,
                    values: [
                        'needs', 'wants', 'culture', 'unexpected', 'savings', // Expense
                        'salary', 'investments', 'gifts', 'other_income' // Income
                    ]
                },
                {
                    name: 'subcategory', type: 'select', required: true,
                    values: [
                        'health', 'entertainment', 'house', 'cleaning', 'snacks', 'meals', 'transportation', 'utilities', 'clothing', 'personal', 'education', 'other', // Expense
                        'paycheck', 'bonus', 'side_hustle', // Salary
                        'interest', 'dividends', 'bonds', 'crypto', 'stocks', // Investments
                        'allowance', 'gift', // Gifts
                        'refunds', 'sales' // Other
                    ]
                },
                { name: 'source_id', type: 'relation', required: true, collectionId: 'pbc_1367565508', cascadeDelete: false },
                { name: 'date', type: 'date', required: true },
                { name: 'description', type: 'text', required: false },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ]
        });

    } catch (err) {
        console.error('Update failed:', err);
    }
}

main();
