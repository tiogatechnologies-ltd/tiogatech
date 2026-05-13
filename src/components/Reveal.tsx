import { ReactNode, ElementType } from "react";
import { motion, Variants } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  direction?: "up" | "fade" | "left" | "right" | "scale";
  delay?: number;
  index?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  className?: string;
  as?: ElementType;
  /** When true, children animate with stagger via container */
  stagger?: boolean;
}

const offsetFor = (dir: RevealProps["direction"], d: number) => {
  switch (dir) {
    case "fade": return { x: 0, y: 0 };
    case "left": return { x: -d, y: 0 };
    case "right": return { x: d, y: 0 };
    case "scale": return { x: 0, y: 0 };
    case "up":
    default: return { x: 0, y: d };
  }
};

const Reveal = ({
  children,
  direction = "up",
  delay = 0,
  index,
  duration,
  distance = 50,
  threshold = 0.15,
  className,
  as,
  stagger,
}: RevealProps) => {
  const finalDelay = (delay + (typeof index === "number" ? index * 90 : 0)) / 1000;
  const offset = offsetFor(direction, distance);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      rotate: direction === "fade" ? 0 : -2,
      scale: direction === "scale" ? 0.96 : 1,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: finalDelay,
        ...(stagger ? { staggerChildren: 0.09, delayChildren: finalDelay } : {}),
      },
    },
  };

  const MotionTag = as ? (motion as any)[typeof as === "string" ? as : "div"] || motion.div : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
};

export default Reveal;

/** Child item used inside a Reveal stagger container */
export const RevealItem = ({
  children,
  className,
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) => {
  const variants: Variants = {
    hidden: { opacity: 0, y: distance, rotate: -2 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
};
