import { HeroSection } from "@/components/home/HeroSection";
import { HomeLayout } from "@/components/home/HomeLayout";
import { FeaturedQuotes } from "@/components/home/FeaturedQuotes";
import { PopularCategories } from "@/components/home/PopularCategories";
import { TrendingQuotes } from "@/components/home/TrendingQuotes";
import { DailyQuoteSidebar } from "@/components/home/DailyQuoteSidebar";
import { RandomQuoteSidebar } from "@/components/home/RandomQuoteSidebar"; // Add this import
import { ThisDayAuthors } from "@/components/authors/ThisDayAuthors"; // Add import

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <p>see upload</p>
      <div className="container px-4 md:px-6 py-6 md:py-16 space-y-16">
        <PopularCategories />
        <TrendingQuotes />
        <HomeLayout
          sidebar={
            <div className="space-y-6">
              {/* Daily Quote - Updated to use the new component */}
              <DailyQuoteSidebar />
              <RandomQuoteSidebar />

              {/* Other sidebar widgets */}
              <ThisDayAuthors />
            </div>
          }
        >
          <FeaturedQuotes />
        </HomeLayout>
      </div>
    </div>
  );
}