'use client';
import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STAGES = [
  { key: 'New',         label: 'New',         color: '#6366f1', bg: 'bg-blue-500/10',   text: 'text-blue-400'   },
  { key: 'Contacted',   label: 'Contacted',   color: '#a855f7', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { key: 'Qualified',   label: 'Qualified',   color: '#f59e0b', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  { key: 'Proposal',    label: 'Proposal',    color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  { key: 'Closed Won',  label: 'Closed Won',  color: '#10b981', bg: 'bg-green-500/10',  text: 'text-green-400'  },
  { key: 'Closed Lost', label: 'Closed Lost', color: '#ef4444', bg: 'bg-red-500/10',    text: 'text-red-400'    },
];

function ScoreDot({ score }) {
  const c = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return <span className="text-[10px] text-muted flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c }} />{score}</span>;
}

function LeadCard({ lead, index }) {
  const [open, setOpen] = useState(false);
  return (
    <Draggable draggableId={lead._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-surface-100 border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? 'shadow-2xl shadow-primary/20 border-primary/30' : 'hover:border-border-light'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light text-xs font-black shrink-0">
                {lead.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{lead.name}</p>
                {lead.company && <p className="text-[10px] text-muted truncate">{lead.company}</p>}
              </div>
            </div>
            <ScoreDot score={lead.score} />
          </div>

          {lead.phone && (
            <div className="mt-2 flex gap-1.5">
              <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                className="flex-1 text-center text-[10px] py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                Call
              </a>
              <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="flex-1 text-center text-[10px] py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                WA
              </a>
            </div>
          )}

          {lead.nextFollowUp && (
            <p className="mt-1.5 text-[10px] text-orange-400">
              Follow-up: {new Date(lead.nextFollowUp).toLocaleDateString()}
            </p>
          )}

          <p className="mt-1.5 text-[10px] text-muted">
            {lead.source} · {new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </Draggable>
  );
}

function Column({ stage, leads }) {
  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      {/* Column header */}
      <div className={`px-3 py-2 rounded-xl mb-2 flex items-center justify-between ${stage.bg}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
          <span className={`text-xs font-bold ${stage.text}`}>{stage.label}</span>
        </div>
        <span className={`text-xs font-black ${stage.text}`}>{leads.length}</span>
      </div>

      {/* Cards */}
      <Droppable droppableId={stage.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 min-h-[120px] rounded-xl p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
          >
            {leads.map((lead, index) => (
              <LeadCard key={lead._id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function PipelinePage() {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/leads?limit=200')
      .then(r => r.json())
      .then(d => { if (d.success) setAllLeads(d.leads); })
      .finally(() => setLoading(false));
  }, []);

  const byStage = (stageKey) => allLeads.filter(l => l.stage === stageKey);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;

    // Optimistic update
    setAllLeads(prev => prev.map(l => l._id === draggableId ? { ...l, stage: newStage } : l));

    // Persist
    await fetch(`/api/leads/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
  };

  if (loading) return (
    <div className="p-6 flex gap-4 overflow-x-auto">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton min-w-[220px] h-64 rounded-2xl shrink-0" />)}
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100">Pipeline</h1>
          <p className="text-muted text-sm">{allLeads.length} total leads · drag to move stages</p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STAGES.map(stage => (
            <Column key={stage.key} stage={stage} leads={byStage(stage.key)} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
