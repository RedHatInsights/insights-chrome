import React from 'react';
import { render } from '@testing-library/react';

import UserIcon from '../UserIcon';
import ChromeAuthContext from '../../../auth/ChromeAuthContext';

describe('UserIcon', () => {
  const mockUser = {
    identity: {
      user: {
        username: 'testuser',
      },
    },
  };

  const contextValue = {
    user: mockUser,
  };

  test('should render user icon', () => {
    const { container } = render(
      <ChromeAuthContext.Provider value={contextValue}>
        <UserIcon />
      </ChromeAuthContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
