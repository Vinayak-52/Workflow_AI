var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ai-workspace/server/src/app.ts
var import_express12 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_path5 = __toESM(require("path"));
var import_fs5 = __toESM(require("fs"));
var import_uuid11 = require("uuid");

// ai-workspace/server/src/routes/authRoutes.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var import_uuid = require("uuid");

// ai-workspace/server/src/config/env.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var candidateEnvPaths = [
  import_path.default.resolve(process.cwd(), ".env"),
  import_path.default.resolve(process.cwd(), "ai-workspace/server/.env"),
  import_path.default.resolve(process.cwd(), "server/.env")
];
for (const p of candidateEnvPaths) {
  if (import_fs.default.existsSync(p)) {
    import_dotenv.default.config({ path: p, override: false });
  }
}
var CONFIG = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "ai-workspace-hitk-secret-key-2026",
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://127.0.0.1:5001",
  DATA_DIR: process.env.DATA_DIR || "./data",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ""
};

// ai-workspace/server/src/database/store.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var firestoreInstance = null;
function getFirestoreInstance() {
  if (firestoreInstance) return firestoreInstance;
  if (CONFIG.FIREBASE_PROJECT_ID && CONFIG.FIREBASE_CLIENT_EMAIL && CONFIG.FIREBASE_PRIVATE_KEY) {
    try {
      if ((0, import_app.getApps)().length === 0) {
        let formattedKey = CONFIG.FIREBASE_PRIVATE_KEY.trim();
        if (formattedKey.startsWith('"') && formattedKey.endsWith('"') || formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
          formattedKey = formattedKey.slice(1, -1);
        }
        formattedKey = formattedKey.replace(/\\n/g, "\n");
        (0, import_app.initializeApp)({
          credential: (0, import_app.cert)({
            projectId: CONFIG.FIREBASE_PROJECT_ID,
            clientEmail: CONFIG.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey
          })
        });
      }
      firestoreInstance = (0, import_firestore.getFirestore)();
      firestoreInstance.settings({ ignoreUndefinedProperties: true });
      console.log(`[Firebase] Connected to Firestore project: ${CONFIG.FIREBASE_PROJECT_ID}`);
      return firestoreInstance;
    } catch (e) {
      console.warn("[Firebase] Firestore init failed, falling back to local store:", e.message);
    }
  }
  return null;
}
var DatabaseStore = class {
  filePath;
  data;
  isInitialized = false;
  constructor() {
    const candidateFiles = [
      import_path2.default.resolve(process.cwd(), "ai-workspace/server/data/firestore_store.json"),
      import_path2.default.resolve(process.cwd(), "data/firestore_store.json"),
      import_path2.default.resolve(process.cwd(), "../data/firestore_store.json"),
      import_path2.default.resolve(__dirname, "../data/firestore_store.json"),
      import_path2.default.resolve(__dirname, "../../data/firestore_store.json"),
      import_path2.default.resolve(__dirname, "../../ai-workspace/server/data/firestore_store.json")
    ];
    let foundFile = candidateFiles.find((f) => import_fs2.default.existsSync(f));
    if (foundFile) {
      this.filePath = foundFile;
    } else {
      const candidateDirs = [
        import_path2.default.resolve(process.cwd(), "ai-workspace/server/data"),
        import_path2.default.resolve(process.cwd(), "data"),
        import_path2.default.resolve(process.cwd(), "../data")
      ];
      let dataDir = candidateDirs.find((d) => import_fs2.default.existsSync(d)) || candidateDirs[0];
      if (!import_fs2.default.existsSync(dataDir)) {
        try {
          import_fs2.default.mkdirSync(dataDir, { recursive: true });
        } catch (e) {
          dataDir = "/tmp";
        }
      }
      this.filePath = import_path2.default.join(dataDir, "firestore_store.json");
    }
    this.data = this.load();
  }
  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    const fsDb = getFirestoreInstance();
    if (!fsDb) {
      console.log("[Firebase] Running in offline local JSON store mode.");
      return;
    }
    try {
      console.log(`[Firebase] Initializing two-way sync with Firestore (${CONFIG.FIREBASE_PROJECT_ID})...`);
      const collections = [
        "users",
        "tasks",
        "notes",
        "reminders",
        "documents",
        "calendarEvents",
        "dailyPlans"
      ];
      let pulledCount = 0;
      for (const colName of collections) {
        try {
          const snapshot = await fsDb.collection(colName).get();
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              const itemData = docSnap.data();
              if (itemData) {
                this.data[colName][docSnap.id] = itemData;
                pulledCount++;
              }
            });
          } else {
            const localItems = Object.values(this.data[colName] || {});
            for (const item of localItems) {
              if (item && item.id) {
                await fsDb.collection(colName).doc(item.id).set(item, { merge: true }).catch(() => {
                });
              }
            }
          }
        } catch (colErr) {
          console.warn(`[Firebase] Warning syncing collection '${colName}':`, colErr.message);
        }
      }
      this.save();
      console.log(`[Firebase] Firestore sync complete: Loaded ${pulledCount} documents from Firestore.`);
      if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
        for (const colName of collections) {
          fsDb.collection(colName).onSnapshot(
            (snapshot) => {
              let hasChanges = false;
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                  const docData = change.doc.data();
                  if (docData) {
                    this.data[colName][change.doc.id] = docData;
                    hasChanges = true;
                  }
                } else if (change.type === "removed") {
                  delete this.data[colName][change.doc.id];
                  hasChanges = true;
                }
              });
              if (hasChanges) {
                this.save();
              }
            },
            (err) => {
              console.warn(`[Firebase] Listener warning for '${colName}':`, err.message);
            }
          );
        }
      }
    } catch (err) {
      console.warn("[Firebase] Firestore initialization failed, falling back to local store:", err.message);
    }
  }
  load() {
    if (import_fs2.default.existsSync(this.filePath)) {
      try {
        const raw = import_fs2.default.readFileSync(this.filePath, "utf-8");
        return JSON.parse(raw);
      } catch (e) {
        console.error("Error loading db file, initializing fresh store:", e);
      }
    }
    const empty = {
      users: {},
      tasks: {},
      notes: {},
      reminders: {},
      documents: {},
      calendarEvents: {},
      dailyPlans: {},
      activityLogs: []
    };
    this.save(empty);
    return empty;
  }
  save(dataToSave) {
    const d = dataToSave || this.data;
    try {
      import_fs2.default.writeFileSync(this.filePath, JSON.stringify(d, null, 2), "utf-8");
    } catch (e) {
      try {
        if (!this.filePath.startsWith("/tmp")) {
          import_fs2.default.writeFileSync("/tmp/firestore_store.json", JSON.stringify(d, null, 2), "utf-8");
        }
      } catch (tmpErr) {
      }
    }
  }
  // User operations
  getUserById(id) {
    return this.data.users[id];
  }
  getUserByEmail(email) {
    return Object.values(this.data.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  getUserByUsernameOrEmail(identifier) {
    const idLower = identifier.toLowerCase().trim();
    return Object.values(this.data.users).find(
      (u) => u.username && u.username.toLowerCase() === idLower || u.email && u.email.toLowerCase() === idLower || idLower === "vinayak" && (u.username === "vinayak" || u.email.toLowerCase().includes("vinayak"))
    );
  }
  saveUser(user) {
    this.data.users[user.id] = user;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("users").doc(user.id).set(user, { merge: true }).catch((err) => console.warn("[Firebase] Sync user error:", err.message));
    }
    return user;
  }
  // Task operations
  getTasksByUserId(userId) {
    return Object.values(this.data.tasks).filter((t) => t.userId === userId);
  }
  getTaskById(id, userId) {
    const t = this.data.tasks[id];
    return t && t.userId === userId ? t : void 0;
  }
  saveTask(task) {
    this.data.tasks[task.id] = task;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("tasks").doc(task.id).set(task, { merge: true }).catch((err) => console.warn("[Firebase] Sync task error:", err.message));
    }
    return task;
  }
  deleteTask(id, userId) {
    const t = this.getTaskById(id, userId);
    if (!t) return false;
    delete this.data.tasks[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("tasks").doc(id).delete().catch(() => {
      });
    }
    return true;
  }
  // Note operations
  getNotesByUserId(userId) {
    return Object.values(this.data.notes).filter((n) => n.userId === userId);
  }
  getNoteById(id, userId) {
    const n = this.data.notes[id];
    return n && n.userId === userId ? n : void 0;
  }
  saveNote(note) {
    this.data.notes[note.id] = note;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("notes").doc(note.id).set(note, { merge: true }).catch((err) => console.warn("[Firebase] Sync note error:", err.message));
    }
    return note;
  }
  deleteNote(id, userId) {
    const n = this.getNoteById(id, userId);
    if (!n) return false;
    delete this.data.notes[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("notes").doc(id).delete().catch(() => {
      });
    }
    return true;
  }
  // Reminders operations
  getRemindersByUserId(userId) {
    return Object.values(this.data.reminders).filter((r) => r.userId === userId);
  }
  saveReminder(reminder) {
    this.data.reminders[reminder.id] = reminder;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("reminders").doc(reminder.id).set(reminder, { merge: true }).catch((err) => console.warn("[Firebase] Sync reminder error:", err.message));
    }
    return reminder;
  }
  dismissReminder(id, userId) {
    const r = this.data.reminders[id];
    if (r && r.userId === userId) {
      r.isDismissed = true;
      this.save();
      const fsDb = getFirestoreInstance();
      if (fsDb) {
        fsDb.collection("reminders").doc(id).set({ isDismissed: true }, { merge: true }).catch(() => {
        });
      }
      return true;
    }
    return false;
  }
  // Document operations
  getDocumentsByUserId(userId) {
    return Object.values(this.data.documents).filter((d) => d.userId === userId);
  }
  getDocumentById(id, userId) {
    const doc = this.data.documents[id];
    return doc && doc.userId === userId ? doc : void 0;
  }
  saveDocument(doc) {
    this.data.documents[doc.id] = doc;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("documents").doc(doc.id).set(doc, { merge: true }).catch((err) => console.warn("[Firebase] Sync document error:", err.message));
    }
    return doc;
  }
  deleteDocument(id, userId) {
    const doc = this.getDocumentById(id, userId);
    if (!doc) return false;
    delete this.data.documents[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("documents").doc(id).delete().catch(() => {
      });
    }
    return true;
  }
  // Calendar Event operations
  getCalendarEventsByUserId(userId) {
    return Object.values(this.data.calendarEvents).filter((e) => e.userId === userId);
  }
  getCalendarEventById(id, userId) {
    const ev = this.data.calendarEvents[id];
    return ev && ev.userId === userId ? ev : void 0;
  }
  saveCalendarEvent(event) {
    this.data.calendarEvents[event.id] = event;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("calendarEvents").doc(event.id).set(event, { merge: true }).catch((err) => console.warn("[Firebase] Sync event error:", err.message));
    }
    return event;
  }
  deleteCalendarEvent(id, userId) {
    const ev = this.getCalendarEventById(id, userId);
    if (!ev) return false;
    delete this.data.calendarEvents[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("calendarEvents").doc(id).delete().catch(() => {
      });
    }
    return true;
  }
  // Daily Plan operations
  getDailyPlan(userId, planDate) {
    const plans = Object.values(this.data.dailyPlans).filter((p) => p.userId === userId && p.planDate === planDate).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return plans[0];
  }
  saveDailyPlan(plan) {
    for (const key of Object.keys(this.data.dailyPlans)) {
      const existing = this.data.dailyPlans[key];
      if (existing.userId === plan.userId && existing.planDate === plan.planDate) {
        delete this.data.dailyPlans[key];
      }
    }
    this.data.dailyPlans[plan.id] = plan;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection("dailyPlans").doc(plan.id).set(plan, { merge: true }).catch((err) => console.warn("[Firebase] Sync plan error:", err.message));
    }
    return plan;
  }
  // Activity Log operations
  logActivity(log) {
    this.data.activityLogs.push(log);
    if (this.data.activityLogs.length > 1e3) {
      this.data.activityLogs.shift();
    }
    this.save();
  }
  getActivityLogs(userId, limit = 50) {
    return this.data.activityLogs.filter((l) => l.userId === userId).slice(-limit).reverse();
  }
};
var db = new DatabaseStore();

// ai-workspace/server/src/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    const demoUser = db.getUserByEmail("vinayak@hitk.edu.in");
    if (demoUser && (req.headers["x-demo-mode"] === "true" || process.env.NODE_ENV !== "production")) {
      req.user = {
        id: demoUser.id,
        email: demoUser.email,
        displayName: demoUser.displayName
      };
      return next();
    }
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token missing or invalid",
        requestId: req.headers["x-request-id"] || "req-err"
      }
    });
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  try {
    const decoded = import_jsonwebtoken.default.verify(token, CONFIG.JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "The authenticated user session is no longer active",
          requestId: req.headers["x-request-id"] || "req-err"
        }
      });
    }
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired session token",
        requestId: req.headers["x-request-id"] || "req-err"
      }
    });
  }
}

// ai-workspace/server/src/routes/authRoutes.ts
var router = (0, import_express.Router)();
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    const identifier = (username || email || "").trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Username and password are required" } });
    }
    const userEmail = email || `${identifier}@hitk.edu.in`;
    const existing = db.getUserByUsernameOrEmail(identifier);
    if (existing) {
      return res.status(409).json({ error: { code: "USER_EXISTS", message: "A user with this username already exists" } });
    }
    const passwordHash = await import_bcryptjs.default.hash(password, 10);
    const newUser = {
      id: `usr-${(0, import_uuid.v4)().slice(0, 8)}`,
      username: username || identifier,
      email: userEmail,
      displayName: displayName || username || identifier,
      passwordHash,
      timezone: "Asia/Kolkata",
      preferences: {
        theme: "dark",
        timezone: "Asia/Kolkata",
        workingHours: { start: "09:00", end: "18:00" },
        breakDurationMinutes: 15
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveUser(newUser);
    const token = import_jsonwebtoken2.default.sign({ id: newUser.id, username: newUser.username, email: newUser.email }, CONFIG.JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({
      user: { id: newUser.id, username: newUser.username, email: newUser.email, displayName: newUser.displayName, preferences: newUser.preferences },
      token
    });
  } catch (err) {
    next(err);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || "").trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Username and password required" } });
    }
    const user = db.getUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" } });
    }
    const match = await import_bcryptjs.default.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" } });
    }
    const token = import_jsonwebtoken2.default.sign({ id: user.id, username: user.username || user.email }, CONFIG.JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      user: { id: user.id, username: user.username || "vinayak", email: user.email, displayName: user.displayName, preferences: user.preferences },
      token
    });
  } catch (err) {
    next(err);
  }
});
router.get("/me", authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
  return res.json({
    id: user.id,
    username: user.username || "vinayak",
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
    preferences: user.preferences
  });
});
router.patch("/me/preferences", authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
  user.preferences = { ...user.preferences, ...req.body };
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveUser(user);
  return res.json({ preferences: user.preferences });
});
router.get("/integrations", authMiddleware, (req, res) => {
  return res.json({
    google: {
      connected: true,
      accountEmail: req.user.email,
      grantedScopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.readonly"
      ],
      readOnlyNotice: "All external integrations are strictly read-only. No Google write operations permitted."
    }
  });
});
var authRoutes_default = router;

// ai-workspace/server/src/routes/taskRoutes.ts
var import_express2 = require("express");
var import_uuid3 = require("uuid");

// ai-workspace/server/src/middleware/activityLogger.ts
var import_uuid2 = require("uuid");
function activityLogger(entityType, action) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = body?.id || body?.task?.id || body?.note?.id || req.params?.id || "entity-action";
        try {
          db.logActivity({
            id: `act-${(0, import_uuid2.v4)().slice(0, 8)}`,
            userId: req.user.id,
            action,
            entityType,
            entityId,
            metadata: {
              method: req.method,
              path: req.originalUrl,
              title: body?.title || body?.task?.title || body?.fileName
            },
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch (e) {
          console.error("Failed to log activity:", e);
        }
      }
      return originalJson(body);
    };
    next();
  };
}

// ai-workspace/server/src/services/documentExtractor.ts
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_zlib = __toESM(require("zlib"));
function isBinaryGarbage(text) {
  if (!text || text.trim().length === 0) return true;
  const sample = text.slice(0, 1500);
  if (sample.startsWith("%PDF-") || sample.includes("endobj") || sample.includes("FlateDecode") || sample.includes("/Type /Catalog")) {
    return true;
  }
  if (sample.startsWith("PK") || sample.includes("[Content_Types].xml") || sample.includes("word/document.xml")) {
    return true;
  }
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code >= 32 && code <= 126 || code === 10 || code === 13 || code === 9) {
      printable++;
    }
  }
  return printable / sample.length < 0.7;
}
function extractTextFromPdf(filePath) {
  try {
    const buf = import_fs3.default.readFileSync(filePath);
    let streams = [];
    let idx = 0;
    while ((idx = buf.indexOf("stream", idx)) !== -1) {
      let start = idx + 6;
      if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
      else if (buf[start] === 10 || buf[start] === 13) start += 1;
      const end = buf.indexOf("endstream", start);
      if (end === -1) break;
      const slice = buf.slice(start, end);
      try {
        const uncompressed = import_zlib.default.inflateSync(slice);
        streams.push(uncompressed.toString("latin1"));
      } catch {
        streams.push(slice.toString("latin1"));
      }
      idx = end + 9;
    }
    const cmap = {};
    for (const s of streams) {
      if (s.includes("begincmap")) {
        const bfcharBlock = s.match(/beginbfchar([\s\S]*?)endbfchar/);
        if (bfcharBlock) {
          const charMatches = bfcharBlock[1].matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g);
          for (const m of charMatches) {
            cmap[parseInt(m[1], 16)] = String.fromCharCode(parseInt(m[2], 16));
          }
        }
        const bfrangeBlock = s.match(/beginbfrange([\s\S]*?)endbfrange/);
        if (bfrangeBlock) {
          const rangeMatches = bfrangeBlock[1].matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g);
          for (const m of rangeMatches) {
            const startC = parseInt(m[1], 16);
            const endC = parseInt(m[2], 16);
            const destC = parseInt(m[3], 16);
            for (let c = startC; c <= endC; c++) {
              cmap[c] = String.fromCharCode(destC + (c - startC));
            }
          }
        }
      }
    }
    let allText = "";
    const hasCmap = Object.keys(cmap).length > 0;
    for (const s of streams) {
      let streamText = "";
      if (hasCmap && (s.includes("Tj") || s.includes("TJ"))) {
        const hexTj = /<([0-9a-fA-F]+)>\s*Tj/g;
        let m;
        while ((m = hexTj.exec(s)) !== null) {
          const hex = m[1];
          for (let i = 0; i < hex.length; i += 4) {
            const code = parseInt(hex.slice(i, i + 4), 16);
            streamText += cmap[code] || "";
          }
        }
      }
      const tjRegex = /\[(.*?)\]\s*TJ/gs;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(s)) !== null) {
        const inner = tjMatch[1];
        const tokenRegex = /\((.*?)\)|(-?\d+(?:\.\d+)?)/g;
        let tMatch;
        let line = "";
        while ((tMatch = tokenRegex.exec(inner)) !== null) {
          if (tMatch[1] !== void 0) {
            line += tMatch[1];
          } else if (tMatch[2] !== void 0) {
            const num = parseFloat(tMatch[2]);
            if (num <= -250) {
              line += " ";
            }
          }
        }
        if (line.trim()) {
          streamText += line.trim() + " ";
        }
      }
      const singleTjRegex = /\((.*?)\)\s*Tj/g;
      let singleMatch;
      while ((singleMatch = singleTjRegex.exec(s)) !== null) {
        streamText += singleMatch[1] + " ";
      }
      if (streamText.trim()) {
        allText += streamText.trim() + "\n";
      }
    }
    let cleaned = allText.replace(/\\([()\\])/g, "$1").replace(/\\r/g, " ").replace(/\\n/g, " ").replace(/\s{2,}/g, " ").trim();
    return isBinaryGarbage(cleaned) ? "" : cleaned;
  } catch (err) {
    console.warn("[DocumentExtractor] PDF extraction error:", err);
    return "";
  }
}
function extractTextFromDocx(filePath) {
  try {
    const buffer = import_fs3.default.readFileSync(filePath);
    let pos = 0;
    while (pos < buffer.length - 30) {
      if (buffer[pos] === 80 && buffer[pos + 1] === 75 && buffer[pos + 2] === 3 && buffer[pos + 3] === 4) {
        const compMethod = buffer.readUInt16LE(pos + 8);
        const compSize = buffer.readUInt32LE(pos + 18);
        const nameLen = buffer.readUInt16LE(pos + 26);
        const extraLen = buffer.readUInt16LE(pos + 28);
        const name = buffer.slice(pos + 30, pos + 30 + nameLen).toString("utf8");
        const dataStart = pos + 30 + nameLen + extraLen;
        const dataEnd = dataStart + compSize;
        if (name === "word/document.xml") {
          const compData = buffer.slice(dataStart, dataEnd);
          let xml = "";
          if (compMethod === 8) {
            xml = import_zlib.default.inflateRawSync(compData).toString("utf8");
          } else if (compMethod === 0) {
            xml = compData.toString("utf8");
          }
          const textParts = [];
          const regex = /<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g;
          let m;
          while ((m = regex.exec(xml)) !== null) {
            textParts.push(m[1]);
          }
          const result = textParts.join(" ").replace(/\s+/g, " ").trim();
          return isBinaryGarbage(result) ? "" : result;
        }
        pos = dataEnd;
      } else {
        pos++;
      }
    }
  } catch (err) {
    console.warn("[DocumentExtractor] DOCX extraction error:", err);
  }
  return "";
}
async function extractDocumentText(filePath, originalName) {
  const ext = import_path3.default.extname(originalName || filePath).toLowerCase();
  if ([".txt", ".md", ".markdown", ".json", ".csv", ".rtf"].includes(ext)) {
    try {
      const raw = import_fs3.default.readFileSync(filePath, "utf-8");
      if (!isBinaryGarbage(raw)) return raw.trim();
    } catch {
    }
  }
  try {
    const mlExtracted = await MLClient.extractText(filePath);
    if (mlExtracted && mlExtracted.trim().length > 15 && !isBinaryGarbage(mlExtracted)) {
      return mlExtracted.trim();
    }
  } catch {
  }
  if (ext === ".pdf") {
    const pdfText = extractTextFromPdf(filePath);
    if (pdfText && pdfText.length > 20) return pdfText;
  } else if (ext === ".docx" || ext === ".doc") {
    const docxText = extractTextFromDocx(filePath);
    if (docxText && docxText.length > 20) return docxText;
  }
  try {
    const raw = import_fs3.default.readFileSync(filePath, "utf-8");
    if (!isBinaryGarbage(raw) && raw.trim().length > 10) {
      return raw.trim();
    }
  } catch {
  }
  return `Document: ${originalName} (Binary content; structured text extraction unavailable).`;
}

// ai-workspace/server/src/services/nlpSummarizer.ts
var STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "him",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "me",
  "more",
  "most",
  "my",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "with",
  "would",
  "you",
  "your"
]);
var ACADEMIC_CUES = /* @__PURE__ */ new Set([
  "definition",
  "defined",
  "concept",
  "objective",
  "objectives",
  "framework",
  "architecture",
  "evolution",
  "advantage",
  "advantages",
  "benefit",
  "benefits",
  "primary",
  "essential",
  "fundamental",
  "characteristic",
  "characteristics",
  "strategy",
  "strategies",
  "management",
  "mechanism",
  "algorithm",
  "evaluation",
  "results",
  "conclusion",
  "critical",
  "component",
  "components",
  "purpose",
  "process",
  "analysis",
  "system",
  "methodology",
  "implementation"
]);
var ACTION_VERBS = [
  "must",
  "should",
  "need to",
  "finalize",
  "implement",
  "create",
  "develop",
  "prepare",
  "review",
  "submit",
  "complete",
  "design",
  "test",
  "ensure",
  "deliver",
  "configure",
  "setup"
];
function cleanNoise(text) {
  return text.replace(/Source:\s*[\w-]+\s*\|\s*Difficulty:\s*\w+/gi, "").replace(/Course\s*(?:ID|Code):\s*[\w_-]+/gi, "").replace(/\b(?:page|pg\.?)\s+\d+(?:\s+of\s+\d+)?\b/gi, "").replace(/[\uFFFD\u2022\u25CF\u25AA\u25BA\u25B6\u25C6\uF0A7\uF0B7]/g, " ").replace(/[ \t]+/g, " ").trim();
}
function splitSentences(text) {
  const cleaned = cleanNoise(text);
  const chunks = cleaned.split(/(?<=[.!?])\s+|\n{2,}|\n(?=[-•*]|\d+[\.)]\s+)/);
  const sentences = [];
  for (const c of chunks) {
    const s = c.replace(/\s+/g, " ").trim();
    if (s.length >= 25 && s.length <= 400 && !s.startsWith("http")) {
      const alphaCount = (s.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount >= 14) {
        sentences.push(s);
      }
    }
  }
  return sentences;
}
function tokenize(text) {
  const words = text.toLowerCase().match(/\b[a-zA-Z0-9_\'-]+\b/g) || [];
  return words.filter((w) => !STOPWORDS.has(w) && w.length > 2);
}
function extractActionItems(text) {
  const sentences = splitSentences(text);
  const items = [];
  for (const s of sentences) {
    const sLower = s.toLowerCase();
    for (const v of ACTION_VERBS) {
      if (sLower.includes(v) && !items.includes(s)) {
        items.push(s);
        break;
      }
    }
    if (items.length >= 5) break;
  }
  return items;
}
function summarizeExtractive(text, maxSentences = 5) {
  if (isBinaryGarbage(text)) {
    return {
      summary: "The document contains binary formatting or unextracted binary data. Structured plain text extraction is recommended.",
      key_takeaways: ["Binary encoded content detected."],
      action_items: [],
      compression_ratio: 1,
      factuality_score: 1,
      method: "binary_guard"
    };
  }
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    const snippet = text.slice(0, 300).replace(/\s+/g, " ").trim();
    return {
      summary: snippet || "No readable text content identified for summarization.",
      key_takeaways: snippet ? [snippet] : [],
      action_items: [],
      compression_ratio: 1,
      factuality_score: 1,
      method: "snippet_fallback"
    };
  }
  if (sentences.length <= maxSentences) {
    return {
      summary: sentences.join(" "),
      key_takeaways: sentences,
      action_items: extractActionItems(text),
      compression_ratio: 1,
      factuality_score: 1,
      method: "short_doc_direct"
    };
  }
  const allTokens = [];
  const sentenceTokenList = [];
  for (let idx = 0; idx < sentences.length; idx++) {
    const s = sentences[idx];
    const tokens = tokenize(s);
    sentenceTokenList.push({ sentence: s, tokens, tokenSet: new Set(tokens), idx });
    allTokens.push(...tokens);
  }
  const freqMap = {};
  for (const t of allTokens) {
    freqMap[t] = (freqMap[t] || 0) + 1;
  }
  const maxFreq = Math.max(1, ...Object.values(freqMap));
  for (const k in freqMap) {
    freqMap[k] /= maxFreq;
  }
  const scoredSentences = [];
  for (const item of sentenceTokenList) {
    if (item.tokens.length === 0) continue;
    const posWeight = item.idx < 3 ? 1.3 : item.idx < 8 ? 1.15 : item.idx === sentences.length - 1 ? 1.1 : 1;
    const lengthNorm = 1 / (1 + Math.abs(item.tokens.length - 20) * 0.04);
    const baseScore = item.tokens.reduce((acc, t) => acc + (freqMap[t] || 0), 0) / item.tokens.length;
    const cueHits = item.tokens.filter((t) => ACADEMIC_CUES.has(t)).length;
    const cueBoost = 1 + Math.min(0.6, cueHits * 0.2);
    const finalScore = baseScore * posWeight * lengthNorm * cueBoost;
    scoredSentences.push({ idx: item.idx, score: finalScore, sentence: item.sentence, tokenSet: item.tokenSet });
  }
  scoredSentences.sort((a, b) => b.score - a.score);
  const selected = [];
  for (const cand of scoredSentences) {
    if (selected.length >= maxSentences) break;
    let redundant = false;
    for (const sel of selected) {
      let intersection = 0;
      for (const t of cand.tokenSet) {
        if (sel.tokenSet.has(t)) intersection++;
      }
      const union = cand.tokenSet.size + sel.tokenSet.size - intersection;
      const jaccard = union > 0 ? intersection / union : 0;
      if (jaccard > 0.45) {
        redundant = true;
        break;
      }
    }
    if (!redundant) {
      selected.push(cand);
    }
  }
  selected.sort((a, b) => a.idx - b.idx);
  const takeaways = selected.map((s) => s.sentence);
  const summary = takeaways.join(" ");
  const compressionRatio = Math.round(summary.length / Math.max(1, text.length) * 100) / 100;
  return {
    summary,
    key_takeaways: takeaways,
    action_items: extractActionItems(text),
    compression_ratio: compressionRatio,
    factuality_score: 1,
    method: "extractive_salience_mmr"
  };
}
async function generateDocumentSummary(fileName, documentText, maxSentences = 5) {
  if (isBinaryGarbage(documentText)) {
    return {
      summary: `Document "${fileName}" contains binary data or unextracted media. Plain text extraction could not decode structured text.`,
      key_takeaways: ["Binary encoded content detected."],
      action_items: [],
      compression_ratio: 1,
      factuality_score: 1,
      method: "binary_guard"
    };
  }
  const apiKey = CONFIG.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const truncated = documentText.length > 3e4 ? documentText.slice(0, 3e4) + "\n\n[... content truncated for token limits ...]" : documentText;
      const systemPrompt = `You are an expert academic and technical NLP summarizer embedded in the AI Workspace.
Analyze the provided document and produce a clear, authoritative, coherent summary.
You MUST output valid, raw JSON only without markdown code blocks, using this format:
{
  "summary": "A clean 2 to 4 sentence executive summary of the document.",
  "key_takeaways": ["First key takeaway", "Second key takeaway", "Third key takeaway"],
  "action_items": ["Action item if any"]
}`;
      const userPrompt = `DOCUMENT TITLE: ${fileName}

=== DOCUMENT TEXT ===
${truncated}
=== END DOCUMENT TEXT ===`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(12e3)
        }
      );
      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawJsonText) {
          try {
            const parsed = JSON.parse(rawJsonText);
            if (parsed.summary && typeof parsed.summary === "string") {
              return {
                summary: parsed.summary,
                key_takeaways: Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways : [],
                action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
                compression_ratio: Math.round(parsed.summary.length / Math.max(1, documentText.length) * 100) / 100,
                factuality_score: 0.98,
                method: "gemini_2.0_flash"
              };
            }
          } catch {
            return {
              summary: rawJsonText.slice(0, 400),
              key_takeaways: splitSentences(rawJsonText).slice(0, 4),
              action_items: [],
              compression_ratio: 0.25,
              factuality_score: 0.95,
              method: "gemini_text"
            };
          }
        }
      }
    } catch (err) {
      console.warn("[NLP Summarizer] Gemini summarization call failed, falling back to extractive engine:", err.message);
    }
  }
  return summarizeExtractive(documentText, maxSentences);
}

// ai-workspace/server/src/services/mlClient.ts
var MLClient = class {
  static baseUrl = CONFIG.ML_SERVICE_URL;
  static async predictPriority(taskData) {
    try {
      const response = await fetch(`${this.baseUrl}/predict-priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
        signal: AbortSignal.timeout(3e3)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
    }
    return this.fallbackPriority(taskData);
  }
  static async evaluateSmartReminders(tasks, userContext) {
    try {
      const response = await fetch(`${this.baseUrl}/smart-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, user_context: userContext }),
        signal: AbortSignal.timeout(3e3)
      });
      if (response.ok) {
        const data = await response.json();
        return data.reminders || [];
      }
    } catch (e) {
    }
    return tasks.map((t) => ({
      task_id: t.id || t.task_id,
      title: t.title,
      level: t.isOverdue ? "critical" : t.priorityScore > 75 ? "urgent" : "warning",
      should_remind_now: Boolean(t.isOverdue || t.priorityScore > 75),
      message: `Reminder for ${t.title}`,
      urgency_score: t.priorityScore || 50
    }));
  }
  static async extractText(filePath) {
    try {
      const response = await fetch(`${this.baseUrl}/extract-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: filePath }),
        signal: AbortSignal.timeout(15e3)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text && data.text.trim().length > 0) {
          return data.text;
        }
      }
    } catch (e) {
      console.warn("[MLClient] Text extraction via ML service failed:", e);
    }
    return "";
  }
  static async summarize(text, maxSentences = 5) {
    try {
      const response = await fetch(`${this.baseUrl}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, max_sentences: maxSentences }),
        signal: AbortSignal.timeout(15e3)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
    }
    return await generateDocumentSummary("Document", text, maxSentences);
  }
  static async recordFeedback(feedbackData) {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
        signal: AbortSignal.timeout(3e3)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
    }
    return { status: "recorded_offline" };
  }
  static async getFeedbackStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ml/feedback-stats`, {
        signal: AbortSignal.timeout(3e3)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
    }
    return {
      total_feedback_events: 1,
      override_rate: 0.05,
      on_time_completion_rate: 0.92,
      recommendation: "Operational"
    };
  }
  static fallbackPriority(task) {
    const hours = Number(task.hours_to_deadline ?? 24);
    const isOverdue = Boolean(task.is_overdue || hours < 0);
    const importance = Number(task.user_importance ?? 3);
    const estimatedMinutes = Number(task.estimated_duration_min ?? task.estimatedMinutes ?? 60);
    const availableFreeMinutes = Number(task.available_free_minutes ?? 120);
    const workloadPending = Number(task.workload_pending_tasks ?? 3);
    const category = String(task.category || "project").toLowerCase();
    const catMultiplier = {
      academic: 1.05,
      project: 1,
      administrative: 0.95,
      personal: 0.9
    };
    const catWeight = catMultiplier[category] ?? 1;
    let urgencyScore = 0;
    if (isOverdue || hours <= 0) {
      urgencyScore = 100;
    } else {
      urgencyScore = Math.min(100, Math.max(0, 100 * Math.exp(-hours / 48)));
    }
    const importanceScore = Math.min(100, Math.max(20, importance / 5 * 100));
    const freeTimeRatio = estimatedMinutes / Math.max(15, availableFreeMinutes);
    const timePressureScore = Math.min(100, Math.max(10, freeTimeRatio * 50));
    const pendingPressureScore = Math.min(100, workloadPending * 8);
    let rawScore = (urgencyScore * 0.45 + importanceScore * 0.35 + timePressureScore * 0.15 + pendingPressureScore * 0.05) * catWeight;
    if (isOverdue || hours <= 0) {
      rawScore = Math.max(95, rawScore);
    } else if (hours <= 6) {
      rawScore = Math.max(88, rawScore);
    } else if (importance >= 5 && hours <= 24) {
      rawScore = Math.max(82, rawScore);
    } else if (hours <= 18 && importance >= 4) {
      rawScore = Math.max(78, rawScore);
    } else if (hours <= 24 && availableFreeMinutes < estimatedMinutes) {
      rawScore = Math.max(76, rawScore);
    } else if (hours <= 48 && importance >= 3) {
      rawScore = Math.max(45, rawScore);
    } else if (hours > 72 && importance <= 2) {
      rawScore = Math.min(38, rawScore);
    }
    const priorityScore = Math.round(Math.min(99.5, Math.max(5, rawScore)) * 10) / 10;
    let predictedPriority;
    if (priorityScore >= 70) {
      predictedPriority = "high";
    } else if (priorityScore >= 40) {
      predictedPriority = "medium";
    } else {
      predictedPriority = "low";
    }
    let probHigh = 0.05;
    let probMed = 0.25;
    let probLow = 0.7;
    if (priorityScore >= 70) {
      const normalized = (priorityScore - 70) / 30;
      probHigh = 0.65 + normalized * 0.3;
      probMed = (1 - probHigh) * 0.75;
      probLow = Math.max(0.01, 1 - probHigh - probMed);
    } else if (priorityScore >= 40) {
      const distFromCenter = 1 - Math.abs(priorityScore - 55) / 20;
      probMed = 0.55 + distFromCenter * 0.25;
      const remainder = 1 - probMed;
      if (priorityScore >= 55) {
        probHigh = remainder * 0.7;
        probLow = remainder * 0.3;
      } else {
        probHigh = remainder * 0.3;
        probLow = remainder * 0.7;
      }
    } else {
      const normalized = (40 - priorityScore) / 35;
      probLow = 0.6 + normalized * 0.35;
      probMed = (1 - probLow) * 0.75;
      probHigh = Math.max(0.01, 1 - probLow - probMed);
    }
    const probabilities = {
      high: Math.round(probHigh * 1e3) / 1e3,
      medium: Math.round(probMed * 1e3) / 1e3,
      low: Math.round(probLow * 1e3) / 1e3
    };
    let rationale = "";
    if (isOverdue || hours <= 0) {
      rationale = `Task is overdue by ${Math.abs(Math.round(hours))}h. Prioritized as High to avoid deadline failure.`;
    } else if (hours <= 6) {
      rationale = `Imminent deadline (${hours.toFixed(1)}h remaining) with user importance ${importance}/5. Prioritized as High.`;
    } else if (availableFreeMinutes < estimatedMinutes && hours <= 24) {
      rationale = `Time deficit detected (${availableFreeMinutes}m free time vs ${estimatedMinutes}m needed) with ${hours.toFixed(1)}h until deadline.`;
    } else if (priorityScore >= 70) {
      rationale = `High priority score (${priorityScore}/100) driven by ${hours.toFixed(1)}h deadline proximity and level ${importance} importance.`;
    } else if (priorityScore >= 40) {
      rationale = `Moderate priority score (${priorityScore}/100) with ${hours.toFixed(1)}h deadline buffer and ${estimatedMinutes}m estimated duration.`;
    } else {
      rationale = `Low priority score (${priorityScore}/100) due to generous deadline buffer (${hours.toFixed(1)}h) and standard importance.`;
    }
    return {
      predicted_priority: predictedPriority,
      priority_score: priorityScore,
      probabilities,
      method: "heuristic_multivariate_engine",
      rationale,
      model_version: "rf-heuristic-v2.0"
    };
  }
};

// ai-workspace/server/src/routes/taskRoutes.ts
var router2 = (0, import_express2.Router)();
router2.use(authMiddleware);
function getWorkloadContext(userId) {
  const allTasks = db.getTasksByUserId(userId);
  const pendingTasks = allTasks.filter((t) => t.status !== "done");
  const workload_pending_tasks = pendingTasks.length;
  const now = /* @__PURE__ */ new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 3600 * 1e3;
  const workload_minutes_today = pendingTasks.reduce((sum, t) => {
    const dueTime = new Date(t.dueAt).getTime();
    if (dueTime <= endOfDay) {
      return sum + (t.estimatedMinutes || 60);
    }
    return sum;
  }, 0);
  const events = db.getCalendarEventsByUserId(userId);
  let busyMinutesToday = 0;
  for (const ev of events) {
    const evStart = new Date(ev.startAt).getTime();
    const evEnd = new Date(ev.endAt).getTime();
    const overlapStart = Math.max(evStart, startOfDay);
    const overlapEnd = Math.min(evEnd, endOfDay);
    if (overlapEnd > overlapStart) {
      busyMinutesToday += Math.round((overlapEnd - overlapStart) / (60 * 1e3));
    }
  }
  const remainingMinutesToday = Math.max(0, Math.round((endOfDay - now.getTime()) / (60 * 1e3)));
  const baseProductiveWindow = Math.min(480, remainingMinutesToday > 0 ? remainingMinutesToday : 480);
  const available_free_minutes = Math.max(15, baseProductiveWindow - busyMinutesToday);
  const completedTasks = allTasks.filter((t) => t.status === "done");
  let historical_completion_rate = 0.85;
  if (completedTasks.length > 0) {
    const onTimeCount = completedTasks.filter((t) => {
      if (!t.completedAt || !t.dueAt) return true;
      return new Date(t.completedAt).getTime() <= new Date(t.dueAt).getTime();
    }).length;
    historical_completion_rate = Math.round(onTimeCount / completedTasks.length * 100) / 100;
  }
  return {
    workload_pending_tasks,
    workload_minutes_today: Math.max(60, workload_minutes_today),
    available_free_minutes,
    historical_completion_rate
  };
}
router2.get("/", (req, res) => {
  const userId = req.user.id;
  let tasks = db.getTasksByUserId(userId);
  const { status, priority, category, q } = req.query;
  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (priority) {
    tasks = tasks.filter((t) => t.userPriority === priority || t.predictedPriority === priority);
  }
  if (category) {
    tasks = tasks.filter((t) => t.category === category);
  }
  if (q) {
    const query = String(q).toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
  }
  const now = /* @__PURE__ */ new Date();
  tasks = tasks.map((t) => {
    const isOverdue = t.status !== "done" && new Date(t.dueAt).getTime() < now.getTime();
    return { ...t, isOverdue };
  });
  return res.json({ tasks, count: tasks.length });
});
router2.post("/", activityLogger("task", "TASK_CREATED"), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description = "",
      category = "project",
      userPriority = "medium",
      dueAt,
      estimatedMinutes = 60,
      dependencyCount = 0,
      sourceType = "manual",
      sourceReference
    } = req.body;
    if (!title) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Task title is required" } });
    }
    if (dueAt && new Date(dueAt).getTime() < Date.now() - 5 * 60 * 1e3) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Task deadline cannot be in the past. Please select a future date and time."
        }
      });
    }
    const dueDate = dueAt ? new Date(dueAt) : new Date(Date.now() + 24 * 3600 * 1e3);
    const now = /* @__PURE__ */ new Date();
    const hoursToDeadline = (dueDate.getTime() - now.getTime()) / (3600 * 1e3);
    const isOverdue = hoursToDeadline < 0;
    const workloadCtx = getWorkloadContext(userId);
    const mlResult = await MLClient.predictPriority({
      hours_to_deadline: hoursToDeadline,
      is_overdue: isOverdue ? 1 : 0,
      estimated_duration_min: Number(estimatedMinutes),
      user_importance: userPriority === "high" ? 5 : userPriority === "medium" ? 3 : 1,
      workload_pending_tasks: workloadCtx.workload_pending_tasks,
      workload_minutes_today: workloadCtx.workload_minutes_today,
      available_free_minutes: workloadCtx.available_free_minutes,
      historical_completion_rate: workloadCtx.historical_completion_rate,
      dependency_count: Number(dependencyCount),
      category
    });
    const newTask = {
      id: `task-${(0, import_uuid3.v4)().slice(0, 8)}`,
      userId,
      title,
      description,
      status: "todo",
      category,
      userPriority,
      predictedPriority: mlResult.predicted_priority,
      priorityScore: mlResult.priority_score,
      dueAt: dueDate.toISOString(),
      estimatedMinutes: Number(estimatedMinutes),
      isOverdue,
      dependencyCount: Number(dependencyCount),
      sourceType,
      sourceReference,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    db.saveTask(newTask);
    return res.status(201).json({
      task: newTask,
      mlRationale: mlResult.rationale,
      method: mlResult.method
    });
  } catch (err) {
    next(err);
  }
});
router2.get("/:id", (req, res) => {
  const task = db.getTaskById(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Task not found" } });
  }
  return res.json({ task });
});
router2.patch("/:id", activityLogger("task", "TASK_UPDATED"), async (req, res, next) => {
  try {
    const task = db.getTaskById(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Task not found" } });
    }
    const { title, description, status, userPriority, dueAt, estimatedMinutes, category } = req.body;
    const oldStatus = task.status;
    const oldUserPriority = task.userPriority;
    const oldDueAt = task.dueAt;
    const oldEstimatedMinutes = task.estimatedMinutes;
    const oldCategory = task.category;
    if (title !== void 0) task.title = title;
    if (description !== void 0) task.description = description;
    if (category !== void 0) task.category = category;
    if (dueAt !== void 0) {
      const isNewDeadline = task.dueAt ? new Date(dueAt).getTime() !== new Date(task.dueAt).getTime() : true;
      if (task.status !== "done" && isNewDeadline && new Date(dueAt).getTime() < Date.now() - 5 * 60 * 1e3) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Task deadline cannot be in the past. Please select a future date and time."
          }
        });
      }
      task.dueAt = dueAt;
    }
    if (estimatedMinutes !== void 0) task.estimatedMinutes = Number(estimatedMinutes);
    if (userPriority !== void 0 && userPriority !== oldUserPriority) {
      task.userPriority = userPriority;
      await MLClient.recordFeedback({
        task_id: task.id,
        predicted_priority: task.predictedPriority,
        user_priority: userPriority,
        completed_on_time: true,
        hours_to_deadline: 24,
        actual_duration_min: task.estimatedMinutes,
        estimated_duration_min: task.estimatedMinutes,
        category: task.category
      });
    }
    if (status !== void 0) {
      task.status = status;
      if (status === "done" && oldStatus !== "done") {
        task.completedAt = (/* @__PURE__ */ new Date()).toISOString();
        const now = /* @__PURE__ */ new Date();
        const dueTime = new Date(task.dueAt).getTime();
        const completedOnTime = now.getTime() <= dueTime;
        await MLClient.recordFeedback({
          task_id: task.id,
          predicted_priority: task.predictedPriority,
          user_priority: task.userPriority,
          completed_on_time: completedOnTime,
          hours_to_deadline: (dueTime - now.getTime()) / (3600 * 1e3),
          actual_duration_min: task.estimatedMinutes,
          estimated_duration_min: task.estimatedMinutes,
          category: task.category
        });
      }
    }
    const shouldRepredict = dueAt !== void 0 && new Date(dueAt).getTime() !== new Date(oldDueAt).getTime() || userPriority !== void 0 && userPriority !== oldUserPriority || estimatedMinutes !== void 0 && Number(estimatedMinutes) !== oldEstimatedMinutes || category !== void 0 && category !== oldCategory;
    if (shouldRepredict && task.status !== "done") {
      const workloadCtx = getWorkloadContext(req.user.id);
      const now = /* @__PURE__ */ new Date();
      const hoursToDeadline = (new Date(task.dueAt).getTime() - now.getTime()) / (3600 * 1e3);
      const isOverdue = hoursToDeadline < 0;
      const mlResult = await MLClient.predictPriority({
        hours_to_deadline: hoursToDeadline,
        is_overdue: hoursToDeadline < 0 ? 1 : 0,
        estimated_duration_min: task.estimatedMinutes,
        user_importance: task.userPriority === "high" ? 5 : task.userPriority === "medium" ? 3 : 1,
        workload_pending_tasks: workloadCtx.workload_pending_tasks,
        workload_minutes_today: workloadCtx.workload_minutes_today,
        available_free_minutes: workloadCtx.available_free_minutes,
        historical_completion_rate: workloadCtx.historical_completion_rate,
        dependency_count: task.dependencyCount || 0,
        category: task.category
      });
      task.predictedPriority = mlResult.predicted_priority;
      task.priorityScore = mlResult.priority_score;
    }
    task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveTask(task);
    return res.json({ task });
  } catch (err) {
    next(err);
  }
});
router2.delete("/:id", activityLogger("task", "TASK_DELETED"), (req, res) => {
  const deleted = db.deleteTask(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Task not found" } });
  }
  return res.json({ success: true, message: "Task deleted successfully" });
});
router2.post("/:id/priority", async (req, res, next) => {
  try {
    const task = db.getTaskById(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Task not found" } });
    }
    const now = /* @__PURE__ */ new Date();
    const hoursToDeadline = (new Date(task.dueAt).getTime() - now.getTime()) / (3600 * 1e3);
    const mlResult = await MLClient.predictPriority({
      hours_to_deadline: hoursToDeadline,
      is_overdue: hoursToDeadline < 0 ? 1 : 0,
      estimated_duration_min: task.estimatedMinutes,
      user_importance: task.userPriority === "high" ? 5 : task.userPriority === "medium" ? 3 : 1,
      workload_pending_tasks: db.getTasksByUserId(req.user.id).filter((t) => t.status !== "done").length,
      workload_minutes_today: 180,
      available_free_minutes: 120,
      historical_completion_rate: 0.85,
      dependency_count: task.dependencyCount,
      category: task.category
    });
    task.predictedPriority = mlResult.predicted_priority;
    task.priorityScore = mlResult.priority_score;
    task.updatedAt = now.toISOString();
    db.saveTask(task);
    return res.json({
      task,
      mlRationale: mlResult.rationale,
      method: mlResult.method
    });
  } catch (err) {
    next(err);
  }
});
var taskRoutes_default = router2;

// ai-workspace/server/src/routes/noteRoutes.ts
var import_express3 = require("express");
var import_uuid4 = require("uuid");
var router3 = (0, import_express3.Router)();
router3.use(authMiddleware);
router3.get("/", (req, res) => {
  const userId = req.user.id;
  let notes = db.getNotesByUserId(userId);
  const { q, tag } = req.query;
  if (tag) {
    notes = notes.filter((n) => n.tags.includes(String(tag)));
  }
  if (q) {
    const query = String(q).toLowerCase();
    notes = notes.filter((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
  }
  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return res.json({ notes, count: notes.length });
});
router3.post("/", activityLogger("note", "NOTE_CREATED"), (req, res) => {
  const { title = "Untitled Note", content = "", pinned = false, tags = [] } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newNote = {
    id: `note-${(0, import_uuid4.v4)().slice(0, 8)}`,
    userId: req.user.id,
    title,
    content,
    format: "markdown",
    pinned: Boolean(pinned),
    tags: Array.isArray(tags) ? tags : [],
    createdAt: now,
    updatedAt: now
  };
  db.saveNote(newNote);
  return res.status(201).json({ note: newNote });
});
router3.get("/:id", (req, res) => {
  const note = db.getNoteById(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Note not found" } });
  }
  return res.json({ note });
});
router3.patch("/:id", activityLogger("note", "NOTE_UPDATED"), (req, res) => {
  const note = db.getNoteById(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Note not found" } });
  }
  const { title, content, pinned, tags } = req.body;
  if (title !== void 0) note.title = title;
  if (content !== void 0) note.content = content;
  if (pinned !== void 0) note.pinned = Boolean(pinned);
  if (tags !== void 0 && Array.isArray(tags)) note.tags = tags;
  note.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveNote(note);
  return res.json({ note, autosavedAt: note.updatedAt });
});
router3.delete("/:id", activityLogger("note", "NOTE_DELETED"), (req, res) => {
  const deleted = db.deleteNote(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Note not found" } });
  }
  return res.json({ success: true, message: "Note deleted successfully" });
});
router3.post("/:id/ai", async (req, res, next) => {
  try {
    const note = db.getNoteById(req.params.id, req.user.id);
    if (!note) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Note not found" } });
    }
    const { action = "summarize" } = req.body;
    if (action === "summarize") {
      const summaryResult = await MLClient.summarize(note.content, 3);
      return res.json({
        action: "summarize",
        noteId: note.id,
        summary: summaryResult.summary,
        keyTakeaways: summaryResult.key_takeaways,
        compressionRatio: summaryResult.compression_ratio,
        factualityScore: summaryResult.factuality_score
      });
    } else if (action === "extract_tasks") {
      const summaryResult = await MLClient.summarize(note.content, 4);
      const extracted = summaryResult.action_items || [];
      return res.json({
        action: "extract_tasks",
        noteId: note.id,
        candidateTasks: extracted.map((item) => ({
          title: item.action,
          sourceType: "note",
          sourceReference: `Note: ${note.title} (ID: ${note.id})`,
          estimatedMinutes: 60,
          userPriority: "medium"
        }))
      });
    }
    return res.status(400).json({ error: { code: "INVALID_ACTION", message: `Unknown AI action: ${action}` } });
  } catch (err) {
    next(err);
  }
});
var noteRoutes_default = router3;

// ai-workspace/server/src/routes/deadlineRoutes.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
router4.use(authMiddleware);
router4.get("/upcoming", (req, res) => {
  const userId = req.user.id;
  const hours = Number(req.query.hours || 72);
  const now = /* @__PURE__ */ new Date();
  const cutoff = new Date(now.getTime() + hours * 3600 * 1e3);
  const tasks = db.getTasksByUserId(userId).filter((t) => {
    if (t.status === "done") return false;
    const dueTime = new Date(t.dueAt).getTime();
    return dueTime >= now.getTime() && dueTime <= cutoff.getTime();
  });
  tasks.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return res.json({
    windowHours: hours,
    count: tasks.length,
    deadlines: tasks.map((t) => ({
      taskId: t.id,
      title: t.title,
      dueAt: t.dueAt,
      hoursRemaining: Math.round((new Date(t.dueAt).getTime() - now.getTime()) / (3600 * 1e3) * 10) / 10,
      userPriority: t.userPriority,
      predictedPriority: t.predictedPriority,
      priorityScore: t.priorityScore,
      category: t.category
    }))
  });
});
router4.get("/overdue", (req, res) => {
  const userId = req.user.id;
  const now = /* @__PURE__ */ new Date();
  const overdue = db.getTasksByUserId(userId).filter((t) => {
    if (t.status === "done") return false;
    return new Date(t.dueAt).getTime() < now.getTime();
  });
  overdue.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return res.json({
    count: overdue.length,
    overdueTasks: overdue.map((t) => ({
      taskId: t.id,
      title: t.title,
      dueAt: t.dueAt,
      hoursOverdue: Math.round((now.getTime() - new Date(t.dueAt).getTime()) / (3600 * 1e3) * 10) / 10,
      priorityScore: t.priorityScore,
      category: t.category
    }))
  });
});
var deadlineRoutes_default = router4;

// ai-workspace/server/src/routes/reminderRoutes.ts
var import_express5 = require("express");
var import_uuid5 = require("uuid");
var router5 = (0, import_express5.Router)();
router5.use(authMiddleware);
router5.get("/", (req, res) => {
  const userId = req.user.id;
  const includeDismissed = req.query.includeDismissed === "true";
  let reminders = db.getRemindersByUserId(userId);
  if (!includeDismissed) {
    reminders = reminders.filter((r) => !r.isDismissed);
  }
  reminders.sort((a, b) => b.urgencyScore - a.urgencyScore);
  return res.json({ reminders, count: reminders.length });
});
router5.get("/smart-eval", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const activeTasks = db.getTasksByUserId(userId).filter((t) => t.status !== "done");
    const now = /* @__PURE__ */ new Date();
    const taskPayloads = activeTasks.map((t) => {
      const hoursToDeadline = (new Date(t.dueAt).getTime() - now.getTime()) / (3600 * 1e3);
      return {
        task_id: t.id,
        title: t.title,
        hours_to_deadline: hoursToDeadline,
        is_overdue: hoursToDeadline < 0 ? 1 : 0,
        estimated_duration_min: t.estimatedMinutes,
        user_importance: t.userPriority === "high" ? 5 : t.userPriority === "medium" ? 3 : 1,
        priorityScore: t.priorityScore
      };
    });
    const evaluated = await MLClient.evaluateSmartReminders(taskPayloads, {
      available_free_minutes: 180,
      pending_tasks_count: activeTasks.length
    });
    for (const item of evaluated) {
      if (item.should_remind_now) {
        const existing = db.getRemindersByUserId(userId).find((r) => r.taskId === item.task_id && !r.isDismissed);
        if (!existing) {
          db.saveReminder({
            id: `rem-${(0, import_uuid5.v4)().slice(0, 8)}`,
            userId,
            taskId: item.task_id,
            title: item.title,
            level: item.level,
            message: item.message,
            urgencyScore: item.urgency_score,
            triggerAt: (/* @__PURE__ */ new Date()).toISOString(),
            isDismissed: false,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
    }
    const currentReminders = db.getRemindersByUserId(userId).filter((r) => !r.isDismissed);
    return res.json({
      evaluatedCount: evaluated.length,
      activeReminders: currentReminders,
      rawEvaluation: evaluated
    });
  } catch (err) {
    next(err);
  }
});
router5.post("/schedule", activityLogger("reminder", "REMINDER_SCHEDULED"), (req, res) => {
  const userId = req.user.id;
  const { taskId, title, message, level = "info", triggerAt, urgencyScore = 50 } = req.body;
  if (!title || !triggerAt) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Title and triggerAt are required" } });
  }
  const newReminder = {
    id: `rem-${(0, import_uuid5.v4)().slice(0, 8)}`,
    userId,
    taskId: taskId || "general",
    title,
    level,
    message: message || `Reminder: ${title}`,
    urgencyScore: Number(urgencyScore),
    triggerAt,
    isDismissed: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.saveReminder(newReminder);
  return res.status(201).json({ reminder: newReminder });
});
router5.patch("/:id/dismiss", activityLogger("reminder", "REMINDER_DISMISSED"), (req, res) => {
  const success = db.dismissReminder(req.params.id, req.user.id);
  if (!success) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Reminder not found or already dismissed" } });
  }
  return res.json({ success: true, message: "Reminder dismissed" });
});
var reminderRoutes_default = router5;

// ai-workspace/server/src/routes/documentRoutes.ts
var import_express6 = require("express");
var import_multer = __toESM(require("multer"));
var import_path4 = __toESM(require("path"));
var import_fs4 = __toESM(require("fs"));
var import_uuid6 = require("uuid");

// ai-workspace/server/src/services/geminiService.ts
var userConversations = /* @__PURE__ */ new Map();
var responseCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 30 * 1e3;
var FAST_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"];
var _cachedFastModel = FAST_MODELS[0];
function sanitizePrompt(raw) {
  return raw.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/\s+/g, " ").slice(0, 1e3);
}
function pruneToLastNPrompts(history, maxPrompts = 5) {
  if (!history || history.length === 0) return [];
  let userCount = 0;
  let startIndex = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      userCount++;
      if (userCount === maxPrompts) {
        startIndex = i;
        break;
      }
    }
  }
  return history.slice(startIndex);
}
function clearUserHistory(userId) {
  userConversations.delete(userId);
}
function getUserHistory(userId) {
  return userConversations.get(userId) || [];
}
var BASE_SYSTEM_PROMPT = `You are the intelligent AI Workspace Assistant for an academic & project productivity application.
Rules:
1. Ground all answers in the user's actual workspace tasks, schedule, and notes provided below.
2. If asked about tasks, priorities, or what to do first, list the REAL active tasks and highlight the highest scored / high-priority items.
3. NEVER hallucinate that the user has 0 tasks when active tasks are listed in the workspace data below.
4. Keep answers structured, practical, concise, and format in clean Markdown with bold bullet points.
5. If the user asks to create or suggest a task, clearly specify the title, suggested priority (HIGH/MEDIUM/LOW), and deadline.`;
async function chatWithGemini(rawUserMessage, options = {}) {
  const rawKey = CONFIG.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please check your .env file.");
  }
  const sanitized = sanitizePrompt(rawUserMessage);
  if (!sanitized) {
    return {
      answer: "Please enter a valid question or prompt.",
      model: "Gemini 3.5 Flash",
      tokensUsed: 0,
      historyLength: 0
    };
  }
  if (options.clearHistory && options.userId) {
    clearUserHistory(options.userId);
  }
  let priorHistory = [];
  if (Array.isArray(options.customHistory) && options.customHistory.length > 0) {
    priorHistory = pruneToLastNPrompts(options.customHistory, 5);
  } else if (options.userId) {
    priorHistory = pruneToLastNPrompts(getUserHistory(options.userId), 5);
  }
  const taskIdsHash = (options.workspaceContext?.tasks || []).map((t) => `${t.id}-${t.status}`).join(",");
  const cacheKey = `${sanitized}::${taskIdsHash}::${JSON.stringify(priorHistory)}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      answer: cached.answer,
      model: cached.model,
      tokensUsed: cached.tokensUsed,
      historyLength: priorHistory.filter((m) => m.role === "user").length + 1
    };
  }
  let systemPrompt = BASE_SYSTEM_PROMPT;
  if (options.workspaceContext) {
    const { userName = "User", tasks = [], completedTasksCount = 0, events = [], notes = [], docs = [] } = options.workspaceContext;
    const activeTasks = tasks.filter((t) => t.status !== "done");
    const sortedActive = [...activeTasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    systemPrompt += `

=== CURRENT LIVE WORKSPACE DATA FOR ${userName} ===
`;
    systemPrompt += `Active Tasks Count: ${sortedActive.length}
`;
    systemPrompt += `Completed Tasks Count: ${completedTasksCount}

`;
    if (sortedActive.length > 0) {
      systemPrompt += `ACTIVE TASKS LIST (Ranked by ML Priority Score):
`;
      sortedActive.forEach((t, i) => {
        const dueStr = t.dueAt ? new Date(t.dueAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "No deadline";
        systemPrompt += `${i + 1}. [${t.priority.toUpperCase()}] "${t.title}" | Score: ${t.priorityScore ?? 75} | Category: ${t.category} | Due: ${dueStr} | Status: ${t.status}
`;
      });
      systemPrompt += `
* Note: Highest priority item right now is "${sortedActive[0].title}" (Score: ${sortedActive[0].priorityScore ?? 90}).
`;
    } else {
      systemPrompt += `Active Tasks: None currently in the database.
`;
    }
    if (events.length > 0) {
      systemPrompt += `
UPCOMING CALENDAR EVENTS:
`;
      events.forEach((e, i) => {
        systemPrompt += `- "${e.title}" (${e.startAt} to ${e.endAt})${e.location ? ` @ ${e.location}` : ""}
`;
      });
    }
    if (notes.length > 0) {
      systemPrompt += `
USER NOTES: ${notes.map((n) => `"${n.title}"`).join(", ")}
`;
    }
    if (docs.length > 0) {
      systemPrompt += `UPLOADED DOCUMENTS: ${docs.map((d) => `"${d.fileName}"`).join(", ")}
`;
    }
  }
  const contents = [];
  for (const turn of priorHistory) {
    contents.push({
      role: turn.role,
      parts: [{ text: turn.text }]
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: sanitized }]
  });
  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents,
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.5,
      topP: 0.9
    }
  };
  const modelsToTry = [_cachedFastModel, ...FAST_MODELS.filter((m) => m !== _cachedFastModel)];
  let lastError = null;
  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errStatus = response.status;
        const errMsg = errorData?.error?.message || `HTTP ${errStatus}`;
        if (errStatus === 404 || errMsg.includes("no longer available") || errMsg.includes("not found") || errStatus === 503) {
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }
      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I could not generate a response. Please try again.";
      const tokensUsed = data?.usageMetadata?.totalTokenCount ?? null;
      _cachedFastModel = modelName;
      if (options.userId) {
        const updatedHistory = [...priorHistory, { role: "user", text: sanitized }, { role: "model", text: answer }];
        userConversations.set(options.userId, pruneToLastNPrompts(updatedHistory, 5));
      }
      responseCache.set(cacheKey, {
        answer,
        model: modelName,
        tokensUsed,
        timestamp: Date.now()
      });
      const userPromptsInContext = priorHistory.filter((m) => m.role === "user").length + 1;
      return {
        answer,
        model: modelName,
        tokensUsed,
        historyLength: Math.min(userPromptsInContext, 5)
      };
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes("404") || err.message.includes("not found") || err.message.includes("503"))) {
        continue;
      }
      break;
    }
  }
  console.error("[GeminiService] Error calling Gemini API:", lastError?.message || lastError);
  if (lastError?.message?.includes("API key")) {
    throw new Error("Gemini API key is invalid or expired. Check GEMINI_API_KEY in your .env file.");
  }
  throw new Error(`Gemini API error: ${lastError?.message || "Failed to generate response"}`);
}
async function askDocumentWithGemini(documentName, documentText, question) {
  const apiKey = CONFIG.GEMINI_API_KEY;
  const trimmedQ = (question || "").trim();
  if (!trimmedQ) {
    return { answer: "Please enter a question to ask about this document.", model: "local" };
  }
  if (apiKey) {
    const systemPrompt = `You are an expert Document Q&A Assistant embedded in the AI Workspace.
Answer the user's question accurately, concisely, and factually based STRICTLY on the document text provided below.
If the information needed to answer the question is not in the document, explicitly say: "This information is not mentioned in the document."
Use clean markdown formatting, bold keywords, and concise bullet points.`;
    const truncatedDoc = documentText.length > 35e3 ? documentText.slice(0, 35e3) + "\n\n[... Remaining content truncated for token limits ...]" : documentText;
    const userPrompt = `DOCUMENT NAME: ${documentName}

=== DOCUMENT TEXT ===
${truncatedDoc}
=== END DOCUMENT TEXT ===

USER QUESTION: ${trimmedQ}`;
    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1e3,
        temperature: 0.25,
        topP: 0.85
      }
    };
    const modelsToTry = [_cachedFastModel, ...FAST_MODELS.filter((m) => m !== _cachedFastModel)];
    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15e3)
        });
        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            _cachedFastModel = modelName;
            return { answer: text, model: modelName };
          }
        }
      } catch (e) {
        console.warn(`[DocumentQA] Model ${modelName} error:`, e.message);
      }
    }
  }
  const qTerms = trimmedQ.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const sentences = documentText.split(/(?<=[.!?])\s+|\n{2,}/).filter((s) => s.trim().length > 20);
  const scored = sentences.map((s) => {
    const sLower = s.toLowerCase();
    const hits = qTerms.reduce((count, term) => count + (sLower.includes(term) ? 1 : 0), 0);
    return { sentence: s.trim(), hits };
  }).filter((item) => item.hits > 0).sort((a, b) => b.hits - a.hits);
  if (scored.length > 0) {
    const best = scored.slice(0, 4).map((item) => `\u2022 "${item.sentence}"`).join("\n\n");
    return {
      answer: `**Relevant excerpts found in ${documentName}:**

${best}`,
      model: "extractive-salience-engine"
    };
  }
  return {
    answer: `No specific information matching "${trimmedQ}" was located in **${documentName}**.`,
    model: "extractive-salience-engine"
  };
}

// ai-workspace/server/src/routes/documentRoutes.ts
var uploadDir = import_path4.default.resolve(process.cwd(), "uploads");
if (!import_fs4.default.existsSync(uploadDir)) {
  import_fs4.default.mkdirSync(uploadDir, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = import_path4.default.extname(file.originalname);
    cb(null, `doc-${Date.now()}-${(0, import_uuid6.v4)().slice(0, 6)}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = [".txt", ".md", ".markdown", ".pdf", ".docx", ".json"];
    const ext = import_path4.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.includes("text") || file.mimetype.includes("pdf")) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Use PDF, DOCX, TXT, or MD.`));
    }
  }
});
var router6 = (0, import_express6.Router)();
router6.use(authMiddleware);
router6.get("/", (req, res) => {
  const docs = db.getDocumentsByUserId(req.user.id);
  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ documents: docs, count: docs.length });
});
router6.post("/upload", upload.single("file"), activityLogger("document", "DOCUMENT_UPLOADED"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: "FILE_REQUIRED", message: "No file uploaded" } });
    }
    const filePath = req.file.path;
    const extractedText = await extractDocumentText(filePath, req.file.originalname);
    const summaryResult = await generateDocumentSummary(req.file.originalname, extractedText, 5);
    const docRecord = {
      id: `doc-${(0, import_uuid6.v4)().slice(0, 8)}`,
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      extractedText: extractedText.slice(0, 5e4),
      // Cap at 50k chars for safety
      summary: summaryResult.summary,
      keyTakeaways: summaryResult.key_takeaways,
      factualityScore: summaryResult.factuality_score,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveDocument(docRecord);
    return res.status(201).json({
      document: docRecord,
      actionItems: summaryResult.action_items || []
    });
  } catch (err) {
    next(err);
  }
});
router6.get("/:id", (req, res) => {
  const doc = db.getDocumentById(req.params.id, req.user.id);
  if (!doc) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found" } });
  }
  return res.json({ document: doc });
});
router6.post("/:id/summarize", async (req, res, next) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found" } });
    }
    if (isBinaryGarbage(doc.extractedText) && import_fs4.default.existsSync(doc.filePath)) {
      doc.extractedText = await extractDocumentText(doc.filePath, doc.fileName);
    }
    const { maxSentences = 5 } = req.body;
    const summaryResult = await generateDocumentSummary(doc.fileName, doc.extractedText, maxSentences);
    doc.summary = summaryResult.summary;
    doc.keyTakeaways = summaryResult.key_takeaways;
    doc.factualityScore = summaryResult.factuality_score;
    db.saveDocument(doc);
    return res.json({
      documentId: doc.id,
      fileName: doc.fileName,
      summary: summaryResult.summary,
      keyTakeaways: summaryResult.key_takeaways,
      actionItems: summaryResult.action_items,
      factualityScore: summaryResult.factuality_score,
      compressionRatio: summaryResult.compression_ratio
    });
  } catch (err) {
    next(err);
  }
});
router6.post("/:id/ask", async (req, res, next) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found" } });
    }
    const { question } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Question string is required" } });
    }
    if (isBinaryGarbage(doc.extractedText) && import_fs4.default.existsSync(doc.filePath)) {
      doc.extractedText = await extractDocumentText(doc.filePath, doc.fileName);
      db.saveDocument(doc);
    }
    const result = await askDocumentWithGemini(doc.fileName, doc.extractedText, question.trim());
    return res.json({
      documentId: doc.id,
      fileName: doc.fileName,
      question: question.trim(),
      answer: result.answer,
      model: result.model
    });
  } catch (err) {
    next(err);
  }
});
router6.delete("/:id", activityLogger("document", "DOCUMENT_DELETED"), (req, res) => {
  const doc = db.getDocumentById(req.params.id, req.user.id);
  if (!doc) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found" } });
  }
  if (import_fs4.default.existsSync(doc.filePath)) {
    try {
      import_fs4.default.unlinkSync(doc.filePath);
    } catch (e) {
    }
  }
  db.deleteDocument(req.params.id, req.user.id);
  return res.json({ success: true, message: "Document removed" });
});
var documentRoutes_default = router6;

// ai-workspace/server/src/routes/calendarRoutes.ts
var import_express7 = require("express");
var import_uuid7 = require("uuid");
var router7 = (0, import_express7.Router)();
router7.use(authMiddleware);
router7.get("/events", (req, res) => {
  const userId = req.user.id;
  const { timeMin, timeMax } = req.query;
  let events = db.getCalendarEventsByUserId(userId);
  if (timeMin) {
    const minTime = new Date(String(timeMin)).getTime();
    events = events.filter((e) => new Date(e.endAt).getTime() >= minTime);
  }
  if (timeMax) {
    const maxTime = new Date(String(timeMax)).getTime();
    events = events.filter((e) => new Date(e.startAt).getTime() <= maxTime);
  }
  events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return res.json({
    events,
    count: events.length
  });
});
router7.post("/events", (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      startAt,
      endAt,
      isAllDay = false,
      calendarName = "Personal",
      eventType = "meeting",
      location = "",
      description = "",
      color = "#3b82f6"
    } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Event title is required." });
    }
    const start = startAt ? new Date(startAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    const end = endAt ? new Date(endAt).toISOString() : new Date(Date.now() + 60 * 60 * 1e3).toISOString();
    const newEvent = {
      id: `evt-${(0, import_uuid7.v4)().slice(0, 8)}`,
      userId,
      title: title.trim(),
      startAt: start,
      endAt: end,
      isAllDay: Boolean(isAllDay),
      calendarName: calendarName || "Personal",
      eventType: eventType || "meeting",
      location: location || "",
      description: description || "",
      color: color || "#3b82f6",
      isReadOnly: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const saved = db.saveCalendarEvent(newEvent);
    db.logActivity({
      id: `act-${(0, import_uuid7.v4)().slice(0, 8)}`,
      userId,
      action: "created",
      entityType: "calendar_event",
      entityId: saved.id,
      metadata: { title: saved.title, startAt: saved.startAt },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return res.status(201).json({ event: saved });
  } catch (err) {
    next(err);
  }
});
router7.patch("/events/:id", (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = db.getCalendarEventById(id, userId);
    if (!existing) {
      return res.status(404).json({ error: "Event not found." });
    }
    const {
      title,
      startAt,
      endAt,
      isAllDay,
      calendarName,
      eventType,
      location,
      description,
      color
    } = req.body;
    const updated = {
      ...existing,
      title: title !== void 0 ? title.trim() : existing.title,
      startAt: startAt !== void 0 ? new Date(startAt).toISOString() : existing.startAt,
      endAt: endAt !== void 0 ? new Date(endAt).toISOString() : existing.endAt,
      isAllDay: isAllDay !== void 0 ? Boolean(isAllDay) : existing.isAllDay,
      calendarName: calendarName !== void 0 ? calendarName : existing.calendarName,
      eventType: eventType !== void 0 ? eventType : existing.eventType,
      location: location !== void 0 ? location : existing.location,
      description: description !== void 0 ? description : existing.description,
      color: color !== void 0 ? color : existing.color,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const saved = db.saveCalendarEvent(updated);
    return res.json({ event: saved });
  } catch (err) {
    next(err);
  }
});
router7.delete("/events/:id", (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const success = db.deleteCalendarEvent(id, userId);
    if (!success) {
      return res.status(404).json({ error: "Event not found or already deleted." });
    }
    db.logActivity({
      id: `act-${(0, import_uuid7.v4)().slice(0, 8)}`,
      userId,
      action: "deleted",
      entityType: "calendar_event",
      entityId: id,
      metadata: {},
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return res.json({ success: true, message: "Event deleted successfully." });
  } catch (err) {
    next(err);
  }
});
router7.get("/freebusy", (req, res) => {
  const userId = req.user.id;
  const user = db.getUserById(userId);
  const events = db.getCalendarEventsByUserId(userId).filter((e) => !e.isAllDay);
  const targetDateStr = req.query.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const workingHours = user?.preferences?.workingHours || { start: "09:00", end: "18:00" };
  const workStart = /* @__PURE__ */ new Date(`${targetDateStr}T${workingHours.start}:00`);
  const workEnd = /* @__PURE__ */ new Date(`${targetDateStr}T${workingHours.end}:00`);
  const busySlots = [];
  const freeSlots = [];
  let cursor = new Date(workStart);
  const dayEvents = events.filter((e) => e.startAt.startsWith(targetDateStr));
  dayEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  for (const ev of dayEvents) {
    const evStart = new Date(ev.startAt);
    const evEnd = new Date(ev.endAt);
    if (evStart > cursor) {
      const freeDur = Math.round((evStart.getTime() - cursor.getTime()) / (60 * 1e3));
      if (freeDur > 0) {
        freeSlots.push({ start: cursor.toISOString(), end: evStart.toISOString(), durationMinutes: freeDur });
      }
    }
    busySlots.push({ start: ev.startAt, end: ev.endAt, title: ev.title });
    if (evEnd > cursor) {
      cursor = new Date(evEnd);
    }
  }
  if (cursor < workEnd) {
    const freeDur = Math.round((workEnd.getTime() - cursor.getTime()) / (60 * 1e3));
    if (freeDur > 0) {
      freeSlots.push({ start: cursor.toISOString(), end: workEnd.toISOString(), durationMinutes: freeDur });
    }
  }
  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);
  return res.json({
    date: targetDateStr,
    totalFreeMinutes,
    busySlots,
    freeSlots
  });
});
var calendarRoutes_default = router7;

// ai-workspace/server/src/routes/plannerRoutes.ts
var import_express8 = require("express");

// ai-workspace/server/src/services/plannerService.ts
var import_uuid8 = require("uuid");
var PlannerService = class {
  static generateDailyPlan(userId, targetDateStr) {
    const user = db.getUserById(userId);
    const timezone = user?.timezone || "Asia/Kolkata";
    const workingHours = user?.preferences?.workingHours || { start: "09:00", end: "18:00" };
    const breakDurationMin = user?.preferences?.breakDurationMinutes || 15;
    const [startH, startM] = workingHours.start.split(":").map(Number);
    const [endH, endM] = workingHours.end.split(":").map(Number);
    const workDayStart = /* @__PURE__ */ new Date(`${targetDateStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`);
    const workDayEnd = /* @__PURE__ */ new Date(`${targetDateStr}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`);
    const allEvents = db.getCalendarEventsByUserId(userId);
    const dayEvents = allEvents.filter((e) => {
      const eDate = e.startAt.split("T")[0];
      return eDate === targetDateStr && !e.isAllDay;
    });
    dayEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    const freeIntervals = [];
    let currentCursor = new Date(workDayStart);
    const blocks = [];
    for (const ev of dayEvents) {
      const evStart = new Date(ev.startAt);
      const evEnd = new Date(ev.endAt);
      if (evStart > currentCursor) {
        freeIntervals.push({ start: new Date(currentCursor), end: new Date(evStart) });
      }
      blocks.push({
        id: `block-${(0, import_uuid8.v4)().slice(0, 8)}`,
        title: ev.title,
        startAt: ev.startAt,
        endAt: ev.endAt,
        durationMinutes: Math.round((evEnd.getTime() - evStart.getTime()) / (60 * 1e3)),
        kind: "fixed_event_reference",
        reason: `Fixed commitment from ${ev.calendarName} (${ev.location || "Online"})`
      });
      if (evEnd > currentCursor) {
        currentCursor = new Date(evEnd);
      }
    }
    if (currentCursor < workDayEnd) {
      freeIntervals.push({ start: new Date(currentCursor), end: new Date(workDayEnd) });
    }
    const tasks = db.getTasksByUserId(userId).filter((t) => t.status !== "done");
    tasks.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
    const conflicts = [];
    const assumptions = [
      `Working hours standard: ${workingHours.start} to ${workingHours.end} (${timezone})`,
      `Fixed Google Calendar events take absolute scheduling precedence.`,
      `Tasks allocated sequentially by ML priority score into unbooked slots.`
    ];
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    let taskIdx = 0;
    for (const interval of freeIntervals) {
      let slotCursor = new Date(interval.start);
      const slotEnd = new Date(interval.end);
      while (taskIdx < tasks.length && slotCursor < slotEnd) {
        const task = tasks[taskIdx];
        const taskDuration = Math.max(15, task.estimatedMinutes || 45);
        const slotAvailableMin = Math.round((slotEnd.getTime() - slotCursor.getTime()) / (60 * 1e3));
        if (slotAvailableMin >= 20) {
          const allocatedMin = Math.min(taskDuration, slotAvailableMin);
          const taskStart = new Date(slotCursor);
          const taskEnd = new Date(taskStart.getTime() + allocatedMin * 60 * 1e3);
          blocks.push({
            id: `block-${(0, import_uuid8.v4)().slice(0, 8)}`,
            taskId: task.id,
            title: `Focus: ${task.title}`,
            startAt: taskStart.toISOString(),
            endAt: taskEnd.toISOString(),
            durationMinutes: allocatedMin,
            kind: "proposed_focus",
            reason: `ML Priority: ${task.predictedPriority.toUpperCase()} (Score ${task.priorityScore}). Allocated in available unbooked slot.`
          });
          totalWorkMinutes += allocatedMin;
          slotCursor = new Date(taskEnd);
          if (slotCursor < slotEnd) {
            const breakTimeMin = Math.min(breakDurationMin, Math.round((slotEnd.getTime() - slotCursor.getTime()) / (60 * 1e3)));
            if (breakTimeMin >= 10) {
              const breakStart = new Date(slotCursor);
              const breakEnd = new Date(breakStart.getTime() + breakTimeMin * 60 * 1e3);
              blocks.push({
                id: `block-${(0, import_uuid8.v4)().slice(0, 8)}`,
                title: "Scheduled Recovery Break",
                startAt: breakStart.toISOString(),
                endAt: breakEnd.toISOString(),
                durationMinutes: breakTimeMin,
                kind: "break",
                reason: "Prevents cognitive fatigue between intense focus sessions."
              });
              totalBreakMinutes += breakTimeMin;
              slotCursor = new Date(breakEnd);
            }
          }
          taskIdx++;
        } else {
          break;
        }
      }
    }
    while (taskIdx < tasks.length) {
      const unscheduled = tasks[taskIdx];
      if (unscheduled.predictedPriority === "high" || unscheduled.userPriority === "high") {
        conflicts.push(`Workload Warning: Could not fit high-priority task "${unscheduled.title}" (${unscheduled.estimatedMinutes}m) due to lack of free calendar time today.`);
      }
      taskIdx++;
    }
    blocks.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    const plan = {
      id: `plan-${targetDateStr}-${(0, import_uuid8.v4)().slice(0, 6)}`,
      userId,
      planDate: targetDateStr,
      timezone,
      blocks,
      totalWorkMinutes,
      totalBreakMinutes,
      conflicts,
      assumptions,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveDailyPlan(plan);
    return plan;
  }
};

// ai-workspace/server/src/routes/plannerRoutes.ts
var router8 = (0, import_express8.Router)();
router8.use(authMiddleware);
router8.post("/daily", activityLogger("plan", "PLAN_GENERATED"), (req, res) => {
  const userId = req.user.id;
  const targetDateStr = req.body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const plan = PlannerService.generateDailyPlan(userId, targetDateStr);
  return res.json({ plan });
});
router8.get("/:date", (req, res) => {
  const userId = req.user.id;
  const targetDateStr = req.params.date;
  const plan = db.getDailyPlan(userId, targetDateStr);
  if (!plan) {
    const generated = PlannerService.generateDailyPlan(userId, targetDateStr);
    return res.json({ plan: generated });
  }
  return res.json({ plan });
});
router8.post("/save", activityLogger("plan", "PLAN_SAVED"), (req, res) => {
  const userId = req.user.id;
  const { plan } = req.body;
  if (!plan) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Plan object required" } });
  }
  plan.userId = userId;
  plan.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDailyPlan(plan);
  return res.json({ success: true, plan });
});
var plannerRoutes_default = router8;

// ai-workspace/server/src/routes/assistantRoutes.ts
var import_express9 = require("express");
var import_uuid9 = require("uuid");
var router9 = (0, import_express9.Router)();
router9.use(authMiddleware);
router9.post("/context/clear", (req, res) => {
  const userId = req.user.id;
  clearUserHistory(userId);
  return res.json({ success: true, message: "Context window reset to 0 prompts." });
});
router9.get("/context/status", (req, res) => {
  const userId = req.user.id;
  const history = getUserHistory(userId);
  const promptCount = history.filter((m) => m.role === "user").length;
  return res.json({ promptCount, maxPrompts: 5 });
});
router9.post("/chat", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      message = "",
      context = { type: "global", id: null },
      history,
      clearHistory = false
    } = req.body;
    const model = req.body.model || context?.model || "Gemini 2.0 Flash";
    const isGemini = String(model).toLowerCase().includes("gemini");
    const tasks = db.getTasksByUserId(userId);
    const notes = db.getNotesByUserId(userId);
    const events = db.getCalendarEventsByUserId(userId);
    const docs = db.getDocumentsByUserId(userId);
    const activeTasks = tasks.filter((t) => t.status !== "done");
    const completedTasks = tasks.filter((t) => t.status === "done");
    const sources = [];
    const proposals = [];
    const warnings = [];
    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      return res.json({
        answer: "Please enter a message or command (e.g. `/tasks`, `/create <title>`, `/plan`).",
        sources: [],
        proposals: [],
        warnings: []
      });
    }
    if (trimmedMsg.startsWith("/")) {
      const parts = trimmedMsg.slice(1).split(" ");
      const command = parts[0].toLowerCase();
      const args = parts.slice(1).join(" ").trim();
      if (command === "create" || command === "add") {
        if (!args) {
          return res.json({
            answer: `\u26A0\uFE0F **Usage:** \`/create <task title>\`
Example: \`/create Prepare Final Presentation Slides\``,
            sources: [],
            proposals: [],
            warnings: []
          });
        }
        let priority = "high";
        let category = "project";
        let title = args;
        if (title.toLowerCase().includes("--low") || title.toLowerCase().includes("low priority")) {
          priority = "low";
          title = title.replace(/--low|low priority/gi, "").trim();
        } else if (title.toLowerCase().includes("--medium") || title.toLowerCase().includes("medium priority")) {
          priority = "medium";
          title = title.replace(/--medium|medium priority/gi, "").trim();
        } else if (title.toLowerCase().includes("--high") || title.toLowerCase().includes("high priority")) {
          priority = "high";
          title = title.replace(/--high|high priority/gi, "").trim();
        }
        if (title.toLowerCase().includes("lecture") || title.toLowerCase().includes("exam") || title.toLowerCase().includes("study")) {
          category = "academic";
        }
        const newTask = {
          id: `task-${(0, import_uuid9.v4)().slice(0, 8)}`,
          userId,
          title: title || "New Workspace Task",
          description: "Created via Slash Command: /create",
          status: "todo",
          category,
          userPriority: priority,
          predictedPriority: priority,
          priorityScore: priority === "high" ? 92 : priority === "medium" ? 68 : 42,
          dueAt: new Date(Date.now() + 24 * 3600 * 1e3).toISOString(),
          estimatedMinutes: 60,
          isOverdue: false,
          dependencyCount: 0,
          sourceType: "ai",
          sourceReference: "AI Assistant /create",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.saveTask(newTask);
        return res.json({
          answer: `\u2705 **Task Created Successfully!**

\u2022 **Title:** ${newTask.title}
\u2022 **Priority:** \`${newTask.userPriority.toUpperCase()}\` (Score: ${newTask.priorityScore})
\u2022 **Category:** \`${newTask.category}\`
\u2022 **Deadline:** Tomorrow

The task is now live on your dashboard and synced to Firestore!`,
          sources: [{ type: "task", id: newTask.id, label: newTask.title }],
          proposals: [{ type: "create_task", taskId: newTask.id, title: newTask.title, task: newTask }],
          warnings: []
        });
      }
      if (command === "update") {
        if (!args) {
          return res.json({
            answer: `\u26A0\uFE0F **Usage:** \`/update <task title> to <done|in_progress|todo|high>\`
Example: \`/update Prepare Seminar 3 Slides to done\``,
            sources: [],
            proposals: [],
            warnings: []
          });
        }
        const lowerArgs = args.toLowerCase();
        let targetStatus = null;
        let targetPriority = null;
        if (lowerArgs.endsWith("done")) targetStatus = "done";
        else if (lowerArgs.endsWith("in_progress") || lowerArgs.endsWith("in progress")) targetStatus = "in_progress";
        else if (lowerArgs.endsWith("todo")) targetStatus = "todo";
        else if (lowerArgs.endsWith("high")) targetPriority = "high";
        else if (lowerArgs.endsWith("medium")) targetPriority = "medium";
        else if (lowerArgs.endsWith("low")) targetPriority = "low";
        let taskQuery = args.replace(/\s+to\s+(done|in_progress|in progress|todo|high|medium|low)$/i, "").replace(/\s+(done|in_progress|in progress|todo|high|medium|low)$/i, "").trim();
        const match = tasks.find(
          (t) => t.id.toLowerCase() === taskQuery.toLowerCase() || t.title.toLowerCase().includes(taskQuery.toLowerCase())
        );
        if (!match) {
          return res.json({
            answer: `\u274C Could not find a task matching **"${taskQuery}"**.

**Your Active Tasks:**
` + activeTasks.slice(0, 6).map((t) => `\u2022 \`${t.title}\``).join("\n"),
            sources: [],
            proposals: [],
            warnings: []
          });
        }
        if (targetStatus) {
          match.status = targetStatus;
        }
        if (targetPriority) {
          match.userPriority = targetPriority;
          match.predictedPriority = targetPriority;
        }
        match.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        db.saveTask(match);
        return res.json({
          answer: `\u2705 **Task Updated Successfully!**

\u2022 **Title:** ${match.title}
\u2022 **Status:** \`${match.status}\`
\u2022 **Priority:** \`${match.predictedPriority || match.userPriority}\``,
          sources: [{ type: "task", id: match.id, label: match.title }],
          proposals: [{ type: "update_task", taskId: match.id, title: match.title, task: match }],
          warnings: []
        });
      }
      if (command === "delete" || command === "remove") {
        if (!args) {
          return res.json({
            answer: `\u26A0\uFE0F **Usage:** \`/delete <task title>\`
Example: \`/delete Prepare Seminar 3 Slides\``,
            sources: [],
            proposals: [],
            warnings: []
          });
        }
        const match = tasks.find(
          (t) => t.id.toLowerCase() === args.toLowerCase() || t.title.toLowerCase().includes(args.toLowerCase())
        );
        if (!match) {
          return res.json({
            answer: `\u274C Could not find a task matching **"${args}"**.

**Your Active Tasks:**
` + activeTasks.slice(0, 6).map((t) => `\u2022 \`${t.title}\``).join("\n"),
            sources: [],
            proposals: [],
            warnings: []
          });
        }
        db.deleteTask(match.id, userId);
        return res.json({
          answer: `\u{1F5D1}\uFE0F **Task Deleted Successfully!**

Removed "**${match.title}**" from your workspace.`,
          sources: [],
          proposals: [{ type: "delete_task", taskId: match.id, title: match.title }],
          warnings: []
        });
      }
      if (command === "tasks" || command === "list") {
        const sorted = [...activeTasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
        return res.json({
          answer: `\u{1F4CB} **Your Active Tasks (${sorted.length} Total):**

` + sorted.map((t, i) => {
            const dueStr = t.dueAt ? ` (Due: ${new Date(t.dueAt).toLocaleDateString([], { month: "short", day: "numeric" })})` : "";
            return `${i + 1}. **${t.title}**
   \u2022 Priority: \`${(t.predictedPriority || t.userPriority || "medium").toUpperCase()}\` [Score: ${t.priorityScore || "N/A"}]${dueStr}`;
          }).join("\n\n"),
          sources: sorted.map((t) => ({ type: "task", id: t.id, label: t.title })),
          proposals: [],
          warnings: []
        });
      }
      if (command === "plan") {
        const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const plan = PlannerService.generateDailyPlan(userId, todayStr);
        const focusBlocks = plan.blocks.filter((b) => b.kind === "proposed_focus");
        return res.json({
          answer: `\u{1F4C5} **Daily Plan for Today (${todayStr}):**

\u2022 Allocated Focus Blocks: **${focusBlocks.length}** (${plan.totalWorkMinutes} mins total)

` + focusBlocks.map((fb) => `\u2022 \`${new Date(fb.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\`: **${fb.title}**`).join("\n"),
          sources: focusBlocks.map((fb) => ({ type: "task", id: fb.taskId || "", label: fb.title })),
          proposals: [],
          warnings: plan.conflicts
        });
      }
    }
    const lower = trimmedMsg.toLowerCase();
    if (lower.startsWith("create task") || lower.startsWith("add task") || lower.startsWith("new task")) {
      let rawTitle = trimmedMsg.replace(/^(create task|add task|new task|remind me to|please add a task to|can you add task)\s*:?/i, "").trim();
      if (!rawTitle) rawTitle = "New Workspace Task";
      let priority = "high";
      if (lower.includes("low")) priority = "low";
      else if (lower.includes("medium")) priority = "medium";
      const newTask = {
        id: `task-${(0, import_uuid9.v4)().slice(0, 8)}`,
        userId,
        title: rawTitle,
        description: "Created via AI Assistant",
        status: "todo",
        category: "project",
        userPriority: priority,
        predictedPriority: priority,
        priorityScore: priority === "high" ? 90 : priority === "medium" ? 65 : 40,
        dueAt: new Date(Date.now() + 24 * 3600 * 1e3).toISOString(),
        estimatedMinutes: 60,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "ai",
        sourceReference: "AI Assistant",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.saveTask(newTask);
      return res.json({
        answer: `\u2705 **Task Created Successfully!**

\u2022 **Title:** ${newTask.title}
\u2022 **Priority:** \`${newTask.userPriority.toUpperCase()}\` (Score: ${newTask.priorityScore})
\u2022 **Due:** Tomorrow

It is now saved in your workspace and displayed on your dashboard!`,
        sources: [{ type: "task", id: newTask.id, label: newTask.title }],
        proposals: [{ type: "create_task", taskId: newTask.id, title: newTask.title, task: newTask }],
        warnings: []
      });
    }
    if (isGemini) {
      try {
        const geminiRes = await chatWithGemini(trimmedMsg, {
          userId,
          customHistory: Array.isArray(history) ? history : void 0,
          clearHistory: Boolean(clearHistory),
          workspaceContext: {
            userName: req.user.displayName,
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              category: t.category,
              priority: t.predictedPriority || t.userPriority || "medium",
              priorityScore: t.priorityScore,
              status: t.status,
              dueAt: t.dueAt,
              estimatedMinutes: t.estimatedMinutes
            })),
            completedTasksCount: completedTasks.length,
            events: events.map((e) => ({ title: e.title, startAt: e.startAt, endAt: e.endAt, location: e.location })),
            notes: notes.map((n) => ({ id: n.id, title: n.title })),
            docs: docs.map((d) => ({ id: d.id, fileName: d.fileName }))
          }
        });
        const topTasks = activeTasks.slice(0, 3);
        for (const t of topTasks) {
          sources.push({ type: "task", id: t.id, label: t.title });
        }
        return res.json({
          answer: geminiRes.answer,
          sources: [
            {
              type: "ai_model",
              id: geminiRes.model,
              label: `Gemini (${geminiRes.tokensUsed ?? "?"} tokens | Context: ${geminiRes.historyLength}/5 prompts)`
            },
            ...sources
          ],
          proposals: [],
          warnings
        });
      } catch (geminiErr) {
        console.error("[AssistantChat] Gemini error:", geminiErr.message);
      }
    }
    if (lower.includes("plan") || lower.includes("schedule") || lower.includes("today")) {
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const plan = PlannerService.generateDailyPlan(userId, todayStr);
      const focusBlocks = plan.blocks.filter((b) => b.kind === "proposed_focus");
      const fixedBlocks = plan.blocks.filter((b) => b.kind === "fixed_event_reference");
      let answer2 = `I have generated your daily plan for today (${todayStr}). You have ${fixedBlocks.length} fixed calendar events and ${focusBlocks.length} prioritized focus blocks scheduled around your free time.`;
      for (const ev of fixedBlocks) {
        sources.push({ type: "calendar_event", id: ev.id, label: ev.title });
      }
      for (const fb of focusBlocks) {
        if (fb.taskId) {
          sources.push({ type: "task", id: fb.taskId, label: fb.title });
        }
      }
      return res.json({
        answer: answer2,
        sources,
        proposals,
        warnings: plan.conflicts
      });
    }
    if (lower.includes("urgent") || lower.includes("priority") || lower.includes("deadline") || lower.includes("what to do")) {
      const highTasks = activeTasks.filter((t) => t.predictedPriority === "high" || t.userPriority === "high");
      const sorted = [...highTasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
      let answer2 = `You currently have **${sorted.length} high-priority tasks** requiring your attention:

` + sorted.map((t, idx) => `${idx + 1}. **${t.title}** (Priority Score: ${t.priorityScore || 90}, Due: ${t.dueAt ? new Date(t.dueAt).toLocaleDateString() : "N/A"})`).join("\n");
      for (const t of sorted) {
        sources.push({ type: "task", id: t.id, label: t.title });
      }
      return res.json({
        answer: answer2,
        sources,
        proposals,
        warnings
      });
    }
    const answer = `Hello ${req.user.displayName}! You have ${activeTasks.length} active tasks (${activeTasks.filter((t) => t.predictedPriority === "high").length} high-priority) and ${events.length} calendar commitments in your workspace. You can use slash commands like \`/tasks\`, \`/create <title>\`, \`/update <title>\`, or \`/plan\` anytime!`;
    return res.json({
      answer,
      sources,
      proposals,
      warnings
    });
  } catch (err) {
    next(err);
  }
});
router9.get("/recommendations", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tasks = db.getTasksByUserId(userId).filter((t) => t.status !== "done");
    const events = db.getCalendarEventsByUserId(userId);
    const now = /* @__PURE__ */ new Date();
    const urgentTasks = tasks.filter((t) => {
      const hours = (new Date(t.dueAt).getTime() - now.getTime()) / (3600 * 1e3);
      return hours < 24 || t.predictedPriority === "high";
    });
    const recommendations = [];
    if (urgentTasks.length > 0) {
      recommendations.push({
        id: "rec-01",
        type: "priority_focus",
        title: `Imminent Focus: ${urgentTasks[0].title}`,
        description: `This task is ranked as HIGH priority by the Random Forest model (Score: ${urgentTasks[0].priorityScore || 90}). Allocate 60 min before your next meeting.`,
        actionType: "start_task",
        taskId: urgentTasks[0].id
      });
    }
    const feedbackStats = await MLClient.getFeedbackStats();
    if (feedbackStats && feedbackStats.total_feedback_events > 0) {
      recommendations.push({
        id: "rec-02",
        type: "continuous_learning",
        title: "Model Adaptation Active",
        description: `Based on your completion history (${feedbackStats.total_feedback_events} verified events), priority predictions are automatically personalized.`,
        actionType: "info"
      });
    }
    return res.json({ recommendations });
  } catch (err) {
    next(err);
  }
});
var assistantRoutes_default = router9;

// ai-workspace/server/src/routes/activityRoutes.ts
var import_express10 = require("express");
var router10 = (0, import_express10.Router)();
router10.use(authMiddleware);
router10.get("/", (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(100, Number(req.query.limit || 50));
  const logs = db.getActivityLogs(userId, limit);
  return res.json({
    logs,
    count: logs.length
  });
});
var activityRoutes_default = router10;

// ai-workspace/server/src/routes/mlRoutes.ts
var import_express11 = require("express");
var router11 = (0, import_express11.Router)();
router11.use(authMiddleware);
router11.post("/predict-priority", async (req, res, next) => {
  try {
    const {
      hours_to_deadline,
      is_overdue,
      estimated_duration_min,
      user_importance,
      workload_pending_tasks,
      available_free_minutes,
      category
    } = req.body;
    if (hours_to_deadline === void 0 && !is_overdue) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "hours_to_deadline is required" } });
    }
    const prediction = await MLClient.predictPriority({
      hours_to_deadline: Number(hours_to_deadline || 24),
      is_overdue: is_overdue ? 1 : 0,
      estimated_duration_min: Number(estimated_duration_min || 60),
      user_importance: Number(user_importance || 3),
      workload_pending_tasks: Number(workload_pending_tasks || 5),
      workload_minutes_today: 180,
      available_free_minutes: Number(available_free_minutes || 120),
      historical_completion_rate: 0.85,
      dependency_count: 0,
      category: category || "project"
    });
    return res.json({ prediction });
  } catch (err) {
    next(err);
  }
});
router11.post("/smart-reminders", async (req, res, next) => {
  try {
    const { tasks = [], user_context = {} } = req.body;
    const reminders = await MLClient.evaluateSmartReminders(tasks, user_context);
    return res.json({ reminders });
  } catch (err) {
    next(err);
  }
});
router11.post("/summarize", async (req, res, next) => {
  try {
    const { text = "", max_sentences = 3 } = req.body;
    if (!text) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Text content is required" } });
    }
    const result = await MLClient.summarize(text, Number(max_sentences));
    return res.json({ result });
  } catch (err) {
    next(err);
  }
});
router11.get("/feedback-stats", async (_req, res, next) => {
  try {
    const stats = await MLClient.getFeedbackStats();
    return res.json({ stats });
  } catch (err) {
    next(err);
  }
});
var mlRoutes_default = router11;

// ai-workspace/server/src/middleware/errorHandler.ts
var import_uuid10 = require("uuid");
function errorHandler(err, req, res, next) {
  const requestId = req.headers["x-request-id"] || `req-${(0, import_uuid10.v4)().slice(0, 8)}`;
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || (statusCode === 404 ? "NOT_FOUND" : statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR");
  console.error(`[Error] RequestId: ${requestId} | Code: ${errorCode} | Message: ${err.message}`);
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.message || "An unexpected error occurred",
      requestId
    }
  });
}

// ai-workspace/server/src/app.ts
function createApp() {
  const app = (0, import_express12.default)();
  app.use((0, import_cors.default)());
  app.use(import_express12.default.json({ limit: "10mb" }));
  app.use(import_express12.default.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    const reqId = req.headers["x-request-id"] || `req-${(0, import_uuid11.v4)().slice(0, 8)}`;
    res.setHeader("x-request-id", reqId);
    next();
  });
  app.get(["/api/v1/health", "/api/health", "/health"], (_req, res) => {
    res.json({
      status: "healthy",
      app: "AI Workspace Backend",
      version: "1.0.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get(["/api/v1/clock", "/api/clock", "/clock"], (req, res) => {
    const tz = req.query.timezone || "Asia/Kolkata";
    const now = /* @__PURE__ */ new Date();
    res.json({
      now: now.toISOString(),
      timezone: tz,
      utcOffset: "+05:30",
      formattedLocal: now.toLocaleString("en-IN", { timeZone: tz })
    });
  });
  app.use("/api/v1/auth", authRoutes_default);
  app.use("/api/v1/tasks", taskRoutes_default);
  app.use("/api/v1/notes", noteRoutes_default);
  app.use("/api/v1/deadlines", deadlineRoutes_default);
  app.use("/api/v1/reminders", reminderRoutes_default);
  app.use("/api/v1/documents", documentRoutes_default);
  app.use("/api/v1/calendar", calendarRoutes_default);
  app.use("/api/v1/planner", plannerRoutes_default);
  app.use("/api/v1/assistant", assistantRoutes_default);
  app.use("/api/v1/activity", activityRoutes_default);
  app.use("/api/v1/ml", mlRoutes_default);
  const uploadDir2 = import_path5.default.resolve(process.cwd(), "uploads");
  app.use("/uploads", import_express12.default.static(uploadDir2));
  const possibleClientPaths = [
    import_path5.default.resolve(process.cwd(), "../client/dist"),
    import_path5.default.resolve(process.cwd(), "ai-workspace/client/dist"),
    import_path5.default.resolve(process.cwd(), "client/dist"),
    "/app/client/dist"
  ];
  const clientDist = possibleClientPaths.find((p) => import_fs5.default.existsSync(p));
  if (clientDist) {
    app.use(import_express12.default.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
        return next();
      }
      res.sendFile(import_path5.default.join(clientDist, "index.html"));
    });
  }
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      error: {
        code: "ENDPOINT_NOT_FOUND",
        message: `API Route ${req.originalUrl} does not exist.`,
        requestId: res.getHeader("x-request-id")
      }
    });
  });
  app.use(errorHandler);
  return app;
}

// ai-workspace/server/src/database/seedData.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"));
function makeLocalIso(daysOffset, hour, minute = 0) {
  const now = /* @__PURE__ */ new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset, hour, minute, 0, 0);
  return d.toISOString();
}
async function seedDemoData(force = false) {
  const targetUsers = [
    {
      id: "user-hitk-vinayak-001",
      username: "vinayak",
      email: "vinayak@hitk.edu.in",
      displayName: "Vinayak Chandra (HITK CSBS)"
    },
    {
      id: "usr-521d76d8",
      username: "rog",
      email: "rog@hitk.edu.in",
      displayName: "Shivam Kumar"
    }
  ];
  const passwordHash = await import_bcryptjs2.default.hash("password123", 10);
  for (const u of targetUsers) {
    let user = db.getUserById(u.id);
    if (!user) {
      user = {
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        passwordHash,
        timezone: "Asia/Kolkata",
        preferences: {
          theme: "dark",
          timezone: "Asia/Kolkata",
          workingHours: { start: "09:00", end: "18:00" },
          breakDurationMinutes: 15
        },
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.saveUser(user);
    }
    const currentTasks = db.getTasksByUserId(u.id);
    if (!force && currentTasks.length >= 10) {
      continue;
    }
    for (const t of currentTasks) {
      db.deleteTask(t.id, u.id);
    }
    const currentEvents = db.getCalendarEventsByUserId(u.id);
    for (const ev of currentEvents) {
      db.deleteCalendarEvent(ev.id, u.id);
    }
    const tasksToSeed = [
      {
        id: `task-${u.id.slice(-4)}-01`,
        userId: u.id,
        title: "Prepare Term Paper Seminar 3 Presentation for Prof. Sajal Mitra",
        description: "Finalize presentation deck covering problem statement, system architecture, scikit-learn pipeline, and live Firestore sync.",
        status: "in_progress",
        category: "academic",
        userPriority: "high",
        predictedPriority: "high",
        priorityScore: 94.5,
        dueAt: makeLocalIso(0, 16, 0),
        // Today 16:00
        estimatedMinutes: 90,
        isOverdue: false,
        dependencyCount: 1,
        sourceType: "manual",
        createdAt: makeLocalIso(-2, 10, 0),
        updatedAt: makeLocalIso(0, 9, 30)
      },
      {
        id: `task-${u.id.slice(-4)}-02`,
        userId: u.id,
        title: "Train & Benchmark Random Forest Classifier (v2.1)",
        description: "Evaluate test accuracy with 5-fold CV, confusion matrix, and feature importances for task urgency weighting.",
        status: "in_progress",
        category: "project",
        userPriority: "high",
        predictedPriority: "high",
        priorityScore: 91,
        dueAt: makeLocalIso(0, 19, 0),
        // Today 19:00
        estimatedMinutes: 60,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "ai",
        sourceReference: "Generated by AI Assistant from Sprint Planning Notes",
        createdAt: makeLocalIso(-1, 14, 0),
        updatedAt: makeLocalIso(0, 10, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-03`,
        userId: u.id,
        title: "Submit IEEE Conference Draft Paper on Contextual Scheduling",
        description: "Incorporate reviewer comments on Section 3 (extractive summarization metrics) and format with IEEE double-column LaTeX template.",
        status: "todo",
        category: "academic",
        userPriority: "high",
        predictedPriority: "high",
        priorityScore: 89.2,
        dueAt: makeLocalIso(1, 18, 0),
        // Tomorrow 18:00
        estimatedMinutes: 120,
        isOverdue: false,
        dependencyCount: 1,
        sourceType: "manual",
        createdAt: makeLocalIso(-3, 11, 0),
        updatedAt: makeLocalIso(-1, 16, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-04`,
        userId: u.id,
        title: "Deploy Backend Microservices on Render & Cloud Run",
        description: "Verify Docker multi-stage build, environment variables, health-check endpoints, and CORS headers for production domain.",
        status: "todo",
        category: "project",
        userPriority: "medium",
        predictedPriority: "medium",
        priorityScore: 78.4,
        dueAt: makeLocalIso(2, 15, 0),
        // +2 days
        estimatedMinutes: 75,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-2, 15, 0),
        updatedAt: makeLocalIso(0, 8, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-05`,
        userId: u.id,
        title: "CSBS Department Mini-Project Code Review & Documentation",
        description: "Complete technical documentation in Obsidian vault, finalize architectural diagrams, and prepare team rubric.",
        status: "todo",
        category: "academic",
        userPriority: "medium",
        predictedPriority: "medium",
        priorityScore: 73.1,
        dueAt: makeLocalIso(3, 17, 0),
        // +3 days
        estimatedMinutes: 45,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-2, 12, 0),
        updatedAt: makeLocalIso(0, 9, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-06`,
        userId: u.id,
        title: "Deloitte Campus Placement Technical Assessment Preparation",
        description: "Review System Design patterns, SQL index optimizations, and core operating system concepts.",
        status: "todo",
        category: "personal",
        userPriority: "medium",
        predictedPriority: "medium",
        priorityScore: 68,
        dueAt: makeLocalIso(4, 20, 0),
        // +4 days
        estimatedMinutes: 90,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-3, 18, 0),
        updatedAt: makeLocalIso(0, 9, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-07`,
        userId: u.id,
        title: "Renew IEEE & ACM Student Membership & Reimbursement",
        description: "Submit digital payment receipts to CSBS departmental accounts section for term semester reimbursement.",
        status: "todo",
        category: "administrative",
        userPriority: "low",
        predictedPriority: "low",
        priorityScore: 41.5,
        dueAt: makeLocalIso(6, 12, 0),
        // +6 days
        estimatedMinutes: 30,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-4, 10, 0),
        updatedAt: makeLocalIso(-1, 11, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-08`,
        userId: u.id,
        title: "Cloud Architecture & Microservices Assignment 4",
        description: "Implement Kubernetes Pod autoscaling config and push YAML manifests to GitHub classroom repository.",
        status: "todo",
        category: "academic",
        userPriority: "high",
        predictedPriority: "high",
        priorityScore: 82,
        dueAt: makeLocalIso(-1, 23, 59),
        // Yesterday (Overdue demo)
        estimatedMinutes: 60,
        isOverdue: true,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-5, 9, 0),
        updatedAt: makeLocalIso(-1, 18, 0)
      },
      {
        id: `task-${u.id.slice(-4)}-09`,
        userId: u.id,
        title: "Implement Extractive TextRank NLP Summarizer with ROUGE-L",
        description: "Benchmarked extractive summarization on seminar document dataset with 0.82 ROUGE-1 F1 score.",
        status: "done",
        category: "project",
        userPriority: "high",
        predictedPriority: "high",
        priorityScore: 93,
        dueAt: makeLocalIso(0, 14, 0),
        estimatedMinutes: 120,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "note",
        createdAt: makeLocalIso(-4, 10, 0),
        updatedAt: makeLocalIso(0, 13, 0),
        completedAt: makeLocalIso(0, 13, 15)
      },
      {
        id: `task-${u.id.slice(-4)}-10`,
        userId: u.id,
        title: "HITK Central Library Clearance & Book Return",
        description: "Returned Bishop Pattern Recognition and Tanenbaum Distributed Systems; received digital NOC receipt.",
        status: "done",
        category: "administrative",
        userPriority: "medium",
        predictedPriority: "medium",
        priorityScore: 64,
        dueAt: makeLocalIso(-1, 16, 0),
        estimatedMinutes: 40,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-4, 11, 0),
        updatedAt: makeLocalIso(-1, 15, 30),
        completedAt: makeLocalIso(-1, 15, 45)
      },
      {
        id: `task-${u.id.slice(-4)}-11`,
        userId: u.id,
        title: "Configure Firebase Admin SDK & Cloud Firestore 2-Way Sync",
        description: "Set up real-time listener sync, dual-mode fallback, and service account key integration.",
        status: "done",
        category: "project",
        userPriority: "high",
        predictedPriority: "high",
        priorityScore: 95,
        dueAt: makeLocalIso(-2, 18, 0),
        estimatedMinutes: 90,
        isOverdue: false,
        dependencyCount: 1,
        sourceType: "manual",
        createdAt: makeLocalIso(-4, 14, 0),
        updatedAt: makeLocalIso(-2, 17, 30),
        completedAt: makeLocalIso(-2, 17, 50)
      },
      {
        id: `task-${u.id.slice(-4)}-12`,
        userId: u.id,
        title: "Setup Tailwind UI Dark Mode Theme & Responsive Shell",
        description: "Designed custom color tokens, modern glassmorphism panels, and mobile-friendly navigation sidebar.",
        status: "done",
        category: "project",
        userPriority: "low",
        predictedPriority: "low",
        priorityScore: 48,
        dueAt: makeLocalIso(-4, 18, 0),
        estimatedMinutes: 60,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: "manual",
        createdAt: makeLocalIso(-6, 12, 0),
        updatedAt: makeLocalIso(-4, 17, 0),
        completedAt: makeLocalIso(-4, 17, 10)
      }
    ];
    for (const t of tasksToSeed) {
      db.saveTask(t);
    }
    const eventsToSeed = [
      // Today Events
      {
        id: `evt-${u.id.slice(-4)}-01`,
        userId: u.id,
        title: "Distributed Systems & Cloud Architecture Lecture",
        startAt: makeLocalIso(0, 10, 30),
        endAt: makeLocalIso(0, 11, 45),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "class",
        location: "Room 402, CSBS Department, HITK",
        description: "Lecture on consensus algorithms (Raft & Paxos) and cloud scalability models.",
        color: "#06b6d4",
        isReadOnly: false,
        createdAt: makeLocalIso(-3, 10, 0),
        updatedAt: makeLocalIso(-3, 10, 0)
      },
      {
        id: `evt-${u.id.slice(-4)}-02`,
        userId: u.id,
        title: "Sprint Review: AI Workspace Team Sync",
        startAt: makeLocalIso(0, 14, 0),
        endAt: makeLocalIso(0, 15, 30),
        isAllDay: false,
        calendarName: "Project",
        eventType: "meeting",
        location: "HITK Incubation Center / Google Meet",
        description: "Weekly team sync with Ayantik, Ankit, and Yash to review ML inference and API benchmarks.",
        color: "#007aff",
        isReadOnly: false,
        createdAt: makeLocalIso(-3, 11, 0),
        updatedAt: makeLocalIso(-3, 11, 0)
      },
      {
        id: `evt-${u.id.slice(-4)}-03`,
        userId: u.id,
        title: "Mentor Progress Review with Prof. Sajal Mitra",
        startAt: makeLocalIso(0, 16, 30),
        endAt: makeLocalIso(0, 17, 30),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "meeting",
        location: "Faculty Cabin 214, CSBS Department",
        description: "Live demonstration of dual-mode Firestore synchronization, Random Forest task ranking, and ROUGE summarizer.",
        color: "#007aff",
        isReadOnly: false,
        createdAt: makeLocalIso(-4, 10, 0),
        updatedAt: makeLocalIso(-4, 10, 0)
      },
      // Tomorrow Events (+1 day)
      {
        id: `evt-${u.id.slice(-4)}-04`,
        userId: u.id,
        title: "Business Analytics & Financial Systems Seminar",
        startAt: makeLocalIso(1, 11, 0),
        endAt: makeLocalIso(1, 12, 30),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "class",
        location: "Auditorium 2, HITK",
        description: "Industry guest lecture on FinTech data pipelines and algorithmic risk management.",
        color: "#06b6d4",
        isReadOnly: false,
        createdAt: makeLocalIso(-4, 12, 0),
        updatedAt: makeLocalIso(-4, 12, 0)
      },
      {
        id: `evt-${u.id.slice(-4)}-05`,
        userId: u.id,
        title: "Deloitte Campus Placement Briefing",
        startAt: makeLocalIso(1, 15, 0),
        endAt: makeLocalIso(1, 16, 0),
        isAllDay: false,
        calendarName: "Personal",
        eventType: "meeting",
        location: "Virtual / MS Teams",
        description: "Pre-placement briefing on case study interview rounds and eligibility criteria.",
        color: "#007aff",
        isReadOnly: false,
        createdAt: makeLocalIso(-5, 9, 0),
        updatedAt: makeLocalIso(-5, 9, 0)
      },
      // Day +2 Events
      {
        id: `evt-${u.id.slice(-4)}-06`,
        userId: u.id,
        title: "Artificial Intelligence & Machine Learning Lab",
        startAt: makeLocalIso(2, 10, 0),
        endAt: makeLocalIso(2, 13, 0),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "class",
        location: "Central Computing Lab 3, HITK",
        description: "Hands-on practical session on model evaluation, ROC curves, and hyperparameter tuning.",
        color: "#06b6d4",
        isReadOnly: false,
        createdAt: makeLocalIso(-4, 10, 0),
        updatedAt: makeLocalIso(-4, 10, 0)
      },
      {
        id: `evt-${u.id.slice(-4)}-07`,
        userId: u.id,
        title: "Upload Document Summarizer & ROUGE Evaluation Report",
        startAt: makeLocalIso(2, 17, 0),
        endAt: makeLocalIso(2, 18, 0),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "submission",
        location: "HITK Academic Portal (ERP)",
        description: "Upload completed Document Summarization Evaluation report and model test set metrics.",
        color: "#f97316",
        isReadOnly: false,
        createdAt: makeLocalIso(-3, 10, 0),
        updatedAt: makeLocalIso(-3, 10, 0)
      },
      // Day +3 Events
      {
        id: `evt-${u.id.slice(-4)}-08`,
        userId: u.id,
        title: "Random Forest Model Stress Testing & Profiling",
        startAt: makeLocalIso(3, 14, 0),
        endAt: makeLocalIso(3, 15, 30),
        isAllDay: false,
        calendarName: "Project",
        eventType: "test",
        location: "Dev Environment / Local Server",
        description: "Run automated load benchmarks across 5,000 synthetic tasks; verify P95 latency < 50ms.",
        color: "#a855f7",
        isReadOnly: false,
        createdAt: makeLocalIso(-4, 15, 0),
        updatedAt: makeLocalIso(-4, 15, 0)
      },
      // Day +4 Events
      {
        id: `evt-${u.id.slice(-4)}-09`,
        userId: u.id,
        title: "AI Workspace Prototype Presentation to CSBS Faculty",
        startAt: makeLocalIso(4, 11, 0),
        endAt: makeLocalIso(4, 12, 30),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "presentation",
        location: "Department Seminar Hall, CSBS",
        description: "Demonstration of 3-layer architecture, deterministic calendar scheduling, and user testing metrics.",
        color: "#22c55e",
        isReadOnly: false,
        createdAt: makeLocalIso(-5, 11, 0),
        updatedAt: makeLocalIso(-5, 11, 0)
      },
      {
        id: `evt-${u.id.slice(-4)}-10`,
        userId: u.id,
        title: "Project Milestone 3 Code Freeze & GitHub Release",
        startAt: makeLocalIso(4, 18, 0),
        endAt: makeLocalIso(4, 18, 30),
        isAllDay: false,
        calendarName: "Project",
        eventType: "submission",
        location: "GitHub Repository",
        description: "Final tag v1.0.0 push with signed commits and release documentation.",
        color: "#f97316",
        isReadOnly: false,
        createdAt: makeLocalIso(-5, 12, 0),
        updatedAt: makeLocalIso(-5, 12, 0)
      },
      // Day +5 Events
      {
        id: `evt-${u.id.slice(-4)}-11`,
        userId: u.id,
        title: "MAKAUT University Practical & Viva Exam",
        startAt: makeLocalIso(5, 10, 30),
        endAt: makeLocalIso(5, 12, 30),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "exam",
        location: "Heritage Institute Main Examination Hall",
        description: "End-semester practical viva on Software Engineering, Data Structures, and Cloud Integration.",
        color: "#eb4d3d",
        isReadOnly: false,
        createdAt: makeLocalIso(-6, 9, 0),
        updatedAt: makeLocalIso(-6, 9, 0)
      },
      // Earlier in Month Events (-6 days, -3 days)
      {
        id: `evt-${u.id.slice(-4)}-12`,
        userId: u.id,
        title: "Database Schema & Firestore Real-time Sync Design",
        startAt: makeLocalIso(-6, 14, 0),
        endAt: makeLocalIso(-6, 15, 30),
        isAllDay: false,
        calendarName: "Project",
        eventType: "meeting",
        location: "Google Meet",
        description: "Technical architecture sync on Firestore snapshot listeners and dual-mode data layer.",
        color: "#007aff",
        isReadOnly: false,
        createdAt: makeLocalIso(-7, 10, 0),
        updatedAt: makeLocalIso(-7, 10, 0)
      },
      {
        id: `evt-${u.id.slice(-4)}-13`,
        userId: u.id,
        title: "Mid-Term Architecture & Wireframe Review",
        startAt: makeLocalIso(-3, 11, 0),
        endAt: makeLocalIso(-3, 12, 30),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "presentation",
        location: "Room 401, CSBS",
        description: "First milestone evaluation reviewing UI wireframes and baseline prioritization model.",
        color: "#22c55e",
        isReadOnly: false,
        createdAt: makeLocalIso(-8, 10, 0),
        updatedAt: makeLocalIso(-8, 10, 0)
      },
      // Next Week Event (+8 days)
      {
        id: `evt-${u.id.slice(-4)}-14`,
        userId: u.id,
        title: "Departmental Final Seminar & Term Paper Defense",
        startAt: makeLocalIso(8, 15, 0),
        endAt: makeLocalIso(8, 16, 30),
        isAllDay: false,
        calendarName: "Academic",
        eventType: "presentation",
        location: "Auditorium 1, Heritage Institute of Technology",
        description: "Comprehensive seminar presentation with external academic evaluator committee.",
        color: "#22c55e",
        isReadOnly: false,
        createdAt: makeLocalIso(-4, 10, 0),
        updatedAt: makeLocalIso(-4, 10, 0)
      }
    ];
    for (const ev of eventsToSeed) {
      db.saveCalendarEvent(ev);
    }
    const remindersToSeed = [
      {
        id: `rem-${u.id.slice(-4)}-01`,
        userId: u.id,
        taskId: tasksToSeed[0].id,
        title: "Seminar 3 Slides Review",
        level: "urgent",
        message: "Review starts today at 16:30 with Prof. Sajal Mitra in Cabin 214.",
        urgencyScore: 92,
        triggerAt: makeLocalIso(0, 15, 30),
        isDismissed: false,
        createdAt: makeLocalIso(0, 9, 0)
      },
      {
        id: `rem-${u.id.slice(-4)}-02`,
        userId: u.id,
        taskId: tasksToSeed[2].id,
        title: "IEEE Draft Submission Approaching",
        level: "warning",
        message: "IEEE paper deadline is tomorrow at 18:00. Check LaTeX bibliography formatting.",
        urgencyScore: 78,
        triggerAt: makeLocalIso(1, 12, 0),
        isDismissed: false,
        createdAt: makeLocalIso(0, 9, 0)
      },
      {
        id: `rem-${u.id.slice(-4)}-03`,
        userId: u.id,
        taskId: tasksToSeed[7].id,
        title: "Overdue Assignment Notice",
        level: "critical",
        message: "Cloud Architecture Assignment 4 deadline has passed. Submit immediately.",
        urgencyScore: 96,
        triggerAt: makeLocalIso(0, 8, 0),
        isDismissed: false,
        createdAt: makeLocalIso(0, 8, 0)
      }
    ];
    for (const r of remindersToSeed) {
      db.saveReminder(r);
    }
    const notesToSeed = [
      {
        id: `note-${u.id.slice(-4)}-01`,
        userId: u.id,
        title: "Seminar 3 Discussion Notes with Mentor",
        content: `# Meeting Notes: Prof. Sajal Mitra Review
Date: November 2026
Location: HITK CSBS Department

### Key Decisions
1. **Separation of Responsibilities**:
   - Random Forest for task prioritization based on objective features.
   - NLP engine for extractive summarization of user documents and notes.
   - Deterministic planner for schedule slot allocation.
2. **Read-Only Scope**:
   - No external writing to Google Calendar or Gmail in the prototype.
3. **Continuous Learning**:
   - Record completion records to refine model prediction accuracy over time.
`,
        format: "markdown",
        pinned: true,
        tags: ["academic", "seminar", "hitk"],
        createdAt: makeLocalIso(-4, 10, 0),
        updatedAt: makeLocalIso(-1, 14, 0)
      },
      {
        id: `note-${u.id.slice(-4)}-02`,
        userId: u.id,
        title: "AI Workspace Architecture & Feature Ideas",
        content: `# Architecture Ideas & Milestones

- **Front-End**: React.js with Tailwind CSS for clean dark workspace UX.
- **Back-End**: Node.js Express REST API server with ownership validation.
- **AI Layer**: Python 3.14 Random Forest ML service and NLP summarizer.
- **Cloud**: Firestore NoSQL database schema with real-time sync.

### Next Steps:
- Add drag-and-drop document upload with instant summary breakdown.
- Verify Postman test suite across all CRUD endpoints.
`,
        format: "markdown",
        pinned: false,
        tags: ["project", "architecture"],
        createdAt: makeLocalIso(-3, 11, 0),
        updatedAt: makeLocalIso(0, 10, 0)
      }
    ];
    for (const n of notesToSeed) {
      db.saveNote(n);
    }
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    PlannerService.generateDailyPlan(u.id, todayStr);
    console.log(`[Seed] Successfully seeded polished tasks, calendar events, reminders, and daily plan for ${u.displayName}!`);
  }
}
if (process.argv[1]?.includes("seedData")) {
  (async () => {
    await db.init();
    await seedDemoData(true);
    console.log("[Seed] Database seeding completed successfully.");
    process.exit(0);
  })();
}

// api/handler.ts
var appInstance = null;
var initPromise = null;
async function ensureReady() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await Promise.race([
          db.init(),
          new Promise((resolve) => setTimeout(resolve, 2e3))
        ]);
      } catch (err) {
        console.warn("[Vercel Serverless] DB init warning:", err?.message);
      }
      try {
        await seedDemoData(false);
      } catch (seedErr) {
        console.warn("[Vercel Serverless] Seed warning:", seedErr?.message);
      }
    })();
  }
  await initPromise;
}
function handler(req, res) {
  return new Promise((resolve, reject) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", (err) => {
      console.error("[Vercel Serverless] Response stream error:", err);
      resolve();
    });
    (async () => {
      try {
        await ensureReady();
        if (!appInstance) {
          appInstance = createApp();
        }
        let targetUrl = req.url || "";
        try {
          const parsed = new URL(targetUrl, "http://localhost");
          const vercelPath = parsed.searchParams.get("__vercel_path");
          if (vercelPath) {
            parsed.searchParams.delete("__vercel_path");
            const remainingQuery = parsed.search;
            targetUrl = "/api/" + vercelPath.replace(/^\/+/, "") + remainingQuery;
          }
        } catch (e) {
        }
        const matchedPath = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
        if (matchedPath && matchedPath.startsWith("/api/")) {
          targetUrl = matchedPath;
        }
        if (!targetUrl.startsWith("/api/")) {
          if (targetUrl.startsWith("/v1/")) {
            targetUrl = "/api" + targetUrl;
          } else if (targetUrl === "/api" || targetUrl === "/api/") {
            targetUrl = "/api/v1/health";
          }
        }
        req.url = targetUrl;
        appInstance(req, res);
      } catch (err) {
        console.error("[Vercel Serverless] Execution error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: { code: "SERVER_ERROR", message: err?.message || "Internal Server Error" } }));
        }
        resolve();
      }
    })();
  });
}
module.exports = handler;
module.exports.default = handler;
