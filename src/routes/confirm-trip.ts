import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { env } from '@/env'
import { ClientError } from '@/errors/client-error'
import { getMailClient } from '@/lib/mailer'
import { prisma } from '@/lib/prisma'

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/confirm',
    {
      schema: {
        summary: 'Confirm a trip',
        tags: ['trips'],
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (req, reply) => {
      const { tripId } = await req.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_owner: false,
            },
          },
        },
      })

      if (!trip) throw new ClientError('Trip not found')

      if (trip.is_confirmed)
        return reply.redirect(`${env.FRONTEND_URL}/trips/${tripId}`)

      await prisma.trip.update({
        where: { id: tripId },
        data: {
          is_confirmed: true,
        },
      })

      const participants = trip.participants

      const formattedStartDate = dayjs(trip.starts_at).format('LLL')
      const formattedEndDate = dayjs(trip.ends_at).format('LLL')

      const mail = await getMailClient()

      await Promise.all(
        participants.map(async (participant) => {
          const confirmationLink = `${env.FRONTEND_URL}/participants/${participant.id}/confirm/`

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
        }),
      )

      return reply.redirect(`${env.API_BASE_URL}/trips/${tripId}`)
    },
  )
}
