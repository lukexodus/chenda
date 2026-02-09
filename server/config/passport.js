const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

/**
 * Passport Local Strategy Configuration
 * Handles email/password authentication
 */
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await User.verifyPassword(password, user.password_hash);
      
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Remove password_hash from user object
      delete user.password_hash;
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

/**
 * Serialize user for session
 * Stores user ID in session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 * Retrieves user object from ID stored in session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    
    if (!user) {
      return done(null, false);
    }
    
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
