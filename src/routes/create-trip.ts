import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"
import dayjs from "dayjs"
import { getMailClient } from "@/lib/mailer";
import nodemailer from "nodemailer"

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips",
    {
      schema: {
        summary: "Create a new trip",
        tags: ["trips"],
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          owner_email: z.string().email()
        }),
        response: {
          201: z.object({
            tripId: z.string().uuid()
          })
        }
      }
    },
    async (req, reply) => {
      const { destination, ends_at, starts_at,owner_email, owner_name } = req.body

      if(dayjs(starts_at).isBefore(new Date())) {
        throw new Error("The trip cannot start in the past")
      }

      if(dayjs(ends_at).isBefore(starts_at)) {
        throw new Error("The trip cannot end before it starts")
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at
        }
      })

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: "Plann.it team",
          address: "attending@plannit.com",
        },
        to: {
          name: owner_name,
          address: owner_email
        },
        subject: "Your trip has been created",
        html: `<p>Your has trip has been successfully created. You can access the details of it and invite new users clicking here.</p>`
      })

      console.log(nodemailer.getTestMessageUrl(message))

      return {
        tripId: trip.id
      }
    }
  )
}