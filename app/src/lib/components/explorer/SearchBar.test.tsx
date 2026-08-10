import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar, ALL_VISIBILITY, ALL_RELEASE_STATUS } from "./SearchBar";
import { FilterService } from "./FilterService";

function renderSearchBar(
  overrides: Partial<Parameters<typeof SearchBar>[0]> = {},
) {
  const onQueryChange = vi.fn();
  const onFiltersChange = vi.fn();
  render(
    <SearchBar
      query=""
      filters={FilterService.empty()}
      onQueryChange={onQueryChange}
      onFiltersChange={onFiltersChange}
      {...overrides}
    />,
  );
  return { onQueryChange, onFiltersChange };
}

describe("SearchBar — rendering", () => {
  it("renders the search input", () => {
    renderSearchBar();
    expect(screen.getByTestId("search-input")).toBeDefined();
  });

  it("reflects the query prop in the input value", () => {
    renderSearchBar({ query: "astronomy" });
    expect((screen.getByTestId("search-input") as HTMLInputElement).value).toBe(
      "astronomy",
    );
  });

  it("renders all visibility filter chips", () => {
    renderSearchBar();
    for (const v of ALL_VISIBILITY) {
      expect(
        screen.getByRole("button", { name: new RegExp(v, "i") }),
      ).toBeDefined();
    }
  });

  it("renders all release status filter chips", () => {
    renderSearchBar();
    // "active" and "beta" and "dev" (Dev is the label for development)
    expect(screen.getByRole("button", { name: /active/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /beta/i })).toBeDefined();
  });

  it("does not show the clear-filters button when no filters active", () => {
    renderSearchBar();
    expect(screen.queryByRole("button", { name: /clear filters/i })).toBeNull();
  });

  it("shows the clear-filters button when a visibility filter is active", () => {
    renderSearchBar({
      filters: FilterService.toggleVisibility(FilterService.empty(), "public"),
    });
    expect(
      screen.getByRole("button", { name: /clear filters/i }),
    ).toBeDefined();
  });

  it("marks an active visibility chip as pressed", () => {
    renderSearchBar({
      filters: FilterService.toggleVisibility(FilterService.empty(), "public"),
    });
    const chip = screen.getByRole("button", { name: /public/i });
    expect((chip as HTMLButtonElement).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("uses the custom placeholder when provided", () => {
    renderSearchBar({ placeholder: "Find something…" });
    expect(
      (screen.getByTestId("search-input") as HTMLInputElement).placeholder,
    ).toBe("Find something…");
  });
});

describe("SearchBar — interactions", () => {
  it("calls onQueryChange when the user types", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderSearchBar();
    await user.type(screen.getByTestId("search-input"), "a");
    expect(onQueryChange).toHaveBeenCalledWith("a");
  });

  it("calls onFiltersChange with toggled visibility when a chip is clicked", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderSearchBar();
    await user.click(screen.getByRole("button", { name: /public/i }));
    expect(onFiltersChange).toHaveBeenCalledOnce();
    const updated = onFiltersChange.mock.calls[0][0];
    expect(updated.visibility.has("public")).toBe(true);
  });

  it("calls onFiltersChange with toggled release status when a chip is clicked", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderSearchBar();
    await user.click(screen.getByRole("button", { name: /beta/i }));
    expect(onFiltersChange).toHaveBeenCalledOnce();
    const updated = onFiltersChange.mock.calls[0][0];
    expect(updated.releaseStatus.has("beta")).toBe(true);
  });

  it("calls onFiltersChange with empty filters when clear-filters is clicked", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderSearchBar({
      filters: FilterService.toggleVisibility(
        FilterService.empty(),
        "internal",
      ),
    });
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    const updated = onFiltersChange.mock.calls[0][0];
    expect(updated.visibility.size).toBe(0);
    expect(updated.releaseStatus.size).toBe(0);
  });

  it("calls onFiltersChange with all release statuses when each chip is clicked once", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderSearchBar();
    for (const label of ["Active", "Beta", "Dev", "Deprecated", "Sunset"]) {
      await user.click(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      );
    }
    expect(onFiltersChange).toHaveBeenCalledTimes(ALL_RELEASE_STATUS.length);
  });
});
