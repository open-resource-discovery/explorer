import type { ReactNode } from "react";
import type { ResourceTypeGroup } from "./explorerTypes";
import {
  BookOpen,
  Zap,
  Database,
  Layers,
  Cpu,
  Bot,
  GitMerge,
} from "lucide-react";

export interface ResourceTypeConfig {
  type: ResourceTypeGroup;
  /** Plural display label, e.g. "API Resources" */
  label: string;
  /** Singular display label, e.g. "API Resource" */
  singular: string;
  icon: ReactNode;
  /** Tailwind classes for the card icon background */
  bg: string;
  /** Tailwind classes for the card icon foreground */
  fg: string;
}

export const RESOURCE_TYPE_CONFIG: ResourceTypeConfig[] = [
  {
    type: "apiResources",
    label: "API Resources",
    singular: "API Resource",
    icon: <BookOpen className="h-4 w-4" />,
    bg: "bg-sky-100 dark:bg-sky-900",
    fg: "text-sky-600 dark:text-sky-400",
  },
  {
    type: "eventResources",
    label: "Event Resources",
    singular: "Event Resource",
    icon: <Zap className="h-4 w-4" />,
    bg: "bg-violet-100 dark:bg-violet-900",
    fg: "text-violet-600 dark:text-violet-400",
  },
  {
    type: "entityTypes",
    label: "Entity Types",
    singular: "Entity Type",
    icon: <Database className="h-4 w-4" />,
    bg: "bg-teal-100 dark:bg-teal-900",
    fg: "text-teal-600 dark:text-teal-400",
  },
  {
    type: "dataProducts",
    label: "Data Products",
    singular: "Data Product",
    icon: <Layers className="h-4 w-4" />,
    bg: "bg-indigo-100 dark:bg-indigo-900",
    fg: "text-indigo-600 dark:text-indigo-400",
  },
  {
    type: "capabilities",
    label: "Capabilities",
    singular: "Capability",
    icon: <Cpu className="h-4 w-4" />,
    bg: "bg-rose-100 dark:bg-rose-900",
    fg: "text-rose-600 dark:text-rose-400",
  },
  {
    type: "agents",
    label: "Agents",
    singular: "Agent",
    icon: <Bot className="h-4 w-4" />,
    bg: "bg-amber-100 dark:bg-amber-900",
    fg: "text-amber-600 dark:text-amber-400",
  },
  {
    type: "integrationDependencies",
    label: "Integration Dependencies",
    singular: "Integration",
    icon: <GitMerge className="h-4 w-4" />,
    bg: "bg-emerald-100 dark:bg-emerald-900",
    fg: "text-emerald-600 dark:text-emerald-400",
  },
];
