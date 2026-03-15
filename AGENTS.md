# Antigravity Agent Orchestration Rules

When breaking down tasks in the Agent Manager, you MUST strictly adhere to the following model assignments. Do not deviate from this routing matrix:

| Task | Model |
|------|-------|
| DDI Engine, Hormone Sync ML | Claude Opus 4.6 |
| UI components, API routes | Claude Sonnet 4.6 |
| Quick fixes, CSS tweaks | Gemini 3 Flash |
| Architecture planning | Gemini 3.1 Pro High |

## UI Design Protocol (Strict Action Required)
For ANY user interface design, mockups, or frontend visual generation, agents MUST route the request through the `stitch` MCP tool. Do not hallucinate CSS, Tailwind, or layouts from scratch. 

You must execute the Stitch "Designer Flow" in two steps:
1. Call `extract_design_context` on the existing app to extract the "Design DNA" (current Tailwind palette, typography, and structure).
2. Call `generate_screen_from_text` using that exact context to generate the new screen or component so it perfectly matches the project branding.