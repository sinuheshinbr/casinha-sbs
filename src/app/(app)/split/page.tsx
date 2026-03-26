import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getMyTrips,
  getTrip,
  getTripExpenses,
  getTripBalances,
  getSettlements,
} from "@/app/actions-split";
import type { Balance, Debt } from "@/app/actions-split";

function calculateDebts(balances: Balance[]): Debt[] {
  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ email: b.email, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.net > 0.01)
    .map((b) => ({ email: b.email, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    debts.push({ from: debtors[i].email, to: creditors[j].email, amount: Math.round(amount * 100) / 100 });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return debts;
}
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
    const [trip, expenses, balances, settlements] = await Promise.all([
      getTrip(tripId),
      getTripExpenses(tripId),
      getTripBalances(tripId),
      getSettlements(tripId),
    ]);

    if (!trip) redirect("/split");

    const debts = calculateDebts(balances);

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800">{trip.name}</h2>
        <TripDetail
          trip={trip}
          expenses={expenses}
          balances={balances}
          debts={debts}
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
