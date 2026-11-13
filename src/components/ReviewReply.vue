<script setup>
// A partner's public reply under a review. Businesses see it on the profile
// and the Reviews page; the partner sees it where they wrote it.
defineProps({
  partner: { type: Object, required: true },
  text: { type: String, default: '' },
})
</script>

<template>
  <div v-if="text" class="mt-4 border-l-2 border-outline-gray-2 pl-3">
    <p class="text-sm font-medium text-ink-gray-7">Reply from {{ partner.name }}</p>
    <p class="mt-1 text-p-base text-ink-gray-6">{{ text }}</p>
  </div>
</template>
