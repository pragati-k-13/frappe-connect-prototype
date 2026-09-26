<script setup>
import { List } from 'frappe-ui/list'

// The directory's list: frappe-ui's `List`, holding `PartnerRow`s. One place
// for its configuration, so the listing, Saved partners and the home screen's
// saved partners cannot drift apart.
//
//   columns    the row's content, then its actions. Not the feed default's
//              leading-media column: the logo belongs to the name and city, and
//              the facts run the row's full width under it (see `PartnerRow`).
//   divider    `full`, spanning both columns at the content's width.
//   -mx-3 +    the hover fill bleeds 12px past the content column on each side
//   px-3       while the text stays on the heading's edge.
//   gap        12px between content and actions, the row's old `gap-3`.
</script>

<template>
  <List
    :columns="['minmax(0,1fr)', 'auto']"
    divider="full"
    class="-mx-3 list-row-px-3 [--list-gap:0.75rem]"
  >
    <slot />
  </List>
</template>
