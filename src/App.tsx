import { AbstractCitation } from "./components/AbstractCitation";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { TryItYourself } from "./components/TryItYourself";
import { KeyDiscoveries } from "./components/KeyDiscoveries";
import { RepresentativeExamples } from "./components/RepresentativeExamples";
import { SiteHeader } from "./components/SiteHeader";
import { WhyItMatters } from "./components/WhyItMatters";

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <WhyItMatters />
        <KeyDiscoveries />
        <HowItWorks />
        <RepresentativeExamples />
        <TryItYourself />
        <AbstractCitation />
      </main>
    </>
  );
}
