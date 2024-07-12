import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function getParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/participants',
    {
      schema: {
        summary: 'Get participants',
        tags: ['participants'],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          201: z.object({
            participants: z.array(
              z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                is_confirmed: z.boolean(),
              }),
            ),
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
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              is_confirmed: true,
            },
          },
        },
      })

      if (!trip) throw new Error('Trip not found')

      return reply.status(201).send({ participants: trip.participants })
    },
  )
}
