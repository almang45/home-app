import { useState } from 'react'
import { Download, Upload, Database, HardDrive } from 'lucide-react'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import {
  exportFromLocalStorage,
  exportFromPocketBase,
  importToLocalStorage,
  importToPocketBase,
  downloadExport,
  parseImportFile,
  migrateLocalToPocketBase,
  migratePocketBaseToLocal,
} from '@/lib/tracker-export-import'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function DataManagementPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [clearExisting, setClearExisting] = useState(false)

  const isAuthenticated = pb.authStore.isValid
  const userId = pb.authStore.model?.id || 'local-user'

  // Export from localStorage
  const handleExportLocal = async () => {
    setIsExporting(true)
    try {
      const data = await exportFromLocalStorage('local-user')
      downloadExport(data)
      toast.success(
        `Exported ${
          data.ownedItems.length +
          data.masteredItems.length +
          data.wishlistItems.length +
          data.resourceInventory.length
        } records`
      )
    } catch (error) {
      toast.error('Export failed: ' + (error as Error).message)
    } finally {
      setIsExporting(false)
    }
  }

  // Export from PocketBase
  const handleExportPocketBase = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to export from PocketBase')
      return
    }

    setIsExporting(true)
    try {
      const data = await exportFromPocketBase(userId)
      downloadExport(data)
      toast.success(
        `Exported ${
          data.ownedItems.length +
          data.masteredItems.length +
          data.wishlistItems.length +
          data.resourceInventory.length
        } records`
      )
    } catch (error) {
      toast.error('Export failed: ' + (error as Error).message)
    } finally {
      setIsExporting(false)
    }
  }

  // Import to localStorage
  const handleImportLocal = async (file: File) => {
    setIsImporting(true)
    try {
      const data = await parseImportFile(file)
      await importToLocalStorage(data, 'local-user', { clearExisting })
      toast.success(
        `Imported ${
          data.ownedItems.length +
          data.masteredItems.length +
          data.wishlistItems.length +
          data.resourceInventory.length
        } records`
      )
      // Refresh page to reload data
      window.location.reload()
    } catch (error) {
      toast.error('Import failed: ' + (error as Error).message)
    } finally {
      setIsImporting(false)
    }
  }

  // Import to PocketBase
  const handleImportPocketBase = async (file: File) => {
    if (!isAuthenticated) {
      toast.error('Please log in to import to PocketBase')
      return
    }

    setIsImporting(true)
    try {
      const data = await parseImportFile(file)
      await importToPocketBase(data, userId, { clearExisting })
      toast.success(
        `Imported ${
          data.ownedItems.length +
          data.masteredItems.length +
          data.wishlistItems.length +
          data.resourceInventory.length
        } records`
      )
      // Refresh page to reload data
      window.location.reload()
    } catch (error) {
      toast.error('Import failed: ' + (error as Error).message)
    } finally {
      setIsImporting(false)
    }
  }

  // Migrate localStorage → PocketBase
  const handleMigrateToCloud = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to migrate to PocketBase')
      return
    }

    setIsMigrating(true)
    try {
      await migrateLocalToPocketBase('local-user', userId, {
        clearPocketBaseFirst: clearExisting,
      })
      toast.success('Successfully migrated data to PocketBase')
      window.location.reload()
    } catch (error) {
      toast.error('Migration failed: ' + (error as Error).message)
    } finally {
      setIsMigrating(false)
    }
  }

  // Migrate PocketBase → localStorage
  const handleMigrateToLocal = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to migrate from PocketBase')
      return
    }

    setIsMigrating(true)
    try {
      await migratePocketBaseToLocal(userId, 'local-user', {
        clearLocalStorageFirst: clearExisting,
      })
      toast.success('Successfully migrated data to localStorage')
      window.location.reload()
    } catch (error) {
      toast.error('Migration failed: ' + (error as Error).message)
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold'>Data Management</h2>
        <p className='text-muted-foreground'>
          Export, import, and migrate your Warframe Tracker data
        </p>
      </div>

      {!isAuthenticated && (
        <Alert>
          <AlertDescription>
            You are using local storage. Log in to sync data with PocketBase
            (cloud storage).
          </AlertDescription>
        </Alert>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='size-5' />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your data as a JSON file for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Button
            onClick={handleExportLocal}
            disabled={isExporting}
            className='w-full'
            variant='outline'
          >
            <HardDrive className='mr-2 size-4' />
            Export from Local Storage
          </Button>

          {isAuthenticated && (
            <Button
              onClick={handleExportPocketBase}
              disabled={isExporting}
              className='w-full'
              variant='outline'
            >
              <Database className='mr-2 size-4' />
              Export from PocketBase
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='size-5' />
            Import Data
          </CardTitle>
          <CardDescription>
            Upload a previously exported JSON file to restore your data
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='clear-existing'
              checked={clearExisting}
              onCheckedChange={setClearExisting}
            />
            <Label htmlFor='clear-existing'>
              Clear existing data before import
            </Label>
          </div>

          <div className='space-y-3'>
            <div>
              <Label>Import to Local Storage</Label>
              <input
                type='file'
                accept='.json'
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportLocal(file)
                }}
                disabled={isImporting}
                className='text-muted-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium'
              />
            </div>

            {isAuthenticated && (
              <div>
                <Label>Import to PocketBase</Label>
                <input
                  type='file'
                  accept='.json'
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImportPocketBase(file)
                  }}
                  disabled={isImporting}
                  className='text-muted-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium'
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Migration Section */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Database className='size-5' />
              Data Migration
            </CardTitle>
            <CardDescription>
              Migrate data between local storage and PocketBase
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button
              onClick={handleMigrateToCloud}
              disabled={isMigrating}
              className='w-full'
            >
              <Database className='mr-2 size-4' />
              Migrate Local → PocketBase (Cloud)
            </Button>

            <Button
              onClick={handleMigrateToLocal}
              disabled={isMigrating}
              className='w-full'
              variant='outline'
            >
              <HardDrive className='mr-2 size-4' />
              Migrate PocketBase → Local Storage
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Current Mode:</span>
            <span className='font-medium'>
              {isAuthenticated ? 'PocketBase (Cloud)' : 'Local Storage'}
            </span>
          </div>
          {isAuthenticated && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>User ID:</span>
              <span className='font-mono text-xs'>{userId}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
