import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/room-schedule.tsx"),
  route("google-calendar", "routes/google-calendar.tsx"),
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
] satisfies RouteConfig;
