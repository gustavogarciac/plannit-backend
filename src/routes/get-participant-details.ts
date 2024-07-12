import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function getParticipantDetails(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId',
    {
      schema: {
        summary: 'Get participant details',
        tags: ['participants'],
        params: z.object({
          participantId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            participant: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              is_confirmed: z.boolean(),
            }),
          }),
        },
      },
    },
    async (req, reply) => {
      const { participantId } = req.params

      const participant = await prisma.participant.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          is_confirmed: true,
        },
        where: {
          id: participantId,
        },
      })

      if (!participant) throw new Error('Participant not found')

      return reply.status(200).send({ participant })
    },
  )
}
