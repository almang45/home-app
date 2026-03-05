import { useState, useMemo, useCallback } from 'react'
import { Upload, Star, Trophy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import {
  parseProfile,
  getMasteryRankName,
  calculateMasteryBreakdown,
  getRailjackIntrinsicsTotal,
  getDrifterIntrinsicsTotal,
  type WarframeProfileResult,
  type ProfileRaw,
} from '@/lib/warframe-profile'
import { trackerStorage } from '@/lib/tracker-storage'
import { logger } from '@/lib/logger'
import { useAllItems } from '../data/queries'
import type { MasteredItem, OwnedItem } from '../data/types'

const DEFAULT_USER_ID = 'local-user'
const PROFILE_STORAGE_KEY = 'wf-mastery-profile'

function loadStoredProfile(): WarframeProfileResult | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WarframeProfileResult) : null
  } catch {
    return null
  }
}

function storeProfile(profile: WarframeProfileResult): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function MasteryPage() {
  const [profile, setProfile] = useState<WarframeProfileResult | null>(loadStoredProfile)
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingSample, setIsLoadingSample] = useState(false)
  const queryClient = useQueryClient()
  const { data: allItems } = useAllItems()

  const breakdown = useMemo(
    () => (profile ? calculateMasteryBreakdown(profile.xpInfo) : []),
    [profile]
  )

  const totalEstimatedXP = useMemo(
    () => breakdown.reduce((sum, b) => sum + b.estimatedXP, 0),
    [breakdown]
  )

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string) as ProfileRaw
        const parsed = parseProfile(raw)
        if (!parsed) {
          toast.error('Invalid profile format — expected Warframe profile JSON')
          return
        }
        setProfile(parsed)
        storeProfile(parsed)
        toast.success(`Profile loaded for ${parsed.displayName} (MR${parsed.playerLevel})`)
      } catch {
        toast.error('Failed to parse profile JSON')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }, [])

  const handleLoadSample = useCallback(async () => {
    setIsLoadingSample(true)
    try {
      const { default: sampleRaw } = await import(
        '@/resources/warframe/profile-sample.json'
      )
      const parsed = parseProfile(sampleRaw as ProfileRaw)
      if (!parsed) {
        toast.error('Failed to parse sample profile')
        return
      }
      setProfile(parsed)
      storeProfile(parsed)
      toast.success(`Sample profile loaded for ${parsed.displayName}`)
    } catch {
      toast.error('Sample profile not found')
    } finally {
      setIsLoadingSample(false)
    }
  }, [])

  const handleImportMastered = useCallback(async () => {
    if (!profile) return
    setIsImporting(true)

    try {
      let imported = 0
      let skipped = 0

      for (const xpEntry of profile.xpInfo) {
        // Find matching WFCD item by uniqueName
        const wfcdItem = allItems?.find((i) => i.uniqueName === xpEntry.ItemType)

        if (wfcdItem && wfcdItem.masterable !== false) {
          try {
            const masteredItem: MasteredItem = {
              userId: DEFAULT_USER_ID,
              uniqueName: wfcdItem.uniqueName,
              itemName: wfcdItem.name,
              category: wfcdItem.category,
              masteredAt: new Date().toISOString(),
            }
            const ownedItem: OwnedItem = {
              userId: DEFAULT_USER_ID,
              uniqueName: wfcdItem.uniqueName,
              itemName: wfcdItem.name,
              category: wfcdItem.category,
              ownedAt: new Date().toISOString(),
            }
            await trackerStorage.addMasteredItem(masteredItem)
            await trackerStorage.addOwnedItem(ownedItem)
            imported++
          } catch (err) {
            logger.error('Failed to import item', xpEntry.ItemType, err)
            skipped++
          }
        } else {
          skipped++
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['tracker', 'mastered'] })
      await queryClient.invalidateQueries({ queryKey: ['tracker', 'owned'] })

      toast.success(
        `Imported ${imported} mastered items${skipped > 0 ? ` (${skipped} skipped — not in WFCD database)` : ''}`
      )
    } catch (err) {
      logger.error('Failed to import mastered items', err)
      toast.error('Import failed')
    } finally {
      setIsImporting(false)
    }
  }, [profile, allItems, queryClient])

  const handleClearProfile = useCallback(() => {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    setProfile(null)
    toast.success('Profile cleared')
  }, [])

  const mr = profile?.playerLevel ?? 0
  const mrName = getMasteryRankName(mr)
  const railjackTotal = profile ? getRailjackIntrinsicsTotal(profile.playerSkills) : 0
  const drifterTotal = profile ? getDrifterIntrinsicsTotal(profile.playerSkills) : 0

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold tracking-tight'>Mastery Tracker</h2>
          <p className='text-muted-foreground'>
            Import your Warframe public profile to track mastery progress.
          </p>
        </div>

        {!profile ? (
          <Card className='flex flex-col items-center justify-center p-12 text-center'>
            <Trophy className='text-muted-foreground mb-4 size-12' />
            <h3 className='mb-2 text-lg font-semibold'>No Profile Loaded</h3>
            <p className='text-muted-foreground mb-6 max-w-sm text-sm'>
              Upload your Warframe profile JSON from{' '}
              <code className='bg-muted rounded px-1 text-xs'>
                warframe.com/dynamic/getProfileViewingData.php
              </code>{' '}
              or load the demo profile.
            </p>
            <div className='flex gap-3'>
              <label>
                <Button variant='default' asChild>
                  <span className='cursor-pointer'>
                    <Upload className='mr-2 size-4' />
                    Upload Profile JSON
                  </span>
                </Button>
                <input
                  type='file'
                  accept='.json'
                  onChange={handleFileUpload}
                  className='hidden'
                />
              </label>
              <Button
                variant='outline'
                onClick={handleLoadSample}
                disabled={isLoadingSample}
              >
                <Star className='mr-2 size-4' />
                {isLoadingSample ? 'Loading...' : 'Load Sample Profile'}
              </Button>
            </div>
          </Card>
        ) : (
          <div className='space-y-6'>
            {/* Profile Header */}
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='bg-primary/10 flex size-16 items-center justify-center rounded-full'>
                  <span className='text-primary text-2xl font-bold'>{mr}</span>
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-xl font-bold'>{profile.displayName}</h3>
                    <Badge variant='secondary'>PC</Badge>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    MR{mr} · {mrName}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Est. mastery XP: {totalEstimatedXP.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap gap-2'>
                <label>
                  <Button variant='outline' size='sm' asChild>
                    <span className='cursor-pointer'>
                      <Upload className='mr-2 size-4' />
                      Replace Profile
                    </span>
                  </Button>
                  <input
                    type='file'
                    accept='.json'
                    onChange={handleFileUpload}
                    className='hidden'
                  />
                </label>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleLoadSample}
                  disabled={isLoadingSample}
                >
                  <RefreshCw className='mr-2 size-4' />
                  Load Sample
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleClearProfile}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-muted-foreground text-sm font-medium'>
                    Mastery Rank
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>MR{mr}</div>
                  <p className='text-muted-foreground text-xs'>{mrName}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-muted-foreground text-sm font-medium'>
                    Items Mastered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{profile.xpInfo.length}</div>
                  <p className='text-muted-foreground text-xs'>
                    across {breakdown.length} categories
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-muted-foreground text-sm font-medium'>
                    Railjack Intrinsics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{railjackTotal}</div>
                  <p className='text-muted-foreground text-xs'>total levels (max 50)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-muted-foreground text-sm font-medium'>
                    Drifter Intrinsics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{drifterTotal}</div>
                  <p className='text-muted-foreground text-xs'>total levels (max 40)</p>
                </CardContent>
              </Card>
            </div>

            {/* Mastery Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Mastery Breakdown by Category</CardTitle>
                <CardDescription>
                  Items from your XPInfo, grouped by type. Each maxed item
                  contributes mastery XP (6,000 for frames/companions, 3,000 for
                  weapons).
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {breakdown.map((entry) => {
                  const maxXP = profile.xpInfo.length * 6000 // rough max for % bar
                  const pct = maxXP > 0 ? (entry.estimatedXP / maxXP) * 100 : 0
                  return (
                    <div key={entry.label} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span className='font-medium'>{entry.label}</span>
                        <span className='text-muted-foreground'>
                          {entry.count} items · {entry.estimatedXP.toLocaleString()} XP
                        </span>
                      </div>
                      <Progress value={Math.min(pct, 100)} className='h-2' />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Railjack Intrinsics Detail */}
            {Object.values(profile.playerSkills).some((v) => v && v > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Intrinsics Detail</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <p className='text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide'>
                      Railjack
                    </p>
                    <div className='grid grid-cols-2 gap-2 text-sm sm:grid-cols-5'>
                      {(
                        [
                          ['Command', profile.playerSkills.LPS_COMMAND],
                          ['Engineering', profile.playerSkills.LPS_ENGINEERING],
                          ['Gunnery', profile.playerSkills.LPS_GUNNERY],
                          ['Piloting', profile.playerSkills.LPS_PILOTING],
                          ['Tactical', profile.playerSkills.LPS_TACTICAL],
                        ] as [string, number | undefined][]
                      ).map(([name, val]) => (
                        <div key={name} className='bg-muted rounded p-2 text-center'>
                          <div className='font-bold'>{val ?? 0}</div>
                          <div className='text-muted-foreground text-xs'>{name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {drifterTotal > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className='text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide'>
                          Drifter
                        </p>
                        <div className='grid grid-cols-2 gap-2 text-sm sm:grid-cols-4'>
                          {(
                            [
                              ['Combat', profile.playerSkills.LPS_DRIFT_COMBAT],
                              ['Endurance', profile.playerSkills.LPS_DRIFT_ENDURANCE],
                              ['Opportunity', profile.playerSkills.LPS_DRIFT_OPPORTUNITY],
                              ['Riding', profile.playerSkills.LPS_DRIFT_RIDING],
                            ] as [string, number | undefined][]
                          ).map(([name, val]) => (
                            <div key={name} className='bg-muted rounded p-2 text-center'>
                              <div className='font-bold'>{val ?? 0}</div>
                              <div className='text-muted-foreground text-xs'>{name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Import Action */}
            <Card>
              <CardHeader>
                <CardTitle>Import to Tracker</CardTitle>
                <CardDescription>
                  Mark all items from your XPInfo as mastered and owned in the
                  local tracker. Items not found in the WFCD database will be
                  skipped.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleImportMastered}
                  disabled={isImporting || !allItems}
                >
                  <Trophy className='mr-2 size-4' />
                  {isImporting
                    ? 'Importing...'
                    : `Import ${profile.xpInfo.length} Mastered Items`}
                </Button>
                {!allItems && (
                  <p className='text-muted-foreground mt-2 text-xs'>
                    Loading WFCD item database, please wait…
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
