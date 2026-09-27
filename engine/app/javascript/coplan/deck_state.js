// A body replacement disconnects deck readers. Carry each reader's slide
// across the replacement before Stimulus reconnects to the new regions.
export function captureDeckPositions(root) {
  return Array.from(root.querySelectorAll(".deck-region"), region => ({
    id: region.id,
    slide: Number(region.dataset.currentSlide || 1),
    content: region.dataset.deckSourceDigest,
    headings: deckHeadings(region)
  }))
}

export function restoreDeckPositions(root, positions) {
  const regions = Array.from(root.querySelectorAll(".deck-region"))
  const used = new Set()
  regions.forEach(region => {
    const slides = Array.from(region.querySelectorAll(":scope > .deck > .deck-slide"))
    if (!slides.length) return
    let match = positions.find((position, index) => region.id && position.id === region.id && !used.has(index))
    if (!match && !region.id) {
      const content = region.dataset.deckSourceDigest
      match = positions.find((position, index) => !position.id && position.content === content && !used.has(index))
    }
    if (!match && !region.id) {
      const headings = deckHeadings(region)
      const candidates = positions.filter((position, index) => !position.id && headings && position.headings === headings && !used.has(index))
      const matchingNew = regions.filter(candidate => !candidate.id && deckHeadings(candidate) === headings)
      if (candidates.length === 1 && matchingNew.length === 1) match = candidates[0]
    }
    if (match) used.add(positions.indexOf(match))
    const previous = match?.slide || 1
    const current = Math.max(1, Math.min(previous, slides.length))
    region.dataset.currentSlide = String(current)
    slides.forEach((slide, slideIndex) => slide.classList.toggle("deck-slide--current", slideIndex === current - 1))
  })
}

function deckHeadings(region) {
  return Array.from(region.querySelectorAll(".deck-slide h1, .deck-slide h2, .deck-slide h3"), heading =>
    heading.textContent.replace(/\s+/g, " ").trim()).join("\0")
}
