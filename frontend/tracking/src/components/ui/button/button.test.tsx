import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("should render button with children", () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container.textContent).toContain("Click me");
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { container } = render(<Button onClick={handleClick}>Click me</Button>);

    const button = container.querySelector("button");
    if (button) {
      await user.click(button);
    }
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    const { container } = render(<Button disabled>Disabled Button</Button>);
    const button = container.querySelector("button");
    expect(button).toBeDisabled();
  });

  it("should be disabled when isLoading is true", () => {
    const { container } = render(<Button isLoading>Loading Button</Button>);
    const button = container.querySelector("button");
    expect(button).toBeDisabled();
  });

  it("should show loading spinner when isLoading", () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const spinner = container.querySelector(".loading-spinner");
    expect(spinner).toBeInTheDocument();
  });

  it("should apply variant classes", () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.querySelector(".btn-primary")).toBeInTheDocument();
  });

  it("should apply size classes", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.querySelector(".btn-lg")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
