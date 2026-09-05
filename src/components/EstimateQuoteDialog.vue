<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Checkbox, Dialog, ScrollArea } from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. reka-ui is frappe-ui's own dialog dependency,
// not a new one. Same reasoning as `BookSlotDialog.vue`.
import { DialogDescription } from 'reka-ui'
import AppLogo from './AppLogo.vue'
import { APPS } from '../data/partners'
import { modulesFor } from '../data/modules'
import { contactToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

// "Estimate quote" — the action on the Pricing section's starter-pack card.
//
// The scope comes from the visitor's project (`store.project`), the rate comes
// from the partner, and this multiplies them. It quotes the STANDARD
// implementation of those modules — the fixed-scope version of the work, which
// is what the pack card it opens from is selling. Anything bespoke is the
// "Custom solutions" card next to it, and that one goes straight to a
// conversation with no figure attached.
//
// ONE LEVEL, deliberately. The panel used to drill from a module into its
// tasks, and the row carried a `# of tasks` count to advertise that there was
// something underneath. Both are gone. What this panel is for is the figure at
// the foot of it and the message that follows — a task list is the partner's
// job to write, and a count of tasks is a number nobody is comparing rows on.
// The module breakdown stays because it says what the hours are FOR; the level
// below it only said how the estimator happens to be assembled.
//
// Every row carries a checkbox and every row starts on. The estimate is a
// figure someone is about to take to a partner, and the scope it prices is the
// visitor's whole project — so the useful edit is "we're not doing that yet",
// made row by row, with the total moving as they go.
//
// ⚠️ The module and hour breakdown is invented — see `data/modules.js`.
const props = defineProps({
  open: { type: Boolean, default: false },
  partner: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const store = useConnectStore()

// Resolved through the router rather than written as a literal, so the href
// carries `BASE_URL` — under GitHub Pages the app lives at
// /frappe-connect-prototype/, and a hand-written "/connect#starter-packs"
// would 404 there. Computed once: neither the route nor the base moves.
const router = useRouter()
const packsHref = router.resolve({ name: 'connect', hash: '#starter-packs' }).href

// Table metrics, spelled out once because they're a spec rather than a taste.
//
// A cell carries 8px left/right and 6px top/bottom, plus the 2px per side that
// a `<tr>` would carry if CSS tables didn't ignore padding on a row.
//
// ⚠️ The OUTERMOST edges are zeroed, and the table no longer bleeds out of the
// panel's 20px padding. Those two facts are one decision: the row rules have to
// stop where every other element on the panel starts, and a divider can only do
// that if the table it belongs to ends there too. Previously the table bled
// 12px each way and the outer cells paid it back as padding — the text landed
// in the right place, but the rules ran 12px past it into the panel's margin.
//
// What the bleed bought was room for a hover fill to sit around the text rather
// than against it. There is no row fill any more, so it bought nothing.
const CELL = 'px-2 py-2 first:pl-0 last:pr-0'

// `sticky` and the background go on the `th` cells, not on `thead` or its `tr`:
// a sticky `thead` positions, but its background doesn't paint, and the rows
// scroll straight through the header text.
//
// `z-20` beats `AppLogo`'s `z-10` (see that file for why the mark is raised at
// all), which would otherwise paint over the header.
//
// The rule under it is an inset shadow, not `border-b`: in a `border-collapse`
// table the collapsed border belongs to the table, so it stays behind and
// scrolls away while the cell sticks. A shadow paints with the cell.
//
// `bg-surface-elevation-1` is the Dialog panel's own background. There is no
// `surface-modal` token — that class renders nothing.
const HEAD =
  `sticky top-0 z-20 bg-surface-elevation-1 shadow-[inset_0_-1px_0_var(--outline-gray-2)] ` +
  `text-p-sm text-ink-gray-5 ${CELL}`

const appLabel = (value) => APPS.find((a) => a.value === value)?.label ?? value

// Three of the thirteen partners end in an s — Greycube Technologies, Kingstech
// Services, Hybrowlabs — and a bare `${name}'s` gave "Greycube Technologies's".
const possessive = (name) => (name.endsWith('s') ? `${name}'` : `${name}'s`)

// One flat list rather than a group per app: the app is a mark in the first
// column, so grouping would spend a subhead row on a fact the row already
// carries. Catalogue order within an app, apps in project order.
//
// Only apps this partner actually implements: a partner who doesn't do Frappe
// HR shouldn't be quoting Frappe HR work. What's dropped is dropped silently —
// the modal is an estimate of what this partner would do, not an audit of what
// they don't.
const rows = computed(() =>
  Object.entries(store.project.modules)
    .filter(([app]) => props.partner.apps.includes(app))
    .flatMap(([app, keys]) =>
      modulesFor(app, keys).map((module) => ({
        // One key, defined once: it identifies the row to `v-for`, to the
        // exclusion set and to the checkbox's `id`, and those three going out
        // of step would each be a different, quiet bug.
        key: `${app}-${module.key}`,
        app,
        appLabel: appLabel(app),
        module,
      })),
    ),
)

// ⚠️ EXCLUDED, not included — the inversion is the whole reason "on by default"
// holds. `rows` is derived from the project crossed with what this partner
// implements, so it isn't a fixed list; an included-set would have to be seeded
// and then re-seeded every time that derivation changed, and any row it hadn't
// heard of yet would silently price at zero. An excluded-set defaults to empty,
// which means everything counts until someone says otherwise.
const excluded = ref(new Set())
const isOn = (row) => !excluded.value.has(row.key)
// A fresh Set rather than mutating in place: Vue 3 does track Set mutations,
// but only through its reactive proxy, and a `new Set(...)` copy can't be got
// wrong by a later refactor that unwraps this.
const toggle = (row, on) => {
  const next = new Set(excluded.value)
  if (on) next.delete(row.key)
  else next.add(row.key)
  excluded.value = next
}

const selected = computed(() => rows.value.filter(isOn))

// The header's tick, in the three states a select-all has. `indeterminate` is
// the middle one — frappe-ui exposes it as a prop because the native
// `indeterminate` is a DOM property with no HTML attribute behind it, so it
// can't be set from markup.
const allOn = computed(() => rows.value.length > 0 && excluded.value.size === 0)
const someOn = computed(() => selected.value.length > 0 && !allOn.value)
// The `on` the control hands back is the native one, and native is what we
// want: a click on an indeterminate box reports `true`, so half-selected goes
// to all rather than to none — which is the direction someone reaching for a
// half-filled box means. Clearing is then the one case that starts from all.
const toggleAll = (on) => {
  excluded.value = on ? new Set() : new Set(rows.value.map((r) => r.key))
}

const totalHours = computed(() => selected.value.reduce((n, r) => n + r.module.hours, 0))

// frappe-ui exports no currency formatter — its chart formatters are
// deliberately unexported because they hardcode a locale. One local instance,
// reused, so every figure in the modal is grouped and rounded the same way.
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const money = (n) => usd.format(n)

const total = computed(() => totalHours.value * props.partner.rate)

// The list is capped, so on all but the shortest projects it clips a row at the
// bottom edge — a hard crop through the middle of a line. `fading` drives an
// overlay that softens it, and it's state rather than a permanent gradient
// because a fade sitting over the last row once you've scrolled to the end is
// dimming content that has nothing after it.
const listWrap = ref(null)
const fading = ref(false)
const measureFade = () => {
  const el = listWrap.value?.querySelector('[data-slot="scroll-area-viewport"]')
  fading.value = !!el && el.scrollHeight - el.scrollTop - el.clientHeight > 1
}
// The body doesn't exist until the dialog opens, so the first measure has to
// wait for that render.
watch(
  () => props.open,
  () => {
    nextTick(measureFade)
  },
  { immediate: true },
)

const close = () => {
  emit('close')
  // Reopening gives a whole estimate again. Unticking a module is a "what if",
  // not a saved preference — nothing here is persisted, and a panel that came
  // back holding a smaller number than the card that opened it, for a reason
  // the visitor set minutes ago, is a figure they'd have to reconstruct.
  //
  // After the close transition, so the ticks don't visibly repopulate on the
  // way out. Same 200ms the drill-down reset used.
  setTimeout(() => {
    excluded.value = new Set()
  }, 200)
}
</script>

<template>
  <!-- The `title` prop, not the `#title` slot. The slot existed only to push the
       heading up to 3xl; at 2xl — one step down the frappe-ui scale, 18px — that
       is exactly what the prop already renders (`text-2xl-semibold`), so the
       override earned nothing and is gone.

       The title names the scope. This figure covers the standard implementation
       of the project's modules, not a bespoke engagement, and saying so here
       means the totals below don't each need a qualifier.

       "Estimate", not "quote": the quote is the thing the partner sends back,
       which is what the action at the foot of the panel is for. Naming both of
       them "quote" was the reason the old title needed two lines. -->
  <Dialog
    :model-value="open"
    size="xl"
    title="Standard implementation estimate"
    @update:model-value="!$event && close()"
  >
    <!-- Default slot, not `#body-content`: this version of frappe-ui's Dialog
         exposes only `default`, `title` and `actions`. `#body-content` is the
         older API and fails silently — a panel with its title and footer and an
         empty middle.

         `fc-estimate` is a width hook, not a style: `Dialog`'s `size` is an
         enum of Tailwind `max-w-*` steps and none of them is 600px, so
         `index.css` widens the panel via `.dialog-content:has(.fc-estimate)`. -->
    <template #default>
      <div class="fc-estimate">
        <!-- The dialog still needs an accessible description, or reka-ui warns
             that `aria-describedby` is unset. It says what the panel is; the
             caveat that used to sit here as a banner now lives on the action,
             where it's about to matter. -->
        <DialogDescription class="sr-only">
          Estimated hours and cost to implement your project with {{ partner.name }}.
        </DialogDescription>

        <!-- A table, not a list: two aligned figures per row read down the
             column, which is the comparison someone scanning an estimate is
             actually making.

             ⚠️ The `max-h` is what keeps the footer on screen. It caps the list
             at 340px, and below a certain window height it caps it at whatever
             is left after the dialog's own chrome (440px of title, totals,
             action and margins) so the panel never outgrows the viewport.
             ⚠️ Re-measured after "Modules selected" was added to the totals —
             the block is a row taller, and 440 is now exact rather than the
             ~27px conservative it had been: 296 of panel chrome plus 72 of
             margin top and bottom, checked at 560 and 660 viewport heights.
             Adding another line down there means re-checking this. The
             120px floor stops it collapsing to nothing on a very short window —
             past that point the page scrolls, which is the lesser evil.

             `ScrollArea` rather than `overflow-y-auto`: frappe-ui's own overlay
             scrollbar, which fades in on activity and reserves no gutter,
             instead of the platform bar sitting permanently down the side of a
             narrow panel.

             ⚠️ No negative margin. The table sits inside the panel's content
             box, so its rules start and end exactly where the totals, the
             action and the header text do. See `CELL` for what that cost. -->
        <div ref="listWrap" class="relative" @scroll.capture="measureFade">
          <!-- ⚠️ `-mr-2.5` on the root against `pr-2.5` on the viewport moves
               the SCROLLBAR out of the content box without moving the table.
               The root grows 10px to the right — the overlay bar's own width,
               measured — and the viewport gives that 10px straight back as
               padding, so the table, and therefore every rule, still ends
               exactly on the panel's content edge while the bar rides in the
               panel's 20px margin.

               Without it the bar lands on top of the last 10px of every hours
               figure while you scroll. It didn't before, because the table used
               to bleed 12px past the content edge and the bar rode out there
               with it. Removing the bleed is what brought it inboard. -->
          <ScrollArea
            class="-mr-2.5"
            viewport-class="max-h-[max(120px,min(340px,100vh_-_440px))] pr-2.5"
          >
            <table class="w-full text-left">
              <thead>
                <tr>
                  <!-- "in your project", not just "Module". Without an owner the
                       column reads equally well as the modules this PARTNER
                       implements, which makes "so which ones don't they do?" the
                       reader's next question — of a panel that deliberately
                       doesn't answer it. The header is where someone looks to
                       find out what a column holds, so the provenance lands as
                       they parse it, costing no row and no height.

                       ⚠️ Not the project's name. `store.project.name` is
                       generated for the visitor, not chosen by them, so a new
                       user has never seen it — and "ERP rollout" reads far more
                       like one of the partner's packages than like their own
                       thing. Don't surface a generated name anywhere it could be
                       mistaken for something the user picked.

                       ⚠️ And no count. The project may hold more modules than
                       this; the table shows the ones whose apps this partner
                       implements. A number here would sit above a visibly
                       shorter list. -->
                  <!-- The select-all sits in the header cell rather than in a
                       column of its own, for the same reason the row ticks do:
                       a third column would be 14px of content and a lifetime of
                       alignment. It lines up with every row's tick beneath it.

                       `aria-label` rather than wiring the column title up as
                       its label — the title names what the column holds, and a
                       heading that toggles seven rows when you click it is a
                       surprise nobody asked for. The label says what the
                       control does; the heading goes on saying what the column
                       is. -->
                  <th :class="HEAD">
                    <span class="flex items-center gap-2">
                      <Checkbox
                        :model-value="allOn"
                        :indeterminate="someOn"
                        aria-label="Include every module in the estimate"
                        @update:model-value="toggleAll"
                      />
                      <span>Modules in your project</span>
                    </span>
                  </th>
                  <th :class="[HEAD, 'text-right']">Estimated hrs</th>
                </tr>
              </thead>
              <!-- `divide-y` on the tbody rather than per-row `border-t`. The
                   old per-row version existed only so a hover fill could
                   swallow the rules either side of it — `divide-y`'s colour
                   lands via `.divide-… > :not([hidden]) ~ :not([hidden])`,
                   three class-level components, which outranks any reasonable
                   hover variant. Worth keeping written down in case a fill ever
                   comes back; there isn't one now, so this uses the plain
                   thing.

                   ⚠️ And there is deliberately no row fill, even though the
                   whole row is now a click target again. A fill would want to
                   sit clear of the text, which is what the table's old 12px
                   bleed was for — and the bleed is exactly what had to go for
                   the rules to line up with everything else on the panel. The
                   feedback is on the control instead: `[&:hover_input]` darkens
                   the tick box from anywhere in the row, which points at the
                   thing the click is about to change rather than at the row in
                   general. -->
              <tbody class="divide-y divide-outline-gray-1">
                <tr
                  v-for="r in rows"
                  :key="r.key"
                  class="relative cursor-pointer [&:hover_input]:border-outline-gray-5"
                >
                  <td :class="CELL">
                    <span class="flex min-w-0 items-center gap-2">
                      <!-- frappe-ui's own control at its own `sm` (14px), not a
                           14px box of ours. No `label` prop: the app mark sits
                           between the tick and the module name, and `Checkbox`
                           renders its label immediately after the input with a
                           fixed gap — nothing goes in between. The name is
                           wired up as a real `<label for>` below instead, which
                           is the same accessible pairing by another route. -->
                      <Checkbox
                        :id="`estimate-${r.key}`"
                        :model-value="isOn(r)"
                        @update:model-value="toggle(r, $event)"
                      />
                      <AppLogo :app="r.app" :label="r.appLabel" :muted="!isOn(r)" />
                      <!-- The label stretches over the whole row via
                           `after:absolute after:inset-0` against the `relative`
                           row — so the hours cell and the empty space toggle
                           the row too, not just fourteen pixels of tick box.
                           Same pattern as the partner listing's stretched name
                           link, and the reason `AppLogo` carries `z-10`: the
                           overlay would otherwise bury the mark and its tooltip
                           would never open.

                           ⚠️ `truncate` can't go on the label itself —
                           `overflow: hidden` would clip the very pseudo-element
                           doing the stretching. It goes on the span inside,
                           which is why there are two. -->
                      <label
                        :for="`estimate-${r.key}`"
                        class="flex min-w-0 cursor-pointer after:absolute after:inset-0"
                      >
                        <span
                          class="truncate text-p-base font-medium transition-colors"
                          :class="isOn(r) ? 'text-ink-gray-7' : 'text-ink-gray-4'"
                        >
                          {{ r.module.label }}
                        </span>
                      </label>
                    </span>
                  </td>
                  <!-- An excluded row keeps its figure but drops two steps of
                       ink. Removing the number would make the row look broken,
                       and leaving it at full strength states that it is part of
                       the sum directly underneath — which it isn't. -->
                  <td
                    :class="[
                      CELL,
                      'text-right text-p-base tabular-nums transition-colors',
                      isOn(r) ? 'text-ink-gray-7' : 'text-ink-gray-4',
                    ]"
                  >
                    {{ r.module.hours }} hrs
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollArea>
          <span
            v-show="fading"
            class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(to_bottom,transparent,var(--surface-elevation-1))]"
            aria-hidden="true"
          />
        </div>

        <!-- ── The pinned footer ───────────────────────────────────────── -->
        <!-- In the body rather than the `#actions` slot, and deliberately: that
           slot brings its own `pt-4` on top of the body's `pb-6`, which put 40px
           above the rule and no way to answer it below. The footer is pinned by
           the list's `max-h`, not by which slot it sits in — capping the list is
           what keeps the whole panel short enough to stay on screen.

           ⚠️ The dashed rule is a background gradient, not `border-dashed`. CSS
           gives no control over a dashed border's gap — the ratio is the
           browser's — so the dash and the space between are set explicitly here:
           3px on, 6px off. `--outline-gray-3` rather than `-2`, a step darker,
           because at 3-on-6-off there's a third less ink to see.

           Optical, not numeric, balance across it. Above the rule is 16px of
           clear space from the list's bottom edge, which is a hard clip with no
           leading of its own. Below it is 12px of padding plus the ~3.5px of
           half-leading every line of 14px/1.5 text carries above its cap — about
           15.5px to the ink. Setting both to 16 would sit the text a visible
           3-4px lower than the space above it looks. -->
        <dl
          class="mt-4 bg-[repeating-linear-gradient(to_right,var(--outline-gray-3)_0_3px,transparent_3px_9px)] bg-[length:100%_1px] bg-top bg-no-repeat pt-3"
        >
          <!-- What's in scope, then how many hours that is, then at what rate,
             then the price. The count goes FIRST rather than anywhere else in
             the block, and that ordering is the whole reason it can sit here at
             all: hours × rate = quote is a chain of arithmetic, and a module
             count is not a term in it. In front of the chain it's the premise;
             anywhere inside it, it's an interruption.

             It's here rather than in the table header — the other candidate,
             and the cheaper one, since the header costs no height and height is
             what keeps the footer on screen. But this is where the eye goes
             after a tick, because this is where the consequence lands, and a
             count that reports on your last click belongs with the other
             figures that move when you make it.

             ⚠️ Both numbers are also visible in the list above, so this asserts
             nothing the reader can't check. That's what separates it from the
             count the table header deliberately doesn't carry — that one would
             have been a claim about scope. This is feedback on your own click.

             `tabular-nums`, like every other figure here, so the digits don't
             jitter as they change. -->
          <div class="flex items-center justify-between">
            <dt class="text-p-base font-medium text-ink-gray-6">Modules selected</dt>
            <dd class="text-p-base font-medium tabular-nums text-ink-gray-7">
              {{ selected.length }} of {{ rows.length }}
            </dd>
          </div>
          <!-- Medium, not regular: these are the inputs the total is made of,
             and they were reading as a caption under it. -->
          <div class="mt-1.5 flex items-center justify-between">
            <!-- "Total estimated hours", matching the column it sums. "Total
                 hours" read as a fact about the project; every figure in this
                 panel is an estimate, and the one that adds the others up
                 shouldn't be the one that drops the word. -->
            <dt class="text-p-base font-medium text-ink-gray-6">Total estimated hours</dt>
            <dd class="text-p-base font-medium tabular-nums text-ink-gray-7">
              {{ totalHours }} hrs
            </dd>
          </div>
          <div class="mt-1.5 flex items-center justify-between">
            <dt class="text-p-base font-medium text-ink-gray-6">
              {{ possessive(partner.name) }} hourly rate
            </dt>
            <dd class="text-p-base font-medium tabular-nums text-ink-gray-7">
              {{ money(partner.rate) }}
            </dd>
          </div>
          <!-- `items-baseline`, not `items-center`: the label is 14px and the
               figure 17px, so centring them sits the two on different baselines.
               The rows above have one type size and don't care.

               The margin is smaller than the ones above for the same reason the
               gap around the dashed rule is uneven — the taller line box brings
               its own leading with it, so an equal margin reads as a bigger gap.
               All three rows carry `mt-1.5`, and what that buys is measured in
               baselines rather than margins: 27px from row one to row two, 27.5
               to the quote. Even spacing in a list of mixed sizes is even
               BASELINES, not even gaps. -->
          <div class="mt-1.5 flex items-baseline justify-between">
            <dt class="text-base font-medium text-ink-gray-8">Estimated quote</dt>
            <dd class="text-xl font-semibold tabular-nums text-ink-gray-8">{{ money(total) }}</dd>
          </div>
        </dl>

        <!-- The label carries what the removed disclaimer used to: this figure
           isn't the quote, it's the reason to ask for one — and asking means
           sending them a message, which the icon and the verb both say.
           ⚠️ Same destination as every other Contact on this page — the in-app
           messages screen, which doesn't exist yet — so it raises the same
           toast. This is the terminal action of the whole quote flow; it was
           the one button in the modal that did nothing at all. -->
        <Button
          variant="solid"
          class="mt-5 w-full"
          label="Message partner for a final quote"
          @click="contactToast(partner)"
        >
          <template #prefix><LucideMessageSquare class="size-4" /></template>
        </Button>

        <!-- The one question the panel provokes and doesn't answer: what a
             starter pack actually contains. The rows above are the visitor's
             project; a pack is a fixed scope the partner sells, and the two are
             compared constantly on this screen without the second ever being
             spelled out. The comparison table on `/connect` spells it out, so
             this points there rather than restating it in a modal.

             Ghost and narrower than the action above it — it's a way out to
             reference material, not a second thing to decide. Centred under the
             full-width primary so the pair reads as one stack; left-aligned it
             looks like an afterthought that got left behind.

             ⚠️ The centring goes on a wrapper, not on the Button. `mx-auto`
             does nothing to a `display: flex` element, which is block-level and
             already fills the row — the label just sits at its left edge, which
             is the bug this replaced.

             ⚠️ NEW TAB, via `link` (frappe-ui's Button renders `link` as an
             `<a target="_blank" rel="noreferrer noopener">`; `route` would be
             the same-tab RouterLink). Deliberate: the ticks above are a tuned
             estimate that closing this panel throws away by design, and losing
             it to a definition lookup is a different thing from losing it to
             "I'm done". Reading what a pack contains is exactly the question
             you ask WHILE deciding. -->
        <div class="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" :link="packsHref" label="What's in a starter pack?">
            <template #suffix><LucideArrowUpRight class="size-3.5" /></template>
          </Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>
