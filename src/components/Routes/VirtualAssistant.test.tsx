/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react/display-name */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { useHydrateAtoms } from 'jotai/utils';
import * as unleashReact from '@unleash/proxy-client-react';
import VirtualAssistant from './VirtualAssistant';
import { virtualAssistantOpenAtom, virtualAssistantShowAssistantAtom, virtualAssistantStartInputAtom } from '../../state/atoms/virtualAssistantAtom';

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

describe('VirtualAssistant showAssistant prop passing', () => {
  const useFlag = unleashReact.useFlag as jest.MockedFunction<typeof unleashReact.useFlag>;
  const useFlags = unleashReact.useFlags as jest.MockedFunction<typeof unleashReact.useFlags>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockScalprumComponent.mockClear();
    // Default mock implementations
    useFlag.mockReturnValue(false);
    useFlags.mockReturnValue([]);
  });

  describe('component rendering', () => {
    it('should always render the component container', () => {
      const atomValues = [
        [virtualAssistantOpenAtom, false],
        [virtualAssistantShowAssistantAtom, false],
        [virtualAssistantStartInputAtom, undefined],
      ];

      const { container } = render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // Component should always render, never return null
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByTestId('scalprum-component-virtualAssistant-AstroVirtualAssistant')).toBeInTheDocument();
    });
  });

  describe('showAssistant prop passing when isOpenConfig is true', () => {
    it('should pass showAssistant=false to ScalprumComponent', () => {
      useFlag.mockImplementation((flagName: string) => {
        if (flagName === 'platform.virtual-assistant.is-open-config') return true;
        return false;
      });

      const atomValues = [
        [virtualAssistantOpenAtom, false],
        [virtualAssistantShowAssistantAtom, false], // This should be passed as showAssistant prop
        [virtualAssistantStartInputAtom, undefined],
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
      useFlag.mockImplementation((flagName: string) => {
        if (flagName === 'platform.virtual-assistant.is-open-config') return true;
        return false;
      });

      const atomValues = [
        [virtualAssistantOpenAtom, false],
        [virtualAssistantShowAssistantAtom, true], // This should be passed as showAssistant prop
        [virtualAssistantStartInputAtom, undefined],
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

    it('should pass all atom values correctly as props', () => {
      useFlag.mockImplementation((flagName: string) => {
        if (flagName === 'platform.virtual-assistant.is-open-config') return true;
        return false;
      });

      const atomValues = [
        [virtualAssistantOpenAtom, true],
        [virtualAssistantShowAssistantAtom, true],
        [virtualAssistantStartInputAtom, 'test input message'],
      ];

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // Check that all props are passed correctly
      expect(mockScalprumComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          showAssistant: true,
          isOpen: true,
          startInput: 'test input message',
          scope: 'virtualAssistant',
          module: './AstroVirtualAssistant',
          setOpen: expect.any(Function),
          setStartInput: expect.any(Function),
        })
      );
    });
  });

  describe('routes mode when isOpenConfig is false', () => {
    it('should render routes without showAssistant prop', () => {
      useFlag.mockImplementation((flagName: string) => {
        if (flagName === 'platform.virtual-assistant.is-open-config') return false;
        return false;
      });

      const atomValues = [
        [virtualAssistantOpenAtom, true],
        [virtualAssistantShowAssistantAtom, true],
        [virtualAssistantStartInputAtom, 'test'],
      ];

      render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // In routes mode, ScalprumComponent should be called with basic props only (no showAssistant)
      expect(mockScalprumComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'virtualAssistant',
          module: './AstroVirtualAssistant',
          fallback: null,
        })
      );

      // Should not include showAssistant prop in routes mode
      expect(mockScalprumComponent).toHaveBeenCalledWith(
        expect.not.objectContaining({
          showAssistant: expect.anything(),
        })
      );
    });

    it('should always render component in routes mode', () => {
      useFlag.mockImplementation((flagName: string) => {
        if (flagName === 'platform.virtual-assistant.is-open-config') return false;
        return false;
      });

      const atomValues = [
        [virtualAssistantOpenAtom, false],
        [virtualAssistantShowAssistantAtom, false], // Even when false, should still render
        [virtualAssistantStartInputAtom, undefined],
      ];

      const { container } = render(
        // @ts-ignore
        <TestWrapper initialValues={atomValues}>
          <VirtualAssistant />
        </TestWrapper>
      );

      // Component should always render in routes mode
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByTestId('scalprum-component-virtualAssistant-AstroVirtualAssistant')).toBeInTheDocument();
    });
  });
});
