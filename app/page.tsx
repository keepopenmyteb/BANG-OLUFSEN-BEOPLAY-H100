import Navbar from "../components/Navbar";
import ScrollCanvas from "../components/ScrollCanvas";
import {
  CTASection,
  EngineeringSection,
  HeroText,
  NoiseSection,
  SoundSection
} from "../components/TextSections";

export default function Home() {
  return (
    <main style={{ position: "relative" }} id="overview">
      <Navbar />
      <ScrollCanvas />
      
      {/* 
        The parent container size dictates the scroll length and therefore animation speed.
        A 500vh container ensures a long, smooth scrolling experience interacting with the 240 frames
      */}
      <div className="content-container">
        <HeroText />
        
        <div style={{ height: '40vh' }}></div>
        <EngineeringSection />
        
        <div style={{ height: '50vh' }}></div>
        <NoiseSection />
        
        <div style={{ height: '50vh' }}></div>
        <SoundSection />
        
        <div style={{ height: '70vh' }}></div>
        <CTASection />
      </div>
    </main>
  );
}
