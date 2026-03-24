import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getMemberByEmail } from "@/lib/members";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      return !!getMemberByEmail(profile.email);
    },
    async session({ session }) {
      if (session.user?.email) {
        const member = getMemberByEmail(session.user.email);
        if (member) {
          session.user.name = member.name;
        }
      }
      return session;
    },
  },
});
