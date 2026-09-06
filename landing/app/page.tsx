import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { IntegrationStrip } from './components/IntegrationStrip';
import { FleetShowcase } from './components/FleetShowcase';
import { FeaturesBento } from './components/FeaturesBento';
import { ProductShowcase } from './components/ProductShowcase';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { Stats } from './components/Stats';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { InquiryForm } from './components/InquiryForm';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/ScrollProgress';
import { CookieBanner } from './components/CookieBanner';

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <IntegrationStrip />
        <FleetShowcase />
        <FeaturesBento />
        <ProductShowcase />
        <HowItWorks />
        <Pricing />
        <Stats />
        <Testimonials />
        <FAQ />
        <InquiryForm />
        <CallToAction />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
