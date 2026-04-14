"use client";

import { useState, useTransition } from "react";
import {
  addEnergia,
  removeEnergia,
  markEnergiaPaid,
  unmarkEnergiaPaid,
} from "@/app/actions-finance";
import type { Energia } from "@/app/actions-finance";

interface MemberEntry {
  email: string;
  name: string;
}

interface Props {
  energias: Energia[];
  month: string;
  members: MemberEntry[];
  isAdmin: boolean;
  currentUserEmail: string;
  defaultTariff: number;
}

function currency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatKwh(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatTariff(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

export default function EnergiaBoard({
  energias,
  month,
  members,
  isAdmin,
  currentUserEmail,
  defaultTariff,
}: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [kwh, setKwh] = useState("");
  const [tariff, setTariff] = useState(
    defaultTariff > 0 ? String(defaultTariff).replace(".", ",") : ""
  );
  const [note, setNote] = useState("");

  const nameMap = new Map(members.map((m) => [m.email, m.name]));

  const totalPaid = energias.reduce(
    (s, e) => s + (e.paidAt ? e.amount : 0),
    0
  );
  const totalPending = energias.reduce(
    (s, e) => s + (!e.paidAt ? e.amount : 0),
    0
  );

  function handleAdd() {
    const kwhVal = parseFloat(kwh.replace(",", "."));
    const tariffVal = parseFloat(tariff.replace(",", "."));
    if (!kwhVal || kwhVal <= 0 || !tariffVal || tariffVal <= 0) return;
    setError("");
    startTransition(async () => {
      const r = await addEnergia(month, kwhVal, tariffVal, note);
      if (r.error) {
        setError(r.error);
      } else {
        setKwh("");
        setNote("");
        setShowForm(false);
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeEnergia(id);
      if (r.error) setError(r.error);
    });
  }

  function handleMarkPaid(id: string) {
    setError("");
    startTransition(async () => {
      const r = await markEnergiaPaid(id);
      if (r.error) setError(r.error);
    });
  }

  function handleUnmarkPaid(id: string) {
    setError("");
    startTransition(async () => {
      const r = await unmarkEnergiaPaid(id);
      if (r.error) setError(r.error);
    });
  }

  const previewKwh = parseFloat(kwh.replace(",", ".") || "0");
  const previewTariff = parseFloat(tariff.replace(",", ".") || "0");
  const previewTotal =
    Math.round(previewKwh * previewTariff * 100) / 100;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="font-semibold text-stone-800">
          Energia (carros elétricos)
        </h3>
        {energias.length > 0 && (
          <span className="text-xs text-stone-400">
            {energias.length} carga{energias.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-3">
          {error}
        </div>
      )}

      {energias.length === 0 && !showForm && (
        <p className="text-sm text-stone-400 mb-3">
          Nenhuma carga registrada.
        </p>
      )}

      {energias.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {energias.map((e) => {
            const paid = !!e.paidAt;
            const isOwn = e.memberEmail === currentUserEmail;
            const canRemove = isAdmin || (isOwn && !paid);
            return (
              <div
                key={e._id}
                className="border-b border-stone-100 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        paid ? "bg-green-500" : "bg-stone-300"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium truncate ${
                        paid ? "text-stone-500" : "text-stone-800"
                      }`}
                    >
                      {nameMap.get(e.memberEmail) || e.memberEmail}
                    </span>
                    <span className="text-xs text-stone-400 shrink-0">
                      {formatDayMonth(e.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-medium ${
                        paid ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {currency(e.amount)}
                    </span>
                    {canRemove && (
                      <button
                        onClick={() => handleRemove(e._id)}
                        disabled={isPending}
                        className="text-stone-400 hover:text-red-500 text-lg font-bold px-1"
                        title="Remover"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-0.5 pl-4">
                  <span className="text-xs text-stone-500">
                    {formatKwh(e.kwh)} kWh × R$ {formatTariff(e.tariff)}
                    {e.note && ` — ${e.note}`}
                  </span>
                  {!paid && isAdmin && (
                    <button
                      onClick={() => handleMarkPaid(e._id)}
                      disabled={isPending}
                      className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 transition-colors shrink-0"
                    >
                      Marcar pago
                    </button>
                  )}
                  {paid && isAdmin && (
                    <button
                      onClick={() => handleUnmarkPaid(e._id)}
                      disabled={isPending}
                      className="text-xs text-stone-400 hover:text-red-500 shrink-0"
                      title="Desfazer"
                    >
                      desfazer
                    </button>
                  )}
                  {!paid && !isAdmin && (
                    <span className="text-xs text-stone-400 shrink-0">
                      em aberto
                    </span>
                  )}
                  {paid && !isAdmin && (
                    <span className="text-xs text-green-600 shrink-0">
                      pago
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {energias.length > 0 && (
        <div className="border-t border-stone-200 pt-2 flex justify-between text-sm">
          {totalPending > 0 ? (
            <span className="text-amber-600 font-medium">
              {currency(totalPending)} em aberto
            </span>
          ) : (
            <span className="text-green-600 font-medium">Tudo pago</span>
          )}
          <span className="text-stone-500">
            {currency(totalPaid)} pago
          </span>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-green-700 hover:text-green-900 font-medium mt-3"
        >
          + Nova carga
        </button>
      )}

      {showForm && (
        <div className="border-t border-stone-200 pt-3 mt-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-stone-500 block mb-1">
                kWh
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={kwh}
                onChange={(e) => setKwh(e.target.value)}
                placeholder="0,00"
                className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm text-right"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-stone-500 block mb-1">
                Tarifa (R$/kWh)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={tariff}
                onChange={(e) => setTariff(e.target.value)}
                placeholder="0,0000"
                className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm text-right"
              />
            </div>
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
          />

          {previewTotal > 0 && (
            <p className="text-sm text-stone-600">
              Total:{" "}
              <span className="font-medium text-stone-800">
                {currency(previewTotal)}
              </span>
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !kwh || !tariff}
              className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
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
