-- APX-09: ReviewAgent (expert review submit/moderate audit + LLM moderation).
-- Distinct from APX-08 (notification delivery). Safe when expert_reviews table already exists.

ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-09';
