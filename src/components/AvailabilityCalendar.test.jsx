import { render, screen } from '@testing-library/react';
import React from 'react';
import AvailabilityCalendar from './AvailabilityCalendar.jsx';

describe('AvailabilityCalendar', () => {
  it('renders weekday headers', () => {
    render(
      <AvailabilityCalendar
        ranges={[]}
        timezone={'UTC'}
        onAddRange={() => {
          return undefined;
        }}
        onDeleteRange={() => {
          return undefined;
        }}
      />
    );
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument();
    });
  });
});
