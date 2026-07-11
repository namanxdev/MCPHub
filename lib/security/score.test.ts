// lib/security/score.test.ts
import { describe, it, expect } from "vitest";
import { scoreAndGrade } from "./score.js";
import type { Finding } from "./types.js";

const f = (severity: Finding["severity"], status: Finding["status"]): Finding => ({
  id: "x", title: "t", category: "c", severity, status, detail: "d",
});

describe("scoreAndGrade", () => {
  it("starts at 100 / grade A with no failures", () => {
    expect(scoreAndGrade([f("critical", "pass"), f("high", "advisory")])).toEqual({ score: 100, grade: "A" });
  });
  it("subtracts weighted penalties only for fails", () => {
    // one critical fail (-40) + one high fail (-20) = 40 -> grade D
    expect(scoreAndGrade([f("critical", "fail"), f("high", "fail")])).toEqual({ score: 40, grade: "D" });
  });
  it("ignores advisory/error/info statuses", () => {
    expect(scoreAndGrade([f("critical", "advisory"), f("critical", "error")])).toEqual({ score: 100, grade: "A" });
  });
  it("floors at 0 and grades F", () => {
    expect(scoreAndGrade([f("critical", "fail"), f("critical", "fail"), f("critical", "fail")]))
      .toEqual({ score: 0, grade: "F" });
  });
  it("grade boundaries", () => {
    expect(scoreAndGrade([f("low", "fail")]).grade).toBe("A");     // 96
    expect(scoreAndGrade([f("medium", "fail")]).grade).toBe("A");  // 90
    expect(scoreAndGrade([f("high", "fail")]).grade).toBe("B");    // 80
    expect(scoreAndGrade([f("high", "fail"), f("low", "fail")]).score).toBe(76); // B
  });
});
