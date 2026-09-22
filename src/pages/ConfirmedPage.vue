<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, ScrollArea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackPanel from '../components/PackPanel.vue'
import ProjectPartnerCard from '../components/ProjectPartnerCard.vue'
import IconSend from '~icons/lucide/send'
import IconFolderPlus from '~icons/lucide/folder-plus'
import IconMessage from '~icons/lucide/message-square'
import frappeMark from '../assets/frappe.svg'
import IconChevronRight from '~icons/lucide/chevron-right'
import { PARTNERS } from '../data/partners'
import { STARTER_PACKS, marketFor, DEFAULT_REGION } from '../data/packs'
import { projectName, stageOf } from '../data/project'
import { useConnectStore } from '../stores/connect'

// SCREEN — booked. The end of the journey, and the first place the model's
// promise is actually kept: Frappe said it would assign you a partner, and this
// names them.
//
// ⚠️ Both the pack and the PARTNER are in the URL, not just the store. Same
// reason as the confirmation screen before it: the store is in memory, and this
// is the screen someone screenshots, bookmarks or forwards. An assignment that
// changed on reload would be worse than one that was never shown.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const pack = computed(
  () => STARTER_PACKS.find((p) => p.value === (route.query.pack ?? store.pack)) ?? null,
)
const partner = computed(() => PARTNERS.find((p) => p.id === route.query.partner) ?? null)

const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)

watchEffect(() => {
  if (pack.value && store.pack !== pack.value.value) store.selectPack(pack.value.value)
})

// First name only — "Tridots will be in contact", not "Tridots Tech Pvt Ltd
// will be in contact". A sentence about a person you are about to meet.
const shortName = computed(() => partner.value?.name.split(' ')[0] ?? 'Your partner')

// ── The activity feed ──────────────────────────────────────────────────────
// ⚠️ Everything here ALREADY HAPPENED, and all of it happened at once: this is
// the receipt for the click on the screen before, not a live feed. It replaces
// a checklist of ticks that said the same three things without saying when.
//
// The stage is the project's own (`data/project.js`), not a CRM funnel: a
// business that just bought a pack is not a "Proposal".
// ⚠️ Looked up by the PARTNER AND THE PACK, both of which this screen already
// has in its URL — and the most recent match, not the first. Since the store
// went from one project to many, "the newest project in the list" would have
// been this screen describing whichever project happened to be created last,
// and "the first one with this partner" describes the OLDEST thing you ever
// bought from them. See `projectForBooking`.
const project = computed(() =>
  store.projectForBooking(route.query.partner, route.query.pack ?? store.pack),
)
// The stage is the project's own (`data/project.js`), not a CRM funnel: a
// business that just bought a pack is not a "Proposal". `stageOf` takes the
// SERVICE now, because the three services have different spines — booking a
// pack is always 'pack', which is what a URL-only arrival falls back to.
const stage = computed(() => stageOf(project.value?.service ?? 'pack', project.value?.stage))
const title = computed(() =>
  pack.value ? projectName(pack.value, store.company.name || store.viewer.company) : '',
)

// A URL-only arrival (a forwarded link, a reload) has no project behind it, so
// the feed times itself from the page rather than claiming a moment it cannot
// know.
const openedAt = Date.now()
const at = computed(() => project.value?.at ?? openedAt)

const since = (ms) => {
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Three entries, in the order they read rather than the order they fired —
// everything here happened in the same click. Each card carries something
// different: the mail that arrived, the thread you can open, and the project
// with its stage.
//
// ⚠️ "Introductory call requested" USED TO BE A FOURTH ENTRY and it was wrong
// on this screen, not merely surplus: the primary button six inches above it
// says "Request a slot". A history claiming you had already asked, over a
// control offering to ask, is the page disagreeing with itself. The call is
// requested from that button now, so the feed stops at what confirming did.
//
// ⚠️ Rows 2 and 3 happened WITHOUT anyone doing them. Confirming the pack
// posted the thread and opened the project; no one typed the message or filled
// in a form. The wording carries that (see the template) because the message
// body is written in the reader's own voice and they have never seen it.
const activity = computed(() => {
  if (!pack.value || !partner.value) return []
  return [
    {
      key: 'email',
      kind: 'email',
      // ⚠️ `updates@frappe.io` is INVENTED. Real domain, plausible mailbox,
      // and nobody here has checked that it exists — same class of invention as
      // the partner street addresses in `data/partners.js`, and it carries the
      // same warning. Replace with the address the product actually sends from.
      card: {
        kind: 'email',
        from: 'Frappe',
        address: 'updates@frappe.io',
        body: `Your ${pack.value.name} Starter Pack is confirmed. ${partner.value.name} will run the implementation and will be in touch.`,
      },
    },
    {
      key: 'details',
      kind: 'details',
      icon: IconSend,
      // The message's own first line, not a label naming it. "Manufacturing
      // Starter Pack" described the card; this is what was actually said, which
      // is the thing a reader is checking when they wonder what went out in
      // their name. It is the opening line of `bookingThread`.
      card: {
        kind: 'message',
        label: `Hi, we are looking at a ${pack.value.name} Starter Pack implementation for ERPNext. Could you take this on?`,
        to: { name: 'messages', query: { thread: partner.value.id } },
      },
    },
    {
      key: 'created',
      kind: 'created',
      icon: IconFolderPlus,
      card: { kind: 'project', label: title.value, badge: stage.value.label, view: 'project' },
    },
  ]
})

const toastOnce = (title, description) => toast.info(title, { id: 'confirmed', description })

// The project screen exists now, so this goes there. It used to raise a toast
// naming the gap — `Implementation` in the sidebar was the row holding its
// place, and both are wired up.
//
// ⚠️ Falls back to the index when there is no project behind the page, which is
// what a forwarded link or a reload leaves: `?pack=&partner=` renders this
// screen in full, but there is no project to open. The list is the honest
// destination — it says what you are tracking, which on that arrival is
// nothing.
const viewProject = () =>
  router.push(project.value ? `/connect/projects/${project.value.id}` : '/connect/projects')

// ⚠️ Still inert, and saying so. Cancelling a paid booking has terms behind it
// that nobody has written. A control that swallows a click reads as broken.
const cancel = () =>
  toastOnce('Cancelling is not built yet', 'This is where a booked pack would be called off.')
</script>

<template>
  <!-- ⚠️ `flush`, because the pack panel is part of the CHROME now rather than a
       card in the page: it runs the full height beside the content, with its own
       scroll, and the page scrolls under it. Same frame the messages screen
       uses, and the same reason. -->
  <ConnectShell flush root-label="Starter packs" root-to="/connect/packs" crumb="Confirmed">
    <div class="flex min-h-0 min-w-0 flex-1">
      <ScrollArea class="min-h-0 min-w-0 flex-1">
        <div class="w-full px-5 py-8 lg:px-8">
          <div v-if="!pack || !partner" class="py-20 text-center">
            <p class="text-p-lg font-medium text-ink-gray-8">Nothing to show here</p>
            <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
              This link doesn't name a booking. Start from the packs and this is where you'll land.
            </p>
            <Button class="mt-4" variant="solid" label="See the packs" :route="'/connect/packs'" />
          </div>

          <!-- ⚠️ Capped at 700px and centred in the column, rather than filling
               it. The pane already has a fixed 352px panel taking the right,
               so on a wide window the remaining column runs past 900px and the
               subtitle, the expertise line and the activity entries all become
               single lines of text stretched across it. `mx-auto` keeps the
               block off the panel's edge instead of leaving all the slack on
               one side. -->
          <div v-else class="mx-auto w-full max-w-[700px]">
            <!-- ⚠️ `text-2xl`, and no exclamation mark. The four screens of
                 this flow head themselves the same way now — the catalogue, the
                 pack, the checkout and this — and the last one was the only one
                 at `text-lg`, which read as a smaller moment than the pages
                 that led to it. The `!` was also the only one in the app's
                 voice; the sentence under it already says what happened, and a
                 receipt that congratulates itself is louder than the fact. -->
            <h1 class="text-2xl font-semibold text-ink-gray-8">Confirmed</h1>
            <!-- One sentence that states what happened, and stops.
               "Here is who you will work with" was the previous try: a pointer
               at the card, which made the line read as a caption waiting for a
               colon and left the card doing the sentence's work. This says both
               things itself — booked, and matched — and the card underneath
               answers the only question it leaves open, which is who.
               "Matched" is the verb the sign-up modal already uses. "Frappe has
               assigned you a partner" was an earlier try and reads like an
               allocation, a desk you were given. (The wireframe's original,
               "This will connect you with the ideal Partner for your needs",
               was future tense on a page that says the connecting is done.) -->
            <p class="mt-1 text-p-base text-ink-gray-6">
              Your {{ pack.name }} pack is booked and matched with a Partner.
            </p>

            <!-- Who you were matched with. Extracted to a component the moment
                 the project screen needed the same card — see
                 `ProjectPartnerCard` for why it departs from the listing row's
                 structure, and for the three facts it carries.

                 ⚠️ No `#actions` slot here. The card takes project-level
                 controls, and this screen is a receipt: what you bought, who
                 will build it, and where to follow it. Acting on the project
                 belongs to the project. -->
            <ProjectPartnerCard class="mt-4" :partner="partner" />

            <!-- ⚠️ NO "Request a slot" HERE ANY MORE. It was this screen's
               primary action, on the argument that the pack was paid for later
               and meeting the partner was the only thing left to do. The pack
               is paid for BEFORE this screen now, and the intro call is the
               project's business: `PACK_STAGES` opens on Confirmed with
               "Request an introductory call" as its first task, and the project
               screen and the partner panel both carry the control. A second
               entry point here asked for the same slot in a different place
               from the one that tracks it. -->
            <!-- ⚠️ A PRIMARY AGAIN. Removing "Request a slot" left `Cancel` as
                 the only button on the screen — a page whose single offered
                 action is to undo what just happened. What someone actually
                 wants next is the thing that now holds the work: the project,
                 where the first task is requesting that call. "Open project"
                 rather than "Track implementation" because the feed below
                 already calls it a project, and a flow should keep one word for
                 one thing. -->
            <div class="mt-4 flex items-center gap-2">
              <Button variant="solid" label="Open project" @click="viewProject" />
              <Button variant="subtle" label="Cancel" @click="cancel" />
            </div>

            <!-- ── What has happened ───────────────────────────────────────
               A feed, not a checklist. The ticks said the same three things
               without saying when, and without the project they belong to. -->
            <!-- ⚠️ `mt-14` (56px), against the 16px rhythm holding the block
                 above together. Everything up to the buttons is ONE thing —
                 what you booked, who you booked it with, and what you can do
                 about it — and the activity feed is the project's history,
                 which is a different subject with a different lifespan. At
                 `mt-8` the feed read as a fourth item in that block; the gap
                 has to be several times the internal one before it reads as a
                 break rather than as more spacing. -->
            <section class="mt-14">
              <h2 class="text-base font-medium text-ink-gray-8">Activity</h2>

              <ol class="mt-4">
                <li v-for="row in activity" :key="row.key" class="group relative flex gap-3 pb-5">
                  <!-- The connector, not a decoration: it is what makes three
                     entries read as one project's history rather than three
                     notices. Hidden on the last row, which has nothing to
                     connect to.

                     ⚠️ `bg-[var(--outline-gray-2)]`, NOT `bg-outline-gray-2`.
                     This line was invisible from the day it was written: the
                     `outline-*` scale is BORDER-ONLY, so `bg-outline-gray-2`
                     emits no rule at all and the span rendered transparent.
                     Exactly the trap already documented two screens down for
                     `decoration-outline-gray-3` — the class looks right, passes
                     the build, and silently does nothing. See
                     FRAPPE-UI-NOTES.md. -->
                  <span
                    class="absolute bottom-0 left-[11px] top-6 w-px bg-[var(--outline-gray-2)] group-last:hidden"
                    aria-hidden="true"
                  />

                  <!-- ⚠️ One 22px column for all three marks, so the connector
                       runs straight through them. The reference sizes its first
                       avatar larger, which puts a kink in the line — the column
                       is what makes these read as one history. -->
                  <Avatar
                    v-if="row.kind === 'email'"
                    class="relative z-10 mt-0.5 size-[22px]"
                    :image="frappeMark"
                    label="Frappe"
                  />
                  <span
                    v-else
                    class="relative z-10 mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full bg-surface-gray-2 text-ink-gray-6"
                  >
                    <component :is="row.icon" class="size-3.5" />
                  </span>

                  <div class="min-w-0 flex-1">
                    <!-- `gap-x-1.5` rather than spaces in the markup: Vue drops
                         the whitespace between two elements on their own lines,
                         which welded the separator to whichever lead happened
                         to end in a tag. -->
                    <!-- ⚠️ No lead line on the email, which is the one entry
                         that is a MESSAGE rather than an event. Its sender and
                         its time live inside the card, the way they do in any
                         mail client, so the shape itself says what kind of
                         thing it is. The other two are things the system did,
                         and a sentence is how you say that. -->
                    <p
                      v-if="row.kind !== 'email'"
                      class="flex flex-wrap items-baseline gap-x-1.5 text-p-base text-ink-gray-7"
                    >
                      <!-- ⚠️ "Your requirements WERE SENT", passive and
                           deliberately so. Nobody typed this message — booking
                           the pack posted it — and the body it links to opens
                           "Hi, we are looking at…", in the reader's own voice.
                           An active sentence here would hand them authorship of
                           words they have not seen. -->
                      <!-- ⚠️ "Messaging" is plain text now. It used to be a
                           link to the thread, which put two routes to the same
                           place one line apart — the word here, and the View on
                           the card directly below it. The card is the better
                           one: it shows you what you would be opening. The word
                           stays because it says WHERE the requirements went,
                           which is a fact worth having whether or not you go
                           and look. -->
                      <span v-if="row.kind === 'details'">
                        Your requirements were sent to {{ shortName }} via Messaging
                      </span>
                      <!-- ⚠️ Created AND confirmed in one line, because both
                           happened in the same instant. A separate "status
                           updated" entry would need a state to have moved FROM,
                           and a project that is Confirmed from birth never had
                           one — the badge on the card is the status, so the
                           line does not repeat it. -->
                      <span v-else>Project created and confirmed</span>
                      <span class="text-ink-gray-5">·</span>
                      <span class="text-ink-gray-5">{{ since(at) }}</span>
                    </p>

                    <!-- The thing the entry is about, carried as a card so the
                       feed can be read without opening anything and acted on
                       without leaving. -->
                    <!-- The email, rendered as mail: who it is from, the address
                         it came from, when it arrived, and the first line. -->
                    <div
                      v-if="row.card?.kind === 'email'"
                      class="rounded-5 border border-outline-gray-1 px-3 py-2"
                    >
                      <p class="flex items-baseline gap-2">
                        <span class="shrink-0 text-p-base font-medium text-ink-gray-8">
                          {{ row.card.from }}
                        </span>
                        <span class="min-w-0 flex-1 truncate text-p-sm text-ink-gray-5">
                          {{ row.card.address }}
                        </span>
                        <span class="shrink-0 text-p-sm text-ink-gray-5">{{ since(at) }}</span>
                      </p>
                      <p class="mt-1 truncate text-p-base text-ink-gray-6">{{ row.card.body }}</p>
                    </div>

                    <!-- Optional chaining and `v-else-if`, not `v-else`: an
                         entry without a card is a legitimate thing to add — a
                         one-line event with nothing to show — and this block
                         reads `row.card.kind` on its first line. -->
                    <div
                      v-else-if="row.card"
                      class="mt-2 flex items-center gap-3 rounded-5 border border-outline-gray-1 px-3 py-2"
                    >
                      <IconMessage
                        v-if="row.card.kind === 'message'"
                        class="size-4 shrink-0 text-ink-gray-5"
                      />
                      <!-- ⚠️ The badge belongs to the NAME, not to the row. At
                           the far end it sat beside View and read as a second
                           control — two things in the row's action corner, one
                           of which does nothing. Against the name it is what it
                           is: the state of the thing it is attached to, read in
                           one glance with what it describes. -->
                      <span class="flex min-w-0 flex-1 items-center gap-2">
                        <span class="min-w-0 truncate text-p-base text-ink-gray-7">
                          {{ row.card.label }}
                        </span>
                        <Badge
                          v-if="row.card.badge"
                          variant="subtle"
                          :theme="stage.theme"
                          size="sm"
                          :label="row.card.badge"
                          class="shrink-0"
                        />
                      </span>
                      <!-- ⚠️ Badge AND View, not one or the other. They were
                           mutually exclusive branches, which meant the project —
                           the entry with the most behind it — was the only card
                           you could not open. -->
                      <Button
                        v-if="row.card.to"
                        variant="ghost"
                        size="sm"
                        label="View"
                        :route="row.card.to"
                      >
                        <template #suffix><IconChevronRight class="size-4" /></template>
                      </Button>
                      <Button
                        v-else-if="row.card.view"
                        variant="ghost"
                        size="sm"
                        label="View"
                        @click="viewProject"
                      >
                        <template #suffix><IconChevronRight class="size-4" /></template>
                      </Button>
                    </div>
                  </div>
                </li>
              </ol>
            </section>

            <!-- Below `lg` the panel stacks under the page instead of beside it:
               a 352px column next to a 352px column is not a layout. `-mx-5`
               cancels the page padding so its own rules run edge to edge. -->
            <div class="-mx-5 mt-8 border-t border-outline-gray-1 lg:hidden">
              <PackPanel :pack="pack" :region="region" />
            </div>
          </div>
        </div>
      </ScrollArea>

      <aside
        v-if="pack && partner"
        class="hidden w-[352px] shrink-0 flex-col border-l border-outline-gray-1 lg:flex"
      >
        <ScrollArea class="min-h-0 flex-1">
          <PackPanel :pack="pack" :region="region" />
        </ScrollArea>
      </aside>
    </div>

  </ConnectShell>
</template>
