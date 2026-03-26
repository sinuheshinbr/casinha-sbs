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
  const email = session?.user?.email;
  const isLoggedIn = !!email;
  const member = email ? getMemberByEmail(email) : null;

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
              {isLoggedIn ? (
                <>
                  <Link
                    href="/perfil"
                    className="text-green-100 hover:text-white text-sm inline-flex items-center gap-1"
                  >
                    {session?.user?.name}
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-60">
                      <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.463 11.098a.25.25 0 00-.064.108l-.563 1.97 1.971-.564a.25.25 0 00.108-.064l8.61-8.61a.25.25 0 000-.354L12.427 2.487z" />
                    </svg>
                  </Link>
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
          <NavTabs isLoggedIn={isLoggedIn} isMember={!!member} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
