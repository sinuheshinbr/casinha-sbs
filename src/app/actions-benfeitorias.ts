"use server";

import { getDb } from "@/lib/mongodb";
import { getMemberByEmail } from "@/lib/members";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

interface BenfeitoriaDoc {
  _id: ObjectId;
  votes: string[];
}

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
  const member = getMemberByEmail(session.user.email);
  if (!member) return null;
  return { ...member, email: member.email.toLowerCase() };
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
    createdBy: member.email,
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
  if (doc.createdBy !== member.email)
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
  const hasVoted = votes.includes(member.email);

  if (hasVoted) {
    await db
      .collection<BenfeitoriaDoc>("benfeitorias")
      .updateOne(
        { _id: new ObjectId(id) },
        { $pull: { votes: member.email } }
      );
  } else {
    await db
      .collection<BenfeitoriaDoc>("benfeitorias")
      .updateOne(
        { _id: new ObjectId(id) },
        { $push: { votes: member.email } }
      );
  }

  revalidatePath("/benfeitorias");
  return { success: true };
}
