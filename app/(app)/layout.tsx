import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full relative z-10 w-full overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 selection:bg-[var(--color-neon-green)] selection:text-black">
          {children}
        </main>
      </div>
    </div>
  );
}
