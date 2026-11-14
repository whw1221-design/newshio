import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { usersApi } from '../api/users.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import UserFormDialog from '../components/users/UserFormDialog.jsx';
import { useFeedback } from '../context/FeedbackContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useFetch } from '../hooks/useFetch.js';
import { avatarColor, initials } from '../utils/format.js';

export default function UsersPage() {
  const { notify } = useFeedback();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [form, setForm] = useState({ open: false, user: null });
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: users, loading, error, reload } = useFetch(
    () => usersApi.list({ search: debouncedSearch }),
    [debouncedSearch],
  );

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await usersApi.remove(target.uid);
      notify('User deleted.');
      setTarget(null);
      reload();
    } catch (deleteError) {
      notify(deleteError.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'uname',
      label: 'User',
      sortValue: (row) => row.uname,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 700,
              bgcolor: avatarColor(row.uid),
            }}
          >
            {initials(row.uname)}
          </Avatar>
          <Box>
            <Typography fontWeight={600}>{row.uname}</Typography>
            <Typography variant="caption" color="text.secondary">
              ID #{row.uid}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortValue: (row) => row.email,
      render: (row) => <Typography color="text.secondary">{row.email}</Typography>,
    },
    {
      key: 'order_count',
      label: 'Orders',
      align: 'center',
      width: 120,
      defaultOrder: 'desc',
      render: (row) =>
        row.order_count > 0 ? (
          <Chip label={row.order_count} size="small" color="primary" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.disabled">
            None
          </Typography>
        ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 110,
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit user">
            <IconButton
              size="small"
              aria-label={`Edit ${row.uname}`}
              onClick={() => setForm({ open: true, user: row })}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete user">
            <IconButton
              size="small"
              color="error"
              aria-label={`Delete ${row.uname}`}
              onClick={() => setTarget(row)}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Customer accounts. Passwords are hashed and never returned by the API."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setForm({ open: true, user: null })}
          >
            New user
          </Button>
        }
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email…"
        />
        {!loading && !error && (
          <Typography variant="body2" color="text.secondary">
            {users?.length ?? 0} user{users?.length === 1 ? '' : 's'}
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={users ?? []}
        getRowId={(row) => row.uid}
        loading={loading}
        initialSort={{ orderBy: 'uname', order: 'asc' }}
        emptyTitle={debouncedSearch ? 'No matching users' : 'No users yet'}
        emptyMessage={
          debouncedSearch
            ? `Nothing matched “${debouncedSearch}”. Try a different search term.`
            : 'Create your first user account so they can place orders.'
        }
        emptyAction={
          !debouncedSearch && (
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() => setForm({ open: true, user: null })}
            >
              Add user
            </Button>
          )
        }
      />

      <UserFormDialog
        open={form.open}
        user={form.user}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete user?"
        description={
          target
            ? target.order_count > 0
              ? `“${target.uname}” will be permanently removed, and ${target.order_count} related order${
                  target.order_count === 1 ? '' : 's'
                } will be deleted automatically by the database cascade.`
              : `“${target.uname}” will be permanently removed.`
            : ''
        }
        confirmLabel="Delete user"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
