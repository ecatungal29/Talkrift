import { MessageSquare } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
      <div className="rounded-full bg-accent p-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">No conversation selected</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a chat from the sidebar or add contacts to start messaging.
        </p>
      </div>
    </div>
  );
}
