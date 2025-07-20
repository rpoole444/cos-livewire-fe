export const isActivePro = (user: import("../types").UserType): boolean => {
  const expires = user?.pro_cancelled_at ? new Date(user.pro_cancelled_at) : null;
  return !!user?.is_pro && (!expires || expires > new Date());
};
