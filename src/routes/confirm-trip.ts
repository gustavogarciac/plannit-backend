import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";


export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        summary: "Confirm a trip",
        tags: ["trips"],
        params: z.object({
          tripId: z.string().uuid()
        }),
        response: {
          // 201: z.object({
          //   tripId: z.string().uuid()
          // })
        }
      }
    },
    async (req, reply) => {
      return { tripId: req.params.tripId }
    }
  )
}