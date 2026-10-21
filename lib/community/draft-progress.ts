import { z } from 'zod';
import { childInput } from './validation';
import { AFFILIATIONS } from './policy';
export const draftProgressInput = z.object({
  affiliation: z.enum(AFFILIATIONS).or(z.literal('')).optional(),
  gender: z.enum(['male','female']).or(z.literal('')).optional(),
  firstName: z.string().max(100).optional(), lastName: z.string().max(100).optional(),
  phone: z.string().max(25).optional(), dateOfBirth: z.string().max(10).optional(),
  city: z.string().max(150).optional(), cityId: z.string().regex(/^\d{4}$/).nullable().optional(),
  maritalStatus: z.enum(['single','married','divorced','widowed','']).optional(),
  spouseName: z.string().max(150).nullable().optional(), hasChildren: z.boolean().optional(),
  agreedToPrivacy: z.boolean().optional(), expectedRevision: z.number().int().nonnegative().optional(),
  childrenData: z.array(childInput).max(20).optional(),
}).strict();
export function draftForm(payload: any) { return payload?.form ?? payload; }
export function draftReady(payload: any) { return payload?.form ? payload.ready === true : true; }
