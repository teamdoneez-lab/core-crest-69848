import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isOwnMessage: boolean;
  senderName: string;
}

export const ChatMessage = ({ message, timestamp, isOwnMessage, senderName }: ChatMessageProps) => {
  return (
    <div className={cn("flex flex-col gap-1", isOwnMessage ? "items-end" : "items-start")}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {isOwnMessage ? "You" : senderName}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(timestamp), "p")}
        </span>
      </div>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[70%]",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};