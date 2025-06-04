import { SessionStorage } from "@shopify/shopify-app-session-storage";
import { Session } from "@shopify/shopify-api";
import prisma from "./db.server";

export class CustomSessionStorage implements SessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    try {
      await prisma.session.upsert({
        where: {
          id: session.id,
        },
        update: {
          shop: session.shop,
          state: session.state || null,
          isOnline: session.isOnline,
          scope: session.scope || null,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: session.onlineAccessInfo?.associated_user?.id?.toString() || null,
          firstName: session.onlineAccessInfo?.associated_user?.first_name || null,
          lastName: session.onlineAccessInfo?.associated_user?.last_name || null,
          email: session.onlineAccessInfo?.associated_user?.email || null,
          accountOwner: session.onlineAccessInfo?.associated_user?.account_owner || false,
          locale: session.onlineAccessInfo?.associated_user?.locale || null,
          collaborator: session.onlineAccessInfo?.associated_user?.collaborator || false,
          emailVerified: session.onlineAccessInfo?.associated_user?.email_verified || false,
        },
        create: {
          id: session.id,
          shop: session.shop,
          state: session.state || null,
          isOnline: session.isOnline,
          scope: session.scope || null,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: session.onlineAccessInfo?.associated_user?.id?.toString() || null,
          firstName: session.onlineAccessInfo?.associated_user?.first_name || null,
          lastName: session.onlineAccessInfo?.associated_user?.last_name || null,
          email: session.onlineAccessInfo?.associated_user?.email || null,
          accountOwner: session.onlineAccessInfo?.associated_user?.account_owner || false,
          locale: session.onlineAccessInfo?.associated_user?.locale || null,
          collaborator: session.onlineAccessInfo?.associated_user?.collaborator || false,
          emailVerified: session.onlineAccessInfo?.associated_user?.email_verified || false,
        },
      });
      return true;
    } catch (error) {
      console.error("Error storing session:", error);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const sessionData = await prisma.session.findUnique({
        where: { id },
      });

      if (!sessionData) {
        return undefined;
      }

      const session = new Session({
        id: sessionData.id,
        shop: sessionData.shop,
        state: sessionData.state || undefined,
        isOnline: sessionData.isOnline,
        scope: sessionData.scope || undefined,
        expires: sessionData.expires || undefined,
        accessToken: sessionData.accessToken,
      });

      if (sessionData.isOnline && sessionData.userId) {
        session.onlineAccessInfo = {
          expires_in: sessionData.expires ? Math.floor((sessionData.expires.getTime() - Date.now()) / 1000) : 0,
          associated_user_scope: sessionData.scope || "",
          associated_user: {
            id: parseInt(sessionData.userId),
            first_name: sessionData.firstName || "",
            last_name: sessionData.lastName || "",
            email: sessionData.email || "",
            account_owner: sessionData.accountOwner,
            locale: sessionData.locale || "",
            collaborator: sessionData.collaborator,
            email_verified: sessionData.emailVerified,
          },
        };
      }

      return session;
    } catch (error) {
      console.error("Error loading session:", error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      await prisma.session.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      await prisma.session.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("Error deleting sessions:", error);
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const sessionData = await prisma.session.findMany({
        where: { shop },
      });

      return sessionData.map(data => {
        const session = new Session({
          id: data.id,
          shop: data.shop,
          state: data.state || undefined,
          isOnline: data.isOnline,
          scope: data.scope || undefined,
          expires: data.expires || undefined,
          accessToken: data.accessToken,
        });

        if (data.isOnline && data.userId) {
          session.onlineAccessInfo = {
            expires_in: data.expires ? Math.floor((data.expires.getTime() - Date.now()) / 1000) : 0,
            associated_user_scope: data.scope || "",
            associated_user: {
              id: parseInt(data.userId),
              first_name: data.firstName || "",
              last_name: data.lastName || "",
              email: data.email || "",
              account_owner: data.accountOwner,
              locale: data.locale || "",
              collaborator: data.collaborator,
              email_verified: data.emailVerified,
            },
          };
        }

        return session;
      });
    } catch (error) {
      console.error("Error finding sessions by shop:", error);
      return [];
    }
  }
}