import { describe, expect, it, vi } from "vitest";

const requirePageAccess = vi.fn();

vi.mock("@/lib/security/page", () => ({
  requirePageAccess
}));

vi.mock("@/components/shell/app-shell", () => ({
  default: ({ children }: { children: unknown }) => ({ props: { children } })
}));

describe("protected layout", () => {
  it("enforces page access before rendering children", async () => {
    requirePageAccess.mockResolvedValue({ id: 1, email: "owner@example.com", role: "owner" });
    const { default: ProtectedLayout } = await import("@/app/(protected)/layout");
    const children = "secure";

    const result = await ProtectedLayout({ children });

    expect(requirePageAccess).toHaveBeenCalledWith("viewer");
    expect(result.props.children).toBe(children);
  });
});
