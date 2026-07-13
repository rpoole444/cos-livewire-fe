import { Event, CustomEvent } from "@/interfaces/interfaces";
import { UserType } from "@/types";

type EventOwner = Pick<Event | CustomEvent, "user_id" | "can_edit_event" | "claimed_artist" | "venue_profile_user_id">;

export const canManageEvent = (
  user: Pick<UserType, "id" | "is_admin"> | null | undefined,
  event: EventOwner | null | undefined,
) => Boolean(
  user &&
  event &&
  (
    user.is_admin ||
    user.id === event.user_id ||
    user.id === event.venue_profile_user_id ||
    event.can_edit_event ||
    event.claimed_artist?.user_id === user.id
  )
);

export const canDeleteEvent = (
  user: Pick<UserType, "id" | "is_admin"> | null | undefined,
  event: EventOwner & Pick<Event | CustomEvent, "can_delete_event"> | null | undefined,
) => canManageEvent(user, event) || Boolean(user && event?.can_delete_event);
