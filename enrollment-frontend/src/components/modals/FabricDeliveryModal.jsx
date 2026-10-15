import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, AlertCircle, PackagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CustomCalendar from '../layout/CustomCalendar';
import { toIsoDate, todayIso } from '@/lib/dateFormat';
import { fabricLabel } from '@/lib/fabric';

/**
 * Stock coming in. Deliveries land monthly or by semester, so the date is
 * picked rather than assumed, and the rolls are kept alongside the metres —
 * that is how the stockroom counts, and it is what gives the roll average.
 */

const inputClass =
  'h-11 text-base border-2 border-gray-200 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-white';

const FabricDeliveryModal = ({ isOpen, onClose, onSubmit, isSaving, fabricTypes = [] }) => {
  const [fabricId, setFabricId] = useState(null);
  const [date, setDate] = useState(todayIso());
  const [rolls, setRolls] = useState('');
  const [meters, setMeters] = useState('');
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFabricId(fabricTypes[0]?.id ?? null);
    setDate(todayIso());
    setRolls('');
    setMeters('');
    setSupplier('');
    setReference('');
    setNotes('');
    setError('');
  }, [isOpen, fabricTypes]);

  if (!isOpen) return null;

  const chosen = fabricTypes.find((type) => type.id === fabricId);
  const rollCount = parseInt(rolls, 10) || 0;
  const totalMeters = parseFloat(meters) || 0;
  const perRoll = rollCount > 0 && totalMeters > 0 ? totalMeters / rollCount : null;

  const submit = () => {
    if (!fabricId) return setError('Choose which fabric arrived.');
    if (totalMeters <= 0) return setError('Enter the metres received.');

    onSubmit({
      fabric_type_id: fabricId,
      delivery_date: date,
      rolls: rollCount,
      meters: totalMeters,
      supplier: supplier.trim() || null,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold heading-bold">Record Delivery</h2>
              <p className="text-white/80 text-sm">Rolls received into stock</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/15 rounded-lg p-1.5 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Fabric <span className="text-(--dominant-red)">*</span>
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 mt-1.5 justify-between bg-white border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-normal cursor-pointer"
                >
                  <span className={chosen ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {fabricLabel(chosen) || 'Select a fabric'}
                  </span>
                  <span className="text-gray-400">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                {fabricTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    onSelect={() => { setFabricId(type.id); setError(''); }}
                    className="cursor-pointer"
                  >
                    {fabricLabel(type)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Delivered on <span className="text-(--dominant-red)">*</span>
            </label>
            <CustomCalendar
              value={date}
              onChange={(picked) => setDate(toIsoDate(picked))}
              placeholder="Select delivery date"
              className="mt-1.5"
              triggerClassName="py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Total metres <span className="text-(--dominant-red)">*</span>
              </label>
              <div className="relative mt-1.5">
                <Input
                  type="number" min="0" step="0.01"
                  value={meters}
                  onChange={(e) => { setMeters(e.target.value); setError(''); }}
                  placeholder="0"
                  className={`${inputClass} pr-8 text-right font-semibold`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">m</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Rolls</label>
              <Input
                type="number" min="0" step="1"
                value={rolls}
                onChange={(e) => setRolls(e.target.value)}
                placeholder="0"
                className={`${inputClass} mt-1.5 text-right font-semibold`}
              />
            </div>
          </div>

          {perRoll && (
            <p className="text-xs text-gray-500 -mt-1">
              That is about <b className="text-gray-700">{perRoll.toFixed(2)} m per roll</b> — used to show
              what is left in rolls.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Supplier</label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Cebu Textile"
                className={`${inputClass} mt-1.5`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">D.R. / Invoice</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. DR-10482"
                className={`${inputClass} mt-1.5`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. 1st semester allocation"
              className="mt-1.5 w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button
            onClick={submit}
            disabled={isSaving}
            className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[150px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to stock'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default FabricDeliveryModal;
