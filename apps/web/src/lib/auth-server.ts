import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@hitl/backend/convex/auth";

export const getToken = () => {
	return getTokenNextjs(createAuth);
};
