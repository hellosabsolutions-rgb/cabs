import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PlatformShowcase } from './components/PlatformShowcase';
import { ServiceTypes } from './components/ServiceTypes';
import { FeaturesBento } from './components/FeaturesBento';
import { StatsSection } from './components/StatsSection';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { InquiryForm } from './components/InquiryForm';
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/ScrollProgress';
import { CookieBanner } from './components/CookieBanner';
import { CarScene, CursorFollower } from './components/ClientComponents';

export default function Home() {
  return (
    <div className="landing-page-shell min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-full focus:bg-accent focus:text-white focus:text-sm"
      >
        Skip to content
      </a>

      <CursorFollower />
      <ScrollProgress />
      <Navbar />

      <main id="main">
        <Hero />

        <section className="relative -mt-12 mb-4 bg-bg">
          <CarScene />
        </section>

        <section id="platform" className="bg-surface">
          <PlatformShowcase />
        </section>

        <ServiceTypes />
        <FeaturesBento />
        <StatsSection />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <InquiryForm />
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
