import { auth, signOut } from "@/auth";
import { getMemberByEmail } from "@/lib/members";
import Link from "next/link";
import NavTabs from "@/components/NavTabs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const member = session?.user?.email
    ? getMemberByEmail(session.user.email)
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-green-800 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Casinha São Bento
              </h1>
              <p className="text-green-200 text-sm mt-1">
                São Bento do Sapucaí
              </p>
            </div>
            <div className="text-right">
              {member ? (
                <>
                  <p className="text-green-100 text-sm">{member.name}</p>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-green-300 hover:text-white text-xs underline"
                    >
                      Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-green-200 hover:text-white text-sm font-medium"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
          <NavTabs isLoggedIn={!!member} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
