import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index-page.tsx"),
  route("designs", "routes/home.tsx"),
  route("google-calendar", "routes/google-calendar.tsx"),
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  route("1", "routes/design1.tsx"),
  route("2", "routes/design2.tsx"),
  route("3", "routes/design3.tsx"),
  route("4", "routes/design4.tsx"),
  route("5", "routes/design5.tsx"),
  route("6", "routes/design6.tsx"),
  route("7", "routes/design7.tsx"),
  route("8", "routes/design8.tsx"),
  route("9", "routes/design9.tsx"),
  route("10", "routes/design10.tsx"),
] satisfies RouteConfig;
