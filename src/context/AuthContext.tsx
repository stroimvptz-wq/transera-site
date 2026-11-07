import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getErrorMessage, type Membership, type Profile } from '@/lib/domain';
import { fetchProfile } from '@/services/profiles';
import { fetchMemberships } from '@/services/organizations';
import { signOut as signOutAccount } from '@/services/auth';

const ACTIVE_ORGANIZATION_KEY = 'transera.activeOrganizationId';

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  isLoading: boolean;
  loadError: string | null;
  isRecovery: boolean;
  setActiveOrganization: (organizationId: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  finishRecovery: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_ORGANIZATION_KEY),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);

  const loadAccount = useCallback(async (userId: string) => {
    try {
      const [nextProfile, nextMemberships] = await Promise.all([
        fetchProfile(userId),
        fetchMemberships(userId),
      ]);
      if (!nextProfile) throw new Error('Профиль не найден.');
      setProfile(nextProfile);
      setMemberships(nextMemberships);
      setLoadError(null);
    } catch (error) {
      setProfile(null);
      setMemberships([]);
      setLoadError(getErrorMessage(error, 'Не удалось загрузить данные аккаунта.'));
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      (async () => {
        setSession(nextSession);
        if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
        if (nextSession) {
          await loadAccount(nextSession.user.id);
        } else {
          setProfile(null);
          setMemberships([]);
          setLoadError(null);
          setIsRecovery(false);
        }
        setIsLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [loadAccount]);

  const userId = session?.user.id ?? null;

  const refresh = useCallback(async () => {
    if (userId) await loadAccount(userId);
  }, [userId, loadAccount]);

  const setActiveOrganization = useCallback((organizationId: string) => {
    localStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
    setActiveOrganizationId(organizationId);
  }, []);

  const signOut = useCallback(async () => {
    await signOutAccount();
  }, []);

  const finishRecovery = useCallback(() => setIsRecovery(false), []);

  const activeMembership = useMemo(
    () =>
      memberships.find((m) => m.organization.id === activeOrganizationId) ?? memberships[0] ?? null,
    [memberships, activeOrganizationId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      memberships,
      activeMembership,
      isLoading,
      loadError,
      isRecovery,
      setActiveOrganization,
      refresh,
      signOut,
      finishRecovery,
    }),
    [
      session,
      profile,
      memberships,
      activeMembership,
      isLoading,
      loadError,
      isRecovery,
      setActiveOrganization,
      refresh,
      signOut,
      finishRecovery,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
