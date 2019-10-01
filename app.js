const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const Pageview = require("./models/Pageview");
const path = require('path');
const md = require('marked');

const app = express();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/notes', { useNewUrlParser: true });

const saveAnalytics = async (req, res, next) => {
  //console.log(req.path)
  const newView = await Pageview.create({ path: req.path, userAgent: req.get('User-Agent') });
  next();
}

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get("/", saveAnalytics, async (req, res) => {
  const notes = await Note.find();
  res.render("index", { notes: notes })
});

app.get("/notes/new", saveAnalytics, async (req, res) => {
  const notes = await Note.find();
  res.render("new", { notes: notes });
});

app.post("/notes", async (req, res, next) => {
  const data = {
    title: req.body.title,
    body: req.body.body
  };

  const note = new Note(req.body);
  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.redirect('/');
});

app.get("/notes/:id", saveAnalytics, async (req, res) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("show", { notes: notes, currentNote: note, md: md });
});

app.get("/notes/:id/edit", saveAnalytics, async (req, res, next) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("edit", { notes: notes, currentNote: note });
});

app.patch("/notes/:id", async (req, res) => {
  const id = req.params.id;
  const note = await Note.findById(id);

  note.title = req.body.title;
  note.body = req.body.body;

  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.status(204).send({});
});

app.delete("/notes/:id", async (req, res) => {
  await Note.deleteOne({ _id: req.params.id });
  res.status(204).send({});
});

app.get('/analytics', saveAnalytics, async (req, res) => {

  const addViews = await Pageview.aggregate([
    {$group: {_id: { path: '$path' }, total: {$sum: 1}}}, 
    {$sort: {total: -1}}
  ]).then(function (response) {
    res.render('analytics', { views: response });
  });

})

app.listen(3000, () => console.log("Listening on port 3000 ..."));
/*    {
      $group: {
        _id: {
          path: '$path'
        },
        count: {
          $sum: 1
        }
      }
    }*/