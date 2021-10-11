import * as Sentry from "@sentry/node"
import getConfig from "next/config"
import { RewriteFrames } from "@sentry/integrations"

const config = getConfig()

if (process.env.SENTRY_DSN && config) {
  const distDir = `${config.serverRuntimeConfig.rootDir}/.next`
  Sentry.init({
    integrations: [
      new RewriteFrames({
        iteratee: (frame: any) => {
          frame.filename = frame.filename.replace(distDir, "app:///_next")
          return frame
        },
      }),
    ],
    dsn: process.env.SENTRY_DSN,
    beforeSend(event, hint) {
      const error = hint?.originalException
      if (error && typeof error !== "string") {
        switch (error.name) {
          case "AuthenticationError":
          case "AuthorizationError":
          case "NotFoundError":
          case "ChunkLoadError":
            return null
        }
        if (error.message?.includes("Your card was declined")) return null
        if (error.message?.includes("Your card has insufficient funds")) return null
        if (error.message?.includes("security code is incorrect")) return null
      }
      return event
    },
  })
}

export default Sentry
