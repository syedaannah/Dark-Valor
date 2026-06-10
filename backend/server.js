const fetch = require("node-fetch");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "darkvalor";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.static("../241983 web 3"));

let db;
MongoClient.connect(MONGO_URI).then(client => {
  db = client.db(DB_NAME);
  console.log("✅ MongoDB connected");
  app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
});

const reg = () => db.collection("registrations");

// ── PLAYERS ──
const players = [
  { name:"Shang",     rank:"S+", score:9840, faction:"Legion",   role:"Iron Knight · Blade Commander",     wins:38, image:"shang.png",     team:"Alpha" },
  { name:"Azuma",     rank:"S",  score:9210, faction:"Heralds",  role:"Shadow Stalker · Spear Phantom",    wins:34, image:"azuma.png",     team:"Alpha" },
  { name:"Ironclad",  rank:"S",  score:8750, faction:"Legion",   role:"Fortress Knight · Unyielding Wall", wins:31, image:"ironclad.png",  team:"Beta"  },
  { name:"King",      rank:"A+", score:8420, faction:"Legion",   role:"Dark Sovereign · Spiked Warlord",   wins:28, image:"king.png",      team:"Beta"  },
  { name:"Kate",      rank:"A+", score:7980, faction:"Legion",   role:"Silver Knight · Sword Sovereign",   wins:25, image:"kate.png",      team:"Gamma" },
  { name:"Serjan",    rank:"A",  score:7650, faction:"Heralds",  role:"Brawler Elite · Gauntlet Crusher",  wins:22, image:"serjan.png",    team:"Gamma" },
  { name:"Xiang",     rank:"A",  score:7310, faction:"Legion",   role:"War Brute · Iron Fist Ravager",     wins:19, image:"xiang.png",     team:"Delta" },
  { name:"Kibo",      rank:"B+", score:6980, faction:"Heralds",  role:"Blade Dancer · Shadow Duelist",     wins:16, image:"kibo.png",      team:"Delta" },
  { name:"Fireguard", rank:"B+", score:6700, faction:"Infernal", role:"Mech Juggernaut · Ember Warlord",   wins:14, image:"fireguard.png", team:"Omega" },
];
app.get("/players", (req, res) => {
  let r = [...players];
  if (req.query.rank) r = r.filter(p => p.rank.toLowerCase() === req.query.rank.toLowerCase());
  res.json(r);
});

// ── STRIPE PAYMENT ──
app.post("/create-payment-intent", async (req, res) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: "usd",
      metadata: { tournament: req.body.tournament || "Season IV" }
    });
    res.json({ clientSecret: intent.client_secret });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── REGISTRATIONS CRUD ──
app.post("/registrations", async (req, res) => {
  try {
    const { name, email, fighter, faction, tournament, powerLevel, paymentMethod, paymentStatus } = req.body;
    if (!name || !email || !tournament) return res.status(400).json({ error: "name, email, tournament required" });
    const doc = {
      name, email,
      fighter: fighter || "Unknown",
      faction: faction || "Legion",
      tournament,
      powerLevel: Number(powerLevel) || 1,
      paymentMethod: paymentMethod || "USDT",
      paymentStatus: paymentStatus || "Paid",
      amount: 10,
      createdAt: new Date()
    };
    const result = await reg().insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/registrations", async (req, res) => {
  try {
    const docs = await reg().find().sort({ createdAt: -1 }).toArray();
    res.json(docs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/registrations/:id", async (req, res) => {
  try {
    const doc = await reg().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/registrations/:id", async (req, res) => {
  try {
    const { name, email, fighter, faction, tournament, powerLevel, paymentMethod, paymentStatus } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (fighter) update.fighter = fighter;
    if (faction) update.faction = faction;
    if (tournament) update.tournament = tournament;
    if (powerLevel) update.powerLevel = Number(powerLevel);
    if (paymentMethod) update.paymentMethod = paymentMethod;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    const result = await reg().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete("/registrations/:id", async (req, res) => {
  try {
    const result = await reg().deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch(e) { res.status(500).json({ error: e.message }); }
}); 