"use client";

import { useEffect, useRef, useState, useTransition, useSyncExternalStore } from "react";
import Image from "next/image";
import { capitalize } from "@/lib/capitalize";

const subscribeLocation = () => () => {};
const getLocationOrigin = () => window.location.origin;
const getServerLocationOrigin = () => "";
import {
  createTrip,
  deleteTrip,
  addTripExpense,
  updateTripExpense,
  removeTripExpense,
  addParticipant,
  removeParticipant,
  addSettlement,
  removeSettlement,
  searchUsers,
  closeTripDebts,
  reopenTripDebts,
  payPendingSettlement,
} from "@/app/actions-split";
import type {
  Trip,
  TripExpense,
  Balance,
  Debt,
  Settlement,
  PendingSettlement,
  UserSuggestion,
} from "@/app/actions-split";

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
      <Image
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

// --- Expense Form ---

interface ExpenseFormValues {
  description: string;
  amount: number;
  paidBy: string;
  splitAmongAll: boolean;
  splitAmong: string[];
}

function ExpenseForm({
  trip,
  nameMap,
  userEmail,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  trip: Trip;
  nameMap: Map<string, string>;
  userEmail: string;
  initial?: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmongAll: boolean;
    splitAmong: string[];
  };
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const initialSplit = initial?.splitAmong ?? trip.participants;
  const matchesAllCurrent =
    initialSplit.length === trip.participants.length &&
    trip.participants.every((p) => initialSplit.includes(p));
  const initialSplitAll = initial
    ? initial.splitAmongAll || matchesAllCurrent
    : true;
  const initialIncludeFuture = initial
    ? initial.splitAmongAll === true
    : true;

  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? userEmail);
  const [splitAll, setSplitAll] = useState(initialSplitAll);
  const [includeFuture, setIncludeFuture] = useState(initialIncludeFuture);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(initialSplit)
  );

  function toggleParticipant(email: string) {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function handleSubmit() {
    const val = parseFloat(amount.replace(",", "."));
    if (!description.trim() || !val || val <= 0) return;

    let splitAmongAll: boolean;
    let splitAmong: string[];
    if (splitAll) {
      splitAmongAll = includeFuture;
      splitAmong = includeFuture ? [] : trip.participants;
    } else {
      splitAmongAll = false;
      splitAmong = [...selectedParticipants];
      if (splitAmong.length === 0) return;
    }

    onSubmit({
      description: description.trim(),
      amount: val,
      paidBy,
      splitAmongAll,
      splitAmong,
    });
  }

  return (
    <div className="space-y-2">
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
        <span className="text-xs text-stone-500 self-center whitespace-nowrap">
          Pago por:
        </span>
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
        {splitAll ? (
          <label className="flex items-center gap-2 text-sm text-stone-600 pl-5">
            <input
              type="checkbox"
              checked={includeFuture}
              onChange={(e) => setIncludeFuture(e.target.checked)}
              className="rounded border-stone-300"
            />
            Incluir novos participantes automaticamente
          </label>
        ) : (
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
          onClick={handleSubmit}
          disabled={
            isPending ||
            !description.trim() ||
            !amount ||
            (!splitAll && selectedParticipants.size === 0)
          }
          className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="text-stone-400 hover:text-stone-600 text-sm px-2"
        >
          Cancelar
        </button>
      </div>
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
  const [selectedParticipants, setSelectedParticipants] = useState<UserSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchSeq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setHighlightIdx(-1);
      return;
    }
    const seq = ++searchSeq.current;
    const handle = setTimeout(async () => {
      const exclude = [userEmail, ...selectedParticipants.map((p) => p.email)];
      const results = await searchUsers(q, exclude);
      if (seq !== searchSeq.current) return;
      setSuggestions(results);
      setHighlightIdx(-1);
    }, 200);
    return () => clearTimeout(handle);
  }, [query, selectedParticipants, userEmail]);

  function pickSuggestion(s: UserSuggestion) {
    setSelectedParticipants((prev) =>
      prev.some((p) => p.email === s.email) ? prev : [...prev, s]
    );
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function addRawEmail() {
    const raw = query.trim().toLowerCase();
    if (!raw) return;
    if (raw === userEmail.toLowerCase()) {
      setQuery("");
      return;
    }
    if (selectedParticipants.some((p) => p.email === raw)) {
      setQuery("");
      return;
    }
    setSelectedParticipants((prev) => [
      ...prev,
      { email: raw, name: raw, image: null },
    ]);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function removeSelected(email: string) {
    setSelectedParticipants((prev) => prev.filter((p) => p.email !== email));
  }

  function handleQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
      if (e.key === "Enter" && highlightIdx >= 0) {
        e.preventDefault();
        pickSuggestion(suggestions[highlightIdx]);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      addRawEmail();
      return;
    }
    if (e.key === "Backspace" && !query && selectedParticipants.length > 0) {
      setSelectedParticipants((prev) => prev.slice(0, -1));
    }
  }

  function handleCreate() {
    if (!name.trim()) return;
    setError("");
    const participantEmails = selectedParticipants.map((p) => p.email);
    startTransition(async () => {
      const r = await createTrip(name, participantEmails);
      if (r.error) {
        setError(r.error);
      } else {
        setName("");
        setSelectedParticipants([]);
        setQuery("");
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
          <div className="border border-stone-300 rounded-lg px-2 py-1.5">
            <div className="flex flex-wrap gap-1 items-center">
              {selectedParticipants.map((p) => (
                <span
                  key={p.email}
                  className="inline-flex items-center gap-1 bg-stone-100 rounded-full pl-1 pr-2 py-0.5 text-xs"
                >
                  <Avatar name={p.name} image={p.image} size={18} />
                  <span className="text-stone-700">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSelected(p.email)}
                    className="text-stone-400 hover:text-red-500 font-bold leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <div className="flex-1 min-w-[8rem] relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={handleQueryKeyDown}
                  placeholder={
                    selectedParticipants.length === 0
                      ? "Nome ou email dos participantes"
                      : ""
                  }
                  autoComplete="off"
                  className="w-full text-sm outline-none px-1 py-0.5"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, i) => (
                      <li
                        key={s.email}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickSuggestion(s);
                        }}
                        onMouseEnter={() => setHighlightIdx(i)}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                          i === highlightIdx ? "bg-stone-100" : ""
                        }`}
                      >
                        <Avatar name={s.name} image={s.image} />
                        <span className="text-stone-700 truncate">{s.name}</span>
                        <span className="text-xs text-stone-400 truncate ml-auto">
                          {s.email}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
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
  pendings,
  closed,
  settlements,
  userEmail,
}: {
  trip: Trip;
  expenses: TripExpense[];
  balances: Balance[];
  debts: Debt[];
  pendings: PendingSettlement[];
  closed: boolean;
  settlements: Settlement[];
  userEmail: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const nameMap = new Map(balances.map((b) => [b.email, b.name]));

  function handleAdd(values: ExpenseFormValues) {
    setError("");
    startTransition(async () => {
      const r = await addTripExpense(
        trip._id,
        values.description,
        values.amount,
        values.splitAmong,
        values.paidBy,
        values.splitAmongAll
      );
      if (r.error) setError(r.error);
      else setShowForm(false);
    });
  }

  function handleUpdate(id: string, values: ExpenseFormValues) {
    setError("");
    startTransition(async () => {
      const r = await updateTripExpense(
        id,
        values.description,
        values.amount,
        values.splitAmong,
        values.paidBy,
        values.splitAmongAll
      );
      if (r.error) setError(r.error);
      else setEditingId(null);
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
  const myTotalCost = expenses.reduce((sum, exp) => {
    if (exp.splitAmong.includes(userEmail)) {
      return sum + exp.amount / exp.splitAmong.length;
    }
    return sum;
  }, 0);

  const myBalance = balances.find((b) => b.email === userEmail);
  const showPixWarning =
    !!myBalance && myBalance.net > 0.01 && !myBalance.pixKey;

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

      {showPixWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-lg">
          Você tem valores a receber, mas ainda não cadastrou uma chave PIX.{" "}
          <a
            href="/perfil"
            className="underline font-medium hover:text-yellow-900"
          >
            Cadastre no seu perfil
          </a>{" "}
          para que os outros vejam a chave e possam te pagar.
        </div>
      )}

      {myTotalCost > 0 && (
        <details className="bg-stone-50 rounded-lg shadow">
          <summary className="p-4 text-center cursor-pointer list-none">
            <p className="text-xs text-stone-400">Meu custo na viagem</p>
            <p className="text-lg font-semibold text-stone-800">{currency(myTotalCost)}</p>
          </summary>
          <div className="px-4 pb-4 space-y-1 border-t border-stone-200 pt-3">
            {expenses
              .filter((exp) => exp.splitAmong.includes(userEmail))
              .map((exp) => (
                <div key={exp._id} className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">{capitalize(exp.description)}</span>
                  <span className="text-sm font-medium text-stone-700">
                    {currency(exp.amount / exp.splitAmong.length)}
                  </span>
                </div>
              ))}
          </div>
        </details>
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
        pendings={pendings}
        closed={closed}
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
          const isEditing = editingId === exp._id;
          return (
            <div key={exp._id} className="py-1.5">
              {isEditing ? (
                <div className="border border-stone-200 rounded-lg p-3 bg-stone-50">
                  <ExpenseForm
                    trip={trip}
                    nameMap={nameMap}
                    userEmail={userEmail}
                    initial={{
                      description: exp.description,
                      amount: exp.amount,
                      paidBy: exp.paidBy,
                      splitAmongAll: exp.splitAmongAll,
                      splitAmong: exp.splitAmong,
                    }}
                    submitLabel="Salvar"
                    onSubmit={(values) => handleUpdate(exp._id, values)}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                  />
                </div>
              ) : (
                <>
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
                        onClick={() => {
                          setEditingId(exp._id);
                          setShowForm(false);
                        }}
                        disabled={isPending}
                        className="text-stone-400 hover:text-green-700 text-sm px-1"
                        title="Editar"
                      >
                        ✎
                      </button>
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
                </>
              )}
            </div>
          );
        })}

        {!showForm ? (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
            className="text-sm text-green-700 hover:text-green-900 font-medium mt-3"
          >
            + Adicionar despesa
          </button>
        ) : (
          <div className="border-t border-stone-200 pt-3 mt-3">
            <ExpenseForm
              trip={trip}
              nameMap={nameMap}
              userEmail={userEmail}
              submitLabel="Adicionar"
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
              isPending={isPending}
            />
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
  pendings,
  closed,
  settlements,
  balances,
  userEmail,
  isPending,
  startTransition,
  setError,
}: {
  trip: Trip;
  debts: Debt[];
  pendings: PendingSettlement[];
  closed: boolean;
  settlements: Settlement[];
  balances: Balance[];
  userEmail: string;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  setError: (e: string) => void;
}) {
  const nameMap = new Map(balances.map((b) => [b.email, b.name]));
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

  function handleClose() {
    if (
      !confirm(
        "Fechar os acertos congela as sugestões atuais. Quem vai pagar quem não muda mais até alguém reabrir. Continuar?"
      )
    )
      return;
    setError("");
    startTransition(async () => {
      const r = await closeTripDebts(trip._id);
      if (r.error) setError(r.error);
    });
  }

  function handleReopen() {
    if (
      !confirm(
        "Reabrir vai recalcular todas as sugestões com base nos saldos atuais. Pagamentos já confirmados continuam registrados. Continuar?"
      )
    )
      return;
    setError("");
    startTransition(async () => {
      const r = await reopenTripDebts(trip._id);
      if (r.error) setError(r.error);
    });
  }

  function handlePayPending(pendingId: string) {
    setError("");
    startTransition(async () => {
      const r = await payPendingSettlement(pendingId);
      if (r.error) setError(r.error);
    });
  }

  const hasDebts = debts.length > 0;
  const hasPendings = pendings.length > 0;
  const hasSettlements = settlements.length > 0;

  if (!hasDebts && !hasPendings && !hasSettlements) return null;

  const closedAt = closed
    ? pendings.reduce<string | null>(
        (min, p) => (min === null || p.createdAt < min ? p.createdAt : min),
        null
      )
    : null;
  const closedAtLabel = closedAt
    ? new Date(closedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  function PairRow({
    from,
    to,
    amount,
    onPay,
  }: {
    from: string;
    to: string;
    amount: number;
    onPay?: () => void;
  }) {
    const fromName = nameMap.get(from) ?? from;
    const toName = nameMap.get(to) ?? to;
    const toPixKey = pixMap.get(to);
    const canSettle = userEmail === to || userEmail === from;

    return (
      <div className="border border-stone-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm text-stone-800">
              <span className="font-medium">{fromName}</span>
              {" deve "}
              <span className="font-medium">{currency(amount)}</span>
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
        {canSettle && onPay && (
          <button
            onClick={onPay}
            disabled={isPending}
            className="mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors font-medium"
          >
            Marcar como pago
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-stone-800 mb-3">Pagamentos</h3>

      {closed && (
        <div className="mb-3 flex items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
          <span className="text-xs text-stone-600">
            Acertos fechados{closedAtLabel ? ` em ${closedAtLabel}` : ""}. Quem
            paga quem não muda mais.
          </span>
          <button
            onClick={handleReopen}
            disabled={isPending}
            className="text-xs text-green-700 hover:text-green-900 font-medium whitespace-nowrap"
          >
            Reabrir
          </button>
        </div>
      )}

      {hasPendings && (
        <div className="space-y-3 mb-3">
          {pendings.map((p) => (
            <PairRow
              key={p._id}
              from={p.from}
              to={p.to}
              amount={p.amount}
              onPay={() => handlePayPending(p._id)}
            />
          ))}
        </div>
      )}

      {!closed && hasDebts && (
        <div className="space-y-3 mb-3">
          {debts.map((d, i) => (
            <PairRow
              key={i}
              from={d.from}
              to={d.to}
              amount={d.amount}
              onPay={() => handleSettle(d.from, d.to, d.amount)}
            />
          ))}
        </div>
      )}

      {!closed && hasDebts && (
        <div className="mb-3">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="w-full bg-stone-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-900 disabled:opacity-50 transition-colors"
            title="Congela as sugestões atuais para que não mudem mais"
          >
            Fechar acertos
          </button>
        </div>
      )}

      {!hasDebts && !hasPendings && (
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
              const canUnsettle = userEmail === s.to || userEmail === s.from;

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
                  {canUnsettle && (
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
  const [copyLabel, setCopyLabel] = useState("Copiar link");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchSeq = useRef(0);
  const origin = useSyncExternalStore(
    subscribeLocation,
    getLocationOrigin,
    getServerLocationOrigin
  );
  const inviteUrl = origin ? `${origin}/split/join/${trip._id}` : "";

  useEffect(() => {
    const q = newEmail.trim();
    if (!q) {
      setSuggestions([]);
      setHighlightIdx(-1);
      return;
    }
    const seq = ++searchSeq.current;
    const handle = setTimeout(async () => {
      const results = await searchUsers(q, trip.participants);
      if (seq !== searchSeq.current) return;
      setSuggestions(results);
      setHighlightIdx(-1);
    }, 200);
    return () => clearTimeout(handle);
  }, [newEmail, trip.participants]);

  function pickSuggestion(s: UserSuggestion) {
    setNewEmail(s.email);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
      if (e.key === "Enter" && highlightIdx >= 0) {
        e.preventDefault();
        pickSuggestion(suggestions[highlightIdx]);
        return;
      }
    }
    if (e.key === "Enter") handleAdd();
  }

  function handleAdd() {
    if (!newEmail.trim()) return;
    const addToAll = confirm(
      "Adicionar esta pessoa também às despesas anteriores divididas entre todos?"
    );
    setError("");
    startTransition(async () => {
      const r = await addParticipant(trip._id, newEmail, addToAll);
      if (r.error) setError(r.error);
      else {
        setNewEmail("");
        setShowSuggestions(false);
        setSuggestions([]);
      }
    });
  }

  function handleRemove(email: string) {
    setError("");
    startTransition(async () => {
      const r = await removeParticipant(trip._id, email);
      if (r.error) setError(r.error);
    });
  }

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopyLabel("Copiado!");
    setTimeout(() => setCopyLabel("Copiar link"), 2000);
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
        <div className="flex-1 relative">
          <input
            type="text"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Nome ou email do participante"
            autoComplete="off"
            className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
            onKeyDown={handleKeyDown}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {suggestions.map((s, i) => (
                <li
                  key={s.email}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickSuggestion(s);
                  }}
                  onMouseEnter={() => setHighlightIdx(i)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                    i === highlightIdx ? "bg-stone-100" : ""
                  }`}
                >
                  <Avatar name={s.name} image={s.image} />
                  <span className="text-stone-700 truncate">{s.name}</span>
                  <span className="text-xs text-stone-400 truncate ml-auto">
                    {s.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={isPending || !newEmail.trim()}
          className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          Adicionar
        </button>
      </div>
      <div className="border-t border-stone-200 pt-3 mt-3">
        <p className="text-xs text-stone-500 mb-2">
          Ou envie o link abaixo. Qualquer pessoa logada que acessar entra na viagem.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteUrl}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-600 bg-stone-50"
          />
          <button
            onClick={handleCopy}
            disabled={!inviteUrl}
            className="text-sm text-green-700 hover:text-green-900 font-medium px-2 whitespace-nowrap disabled:opacity-50"
          >
            {copyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
