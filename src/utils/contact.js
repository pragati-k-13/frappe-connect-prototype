import { useRouter } from 'vue-router'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from './auth'

// Contact, from every surface that shows a partner: the listing row, the
// profile header, the pricing cards, the estimate dialog. All four used to
// raise the same "not built yet" toast; the messages screen exists now, so they
// all do the same real thing instead.
//
// ⚠️ Gated. A thread belongs to an account — a signed-out visitor has nowhere
// to put it and nowhere to come back to. `requireAccount` holds the action,
// sends them to sign-up carrying `?next=`, and runs it once they're back, so
// pressing Contact while signed out still ends in the conversation rather than
// back on the listing having to press it again.
//
// ⚠️ The held action outlives the component that armed it — the store's note on
// `pendingAction` is explicit that anything component-local is unsafe to hold.
// Both things this closure touches are app-level singletons (the Pinia store
// and the router), not component state, so it survives the unmount.
export function useContactPartner() {
  const store = useConnectStore()
  const router = useRouter()
  const { requireAccount } = useAuthGate()

  // `openThread` is idempotent by partner and hands back the id either way, so
  // this both starts a new conversation and reopens an existing one — including
  // the thread a booking already created.
  const contactPartner = (partner) =>
    requireAccount(() => {
      const thread = store.openThread(partner)
      router.push({ name: 'messages', query: { thread } })
    })

  return { contactPartner }
}
