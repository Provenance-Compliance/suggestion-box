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
      // Add profile mapping to ensure we get all available fields
      profile(profile) {
        return {
          id: profile.sub || profile.oid,
          name: profile.name || profile.displayName || profile.given_name + ' ' + profile.family_name,
          email: profile.email || profile.mail || profile.userPrincipalName || profile.preferred_username,
          image: profile.picture,
        };
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
        
        // Try multiple sources for email (Azure AD can return it in different places)
        const email = user.email || 
                      profile?.email || 
                      profile?.mail || 
                      profile?.userPrincipalName ||
                      profile?.preferred_username;
        
        if (!email) {
          console.error('Azure AD sign-in failed: No email found in any source');
          return false;
        }
        
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if user exists by email
        const existingUser = await User.findOne({ email: normalizedEmail });
        
        if (!existingUser) {
          try {
            // Create new user for Microsoft Entra ID
            await User.create({
              email: normalizedEmail,
              name: user.name || profile?.displayName || profile?.name || 'Unknown User',
              password: '', // Empty password for OAuth users
              role: 'user', // Default role
            });
          } catch (error) {
            console.error('Failed to create user:', error);
            return false;
          }
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
