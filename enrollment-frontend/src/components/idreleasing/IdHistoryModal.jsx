import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';

import ModalShell from './ModalShell';
import { CARD_REASON, CARD_STATUS, formatDate, peso } from './constants';

/** Every card a student has held, newest first, grouped by school year. */
const IdHistoryModal = ({ student, onClose }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    enrollmentAPI.idReleasing
      .history(student.id)
      .then((response) => {
        if (!cancelled) setCards(response.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load this history.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [student.id]);

  const years = [...new Set(cards.map((card) => card.school_year))];

  return (
    <ModalShell
      title="ID history"
      subtitle={`${student.name} · ${student.student_id_number}`}
      icon={History}
      tone="bg-blue-100 text-blue-600"
      onClose={onClose}
      width="max-w-2xl"
    >
      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 py-6 text-center">{error}</p>
      ) : cards.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">
          No ID has been issued to this student yet.
        </p>
      ) : (
        <div className="space-y-5">
          {years.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold text-gray-700">{year}</h3>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">
                  {cards.filter((card) => card.school_year === year).length} card(s)
                </span>
              </div>

              <div className="space-y-2">
                {cards
                  .filter((card) => card.school_year === year)
                  .map((card) => {
                    const look = CARD_STATUS[card.status] ?? CARD_STATUS.pending;

                    return (
                      <div key={card.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/60">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800">{card.copy_label}</span>
                            <Badge className={`${look.tone} border text-[11px]`}>{look.label}</Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {CARD_REASON[card.reason] ?? card.reason}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs">
                          <div>
                            <span className="text-gray-400 block">Printed</span>
                            <span className="text-gray-800">{formatDate(card.printed_at)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Released</span>
                            <span className="text-gray-800">{formatDate(card.released_at)}</span>
                          </div>
                          {card.reported_lost_at && (
                            <div>
                              <span className="text-gray-400 block">Reported lost</span>
                              <span className="text-red-600 font-medium">{formatDate(card.reported_lost_at)}</span>
                            </div>
                          )}
                          {card.fee ? (
                            <div>
                              <span className="text-gray-400 block">Fee</span>
                              <span className="text-gray-800">
                                {peso(card.fee)}
                                {card.or_number ? ` · ${card.or_number}` : ''}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {card.supplies?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Issued with:{' '}
                            {card.supplies.map((supply) => `${supply.quantity} × ${supply.name}`).join(', ')}
                          </p>
                        )}

                        {(card.received_by || card.released_by_name) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {card.received_by ? `Received by ${card.received_by}` : ''}
                            {card.received_by && card.released_by_name ? ' · ' : ''}
                            {card.released_by_name ? `Released by ${card.released_by_name}` : ''}
                          </p>
                        )}

                        {card.remarks && (
                          <p className="text-xs text-gray-600 mt-1 italic">“{card.remarks}”</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
};

export default IdHistoryModal;
