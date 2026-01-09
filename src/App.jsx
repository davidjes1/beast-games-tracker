import React, { useState } from 'react';
import { Plus, Trash2, Users, Trophy, DollarSign } from 'lucide-react';

const BeastGamesTracker = () => {
  const [contestants, setContestants] = useState([]);
  const [team1Name, setTeam1Name] = useState('Jesse');
  const [team2Name, setTeam2Name] = useState('Isabell');
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [newContestant, setNewContestant] = useState('');

  const addContestant = (team) => {
    if (newContestant.trim()) {
      setContestants([...contestants, {
        id: Date.now(),
        name: newContestant.trim(),
        team: team,
        active: true,
        scores: []
      }]);
      setNewContestant('');
    }
  };

  const removeContestant = (id) => {
    setContestants(contestants.filter(c => c.id !== id));
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
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          +Score
        </button>
        {showMenu && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded shadow-lg w-48">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  addScore(contestant.id, action.type, action.value, currentEpisode);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                {action.label} (+{action.value})
              </button>
            ))}
            <div className="border-t border-gray-200 px-3 py-2">
              <input
                type="number"
                placeholder="Custom $"
                className="w-full px-2 py-1 border rounded text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    const money = parseInt(e.target.value);
                    const points = Math.floor(money / 5000);
                    addScore(contestant.id, `Won $${money}`, points, currentEpisode);
                    setShowMenu(false);
                    e.target.value = '';
                  }
                }}
              />
              <div className="text-xs text-gray-500 mt-1">$5k = 1 pt</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const team1Contestants = contestants.filter(c => c.team === 1);
  const team2Contestants = contestants.filter(c => c.team === 2);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            Fantasy Beast Games Tracker
          </h1>
          <div className="flex gap-4 items-center">
            <label className="text-sm">Episode:</label>
            <input
              type="number"
              value={currentEpisode}
              onChange={(e) => setCurrentEpisode(parseInt(e.target.value) || 1)}
              className="px-3 py-1 rounded text-black w-20"
              min="1"
            />
          </div>
        </div>

        {/* Team Setup */}
        {contestants.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Team Setup</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team 1 Name:</label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Team 2 Name:</label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Add Contestant */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Add Contestant
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newContestant}
              onChange={(e) => setNewContestant(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addContestant(1)}
              placeholder="Contestant name..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => addContestant(1)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {team1Name}
            </button>
            <button
              onClick={() => addContestant(2)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {team2Name}
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-6">
          {/* Team 1 */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-green-500 text-white p-4 rounded-t-lg">
              <h2 className="text-2xl font-bold">{team1Name}</h2>
              <p className="text-3xl font-bold mt-2">{getTeamTotal(1)} pts</p>
            </div>
            <div className="p-4">
              {team1Contestants.map(contestant => (
                <div key={contestant.id} className={`p-3 mb-2 border rounded ${!contestant.active ? 'bg-gray-100 opacity-60' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{contestant.name}</span>
                      {!contestant.active && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">OUT</span>}
                    </div>
                    <span className="font-bold text-lg">{calculateTotal(contestant)}</span>
                  </div>
                  {contestant.active && (
                    <div className="flex gap-2">
                      <QuickScore contestant={contestant} />
                      <button
                        onClick={() => eliminateContestant(contestant.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Eliminate
                      </button>
                      <button
                        onClick={() => removeContestant(contestant.id)}
                        className="px-2 py-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {contestant.scores.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {contestant.scores.flatMap(ep => 
                        ep.items.map((item, idx) => (
                          <span key={idx} className="inline-block mr-2 mb-1">
                            Ep{ep.episode}: {item.type} ({item.value > 0 ? '+' : ''}{item.value})
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-blue-500 text-white p-4 rounded-t-lg">
              <h2 className="text-2xl font-bold">{team2Name}</h2>
              <p className="text-3xl font-bold mt-2">{getTeamTotal(2)} pts</p>
            </div>
            <div className="p-4">
              {team2Contestants.map(contestant => (
                <div key={contestant.id} className={`p-3 mb-2 border rounded ${!contestant.active ? 'bg-gray-100 opacity-60' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{contestant.name}</span>
                      {!contestant.active && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">OUT</span>}
                    </div>
                    <span className="font-bold text-lg">{calculateTotal(contestant)}</span>
                  </div>
                  {contestant.active && (
                    <div className="flex gap-2">
                      <QuickScore contestant={contestant} />
                      <button
                        onClick={() => eliminateContestant(contestant.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Eliminate
                      </button>
                      <button
                        onClick={() => removeContestant(contestant.id)}
                        className="px-2 py-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {contestant.scores.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {contestant.scores.flatMap(ep => 
                        ep.items.map((item, idx) => (
                          <span key={idx} className="inline-block mr-2 mb-1">
                            Ep{ep.episode}: {item.type} ({item.value > 0 ? '+' : ''}{item.value})
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Reference */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold mb-4">Quick Reference</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Core Performance</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Survives episode: +5</li>
                <li>Individual win: +15</li>
                <li>Team win: +10</li>
                <li>Eliminated: -10</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Money & Bonuses</h3>
              <ul className="space-y-1 text-gray-700">
                <li>$5,000 won: +1 pt</li>
                <li>Gives up money: +15</li>
                <li>Highest cash: +10</li>
                <li>Risky deal: +10</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Endgame</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Winner: +50</li>
                <li>Final 3: +25</li>
                <li>Final 5: +15</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeastGamesTracker;