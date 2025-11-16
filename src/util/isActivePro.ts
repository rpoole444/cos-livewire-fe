export const isActivePro = (user: import("../types").UserType): boolean => {
  if (!user) return false;
  return !!user.pro_active;
};
