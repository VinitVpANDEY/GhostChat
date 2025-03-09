import { z } from 'zod';

export const lastReadSchema = z.object({
    gId: z.number(),
    end: z.number(),
});

