import fastify from "fastify"
import { prisma } from "./lib/prisma"
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod"
import { fastifySwagger } from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { createTrip } from "./routes/create-trip"

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Plann.it API",
      version: "1.0.0",
      description: "API Documentation for Plann.it",
    },
  },
  transform: jsonSchemaTransform
})
app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip)

app.listen({ port: 3333 }).then(() => console.log("HTTP server is running"))