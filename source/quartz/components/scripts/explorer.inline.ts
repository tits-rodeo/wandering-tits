import { FolderState } from "../ExplorerNode"

type MaybeHTMLElement = HTMLElement | undefined
let currentExplorerState: FolderState[]
const observer = new IntersectionObserver((entries) => {
  // If last element is observed, remove gradient of "overflow" class so element is visible
  const explorerUl = document.getElementById("explorer-ul")
  if (!explorerUl) return
  for (const entry of entries) {
    if (entry.isIntersecting) {
      explorerUl.classList.add("no-background")
    } else {
      explorerUl.classList.remove("no-background")
    }
  }
})

function toggleExplorer(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as MaybeHTMLElement
  if (!content) return

  content.classList.toggle("collapsed")
}

function toggleFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as MaybeHTMLElement
  if (!target) return

  const isSvg = target.nodeName === "svg"
  const childFolderContainer = (
    isSvg
      ? target.parentElement?.nextSibling
      : target.parentElement?.parentElement?.nextElementSibling
  ) as MaybeHTMLElement
  const currentFolderParent = (
    isSvg ? target.nextElementSibling : target.parentElement
  ) as MaybeHTMLElement
  if (!(childFolderContainer && currentFolderParent)) return

  childFolderContainer.classList.toggle("open")
  const isCollapsed = childFolderContainer.classList.contains("open")
  setFolderState(childFolderContainer, !isCollapsed)
  const fullFolderPath = currentFolderParent.dataset.folderpath as string
  toggleCollapsedByPath(currentExplorerState, fullFolderPath)
  const stringifiedFileTree = JSON.stringify(currentExplorerState)
  localStorage.setItem("fileTree", stringifiedFileTree)
}

function setupExplorer() {
  const explorer = document.getElementById("explorer")
  if (!explorer) return

  if (explorer.dataset.behavior === "collapse") {
    for (const item of document.getElementsByClassName(
      "folder-button",
    ) as HTMLCollectionOf<HTMLElement>) {
      item.addEventListener("click", toggleFolder)
      window.addCleanup(() => item.removeEventListener("click", toggleFolder))
    }
  }

  explorer.addEventListener("click", toggleExplorer)
  window.addCleanup(() => explorer.removeEventListener("click", toggleExplorer))

  // Set up click handlers for each folder (click handler on folder "icon")
  for (const item of document.getElementsByClassName(
    "folder-icon",
  ) as HTMLCollectionOf<HTMLElement>) {
    item.addEventListener("click", toggleFolder)
    window.addCleanup(() => item.removeEventListener("click", toggleFolder))
  }

  // Get folder state from local storage
  const storageTree = localStorage.getItem("fileTree")
  const useSavedFolderState = explorer?.dataset.savestate === "true"
  const oldExplorerState: FolderState[] =
    storageTree && useSavedFolderState ? JSON.parse(storageTree) : []
  const oldIndex = new Map(oldExplorerState.map((entry) => [entry.path, entry.collapsed]))
  const newExplorerState: FolderState[] = explorer.dataset.tree
    ? JSON.parse(explorer.dataset.tree)
    : []
  currentExplorerState = []
  for (const { path, collapsed } of newExplorerState) {
    currentExplorerState.push({ path, collapsed: oldIndex.get(path) ?? collapsed })
  }

  // Look folders up by comparing dataset values directly rather than
  // interpolating the path into a CSS selector string, since folder/file
  // names can contain characters (e.g. apostrophes) that break the selector.
  const folderPathToLi = new Map<string, HTMLElement>()
  for (const el of document.querySelectorAll<HTMLElement>("[data-folderpath]")) {
    const path = el.dataset.folderpath
    if (path !== undefined) folderPathToLi.set(path, el)
  }

  currentExplorerState.map((folderState) => {
    const folderLi = folderPathToLi.get(folderState.path)
    const folderUl = folderLi?.parentElement?.nextElementSibling as MaybeHTMLElement
    if (folderUl) {
      setFolderState(folderUl, folderState.collapsed)
    }
  })

  // Regardless of saved/default state, always keep the folders leading to the
  // current page expanded so the active entry stays reachable in the tree.
  openFolderPathToActiveFile()
}

/**
 * Ensures every ancestor folder of the currently viewed page is expanded,
 * overriding whatever collapsed state it was left in previously.
 */
function openFolderPathToActiveFile() {
  const explorerUl = document.getElementById("explorer-ul")
  const currentSlug = document.body.dataset.slug
  if (!explorerUl || !currentSlug) return

  const activeLink = explorerUl.querySelector(
    `a[data-for="${CSS.escape(currentSlug)}"]`,
  ) as MaybeHTMLElement
  if (!activeLink) return

  let el: MaybeHTMLElement = activeLink.parentElement as MaybeHTMLElement
  while (el && el !== explorerUl) {
    if (el.classList.contains("folder-outer")) {
      el.classList.add("open")
      const folderUl = el.querySelector(":scope > ul[data-folderul]") as MaybeHTMLElement
      const folderPath = folderUl?.dataset.folderul
      const entry = currentExplorerState.find((s) => s.path === folderPath)
      if (entry) entry.collapsed = false
    }
    el = el.parentElement as MaybeHTMLElement
  }
}

window.addEventListener("resize", setupExplorer)
document.addEventListener("nav", () => {
  setupExplorer()
  observer.disconnect()

  // select pseudo element at end of list
  const lastItem = document.getElementById("explorer-end")
  if (lastItem) {
    observer.observe(lastItem)
  }
})

/**
 * Toggles the state of a given folder
 * @param folderElement <div class="folder-outer"> Element of folder (parent)
 * @param collapsed if folder should be set to collapsed or not
 */
function setFolderState(folderElement: HTMLElement, collapsed: boolean) {
  return collapsed ? folderElement.classList.remove("open") : folderElement.classList.add("open")
}

/**
 * Toggles visibility of a folder
 * @param array array of FolderState (`fileTree`, either get from local storage or data attribute)
 * @param path path to folder (e.g. 'advanced/more/more2')
 */
function toggleCollapsedByPath(array: FolderState[], path: string) {
  const entry = array.find((item) => item.path === path)
  if (entry) {
    entry.collapsed = !entry.collapsed
  }
}
