import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Pitch from "@/components/dashboard/Pitch";
import { GameweekInfo, PointsBreakdown, LeaderboardRanks, RecentPoints } from "@/components/dashboard/SidebarCards";
import FooterActions from "@/components/dashboard/FooterActions";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-heading selection:bg-primary/30">
      {/* Turf Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
        style={{ 
          backgroundImage: `radial-gradient(#10B981 0.5px, transparent 0.5px)`, 
          backgroundSize: '24px 24px' 
        }} 
      />

      <DashboardNav />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <DashboardHeader />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <GameweekInfo />
            <PointsBreakdown />
          </div>

          {/* Center Column - Pitch */}
          <div className="lg:col-span-6">
            <Pitch />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <LeaderboardRanks />
            <RecentPoints />
          </div>
        </div>

        <FooterActions />
      </main>
    </div>
  );
}
