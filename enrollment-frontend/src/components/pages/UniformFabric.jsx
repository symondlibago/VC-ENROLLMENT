import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shirt, Search, Loader2, Plus, PackagePlus, Scissors, Users, Ruler,
  AlertTriangle, Trash2, ChevronLeft, ChevronRight, CalendarRange, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fabricAPI, authAPI } from '@/services/api';
import SuccessAlert from '../modals/SuccessAlert';
import FabricSaleModal from '../modals/FabricSaleModal';
import FabricDeliveryModal from '../modals/FabricDeliveryModal';
import CustomCalendar from '../layout/CustomCalendar';
import { toIsoDate } from '@/lib/dateFormat';
import { fabricLabel } from '@/lib/fabric';

/**
 * Uniform fabric monitoring.
 *
 * Stock on hand sits at the top — delivered less sold, per fabric — with the
 * two ledgers that produce it underneath: what students bought, and what came
 * in. Both lists are paged by the server, so the page stays quick however many
 * terms of records build up behind it.
 */

const meters = (value) =>
  `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;

const peso = (value) =>
  `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Quick ranges, since deliveries land monthly or per semester. */
const presets = () => {
  const today = new Date();
  const iso = (date) => toIsoDate(date);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const threeMonthsBack = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  return [
    { key: 'all', label: 'All time', from: '', to: '' },
    { key: 'month', label: 'This month', from: iso(startOfMonth), to: iso(today) },
    { key: 'term', label: 'Last 3 months', from: iso(threeMonthsBack), to: iso(today) },
  ];
};

const UniformFabric = () => {
  const [summary, setSummary] = useState([]);
  const [fabricTypes, setFabricTypes] = useState([]);
  const [totals, setTotals] = useState({});
  const [can, setCan] = useState({});

  const [tab, setTab] = useState('purchases');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fabricFilter, setFabricFilter] = useState(null);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  // Which tab the rows in hand were fetched for. Switching tabs re-renders
  // before the new fetch starts, so without this the purchases table would be
  // handed delivery rows for a frame — and a delivery has no student on it.
  const [rowsKind, setRowsKind] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  const user = authAPI.getUserData();
  const isAdmin = user?.role === 'Admin';
  const rangePresets = useMemo(presets, []);

  // Search is typed, so give it a moment before it reaches the server
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fabricAPI.getSummary({ from: from || undefined, to: to || undefined });
      if (res.success) {
        setSummary(res.summary ?? []);
        setFabricTypes(res.fabric_types ?? []);
        setTotals(res.totals ?? {});
        setCan(res.can ?? {});
      }
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to load fabric stock.', type: 'error' });
    } finally {
      setLoadingSummary(false);
    }
  }, [from, to]);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = {
        from: from || undefined,
        to: to || undefined,
        fabric_type_id: fabricFilter || undefined,
        page,
      };
      const res = tab === 'purchases'
        ? await fabricAPI.getPurchases({ ...params, search: debouncedSearch || undefined })
        : await fabricAPI.getDeliveries(params);

      if (res.success) {
        setRows(res.data ?? []);
        setRowsKind(tab);
        setMeta(res.meta ?? { current_page: 1, last_page: 1, total: 0 });
      }
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to load the list.', type: 'error' });
    } finally {
      setLoadingList(false);
    }
  }, [tab, from, to, fabricFilter, debouncedSearch, page]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchList(); }, [fetchList]);

  // Changing what is being looked at always starts from the first page
  const firstPage = useRef(true);
  useEffect(() => {
    if (firstPage.current) { firstPage.current = false; return; }
    setPage(1);
  }, [tab, from, to, fabricFilter]);

  const refreshAll = () => { fetchSummary(); fetchList(); };

  const handleSale = async (payload) => {
    setIsSaving(true);
    try {
      const res = await fabricAPI.recordPurchase(payload);
      setSaleOpen(false);
      setTab('purchases');
      refreshAll();
      setAlert({
        isVisible: true,
        message: res.warnings?.length ? `${res.message} ${res.warnings.join(' ')}` : res.message,
        type: res.warnings?.length ? 'error' : 'success',
      });
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to record the purchase.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelivery = async (payload) => {
    setIsSaving(true);
    try {
      const res = await fabricAPI.recordDelivery(payload);
      setDeliveryOpen(false);
      setTab('deliveries');
      refreshAll();
      setAlert({ isVisible: true, message: res.message, type: 'success' });
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to record the delivery.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      const res = tab === 'purchases'
        ? await fabricAPI.deletePurchase(row.id)
        : await fabricAPI.deleteDelivery(row.id);
      refreshAll();
      setAlert({ isVisible: true, message: res.message, type: 'success' });
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to remove the record.', type: 'error' });
    }
  };

  const activePreset = rangePresets.find((p) => p.from === from && p.to === to)?.key ?? 'custom';
  const hasRange = from || to;

  // Only ever draw rows that belong to the tab being shown
  const listBusy = loadingList || rowsKind !== tab;
  const visibleRows = rowsKind === tab ? rows : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SuccessAlert
        isVisible={alert.isVisible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isVisible: false })}
      />

      {/* Header */}
      <div className="gradient-soft rounded-2xl p-8 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
            <Shirt className="w-8 h-8 text-(--dominant-red) mr-3" />
            Uniform Fabric
          </h1>
          <p className="text-gray-600 text-lg">
            Rolls on hand, what came in, and the metres sold to students.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => setDeliveryOpen(true)}
            className="cursor-pointer h-11 px-5 bg-white hover:bg-gray-100 hover:text-gray-900"
          >
            <PackagePlus className="w-4 h-4 mr-2" />
            Record Delivery
          </Button>
          <Button
            onClick={() => setSaleOpen(true)}
            className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer h-11 px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Sale
          </Button>
        </div>
      </div>

      {/* Stock on hand */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loadingSummary && summary.length === 0 ? (
          [0, 1, 2].map((key) => (
            <Card key={key} className="shadow-sm">
              <CardContent className="p-6 h-[148px] animate-pulse bg-gray-50 rounded-xl" />
            </Card>
          ))
        ) : summary.map((fabric) => {
          const used = fabric.delivered_meters > 0
            ? Math.min(100, (fabric.sold_meters / fabric.delivered_meters) * 100)
            : 0;

          return (
            <Card key={fabric.id} className={`shadow-sm ${fabric.is_low ? 'border-amber-300' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{fabricLabel(fabric)}</p>
                    <p className="text-xs text-gray-500 truncate">{fabric.description}</p>
                  </div>
                  {fabric.is_low && (
                    <Badge className="bg-amber-100 text-amber-800 font-medium shrink-0">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Low
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-3xl font-bold heading-bold ${
                    fabric.remaining_meters < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {Number(fabric.remaining_meters).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-gray-500">m left</span>
                  {fabric.remaining_rolls !== null && (
                    <span className="ml-auto text-sm text-gray-500">≈ {fabric.remaining_rolls} rolls</span>
                  )}
                </div>

                <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${fabric.is_low ? 'bg-amber-500' : 'bg-(--dominant-red)'}`}
                    style={{ width: `${used}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span>In {meters(fabric.delivered_meters)} · {fabric.delivered_rolls} rolls</span>
                  <span>Sold {meters(fabric.sold_meters)}</span>
                </div>

                {hasRange && (
                  <div className="mt-2 pt-2 border-t text-xs text-gray-400">
                    This period: in {meters(fabric.period.delivered_meters)} · sold {meters(fabric.period.sold_meters)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Period totals */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Students Served', value: totals.students_served ?? 0, icon: Users, tint: 'bg-blue-100 text-blue-600' },
          { label: 'Purchases', value: totals.purchases ?? 0, icon: Scissors, tint: 'bg-purple-100 text-purple-600' },
          { label: 'Metres Sold', value: meters(totals.meters_sold), icon: Ruler, tint: 'bg-amber-100 text-amber-600' },
          { label: 'Collected', value: peso(totals.amount_collected), icon: PackagePlus, tint: 'bg-green-100 text-green-600' },
        ].map(({ label, value, icon: Icon, tint }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold heading-bold text-gray-900 truncate">{value}</p>
              </div>
              <div className={`p-3 rounded-full shrink-0 ${tint}`}><Icon className="w-5 h-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period filter */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CalendarRange className="w-4 h-4 text-gray-400" />
              Period
            </div>

            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {rangePresets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => { setFrom(preset.from); setTo(preset.to); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                    activePreset === preset.key
                      ? 'bg-white text-(--dominant-red) shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <CustomCalendar
                value={from}
                onChange={(picked) => setFrom(toIsoDate(picked))}
                placeholder="From"
                className="w-44"
                triggerClassName="py-2 rounded-xl"
              />
              <span className="text-gray-400 text-sm">to</span>
              <CustomCalendar
                value={to}
                onChange={(picked) => setTo(toIsoDate(picked))}
                placeholder="To"
                className="w-44"
                triggerClassName="py-2 rounded-xl"
              />
              {hasRange && (
                <button
                  onClick={() => { setFrom(''); setTo(''); }}
                  className="text-gray-400 hover:text-(--dominant-red) cursor-pointer p-1"
                  title="Clear the period"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center border-t pt-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 shrink-0">
              {[
                { key: 'purchases', label: 'Student Purchases' },
                { key: 'deliveries', label: 'Deliveries' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md cursor-pointer transition-colors ${
                    tab === item.key ? 'bg-white text-(--dominant-red) shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === 'purchases' && (
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search student, ID or O.R. number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-52 justify-between bg-white cursor-pointer shrink-0">
                  {fabricLabel(fabricTypes.find((t) => t.id === fabricFilter)) || 'All fabrics'}
                  <span className="text-gray-400">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setFabricFilter(null)}>All fabrics</DropdownMenuItem>
                {fabricTypes.map((type) => (
                  <DropdownMenuItem key={type.id} onSelect={() => setFabricFilter(type.id)}>
                    {fabricLabel(type)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Ledger */}
      <Card>
        {listBusy ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading…
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Shirt className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium text-gray-500">
              {tab === 'purchases' ? 'No fabric purchases yet.' : 'No deliveries recorded yet.'}
            </p>
            <p className="text-sm">
              {tab === 'purchases'
                ? 'Record one with the Record Sale button above.'
                : 'Add the rolls you received with Record Delivery.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                {tab === 'purchases' ? (
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">O.R.</th>
                    {summary.map((fabric) => (
                      <th key={fabric.id} className="px-3 py-3 text-right whitespace-nowrap">{fabricLabel(fabric)}</th>
                    ))}
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    {isAdmin && <th className="px-4 py-3" />}
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Fabric</th>
                    <th className="px-4 py-3 text-right">Rolls</th>
                    <th className="px-4 py-3 text-right">Metres</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-left">D.R. / Invoice</th>
                    {isAdmin && <th className="px-4 py-3" />}
                  </tr>
                )}
              </thead>

              <tbody>
                {tab === 'purchases' ? visibleRows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50/70">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{shortDate(row.purchase_date)}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900 uppercase">{row.student?.name}</div>
                      <div className="text-xs text-gray-400">
                        {[row.student?.student_id_number, row.student?.course].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-gray-600">{row.or_number}</td>
                    {summary.map((fabric) => (
                      <td key={fabric.id} className="px-3 py-4 text-right">
                        {row.meters?.[fabric.id]
                          ? <span className="font-medium text-gray-900">{row.meters[fabric.id]}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">{meters(row.total_meters)}</td>
                    <td className="px-4 py-4 text-right text-gray-600">
                      {row.amount !== null ? peso(row.amount) : <span className="text-gray-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-gray-300 hover:text-(--dominant-red) cursor-pointer"
                          title="Remove this record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                )) : visibleRows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50/70">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{shortDate(row.delivery_date)}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {fabricLabel(fabricTypes.find((t) => t.id === row.fabric_type_id)) || row.fabric_name}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900">{row.rolls || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">{meters(row.meters)}</td>
                    <td className="px-4 py-4 text-gray-600">{row.supplier || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-4 text-gray-600 font-mono text-xs">
                      {row.reference || <span className="text-gray-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-gray-300 hover:text-(--dominant-red) cursor-pointer"
                          title="Remove this record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paging */}
        {!listBusy && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-xs text-gray-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total} record{meta.total === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <FabricSaleModal
        isOpen={saleOpen}
        onClose={() => setSaleOpen(false)}
        onSubmit={handleSale}
        isSaving={isSaving}
        summary={summary}
      />

      <FabricDeliveryModal
        isOpen={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        onSubmit={handleDelivery}
        isSaving={isSaving}
        fabricTypes={fabricTypes}
      />
    </div>
  );
};

export default UniformFabric;
