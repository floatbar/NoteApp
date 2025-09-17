const express = require("express");
const limit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const crypto = require("node:crypto");
const parser = require("body-parser");
require("dotenv").config();

process.on("uncaughtException", (err) => console.error(err));

const notes = [];

const limiter = limit({ max: 1000, windowMs: 15 * 60 * 1000 })

const app = express();
app.use(limiter);
app.use(express.json({ limit: "1kb" }));
app.use(parser.urlencoded({ extended: true, limit: "1kb" }));

const middleware = [
    body("title").isString().isLength({ min: 1, max: 100 }).trim().escape(),
    body("content").isString().isLength({ min: 1, max: 500 }).trim().escape()
];

app.get("/notes", async (req, res) => {
    return res.status(200).json({ status: "OK", notes: notes });
});

app.get("/notes/:id", async (req, res) => {
    var id = req.params.id;
    if (id && typeof id === "string" && id.trim()) {
        id = id.trim();
        const note = notes.find((note) => note.id === id);
        if (note) return res.status(200).json({ status: "OK", note: note });
        else return res.status(404).json({ status: "Not Found" }); 
    } else return res.status(400).json({ status: "Bad Request" });
});

app.post("/notes", middleware, async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) return res.status(400).json({ status: "Bad Request" });
    else {
        const id = crypto.randomUUID();
        const { title, content } = req.body;
        const note = { id, title, content };
        notes.push(note);
        return res.status(201).json({ status: "Created", note: note });
    }
});

app.put("/notes/:id", middleware, async (req, res) => {
    var id = req.params.id;
    if (id && typeof id === "string" && id.trim()) {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(400).json({ status: "Bad Request" });
        else {
            id = id.trim();
            const note = notes.find((note) => note.id === id);
            if (note) {
                const { title, content } = req.body;
                note.title = title;
                note.content = content;
                return res.status(200).json({ status: "OK" });
            } else return res.status(404).json({ status: "Not Found" }); 
        }
    } else return res.status(400).json({ status: "Bad Request" });
});

app.delete("/notes/:id", async (req, res) => {
    var id = req.params.id;
    if (id && typeof id === "string" && id.trim()) {
        id = id.trim();
        const index = notes.findIndex((note) => note.id === id);
        if (index !== -1) {
            notes.splice(index);
            return res.status(200).json({ status: "OK" });
        } else return res.status(404).json({ status: "Not Found" }); 
    } else return res.status(400).json({ status: "Bad Request" });
});

app.listen(process.env.PORT, process.env.HOST, () => console.log("HTTP server running..."));
