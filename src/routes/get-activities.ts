import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { dayjs } from "@/lib/dayjs"

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
              date: z.date(),
              activities: z.array(z.object({
                id: z.string().uuid(),
                title: z.string(),
                occurs_at: z.date(),
                trip_id: z.string().uuid()
              }))
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
          activities: {
            orderBy: {
              occurs_at: 'asc'
            }
          }
        }
      })

      if(!trip) throw new Error("Trip not found")

      const differenceInDaysBetweenTripStartsAndEnd = dayjs(trip.ends_at).diff(dayjs(trip.starts_at), 'days')

      const activities = Array.from({ length: differenceInDaysBetweenTripStartsAndEnd + 1 }).map((_, index) => {
        const date = dayjs(trip.starts_at).add(index, 'days')

        return {
          date: date.toDate(),
          activities: trip.activities.filter(activity => dayjs(activity.occurs_at).isSame(date, 'day'))
        }
      })

      return reply.status(201).send({ activities })
    }
  )
}