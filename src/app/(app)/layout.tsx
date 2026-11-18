import { requireAccess } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireAccess();
  return <div className="min-h-screen lg:flex"><Sidebar role={role}/><main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-12"><div className="max-w-6xl mx-auto">{children}</div></main></div>;
}
