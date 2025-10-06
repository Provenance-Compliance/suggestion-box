import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import connectDB from './mongodb';
import User from './models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    // Microsoft Entra ID - Only authentication method for internal organization
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid email profile User.Read',
        },
      },
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'azure-ad') {
        await connectDB();
        
        // Check if user exists by email
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user for Microsoft Entra ID
          await User.create({
            email: user.email!,
            name: user.name,
            password: '', // Empty password for OAuth users
            role: 'user', // Default role
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
      }
      
      // For Microsoft Entra ID users, fetch role from database
      if (account?.provider === 'azure-ad' && user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    // Remove signup page since users can only sign in via Microsoft Entra ID
  },
};
