import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Trophy, DollarSign, Play, RotateCcw, ChevronLeft, ChevronRight, Save } from 'lucide-react';

const STORAGE_KEY = 'beast-games-data';

const BeastGamesTracker = () => {
  // Load initial state from localStorage
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
    return null;
  };

  const savedData = loadSavedData();

  const [phase, setPhase] = useState(savedData?.phase || 'setup');
  const [contestants, setContestants] = useState(savedData?.contestants || []);
  const [availableContestants, setAvailableContestants] = useState(savedData?.availableContestants || []);
  const [team1Name, setTeam1Name] = useState(savedData?.team1Name || 'Jesse');
  const [team2Name, setTeam2Name] = useState(savedData?.team2Name || 'Isabell');
  const [currentEpisode, setCurrentEpisode] = useState(savedData?.currentEpisode || 1);
  const [draftTurn, setDraftTurn] = useState(savedData?.draftTurn || 1);
  const [contestantPool, setContestantPool] = useState('');

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      phase,
      contestants,
      availableContestants,
      team1Name,
      team2Name,
      currentEpisode,
      draftTurn
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [phase, contestants, availableContestants, team1Name, team2Name, currentEpisode, draftTurn]);

  const resetApp = () => {
    if (confirm('Are you sure? This will reset all data including drafted teams and scores.')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const startDraft = () => {
    if (!team1Name.trim() || !team2Name.trim()) {
      alert('Please enter names for both teams');
      return;
    }
    if (availableContestants.length === 0) {
      alert('Please add contestants to the draft pool');
      return;
    }
    setPhase('draft');
    setDraftTurn(1);
  };

  const startScoring = () => {
    if (contestants.length === 0) {
      alert('Please draft some contestants first');
      return;
    }
    setPhase('scoring');
  };

  const addToDraftPool = () => {
    const names = contestantPool.split('\n').filter(n => n.trim());
    const newContestants = names.map(name => ({
      id: Date.now() + Math.random(),
      name: name.trim(),
      drafted: false
    }));
    setAvailableContestants([...availableContestants, ...newContestants]);
    setContestantPool('');
  };

  const draftContestant = (contestantId, team) => {
    const contestant = availableContestants.find(c => c.id === contestantId);
    if (!contestant) return;

    // Add to team
    setContestants([...contestants, {
      id: contestantId,
      name: contestant.name,
      team: team,
      active: true,
      scores: []
    }]);

    // Remove from available pool
    setAvailableContestants(availableContestants.filter(c => c.id !== contestantId));

    // Alternate turns
    setDraftTurn(draftTurn === 1 ? 2 : 1);
  };

  const addScore = (contestantId, type, value, episode) => {
    setContestants(contestants.map(c => {
      if (c.id === contestantId) {
        const newScores = [...c.scores];
        const episodeIndex = newScores.findIndex(s => s.episode === episode);
        
        if (episodeIndex >= 0) {
          newScores[episodeIndex].items.push({ type, value });
        } else {
          newScores.push({ episode, items: [{ type, value }] });
        }
        
        return { ...c, scores: newScores };
      }
      return c;
    }));
  };

  const eliminateContestant = (id) => {
    setContestants(contestants.map(c => 
      c.id === id ? { ...c, active: false } : c
    ));
    addScore(id, 'Eliminated', -10, currentEpisode);
  };

  const calculateTotal = (contestant) => {
    return contestant.scores.reduce((total, ep) => 
      total + ep.items.reduce((sum, item) => sum + item.value, 0), 0
    );
  };

  const getTeamTotal = (team) => {
    return contestants
      .filter(c => c.team === team)
      .reduce((sum, c) => sum + calculateTotal(c), 0);
  };

  const QuickScore = ({ contestant }) => {
    const [showMenu, setShowMenu] = useState(false);

    const quickActions = [
      { label: 'Survived Episode', value: 5, type: 'Survived' },
      { label: 'Won Individual Game', value: 15, type: 'Individual Win' },
      { label: 'Won Team Game', value: 10, type: 'Team Win' },
      { label: 'Gave Up Money', value: 15, type: 'Gave Up Money' },
      { label: 'Risky Deal', value: 10, type: 'Risky Deal' },
      { label: 'Caused Elimination', value: 10, type: 'Caused Elim' },
      { label: 'Last in Challenge', value: 10, type: 'Last Standing' },
      { label: 'Highest Cash Prize', value: 10, type: 'Highest Cash' },
      { label: 'Viral Moment', value: 5, type: 'Viral Moment' },
    ];

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Score
        </button>
        {showMenu && (
          <div className="absolute z-20 mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-xl w-64 max-h-96 overflow-y-auto">
            <div className="p-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addScore(contestant.id, action.type, action.value, currentEpisode);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-purple-50 rounded-lg text-sm transition mb-1 flex justify-between items-center"
                >
                  <span className="text-gray-700">{action.label}</span>
                  <span className="font-bold text-green-600">+{action.value}</span>
                </button>
              ))}
            </div>
            <div className="border-t-2 border-purple-100 p-3 bg-purple-50">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Custom Money Won</label>
              <input
                type="number"
                placeholder="Enter amount..."
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    const money = parseInt(e.target.value);
                    const points = Math.floor(money / 5000);
                    addScore(contestant.id, `Won $${money.toLocaleString()}`, points, currentEpisode);
                    setShowMenu(false);
                    e.target.value = '';
                  }
                }}
              />
              <div className="text-xs text-purple-600 mt-2 font-medium">Press Enter • $5k = 1 pt</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const team1Contestants = contestants.filter(c => c.team === 1);
  const team2Contestants = contestants.filter(c => c.team === 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6 rounded-xl shadow-xl mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Trophy className="w-8 h-8 md:w-10 md:h-10" />
                Fantasy Beast Games
              </h1>
              <p className="text-purple-100 text-sm md:text-base">
                {phase === 'setup' && 'Setup your teams and contestant pool'}
                {phase === 'draft' && 'Draft your teams - turn-based selection'}
                {phase === 'scoring' && `Episode ${currentEpisode} - Track scores and eliminations`}
              </p>
            </div>
            <div className="flex gap-2">
              {phase === 'scoring' && (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <button
                    onClick={() => setCurrentEpisode(Math.max(1, currentEpisode - 1))}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-bold min-w-[80px] text-center">EP {currentEpisode}</span>
                  <button
                    onClick={() => setCurrentEpisode(currentEpisode + 1)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              <button
                onClick={resetApp}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition"
                title="Reset everything"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Team Setup
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Team 1 Name:</label>
                  <input
                    type="text"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition"
                    placeholder="Enter team 1 name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Team 2 Name:</label>
                  <input
                    type="text"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                    placeholder="Enter team 2 name..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-purple-600" />
                Contestant Pool
              </h2>
              <p className="text-gray-600 mb-4">
                Add all contestants who will be available for drafting. You can add them one per line.
              </p>
              <textarea
                value={contestantPool}
                onChange={(e) => setContestantPool(e.target.value)}
                placeholder="Enter contestant names (one per line)&#10;Example:&#10;John Doe&#10;Jane Smith&#10;Mike Johnson"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition mb-4 h-40 font-mono text-sm"
              />
              <button
                onClick={addToDraftPool}
                disabled={!contestantPool.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Pool
              </button>

              {availableContestants.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-gray-700">
                    Draft Pool ({availableContestants.length} contestants)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableContestants.map(c => (
                      <div key={c.id} className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-gray-700">
                        {c.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {availableContestants.length > 0 && (
              <button
                onClick={startDraft}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition shadow-lg text-lg font-bold flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                Start Draft
              </button>
            )}
          </div>
        )}

        {/* Draft Phase */}
        {phase === 'draft' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border-4 border-dashed border-purple-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {draftTurn === 1 ? (
                    <span className="text-green-600">{team1Name}'s Pick</span>
                  ) : (
                    <span className="text-blue-600">{team2Name}'s Pick</span>
                  )}
                </h2>
                <p className="text-gray-600">Select a contestant from the pool below</p>
              </div>

              {availableContestants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableContestants.map(contestant => (
                    <button
                      key={contestant.id}
                      onClick={() => draftContestant(contestant.id, draftTurn)}
                      className={`p-4 rounded-lg border-2 transition transform hover:scale-105 ${
                        draftTurn === 1
                          ? 'border-green-300 hover:bg-green-50 hover:border-green-500'
                          : 'border-blue-300 hover:bg-blue-50 hover:border-blue-500'
                      }`}
                    >
                      <span className="font-semibold text-lg">{contestant.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xl font-semibold mb-4 text-green-600">Draft Complete!</p>
                  <button
                    onClick={startScoring}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition shadow-lg text-lg font-bold flex items-center justify-center gap-3 mx-auto"
                  >
                    <Play className="w-6 h-6" />
                    Start Scoring
                  </button>
                </div>
              )}
            </div>

            {/* Current Teams Preview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold text-green-700 mb-4">{team1Name}</h3>
                <div className="space-y-2">
                  {team1Contestants.length > 0 ? (
                    team1Contestants.map(c => (
                      <div key={c.id} className="bg-white px-4 py-2 rounded-lg shadow-sm">
                        {c.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No picks yet</p>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold text-blue-700 mb-4">{team2Name}</h3>
                <div className="space-y-2">
                  {team2Contestants.length > 0 ? (
                    team2Contestants.map(c => (
                      <div key={c.id} className="bg-white px-4 py-2 rounded-lg shadow-sm">
                        {c.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No picks yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scoring Phase */}
        {phase === 'scoring' && (
          <div className="space-y-6">
            {/* Team Score Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-2">{team1Name}</h2>
                <p className="text-5xl font-black">{getTeamTotal(1)}</p>
                <p className="text-green-100 text-sm mt-1">Total Points</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <p className="text-green-100">Active</p>
                    <p className="text-xl font-bold">{team1Contestants.filter(c => c.active).length}</p>
                  </div>
                  <div>
                    <p className="text-green-100">Eliminated</p>
                    <p className="text-xl font-bold">{team1Contestants.filter(c => !c.active).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-2">{team2Name}</h2>
                <p className="text-5xl font-black">{getTeamTotal(2)}</p>
                <p className="text-blue-100 text-sm mt-1">Total Points</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <p className="text-blue-100">Active</p>
                    <p className="text-xl font-bold">{team2Contestants.filter(c => c.active).length}</p>
                  </div>
                  <div>
                    <p className="text-blue-100">Eliminated</p>
                    <p className="text-xl font-bold">{team2Contestants.filter(c => !c.active).length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contestant Cards */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  {team1Name} Contestants
                </h3>
                {team1Contestants.map(contestant => (
                  <div
                    key={contestant.id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden transition transform hover:shadow-lg ${
                      !contestant.active ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-gray-800">{contestant.name}</span>
                            {!contestant.active && (
                              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold">
                                ELIMINATED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                              {calculateTotal(contestant)} pts
                            </span>
                            {contestant.scores.length > 0 && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {contestant.scores.flatMap(ep => ep.items).length} actions
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {contestant.active && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <QuickScore contestant={contestant} />
                          <button
                            onClick={() => eliminateContestant(contestant.id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminate
                          </button>
                        </div>
                      )}

                      {contestant.scores.length > 0 && (
                        <div className="border-t pt-3">
                          <details className="group">
                            <summary className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-800 flex items-center gap-1">
                              <span>Score History</span>
                              <span className="text-gray-400 group-open:rotate-90 transition">▶</span>
                            </summary>
                            <div className="mt-2 space-y-1">
                              {contestant.scores.flatMap(ep =>
                                ep.items.map((item, idx) => (
                                  <div
                                    key={`${ep.episode}-${idx}`}
                                    className="text-xs bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center"
                                  >
                                    <span className="text-gray-700">
                                      <span className="font-semibold text-purple-600">Ep{ep.episode}:</span> {item.type}
                                    </span>
                                    <span className={`font-bold ${item.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {item.value > 0 ? '+' : ''}{item.value}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Team 2 */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  {team2Name} Contestants
                </h3>
                {team2Contestants.map(contestant => (
                  <div
                    key={contestant.id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden transition transform hover:shadow-lg ${
                      !contestant.active ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-gray-800">{contestant.name}</span>
                            {!contestant.active && (
                              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold">
                                ELIMINATED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-semibold text-blue-600">
                              {calculateTotal(contestant)} pts
                            </span>
                            {contestant.scores.length > 0 && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {contestant.scores.flatMap(ep => ep.items).length} actions
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {contestant.active && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <QuickScore contestant={contestant} />
                          <button
                            onClick={() => eliminateContestant(contestant.id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminate
                          </button>
                        </div>
                      )}

                      {contestant.scores.length > 0 && (
                        <div className="border-t pt-3">
                          <details className="group">
                            <summary className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-800 flex items-center gap-1">
                              <span>Score History</span>
                              <span className="text-gray-400 group-open:rotate-90 transition">▶</span>
                            </summary>
                            <div className="mt-2 space-y-1">
                              {contestant.scores.flatMap(ep =>
                                ep.items.map((item, idx) => (
                                  <div
                                    key={`${ep.episode}-${idx}`}
                                    className="text-xs bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center"
                                  >
                                    <span className="text-gray-700">
                                      <span className="font-semibold text-purple-600">Ep{ep.episode}:</span> {item.type}
                                    </span>
                                    <span className={`font-bold ${item.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {item.value > 0 ? '+' : ''}{item.value}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scoring Reference - Only show in scoring phase */}
        {phase === 'scoring' && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl shadow-lg border border-purple-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
              Scoring Reference
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold mb-3 text-purple-700 text-base">Core Performance</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span>Survives episode</span>
                    <span className="font-semibold text-green-600">+5</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Individual win</span>
                    <span className="font-semibold text-green-600">+15</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Team win</span>
                    <span className="font-semibold text-green-600">+10</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Eliminated</span>
                    <span className="font-semibold text-red-600">-10</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold mb-3 text-purple-700 text-base">Money & Bonuses</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span>$5,000 won</span>
                    <span className="font-semibold text-green-600">+1 pt</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Gives up money</span>
                    <span className="font-semibold text-green-600">+15</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Highest cash</span>
                    <span className="font-semibold text-green-600">+10</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Risky deal</span>
                    <span className="font-semibold text-green-600">+10</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold mb-3 text-purple-700 text-base">Endgame</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span>Winner</span>
                    <span className="font-semibold text-green-600">+50</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Final 3</span>
                    <span className="font-semibold text-green-600">+25</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Final 5</span>
                    <span className="font-semibold text-green-600">+15</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeastGamesTracker;