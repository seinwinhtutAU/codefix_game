import "@/app/globals.css";
import MenuBar from "../components/MenuBar";
import "highlight.js/styles/github-dark.css";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <MenuBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
