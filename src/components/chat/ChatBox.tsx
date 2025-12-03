import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ChatBoxProps {
  requestId: string;
  otherUserName: string;
}

export const ChatBox = ({ requestId, otherUserName }: ChatBoxProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat with {otherUserName}</CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Chat functionality requires additional database setup.
        </p>
        <p className="text-xs text-muted-foreground">
          The chat_messages table needs to be created.
        </p>
      </CardContent>
    </Card>
  );
};
