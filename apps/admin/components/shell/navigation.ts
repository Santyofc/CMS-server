export const appNavigation = [
  { href: "/", label: "Overview", description: "Estado operativo" },
  { href: "/providers/aws", label: "AWS", description: "EC2 + CloudWatch" },
  { href: "/providers/github", label: "GitHub", description: "Repos y actividad" },
  { href: "/providers/vercel", label: "Vercel", description: "Deployments" },
  { href: "/providers/neon", label: "Neon", description: "Projects y branches" },
  { href: "/providers/spaceship", label: "Spaceship", description: "DNS y dominios" },
  { href: "/repositories", label: "Repositories", description: "Inventario GitHub" },
  { href: "/deployments", label: "Deployments", description: "Historial operativo" },
  { href: "/metrics", label: "Metrics", description: "Observabilidad" },
  { href: "/domains", label: "Domains", description: "DNS y drift" },
  { href: "/infra", label: "Infra", description: "Inventario infra" },
  { href: "/users", label: "Users", description: "Accesos y roles" }
] as const;
