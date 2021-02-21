var TreeUtlities = function() {
    this.max_apps = 0;
    this.max_reviews = 0;
    this.max_sentiment = -9999999999;
    this.min_sentiment = 9999999999;
    this.categories = [];
    this.selectedCategories = {};
    this.selectedTopics = {};
    this.reviewCountSlider = [];
    this.ratingSlider = [0, 5];
    this.sentimentSlider = [];
    this.comparisonCount = 0;
    this.comparisonItems = {};
};

TreeUtlities.prototype.updateComparisonCount = function(increment) {
    this.comparisonCount += increment;
};

TreeUtlities.prototype.getComparisonCount = function() {
    return this.comparisonCount;
};

TreeUtlities.prototype.updateComparisonItems = function(item) {

    if (this.comparisonCount == 3) {
        if (this.comparisonItems[item.id] == undefined) {
            var keys = Object.keys(this.comparisonItems);
            delete this.comparisonItems[keys[0]];
            this.comparisonItems[item.id] = item;
        } else {
            delete this.comparisonItems[item.id];
            this.updateComparisonCount(-1);
        }
    } else {
        if (this.comparisonItems[item.id] == undefined) {
            this.comparisonItems[item.id] = item;
            this.updateComparisonCount(1);
        } else {
            delete this.comparisonItems[item.id];
            this.updateComparisonCount(-1);
        }
    }
};

TreeUtlities.prototype.getComparisonItems = function() {
    return this.comparisonItems;
};

TreeUtlities.prototype.setMaxSentiment = function(sentiment) {
    if (sentiment > this.max_sentiment) this.max_sentiment = sentiment;
};

TreeUtlities.prototype.setMinSentiment = function(sentiment) {
    if (sentiment < this.min_sentiment) this.min_sentiment = sentiment;
};

TreeUtlities.prototype.resetSentiments = function() {
    this.max_sentiment = -9999999999;
    this.min_sentiment = 9999999999;
};

TreeUtlities.prototype.getSentiment = function() {
    return [this.min_sentiment, this.max_sentiment];
};

TreeUtlities.prototype.setMaxApps = function(numberOfApps) {
    if (numberOfApps > this.max_apps) this.max_apps = numberOfApps;
};

TreeUtlities.prototype.getMaxApps = function() {
    return this.max_apps;
};

TreeUtlities.prototype.resetMaxReviews = function() {
    this.max_reviews = 0;
};

TreeUtlities.prototype.setMaxReviews = function(numberOfReviews) {
    if (numberOfReviews > this.max_reviews) this.max_reviews = numberOfReviews;
};

TreeUtlities.prototype.getMaxReviews = function() {
    return this.max_reviews;
};

TreeUtlities.prototype.addCategory = function(category) {
    this.categories.push(category);
};

TreeUtlities.prototype.getCategories = function() {
    return this.categories;
};

TreeUtlities.prototype.updateSelectedCategory = function(option, checked) {
    if (checked == true) {
        this.selectedCategories[$(option).val()] = true;
    } else {
        delete this.selectedCategories[option];
    }
};

TreeUtlities.prototype.getSelectedCategories = function() {
    return Object.keys(this.selectedCategories);
}

TreeUtlities.prototype.updateSelectedTopics = function(option, checked) {
    if (checked == true) {
        this.selectedTopics[$(option).val()] = true;
    } else {
        delete this.selectedTopics[option];
    }
};

TreeUtlities.prototype.getSelectedTopics = function() {
    return Object.keys(this.selectedTopics);
}

TreeUtlities.prototype.setReviewCountSlider = function(newValue) {
    this.reviewCountSlider = newValue;
};

TreeUtlities.prototype.getReviewCountSlider = function() {
    return this.reviewCountSlider;
}

TreeUtlities.prototype.setRatingSlider = function(newValue) {
    this.ratingSlider = newValue;
};

TreeUtlities.prototype.getRatingSlider = function() {
    return this.ratingSlider;
}

TreeUtlities.prototype.setSentimentSlider = function(newValue) {
    this.sentimentSlider = newValue;
};

TreeUtlities.prototype.getSentimentSlider = function() {
    return this.sentimentSlider;
}

var treeUtilities = new TreeUtlities();