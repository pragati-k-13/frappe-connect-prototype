<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerReviewsSection from '../components/PartnerReviewsSection.vue'
import ReviewReply from '../components/ReviewReply.vue'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PARTNERS } from '../data/partners'
import { takingWork } from '../data/takingWork'
import { useContactPartner } from '../utils/contact'

// SCREEN — every review of one partner, as a business reads them. Reached from
// the profile's "View all" (more than five reviews); Back returns to the
// profile's Reviews section (see `PartnerReviewsSection`). Contact stays in the
// header, so a business can act straight from here.
const route = useRoute()
const router = useRouter()
const account = usePartnerAccountStore()
const published = computed(() => account.published(route.params.id))
const partner = computed(() => {
  const p = PARTNERS.find((x) => x.id === route.params.id)
  return p ? { ...p, ...published.value.profile } : null
})
const { contactPartner } = useContactPartner()
</script>

<template>
  <ConnectShell
    :crumb="partner ? 'Reviews' : null"
    :trail="partner ? [{ label: partner.name, to: `/connect/partners/${partner.id}` }] : []"
  >
    <template v-if="partner" #action>
      <Button v-if="takingWork(partner)" variant="solid" label="Contact" @click="contactPartner(partner)">
        <template #prefix><LucideMessageSquare class="size-4" /></template>
      </Button>
    </template>

    <!-- Unknown id: the same 404 as the profile. -->
    <div v-if="!partner" class="fc-page-read py-20 text-center">
      <p class="text-p-lg font-medium text-ink-gray-8">No such partner</p>
      <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
        The link may be out of date, or the partner may have left the programme.
      </p>
      <div class="mt-4">
        <Button variant="subtle" label="Back to all partners" @click="router.push('/connect/partners')" />
      </div>
    </div>

    <div v-else class="fc-page-read pb-24 pt-8">
      <EmptyState v-if="!partner.reviews" icon="lucide-star" title="No reviews yet" />
      <PartnerReviewsSection v-else :partner="partner" full>
        <template #actions="{ review: r }">
          <ReviewReply :partner="partner" :text="published.replies[r.id]" />
        </template>
      </PartnerReviewsSection>
    </div>
  </ConnectShell>
</template>
