import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Hasło', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Podaj email i hasło');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Nie znaleziono użytkownika');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Nieprawidłowe hasło');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  return user;
}

// Sprawdza czy użytkownik ma aktywną subskrypcję lub trial
export async function checkSubscription(userId: string): Promise<{
  isActive: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      isActive: false,
      isTrialing: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
    };
  }

  const now = new Date();
  const isTrialing = user.trialEndsAt > now;
  const hasActiveSubscription = user.stripeCurrentPeriodEnd 
    ? user.stripeCurrentPeriodEnd > now 
    : false;

  return {
    isActive: isTrialing || hasActiveSubscription,
    isTrialing,
    trialEndsAt: user.trialEndsAt,
    subscriptionEndsAt: user.stripeCurrentPeriodEnd,
  };
}

