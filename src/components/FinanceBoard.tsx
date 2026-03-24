"use client";

import { useState, useTransition } from "react";
import {
  addExpense,
  removeExpense,
  markPaid,
  unmarkPaid,
  addIncome,
  removeIncome,
} from "@/app/actions-finance";
import type { Expense, MemberPayment, Income } from "@/app/actions-finance";

const MONTHLY_CONTRIBUTION = 200;

interface Props {
  month: string;
  expenses: Expense[];
  payments: MemberPayment[];
  income: Income[];
  totalExpenses: number;
  allMemberNames: string[];
  isAdmin: boolean;
}

const EXPENSE_CATEGORIES = [
  { value: "aluguel", label: "Aluguel" },
  { value: "internet", label: "Internet" },
  { value: "luz", label: "Luz" },
  { value: "gas", label: "Gás" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

const INCOME_TYPES = [
  { value: "visitante", label: "Visitante" },
  { value: "airbnb", label: "Airbnb" },
  { value: "outros", label: "Outros" },
];

function currency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceBoard({
  month,
  expenses,
  payments,
  income,
  totalExpenses,
  allMemberNames,
  isAdmin,
}: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const paidMap = new Map(payments.map((p) => [p.memberName, p]));
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const expectedTotal = allMemberNames.length * MONTHLY_CONTRIBUTION;
  const pendingTotal = expectedTotal - totalPaid;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded">
          {error}
        </div>
      )}

      {/* Resumo do mês */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-stone-800 mb-3">Resumo do mês</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Entradas (moradores)</span>
            <span className="text-green-700 font-medium">
              + {currency(totalPaid)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Entradas (visitantes)</span>
            <span className="text-green-700 font-medium">
              + {currency(totalIncome)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Saídas (despesas)</span>
            <span className="text-red-600 font-medium">
              - {currency(totalExpenses)}
            </span>
          </div>
          <div className="border-t border-stone-200 pt-1.5 flex justify-between font-semibold">
            <span className="text-stone-700">Saldo do mês</span>
            <span
              className={
                totalPaid + totalIncome - totalExpenses >= 0
                  ? "text-green-700"
                  : "text-red-600"
              }
            >
              {currency(totalPaid + totalIncome - totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Moradores - contribuição mensal */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-baseline mb-3">
          <h3 className="font-semibold text-stone-800">
            Contribuição mensal
          </h3>
          <span className="text-sm text-stone-500">
            {currency(MONTHLY_CONTRIBUTION)}/morador
          </span>
        </div>

        <div className="space-y-2">
          {allMemberNames.map((name) => {
            const payment = paidMap.get(name);
            return (
              <div
                key={name}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${payment ? "bg-green-500" : "bg-stone-300"
                      }`}
                  />
                  <span
                    className={`text-sm truncate ${payment ? "text-stone-500" : "text-stone-800"
                      }`}
                  >
                    {name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {payment ? (
                    <>
                      <span className="text-xs text-green-600 font-medium">
                        {currency(payment.amount)}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setError("");
                            startTransition(async () => {
                              const r = await unmarkPaid(payment._id);
                              if (r.error) setError(r.error);
                            });
                          }}
                          disabled={isPending}
                          className="text-stone-400 hover:text-red-500 text-xs"
                          title="Desfazer"
                        >
                          &times;
                        </button>
                      )}
                    </>
                  ) : isAdmin ? (
                    <MemberPayRow
                      name={name}
                      month={month}
                      isPending={isPending}
                      startTransition={startTransition}
                      setError={setError}
                    />
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">
                      {currency(MONTHLY_CONTRIBUTION)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between text-sm">
          <span className="text-stone-500">
            {payments.length}/{allMemberNames.length} pagaram
          </span>
          {pendingTotal > 0 ? (
            <span className="text-amber-600 font-medium">
              {currency(pendingTotal)} em aberto
            </span>
          ) : (
            <span className="text-green-600 font-medium">Todos em dia</span>
          )}
        </div>
      </div>

      {/* Contribuições de visitantes */}
      <IncomeSection
        month={month}
        income={income}
        totalIncome={totalIncome}
        isAdmin={isAdmin}
        isPending={isPending}
        startTransition={startTransition}
        setError={setError}
      />

      {/* Despesas (saídas do caixa) */}
      <ExpensesSection
        month={month}
        expenses={expenses}
        totalExpenses={totalExpenses}
        isAdmin={isAdmin}
        isPending={isPending}
        startTransition={startTransition}
        setError={setError}
      />
    </div>
  );
}

// --- Member Pay Row ---

function MemberPayRow({
  name,
  month,
  isPending,
  startTransition,
  setError,
}: {
  name: string;
  month: string;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  setError: (e: string) => void;
}) {
  const [amount, setAmount] = useState(String(MONTHLY_CONTRIBUTION));

  function handlePay() {
    const val = parseFloat(amount.replace(",", "."));
    if (!val || val <= 0) return;
    setError("");
    startTransition(async () => {
      const r = await markPaid(month, name, val);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-stone-400">R$</span>
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-16 border border-stone-300 rounded px-1.5 py-0.5 text-xs text-right"
      />
      <button
        onClick={handlePay}
        disabled={isPending}
        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 transition-colors"
      >
        Marcar pago
      </button>
    </div>
  );
}

// --- Expenses Section ---

function ExpensesSection({
  month,
  expenses,
  totalExpenses,
  isAdmin,
  isPending,
  startTransition,
  setError,
}: {
  month: string;
  expenses: Expense[];
  totalExpenses: number;
  isAdmin: boolean;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  setError: (e: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("aluguel");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  function handleAdd() {
    const val = parseFloat(amount.replace(",", "."));
    if (!val || val <= 0) return;
    setError("");
    startTransition(async () => {
      const label = EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
      const r = await addExpense(month, category, description || label, val);
      if (r.error) {
        setError(r.error);
      } else {
        setDescription("");
        setAmount("");
        setShowForm(false);
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeExpense(id);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="font-semibold text-stone-800">Despesas</h3>
        <span className="text-sm font-medium text-red-600">
          - {currency(totalExpenses)}
        </span>
      </div>

      {expenses.length === 0 && (
        <p className="text-sm text-stone-400 mb-3">
          Nenhuma despesa registrada.
        </p>
      )}

      {expenses.length > 0 && (
        <div className="space-y-2 mb-3">
          {expenses.map((exp) => (
            <div
              key={exp._id}
              className="flex items-center justify-between py-1"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm text-stone-800">
                  {exp.description ||
                    EXPENSE_CATEGORIES.find((c) => c.value === exp.category)
                      ?.label ||
                    exp.category}
                </span>
                <span className="text-xs text-stone-400 ml-2 capitalize">
                  {EXPENSE_CATEGORIES.find((c) => c.value === exp.category)
                    ?.label || exp.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-red-600">
                  - {currency(exp.amount)}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(exp._id)}
                    disabled={isPending}
                    className="text-stone-400 hover:text-red-500 text-lg font-bold px-1"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
        >
          + Adicionar despesa
        </button>
      )}

      {isAdmin && showForm && (
        <div className="border-t border-stone-200 pt-3 mt-3 space-y-2">
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="flex-1 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor (R$)"
              className="flex-1 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !amount}
              className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-stone-400 hover:text-stone-600 text-sm px-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Income Section ---

function IncomeSection({
  month,
  income,
  totalIncome,
  isAdmin,
  isPending,
  startTransition,
  setError,
}: {
  month: string;
  income: Income[];
  totalIncome: number;
  isAdmin: boolean;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  setError: (e: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("visitante");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  function handleAdd() {
    const val = parseFloat(amount.replace(",", "."));
    if (!val || val <= 0 || !description.trim()) return;
    setError("");
    startTransition(async () => {
      const r = await addIncome(month, type, description, val);
      if (r.error) {
        setError(r.error);
      } else {
        setDescription("");
        setAmount("");
        setShowForm(false);
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeIncome(id);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="font-semibold text-stone-800">
          Contribuições de visitantes
        </h3>
        {totalIncome > 0 && (
          <span className="text-sm font-medium text-green-700">
            + {currency(totalIncome)}
          </span>
        )}
      </div>

      {income.length === 0 && (
        <p className="text-sm text-stone-400 mb-3">
          Nenhuma contribuição registrada.
        </p>
      )}

      {income.length > 0 && (
        <div className="space-y-2 mb-3">
          {income.map((inc) => (
            <div
              key={inc._id}
              className="flex items-center justify-between py-1"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm text-stone-800">
                  {inc.description}
                </span>
                <span className="text-xs text-stone-400 ml-2 capitalize">
                  {inc.type}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-green-700">
                  + {currency(inc.amount)}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(inc._id)}
                    disabled={isPending}
                    className="text-stone-400 hover:text-red-500 text-lg font-bold px-1"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
        >
          + Adicionar contribuição
        </button>
      )}

      {isAdmin && showForm && (
        <div className="border-t border-stone-200 pt-3 mt-3 space-y-2">
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              {INCOME_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              className="flex-1 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor (R$)"
              className="flex-1 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !amount || !description.trim()}
              className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-stone-400 hover:text-stone-600 text-sm px-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
