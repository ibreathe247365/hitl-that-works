import { withBaml } from '@boundaryml/baml-nextjs-plugin';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	transpilePackages: ['@hitl/ai'],
	experimental: {
		externalDir: true,
	},
};

export default withBaml()(nextConfig);
