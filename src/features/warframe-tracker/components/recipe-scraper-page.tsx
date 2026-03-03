import { useState } from 'react'
import { Loader2, Plus, Trash2, Download, Copy, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { toast } from 'sonner'
import {
  scrapeWarframeRecipes,
  generateTypeScriptCode,
  extractWarframeName,
  type ScrapeResult,
} from '@/lib/recipe-scraper'

export function RecipeScraperPage() {
  const [urls, setUrls] = useState<string[]>([])
  const [currentUrl, setCurrentUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<ScrapeResult[]>([])
  const [generatedCode, setGeneratedCode] = useState('')

  const exampleUrls = [
    'https://wiki.warframe.com/w/Khora',
    'https://wiki.warframe.com/w/Ash/Prime',
    'https://warframe.fandom.com/wiki/Khora_Prime',
  ]

  const addUrl = () => {
    const trimmedUrl = currentUrl.trim()
    
    if (!trimmedUrl) {
      toast.error('Please enter a URL')
      return
    }

    if (!trimmedUrl.includes('warframe')) {
      toast.error('URL must be a Warframe wiki page')
      return
    }

    if (urls.includes(trimmedUrl)) {
      toast.error('URL already added')
      return
    }

    setUrls([...urls, trimmedUrl])
    setCurrentUrl('')
    toast.success('URL added')
  }

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
    toast.success('URL removed')
  }

  const clearAll = () => {
    setUrls([])
    setResults([])
    setGeneratedCode('')
    setProgress({ current: 0, total: 0 })
    toast.success('Cleared all')
  }

  const quickAdd = (url: string) => {
    if (!urls.includes(url)) {
      setUrls([...urls, url])
      toast.success('URL added')
    }
  }

  const scrapeAll = async () => {
    if (urls.length === 0) {
      toast.error('Please add at least one URL')
      return
    }

    setIsScraping(true)
    setResults([])
    setProgress({ current: 0, total: urls.length })

    const newResults: ScrapeResult[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]

      toast.loading(`Scraping ${i + 1} of ${urls.length}...`, {
        id: 'scraping-progress',
      })

      try {
        const result = await scrapeWarframeRecipes(url)
        newResults.push(result)

        if (result.success) {
          toast.success(`✅ ${result.warframe}`, {
            id: 'scraping-progress',
          })
        } else {
          toast.error(`❌ ${result.warframe}: ${result.error}`, {
            id: 'scraping-progress',
          })
        }
      } catch (error) {
        const errorResult: ScrapeResult = {
          url,
          warframe: extractWarframeName(url),
          recipes: {},
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        newResults.push(errorResult)

        toast.error(`❌ ${errorResult.warframe}: ${errorResult.error}`, {
          id: 'scraping-progress',
        })
      }

      setProgress({ current: i + 1, total: urls.length })
      setResults([...newResults])

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const code = generateTypeScriptCode(newResults)
    setGeneratedCode(code)

    setIsScraping(false)
    toast.success(`Completed! Scraped ${newResults.length} warframes`)
  }

  const copyToClipboard = () => {
    if (!generatedCode) {
      toast.error('No code to copy')
      return
    }

    navigator.clipboard.writeText(generatedCode)
    toast.success('Copied to clipboard!')
  }

  const downloadCode = () => {
    if (!generatedCode) {
      toast.error('No code to download')
      return
    }

    const blob = new Blob([generatedCode], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'warframe-recipes.ts'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  const progressPercentage =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Recipe Scraper
          </h2>
          <p className='text-muted-foreground'>
            Automatically extract crafting recipes from Warframe Wiki
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Input Section */}
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Input URLs</CardTitle>
                <CardDescription>
                  Add wiki URLs to scrape crafting recipes
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='url-input'>Wiki URL</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='url-input'
                      placeholder='https://wiki.warframe.com/w/Khora'
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addUrl()
                      }}
                    />
                    <Button onClick={addUrl} size='icon'>
                      <Plus className='size-4' />
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Quick Add Examples</Label>
                  <div className='flex flex-wrap gap-2'>
                    {exampleUrls.map((url) => (
                      <Button
                        key={url}
                        variant='outline'
                        size='sm'
                        onClick={() => quickAdd(url)}
                      >
                        {extractWarframeName(url)}
                      </Button>
                    ))}
                  </div>
                </div>

                {urls.length > 0 && (
                  <div className='space-y-2'>
                    <Label>URLs to Scrape ({urls.length})</Label>
                    <div className='space-y-2 rounded-md border p-2'>
                      {urls.map((url, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded bg-muted p-2'
                        >
                          <span className='truncate text-sm'>{url}</span>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-7 shrink-0'
                            onClick={() => removeUrl(index)}
                          >
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className='flex gap-2'>
                  <Button
                    onClick={scrapeAll}
                    disabled={urls.length === 0 || isScraping}
                    className='flex-1'
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className='mr-2 size-4 animate-spin' />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <PlayCircle className='mr-2 size-4' />
                        Scrape All
                      </>
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={clearAll}
                    disabled={isScraping}
                  >
                    Clear All
                  </Button>
                </div>

                {progress.total > 0 && (
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Progress</span>
                      <span>
                        {progress.current} / {progress.total}
                      </span>
                    </div>
                    <div className='h-2 w-full overflow-hidden rounded-full bg-secondary'>
                      <div
                        className='h-full bg-primary transition-all duration-300'
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {results.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Results</Label>
                    <div className='space-y-2 rounded-md border p-2'>
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded bg-muted p-2'
                        >
                          <span className='text-sm font-medium'>
                            {result.warframe}
                          </span>
                          {result.success ? (
                            <Badge variant='default'>
                              ✓ {Object.keys(result.recipes).length} recipes
                            </Badge>
                          ) : (
                            <Badge variant='destructive'>✗ Failed</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Generated Code</CardTitle>
                <CardDescription>
                  Copy this code to warframe-crafting-recipes.ts
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='output'>TypeScript Output</Label>
                  <Textarea
                    id='output'
                    value={generatedCode}
                    readOnly
                    placeholder='Generated TypeScript code will appear here...'
                    className='font-mono text-sm'
                    rows={20}
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    onClick={copyToClipboard}
                    disabled={!generatedCode}
                    className='flex-1'
                  >
                    <Copy className='mr-2 size-4' />
                    Copy to Clipboard
                  </Button>
                  <Button
                    variant='outline'
                    onClick={downloadCode}
                    disabled={!generatedCode}
                  >
                    <Download className='mr-2 size-4' />
                    Download
                  </Button>
                </div>

                {generatedCode && (
                  <div className='rounded-md border border-blue-500/50 bg-blue-500/10 p-3'>
                    <p className='text-sm'>
                      💡 <strong>Next steps:</strong>
                      <br />
                      1. Copy the code above
                      <br />
                      2. Open{' '}
                      <code className='rounded bg-muted px-1'>
                        src/lib/warframe-crafting-recipes.ts
                      </code>
                      <br />
                      3. Add to the <code className='rounded bg-muted px-1'>
                        CRAFTING_RECIPES
                      </code>{' '}
                      object
                    </p>
                  </div>
                )}

                <div className='rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3'>
                  <p className='text-sm'>
                    ⚠️ <strong>CORS Limitations:</strong>
                    <br />
                    If scraping fails, try:
                    <br />
                    1. Use <strong>wiki.warframe.com</strong> URLs (not fandom)
                    <br />
                    2. Install a{' '}
                    <a
                      href='https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-400 underline hover:text-blue-300'
                    >
                      CORS browser extension
                    </a>
                    <br />
                    3. Or manually add recipes from the wiki
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
