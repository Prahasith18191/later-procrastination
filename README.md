# ⏳ Later — The Productive Procrastination Assistant

Tell Later the task you're avoiding (+ time & energy) and a **team of AI agents** brainstorms
genuinely useful things to do *instead*, then a Coach agent builds you a **dashboard** of
guilt-free, productive detours. Based on "structured procrastination" — you'll dodge task #1,
so make #2–#6 worth it.

**Built with Google Antigravity + the Agent Development Kit (ADK), on Gemini via Vertex AI, deployed on Cloud Run.**

## Agentic
A `ParallelAgent` fans out four idea specialists at once — **Quick Wins**, **Learn**, **Body**,
**Life Admin** (Gemini 2.5 Flash) — then a **Coach / Composer** (Gemini 2.5 Pro) ranks them into
a JSON dashboard the UI renders. Watch the team work live, then do the tasks.

## Run
```bash
# agent
pip install -r requirements.txt && adk web
# ui
cd ui && npm install && npm run dev
```
Monochrome black-&-white UI, Google Material Symbols icons, Framer Motion. Built with Google Antigravity · Vibe Coding Lounge.
