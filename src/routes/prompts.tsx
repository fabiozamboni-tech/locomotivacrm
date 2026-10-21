import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/prompts")({
  validateSearch: z.object({ empresa: z.string().optional().catch(undefined) }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/estudio-criacao" as never,
      search: {
        empresa: search.empresa,
        tab: "prompts",
      } as never,
    });
  },
  component: () => null,
});
