import { authenticate } from "~/shopify.server";
import { ActionFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!admin && topic !== "APP_UNINSTALLED") {
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        // Clean up store data when app is uninstalled
        await prisma.store.update({
          where: { shopDomain: session.shop },
          data: { isActive: false },
        });
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
}