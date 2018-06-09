/* Magic Mirror
 * Module: MMM-Reddit
 *
 * By kjb085 https://github.com/kjb085/MMM-Reddit
 */
const request = require('request');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({

    /**
     * Base url for all requests
     * @type {String}
     */
    baseUrl: 'https://www.reddit.com/',

    /**
     * List of image qualities in ascending order
     * @type {Array}
     */
    qualityIndex: [
        'low',
        'mid',
        'mid-high',
        'high',
    ],

    /**
     * Log the the helper has started
     *
     * @return {void}
     */
    start() {
        console.log(`Starting module helper: ${this.name}`);
    },

    /**
     * Handle frontend notification by setting config and initializing reddit request
     *
     * @param  {String} notification
     * @param  {Object} payload
     * @return {void}
     */
    socketNotificationReceived(notification, payload) {
        if (notification === 'REDDIT_CONFIG') {
            this.config = payload.config;
            this.getData();
        }
    },

    sendData(obj) {
        this.sendSocketNotification('REDDIT_POSTS', obj);
    },

    /**
     * Make request to reddit and send posts back to MM frontend
     *
     * @return {void}
     */
    getData() {
        var url = this.getUrl(this.config),
            posts = [],
            body;

        request({ url: url }, (error, response, body) => {
            if (response.statusCode === 200) {
                body = JSON.parse(body);
                if (typeof body.data !== "undefined") {
                    if (typeof body.data.children !== "undefined") {
                        body.data.children.forEach((post) => {
                            var temp = {};

                            temp.title = post.data.title;
                            temp.score = post.data.score;
                            temp.thumbnail = post.data.thumbnail;
                            temp.src = this.getImageUrl(post.data.preview, post.data.thumbnail),
                            temp.gilded = post.data.gilded;
                            temp.num_comments = post.data.num_comments;
                            temp.subreddit = post.data.subreddit;
                            temp.author = post.data.author;

                            // Skip image posts that do not have images
                            if (this.config.displayType !== 'image' || temp.src !== null) {
                                posts.push(temp);
                            }
                        });

                        this.sendData({posts: posts});
                    } else {
                        this.sendError('No posts returned. Ensure the subreddit name is spelled correctly. ' +
                            'Private subreddits are also inaccessible');
                    }
                } else {
                    this.sendError(['Invalid response body', body]);
                }
            } else {
                this.sendError('Request status code: ' + response.statusCode);
            }
        });
    },

    /**
     * Get reddit URL based on user configuration
     *
     * @param  {Object} config
     * @return {String}
     */
    getUrl(config) {
        var url = this.baseUrl,
            subreddit = this.formatSubreddit(config.subreddit),
            type = config.type,
            count = config.count;

        if (subreddit !== '' && subreddit !== 'frontpage') {
            url += 'r/' + subreddit + '/';
        }

        return url + type + '/.json?raw_json=1&limit=' + count;
    },

    /**
     * If mutliple subreddits configured, stringify for URL use
     *
     * @param  {String|Array} subreddit
     * @return {String}
     */
    formatSubreddit(subreddit) {
        if (Array.isArray(subreddit)) {
            subreddit = subreddit.join('+');
        }

        return subreddit;
    },

    /**
     * If applicable, get the URL for the resolution designated by the user
     *
     * @param  {Object} preview
     * @param  {String} thumbnail
     * @return {String}
     */
    getImageUrl(preview, thumbnail) {
        if (this.skipNonImagePost(preview, thumbnail)) {
            return null;
        }

        var allPostImages = this.getAllImages(preview.images[0]),
            imageCount = allPostImages.length,
            qualityIndex = this.qualityIndex.indexOf(this.config.imageQuality),
            qualityPercent = qualityIndex / 4,
            imageIndex;

        if (imageCount > 5) {
            imageIndex = Math.round(qualityPercent * imageCount);
        } else {
            imageIndex = Math.floor(qualityPercent * imageCount);
        }

        return allPostImages[imageIndex].url;
    },

    /**
     * Determine if the current post is not an image post
     *
     * @param  {Object} preview
     * @param  {String} thumbnail
     * @return {Boolean}
     */
    skipNonImagePost(preview, thumbnail) {
        var previewUndefined = typeof preview === "undefined",
            nonImageThumbnail = thumbnail.indexOf('http') === -1,
            hasImages, firstImageHasSource;

        if (!previewUndefined && !nonImageThumbnail) {
            hasImages = preview.hasOwnProperty('images');

            if (hasImages) {
                firstImageHasSource = preview.images[0].hasOwnProperty('source');

                if (firstImageHasSource) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Get set of all image resolutions
     *
     * @param  {Object} imageObj
     * @return {Array}
     */
    getAllImages(imageObj) {
        var imageSet = imageObj.resolutions,
            lastImage = imageSet.pop(),
            lastIsSource = lastImage.width === imageObj.source.width &&
                lastImage.height === imageObj.source.height;

        imageSet.push(lastImage);

        if (!lastIsSource) {
            imageSet.push(imageObj.source);
        }

        return imageSet;
    },

    /**
     * Send an error to the frontend
     *
     * @param  {String} error
     * @return {void}
     */
    sendError(error) {
        console.log(error);
        this.sendSocketNotification('REDDIT_POSTS_ERROR', { message: error });
    },
});
