"use client";

import { useState, useTransition } from "react";
import {
  addFaxina,
  removeFaxina,
  markFaxinaPaid,
  unmarkFaxinaPaid,
} from "@/app/actions-finance";
import type { Faxina } from "@/app/actions-finance";

interface MemberEntry {
  email: string;
  name: string;
}

interface Props {
  faxinas: Faxina[];
  month: string;
  members: MemberEntry[];
  isAdmin: boolean;
  defaultParticipants: string[];
  defaultLabel: string;
}

function currency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FaxinaBoard({
  faxinas,
  month,
  members,
  isAdmin,
  defaultParticipants,
  defaultLabel,
}: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [amount, setAmount] = useState("100");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(defaultParticipants)
  );

  function toggleMember(email: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function handleCreate() {
    const val = parseFloat(amount.replace(",", "."));
    if (!val || val <= 0 || !label.trim() || selectedMembers.size === 0) return;
    setError("");
    startTransition(async () => {
      const r = await addFaxina(
        month,
        label,
        val,
        Array.from(selectedMembers)
      );
      if (r.error) {
        setError(r.error);
      } else {
        setLabel(defaultLabel);
        setAmount("100");
        setSelectedMembers(new Set(defaultParticipants));
        setShowForm(false);
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeFaxina(id);
      if (r.error) setError(r.error);
    });
  }

  function handleMarkPaid(faxinaId: string, email: string) {
    setError("");
    startTransition(async () => {
      const r = await markFaxinaPaid(faxinaId, email);
      if (r.error) setError(r.error);
    });
  }

  function handleUnmarkPaid(faxinaId: string, email: string) {
    setError("");
    startTransition(async () => {
      const r = await unmarkFaxinaPaid(faxinaId, email);
      if (r.error) setError(r.error);
    });
  }

  const nameMap = new Map(members.map((m) => [m.email, m.name]));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-stone-800 mb-3">Faxina</h3>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-3">
          {error}
        </div>
      )}

      {faxinas.length === 0 && !showForm && (
        <p className="text-sm text-stone-400 mb-3">
          Nenhuma faxina registrada.
        </p>
      )}

      {faxinas.map((faxina, i) => {
        const perPerson =
          faxina.participants.length > 0
            ? Math.ceil((faxina.amount / faxina.participants.length) * 100) /
              100
            : 0;
        const paidSet = new Set(faxina.paidBy);
        const paidCount = faxina.paidBy.length;
        const totalCount = faxina.participants.length;
        const pendingAmount = (totalCount - paidCount) * perPerson;

        return (
          <div key={faxina._id}>
            {i > 0 && <div className="border-t border-stone-200 my-3" />}

            <div className="flex justify-between items-baseline mb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-stone-800">
                  {faxina.label}
                </span>
                <span className="text-sm text-stone-500">
                  {currency(faxina.amount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">
                  {currency(perPerson)}/pessoa
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(faxina._id)}
                    disabled={isPending}
                    className="text-stone-400 hover:text-red-500 text-lg font-bold px-1"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {faxina.participants.map((email) => {
                const paid = paidSet.has(email);
                return (
                  <div
                    key={email}
                    className="flex items-center justify-between py-0.5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          paid ? "bg-green-500" : "bg-stone-300"
                        }`}
                      />
                      <span
                        className={`text-sm truncate ${
                          paid ? "text-stone-500" : "text-stone-800"
                        }`}
                      >
                        {nameMap.get(email) || email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {paid ? (
                        <>
                          <span className="text-xs text-green-600 font-medium">
                            {currency(perPerson)}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() =>
                                handleUnmarkPaid(faxina._id, email)
                              }
                              disabled={isPending}
                              className="text-stone-400 hover:text-red-500 text-xs"
                              title="Desfazer"
                            >
                              &times;
                            </button>
                          )}
                        </>
                      ) : isAdmin ? (
                        <button
                          onClick={() => handleMarkPaid(faxina._id, email)}
                          disabled={isPending}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 transition-colors"
                        >
                          Marcar pago
                        </button>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">
                          {currency(perPerson)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-stone-100 mt-2 pt-2 flex justify-between text-sm">
              <span className="text-stone-500">
                {paidCount}/{totalCount} pagaram
              </span>
              {pendingAmount > 0 ? (
                <span className="text-amber-600 font-medium">
                  {currency(pendingAmount)} em aberto
                </span>
              ) : (
                <span className="text-green-600 font-medium">Todos em dia</span>
              )}
            </div>
          </div>
        );
      })}

      {isAdmin && !showForm && (
        <>
          {faxinas.length > 0 && (
            <div className="border-t border-stone-200 mt-3 pt-3" />
          )}
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-green-700 hover:text-green-900 font-medium"
          >
            + Nova faxina
          </button>
        </>
      )}

      {isAdmin && showForm && (
        <div className="border-t border-stone-200 pt-3 mt-3 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (ex: 28/03)"
              className="flex-1 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-stone-400">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor"
                className="w-20 border border-stone-300 rounded-lg px-2 py-1.5 text-sm text-right"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-stone-500 mb-1.5">Participantes:</p>
            <div className="grid grid-cols-2 gap-1">
              {members.map((m) => (
                <label
                  key={m.email}
                  className="flex items-center gap-1.5 text-sm text-stone-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(m.email)}
                    onChange={() => toggleMember(m.email)}
                    className="rounded border-stone-300 text-green-700 focus:ring-green-700"
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>

          {selectedMembers.size > 0 && amount && (
            <p className="text-xs text-stone-500">
              {currency(
                Math.ceil(
                  (parseFloat(amount.replace(",", ".") || "0") /
                    selectedMembers.size) *
                    100
                ) / 100
              )}
              /pessoa
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={
                isPending ||
                !label.trim() ||
                !amount ||
                selectedMembers.size === 0
              }
              className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              Criar
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
