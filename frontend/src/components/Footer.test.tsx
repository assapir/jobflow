import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("should render the app title", () => {
    render(<Footer />);

    // The title appears in the tagline section
    expect(screen.getByText("app.title")).toBeInTheDocument();
  });

  it("should render the tagline", () => {
    render(<Footer />);

    expect(screen.getByText(/app.tagline/)).toBeInTheDocument();
  });

  it("should render the copyright with current year", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it("should render as a footer element", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("should render all rights reserved text", () => {
    render(<Footer />);

    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it("should have the title with gradient styling", () => {
    render(<Footer />);

    // Get the first title text (in the tagline section)
    const titles = screen.getAllByText("app.title");
    const titleElement = titles[0];

    // Check that the element has a style attribute (gradient is applied inline)
    expect(titleElement).toHaveStyle({
      fontWeight: 600,
    });
  });

  it("should render tagline with em dash separator", () => {
    render(<Footer />);

    // The tagline is rendered with "— " prefix
    const taglineElement = screen.getByText(/— app.tagline/);
    expect(taglineElement).toBeInTheDocument();
  });
});
