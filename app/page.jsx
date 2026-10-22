import Hero from "@/components/Hero";
import DriftLoop from "@/components/DriftLoop";
import ProductShowcase from "@/components/ProductShowcase";
import PopularPicks from "@/components/PopularPicks";
import StylistDemo from "@/components/StylistDemo";
import AnalysisTeaser from "@/components/AnalysisTeaser";
import IdentityShowcase from "@/components/IdentityShowcase";
import CategoryGrid from "@/components/CategoryGrid";
import StitchTeaser from "@/components/StitchTeaser";
import FeaturedProduct from "@/components/FeaturedProduct";
import NewArrivals from "@/components/NewArrivals";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <DriftLoop />
      <ProductShowcase />
      <PopularPicks />
      <StylistDemo />
      <AnalysisTeaser />
      <IdentityShowcase />
      <CategoryGrid />
      <StitchTeaser />
      <FeaturedProduct />
      <NewArrivals />
      <Testimonials />
      <Footer />
    </main>
  );
}
