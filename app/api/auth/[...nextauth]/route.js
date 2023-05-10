import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

import User from "@models/user"
import { connectToDB } from "@utils/database"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session }) {
      const sessionUser = await User.findOne({ email: session.user.email })
      session.user.id = sessionUser._id.toString()

      return session
    },
    async signIn({ account, profile, user, credentials }) {
      try {
        await connectToDB()

        const userExists = await User.findOne({ email: profile.email })

        if (!userExists) {
          const username = profile.name.replace(" ", "").toLowerCase()

          const baseUsername = /^[a-zA-Z0-9]{8,20}$/.test(username)
            ? username
            : `user${Date.now().toString(36)}`

          const newUser = await User.create({
            email: profile.email,
            username: baseUsername,
            image: profile.picture,
          })
        }

        return true
      } catch (error) {
        console.log("Error checking if user exists: ", error.message)
        return false
      }
    },
  },
})

export { handler as GET, handler as POST }
