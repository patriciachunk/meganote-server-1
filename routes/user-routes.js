var router = require('express').Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var User = require('../models/user');

// CREATE a user
router.post('/', function(req, res) {
  if (!passwordsPresent(req.body.user) || !passwordsMatch(req.body.user)) {
    res.status(422).json({
      message: 'Passwords must match!'
    });
    return;
  }

  var user = new User({
    name: req.body.user.name,
    username: req.body.user.username,
    passwordDigest: bcrypt.hashSync(req.body.user.password, 10)
  });

  user
    .save()
    .then(
      userData => {
        var token = jwt.sign(
          { _id: userData._id }, 
          process.env.JWT_SECRET,
          { expiresIn: 60*60*24 }
        );
        res.json({
          user: userData,
          authToken: token
        });
      }
    );
});

// UPDATE a user
router.put('/:id', (req, res) => {
  User
    .findOne({
      _id: req.params.id
    })
    .then(
      // user exists
      user => {
        user.name = req.body.user.name;
        user.username = req.body.user.username;
        user
          .save()
          .then(
            // success
            () => {
              res.json({
                user
              })
            },

            // failure
            () => {
              res.status(422).json({
                message: 'Unable to update user.'
              });
            }
          );
      },

      // user does not exist
      () => {
        res.status(404).json({
          message: 'Could not find that user.'
        });
      }
    );
});

module.exports = router;

function passwordsPresent(payload) {
  return (payload.password && payload.passwordConfirmation)
}

function passwordsMatch(payload) {
  return (payload.password === payload.passwordConfirmation)
}
