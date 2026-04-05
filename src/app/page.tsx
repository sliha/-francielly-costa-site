import HeroSection from '@/components/home/HeroSection'
import FiberBROWSSection from '@/components/home/FiberBROWSSection'
import StatsSection from '@/components/home/StatsSection'
import ServicesSection from '@/components/home/ServicesSection'
import AboutPreviewSection from '@/components/home/AboutPreviewSection'
import BeforeAfterSection from '@/components/home/BeforeAfterSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import InstagramSection from '@/components/home/InstagramSection'
import FAQSection from '@/components/home/FAQSection'
import LocationSection from '@/components/home/LocationSection'
import InstagramPopup from '@/components/home/InstagramPopup'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FiberBROWSSection />
      <StatsSection />
      <ServicesSection />
      <AboutPreviewSection />
      <BeforeAfterSection />
      <TestimonialsSection />
      <InstagramSection />
      <FAQSection />
      <LocationSection />
      <InstagramPopup />
    </>
  )
}
