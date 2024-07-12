import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { dayjs } from '@/lib/dayjs'
import { getMailClient } from '@/lib/mailer'
import { prisma } from '@/lib/prisma'

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invites',
    {
      schema: {
        summary: 'Create a new invite',
        tags: ['invites'],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          201: z.object({
            participantId: z.string().uuid(),
          }),
        },
      },
    },
    async (req, reply) => {
      const { tripId } = req.params
      const { email } = req.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      })

      if (!trip) throw new Error('Trip not found')

      const participantAlreadyInvited = await prisma.participant.findFirst({
        where: {
          email,
          trip_id: tripId,
        },
      })

      if (participantAlreadyInvited) {
        throw new Error('Participant already invited')
      }

      const participant = await prisma.participant.create({
        data: {
          email,
          trip_id: tripId,
        },
      })

      const formattedStartDate = dayjs(trip.starts_at).format('LLL')
      const formattedEndDate = dayjs(trip.ends_at).format('LLL')

      const mail = await getMailClient()

      const confirmationLink = `http://localhost:3333/participants/${participant.id}/confirm/`

      const message = await mail.sendMail({
        from: {
          name: 'Plann.it team',
          address: 'attending@plannit.com',
        },
        to: participant.email,
        subject: `Confirm your presence to ${trip.destination} on ${formattedStartDate}`,

        html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>You have been invited to join a trip to <strong>${trip.destination}</strong>, on the dates of <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong></p>
              <p></p>
              <p>To confirm your presence, please click on the following link: </p>
              <p></p>
              <p>
                <a href="${confirmationLink}">
                  Confirm presence
                </a>
              </p>
              <p></p>
              <p>Case you don't know what this email is about, please ignore it.</p>
              </div>
            `.trim(),
      })

      console.log(nodemailer.getTestMessageUrl(message))

      return reply.status(201).send({ participantId: participant.id })
    },
  )
}
