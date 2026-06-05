import { NextResponse } from "next/server"
import type { NextProxy } from "next/server"

import { auth } from "@/auth"

export const proxy: NextProxy = async (req) => {
  const session = await auth()

  const isLoggedIn = !!session

  // Redirect to CMS if logged-in user tries to access sign-in page
  if (req.nextUrl.pathname === "/sign-in" && isLoggedIn) {
    return NextResponse.redirect(new URL("/cms", req.url))
  }

  const protectedRoutes = [
    "/cms",
  ]

  const isProtected = protectedRoutes.some(
    (route) =>
      req.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/sign-in", req.url)

    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search
    )

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/cms/:path*",
    "/sign-in",
  ],
}