const Author = require("../models/author");
const Book = require("../models/book");
const path = require("node:path");

const { body, validationResult } = require("express-validator");

const asyncHandler = require("express-async-handler");
const formidable = require("formidable");
const fs = require("fs");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {

  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();

  res.render("author_list", {
    title: "Author List",
    author_list: allAuthors,
  });

});

exports.author_upload_get = (req, res, next) => {

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<form method="post" enctype="multipart/form-data">');
  res.write('<input type="file" name="filetoupload"><br>');
  res.write('<input type="submit">');
  res.write('</form>');
  return res.end();

  var newpath = '/home/mikkel/Documents/2. semester/code/eksamen/express-locallibrary-tutorial/public/images/' + files.filetoupload[0].originalFilename;
}

exports.author_upload_post = asyncHandler(async function(req, res, next) {

  const current_author = await Author.findById(req.params.id);

  const author = new Author({
    img_path: req.body.img_path,
    _id: req.params.id,
  });

  const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});

  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    console.log("testtsetstetsets");
    var oldpath = files.filetoupload[0].filepath;
    var newpath = '/home/mikkel/Documents/2. semester/code/eksamen/express-locallibrary-tutorial/public/images/' + files.filetoupload[0].originalFilename;
    fs.rename(oldpath, newpath, async function(err) {
      if (err) throw err;
      res.redirect(updatedAuthor.url);
    });
  });
});

//var form = new formidable.IncomingForm();
//form.parse(req, function(err, fields, files) {
//var oldpath = files.filetoupload[0].filepath;
//var newpath = '/home/mikkel/Documents/2. semester/code/eksamen/express-locallibrary-tutorial/public/images/' + files.filetoupload[0].originalFilename;
//fs.rename(oldpath, newpath, function(err) {
//if (err) throw err;
//});
//});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {

  //Get detail of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    //no result
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);

  }

  if (author.img_path) {

    res.render("author_detail", {
      title: "Author Detail",
      author: author,
      author_books: allBooksByAuthor,
      has_image: true,
    });

  } else {

    res.render("author_detail", {
      title: "Author Detail",
      author: author,
      author_books: allBooksByAuthor,
      has_image: false,
    });

  }

});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {

  res.render("author_form", { title: "Create Author" });

});

// Handle Author create on POST.
exports.author_create_post = [
  //Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name has non.alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {

    //var form = new formidable.IncomingForm();
    //form.parse(req, function(err, fields, files) {
    //console.log("tetssetstestetest");
    //var oldpath = files.img_path[0].filepath;
    //var newpath = '/home/mikkel/Documents/2. semester/code/express/eksamen/express-locallibrary-tutorial/public/images/' + files.img_path[0].originalFilename;
    //fs.rename(oldpath, newpath, function(err) {
    //if (err) throw err;
    //});
    //});

    const errors = validationResult(req);

    //create Author object with escaped and trimmed data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    })

    if (!errors.isEmpty()) {
      //There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      //Data from form is valid

      //Save author
      await author.save();
      //Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // No results.
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render("author_delete", {
      title: "Delete Author",
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {

  const author = await Author.findById(req.params.id);

  if (author === null) {
    //No result
    res.redirect("/catalog/authors");
  }

  let has_image = false;

  if (author.img_path)
    has_image = true;

  console.log(has_image)

  res.render("author_form", {

    title: "Update author",
    author: author,
    has_image: has_image,

  });

});

// Handle Author update on POST.
exports.author_update_post = asyncHandler(async (req, res, next) => { });

exports.author_update_post = [

  body("first_name", "First name must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("family_name", "Family name must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  asyncHandler(async (req, res, next) => {

    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birht,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {

      const author = await Author.findById(req.params.id);

      res.render("author_form", {

        title: "Update author",
        author: author,
        errors: errors,

      });
      return;
    } else {
      const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});

      res.redirect(updatedAuthor.url);
    }

  }),
];

