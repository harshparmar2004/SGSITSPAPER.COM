import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button, Input, Select } from "../components/ui";
import {
  Loader2,
  UserPlus,
  Trash2,
  Shield,
  Search,
  FileText,
  Activity,
  Edit2,
  Download,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAcademicConfig } from "../hooks/useAcademicConfig";
import { PYQ } from "../types";
import { format } from "date-fns";

interface AdminData {
  id: string; // UID
  email: string;
  name?: string;
  role: "superadmin" | "department";
  departments: string[];
}

export default function AdminStaff() {
  const { adminRole } = useAuth();
  const { programs } = useAcademicConfig();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"superadmin" | "department">(
    "department",
  );
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [editModal, setEditModal] = useState<AdminData | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"superadmin" | "department">(
    "department",
  );
  const [editDepartments, setEditDepartments] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const toggleEditDept = (dept: string) => {
    setEditDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const handleOpenEdit = (admin: AdminData) => {
    setEditModal(admin);
    setEditName(admin.name || "");
    setEditRole(admin.role);
    setEditDepartments(admin.departments || []);
    setError("");
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSavingEdit(true);
    setError("");

    try {
      await setDoc(doc(db, "admins", editModal.id), {
        email: editModal.email, // preserve existing email
        name: editName.trim(),
        role: editRole,
        departments: editRole === "department" ? editDepartments : [],
      });

      setEditModal(null);
      fetchAdmins();
    } catch (err: any) {
      console.error(err);
      setError("Failed to update staff. " + err.message);
    }
    setSavingEdit(false);
  };

  const allDepartments = Array.from(
    new Set(programs.flatMap((p) => p.departments)),
  );

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "admins"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as AdminData,
      );
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
    setLoading(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    setError("");

    try {
      // 1. Look up user by email in the "users" collection to get their UID
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", newEmail.trim().toLowerCase()),
      );
      const snap = await getDocs(q);

      const adminId = snap.empty ? newEmail.trim().toLowerCase() : snap.docs[0].id;

      // 2. Add to admins collection
      await setDoc(doc(db, "admins", adminId), {
        email: newEmail.trim().toLowerCase(),
        name: newName.trim(),
        role: newRole,
        departments: newRole === "department" ? selectedDepartments : [],
      });

      setNewEmail("");
      setNewName("");
      setSelectedDepartments([]);
      fetchAdmins();
    } catch (err: any) {
      console.error(err);
      setError("Failed to add staff. " + err.message);
    }
    setAdding(false);
  };

  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const handleDeleteStaff = async () => {
    if (!deleteModal) return;
    try {
      await deleteDoc(doc(db, "admins", deleteModal));
      setAdmins((prev) => prev.filter((a) => a.id !== deleteModal));
    } catch (err: any) {
      setError("Failed to remove: " + err.message);
    }
    setDeleteModal(null);
  };

  const toggleDept = (dept: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const exportStaffCsv = () => {
    if (admins.length === 0) return;

    const headers = [
      "S.No.",
      "ID",
      "Name",
      "Email",
      "Role",
      "Assigned Departments",
    ];
    const rows = admins.map((admin, index) => {
      const assigned =
        admin.role === "superadmin"
          ? "All Access"
          : admin.departments?.join("; ") || "";
      return [
        index + 1,
        `"${admin.id}"`,
        `"${admin.name || ""}"`,
        `"${admin.email}"`,
        `"${admin.role}"`,
        `"${assigned}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Staff_List_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (adminRole !== "superadmin") return null;

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-8">
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-3 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this staff member?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteStaff}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Manage Staff
          </h1>
          <p className="mt-2 text-[11px] text-gray-500">
            Assign users to Department Panels or make them Super Admins.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportStaffCsv}
          disabled={loading || admins.length === 0}
          className="w-full sm:w-auto text-xs whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2" /> Export to CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          Add New Staff Member
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleAddStaff} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-900">
                User Email Address *
              </label>
              <Input
                type="email"
                placeholder="staff@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-900">
                Staff Name (Optional)
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-900">
                Role *
              </label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
              >
                <option value="department">Department Admin</option>
                <option value="superadmin">Super Admin</option>
              </Select>
            </div>
          </div>

          {newRole === "department" && (
            <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="text-xs font-medium text-gray-900">
                Assign Departments *
              </label>
              <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                {programs.map((prog) => (
                  <div
                    key={prog.course}
                    className="bg-white p-3 border border-gray-100 rounded-md"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-100 pb-2">
                      {prog.course} Programs
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                      {prog.departments.map((dept) => (
                        <label
                          key={`${prog.course}-${dept}`}
                          className="flex items-start gap-2 text-xs cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(
                              `${prog.course}::${dept}`,
                            )}
                            onChange={() =>
                              toggleDept(`${prog.course}::${dept}`)
                            }
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-0.5"
                          />
                          <span className="leading-tight text-gray-700">
                            {dept}
                          </span>
                        </label>
                      ))}
                      {prog.departments.length === 0 && (
                        <span className="text-gray-400 text-xs italic">
                          No departments
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {programs.length === 0 && (
                  <span className="text-gray-400 text-xs py-2 block">
                    No programs available. Create programs/departments first.
                  </span>
                )}
              </div>
              {selectedDepartments.length === 0 && (
                <p className="text-xs text-amber-600">
                  Please select at least one department.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={
                adding ||
                !newEmail ||
                (newRole === "department" && selectedDepartments.length === 0)
              }
            >
              {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Role
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            Current Staff Members
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50/30">
            No staff members assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">S.No.</th>
                  <th className="px-3 py-2">Name & Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Assigned Departments</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin, index) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-center text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      {admin.name && (
                        <div className="font-medium text-gray-900">
                          {admin.name}
                        </div>
                      )}
                      <div
                        className={`text-gray-600 ${admin.name ? "text-xs mt-0.5" : "font-medium text-gray-900"}`}
                      >
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${admin.role === "superadmin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {admin.role === "superadmin"
                          ? "Super Admin"
                          : "Department Admin"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {admin.role === "superadmin" ? (
                        <span className="text-gray-400 italic">All Access</span>
                      ) : (
                        <div className="flex gap-1 flex-wrap max-w-md">
                          {admin.departments?.map((d) => {
                            const displayLabel = d.includes("::")
                              ? d.split("::").join(" - ")
                              : d;
                            return (
                              <span
                                key={d}
                                className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs truncate max-w-[120px]"
                                title={displayLabel}
                              >
                                {displayLabel}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(admin)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit Staff"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {admin.email !== "harshparma007@gmail.com" && (
                          <button
                            onClick={() => setDeleteModal(admin.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove Staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-3 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Edit Staff Member
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-900">
                    User Email
                  </label>
                  <Input type="email" value={editModal.email} disabled />
                  <p className="text-[11px] text-gray-500">
                    Email cannot be changed.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-900">
                    Staff Name
                  </label>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-900">
                    Role *
                  </label>
                  <Select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                  >
                    <option value="department">Department Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </Select>
                </div>
              </div>

              {editRole === "department" && (
                <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="text-xs font-medium text-gray-900">
                    Assign Departments *
                  </label>
                  <div className="max-h-56 overflow-y-auto space-y-3 pr-2">
                    {programs.map((prog) => (
                      <div
                        key={prog.course}
                        className="bg-white p-3 border border-gray-100 rounded-md"
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-100 pb-2">
                          {prog.course} Programs
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                          {prog.departments.map((dept) => (
                            <label
                              key={`${prog.course}-${dept}`}
                              className="flex items-start gap-2 text-xs cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={editDepartments.includes(
                                  `${prog.course}::${dept}`,
                                )}
                                onChange={() =>
                                  toggleEditDept(`${prog.course}::${dept}`)
                                }
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-0.5"
                              />
                              <span className="leading-tight text-gray-700">
                                {dept}
                              </span>
                            </label>
                          ))}
                          {prog.departments.length === 0 && (
                            <span className="text-gray-400 text-xs italic">
                              No departments
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {programs.length === 0 && (
                      <span className="text-gray-400 text-xs py-2 block">
                        No programs available.
                      </span>
                    )}
                  </div>
                  {editDepartments.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Please select at least one department.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setEditModal(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={
                    savingEdit ||
                    (editRole === "department" && editDepartments.length === 0)
                  }
                >
                  {savingEdit && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
