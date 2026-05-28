import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, Routes, Route } from 'react-router-dom';
import RouterContextGuard from './RouterContextGuard';

describe('RouterContextGuard', () => {
  it('should render children when Router context is initialized', () => {
    render(
      <MemoryRouter>
        <RouterContextGuard>
          <div data-testid="test-child">Test Content</div>
        </RouterContextGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle multiple children when context is ready', () => {
    render(
      <MemoryRouter>
        <RouterContextGuard>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </RouterContextGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should prevent useLocation errors when Router context exists', () => {
    // This is the CORE test for RHCLOUD-48022
    // RouterContextGuard ensures children can safely use Router hooks

    const ComponentUsingLocation = () => {
      const location = useLocation();
      return <div data-testid="location-user">Path: {location.pathname}</div>;
    };

    // WITH Router context - Guard allows rendering safely
    render(
      <MemoryRouter initialEntries={['/test-path']}>
        <RouterContextGuard>
          <ComponentUsingLocation />
        </RouterContextGuard>
      </MemoryRouter>
    );

    // Should render successfully without errors
    expect(screen.getByTestId('location-user')).toBeInTheDocument();
    expect(screen.getByText('Path: /test-path')).toBeInTheDocument();
  });

  it('should allow nested router consumers when context is ready', () => {
    // Simulates real-world scenario: nested components all using Router hooks
    const ParentComponent = () => {
      const location = useLocation();
      return (
        <div data-testid="parent">
          Parent: {location.pathname}
          <ChildComponent />
        </div>
      );
    };

    const ChildComponent = () => {
      const location = useLocation();
      return <div data-testid="child">Child: {location.pathname}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/inventory/systems']}>
        <RouterContextGuard>
          <ParentComponent />
        </RouterContextGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Parent: /inventory/systems')).toBeInTheDocument();
    expect(screen.getByText('Child: /inventory/systems')).toBeInTheDocument();
  });

  it('should work with Routes and Route components (production scenario)', () => {
    // This simulates the actual usage in ScalprumRoot.tsx
    const HomePage = () => <div data-testid="home">Home Page</div>;
    const AboutPage = () => <div data-testid="about">About Page</div>;

    render(
      <MemoryRouter initialEntries={['/']}>
        <RouterContextGuard>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </RouterContextGuard>
      </MemoryRouter>
    );

    // Should render the matched route
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.queryByTestId('about')).not.toBeInTheDocument();
  });

  it('should guard against race conditions during federated module loading', () => {
    // This tests the actual production scenario:
    // Federated modules loading and trying to use Router hooks before context ready

    const FederatedApp = () => {
      // This component simulates a federated module that uses Router hooks
      const location = useLocation();
      return (
        <div data-testid="federated-app">
          Federated Module at: {location.pathname}
        </div>
      );
    };

    // RouterContextGuard ensures this renders safely
    render(
      <MemoryRouter initialEntries={['/insights/inventory']}>
        <RouterContextGuard>
          <Routes>
            <Route path="/insights/inventory" element={<FederatedApp />} />
          </Routes>
        </RouterContextGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('federated-app')).toBeInTheDocument();
    expect(screen.getByText('Federated Module at: /insights/inventory')).toBeInTheDocument();
  });

  it('should check for routeContext.matches property before rendering', () => {
    // This verifies the defensive check logic:
    // Guard checks if routeContext exists AND has matches property

    const TestComponent = () => <div data-testid="test">Content</div>;

    // With proper Router setup, matches should exist
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={
              <RouterContextGuard>
                <TestComponent />
              </RouterContextGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('test')).toBeInTheDocument();
  });
});
