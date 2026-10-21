import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/relatorio")({
  validateSearch: z.object({ empresa: z.string().optional().catch(undefined) }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/analise-cliente",
      search: {
        empresa: search.empresa,
        tab: "relatorio",
      },
    });
  },
  component: () => null,
});
