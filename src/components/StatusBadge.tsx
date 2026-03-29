import { cn } from "@/lib/utils";

type StatusType = "Active" | "Acquired" | "Shutdown" | "IPO" | "Dormant" | "Pivoting" | "Exited" | "Written Off" | string;

const statusColors: Record<string, string> = {
  Active: "bg-success/15 text-success border-success/30",
  Acquired: "bg-primary/15 text-primary border-primary/30",
  Shutdown: "bg-destructive/15 text-destructive border-destructive/30",
  IPO: "bg-info/15 text-info border-info/30",
  Dormant: "bg-warning/15 text-warning border-warning/30",
  Pivoting: "bg-warning/15 text-warning border-warning/30",
  Exited: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
  "Written Off": "bg-destructive/15 text-destructive border-destructive/30",
};

const StatusBadge = ({ status }: { status: StatusType }) => (
  <span
    className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      statusColors[status] || "bg-muted text-muted-foreground border-border"
    )}
  >
    {status}
  </span>
);

export default StatusBadge;
