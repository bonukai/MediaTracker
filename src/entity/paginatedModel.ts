import { z } from 'zod';

export const paginatedInputSchema = z.object({
  page: z.number().int().min(1),
  numberOfItemsPerPage: z.number().int().min(1).default(50),
});

export const paginatedOutputSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) => {
  return z.object({
    page: z.number().int().min(1),
    totalNumberOfPages: z.number().int().min(0),
    totalNumberOfItems: z.number().int().min(0),
    items: z.array(itemSchema),
  });
};
