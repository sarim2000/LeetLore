'use server';

import { generateObject, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { createStreamableValue } from 'ai/rsc';

export async function getNotifications(input: string) {
  'use server';

  const { object: notifications } = await generateObject({
    model: openai('gpt-4-turbo'),
    system: 'You generate three notifications for a messages app.',
    prompt: input,
    schema: z.object({
      notifications: z.array(
        z.object({
          name: z.string().describe('Name of a fictional person.'),
          message: z.string().describe('Do not use emojis or links.'),
          minutesAgo: z.number(),
        }),
      ),
    }),
  });

  return { notifications };
}

export async function streamNewsUpdates() {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai('gpt-3.5-turbo'),
      system: 'You are a live news feed generator, creating real-time updates on various topics.',
      prompt: 'Generate a live news update, at least 3 items.',
      schema: z.object({
        newsItem: z.array(z.object({
          headline: z.string(),
          category: z.enum(['Politics', 'Technology', 'Sports', 'Entertainment', 'Science']),
          timestamp: z.string(),
          summary: z.string(),
        })),
      }),
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
