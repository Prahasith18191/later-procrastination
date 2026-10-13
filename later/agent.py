"""
Later — the Productive Procrastination Assistant.

You tell it the task you're avoiding (+ how much time and energy you have), and a team of
agents brainstorms, in parallel, genuinely useful things to do INSTEAD — then a Composer
agent assembles a ranked "productive procrastination" dashboard.

Based on "structured procrastination": you'll avoid task #1, but happily do #2–#5 — so make
those genuinely worthwhile.

Orchestration: ParallelAgent (4 idea specialists at once) → SequentialAgent → Composer (Pro).
Built with Google Antigravity + the Agent Development Kit (ADK), on Gemini via Vertex AI.
"""

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent

FLASH = "gemini-2.5-flash"
PRO = "gemini-2.5-pro"

_BASE = (
    "The user is procrastinating. Their message gives the task they're AVOIDING, how much "
    "TIME they have, and their ENERGY level. "
)

quick = LlmAgent(
    name="QuickWins", model=FLASH, output_key="quick",
    instruction=_BASE + "You are the Quick-Wins specialist. Suggest 2 small, concrete, "
    "5-15 minute wins that give an instant sense of progress (clear an inbox, reply to that "
    "one message, tidy the desktop, pay a bill). Each: a short title + est minutes + a one-line "
    "why. Fit their time & energy. Playful but genuinely useful. Under 90 words.",
)
learn = LlmAgent(
    name="Learn", model=FLASH, output_key="learn",
    instruction=_BASE + "You are the Learn-Something specialist. Suggest 2 tiny learning hits "
    "that feel like a break but grow a skill (a 10-min tutorial, one Anki deck, read one "
    "sharp article, a keyboard shortcut drill). Title + minutes + why. Fit their time & energy. "
    "Under 90 words.",
)
body = LlmAgent(
    name="Body", model=FLASH, output_key="body",
    instruction=_BASE + "You are the Body & Reset specialist. Suggest 2 quick physical/mental "
    "resets that recharge focus (a brisk walk, 20 squats, a stretch, 4-min breathing, refill "
    "water). Title + minutes + why. Match their energy. Under 90 words.",
)
admin = LlmAgent(
    name="Admin", model=FLASH, output_key="admin",
    instruction=_BASE + "You are the Life-Admin specialist. Suggest 2 boring-but-satisfying "
    "adult tasks they've been putting off (book the appointment, file expenses, cancel a "
    "subscription, meal-plan). Title + minutes + why. Fit their time. Under 90 words.",
)

idea_team = ParallelAgent(name="IdeaTeam", sub_agents=[quick, learn, body, admin])

composer = LlmAgent(
    name="Composer", model=PRO, output_key="dashboard",
    instruction=(
        "You are the Procrastination Coach assembling a dashboard from your team's ideas:\n\n"
        "QUICK WINS:\n{quick}\n\nLEARN:\n{learn}\n\nBODY:\n{body}\n\nADMIN:\n{admin}\n\n"
        "Pick the 6 best, most varied tasks across the four categories, sized to the user's time "
        "and energy. Output ONLY a json code block (no prose before or after), exactly this shape:\n"
        "```json\n"
        "{\n"
        '  "pep": "<2 witty, kind sentences that name the dreaded task and bless the detour>",\n'
        '  "tasks": [\n'
        '    {"category":"Quick win","icon":"bolt","title":"<=6 words","minutes":10,"worth":4,"why":"one line"}\n'
        "  ]\n"
        "}\n"
        "```\n"
        "Rules: category is one of Quick win / Learn / Body / Admin. "
        "icon is a Google Material Symbols name chosen to fit the task, from: bolt, school, "
        "fitness_center, inbox, cleaning_services, mail, edit_note, directions_walk, "
        "self_improvement, local_laundry_service, savings, menu_book, event, water_drop, "
        "checklist, lightbulb, call, calendar_month. "
        "minutes is an integer; worth is 1-5 (how much future-you will thank you). "
        "6 tasks total. Valid JSON only."
    ),
)

root_agent = SequentialAgent(
    name="Later",
    description="Productive procrastination assistant: a team brainstorms useful detours, a coach builds your dashboard.",
    sub_agents=[idea_team, composer],
)
