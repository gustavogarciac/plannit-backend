/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { dayjs } from '@/lib/dayjs'
import { getMailClient } from '@/lib/mailer'
import { prisma } from '@/lib/prisma'

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips',
    {
      schema: {
        summary: 'Create a new trip',
        tags: ['trips'],
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          owner_email: z.string().email(),
          emails_to_invite: z.array(z.string().email()),
        }),
        response: {
          201: z.object({
            tripId: z.string().uuid(),
          }),
        },
      },
    },
    async (req, reply) => {
      const {
        destination,
        ends_at,
        starts_at,
        owner_email,
        owner_name,
        emails_to_invite,
      } = req.body

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error('The trip cannot start in the past')
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error('The trip cannot end before it starts')
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  email: owner_email,
                  name: owner_name,
                  is_owner: true,
                  is_confirmed: true,
                },
                ...emails_to_invite.map((email) => {
                  return { email }
                }),
              ],
            },
          },
        },
      })

      const formattedStartDate = dayjs(starts_at).format('LLL')
      const formattedEndDate = dayjs(ends_at).format('LLL')

      const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: 'Plann.it team',
          address: 'attending@plannit.com',
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: `Confirm your trip to ${destination} on ${formattedStartDate}`,

        html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>You request the creation of a trip to <strong>${destination}</strong>, on the dates of <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong></p>
          <p></p>
          <p>To confirm the trip, please click on the following link: </p>
          <p></p>
          <p>
            <a href="${confirmationLink}">
              Confirm trip
            </a>
          </p>
          <p></p>
          <p>Case you don't know what this email is about, please ignore it.</p>
          </div>
        `.trim(),
      })

      console.log(nodemailer.getTestMessageUrl(message))

      return reply.status(201).send({
        tripId: trip.id,
      })
    },
  )
}
