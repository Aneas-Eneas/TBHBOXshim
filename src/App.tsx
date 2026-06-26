import { Navigate, Route, Routes } from "react-router-dom";
import { SiteShell } from "./components/SiteShell";
import { AboutPage } from "./pages/AboutPage";
import { ChestCategoryPage } from "./pages/ChestCategoryPage";
import { ChestsPage } from "./pages/ChestsPage";
import { ContactPage } from "./pages/ContactPage";
import { DisclaimerPage } from "./pages/DisclaimerPage";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { ProbabilityPage } from "./pages/ProbabilityPage";

export default function App() {
  return (
    <SiteShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chests" element={<ChestsPage />} />
        <Route path="/chests/normal" element={<ChestCategoryPage category="normal" />} />
        <Route path="/chests/stage-boss" element={<ChestCategoryPage category="stage_boss" />} />
        <Route path="/chests/act-boss" element={<ChestCategoryPage category="act_boss" />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/probability" element={<ProbabilityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteShell>
  );
}
