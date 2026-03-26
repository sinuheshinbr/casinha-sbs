"use server";

import { getDb } from "@/lib/mongodb";
import { getMemberByEmail } from "@/lib/members";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

export interface Benfeitoria {
  _id: string;
  description: string;
  budget: number;
  createdBy: string;
  createdAt: string;
  votes: string[];
}

async function requireMember() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return getMemberByEmail(session.user.email) ?? null;
}

export async function getBenfeitorias(): Promise<Benfeitoria[]> {
  const db = getDb();
  const docs = await db
    .collection("benfeitorias")
    .find()
    .sort({ createdAt: 1 })
    .toArray();

  const items = docs.map((doc) => ({
    _id: doc._id.toString(),
    description: doc.description as string,
    budget: doc.budget as number,
    createdBy: doc.createdBy as string,
    createdAt: (doc.createdAt as Date).toISOString(),
    votes: (doc.votes as string[]) ?? [],
  }));

  items.sort((a, b) => b.votes.length - a.votes.length);
  return items;
}

export async function addBenfeitoria(description: string, budget: number) {
  const member = await requireMember();
  if (!member) return { error: "Sem permissão" };
  if (!description.trim()) return { error: "Descrição obrigatória" };
  if (budget < 0) return { error: "Orçamento inválido" };

  const db = getDb();
  await db.collection("benfeitorias").insertOne({
    description: description.trim(),
    budget,
    createdBy: member.name,
    createdAt: new Date(),
    votes: [],
  });

  revalidatePath("/benfeitorias");
  return { success: true };
}

export async function removeBenfeitoria(id: string) {
  const member = await requireMember();
  if (!member) return { error: "Sem permissão" };

  const db = getDb();
  const doc = await db
    .collection("benfeitorias")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return { error: "Não encontrada" };
  if (doc.createdBy !== member.name)
    return { error: "Apenas o autor pode remover" };

  await db.collection("benfeitorias").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/benfeitorias");
  return { success: true };
}

export async function toggleVote(id: string) {
  const member = await requireMember();
  if (!member) return { error: "Sem permissão" };

  const db = getDb();
  const doc = await db
    .collection("benfeitorias")
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return { error: "Não encontrada" };

  const votes = (doc.votes as string[]) ?? [];
  const hasVoted = votes.includes(member.name);

  if (hasVoted) {
    await db
      .collection("benfeitorias")
      .updateOne(
        { _id: new ObjectId(id) },
        { $pull: { votes: member.name } } as any
      );
  } else {
    await db
      .collection("benfeitorias")
      .updateOne(
        { _id: new ObjectId(id) },
        { $push: { votes: member.name } } as any
      );
  }

  revalidatePath("/benfeitorias");
  return { success: true };
}
