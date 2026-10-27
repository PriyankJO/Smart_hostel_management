import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

function LayoutContent() {
  const { isOpen, close } = useSidebar();
  return (
    <div className="flex min-h-screen bg-parchment font-body">
      <Sidebar isOpen={isOpen} onClose={close} />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
