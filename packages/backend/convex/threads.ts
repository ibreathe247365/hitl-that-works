import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const addEvent = mutation({
	args: {
		stateId: v.string(),
		type: v.string(),
		data: v.any(),
		initialEmail: v.optional(v.any()),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		
		const existing = await ctx.db
			.query("threads")
			.withIndex("by_state_id", (q) => q.eq("stateId", args.stateId))
			.first();
		
		if (existing) {
			await ctx.db.patch(existing._id, { 
				updatedAt: now,
				...(args.initialEmail && { initialEmail: args.initialEmail })
			});
		} else {
			await ctx.db.insert("threads", {
				stateId: args.stateId,
				userId: args.userId || "system",
				initialEmail: args.initialEmail,
				createdAt: now,
				updatedAt: now,
			});
		}
		
		await ctx.db.insert("events", {
			stateId: args.stateId,
			type: args.type,
			data: args.data,
			createdAt: now,
		});
	},
});

export const getThread = query({
	args: { stateId: v.string() },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}
		
		const thread = await ctx.db
			.query("threads")
			.withIndex("by_user_state", (q) => q.eq("userId", user._id).eq("stateId", args.stateId))
			.first();
		
		if (!thread) return null;
		
		const events = await ctx.db
			.query("events")
			.withIndex("by_state_created", (q) => q.eq("stateId", args.stateId))
			.order("asc")
			.collect();
		
		return {
			stateId: thread.stateId,
			initial_email: thread.initialEmail,
			events: events.map(e => ({
				type: e.type,
				data: e.data,
			})),
			createdAt: thread.createdAt,
			updatedAt: thread.updatedAt,
		};
	},
});

export const getThreads = query({
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}
		
		return await ctx.db
			.query("threads")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(100);
	},
});
