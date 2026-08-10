import { describe, it, expect } from "vitest";
import { FilterService } from "./FilterService";
import type { SearchFilters } from "./SearchBar";
import { ALL_VISIBILITY, ALL_RELEASE_STATUS } from "./SearchBar";

function empty(): SearchFilters {
  return FilterService.empty();
}

function full(): SearchFilters {
  return FilterService.reset();
}

// ---------------------------------------------------------------------------
// empty / reset factories
// ---------------------------------------------------------------------------

describe("FilterService.empty", () => {
  it("returns empty sets for both dimensions", () => {
    const f = empty();
    expect(f.visibility.size).toBe(0);
    expect(f.releaseStatus.size).toBe(0);
  });
});

describe("FilterService.reset", () => {
  it("activates every visibility value", () => {
    const f = full();
    expect([...f.visibility].sort()).toEqual([...ALL_VISIBILITY].sort());
  });

  it("activates every release status value", () => {
    const f = full();
    expect([...f.releaseStatus].sort()).toEqual([...ALL_RELEASE_STATUS].sort());
  });
});

// ---------------------------------------------------------------------------
// isAllActive / isNoneActive
// ---------------------------------------------------------------------------

describe("FilterService.isAllActive / isNoneActive", () => {
  it("isAllActive is true for reset filters", () => {
    expect(FilterService.isAllActive(full())).toBe(true);
  });

  it("isAllActive is false when any filter is missing", () => {
    const f = FilterService.toggleVisibility(full(), "public");
    expect(FilterService.isAllActive(f)).toBe(false);
  });

  it("isNoneActive is true for empty filters", () => {
    expect(FilterService.isNoneActive(empty())).toBe(true);
  });

  it("isNoneActive is false when any filter is set", () => {
    const f = FilterService.toggleVisibility(empty(), "public");
    expect(FilterService.isNoneActive(f)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toggleVisibility — mutual exclusivity
// ---------------------------------------------------------------------------

describe("FilterService.toggleVisibility", () => {
  it("activates a value when it was not present", () => {
    const f = FilterService.toggleVisibility(empty(), "public");
    expect(f.visibility.has("public")).toBe(true);
  });

  it("deactivates a value when it was already active (toggle off)", () => {
    const f0 = FilterService.toggleVisibility(empty(), "public");
    const f1 = FilterService.toggleVisibility(f0, "public");
    expect(f1.visibility.has("public")).toBe(false);
  });

  it("removing public deactivates private (mutual exclusion)", () => {
    const f0 = FilterService.toggleVisibility(empty(), "private");
    const f1 = FilterService.toggleVisibility(f0, "public");
    // public and private are in the same exclusive group
    expect(f1.visibility.has("public")).toBe(true);
    expect(f1.visibility.has("private")).toBe(false);
  });

  it("does not affect releaseStatus", () => {
    const f0: SearchFilters = {
      visibility: new Set(),
      releaseStatus: new Set(["active"]),
    };
    const f1 = FilterService.toggleVisibility(f0, "public");
    expect(f1.releaseStatus).toEqual(new Set(["active"]));
  });

  it("internal is exclusive with public and private", () => {
    const f0 = FilterService.toggleVisibility(empty(), "public");
    const f1 = FilterService.toggleVisibility(f0, "internal");
    expect(f1.visibility.has("public")).toBe(false);
    expect(f1.visibility.has("internal")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toggleReleaseStatus — mutual exclusivity
// ---------------------------------------------------------------------------

describe("FilterService.toggleReleaseStatus", () => {
  it("activates a value when not present", () => {
    const f = FilterService.toggleReleaseStatus(empty(), "active");
    expect(f.releaseStatus.has("active")).toBe(true);
  });

  it("deactivates a value when already active", () => {
    const f0 = FilterService.toggleReleaseStatus(empty(), "active");
    const f1 = FilterService.toggleReleaseStatus(f0, "active");
    expect(f1.releaseStatus.has("active")).toBe(false);
  });

  it("activating deprecated removes active (mutual exclusion)", () => {
    const f0 = FilterService.toggleReleaseStatus(empty(), "active");
    const f1 = FilterService.toggleReleaseStatus(f0, "deprecated");
    expect(f1.releaseStatus.has("deprecated")).toBe(true);
    expect(f1.releaseStatus.has("active")).toBe(false);
  });

  it("does not affect visibility", () => {
    const f0: SearchFilters = {
      visibility: new Set(["public"]),
      releaseStatus: new Set(),
    };
    const f1 = FilterService.toggleReleaseStatus(f0, "active");
    expect(f1.visibility).toEqual(new Set(["public"]));
  });
});

// ---------------------------------------------------------------------------
// resourceMatchesFilters — the "empty means show all" invariant
// ---------------------------------------------------------------------------

describe("FilterService.resourceMatchesFilters", () => {
  it("empty filters match any resource (show all)", () => {
    expect(
      FilterService.resourceMatchesFilters("public", "active", empty()),
    ).toBe(true);
    expect(
      FilterService.resourceMatchesFilters("private", "deprecated", empty()),
    ).toBe(true);
    expect(
      FilterService.resourceMatchesFilters(undefined, undefined, empty()),
    ).toBe(true);
  });

  it("matches when resource values are in the active filter sets", () => {
    const f: SearchFilters = {
      visibility: new Set(["public"]),
      releaseStatus: new Set(["active"]),
    };
    expect(FilterService.resourceMatchesFilters("public", "active", f)).toBe(
      true,
    );
  });

  it("rejects when visibility is not in the active set", () => {
    const f: SearchFilters = {
      visibility: new Set(["public"]),
      releaseStatus: new Set(),
    };
    expect(FilterService.resourceMatchesFilters("private", "active", f)).toBe(
      false,
    );
  });

  it("rejects when releaseStatus is not in the active set", () => {
    const f: SearchFilters = {
      visibility: new Set(),
      releaseStatus: new Set(["active"]),
    };
    expect(
      FilterService.resourceMatchesFilters("public", "deprecated", f),
    ).toBe(false);
  });

  it("defaults missing visibility to 'public'", () => {
    const f: SearchFilters = {
      visibility: new Set(["public"]),
      releaseStatus: new Set(),
    };
    expect(FilterService.resourceMatchesFilters(undefined, undefined, f)).toBe(
      true,
    );
  });

  it("defaults missing releaseStatus to 'active'", () => {
    const f: SearchFilters = {
      visibility: new Set(),
      releaseStatus: new Set(["active"]),
    };
    expect(FilterService.resourceMatchesFilters(undefined, undefined, f)).toBe(
      true,
    );
  });

  it("reset filters (all active) match any resource", () => {
    const f = full();
    expect(FilterService.resourceMatchesFilters("private", "sunset", f)).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// Immutability — all methods must return new objects
// ---------------------------------------------------------------------------

describe("FilterService immutability", () => {
  it("toggleVisibility does not mutate the input", () => {
    const original = empty();
    const snapshot = new Set(original.visibility);
    FilterService.toggleVisibility(original, "public");
    expect(original.visibility).toEqual(snapshot);
  });

  it("toggleReleaseStatus does not mutate the input", () => {
    const original = empty();
    const snapshot = new Set(original.releaseStatus);
    FilterService.toggleReleaseStatus(original, "active");
    expect(original.releaseStatus).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: reset → toggle all off → empty equivalent
// ---------------------------------------------------------------------------

describe("FilterService round-trip", () => {
  it("toggling every visibility off from reset produces an empty visibility set", () => {
    let f = full();
    for (const v of ALL_VISIBILITY) {
      f = FilterService.toggleVisibility(f, v);
    }
    expect(f.visibility.size).toBe(0);
  });

  it("toggling every releaseStatus off from reset produces an empty releaseStatus set", () => {
    let f = full();
    for (const s of ALL_RELEASE_STATUS) {
      f = FilterService.toggleReleaseStatus(f, s);
    }
    expect(f.releaseStatus.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Mutual exclusion: toggling all members of a group one by one
// ---------------------------------------------------------------------------
describe("FilterService mutual exclusion — only one member of a group active at a time", () => {
  it("only the last-toggled visibility exclusive value remains active", () => {
    // public and private are in the same exclusive group
    let f = empty();
    f = FilterService.toggleVisibility(f, "public");
    f = FilterService.toggleVisibility(f, "private");
    expect(f.visibility.has("public")).toBe(false);
    expect(f.visibility.has("private")).toBe(true);
  });

  it("only the last-toggled releaseStatus exclusive value remains active", () => {
    let f = empty();
    f = FilterService.toggleReleaseStatus(f, "active");
    f = FilterService.toggleReleaseStatus(f, "sunset");
    expect(f.releaseStatus.has("active")).toBe(false);
    expect(f.releaseStatus.has("sunset")).toBe(true);
  });
});
