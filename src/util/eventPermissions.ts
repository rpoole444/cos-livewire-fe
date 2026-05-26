import { Event, CustomEvent } from "@/interfaces/interfaces";
import { UserType } from "@/types";

type EventOwner = Pick<Event | CustomEvent, "user_id">;

export const canManageEvent = (
  user: Pick<UserType, "id" | "is_admin"> | null | undefined,
  event: EventOwner | null | undefined,
) => Boolean(user && event && (user.is_admin || user.id === event.user_id));
