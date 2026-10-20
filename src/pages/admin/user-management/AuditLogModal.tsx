import React, { useState } from 'react';
import { History, Search, Shield, User, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { AuditLogEntry } from '../../../types';
import { Button } from '../../../components/common/Button';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, logs }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      (l.targetEmail && l.targetEmail.toLowerCase().includes(search.toLowerCase())) ||
      (l.targetUid && l.targetUid.toLowerCase().includes(search.toLowerCase()))
  );

  const getActionColor = (action: string) => {
    if (action.includes('REVOKE') || action.includes('SUSPEND') || action.includes('CANCEL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('INVITATION') || action.includes('CREATED')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('ASSIGNED') || action.includes('VERIF') || action.includes('ACCEPT')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-juw-navy-900" />
          <span>Administrative Security Audit Trail</span>
        </div>
      }
      maxWidth="4xl"
    >
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Filter by action, actor email, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <span className="text-xs text-slate-500 font-semibold text-right">
            Showing {filteredLogs.length} of {logs.length} logged events
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No audit records matching your search filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-800">
                          by {log.actorEmail || 'System'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {log.actorRole}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        {log.targetEmail && (
                          <span>
                            Target:{' '}
                            <strong className="text-slate-800 font-medium">
                              {log.targetEmail}
                            </strong>{' '}
                          </span>
                        )}
                        {log.targetUid && (
                          <span className="font-mono text-[10px] text-slate-400">
                            ({log.targetUid})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="p-1 hover:bg-slate-200 rounded-md text-slate-500 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && log.details && (
                    <div className="mt-2.5 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
