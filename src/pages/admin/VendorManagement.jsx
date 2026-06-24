import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { smartbuyApi } from '../../api/smartbuy';
import { toast } from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Save, RefreshCw, Phone, Mail, User, CheckCircle, XCircle 
} from 'lucide-react';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    products_provided: '',
    is_active: true
  });

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await smartbuyApi.getVendors();
      const list = data.results || (Array.isArray(data) ? data : []);
      setVendors(list);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve vendors list from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleOpenCreate = () => {
    setSelectedVendor(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      products_provided: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone,
      products_provided: vendor.products_provided,
      is_active: vendor.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedVendor) {
        await smartbuyApi.updateVendor(selectedVendor.id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await smartbuyApi.createVendor(formData);
        toast.success('Vendor registered successfully');
      }
      setShowModal(false);
      fetchVendors();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to save vendor details';
      toast.error(detail);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this vendor? They will be hidden from new campaign setups.')) return;
    try {
      await smartbuyApi.deleteVendor(id);
      toast.success('Vendor deactivated successfully');
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate vendor.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchVendors} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Vendor Management</h1>
          <p className="mt-2 text-sm text-gray-650">Register and manage official supplier catalog details for SmartBuy group buying.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={fetchVendors}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Vendors Catalog Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Vendor Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Primary Contact</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Products Provided</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50/30">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{vendor.name}</div>
                      <div className="text-xs text-gray-500">Registered ID: #{vendor.id}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {vendor.contact_person}
                      </div>
                      <div className="text-xs text-gray-550 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {vendor.email}
                      </div>
                      <div className="text-xs text-gray-550 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {vendor.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-650 max-w-xs truncate" title={vendor.products_provided}>
                      {vendor.products_provided}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1 w-fit ${
                        vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vendor.is_active ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-600" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(vendor)}
                        className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-650 cursor-pointer inline-flex"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="p-1.5 border border-gray-300 rounded hover:bg-red-50 text-red-600 cursor-pointer inline-flex"
                        title="Deactivate / Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    No vendors registered in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT VENDOR MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-[#003366] border-b border-gray-150 pb-3 mb-4">
              {selectedVendor ? 'Edit Vendor Details' : 'Register New Vendor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dell India Pvt Ltd"
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@vendor.com"
                    className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9998887776"
                    className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Products Provided</label>
                <textarea
                  value={formData.products_provided}
                  onChange={(e) => setFormData({ ...formData, products_provided: e.target.value })}
                  placeholder="e.g. Office Laptops, Computer Accessories, Desktop Monitors..."
                  rows="3"
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm text-sm"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vendor_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="vendor_is_active" className="text-sm font-semibold text-gray-700">
                  Vendor is Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
