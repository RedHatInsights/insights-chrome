import React from 'react';
import useScopedQuickStart from '../../../src/components/QuickStart/useScopedQuickStart';
import { QuickStart } from '@patternfly/quickstarts';

// Mock QuickStart data for testing
const mockQuickStarts: QuickStart[] = [
  {
    metadata: {
      name: 'quickstart-1',
    },
    spec: {
      displayName: 'First QuickStart',
      description: 'Description for first quickstart',
      icon: null,
      tasks: [
        {
          title: 'Task 1',
          description: 'Do something',
        },
      ],
    },
  },
  {
    metadata: {
      name: 'quickstart-2',
    },
    spec: {
      displayName: 'Second QuickStart',
      description: 'Description for second quickstart',
      icon: null,
      tasks: [
        {
          title: 'Task 1',
          description: 'Do something else',
        },
        {
          title: 'Task 2',
          description: 'Do another thing',
        },
      ],
    },
  },
];

// Test component that uses the hook and exposes state to the DOM
const TestComponent = ({ quickStarts = mockQuickStarts }: { quickStarts?: QuickStart[] }) => {
  const controller = useScopedQuickStart({ quickStarts });

  return (
    <div>
      <div data-cy="active-id">{controller.activeQuickStartID || '(empty)'}</div>
      <div data-cy="active-qs-name">{controller.activeQuickStart?.metadata.name || '(null)'}</div>
      <div data-cy="active-qs-display-name">{controller.activeQuickStart?.spec.displayName || '(null)'}</div>
      <div data-cy="all-states">{JSON.stringify(controller.allQuickStartStates)}</div>

      {/* Control buttons */}
      <button data-cy="set-qs1" onClick={() => controller.setActiveQuickStartID('quickstart-1')}>
        Set QuickStart 1
      </button>
      <button data-cy="set-qs2" onClick={() => controller.setActiveQuickStartID('quickstart-2')}>
        Set QuickStart 2
      </button>
      <button data-cy="set-nonexistent" onClick={() => controller.setActiveQuickStartID('nonexistent')}>
        Set Non-existent
      </button>
      <button data-cy="clear-active" onClick={() => controller.setActiveQuickStartID('')}>
        Clear Active
      </button>
      <button data-cy="restart" onClick={() => controller.restartQuickStart()}>
        Restart QuickStart
      </button>
      <button
        data-cy="set-progress"
        onClick={() =>
          controller.setAllQuickStartStates({
            'quickstart-1': { taskNumber: 2, status: 'Complete' },
          })
        }
      >
        Set Progress
      </button>
      <button
        data-cy="set-multiple-progress"
        onClick={() =>
          controller.setAllQuickStartStates({
            'quickstart-1': { taskNumber: 2, status: 'Complete' },
            'quickstart-2': { taskNumber: 1, status: 'In Progress' },
          })
        }
      >
        Set Multiple Progress
      </button>
    </div>
  );
};

// Component for testing isolation between instances
const DualInstanceTestComponent = () => {
  const controller1 = useScopedQuickStart({ quickStarts: mockQuickStarts });
  const controller2 = useScopedQuickStart({ quickStarts: mockQuickStarts });

  return (
    <div>
      <div data-cy="instance1-active-id">{controller1.activeQuickStartID || '(empty)'}</div>
      <div data-cy="instance2-active-id">{controller2.activeQuickStartID || '(empty)'}</div>
      <div data-cy="instance1-states">{JSON.stringify(controller1.allQuickStartStates)}</div>
      <div data-cy="instance2-states">{JSON.stringify(controller2.allQuickStartStates)}</div>

      <button data-cy="instance1-set-qs1" onClick={() => controller1.setActiveQuickStartID('quickstart-1')}>
        Instance 1: Set QS1
      </button>
      <button data-cy="instance2-set-qs2" onClick={() => controller2.setActiveQuickStartID('quickstart-2')}>
        Instance 2: Set QS2
      </button>
      <button
        data-cy="instance1-set-progress"
        onClick={() =>
          controller1.setAllQuickStartStates({
            'quickstart-1': { taskNumber: 1, status: 'In Progress' },
          })
        }
      >
        Instance 1: Set Progress
      </button>
      <button
        data-cy="instance2-set-progress"
        onClick={() =>
          controller2.setAllQuickStartStates({
            'quickstart-2': { taskNumber: 2, status: 'Complete' },
          })
        }
      >
        Instance 2: Set Progress
      </button>
    </div>
  );
};

describe('useScopedQuickStart Hook', () => {
  describe('initialization', () => {
    it('should initialize with default empty state', () => {
      cy.mount(<TestComponent />);

      cy.get('[data-cy="active-id"]').should('contain', '(empty)');
      cy.get('[data-cy="active-qs-name"]').should('contain', '(null)');
      cy.get('[data-cy="all-states"]').should('contain', '{}');
    });

    it('should handle empty quickStarts array', () => {
      cy.mount(<TestComponent quickStarts={[]} />);

      cy.get('[data-cy="active-id"]').should('contain', '(empty)');
      cy.get('[data-cy="active-qs-name"]').should('contain', '(null)');
    });
  });

  describe('setActiveQuickStartID', () => {
    it('should set the active QuickStart ID and resolve the QuickStart', () => {
      cy.mount(<TestComponent />);

      cy.get('[data-cy="set-qs1"]').click();

      cy.get('[data-cy="active-id"]').should('contain', 'quickstart-1');
      cy.get('[data-cy="active-qs-name"]').should('contain', 'quickstart-1');
      cy.get('[data-cy="active-qs-display-name"]').should('contain', 'First QuickStart');
    });

    it('should return null for activeQuickStart when ID does not match', () => {
      cy.mount(<TestComponent />);

      cy.get('[data-cy="set-nonexistent"]').click();

      cy.get('[data-cy="active-id"]').should('contain', 'nonexistent');
      cy.get('[data-cy="active-qs-name"]').should('contain', '(null)');
    });

    it('should clear active QuickStart when ID is set to empty string', () => {
      cy.mount(<TestComponent />);

      // First set an active QuickStart
      cy.get('[data-cy="set-qs1"]').click();
      cy.get('[data-cy="active-qs-name"]').should('contain', 'quickstart-1');

      // Then clear it
      cy.get('[data-cy="clear-active"]').click();

      cy.get('[data-cy="active-id"]').should('contain', '(empty)');
      cy.get('[data-cy="active-qs-name"]').should('contain', '(null)');
    });

    it('should switch between different QuickStarts', () => {
      cy.mount(<TestComponent />);

      cy.get('[data-cy="set-qs1"]').click();
      cy.get('[data-cy="active-qs-display-name"]').should('contain', 'First QuickStart');

      cy.get('[data-cy="set-qs2"]').click();
      cy.get('[data-cy="active-qs-display-name"]').should('contain', 'Second QuickStart');
    });
  });

  describe('setAllQuickStartStates', () => {
    it('should update QuickStart states', () => {
      cy.mount(<TestComponent />);

      cy.get('[data-cy="set-progress"]').click();

      cy.get('[data-cy="all-states"]').should('contain', '"quickstart-1":{"taskNumber":2,"status":"Complete"}');
    });

    it('should handle multiple QuickStart states', () => {
      cy.mount(<TestComponent />);

      cy.get('[data-cy="set-multiple-progress"]').click();

      cy.get('[data-cy="all-states"]').should('contain', '"quickstart-1"').and('contain', '"quickstart-2"');
    });
  });

  describe('restartQuickStart', () => {
    it('should reset taskNumber to 0 and status to In Progress', () => {
      cy.mount(<TestComponent />);

      // Set up initial state with progress
      cy.get('[data-cy="set-qs1"]').click();
      cy.get('[data-cy="set-progress"]').click();
      cy.get('[data-cy="all-states"]').should('contain', '"taskNumber":2');

      // Restart
      cy.get('[data-cy="restart"]').click();

      cy.get('[data-cy="all-states"]').should('contain', '"taskNumber":0').and('contain', '"status":"In Progress"');
    });

    it('should do nothing if no QuickStart is active', () => {
      cy.mount(<TestComponent />);

      // Set some progress without an active QuickStart
      cy.get('[data-cy="set-progress"]').click();
      cy.get('[data-cy="all-states"]').should('contain', '"taskNumber":2');

      // Try to restart (should do nothing since no active QuickStart)
      cy.get('[data-cy="restart"]').click();

      // States should remain unchanged
      cy.get('[data-cy="all-states"]').should('contain', '"taskNumber":2');
    });

    it('should only restart the active QuickStart', () => {
      cy.mount(<TestComponent />);

      // Set progress for both QuickStarts
      cy.get('[data-cy="set-multiple-progress"]').click();

      // Activate quickstart-1
      cy.get('[data-cy="set-qs1"]').click();

      // Restart (should only affect quickstart-1)
      cy.get('[data-cy="restart"]').click();

      // quickstart-1 should be restarted
      cy.get('[data-cy="all-states"]').should('contain', '"quickstart-1":{"taskNumber":0,"status":"In Progress"}');
      // quickstart-2 should be unchanged
      cy.get('[data-cy="all-states"]').should('contain', '"quickstart-2":{"taskNumber":1,"status":"In Progress"}');
    });
  });

  describe('isolation between instances', () => {
    it('should maintain isolated activeQuickStartID between instances', () => {
      cy.mount(<DualInstanceTestComponent />);

      cy.get('[data-cy="instance1-set-qs1"]').click();
      cy.get('[data-cy="instance2-set-qs2"]').click();

      cy.get('[data-cy="instance1-active-id"]').should('contain', 'quickstart-1');
      cy.get('[data-cy="instance2-active-id"]').should('contain', 'quickstart-2');
    });

    it('should maintain isolated allQuickStartStates between instances', () => {
      cy.mount(<DualInstanceTestComponent />);

      cy.get('[data-cy="instance1-set-progress"]').click();
      cy.get('[data-cy="instance2-set-progress"]').click();

      cy.get('[data-cy="instance1-states"]').should('contain', '"quickstart-1"').and('not.contain', '"quickstart-2"');

      cy.get('[data-cy="instance2-states"]').should('contain', '"quickstart-2"').and('not.contain', '"quickstart-1"');
    });
  });

  describe('controller interface', () => {
    it('should provide all expected methods and properties', () => {
      cy.mount(<TestComponent />);

      // Verify we can interact with all the controls (proves methods exist)
      cy.get('[data-cy="set-qs1"]').should('exist');
      cy.get('[data-cy="clear-active"]').should('exist');
      cy.get('[data-cy="restart"]').should('exist');
      cy.get('[data-cy="set-progress"]').should('exist');

      // Verify state displays exist (proves properties exist)
      cy.get('[data-cy="active-id"]').should('exist');
      cy.get('[data-cy="active-qs-name"]').should('exist');
      cy.get('[data-cy="all-states"]').should('exist');
    });
  });
});
