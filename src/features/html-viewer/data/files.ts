export type HtmlFile = {
    id: string
    name: string
    description: string
    path: string
    createdAt: string
    size: string
}

export const htmlFiles: HtmlFile[] = [
    {
        id: '1',
        name: 'Annual Report 2023',
        description: 'Comprehensive financial report for the year 2023.',
        path: '/html-files/report-2023.html',
        createdAt: '2023-12-31',
        size: '1.2 MB',
    },
    {
        id: '2',
        name: 'Invoice #001',
        description: 'Invoice for client project Alpha.',
        path: '/html-files/invoice-001.html',
        createdAt: '2024-01-15',
        size: '45 KB',
    },
    {
        id: '3',
        name: 'Dashboard Prototype',
        description: 'Initial prototype for the new dashboard layout.',
        path: '/html-files/dashboard-v1.html',
        createdAt: '2024-02-20',
        size: '350 KB',
    },
    {
        id: '4',
        name: 'User Guide',
        description: 'Detailed user guide for the application.',
        path: '/html-files/user-guide.html',
        createdAt: '2024-03-10',
        size: '2.5 MB',
    },
    {
        id: '5',
        name: 'Theia Pre-School Comparison',
        description: 'Comparison of schools for Theia\'s Pre-School.',
        path: '/html-files/teya-preschool-comparison.html',
        createdAt: '2025-11-25',
        size: '35 KB',
    },
]
