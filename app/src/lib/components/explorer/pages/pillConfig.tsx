import type { ReactNode } from "react";
import {
  Building2,
  Lock,
  CheckCircle2,
  FlaskConical,
  Code2,
  AlertTriangle,
  Sunset as SunsetIcon,
} from "lucide-react";

export const VISIBILITY_PILL: Record<
  string,
  { icon: ReactNode; pill: string }
> = {
  public: {
    icon: null,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  },
  internal: {
    icon: <Building2 className="h-3 w-3" />,
    pill: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400",
  },
  private: {
    icon: <Lock className="h-3 w-3" />,
    pill: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400",
  },
};

export const RELEASE_STATUS_PILL: Record<
  string,
  { pill: string; label: string; icon: ReactNode }
> = {
  active: {
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
    label: "Active",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  beta: {
    pill: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
    label: "Beta",
    icon: <FlaskConical className="h-3 w-3" />,
  },
  development: {
    pill: "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400",
    label: "Dev",
    icon: <Code2 className="h-3 w-3" />,
  },
  deprecated: {
    pill: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
    label: "Deprecated",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  sunset: {
    pill: "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
    label: "Sunset",
    icon: <SunsetIcon className="h-3 w-3" />,
  },
};
