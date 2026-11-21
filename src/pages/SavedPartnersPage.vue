<script setup>
import { computed, onMounted } from 'vue'
import { Button, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageCrumbs from '../components/PageCrumbs.vue'
import PartnerList from '../components/PartnerList.vue'
import PartnerRow from '../components/PartnerRow.vue'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from '../utils/auth'

// SCREEN — Saved partners, opened from the directory's top bar.
//
// Real `PartnerRow`s, the same as the directory: a saved partner is compared on
// the same facts, and Save and Contact still work here. Unsaving drops the row
// straight away; the toast's Undo puts it back. No filters and no count: it is
// a shortlist the visitor built, a handful of names they already know.
const store = useConnectStore()
const partners = computed(() => store.savedPartners)
const { requireAccount } = useAuthGate()

// A visitor's first-save toast says what the line under the heading says, so
// it goes once they arrive here: one place for the fact, one Create account.
onMounted(() => toast.dismiss('saved-guest'))
// Same reason for the top bar's auth CTA: while the page carries its own
// Create account, the chrome's would be a second door to the same screen
// (the cart page does the same). Back when there's nothing saved.
const guestWithSaves = computed(() => !store.signedIn && partners.value.length > 0)
</script>

<template>
  <!-- No `saved` on the shell: the top bar's Saved button leads here, and the
       breadcrumb already says you've arrived. -->
  <ConnectShell crumb="Saved" :auth-cta="!guestWithSaves">
    <!-- 800 and `py-8`, the app's one measure for a listing. -->
    <div class="fc-page-list py-8">
      <!-- The directory's heading style, so every partners screen opens the
           same way. -->
      <PageCrumbs class="mb-3" />
      <h1 class="text-xl font-semibold text-ink-gray-9">Saved partners</h1>

      <!-- A visitor's list lasts the visit. Said here as well as in the first
           save's toast, because this is where they come back to look at it.
           Creating an account returns here with the list kept. -->
      <div v-if="guestWithSaves" class="mt-2 flex items-center gap-2">
        <p class="text-p-base text-ink-gray-6">Saved for this visit only</p>
        <Button variant="subtle" label="Create account" @click="requireAccount()" />
      </div>

      <!-- The shared empty state. No description: the title says what goes
           here, the button says what to do, and the bookmark glyph is the one
           on every row. -->
      <EmptyState v-if="!partners.length" icon="lucide-bookmark" title="No saved partners">
        <Button variant="solid" label="Browse partners" route="/connect/partners" />
      </EmptyState>

      <PartnerList v-else class="mt-5">
        <PartnerRow v-for="p in partners" :key="p.id" :partner="p" undo-toast />
      </PartnerList>
    </div>
  </ConnectShell>
</template>
