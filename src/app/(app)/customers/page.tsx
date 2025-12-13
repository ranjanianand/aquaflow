'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  mockCustomers,
  getActiveCustomersCount,
  getTotalRevenue,
  getTotalOutstanding,
  getAverageHealthScore,
  Customer,
} from '@/data/mock-customers';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Phone,
  Mail,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Heart,
  Eye,
  FileText,
  UserCircle,
  ChevronDown,
  RefreshCw,
  Filter,
  MoreVertical,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'prospect':
        return 'bg-blue-100 text-blue-700';
      case 'lead':
        return 'bg-amber-100 text-amber-700';
      case 'inactive':
      case 'churned':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getHealthBorderColor = (score: number) => {
    if (score >= 80) return 'border-l-emerald-500';
    if (score >= 60) return 'border-l-amber-500';
    return 'border-l-rose-500';
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('overview');
    setViewModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(true);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = () => {
    toast.success(selectedCustomer ? 'Customer updated' : 'Customer added', {
      description: selectedCustomer
        ? 'Customer details have been updated successfully.'
        : 'New customer has been added to the CRM.',
    });
    setCustomerModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Building2 className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Customer Management</span>
            <span className="text-[10px] text-slate-400">CRM & relationships</span>
          </div>
        </header>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 border-2 border-slate-300" />
              ))}
            </div>
            <div className="h-96 bg-slate-200 border-2 border-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Building2 className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Customer Management</span>
          <span className="text-[10px] text-slate-400">CRM & relationships</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold">
            <Users className="h-3 w-3" />
            {getActiveCustomersCount()} ACTIVE
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {mockCustomers.length} TOTAL CUSTOMERS
          </span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* KPI Stats Cards - Industrial Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Customers</span>
              <Users className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{getActiveCustomersCount()}</span>
              <span className="text-[10px] text-slate-500">OF {mockCustomers.length}</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-emerald-600">{formatCurrency(getTotalRevenue())}</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
              <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-amber-600">{formatCurrency(getTotalOutstanding())}</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg. Health Score</span>
              <Heart className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-purple-600">{getAverageHealthScore()}%</span>
            </div>
          </div>
        </div>

        {/* Filters Panel - Industrial Style */}
        <div className="border-2 border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filters:</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 pr-3 text-[11px] border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 w-[200px]"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-7 px-2 pr-7 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="lead">Lead</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Segment Dropdown */}
            <div className="relative">
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="h-7 px-2 pr-7 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Segments</option>
                <option value="enterprise">Enterprise</option>
                <option value="sme">SME</option>
                <option value="government">Government</option>
                <option value="residential">Residential</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Results count */}
            <span className="text-[10px] font-mono text-slate-500 ml-auto">
              {filteredCustomers.length} CUSTOMER{filteredCustomers.length !== 1 ? 'S' : ''} FOUND
            </span>

            {/* Add Customer Button */}
            <button
              onClick={handleAddCustomer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Customers Table - Industrial Style */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Customer Directory</span>
            </div>
            <button className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-700 transition-colors">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Industry</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Segment</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Health Score</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Revenue</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Outstanding</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Account Manager</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-slate-50 border-b border-slate-200 transition-colors"
                  onClick={() => handleViewCustomer(customer)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                        <Building2 className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{customer.companyName}</p>
                        <p className="text-[10px] font-mono text-slate-500">{customer.customerCode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{customer.industry}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 text-slate-600">
                      {customer.segment}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'text-[9px] font-bold uppercase px-2 py-1',
                      getStatusColor(customer.status)
                    )}>
                      {customer.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {customer.healthScore > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200">
                          <div
                            className={cn(
                              'h-full',
                              customer.healthScore >= 80 ? 'bg-emerald-500' :
                              customer.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            )}
                            style={{ width: `${customer.healthScore}%` }}
                          />
                        </div>
                        <span className={cn('text-sm font-bold font-mono', getHealthColor(customer.healthScore))}>
                          {customer.healthScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-slate-700">{formatCurrency(customer.totalRevenue)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'text-sm font-mono',
                      customer.outstandingAmount > 0 ? 'text-amber-600 font-bold' : 'text-slate-700'
                    )}>
                      {formatCurrency(customer.outstandingAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{customer.assignedAccountManager}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                        className="p-1.5 hover:bg-slate-100 transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === customer.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-40 border-2 border-slate-300 bg-white shadow-lg">
                          <button
                            onClick={() => {
                              handleViewCustomer(customer);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              handleEditCustomer(customer);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Customer
                          </button>
                          <button
                            onClick={() => setOpenMenuId(null)}
                            className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Contracts
                          </button>
                          <button
                            onClick={() => setOpenMenuId(null)}
                            className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Contact
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 mx-auto text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-600 mb-1">NO CUSTOMERS FOUND</h3>
              <p className="text-[11px] text-slate-500">
                Try adjusting your filters to see more results
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Customer Modal - Industrial Style */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Customer Details</DialogTitle>
          {/* Modal Header - Light Background */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Details</h2>
                {selectedCustomer && (
                  <p className="text-[10px] text-slate-500 font-mono">{selectedCustomer.customerCode}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedCustomer && (
                <span className={cn(
                  'text-[9px] font-bold uppercase px-2 py-1',
                  getStatusColor(selectedCustomer.status)
                )}>
                  {selectedCustomer.status}
                </span>
              )}
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {selectedCustomer && (
            <div className="p-0">
              {/* Tab Navigation */}
              <div className="flex gap-1 p-2 bg-slate-100 border-b-2 border-slate-300">
                {['overview', 'contacts', 'billing'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                      activeTab === tab
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Customer Header */}
                    <div className="flex items-start gap-4 pb-4 border-b-2 border-slate-200">
                      <div className="flex h-14 w-14 items-center justify-center bg-slate-100 border-2 border-slate-300">
                        <Building2 className="h-7 w-7 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{selectedCustomer.companyName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-[9px] font-bold uppercase px-2 py-0.5',
                            getStatusColor(selectedCustomer.status)
                          )}>
                            {selectedCustomer.status}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-600">
                            {selectedCustomer.segment}
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        'border-2 border-slate-300 p-3 border-l-[3px]',
                        getHealthBorderColor(selectedCustomer.healthScore)
                      )}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Health Score</span>
                        <span className={cn('text-2xl font-bold font-mono', getHealthColor(selectedCustomer.healthScore))}>
                          {selectedCustomer.healthScore}%
                        </span>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Industry</span>
                        <p className="text-sm font-medium text-slate-800 mt-1">{selectedCustomer.industry}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Manager</span>
                        <p className="text-sm font-medium text-slate-800 mt-1">{selectedCustomer.assignedAccountManager}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plants</span>
                        <p className="text-sm font-medium text-slate-800 mt-1">{selectedCustomer.plantIds.length} plants</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Since</span>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {selectedCustomer.acquisitionDate
                            ? format(selectedCustomer.acquisitionDate, 'MMM d, yyyy')
                            : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="pt-4 border-t-2 border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contacts' && (
                  <div className="space-y-3">
                    {selectedCustomer.contacts.map((contact) => (
                      <div key={contact.id} className="border-2 border-slate-300 p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center bg-slate-100 border border-slate-300">
                            <UserCircle className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800">{contact.name}</p>
                              {contact.isPrimary && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700">
                                  Primary
                                </span>
                              )}
                              {contact.isDecisionMaker && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-100 text-purple-700">
                                  Decision Maker
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{contact.designation}</p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="space-y-4">
                    {/* Revenue Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-2 border-slate-300 p-4 border-l-[3px] border-l-emerald-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
                        <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                          {formatCurrency(selectedCustomer.totalRevenue)}
                        </p>
                      </div>
                      <div className="border-2 border-slate-300 p-4 border-l-[3px] border-l-amber-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
                        <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
                          {formatCurrency(selectedCustomer.outstandingAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="border-2 border-slate-300 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">Billing Address</span>
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p>{selectedCustomer.billingAddress.street}</p>
                          <p>
                            {selectedCustomer.billingAddress.city},{' '}
                            {selectedCustomer.billingAddress.state}{' '}
                            {selectedCustomer.billingAddress.pincode}
                          </p>
                          <p>{selectedCustomer.billingAddress.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GST Number</span>
                        <p className="text-sm font-mono text-slate-800 mt-1">{selectedCustomer.gstNumber || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PAN Number</span>
                        <p className="text-sm font-mono text-slate-800 mt-1">{selectedCustomer.panNumber || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Limit</span>
                        <p className="text-sm font-mono text-slate-800 mt-1">{formatCurrency(selectedCustomer.creditLimit)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Terms</span>
                        <p className="text-sm font-medium text-slate-800 mt-1">{selectedCustomer.paymentTerms} days</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 p-4 bg-slate-100 border-t-2 border-slate-300">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-bold uppercase bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                  className="px-4 py-2 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  <Edit className="h-3 w-3 inline mr-1" />
                  Edit Customer
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Customer Modal - Industrial Style */}
      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Customer Form</DialogTitle>
          {/* Modal Header - Light Background */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center bg-slate-100 border border-slate-300">
                {selectedCustomer ? <Edit className="h-4 w-4 text-slate-600" /> : <Plus className="h-4 w-4 text-slate-600" />}
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>
            <button
              onClick={() => setCustomerModalOpen(false)}
              className="p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Company Name</label>
              <input
                type="text"
                placeholder="e.g., Tata Steel Limited"
                defaultValue={selectedCustomer?.companyName || ''}
                className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Industry</label>
                <input
                  type="text"
                  placeholder="e.g., Manufacturing"
                  defaultValue={selectedCustomer?.industry || ''}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Segment</label>
                <div className="relative">
                  <select
                    defaultValue={selectedCustomer?.segment || ''}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="">Select segment</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="sme">SME</option>
                    <option value="government">Government</option>
                    <option value="residential">Residential</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GST Number</label>
              <input
                type="text"
                placeholder="e.g., 19AABCT1234A1ZA"
                defaultValue={selectedCustomer?.gstNumber || ''}
                className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g., 500000"
                  defaultValue={selectedCustomer?.creditLimit || ''}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Terms (days)</label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  defaultValue={selectedCustomer?.paymentTerms || ''}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 p-4 bg-slate-100 border-t-2 border-slate-300">
            <button
              onClick={() => setCustomerModalOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustomer}
              className="px-4 py-2 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              {selectedCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
