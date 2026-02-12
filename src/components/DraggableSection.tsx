import { ReactNode } from "react";

interface SectionProps {
  id: string;
  children: ReactNode;
  isAdmin?: boolean;
}

// Simplified wrapper - drag and drop functionality has been removed
export const DraggableSection = ({ id, children }: SectionProps) => {
  return (
    <div className="relative">
      {children}
    </div>
  );
};
