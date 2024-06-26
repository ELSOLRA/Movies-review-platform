const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const authService = {

// Registers a new user 
    register: async (username, email, password, role) => {
        try {
// Checking if the email or username is already in use.
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                throw new Error('Email or username already in use')
            };

            const newUser = await User.create({ username, email, password, role });
// Generates a JWT token for the new registered user.
            const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '30m' });
            return { user: { username, email, role }, token }

        } catch (error) {
            throw new Error(error.message);
        }
    },
// Logs in a user 
    login: async (username, password) => {
        try {
            const user = await User.findOne({ username });

            if (!user) {
                throw new Error('Invalid username');
            };
// Comparing the provided password with the hashed password 
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                throw new Error('Invalid password');
            }
// Generates a JWT token 
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30m' })
            const userData = {
                username: user.username,
                email: user.email,
                role: user.role
            }
            return { user: userData, token }

        } catch (error) {
            throw new Error(error.message);
        }
    },
// Retrieves user 
    getUser: async (userId) => {
        try {
// Finding  user by userId and excluding the password field.
            const user = await User.findById(userId).select('-password -__v');
            if (!user) {
                throw new Error('User not found!');
            }
            return user
        } catch (error) {
            throw new Error(error.message);
        };
    }
};

module.exports = authService; 