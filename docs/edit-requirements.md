# Editing sent requirements

Agreed 2026-11-12. Not built yet. Run the flow-first skill on this flow before building it.

Requirements are a snapshot: what partners quoted against. Today they can only be edited as a draft. This lets a business change them after sending, without losing what each quote answered.

## Terms and controls

- One word, "Requirements", for everything a business sends: the written text and the picked values. The product already says "Send requirements". "Brief" is retired as a label, including the partner side panel's field.
- In a thread, two buttons labeled "Requirements", both with the `lucide-file-text` icon: a ghost one in the business thread header (beside View profile, hidden below `lg`), and a subtle one under each requirements message. Both open one dialog, titled "Requirements" ("Your requirements" for the business). The dialog's sections are Description, Modules, How you run today, What you want fixed, and Looking for. Opened from under a message, Description is left out, since it's that message's own text. Opened from the header, it comes first.
- On the partner Lead page, the side panel's Project section lists every short fact once (modules, budget, timeline, industry, size), then a "View requirements" link. The dialog there leaves out the facts and modules and holds only the written parts: description, how they run today, what they want fixed, looking for.

## Scope of an edit

- An edit always changes the project's requirements, for every partner who has them. There is no "this partner only" option; anything for one partner goes as a message in that thread.
- The editor says so before saving: "Goes to all 6 partners who have these requirements. Partners who quoted will be asked to confirm or update their quote." The save button reads "Send to 6 partners", using the real count. No confirmation dialog after.
- Recipients: every partner with the requirements (no reply yet, quoted, Interested) and partners who declined. Not partners the business marked Not interested.
- Fields: project fields only — the written text, modules, budget, timeline, who they're looking for. Company facts (size, how they run today, what they want fixed) stay in Settings and aren't edited here.
- One editor: the same dialog as today's "Edit draft". Opened from the Requirements dialog in any thread, and from the project page. Only the notice and save label change once the requirements have been sent.

## In the thread

- Each save adds two things to the thread:
  - An event line, centered and gray like the thread's other events: "Requirements updated · Changed: description, budget, timeline · Nov 14". The business sees "You updated the requirements · …". Changes are named as short nouns (description, modules, budget, timeline, looking for), so the line stays one line on desktop. At 375px it wraps between whole items, never mid-word.
  - A requirements card from the business, the same shape as the original: the new description in full, a Requirements button, and the two quote buttons on the partner side.
- The written text is called "description" wherever a change is named. In the dialog its heading is "Description", not "What you need built".
- Description changes are marked in place on the card, always on, with no toggle: added words tinted, removed words struck through. Markers stay on that card for good; they describe the change from the previous version.
  - When most of the description changed (start at more than half the words), the card shows the new text clean, and the event line says "Description rewritten" instead of listing it under "Changed:".
  - "Copy text" and the reply-quote action take the clean new text, without removed words.
- The original requirements message stays as it was. Saves are never merged; each is its own message.
- Each Requirements button opens the version its message carried. The header Requirements button and the partner panel's link open the latest version.
- The dialog opened from an update card leaves out the description (it's the card's text) and marks changed picked values: the old value struck through in gray, then the new value. No badges. A screen reader hears the new value first, then hidden text: "Budget: ₹15 to 25 lakh, was ₹5 to 15 lakh". The header button and panel link show the latest version with no markers.
- Broadcast threads stay anonymous: the update carries no company details until the business marks the partner Interested.

## Quotes

- After any edit, every existing quote shows "Quoted before the requirements changed" until its partner acts. No rule decides which fields count; the partner judges whether the change affects their price.
- The partner responds on the update message with two subtle buttons: "Send new quote" or "Quote still stands". "Quote still stands" confirms the figure against the new version and clears the flag.
- A later edit flags confirmed quotes again, the same way.
- A new quote marks the old card "Replaced". Compare quotes shows each partner's latest quote only.
- The business sees the flag on the quote card and in Compare quotes, not in the inbox list.
- The business can still mark a flagged quote Interested, or hire on it. It isn't blocked.
- Partners notice an update like any new message (unread thread, notification). Their Leads list row shows "Requirements updated" until they respond.

## Project page

- Shows the current requirements with an "Updated Nov 12" line. Version history lives in the threads.

## Locks

- While a hire request is pending, Edit stays available. The editor adds "Saving withdraws your hire request to Promantia.", and the save button becomes "Withdraw request and send". Withdrawal and edit happen together on save; closing the editor changes nothing. The partner's thread shows "Hire request withdrawn", then "Requirements updated".
- After hire, editing is locked. The Requirements dialog has no Edit button, and a one-line note says "Hired. Changes go through Promantia now".

## Feedback

- After saving, one optional question: "What made you change it?" — A partner asked / Our needs changed / Fixing a mistake / Other. Skippable, never blocking.

## Out of scope

- Editing for one partner only. The feedback answers above can justify it later.
- Change requests after hire.
