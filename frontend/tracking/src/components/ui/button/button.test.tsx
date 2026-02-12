import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("should render button with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText("Disabled Button");
    expect(button).toBeDisabled();
  });

  it("should be disabled when isLoading is true", () => {
    render(<Button isLoading>Loading Button</Button>);
    const button = screen.getByText("Loading Button");
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
