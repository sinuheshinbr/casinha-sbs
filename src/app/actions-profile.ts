"use server";

import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export interface UserProfile {
  email: string;
  name: string;
  image: string | null;
  pixKey: string | null;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return session.user.email.toLowerCase();
}

export async function getProfile(): Promise<UserProfile | null> {
  const email = await requireUser();
  if (!email) return null;

  const db = getDb();
  const doc = await db.collection("users").findOne({ email });
  if (!doc) return null;

  return {
    email: doc.email as string,
    name: doc.name as string,
    image: (doc.image as string) ?? null,
    pixKey: (doc.pixKey as string) ?? null,
  };
}

export async function updateProfile(name: string, pixKey: string) {
  const email = await requireUser();
  if (!email) return { error: "Faça login" };
  if (!name.trim()) return { error: "Nome obrigatório" };

  const db = getDb();
  await db.collection("users").updateOne(
    { email },
    { $set: { name: name.trim(), pixKey: pixKey.trim() || null } }
  );

  revalidatePath("/", "layout");
  return { success: true };
}
