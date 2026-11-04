import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

const rows = [
  { id: 1, name: 'Amina Yusuf', average: 85 },
  { id: 2, name: 'Marcus Reed', average: 45 },
  { id: 3, name: 'Diego Morales', average: 72 },
];
const columns = [
  { id: 'name', header: 'Name', cell: (r) => r.name, sortValue: (r) => r.name },
  { id: 'average', header: 'Average', cell: (r) => `${r.average}%`, sortValue: (r) => r.average },
];

const bodyNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);

describe('DataTable', () => {
  it('filters rows with the search box', async () => {
    render(<DataTable caption="Students" columns={columns} rows={rows} searchText={(r) => r.name} />);
    await userEvent.type(screen.getByLabelText('Search Students'), 'reed');
    expect(await screen.findByText('Marcus Reed')).toBeInTheDocument();
    expect(screen.queryByText('Amina Yusuf')).not.toBeInTheDocument();
  });

  it('sorts by a column and exposes the order through aria-sort', async () => {
    render(<DataTable caption="Students" columns={columns} rows={rows} />);
    const header = screen.getByRole('columnheader', { name: /Average/ });
    expect(header).toHaveAttribute('aria-sort', 'none');

    await userEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyNames()).toEqual(['Marcus Reed', 'Diego Morales', 'Amina Yusuf']);

    await userEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(bodyNames()).toEqual(['Amina Yusuf', 'Diego Morales', 'Marcus Reed']);
  });

  it('shows an empty state instead of an empty table', () => {
    render(<DataTable caption="Students" columns={columns} rows={[]} emptyState={<p>No students yet</p>} />);
    expect(screen.getByText('No students yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
