<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Button, Dialog, ScrollArea } from 'frappe-ui'
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
// ⚠️ The module and hour breakdown is invented — see `data/modules.js`.
const props = defineProps({
  open: { type: Boolean, default: false },
  partner: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const store = useConnectStore()

// Table metrics, spelled out once because they're a spec rather than a taste.
//
// A cell carries 8px left/right and 6px top/bottom. A row carries a further 4px
// left/right and 2px top/bottom — and since a `<tr>` can't take padding (CSS
// tables ignore it), the row's share is folded into the cells: every cell gets
// the extra 2px vertically, and the outermost cell on each side gets the extra
// 4px horizontally. The rendered result is what the spec describes; the
// arithmetic just lives somewhere it can be checked.
const CELL = 'px-2 py-2 first:pl-3 last:pr-3'

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
      modulesFor(app, keys).map((module) => ({ app, appLabel: appLabel(app), module })),
    ),
)

const totalHours = computed(() => rows.value.reduce((n, r) => n + r.module.hours, 0))

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
    @update:model-value="!$event && $emit('close')"
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
             is left after the dialog's own chrome (~440px of title, totals,
             action and margins) so the panel never outgrows the viewport. The
             120px floor stops it collapsing to nothing on a very short window —
             past that point the page scrolls, which is the lesser evil.

             `ScrollArea` rather than `overflow-y-auto`: frappe-ui's own overlay
             scrollbar, which fades in on activity and reserves no gutter,
             instead of the platform bar sitting permanently down the side of a
             500px panel. `-mx-3` cancels the row padding so the text still
             lines up with the totals. -->
        <div ref="listWrap" class="relative -mx-3" @scroll.capture="measureFade">
          <ScrollArea viewport-class="max-h-[max(120px,min(340px,100vh_-_440px))]">
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
                  <th :class="HEAD">Modules in your project</th>
                  <th :class="[HEAD, 'text-right']">Estimated hrs</th>
                </tr>
              </thead>
              <!-- `divide-y` is back on the tbody now that nothing hovers. It
                   was per-row `border-t` only so a hover fill could swallow the
                   rules either side of it — a specificity fight (`divide-y`'s
                   colour lands via a three-class selector and outranks any
                   reasonable hover variant) that a non-interactive row doesn't
                   need to have.

                   And the rows are non-interactive on purpose: there is no
                   level below a module any more, so a pointer, a fill or a
                   caret would each be an affordance promising something that
                   doesn't happen. -->
              <tbody class="divide-y divide-outline-gray-1">
                <tr v-for="r in rows" :key="`${r.app}-${r.module.key}`">
                  <td :class="CELL">
                    <span class="flex min-w-0 items-center gap-2">
                      <AppLogo :app="r.app" :label="r.appLabel" />
                      <span class="truncate text-p-base font-medium text-ink-gray-7">
                        {{ r.module.label }}
                      </span>
                    </span>
                  </td>
                  <td :class="[CELL, 'text-right text-p-base tabular-nums text-ink-gray-7']">
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
          <!-- Medium, not regular: these two are the inputs the total is made of,
             and they were reading as a caption under it. -->
          <div class="flex items-center justify-between">
            <dt class="text-p-base font-medium text-ink-gray-6">Total hours</dt>
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
      </div>
    </template>
  </Dialog>
</template>
