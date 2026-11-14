import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

function getValue(row, column) {
  return column.sortValue ? column.sortValue(row) : row[column.key];
}

function compare(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
}

/**
 * Config-driven table with client-side sorting, loading skeletons and an
 * empty state. `columns` items accept:
 *   { key, label, align, width, render(row), sortValue(row), sortable, defaultOrder }
 */
export default function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyAction,
  initialSort = {},
  minWidth = 720,
}) {
  const [orderBy, setOrderBy] = useState(initialSort.orderBy ?? null);
  const [order, setOrder] = useState(initialSort.order ?? 'asc');

  const sortedRows = useMemo(() => {
    const list = rows ?? [];
    if (!orderBy) return list;
    const column = columns.find((item) => item.key === orderBy);
    if (!column) return list;

    return [...list].sort((a, b) =>
      order === 'asc'
        ? compare(getValue(a, column), getValue(b, column))
        : compare(getValue(b, column), getValue(a, column)),
    );
  }, [rows, columns, orderBy, order]);

  const handleSort = (column) => {
    if (column.sortable === false) return;
    if (orderBy === column.key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(column.key);
      setOrder(column.defaultOrder ?? 'asc');
    }
  };

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}
    >
      <Table sx={{ minWidth }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align ?? 'left'}
                sx={{ width: column.width, whiteSpace: 'nowrap' }}
              >
                {column.sortable === false || !column.label ? (
                  column.label
                ) : (
                  <TableSortLabel
                    active={orderBy === column.key}
                    direction={orderBy === column.key ? order : 'asc'}
                    onClick={() => handleSort(column)}
                  >
                    {column.label}
                  </TableSortLabel>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading &&
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton variant="text" width={column.key === 'actions' ? 64 : '80%'} />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading &&
            sortedRows.map((row) => (
              <TableRow key={getRowId(row)} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align ?? 'left'}>
                    {column.render ? column.render(row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading && sortedRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ borderBottom: 0, py: 7 }}>
                <Stack alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(17, 24, 39, 0.04)',
                      mb: 0.5,
                    }}
                  >
                    <InboxRoundedIcon sx={{ color: 'text.disabled' }} />
                  </Box>
                  <Typography fontWeight={600}>{emptyTitle}</Typography>
                  {emptyMessage && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={420}>
                      {emptyMessage}
                    </Typography>
                  )}
                  {emptyAction && <Box sx={{ pt: 1 }}>{emptyAction}</Box>}
                </Stack>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
