const express = require('express');
const app = express();
const expbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
console.log('Enabling CORS');
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With'); // Add other headers used in your requests

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.enable('trust proxy');
app.use(express.static('assets'));
app.use(express.static('node_modules'));
app.use(express.static('plugins'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const hbs = expbs.create({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '/views/layouts'),
  helpers: {
    ifCond(v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        case 'true':
          return (v1 === true) ? options.fn(this) : options.inverse(this);
        case 'includes':
          return (v1.includes(v2)) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(session({
  secret: 'APP_SECRET',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/api', require('./routes/api')); // call api function
app.use('/', require('./routes/web'));// call web functions
app.listen(process.env.PORT || 9999);
