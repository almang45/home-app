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

        // 1. Create finance_sources first (referenced by others)
        // await createCollection('finance_sources', {
        //     name: 'finance_sources',
        //     type: 'base',
        //     listRule: '@request.auth.id != ""',
        //     viewRule: '@request.auth.id != ""',
        //     createRule: '@request.auth.id != ""',
        //     updateRule: '@request.auth.id != ""',
        //     deleteRule: '@request.auth.id != ""',
        //     fields: [
        //         { name: 'name', type: 'text', required: true },
        //         {
        //             name: 'type', type: 'select', required: false,
        //             values: ['bank', 'savings', 'credit_card', 'e_wallet', 'cash']
        //         },
        //         { name: 'balance', type: 'number', required: true },
        //         { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
        //         { name: 'created', type: 'autodate', onCreate: true },
        //         { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
        //     ]
        // });

        // Get the ID of the newly created finance_sources collection
        const sourcesCollection = await pb.collections.getFirstListItem('name="finance_sources"');
        const sourcesId = sourcesCollection.id;
        console.log(`finance_sources ID: ${sourcesId}`);

        // 2. Create Categories Collection
        console.log('Creating finance_categories collection...');
        const categoriesId = await createCollection('finance_categories', {
            name: 'finance_categories',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'type', type: 'select', required: true, values: ['income', 'expense'] },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ],
            listRule: '@request.auth.id != "" && @request.auth.id != ""',
            viewRule: '@request.auth.id != "" && @request.auth.id != ""',
            createRule: '@request.auth.id != "" && @request.auth.id != ""',
            updateRule: '@request.auth.id != "" && @request.auth.id != ""',
            deleteRule: '@request.auth.id != "" && @request.auth.id != ""',
        });
        console.log(`finance_categories ID: ${categoriesId}`);

        // 3. Create Subcategories Collection
        console.log('Creating finance_subcategories collection...');
        const subcategoriesId = await createCollection('finance_subcategories', {
            name: 'finance_subcategories',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'category_id', type: 'relation', required: true, collectionId: categoriesId, cascadeDelete: true },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ],
            listRule: '@request.auth.id != "" && @request.auth.id != ""',
            viewRule: '@request.auth.id != "" && @request.auth.id != ""',
            createRule: '@request.auth.id != "" && @request.auth.id != ""',
            updateRule: '@request.auth.id != "" && @request.auth.id != ""',
            deleteRule: '@request.auth.id != "" && @request.auth.id != ""',
        });
        console.log(`finance_subcategories ID: ${subcategoriesId}`);

        // 4. Create Transactions Collection (Updated)
        console.log('Creating finance_transactions collection...');
        await createCollection('finance_transactions', {
            name: 'finance_transactions',
            type: 'base',
            fields: [
                { name: 'amount', type: 'number', required: true },
                {
                    name: 'type', type: 'select', required: true,
                    values: ['income', 'expense', 'transfer', 'debt_repayment']
                },
                { name: 'category', type: 'relation', required: true, collectionId: categoriesId, cascadeDelete: false },
                { name: 'subcategory', type: 'relation', required: false, collectionId: subcategoriesId, cascadeDelete: false },
                { name: 'date', type: 'date', required: true },
                { name: 'description', type: 'text' },
                { name: 'source_id', type: 'relation', required: true, collectionId: sourcesId, cascadeDelete: false },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ],
            listRule: '@request.auth.id != "" && @request.auth.id != ""',
            viewRule: '@request.auth.id != "" && @request.auth.id != ""',
            createRule: '@request.auth.id != "" && @request.auth.id != ""',
            updateRule: '@request.auth.id != "" && @request.auth.id != ""',
            deleteRule: '@request.auth.id != "" && @request.auth.id != ""',
        });

        await createCollection('finance_budgets', {
            name: 'finance_budgets',
            type: 'base',
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
            fields: [
                { name: 'category', type: 'relation', required: true, collectionId: categoriesId, cascadeDelete: false },
                { name: 'amount', type: 'number', required: true },
                { name: 'month', type: 'text', required: true }, // YYYY-MM
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ]
        });

        await createCollection('finance_debts', {
            name: 'finance_debts',
            type: 'base',
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
            fields: [
                { name: 'name', type: 'text', required: true },
                {
                    name: 'type', type: 'select', required: true,
                    values: ['payable', 'receivable']
                },
                { name: 'amount', type: 'number', required: true },
                { name: 'remaining_amount', type: 'number', required: true },
                { name: 'due_date', type: 'date', required: false },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ]
        });

        // 5. Create Subscriptions Collection (Updated)
        console.log('Creating finance_subscriptions collection...');
        await createCollection('finance_subscriptions', {
            name: 'finance_subscriptions',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'cost', type: 'number', required: true },
                {
                    name: 'billing_cycle', type: 'select', required: true,
                    values: ['monthly', 'yearly']
                },
                { name: 'category', type: 'relation', required: true, collectionId: categoriesId, cascadeDelete: false },
                { name: 'subcategory', type: 'relation', required: false, collectionId: subcategoriesId, cascadeDelete: false },
                { name: 'next_billing_date', type: 'date', required: true },
                { name: 'source_id', type: 'relation', required: true, collectionId: sourcesId, cascadeDelete: false },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ],
            listRule: '@request.auth.id != "" && @request.auth.id != ""',
            viewRule: '@request.auth.id != "" && @request.auth.id != ""',
            createRule: '@request.auth.id != "" && @request.auth.id != ""',
            updateRule: '@request.auth.id != "" && @request.auth.id != ""',
            deleteRule: '@request.auth.id != "" && @request.auth.id != ""',
        });

        await createCollection('finance_reflections', {
            name: 'finance_reflections',
            type: 'base',
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
            fields: [
                { name: 'month', type: 'text', required: true }, // YYYY-MM
                { name: 'content', type: 'text', required: true },
                { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: false },
                { name: 'created', type: 'autodate', onCreate: true },
                { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
            ]
        });

        console.log('All collections set up successfully!');

        // 9. Seed Categories and Subcategories
        console.log('Seeding categories...');

        // We need a user ID to associate these with. 
        // For now, we'll try to find the first user, or just skip if no user exists.
        // Ideally, these should be "system" categories or copied per user on signup.
        // But for this personal app, we'll assign them to the admin or first user found.

        const users = await pb.collection('users').getList(1, 10);
        const userId = users.items[1]?.id;

        if (userId) {
            const categories = [
                // Expense
                { name: 'Needs', type: 'expense', subs: ['Health', 'House', 'Transportation', 'Utilities', 'Education', 'Groceries'] },
                { name: 'Wants', type: 'expense', subs: ['Entertainment', 'Dining Out', 'Shopping', 'Hobbies'] },
                { name: 'Culture', type: 'expense', subs: ['Books', 'Events', 'Donations'] },
                { name: 'Unexpected', type: 'expense', subs: ['Medical', 'Repairs', 'Fines'] },
                { name: 'Savings', type: 'expense', subs: ['Emergency Fund', 'Investments', 'Retirement'] },
                // Income
                { name: 'Salary', type: 'income', subs: ['Paycheck', 'Bonus', 'Side Hustle'] },
                { name: 'Investments', type: 'income', subs: ['Interest', 'Dividends', 'Bonds', 'Crypto', 'Stocks'] },
                { name: 'Gifts', type: 'income', subs: ['Allowance', 'Gift'] },
                { name: 'Other Income', type: 'income', subs: ['Refunds', 'Sales'] },
            ];

            for (const cat of categories) {
                try {
                    // Check if category exists
                    const existingCats = await pb.collection('finance_categories').getList(1, 1, {
                        filter: `name = "${cat.name}" && user_id = "${userId}"`
                    });

                    let catId;
                    if (existingCats.items.length > 0) {
                        catId = existingCats.items[0].id;
                        console.log(`Category ${cat.name} already exists.`);
                    } else {
                        const newCat = await pb.collection('finance_categories').create({
                            name: cat.name,
                            type: cat.type,
                            user_id: userId
                        });
                        catId = newCat.id;
                        console.log(`Created category: ${cat.name}`);
                    }

                    // Create subcategories
                    for (const sub of cat.subs) {
                        const existingSubs = await pb.collection('finance_subcategories').getList(1, 1, {
                            filter: `name = "${sub}" && category_id = "${catId}"`
                        });

                        if (existingSubs.items.length === 0) {
                            await pb.collection('finance_subcategories').create({
                                name: sub,
                                category_id: catId,
                                user_id: userId
                            });
                            console.log(`  Created subcategory: ${sub}`);
                        }
                    }

                } catch (e) {
                    console.error(`Error seeding category ${cat.name}:`, e);
                }
            }
        } else {
            console.warn("No user found to seed categories for. Please create a user first.");
        }

    } catch (err) {
        console.error('Setup failed:', err);
    }
}

async function createCollection(name: string, data: any) {
    try {
        const collection = await pb.collections.getFirstListItem(`name="${name}"`);
        console.log(`Collection "${name}" already exists. Deleting to recreate...`);
        await pb.collections.delete(collection.id);
    } catch (err: any) {
        if (err.status !== 404) {
            throw err;
        }
    }

    console.log(`Creating collection "${name}"...`);
    const record = await pb.collections.create(data);
    return record.id;
}

main();
