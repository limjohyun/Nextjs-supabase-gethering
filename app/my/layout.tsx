import { MainNav } from "@/components/main-nav";

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <MainNav />
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-8 p-5">
        {children}
      </div>
    </div>
  );
}
