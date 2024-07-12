import 'dotenv/config'

import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error(
    'Invalid environment variables',
    _env.error.flatten().fieldErrors,
  )

  throw new Error('Invalid environment variables')
}

export const env = _env.data
