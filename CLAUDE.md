@AGENTS.md

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Mentor dashboard ops (implement PR1–PR5) → invoke /mentor-dashboard-ops
- Mentor dashboard ops (plan/refine scope) → invoke /mentor-dashboard-ops-plan

## Design System

Always read `DESIGN.md` before making any visual or UI decisions for the expert dashboard.
All font hierarchy, colors, spacing, nav, and button rules for `/dashboard/mentor` are defined there.
Do not reintroduce a logo in the mentor dashboard header or thin underline-only primary tabs.
In QA mode, flag any dashboard UI that does not match `DESIGN.md`.
