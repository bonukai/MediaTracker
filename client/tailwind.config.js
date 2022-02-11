/** @type {import("@types/tailwindcss/plugin").TailwindPluginFn } */
const plugin = require('tailwindcss/plugin');

/** @type {import("@types/tailwindcss/tailwind-config").TailwindConfig } */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  important: true,
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.writing-mode-vertical': {
          'writing-mode': 'vertical-lr',
        },

        '.writing-mode-initial': {
          'writing-mode': 'initial',
        },
        '.link': {
          '@apply text-blue-800 underline dark:text-blue-400': {},
        },
      });
    }),
    plugin(({ addUtilities }) => {
      const btn = {
        display: 'inline-block',
        padding: '2px 16px',
        borderRadius: '4px',
        borderWidth: '1px',
        cursor: 'pointer',
        transition: 'all 150ms',
        userSelect: 'none',
        padding: '2px 16px',
        textAlign: 'center',
        '@apply dark:border-current border-current hover:shadow shadow-current hover:shadow-current disabled:shadow-none disabled:cursor-auto dark:disabled:bg-gray-500 disabled:bg-gray-300':
          {},
      };

      addUtilities({
        '.btn': btn,
        '.btn-red': {
          ...btn,
          '@apply text-red-700 dark:text-red-500': {},
        },
        '.btn-blue': {
          ...btn,
          '@apply text-blue-800 dark:text-blue-300': {},
        },
      });
    }),
  ],
};
