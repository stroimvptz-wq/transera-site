import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Membership, Profile } from '@/lib/domain';

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
