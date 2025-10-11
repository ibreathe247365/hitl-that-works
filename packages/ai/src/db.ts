import { ConvexHttpClient } from "convex/browser";

export const db = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
