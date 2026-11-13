import { storiesFor } from './stories'

// Profile media (the gallery) and client logos (the strip), resolved by
// convention the same way `logos.js` resolves partner logos.
//
// ⚠️ The gallery is a PLACEHOLDER: generated gradients with a faint grid,
// including `placeholder-reel.mp4`, a real, playable 8-second H.264 clip, so
// the video controls, poster and lightbox can be reviewed for real. Swap it
// for real assets from the Figma file; the generator is under `scripts/`.
//
// The client logos are REAL: each partner's published success stories on
// frappe.io, the same customers and logo files as `data/stories.js`. A story
// Frappe published is a relationship already on the record, so the strip
// asserts nothing new.

const mediaFiles = import.meta.glob('../assets/media/*.{mp4,webm,jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byBasename = (files) =>
  Object.fromEntries(
    Object.entries(files).map(([path, url]) => [
      path
        .split('/')
        .pop()
        .replace(/\.[^.]+$/, ''),
      url,
    ]),
  )

const MEDIA = byBasename(mediaFiles)

// The gallery's shape is what's under review, so every partner gets the same
// four items: one clip and three stills. A real build resolves these per
// partner — `mediaFor(id)` is that seam.
//
// `kind` drives the render: 'video' gets a <video> with its poster, 'image' an
// <img>. `alt` describes the placeholder honestly rather than inventing a
// caption about a real company's office or team.
const PLACEHOLDER_GALLERY = [
  {
    id: 'reel',
    kind: 'video',
    src: MEDIA['placeholder-reel'],
    // A separate JPEG of the clip's first frame, so the still and the first
    // played frame agree. Named `-poster` rather than sharing the video's
    // basename: the glob keys by basename, and in a production build these
    // resolve to content-hashed URLs, so deriving one path from the other by
    // swapping the extension would break.
    poster: MEDIA['placeholder-reel-poster'],
    alt: 'Placeholder clip standing in for the partner’s intro video',
  },
  { id: 'still-1', kind: 'image', src: MEDIA['placeholder-1'], alt: 'Placeholder image 1' },
  { id: 'still-2', kind: 'image', src: MEDIA['placeholder-2'], alt: 'Placeholder image 2' },
  { id: 'still-3', kind: 'image', src: MEDIA['placeholder-3'], alt: 'Placeholder image 3' },
]

export const mediaFor = () => PLACEHOLDER_GALLERY.filter((m) => m.src)

// The partner's clients, from their success stories: one per customer, in the
// order the partner lists them, and only those with a logo. Partners don't
// upload logos; a client arrives with a published story. A partner can reorder
// them and hide one (`hidden`), which keeps the story but drops the logo from
// the strip. A partner with fewer than five shows a still row; one with none
// shows no strip.
export const clientsFor = (id) => {
  const seen = new Set()
  return storiesFor({ id })
    .filter((st) => st.client.src && !seen.has(st.client.name) && seen.add(st.client.name))
    .map((st) => ({ slug: st.client.name, name: st.client.name, src: st.client.src, href: st.href }))
}

// Fewer than this and there's no strip at all: two or three logos read as a
// thin client list, not a strong one.
export const MIN_LOGOS = 4

// What the strip shows: the partner's order, without hidden logos, or nothing
// below `MIN_LOGOS`.
export const shownLogos = (logos) => logos.filter((l) => l.src && !l.hidden)
export const visibleClients = (logos) => {
  const shown = shownLogos(logos)
  return shown.length >= MIN_LOGOS ? shown : []
}
