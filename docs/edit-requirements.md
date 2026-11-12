# Editing sent requirements

Agreed 2026-11-12. Sitemap and flow approved the same day (flow-first). Built 2026-11-12.

Requirements are a snapshot: what partners quoted against. Today they can only be edited as a draft. This lets a business change them after sending, without losing what each quote answered.

## Terms and controls

- One word, "Requirements", for everything a business sends: the written text and the picked values. The product already says "Send requirements". "Brief" is retired as a label, including the partner side panel's field.
- In a thread, two buttons labeled "Requirements", both with the `lucide-file-text` icon: a subtle one in the business thread header (hidden below `lg`), and a subtle one under each requirements message. Both open one dialog, titled "Requirements" ("Your requirements" for the business). The dialog's sections are Description, Modules, How you run today, What you want fixed, and Looking for. Opened from under a message, Description is left out, since it's that message's own text. Opened from the header, it comes first.
- On the partner Lead page, the side panel's Project section lists every short fact once (modules, budget, timeline, industry, size), then a "View requirements" link. The dialog there leaves out the facts and modules and holds only the written parts: description, how they run today, what they want fixed, looking for.

## Scope of an edit

- An edit always changes the project's requirements, for every partner who has them. There is no "this partner only" option; anything for one partner goes as a message in that thread.
- The editor says so before saving: "Goes to all 6 partners who have these requirements. Partners who quoted will be asked to confirm or update their quote." The save button reads "Send to 6 partners", using the real count. No confirmation dialog after.
- Recipients: every partner with the requirements (no reply yet, quoted, Interested) and partners who declined. Not partners the business marked Not interested.
- Fields: project fields only — the written text, budget, timeline, who they're looking for. Modules aren't editable yet: the app has no modules picker. Company facts (size, how they run today, what they want fixed) stay in Settings and aren't edited here.
- The editor is its own Edit requirements dialog with the same fields a draft edits on its page (budget, description, criteria chips). Today's "Edit draft" dialog edits the name and company answers, so it isn't reused. Opened from the Requirements dialog in a thread, and from the project page's ⋯ menu or Requirements dialog.

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
- The business sees the flag on the quote card and in Compare quotes, not in the inbox list. Compare quotes uses a short badge beside the city, "Quoted before the update".
- The business can still mark a flagged quote Interested, or hire on it. It isn't blocked.
- Partners notice an update like any new message (unread thread, notification). Their Leads list row shows a "Requirements updated" badge beside the lead's name until they respond.

## Project page

- Shows the current requirements with an "Updated Nov 12" line. Version history lives in the threads.
- The ⋯ menu's "Edit draft" reads "Edit requirements" once the requirements have been sent.

## After saving

- From a thread: the business lands back in that thread, scrolled to the new update card, with a toast "Sent to 6 partners".
- From the project page: they stay on it, and the "Updated" line changes.
- Nothing changed: Send closes the editor and posts nothing.
- Send fails: the editor stays open with the edits kept, and an inline error. Closing without saving sends nothing and leaves any hire request as it was.

## Partner responses

- "Quote still stands": one click. The flag clears, the partner's thread shows "You confirmed your quote · Nov 14", and the business's thread shows "Tridots confirmed their quote".
- "Send new quote" opens a new Send quote dialog: price, weeks and a note, prefilled from the old quote. The prototype has no quote composer today, so this is the one new screen. On send: a new quote card, the old one marked "Replaced", and the Leads list badge clears. If sending fails, the dialog stays open with the values kept.
- A partner with no quote yet (or who declined) gets the update card without the quote buttons, and can reply as usual.
- Another edit before a partner responds: the flag stays, and the quote buttons move to the newest update card.

## Locks

- While a hire request is pending, Edit stays available. A hire request comes from the partner and waits on the business, so saving declines it: the editor adds "Saving declines Promantia's hire request. They can send a new one.", and the save button becomes "Decline request and send". Closing the editor changes nothing. The thread shows the declined request, then "Requirements updated".
- After hire, editing is locked. The Requirements dialog has no Edit button, and a one-line note says "Hired. Changes go through Promantia now".

## Feedback

- After saving, one optional question: "What made you change it?" — A partner asked / Our needs changed / Fixing a mistake / Other. Shown once as a row under the business's own event line in the thread, not a dialog. It goes away when answered or dismissed and never blocks the next step.

## Out of scope

- Editing for one partner only. The feedback answers above can justify it later.
- Change requests after hire.
