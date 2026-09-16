import { getCurrentUser, isMarketing } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NoUsersSeeded } from "@/components/layout/no-users-seeded";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <NoUsersSeeded />;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar showAdmin={isMarketing(user)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
