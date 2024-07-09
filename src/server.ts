import fastify from "fastify"
import { prisma } from "./lib/prisma"

const app = fastify()

app.get("/test", () => {
  return "Hello World!"
})

app.listen({ port: 3333 }).then(() => console.log("HTTP server is running"))