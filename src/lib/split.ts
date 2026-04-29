import type { Balance, Debt } from "@/app/actions-split";

export function calculateDebts(balances: Balance[]): Debt[] {
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
    debts.push({
      from: debtors[i].email,
      to: creditors[j].email,
      amount: Math.round(amount * 100) / 100,
    });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return debts;
}
