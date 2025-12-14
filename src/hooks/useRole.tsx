import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'customer' | 'pro' | 'admin';

interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
}

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setRoles([]);
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch roles and profile in parallel
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user?.id),
        supabase.from('profiles').select('id, name, phone').eq('id', user?.id).maybeSingle()
      ]);

      if (rolesResult.error) {
        console.error('Error fetching roles:', rolesResult.error);
      }
      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
      }

      const userRoles = (rolesResult.data?.map(r => r.role) || []) as UserRole[];
      setRoles(userRoles.length > 0 ? userRoles : ['customer']);
      setProfile(profileResult.data);
    } catch (error) {
      console.error('Unexpected error fetching user data:', error);
      setRoles(['customer']);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (allowedRoles: UserRole[]): boolean => {
    return roles.some(role => allowedRoles.includes(role));
  };

  const primaryRole = roles[0] || 'customer';

  return {
    roles,
    role: primaryRole,
    profile,
    loading: loading || authLoading,
    hasRole,
    hasAnyRole,
    isCustomer: hasRole('customer') || roles.length === 0,
    isPro: hasRole('pro'),
    isAdmin: hasRole('admin'),
  };
}