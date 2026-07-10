import { defineAgent } from "eve";

/**
 * Preframe operator agent.
 *
 * Model: prefer AI Gateway (`AI_GATEWAY_API_KEY` / Vercel OIDC) or set
 * ANTHROPIC_API_KEY for direct Anthropic. Override with env PREFRAME_AGENT_MODEL.
 */
export default defineAgent({
  model: process.env.PREFRAME_AGENT_MODEL || "anthropic/claude-sonnet-5",
});
