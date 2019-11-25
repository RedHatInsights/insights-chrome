/* eslint-disable quotes */
import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import ToolbarToggle from '../ToolbarToggle';

describe('ToolbarToggle', () => {

    it('should render correctly', () =>{
        const mockOnClick = jest.fn();
        const mockOnToggle = jest.fn();
        const toolbarToggleProps = {
            dropdownItems: [
                {
                    url: 'url1',
                    title: 'title1',
                    onClick: mockOnClick
                }, {
                    title: 'title2',
                    onClick: mockOnClick
                }
            ],
            isOpen: true
        };
        const wrapper = shallow(<ToolbarToggle { ...toolbarToggleProps }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
        //wrapper.find("[aria-label='Settings']").getElements();
    });

});
