export const theme = {
  colors: {
    // Backgrounds
    background: "#03050C",           // main page bg (Deep space/void black)
    surface: "#090E17",              // secondary surfaces
    card: "rgba(11, 15, 25, 0.7)",   // glassmorphic card base
    cardHover: "rgba(18, 24, 38, 0.9)",

    // Borders & Glass
    border: "rgba(255, 255, 255, 0.06)",
    glassBorder: "1px solid rgba(255, 255, 255, 0.08)",

    // Text
    textPrimary: "#F8FAFC",          // stark white for readability
    textSecondary: "#8B9BB4",        // muted blue-grey
    textAccent: "#38BDF8",           // active tab/text

    // Accents & Neon (for anti-gravity premium look)
    neonBlue: "#3B82F6",
    neonCyan: "#22D3EE",
    neonRed: "#EF4444",
    neonPurple: "#8B5CF6",
    neonYellow: "#FBBF24",
    accent: "#0EA5E9",

    // AI Cards specific
    aiCardBg: "rgba(15, 23, 42, 0.3)",
    riskAnalyzerBg: "rgba(30, 10, 15, 0.3)", // Slight red tint for risk areas
    biometricBg: "rgba(10, 20, 25, 0.3)",
    evidenceBg: "rgba(12, 18, 30, 0.3)",
    
    // Status colors
    success: "#10B981",              // green clear
    warning: "#F59E0B",              // yellow warning
    danger: "#EF4444",               // red critical
    caution: "#EAB308",              // yellow caution
    online: "#059669",               // green online indicator

    // Gradients
    gradientPrimary: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
    gradientDanger: "linear-gradient(135deg, #EF4444 0%, #9F1239 100%)",
    gradientWarning: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    gradientBarCyan: "linear-gradient(90deg, #0284C7 0%, #22D3EE 100%)",
    gradientBarRed: "linear-gradient(90deg, #9F1239 0%, #EF4444 100%)",
  },

  // Glassmorphism utilities
  glass: {
    background: "rgba(255, 255, 255, 0.02)",
    backdropBlur: "16px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    shadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  },

  // Shadow / Glow (neon effect)
  glow: {
    neonBlue: "0 0 20px -4px rgba(59, 130, 246, 0.5)",
    neonRed: "0 0 20px -4px rgba(239, 68, 68, 0.5)",
    neonCyan: "0 0 20px -4px rgba(34, 211, 238, 0.5)",
    neonYellow: "0 0 20px -4px rgba(251, 191, 36, 0.5)",
    panelGlow: "inset 0 0 20px rgba(255, 255, 255, 0.02)",
  }
} as const;

export type Theme = typeof theme;
