"use client";

import { useState } from "react";

export default function InfoPage() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText("99992021");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Informações gerais</h2>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-stone-800 mb-3">Wi-Fi</h3>
        <div className="bg-stone-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Rede</span>
            <span className="font-medium text-stone-800">Bela Vista</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Senha</span>
            <div className="flex items-center gap-2">
              <code className="font-medium text-stone-800">99992021</code>
              <button
                onClick={handleCopy}
                className="text-xs text-green-700 hover:text-green-900 font-medium"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
