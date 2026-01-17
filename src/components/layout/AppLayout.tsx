import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 lg:pt-0 pt-14">
        <div className="container max-w-[1200px] py-6 px-4 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
