import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/abordagem")({
  validateSearch: z.object({ empresa: z.string().optional().catch(undefined) }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/analise-cliente",
      search: {
        empresa: search.empresa,
        tab: "dossier",
      },
    });
  },
  component: () => null,
});
