# Partner view — plan

The partner side today is one screen, Messages. This plan grows it into a small PRM with four
areas: **Partnership**, **Customers**, **Messages** and **Profile**. Each area answers one
question a partner comes back with:

| Rail item   | The partner's question                                   |
| ----------- | -------------------------------------------------------- |
| Partnership | Where do we stand with Frappe, and what gets us up a tier? |
| Customers   | Who are we working with, and what does each one bring in? |
| Messages    | Which businesses are waiting on a reply from us?          |
| Profile     | What does a business see when it finds us?               |

Partnership is the landing screen. A partner opens the app most often to check their standing,
and every other area feeds into it: customers make up MRR, and the profile is what the tier
earns in the directory.

## The tier rubric (from frappe.io/partners/plans)

| Tier     | Frappe Cloud MRR    | Certified consultants | PMM | FC discount | Listing                     |
| -------- | ------------------- | --------------------- | --- | ----------- | --------------------------- |
| Entry    | ₹10,000 / $100      | 2                     | —   | 10%         | Name and location only      |
| Emerging | ₹30,000 / $350      | 2                     | —   | 10%         | Name and location only      |
| Bronze   | ₹63,000 / $750      | 2                     | 3   | 15%         | Full profile, large card    |
| Silver   | ₹2,50,000 / $3,150  | 3                     | 4   | 20%         | Full profile                |
| Gold     | ₹6,30,000 / $7,500  | 4                     | 5   | 25%         | Full profile, top of list   |

Every tier also needs a registered company and a Frappe Cloud account billing at least $100 a
month. MRR counts both direct and indirect billing. A consultant counts only with a full
ERPNext or Framework certification, not a single-module one. An upgrade needs a PMM audit
started ahead of time: 30 days for Bronze, 60 for Silver and Gold. Entry and Emerging tiers
end on **31 Mar 2027**. A partner still below Bronze then gets a "Frappe Beginner" tag and
drops out of the directory.

⚠️ The prototype knows only gold, silver and bronze (`data/partners.js`, `TierIcon.vue`), and
PMM is derived from tier there. Entry and Emerging need to be added, and PMM needs to become
its own field, since it is a criterion with its own audit and not a label for the tier.

## 1. Partnership

**What's on it.** The current tier with its benefits (discount, listing type). Then one row
per criterion for the **next** tier: MRR, certified consultants, PMM level and eligibility.
Each row shows where the partner is, the threshold, and the gap ("₹41,000 more MRR"). Each
row also names its source and how fresh it is: MRR from Frappe Cloud billing, consultants from
certification, PMM from the last audit.

**States.** The screen shows one of these at a time:

- **Working toward the next tier.** The default.
- **Ready for an audit.** Every criterion except PMM is met. Show the button to request a PMM
  audit, with the date it needs to start by.
- **Audit in progress.** Show the audit date and auditor, and say what the partner needs to
  prepare.
- **At risk.** A criterion for the *current* tier has dropped below its threshold: MRR below
  the floor, or a certified consultant who left or whose certificate lapsed. Name the
  criterion, and show the date of the next review if there is one.
- **Deadline (Entry and Emerging only).** A banner with the days left until 31 Mar 2027, and
  what is missing to reach Bronze.

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

**Customer detail page**

- **Header:** company, contact, billing mode, stage, MRR contribution.
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

This exists already and stays business-only. Every thread is a lead.

**Leads, not a pipeline.** Most partners already run a CRM, so Connect doesn't copy the PRM
portal's sales stages (Qualification, Follow Up, Demo, Proposal). It records only what Frappe
needs back from a lead:

- **Source:** a brief through Connect, or a lead passed on by Frappe. Passed leads arrive with
  the business named from the start, and show the Frappe person who passed them on.
- **Outcome:** Open, Won or Lost. Won moves the business into Customers. Lost asks for a
  reason, from the PRM portal's list ("Lost to competitor" and the rest).
- **What it asked about:** the brief, its industry, and the Starter Pack, if it picked one.

Leads a partner finds on their own stay in their CRM. Connect sees them only once they link
through the partner code, as customers.

The other changes:

- Once a thread is won, the sidebar links to its customer record.
- **Error paths to design:** a message fails to send (keep the draft and offer a retry); the
  business hires someone else or withdraws the brief (the lead closes as Lost with that reason,
  and the thread stays as a read-only record of the bid); a quote is sent after the brief
  closed (block it and explain).
- **Empty state:** a new partner with no briefs yet. Say what makes a brief reach them: their
  regions and industries, and the deal sizes and capacity on their profile.

## 4. Profile

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
- Entry and Emerging: their listing shows name and location only. The editor shows the other
  sections dimmed, with "Shown from Bronze", so the work isn't wasted and the reward is
  visible.

## Open questions for Frappe

1. **Losing a tier.** Is there a grace period or a review date, or does the tier drop as soon
   as MRR does? The At risk state depends on the answer.
2. **MRR window.** Is it the current month, or a trailing average? This decides whether one
   bad month means At risk.
3. **Audit lead time.** The Bronze doc says 30 days, the Silver and Gold docs 60. The Bronze
   doc also says PMM 3 lists a partner as "Emerging", which conflicts with the plans table.
4. **Team permissions.** Can anyone at the partner firm edit the profile and request audits,
   or only an admin?
5. **Reviews.** Can a partner reply publicly to a review?
6. **Review time.** How long does a profile review take? It goes in the "In review" copy.
7. **The PRM portal.** Frappe already runs one: Partnerships > Overview, Contributions (linked
   customers' invoices and plans), leads and certified members. Does Connect replace it? If
   it does, what the portal does today is the minimum this view must cover.
8. **Switching to Partner pays.** Who starts it, the partner or the customer, and does the
   customer have to confirm in Frappe Cloud?
