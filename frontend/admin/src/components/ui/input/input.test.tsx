import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders correctly with basic props", () => {
      render(<Input id="test-input" value="" onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with label", () => {
      render(<Input id="test-input" label="Test Label" value="" onChange={vi.fn()} />);
      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("renders with required asterisk", () => {
      render(<Input id="test-input" label="Email" required value="" onChange={vi.fn()} />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders with hint", () => {
      render(<Input id="test-input" hint="This is a hint" value="" onChange={vi.fn()} />);
      expect(screen.getByText("This is a hint")).toBeInTheDocument();
    });

    it("renders with error message", () => {
      render(<Input id="test-input" error="This field is required" value="" onChange={vi.fn()} />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("does not render when hidden is true", () => {
      const { container } = render(<Input id="test-input" hidden value="" onChange={vi.fn()} />);
      expect(container.querySelector("input")).not.toBeInTheDocument();
    });
  });

  describe("Value Changes", () => {
    it("handles text input changes", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input id="test-input" value="" onChange={handleChange} />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Hello World");
      expect(handleChange).toHaveBeenCalled();
    });

    it("displays initial value", () => {
      render(<Input id="test-input" value="Initial value" onChange={vi.fn()} />);
      expect(screen.getByDisplayValue("Initial value")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("applies error class when error prop is provided", () => {
      const { container } = render(
        <Input id="test-input" error="Error message" value="" onChange={vi.fn()} />
      );
      const input = container.querySelector("input");
      expect(input).toHaveClass("input-error");
    });

    it("shows error message when error prop is provided", () => {
      render(<Input id="test-input" error="This is an error" value="" onChange={vi.fn()} />);
      expect(screen.getByText("This is an error")).toBeInTheDocument();
      expect(screen.getByText("This is an error")).toHaveClass("text-error");
    });
  });

  describe("Disabled State", () => {
    it("applies disabled styles when disabled", () => {
      const { container } = render(
        <Input id="test-input" disabled value="test" onChange={vi.fn()} />
      );
      const input = container.querySelector("input");
      expect(input).toBeDisabled();
      expect(input).toHaveClass("!border-base-300");
    });

    it("does not allow input when disabled", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input id="test-input" disabled value="test" onChange={handleChange} />);
      const input = screen.getByRole("textbox");

      await user.type(input, "new text");
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Sizes", () => {
    it("applies size classes correctly", () => {
      const { container: smContainer } = render(<Input id="test-sm" size="sm" value="" onChange={vi.fn()} />);
      const { container: mdContainer } = render(<Input id="test-md" size="md" value="" onChange={vi.fn()} />);
      const { container: lgContainer } = render(<Input id="test-lg" size="lg" value="" onChange={vi.fn()} />);

      expect(smContainer.querySelector("input")).toHaveClass("input-sm");
      expect(mdContainer.querySelector("input")).toHaveClass("input-md");
      expect(lgContainer.querySelector("input")).toHaveClass("input-lg");
    });
  });

  describe("Variants", () => {
    it("applies primary variant class", () => {
      const { container } = render(<Input id="test-input" variant="primary" value="" onChange={vi.fn()} />);
      expect(container.querySelector("input")).toHaveClass("input-primary");
    });

    it("applies secondary variant class", () => {
      const { container } = render(<Input id="test-input" variant="secondary" value="" onChange={vi.fn()} />);
      expect(container.querySelector("input")).toHaveClass("input-secondary");
    });
  });

  describe("Special Types", () => {
    it("renders textarea when type is textarea", () => {
      const { container } = render(<Input id="test-input" type="textarea" value="" onChange={vi.fn()} />);
      expect(container.querySelector("textarea")).toBeInTheDocument();
    });

    it("renders password input with eye icon", () => {
      const { container } = render(<Input id="test-input" type="password" value="" onChange={vi.fn()} />);
      expect(container.querySelector("input[type='password']")).toBeInTheDocument();
      expect(container.querySelector(".fa-eye")).toBeInTheDocument();
    });
  });

  describe("Prefix and Suffix", () => {
    it("renders prefix element", () => {
      const { container } = render(
        <Input id="test-input" prefix={<span>$</span>} value="" onChange={vi.fn()} />
      );
      expect(container.querySelector("span")).toBeInTheDocument();
      expect(container.querySelector("input")).toHaveClass("!pl-10");
    });

    it("renders suffix element", () => {
      const { container } = render(
        <Input id="test-input" suffix={<span>kg</span>} value="" onChange={vi.fn()} />
      );
      const suffix = container.querySelector("span");
      expect(suffix).toBeInTheDocument();
      expect(suffix).toHaveTextContent("kg");
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className", () => {
      const { container } = render(
        <Input id="test-input" className="custom-class" value="" onChange={vi.fn()} />
      );
      expect(container.querySelector("input")).toHaveClass("custom-class");
    });
  });
});
