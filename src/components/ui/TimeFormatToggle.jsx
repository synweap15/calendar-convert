import React from 'react';
import Button from './Button.jsx';

export default function TimeFormatToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5">
      <Button
        variant={value === '24' ? 'default' : 'ghost'}
        className="rounded-md"
        onClick={() => {
          onChange('24');
        }}
      >
        24h
      </Button>
      <Button
        variant={value === '12' ? 'default' : 'ghost'}
        className="rounded-md"
        onClick={() => {
          onChange('12');
        }}
      >
        12h
      </Button>
    </div>
  );
}
