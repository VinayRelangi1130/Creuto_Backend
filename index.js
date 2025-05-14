import express from "express";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

app.use(cors());
app.use(bodyParser.json());

// Create books table if not exists
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publishedYear INTEGER NOT NULL
    )`
  );
});

// GET all books
app.get("/books", (req, res) => {
  db.all("SELECT * FROM books", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error retrieving books" });
    }
    res.json(rows);
  });
});

// GET a book by ID
app.get("/books/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(row);
  });
});

// POST a new book
app.post("/books", (req, res) => {
  const { title, author, publishedYear } = req.body;
  
  if (!title || !author || !publishedYear) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const newBook = {
    id: uuidv4(),
    title,
    author,
    publishedYear
  };

  const query = "INSERT INTO books (id, title, author, publishedYear) VALUES (?, ?, ?, ?)";
  db.run(query, [newBook.id, newBook.title, newBook.author, newBook.publishedYear], function (err) {
    if (err) {
      return res.status(500).json({ message: "Error adding book" });
    }
    res.status(201).json(newBook);
  });
});

// PUT update book
app.put("/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, publishedYear } = req.body;

  if (!title || !author || !publishedYear) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const query = "UPDATE books SET title = ?, author = ?, publishedYear = ? WHERE id = ?";
  db.run(query, [title, author, publishedYear, id], function (err) {
    if (err || this.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ id, title, author, publishedYear });
  });
});

// DELETE book
app.delete("/books/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM books WHERE id = ?";
  db.run(query, [id], function (err) {
    if (err || this.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted", id });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


