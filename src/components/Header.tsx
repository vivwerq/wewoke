import React from "react";
import ThemeToggle from "@/components/ThemeToggle";

interface HeaderProps {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ title, left, right, className = "" }) => {
  return (
    <header className="relative border-b border-border glass-morphism">
      <div className={`container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">{left}</div>
        <div className="flex-1 text-center">{title}</div>
        <div className="flex items-center gap-2">{right ?? <ThemeToggle />}</div>
      </div>
    </header>
  );
};

export default Header;
