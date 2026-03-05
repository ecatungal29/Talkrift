import Sidebar from "@/components/layout/Sidebar";
import { PresenceProvider } from "@/components/layout/PresenceProvider";
import { CallModal } from "@/components/call/CallModal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PresenceProvider />
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
      <CallModal />
    </div>
  );
}
