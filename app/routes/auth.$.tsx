import { authenticate } from "~/shopify.server";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // After successful authentication, redirect to the app
  return redirect(`/app/${session.shop}/products`);
}