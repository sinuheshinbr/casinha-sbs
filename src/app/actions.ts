"use server";

import { getDb } from "@/lib/mongodb";
import { getCurrentWeekendKey } from "@/lib/dates";
import { getMemberByEmail, TOTAL_SPOTS } from "@/lib/members";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

export interface Reservation {
  _id: string;
  weekendDate: string;
  memberName: string;
  isGuest: boolean;
  guestName?: string;
  createdAt: string;
}

async function getAuthenticatedMember() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return getMemberByEmail(session.user.email) ?? null;
}

function validateWeekendKey(weekendKey: string): boolean {
  const match = weekendKey.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) return false;
  const [y, m, d] = weekendKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getDay() === 6; // must be a Saturday
}

function isPastWeekend(weekendKey: string): boolean {
  return weekendKey < getCurrentWeekendKey();
}

export async function getReservations(
  weekendKey: string
): Promise<Reservation[]> {
  if (!validateWeekendKey(weekendKey)) return [];
  const db = getDb();
  const docs = await db
    .collection("reservations")
    .find({ weekendDate: weekendKey })
    .sort({ isGuest: 1, createdAt: 1 })
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    weekendDate: doc.weekendDate as string,
    memberName: doc.memberName as string,
    isGuest: doc.isGuest as boolean,
    guestName: doc.guestName as string | undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function createMemberReservation(weekendKey: string) {
  const member = await getAuthenticatedMember();
  if (!member) return { error: "Não autenticado" };
  if (!validateWeekendKey(weekendKey)) return { error: "Data inválida" };
  if (isPastWeekend(weekendKey)) return { error: "Não é possível reservar em fins de semana passados" };

  const db = getDb();
  const col = db.collection("reservations");

  const existing = await col.findOne({
    weekendDate: weekendKey,
    memberName: member.name,
    isGuest: false,
  });
  if (existing) return { error: "Você já reservou sua vaga" };

  const memberCount = await col.countDocuments({
    weekendDate: weekendKey,
    isGuest: false,
  });
  if (memberCount >= TOTAL_SPOTS) {
    return { error: "Todas as vagas de moradores estão preenchidas" };
  }

  await col.insertOne({
    weekendDate: weekendKey,
    memberName: member.name,
    isGuest: false,
    createdAt: new Date(),
  });

  revalidatePath("/");
  return { success: true };
}

export async function createGuestReservation(
  weekendKey: string,
  guestName: string
) {
  const member = await getAuthenticatedMember();
  if (!member) return { error: "Não autenticado" };
  if (!validateWeekendKey(weekendKey)) return { error: "Data inválida" };
  if (isPastWeekend(weekendKey)) return { error: "Não é possível reservar em fins de semana passados" };

  if (!guestName.trim()) {
    return { error: "Nome do visitante é obrigatório" };
  }

  const db = getDb();

  await db.collection("reservations").insertOne({
    weekendDate: weekendKey,
    memberName: member.name,
    isGuest: true,
    guestName: guestName.trim(),
    createdAt: new Date(),
  });

  revalidatePath("/");
  return { success: true };
}

export async function getDeclines(weekendKey: string): Promise<string[]> {
  if (!validateWeekendKey(weekendKey)) return [];
  const db = getDb();
  const docs = await db
    .collection("declines")
    .find({ weekendDate: weekendKey })
    .toArray();
  return docs.map((doc) => doc.memberName as string);
}

export async function declineWeekend(weekendKey: string) {
  const member = await getAuthenticatedMember();
  if (!member) return { error: "Não autenticado" };
  if (!validateWeekendKey(weekendKey)) return { error: "Data inválida" };
  if (isPastWeekend(weekendKey))
    return { error: "Não é possível alterar fins de semana passados" };

  const db = getDb();

  const existing = await db.collection("declines").findOne({
    weekendDate: weekendKey,
    memberName: member.name,
  });
  if (existing) return { error: "Você já marcou que não vai" };

  // Remove reserva própria e de visitantes se existir
  await db.collection("reservations").deleteMany({
    weekendDate: weekendKey,
    memberName: member.name,
  });

  await db.collection("declines").insertOne({
    weekendDate: weekendKey,
    memberName: member.name,
    createdAt: new Date(),
  });

  revalidatePath("/");
  return { success: true };
}

export async function undoDecline(weekendKey: string) {
  const member = await getAuthenticatedMember();
  if (!member) return { error: "Não autenticado" };
  if (!validateWeekendKey(weekendKey)) return { error: "Data inválida" };
  if (isPastWeekend(weekendKey))
    return { error: "Não é possível alterar fins de semana passados" };

  const db = getDb();
  await db.collection("declines").deleteOne({
    weekendDate: weekendKey,
    memberName: member.name,
  });

  revalidatePath("/");
  return { success: true };
}

export async function cancelReservation(id: string) {
  const member = await getAuthenticatedMember();
  if (!member) return { error: "Não autenticado" };

  const db = getDb();

  const reservation = await db
    .collection("reservations")
    .findOne({ _id: new ObjectId(id) });
  if (!reservation) return { error: "Reserva não encontrada" };
  if (reservation.memberName !== member.name) {
    return { error: "Você só pode cancelar suas próprias reservas" };
  }
  if (isPastWeekend(reservation.weekendDate as string)) {
    return { error: "Não é possível cancelar reservas de fins de semana passados" };
  }

  await db.collection("reservations").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/");
  return { success: true };
}
