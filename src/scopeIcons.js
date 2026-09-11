// One icon per scope area, and ONE definition of that mapping.
//
// The catalogue's scope panel and the booking panel both render the same seven
// modules out of `PACK_SCOPE`, and both label them with the same marks. As two
// local maps they were two chances for Manufacturing to become a different
// glyph in one of the two places a customer sees it.
import IconAccounting from '~icons/lucide/landmark'
import IconSelling from '~icons/lucide/trending-up'
import IconBuying from '~icons/lucide/shopping-cart'
import IconInventory from '~icons/lucide/warehouse'
import IconManufacturing from '~icons/lucide/factory'
import IconHrms from '~icons/lucide/users'
import IconPayroll from '~icons/lucide/banknote'

export const SCOPE_ICONS = {
  accounting: IconAccounting,
  selling: IconSelling,
  buying: IconBuying,
  inventory: IconInventory,
  manufacturing: IconManufacturing,
  hrms: IconHrms,
  payroll: IconPayroll,
}
