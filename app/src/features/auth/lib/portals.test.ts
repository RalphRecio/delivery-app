import { resolveAreaAccess } from './portals';

const rider = { token: 't', role: 'rider' as const };
const customer = { token: 't', role: 'customer' as const };

describe('resolveAreaAccess', () => {
  it('sends signed-out people to the area’s own sign-in page', () => {
    expect(resolveAreaAccess('rider', '/rider', null)).toEqual({
      kind: 'redirect',
      href: '/rider/login',
    });
    expect(resolveAreaAccess('admin', '/admin/users', null)).toEqual({
      kind: 'redirect',
      href: '/admin/login',
    });
    expect(resolveAreaAccess('customer', '/customer', null)).toEqual({
      kind: 'redirect',
      href: '/login',
    });
  });

  it('shows the sign-in and register pages to anyone not signed in as that role', () => {
    expect(resolveAreaAccess('rider', '/rider/login', null)).toEqual({ kind: 'auth-page' });
    expect(resolveAreaAccess('rider', '/rider/register', customer)).toEqual({ kind: 'auth-page' });
  });

  it('skips the sign-in page for someone already signed in as that role', () => {
    expect(resolveAreaAccess('rider', '/rider/login', rider)).toEqual({
      kind: 'redirect',
      href: '/rider',
    });
  });

  it('sends another role to its own home', () => {
    expect(resolveAreaAccess('admin', '/admin', rider)).toEqual({
      kind: 'redirect',
      href: '/rider',
    });
    expect(resolveAreaAccess('rider', '/rider/jobs/3', customer)).toEqual({
      kind: 'redirect',
      href: '/customer',
    });
  });

  it('lets the role in', () => {
    expect(resolveAreaAccess('rider', '/rider/jobs/3', rider)).toEqual({ kind: 'allow' });
  });

  it('has no register page for admins', () => {
    expect(resolveAreaAccess('admin', '/admin/register', null)).toEqual({
      kind: 'redirect',
      href: '/admin/login',
    });
  });
});
