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
  paidBy: string[];
  month: string;
  createdAt: string;
}

// Auth helper
async function requireFinanceAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const member = getMemberByEmail(session.user.email);
  if (!member || !canEditFinance(member.name)) return null;
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
    paidBy: (doc.paidBy as string[]) || [],
    month: doc.month as string,
    createdAt: (doc.createdAt as Date).toISOString(),
  }));
}

export async function addFaxina(
  month: string,
  label: string,
  amount: number,
  participants: string[]
) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Sem permissão" };
  if (amount <= 0) return { error: "Valor inválido" };
  if (participants.length === 0) return { error: "Selecione ao menos um morador" };

  const db = getDb();
  await db.collection("faxinas").insertOne({
    month,
    label: label.trim(),
    amount,
    participants,
    paidBy: [],
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

// --- Caixa Balance ---

export async function getCaixaBalance(): Promise<number> {
  const db = getDb();

  const [expenseSum, paymentSum, incomeSum] = await Promise.all([
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
  ]);

  const expenses = expenseSum[0]?.total ?? 0;
  const payments = paymentSum[0]?.total ?? 0;
  const income = incomeSum[0]?.total ?? 0;

  return payments + income - expenses;
}
