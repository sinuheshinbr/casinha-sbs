"use client";

import { useState } from "react";

const PIX_KEY = "a1f47c82-c2f7-4ec1-80d4-6dcc5c05da16";

export default function FinanceiroPage() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Financeiro</h2>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-stone-800 mb-3">Chave PIX da Casinha</h3>
        <div className="bg-stone-50 rounded-lg p-3 flex items-center justify-between gap-3">
          <code className="text-sm text-stone-700 break-all">{PIX_KEY}</code>
          <button
            onClick={handleCopy}
            className="shrink-0 bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-green-800 transition-colors"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}
