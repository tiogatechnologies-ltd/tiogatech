import { ReactNode, ElementType } from "react";
import { useReveal } from "@/hooks/useScrollReveal";

interface RevealProps {
  children: ReactNode;
  direction?: "up" | "fade" | "left" | "right" | "scale";
  delay?: number;
  /** When provided, multiplies an 80ms stagger onto delay */
  index?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  className?: string;
  as?: ElementType;
}

const Reveal = ({
  children,
  direction = "up",
  delay = 0,
  index,
  duration = 1100,
  distance = 18,
  threshold = 0.12,
  className,
  as: Tag = "div",
}: RevealProps) => {
  const finalDelay = delay + (typeof index === "number" ? index * 80 : 0);
  const { ref, style } = useReveal<HTMLDivElement>({ direction, delay: finalDelay, duration, distance, threshold });
  return (
    <Tag ref={ref} style={style} className={className}>
      {children}
    </Tag>
  );
};

export default Reveal;
