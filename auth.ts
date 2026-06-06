import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { User } from "./lib/generated/prisma/client";
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Username" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) {
          return null;
        }

        // Auto-create superadmin with Admin123@ if it does not exist
        if (username === "superadmin") {
          const existingAdmin = await prisma.user.findUnique({
            where: { username: "superadmin" },
          });

          if (!existingAdmin) {
            const hashedPassword = await argon2.hash("Admin123@");
            await prisma.user.create({
              data: {
                username: "superadmin",
                name: "Super Admin",
                hashedPassword,
                role: "ADMIN",
              },
            });
            console.log("[Auth] Auto-created superadmin account.");
          }
        }

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const valid = await argon2.verify(
          user.hashedPassword,
          password,
        );
        if (!valid) {
          return null;
        }

        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role;
        token.id = user.id;
        token.username = (user as User).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
});
