# Partner view — plan

The partner side today is one screen, Messages. This plan grows it into a small PRM with seven
areas on the rail, plus Settings. Each area answers one question a partner comes back with:

| Rail item   | The partner's question                                     |
| ----------- | ---------------------------------------------------------- |
| Leads       | Which leads are waiting on us?                             |
| Customers   | Who are we working with, and what does each one bring in?  |
| Invoices    | What counts toward tier, and what did we pay Frappe for our customers? |
| Partnership | Where do we stand with Frappe, and what gets us up a tier? |
| Team        | Who is on the team, who is certified, and who can do what? |
| Listing     | What does a business see when it finds us?                 |

The rail is two groups: daily work (Leads, Customers, Invoices) with no label, then the firm
(Partnership, Team, Listing) under "Your firm". Each role sees only its own rows. Resources is links out, not a
place you work, so it sits in the header menu as "Help and resources", with Firm settings and
Partner managers. The sidebar's footer is the signed-in person: their settings, theme and log
out. Only Leads shows a count: replies are the one thing that can't wait, and counts on every
row were distracting. Collapsed, Leads shows a dot instead.

Firm settings (CRM sync, leaving) open as a dialog, not a rail item.

**Who uses it.** Partner firms aren't one person. The owner sets the firm up (profile, team,
audits, CRM sync) and checks standing about monthly. Sales works leads every day and writes to
businesses on the firm's behalf. Finance checks what the firm paid Frappe and bills customers
onward. These are the three roles (see Team), and a small firm gives one person all three.

**The landing screen depends on tier and role.** A Beginner lands on Partnership whatever their
role: they have no listing and no leads yet, and the milestone checklist is their next step.
From Bronze up, each role lands where its work is:

| Role    | Lands on    | Because                                              |
| ------- | ----------- | ---------------------------------------------------- |
| Owner   | Partnership | Standing, audits and the team are theirs to run      |
| Sales   | Messages    | Leads are the work that can't wait                   |
| Finance | Billing     | What was paid for customers, and what to bill them   |

The landing changes once, at Bronze, with a one-time notice so it doesn't feel like the app
moved. Standing still reaches people where they are:

- **A count on Leads** for replies waiting. Nothing else on the rail carries one: link
  requests, expiring certificates and an unpaid invoice show where they live, and by email.
- **A banner across the app** only for At risk. It is rare and serious, so it can't depend on
  a visit to Partnership.

A Home dashboard collecting all of this was ruled out: every block on it would repeat another
area, and nothing on it would be the anchor.

**Demo switcher.** The Demo menu's Partner side gets two choices:

- **Tier:** Beginner, or Bronze and up. Those are the two versions of the product a partner
  sees: milestones or criteria on Partnership, and a directory listing or none. Silver and Gold
  differ from Bronze only in numbers, so one seeded Bronze-and-up partner covers them.
- **Role:** Owner, Sales or Finance. It sets the landing screen, the badges and what can be
  done.

An Applicant state (signed up, not yet a partner) may join the tier choice once the onboarding
designs are in (see Onboarding).

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

## 0. Onboarding

Interested companies sign up and track their application in Connect. Ready designs exist for
this and will be shared, so this section only fixes the steps and states; the screens follow
those designs.

1. Sign up, with company details.
2. Apply to be a partner. The application shows its status: submitted, in review, or a decision.
3. Frappe reviews it. A rejection arrives by email with the reason, and the application page
   says so.
4. Accept the partner agreement. It can't be skipped.
5. Create or link the firm's Frappe Cloud account, since every tier needs one billing $100 a
   month.
6. The partner code is issued and the firm becomes a Beginner. The owner lands on Partnership,
   with the milestones, the audit mechanics and the partner code.
7. Invite the team on Team.

**Signing in.** Partners sign in the way businesses already do (`LoginPage`, `SignupPage`): work
email, then a one-time code, no password.

- **Signing in:** Connect knows from the email that it belongs to a partner team, so it opens
  the partner side on that person's landing screen. There's no "I'm a partner" toggle.
- **Signing up as a new partner:** starts from "Become a partner" on frappe.io/partners and
  goes into the onboarding steps above. The general sign-up screen stays for businesses.
- **Joining a team:** the owner's invite email links to the same email-and-code step, and the
  person lands with the roles they were given.
- **One email on both sides:** if an address is a business user and on a partner team, Connect
  asks which side to open after the code.

Signing in with the Frappe Cloud account was considered and left out: it would make Sales and
Finance people create Frappe Cloud accounts they otherwise never need.

## 1. Partnership

**Beginner.** The milestone checklist is the anchor: the five milestones in order, done ones
ticked with their date, the next one highlighted with what it takes ("1 more certification",
"$140 more MRR"). Each links to where it's done: certifications to Team, MRR to Invoices, All customers.
The partner code sits right below it, since linking a first customer is how MRR starts.

**Bronze and up.** The current tier with its benefits (discount, listing type). Then one row
per criterion for the **next** tier: MRR, certified consultants, PMM level and eligibility.
Each row shows where the partner is, the threshold, and the gap ("₹41,000 more MRR"). Each
row also names its source and how fresh it is: MRR from Frappe Cloud billing, consultants from
certification, PMM from the last audit. The consultants row links to Team, and the MRR row
links to Invoices (All customers). Under the MRR figure, last month's sits as one line ("Last month
₹4,94,395"), which says whether the partner is growing or slipping.

**Partner managers.** Partners reach Frappe's partner managers directly, and a firm can have
more than one. There's no rule for who handles what, so they're listed together, not by topic.
They're shown in three places:

- **Partnership, as one line near the end:** each manager's name, photo and an email link. Not a
  column of their own: they're who to write to, not something to read every visit.
- **Where a problem comes up:** a disputed figure on Invoices, a certificate claimed by
  another partner on Team, a declined audit. The error links to the firm's partner managers,
  with what to include.
- **The account menu:** "Partner managers", so they're reachable from any page.

Each is an email link, not a channel inside Connect.

**Partner code.** On Partnership too, with Copy and Share, because partners already look for
it here in the PRM portal's Overview.

**Invoices, All customers.** Behind the MRR row: every invoice that makes up MRR, across all customers.
Columns: customer, month, invoice, status, amount, currency, and whether it counts toward MRR.
Filters for month and status. The month's total matches the MRR figure. An invoice opens in
the docked aside (the same one as Billing): its sites and servers with amounts, the total, and
for an invoice in another currency, what it counts toward MRR as and at which day's rate.

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
- Where the partner is with it: not requested, requested ("waiting for Frappe to schedule
  it", with no promised duration), scheduled (date and auditor; the owner gets an email when the
  date is set), in progress, or done (the level it gave).
- If Frappe declines or defers the request, the reason shows here and the owner can request
  again later.
- If the audit gives the PMM level but another criterion has slipped since, the tier stays
  where it is and the block names the gap.
- When to request it: once the other criteria are within reach, with the start-by date that
  follows from the lead time. A Beginner sees this from their first visit, next to the
  milestones, not only after $300.
- At Gold, there's no next tier. Gold is re-audited to keep it, so the block shows when the
  next audit is due and when to request it.

Settled: the audit lives in the PMM criterion row. Its meta line says where the audit stands
(needed and the lead time, requested, or scheduled), and the Request audit button appears in
that row once everything but PMM is met. For a Beginner, the Bronze milestone carries it.

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
  criterion and the review date. Fixing it isn't instant (a new customer has to link, and
  MRR syncs later), so the state says it clears at the next Frappe Cloud sync.

**Losing a tier: a proposed rule.** Frappe hasn't set one, so the plan proposes this, to be
confirmed or replaced:

- **MRR counts as a 3-month average,** so one bad month doesn't put a partner at risk.
- **At risk** starts when the 3-month average falls below the current tier's floor, or when
  the certified count drops below its threshold. The owner gets an email and the banner shows.
- **Consultants:** the partner has 60 days to certify or link a replacement.
- **Review at each quarter's end.** Still below then, the tier drops one step. The owner gets an
  email saying what changed: the discount from the next invoice, the listing, and the landing.
- **Dropping to Beginner:** open Connect threads stay so the partner can finish them, new briefs
  stop, and the listing goes back to unlisted.

**Error paths**

- Billing data hasn't synced: show the last-updated time and keep the last known value.
  Never show ₹0.
- The audit request fails, or a request is already open: say which, and keep the existing
  request visible.
- The partner disagrees with a figure. Messaging is for businesses only, so this links to the
  partner manager's email, with what to include: the partner code, the figure, and the month.
  There is no in-app dispute.

## 2. Customers

**One list.** Customers arrive two ways, but the list doesn't split by source: where a
customer came from doesn't change how the firm works with them.

- **Through Connect.** A business enters the list when it **hires** the partner. Until then it
  is a lead and stays in Messages, even after it shortlists the partner and its name is shared.
- **The partner's own.** These come from the partner's Frappe Cloud partner code. Nothing
  links on its own: the customer enters the code in Frappe Cloud, and the partner approves or
  declines the request. The partner can also add a customer by hand before the site exists.

**Partner code.** Sits in the Customers header, next to Add customer: the code with a Copy
button, and Share, which copies a short message with the code and the steps to enter it in
Frappe Cloud. The Add customer dialog ends on the same code and Share, since sharing it is the
next step. An empty Customers list leads with it too.

**Link requests.** In the same list, at the top: a request is a customer that hasn't linked
yet. Each row has the company and contact, and "Wants to link" in the Stage column; it opens in
the docked panel rather than a customer page. A row opens in the docked aside with what the owner needs
to judge it: the contact, every site and server it covers with plan and region, and the match
to a customer added by hand, with Approve and Decline at the bottom. Approving adds the customer to the list. Declining
removes the request and tells the customer. Each gets a few seconds to undo, rather than an
"Are you sure?" dialog: approving by mistake exposes a stranger's invoices, and declining sends
a rejection. Only the owner can act on requests, and gets an email when one arrives.

If the request matches a customer added by hand (same email or company), the row says so:
"Matches Acme, added 3 Oct". A customer added by hand shows "Code shared on 3 Oct" until their
request arrives, so the wait is visible.

**Two billing modes.** Each linked customer has one, and it sets what the partner can see:

| Mode          | Who pays Frappe Cloud | Counts toward tier | Partner's tier discount | Partner sees                      |
| ------------- | --------------------- | ------------------ | ----------------------- | --------------------------------- |
| Customer pays | The customer          | Yes                | No                      | The customer's plans and invoices |
| Partner pays  | The partner           | Yes                | Yes, on their bill      | The monthly invoice amount only   |

The partner's commission is that discount: their tier's FC discount (15% at Bronze, 20% at
Silver, 25% at Gold) on what they pay for Partner-pays customers. There's no separate payout.

A business can't pick a billing mode before it has hired anyone, so every link starts as
Customer pays. A link request never asks for a mode. Moving to Partner pays is a later step,
once the two have agreed it between themselves.

**Switching to Partner pays (proposed; open question 8).** The owner starts it, and the
customer confirms, since their billing moves away from them:

1. On the customer's page, the owner picks Switch to Partner pays. The dialog says what
   changes and from when: the partner is billed from the next billing cycle (with its date),
   the tier discount applies, and the partner will see the monthly amount only, no longer the
   customer's plans and invoices.
2. The customer gets an email and confirms in Frappe Cloud (*outside*).
3. Meanwhile the customer's row and side panel show "Partner pays from 1 Dec, waiting for
   the customer".
4. Confirmed: the switch happens when the cycle starts. Billing lists the customer from that
   month.
5. Declined, or no answer by the cycle date: the customer stays on Customer pays, the owner is
   told, and can ask again.

Switching back works the same way the other way round, and the customer has to add a payment
method in Frappe Cloud before it takes effect.

**Columns** (searchable, like every list here): customer, source, billing mode, stage, Frappe Cloud sites, MRR contribution, last
activity. Both sources share one set of stages: Onboarding → Live → Churned. A Connect customer
is Onboarding while its project runs. The MRR total sits next to the list's MRR column and
matches the figure on Partnership. If the two disagree, one of them is wrong. Partnership,
this total and Invoices show the same last-updated time, so a mismatch is easy to spot.

**Customer detail page.** Laid out like a deal in Frappe CRM: a side panel with the facts,
and the main area for what changes over time.

- **Side panel:** company, contact, billing mode, stage, MRR contribution, and when the partner
  code was linked.
- **Main area, in tabs:**
  - **Sites:** name, plan, region, status, apps, monthly cost. Read-only, with "Open in Frappe
    Cloud". Partner-pays customers show plan and amount only.
  - **Invoices:** for Customer-pays customers, their Frappe Cloud invoices, read-only, with
    unpaid ones flagged. For Partner-pays customers, the per-customer invoices from Billing.
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

## 3. Invoices

One page, two tabs, both Frappe Cloud invoices by customer and month. **All customers** (was
Contributions) is Frappe's view: every linked customer's invoice, what counts toward tier;
Partnership's MRR row opens it. **Paid by you** (was Billing) answers the accountant's question: what did we
pay Frappe on our customers' behalf, and what do we charge them for it? Frappe Cloud's own
Billing page doesn't break this down per customer, so Connect does.

**One month at a time,** with a month picker. One row per Partner-pays customer: the amount
Frappe billed for them, the tier discount taken off, and what the partner paid. Above the rows,
the partner's own Frappe Cloud invoice for the month, whose total the rows add up to.

**Invoices open in a docked aside**, the one Frappe Cloud v2 uses for invoices
(`frappe-cloud-v2/src/pages/manage/CentralBillingPage.vue`). It sits to the right of the list,
so Finance can step through customers without losing their place. In that repo it's written
inline in the page, so Connect pulls it out into one shared component.

- **A customer's row** opens their invoice: customer, month and status in the header, with
  Email and Download as icons. The body lists that customer's servers and sites, each with its
  plan and amount, then subtotal, tier discount and total. This is the per-customer invoice the
  partner passes on or bills from.
- **The partner's invoice** opens the same way, split by customer, with servers under each.
- **Export as CSV,** so the partner can bill every customer from their own ERPNext.

Partner-pays customers also show these invoices in the Invoices tab on their own page.

Customer-pays customers aren't listed, since the partner pays nothing for them. If there are
no Partner-pays customers, the page says so in one line and links to how billing modes work.

**Error paths**

- The month isn't closed yet: show it as "This month so far" and don't offer the export until
  the invoice is final.
- A customer moved between billing modes during the month: split their row by dates, so the
  amounts still add up to the invoice.
- The partner's invoice is unpaid: Billing flags it and names the customers whose sites are
  affected, since an unpaid invoice leads to suspension, lost MRR and then At risk.

## 4. Messages

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
| Brief reaches the partner                           | Open                             |
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

- **What it asked about:** the brief, its industry, and the Starter Pack, if it picked one.

**Only Connect briefs are leads here.** A lead Frappe passes on, or one the firm finds itself,
isn't on Connect: that business has no reason to sign up just to message the partner. The firm
works it in its own CRM, and Connect sees it once it links through the partner code, as a
customer.

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

## 5. Team

Everyone at the firm in one list: who counts toward the consultants criterion, and who can
sign in to Connect with what role. It's a page, not part of the Settings
dialog, because adding a colleague is one task whether they need a certificate, access, or
both. A person doesn't need Connect access to be listed: a consultant can count toward tier
without ever signing in.

**List:** name, email, certifications (ERPNext, Framework, or a single module), status and
expiry. A column says whether each person counts toward tier, so a single-module certificate
reads as "Doesn't count toward tier" rather than looking like a missing one. The count lives on
Partnership, not here: the rows already say who counts.

**Access and roles** are columns on the same rows: No access, or one or more of Owner, Sales
and Finance. Inviting someone sets their access and roles. Ownership can be handed to someone
else, and the last owner can't be removed.

**Roles:**

Every person has at least one role, as on Frappe Cloud's team page. Member is view-only, for
consultants who count toward tier but don't work leads or money. Team has two tabs, People
and Roles, like Frappe Cloud's.

| Action                                                | Owner | Sales | Finance | Member |
| ----------------------------------------------------- | ----- | ----- | ------- | ------ |
| See Partnership, Team, Profile, Resources             | Yes   | Yes   | Yes     | Yes    |
| See Invoices, All customers                           | Yes   | No    | Yes     | No     |
| See Customers                                         | Yes   | Yes   | Yes     | No     |
| Add customers and notes                               | Yes   | Yes   | No      | No     |
| See a customer's invoices                             | Yes   | No    | Yes     | No     |
| Approve or decline link requests                      | Yes   | No    | No      | No     |
| See and export Invoices, Paid by you                  | Yes   | No    | Yes     | No     |
| Reply to leads, send quotes, change lead stages       | Yes   | Yes   | No      | No     |
| Request an audit                                      | Yes   | No    | No      | No     |
| Edit the profile                                      | Yes   | No    | No      | No     |
| Invite people, change roles, link certificates        | Yes   | No    | No      | No     |
| Open Settings                                         | Yes   | No    | No      | No     |

**Certifications.** Employees apply for and take their exams on their own, on Frappe School.
Connect doesn't apply, pay or reimburse. The partner only **links a certificate** to the firm:
enter the certificate ID, or the email the person took the exam with, and Connect shows the
match (name, certification, date) before saving. That lists the person as certified. The
public profile shows the firm's certifications as a count.

**Certification statuses:** Certified, Expiring (within 60 days, with a Team badge), Expired,
and Not certified. When a certificate is renewed on Frappe School, the owner links the new one
and the row returns to Certified.

**Error paths**

- No certificate matches the ID or email: say so, and keep what was typed.
- The certificate is already counted by another partner: don't link it, and point to the
  partner manager.
- The name on the certificate differs from the team member's: show both and ask to confirm.
- A consultant leaves or a certificate expires: the row moves to Expired or is removed, and if
  that drops the count below the current tier's threshold, Partnership shows At risk and links
  here.

## 6. Profile

The partner edits their **own directory page**, laid out as a business sees it (reusing
`PartnerProfilePage`), with an Edit control on each section. Edits are not done in a separate
form.

| Publishes instantly                                       | Goes to Frappe for review                 | Read-only in Connect      |
| --------------------------------------------------------- | ----------------------------------------- | ------------------------- |
| Logo, tagline, about, website, address, contacts          | Client logos                              | Tier and PMM              |
| Industries, regions, work style                           | Quoted figures and claims ("200+ live customers") | Certification count |
| Deal sizes taken, and whether they're taking work this quarter |                                      | Reviews and ratings       |
| Pricing, media gallery                                    |                                           | Case studies (submitted on frappe.io) |

**Case studies are submitted on frappe.io, not in Connect.** The profile shows them as they
appear in the directory, with a link to submit or change them there.

**Media.** Assume partners will upload poor images and video, and poor logos of their own
customers. The editor helps fix them at upload, before anything is saved:

- **Client logos:** enter the customer's website and Connect fetches its logo, so the partner
  doesn't have to find a file. Uploads get the background removed and are shown at one height
  and in one tone on the page, so a mixed set still reads as one row. A logo too small or
  blurry to show cleanly is flagged with what's wrong ("Too small: use at least 200 px wide").
- **Photos:** crop to the shapes the page uses, with the crop shown on the actual card. Low
  resolution is flagged. Large files are compressed without asking.
- **Video:** pick the cover frame by scrubbing, and compress. No trimming: a length limit,
  stated on the upload, does that job.
- **Preview:** every change shows on the page as a business will see it before saving.
- Client logos still go to Frappe for review, which also catches what the checks miss.

Deal sizes and capacity come from the gap that DESIGN-NOTES already names. They are what lets
a business's budget actually narrow who receives a brief.

**Review flow (happy path):** edit client logos or a claim → Submit for review → the section
shows "In review" while the directory keeps the live version → Frappe approves it → it goes
live and the owner gets a notice.

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
  link. Bronze makes the same page public, so reaching Bronze first prompts the owner to check
  the page before it goes live.

## 7. Resources

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

## 8. Settings

A `SettingsDialog`, opened from the account menu. Owner only. It holds CRM sync; users and
roles live on Team.

**CRM sync.** Connect the firm's CRM so lead stages stay in one place:

- **Connect:** pick the CRM, enter its site URL and API key, then check the mapping of its lead
  statuses to the PRM stages. For Frappe CRM and ERPNext the mapping comes prefilled. It can be
  changed later.
- **What syncs:** Connect pushes a lead once the business is named, so an anonymous brief stays
  in Connect. Stage changes come back from the CRM. Won from the partner code link always
  wins over a CRM status.
- **Status:** connected, with the last sync time, or paused with the reason.

**Leaving the partnership.** The last row in Settings. Leaving removes everything: customer
links, the partner code, the listing and open leads. Partners usually have contracts with
customers, so Connect doesn't let them leave with work still open. Leave the partnership
first shows what has to be wrapped up:

- Customers still linked: each is unlinked, or handed over to another partner by the customer.
- Partner-pays customers: switched back to Customer pays first, so no customer is left unbilled.
- Open leads: closed with a reason.
- Projects through Connect still running.

Once the list is empty, the owner confirms, and the agreement ends. The listing comes down and
the partner code stops working.

**Error paths**

- The URL or key is wrong: say which, and don't save the connection.
- A CRM status has no mapping: leads in it keep their last Connect stage, and the sync row
  says how many are unmapped.
- The CRM stops responding: sync pauses, the last sync time stays visible, and stages set in
  Connect keep working.

## 9. Flows

Who acts is in brackets. *Outside* means the step happens outside Connect.

**Working in Connect**

1. **Beginner to Bronze** (Owner): Partnership milestones → an employee certifies on Frappe
   School (*outside*) → link the certificate on Team → share the partner code → approve the
   link request on Customers → $100 and $300 tick on Partnership → request the audit → Bronze
   → check the profile before it goes public → one-time notice that the landing changes.
2. **Lead to customer** (Sales): brief in "Needs reply" → reply, send a quote → shortlisted →
   hired, Won → customer on Customers as Onboarding → Live. Not chosen → Lost, "Lost to
   competitor", thread kept read-only.
3. **Link an own customer** (Owner, Sales): add the customer → share the partner code ("Code
   shared on" shows) → customer enters it in Frappe Cloud (*outside*) → link request, matched
   to the customer added by hand → Owner approves, with undo → Customer pays, first site → Live.
   Decline → request removed, customer told.
4. **Edit the profile** (Owner): plain details go live at once. Client logos or a claim →
   Submit for review → In review → approved, live. Rejected → reason on the section, draft
   kept. Case studies → frappe.io (*outside*).
5. **Recover from At risk** (Owner): consultant leaves or the 3-month MRR average drops →
   banner and email → Partnership names the criterion and review date → fix it on Team or
   Customers → clears at the next sync. Still below at the quarter's review → the tier drops.
6. **Connect a CRM** (Owner): Settings → CRM sync → URL and API key → check the prefilled
   mapping → connected, with the last sync time → leads show "Synced from CRM".

**Working with Frappe**

- **A. Becoming a partner:** see Onboarding.
- **B. Certifications** (Employee, Owner): the employee applies, pays and passes on Frappe
  School (*outside*) → the owner links the certificate → certified, and the public count goes
  up. A single-module certificate shows "Doesn't count toward tier". One already counted by
  another partner → the partner manager. Expiring → Team badge → renewed on Frappe School → the
  owner links the new one.
- **C. Moving up a tier** (Owner, Frappe): start-by date shows → request the audit →
  "Waiting for Frappe to schedule it" → scheduled, with an email → audit → PMM level recorded →
  new tier, discount from the next invoice, listing updates. Declined or deferred → reason
  shown, request later. PMM met but another criterion slipped → tier holds, gap named.
- **D. Slipping a tier** (Owner, Frappe): see the proposed rule under Partnership.
- **E. Profile review** (Owner, Frappe): client logos and claims, as in flow 4. Case studies
  are reviewed on frappe.io.
- **F. A lead passed by Frappe:** not on Connect. Frappe passes it outside Connect and the firm
  works it in its CRM; it appears here only once it links as a customer.
- **G. Disputing a figure** (Owner): figure looks wrong → email the partner manager, with the
  partner code, the figure and the month (*outside*) → Frappe corrects it → the figure updates with a new
  sync time.
- **H. Monthly billing** (Frappe, Finance): month closes → Frappe Cloud invoices the partner
  for Partner-pays customers, minus the tier discount → Billing marks the month final →
  export → bill customers from ERPNext (*outside*). Unpaid → Billing flags it and names the
  affected customers.

**Flows still missing**

- Frappe changing the rubric: waits on open question 17.

Covered elsewhere: switching to Partner pays (Customers), handing over ownership (Team),
re-auditing Gold (the audit block), leaving the partnership (Settings).

## Review findings

From two reviews (the sitemap and the partner–Frappe flows). Applied ones are in the
sections above. These are left open:

- **Audit mechanics in the PMM row** rather than a separate block. Not decided.
- **Handing a passed lead back to Frappe.** Left out by decision.

## Open questions for Frappe

1. **Losing a tier.** Frappe has no rule yet. Confirm or replace the one proposed under
   Partnership (3-month average, quarterly review, 60 days to replace a consultant).
2. **Removed.** Partner managers are answered: no rule for who handles what.
3. **Audit lead time.** The Bronze doc says 30 days, the Silver and Gold docs 60.
4. **Roles.** Do Owner, Sales and Finance match how partner firms work?
5. **Reviews.** Can a partner reply publicly to a review?
6. **Review time.** How long does a review of client logos or claims take? It goes in the
   "In review" copy.
7. **The PRM portal.** Frappe already runs one: Partnerships > Overview, Contributions (linked
   customers' invoices and plans), leads and certified members. Does Connect replace it? If
   it does, what the portal does today is the minimum this view must cover.
8. **Switching to Partner pays.** The plan proposes the owner starts it and the customer
   confirms in Frappe Cloud. Confirm, or say how it works today.
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
15. **Gold re-audits.** Gold is re-audited to keep it. How often? Are Bronze and Silver
    re-audited too?
16. **Being removed.** Leaving is designed (Settings). If Frappe removes a partner instead,
    do the same wrap-up rules apply?
17. **Changing the rubric.** When Frappe changes the thresholds, how much notice do partners
    get? Partnership would show the new figure and the date it applies from.
