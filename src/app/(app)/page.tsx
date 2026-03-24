import Link from "next/link";
import { getReservations, getDeclines } from "@/app/actions";
import {
  getCurrentWeekendKey,
  getWeekendInfo,
  shiftWeekend,
} from "@/lib/dates";
import { TOTAL_SPOTS, MEMBERS } from "@/lib/members";
import ReservationBoard from "@/components/ReservationBoard";
import { auth } from "@/auth";
import { getMemberByEmail } from "@/lib/members";

export const dynamic = "force-dynamic";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const session = await auth();
  const member = getMemberByEmail(session!.user!.email!);

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
  const allMemberNames = MEMBERS.map((m) => m.name);

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/?w=${prevKey}`}
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
                href="/"
                className="text-xs text-green-700 hover:underline"
              >
                Voltar para esta semana
              </Link>
            )}
          </div>
          <Link
            href={`/?w=${nextKey}`}
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
        allMemberNames={allMemberNames}
        totalSpots={TOTAL_SPOTS}
        memberName={member!.name}
        weekendKey={weekendKey}
        isPast={isPast}
      />
    </>
  );
}
