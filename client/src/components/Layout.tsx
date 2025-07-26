import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-full">
      <Sidebar />
      <div className="pl-64">
        <Header />
        {children}
      </div>
    </div>
  );
}
