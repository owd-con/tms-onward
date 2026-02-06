import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  describe("Rendering", () => {
    it("renders correctly with children", () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("renders with default variant", () => {
      const { container } = render(<Badge>Default</Badge>);
      expect(container.querySelector(".badge")).toBeInTheDocument();
      expect(container.querySelector(".badge-neutral")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("applies primary variant class", () => {
      const { container } = render(<Badge variant="primary">Primary</Badge>);
      expect(container.querySelector(".badge-primary")).toBeInTheDocument();
    });

    it("applies secondary variant class", () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      expect(container.querySelector(".badge-secondary")).toBeInTheDocument();
    });

    it("applies accent variant class", () => {
      const { container } = render(<Badge variant="accent">Accent</Badge>);
      expect(container.querySelector(".badge-accent")).toBeInTheDocument();
    });

    it("applies info variant class", () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      expect(container.querySelector(".badge-info")).toBeInTheDocument();
    });

    it("applies success variant class", () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.querySelector(".badge-success")).toBeInTheDocument();
    });

    it("applies warning variant class", () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      expect(container.querySelector(".badge-warning")).toBeInTheDocument();
    });

    it("applies error variant class", () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      expect(container.querySelector(".badge-error")).toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    it("applies xs size class", () => {
      const { container } = render(<Badge size="xs">XS</Badge>);
      expect(container.querySelector(".badge-xs")).toBeInTheDocument();
    });

    it("applies sm size class", () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      expect(container.querySelector(".badge-sm")).toBeInTheDocument();
    });

    it("applies md size class", () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      expect(container.querySelector(".badge-md")).toBeInTheDocument();
    });

    it("applies lg size class", () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      expect(container.querySelector(".badge-lg")).toBeInTheDocument();
    });

    it("applies xl size class", () => {
      const { container } = render(<Badge size="xl">Extra Large</Badge>);
      expect(container.querySelector(".badge-xl")).toBeInTheDocument();
    });
  });

  describe("Appearance", () => {
    it("applies outline appearance class", () => {
      const { container } = render(<Badge appearance="outline">Outline</Badge>);
      expect(container.querySelector(".badge-outline")).toBeInTheDocument();
    });

    it("applies dash appearance class", () => {
      const { container } = render(<Badge appearance="dash">Dash</Badge>);
      expect(container.querySelector(".badge-dash")).toBeInTheDocument();
    });

    it("applies soft appearance class", () => {
      const { container } = render(<Badge appearance="soft">Soft</Badge>);
      expect(container.querySelector(".badge-soft")).toBeInTheDocument();
    });

    it("applies ghost appearance class", () => {
      const { container } = render(<Badge appearance="ghost">Ghost</Badge>);
      expect(container.querySelector(".badge-ghost")).toBeInTheDocument();
    });
  });

  describe("Combined Props", () => {
    it("applies variant and size classes together", () => {
      const { container } = render(
        <Badge variant="primary" size="lg">
          Large Primary
        </Badge>
      );
      const badge = container.querySelector(".badge");
      expect(badge).toHaveClass("badge-primary", "badge-lg");
    });

    it("applies variant, size, and appearance classes together", () => {
      const { container } = render(
        <Badge variant="error" size="sm" appearance="outline">
          Small Error Outline
        </Badge>
      );
      const badge = container.querySelector(".badge");
      expect(badge).toHaveClass("badge-error", "badge-sm", "badge-outline");
    });
  });

  describe("Custom Props", () => {
    it("applies custom className", () => {
      const { container } = render(<Badge className="custom-class">Custom</Badge>);
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("passes through other div props", () => {
      const { container } = render(
        <Badge data-testid="test-badge" role="status">
          Test
        </Badge>
      );
      const badge = container.querySelector('[data-testid="test-badge"]');
      expect(badge).toHaveAttribute("role", "status");
    });
  });
});
