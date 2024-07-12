/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { dayjs } from '@/lib/dayjs'
import { prisma } from '@/lib/prisma'

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/trips/:tripId',
    {
      schema: {
        summary: 'Update a trip',
        tags: ['trips'],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (req, reply) => {
      const { tripId } = req.params

      const { destination, ends_at, starts_at } = req.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      })

      if (!trip) throw new Error('Trip not found!')

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error('The trip cannot start in the past')
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error('The trip cannot end before it starts')
      }

      await prisma.trip.update({
        where: {
          id: trip.id,
        },
        data: {
          destination,
          starts_at,
          ends_at,
        },
      })

      return reply.status(204).send(null)
    },
  )
}
