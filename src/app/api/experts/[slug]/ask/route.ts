import { NextResponse } from 'next/server';
import { answerExpertQuestion } from '@/lib/expert-profile-ask';
import { isLlmRateLimitError } from '@/lib/llm';
import { getMentorBySlug } from '@/lib/mentor-directory';

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const expert = await getMentorBySlug(slug);

  if (!expert) {
    return NextResponse.json({ error: 'Expert not found.' }, { status: 404 });
  }

  let body: { question?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question : '';
  if (!question.trim()) {
    return NextResponse.json({ error: 'Please enter a question.' }, { status: 400 });
  }

  try {
    const { answer } = await answerExpertQuestion(expert, question, `expert-ask:${slug}`);
    return NextResponse.json({ answer });
  } catch (error) {
    if (isLlmRateLimitError(error)) {
      return NextResponse.json(
        { error: 'Too many questions right now. Please try again in a minute.' },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : 'Unable to answer.';
    console.error('expert ask:', message);
    return NextResponse.json(
      { error: 'Could not generate an answer. Try again or book a live session.' },
      { status: 503 },
    );
  }
}
