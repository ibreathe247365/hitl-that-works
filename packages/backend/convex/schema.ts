import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
	}),

	threads: defineTable({
		stateId: v.string(),
		userId: v.string(),
		initialEmail: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_state_id", ["stateId"])
		.index("by_user_id", ["userId"])
		.index("by_user_state", ["userId", "stateId"]),

	events: defineTable({
		stateId: v.string(),
		type: v.string(),
		data: v.any(),
		createdAt: v.number(),
	})
		.index("by_state_id", ["stateId"])
		.index("by_state_created", ["stateId", "createdAt"]),
});
