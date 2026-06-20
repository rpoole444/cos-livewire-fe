import { Event, CustomEvent } from "@/interfaces/interfaces";
import { UserType } from "@/types";

type EventOwner = Pick<Event | CustomEvent, "user_id" | "can_edit_event" | "claimed_artist">;

export const canManageEvent = (
  user: Pick<UserType, "id" | "is_admin"> | null | undefined,
  event: EventOwner | null | undefined,
) => Boolean(
  user &&
  event &&
  (
    user.is_admin ||
    user.id === event.user_id ||
    event.can_edit_event ||
    event.claimed_artist?.user_id === user.id
  )
);

export const canDeleteEvent = (
  user: Pick<UserType, "id" | "is_admin"> | null | undefined,
  event: Pick<Event | CustomEvent, "user_id" | "can_delete_event"> | null | undefined,
) => Boolean(user && event && (event.can_delete_event || user.is_admin || user.id === event.user_id));
