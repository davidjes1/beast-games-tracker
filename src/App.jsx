import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Trophy,
  DollarSign,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Undo2
} from 'lucide-react';

const STORAGE_KEY = 'beast-games-data';

/* ===========================
   Centralized Scoring Rules
=========================== */
const SCORING_RULES = [
  { key: 'SURVIVED', label: 'Survived Episode', value: 5 },
  { key: 'INDIVIDUAL_WIN', label: 'Won Individual Game', value: 15 },
  { key: 'TEAM_WIN', label: 'Won Team Game', value: 10 },
  { key: 'GAVE_UP_MONEY', label: 'Gave Up Money', value: 15 },
  { key: 'RISKY_DEAL', label: 'Risky Deal', value: 10 },
  { key: 'CAUSED_ELIM', label: 'Caused Elimination', value: 10 },
  { key: 'LAST_STANDING', label: 'Last Standing', value: 10 },
  { key: 'HIGHEST_CASH', label: 'Highest Cash Prize', value: 10 }
];

/* ===========================
   Helpers
=========================== */
const uid = () => crypto.randomUUID();

const hasEpisodeScore = (contestant, episode, type) =>
  contestant.scores
    .find(s => s.episode === episode)
    ?.items.some(i => i.type === type);

/* ===========================
   App
=========================== */
export default function App() {
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  };

  const saved = load();

  const [phase, setPhase] = useState(saved?.phase || 'setup');
  const [contestants, setContestants] = useState(saved?.contestants || []);
  const [available, setAvailable] = useState(saved?.available || []);
  const [team1, setTeam1] = useState(saved?.team1 || 'Jesse');
  const [team2, setTeam2] = useState(saved?.team2 || 'Isabell');
  const [episode, setEpisode] = useState(saved?.episode || 1);
  const [draftTurn, setDraftTurn] = useState(saved?.draftTurn || 1);
  const [poolText, setPoolText] = useState('');
  const [history, setHistory] = useState([]);

  /* ===========================
     Persistence
  =========================== */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        phase,
        contestants,
        available,
        team1,
        team2,
        episode,
        draftTurn
      })
    );
  }, [phase, contestants, available, team1, team2, episode, draftTurn]);

  /* ===========================
     History / Undo
  =========================== */
  const commit = updater => {
    setHistory(h => [...h, contestants]);
    setContestants(updater);
  };

  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setContestants(prev);
    setHistory(h => h.slice(0, -1));
  };

  /* ===========================
     Draft
  =========================== */
  const addPool = () => {
    const names = poolText
      .split('\n')
      .map(n => n.trim())
      .filter(Boolean);

    setAvailable(a => [
      ...a,
      ...names.map(name => ({ id: uid(), name }))
    ]);
    setPoolText('');
  };

  const draft = (id, team) => {
    const pick = available.find(c => c.id === id);
    if (!pick) return;

    setAvailable(a => a.filter(c => c.id !== id));
    setContestants(c => [
      ...c,
      { id, name: pick.name, team, active: true, scores: [] }
    ]);
    setDraftTurn(t => (t === 1 ? 2 : 1));
  };

  /* ===========================
     Scoring
  =========================== */
  const addScore = (id, rule, valueOverride) => {
    commit(contestants.map(c => {
      if (c.id !== id) return c;

      if (rule && hasEpisodeScore(c, episode, rule.label)) {
        alert('That score already exists for this episode.');
        return c;
      }

      const score = {
        type: rule?.label || 'Custom',
        value: valueOverride ?? rule.value
      };

      const ep = c.scores.find(s => s.episode === episode);
      if (ep) ep.items.push(score);
      else c.scores.push({ episode, items: [score] });

      return { ...c };
    }));
  };

  const toggleEliminate = id => {
    commit(contestants.map(c => {
      if (c.id !== id) return c;

      const eliminated = c.active;
      if (eliminated) {
        addScore(id, null, -10);
      }

      return { ...c, active: !c.active };
    }));
  };

  const total = c =>
    c.scores.flatMap(e => e.items).reduce((s, i) => s + i.value, 0);

  const teamTotal = t =>
    contestants.filter(c => c.team === t).reduce((s, c) => s + total(c), 0);

  const t1 = contestants.filter(c => c.team === 1);
  const t2 = contestants.filter(c => c.team === 2);

  /* ===========================
     QuickScore
  =========================== */
  const QuickScore = ({ contestant }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const close = e => ref.current && !ref.current.contains(e.target) && setOpen(false);
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Score
        </button>

        {open && (
          <div className="absolute z-20 mt-2 bg-white rounded-xl shadow-xl w-64 p-2">
            {SCORING_RULES.map(r => (
              <button
                key={r.key}
                onClick={() => {
                  addScore(contestant.id, r);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-purple-50 flex justify-between text-sm"
              >
                <span>{r.label}</span>
                <span className="font-bold text-green-600">+{r.value}</span>
              </button>
            ))}
            <div className="p-2 border-t mt-2">
              <input
                type="number"
                placeholder="Money won ($)"
                className="w-full border rounded px-2 py-1 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value) {
                    const pts = Math.floor(+e.target.value / 5000);
                    addScore(
                      contestant.id,
                      { label: `Won $${(+e.target.value).toLocaleString()}` },
                      pts
                    );
                    setOpen(false);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ===========================
     UI
  =========================== */
  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-7xl mx-auto">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy /> Fantasy Beast Games
          </h1>
          {phase === 'scoring' && (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <button
                onClick={() => setEpisode(e => Math.max(1, e - 1))}
                className="p-1 hover:bg-white/20 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold min-w-[70px] text-center">
                EP {episode}
              </span>

              <button
                onClick={() => setEpisode(e => e + 1)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={undo}
                disabled={!history.length}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                          bg-white/20 hover:bg-white/30
                          disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo last action"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
            </div>
        )}

        </div>
      </header>

      {phase === 'setup' && (
        <div className="space-y-4">
          <input value={team1} onChange={e => setTeam1(e.target.value)} className="input" />
          <input value={team2} onChange={e => setTeam2(e.target.value)} className="input" />

          <textarea
            value={poolText}
            onChange={e => setPoolText(e.target.value)}
            className="w-full p-3 rounded border"
            placeholder="One contestant per line"
          />
          <button onClick={addPool} className="btn-primary">Add Pool</button>

          <button
            onClick={() => setPhase('draft')}
            className="btn-success w-full"
          >
            Start Draft
          </button>
        </div>
      )}

      {phase === 'draft' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-bold mb-2">
              {draftTurn === 1 ? team1 : team2} picking
            </h2>
            {available.map(c => (
              <button
                key={c.id}
                onClick={() => draft(c.id, draftTurn)}
                className="block w-full p-3 bg-white rounded mb-2"
              >
                {c.name}
              </button>
            ))}
          </div>
          <div>
            {!available.length && (
              <button
                onClick={() => setPhase('scoring')}
                className="btn-primary"
              >
                Start Scoring
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'scoring' && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="score-card green">{team1}: {teamTotal(1)}</div>
            <div className="score-card blue">{team2}: {teamTotal(2)}</div>
          </div>

          {[t1, t2].map((team, idx) => (
            <div key={idx}>
              <h2 className="font-bold mb-2">{idx === 0 ? team1 : team2}</h2>
              {team.map(c => (
                <div key={c.id} className="bg-white p-4 rounded mb-2">
                  <div className="flex justify-between">
                    <strong>{c.name}</strong>
                    <span>{total(c)} pts</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {c.active && <QuickScore contestant={c} />}
                    <button
                      onClick={() => toggleEliminate(c.id)}
                      className="text-sm text-red-600"
                    >
                      {c.active ? 'Eliminate' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
