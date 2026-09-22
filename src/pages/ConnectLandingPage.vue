<!-- ⚠️ A plain `<script>` beside `<script setup>`: this block runs ONCE for the
     module rather than once per component instance. See `step` below. -->
<script>
import { reactive, ref } from 'vue'
import { emptyCompanyForm } from '../data/company'

// Which question the intake is showing, deliberately at MODULE scope.
//
// ⚠️ Inside `setup` this was re-created on every mount, so leaving the page and
// coming back rewound the questions to the first one — and asked an industry it
// already had the answer to, with that answer still visibly selected. The
// ANSWERS were never the problem; they live on the store and survive fine. The
// position in the sequence was.
//
// Same reasoning and the same fix as the sidebar's `collapsed` in
// `ConnectShell`. Session-only: a reload starts over, like everything else in
// this prototype.
const step = ref(1)

// ⚠️ THE FORM IS AT MODULE SCOPE TOO, and for a different reason than `step`.
// It is not saved to the store until the last question is answered — a
// half-filled intake is not a company record, and writing one would make every
// screen that asks "has this account answered?" say yes to somebody who
// answered one question and left. So the draft has to outlive the component, or
// scrolling down to the packs table and back would empty the form.
const form = reactive(emptyCompanyForm())
</script>

<script setup>
// SCREENS 2–4 — the Frappe Connect landing page.
//
// Frappe Connect deliberately does NOT open on a listing. The hero is a
// three-question intake, and what you get for finishing it is a recommendation:
// buy these packs, or have this scoped by a partner. Everything below the fold
// (starter packs, success stories, footer CTA) exists to give someone who isn't
// ready to answer a reason to stay — and every one of those sections routes
// back into the same three questions.
//
// ⚠️ EVERYONE ANSWERS THESE, which is the change this page carries. They used
// to be two optional questions that filtered a partner listing, so skipping
// them was a supported move that produced a wider list. They now produce a
// RECOMMENDATION, and there is no wider version of that — see the note on
// `companyErrors` in `data/company.js`. There is no Skip on this page any more.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, ScrollArea } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import CompanyQuestions from '../components/CompanyQuestions.vue'
import DottedWorldMap from '../components/DottedWorldMap.vue'
import { useConnectStore } from '../stores/connect'
import { COMPANY_STEPS, companyPayload, stepComplete, stepErrors } from '../data/company'
import { SUCCESS_STORIES } from '../data/partners'
import { REGION_OF } from '../data/quiz'
// Pack pricing is per country now. This table has no answer to read until the
// intake is finished — and a visitor scrolling past it may not have started —
// so it quotes the default, India, and says so in the line above it.
import { STARTER_PACKS, priceFor, pricingFor, DEFAULT_REGION } from '../data/packs'

const store = useConnectStore()
const router = useRouter()

const TOTAL = COMPANY_STEPS
const quizTop = ref(null)

// ⚠️ Errors are held back until Continue has been pressed ON THIS STEP, and the
// flag resets as the step changes. Validating as someone types tells them their
// answer is wrong before they have finished giving it; validating never leaves
// a disabled button with no explanation.
const tried = ref(false)
const errors = computed(() => (tried.value ? stepErrors(form, step.value) : {}))

// What the map lights up. The intake asks for ONE country, so the map answers
// with that country and the region around it — which is the honest reading of
// "here is who is near you", and the only thing this panel is for now that the
// geo question it used to illustrate is gone.
const highlight = computed(() =>
  form.country ? [form.country, REGION_OF[form.country]].filter(Boolean) : [],
)

const next = () => {
  if (!stepComplete(form, step.value)) {
    tried.value = true
    return
  }
  tried.value = false
  if (step.value < TOTAL) {
    step.value += 1
    return
  }
  // ⚠️ SAVED ONLY HERE, at the end. See the note on `form` above.
  store.saveCompany(companyPayload(form))
  // ⚠️ The basket is seeded on the recommendation screen rather than here, so
  // that changing an answer and coming back re-runs the engine. Seeding at this
  // point would freeze the first answer the intake ever produced.
  router.push({ name: 'recommendation' })
}

const back = () => {
  if (step.value > 1) {
    step.value -= 1
    tried.value = false
  }
}

// Below-the-fold CTAs return to the questions rather than jumping past them —
// the recommendation stays behind them no matter which path you take in.
const restartQuiz = () => {
  quizTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <ConnectShell>
    <!-- ── Hero: the three questions ─────────────────────────────────── -->
    <!-- The intake owns the first screen: 100vh minus the 3rem top bar, so the
         question and the map are the only things visible and everything below
         the fold has to be scrolled to deliberately. -->
    <section
      ref="quizTop"
      class="mx-auto grid w-full max-w-[1600px] gap-8 px-5 py-10 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:gap-14 lg:px-10 lg:pb-8 lg:pt-4 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]"
    >
      <!-- ⚠️ Two column rules, and the breakpoint between them is the point.
           460px is the narrowest column that keeps the headline on one line at
           its 18px size with room to spare — but 460px is a FIXED max, so grid
           hands the question its full width before the map gets anything left
           over. Below `xl` that starved the map, so the 460 cap only applies
           from `xl`, where there is room for it. Between `lg` and `xl` the
           halves are simply equal. -->
      <div class="flex min-w-0 flex-col justify-center lg:pb-16">
        <h1 class="text-2xl font-semibold text-ink-gray-9">
          Tell us about your business, and we'll tell you how to start
        </h1>
        <!-- ⚠️ THE PROMISE, and it is here because two different doors lead to
             this page. Somebody arriving from frappe.io/partners expects a
             directory; somebody arriving from the contact page expects a reply
             by email. Both of them get a form, so the form has to say what it
             gives back before it asks for anything — including the part people
             most want to know, which is whether a salesperson is about to
             call. -->
        <p class="mt-2 max-w-md text-p-base leading-relaxed text-ink-gray-6">
          Three questions, about a minute. You'll get a recommendation straight away — either a
          fixed-price starter pack you can buy today, or quotes from partners who do your kind of
          work. No sales call in between.
        </p>

        <div class="relative mt-6">
          <div class="flex items-baseline justify-between gap-4">
            <p class="text-p-base font-semibold text-ink-gray-9">
              {{ ['Your business', 'How you work today', 'What you want fixed'][step - 1] }}
            </p>
            <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">
              {{ step }} / {{ TOTAL }}
            </span>
          </div>

          <!-- ⚠️ NO PROGRESS BAR. There was one here — `Progress` with three
               intervals, the same control the contact wizard uses — and it sat
               directly under a "1 / 3" saying the same thing. Two indicators of
               one position is one too many, and the bar was the weaker of them:
               it says how far along you are without saying how far there is to
               go, which over three steps is the only fact worth having. The
               counter stays. -->

          <!-- ⚠️ THE SAME COMPONENT THE CONTACT WIZARD ASKS THESE WITH. They
               were this page's own markup once and the wizard's own markup
               beside it, and the two drifted within a week — one asked for a
               segment, the other for an industry. `CompanyQuestions` is the
               fields; this page owns the sequence and the buttons. -->
          <!-- ⚠️ `mt-5`, up from `mt-4`. The bar used to sit between this and
               the step's name and carried its own 8px above it; taking it out
               left the first field's label 16px under a heading, which is the
               gap between two fields rather than between a heading and what it
               heads. -->
          <div class="mt-5">
            <Transition name="step" mode="out-in">
              <div :key="step">
                <CompanyQuestions :step="step" :form="form" :errors="errors" />
              </div>
            </Transition>
          </div>

          <div class="mt-5 flex items-center gap-2">
            <Button
              variant="solid"
              :label="step === TOTAL ? 'See what we recommend' : 'Continue'"
              @click="next"
            />
            <Button v-if="step > 1" variant="subtle" label="Back" @click="back" />
          </div>
        </div>
      </div>

      <!-- Map: a stable frame beside the changing question. Its hubs light up
           for the country answered on the first step, and stay lit. -->
      <div class="flex min-w-0 flex-col justify-center rounded-7 bg-surface-gray-1 p-6 lg:p-8">
        <DottedWorldMap :highlight="highlight" class="mx-auto w-full" />
      </div>
    </section>

    <!-- ── Starter packs ─────────────────────────────────────────────── -->
    <!-- Everything below the hero shares one 800px column, the same cap the
         results screen uses — so the reading width is constant from here to the
         partner list. Only the hero opts out (1600px), because the map needs
         the width and is the reason this screen is wide at all.
         No dividers between them either — vertical space does the separating.

         ⚠️ `id` is a link target, not decoration: the estimate modal's "What's
         in a starter pack?" links to `/connect#starter-packs`, and the router's
         `scrollBehavior` resolves the hash to this element. Renaming it breaks
         that link silently — the page still loads, just at the top. -->
    <section id="starter-packs" class="scroll-mt-8 px-5 py-12 lg:px-10">
      <div class="mx-auto w-full max-w-[800px]">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">
          Starter packs are your fastest way to get started
        </h2>
        <!-- ⚠️ "You pay Frappe" is the one term that has to survive being read
             on a partner's page, so it is here and on the profile's pricing
             section both. A fixed price quoted beside a named partner reads as
             that partner's invoice, and for a pack it isn't one.

             It sits in this paragraph rather than in a row of the table because
             the answer is the same for all four packs. The table is the one
             place on the page for what differs between them — which is also why
             the Modules row went: with each pack now NAMED by its modules, that
             row printed its own column header back. -->
        <p class="mt-1.5 max-w-2xl text-p-base text-ink-gray-6">
          Fixed scope, fixed price, delivered by any certified partner. You pay Frappe in full, not
          the partner. Pick one now or let the questions above narrow it down for you. Prices for
          India, before {{ pricingFor(DEFAULT_REGION).tax }}.
        </p>

        <ScrollArea orientation="horizontal" class="mt-5 rounded-6 border border-outline-gray-2">
          <table class="w-full min-w-[640px] border-collapse text-p-base">
            <thead>
              <tr class="bg-surface-gray-1">
                <th
                  scope="col"
                  class="w-32 px-4 py-3 text-left text-p-sm font-medium uppercase tracking-wide text-ink-gray-5"
                >
                  <span class="sr-only">Attribute</span>
                </th>
                <!-- ⚠️ NOT uppercased, unlike every other header in the app.
                     A pack's name is now its module list — "Accounts, Sales,
                     Purchase, Stock" — which is content in a heading's slot
                     rather than a label for a column. Uppercase with tracking
                     put that one across four lines in a 160px cell and made
                     the header row three times the height of any row under it.
                     Sentence case and a narrower attribute column bring it to
                     two. -->
                <th
                  v-for="pack in STARTER_PACKS"
                  :key="pack.value"
                  scope="col"
                  class="px-4 py-3 text-center text-p-sm font-medium text-ink-gray-7"
                >
                  {{ pack.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">
                  Total hours
                </th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center tabular-nums text-ink-gray-8"
                >
                  {{ p.hours }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">
                  Validity
                </th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center text-ink-gray-8"
                >
                  {{ p.validity }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">Cost</th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center font-medium tabular-nums text-ink-gray-9"
                >
                  {{ priceFor(p, DEFAULT_REGION) }}
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>

        <!-- ⚠️ TWO WAYS OUT, and the second one is the escape hatch this page
             needs. Somebody who arrived from frappe.io/partners came for a
             directory and has been handed a form; telling them the directory is
             still there costs one link and keeps a visitor who would otherwise
             leave. The questions stay the primary route because they are the
             only one that ends in an answer. -->
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="subtle" label="Answer three questions" @click="restartQuiz" />
          <Button variant="ghost" label="Or browse all partners" :route="{ name: 'results' }" />
        </div>
      </div>
    </section>

    <!-- ── Success stories ───────────────────────────────────────────── -->
    <section class="px-5 py-12 lg:px-10">
      <div class="mx-auto w-full max-w-[800px]">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">Success stories</h2>
        <ul class="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <li v-for="s in SUCCESS_STORIES" :key="s.id">
            <a href="#" class="group block">
              <div
                class="h-[132px] rounded-6 transition-opacity group-hover:opacity-90"
                :style="{ backgroundImage: `linear-gradient(135deg, ${s.art[0]}, ${s.art[1]})` }"
                role="img"
                :aria-label="`Cover image for: ${s.title}`"
              />
              <p class="mt-3 text-p-sm font-medium uppercase tracking-wide text-ink-gray-5">
                {{ s.tag }}
              </p>
              <p class="mt-1 text-p-base leading-snug text-ink-gray-8 group-hover:underline">
                {{ s.title }}
              </p>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Footer CTA — back into the quiz ───────────────────────────── -->
    <section class="bg-surface-gray-1 px-5 py-14 lg:px-10">
      <div class="mx-auto w-full max-w-[800px] text-center">
        <h2 class="text-xl font-semibold text-ink-gray-9">Ready to start?</h2>
        <p class="mx-auto mt-2 max-w-md text-p-base text-ink-gray-6">
          Three questions, about a minute. You'll know whether a fixed-price pack covers you, or
          whether this needs scoping — and either way, who can do it.
        </p>
        <div class="mt-5">
          <Button variant="solid" size="md" label="Get a recommendation" @click="restartQuiz" />
        </div>
      </div>
    </section>
  </ConnectShell>
</template>
