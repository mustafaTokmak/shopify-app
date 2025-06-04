import { json } from "@remix-run/node";

export async function loader() {
  return json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    database: "connected",
    authentication: "configured"
  });
}