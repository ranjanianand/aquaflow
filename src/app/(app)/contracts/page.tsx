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
  mockContracts,
  getActiveContractsCount,
  getExpiringContracts,
  getTotalContractValue,
  getContractTypeLabel,
  Contract,
} from '@/data/mock-contracts';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  RefreshCw,
  DollarSign,
  Shield,
  ChevronDown,
  Filter,
  MoreVertical,
  X,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ContractsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredContracts = mockContracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const expiringContracts = getExpiringContracts(30);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'draft':
        return 'bg-amber-100 text-amber-700';
      case 'expired':
      case 'terminated':
        return 'bg-rose-100 text-rose-700';
      case 'renewed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getContractProgress = (contract: Contract) => {
    const totalDays = differenceInDays(contract.endDate, contract.startDate);
    const elapsedDays = differenceInDays(new Date(), contract.startDate);
    return Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
  };

  const getDaysRemaining = (endDate: Date) => {
    const days = differenceInDays(endDate, new Date());
    return days;
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setActiveTab('overview');
    setViewModalOpen(true);
  };

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setContractModalOpen(true);
  };

  const handleAddContract = () => {
    setSelectedContract(null);
    setContractModalOpen(true);
  };

  const handleSaveContract = () => {
    toast.success(selectedContract ? 'Contract updated' : 'Contract created', {
      description: selectedContract
        ? 'Contract details have been updated successfully.'
        : 'New contract has been created.',
    });
    setContractModalOpen(false);
  };

  const handleRenewContract = (contract: Contract) => {
    toast.success('Renewal initiated', {
      description: `Renewal process started for ${contract.contractNumber}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Contracts & AMC</span>
            <span className="text-[10px] text-slate-400">Contract lifecycle management</span>
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
          <FileText className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Contracts & AMC</span>
          <span className="text-[10px] text-slate-400">Contract lifecycle management</span>
        </div>
        <div className="flex items-center gap-3">
          {expiringContracts.length > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" />
              {expiringContracts.length} EXPIRING
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold">
            <FileText className="h-3 w-3" />
            {getActiveContractsCount()} ACTIVE
          </span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* KPI Stats Cards - Industrial Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Contracts</span>
              <FileText className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{getActiveContractsCount()}</span>
              <span className="text-[10px] text-slate-500">OF {mockContracts.length}</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Value</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-emerald-600">{formatCurrency(getTotalContractValue())}</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expiring (30 days)</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-600">{expiringContracts.length}</span>
              <span className="text-[10px] text-slate-500">CONTRACTS</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg. SLA Uptime</span>
              <Shield className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-purple-600">99.5%</span>
            </div>
          </div>
        </div>

        {/* Expiring Contracts Alert - Industrial Style */}
        {expiringContracts.length > 0 && (
          <div className="border-2 border-amber-400 bg-amber-50 p-4 border-l-[4px] border-l-amber-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Contracts Expiring Soon</h4>
                <p className="text-sm text-amber-700 mt-1">
                  {expiringContracts.length} contract(s) expiring in the next 30 days:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expiringContracts.map((contract) => (
                    <span
                      key={contract.id}
                      className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 px-2 py-1 text-[10px] font-bold text-amber-800"
                    >
                      {contract.contractNumber} - {getDaysRemaining(contract.endDate)} DAYS
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                placeholder="Search contracts..."
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
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="renewed">Renewed</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Type Dropdown */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-7 px-2 pr-7 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Types</option>
                <option value="amc">AMC</option>
                <option value="camc">CAMC</option>
                <option value="warranty">Warranty</option>
                <option value="o_and_m">O&M</option>
                <option value="consumables">Consumables</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Results count */}
            <span className="text-[10px] font-mono text-slate-500 ml-auto">
              {filteredContracts.length} CONTRACT{filteredContracts.length !== 1 ? 'S' : ''} FOUND
            </span>

            {/* Add Contract Button */}
            <button
              onClick={handleAddContract}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Contract
            </button>
          </div>
        </div>

        {/* Contracts Table - Industrial Style */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Contract Registry</span>
            </div>
            <button className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-700 transition-colors">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Contract</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Type</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Duration</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Value</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Progress</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const daysRemaining = getDaysRemaining(contract.endDate);
                const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
                const progress = getContractProgress(contract);

                return (
                  <TableRow
                    key={contract.id}
                    className="cursor-pointer hover:bg-slate-50 border-b border-slate-200 transition-colors"
                    onClick={() => handleViewContract(contract)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                          <FileText className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{contract.contractNumber}</p>
                          <p className="text-[10px] text-slate-500">
                            {contract.coveredPlantNames.length > 0
                              ? contract.coveredPlantNames.join(', ')
                              : 'No plants'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{contract.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 text-slate-600">
                        {getContractTypeLabel(contract.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'text-[9px] font-bold uppercase px-2 py-1',
                        getStatusColor(contract.status)
                      )}>
                        {contract.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-mono text-slate-700">{format(contract.startDate, 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-slate-500">
                          to {format(contract.endDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.value > 0 ? (
                        <div>
                          <p className="text-sm font-bold font-mono text-slate-700">{formatCurrency(contract.value)}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{contract.billingFrequency}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.status === 'active' && (
                        <div className="space-y-1">
                          <div className="w-20 h-1.5 bg-slate-200">
                            <div
                              className={cn(
                                'h-full',
                                isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className={cn(
                            'text-[10px] font-mono',
                            isExpiringSoon ? 'text-amber-600 font-bold' : 'text-slate-500'
                          )}>
                            {daysRemaining > 0 ? `${daysRemaining}d left` : 'Expired'}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === contract.id ? null : contract.id)}
                          className="p-1.5 hover:bg-slate-100 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === contract.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-40 border-2 border-slate-300 bg-white shadow-lg">
                            <button
                              onClick={() => { handleViewContract(contract); setOpenMenuId(null); }}
                              className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </button>
                            <button
                              onClick={() => { handleEditContract(contract); setOpenMenuId(null); }}
                              className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit Contract
                            </button>
                            {contract.status === 'active' && (
                              <button
                                onClick={() => { handleRenewContract(contract); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Renew Contract
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredContracts.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-600 mb-1">NO CONTRACTS FOUND</h3>
              <p className="text-[11px] text-slate-500">
                Try adjusting your filters to see more results
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Contract Modal - Industrial Style */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent showCloseButton={false} className="max-w-2xl p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Contract Details</DialogTitle>
          {/* Modal Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Contract Details</h2>
                {selectedContract && (
                  <p className="text-[10px] text-slate-500 font-mono">{selectedContract.contractNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedContract && (
                <span className={cn(
                  'text-[9px] font-bold uppercase px-2 py-1',
                  getStatusColor(selectedContract.status)
                )}>
                  {selectedContract.status}
                </span>
              )}
              <button onClick={() => setViewModalOpen(false)} className="p-1 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {selectedContract && (
            <div className="p-0">
              {/* Tab Navigation */}
              <div className="flex gap-1 p-2 bg-slate-100 border-b-2 border-slate-300">
                {['overview', 'sla', 'coverage'].map((tab) => (
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
                    {/* Contract Header */}
                    <div className="flex items-start gap-4 pb-4 border-b-2 border-slate-200">
                      <div className="flex h-14 w-14 items-center justify-center bg-slate-100 border-2 border-slate-300">
                        <FileText className="h-7 w-7 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{selectedContract.contractNumber}</h3>
                        <p className="text-sm text-slate-600">{selectedContract.customerName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-[9px] font-bold uppercase px-2 py-0.5',
                            getStatusColor(selectedContract.status)
                          )}>
                            {selectedContract.status}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-600">
                            {getContractTypeLabel(selectedContract.type)}
                          </span>
                        </div>
                      </div>
                      <div className="border-2 border-slate-300 p-3 border-l-[3px] border-l-emerald-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Value</span>
                        <span className="text-xl font-bold font-mono text-emerald-600">
                          {formatCurrency(selectedContract.value)}
                        </span>
                        <span className="text-[10px] text-slate-500 block uppercase">{selectedContract.billingFrequency}</span>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Date</span>
                        <p className="text-sm font-mono text-slate-800 mt-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {format(selectedContract.startDate, 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date</span>
                        <p className="text-sm font-mono text-slate-800 mt-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {format(selectedContract.endDate, 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Auto Renewal</span>
                        <p className="text-sm text-slate-800 mt-1 flex items-center gap-1">
                          {selectedContract.autoRenew ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-slate-400" />
                              Manual
                            </>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Renewal Reminder</span>
                        <p className="text-sm text-slate-800 mt-1">
                          {selectedContract.renewalReminder ? 'Active' : 'Disabled'}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    {selectedContract.status === 'active' && (
                      <div className="pt-4 border-t-2 border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Progress</span>
                          <span className="text-[11px] font-mono text-slate-600">
                            {Math.round(getContractProgress(selectedContract))}% complete
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${getContractProgress(selectedContract)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 font-mono">
                          {getDaysRemaining(selectedContract.endDate)} days remaining
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sla' && (
                  <div className="space-y-4">
                    {/* Response Time SLA */}
                    <div className="border-2 border-slate-300 p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-4">Response Time SLA</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'Critical', value: selectedContract.sla.responseTime.critical, color: 'text-rose-600' },
                          { label: 'High', value: selectedContract.sla.responseTime.high, color: 'text-amber-600' },
                          { label: 'Medium', value: selectedContract.sla.responseTime.medium, color: 'text-yellow-600' },
                          { label: 'Low', value: selectedContract.sla.responseTime.low, color: 'text-emerald-600' },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <p className={cn('text-2xl font-bold font-mono', item.color)}>{item.value}h</p>
                            <p className="text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resolution Time SLA */}
                    <div className="border-2 border-slate-300 p-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-4">Resolution Time SLA</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'Critical', value: selectedContract.sla.resolutionTime.critical, color: 'text-rose-600' },
                          { label: 'High', value: selectedContract.sla.resolutionTime.high, color: 'text-amber-600' },
                          { label: 'Medium', value: selectedContract.sla.resolutionTime.medium, color: 'text-yellow-600' },
                          { label: 'Low', value: selectedContract.sla.resolutionTime.low, color: 'text-emerald-600' },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <p className={cn('text-2xl font-bold font-mono', item.color)}>{item.value}h</p>
                            <p className="text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SLA Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-2 border-slate-300 p-4 border-l-[3px] border-l-emerald-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Uptime Guarantee</span>
                        <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                          {selectedContract.sla.uptimeGuarantee}%
                        </p>
                      </div>
                      <div className="border-2 border-slate-300 p-4 border-l-[3px] border-l-blue-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PM Frequency</span>
                        <p className="text-2xl font-bold font-mono text-blue-600 mt-1 capitalize">
                          {selectedContract.sla.preventiveMaintenanceFrequency}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'coverage' && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Covered Plants</h4>
                    {selectedContract.coveredPlantNames.length > 0 ? (
                      <div className="space-y-2">
                        {selectedContract.coveredPlantNames.map((plantName, index) => (
                          <div key={index} className="border-2 border-slate-300 p-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-slate-800">{plantName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No specific plants covered</p>
                    )}

                    {selectedContract.documents.length > 0 && (
                      <div className="pt-4 border-t-2 border-slate-200">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-3">Documents</h4>
                        <div className="space-y-2">
                          {selectedContract.documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-slate-700">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                    handleEditContract(selectedContract);
                  }}
                  className="px-4 py-2 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  <Edit className="h-3 w-3 inline mr-1" />
                  Edit Contract
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Contract Modal - Industrial Style */}
      <Dialog open={contractModalOpen} onOpenChange={setContractModalOpen}>
        <DialogContent showCloseButton={false} className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Contract Form</DialogTitle>
          {/* Modal Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {selectedContract ? 'Edit Contract' : 'New Contract'}
              </h2>
            </div>
            <button onClick={() => setContractModalOpen(false)} className="p-1 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Number</label>
              <input
                type="text"
                placeholder="e.g., AMC-2024-007"
                defaultValue={selectedContract?.contractNumber || ''}
                className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</label>
              <div className="relative">
                <select
                  defaultValue={selectedContract?.customerId || ''}
                  className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                >
                  <option value="">Select customer</option>
                  <option value="cust-1">Tata Steel Limited</option>
                  <option value="cust-2">Chennai Metropolitan Water Supply</option>
                  <option value="cust-3">Reliance Industries Ltd</option>
                  <option value="cust-4">Infosys BPO Limited</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Type</label>
                <div className="relative">
                  <select
                    defaultValue={selectedContract?.type || ''}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="">Select type</option>
                    <option value="amc">AMC</option>
                    <option value="camc">CAMC</option>
                    <option value="warranty">Warranty</option>
                    <option value="o_and_m">O&M</option>
                    <option value="consumables">Consumables</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Billing Frequency</label>
                <div className="relative">
                  <select
                    defaultValue={selectedContract?.billingFrequency || ''}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Value (₹)</label>
              <input
                type="number"
                placeholder="e.g., 1200000"
                defaultValue={selectedContract?.value || ''}
                className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                <input
                  type="date"
                  defaultValue={selectedContract?.startDate ? format(selectedContract.startDate, 'yyyy-MM-dd') : ''}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date</label>
                <input
                  type="date"
                  defaultValue={selectedContract?.endDate ? format(selectedContract.endDate, 'yyyy-MM-dd') : ''}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 p-4 bg-slate-100 border-t-2 border-slate-300">
            <button
              onClick={() => setContractModalOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveContract}
              className="px-4 py-2 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              {selectedContract ? 'Save Changes' : 'Create Contract'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
