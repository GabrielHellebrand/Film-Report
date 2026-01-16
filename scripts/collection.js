// collection.js - User authentication and movie collection management
// Using localStorage for compatibility outside Claude.ai environment

(function() {
    'use strict';

    let currentUser = null;
    let currentMovieForReview = null;
    let selectedRating = 0;

    // Initialize on page load
    function init() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = savedUser;
            showCollection();
            loadCollection();
        }

        // Set up star rating listeners
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                updateStars();
            });
        });

        // Close modal on outside click
        document.getElementById('reviewModal').addEventListener('click', (e) => {
            if (e.target.id === 'reviewModal') {
                closeReviewModal();
            }
        });
    }

    // Toggle between login and signup forms
    window.toggleAuthForm = function() {
        document.getElementById('loginForm').classList.toggle('hidden');
        document.getElementById('signupForm').classList.toggle('hidden');
        clearErrors();
    };

    function clearErrors() {
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('signupError').classList.add('hidden');
        document.getElementById('signupSuccess').classList.add('hidden');
    }

    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    // User Signup
    window.handleSignup = function() {
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupPasswordConfirm').value;

        clearErrors();

        if (!username || !password) {
            showError('signupError', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            showError('signupError', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showError('signupError', 'Passwords do not match');
            return;
        }

        try {
            // Check if user exists
            const existingUser = localStorage.getItem(`user:${username}`);
            if (existingUser) {
                showError('signupError', 'Username already exists');
                return;
            }

            // Create user
            const userData = {
                username: username,
                password: password, // In production, this should be hashed!
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem(`user:${username}`, JSON.stringify(userData));

            document.getElementById('signupSuccess').textContent = 'Account created! Please login.';
            document.getElementById('signupSuccess').classList.remove('hidden');
            
            // Clear form
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupPasswordConfirm').value = '';

            setTimeout(() => toggleAuthForm(), 1500);
        } catch (error) {
            showError('signupError', 'Signup failed: ' + error.message);
            console.error('Signup error:', error);
        }
    };

    // User Login
    window.handleLogin = function() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        clearErrors();

        if (!username || !password) {
            showError('loginError', 'Please fill in all fields');
            return;
        }

        try {
            const userDataStr = localStorage.getItem(`user:${username}`);
            
            if (!userDataStr) {
                showError('loginError', 'Invalid username or password');
                return;
            }

            const userData = JSON.parse(userDataStr);
            
            if (userData.password !== password) {
                showError('loginError', 'Invalid username or password');
                return;
            }

            currentUser = username;
            localStorage.setItem('currentUser', username);
            showCollection();
            loadCollection();
        } catch (error) {
            showError('loginError', 'Login failed: ' + error.message);
            console.error('Login error:', error);
        }
    };

    // User Logout
    window.handleLogout = function() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('collectionSection').classList.add('hidden');
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    };

    function showCollection() {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('collectionSection').classList.remove('hidden');
        document.getElementById('currentUsername').textContent = currentUser;
    }

    // Load user's movie collection
    function loadCollection() {
        try {
            const collectionKey = `collection:${currentUser}`;
            const collectionStr = localStorage.getItem(collectionKey);
            
            const grid = document.getElementById('collectionGrid');
            const emptyState = document.getElementById('emptyCollection');
            
            if (!collectionStr) {
                grid.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            const collection = JSON.parse(collectionStr);
            
            if (collection.length === 0) {
                grid.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            
            // Escape quotes in JSON for onclick handlers
            grid.innerHTML = collection.map(movie => {
                const movieJson = JSON.stringify(movie).replace(/"/g, '&quot;');
                return `
                    <div class="movie-card">
                        <img src="${movie.poster || './images/' + movie.title + '.png'}" alt="${movie.title}">
                        <div class="movie-card-info">
                            <div class="movie-card-title">${movie.title}</div>
                            <button class="review-btn" onclick="openReviewModal(JSON.parse('${movieJson}'))">Reviews</button>
                            <button class="remove-btn" onclick="removeFromCollection(JSON.parse('${movieJson}'))">Remove</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Load collection error:', error);
            document.getElementById('emptyCollection').classList.remove('hidden');
        }
    }

    // Remove movie from collection
    window.removeFromCollection = function(movie) {
        if (!confirm(`Remove "${movie.title}" from your collection?`)) return;

        try {
            const collectionKey = `collection:${currentUser}`;
            const collectionStr = localStorage.getItem(collectionKey);
            
            if (!collectionStr) return;

            let collection = JSON.parse(collectionStr);
            collection = collection.filter(m => m.title !== movie.title);

            localStorage.setItem(collectionKey, JSON.stringify(collection));
            loadCollection();
        } catch (error) {
            console.error('Remove error:', error);
            alert('Failed to remove movie');
        }
    };

    // Open review modal
    window.openReviewModal = function(movie) {
        currentMovieForReview = movie;
        document.getElementById('reviewMovieTitle').textContent = movie.title;
        document.getElementById('reviewModal').classList.add('active');
        selectedRating = 0;
        document.getElementById('reviewText').value = '';
        updateStars();
        loadReviews(movie.title);
    };

    // Close review modal
    window.closeReviewModal = function() {
        document.getElementById('reviewModal').classList.remove('active');
        currentMovieForReview = null;
    };

    // Update star rating display
    function updateStars() {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            const rating = parseInt(star.dataset.rating);
            if (rating <= selectedRating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Submit a review
    window.submitReview = function() {
        if (!selectedRating) {
            alert('Please select a rating');
            return;
        }

        const reviewText = document.getElementById('reviewText').value.trim();
        if (!reviewText) {
            alert('Please write a review');
            return;
        }

        try {
            const reviewsKey = `reviews:${currentMovieForReview.title}`;
            const reviewsStr = localStorage.getItem(reviewsKey);
            let reviews = reviewsStr ? JSON.parse(reviewsStr) : [];

            const newReview = {
                username: currentUser,
                rating: selectedRating,
                text: reviewText,
                date: new Date().toISOString()
            };

            reviews.push(newReview);
            localStorage.setItem(reviewsKey, JSON.stringify(reviews));

            document.getElementById('reviewText').value = '';
            selectedRating = 0;
            updateStars();
            loadReviews(currentMovieForReview.title);
            alert('Review submitted!');
        } catch (error) {
            console.error('Submit review error:', error);
            alert('Failed to submit review');
        }
    };

    // Load all reviews for a movie
    function loadReviews(movieTitle) {
        try {
            const reviewsKey = `reviews:${movieTitle}`;
            const reviewsStr = localStorage.getItem(reviewsKey);
            
            const container = document.getElementById('reviewsContainer');
            
            if (!reviewsStr) {
                container.innerHTML = '<p style="color: #999; text-align: center;">No reviews yet. Be the first!</p>';
                return;
            }

            const reviews = JSON.parse(reviewsStr);
            
            if (reviews.length === 0) {
                container.innerHTML = '<p style="color: #999; text-align: center;">No reviews yet. Be the first!</p>';
                return;
            }

            container.innerHTML = reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-user">${review.username}</span>
                        <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <div class="review-text">${review.text}</div>
                    <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load reviews error:', error);
            document.getElementById('reviewsContainer').innerHTML = '<p style="color: #999;">No reviews yet</p>';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();