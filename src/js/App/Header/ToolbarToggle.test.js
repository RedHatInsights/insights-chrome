import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import ToolbarToggle from './ToolbarToggle';

describe('ToolbarToggle', () => {

    it('should render correctly', () =>{
        const mockOnClick = jest.fn();
        const toolbarToggleProps = {
            dropdownItems: [
                'some-url',
                'some-title',
                mockOnClick
            ]
        };
        const wrapper = shallow(<ToolbarToggle { ...toolbarToggleProps }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
