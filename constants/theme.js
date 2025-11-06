// Minimalist Monochrome Theme
export const COLORS = {
  // Base
  bg: {
    primary: '#000000',
    secondary: '#0a0a0a',
    elevated: '#151515',
    card: '#1a1a1a',
  },
  
  // Borders & Dividers
  border: {
    default: '#2a2a2a',
    subtle: '#1f1f1f',
    strong: '#3a3a3a',
    focus: '#ffffff',
  },
  
  // Text
  text: {
    primary: '#ffffff',
    secondary: '#a0a0a0',
    tertiary: '#666666',
    disabled: '#444444',
  },
  
  // Accents (Monochrome)
  accent: {
    primary: '#ffffff',
    subtle: '#333333',
  },
  
  // States (Monochrome approach)
  state: {
    success: '#ffffff',
    warning: '#888888',
    error: '#666666',
  },
};

// Typography Scale (Minimalist - Only 4 sizes)
export const TYPOGRAPHY = {
  display: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
};

// Spacing Scale (8px base)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Elevation (Minimal shadows for monochrome)
export const ELEVATION = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Thumb Zone Heights (based on ergonomics)
export const THUMB_ZONE = {
  easy: '80%', // Bottom 20%
  comfortable: '60%', // Bottom 40%
  stretch: '40%', // Middle 20%
  hard: '20%', // Top 20%
};

// Animation Timings
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};
