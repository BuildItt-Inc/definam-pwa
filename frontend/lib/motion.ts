import { Variants } from "framer-motion";

export const standardEasing = [0.4, 0, 0.2, 1] as const;

export const scaleTap = {
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15, ease: standardEasing },
};

export const modalSheet: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
    }
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ease: standardEasing, duration: 0.3 }
  },
};

// Directional slide + fade between learning-flow steps. `custom` is +1 when
// advancing (Continue) and -1 when going back, so the outgoing content exits
// toward the direction it came from and the incoming content enters from the
// opposite side — used with AnimatePresence's `custom` prop and a `key`
// keyed on the current step.
export const stepSlide: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.32, ease: standardEasing },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
    transition: { duration: 0.32, ease: standardEasing },
  }),
};
