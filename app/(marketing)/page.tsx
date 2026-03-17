import { Container } from "@/components/container";
import { Hero } from "@/components/hero";
import { Background } from "@/components/background";
import { Features } from "@/components/features";
import { Companies } from "@/components/companies";
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";
import { EventsSection } from "@/components/sections/event-section";

// 1. ИМПОРТИРУЕМ СЕКЦИЮ УСЛУГ
import { ServicesSection } from "@/components/sections/service-section";

export default function Home() {
  return (
    <div className="relative">
      <div className="absolute inset-0 h-full w-full overflow-hidden ">
        <Background />
      </div>
      <Container className="flex min-h-screen flex-col items-center justify-between ">
        <Hero />
        <Companies />
        <Features />

        <EventsSection />

        {/* 2. ВСТАВЛЯЕМ СЕКЦИЮ УСЛУГ */}
        <ServicesSection />

        <GridFeatures />
        <Testimonials />
      </Container>
      <div className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <Background />
        </div>
        <CTA />
      </div>
    </div>
  );
}
