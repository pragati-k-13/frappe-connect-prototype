<script setup>
import { nextTick, ref } from 'vue'
import { Button, ScrollArea } from 'frappe-ui'
import { CommentKit, commentToolbar, Editor, EditorContent, EditorFixedMenu } from 'frappe-ui/editor'

// The reply box under a Connect thread, always open: Connect messages are
// short, so there's no click to open it. It only ever goes to the business;
// notes have their own tab. Enter sends, Shift+Enter breaks the line.
defineProps({ placeholder: { type: String, default: 'Reply to the business…' } })
const emit = defineEmits(['send'])

const draft = ref('')
const composer = ref(null)
const EXTENSIONS = [CommentKit.configure({ image: false, video: false, attachment: false, table: false })]

function send() {
  if (composer.value?.isEmpty) return
  emit('send', draft.value)
  draft.value = ''
}
const onKey = (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  e.preventDefault()
  e.stopPropagation()
  send()
}
const escape = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// A card's own Reply quotes it into the box, as Helpdesk does.
function quote(text) {
  draft.value = `<blockquote><p>${escape(text)}</p></blockquote><p></p>`
  nextTick(() => composer.value?.editor?.commands?.focus?.('end'))
}
const clear = () => (draft.value = '')
defineExpose({ quote, clear })
</script>

<template>
  <Editor ref="composer" v-model="draft" :extensions="EXTENSIONS" :placeholder="placeholder">
    <template #default="slot">
      <div
        class="group rounded-4 border border-transparent bg-surface-gray-2 p-2 transition-colors focus-within:border-outline-gray-4 focus-within:bg-surface-base focus-within:shadow-sm"
        @keydown.capture="onKey"
      >
        <ScrollArea class="max-h-40"><EditorContent class="fc-composer min-h-6 px-1" /></ScrollArea>
        <!-- Always shown, so the box doesn't grow on focus and push the
             conversation up. -->
        <div class="mt-2 flex items-center gap-2">
          <EditorFixedMenu :items="commentToolbar" button-size="sm" />
          <Button class="ml-auto" variant="solid" size="sm" label="Send" :disabled="slot?.isEmpty ?? true" @click="send" />
        </div>
      </div>
    </template>
  </Editor>
</template>
