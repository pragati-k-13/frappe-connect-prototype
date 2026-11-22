<script setup>
import { computed } from 'vue'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerList from '../components/PartnerList.vue'
import PartnerRow from '../components/PartnerRow.vue'
import { useConnectStore } from '../stores/connect'

// SCREEN — Saved partners, opened from the directory's top bar. Needs an
// account (see the route): visitors can't save.
//
// Real `PartnerRow`s, the same as the directory: a saved partner is compared on
// the same facts, and Save and Contact still work here. Unsaving drops the row
// straight away; the toast's Undo puts it back. No filters and no count: it is
// a shortlist the account built, a handful of names they already know.
const store = useConnectStore()
const partners = computed(() => store.savedPartners)
</script>

<template>
  <!-- No `saved` on the shell: the top bar's Saved button leads here, and the
       breadcrumb already says you've arrived. -->
  <ConnectShell crumb="Saved">
    <!-- 800 and `py-8`, the app's one measure for a listing. -->
    <div class="fc-page-list py-8">
      <!-- The directory's heading style, so every partners screen opens the
           same way. -->
      <h1 class="text-xl font-semibold text-ink-gray-9">Saved partners</h1>

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
