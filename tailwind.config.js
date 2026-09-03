import frappeUIPreset from 'frappe-ui/tailwind'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [frappeUIPreset],
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
    './node_modules/frappe-ui/src/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // The frappe.io marketing site sets its headlines in a serif; the
        // product UI stays on the frappe-ui sans. Screen 1 is the only place
        // this is used — it's what makes the website read as "not the app".
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
}
