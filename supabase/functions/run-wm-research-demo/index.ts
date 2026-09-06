import { createHandler } from "./handler.ts";

// Custom constant-time server-key authentication is enforced before any reads.
// The scheduler uses this server key from Vault; no public invocation is accepted.
Deno.serve(createHandler({
  projectUrl: Deno.env.get("PROJECT_URL") ?? "",
  projectKey: Deno.env.get("PROJECT_SECRET_KEY") ?? "",
  spaceUrl: Deno.env.get("HF_SPACE_URL") ?? "",
  apiKey: Deno.env.get("HF_INFERENCE_API_KEY") ?? "",
}));
