// Shared motion for the edit page's tile grids (photos, client logos), used
// with <TransitionGroup>. Tiles slide to their new place in 200ms when the
// order changes; added and removed tiles fade in 150ms.
//
// A removed tile is taken out of the grid flow while it fades, pinned where
// it was, so the tiles after it slide into the gap at once instead of jumping
// when it finally goes. The grid needs `relative` for that.
export const tileMotion = {
  tag: 'ul',
  moveClass: 'transition-transform duration-200 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none',
  enterActiveClass: 'transition-opacity duration-150 ease-out motion-reduce:transition-none',
  enterFromClass: 'opacity-0',
  leaveActiveClass: 'transition-opacity duration-150 ease-out motion-reduce:transition-none',
  leaveToClass: 'opacity-0',
  onBeforeLeave(el) {
    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = el
    Object.assign(el.style, {
      position: 'absolute',
      left: `${offsetLeft}px`,
      top: `${offsetTop}px`,
      width: `${offsetWidth}px`,
      height: `${offsetHeight}px`,
    })
  },
}
