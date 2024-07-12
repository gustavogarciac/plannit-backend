import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { ClientError } from '@/errors/client-error'
import { prisma } from '@/lib/prisma'

export async function getTripDetails(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId',
    {
      schema: {
        summary: 'Get trip details',
        tags: ['trips'],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            trip: z.object({
              id: z.string().uuid(),
              destination: z.string(),
              starts_at: z.date(),
              ends_at: z.date(),
              is_confirmed: z.boolean(),
            }),
          }),
        },
      },
    },
    async (req, reply) => {
      const { tripId } = req.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        select: {
          destination: true,
          starts_at: true,
          ends_at: true,
          id: true,
          is_confirmed: true,
        },
      })

      if (!trip) throw new ClientError('Trip not found')

      return reply.status(201).send({ trip })
    },
  )
}
