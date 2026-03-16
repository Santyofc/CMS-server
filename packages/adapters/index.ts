import { z } from "zod";

export const adapterSchema = z.object({
  id: z.string(),
  frameworkType: z.enum(["next-turborepo", "nuxt", "vite-react", "generic-json", "mdx"]),
  repoKind: z.string(),
  editableRoots: z.array(z.string()),
  allowlistedPaths: z.array(z.string()),
  fileMatchers: z.array(z.string()),
  settings: z.record(z.any())
});

export type AdapterConfig = z.infer<typeof adapterSchema>;

export interface BaseAdapter {
  id: string;
  name: string;
  frameworkType: string;
  discoverEditableFiles(repoPath: string): Promise<string[]>;
  readEditableContent(path: string): Promise<Record<string, unknown>>;
  writeEditableContent(path: string, data: Record<string, unknown>): Promise<void>;
  getEntitySchema?(entityType: string): Record<string, unknown>;
}

export class NextTurborepoAdapter implements BaseAdapter {
  id = "next-turborepo";
  name = "Next.js Turborepo Adapter";
  frameworkType = "next-turborepo";

  async discoverEditableFiles(repoPath: string): Promise<string[]> {
    return ["app/data/content.json", "app/data/hero.json"];
  }

  async readEditableContent(path: string): Promise<Record<string, unknown>> {
    return { path, content: { hero: { title: "ZonaSurTech" } } };
  }

  async writeEditableContent(path: string, data: Record<string, unknown>): Promise<void> {
    console.log("write", path, data);
  }
}

export class GenericJsonContentAdapter implements BaseAdapter {
  id = "generic-json";
  name = "Generic JSON Content Adapter";
  frameworkType = "generic-json";

  async discoverEditableFiles(repoPath: string): Promise<string[]> {
    return ["content/home.json", "content/about.json"];
  }

  async readEditableContent(path: string): Promise<Record<string, unknown>> {
    return { title: "Generic" };
  }

  async writeEditableContent(path: string, data: Record<string, unknown>): Promise<void> {
    console.log("write generic", path, data);
  }
}
