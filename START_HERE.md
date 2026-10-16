# Tông Môn 8D — New Project Starter Kit

## Contents

- `MASTER_PROMPT.md`: full canonical, gameplay, architecture, art and test instructions (start a NEW repo, does not reuse previous failed prototype).
- `.agents/skills/world-and-map-qa/SKILL.md`: authored quality gate for actual tilemaps and two-way map transitions.
- `.agents/skills/pixel-art-director/SKILL.md`: original asset quality direction and lore-consistent hero art.
- `.agents/skills/mmorpg-server-integrity/SKILL.md`: two-browser server truth / reconnect / anti-duplication.
- `.agents/skills/cultivation-balance/SKILL.md`: gameplay balance and simulation.
- `EXTERNAL_SKILLS.md`: researched third-party and official skills; install selectively after reviewing source.

## How to use

1. Create a NEW, empty `tong-mon-8d` project/workspace. Do NOT reuse or delete your old project automatically. You may archive it first.
2. Copy the `MASTER_PROMPT.md` and `.agents/skills/` to the workspace root.
3. In Antigravity IDE, confirm workspace skills are recognized (use the active skills/customizations display). The workspace location is `.agents/skills/<skill-name>/SKILL.md` according to official Antigravity docs. Global locations differ between IDE and CLI.
4. Paste the contents of `MASTER_PROMPT.md` into your FIRST agent instruction, or ask the agent to read the local file and execute Phase 0 and Phase 1 only. Do not ask it to implement every late-game feature in the first pass.
5. Ask it for a contact sheet (hero + village) and TWO screenshots (town + forest) **and** an A→B→A portal video/test report BEFORE you authorize later milestones.
6. Once art + maps work, proceed to networking and then combat/Phì Đế food quest.

Do not install arbitrary GitHub skills or execute their scripts without source review. A skill instructs an agent; it does not grant image generation, license rights or working multiplayer by itself.
