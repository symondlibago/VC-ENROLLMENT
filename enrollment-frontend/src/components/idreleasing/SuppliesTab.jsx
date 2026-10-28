import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PackagePlus, Plus, AlertTriangle, Boxes, Check, ArrowRight,
  ArrowDownCircle, Trash2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
import CustomCalendar from '../layout/CustomCalendar';
import { toIsoDate, todayIso } from '@/lib/dateFormat';

import ModalShell, { Field, FIELD_CLASS } from './ModalShell';
import MotionDropdown from './MotionDropdown';
import { SUPPLY_CATEGORIES, formatDate, peso } from './constants';

const CATEGORY_TINT = {
  sling: 'bg-indigo-100 text-indigo-600',
  holder: 'bg-teal-100 text-teal-600',
  card: 'bg-amber-100 text-amber-600',
  other: 'bg-gray-100 text-gray-600',
};

/** Stock coming in. */
const AddStockModal = ({ items, preselect, onClose, onSaved, notify }) => {
  const [form, setForm] = useState({
    id_supply_item_id: preselect ?? items[0]?.id ?? '',
    delivery_date: todayIso(),
    quantity: '',
    unit_cost: '',
    supplier: '',
    reference: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async () => {
    if (!form.id_supply_item_id || !(Number(form.quantity) > 0)) {
      notify('Choose an item and enter how many came in.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await enrollmentAPI.idReleasing.addStock({
        ...form,
        quantity: Number(form.quantity),
        unit_cost: form.unit_cost === '' ? null : Number(form.unit_cost),
      });
      notify(response.message, 'success');
      onSaved();
    } catch (error) {
      notify(error.message || 'Could not record the delivery.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selected = items.find((item) => item.id === form.id_supply_item_id);
  const quantity = Number(form.quantity) || 0;
  const unitCost = Number(form.unit_cost) || 0;

  return (
    <ModalShell
      title="Add stock"
      subtitle="Slings, holders or card stock received"
      icon={PackagePlus}
      tone="bg-green-100 text-green-600"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center gap-3">
          {/* What this delivery does to the count, before it is committed */}
          {selected && quantity > 0 && (
            <p className="text-sm text-gray-600 mr-auto">
              <span className="font-medium text-gray-800">{selected.name}</span>
              <span className="text-gray-400"> {selected.on_hand} </span>
              <ArrowRight className="w-3.5 h-3.5 inline mx-0.5 text-gray-400" />
              <span className="font-bold text-green-700"> {selected.on_hand + quantity}</span>
              {unitCost > 0 && (
                <span className="block text-xs text-gray-400">
                  {peso(quantity * unitCost)} total
                </span>
              )}
            </p>
          )}
          <Button variant="outline" className="min-w-28" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="min-w-36 gradient-primary text-white" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Add to Stock'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Item">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {items.map((item) => {
              const isOn = form.id_supply_item_id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, id_supply_item_id: item.id }))}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    isOn
                      ? 'border-[var(--dominant-red)] bg-red-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isOn && (
                    <Check className="w-4 h-4 absolute top-2 right-2 text-[var(--dominant-red)]" />
                  )}
                  <span
                    className={`inline-flex p-1.5 rounded-lg mb-2 ${
                      CATEGORY_TINT[item.category] ?? CATEGORY_TINT.other
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                  </span>
                  <span
                    className={`block text-sm font-semibold leading-tight ${
                      isOn ? 'text-[var(--dominant-red)]' : 'text-gray-800'
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="block text-xs text-gray-400 mt-0.5">{item.on_hand} on hand</span>
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Quantity received">
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={set('quantity')}
              placeholder="0"
              className={`${FIELD_CLASS} h-11 text-lg font-semibold`}
            />
          </Field>
          <Field label="Date received">
            {/* Opens upward when the dialog sits low on the screen */}
            <CustomCalendar
              value={form.delivery_date}
              onChange={(picked) => setForm((prev) => ({ ...prev, delivery_date: toIsoDate(picked) }))}
              placeholder="Pick a date"
              triggerClassName="h-11 rounded-md border-gray-300"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Unit cost"
            hint={quantity > 0 && unitCost > 0 ? `${peso(quantity * unitCost)} for ${quantity}` : 'Optional'}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.unit_cost}
              onChange={set('unit_cost')}
              placeholder="0.00"
              className={FIELD_CLASS}
            />
          </Field>
          <Field label="Supplier" hint="Optional">
            <Input
              value={form.supplier}
              onChange={set('supplier')}
              placeholder="Who it came from"
              className={FIELD_CLASS}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Reference" hint="Delivery receipt or invoice number">
            <Input
              value={form.reference}
              onChange={set('reference')}
              placeholder="DR / INV number"
              className={FIELD_CLASS}
            />
          </Field>
          <Field label="Notes" hint="Optional">
            <Input
              value={form.notes}
              onChange={set('notes')}
              placeholder="Anything worth remembering"
              className={FIELD_CLASS}
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
};

/** Another kind of stock to keep count of. */
const NewItemModal = ({ onClose, onSaved, notify }) => {
  const [form, setForm] = useState({ name: '', category: 'sling', description: '', low_stock_quantity: '50' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) {
      notify('Give the item a name.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await enrollmentAPI.idReleasing.createItem({
        ...form,
        low_stock_quantity: Number(form.low_stock_quantity) || 0,
      });
      notify(response.message, 'success');
      onSaved();
    } catch (error) {
      notify(error.message || 'Could not add the item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Track a new item"
      subtitle="Another sling colour, a different holder, anything the desk stocks"
      icon={Boxes}
      tone="bg-blue-100 text-blue-600"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="min-w-28 ml-auto" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="min-w-36 gradient-primary text-white" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Add Item'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. ID Sling for Senior High"
            className={`${FIELD_CLASS} h-11`}
          />
        </Field>

        <Field label="Kind">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SUPPLY_CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: option.value }))}
                className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all cursor-pointer ${
                  form.category === option.value
                    ? 'border-[var(--dominant-red)] bg-red-50 text-[var(--dominant-red)] shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Warn below" hint="Flagged once stock drops to this many.">
            <Input
              type="number"
              min="0"
              value={form.low_stock_quantity}
              onChange={(event) => setForm((prev) => ({ ...prev, low_stock_quantity: event.target.value }))}
              className={FIELD_CLASS}
            />
          </Field>
          <Field label="Description" hint="Optional">
            <Input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="What it is used for"
              className={FIELD_CLASS}
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
};

/**
 * The supplies board: what is on hand, and the ledger that explains it.
 *
 * Stock is only added here. It leaves on its own when an ID is released with
 * a sling or holder, which is the only moment anyone actually knows that it
 * went out, so there is nothing to key in by hand.
 */
const SuppliesTab = ({ schoolYear, notify, canDelete, onChanged }) => {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [itemFilter, setItemFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await enrollmentAPI.idReleasing.supplies({ school_year: schoolYear });
      setItems(response.data || []);
    } catch (error) {
      notify(error.message || 'Could not load the supplies.', 'error');
    }
  }, [schoolYear, notify]);

  const loadMovements = useCallback(async () => {
    try {
      const response = await enrollmentAPI.idReleasing.movements({
        page,
        per_page: 15,
        id_supply_item_id: itemFilter || undefined,
      });
      setMovements(response.data || []);
      setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (error) {
      notify(error.message || 'Could not load the stock movements.', 'error');
    }
  }, [page, itemFilter, notify]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadItems(), loadMovements()]).finally(() => setLoading(false));
  }, [loadItems, loadMovements]);

  /**
   * Anything that moves stock also moves the low-stock banner and the counts
   * in the header, which the parent owns — so it is told every time.
   */
  const refresh = () => {
    setDialog(null);
    setPage(1);
    loadItems();
    loadMovements();
    onChanged?.();
  };

  const removeDelivery = async (delivery) => {
    try {
      const response = await enrollmentAPI.idReleasing.deleteDelivery(delivery.id);
      notify(response.message, 'success');
      loadItems();
      loadMovements();
      onChanged?.();
    } catch (error) {
      notify(error.message || 'Could not remove that record.', 'error');
    }
  };

  const itemFilterOptions = useMemo(
    () => [
      { value: '', label: 'All items' },
      ...items.map((item) => ({ value: String(item.id), label: item.name })),
    ],
    [items]
  );

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="gradient-primary text-white liquid-button" onClick={() => setDialog({ type: 'add' })}>
          <PackagePlus className="w-4 h-4 mr-2" /> Add Stock
        </Button>
        <Button variant="outline" onClick={() => setDialog({ type: 'item' })}>
          <Plus className="w-4 h-4 mr-2" /> New Item
        </Button>
        <p className="text-sm text-gray-400 ml-auto">
          Stock goes out on its own when an ID is released with a sling or holder.
        </p>
      </div>

      {/* Stock on hand */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className={`shadow-sm ${item.is_negative ? 'border-red-300' : ''}`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  )}
                </div>
                <div className={`p-2.5 rounded-full shrink-0 ${CATEGORY_TINT[item.category] ?? CATEGORY_TINT.other}`}>
                  <Boxes className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500">On hand</p>
                  <p className={`text-3xl font-bold heading-bold ${item.is_negative ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.on_hand}
                  </p>
                </div>
                {item.is_low && (
                  <Badge className={`border ${item.is_negative ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                    <AlertTriangle size={11} className="mr-1" />
                    {item.is_negative ? 'Negative' : 'Running low'}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
                <div>
                  <p className="text-xs text-gray-400">Received</p>
                  <p className="text-sm font-semibold text-gray-700">{item.delivered}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Issued</p>
                  <p className="text-sm font-semibold text-gray-700">{item.issued}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">This year</p>
                  <p className="text-sm font-semibold text-gray-700">{item.issued_this_year}</p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => setDialog({ type: 'add', item: item.id })}
              >
                <ArrowDownCircle size={13} className="mr-1" /> Add Stock
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The ledger behind those numbers */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-wrap items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900">Stock Received</h3>
              <p className="text-xs text-gray-400">
                What goes out leaves with a card and is listed under Records.
              </p>
            </div>
            <span className="text-sm text-gray-400">{meta.total} delivery(s)</span>
            <MotionDropdown
              value={itemFilter}
              onChange={(value) => { setItemFilter(value); setPage(1); }}
              options={itemFilterOptions}
              className="ml-auto w-52"
            />
          </div>

          {movements.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Nothing received yet. Add stock to get started.
            </p>
          ) : (
            <div className="divide-y">
              {movements.map((delivery) => (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3.5 flex items-center gap-3 hover:bg-gray-50"
                >
                  <div className="p-2 rounded-full shrink-0 bg-green-100 text-green-600">
                    <ArrowDownCircle size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      +{delivery.quantity} x {delivery.item_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatDate(delivery.happened_on)}
                      {delivery.party ? ` - ${delivery.party}` : ''}
                      {delivery.reference ? ` - ${delivery.reference}` : ''}
                      {delivery.unit_cost ? ` - ${peso(delivery.quantity * delivery.unit_cost)}` : ''}
                    </p>
                  </div>

                  {delivery.recorded_by_name && (
                    <span className="text-xs text-gray-400 hidden sm:block shrink-0">
                      {delivery.recorded_by_name}
                    </span>
                  )}

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 shrink-0"
                      onClick={() => removeDelivery(delivery)}
                      title="Remove this delivery"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="p-3 border-t flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog?.type === 'add' && (
        <AddStockModal
          items={items}
          preselect={dialog.item}
          onClose={() => setDialog(null)}
          onSaved={refresh}
          notify={notify}
        />
      )}
      {dialog?.type === 'item' && (
        <NewItemModal onClose={() => setDialog(null)} onSaved={refresh} notify={notify} />
      )}
    </div>
  );
};

export default SuppliesTab;
