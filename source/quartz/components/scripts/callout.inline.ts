function toggleCallout(this: HTMLElement) {
  const outerBlock = this.parentElement!
  outerBlock.classList.toggle("is-collapsed")
  const collapsed = outerBlock.classList.contains("is-collapsed")
  const height = collapsed ? this.scrollHeight : outerBlock.scrollHeight
  outerBlock.style.maxHeight = height + "px"

  // walk and adjust height of all parents
  let current = outerBlock
  let parent = outerBlock.parentElement
  while (parent) {
    if (!parent.classList.contains("callout")) {
      return
    }

    const collapsed = parent.classList.contains("is-collapsed")
    const height = collapsed ? parent.scrollHeight : parent.scrollHeight + current.scrollHeight
    parent.style.maxHeight = height + "px"

    current = parent
    parent = parent.parentElement
  }
}

function recomputeCalloutHeight(div: HTMLElement) {
  if (div.classList.contains("is-collapsed")) {
    return
  }

  let current = div
  let parent: HTMLElement | null = div
  while (parent) {
    if (!parent.classList.contains("callout") || parent.classList.contains("is-collapsed")) {
      break
    }
    parent.style.maxHeight = parent.scrollHeight + "px"
    current = parent
    parent = parent.parentElement
  }
}

function setupCallout() {
  const collapsible = document.getElementsByClassName(
    `callout is-collapsible`,
  ) as HTMLCollectionOf<HTMLElement>
  for (const div of collapsible) {
    const title = div.firstElementChild

    if (title) {
      title.addEventListener("click", toggleCallout)
      window.addCleanup(() => title.removeEventListener("click", toggleCallout))

      const collapsed = div.classList.contains("is-collapsed")
      const height = collapsed ? title.scrollHeight : div.scrollHeight
      div.style.maxHeight = height + "px"
    }

    // images still loading at measurement time don't contribute their final
    // height to the scrollHeight above, so the callout gets clipped once
    // they load in; recompute max-height as each one finishes loading.
    for (const img of div.getElementsByTagName("img")) {
      if (img.complete) continue
      const handler = () => recomputeCalloutHeight(div)
      img.addEventListener("load", handler, { once: true })
      window.addCleanup(() => img.removeEventListener("load", handler))
    }
  }
}

document.addEventListener("nav", setupCallout)
window.addEventListener("resize", setupCallout)
