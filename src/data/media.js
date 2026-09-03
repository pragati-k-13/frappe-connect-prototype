// Profile media (the gallery) and client logos (the strip), resolved by
// convention the same way `logos.js` resolves partner logos.
//
// ⚠️ Everything here is a PLACEHOLDER, and deliberately abstract.
//
// The gallery art is generated gradients with a faint grid — including
// `placeholder-reel.mp4`, which is a real, playable 8-second H.264 clip rather
// than a fake player, so the video controls, poster and lightbox can all be
// reviewed for real. The clients are invented companies with abstract marks:
// the partners in this mock are real, but who their clients are isn't something
// the public directory publishes, and a real brand here would assert a
// commercial relationship nobody verified.
//
// Swap both sets for real assets from the Figma file. The generators that made
// them are committed under `scripts/` — see `scripts/README.md`.

const mediaFiles = import.meta.glob('../assets/media/*.{mp4,webm,jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const clientFiles = import.meta.glob('../assets/clients/*.svg', {
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
const CLIENT_LOGOS = byBasename(clientFiles)

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

// Media attached to REVIEWS, which is a different thing from the gallery above:
// the gallery is the partner showing their own work, this is customers showing
// theirs — a video testimonial and photos from a go-live. Same placeholder pool
// because there is only one, so it draws a different slice of it (the clip plus
// the last two stills) rather than repeating the gallery's exact three tiles.
//
// Three, matching the design's strip. A real build resolves these from the
// review records themselves; `reviewMediaFor(id)` is that seam.
// Covers for the success-story tiles. Only three placeholders exist, so a
// partner with nine stories cycles them — which still beats the design mock,
// where every tile is the same single photo.
export const storyCovers = () => PLACEHOLDER_GALLERY.filter((m) => m.kind === 'image' && m.src)

export const reviewMediaFor = () =>
  [PLACEHOLDER_GALLERY[0], PLACEHOLDER_GALLERY[2], PLACEHOLDER_GALLERY[3]]
    .filter((m) => m?.src)
    .map((m) => ({ ...m, id: `review-${m.id}` }))

// Invented clients, in a fixed order. Ten of them against five visible slots is
// what gives the strip somewhere to rotate to — see `ClientStrip.vue`.
export const CLIENTS = [
  'northwind',
  'kestrel',
  'aurelia',
  'vantage',
  'meridian',
  'bluecrest',
  'halcyon',
  'orenda',
  'silverpine',
  'tessellate',
]
  .map((slug) => ({
    slug,
    // Display name is derivable from the slug — no second list to keep in sync.
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    src: CLIENT_LOGOS[slug],
  }))
  .filter((c) => c.src)

export const clientsFor = () => CLIENTS
