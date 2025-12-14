import { useState } from "react";

export function useUnreadMessages() {
  const [unreadCount] = useState(0);

  // Stub - requires chat_messages and service_requests tables
  return unreadCount;
}