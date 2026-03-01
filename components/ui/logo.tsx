import Image from "next/image";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Image
        src="/logos/menora-logo.svg"
        alt="Menorah Center"
        // Увеличиваем исходные размеры для четкости
        width={200}
        height={80}
        // h-20 = 80px (было h-12). w-auto сохранит пропорции.
        className="object-contain h-16 md:h-13 w-auto transition-transform hover:scale-105"
        priority
      />
    </div>
  );
};
