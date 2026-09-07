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
        // Inter is the product face. frappe-ui's plugin sets the body to
        // `InterVar, theme('fontFamily.sans')` and ships no webfont of its own,
        // so naming Inter first here is what actually loads it — see the
        // Google Fonts link in `index.html`.
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Newsreader, for the marketing headline and nothing else. The serif is
        // what makes screen 1 read as "website" rather than "app"; using it
        // anywhere in the product would blur the line it exists to draw.
        // Georgia stays as the fallback — it's what this was before the webfont.
        serif: ['Newsreader', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
}
