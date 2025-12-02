import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'customer' | 'pro' | 'admin' | 'supplier';

interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
}

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      if (!profileData) {
        console.warn('No profile found for user:', user?.id);
        setLoading(false);
        return;
      }

      // Combine profile with role from user_roles table
      setProfile({
        ...profileData,
        role: roleData?.role || 'customer'
      });
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return profile ? roles.includes(profile.role) : false;
  };

  return {
    profile,
    role: profile?.role || null,
    loading: loading || authLoading,
    hasRole,
    hasAnyRole,
    isCustomer: hasRole('customer'),
    isPro: hasRole('pro'),
    isAdmin: hasRole('admin')
  };
}