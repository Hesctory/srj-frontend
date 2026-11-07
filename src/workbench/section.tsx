import { useState, type ReactNode, type Ref } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  /** Controlled when given (a contextual button opens the section). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  sectionRef?: Ref<HTMLDetailsElement>;
}

/** A collapsible block of the console. */
export const Section = ({
  title,
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  sectionRef,
}: SectionProps) => {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = openProp ?? ownOpen;
  return (
    <details
      ref={sectionRef}
      className="wb-section"
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (next === open) return;
        if (onOpenChange) onOpenChange(next);
        else setOwnOpen(next);
      }}
    >
      <summary>{title}</summary>
      {children}
    </details>
  );
};
