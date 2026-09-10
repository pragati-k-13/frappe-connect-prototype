// Seed partners for the mock. Shapes here are the contract the results list
// renders against — a real implementation would fill these from the Partner
// doctype.
//
// Names, countries and logos are REAL, lifted from
// `frappe.io/partners/list?country=…`. The app list and the industry segments
// are the directory's own vocabularies (`window.page_data` on the same page).
//
// Which partner does which industry or app is INVENTED, as are rates, ratings,
// review counts, response times, story counts and packs — the public directory
// doesn't publish any of it. Don't quote these numbers.
//
// So are the street addresses and the founding stories, and those are a
// different kind of invention: not a number nobody can check, but a statement
// about where a real company sits and how it started. Both carry their own ⚠️
// below. They exist so the About card and the closing section have real-shaped
// content to lay out, and they are the first thing to replace.
//
// `initials` and `color` are the fallback avatar for a partner with no logo
// file. Every partner here has one, so they're currently unused — see
// `data/logos.js`.

// The directory's real app list. No counts: the directory doesn't publish them
// and inventing them next to real app names would read as fact.
export const APPS = [
  { value: 'erpnext', label: 'ERPNext' },
  { value: 'frappe-hr', label: 'Frappe HR' },
  { value: 'crm', label: 'CRM' },
  { value: 'helpdesk', label: 'Helpdesk' },
  { value: 'insights', label: 'Insights' },
  { value: 'drive', label: 'Drive' },
  { value: 'learning', label: 'Learning' },
  { value: 'education', label: 'Education' },
  { value: 'school', label: 'School' },
  { value: 'lending', label: 'Lending' },
  { value: 'framework', label: 'Framework' },
]

// The Starter Pack catalogue moved to `data/packs.js` when the real scope
// document landed — it now carries the module-by-module scope, the terms, and
// per-region pricing, which is far more than a partner file should hold.
//
// ⚠️ The prices in here used to be `hours × $70`, converted from rupees on the
// grounds that ₹2,000/hr was implausible next to partner rates of $60–140/hr.
// The scope document says ₹2,000/hr is the real India rate — so the implausible
// number was the invented PARTNER rate, not the pack price. India's prices are
// now the real ones; see `REGION_PRICING`.

// `tier` is 'gold' | 'silver' | 'bronze' — the three levels of the partner
// programme, drawn from Frappe's own partner badge set. Gold renders as a
// labelled badge, the other two as the seal alone. See `components/TierIcon.vue`.
//
// `industries` holds real segment names from `quiz.js`; the results filter maps
// them up to their group via GROUP_OF_SEGMENT rather than string-matching.
//
// `id` is also the logo filename — drop `<id>.<ext>` into `assets/partners/`.
//
// `tagline` is the one-line positioning statement under the name on the profile
// page. Tridots Tech's is the real line from the design file; the rest are
// written here as neutral placeholders — no founding dates, no superlatives, no
// claims that could read as fact about a real company. Optional: the profile
// header falls back to a factual line built from `city` and `stories`.
// The id every partner is keyed by, derived from the name rather than stored.
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// Partner Maturity Model level, shown in the profile's About column. Invented,
// and derived from tier rather than stored per partner so the two can't
// contradict each other — a bronze partner at PMM 5 would just look like a bug.
const PMM_BY_TIER = { gold: 5, silver: 3, bronze: 2 }

// The "Partner vision" section: a leadership quote, then the same three
// questions every partner in the directory answers, with their answers and
// working-style tags.
//
// ⚠️⚠️ EVERY WORD BELOW IS INVENTED, and it is by far the most fabricated data
// in this mock — a mission statement put in the mouth of a real, named company.
// Nobody at these firms said any of it. It exists so the section's shape can be
// reviewed: quote length, how the two-line headings wrap, how many tags fit on
// a row. Replace wholesale with the partners' own words before this is shown to
// anyone outside the team.
//
// ⚠️ The `author` names are invented too, and they are the one field here that
// could be mistaken for fact: they read as a statement about who runs a real
// company. Only Tridots Tech's is real, and only because it came out of the
// design file. Each of the others is a plausible-for-the-region placeholder
// and none of them is a person — if any happens to collide with a real name at
// that firm, that is coincidence, not research. `visionFor()` still falls back
// to attributing the quote to the company if an entry has no author at all.
//
// A tag is a string, or `{ label, hint }` when it needs the info icon.
const VISION = {
  'tridots-tech': {
    author: { name: 'Rajarajan Anbalagan', role: 'CEO & Founder' },
    quote:
      'I believe technology should serve business goals, not complicate them. My leadership philosophy combines clear strategy with disciplined execution, ensuring every initiative delivers measurable value.',
    why: 'We aim for excellence in every line of code, every UI interaction, and every customer conversation. We focus on implementations for mid-sized manufacturing and distribution businesses. Our core strength is migrating companies off spreadsheets and legacy systems onto modern software, with deep experience in inventory, operations, and multi-location workflows. We also handle custom app development and third-party integrations (accounting, e-commerce, logistics) for teams with deeper needs.',
    together: {
      text: 'Transparency, honesty, and trust form the core of our work ethic. We believe in doing the right thing even when no one is watching. We have dedicated teams working with you to ensure quality, focus, and accountability.',
      tags: [
        'Team syncs',
        'Remote team syncs',
        // ⚠️ Hint copy is a guess. "Offline" reads as in-person here, but the
        // design shows the icon without its tooltip.
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Async updates',
      ],
    },
    success: {
      text: 'Good is never enough. With 15+ years of experience, we understand that implementation doesn’t end at handoff, but is built via on-ground involvement through strategy, setup, and execution, with visible results in 6–8 months. We train your team so improvements stay in place long after we’ve left.',
      tags: ['Maintenance packages', 'Knowledge transfer'],
    },
  },

  'software-work': {
    author: { name: 'Anuja Deshmukh', role: 'Managing Director' },
    quote:
      'An ERP is a set of decisions about how a business runs, not a piece of software you install. We would rather spend a week arguing about a workflow than a year unpicking the wrong one.',
    why: 'We work with discrete manufacturers and trading businesses in and around Mumbai, usually at the point where a spreadsheet-and-Tally setup has stopped scaling. Payroll and people processes are where we go deepest — Frappe HR alongside ERPNext, one system rather than two that disagree.',
    together: {
      text: 'One project lead, named on day one, who stays with you to go-live. Weekly demos on your own data rather than a slide deck, so what you sign off on is what you will actually use.',
      tags: ['Dedicated project lead', 'Weekly demos', 'Shared backlog', 'Async updates'],
    },
    success: {
      text: 'Month-end closing without a spreadsheet in sight. We consider a rollout finished when your finance team stops asking us for help, not when the last ticket is closed.',
      tags: ['Admin training', 'Post-go-live support'],
    },
  },

  'new-indictrans': {
    author: { name: 'Shreyas Kulkarni', role: 'Director' },
    quote:
      'Public institutions and schools do not need the fastest software. They need software that still works in five years, with staff who can run it themselves.',
    why: 'Process manufacturing, education and government, largely in Maharashtra. Regulated environments and public procurement are slow and specific, and we have learnt to work inside them rather than around them.',
    together: {
      text: 'We plan around your academic or audit calendar, not ours. Documentation is written as we go, in the language your staff actually use.',
      tags: ['Team syncs', 'Documentation handover', 'Phased rollout'],
    },
    success: {
      text: 'Your own team running the system without us. We build in Frappe Learning courses for staff turnover, because in an institution the person we trained will eventually move on.',
      tags: ['Knowledge transfer', 'Admin training'],
    },
  },

  '8848-digital': {
    author: { name: 'Nikhil Ranade', role: 'Co-founder' },
    quote:
      'Manufacturing runs on the shop floor, not in a boardroom. If the operator will not use it, it does not matter how good the report looks.',
    why: 'Automotive and pharmaceutical manufacturing, where traceability is not optional. We spend the first fortnight of any project on the floor, watching how work actually moves before we configure anything.',
    together: {
      text: 'Short cycles with something working at the end of each one. Insights dashboards go up early, so you can see your own numbers while decisions are still open.',
      tags: ['Weekly demos', 'Shared backlog', 'Team syncs'],
    },
    success: {
      text: 'A plant manager who checks the system before walking the floor. Quality and batch traceability have to survive an audit, so we test them against your last one.',
      tags: ['Maintenance packages', 'Admin training', 'Knowledge transfer'],
    },
  },

  'greycube-technologies': {
    author: { name: 'Sanya Fernandes', role: 'Founder' },
    quote:
      'Small teams do not need the whole of ERPNext. They need the eight screens they will use every day, set up properly.',
    why: 'Trading, retail and e-commerce businesses, usually under fifty people. We are a small studio and we take on work at that size deliberately — it is where a careful setup makes the most difference.',
    together: {
      text: 'Direct access to the people doing the work, no account manager in between. Most questions are answered the same day.',
      tags: ['Single point of contact', 'Async updates'],
    },
    success: {
      text: 'Orders, stock and invoices in one place, and nobody reconciling marketplaces by hand at the weekend.',
      tags: ['Post-go-live support'],
    },
  },

  wahni: {
    author: { name: 'Vivek Menon', role: 'Chief Executive' },
    quote:
      'We would rather turn down a project than staff it badly. Everything we have built has come from work we were able to see through properly.',
    why: 'Food and beverage, retail, healthcare and education across Kerala and the Gulf. Multi-outlet businesses are our centre of gravity — kitchens, clinics and campuses that need one system across several sites.',
    together: {
      text: 'A named team per project, and a helpdesk your staff can reach directly rather than through us. Site visits during the first month.',
      tags: [
        'Team syncs',
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Remote team syncs',
        'Async updates',
      ],
    },
    success: {
      text: 'Every outlet closing its day the same way. We keep a support retainer open afterwards because multi-site businesses keep opening sites.',
      tags: ['Maintenance packages', 'Admin training'],
    },
  },

  hybrowlabs: {
    author: { name: 'Aditya Kale', role: 'Founder & CTO' },
    quote:
      'Most of what a growing company needs already exists in the Frappe framework. Our job is usually to build less, not more.',
    why: 'Software companies, e-commerce and professional services. We are framework-first: custom apps, integrations and portals on top of Frappe, for teams whose processes do not fit a standard ERP.',
    together: {
      text: 'Everything in a shared backlog you can read at any time. Async by default, because our clients are rarely in one timezone.',
      tags: ['Async updates', 'Shared backlog', 'Remote team syncs'],
    },
    success: {
      text: 'Code you could hand to another team without apology. We hand over the repository, the tests and the deployment, not just a login.',
      tags: ['Documentation handover', 'Knowledge transfer'],
    },
  },

  'finbyz-tech': {
    author: { name: 'Chirag Mehta', role: 'Managing Partner' },
    quote:
      'Finance teams are the ones who live with an ERP after everyone else has moved on. We design for them first.',
    why: 'Chemical manufacturing, trading, logistics and finance, out of Ahmedabad. Costing, import-export documentation and multi-currency are the parts other implementations tend to leave half-finished.',
    together: {
      text: 'Fortnightly reviews with your finance lead in the room. Insights reports are built alongside the rollout, not after it.',
      tags: ['Team syncs', 'Weekly demos', 'Async updates'],
    },
    success: {
      text: 'A closing you trust without a parallel spreadsheet. If the numbers are still being checked by hand, the project is not done.',
      tags: ['Maintenance packages', 'Admin training'],
    },
  },

  alyf: {
    author: { name: 'Jonas Weber', role: 'Managing Director' },
    quote:
      'German mid-sized companies are asked to choose between software that does not fit and software they cannot afford. Open source is the third option.',
    why: 'Discrete manufacturing, real estate and rental businesses in the DACH region. We know what German accounting, DATEV exports and works-council processes require, and we build for GDPR from the start rather than retrofitting it.',
    together: {
      text: 'Documentation and training in German; project management in English if your team prefers. Fixed-scope phases with a price per phase.',
      tags: ['Phased rollout', 'Team syncs', 'Documentation handover'],
    },
    success: {
      text: 'A system your Steuerberater signs off without comment, and a team that does not need us for day-to-day changes.',
      tags: ['Knowledge transfer', 'Post-go-live support'],
    },
  },

  'craft-interactive': {
    author: { name: 'Rania Haddad', role: 'Managing Director' },
    quote:
      'A business in the Gulf is rarely in one country. We plan for the second and third entity before you have opened them.',
    why: 'Trading, retail, construction and hospitality across the UAE and Saudi Arabia. VAT, e-invoicing and multi-entity consolidation are routine for us, and we work in Arabic and English throughout.',
    together: {
      text: 'A local team you can meet, and an on-site presence during go-live week. Weekly written updates so decisions are on the record.',
      tags: [
        'Team syncs',
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Weekly demos',
        'Async updates',
      ],
    },
    success: {
      text: 'Filing compliantly in every jurisdiction you operate in, from one system. We stay on retainer through your first full year of returns.',
      tags: ['Maintenance packages', 'Post-go-live support', 'Knowledge transfer'],
    },
  },

  'kingstech-services': {
    author: { name: 'Tan Wei Lin', role: 'Director' },
    quote:
      'A rollout across four countries is not four rollouts. Do it once, properly, and let each market configure what it genuinely needs.',
    why: 'Trading, e-commerce, logistics and professional services across Singapore and South-East Asia. Regional groups running one ERP over several jurisdictions are the work we take on most.',
    together: {
      text: 'One project lead in Singapore, delivery across timezones. Written decisions rather than meetings wherever a meeting is not required.',
      tags: ['Single point of contact', 'Async updates', 'Remote team syncs'],
    },
    success: {
      text: 'One chart of accounts, several tax regimes, and a group consolidation that does not need a spreadsheet.',
      tags: ['Documentation handover', 'Post-go-live support'],
    },
  },

  navari: {
    author: { name: 'Achieng Otieno', role: 'Managing Director' },
    quote:
      'Software built elsewhere assumes reliable power and reliable connectivity. We build for the conditions our clients actually work in.',
    why: 'Agriculture, trading, logistics and nonprofits across East Africa. Mobile money, offline-tolerant workflows and donor reporting are the parts that have to work before anything else does.',
    together: {
      text: 'Field visits, not just calls — a lot of what we implement is used by people away from a desk. Training in Swahili and English.',
      tags: [
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Team syncs',
        'Async updates',
      ],
    },
    success: {
      text: 'A cooperative or a programme office reporting on its own numbers, on time, without our help.',
      tags: ['Admin training', 'Knowledge transfer'],
    },
  },

  korecent: {
    author: { name: 'Marcus Reed', role: 'President' },
    quote:
      'In regulated manufacturing, an ERP is part of your quality system. We treat it that way from the first workshop.',
    why: 'Medical device manufacturing, healthcare and professional services in North America. Validation, traceability and audit trails are the reason clients come to us rather than the cheapest option.',
    together: {
      text: 'Structured phases with documented sign-off at each one, because that documentation is what an auditor will ask for.',
      tags: ['Phased rollout', 'Team syncs', 'Documentation handover'],
    },
    success: {
      text: 'Passing an audit on the system rather than in spite of it, and a quality team that can produce a trace in minutes.',
      tags: ['Maintenance packages', 'Knowledge transfer', 'Post-go-live support'],
    },
  },
}

// No invented people: a partner with no real named author has the quote
// attributed to the company itself. See the warning above.
const visionFor = (name) => {
  const v = VISION[slug(name)]
  if (!v) return null
  return { ...v, author: v.author ?? { name, role: 'Leadership team' } }
}

// The closing section of the profile: how the firm started.
//
// ⚠️⚠️ EVERY WORD BELOW IS INVENTED, on the same footing as `VISION` above and
// with the same instruction attached: nobody at these firms said any of it, no
// such founding happened on that date, and it must be replaced with the
// partners' own account before this is shown to anyone outside the team.
//
// Two things keep it as harmless as invented copy about a real company can be.
// The stories name NO PEOPLE — every one is "two engineers", "the founders",
// "a team that had been doing X" — so nothing here attributes a biography to a
// real person, which is the line `VISION.author` had to stop at too. And the
// `year` is the one figure a reader could take as fact, so it is kept
// deliberately vague in the prose ("the mid-2000s", "a decade in") and stated
// once, plainly, as a date the page labels rather than a claim the copy makes.
//
// ⚠️ Two `tagline`s already carry a founding year — Tridots Tech's "Since 2006"
// (real, from the design file) and Software@Work's "since 2011" (invented). The
// years here MATCH them. A profile that said 2006 in the header and 2009 at the
// foot would be the mock contradicting itself in the one place a reader is
// most likely to check.
//
// `story` is an array of paragraphs rather than one string: the section sets
// them at a reading measure and the break between them is the beat between
// "how it started" and "where it got to". Two is the shape; a third would turn
// the section into the essay the Partner vision section already is.
const FOUNDING = {
  'tridots-tech': {
    year: 2006,
    story: [
      'Tridots Tech started in Chennai in the mid-2000s, out of a run of consulting jobs that kept ending the same way: a manufacturer with good people, a warehouse full of stock nobody could account for, and a spreadsheet that three departments each kept their own copy of. The founders had spent years writing bespoke software for that problem one company at a time, and had come round to the view that the software was rarely the hard part.',
      'The firm has stayed close to that first kind of customer — mid-sized manufacturing and distribution businesses, mostly in Tamil Nadu, increasingly beyond it. What has changed is how much of the work happens before anyone opens an editor. The teams here spend their first weeks on the floor and in the finance office, and treat a rollout as finished when the client stops needing them, not when the last ticket closes.',
    ],
  },

  'software-work': {
    year: 2011,
    story: [
      'Software@Work was founded in Mumbai in 2011 by a group who had been running payroll and plant operations from inside other people’s companies rather than selling to them. They had watched several ERP projects arrive, consume a year, and leave the business running two systems that disagreed about the same headcount.',
      'That experience set the firm’s habit of arguing about a workflow for a week before configuring anything for it. The practice grew from payroll outward — Frappe HR alongside ERPNext, one system rather than two — and the client list is still mostly discrete manufacturers and traders around Mumbai who reached the point where Tally and a shared drive stopped scaling.',
    ],
  },

  'new-indictrans': {
    year: 2004,
    story: [
      'New Indictrans began in Pune in the early 2000s as a language-technology group, building tools that let public institutions work in Marathi and Hindi rather than only in English. Open source was not a positioning decision — it was the only way to ship software to a government department that had to be able to maintain it after the contract ended.',
      'The ERP practice grew out of that constraint rather than away from it. Schools, cooperatives and state bodies came asking for systems that would still run in five years, staffed by people who had not been hired yet. The firm still plans around academic and audit calendars, still writes documentation in the language the staff actually use, and still measures itself on whether the client needs them next year.',
    ],
  },

  '8848-digital': {
    year: 2016,
    story: [
      '8848 Digital was started in Pune by engineers who had spent their careers inside automotive and pharmaceutical plants, on the manufacturing side rather than the software side. The founding argument was simple and slightly contrarian: most plant software is designed for the people reading the reports, not the people entering the data, and the operator decides whether any of it works.',
      'So the firm built a practice around going to the floor first. A project starts with a fortnight of watching how material and paperwork actually move, before a single doctype is configured. Traceability work — batch, quality, audit — became the specialism because it is the part that has to survive somebody else’s inspection, and the part clients had most often been sold and not given.',
    ],
  },

  'greycube-technologies': {
    year: 2018,
    story: [
      'Greycube Technologies is a small studio in Mumbai, and it was founded as one on purpose. It started when two implementers left larger firms after one too many projects where a fifteen-person trading business was sold the same programme as a fifteen-hundred-person one, and spent the next year not using most of it.',
      'The studio has stayed deliberately small, which is the whole product: the people you talk to are the people doing the work, and most questions are answered the same day. The work is retail, trading and e-commerce, usually under fifty staff, and the goal is eight screens set up properly rather than a system nobody has the time to grow into.',
    ],
  },

  wahni: {
    year: 2013,
    story: [
      'Wahni started in Kochi with a single restaurant group that had four kitchens and four different ways of closing the day. The founders took the job on the condition that they could fix all four rather than automate the mess, and the multi-outlet problem has been the firm’s centre of gravity ever since.',
      'Growth followed the same shape of customer into retail, healthcare and education, and out of Kerala into the Gulf as clients opened there. The firm has turned down more work than it has taken, on the principle that a project it cannot staff properly costs more than the revenue is worth — and every reference it has comes from work it saw through.',
    ],
  },

  hybrowlabs: {
    year: 2019,
    story: [
      'Hybrowlabs began in Pune as a two-person consultancy taking on custom app work that other shops were quoting as ground-up builds. The founding observation was that most of what a growing company asks for already exists in the Frappe framework, and that the job is usually to build less rather than more.',
      'The team stayed framework-first as it grew: custom apps, integrations and portals for software companies, e-commerce and professional-services firms whose processes never did fit a standard ERP. Working across timezones from the start made async the default, which is why everything runs off a shared backlog a client can read at any hour without asking.',
    ],
  },

  'finbyz-tech': {
    year: 2015,
    story: [
      'Finbyz Tech was founded in Ahmedabad by people who came out of finance rather than software — costing, import-export documentation, the month-end close. They kept meeting ERP implementations that had done the sales and inventory modules well and left the parts a finance team lives in half-finished.',
      'The firm was built to finish those parts. Chemical manufacturers, traders and logistics businesses came for multi-currency and landed-cost work that other implementations had skipped, and stayed for a close they could trust without a parallel spreadsheet. The finance lead is still in the room fortnightly on every project, which is not a courtesy — it is who the system is designed for.',
    ],
  },

  alyf: {
    year: 2020,
    story: [
      'ALYF was founded in Munich on a question German mid-sized companies keep being asked and keep answering badly: pay for software that does not fit, or make do with software you have outgrown. The founders had implemented both of the usual answers and thought open source was a third one that nobody in the Mittelstand was being offered.',
      'That meant doing the unglamorous work up front — DATEV exports, works-council processes, GDPR designed in rather than retrofitted — before the firm could credibly sell to a manufacturer or a property business here. Documentation and training are in German, project management in English if the client prefers, and phases are priced one at a time so nobody signs a year they cannot see the end of.',
    ],
  },

  'craft-interactive': {
    year: 2012,
    story: [
      'Craft Interactive started in Dubai in 2012, at the point where several of its founders’ clients were opening a second entity in a second country and discovering their books had not been built for it. The firm was set up around that moment rather than around a technology: a business in the Gulf is rarely in one jurisdiction for long.',
      'VAT arrived, then e-invoicing, then Saudi expansion for half the client list, and each one was absorbed as routine rather than as a project. The team works in Arabic and English throughout, is physically present through go-live week, and tends to stay on retainer through a client’s first full year of returns — which is the year the design of the thing gets tested.',
    ],
  },

  'kingstech-services': {
    year: 2017,
    story: [
      'Kingstech Services was founded in Singapore by consultants who had just finished what was nominally one regional rollout and had in practice been four unrelated ones, run by four teams, in four countries, arriving at four charts of accounts. The firm exists to not do that again.',
      'Its work is regional groups — trading, e-commerce, logistics, professional services — running a single ERP across several jurisdictions. One project lead sits in Singapore and delivery happens across timezones, with decisions written down rather than held in meetings, because a group rollout is mostly an argument about which differences between markets are real.',
    ],
  },

  navari: {
    year: 2014,
    story: [
      'Navari was founded in Nairobi by developers who were tired of deploying software that assumed reliable power, reliable connectivity and a desk. The systems worked in the demo and failed in the field, and the gap between those two was not a bug list — it was an assumption the software had been built on somewhere else.',
      'So the firm builds for the conditions its clients actually work in: mobile money, offline-tolerant workflows, donor reporting that has to reconcile. The work is agriculture, trading, logistics and nonprofits across East Africa, training happens in Swahili and English, and a lot of it is delivered on site because most of the people using it are nowhere near an office.',
    ],
  },

  korecent: {
    year: 2009,
    story: [
      'Korecent started in Chicago serving medical device manufacturers, which shaped everything about how the firm works. In a regulated plant the ERP is not a business tool sitting next to the quality system — it is part of the quality system, and an auditor will eventually ask it to prove something.',
      'The practice was built backwards from that audit. Phases are structured with documented sign-off at each one because the documentation is itself a deliverable, and validation and traceability are the reason clients choose the firm over a cheaper quote. It has since taken the same approach into healthcare and professional services across North America.',
    ],
  },
}

// A partner with no entry simply has no closing section — the profile ends on
// the marketplace row, the same way it already ends early for the five partners
// with nothing published there. Better a missing section than a stub.
const foundingFor = (name) => FOUNDING[slug(name)] ?? null

// Certified members, per certification. Frappe's programme certifies people on
// ERPNext and on the Framework, so a partner's entry is "how many of our team
// hold each" — two ERPNext certifications and one Framework, in the design's
// own example.
//
// ⚠️ The counts are invented, like `rate` and `rating`. Kept as an explicit
// per-partner table rather than derived from tier: the whole point of the row
// is that it varies partner to partner, and a formula would make every gold
// partner identical. Replace wholesale when the directory publishes them; a
// missing certification is simply left out rather than shown as zero.
const CERTIFIED_MEMBERS = {
  'tridots-tech': { erpnext: 2, framework: 1 },
  'software-work': { erpnext: 4, framework: 2 },
  'new-indictrans': { erpnext: 3, framework: 2 },
  '8848-digital': { erpnext: 5, framework: 1 },
  'greycube-technologies': { erpnext: 2, framework: 3 },
  wahni: { erpnext: 3, framework: 1 },
  hybrowlabs: { erpnext: 2, framework: 2 },
  'finbyz-tech': { erpnext: 4, framework: 1 },
  alyf: { erpnext: 2 },
  'craft-interactive': { erpnext: 3 },
  'kingstech-services': { erpnext: 1, framework: 1 },
  navari: { erpnext: 2 },
  korecent: { erpnext: 1 },
}

// The country of a scraped city — its last comma field. 'Singapore' has no
// comma and is its own country, which is why this splits rather than indexes.
const countryOf = (city) => city.split(',').pop().trim()

// Which pool a partner's PLACEHOLDER content is drawn from: reviewer names and
// company suffixes (`data/reviews.js`), localisation apps (`data/marketplace.js`)
// and the migrations below.
//
// It is the region, except in India, which is a country inside Asia and not a
// region of its own — see the note above `REGIONS` in `data/quiz.js`. That
// distinction is real for this content and only for this content: a Chennai
// partner and a Singapore one share a region and share none of a legacy stack,
// a compliance app or a naming convention. `region` stays what the filter and
// the map ask about; `market` is what the invented content varies at.
const marketOf = (city, region) => (countryOf(city) === 'India' ? 'india' : region)

// ⚠️ Invented, and uniform by market. Real migration paths, but not sourced
// from any partner's own listing — Tally and SAP are simply the two ERPNext
// migrations that actually come up in India, QuickBooks the common one outside
// it. Replace per partner when the directory publishes them.
const MIGRATIONS_BY_MARKET = {
  india: ['Tally to ERPNext', 'SAP to ERPNext'],
}
const DEFAULT_MIGRATIONS = ['QuickBooks to ERPNext', 'SAP to ERPNext']

const P = (
  name,
  {
    tier,
    city,
    region,
    initials,
    color,
    // ⚠️ Invented, like `rating`. Dollars per hour, and **nullable** — `null`
    // is "undisclosed", a partner who quotes on the brief rather than
    // publishing a number, which is a real thing firms of this size do. Three
    // of the thirteen are set that way so the surfaces that render a rate have
    // the state to show: the listing row prints "Rate undisclosed" instead of a
    // figure, and the profile's Pricing card offers a conversation instead of
    // the estimator, which has nothing to multiply by. Anything new that reads
    // `rate` has to answer for `null` — see `PartnerRow.vue` and
    // `PartnerPricingSection.vue`.
    rate,
    rating,
    reviews,
    responds,
    stories,
    industries,
    apps,
    packs,
    // ⚠️ Every partner has one, and only Tridots Tech's is real (it came out
    // of the design file). The other twelve are invented straplines — the same
    // register a company writes about itself in, put in a real company's
    // mouth. They echo that partner's `VISION` copy so the profile reads
    // consistently, and they replace what used to be a generated
    // "city · N success stories" line, which said nothing the page didn't
    // already show twice.
    tagline = null,
    // ⚠️⚠️ INVENTED, all but one. Tridots Tech's came out of the design file;
    // the other twelve are written here so the About card has a real-shaped
    // value to lay out rather than a bare city name.
    //
    // Each one is a plausible address for that partner's actual city, in that
    // country's own postal conventions — unit-then-building in India, street
    // number after the street in Germany, a PO Box in the UAE, the `#14-11`
    // floor-unit form in Singapore — because a directory of thirteen firms
    // across six regions that formatted every address like a US one would look
    // wrong to everyone who lives in one of them. The DISTRICTS are real
    // (Andheri East, Kakkanad, Business Bay, Kilimani); the BUILDINGS are made
    // up, deliberately, so none of these points at a real occupied suite.
    //
    // They are still an invented fact about a real, named company. Replace with
    // the partners' own before this is shown to anyone outside the team — same
    // rule as `tagline`, `founding` and the `VISION` copy. The profile falls
    // back to the city for a partner added without one.
    address = null,
    accolades = [],
  },
) => ({
  id: slug(name),
  name,
  tagline,
  address,
  accolades,
  pmm: PMM_BY_TIER[tier] ?? 1,
  // Real: `city` is scraped, and the country is its last comma field.
  countries: [countryOf(city)],
  // See `marketOf` above — the region, except that India is its own market.
  market: marketOf(city, region),
  // `[{ app, members }]`, highest count first, zeroes dropped.
  certifications: Object.entries(CERTIFIED_MEMBERS[slug(name)] ?? {})
    .filter(([, members]) => members > 0)
    .map(([app, members]) => ({ app, members }))
    .sort((a, b) => b.members - a.members),
  migrations: MIGRATIONS_BY_MARKET[marketOf(city, region)] ?? DEFAULT_MIGRATIONS,
  vision: visionFor(name),
  founding: foundingFor(name),
  tier,
  city,
  region,
  initials,
  color,
  rate,
  rating,
  reviews,
  responds,
  stories,
  industries,
  apps,
  packs,
})

export const PARTNERS = [
  P('Tridots Tech', {
    // The real line, taken from the design file.
    tagline: 'Empowering Businesses Through Thoughtful Technology Since 2006',
    // Both also straight from the design file, which is why this one partner
    // has them and the other twelve don't.
    address:
      'No. 100, Lake View Estate, Kundrathur Main Road, Porur, Chennai 600116, Tamil Nadu, India',
    accolades: [{ title: 'Partner of the Year', year: 2026 }],
    tier: 'gold',
    city: 'Chennai, India',
    region: 'asia',
    initials: 'TT',
    color: '#3b82f6',
    rate: 85,
    rating: 4.5,
    reviews: 12,
    responds: '5h',
    stories: 6,
    // Seven, so the profile card's `+2` overflow state is reviewable — every
    // other partner sits at or under the five-chip cap. Invented, like every
    // partner's industry list.
    industries: [
      'Textile Manufacturing',
      'Retail',
      'Healthcare',
      'Education',
      'Logistics',
      'Automotive Manufacturing',
      'Chemical Manufacturing',
    ],
    apps: ['erpnext', 'helpdesk', 'crm'],
    packs: ['core-erpnext', 'manufacturing', 'all-in-one'],
  }),
  P('Software@Work', {
    tagline: 'Running payroll, plants and pipelines on one system since 2011',
    address: 'Unit 402, Marol Business Centre, Andheri East, Mumbai 400059, Maharashtra, India',
    tier: 'gold',
    city: 'Mumbai, India',
    region: 'asia',
    initials: 'SW',
    color: '#8b5cf6',
    rate: 78,
    rating: 4.4,
    reviews: 18,
    responds: '4h',
    stories: 9,
    industries: ['Discrete Manufacturing', 'Professional services', 'Goods Trading', 'Logistics'],
    apps: ['erpnext', 'frappe-hr', 'crm'],
    packs: ['core-erpnext', 'manufacturing', 'all-in-one'],
  }),
  P('New Indictrans', {
    tagline: 'Open source for institutions that keep records for decades',
    address:
      '3rd Floor, Deccan Chambers, Senapati Bapat Road, Shivajinagar, Pune 411016, Maharashtra, India',
    tier: 'silver',
    city: 'Pune, India',
    region: 'asia',
    initials: 'NI',
    color: '#14b8a6',
    rate: null,
    rating: 4.5,
    reviews: 12,
    responds: '5h',
    stories: 3,
    industries: ['Process Manufacturing', 'Education', 'Government'],
    apps: ['erpnext', 'helpdesk', 'learning'],
    packs: ['core-erpnext', 'frappe-hr'],
  }),
  P('8848 Digital', {
    tagline: 'Traceability from the shop floor up',
    address: 'Office 21, Kharadi Knowledge Park, Kharadi, Pune 411014, Maharashtra, India',
    tier: 'gold',
    city: 'Pune, India',
    region: 'asia',
    initials: '88',
    color: '#f59e0b',
    rate: 92,
    rating: 4.6,
    reviews: 22,
    responds: '3h',
    stories: 8,
    industries: [
      'Automotive Manufacturing',
      'Pharmaceutical Manufacturing',
      'Discrete Manufacturing',
      'Retail',
    ],
    apps: ['erpnext', 'crm', 'frappe-hr', 'insights'],
    packs: ['core-erpnext', 'manufacturing', 'all-in-one'],
  }),
  P('Greycube Technologies', {
    tagline: 'A small studio setting up ERPNext properly for small teams',
    address: 'B-14, Hiranandani Gardens Annexe, Powai, Mumbai 400076, Maharashtra, India',
    tier: 'bronze',
    city: 'Mumbai, India',
    region: 'asia',
    initials: 'GC',
    color: '#64748b',
    rate: 74,
    rating: 4.3,
    reviews: 9,
    responds: '6h',
    stories: 0,
    industries: ['Goods Trading', 'E-commerce', 'Retail'],
    apps: ['erpnext', 'helpdesk'],
    packs: ['core-erpnext'],
  }),
  P('Wahni', {
    tagline: 'One system across every outlet, from Kerala to the Gulf',
    address: '2nd Floor, Backwater Square, Kakkanad, Kochi 682030, Kerala, India',
    tier: 'gold',
    city: 'Kochi, India',
    region: 'asia',
    initials: 'WA',
    color: '#00b4f5',
    rate: 72,
    rating: 4.6,
    reviews: 21,
    responds: '3h',
    stories: 5,
    industries: ['Food and Beverages', 'Retail', 'Healthcare', 'Education'],
    apps: ['erpnext', 'helpdesk', 'frappe-hr', 'school'],
    packs: ['core-erpnext', 'manufacturing', 'frappe-hr'],
  }),
  P('Hybrowlabs', {
    tagline: 'Building less on Frappe, so you maintain less',
    address: 'Office 5, Baner Business Bay, Baner Road, Baner, Pune 411045, Maharashtra, India',
    tier: 'silver',
    city: 'Pune, India',
    region: 'asia',
    initials: 'HL',
    color: '#0ea5e9',
    rate: null,
    rating: 4.2,
    reviews: 8,
    responds: '7h',
    stories: 2,
    industries: ['Software Development', 'E-commerce', 'Professional services'],
    apps: ['erpnext', 'crm', 'drive', 'framework'],
    packs: ['core-erpnext', 'frappe-hr'],
  }),
  P('Finbyz Tech', {
    tagline: 'Built for the finance team that lives in the ERP',
    address:
      '902, Satellite Trade Centre, Iscon Cross Road, Satellite, Ahmedabad 380015, Gujarat, India',
    tier: 'silver',
    city: 'Ahmedabad, India',
    region: 'asia',
    initials: 'FB',
    color: '#22c55e',
    rate: 76,
    rating: 4.4,
    reviews: 15,
    responds: '5h',
    stories: 7,
    industries: ['Chemical Manufacturing', 'Goods Trading', 'Finance', 'Logistics'],
    apps: ['erpnext', 'frappe-hr', 'insights'],
    packs: ['core-erpnext', 'manufacturing'],
  }),
  P('ALYF', {
    tagline: 'Open source ERP for the German Mittelstand',
    address: 'Isarhöfe, Rosenheimer Straße 84, 81669 München, Germany',
    tier: 'silver',
    city: 'Munich, Germany',
    region: 'europe',
    initials: 'AL',
    color: '#a855f7',
    rate: 128,
    rating: 4.7,
    reviews: 6,
    responds: '8h',
    stories: 1,
    industries: ['Discrete Manufacturing', 'Real Estate', 'Rental Business'],
    apps: ['erpnext', 'crm'],
    packs: ['core-erpnext', 'manufacturing'],
  }),
  P('Craft Interactive', {
    tagline: 'Multi-entity, multi-currency, across the Gulf since 2012',
    address:
      'Office 1203, Marasi Bay Tower, Business Bay, PO Box 62579, Dubai, United Arab Emirates',
    tier: 'gold',
    city: 'Dubai, United Arab Emirates',
    region: 'middle-east',
    initials: 'CI',
    color: '#ef4444',
    rate: 105,
    rating: 4.5,
    reviews: 14,
    responds: '4h',
    stories: 4,
    industries: [
      'Goods Trading',
      'Retail',
      'Engineering and Construction',
      'Hotels, Restaurants and Cafes',
    ],
    apps: ['erpnext', 'helpdesk', 'crm'],
    packs: ['core-erpnext', 'all-in-one'],
  }),
  P('Kingstech Services', {
    tagline: 'One rollout, several jurisdictions, out of Singapore',
    address: '#14-11 Robinson Square, 108 Robinson Road, Singapore 068900',
    tier: 'bronze',
    city: 'Singapore',
    region: 'asia',
    initials: 'KS',
    color: '#ec4899',
    rate: null,
    rating: 4.3,
    reviews: 11,
    responds: '5h',
    stories: 0,
    industries: ['Goods Trading', 'E-commerce', 'Logistics', 'Professional services'],
    apps: ['erpnext', 'helpdesk', 'crm'],
    packs: ['core-erpnext', 'all-in-one'],
  }),
  P('Navari', {
    tagline: 'Software built for the conditions East Africa actually works in',
    address:
      '4th Floor, Riverside Court, Kaburu Drive, Kilimani, PO Box 41283-00100, Nairobi, Kenya',
    tier: 'bronze',
    city: 'Nairobi, Kenya',
    region: 'africa',
    initials: 'NV',
    color: '#f97316',
    rate: 82,
    rating: 4.5,
    reviews: 9,
    responds: '6h',
    stories: 2,
    industries: ['Agriculture', 'Goods Trading', 'Nonprofit', 'Logistics'],
    apps: ['erpnext', 'helpdesk', 'frappe-hr'],
    packs: ['core-erpnext'],
  }),
  P('Korecent', {
    tagline: 'ERP as part of your quality system, not beside it',
    address: 'Suite 1750, 1420 West Fulton Market, Chicago, IL 60607, United States',
    tier: 'silver',
    city: 'Chicago, United States',
    region: 'americas',
    initials: 'KO',
    color: '#06b6d4',
    rate: 145,
    rating: 4.4,
    reviews: 7,
    responds: '6h',
    stories: 3,
    industries: ['Medical Device Manufacturing', 'Healthcare', 'Professional services'],
    apps: ['erpnext', 'frappe-hr', 'crm', 'insights'],
    packs: ['core-erpnext', 'frappe-hr'],
  }),
]

export const SUCCESS_STORIES = [
  {
    id: 'mcf',
    tag: 'Services',
    title: 'MCF manages 20,000 annual members, bookings & accounting with ERPNext',
    // Placeholder art: a two-stop gradient standing in for a photo, so the
    // mock stays asset-free. Swap for real imagery at build time.
    //
    // Grey, like the gallery placeholders — a saturated gradient reads as a
    // chosen brand treatment rather than a missing photo. The three differ by
    // value only, so the cards stay distinguishable without a palette.
    art: ['#d1d5db', '#8b919a'],
  },
  {
    id: 'mandpeshwar',
    tag: 'Services',
    title:
      'Mandpeshwar Civic Federation manages 20,000 annual members, bookings & accounting with ERPNext',
    art: ['#b6bcc4', '#6b7280'],
  },
  {
    id: 'sree-arka',
    tag: 'Services',
    title:
      'How ERPNext helped Sree Arka Greentech transform end-to-end Lead & Project Management systems',
    art: ['#c9ced5', '#5a606a'],
  },
]
