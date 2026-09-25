<script setup>
// SCREEN — the recommendation. What the three questions were for.
//
// ⚠️ THIS IS THE PIVOT OF THE WHOLE PRODUCT. Everything before it collects
// answers; everything after it sells something. It is the only screen that
// makes a claim, so it is the only screen that has to justify one — every
// assertion here is followed by the answer it came from, and the engine is
// built so that a rule and its sentence cannot drift apart. See
// `data/recommendation.js`.
//
// ⚠️ NOT GUARDED. Someone who has answered three questions is owed the answer
// before being asked to make an account; the gate is the checkout and the
// broadcast, which are the two gestures that actually need somewhere to live.
//
// TWO HALVES, one shown at a time. The verdict picks which, and a plain link
// swaps them — an override rather than a second recommendation. A screen that
// recommends both has recommended nothing, but a screen that refuses to show
// the other one is a wall.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EditAnswersDialog from '../components/EditAnswersDialog.vue'
import RecommendationView from '../components/RecommendationView.vue'
import { useConnectStore } from '../stores/connect'

// ⚠️ THE SCREEN IS `RecommendationView`, and this page is its owner for the
// account: the account's answers, basket and requirements go in, and the page
// decides what checking out and sharing mean — a sign-up gate, then a new
// project. A draft project renders the same component with its own.
const store = useConnectStore()
const router = useRouter()
const route = useRoute()

const reco = ref(null)
const editing = ref(false)

onMounted(() => {
  // The basket starts as the recommendation, once — see `seedRecommendedPacks`.
  store.seedRecommendedPacks()
  // Coming back from sign-up with a send the gate interrupted: finish it.
  if (route.query.send && store.signedIn) reco.value?.send()
})

const checkout = () => {
  if (!store.signedIn) {
    return router.push({ name: 'signup', query: { next: '/connect/checkout' } })
  }
  router.push({ name: 'checkout' })
}

const share = () => {
  if (!store.signedIn) {
    return router.push({
      name: 'signup',
      query: { next: '/connect/recommendation?send=1' },
    })
  }
  const id = store.startCustomProject()
  const result = store.broadcastBrief(id)
  toast.success(`Sent to ${result.sent} ${result.sent === 1 ? 'partner' : 'partners'}`, {
    description: 'Their replies come back as quotes. Mark the ones you want to take forward as Interested.',
  })
  router.push({ name: 'brief-sent', query: { project: id } })
}
</script>

<template>
  <ConnectShell>
    <!-- ⚠️ NO MEASURE HERE. The screen carries a rail that belongs at the
         page's right edge and centres its own column in what is left — see
         `RecommendationView`. A cap on this box would pull both in. -->
    <div class="w-full px-5 py-10 lg:px-8">
      <RecommendationView
        ref="reco"
        :answers="store.company"
        :brief="store.brief"
        :packs="store.packs"
        :initial-view="route.query.view === 'custom' ? 'custom' : null"
        @toggle-pack="store.togglePack"
        @update-brief="store.saveBrief"
        @checkout="checkout"
        @share="share"
        @edit-answers="editing = true"
      />
    </div>

    <EditAnswersDialog v-model:open="editing" />
  </ConnectShell>
</template>
