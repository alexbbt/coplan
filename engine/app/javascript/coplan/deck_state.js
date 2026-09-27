// A body replacement disconnects deck readers. Carry each reader's slide
// across the replacement before Stimulus reconnects to the new regions.
export function captureDeckPositions(root) {
  return Array.from(root.querySelectorAll(".deck-region"), region => ({
    id: region.id,
    slide: Number(region.dataset.currentSlide || 1)
  }))
}

export function restoreDeckPositions(root, positions) {
  const byId = new Map(positions.filter(position => position.id).map(position => [position.id, position.slide]))
  root.querySelectorAll(".deck-region").forEach((region, index) => {
    const slides = Array.from(region.querySelectorAll(":scope > .deck > .deck-slide"))
    if (!slides.length) return
    const previous = byId.get(region.id) || positions[index]?.slide || 1
    const current = Math.max(1, Math.min(previous, slides.length))
    region.dataset.currentSlide = String(current)
    slides.forEach((slide, slideIndex) => slide.classList.toggle("deck-slide--current", slideIndex === current - 1))
  })
}
