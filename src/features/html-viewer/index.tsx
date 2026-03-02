import { useState } from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { htmlFiles } from './data/files'

export function HtmlViewer() {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredFiles = htmlFiles.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <>
            <Header>
                <Search />
                <div className='ms-auto flex items-center gap-4'>
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main fixed>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>HTML Viewer</h1>
                    <p className='text-muted-foreground'>
                        View and manage your HTML files.
                    </p>
                </div>
                <div className='my-4 flex items-center justify-between'>
                    <Input
                        placeholder='Filter files...'
                        className='h-9 w-40 lg:w-[250px]'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Separator className='shadow-sm' />
                <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
                    {filteredFiles.map((file) => (
                        <li
                            key={file.id}
                            className='rounded-lg border p-4 hover:shadow-md transition-shadow'
                        >
                            <div className='mb-4 flex items-center justify-between'>
                                <div className='bg-muted flex size-10 items-center justify-center rounded-lg p-2'>
                                    <FileText className='size-6 text-primary' />
                                </div>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    asChild
                                >
                                    <a href={file.path} target='_blank' rel='noopener noreferrer'>
                                        <ExternalLink className='mr-2 size-4' />
                                        Open
                                    </a>
                                </Button>
                            </div>
                            <div>
                                <h2 className='mb-1 font-semibold'>{file.name}</h2>
                                <p className='line-clamp-2 text-sm text-muted-foreground mb-2'>
                                    {file.description}
                                </p>
                                <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                    <span>{file.createdAt}</span>
                                    <span>{file.size}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </Main>
        </>
    )
}
