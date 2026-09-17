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
// No description: the obvious one would name where the partner was saved TO,
// and there is nowhere to name. ⚠️ The rail's "Saved partners" item has been
// removed, so the save gesture now has no destination at all — the list lives
// on the store (`connect.saved`) and is read only by the bookmark icons
// themselves. The toast stays deliberately silent about it rather than
// promising a screen that doesn't exist; the fix is the screen, not the copy.
export const savedToast = (partner, saved, undo) => {
  const notify = saved ? toast.success : toast
  return notify(saved ? `${partner.name} saved` : `${partner.name} removed from saved`, {
    id: `saved-${partner.id}`,
    action: { label: 'Undo', onClick: undo },
  })
}

// An inquiry sent. The one thing the visitor cannot see for themselves after
// pressing Send inquiry, because the dialog closes and the screen behind it is
// the profile they were already reading — nothing on it changes.
//
// ⚠️ It carries the way into the conversation rather than navigating there.
// Sending and reading are two different intents now: someone comparing three
// firms sends the same requirements to all three, and being dropped into a
// thread after each one makes that three trips back to the listing. The action
// is for the person who does want to read it.
//
// `id` keyed by partner, like `savedToast` above: Contact repeats down a
// listing of thirteen rows, and without it a fast hand stacks a column of
// near-identical toasts that buries whatever was under it.
const inquirySentToast = (partner, open) =>
  toast.success(`Inquiry sent to ${partner.name}`, {
    id: `inquiry-${partner.id}`,
    description: 'Your project requirements are in the conversation.',
    action: { label: 'View', onClick: open },
  })

// The project the inquiry brought into existence, which is the half of this the
// visitor did not ask for and would otherwise find out about by stumbling on it
// in Implementation days later.
//
// ⚠️ No action on it, unlike the inquiry's. Two toasts in one gesture, each with
// its own button, is two decisions offered for something nobody has finished
// reading — and the second would compete with "View", which goes somewhere
// else. What this toast owes the reader is the NAME, because nobody typed it:
// `inquiryName` derived it, and the name is what they will look for later.
export const projectCreatedToast = (project) =>
  toast.success('Project created', {
    id: `project-${project.id}`,
    description: `${project.name} — now in Implementation.`,
  })

// ── Sending an inquiry ──────────────────────────────────────────────────────
// Both toasts, in the order they should be READ: the project first, because it
// is the thing that happened without being asked for, then the inquiry, which
// is the thing the button said it would do.
//
// ⚠️ SEQUENCED, not raised together, and that is this toaster's doing rather
// than a flourish. `ToastProvider` runs `expand: false` with `visible-toasts: 3`
// — and frappe-ui's own stylesheet fades every non-front toast to `opacity: 0`
// in the collapsed stack (see the comment on that rule). Two toasts published in
// the same tick are therefore ONE toast anybody can read: the newest, with the
// other invisible behind it until the stack is hovered. Whichever order they go
// out in, one of them is lost.
//
// So they take turns. The project toast holds the front for `GAP`, then the
// inquiry toast replaces it and carries the way into the conversation. Nothing
// is delayed that the reader is waiting on — the dialog has already closed and
// the screen behind it is the profile they were reading.
//
// ⚠️ `GAP` is long enough to read six words and short enough that the second
// toast is plainly part of the same event rather than a new one. Below about a
// second the first toast reads as a flicker; past two it reads as a separate
// notification arriving.
const GAP = 1400

export const inquirySentFeedback = ({ partner, project, created, open }) => {
  if (!created) return inquirySentToast(partner, open)
  projectCreatedToast(project)
  // Not cleared on unmount, deliberately: the component that raised this is
  // mounted at the app root and never unmounts, and a toast that has been
  // promised should still arrive if it somehow did.
  setTimeout(() => inquirySentToast(partner, open), GAP)
}
