import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          Casinha São Bento
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Faça login para gerenciar suas reservas
        </p>

        {error === "AccessDenied" && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">
            Seu email não está cadastrado como morador.
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-green-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-green-800 transition-colors"
          >
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
