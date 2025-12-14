import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'customer' | 'pro' | 'admin';

interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
}

interface RoleState {
  roles: UserRole[];
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<RoleState>({
    roles: [],
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setState({ roles: [], profile: null, loading: false, error: null });
    }
  }, [user]);

  const fetchUserData = async () => {
    console.log('Fetching profile for user:', user?.id);
    
    try {
      // Fetch roles and profile in parallel
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user?.id),
        supabase.from('profiles').select('id, name, phone').eq('id', user?.id).maybeSingle()
      ]);

      // Handle role fetch errors - don't default to customer
      if (rolesResult.error) {
        console.error('Profile fetch failed:', rolesResult.error);
        setState({
          roles: [],
          profile: null,
          loading: false,
          error: `Role fetch failed: ${rolesResult.error.message}`,
        });
        return;
      }

      // Handle profile fetch errors
      if (profileResult.error) {
        console.error('Profile fetch failed:', profileResult.error);
        setState({
          roles: [],
          profile: null,
          loading: false,
          error: `Profile fetch failed: ${profileResult.error.message}`,
        });
        return;
      }

      const userRoles = (rolesResult.data?.map(r => r.role) || []) as UserRole[];
      
      // If no roles found, check if this is a new user that needs a role assigned
      if (userRoles.length === 0) {
        console.log('No roles found for user, defaulting to customer');
        // For new users without roles, default to customer
        userRoles.push('customer');
      }

      console.log('Profile fetched:', userRoles[0]);
      
      setState({
        roles: userRoles,
        profile: profileResult.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Profile fetch failed:', error);
      setState({
        roles: [],
        profile: null,
        loading: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const roles = state.roles || [];
  const primaryRole = roles.length > 0 ? roles[0] : null;

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (allowedRoles: UserRole[]): boolean => {
    return roles.some(r => allowedRoles.includes(r));
  };

  return {
    roles,
    role: primaryRole,
    profile: state.profile,
    loading: state.loading || authLoading,
    error: state.error,
    hasRole,
    hasAnyRole,
    isCustomer: roles.includes('customer') || roles.length === 0,
    isPro: roles.includes('pro'),
    isAdmin: roles.includes('admin'),
  };
}