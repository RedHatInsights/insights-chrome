import { computeDrawerToggle } from './computeDrawerToggle';
import { ScalprumComponentProps } from '@scalprum/react-core';

describe('computeDrawerToggle', () => {
  const notifications: ScalprumComponentProps = { scope: 'notifications', module: './DrawerPanel' };
  const helpPanel: ScalprumComponentProps = { scope: 'learningResources', module: './HelpPanel' };

  it('should open when drawer is closed', () => {
    const result = computeDrawerToggle(undefined, false, notifications);
    expect(result.futureOpened).toBe(true);
    expect(result.nextContent).toEqual(notifications);
  });

  it('should close when toggled with same content while open', () => {
    const result = computeDrawerToggle(notifications, true, notifications);
    expect(result.futureOpened).toBe(false);
    expect(result.nextContent).toBeUndefined();
  });

  it('should switch content when different scope requested while open', () => {
    const result = computeDrawerToggle(notifications, true, helpPanel);
    expect(result.futureOpened).toBe(true);
    expect(result.nextContent).toEqual(helpPanel);
  });

  it('should switch content when different module requested (same scope)', () => {
    const moduleA: ScalprumComponentProps = { scope: 'notifications', module: './DrawerPanel' };
    const moduleB: ScalprumComponentProps = { scope: 'notifications', module: './OtherPanel' };

    const result = computeDrawerToggle(moduleA, true, moduleB);
    expect(result.futureOpened).toBe(true);
    expect(result.nextContent).toEqual(moduleB);
  });

  it('should open when closed with stale content', () => {
    const result = computeDrawerToggle(notifications, false, notifications);
    expect(result.futureOpened).toBe(true);
    expect(result.nextContent).toEqual(notifications);
  });
});
