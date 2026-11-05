# Frappe Connect — design handoff mock

A running prototype of Frappe Connect, both sides of it. **Businesses** find a Frappe
implementation partner or a Starter Pack, sign up, pay, and track the implementation.
**Partners** work their leads and customers, see where they stand with Frappe, and
manage their listing.

This is a **reference for implementation**, not the implementation. There's no backend,
no auth, and no Frappe app scaffolding — the point is that the interactions, states, and
copy are settled before anyone wires them to real doctypes.

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## The flow

### frappe.io (stand-ins for the marketing site)

| Route       | What it is                                                         | Build it?                      |
| ----------- | ------------------------------------------------------------------ | ------------------------------ |
| `/contact`  | `frappe.io/contact`, where most implementation leads arrive. `/` lands here | **No**, the real page exists |
| `/partners` | `frappe.io/partners`, where a business discovers Connect           | **No**, the real page exists   |

### Business side

| Route                          | What it is                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- |
| `/connect`                     | Home: the 3-question qualifier signed out, a dashboard signed in           |
| `/connect/recommendation`      | What the answers add up to: packs to tick, total and pay for               |
| `/connect/packs`               | The Starter Pack catalogue; `/connect/packs/:id` is a pack's scope and terms |
| `/connect/packs/cart`          | The basket, before paying                                                  |
| `/connect/checkout`            | The payment processor's page. Signed in only; `/checkout/paid` confirms it |
| `/connect/partners`            | The filtered partner list; `/connect/partners/:id` is a partner's profile  |
| `/connect/partners/contact`    | One brief sent to every partner that matches                               |
| `/connect/requirements-sent`   | The receipt for that brief: who it went to                                 |
| `/connect/partners/saved`      | Partners the account has saved                                             |
| `/connect/login`, `/connect/signup` | Log in and sign up. Gated controls land here with `?next=` back to themselves |
| `/connect/*/verify`            | The 6-digit code both forms hand off to                                    |
| `/connect/messages`            | The inbox. `?thread=` names the open conversation                          |
| `/connect/projects`            | Implementation: everything the account is tracking; `/:id` is one project  |

### Partner side

Switch to it from the Demo menu. Every partner route puts the demo on the partner side
if you land on it directly.

| Route                      | What it is                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| `/connect/leads`           | Connect briefs as a list; `/connect/leads/:id` is one lead       |
| `/connect/customers`       | The partner's customers and their MRR; `/:id` is one customer    |
| `/connect/partnership`     | Where the firm stands with Frappe: next-tier criteria, audit, certified consultants |
| `/connect/profile`         | The firm's own directory listing                                  |
| `/connect/invoices`        | Frappe Cloud invoices behind the firm's MRR                       |
| `/connect/resources`       | What Frappe gives partners to sell and deliver with, linked out    |

The frappe.io pages are deliberately light stand-ins. They're here so the entry point
isn't imaginary — you can see what a business was looking at when they clicked through. It's styled to
read as _website_ rather than _app_ (serif headline, wide measure, no rail).

**"Find a partner" opens Connect in a new tab.** That's why it's a plain anchor with
`target="_blank"`, not a `RouterLink` — Connect is a separate destination, not a section
of the marketing site.

**Live:** <https://pragati-k-13.github.io/frappe-connect-prototype/>

## ⚠️ Most of the content is placeholder data

The thirteen partners are real companies with real logos. Almost everything attached to
them is invented: hourly rates, star ratings, review text and reviewers, partner tiers,
case studies and the clients they name, marketplace apps, vision quotes and their
authors, street addresses, founding years and founding stories, and several of the
profile stats.

Each one is flagged where it lives, in `src/data/`. **Nothing in this repo should be read
as fact about those companies.**

Beyond that:

- **State is in-memory.** A refresh resets the quiz — deliberate, so the flow is easy to
  re-run while reviewing.
- **Two demo projects are seeded.** Switching to "Ongoing project" loads a Starter Pack
  and a piece of custom work. Everything attached to them is invented; the partners are
  real firms and none of them is running any of this.
- **The partner side is two firms.** "Bronze and up" is Software@Work, a real partner
  shown at Silver; "Beginner" is a made-up firm, so no real partner is shown below the
  tier it holds. MRR, invoices, audits and certificates are all invented.
- **Counts don't reconcile with the list.** The map and chips show the directory's real
  figures (156 partners); the list is seeded with thirteen representative ones. The map
  and the chips do agree with each other — both read `REGIONS`.
- **Log in and sign up work.** Both take an email and a 6-digit code; there's no auth
  behind them, just the state change. Contact and Save send you there first when you're
  signed out, and finish what you started once you're in.
- **Payment is a mock of the processor's page.** Paying creates the project and its
  conversation; no money or card details go anywhere.
- **Some controls show placement only.** They're listed under Not built yet below; each
  one either names itself in a toast or does nothing.

## Where the reasoning lives

|                                          |                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [DESIGN-NOTES.md](DESIGN-NOTES.md)       | Every screen decision: what it was, what it replaced, what was measured to settle it                    |
| [FRAPPE-UI-NOTES.md](FRAPPE-UI-NOTES.md) | Library traps that aren't specific to Connect — mostly classes that compile to nothing without erroring |
| [PARTNER-VIEW-PLAN.md](PARTNER-VIEW-PLAN.md) | The partner side: screens, roles, and what each role can see and do                                  |

Both were part of this README until it reached fifty minutes of reading on the front page
of the repo.

## Layout

```
src/
  pages/          one file per route; business, partner and frappe.io screens
  components/     ConnectShell (sidebar, top bar, docked panel), shared dialogs,
                  partner-profile sections, pack and project pieces;
                  settings/ (the settings dialog), icons/
  data/           placeholder data, one file per area (partners, packs, project,
                  messages, partnership, …) — every invented figure is flagged
  stores/         connect.js (answers, account, demo state),
                  partnerAccount.js (the partner firm's team and edits)
  utils/          auth gate and contact flow
  composables/    shared logic
  assets/         maps, tier badges, logos, PLACEHOLDER profile art (see scripts/)
scripts/          placeholder-asset generators — delete once real art lands
```

## Not built yet

Scoped out of this pass, in rough order. Where a control exists for one of these, it
names itself in a toast rather than swallowing the click.

1. **Partner onboarding.** Applying to be a partner, the application's status, the
   agreement and linking Frappe Cloud are planned (PARTNER-VIEW-PLAN.md §0) but have no
   screens. "Become a partner" on the frappe.io page is disabled rather than pointing
   somewhere that would have to be invented.
2. **Gating the estimator on a project.** "Estimate quote" on a partner's pricing is open
   to everyone. It's meant to show only once `store.hasProject` is true
   (`PartnerPricingSection.vue`).
3. **Reviews beyond the profile.** No all-reviews screen, no reviews by tag, and no way
   to write one. "View all" is inert; the other two are toasts.
4. **Invoices on the business side, and Frappe Cloud billing on the partner side.** A
   project's invoice download is a toast, since there's no invoice to render. "Open
   billing" on Invoices goes nowhere.
5. **Message extras.** Search in a conversation, reactions and per-message actions are
   toasts: a reaction needs somewhere to live and someone to read it, and the message
   menu's contents aren't decided.
6. **Settings beyond Profile and Company.** Preferences, Notifications and Users are
   built but hidden (`SHOW_ALL_TABS` in `AppSettingsDialog.vue`); Invite is inert, and
   "Team settings" in Company details is a toast.
7. **Search feedback and marketplace links.** "Share feedback" on the partner list is a
   toast, with no form behind it. "View" on a partner's marketplace apps would open
   Frappe Cloud's marketplace and is inert.
