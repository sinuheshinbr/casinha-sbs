import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberByEmail, canEditFinance, MEMBERS } from "@/lib/members";
import {
  getCurrentMonth,
  shiftMonth,
  formatMonthBR,
} from "@/lib/dates";
import {
  getExpenses,
  getPayments,
  getIncome,
  getCaixaBalance,
} from "@/app/actions-finance";
import FinanceBoard from "@/components/FinanceBoard";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const member = getMemberByEmail(session.user.email);
  if (!member) redirect("/login");

  const { m } = await searchParams;
  const currentMonth = getCurrentMonth();
  const month = m || currentMonth;
  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const isAdmin = canEditFinance(member.name);

  const [expenses, payments, income, caixaBalance] = await Promise.all([
    getExpenses(month),
    getPayments(month),
    getIncome(month),
    getCaixaBalance(),
  ]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const allMemberNames = MEMBERS.map((m) => m.name);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Financeiro</h2>

      {/* Caixa */}
      <div
        className={`rounded-lg shadow p-4 ${
          caixaBalance >= 1800
            ? "bg-green-50 border border-green-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <p className="text-xs uppercase tracking-wide text-stone-500">
          Saldo em caixa
        </p>
        <p
          className={`text-2xl font-bold ${
            caixaBalance >= 0 ? "text-green-700" : "text-red-600"
          }`}
        >
          {caixaBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        {caixaBalance < 1800 && (
          <p className="text-xs text-amber-600 mt-1">
            Abaixo do mínimo de R$&nbsp;1.800,00
          </p>
        )}
      </div>

      {/* Month navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/financeiro?m=${prevMonth}`}
            className="text-stone-400 hover:text-stone-700 p-1 text-xl font-bold"
          >
            &lsaquo;
          </Link>
          <div className="text-center">
            <p className="font-semibold text-stone-800 capitalize">
              {formatMonthBR(month)}
            </p>
            {month !== currentMonth && (
              <Link
                href="/financeiro"
                className="text-xs text-green-700 hover:underline"
              >
                Voltar para mês atual
              </Link>
            )}
          </div>
          <Link
            href={`/financeiro?m=${nextMonth}`}
            className="text-stone-400 hover:text-stone-700 p-1 text-xl font-bold"
          >
            &rsaquo;
          </Link>
        </div>
      </div>

      <FinanceBoard
        month={month}
        expenses={expenses}
        payments={payments}
        income={income}
        totalExpenses={totalExpenses}
        allMemberNames={allMemberNames}
        isAdmin={isAdmin}
      />
    </div>
  );
}
