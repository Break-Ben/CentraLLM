import { Fragment, useLayoutEffect, useMemo, useRef, useState, RefObject } from 'react'
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useNavigationStore } from '@/stores/navigation-store'
import { FolderRecord } from '@shared/folder'
import { getChatDisplayName } from '@/lib/chat'
import { CATEGORY_LABELS } from '@shared/preferences'

type Crumb = {
  key: string
  label: string
  onClick?: () => void
}

export function AppTitlebar(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const crumbs = useCrumbs()
  const { visible, hidden, mirrorRef } = useVisibleCrumbs(crumbs, containerRef)

  return (
    <header className="relative flex h-[40px] items-center overflow-hidden border-b bg-sidebar px-3 text-sm [app-region:drag]">
      <div ref={containerRef} className="flex flex-1 items-center overflow-hidden">
        <Breadcrumb className="min-w-0">
          <CrumbList crumbs={visible} hidden={hidden} />
        </Breadcrumb>
      </div>

      <div ref={mirrorRef} className="invisible absolute left-0 top-0 flex flex-col">
        <Breadcrumb>
          <CrumbList crumbs={crumbs} hidden={[]} />
        </Breadcrumb>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="h-full w-50 shrink-0" aria-hidden="true" />
    </header>
  )
}

function CrumbList({ crumbs, hidden }: { crumbs: Crumb[]; hidden: Crumb[] }): React.JSX.Element {
  return (
    <BreadcrumbList className="flex-nowrap py-2">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        const isEllipsis = crumb.key === 'ellipsis'

        return (
          <Fragment key={crumb.key}>
            <BreadcrumbItem className={isLast ? 'min-w-0' : 'shrink-0'}>
              {isEllipsis ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center [app-region:no-drag]" aria-label="Show hidden breadcrumbs">
                    <BreadcrumbEllipsis className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {hidden.map((item) => (
                      <DropdownMenuItem key={item.key} onClick={item.onClick}>
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isLast ? (
                <BreadcrumbPage className="[app-region:no-drag] block max-w-full truncate" title={crumb.label}>
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    crumb.onClick?.()
                  }}
                  className="[app-region:no-drag]"
                  title={crumb.label}
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        )
      })}
    </BreadcrumbList>
  )
}

function useFolderPath(folderId: number | null): FolderRecord[] {
  const folders = useFolderStore((state) => state.folders)
  const folderParentMap = useFolderStore((state) => state.folderParentMap)

  return useMemo(() => {
    const path: FolderRecord[] = []
    let currentId = folderId

    while (currentId !== null) {
      const folder = folders.find((item) => item.id === currentId)
      if (!folder) {
        break
      }

      path.unshift(folder)
      currentId = folderParentMap.get(currentId) ?? null
    }

    return path
  }, [folderId, folders, folderParentMap])
}

function useCrumbs(): Crumb[] {
  const page = useNavigationStore((state) => state.page)
  const setPage = useNavigationStore((state) => state.actions.setPage)
  const chats = useChatStore((state) => state.chats)
  const folderId = page.type === 'chat-list' || page.type === 'chat' ? page.folderId : null
  const folderPath = useFolderPath(folderId)

  return useMemo(() => {
    const root: Crumb = { key: 'root', label: 'CentraLLM', onClick: () => setPage({ type: 'home' }) }

    if (page.type === 'home') {
      return [root]
    }

    if (page.type === 'settings') {
      return [root, { key: 'settings', label: 'Settings', onClick: () => setPage({ type: 'settings', category: 'general' }) }, { key: 'settings-category', label: CATEGORY_LABELS[page.category] }]
    }

    const chatsCrumb: Crumb = { key: 'chats', label: 'Chats', onClick: () => setPage({ type: 'chat-list', folderId: null }) }
    const folderCrumbs: Crumb[] = folderPath.map((folder) => ({
      key: `folder-${folder.id}`,
      label: folder.name,
      onClick: () => setPage({ type: 'chat-list', folderId: folder.id })
    }))

    if (page.type === 'chat-list') {
      return [root, chatsCrumb, ...folderCrumbs]
    }

    const chat = chats.find((item) => item.id === page.chatId)
    return [root, chatsCrumb, ...folderCrumbs, { key: 'current', label: chat ? getChatDisplayName(chat) : 'New Chat' }]
  }, [page, folderPath, chats, setPage])
}

function useVisibleCrumbs(crumbs: Crumb[], containerRef: RefObject<HTMLDivElement | null>): { visible: Crumb[]; hidden: Crumb[]; mirrorRef: RefObject<HTMLDivElement | null> } {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<{ visible: Crumb[]; hidden: Crumb[] }>({ visible: crumbs, hidden: [] })

  useLayoutEffect(() => {
    const container = containerRef.current
    const mirror = mirrorRef.current
    if (!container || !mirror) {
      return
    }

    const compute = (): void => {
      const [fullList, ellipsisList] = mirror.querySelectorAll('ol')
      if (!fullList || !ellipsisList) {
        return
      }

      const children = Array.from(fullList.children)
      const itemEls = children.filter((_, i) => i % 2 === 0)
      const sepEls = children.filter((_, i) => i % 2 === 1)
      if (itemEls.length !== crumbs.length) {
        return
      }

      const sepWidth = sepEls[0]?.getBoundingClientRect().width ?? 0
      const gap = sepEls[0] ? sepEls[0].getBoundingClientRect().left - itemEls[0].getBoundingClientRect().right : 0
      const slotSpacing = 2 * gap + sepWidth

      const itemWidths = itemEls.map((el) => el.getBoundingClientRect().width)
      const ellipsisWidth = ellipsisList.children[0]?.getBoundingClientRect().width ?? 0
      const containerWidth = container.getBoundingClientRect().width

      const middleCount = crumbs.length - 2
      if (middleCount <= 0) {
        setResult({ visible: crumbs, hidden: [] })
        return
      }

      const rootWidth = itemWidths[0]
      const middleWidths = itemWidths.slice(1, 1 + middleCount)
      const lastWidth = itemWidths[itemWidths.length - 1]

      const widthWithHidden = (hiddenCount: number): number => {
        const visibleWidths = [rootWidth, ...(hiddenCount > 0 ? [ellipsisWidth] : []), ...middleWidths.slice(hiddenCount), lastWidth]
        return visibleWidths.reduce((sum, width) => sum + width, 0) + (visibleWidths.length - 1) * slotSpacing
      }

      let hiddenCount = 0
      while (hiddenCount < middleCount && widthWithHidden(hiddenCount) > containerWidth) {
        hiddenCount++
      }

      const middle = crumbs.slice(1, -1)
      const hidden = middle.slice(0, hiddenCount)
      const visibleMiddle = middle.slice(hiddenCount)
      const visible: Crumb[] = [crumbs[0], ...(hiddenCount > 0 ? [{ key: 'ellipsis', label: '' }] : []), ...visibleMiddle, crumbs[crumbs.length - 1]]

      setResult({ visible, hidden })
    }

    compute()

    const observer = new ResizeObserver(compute)
    observer.observe(container)
    return () => observer.disconnect()
  }, [crumbs, containerRef])

  return { ...result, mirrorRef }
}
