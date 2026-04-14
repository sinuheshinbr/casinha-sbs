"use server";

import { getDb } from "@/lib/mongodb";
import { getMemberByEmail, canEditFinance, MEMBERS } from "@/lib/members";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

// Types
export interface Expense {
  _id: string;
  month: string;
  category: string;
  description: string;
  amount: number;
  rateio: boolean;
}

export interface MemberPayment {
  _id: string;
  month: string;
  memberEmail: string;
  amount: number;
  paidAt: string;
}

export interface Income {
  _id: string;
  month: string;
  type: string;
  description: string;
  amount: number;
  createdAt: string;
  visitante: boolean;
}

export interface Faxina {
  _id: string;
  label: string;
  amount: number;
  participants: string[];
  extraVisits: string[];
  paidBy: string[];
  extraPaidBy: string[];
  month: string;
  createdAt: string;
}

export interface Energia {
  _id: string;
  month: string;
  memberEmail: string;
  kwh: number;
  tariff: number;
  amount: number;
  note: string;
  paidAt: string | null;
  paidBy: string | null;
  createdAt: string;
}

// Auth helpers
async function requireFinanceAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const member = getMemberByEmail(session.user.email);
  if (!member || !canEditFinance(member.name)) return null;
  return member;
}

async function requireMember() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const member = getMemberByEmail(session.user.email);
  if (!member) return null;
  return member;
}

// --- Expenses ---

export async function getExpenses(month: string): Promise<Expense[]> {
  const db = getDb();
  const docs = await db
    .collection("expenses")
    .find({ month })
    .sort({ category: 1 })
    .toArray();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    month: doc.month as string,
    category: doc.category as string,
    description: doc.description as string,
    amount: doc.amount as number,
    rateio: doc.rateio !== false,
  }));
}

export async function addExpense(
  month: string,
  category: string,
  description: string,
  amount: number,
  rateio: boolean = true
) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };
  if (amount <= 0) return { error: "Valor inválido" };

  const db = getDb();
  await db.collection("expenses").insertOne({
    month,
    category,
    description: description.trim(),
    amount,
    rateio,
  });

  revalidatePath("/financeiro");
  return { success: true };
}

export async function removeExpense(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/financeiro");
  return { success: true };
}

// --- Member Payments ---

export async function getPayments(month: string): Promise<MemberPayment[]> {
  const db = getDb();
  const docs = await db
    .collection("member_payments")
    .find({ month })
    .sort({ memberEmail: 1 })
    .toArray();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    month: doc.month as string,
    memberEmail: doc.memberEmail as string,
    amount: doc.amount as number,
    paidAt: (doc.paidAt as Date).toISOString(),
  }));
}

export async function markPaid(month: string, memberEmail: string, amount: number) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };
  if (!MEMBERS.find((m) => m.email.toLowerCase() === memberEmail.toLowerCase()))
    return { error: "Membro inválido" };

  const db = getDb();
  const existing = await db
    .collection("member_payments")
    .findOne({ month, memberEmail });
  if (existing) return { error: "Já marcado como pago" };

  await db.collection("member_payments").insertOne({
    month,
    memberEmail,
    amount,
    paidAt: new Date(),
  });

  revalidatePath("/financeiro");
  return { success: true };
}

export async function unmarkPaid(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db.collection("member_payments").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/financeiro");
  return { success: true };
}

// --- Income (visitor contributions, etc) ---

export async function getIncome(month: string): Promise<Income[]> {
  const db = getDb();
  const docs = await db
    .collection("income")
    .find({ month })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    month: doc.month as string,
    type: doc.type as string,
    description: doc.description as string,
    amount: doc.amount as number,
    createdAt: (doc.createdAt as Date).toISOString(),
    visitante: doc.visitante !== false,
  }));
}

export async function addIncome(
  month: string,
  type: string,
  description: string,
  amount: number,
  visitante: boolean = true
) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };
  if (amount <= 0) return { error: "Valor inválido" };

  const db = getDb();
  await db.collection("income").insertOne({
    month,
    type,
    description: description.trim(),
    amount,
    createdAt: new Date(),
    visitante,
  });

  revalidatePath("/financeiro");
  return { success: true };
}

export async function removeIncome(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db.collection("income").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/financeiro");
  return { success: true };
}

// --- Faxina ---

export async function getFaxinas(month: string): Promise<Faxina[]> {
  const db = getDb();
  const docs = await db
    .collection("faxinas")
    .find({ month })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    label: doc.label as string,
    amount: doc.amount as number,
    participants: doc.participants as string[],
    extraVisits: (doc.extraVisits as string[]) || [],
    paidBy: (doc.paidBy as string[]) || [],
    extraPaidBy: (doc.extraPaidBy as string[]) || [],
    month: doc.month as string,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function addFaxina(
  month: string,
  label: string,
  amount: number,
  participants: string[],
  extraVisits: string[] = []
) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };
  if (amount <= 0) return { error: "Valor inválido" };
  if (participants.length + extraVisits.length === 0)
    return { error: "Selecione ao menos uma visita" };

  const db = getDb();
  await db.collection("faxinas").insertOne({
    month,
    label: label.trim(),
    amount,
    participants,
    extraVisits: extraVisits.map((v) => v.trim()).filter(Boolean),
    paidBy: [],
    extraPaidBy: [],
    createdAt: new Date(),
  });

  revalidatePath("/financeiro");
  return { success: true };
}

export async function removeFaxina(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db.collection("faxinas").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/financeiro");
  return { success: true };
}

export async function markFaxinaPaid(id: string, memberEmail: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  const faxina = await db
    .collection("faxinas")
    .findOne({ _id: new ObjectId(id) });
  if (!faxina) return { error: "Faxina não encontrada" };
  if (!(faxina.participants as string[]).includes(memberEmail))
    return { error: "Morador não participa" };
  if (((faxina.paidBy as string[]) || []).includes(memberEmail))
    return { error: "Já marcado como pago" };

  await db
    .collection("faxinas")
    .updateOne(
      { _id: new ObjectId(id) },
      { $push: { paidBy: memberEmail } } as never
    );

  revalidatePath("/financeiro");
  return { success: true };
}

export async function unmarkFaxinaPaid(id: string, memberEmail: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db
    .collection("faxinas")
    .updateOne(
      { _id: new ObjectId(id) },
      { $pull: { paidBy: memberEmail } } as never
    );

  revalidatePath("/financeiro");
  return { success: true };
}

export async function markFaxinaExtraPaid(id: string, visitName: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  const faxina = await db
    .collection("faxinas")
    .findOne({ _id: new ObjectId(id) });
  if (!faxina) return { error: "Faxina não encontrada" };
  if (!(faxina.extraVisits as string[] || []).includes(visitName))
    return { error: "Visita não participa" };
  if (((faxina.extraPaidBy as string[]) || []).includes(visitName))
    return { error: "Já marcado como pago" };

  await db
    .collection("faxinas")
    .updateOne(
      { _id: new ObjectId(id) },
      { $push: { extraPaidBy: visitName } } as never
    );

  revalidatePath("/financeiro");
  return { success: true };
}

export async function unmarkFaxinaExtraPaid(id: string, visitName: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db
    .collection("faxinas")
    .updateOne(
      { _id: new ObjectId(id) },
      { $pull: { extraPaidBy: visitName } } as never
    );

  revalidatePath("/financeiro");
  return { success: true };
}

// --- Energia (carros elétricos) ---

export async function getEnergias(month: string): Promise<Energia[]> {
  const db = getDb();
  const docs = await db
    .collection("energias")
    .find({ month })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    month: doc.month as string,
    memberEmail: doc.memberEmail as string,
    kwh: doc.kwh as number,
    tariff: doc.tariff as number,
    amount: doc.amount as number,
    note: (doc.note as string) ?? "",
    paidAt: doc.paidAt ? (doc.paidAt as Date).toISOString() : null,
    paidBy: (doc.paidBy as string | null) ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function getLastEnergiaTariff(): Promise<number> {
  const db = getDb();
  const doc = await db
    .collection("energias")
    .find()
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
  return (doc?.tariff as number) ?? 0;
}

export async function addEnergia(
  month: string,
  kwh: number,
  tariff: number,
  note: string = ""
) {
  const member = await requireMember();
  if (!member) return { error: "Sem permissão" };
  if (kwh <= 0) return { error: "kWh inválido" };
  if (tariff <= 0) return { error: "Tarifa inválida" };

  const amount = Math.round(kwh * tariff * 100) / 100;

  const db = getDb();
  await db.collection("energias").insertOne({
    month,
    memberEmail: member.email.toLowerCase(),
    kwh,
    tariff,
    amount,
    note: note.trim(),
    paidAt: null,
    paidBy: null,
    createdAt: new Date(),
  });

  revalidatePath("/financeiro");
  return { success: true };
}

export async function markEnergiaPaid(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  const result = await db.collection("energias").updateOne(
    { _id: new ObjectId(id), paidAt: null },
    { $set: { paidAt: new Date(), paidBy: admin.email.toLowerCase() } }
  );
  if (result.matchedCount === 0)
    return { error: "Não encontrada ou já paga" };

  revalidatePath("/financeiro");
  return { success: true };
}

export async function unmarkEnergiaPaid(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };

  const db = getDb();
  await db
    .collection("energias")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { paidAt: null, paidBy: null } }
    );

  revalidatePath("/financeiro");
  return { success: true };
}

export async function removeEnergia(id: string) {
  const member = await requireMember();
  if (!member) return { error: "Sem permissão" };

  const db = getDb();
  const energia = await db
    .collection("energias")
    .findOne({ _id: new ObjectId(id) });
  if (!energia) return { error: "Não encontrada" };

  const isAdmin = canEditFinance(member.name);
  const isOwner =
    (energia.memberEmail as string) === member.email.toLowerCase();
  const isPaid = !!energia.paidAt;

  if (!isAdmin && !isOwner) return { error: "Sem permissão" };
  if (!isAdmin && isPaid)
    return { error: "Não pode remover entrada já paga" };

  await db.collection("energias").deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/financeiro");
  return { success: true };
}

// --- Caixa Balance ---

export async function getCaixaBalance(): Promise<number> {
  const db = getDb();

  const [expenseSum, paymentSum, incomeSum, energiaPaidSum] = await Promise.all([
    db
      .collection("expenses")
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
    db
      .collection("member_payments")
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
    db
      .collection("income")
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
    db
      .collection("energias")
      .aggregate([
        { $match: { paidAt: { $ne: null } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);

  const expenses = expenseSum[0]?.total ?? 0;
  const payments = paymentSum[0]?.total ?? 0;
  const income = incomeSum[0]?.total ?? 0;
  const energiaPaid = energiaPaidSum[0]?.total ?? 0;

  return payments + income + energiaPaid - expenses;
}
