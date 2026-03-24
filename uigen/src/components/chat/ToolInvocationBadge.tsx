"use client";

import { Loader2 } from "lucide-react";

type ToolState = "call" | "partial-call" | "result";

interface StrReplaceEditorArgs {
  command?: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path?: string;
}

interface FileManagerArgs {
  command?: "rename" | "delete";
  path?: string;
  new_path?: string;
}

export interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: ToolState;
}

function getFilename(path?: string): string {
  if (!path) return "file";
  return path.split("/").pop() || path;
}

function getStrReplaceLabel(args: StrReplaceEditorArgs): string {
  const name = getFilename(args.path);
  switch (args.command) {
    case "create":
      return `Creating ${name}`;
    case "str_replace":
    case "insert":
      return `Editing ${name}`;
    case "view":
      return `Reading ${name}`;
    case "undo_edit":
      return `Reverting ${name}`;
    default:
      return `Processing ${name}`;
  }
}

function getFileManagerLabel(args: FileManagerArgs): string {
  const name = getFilename(args.path);
  switch (args.command) {
    case "rename":
      return `Renaming ${name}`;
    case "delete":
      return `Deleting ${name}`;
    default:
      return `Managing ${name}`;
  }
}

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    return getStrReplaceLabel(args as StrReplaceEditorArgs);
  }
  if (toolName === "file_manager") {
    return getFileManagerLabel(args as FileManagerArgs);
  }
  return toolName;
}

export function ToolInvocationBadge({ toolName, args, state }: ToolInvocationBadgeProps) {
  const label = getToolLabel(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" data-testid="status-dot" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" data-testid="spinner" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
