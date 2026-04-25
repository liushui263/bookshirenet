import type { NextApiHandler } from "next";

interface RevalidateResponse {
  ok: boolean;
  path: string;
  revalidatedAt: string;
}

interface ErrorResponse {
  ok: false;
  error: string;
}

const REVALIDATE_PATH = "/";

const handler: NextApiHandler<RevalidateResponse | ErrorResponse> = async (
  req,
  res
) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  if (!process.env.CRON_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "CRON_SECRET is not configured",
    });
  }

  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  try {
    await res.revalidate(REVALIDATE_PATH);

    return res.status(200).json({
      ok: true,
      path: REVALIDATE_PATH,
      revalidatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to revalidate home page", error);

    return res.status(500).json({
      ok: false,
      error: "Revalidation failed",
    });
  }
};

export default handler;
