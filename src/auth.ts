import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getMemberByEmail } from "@/lib/members";
import { getDb } from "@/lib/mongodb";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      const db = getDb();
      const member = getMemberByEmail(profile.email);
      await db.collection("users").updateOne(
        { email: profile.email.toLowerCase() },
        {
          $set: {
            image: profile.picture ?? null,
            isMember: !!member,
          },
          $setOnInsert: {
            email: profile.email.toLowerCase(),
            name: member?.name ?? profile.name,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const db = getDb();
        const user = await db
          .collection("users")
          .findOne({ email: session.user.email.toLowerCase() });
        if (user) {
          session.user.name = user.name as string;
        }
      }
      return session;
    },
  },
});
