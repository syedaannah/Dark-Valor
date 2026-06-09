/*
================================================================
  players.js — Dark Valor: Arena
  Players data is embedded directly so cards ALWAYS display.
  Fetch API is used to refresh from players.json if available.
  Search, filter, flip animation, diamond badges all included.
================================================================
*/

// ── Embedded player data (always available, no server needed) ──
const FALLBACK_PLAYERS = [
  { "name": "Shang",     "game": "Dark Valor: Arena", "rank": "S+", "score": 9840, "faction": "Legion",   "role": "Iron Knight · Blade Commander",    "wins": 38, "image": "shang.png"     },
  { "name": "Azuma",     "game": "Dark Valor: Arena", "rank": "S",  "score": 9210, "faction": "Heralds",  "role": "Shadow Stalker · Spear Phantom",   "wins": 34, "image": "azuma.png"     },
  { "name": "Ironclad",  "game": "Dark Valor: Arena", "rank": "S",  "score": 8750, "faction": "Legion",   "role": "Fortress Knight · Unyielding Wall","wins": 31, "image": "ironclad.png"  },
  { "name": "King",      "game": "Dark Valor: Arena", "rank": "A+", "score": 8420, "faction": "Legion",   "role": "Dark Sovereign · Spiked Warlord",  "wins": 28, "image": "king.png"      },
  { "name": "Kate",      "game": "Dark Valor: Arena", "rank": "A+", "score": 7980, "faction": "Legion",   "role": "Silver Knight · Sword Sovereign",  "wins": 25, "image": "kate.png"      },
  { "name": "Serjan",    "game": "Dark Valor: Arena", "rank": "A",  "score": 7650, "faction": "Heralds",  "role": "Brawler Elite · Gauntlet Crusher",  "wins": 22, "image": "serjan.png"    },
  { "name": "Xiang",     "game": "Dark Valor: Arena", "rank": "A",  "score": 7310, "faction": "Legion",   "role": "War Brute · Iron Fist Ravager",    "wins": 19, "image": "xiang.png"     },
  { "name": "Kibo",      "game": "Dark Valor: Arena", "rank": "B+", "score": 6980, "faction": "Heralds",  "role": "Blade Dancer · Shadow Duelist",    "wins": 16, "image": "kibo.png"      },
  { "name": "Fireguard", "game": "Dark Valor: Arena", "rank": "B+", "score": 6700, "faction": "Infernal", "role": "Mech Juggernaut · Ember Warlord",  "wins": 14, "image": "fireguard.png" }
];

const STORAGE_KEY = "dv_players_cache";

// ── App state ──────────────────────────────────────────────
let allPlayers = [];
let searchQuery = "";
let selectedGame = "";
let selectedRank = "";

// ── Start app immediately with embedded/cached data ────────
(function bootstrap() {
    // 1. Try localStorage first (persists between page visits)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
        try { allPlayers = JSON.parse(cached); }
        catch (e) { allPlayers = FALLBACK_PLAYERS; }
    } else {
        // 2. Use embedded fallback — cards show instantly, no server needed
        allPlayers = FALLBACK_PLAYERS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allPlayers));
    }

    populateGameFilter(allPlayers);
    bindControls();
    applyFilters();   // <-- renders all 9 cards immediately

    // 3. Try to fetch players.json in background for any updates
    fetch("http://localhost:3000/players")
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
            if (!fresh || !fresh.length) return;
            allPlayers = fresh;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            populateGameFilter(fresh);
            applyFilters();
        })
        .catch(() => { /* silently ignore — fallback data already showing */ });
})();

// ── Populate game dropdown from data ───────────────────────
function populateGameFilter(players) {
    const select = document.getElementById("filterGame");
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">All Games</option>';
    [...new Set(players.map(p => p.game))].forEach(g => {
        const opt = document.createElement("option");
        opt.value = g; opt.textContent = g;
        select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
}

// ── Bind real-time event listeners ─────────────────────────
function bindControls() {
    const nameInput  = document.getElementById("searchName");
    const gameSelect = document.getElementById("filterGame");
    const rankSelect = document.getElementById("filterRank");
    const clearBtn   = document.getElementById("clearBtn");

    if (nameInput)  nameInput.addEventListener("input",  e => { searchQuery  = e.target.value.trim().toLowerCase(); applyFilters(); });
    if (gameSelect) gameSelect.addEventListener("change", e => { selectedGame = e.target.value; applyFilters(); });
    if (rankSelect) rankSelect.addEventListener("change", e => { selectedRank = e.target.value; applyFilters(); });
    if (clearBtn)   clearBtn.addEventListener("click", () => {
        searchQuery = ""; selectedGame = ""; selectedRank = "";
        if (nameInput)  nameInput.value  = "";
        if (gameSelect) gameSelect.value = "";
        if (rankSelect) rankSelect.value = "";
        applyFilters();
    });
}

// ── Filter + sort logic ─────────────────────────────────────
function applyFilters() {
    let result = [...allPlayers];

    if (searchQuery)  result = result.filter(p => p.name.toLowerCase().includes(searchQuery));
    if (selectedGame) result = result.filter(p => p.game === selectedGame);
    if (selectedRank) {
        result = result.filter(p => p.rank === selectedRank);
        result.sort((a, b) => b.score - a.score);   // top scored first within rank
    }

    updateResultsMeta(result.length);
    updatePills();
    displayPlayers(result);
}

// ── Active filter pills ─────────────────────────────────────
function updatePills() {
    const wrap = document.getElementById("activePills");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (searchQuery)  addPill(wrap, `Name: "${searchQuery}"`);
    if (selectedGame) addPill(wrap, `Game: ${selectedGame}`);
    if (selectedRank) addPill(wrap, `Rank: ${selectedRank}`);
}

function addPill(wrap, label) {
    const pill = document.createElement("div");
    pill.className = "filter-pill";
    pill.textContent = label;
    wrap.appendChild(pill);
}

// ── Results count ───────────────────────────────────────────
function updateResultsMeta(count) {
    const el = document.getElementById("resultsMeta");
    if (!el) return;
    const total = allPlayers.length;
    const clean = !searchQuery && !selectedGame && !selectedRank;
    el.innerHTML = clean
        ? `Showing all <span>${total}</span> warriors`
        : `<span>${count}</span> of ${total} warriors found`;
}

// ── Build card inner HTML ───────────────────────────────────
function buildCardHTML(p, pos) {
    const rankColors = {
        "S+": "#c9a227", "S": "#c9a227",
        "A+": "#e8230a", "A": "#e8230a",
        "B+": "#8a7a6a", "B": "#8a7a6a"
    };
    const rankColor    = rankColors[p.rank] || "#8a7a6a";
    const posClass     = pos === 1 ? "rank-1" : pos === 2 ? "rank-2" : pos === 3 ? "rank-3" : "";
    // Badge belongs to the globally top-ranked player, not filtered position
    const isTopPlayer  = allPlayers.length > 0 && p.name === allPlayers[0].name;
    const champBadge   = isTopPlayer ? '<div class="champ-badge">Champion</div>' : "";
    const diamondBadge = isTopPlayer
        ? `<div class="diamond-badge rank-1-gem"><div class="diamond-gem"></div><div class="badge-label">GOLD</div></div>`
        : "";

    return `<div class="card-inner">` +
                `<div class="card-rank ${posClass}">${pos}</div>` +
                diamondBadge +
                champBadge +
                `<div class="card-img">
                    <img src="${p.image}" alt="${p.name}" onerror="this.style.opacity='0.15'" />
                 </div>
                 <div class="card-body">
                     <div class="card-faction">${getFactionIcon(p.faction)} ${p.faction}</div>
                     <div class="card-name">${p.name}</div>
                     <div class="card-role">${p.role}</div>
                     <div class="card-game" style="font-size:11px;letter-spacing:2px;color:#8a7a6a;margin-bottom:10px;">${p.game}</div>
                     <div class="card-stats">
                         <div class="cs"><div class="cs-val">${p.score.toLocaleString()}</div><div class="cs-key">Power</div></div>
                         <div class="cs"><div class="cs-val">${p.wins}W</div><div class="cs-key">Wins</div></div>
                         <div class="cs"><div class="cs-val" style="color:${rankColor}">${p.rank}</div><div class="cs-key">Rank</div></div>
                     </div>
                 </div>` +
            `</div>`;
}

// ── Display players — reuses existing DOM nodes, no rebuild ─
function displayPlayers(players) {
    const container = document.getElementById("playersContainer");
    if (!container) return;

    if (players.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <span class="no-icon">⚔️</span>
                No warriors match your search.<br>
                <small style="font-size:11px;opacity:.5;letter-spacing:2px;">Try different filters</small>
            </div>`;
        return;
    }

    // Build a map of existing card elements by player name
    const existing = {};
    container.querySelectorAll(".card[data-name]").forEach(el => {
        existing[el.dataset.name] = el;
    });

    const fragment = document.createDocumentFragment();

    players.forEach((p, i) => {
        const pos = i + 1;
        let card = existing[p.name];

        if (!card) {
            // Brand new card — create it
            card = document.createElement("div");
            card.className = "card";
            card.dataset.name = p.name;
        }

        // Always update content (position/badge may have changed)
        const newHTML = buildCardHTML(p, pos);
        if (card.innerHTML !== newHTML) {
            card.innerHTML = newHTML;
            // Flip only when content actually changes
            card.classList.remove("flipping");
            void card.offsetWidth; // force reflow
            card.classList.add("flipping");
            setTimeout(() => card.classList.remove("flipping"), 600);
        }

        fragment.appendChild(card);
    });

    // Remove cards that are no longer in results
    Object.keys(existing).forEach(name => {
        if (!players.find(p => p.name === name)) {
            existing[name].remove();
        }
    });

    container.appendChild(fragment);
}

// ── Helpers ────────────────────────────────────────────────
function getFactionIcon(faction) {
    const icons = { "Legion": "⚔️", "Heralds": "👁️", "Infernal": "🔥" };
    return icons[faction] || "⚔️";
}