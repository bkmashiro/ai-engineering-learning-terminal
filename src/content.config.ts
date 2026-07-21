import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';
import { directionIds, stageIds } from './data/roadmap';

const learningMetadata = z.object({
  moduleId: z.string().min(1),
  stage: z.enum(stageIds),
  prerequisites: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(['intro', 'core', 'advanced']),
  careerDirections: z.array(z.enum(directionIds)).default([]),
  sourceIds: z.array(z.string()).default([]),
  sourceLocale: z.enum(['zh-CN', 'en']).default('zh-CN'),
  lastReviewed: z.coerce.date(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: learningMetadata }),
  }),
};
