"use client";

import { useEffect, useState } from "react";

type MatchData = string[];
type MatchDictionary = {
  [url: string]: MatchData;
};

export default function Dashboard() {
  const [filteredRecords, setFilteredRecords] = useState<MatchDictionary>({});
  const [referenceKey, setReferenceKey] = useState<MatchDictionary>({});
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [hideOldGames, setHideOldGames] = useState(true);

   const convertToLocalTime = (estTime: string): string => {
        if (!estTime || !/^\d{1,2}:\d{2} (AM|PM)$/i.test(estTime)) return "—";

        const [time, period] = estTime.split(" ");
        const [hour, minute] = time.split(":").map(Number);
        const hours24 = period === "PM" && hour !== 12 ? hour + 12 : hour % 12;

        const now = new Date(); // today's date
        const dateInNY = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hours24,
            minute
        );

        // Format from New York time to user's local time
        return new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeZoneName: "short"
        }).format(
            new Date(
            dateInNY.toLocaleString("en-US", {
                timeZone: "America/New_York"
            })
            )
        );
        };


  useEffect(() => {
    Promise.all([
      fetch("/Records").then((res) => res.text()),
      fetch("/Reference_Key").then((res) => res.text()),
    ])
      .then(([recordsText, refText]) => {
        const records: MatchDictionary = JSON.parse(recordsText);
        const reference: MatchDictionary = JSON.parse(refText);

        const filtered: MatchDictionary = {};
        for (const key in records) {
          const isInReference = reference.hasOwnProperty(key);
          const startsWithOver = records[key]?.[0] === "Over";
          if (isInReference && startsWithOver) {
            filtered[key] = records[key];
          }
        }

        setFilteredRecords(filtered);
        setReferenceKey(reference);
      })
      .catch(console.error);
  }, []);

const leagueOptions = Array.from(
  new Set(Object.keys(filteredRecords).map((key) => referenceKey[key]?.[2]))
).filter(Boolean);

return (
  <div className="p-6">
    <div className="bg-gray-900 p-6 mb-6 rounded shadow-md text-gray-100">
  <h1 className="text-2xl font-bold mb-2">Nebula — A First Half Goal Predictive Model</h1>
  <p className="mb-4">
    Nebula was our flagship 2024 predictive model and has been consistently delivering strong results, helping bettors lock in profitable plays early. Whether pregame or live, strategic entry points make all the difference.
  </p>

  <h2 className="text-xl font-semibold mt-4 mb-1">Pregame Application</h2>
  <p className="mb-3">
    Focus on goal-before-30 or goal-before-40-minute markets. These are available on DraftKings (goal before 30), Bet365, BetMGM, and Caesars.
    About <strong>80%</strong> of games with a first-half goal see it scored before the 30-minute mark — making this a strong angle for pregame plays.
  </p>

  <h2 className="text-xl font-semibold mt-4 mb-1">Live Application</h2>
  <p className="mb-3">
    Target Over 0.5 First Half Goals for in-game wagers. Entering the market before the 15-minute mark leverages early scoring tendencies effectively.
  </p>

  <h2 className="text-xl font-semibold mt-4 mb-1">The Martingale Strategy</h2>
  <p className="mb-1"><strong>Bankroll:</strong> 40–50 unit accounts provide the ideal cushion.</p>
  <p className="mb-1"><strong>Wagering:</strong> Each new bet aims to recover losses +1 unit (e.g., lose a $1.30 bet? The next aims to profit $2.30).</p>
  <p><strong>Risk Management:</strong> Some users set personal caps (like stopping after two consecutive losses) to reduce drawdowns.</p>
</div>
<p className="mt-4 italic text-sm text-gray-400">
  We’re continuing to improve the UI experience of this app — but above all, we wanted to prioritize getting the predictive data into your hands first.
</p>

    <select
      className="mb-4 p-2 border bg-gray-800 text-white"
      value={selectedLeague}
      onChange={(e) => setSelectedLeague(e.target.value)}
    >
      <option value="">All Leagues</option>
      {leagueOptions.map((league) => (
        <option key={league} value={league}>
          {league}
        </option>
      ))}
    </select>

    <button
      onClick={() => setHideOldGames((prev) => !prev)}
      className={`mb-4 ml-2 p-2 border rounded text-white ${
        hideOldGames
          ? "bg-green-700 hover:bg-green-800"
          : "bg-gray-600 hover:bg-gray-700"
      }`}
    >
      {hideOldGames ? "Hiding old games (ON)" : "Showing all games (OFF)"}
    </button>

    <ul className="text-sm text-gray-200 bg-gray-800 p-4 rounded max-h-[500px] overflow-y-scroll">
      {Object.entries(filteredRecords)
        .filter(([url]) => {
          const league = referenceKey[url]?.[2];
          const startTime = referenceKey[url]?.[3];

          if (selectedLeague && league !== selectedLeague) return false;

          if (hideOldGames && startTime) {
            const [time, period] = startTime.split(" ");
            const [h, m] = time.split(":").map(Number);
            const hour = period === "PM" && h !== 12 ? h + 12 : h % 12;

            const matchDate = new Date();
            matchDate.setHours(hour, m, 0, 0);

            const now = new Date();
            const elapsed = (now.getTime() - matchDate.getTime()) / 60000;
            if (elapsed > 45) return false;
          }

          return true;
        })
        .map(([url, stats], i) => {
          const ref = referenceKey[url] ?? [];
          const estTime = ref[3];
          const league = ref[2];
          const localTime = convertToLocalTime(estTime);

          return (
            <li key={i} className="mb-4">
              <span className="text-xs block">
                Teams: {stats.at(-2)} vs. {stats.at(-1)}
              </span>
              <span className="text-xs block">League: {league ?? "—"}</span>
              <span className="text-xs block">Start Time: {localTime}</span>
            </li>
          );
        })}
    </ul>
  </div>
);
}
