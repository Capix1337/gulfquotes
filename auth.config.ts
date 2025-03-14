import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { loginSchema } from "./schemas"
import { getUserByEmail } from "./data/user"
import { compare } from "bcryptjs"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"

export default {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const user = await getUserByEmail(email)
          if (!user || !user.password) return null

          const isPassowordValid = await compare(password, user.password)

          if (isPassowordValid) return user
        }

        return null
      } 
    })
  ]
} satisfies NextAuthConfig