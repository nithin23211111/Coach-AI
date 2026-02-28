/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        link: 'var(--link)',
        surface: 'var(--surface)',
      },
      backgroundImage: {
        'app-gradient':
          'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 78%, var(--gradient-final) 100%)',
        'primary-gradient': 'linear-gradient(135deg, #5f2340 0%, #7d2d52 55%, #8b5fb9 100%)',
      },
      boxShadow: {
        'soft-card': '0 16px 45px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(139, 95, 185, 0.15)',
      },
    },
  },
}
