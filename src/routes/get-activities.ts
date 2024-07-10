import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function getActivities(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/activities",
    {
      schema: {
        summary: "Get activities",
        tags: ["activities"],
        params: z.object({
          tripId: z.string().uuid()
        }),
        response: {
          201: z.object({
            activities: z.array(z.object({
              id: z.string().uuid(),
              title: z.string(),
              occurs_at: z.date(),
              trip_id: z.string().uuid()
            }))
          })
        }
      }
    },
    async (req, reply) => {
      const { tripId } = req.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: {
          activities: true
        }
      })

      if(!trip) throw new Error("Trip not found")

      return reply.status(201).send({ activities: trip.activities })
    }
  )
}