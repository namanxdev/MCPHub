// Easing curves
export const EASE_MICRO = [0.25, 0.1, 0.25, 1] as const;
export const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as const;
export const EASE_EXPO = [0.77, 0, 0.175, 1] as const;
export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;
export const SPRING_MAGNETIC = { damping: 25, stiffness: 300 };

// Framer Motion variants
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_SMOOTH, delay },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_SMOOTH, delay },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_SMOOTH, delay },
  }),
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_EXPO, delay },
  }),
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_EXPO, delay },
  }),
};

export const lineReveal = {
  hidden: { y: "105%" },
  visible: (delay = 0) => ({
    y: "0%",
    transition: { duration: 1.05, ease: EASE_EXPO, delay },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};
