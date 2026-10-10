import { forwardAuth } from "@/lib/authRoute";

export async function POST(request: Request) {
  return forwardAuth(request, "login");
}
