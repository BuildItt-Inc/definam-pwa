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
