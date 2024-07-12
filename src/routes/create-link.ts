import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { ClientError } from '@/errors/client-error'
import { prisma } from '@/lib/prisma'

export async function createLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/links',
    {
      schema: {
        summary: 'Create a new link',
        tags: ['links'],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          url: z.string().url(),
        }),
        response: {
          201: z.object({
            linkId: z.string().uuid(),
          }),
        },
      },
    },
    async (req, reply) => {
      const { tripId } = req.params
      const { title, url } = req.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      })

      if (!trip) throw new ClientError('Trip not found')

      const link = await prisma.link.create({
        data: {
          url,
          title,
          trip_id: tripId,
        },
      })

      return reply.status(201).send({ linkId: link.id })
    },
  )
}
