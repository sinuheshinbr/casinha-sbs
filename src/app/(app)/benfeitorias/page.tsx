import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberByEmail, MEMBERS } from "@/lib/members";
import { getDb } from "@/lib/mongodb";
import { getBenfeitorias } from "@/app/actions-benfeitorias";
import BenfeitoriasBoard from "@/components/BenfeitoriasBoard";

export const dynamic = "force-dynamic";

export default async function BenfeitoriasPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const member = getMemberByEmail(session.user.email);
  if (!member) redirect("/login");

  const benfeitorias = await getBenfeitorias();

  const db = getDb();
  const allEmails = [
    ...MEMBERS.filter((m) => m.email).map((m) => m.email.toLowerCase()),
    ...benfeitorias.map((b) => b.createdBy),
    ...benfeitorias.flatMap((b) => b.votes),
  ];
  const uniqueEmails = [...new Set(allEmails.filter(Boolean))];
  const dbUsers = await db
    .collection("users")
    .find({ email: { $in: uniqueEmails } })
    .toArray();
  const nameMap: Record<string, string> = {};
  for (const m of MEMBERS) {
    if (m.email) nameMap[m.email.toLowerCase()] = m.name;
  }
  for (const u of dbUsers) {
    nameMap[u.email as string] = u.name as string;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Benfeitorias</h2>
      <p className="text-sm text-stone-500">
        Sugira melhorias e vote para priorizar.
      </p>
      <BenfeitoriasBoard
        benfeitorias={benfeitorias}
        memberEmail={member.email.toLowerCase()}
        nameMap={nameMap}
      />
    </div>
  );
}
