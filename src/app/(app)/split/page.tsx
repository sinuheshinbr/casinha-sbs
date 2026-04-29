import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getMyTrips,
  getTrip,
  getTripExpenses,
  getTripBalances,
  getSettlements,
  getPendingSettlements,
} from "@/app/actions-split";
import { calculateDebts } from "@/lib/split";
import { TripList, TripDetail } from "@/components/SplitBoard";

export const dynamic = "force-dynamic";

export default async function SplitPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const userEmail = session.user.email.toLowerCase();
  const { t: tripId } = await searchParams;

  if (tripId) {
    const [trip, expenses, balances, settlements, pendings] = await Promise.all([
      getTrip(tripId),
      getTripExpenses(tripId),
      getTripBalances(tripId),
      getSettlements(tripId),
      getPendingSettlements(tripId),
    ]);

    if (!trip) redirect("/split");

    const closed = pendings.length > 0;
    const debts = closed ? [] : calculateDebts(balances);

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800">{trip.name}</h2>
        <TripDetail
          trip={trip}
          expenses={expenses}
          balances={balances}
          debts={debts}
          pendings={pendings}
          closed={closed}
          settlements={settlements}
          userEmail={userEmail}
        />
      </div>
    );
  }

  const trips = await getMyTrips();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Split</h2>
      <p className="text-sm text-stone-500">
        Divida despesas de viagens com seus amigos.
      </p>
      <TripList trips={trips} userEmail={userEmail} />
    </div>
  );
}
