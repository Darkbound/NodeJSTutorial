const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");

const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];

// All books
router.get("/", async (req, res) => {
  let query = Book.find();

  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }

  if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
    query = query.lte("publishDate", req.query.publishedBefore);
  }

  if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
    query = query.gte("publishDate", req.query.publishedAfter);
  }

  try {
    const books = await query.exec();
    res.render("books/index", {
      books: books,
      searchOptions: req.query,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// New book route
router.get("/new", async (req, res) => {
  renderNewBookPage(res, new Book());
});

// Create book
router.post("/new", async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description,
  });

  saveCover(book, req.body.pageCover);

  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
  } catch (error) {
    console.log(error);
    renderNewBookPage(res, new Book(), true);
  }
});

// View book
router.get("/:id", async (req, res) => {
  try {
    const book = await (await Book.findById(req.params.id)).populate("author");
    const author = await Author.findById(book.author);
    res.render("books/show", { book: book, author: author });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// Update book
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    renderEditPage(res, book);
  } catch (error) {
    console.log(error);
    renderEditPage(res, book, true);
    res.redirect("/");
  }
});

router.put("/:id", async (req, res) => {
  let book;

  saveCover(book, req.body.pageCover);

  try {
    const book = await Book.findById(req.params.id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);
    book.pageCount = req.body.pageCount;
    book.description = req.body.description;

    if (req.body.cover != null && req.body.cover != "") {
      saveCover(book, req.body.cover);
    }

    await book.save();

    res.redirect(`/books/${book.id}`);
  } catch (error) {
    console.log(error);
    if (book != null) {
      renderEditPage(res, book, true);
    } else {
      res.redirect("/");
    }
  }
});

// Delete book
router.delete("/:id/delete", async (req, res) => {
  let book;

  try {
    book = await Book.findById(req.params.id);
    await book.remove();

    res.redirect(`/books`);
  } catch (error) {
    if (author == null) {
      console.log(error);
      res.redirect("/");
    } else {
      res.redirect(`/books/${book.id}`);
    }
  }
});

function saveCover(book, coverEncoded) {
  if (coverEncoded == null || coverEncoded.length < 1) return;

  const cover = JSON.parse(coverEncoded);

  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});

    const params = {
      authors: authors,
      book: book,
    };

    if (hasError) {
      if (form === "edit") {
        params.errorMessage = "Error Editing Book";
      } else if (form === "new") {
        params.error = "Error Creating Book";
      }
    }
    res.render(`books/${form}`, params);
  } catch (error) {
    res.redirect("/books");
  }
}

async function renderNewBookPage(res, book, hasError = false) {
  renderFormPage(res, book, "new", hasError);
}

async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, "edit", hasError);
}

module.exports = router;
