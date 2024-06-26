const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');

const reviewService = {

    addReview: async (movieId, userId, rating, comment) => {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found!');
            }
            const movie = await Movie.findById(movieId);
            if (!movie) {
                throw new Error('Movie not found!');
            }
// checks if a review already exists for the user and movie combination.
            const existingReview = await Review.findOne({ movieId, userId });
            if (existingReview) {
                throw new Error(`Review already exists for user ${user.username} on this movie`);
            }
            const newReview = await Review.create({ movieId, userId, rating, comment })
            return newReview;

        } catch (error) {
            throw new Error(error.message);
        }
    },

    updateReview: async (reviewId, userId, reviewData) => {
        try {

            const review = await Review.findOneAndUpdate(
                { _id: reviewId, userId: userId },
                {
// setting only specific fields for update info
                    $set: {
                        rating: reviewData.rating,
                        comment: reviewData.comment
                    }
                },
// with "context: 'query'" only validation of specific fields that comes with update
                { new: true, runValidators: true, context: 'query' }
            );
            if (!review) {
                throw new Error('Review not found or no permission to update this review');
            }
            return review;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    deleteReview: async (reviewId, userId) => {
        try {
            const review = await Review.findOneAndDelete({ _id: reviewId, userId: userId });
            if (!review) {
                throw new Error('Review not found or no permission to delete this review');
            }
            return review;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    findReviews: async () => {
        try {
// finds all reviews and populate related data.
            const reviews = await Review.find({}).populate({ path: 'movieId', model: 'Movie', select: '-__v' }).populate('userId', 'username').select('-__v');
            if (!reviews || reviews.length === 0) {
                throw new Error('No reviews were found');
            }
            return reviews;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    findReview: async (reviewId) => {
        try {
// finds the review by ID and populate related data.
            const review = await Review.findById(reviewId).populate({ path: 'movieId', model: 'Movie', select: '-__v' }).populate('userId', 'username').select('-__v');
            if (!review) {
                throw new Error('Review not found!');
            };
            return review;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    findMovieReviews: async (movieId) => {
        try {
// retrievs movie reviews and movie at the same time
            const [movieReviews, movie] = await Promise.all([
                Review.find({ movieId }).populate('userId', 'username').select('-__v -movieId'),
                Movie.findById(movieId).select('_id title')
            ]);
            if (!movie) {
                throw new Error('Movie not found!');
            }
            if (!movieReviews || movieReviews.length === 0) {
                throw new Error('No reviews found for this movie');
            }
            return { movieReviews, movie };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    getAverageRatings: async () => {
        try {
// aggregation to calculate average ratings for all movies.
            const ratings = await Review.aggregate([
                {
                    $lookup: {
                        from: "movies",
                        localField: "movieId",
                        foreignField: "_id",
                        as: "movie"
                    }
                },
                {
                    $unwind: "$movie"
                },
                {
                    $group: {
                        _id: "$movie._id",
                        movie: { $first: "$movie" },
                        averageRating: { $avg: "$rating" },
                    }
                },
                {
                    $project: {
// projecting what to display and how
                        _id: 0,
                        movie: {
                            _id: 1,
                            title: 1,
                            director: 1,
                            releaseYear: 1,
                            genres: 1
                        },
                        averageRating: 1
                    }
                }
            ]);
            return ratings;
        } catch (error) {
            console.error('Error in getAverageRatings:', error.message);
            throw new Error(error.message);
        }
    }
};

module.exports = reviewService; 