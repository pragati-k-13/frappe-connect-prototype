// `v-autogrow`: a frappe-ui Textarea that grows with its text instead of
// scrolling inside itself. frappe-ui's Textarea keeps a fixed `rows` height
// (its docs: "does not grow as the text gets longer"), and its own scrollbar is
// the browser's. Grown, the box never scrolls; whatever holds it does — in a
// dialog, frappe-ui's ScrollArea. `rows` stays the starting height.
//
// The directive sits on the component, so its element is frappe-ui's wrapper
// when there is a label; the <textarea> is found inside.
const fit = (root) => {
  const el = root.tagName === 'TEXTAREA' ? root : root.querySelector('textarea')
  if (!el) return
  el.style.resize = 'none'
  el.style.overflowY = 'hidden'
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
}

// Grown, the box has no scroll of its own, so the browser no longer brings the
// caret into view: typing at the end would run under whatever sits below. The
// nearest scroller (the dialog's ScrollArea) follows the field's bottom edge,
// including a hint line placed right under it.
const follow = (root) => {
  const el = root.tagName === 'TEXTAREA' ? root : root.querySelector('textarea')
  if (!el || el.selectionEnd < el.value.length) return
  const scroller = el.closest('[data-slot="scroll-area-viewport"]')
  if (!scroller) return
  const field = root.parentElement ?? el
  const below = field.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom
  if (below > 0) scroller.scrollTop += below
}

export const vAutogrow = {
  mounted(root) {
    root._autogrow = () => {
      fit(root)
      follow(root)
    }
    root.addEventListener('input', root._autogrow)
    fit(root)
  },
  // A value set from outside (the demo text, a draft) arrives without an input
  // event.
  updated(root) {
    fit(root)
  },
  unmounted(root) {
    root.removeEventListener('input', root._autogrow)
  },
}
