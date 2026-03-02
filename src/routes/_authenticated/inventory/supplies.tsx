import { createFileRoute } from '@tanstack/react-router'
import InventoryManager from '@/features/inventory/components/inventory-manager'

export const Route = createFileRoute('/_authenticated/inventory/supplies')({
  component: InventoryManager,
})
