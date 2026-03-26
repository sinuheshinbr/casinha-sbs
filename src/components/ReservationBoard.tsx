"use client";

import { useState, useTransition } from "react";
import {
  createMemberReservation,
  createGuestReservation,
  cancelReservation,
  declineWeekend,
  undoDecline,
} from "@/app/actions";
import type { Reservation } from "@/app/actions";

interface MemberEntry {
  email: string;
  name: string;
}

interface Props {
  reservations: Reservation[];
  declines: string[];
  allMembers: MemberEntry[];
  nameMap: Record<string, string>;
  totalSpots: number;
  memberEmail: string;
  weekendKey: string;
  isPast: boolean;
}

export default function ReservationBoard({
  reservations,
  declines,
  allMembers,
  nameMap: nameMapProp,
  totalSpots,
  memberEmail,
  weekendKey,
  isPast,
}: Props) {
  const nameMap = new Map(Object.entries(nameMapProp));
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const memberReservations = reservations.filter((r) => !r.isGuest);
  const guestReservations = reservations.filter((r) => r.isGuest);

  const guestActiveCount = Math.max(0, totalSpots - memberReservations.length);
  const activeGuests = guestReservations.slice(0, guestActiveCount);
  const waitlist = guestReservations.slice(guestActiveCount);
  const activeReservations = [...memberReservations, ...activeGuests];

  const spotsAvailable = totalSpots - activeReservations.length;
  const hasOwnReservation = memberReservations.some(
    (r) => r.memberEmail === memberEmail
  );
  const hasDeclined = declines.includes(memberEmail);

  const goingEmails = memberReservations.map((r) => r.memberEmail);
  const noResponse = allMembers.filter(
    (m) => !goingEmails.includes(m.email) && !declines.includes(m.email)
  );

  function handleReserveMember() {
    setError("");
    startTransition(async () => {
      const result = await createMemberReservation(weekendKey);
      if (result.error) setError(result.error);
    });
  }

  function handleReserveGuest() {
    if (!guestName.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await createGuestReservation(weekendKey, guestName);
      if (result.error) {
        setError(result.error);
      } else {
        setGuestName("");
      }
    });
  }

  function handleCancel(id: string) {
    setError("");
    startTransition(async () => {
      const result = await cancelReservation(id);
      if (result.error) setError(result.error);
    });
  }

  function handleDecline() {
    setError("");
    startTransition(async () => {
      const result = await declineWeekend(weekendKey);
      if (result.error) setError(result.error);
    });
  }

  function handleUndoDecline() {
    setError("");
    startTransition(async () => {
      const result = await undoDecline(weekendKey);
      if (result.error) setError(result.error);
    });
  }

  function ReservationCard({ reservation }: { reservation: Reservation }) {
    const isOwn = reservation.memberEmail === memberEmail;
    return (
      <div
        className={`bg-white rounded-lg shadow p-3 border-l-4 ${
          reservation.isGuest ? "border-blue-500" : "border-green-600"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-stone-800 truncate">
              {reservation.isGuest
                ? reservation.guestName
                : nameMap.get(reservation.memberEmail) ?? reservation.memberEmail}
            </p>
            <p className="text-xs text-stone-500">
              {reservation.isGuest
                ? `Visitante de ${nameMap.get(reservation.memberEmail) ?? reservation.memberEmail}`
                : "Morador"}
            </p>
          </div>
          {isOwn && !isPast && (
            <button
              onClick={() => handleCancel(reservation._id)}
              disabled={isPending}
              className="text-stone-400 hover:text-red-500 text-lg font-bold px-1 shrink-0"
              title="Cancelar reserva"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Vagas ativas */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: totalSpots }).map((_, i) => {
          const reservation = activeReservations[i];
          if (reservation) {
            return (
              <ReservationCard
                key={reservation._id}
                reservation={reservation}
              />
            );
          }
          return (
            <div
              key={`empty-${i}`}
              className="bg-stone-100 rounded-lg border-2 border-dashed border-stone-300 p-3 flex items-center justify-center min-h-[60px]"
            >
              <p className="text-sm text-stone-400">Vaga disponível</p>
            </div>
          );
        })}
      </div>

      {/* Lista de espera */}
      {waitlist.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {waitlist.map((reservation) => {
            const isOwn = reservation.memberEmail === memberEmail;
            return (
              <div
                key={reservation._id}
                className="bg-amber-50 rounded-lg shadow p-3 border-l-4 border-amber-400 opacity-75"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-700 truncate">
                      {reservation.guestName}
                    </p>
                    <p className="text-xs text-amber-600">
                      Aguardando vaga...
                    </p>
                    <p className="text-xs text-stone-400">
                      Visitante de {nameMap.get(reservation.memberEmail) ?? reservation.memberEmail}
                    </p>
                  </div>
                  {isOwn && !isPast && (
                    <button
                      onClick={() => handleCancel(reservation._id)}
                      disabled={isPending}
                      className="text-stone-400 hover:text-red-500 text-lg font-bold px-1 shrink-0"
                      title="Cancelar"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status dos moradores */}
      {(declines.length > 0 || noResponse.length > 0) && (
        <div className="flex gap-4 mb-6 text-sm">
          {declines.length > 0 && (
            <div className="flex-1">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">
                Não vão
              </p>
              <div className="space-y-1">
                {declines.map((email) => (
                  <p key={email} className="text-stone-400 line-through">
                    {nameMap.get(email) ?? email}
                  </p>
                ))}
              </div>
            </div>
          )}
          {noResponse.length > 0 && (
            <div className="flex-1">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">
                Sem resposta
              </p>
              <div className="space-y-1">
                {noResponse.map((m) => (
                  <p key={m.email} className="text-stone-400">
                    {m.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      {!isPast && (
        <div className="bg-white rounded-lg shadow p-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-3">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {hasDeclined ? (
              <button
                onClick={handleUndoDecline}
                disabled={isPending}
                className="w-full bg-stone-200 text-stone-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-300 disabled:opacity-50 transition-colors"
              >
                Marcado como não vou — desfazer?
              </button>
            ) : (
              <>
                {!hasOwnReservation && spotsAvailable > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleReserveMember}
                      disabled={isPending}
                      className="flex-1 bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? "..." : "Reservar minha vaga"}
                    </button>
                    <button
                      onClick={handleDecline}
                      disabled={isPending}
                      className="bg-stone-200 text-stone-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-300 disabled:opacity-50 transition-colors"
                    >
                      Não vou
                    </button>
                  </div>
                )}

                {!hasOwnReservation && spotsAvailable <= 0 && (
                  <div className="flex gap-2 items-center">
                    <p className="flex-1 text-sm text-amber-700 font-medium">
                      Todas as vagas de moradores estão preenchidas.
                    </p>
                    <button
                      onClick={handleDecline}
                      disabled={isPending}
                      className="bg-stone-200 text-stone-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-300 disabled:opacity-50 transition-colors"
                    >
                      Não vou
                    </button>
                  </div>
                )}

                {hasOwnReservation && (
                  <p className="text-sm text-green-700 font-medium">
                    Sua vaga já está reservada!
                  </p>
                )}

                <div className="pt-2 border-t border-stone-200">
                  <p className="text-xs text-stone-500 mb-2">
                    Trazer visitante:
                    {spotsAvailable <= 0 && (
                      <span className="text-amber-600 ml-1">
                        (entra na lista de espera)
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nome do visitante"
                      className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleReserveGuest}
                      disabled={isPending || !guestName.trim()}
                      className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
