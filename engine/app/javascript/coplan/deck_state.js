// A body replacement disconnects deck readers. Carry each reader's slide
// across the replacement before Stimulus reconnects to the new regions.
export function captureDeckPositions(root) {
  return Array.from(root.querySelectorAll(".deck-region"), region => ({
    id: region.dataset.deckRegionId,
    slide: Number(region.dataset.currentSlide || 1),
    content: region.dataset.deckSourceDigest,
    headings: deckHeadings(region)
  }))
}

export function restoreDeckPositions(root, positions) {
  const regions = Array.from(root.querySelectorAll(".deck-region"))
  const matches = new Map()
  const used = new Set()
  const match = (regionIndex, positionIndex) => {
    if (positionIndex < 0) return
    matches.set(regionIndex, positions[positionIndex])
    used.add(positionIndex)
  }

  regions.forEach((region, index) => {
    if (region.dataset.deckRegionId) match(index, positions.findIndex((position, oldIndex) =>
      position.id === region.dataset.deckRegionId && !used.has(oldIndex)))
  })
  regions.forEach((region, index) => {
    if (region.dataset.deckRegionId || matches.has(index)) return
    match(index, positions.findIndex((position, oldIndex) =>
      !position.id && position.content === region.dataset.deckSourceDigest && !used.has(oldIndex)))
  })
  regions.forEach((region, index) => {
    if (region.dataset.deckRegionId || matches.has(index)) return
    const headings = deckHeadings(region)
    if (!headings) return
    const oldMatches = positions.map((position, oldIndex) =>
      !position.id && position.headings === headings && !used.has(oldIndex) ? oldIndex : -1).filter(oldIndex => oldIndex >= 0)
    const newMatches = regions.filter((candidate, newIndex) =>
      !candidate.dataset.deckRegionId && !matches.has(newIndex) && deckHeadings(candidate) === headings)
    if (oldMatches.length === 1 && newMatches.length === 1) match(index, oldMatches[0])
  })

  // A content edit changes the digest, and a heading edit can change the
  // fallback too. Carry the one remaining id-less reader across that edit.
  if (positions.length === regions.length) {
    const unmatchedOld = positions.map((position, index) => !used.has(index) ? index : -1).filter(index => index >= 0)
    const unmatchedNew = regions.map((region, index) => !matches.has(index) ? index : -1).filter(index => index >= 0)
    if (unmatchedOld.length === 1 && unmatchedNew.length === 1 &&
        !positions[unmatchedOld[0]].id && !regions[unmatchedNew[0]].dataset.deckRegionId) {
      match(unmatchedNew[0], unmatchedOld[0])
    }
  }

  regions.forEach((region, index) => {
    const slides = Array.from(region.querySelectorAll(":scope > .deck > .deck-slide"))
    if (!slides.length) return
    const previous = matches.get(index)?.slide || 1
    const current = Math.max(1, Math.min(previous, slides.length))
    region.dataset.currentSlide = String(current)
    slides.forEach((slide, slideIndex) => slide.classList.toggle("deck-slide--current", slideIndex === current - 1))
  })
}

function deckHeadings(region) {
  return Array.from(region.querySelectorAll(".deck-slide h1, .deck-slide h2, .deck-slide h3"), heading =>
    heading.textContent.replace(/\s+/g, " ").trim()).join("\0")
}
