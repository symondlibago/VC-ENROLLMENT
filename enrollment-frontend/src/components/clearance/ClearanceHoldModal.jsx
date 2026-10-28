import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Shown when a submitted grade had to be held back.
 *
 * The grade is saved either way — the point of the message is that the INC
 * is not the instructor's to resolve, and that they will not have to enter
 * the mark a second time once the clearance is signed.
 */
const ClearanceHoldModal = ({ hold, onClose }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
    >
      <div className="p-6 pb-4 flex flex-col items-center text-center">
        <div className="bg-amber-100 p-3 rounded-full mb-4">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{hold.title}</h2>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">{hold.message}</p>
      </div>

      {hold.students?.length > 0 && (
        <div className="px-6 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Recorded as INC
          </p>
          <ul className="space-y-1.5 pb-2">
            {hold.students.map((name) => (
              <li
                key={name}
                className="text-sm text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-6 pt-4">
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          Nothing further is needed from you. The clearance is signed off by the offices on the
          student's clearance form, and the grade returns to its real result on its own.
        </p>
        <Button className="w-full gradient-primary text-white h-11 cursor-pointer" onClick={onClose}>
          <Check className="w-4 h-4 mr-2" /> Understood
        </Button>
      </div>
    </motion.div>
  </div>
);

export default ClearanceHoldModal;
