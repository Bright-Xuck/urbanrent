"use client";

// ============================================================
// ADMIN — USER MANAGEMENT (/admin/users)
// ============================================================
// GET /api/admin/users, paginated and filterable by role / account state.
// Suspend and reinstate are two-step buttons (this codebase's confirm
// convention — see PropertyAdminActions), and every failure lands in an
// Alert — never a silent no-op.
//
// The backend is the real gate: these routes are ADMIN-only, an admin
// cannot suspend themselves, and suspending a landlord unpublishes their
// listings in the same transaction.
//
// RequireAuth is the wall: UsersManager only mounts for an admin, so its
// load effect only ever runs with a valid admin session behind it. `me`
// from the store is used purely for display — the "(you)" badge and hiding
// the self-suspend button that could only fail.
// ============================================================

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getUsers, reinstateUser, suspendUser } from "../../../../api/admin";
import type { AccountState, AdminUser, Role } from "../../../../api/types";
import { useAuthStore } from "../../../../Store/useUserStore";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import Alert from "../../../../components/ui/Alert";
import Button from "../../../../components/ui/Button";
import { Select } from "../../../../components/ui/Fields";
import Pagination from "../../../../components/ui/Pagination";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../../components/ui/States";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={["ADMIN"]} title="User management">
      <UsersManager />
    </RequireAuth>
  );
}

function UsersManager() {
  const me = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped after an action to refetch — keeps the row honest with any
  // active filter (e.g. it stops matching "SUSPENDED only" after a reinstate).
  const [reloadKey, setReloadKey] = useState(0);

  // Filters — changing either jumps back to page 1.
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [stateFilter, setStateFilter] = useState<AccountState | "">("");

  // Row-level action state: which user is awaiting confirmation / busy.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const data = await getUsers(
          {
            ...(roleFilter ? { role: roleFilter } : {}),
            ...(stateFilter ? { accountState: stateFilter } : {}),
          },
          { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        );
        if (!active) return;
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load users");
        setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page, roleFilter, stateFilter, reloadKey]);

  function changeRoleFilter(value: Role | "") {
    setRoleFilter(value);
    setPage(1);
  }

  function changeStateFilter(value: AccountState | "") {
    setStateFilter(value);
    setPage(1);
  }

  async function runAction(user: AdminUser, action: "suspend" | "reinstate") {
    setBusyId(user.id);
    setActionError(null);

    try {
      const updated =
        action === "suspend"
          ? await suspendUser(user.id)
          : await reinstateUser(user.id);
      setUsers((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      setConfirmingId(null);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update this user",
      );
      setConfirmingId(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="User management"
        subtitle={
          total > 0
            ? `${total} account${total === 1 ? "" : "s"} on the platform`
            : "Every account on the platform."
        }
      />

      <div className="mt-6 flex flex-wrap gap-4">
        <Select
          label="Role"
          className="w-44"
          value={roleFilter}
          onChange={(event) =>
            changeRoleFilter(event.target.value as Role | "")
          }
        >
          <option value="">All roles</option>
          <option value="TENANT">Tenant</option>
          <option value="LANDLORD">Landlord</option>
          <option value="ADMIN">Admin</option>
        </Select>

        <Select
          label="Account state"
          className="w-44"
          value={stateFilter}
          onChange={(event) =>
            changeStateFilter(event.target.value as AccountState | "")
          }
        >
          <option value="">All states</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </div>

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {actionError && (
        <div className="mt-6">
          <Alert variant="error">{actionError}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading users…" />
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No users match"
            description="Try clearing the filters above."
          />
        </div>
      )}
      {!loading && !error && users.length > 0 && (
        <>
          <div className="panel mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-ink-soft">
                  <th className="py-3 pr-4 font-semibold">Email</th>
                  <th className="py-3 pr-4 font-semibold">Role</th>
                  <th className="py-3 pr-4 font-semibold">Account</th>
                  <th className="py-3 pr-4 font-semibold">Verification</th>
                  <th className="py-3 pr-4 font-semibold">Joined</th>
                  <th className="py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b align-top last:border-b-0">
                    <td className="py-3 pr-4">
                      {user.email}
                      {me?.id === user.id && (
                        <span className="text-ink-soft"> (you)</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={user.role} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={user.accountState} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={user.verificationState} />
                    </td>
                    <td className="py-3 pr-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {/* The Suspend / Reinstate cell for one row. The backend
                          refuses self-suspension anyway — don't show a button
                          that can only fail. */}
                      {me?.id === user.id ? (
                        <span className="text-xs text-ink-soft">—</span>
                      ) : confirmingId === user.id ? (
                        <span className="inline-flex flex-wrap items-center gap-2 text-sm">
                          <span>
                            {user.accountState === "ACTIVE"
                              ? "Suspend? Their published listings will be unpublished."
                              : "Reinstate this account?"}
                          </span>
                          <Button
                            variant={
                              user.accountState === "ACTIVE"
                                ? "danger-outline"
                                : "success"
                            }
                            className="btn-sm"
                            disabled={busyId === user.id}
                            onClick={() =>
                              runAction(
                                user,
                                user.accountState === "ACTIVE"
                                  ? "suspend"
                                  : "reinstate",
                              )
                            }
                          >
                            {busyId === user.id
                              ? "Working…"
                              : user.accountState === "ACTIVE"
                                ? "Yes, suspend"
                                : "Yes, reinstate"}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={busyId === user.id}
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancel
                          </Button>
                        </span>
                      ) : user.accountState === "ACTIVE" ? (
                        <Button
                          variant="danger-outline"
                          className="btn-sm"
                          onClick={() => setConfirmingId(user.id)}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          className="btn-sm"
                          onClick={() => setConfirmingId(user.id)}
                        >
                          Reinstate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => current - 1)}
              onNext={() => setPage((current) => current + 1)}
            />
          </div>
        </>
      )}
    </div>
  );
}