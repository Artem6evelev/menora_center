import { Container } from "@/components/container";
import { Hero } from "@/components/hero";
// import { Background } from "@/components/ui/background"; // Или sparks-background
import { Features } from "@/components/features";
import { Companies } from "@/components/companies"; // Если используете
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";

export default function Home() {
  return (
    // overflow-x-hidden критически важен для мобильных, чтобы не было горизонтальной прокрутки
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 1. ФОН: Фиксированный, один на всю страницу */}
      {/* <Background /> */}

      {/* 2. Основной контент */}
      <div className="relative z-10">
        <Container className="flex flex-col items-center justify-between px-4 sm:px-6 lg:px-8">
          <Hero />
          {/* <Companies /> */}
          <Features />
          <GridFeatures />
          <Testimonials />
        </Container>

        {/* CTA на всю ширину, но с отступами внутри */}
        <div className="relative w-full">
          <CTA />
        </div>
      </div>
    </main>
  );
}
