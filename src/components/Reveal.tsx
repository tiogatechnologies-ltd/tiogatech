import { ReactNode, ElementType } from "react";
import { useReveal } from "@/hooks/useScrollReveal";

interface RevealProps {
  children: ReactNode;
  direction?: "up" | "fade" | "left" | "right" | "scale";
  delay?: number;
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
  duration = 850,
  distance = 28,
  threshold = 0.15,
  className,
  as: Tag = "div",
}: RevealProps) => {
  const { ref, style } = useReveal<HTMLDivElement>({ direction, delay, duration, distance, threshold });
  return (
    <Tag ref={ref} style={style} className={className}>
      {children}
    </Tag>
  );
};

export default Reveal;
