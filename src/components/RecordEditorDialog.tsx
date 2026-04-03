import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type RecordEditorDialogProps = {
  open: boolean;
  title: string;
  description: string;
  value: string;
  submitLabel: string;
  submitting?: boolean;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

const RecordEditorDialog = ({
  open,
  title,
  description,
  value,
  submitLabel,
  submitting = false,
  onChange,
  onOpenChange,
  onSubmit,
}: RecordEditorDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[360px] w-full rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-6 text-foreground outline-none"
        spellCheck={false}
      />
      <DialogFooter>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-70"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default RecordEditorDialog;
