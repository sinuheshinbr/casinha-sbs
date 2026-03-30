"use server";

import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

// Types

export interface Trip {
  _id: string;
  name: string;
  createdBy: string;
  participants: string[];
  createdAt: string;
}

export interface TripExpense {
  _id: string;
  tripId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  createdAt: string;
}

export interface Balance {
  email: string;
  name: string;
  image: string | null;
  pixKey: string | null;
  paid: number;
  owes: number;
  net: number;
}

export interface Settlement {
  _id: string;
  tripId: string;
  from: string;
  to: string;
  amount: number;
  createdAt: string;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

// Auth helper

async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return { email: session.user.email.toLowerCase(), name: session.user.name ?? session.user.email };
}

// Helper: resolve email -> name + image from users collection

async function resolveUsers(emails: string[]): Promise<{
  nameMap: Map<string, string>;
  imageMap: Map<string, string | null>;
  pixMap: Map<string, string | null>;
}> {
  const db = getDb();
  const users = await db
    .collection("users")
    .find({ email: { $in: emails } })
    .toArray();
  const nameMap = new Map<string, string>();
  const imageMap = new Map<string, string | null>();
  const pixMap = new Map<string, string | null>();
  for (const u of users) {
    nameMap.set(u.email as string, u.name as string);
    imageMap.set(u.email as string, (u.image as string) ?? null);
    pixMap.set(u.email as string, (u.pixKey as string) ?? null);
  }
  for (const e of emails) {
    if (!nameMap.has(e)) nameMap.set(e, e);
    if (!imageMap.has(e)) imageMap.set(e, null);
    if (!pixMap.has(e)) pixMap.set(e, null);
  }
  return { nameMap, imageMap, pixMap };
}

// --- Trips ---

export async function getMyTrips(): Promise<Trip[]> {
  const user = await requireUser();
  if (!user) return [];

  const db = getDb();
  const docs = await db
    .collection("trips")
    .find({ participants: user.email })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    name: doc.name as string,
    createdBy: doc.createdBy as string,
    participants: doc.participants as string[],
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function getTrip(id: string): Promise<Trip | null> {
  const user = await requireUser();
  if (!user) return null;

  const db = getDb();
  const doc = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  if (!(doc.participants as string[]).includes(user.email)) return null;

  return {
    _id: doc._id.toString(),
    name: doc.name as string,
    createdBy: doc.createdBy as string,
    participants: doc.participants as string[],
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

export async function createTrip(name: string, participantEmails: string[]) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };
  if (!name.trim()) return { error: "Nome obrigatório" };

  const emails = [
    user.email,
    ...participantEmails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e !== user.email),
  ];

  const db = getDb();
  const result = await db.collection("trips").insertOne({
    name: name.trim(),
    createdBy: user.email,
    participants: emails,
    createdAt: new Date(),
  });

  revalidatePath("/split");
  return { success: true, tripId: result.insertedId.toString() };
}

export async function deleteTrip(id: string) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };

  const db = getDb();
  const doc = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return { error: "Não encontrada" };
  if (doc.createdBy !== user.email)
    return { error: "Apenas o criador pode remover" };

  await db.collection("trips").deleteOne({ _id: new ObjectId(id) });
  await db.collection("trip_expenses").deleteMany({ tripId: id });
  revalidatePath("/split");
  return { success: true };
}

// --- Trip Participants ---

export async function addParticipant(
  tripId: string,
  email: string,
  addToAllExpenses: boolean = false
) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { error: "Email obrigatório" };

  const db = getDb();
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip) return { error: "Viagem não encontrada" };
  const participants = trip.participants as string[];
  if (!participants.includes(user.email))
    return { error: "Sem permissão" };
  if (participants.includes(normalized))
    return { error: "Já participa" };

  await db
    .collection("trips")
    .updateOne(
      { _id: new ObjectId(tripId) },
      { $push: { participants: normalized } } as any
    );

  if (addToAllExpenses) {
    // Add to expenses that were split among all current participants
    const expenses = await db
      .collection("trip_expenses")
      .find({ tripId })
      .toArray();
    for (const exp of expenses) {
      const split = (exp.splitAmong as string[]) ?? [];
      const isAll =
        split.length === participants.length &&
        participants.every((p) => split.includes(p));
      if (isAll) {
        await db
          .collection("trip_expenses")
          .updateOne(
            { _id: exp._id },
            { $push: { splitAmong: normalized } } as any
          );
      }
    }
  }

  revalidatePath("/split");
  return { success: true };
}

export async function removeParticipant(tripId: string, email: string) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };

  const db = getDb();
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip) return { error: "Viagem não encontrada" };
  if (!(trip.participants as string[]).includes(user.email))
    return { error: "Sem permissão" };
  if (trip.createdBy === email)
    return { error: "Não é possível remover o criador" };

  const hasSettlements = await db
    .collection("trip_settlements")
    .countDocuments({ tripId, $or: [{ from: email }, { to: email }] });
  if (hasSettlements > 0)
    return { error: "Não é possível remover: este participante possui acertos registrados" };

  await db
    .collection("trips")
    .updateOne(
      { _id: new ObjectId(tripId) },
      { $pull: { participants: email } } as any
    );

  await db
    .collection("trip_expenses")
    .updateMany(
      { tripId, splitAmong: email },
      { $pull: { splitAmong: email } } as any
    );

  revalidatePath("/split");
  return { success: true };
}

// --- Trip Expenses ---

export async function getTripExpenses(tripId: string): Promise<TripExpense[]> {
  const user = await requireUser();
  if (!user) return [];

  const db = getDb();

  // verify user is a participant
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip || !(trip.participants as string[]).includes(user.email)) return [];

  const docs = await db
    .collection("trip_expenses")
    .find({ tripId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    tripId: doc.tripId as string,
    description: doc.description as string,
    amount: doc.amount as number,
    paidBy: doc.paidBy as string,
    splitAmong: (doc.splitAmong as string[]) ?? (trip.participants as string[]),
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function addTripExpense(
  tripId: string,
  description: string,
  amount: number,
  splitAmong: string[],
  paidBy?: string
) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };
  if (!description.trim()) return { error: "Descrição obrigatória" };
  if (amount <= 0) return { error: "Valor inválido" };
  if (splitAmong.length === 0) return { error: "Selecione ao menos um participante" };

  const db = getDb();
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip) return { error: "Viagem não encontrada" };
  const participants = trip.participants as string[];
  if (!participants.includes(user.email))
    return { error: "Sem permissão" };

  const payer = paidBy && participants.includes(paidBy) ? paidBy : user.email;

  await db.collection("trip_expenses").insertOne({
    tripId,
    description: description.trim(),
    amount,
    paidBy: payer,
    splitAmong,
    createdAt: new Date(),
  });

  revalidatePath("/split");
  return { success: true };
}

export async function removeTripExpense(id: string) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };

  const db = getDb();
  const doc = await db
    .collection("trip_expenses")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return { error: "Não encontrada" };

  await db
    .collection("trip_expenses")
    .deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/split");
  return { success: true };
}

// --- Balances ---

export async function getTripBalances(tripId: string): Promise<Balance[]> {
  const user = await requireUser();
  if (!user) return [];

  const db = getDb();
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip || !(trip.participants as string[]).includes(user.email)) return [];

  const participants = trip.participants as string[];
  const [expenses, settlements] = await Promise.all([
    db.collection("trip_expenses").find({ tripId }).toArray(),
    db.collection("trip_settlements").find({ tripId }).toArray(),
  ]);

  const { nameMap, imageMap, pixMap } = await resolveUsers(participants);
  const paid = new Map<string, number>();
  const owes = new Map<string, number>();

  for (const p of participants) {
    paid.set(p, 0);
    owes.set(p, 0);
  }

  for (const exp of expenses) {
    const amount = exp.amount as number;
    const payer = exp.paidBy as string;
    const split = (exp.splitAmong as string[] | undefined) ?? participants;
    const share = amount / split.length;

    paid.set(payer, (paid.get(payer) ?? 0) + amount);
    for (const p of split) {
      owes.set(p, (owes.get(p) ?? 0) + share);
    }
  }

  // Settlements: from paid to, so from's paid increases and to's owes increases
  for (const s of settlements) {
    const from = s.from as string;
    const to = s.to as string;
    const amount = s.amount as number;
    paid.set(from, (paid.get(from) ?? 0) + amount);
    owes.set(to, (owes.get(to) ?? 0) + amount);
  }

  return participants.map((email) => ({
    email,
    name: nameMap.get(email) ?? email,
    image: imageMap.get(email) ?? null,
    pixKey: pixMap.get(email) ?? null,
    paid: paid.get(email) ?? 0,
    owes: owes.get(email) ?? 0,
    net: (paid.get(email) ?? 0) - (owes.get(email) ?? 0),
  }));
}

// --- Settlements ---

export async function getSettlements(tripId: string): Promise<Settlement[]> {
  const user = await requireUser();
  if (!user) return [];

  const db = getDb();
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip || !(trip.participants as string[]).includes(user.email)) return [];

  const docs = await db
    .collection("trip_settlements")
    .find({ tripId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    tripId: doc.tripId as string,
    from: doc.from as string,
    to: doc.to as string,
    amount: doc.amount as number,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function addSettlement(tripId: string, from: string, to: string, amount: number) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };
  if (user.email !== to) return { error: "Apenas quem recebeu pode confirmar" };

  const db = getDb();
  const trip = await db
    .collection("trips")
    .findOne({ _id: new ObjectId(tripId) });
  if (!trip) return { error: "Viagem não encontrada" };
  const participants = trip.participants as string[];
  if (!participants.includes(from) || !participants.includes(to))
    return { error: "Participante inválido" };

  await db.collection("trip_settlements").insertOne({
    tripId,
    from,
    to,
    amount,
    createdAt: new Date(),
  });

  revalidatePath("/split");
  return { success: true };
}

export async function removeSettlement(id: string) {
  const user = await requireUser();
  if (!user) return { error: "Faça login" };

  const db = getDb();
  const doc = await db
    .collection("trip_settlements")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return { error: "Não encontrado" };
  if (doc.to !== user.email)
    return { error: "Apenas quem confirmou pode desfazer" };

  await db
    .collection("trip_settlements")
    .deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/split");
  return { success: true };
}
