export const isActivePro = (user: import("../types").UserType): boolean => {
  if (!user || !user.is_pro) return false;

  const graceEndsAt = user.pro_cancelled_at ? new Date(user.pro_cancelled_at).getTime() : null;
  return graceEndsAt === null || graceEndsAt > Date.now();
};
