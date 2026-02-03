import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BackToTop from "./BackToTop";

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans text-(--color-text-primary) bg-(--color-background)">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default PublicLayout;
