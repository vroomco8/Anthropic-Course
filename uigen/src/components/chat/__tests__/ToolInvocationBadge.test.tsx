import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- Label logic (pure function) ---

test("getToolLabel: str_replace_editor create returns 'Creating <filename>'", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "App.jsx" })).toBe("Creating App.jsx");
});

test("getToolLabel: str_replace_editor str_replace returns 'Editing <filename>'", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "Button.tsx" })).toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor insert returns 'Editing <filename>'", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "Form.tsx" })).toBe("Editing Form.tsx");
});

test("getToolLabel: str_replace_editor view returns 'Reading <filename>'", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "utils.ts" })).toBe("Reading utils.ts");
});

test("getToolLabel: str_replace_editor undo_edit returns 'Reverting <filename>'", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "App.jsx" })).toBe("Reverting App.jsx");
});

test("getToolLabel: str_replace_editor extracts filename from nested path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/components/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolLabel: str_replace_editor with missing path falls back to 'file'", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: file_manager rename returns 'Renaming <filename>'", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "OldName.tsx" })).toBe("Renaming OldName.tsx");
});

test("getToolLabel: file_manager delete returns 'Deleting <filename>'", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "App.tsx" })).toBe("Deleting App.tsx");
});

test("getToolLabel: unknown tool name falls back to raw tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "do_thing" })).toBe("some_other_tool");
});

// --- Component rendering ---

test("shows label text in the badge", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows spinner when state is 'call'", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByTestId("spinner")).toBeDefined();
  expect(screen.queryByTestId("status-dot")).toBeNull();
});

test("shows spinner when state is 'partial-call'", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="partial-call"
    />
  );
  expect(screen.getByTestId("spinner")).toBeDefined();
  expect(screen.queryByTestId("status-dot")).toBeNull();
});

test("shows green dot when state is 'result'", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="result"
    />
  );
  expect(screen.getByTestId("status-dot")).toBeDefined();
  expect(screen.queryByTestId("spinner")).toBeNull();
});

test("green dot has emerald color class", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="result"
    />
  );
  const dot = screen.getByTestId("status-dot");
  expect(dot.className).toContain("bg-emerald-500");
});

test("shows 'Editing Button.tsx' for str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Deleting App.tsx' for file_manager delete", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "delete", path: "App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting App.tsx")).toBeDefined();
});

test("shows raw tool name for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolName="some_other_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});
