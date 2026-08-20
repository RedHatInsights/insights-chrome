/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react/display-name */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import * as unleashReact from '@unleash/proxy-client-react';
import VirtualAssistant from './VirtualAssistant';
import { virtualAssistantShowAssistantAtom } from '../../state/atoms/virtualAssistantAtom';

// Mock function to capture props passed to ScalprumComponent
const mockScalprumComponent = jest.fn();

// Mock Scalprum components since they won't work in unit tests
jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: (props: Record<string, unknown>) => {
    mockScalprumComponent(props);
    return <div data-testid="scalprum-component-virtualAssistant-AstroVirtualAssistant">Mock Virtual Assistant Component</div>;
  },
}));

// Mock unleash feature flags
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
  useFlags: jest.fn(() => []),
}));

// Mock SilentErrorBoundary to make testing easier
jest.mock('./SilentErrorBoundary', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);

const HydrateAtoms = ({ initialValues, children }: { initialValues: Parameters<typeof useHydrateAtoms>[0]; children: React.ReactNode }) => {
  useHydrateAtoms(initialValues);
  return children;
};
HydrateAtoms.displayName = 'HydrateAtoms';

const TestWrapper = ({
  initialValues,
  children,
  initialEntries = ['/insights/dashboard'],
}: {
  initialValues: Parameters<typeof useHydrateAtoms>[0];
  children: React.ReactNode;
  initialEntries?: string[];
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <JotaiProvider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('VirtualAssistant', () => {
  const useFlag = unleashReact.useFlag as jest.MockedFunction<typeof unleashReact.useFlag>;
  const useFlags = unleashReact.useFlags as jest.MockedFunction<typeof unleashReact.useFlags>;

  const mockFlagValues: Record<string, boolean> = {};
  const setFlagMock = (flags: Record<string, boolean>) => {
    Object.assign(mockFlagValues, flags);
    useFlag.mockImplementation((flag: string) => mockFlagValues[flag] ?? false);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockScalprumComponent.mockClear();
    Object.keys(mockFlagValues).forEach((k) => delete mockFlagValues[k]);
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });
    useFlags.mockReturnValue([]);
  });

  describe('feature flag gating', () => {
    it('should return null when platform.va.environment.enabled flag is disabled', () => {
      setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });
      const atomValues = [[virtualAssistantShowAssistantAtom, false]];

      const { container } = render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('scalprum-component-virtualAssistant-AstroVirtualAssistant')).not.toBeInTheDocument();
      expect(mockScalprumComponent).not.toHaveBeenCalled();
    });

    it('should render the VA component when platform.va.environment.enabled flag is enabled and help panel is disabled', () => {
      setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': false });
      const atomValues = [[virtualAssistantShowAssistantAtom, false]];

      const { container } = render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      expect(container.firstChild).not.toBeNull();
      expect(screen.getByTestId('scalprum-component-virtualAssistant-AstroVirtualAssistant')).toBeInTheDocument();
    });

    it('should return null when help panel is enabled even if VA flag is enabled', () => {
      setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': true });
      const atomValues = [[virtualAssistantShowAssistantAtom, false]];

      const { container } = render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('scalprum-component-virtualAssistant-AstroVirtualAssistant')).not.toBeInTheDocument();
      expect(mockScalprumComponent).not.toHaveBeenCalled();
    });

    it('should check the correct feature flag names', () => {
      setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': false });
      const atomValues = [[virtualAssistantShowAssistantAtom, false]];

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      expect(useFlag).toHaveBeenCalledWith('platform.va.environment.enabled');
      expect(useFlag).toHaveBeenCalledWith('platform.chrome.help-panel_chatbot');
    });
  });

  describe('useEffect gating', () => {
    it('should not set showAssistant atom when VA is disabled even on matching routes', () => {
      setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });
      const atomValues = [[virtualAssistantShowAssistantAtom, false]];

      // Observer component reads atom value for direct assertion
      let observedAtomValue: boolean | undefined;
      const AtomObserver = () => {
        const value = useAtomValue(virtualAssistantShowAssistantAtom);
        observedAtomValue = value;
        return null;
      };

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues} initialEntries={['/insights/dashboard']}>
          <VirtualAssistant />
          <AtomObserver />
        </TestWrapper>
      );

      // VA disabled → useEffect skips route matching → ScalprumComponent never renders
      expect(mockScalprumComponent).not.toHaveBeenCalled();
      // Atom state remains false — VA did not mutate it
      expect(observedAtomValue).toBe(false);
    });
  });

  describe('showAssistant prop passing', () => {
    beforeEach(() => {
      setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': false });
    });

    it('should pass showAssistant=false to ScalprumComponent', () => {
      const atomValues = [
        [virtualAssistantShowAssistantAtom, false], // This should be passed as showAssistant prop
      ];

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // Check that ScalprumComponent was called with showAssistant=false
      expect(mockScalprumComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          showAssistant: false,
          scope: 'virtualAssistant',
          module: './AstroVirtualAssistant',
        })
      );
    });

    it('should pass showAssistant=true to ScalprumComponent', () => {
      const atomValues = [
        [virtualAssistantShowAssistantAtom, true], // This should be passed as showAssistant prop
      ];

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // Check that ScalprumComponent was called with showAssistant=true
      expect(mockScalprumComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          showAssistant: true,
          scope: 'virtualAssistant',
          module: './AstroVirtualAssistant',
        })
      );
    });

    it('should pass className based on drawer state', () => {
      const atomValues = [[virtualAssistantShowAssistantAtom, true]];

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // Check that className is passed (will be 'astro-va-drawer-closed' by default)
      expect(mockScalprumComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          showAssistant: true,
          className: expect.stringMatching(/astro-va-drawer/),
          scope: 'virtualAssistant',
          module: './AstroVirtualAssistant',
        })
      );
    });
  });
});
