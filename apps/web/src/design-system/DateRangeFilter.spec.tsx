/**
 * Rendering-/Interaktions-Test für `DateRangeFilter` (AC4/AC5).
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { DateRangeFilter } from './DateRangeFilter';

describe('DateRangeFilter', () => {
  it('zeigt den übergebenen Zeitraum als Standardwert an (AC4)', () => {
    render(
      <DateRangeFilter value={{ from: '2026-08-01', to: '2026-08-31' }} onChange={jest.fn()} />,
    );

    expect(screen.getByLabelText('Von')).toHaveValue('2026-08-01');
    expect(screen.getByLabelText('Bis')).toHaveValue('2026-08-31');
  });

  it('ruft onChange mit dem aktualisierten "von"-Datum auf, ohne "bis" zu verändern (AC5)', () => {
    const onChange = jest.fn();
    render(<DateRangeFilter value={{ from: '2026-08-01', to: '2026-08-31' }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Von'), { target: { value: '2026-08-05' } });

    expect(onChange).toHaveBeenCalledWith({ from: '2026-08-05', to: '2026-08-31' });
  });

  it('ruft onChange mit dem aktualisierten "bis"-Datum auf, ohne "von" zu verändern (AC5)', () => {
    const onChange = jest.fn();
    render(<DateRangeFilter value={{ from: '2026-08-01', to: '2026-08-31' }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Bis'), { target: { value: '2026-08-20' } });

    expect(onChange).toHaveBeenCalledWith({ from: '2026-08-01', to: '2026-08-20' });
  });

  it('unterstützt eigene Labels', () => {
    render(
      <DateRangeFilter
        value={{ from: '2026-08-01', to: '2026-08-31' }}
        onChange={jest.fn()}
        fromLabel="Zeitraum von"
        toLabel="Zeitraum bis"
      />,
    );

    expect(screen.getByLabelText('Zeitraum von')).toBeInTheDocument();
    expect(screen.getByLabelText('Zeitraum bis')).toBeInTheDocument();
  });
});
