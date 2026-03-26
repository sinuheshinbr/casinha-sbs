import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberByEmail } from "@/lib/members";
import { getBenfeitorias } from "@/app/actions-benfeitorias";
import BenfeitoriasBoard from "@/components/BenfeitoriasBoard";

export const dynamic = "force-dynamic";

export default async function BenfeitoriasPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const member = getMemberByEmail(session.user.email);
  if (!member) redirect("/login");

  const benfeitorias = await getBenfeitorias();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Benfeitorias</h2>
      <p className="text-sm text-stone-500">
        Sugira melhorias e vote para priorizar.
      </p>
      <BenfeitoriasBoard benfeitorias={benfeitorias} memberName={member.name} />
    </div>
  );
}
