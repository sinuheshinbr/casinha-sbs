"use client";

import { useState } from "react";

const PIX_KEY = "a1f47c82-c2f7-4ec1-80d4-6dcc5c05da16";

export default function InfoPage() {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  function handleCopyWifi() {
    navigator.clipboard.writeText("99992021");
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  }

  function handleCopyPix() {
    navigator.clipboard.writeText(PIX_KEY);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
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
                onClick={handleCopyWifi}
                className="text-xs text-green-700 hover:text-green-900 font-medium"
              >
                {copiedWifi ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-stone-800 mb-3">Chave PIX da Casinha</h3>
        <div className="bg-stone-50 rounded-lg p-3 flex items-center justify-between gap-3">
          <code className="text-sm text-stone-700 break-all">{PIX_KEY}</code>
          <button
            onClick={handleCopyPix}
            className="shrink-0 text-xs text-green-700 hover:text-green-900 font-medium"
          >
            {copiedPix ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}
