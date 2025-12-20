import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { UserType } from '@/types';

type AdminRouteGuardOptions = {
  loginRedirect?: string;
  denyRedirect?: string;
};

type AdminRouteGuardState = {
  isAuthorized: boolean;
  loading: boolean;
  user: UserType | null;
};

export const useAdminRouteGuard = (
  options: AdminRouteGuardOptions = {}
): AdminRouteGuardState => {
  const { loginRedirect, denyRedirect = '/' } = options;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const redirectTarget = useMemo(() => {
    return loginRedirect ?? router.asPath;
  }, [loginRedirect, router.asPath]);

  useEffect(() => {
    if (!router.isReady || loading) return;

    if (!user) {
      setIsAuthorized(false);
      const redirect = encodeURIComponent(redirectTarget);
      router.replace(`/LoginPage?redirect=${redirect}`);
      return;
    }

    if (!user.is_admin) {
      setIsAuthorized(false);
      router.replace(denyRedirect);
      return;
    }

    setIsAuthorized(true);
  }, [denyRedirect, loading, redirectTarget, router, user]);

  return { isAuthorized, loading, user };
};
