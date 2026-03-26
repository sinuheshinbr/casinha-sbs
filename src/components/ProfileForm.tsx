"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions-profile";
import type { UserProfile } from "@/app/actions-profile";

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

function maskPhone(digits: string): string {
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

function maskPix(digits: string): string {
  if (digits.length <= 11) {
    if (digits.length === 11 && !isValidCpf(digits)) {
      return maskPhone(digits);
    }
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  if (digits.length <= 14) {
    // CNPJ: 00.000.000/0000-00
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  // Chave aleatória: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return digits;
}

function maskUuid(value: string): string {
  const hex = value.replace(/[^0-9a-f]/gi, "").toLowerCase().slice(0, 32);
  const parts = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].filter(Boolean);
  return parts.join("-");
}

export default function ProfileForm({ profile }: { profile: UserProfile }) {
  const [name, setName] = useState(profile.name);
  const [pixKey, setPixKey] = useState(profile.pixKey ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handlePixChange(value: string) {
    const stripped = value.replace(/[^0-9a-f]/gi, "");
    const digits = value.replace(/\D/g, "");
    const isEmail = value.includes("@");

    if (isEmail) {
      setPixKey(value);
    } else if (stripped.length === digits.length) {
      // Purely numeric: CPF, phone, CNPJ
      setPixKey(digits.length > 0 ? maskPix(digits) : "");
    } else {
      // Hex characters present: UUID/chave aleatória
      setPixKey(stripped.length > 0 ? maskUuid(stripped) : "");
    }
    setSaved(false);
  }

  function handleSave() {
    if (!name.trim()) return;
    setError("");
    setSaved(false);
    startTransition(async () => {
      const r = await updateProfile(name, pixKey);
      if (r.error) setError(r.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 text-green-700 text-sm p-2 rounded">
          Perfil atualizado.
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-3">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              width={48}
              height={48}
              className="rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center text-lg font-medium">
              {profile.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
          <p className="text-xs text-stone-400">{profile.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Chave PIX
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => handlePixChange(e.target.value)}
            placeholder="CPF, CNPJ, email ou chave aleatória"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
