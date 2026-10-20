import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Product, ProductStatus } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';


export const AdminProducts: React.FC = () => {
  const { products, toggleProductStatus, deleteProduct, addNewProduct } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newStock, setNewStock] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  const [newDepartment, setNewDepartment] = useState('Dept. of Textile Design');

  const filteredProducts = products.filter((p) => {
    if (
      searchTerm &&
      !p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newPrice) return;

    addNewProduct({
      name: newProductName,
      tagline: 'Handcrafted student creation submitted for campus marketplace.',
      description: newDescription || 'Premium handcrafted item made at Jinnah University for Women.',
      price: Number(newPrice),
      category: newCategory,
      categorySlug: newCategory.toLowerCase().replace(/[^a-z0-9]+/g,'-') || 'fashion-clothing',
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      ],
      rating: 5.0,
      reviewCount: 0,
      stock: Number(newStock) || 5,
      status: 'ACTIVE',
      tags: ['Student Product', 'JUW'],
      sellerDepartment: newDepartment,
      sku: `JUW-ADM-${Math.floor(100 + Math.random() * 900)}`,
    });

    setIsAddModalOpen(false);
    setNewProductName('');
    setNewPrice('');
    setNewDescription('');
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Inventory & Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage stock levels, active visibility, and catalog metadata across all 12 faculties.
          </p>
        </div>

        <Button
          variant="emerald"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Product
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by product title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 hidden sm:inline">Department:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">All Departments ({products.length})</option>
            {Array.from(new Set(products.map(p=>p.category))).map((name)=>({name,slug:name.toLowerCase().replace(/[^a-z0-9]+/g,'-')})).map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Product Info</th>
                <th className="p-4">Faculty / Dept</th>
                <th className="p-4">Retail Price</th>
                <th className="p-4">Stock Units</th>
                <th className="p-4">Catalog Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Product Details */}
                  <td className="p-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={product.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 max-w-xs">
                        <strong className="font-bold text-slate-900 block truncate">
                          {product.name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {product.sku}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="p-4 text-slate-600">
                    <span className="font-semibold text-emerald-800 block">
                      {product.category}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {product.sellerDepartment}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="p-4 font-bold text-slate-900">
                    Rs. {product.price.toLocaleString()}
                  </td>

                  {/* Stock */}
                  <td className="p-4">
                    <span
                      className={`inline-block font-extrabold px-2 py-0.5 rounded-md ${
                        product.stock > 5
                          ? 'bg-emerald-50 text-emerald-800'
                          : product.stock > 0
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {product.stock} in stock
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <StatusBadge status={product.status} type="product" />
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          toggleProductStatus(
                            product.id,
                            product.status === 'ACTIVE' ? 'OUT_OF_STOCK' : 'ACTIVE'
                          )
                        }
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-700"
                        title="Toggle Stock Status"
                      >
                        {product.status === 'ACTIVE' ? 'Mark Out of Stock' : 'Mark Active'}
                      </button>

                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Direct Product Provisioning (Admin)"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g. Hand-embroidered Velvet Shawl"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Retail Price (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="3500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Stock Units <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {Array.from(new Set(products.map(p=>p.category))).map((name)=>({name,slug:name.toLowerCase().replace(/[^a-z0-9]+/g,'-')})).map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submitting Faculty
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Product description and craftsmanship details..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="sm">
                Save & Publish Product
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
          title="Confirm Product Removal"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>{productToDelete.name}</strong> from the JUW Marketplace catalog?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
