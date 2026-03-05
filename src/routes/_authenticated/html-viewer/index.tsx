import { createFileRoute } from '@tanstack/react-router'
import { HtmlViewer } from '@/features/html-viewer'

export const Route = createFileRoute('/_authenticated/html-viewer/')({
  component: HtmlViewer,
})
