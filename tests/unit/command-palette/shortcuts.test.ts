import { describe, expect, it } from "vitest";
import { getShortcutAction, isEditableTarget } from "../../../src/features/command-palette";

function editableTarget(tagName: string, parentElement: any = null) {
  return {
    tagName,
    isContentEditable: false,
    getAttribute: () => null,
    parentElement,
  };
}

describe("shortcut guards", () => {
  it("treats inputs, textareas, selects, and textboxes as editable", () => {
    expect(isEditableTarget(editableTarget("INPUT"))).toBe(true);
    expect(isEditableTarget(editableTarget("TEXTAREA"))).toBe(true);
    expect(isEditableTarget(editableTarget("SELECT"))).toBe(true);
    expect(
      isEditableTarget({
        tagName: "DIV",
        isContentEditable: false,
        getAttribute: (name: string) => (name === "role" ? "textbox" : null),
        parentElement: null,
      } as EventTarget),
    ).toBe(true);
  });

  it("walks up parent elements to find editable ancestors", () => {
    const parent = editableTarget("TEXTAREA");
    const child = editableTarget("SPAN", parent);
    expect(isEditableTarget(child as EventTarget)).toBe(true);
  });

  it("suppresses shortcuts while typing in editable fields", () => {
    expect(
      getShortcutAction({
        key: "k",
        ctrlKey: true,
        target: editableTarget("INPUT") as EventTarget,
      }),
    ).toBeNull();
    expect(
      getShortcutAction({
        key: "?",
        shiftKey: true,
        target: editableTarget("TEXTAREA") as EventTarget,
      }),
    ).toBeNull();
  });

  it("maps supported global shortcuts outside editable fields", () => {
    expect(getShortcutAction({ key: "k", ctrlKey: true, target: null })).toBe("open-palette");
    expect(getShortcutAction({ key: "n", metaKey: true, target: null })).toBe("compose");
    expect(getShortcutAction({ key: "?", shiftKey: true, target: null })).toBe("open-shortcuts");
    expect(getShortcutAction({ key: ",", target: null })).toBe("open-settings");
  });

  it("handles uppercase keys and case-insensitivity correctly", () => {
    expect(getShortcutAction({ key: "K", ctrlKey: true, target: null })).toBe("open-palette");
    expect(getShortcutAction({ key: "N", metaKey: true, target: null })).toBe("compose");
    expect(getShortcutAction({ key: "E", target: null })).toBe("archive-thread");
  });

  it("returns null when altKey is pressed", () => {
    expect(getShortcutAction({ key: "k", ctrlKey: true, altKey: true, target: null })).toBeNull();
    expect(getShortcutAction({ key: "e", altKey: true, target: null })).toBeNull();
  });

  it("returns null for unsupported keys", () => {
    expect(getShortcutAction({ key: "x", target: null })).toBeNull();
    expect(getShortcutAction({ key: "Enter", target: null })).toBeNull();
  });

  it("maps single key shortcuts correctly", () => {
    expect(getShortcutAction({ key: "e", target: null })).toBe("archive-thread");
    expect(getShortcutAction({ key: "z", target: null })).toBe("snooze-thread");
    expect(getShortcutAction({ key: "a", target: null })).toBe("approve-sender");
    expect(getShortcutAction({ key: "b", target: null })).toBe("block-sender");
    expect(getShortcutAction({ key: "c", target: null })).toBe("open-calendar");
    expect(getShortcutAction({ key: "i", target: null })).toBe("open-proof-inspector");
  });

  it("treats explicitly contentEditable divs as editable", () => {
    expect(
      isEditableTarget({
        tagName: "DIV",
        isContentEditable: true,
        getAttribute: () => null,
        parentElement: null,
      } as any),
    ).toBe(true);
  });

  it("treats non-editable divs as non-editable", () => {
    expect(
      isEditableTarget({
        tagName: "DIV",
        isContentEditable: false,
        getAttribute: () => null,
        parentElement: null,
      } as any),
    ).toBe(false);
  });
});
