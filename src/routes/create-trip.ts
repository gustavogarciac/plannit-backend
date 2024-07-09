import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"
import dayjs from "dayjs"

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
          ends_at: z.coerce.date()
        }),
        response: {
          201: z.object({
            tripId: z.string().uuid()
          })
        }
      }
    },
    async (req, reply) => {
      const { destination, ends_at, starts_at } = req.body

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


      return {
        tripId: trip.id
      }
    }
  )
}