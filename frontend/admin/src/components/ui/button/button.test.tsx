import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  describe("Rendering", () => {
    it("renders correctly with children", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("renders with default props when none provided", () => {
      const { container } = render(<Button>Default</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("btn");
      expect(button).not.toHaveClass("btn-primary", "btn-secondary", "btn-error");
    });
  });

  describe("Variants", () => {
    it("applies primary variant class", () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      expect(container.querySelector(".btn-primary")).toBeInTheDocument();
    });

    it("applies secondary variant class", () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      expect(container.querySelector(".btn-secondary")).toBeInTheDocument();
    });

    it("applies accent variant class", () => {
      const { container } = render(<Button variant="accent">Accent</Button>);
      expect(container.querySelector(".btn-accent")).toBeInTheDocument();
    });

    it("applies info variant class", () => {
      const { container } = render(<Button variant="info">Info</Button>);
      expect(container.querySelector(".btn-info")).toBeInTheDocument();
    });

    it("applies success variant class", () => {
      const { container } = render(<Button variant="success">Success</Button>);
      expect(container.querySelector(".btn-success")).toBeInTheDocument();
    });

    it("applies warning variant class", () => {
      const { container } = render(<Button variant="warning">Warning</Button>);
      expect(container.querySelector(".btn-warning")).toBeInTheDocument();
    });

    it("applies error/danger variant class", () => {
      const { container } = render(<Button variant="error">Delete</Button>);
      expect(container.querySelector(".btn-error")).toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    it("applies xs size class", () => {
      const { container } = render(<Button size="xs">Extra Small</Button>);
      expect(container.querySelector(".btn-xs")).toBeInTheDocument();
    });

    it("applies sm size class", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      expect(container.querySelector(".btn-sm")).toBeInTheDocument();
    });

    it("applies md size class by default", () => {
      const { container } = render(<Button size="md">Medium</Button>);
      expect(container.querySelector(".btn-md")).toBeInTheDocument();
    });

    it("applies lg size class", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      expect(container.querySelector(".btn-lg")).toBeInTheDocument();
    });

    it("applies xl size class", () => {
      const { container } = render(<Button size="xl">Extra Large</Button>);
      expect(container.querySelector(".btn-xl")).toBeInTheDocument();
    });
  });

  describe("Shapes", () => {
    it("applies wide shape class", () => {
      const { container } = render(<Button shape="wide">Wide</Button>);
      expect(container.querySelector(".btn-wide")).toBeInTheDocument();
    });

    it("applies block shape class", () => {
      const { container } = render(<Button shape="block">Block</Button>);
      expect(container.querySelector(".btn-block")).toBeInTheDocument();
    });

    it("applies square shape class", () => {
      const { container } = render(<Button shape="square">Square</Button>);
      expect(container.querySelector(".btn-square")).toBeInTheDocument();
    });

    it("applies circle shape class", () => {
      const { container } = render(<Button shape="circle">Circle</Button>);
      expect(container.querySelector(".btn-circle")).toBeInTheDocument();
    });
  });

  describe("Style Types", () => {
    it("applies outline style class", () => {
      const { container } = render(<Button styleType="outline">Outline</Button>);
      expect(container.querySelector(".btn-outline")).toBeInTheDocument();
    });

    it("applies dash style class", () => {
      const { container } = render(<Button styleType="dash">Dash</Button>);
      expect(container.querySelector(".btn-dash")).toBeInTheDocument();
    });

    it("applies soft style class", () => {
      const { container } = render(<Button styleType="soft">Soft</Button>);
      expect(container.querySelector(".btn-soft")).toBeInTheDocument();
    });

    it("applies ghost style class", () => {
      const { container } = render(<Button styleType="ghost">Ghost</Button>);
      expect(container.querySelector(".btn-ghost")).toBeInTheDocument();
    });

    it("applies link style class", () => {
      const { container } = render(<Button styleType="link">Link</Button>);
      expect(container.querySelector(".btn-link")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading spinner when isLoading is true", () => {
      const { container } = render(<Button isLoading={true}>Loading</Button>);
      expect(container.querySelector(".loading-spinner")).toBeInTheDocument();
    });

    it("disables button when loading", () => {
      render(<Button isLoading={true}>Loading</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("applies btn-disabled class when loading", () => {
      const { container } = render(<Button isLoading={true}>Loading</Button>);
      expect(container.querySelector(".btn-disabled")).toBeInTheDocument();
    });

    it("does not show spinner when not loading", () => {
      const { container } = render(<Button isLoading={false}>Not Loading</Button>);
      expect(container.querySelector(".loading-spinner")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("disables button when disabled prop is true", () => {
      render(<Button disabled={true}>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("applies btn-disabled class when disabled", () => {
      const { container } = render(<Button disabled={true}>Disabled</Button>);
      expect(container.querySelector(".btn-disabled")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("handles click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not handle click when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled={true}>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not handle click when loading", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} isLoading={true}>
          Loading
        </Button>
      );

      await user.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Custom Props", () => {
    it("applies custom className", () => {
      const { container } = render(<Button className="custom-class">Custom</Button>);
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("passes through other button props", () => {
      render(
        <Button data-testid="test-button" type="submit" name="submit">
          Submit
        </Button>
      );
      const button = screen.getByTestId("test-button");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("name", "submit");
    });
  });

  describe("Combined Props", () => {
    it("applies variant, size, and styleType together", () => {
      const { container } = render(
        <Button variant="primary" size="lg" styleType="outline">
          Large Primary Outline
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("btn", "btn-primary", "btn-lg", "btn-outline");
    });

    it("applies all props together", () => {
      const { container } = render(
        <Button variant="error" size="sm" shape="wide" className="custom">
          Custom Button
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("btn", "btn-error", "btn-sm", "btn-wide", "custom");
    });
  });
});
