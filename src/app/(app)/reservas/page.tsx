import Link from "next/link";
import { getReservations, getDeclines } from "@/app/actions";
import {
  getCurrentWeekendKey,
  getWeekendInfo,
  shiftWeekend,
} from "@/lib/dates";
import { TOTAL_SPOTS, MEMBERS, getMemberByEmail } from "@/lib/members";
import { getDb } from "@/lib/mongodb";
import ReservationBoard from "@/components/ReservationBoard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const member = getMemberByEmail(session.user.email);
  if (!member) redirect("/login");

  const { w } = await searchParams;
  const currentKey = getCurrentWeekendKey();
  const weekendKey = w || currentKey;
  const weekend = getWeekendInfo(weekendKey);
  const isPast = weekendKey < currentKey;
  const isCurrent = weekendKey === currentKey;

  const prevKey = shiftWeekend(weekendKey, -1);
  const nextKey = shiftWeekend(weekendKey, 1);

  const [reservations, declines] = await Promise.all([
    getReservations(weekendKey),
    getDeclines(weekendKey),
  ]);
  const activeCount = Math.min(reservations.length, TOTAL_SPOTS);
  const db = getDb();
  const memberEmails = MEMBERS.filter((m) => m.email).map((m) => m.email.toLowerCase());
  const reservationEmails = reservations.map((r) => r.memberEmail).filter(Boolean);
  const allEmails = [...new Set([...memberEmails, ...reservationEmails])];
  const dbUsers = await db
    .collection("users")
    .find({ email: { $in: allEmails } })
    .toArray();
  const nameMap = new Map<string, string>();
  // MEMBERS como fallback
  for (const m of MEMBERS) {
    if (m.email) nameMap.set(m.email.toLowerCase(), m.name);
  }
  // DB sobrescreve
  for (const u of dbUsers) {
    nameMap.set(u.email as string, u.name as string);
  }
  const allMembers = MEMBERS.filter((m) => m.email).map((m) => ({
    email: m.email.toLowerCase(),
    name: nameMap.get(m.email.toLowerCase()) || m.name,
  }));

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/reservas?w=${prevKey}`}
            className="text-stone-400 hover:text-stone-700 p-1 text-xl font-bold"
            aria-label="Fim de semana anterior"
          >
            &lsaquo;
          </Link>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-stone-800 capitalize">
              {weekend.saturdayLabel} &mdash; {weekend.sundayLabel}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {activeCount}/{TOTAL_SPOTS} vagas preenchidas
            </p>
            {!isCurrent && (
              <Link
                href="/reservas"
                className="text-xs text-green-700 hover:underline"
              >
                Voltar para esta semana
              </Link>
            )}
          </div>
          <Link
            href={`/reservas?w=${nextKey}`}
            className="text-stone-400 hover:text-stone-700 p-1 text-xl font-bold"
            aria-label="Próximo fim de semana"
          >
            &rsaquo;
          </Link>
        </div>
      </div>

      <ReservationBoard
        reservations={reservations}
        declines={declines}
        allMembers={allMembers}
        nameMap={Object.fromEntries(nameMap)}
        totalSpots={TOTAL_SPOTS}
        memberEmail={member.email.toLowerCase()}
        weekendKey={weekendKey}
        isPast={isPast}
      />
    </>
  );
}
