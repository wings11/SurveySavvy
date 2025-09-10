// Design System for Survey Savvy - Clean & Minimalist
export const DESIGN_TOKENS = {
  // Colors - Modern, accessible palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe', 
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      900: '#0c4a6e'
    },
    
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    
    // Neutrals - Clean grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    
    // Rank Colors - Sophisticated palette
    ranks: {
      novice: '#6b7280',      // Gray
      apprentice: '#059669',   // Emerald
      disciple: '#0ea5e9',     // Sky
      scholar: '#7c3aed',      // Violet
      methodologist: '#ea580c', // Orange
      fellow: '#dc2626',       // Red
      luminary: '#ca8a04',     // Yellow
      chancellor: '#4338ca'    // Indigo
    }
  },

  // Typography - Modern font stack
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace'
  },

  // Spacing - Consistent rhythm
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px  
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
    '4xl': '4rem'    // 64px
  },

  // Shadows - Subtle depth
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },

  // Border Radius - Consistent curves
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px'
  }
};

// Component Styles - Reusable patterns
export const COMPONENT_STYLES = {
  // Cards
  card: {
    base: 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden',
    interactive: 'hover:shadow-md transition-all duration-200 cursor-pointer',
    padding: 'p-6'
  },

  // Buttons
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg px-4 py-2.5 transition-colors',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-4 py-2.5 transition-colors',
    success: 'bg-success hover:bg-green-600 text-white font-medium rounded-lg px-4 py-2.5 transition-colors',
    ghost: 'hover:bg-gray-50 text-gray-600 font-medium rounded-lg px-4 py-2.5 transition-colors'
  },

  // Status indicators
  status: {
    active: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium',
    inactive: 'bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium',
    processing: 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium'
  },

  // Progress bars
  progress: {
    container: 'w-full bg-gray-200 rounded-full h-2',
    bar: 'bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300'
  }
};

// Icon mappings for common actions
export const ICONS = {
  // Actions
  create: '✨',
  help: '🤝',
  points: '💎',
  rank: '🏆',
  survey: '📊',
  user: '👤',
  settings: '⚙️',
  
  // Status
  success: '✅',
  warning: '⚠️',
  error: '❌',
  loading: '⏳',
  
  // Navigation
  home: '🏠',
  dashboard: '📈',
  back: '←',
  forward: '→',
  
  // Social
  share: '📤',
  like: '❤️',
  comment: '💬'
};

export default DESIGN_TOKENS;
