import { toast } from 'frappe-ui'

// Toast copy for the actions that appear on more than one screen.
//
// Kept in one file for the same reason the login prompt is one component: Save
// sits in the listing row AND the profile header, and Contact sits in three
// places plus the quote modal. As inline strings at each call site they drift,
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
// No description: the obvious one would name where the partner was saved TO,
// and the sidebar's "Saved partners" is still inert — a toast is the wrong
// place to promise a screen that isn't there.
export const savedToast = (partner, saved, undo) => {
  const notify = saved ? toast.success : toast
  return notify(saved ? `${partner.name} saved` : `${partner.name} removed from saved`, {
    id: `saved-${partner.id}`,
    action: { label: 'Undo', onClick: undo },
  })
}

// ⚠️ Every Contact in the app lands here. The in-app messages screen doesn't
// exist yet and is deliberately not stubbed — see the comment at each button —
// so this names the gap instead of letting the click vanish. A button that
// swallows a click reads as broken; one that says what it would have done reads
// as unfinished, which is the truth.
export const contactToast = (partner) =>
  toast.info('Messages are not built yet', {
    id: 'contact',
    description: `This is where the thread with ${partner.name} would open.`,
  })
