// Frappe's collateral library for partners: the folders of the "Central
// Collateral Repo" shared in Frappe Drive. Connect shows them itself — a folder
// page per folder and an in-app preview per file — rather than sending
// partners to Drive or embedding Drive's own UI.
//
// ⚠️ STAND-INS. The folder names and counts are the real ones; the FILES are
// not — swap them for the shared folder's contents. This file is the whole
// data layer for Resources, so it is also where Frappe Drive's API plugs in.
//
// ⚠️ `DRIVE_URL` is a stand-in too: Download points at it until each file has
// its own link.
export const DRIVE_URL = 'https://frappe.io/drive'

// What a file type looks like and previews as. `icon` is Frappe Suite's Drive
// file icon as a CSS class and `tint` its ink colour, both as Suite draws them
// (see src/assets/file-types/README.md). `pages` render one under another;
// `image` shows the image; anything else has no preview and offers Download.
export const FOLDER_ICON = 'file-icon-folder text-ink-gray-6'

export const FILE_TYPES = {
  pdf: { label: 'PDF', icon: 'file-icon-pdf', tint: 'text-ink-red-6', preview: 'pages' },
  slides: { label: 'Slides', icon: 'file-icon-slides', tint: 'text-ink-orange-6', preview: 'pages' },
  image: { label: 'PNG', icon: 'file-icon-image', tint: 'text-ink-violet-6', preview: 'image' },
  zip: { label: 'ZIP', icon: 'file-icon-archive', tint: 'text-ink-gray-6', preview: null },
}

export const COLLATERAL = [
  {
    slug: 'pitch-decks',
    name: 'Pitch decks',
    files: [
      { slug: 'erpnext-overview', name: 'ERPNext overview', type: 'slides', pages: 18 },
      { slug: 'erpnext-manufacturing', name: 'ERPNext for Manufacturing', type: 'slides', pages: 14 },
      { slug: 'frappe-hr', name: 'Frappe HR', type: 'slides', pages: 12 },
      { slug: 'frappe-cloud', name: 'Frappe Cloud', type: 'slides', pages: 10 },
    ],
  },
  {
    slug: 'product-collaterals',
    name: 'Product collaterals',
    files: [
      { slug: 'erpnext-brochure', name: 'ERPNext brochure', type: 'pdf', pages: 6 },
      { slug: 'frappe-hr-brochure', name: 'Frappe HR brochure', type: 'pdf', pages: 4 },
      { slug: 'frappe-crm-brochure', name: 'Frappe CRM brochure', type: 'pdf', pages: 4 },
      { slug: 'helpdesk-brochure', name: 'Helpdesk brochure', type: 'pdf', pages: 4 },
      { slug: 'insights-one-pager', name: 'Insights one-pager', type: 'pdf', pages: 1 },
      { slug: 'frappe-cloud-plans', name: 'Frappe Cloud plans', type: 'pdf', pages: 2 },
      { slug: 'erpnext-module-list', name: 'ERPNext module list', type: 'pdf', pages: 3 },
    ],
  },
  {
    slug: 'sales-enablement',
    name: 'Sales enablement',
    files: [
      { slug: 'discovery-call-checklist', name: 'Discovery call checklist', type: 'pdf', pages: 2 },
      { slug: 'objection-handling', name: 'Objection handling', type: 'pdf', pages: 5 },
    ],
  },
  {
    slug: 'process-documents',
    name: 'Process documents',
    files: [
      { slug: 'project-kickoff', name: 'Project kickoff template', type: 'pdf', pages: 3 },
      { slug: 'requirements-gathering', name: 'Requirements gathering template', type: 'pdf', pages: 6 },
    ],
  },
  {
    slug: 'design-resources',
    name: 'Design resources',
    files: [
      { slug: 'brand-guidelines', name: 'Brand guidelines', type: 'pdf', pages: 16 },
      { slug: 'partner-badge', name: 'Partner badge', type: 'image' },
      { slug: 'co-branded-template', name: 'Co-branded slide template', type: 'slides', pages: 8 },
      { slug: 'frappe-logos', name: 'Frappe logos', type: 'zip' },
    ],
  },
]

export const folderBySlug = (slug) => COLLATERAL.find((f) => f.slug === slug) ?? null

// "Slides · 18 pages", "PNG", "ZIP".
export const fileMeta = (file) => {
  const t = FILE_TYPES[file.type]
  if (!file.pages) return t.label
  return `${t.label} · ${file.pages} ${file.pages === 1 ? 'page' : 'pages'}`
}
