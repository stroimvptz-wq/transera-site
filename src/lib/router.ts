import { useCallback, useEffect, useState } from 'react';

export const ROUTES = [
  'dashboard',
  'calculators',
  'trips',
  'vehicles',
  'drivers',
  'clients',
  'finance',
  'documents',
  'organization',
  'settings',
  'organization-new',
] as const;

export type Route = (typeof ROUTES)[number];

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0];
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : 'dashboard';
}

export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = next === 'dashboard' ? '/' : `/${next}`;
  }, []);

  return [route, navigate];
}
