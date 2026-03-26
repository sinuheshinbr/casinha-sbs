"use client";

import { useState, useTransition } from "react";
import {
  addBenfeitoria,
  removeBenfeitoria,
  toggleVote,
} from "@/app/actions-benfeitorias";
import type { Benfeitoria } from "@/app/actions-benfeitorias";

function currency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  benfeitorias: Benfeitoria[];
  memberEmail: string;
  nameMap: Record<string, string>;
}

export default function BenfeitoriasBoard({ benfeitorias, memberEmail, nameMap }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  function resolveName(email: string): string {
    return nameMap[email] ?? email;
  }

  function handleAdd() {
    const val = parseFloat(budget.replace(",", "."));
    if (!description.trim()) return;
    if (isNaN(val) || val < 0) return;
    setError("");
    startTransition(async () => {
      const r = await addBenfeitoria(description, val);
      if (r.error) {
        setError(r.error);
      } else {
        setDescription("");
        setBudget("");
        setShowForm(false);
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeBenfeitoria(id);
      if (r.error) setError(r.error);
    });
  }

  function handleVote(id: string) {
    setError("");
    startTransition(async () => {
      const r = await toggleVote(id);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded">
          {error}
        </div>
      )}

      {benfeitorias.length === 0 && !showForm && (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-stone-400">
            Nenhuma benfeitoria sugerida ainda.
          </p>
        </div>
      )}

      {benfeitorias.map((b) => {
        const hasVoted = b.votes.includes(memberEmail);
        const isAuthor = b.createdBy === memberEmail;
        return (
          <div key={b._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleVote(b._id)}
                disabled={isPending}
                className={`flex flex-col items-center shrink-0 pt-0.5 ${
                  hasVoted
                    ? "text-green-700"
                    : "text-stone-300 hover:text-green-600"
                } transition-colors`}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold">{b.votes.length}</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-stone-800">{b.description}</p>
                  {isAuthor && (
                    <button
                      onClick={() => handleRemove(b._id)}
                      disabled={isPending}
                      className="text-stone-400 hover:text-red-500 text-lg font-bold px-1 shrink-0"
                    >
                      &times;
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-stone-500 font-medium">
                    {currency(b.budget)}
                  </span>
                  <span className="text-xs text-stone-400">
                    por {resolveName(b.createdBy)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
        >
          + Sugerir benfeitoria
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a benfeitoria..."
            rows={3}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Orçamento estimado (R$)"
              className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !description.trim() || !budget}
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
