"use client";

import { useState, useTransition } from "react";
import { capitalize } from "@/lib/capitalize";
import {
  createTrip,
  deleteTrip,
  addTripExpense,
  removeTripExpense,
  addParticipant,
  removeParticipant,
  addSettlement,
  removeSettlement,
} from "@/app/actions-split";
import type { Trip, TripExpense, Balance, Debt, Settlement } from "@/app/actions-split";

function currency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

function maskPix(digits: string): string {
  if (digits.length <= 11) {
    if (digits.length === 11 && !isValidCpf(digits)) {
      const ddd = digits.slice(0, 2);
      const rest = digits.slice(2);
      return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
    }
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  if (digits.length <= 14) {
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  return digits;
}

function formatPixDisplay(value: string): string {
  if (/^\d+$/.test(value)) return maskPix(value);
  if (/^[0-9a-f]+$/i.test(value) && value.length >= 20) {
    const hex = value.toLowerCase();
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)]
      .filter(Boolean)
      .join("-");
  }
  return value;
}

function Avatar({ name, image, size = 24 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full shrink-0"
        referrerPolicy="no-referrer"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="rounded-full bg-stone-200 text-stone-500 flex items-center justify-center shrink-0 text-xs font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

// --- Trip List ---

export function TripList({
  trips,
  userEmail,
}: {
  trips: Trip[];
  userEmail: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    setError("");
    const participantEmails = emails
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter(Boolean);
    startTransition(async () => {
      const r = await createTrip(name, participantEmails);
      if (r.error) {
        setError(r.error);
      } else {
        setName("");
        setEmails("");
        setShowForm(false);
      }
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      const r = await deleteTrip(id);
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

      {trips.length === 0 && !showForm && (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-stone-400">Nenhuma viagem ainda.</p>
        </div>
      )}

      {trips.map((trip) => (
        <a
          key={trip._id}
          href={`/split?t=${trip._id}`}
          className="block bg-white rounded-lg shadow p-4 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-800">{trip.name}</p>
              <p className="text-xs text-stone-400 mt-1">
                {trip.participants.length} participantes
              </p>
            </div>
            <div className="flex items-center gap-2">
              {trip.createdBy === userEmail && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(trip._id);
                  }}
                  disabled={isPending}
                  className="text-stone-400 hover:text-red-500 text-lg font-bold px-1"
                >
                  &times;
                </button>
              )}
              <span className="text-stone-300 text-xl">&rsaquo;</span>
            </div>
          </div>
        </a>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
        >
          + Nova viagem
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da viagem"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Emails dos participantes (separados por vírgula ou um por linha)"
            rows={3}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isPending || !name.trim()}
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

// --- Trip Detail ---

export function TripDetail({
  trip,
  expenses,
  balances,
  debts,
  settlements,
  userEmail,
}: {
  trip: Trip;
  expenses: TripExpense[];
  balances: Balance[];
  debts: Debt[];
  settlements: Settlement[];
  userEmail: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(userEmail);
  const [splitAll, setSplitAll] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(trip.participants)
  );

  const nameMap = new Map(balances.map((b) => [b.email, b.name]));

  function toggleParticipant(email: string) {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function handleAdd() {
    const val = parseFloat(amount.replace(",", "."));
    if (!description.trim() || !val || val <= 0) return;
    const split = splitAll ? trip.participants : [...selectedParticipants];
    if (split.length === 0) return;
    setError("");
    startTransition(async () => {
      const r = await addTripExpense(trip._id, description, val, split, paidBy);
      if (r.error) {
        setError(r.error);
      } else {
        setDescription("");
        setAmount("");
        setPaidBy(userEmail);
        setSplitAll(true);
        setSelectedParticipants(new Set(trip.participants));
        setShowForm(false);
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeTripExpense(id);
      if (r.error) setError(r.error);
    });
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <a
        href="/split"
        className="text-sm text-green-700 hover:text-green-900 font-medium"
      >
        &lsaquo; Voltar
      </a>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded">
          {error}
        </div>
      )}

      {/* Saldos */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-stone-800 mb-3">Saldos</h3>
        <div className="space-y-2">
          {balances.map((b) => (
            <div
              key={b.email}
              className="flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2">
                <Avatar name={b.name} image={b.image} />
                <span className="text-sm text-stone-800">{b.name}</span>
              </div>
              <span
                className={`text-sm font-medium ${
                  b.net > 0
                    ? "text-green-700"
                    : b.net < 0
                      ? "text-red-600"
                      : "text-stone-400"
                }`}
              >
                {b.net > 0 ? "+" : ""}
                {currency(b.net)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagamentos */}
      <PaymentsSection
        trip={trip}
        debts={debts}
        settlements={settlements}
        balances={balances}
        userEmail={userEmail}
        isPending={isPending}
        startTransition={startTransition}
        setError={setError}
      />

      {/* Despesas */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-baseline mb-3">
          <h3 className="font-semibold text-stone-800">Despesas</h3>
          <span className="text-sm font-medium text-stone-500">
            {currency(totalExpenses)}
          </span>
        </div>

        {expenses.length === 0 && (
          <p className="text-sm text-stone-400 mb-3">Nenhuma despesa ainda.</p>
        )}

        {expenses.map((exp) => {
          const isPartial = exp.splitAmong.length < trip.participants.length;
          return (
            <div key={exp._id} className="py-1.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-stone-800">
                    {capitalize(exp.description)}
                  </span>
                  <span className="text-xs text-stone-400 ml-2">
                    {nameMap.get(exp.paidBy) ?? exp.paidBy}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-stone-700">
                    {currency(exp.amount)}
                  </span>
                  <button
                      onClick={() => handleRemove(exp._id)}
                      disabled={isPending}
                      className="text-stone-400 hover:text-red-500 text-lg font-bold px-1"
                    >
                      &times;
                    </button>
                </div>
              </div>
              {isPartial && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Dividido entre:{" "}
                  {exp.splitAmong
                    .map((e) => nameMap.get(e) ?? e)
                    .join(", ")}
                </p>
              )}
            </div>
          );
        })}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-green-700 hover:text-green-900 font-medium mt-3"
          >
            + Adicionar despesa
          </button>
        ) : (
          <div className="border-t border-stone-200 pt-3 mt-3 space-y-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor (R$)"
                className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-stone-500 self-center whitespace-nowrap">Pago por:</span>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm bg-white"
              >
                {trip.participants.map((email) => (
                  <option key={email} value={email}>
                    {nameMap.get(email) ?? email}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={splitAll}
                  onChange={(e) => {
                    setSplitAll(e.target.checked);
                    if (e.target.checked)
                      setSelectedParticipants(new Set(trip.participants));
                  }}
                  className="rounded border-stone-300"
                />
                Dividir igualmente entre todos
              </label>
              {!splitAll && (
                <div className="pl-1 space-y-1 mt-1">
                  {trip.participants.map((email) => (
                    <label
                      key={email}
                      className="flex items-center gap-2 text-sm text-stone-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.has(email)}
                        onChange={() => toggleParticipant(email)}
                        className="rounded border-stone-300"
                      />
                      {nameMap.get(email) ?? email}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={
                  isPending ||
                  !description.trim() ||
                  !amount ||
                  (!splitAll && selectedParticipants.size === 0)
                }
                className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSplitAll(true);
                  setSelectedParticipants(new Set(trip.participants));
                }}
                className="text-stone-400 hover:text-stone-600 text-sm px-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Participantes */}
      <ParticipantsSection
        trip={trip}
        balances={balances}
        isPending={isPending}
        startTransition={startTransition}
        setError={setError}
      />
    </div>
  );
}

// --- Payments Section ---

function PaymentsSection({
  trip,
  debts,
  settlements,
  balances,
  userEmail,
  isPending,
  startTransition,
  setError,
}: {
  trip: Trip;
  debts: Debt[];
  settlements: Settlement[];
  balances: Balance[];
  userEmail: string;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  setError: (e: string) => void;
}) {
  const nameMap = new Map(balances.map((b) => [b.email, b.name]));
  const imageMap = new Map(balances.map((b) => [b.email, b.image]));
  const pixMap = new Map(balances.map((b) => [b.email, b.pixKey]));

  function handleSettle(from: string, to: string, amount: number) {
    setError("");
    startTransition(async () => {
      const r = await addSettlement(trip._id, from, to, amount);
      if (r.error) setError(r.error);
    });
  }

  function handleUnsettle(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeSettlement(id);
      if (r.error) setError(r.error);
    });
  }

  const hasDebts = debts.length > 0;
  const hasSettlements = settlements.length > 0;

  if (!hasDebts && !hasSettlements) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-stone-800 mb-3">Pagamentos</h3>

      {debts.length > 0 && (
        <div className="space-y-3 mb-3">
          {debts.map((d, i) => {
            const fromName = nameMap.get(d.from) ?? d.from;
            const toName = nameMap.get(d.to) ?? d.to;
            const toImage = imageMap.get(d.to) ?? null;
            const toPixKey = pixMap.get(d.to);
            const isReceiver = userEmail === d.to;

            return (
              <div key={i} className="border border-stone-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm text-stone-800">
                      <span className="font-medium">{fromName}</span>
                      {" deve "}
                      <span className="font-medium">{currency(d.amount)}</span>
                      {" para "}
                      <span className="font-medium">{toName}</span>
                    </span>
                  </div>
                </div>
                {toPixKey && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs text-stone-400">PIX:</span>
                    <span className="text-xs text-stone-600 font-mono bg-stone-50 px-1.5 py-0.5 rounded select-all">
                      {formatPixDisplay(toPixKey)}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(toPixKey)}
                      className="text-xs text-green-700 hover:text-green-900 font-medium"
                    >
                      Copiar
                    </button>
                  </div>
                )}
                {isReceiver && (
                  <button
                    onClick={() => handleSettle(d.from, d.to, d.amount)}
                    disabled={isPending}
                    className="mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors font-medium"
                  >
                    Marcar como pago
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {debts.length === 0 && (
        <p className="text-sm text-green-600 font-medium mb-3">
          Todas as dívidas foram quitadas!
        </p>
      )}

      {hasSettlements && (
        <>
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mt-4 mb-2">
            Pagamentos confirmados
          </h4>
          <div className="space-y-2">
            {settlements.map((s) => {
              const fromName = nameMap.get(s.from) ?? s.from;
              const toName = nameMap.get(s.to) ?? s.to;
              const isReceiver = userEmail === s.to;

              return (
                <div
                  key={s._id}
                  className="flex items-center justify-between py-1"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-stone-500">
                      {fromName} pagou {currency(s.amount)} para {toName}
                    </span>
                  </div>
                  {isReceiver && (
                    <button
                      onClick={() => handleUnsettle(s._id)}
                      disabled={isPending}
                      className="text-stone-400 hover:text-red-500 text-lg font-bold px-1 shrink-0"
                      title="Desfazer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// --- Participants Section ---

function ParticipantsSection({
  trip,
  balances,
  isPending,
  startTransition,
  setError,
}: {
  trip: Trip;
  balances: Balance[];
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  setError: (e: string) => void;
}) {
  const [newEmail, setNewEmail] = useState("");

  function handleAdd() {
    if (!newEmail.trim()) return;
    const addToAll = confirm(
      "Deseja adicionar esta pessoa a todas as despesas que foram divididas igualmente entre todos?"
    );
    setError("");
    startTransition(async () => {
      const r = await addParticipant(trip._id, newEmail, addToAll);
      if (r.error) setError(r.error);
      else setNewEmail("");
    });
  }

  function handleRemove(email: string) {
    setError("");
    startTransition(async () => {
      const r = await removeParticipant(trip._id, email);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-stone-800 mb-3">Participantes</h3>
      <div className="space-y-1 mb-3">
        {balances.map((b) => (
          <div
            key={b.email}
            className="flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={b.name} image={b.image} />
              <span className="text-sm text-stone-700">{b.name}</span>
              <span className="text-xs text-stone-400 truncate">{b.email}</span>
            </div>
            {b.email !== trip.createdBy && (
              <button
                onClick={() => handleRemove(b.email)}
                disabled={isPending}
                className="text-stone-400 hover:text-red-500 text-lg font-bold px-1 shrink-0"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email do participante"
          className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newEmail.trim()}
          className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
