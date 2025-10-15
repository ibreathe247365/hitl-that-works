import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";

const siteUrl = process.env.SITE_URL!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
const convexSiteUrl = process.env.CONVEX_SITE_URL || "";

function toOrigin(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const defaultLocalOrigins = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const trustedOrigins = [
  siteUrl,
  appUrl,
  convexSiteUrl,
  ...defaultLocalOrigins,
]
  .map((u) => u && toOrigin(u))
  .filter((u): u is string => Boolean(u));

export const authComponent = createClient<DataModel>(components.betterAuth);

export { components };

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false },
) => {
	return betterAuth({
		logger: {
			disabled: optionsOnly,
		},
		baseURL: siteUrl,
		trustedOrigins,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		socialProviders: {
			google: {
				prompt: "select_account", 
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			},
		},
		plugins: [convex()],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});

export const getUserByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
			model: "user",
			where: [
				{
					field: "email",
					operator: "eq",
					value: args.email,
				},
			],
			paginationOpts: {
				cursor: null,
				numItems: 1,
			},
		});

		// Handle paginated response format
		const users = result.page || result;
		return Array.isArray(users) && users.length > 0 ? users[0] : null;
	},
});
