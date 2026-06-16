@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@font-face {
  font-family: 'Acherus Militant';
  src: url('/AcherusMilitant3-Regular.otf') format('opentype');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-helvetica: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-militant: "Acherus Militant", sans-serif;

  /* Custom Colors */
  --color-white: #ebebeb;
  --color-brand-black: #000000;
  --color-brand-white: #ebebeb;
  --color-brand-gray-50: #ebebeb;
  --color-brand-gray-100: #F3F4F6;
  --color-brand-gray-200: #D1D5DB;
  --color-brand-gray-300: #9CA3AF;
  --color-brand-gray-400: #6B7280;
  --color-brand-gray-500: #4B5563;
  --color-brand-gray-600: #374151;
  
  /* Additional Vibrant Accents */
  --color-accent-indigo: #6366f1;
  --color-accent-violet: #8b5cf6;
  --color-accent-amber: #f59e0b;
  --color-accent-emerald: #10b981;
  --color-accent-rose: #f43f5e;
  --color-accent-sky: #0ea5e9;
  --color-accent-fuchsia: #d946ef;
}

@layer base {
  body {
    @apply font-sans bg-brand-gray-50 text-brand-black antialiased selection:bg-black selection:text-white;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display tracking-tight leading-tight;
  }
}

@layer components {
  .glass-card {
    @apply bg-white/80 backdrop-blur-xl border border-brand-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-all duration-500 rounded-[2.5rem];
  }

  .glass-card:hover {
    @apply shadow-[0_30px_60px_rgba(0,0,0,0.08)] border-brand-gray-300 -translate-y-1.5;
  }

  .interactive-button {
    @apply transition-all duration-300 active:scale-95 hover:shadow-xl;
  }

  .neo-blur {
    @apply bg-white/40 backdrop-blur-md border border-white/20;
  }

  .color-glow-indigo { @apply shadow-[0_0_40px_rgba(99,102,241,0.15)]; }
  .color-glow-violet { @apply shadow-[0_0_40px_rgba(139,92,246,0.15)]; }
  .color-glow-emerald { @apply shadow-[0_0_40px_rgba(16,185,129,0.15)]; }
  .color-glow-rose { @apply shadow-[0_0_40px_rgba(244,63,94,0.15)]; }
  .color-glow-amber { @apply shadow-[0_0_40px_rgba(245,158,11,0.15)]; }
  .color-glow-sky { @apply shadow-[0_0_40px_rgba(14,165,233,0.15)]; }
  .color-glow-fuchsia { @apply shadow-[0_0_40px_rgba(217,70,239,0.15)]; }
  .color-glow-black { @apply shadow-[0_0_40px_rgba(0,0,0,0.1)]; }
}
