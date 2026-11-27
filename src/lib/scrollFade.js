import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

// ⚠️ A FADE AT THE SCROLL EDGE, only while more is below. frappe-ui's
// scrollbar shows once you scroll, so on a short window a dialog's body was cut
// mid-line with nothing saying it went on. Pass the ScrollArea's template ref;
// bind `more` to the `fc-scroll-more` class (index.css). Measured on scroll and
// whenever the viewport or its content changes size; `remeasure` after the
// content is swapped for something else.
export function useScrollFade(scroller) {
  const more = ref(false)
  let vp = null
  let ro = null
  const measure = () => (more.value = !!vp && vp.scrollHeight - vp.scrollTop - vp.clientHeight > 1)
  const unwatch = () => {
    vp?.removeEventListener('scroll', measure)
    ro?.disconnect()
    vp = ro = null
  }
  watch(
    () => scroller.value?.$el,
    async (el) => {
      unwatch()
      await nextTick()
      vp = el?.querySelector?.('[data-slot="scroll-area-viewport"]') ?? null
      if (!vp) return (more.value = false)
      vp.addEventListener('scroll', measure, { passive: true })
      ro = new ResizeObserver(measure)
      ro.observe(vp)
      if (vp.firstElementChild) ro.observe(vp.firstElementChild)
      measure()
    },
    { flush: 'post' },
  )
  const remeasure = () =>
    nextTick(() => {
      if (vp?.firstElementChild) {
        ro?.disconnect()
        ro?.observe(vp)
        ro?.observe(vp.firstElementChild)
      }
      measure()
    })
  onBeforeUnmount(unwatch)
  return { more, remeasure }
}
