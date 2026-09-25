import { toast } from 'frappe-ui'

// Toast copy for the actions that appear on more than one screen.
//
// Kept in one file because Save sits in the listing row AND the profile header,
// and Contact sits in three places plus the quote modal. As inline strings at each call site they drift,
// and two buttons that do the same thing start saying different things about it.
// Anything single-use stays at its call site, next to the reasoning for it.
//
// A note on `id`: vue-sonner treats a repeated id as an UPDATE to the toast
// already on screen rather than a new one. Every helper here sets one, because
// all of them sit on controls that repeat — thirteen Contact buttons in a
// listing, and a bookmark that is a toggle — and without it a fast hand builds
// a column of near-identical toasts. The provider caps the stack at three
// visible, so that column also buries whatever it was stacked on top of.

// Save is a toggle, so one function covers both directions and the two states
// can't disagree about wording. The undo is the same toggle again, handed in by
// the caller because only it knows which partner it holds.
//
// Saved partners show on the home screen, and in full at
// `/connect/partners/saved`.
export const savedToast = (partner, saved, undo) => {
  const notify = saved ? toast.success : toast
  return notify(saved ? `${partner.name} saved` : `${partner.name} removed from saved`, {
    id: `saved-${partner.id}`,
    action: { label: 'Undo', onClick: undo },
  })
}

// Requirements sent to one partner. The one thing the visitor cannot see for
// themselves after pressing Send, because the dialog closes and the screen
// behind it is the profile they were already reading — nothing on it changes.
//
// ⚠️ It carries the way into the conversation rather than navigating there.
// Sending and reading are two different intents: someone comparing three firms
// sends the same requirements to all three, and being dropped into a thread
// after each one makes that three trips back to the listing.
//
// `id` keyed by partner, like `savedToast` above: Contact repeats down a
// listing of thirteen rows, and without it a fast hand stacks a column of
// near-identical toasts that buries whatever was under it.
//
// `project` only when sending is what made it: the visitor stays on the
// profile they were reading, so the toast is where they learn it exists.
export const requirementsSentToast = (partner, open, project = null) =>
  toast.success(`Requirements sent to ${partner.name}`, {
    id: `inquiry-${partner.id}`,
    ...(project ? { description: `${project.name} — now in Implementation.` } : {}),
    action: { label: 'View', onClick: open },
  })

