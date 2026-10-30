# Partner view — plan

The partner side today is one screen, Messages. This plan grows it into a small PRM with six
areas on the rail, plus Settings. Each area answers one question a partner comes back with:

| Rail item   | The partner's question                                     |
| ----------- | ---------------------------------------------------------- |
| Partnership | Where do we stand with Frappe, and what gets us up a tier? |
| Customers   | Who are we working with, and what does each one bring in?  |
| Messages    | Which leads are waiting on us?                             |
| Team        | Who is on the team, who is certified, and who can do what? |
| Profile     | What does a business see when it finds us?                 |
| Resources   | What has Frappe given us to sell and deliver with?         |

Settings (CRM sync) opens as a dialog, not a rail item.

**The landing screen depends on tier.** A Beginner lands on Partnership: they have no listing
and no leads yet, and the milestone checklist is their next step. Bronze and up land on
Messages, because leads are the work that can't wait and standing changes slowly (MRR monthly,
audits yearly). Standing still reaches them where they are:

- **Rail badges** where something needs action: leads waiting on a reply (Messages), link
  requests (Customers), certificates expiring (Team).
- **A banner across the app** only for At risk. It is rare and serious, so it can't depend on
  a visit to Partnership.

A Home dashboard collecting all of this was ruled out: every block on it would repeat another
area, and nothing on it would be the anchor.

**Demo switcher.** The Demo menu's Partner side gets a tier choice: **Beginner** and **Bronze
and up**. Those are the two versions of the product a partner sees: milestones or criteria on
Partnership, a different landing screen, and a directory listing or none. Silver and Gold
differ from Bronze only in numbers, so one seeded Bronze-and-up partner covers them.

## The tier rubric

The ladder is **Beginner → Bronze → Silver → Gold**. Entry and Emerging are gone, merged into
Beginner. frappe.io/partners/plans and the partner guide haven't caught up yet, so Bronze and
up below are from the plans page and need confirming.

| Tier     | Frappe Cloud MRR    | Certified consultants | PMM | FC discount | Listing                     |
| -------- | ------------------- | --------------------- | --- | ----------- | --------------------------- |
| Beginner | Below Bronze        | Below Bronze          | —   | *to confirm* | Not listed; page shared by link |
| Bronze   | ₹63,000 / $750      | 2                     | 3   | 15%         | Full profile, large card    |
| Silver   | ₹2,50,000 / $3,150  | 3                     | 4   | 20%         | Full profile                |
| Gold     | ₹6,30,000 / $7,500  | 4                     | 5   | 25%         | Full profile, top of list   |

Every tier also needs a registered company and a Frappe Cloud account billing at least $100 a
month. MRR counts both direct and indirect billing. A consultant counts only with a full
ERPNext or Framework certification, not a single-module one. An upgrade needs a PMM audit
started ahead of time: 30 days for Bronze, 60 for Silver and Gold.

**Beginner to Bronze is measured in milestones.** Frappe tracks these for every Beginner, and
the partner sees the same ones:

1. 1st certification
2. 2nd certification
3. $100 MRR
4. $300 MRR
5. Bronze reached (needs the PMM audit)

⚠️ The prototype knows only gold, silver and bronze (`data/partners.js`, `TierIcon.vue`), and
PMM is derived from tier there. Beginner needs to be added, and PMM needs to become its own
field, since it is a criterion with its own audit and not a label for the tier.

## 1. Partnership

**Beginner.** The milestone checklist is the anchor: the five milestones in order, done ones
ticked with their date, the next one highlighted with what it takes ("1 more certification",
"$140 more MRR"). Each links to where it's done: certifications to Team, MRR to Contributions.
The partner code sits right below it, since linking a first customer is how MRR starts.

**Bronze and up.** The current tier with its benefits (discount, listing type). Then one row
per criterion for the **next** tier: MRR, certified consultants, PMM level and eligibility.
Each row shows where the partner is, the threshold, and the gap ("₹41,000 more MRR"). Each
row also names its source and how fresh it is: MRR from Frappe Cloud billing, consultants from
certification, PMM from the last audit. The consultants row links to Team, and the MRR row
links to Contributions. Under the MRR figure, last month's sits as one line ("Last month
₹4,94,395"), which says whether the partner is growing or slipping.

**Partner code.** On Partnership too, with Copy and Share, because partners already look for
it here in the PRM portal's Overview.

**Contributions.** Behind the MRR row: every invoice that makes up MRR, across all customers.
Columns: customer, month, invoice, status, amount, currency, and whether it counts toward MRR.
Filters for month and status. The month's total matches the MRR figure.

- The current month shows as "This month so far", since its invoices are still accruing.
  The PRM portal's Draft and Empty statuses look like a quirk of that portal and aren't
  carried over: an invoice with nothing billed isn't listed.
- **Currency.** Rates move, so there's no fixed conversion. Each invoice converts at the rate
  of its own date, and the total and thresholds show in the partner's billing currency. The
  list shows each invoice's own amount and currency, so the conversion is visible.
- The partner's own Frappe Cloud account appears here, since it bills too. It's labelled as
  theirs, so it doesn't read as a client.

**How audits work, always visible.** Every tier and every state shows the audit mechanics in
one block, so no partner learns about the wait at the last step:

- What the audit checks: the PMM level the next tier needs, linked to the PMM criteria.
- The lead time for the next tier: 30 days before Bronze, 60 before Silver and Gold.
- Where the partner is with it: not requested, requested, scheduled (date and auditor), in
  progress, or done (the level it gave).
- When to request it: once the other criteria are within reach, with the start-by date that
  follows from the lead time. A Beginner sees this from their first visit, next to the
  milestones, not only after $300.
- At Gold, there's no next tier, so the block shows when the next audit to keep Gold is due,
  once Frappe confirms that audits recur.

**Audit history.** Below the criteria, one row per past audit: date, auditor, the PMM level it
gave, the tier that followed, and the report. The newest sits first. A partner with no audits
yet sees one line saying the first audit is due before Bronze.

**States.** The screen shows one of these at a time:

- **Working toward the next tier.** The default. For a Beginner, this is the milestone
  checklist.
- **Ready for an audit.** Every criterion except PMM is met. Show the button to request a PMM
  audit, with the date it needs to start by.
- **Audit in progress.** Show the audit date and auditor, and say what the partner needs to
  prepare.
- **At risk.** A criterion for the *current* tier has dropped below its threshold: MRR below
  the floor, or a certified consultant who left or whose certificate lapsed. Name the
  criterion, and show the date of the next review if there is one.

**Error paths**

- Billing data hasn't synced: show the last-updated time and keep the last known value.
  Never show ₹0.
- The audit request fails, or a request is already open: say which, and keep the existing
  request visible.
- The partner disagrees with a figure. Messaging is for businesses only, so this links to the
  partner support desk. There is no in-app dispute.

## 2. Customers

**One list, two sources**, with a filter for each:

- **Through Connect.** A business enters the list when it **hires** the partner. Until then it
  is a lead and stays in Messages, even after it shortlists the partner and its name is shared.
- **The partner's own.** These come from the partner's Frappe Cloud partner code. Nothing
  links on its own: the customer enters the code in Frappe Cloud, and the partner approves or
  declines the request. The partner can also add a customer by hand before the site exists.

**Partner code.** Sits in the Customers header, next to Add customer: the code with a Copy
button, and Share, which copies a short message with the code and the steps to enter it in
Frappe Cloud. The Add customer dialog ends on the same code and Share, since sharing it is the
next step. An empty Customers list leads with it too.

**Link requests.** Pending requests sit above the list, one row each: company, contact, the
sites it covers, Approve and Decline. Approving adds the customer to the list. Declining
removes the request and tells the customer.

**Two billing modes.** Each linked customer has one, and it sets what the partner can see:

| Mode          | Who pays Frappe Cloud | Counts toward tier | Commission | Partner sees                      |
| ------------- | --------------------- | ------------------ | ---------- | --------------------------------- |
| Customer pays | The customer          | Yes                | No         | The customer's plans and invoices |
| Partner pays  | The partner           | Yes                | Yes        | The monthly invoice amount only   |

A business can't pick a billing mode before it has hired anyone, so every link starts as
Customer pays. A link request never asks for a mode. Moving to Partner pays is a later step,
once the two have agreed it between themselves.

**Columns:** customer, source, billing mode, stage, Frappe Cloud sites, MRR contribution, last
activity. Both sources share one set of stages: Onboarding → Live → Churned. A Connect customer
is Onboarding while its project runs. The MRR total sits next to the list's MRR column and
matches the figure on Partnership. If the two disagree, one of them is wrong.

**Customer detail page.** Laid out like a deal in Frappe CRM: a side panel with the facts,
and the main area for what changes over time.

- **Side panel:** company, contact, billing mode, stage, MRR contribution, and when the partner
  code was linked.
- **Main area, in tabs:**
  - **Sites:** name, plan, region, status, apps, monthly cost. Read-only, with "Open in Frappe
    Cloud". Partner-pays customers show plan and amount only.
  - **Invoices:** Frappe Cloud invoices, read-only, with unpaid ones flagged. Customer-pays
    customers only.
  - **Connect:** the message thread and project, for customers who came through Connect.
  - **Notes:** the partner's own.
- **Out of scope:** invoices the partner sends the customer for their own work. Partners do
  that in their own ERPNext.

**Adding a customer (happy path):** company name and contact email → saved as Onboarding with
"Not on Frappe Cloud yet" → the partner shares their partner code → the customer enters it in
Frappe Cloud → the request shows under Link requests → the partner approves → the first billed
site moves them to Live.

**Error paths**

- The site is already billed under another partner's code: explain who to contact, and don't
  change who it is billed under.
- A link request from a company the partner doesn't recognise: Decline is the safe default,
  and nothing about the customer's account is shown until the partner approves.
- A duplicate (same company or email already in the list): open the existing record instead.
- A site is suspended or a customer cancels: their MRR stops counting. If that brings the
  partner below their tier floor, Partnership shows At risk and the customer row links to it.

## 3. Messages

This exists already and stays business-only. Every thread is a lead. It is the landing screen
from Bronze up, so it has to stay calm:

- **Leads only.** Link requests, certificate expiries, audit updates and tier changes go to
  badges on their own rail items, or the At risk banner. Never into this list.
- **"Needs reply" is the default view:** leads where the partner owes the next move (a new
  brief, an unanswered message, a quote asked for), oldest waiting first. Everything else is
  one filter away.
- **Finished leads leave.** Won moves to Customers. Lost, Junk and Closed drop out of the
  default view and stay findable.
- **Only the business bumps a row.** A synced CRM stage, a Frappe owner change or a status
  update changes the row where it sits.
- **Caught up is a state.** An empty "Needs reply" says so, rather than looking like an empty
  inbox.
- **One list, a source label per row.** Connect briefs and leads passed by Frappe sit together.
- **Inflow is controlled on Profile**, through regions, industries, deal sizes and "taking work
  this quarter". The caught-up state can point there.
- **Assignment.** Each lead has an owner, from the CRM when synced or set by hand, and a "Mine"
  filter, so two people at one firm don't answer the same lead.

**Stages are the PRM portal's**, so partners and Frappe's partner team keep one vocabulary,
and a CRM sync maps onto stages Frappe already owns: Open, Qualification, Demo/Making,
Proposal/Quotation, Follow Up, Negotiation, Ready to Close, Won, Lost, Junk, Closed.

Most partners run a CRM and won't update stages on Connect by hand. So a stage is set, in
order of preference, by what happens in Connect, then by a CRM sync, then by hand:

| What happens                                        | Stage                            |
| --------------------------------------------------- | -------------------------------- |
| Brief reaches the partner, or Frappe passes a lead  | Open                             |
| Partner sends a quote                               | Proposal/Quotation               |
| Business shortlists the partner                     | Negotiation                      |
| Business hires them, or links through the partner code | Won                           |
| Business picks someone else                         | Lost, "Lost to competitor"       |
| Brief withdrawn                                     | Lost or Closed, *to confirm*     |
| Partner flags a brief as spam or not genuine        | Junk                             |

Qualification, Demo/Making, Follow Up and Ready to Close have no event in Connect. They come
from sync or by hand, and a lead can skip them. Lost always asks for a reason, from the
portal's list.

**Each lead also carries:**

- **Source:** a brief through Connect, or passed on by Frappe. Passed leads arrive with the
  business named from the start, and show the Frappe person who passed them on.
- **What it asked about:** the brief, its industry, and the Starter Pack, if it picked one.

**Without a sync,** a passed lead that hasn't moved for a while gets one prompt, "Still working
on this?", answered in one click. Leads a partner finds on their own stay in their CRM. Connect
sees them only once they link through the partner code, as customers.

The other changes:

- Once a thread is won, the sidebar links to its customer record.
- **Error paths to design:** a message fails to send (keep the draft and offer a retry); the
  business hires someone else or withdraws the brief (the lead closes with that stage and
  reason, and the thread stays as a read-only record of the bid); a quote is sent after the brief
  closed (block it and explain).
- **Empty state, Bronze and up:** no briefs yet. Say what makes a brief reach them: their
  regions and industries, and the deal sizes and capacity on their profile.
- **Beginner:** no leads reach them. Beginners find their own until Bronze. Messages stays on
  the rail and says leads from Connect start at Bronze, linking to the milestones.

## 4. Team

Everyone at the firm in one list: who counts toward the consultants criterion, who is working
toward it, and who can sign in to Connect with what role. It's a page, not part of the Settings
dialog, because adding a colleague is one task whether they need a certificate, access, or
both. A person doesn't need Connect access to be listed: a consultant can count toward tier
without ever signing in.

**List:** name, email, certifications (ERPNext, Framework, or a single module), status and
expiry. A column says whether each person counts toward tier, so a single-module certificate
reads as "Doesn't count toward tier" rather than looking like a missing one. The count at the
top matches the consultants row on Partnership.

**Access and role** are columns on the same rows: No access, Member or Admin. Inviting someone
sets their access and role; their certifications can be added in the same step or later. The
last admin can't be removed or made a member.

**Certification statuses:** Certified, Applied (exam not taken yet), Expiring (within 60
days), Expired, and Not certified.

**Roles.** Two, set per person on Team:

| Action                                                    | Admin | Member |
| --------------------------------------------------------- | ----- | ------ |
| See Partnership, Customers, Messages, Team, Resources, Profile | Yes | Yes  |
| Reply to leads, send quotes, change lead stages           | Yes   | Yes    |
| Add customers and notes                                   | Yes   | Yes    |
| Approve or decline link requests                          | Yes   | No     |
| Request an audit                                          | Yes   | No     |
| Edit the profile and submit it for review                 | Yes   | No     |
| Invite people, change roles, add certifications           | Yes   | No     |
| Open Settings                                             | Yes   | No     |

**Two ways to add a certification:**

- **Link an existing certificate.** Enter the certificate ID, or the email the person took the
  exam with. Connect looks it up and shows the match (name, certification, date) before
  saving.
- **Apply on their behalf.** Pick the person (or add them by name and email) and the
  certification. They get an email to book and take the exam, and the row shows Applied until
  they pass. The employee pays the exam fee and the partner reimburses them outside Connect,
  so applying involves no payment step.

**Error paths**

- No certificate matches the ID or email: say so, and keep what was typed.
- The certificate is already counted by another partner: don't link it, and point to the
  partner support desk.
- The name on the certificate differs from the team member's: show both and ask to confirm.
- A consultant leaves or a certificate expires: the row moves to Expired or is removed, and if
  that drops the count below the current tier's threshold, Partnership shows At risk and links
  here.

## 5. Profile

The partner edits their **own directory page**, laid out as a business sees it (reusing
`PartnerProfilePage`), with an Edit control on each section. Edits are not done in a separate
form.

| Publishes instantly                                       | Goes to Frappe for review                 | Read-only (set by Frappe) |
| --------------------------------------------------------- | ----------------------------------------- | ------------------------- |
| Logo, tagline, about, website, address, contacts          | Case studies and stories                  | Tier and PMM              |
| Industries, regions, work style                           | Client logos                              | Certified consultants     |
| Deal sizes taken, and whether they're taking work this quarter | Quoted figures and claims ("200+ live customers") | Reviews and ratings   |
| Pricing, media gallery                                    |                                           |                           |

Deal sizes and capacity come from the gap that DESIGN-NOTES already names. They are what lets
a business's budget actually narrow who receives a brief.

**Review flow (happy path):** edit a case study → Submit for review → the section shows
"In review" while the directory keeps the live version → Frappe approves it → it goes live
and the partner gets a notice.

**Error paths**

- Rejected: the reason shows on the section, with the partner's draft kept so they can edit
  and resubmit.
- The partner edits again while a section is in review: this replaces the pending version,
  after a confirmation.
- Validation: missing required fields, a logo that's too large or the wrong format, a broken
  link. The error is shown inline before saving.
- Two team members edit at once: the second save is told there is a newer version, and is
  shown it.
- Beginner: they aren't in the directory, since a partner without a PMM audit shouldn't be
  found through Frappe's own listing, and the listing is what Bronze earns. Their page still
  works by link: a Beginner can send it to prospects they find themselves, with the partner
  code on it. The editor says once, at the top, that it's unlisted until Bronze, with Copy
  link. Bronze makes the same page public.

## 6. Resources

What Frappe gives partners to sell and deliver with, in one place instead of scattered links.
Each item links out to where it lives. From the partner guide:

- **Help with a project:** Frappe Support (support.frappe.io), the community forum
  (discuss.frappe.io), the partner forum (partners.frappe.io), the partner WhatsApp and Telegram
  groups, and the docs (docs.frappe.io). Co-delivery with an existing partner, through the
  partner list.
- **Selling:** the Sales Bootcamp on Frappe School, marketing resources, and Starter Pack scopes.
- **Hiring and certification:** Frappe School's certified participants and job openings.
- **Staying up to date:** partner events, the Frappe YouTube channel, and Frappe Times.

"Help with a project" goes first for a Beginner. This answers where first-implementation help
comes from: Frappe's existing channels, not a new one in Connect.

**Empty and error:** none to design beyond a failed load, since Frappe curates the list.

## 7. Settings

A `SettingsDialog`, opened from the account menu. Admins only. It holds CRM sync; users and
roles live on Team.

**CRM sync.** Connect the firm's CRM so lead stages stay in one place:

- **Connect:** pick the CRM, enter its site URL and API key, then map its lead statuses to the
  PRM stages. The mapping is set once and can be changed later.
- **What syncs:** Connect pushes a lead once the business is named, so an anonymous brief stays
  in Connect. Stage changes come back from the CRM. Won from the partner code link always
  wins over a CRM status.
- **Status:** connected, with the last sync time, or paused with the reason.

**Error paths**

- The URL or key is wrong: say which, and don't save the connection.
- A CRM status has no mapping: leads in it keep their last Connect stage, and the sync row
  says how many are unmapped.
- The CRM stops responding: sync pauses, the last sync time stays visible, and stages set in
  Connect keep working.

## Open questions for Frappe

1. **Losing a tier.** Is there a grace period or a review date, or does the tier drop as soon
   as MRR does? The At risk state depends on the answer.
2. **MRR window.** Is it the current month, or a trailing average? This decides whether one
   bad month means At risk.
3. **Audit lead time.** The Bronze doc says 30 days, the Silver and Gold docs 60.
4. **Team permissions.** Do the Admin and Member roles in Settings match how partner firms
   work?
5. **Reviews.** Can a partner reply publicly to a review?
6. **Review time.** How long does a profile review take? It goes in the "In review" copy.
7. **The PRM portal.** Frappe already runs one: Partnerships > Overview, Contributions (linked
   customers' invoices and plans), leads and certified members. Does Connect replace it? If
   it does, what the portal does today is the minimum this view must cover.
8. **Switching to Partner pays.** Who starts it, the partner or the customer, and does the
   customer have to confirm in Frappe Cloud?
9. **Closed and Junk.** How does Closed differ from Lost and Junk? A withdrawn brief needs
   one of them.
10. **CRM sync.** Which CRMs will Frappe support? Frappe CRM and ERPNext are the obvious first
    ones.
11. **Shared consultants.** Can a certificate count for two partners if a consultant works
    with both?
12. **Partner code link.** Can Frappe Cloud take the code in a link, so a customer opens it and
    the code is filled in? If so, Share copies the link instead of the steps.
13. **Beginner to Bronze.** The milestones stop at $300 MRR, but Bronze has been $750 and PMM 3.
    Is there a step between, or has Bronze changed? Ask whoever wrote the milestone list, or
    the partner team. Until then the prototype shows the five milestones and calls the last
    one "Bronze criteria" without a figure, and the thresholds sit in one data file so a new
    answer is a one-line change. Also: does Beginner get an FC discount, and a time limit?
14. **How Frappe converts currency today.** The PRM portal already totals INR and USD invoices
    into one figure. Use the same method, whatever it is.
15. **Recurring audits.** Is a tier re-audited on a schedule to keep it, or only when moving up?
