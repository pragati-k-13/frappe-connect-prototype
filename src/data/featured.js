// "Featured by Frappe": what Frappe has made about a partner. Episodes of The
// Frappe Podcast (frappe.io/podcast) and the partner stories Frappe's team
// writes (frappe.io/blog, Partner Stories). All REAL, matched to the
// directory's partners by hand (Nov 2026); a partner with none shows no
// section.
//
// Lengths are YouTube's (the podcast is also on Spotify). Read times are the
// article's words at 230 a minute. A firm's content shows on each of its
// country profiles: it's about the firm, not one office.
//
// Left out on purpose: episode #7 (Middle East partners) and #11 and #26
// (Basawaraj Savalagi), whose guests don't map clearly to a firm in the
// directory, and #27, whose firm (Loop Services, Malta) isn't in it.

const STORY = 'https://frappe.io/blog/partner-success-stories/'

// Real thumbnails: each episode's YouTube thumbnail, each story's cover from
// frappe.io (its og:image), saved at 320px. Craft Interactive's story has no
// cover, so its row keeps the icon.
const thumbs = import.meta.glob('../assets/featured/*', { eager: true, query: '?url', import: 'default' })
const thumb = (name) => Object.entries(thumbs).find(([path]) => path.split('/').pop().startsWith(name + '.'))?.[1] ?? null

const FEATURED = {
  'software-work': [
    { kind: 'podcast', title: 'Business software in the real world', meta: 'Episode 13 · 50 min', href: 'https://youtu.be/QprErG5j_i0', thumb: thumb('podcast-QprErG5j_i0') },
    { kind: 'story', title: 'Enduring the test of time: CA Vikram Seth’s journey with Software @ Work', meta: '6 min read', href: `${STORY}enduring-the-test-of-time`, thumb: thumb('story-software-work') },
  ],
  navari: [
    { kind: 'podcast', title: 'Building Frappe’s future in Africa', meta: 'Episode 5 · 57 min', href: 'https://youtu.be/821LsUa8ZjU', thumb: thumb('podcast-821LsUa8ZjU') },
    { kind: 'story', title: 'Building Navari on grounded values and perseverance', meta: '6 min read', href: `${STORY}how-muchai-gateru-built-navari-on-grounded-roots-values`, thumb: thumb('story-navari') },
  ],
  alyf: [
    { kind: 'podcast', title: 'The developer mindset', meta: 'Episode 8 · 74 min', href: 'https://www.youtube.com/watch?v=V2kz2pF-IBI', thumb: thumb('podcast-V2kz2pF-IBI') },
    { kind: 'story', title: 'Frappe Partner ALYF’s journey with ERPNext in Germany', meta: '5 min read', href: `${STORY}alyfs-journey-with-erpnext-in-germany`, thumb: thumb('story-alyf') },
  ],
  wahni: [
    { kind: 'story', title: 'The only way to grow is to let go: Abdul Shajeer’s story with Wahni IT Solutions', meta: '6 min read', href: `${STORY}the-only-way-to-grow-is-to-let-go-abdul-shajeer%E2%80%99s-story-with-wahni-it-solutions`, thumb: thumb('story-wahni') },
  ],
  'new-indictrans': [
    { kind: 'story', title: 'Growing with the market: Indictrans’ expedition to Gold', meta: '6 min read', href: `${STORY}indictrans-expedition-to-gold`, thumb: thumb('story-indictrans-gold') },
    { kind: 'story', title: 'Indictrans converted from being a service provider to a partner', meta: '6 min read', href: `${STORY}indictrans-converted-from-being-a-service-provider-to-a-partner`, thumb: thumb('story-indictrans-partner') },
  ],
  'greycube-technologies': [
    { kind: 'story', title: 'GreyCube in partnership with Frappe for ERPNext and Frappe Cloud', meta: '6 min read', href: `${STORY}greycube-in-partnership-with-frappe-for-erpnext-and-frappe-cloud`, thumb: thumb('story-greycube') },
  ],
  'craft-interactive': [
    { kind: 'story', title: 'Seamless deployment of Frappe Cloud and ERPNext implementation by Craft Interactive', meta: '6 min read', href: `${STORY}seamless-deployment-of-frappe-cloud-and-erpnext-implementation-by-craft-interactive` },
  ],
}

// A firm's other offices share its content: the UAE office is still Wahni.
const FIRM = { 'wahni-it-solutions-fze': 'wahni' }

export const featuredFor = (id) => FEATURED[FIRM[id] ?? id] ?? []
