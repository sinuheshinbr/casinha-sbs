import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile } from "@/app/actions-profile";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Meu perfil</h2>
      <ProfileForm profile={profile} />
    </div>
  );
}
