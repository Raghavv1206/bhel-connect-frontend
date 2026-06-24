import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { adminApi } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { toast } from 'react-hot-toast';
import {
  Users, Upload, Search, RefreshCw, Download, UserCheck, UserX,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle,
  FileText,
} from 'lucide-react';

// ─── CSV Import Result Modal ─────────────────────────────────────────────────

const ImportResultModal = ({ result, onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
      <h3 className="text-lg font-bold text-[#003366] mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        CSV Import Complete
      </h3>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-green-700">{result.created}</p>
          <p className="text-xs text-green-600 font-semibold mt-0.5">Created</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <UserCheck className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-blue-700">{result.updated}</p>
          <p className="text-xs text-blue-600 font-semibold mt-0.5">Updated</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-red-700">{result.skipped_errors}</p>
          <p className="text-xs text-red-600 font-semibold mt-0.5">Skipped</p>
        </div>
      </div>

      {/* Errors list */}
      {result.errors?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            Row Errors ({result.errors.length})
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-3 space-y-1.5">
            {result.errors.map((err, i) => (
              <div key={i} className="text-xs text-red-700">
                <span className="font-bold">Row {err.row}</span>
                {err.employee_id && <span className="text-red-500"> ({err.employee_id})</span>}
                <span className="text-red-600">: {err.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-[#003366] hover:bg-blue-900 text-white rounded-xl text-sm font-semibold cursor-pointer"
      >
        Close
      </button>
    </div>
  </div>
);

// ─── CSV Template Download Helper ────────────────────────────────────────────

const downloadCsvTemplate = () => {
  const headers = 'employee_id,name,email,mobile,department,password\n';
  const sample = 'EMP001,John Doe,john.doe@bhel.in,9876543210,Finance,BhelPass@123\n';
  const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'employee_import_template.csv';
  link.click();
  URL.revokeObjectURL(url);
};

// ─── Main UserManagement Component ──────────────────────────────────────────

const PAGE_SIZE = 20;

const UserManagement = () => {
  const fileInputRef = useRef(null);

  // Employee list state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // CSV import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ── Fetch employees (paginated + search) ──────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const response = await axiosInstance.get('/api/users/employees/', { params });
      // Support both paginated DRF responses and plain arrays
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
        setTotal(response.data.length);
      } else {
        setEmployees(response.data.results || []);
        setTotal(response.data.count || 0);
      }
    } catch (err) {
      setError('Failed to load employees. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ── Search submit ─────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ── CSV file selection & upload ───────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-uploaded after an edit
    e.target.value = '';

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only .csv files are accepted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum allowed size is 5 MB.');
      return;
    }

    setImporting(true);
    try {
      const result = await adminApi.bulkImportEmployees(file);
      setImportResult(result);
      toast.success(`Import complete: ${result.created} created, ${result.updated} updated.`);
      // Refresh the employee list to show newly imported employees
      setPage(1);
      setSearch('');
      setSearchInput('');
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.detail || 'CSV import failed. Please check the file format.';
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  // ── Toggle employee active status ─────────────────────────────────────────
  const handleToggleActive = async (employee) => {
    const action = employee.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${employee.name} (${employee.employee_id})?`)) return;
    try {
      await axiosInstance.patch(`/api/users/employees/${employee.employee_id}/`, {
        is_active: !employee.is_active,
      });
      toast.success(`${employee.name} ${employee.is_active ? 'deactivated' : 'activated'} successfully.`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update employee status.');
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hidden file input for CSV upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        id="csv-upload-input"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7" />
            Employee Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total > 0 ? `${total.toLocaleString()} registered employee${total !== 1 ? 's' : ''}` : 'Manage employee accounts and bulk imports.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCsvTemplate}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CSV Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] hover:bg-blue-900 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <button
            onClick={() => { setPage(1); fetchEmployees(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* CSV Import hint banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Upload className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <span className="font-semibold">Bulk Import:</span> Upload a UTF-8 CSV file with columns:{' '}
          <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-xs">
            employee_id, name, email, mobile, department, password
          </code>
          . New employees are created; existing ones are updated. Download the template above for the correct format.
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, employee ID, email, or department…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-blue-900 cursor-pointer"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Clear
          </button>
        )}
      </form>

      {/* Employee Table */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEmployees} />
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Employee ID</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Mobile</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Department</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{emp.employee_id}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{emp.name}</td>
                        <td className="px-5 py-3 text-gray-600 truncate max-w-[180px]">{emp.email}</td>
                        <td className="px-5 py-3 text-gray-600 font-mono text-xs">{emp.mobile || '—'}</td>
                        <td className="px-5 py-3 text-gray-600">{emp.department || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                            emp.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {emp.is_admin ? 'Admin' : 'Employee'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`flex items-center gap-1 w-fit px-2 py-0.5 text-xs font-bold rounded-full ${
                            emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {emp.is_active ? (
                              <><UserCheck className="w-3 h-3" /> Active</>
                            ) : (
                              <><UserX className="w-3 h-3" /> Inactive</>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleToggleActive(emp)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                              emp.is_active
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {emp.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-gray-400 font-medium">
                        {search ? `No employees found for "${search}".` : 'No employees registered yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
                <span className="font-semibold text-gray-700">{totalPages}</span> ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CSV Import Result Modal */}
      {importResult && (
        <ImportResultModal
          result={importResult}
          onClose={() => setImportResult(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
