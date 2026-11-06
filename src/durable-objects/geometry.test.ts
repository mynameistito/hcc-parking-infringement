import { describe, expect, it } from "vitest";

import { normalizeLocationGeometry, parseGeometryJson } from "./geometry";

describe("road geometry parsing", () => {
  it("accepts coordinate pairs in lines of at least three points", () => {
    const geometry = [
      [
        [175.2, -37.8],
        [175.3, -37.9],
        [175.4, -38],
      ],
    ];

    expect(parseGeometryJson(JSON.stringify(geometry))).toStrictEqual(geometry);
    expect(normalizeLocationGeometry(geometry)).toStrictEqual(geometry);
  });

  it("rejects malformed JSON, short lines, and nonnumeric coordinates", () => {
    expect(parseGeometryJson("{")).toStrictEqual([]);
    expect(parseGeometryJson("[[[1,2],[3,4]]]")).toStrictEqual([]);
    expect(parseGeometryJson('[[[1,2],[3,4],["5",6]]]')).toStrictEqual([]);
  });
});
