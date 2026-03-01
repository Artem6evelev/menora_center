"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  title: string;
  link: string;
}

interface NavDropdownProps {
  label: string;
  items: DropdownItem[];
}

export const NavDropdown = ({ label, items }: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full",
          isOpen
            ? "text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 z-50"
          >
            <div className="p-1.5 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-border/40 shadow-xl rounded-2xl overflow-hidden ring-1 ring-black/5">
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <Link
                    key={item.link}
                    href={item.link}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors font-medium text-center"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
