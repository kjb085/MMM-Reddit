Module.register('MMM-Reddit', {
    /**
     * List of default configurations
     * @type {Object}
     */
    defaults: {
    	subreddit: 'all',
        type: 'hot',
        displayType: 'headlines', // Options: 'headlines', 'image' (for image, if post is album, only 1st image is shown)
        count: 10,
        show: 5,
        width: 400, // In pixels
        updateInterval: 15, // In minutes
        rotateInterval: 30, // In seconds

        // Toggles
        showHeader: true,
        headerType: 'sentence', // Options: 'sentence', 'chained'
        showAll: false, // Alias for all below 'show' toggles (this excludes the showHeader feature)
        showRank: true,
        showScore: true,
        showNumComments: true,
        showGilded: true,
        showAuthor: false,
        showSubreddit: false, // For combo subreddits
        colorText: true,

        // Headlines only
        showThumbnail: false, // Irrelevant for image posts

        // Image only
        maxImageHeight: 500, // In pixels
        imageQuality: 'mid-high', // Options: 'low', 'mid', 'mid-high', 'high'
        showTitle: true, // Non-configurable for text base subs
	},

    /**
     * List of all posts
     * @type {Array}
     */
    posts: [],

    /**
     * All posts broken into sets to be rendered
     * @type {Array}
     */
    postSets: [],

    /**
     * Index of post set currently being displayed
     * @type {Number}
     */
    currentPostSetIndex: 0,

    /**
     * ID value of the interval timer
     * @type {Number}
     */
    rotator: null,

    /**
     * Determines if the current results returned from reddit has content
     * @type {Boolean}
     */
    hasValidPosts: true,

    /**
     * Return an array of CSS files to include
     *
     * @return {Array}
     */
    getStyles() {
        return [
            this.file('assets/MMM-Reddit.css'),
        ];
    },

    /**
     * Send socket notification with user configuration
     *
     * @return {void}
     */
    start() {
        var noderHelperConfig = {
            subreddit: this.config.subreddit,
            type: this.config.type,
            displayType: this.config.displayType,
            count: this.config.count,
            updateInterval: this.config.updateInterval,
            imageQuality: this.config.imageQuality
        };

        Log.info(`Starting module: ${this.name}`);

        if (this.config.showAll) {
            this.config.showRank = true;
            this.config.showScore = true;
            this.config.showThumbnail = true;
            this.config.showTitle = true;
            this.config.showNumComments = true;
            this.config.showGilded = true;
            this.config.showAuthor = true;
            this.config.showSubreddit = true;
        }

        this.sendSocketNotification('REDDIT_CONFIG', { config: noderHelperConfig });
    },

    /**
     * Handle notification from node_helper and rerender DOM
     *
     * @param  {String} notification
     * @param  {Object} payload
     * @return {void}
     */
    socketNotificationReceived(notification, payload) {
        if (notification === 'REDDIT_POSTS') {
            this.hasValidPosts = !!payload.posts.length,
            this.posts = payload.posts;
            this.postSets = this.getPostSets(this.posts, this.config.show);

            if (this.config.show < this.config.count && this.hasValidPosts) {
                this.setRotateInterval();
            }
        } else if (notification === 'REDDIT_POSTS_ERROR') {
            this.hasValidPosts = false;
            console.log(payload.message);
        }

        this.updateDom();
    },

    /**
     * Chunk posts into sets as defined by user
     *
     * @param  {Array} posts
     * @param  {Number} toShow
     * @return {Array}
     */
    getPostSets(posts, toShow) {
        var sets = [];

        while (posts.length) {
            sets.push(posts.splice(0, toShow));
        }

        return sets;
    },

    /**
     * Return a string to be used as header text
     * NOTE: Not working currently, despite MM documentation - leaving for now
     *
     * @return {String}
     */
    getHeader() {
        if (this.config.showHeader) {
            // return `${this.config.type} posts from r/${this.config.subreddit}`;
            return this.getHeaderText();
        }
    },

    /**
     * Get HTML element to be displayed
     *
     * @return {Element}
     */
    getDom() {
        var wrapper = document.createElement('div'),
            posts = document.createElement('div');
            header = document.createElement('header'),
            slider;

        wrapper.id = 'mmm-reddit';
        wrapper.style.width = this.config.width + 'px';

        // Remove when getHeader is debugged
        if (this.config.showHeader) {
            // header.innerHTML = `${this.config.type} posts from r/${this.config.subreddit}`;
            header.innerHTML = this.getHeaderText();
            wrapper.appendChild(header);
        }

        if (!this.hasValidPosts) {
            var text = document.createElement('div');

            text.innerHTML = 'No valid posts to display<br />Check the console for a full description of error.';
            posts.appendChild(text);
        } else if (!this.postSets) {
            var text = document.createElement('div');

            text.innerHTML = 'LOADING';
            posts.appendChild(text);
        } else {
            slider = this.getContentSlider()

            posts.appendChild(slider);
        }

        wrapper.appendChild(posts);

        return wrapper;
    },

    /**
     * Get header text based on user configuration
     *
     * @return {String}
     */
    getHeaderText() {
        var header = `${this.config.type} posts from `;

        if (this.config.subreddit === "frontpage" || this.config.subreddit === "") {
            header += "the frontpage";
        } else if (this.helper.isString(this.config.subreddit)) {
            header += "r/" + this.config.subreddit;
        } else {
            if (this.config.headerType === 'chained') {
                header += this.getMultiSubChained(this.config.subreddit);
            } else {
                header += this.getMultiSubSentence(this.config.subreddit);
            }
        }

        return header;
    },

    /**
     * Get sentence defining all subreddits
     *
     * @param  {Array} subs
     * @return {String}
     */
    getMultiSubSentence(subs) {
        var secondToLast = subs.length - 2,
            text = "";

        subs.forEach((sub, idx) => {
            text += "r/" + sub;

            if (idx === secondToLast) {
                text += ", AND ";
            } else if (idx < secondToLast) {
                text += ", ";
            }
        });

        return text;
    },

    /**
     * Get subreddits chained together with +
     *
     * @param  {Array} subs
     * @return {String}
     */
    getMultiSubChained(subs) {
        var text = "r/";

        subs.forEach((sub) => {
            text += sub + '+';
        });

        return text.replace(/\+$/, '');
    },

    /**
     * Get div containing all post data
     *
     * @return {Element}
     */
    getContentSlider() {
        var slider = document.createElement('div'),
            idxCounter = 0;

        slider.id = "mmm-reddit-slider";

        this.postSets.forEach((postSet, setIdx) => {
            var tableWrapper = document.createElement('div'),
                table = document.createElement('table');

            table.classList.add('table');

            if (setIdx !== 0) {
                tableWrapper.style.display = 'none';
            }

            postSet.forEach((post, idx) => {
                var postIndex = idx + idxCounter + 1;

                table.appendChild(this.createPostRow(post, postIndex));
            });

            idxCounter += postSet.length;

            tableWrapper.appendChild(table);
            slider.appendChild(tableWrapper);
        });
    },

    /**
     * Create DOM element for the given post
     *
     * @param  {Object} post
     * @param  {Number} postIndex
     * @return {Element}
     */
    createPostRow(post, postIndex) {
        if (this.config.displayType === 'image') {
            return this.createImageRow(post, postIndex);
        } else {
            return this.createHeadlinetRow(post, postIndex);
        }
    },

    /**
     * Create DOM element for headline based user config
     *
     * @param  {Object} post
     * @param  {Number} postIndex
     * @return {Element}
     */
    createHeadlinetRow(post, postIndex) {
        var hasTwoRows = this.isMultiTextRow(),
            wrapper = document.createElement('div'),
            rowSpan = hasTwoRows ? '2' : '1',
            row1 = document.createElement('tr'),
            row2 = document.createElement('tr'),
            rank = this.getTd(rowSpan, 'row'),
            score = this.getTd(rowSpan, 'row'),
            thumbnail = this.getTd(rowSpan, 'row'),
            image = this.getImage(post.thumbnail, 70),
            details = this.getTd(),
            showGilded = this.config.showGilded && post.gilded,
            gildedText = post.gilded > 1 ? 'x' + post.gilded : '',
            colored = this.config.colorText ? 'colored' : '';

        this.appendIfShown(this.config.showRank, row1, this.getFixedColumn(rank, ['rank', colored], '#' + postIndex));
        this.appendIfShown(this.config.showScore, row1, this.getFixedColumn(score, ['score', colored], this.formatScore(post.score)));

        // Always append image to thumbnail td, conditionally append td
        this.appendIfShown(true, thumbnail, image);
        this.appendIfShown(this.config.showThumbnail, row1, thumbnail, 'thumbnail');

        // Always show post title for text based post rows
        this.appendIfShown(true, row1, 'td', 'title', post.title);

        if (hasTwoRows) {
            this.appendIfShown(this.config.showNumComments, details, 'span', 'comments', post.num_comments + ' comments');
            this.appendIfShown(showGilded, details, 'span', 'gilded', gildedText);
            this.appendIfShown(this.config.showSubreddit, details, 'span', 'subreddit', 'r/' + post.subreddit);
            this.appendIfShown(this.config.showAuthor, details, 'span', 'author', 'by ' + post.author);

            this.appendIfShown(true, row2, details, 'details');

            wrapper.appendChild(row1);
            wrapper.appendChild(row2);

            wrapper.classList.add('post-row', 'text-row');

            return wrapper;
        } else {
            row1.classList.add('post-row', 'text-row');

            return row1;
        }
    },

    /**
     * Create DOM element for image based user config
     *
     * @param  {Object} post
     * @param  {Number} postIndex
     * @return {Element}
     */
    createImageRow(post, postIndex) {
        var hasDetailRow = this.isMultiTextRow(),
            hasTitleRow = this.config.showTitle,
            totalRows = this.getImageRowCount(hasTitleRow, hasDetailRow),
            imageRowOnly = totalRows === 1,
            totalColumns = this.getImageColCount(imageRowOnly),
            wrapper = document.createElement('div'),
            imageRow = document.createElement('tr'),
            image = this.getImage(post.src, null, this.config.maxImageHeight),
            imageContainer = document.createElement('div'),
            imageTd = this.getTd(totalColumns, 'col'),
            colored = this.config.colorText ? 'colored' : '',
            row2, row3, showGilded, gildedText;


        // If rank is shown, force onto 1st row
        this.appendIfShown(imageRowOnly && this.config.showRank, imageRow, this.getFixedColumn(null, ['rank', colored], '#' + postIndex));

        imageContainer.appendChild(image);
        imageContainer.classList.add('image-container');

        imageTd.appendChild(imageContainer);
        this.appendIfShown(true, imageRow, imageTd, 'feature-image');

        wrapper.appendChild(imageRow);

        if (hasTitleRow) {
            row2 = document.createElement('tr');

            this.appendIfShown(this.config.showRank, row2, this.getFixedColumn(this.getTd(totalRows - 1, 'row'), ['rank', colored], '#' + postIndex));
            this.appendIfShown(this.config.showScore, row2, this.getFixedColumn(this.getTd(totalRows - 1, 'row'), ['score', colored], this.formatScore(post.score)));
            this.appendIfShown(this.config.showTitle, row2, 'td', 'title', post.title);

            wrapper.appendChild(row2);
        }

        if (hasDetailRow) {
            row3 = document.createElement('tr');
            showGilded = this.config.showGilded && post.gilded,
            gildedText = post.gilded > 1 ? 'x' + post.gilded : '';
            details = this.getTd();

            this.appendIfShown(this.config.showNumComments, details, 'span', 'comments', post.num_comments + ' comments');
            this.appendIfShown(showGilded, details, 'span', 'gilded', gildedText);
            this.appendIfShown(this.config.showSubreddit, details, 'span', 'subreddit', 'r/' + post.subreddit);
            this.appendIfShown(this.config.showAuthor, details, 'span', 'author', 'by ' + post.author);

            this.appendIfShown(true, row3, details, 'details');
            wrapper.appendChild(row3);
        }

        wrapper.classList.add('post-row', 'image-row');

        return wrapper;
    },

    /**
     * Determine if the user configuration require multiple table rows
     *
     * @return {Boolean}
     */
    isMultiTextRow() {
        return this.config.showNumComments || this.config.showGilded ||
            this.config.showAuthor || this.config.showSubreddit;
    },

    /**
     * Get number of table rows for image posts
     *
     * @param  {Boolean} hasTitleRow
     * @param  {Boolean} hasDetailRow
     * @return {Number}
     */
    getImageRowCount(hasTitleRow, hasDetailRow) {
        var rowCount = 1;

        rowCount += hasTitleRow ? 1 : 0;
        rowCount += hasDetailRow ? 1 : 0;

        return rowCount;
    },

    /**
     * Get number of columns for image posts
     *
     * @param  {[type]} onlyOneRow
     * @return {[type]}
     */
    getImageColCount(onlyOneRow) {
        var colCount = 1;

        colCount += this.config.showRank && !onlyOneRow ? 1 : 0;
        colCount += this.config.showScore ? 1 : 0;

        return colCount;
    },

    /**
     * Get td element with a nested div to ensure a defined with
     *
     * @param  {Element|null} td
     * @param  {String|Array} className
     * @param  {String|null} html
     * @return {Element}
     */
    getFixedColumn(td, className, html) {
        var div = document.createElement('div');

        if (this.helper.argumentExists(className)) {
            this.addClasses(div, className);
        }

        if (!this.helper.argumentExists(td)) {
            td = this.getTd();
        }

        if (this.helper.argumentExists(html)) {
            div.innerHTML = html;
        }

        td.appendChild(div);

        return td;
    },

    /**
     * If the first argument is true, append the 3rd argument to the 2nd
     *
     * @param  {Boolean} toShow
     * @param  {Element} appendTo
     * @param  {Element|String} element
     * @param  {String|Array|null} className
     * @param  {Element|String|null} html
     * @return {Element}
     */
    appendIfShown(toShow, appendTo, element, className, html) {
        if (toShow) {
            if (this.helper.isString(element)) {
                element = document.createElement(element);
            }

            if (this.helper.argumentExists(className)) {
                this.addClasses(element, className);
            }

            if (this.helper.argumentExists(html)) {
                if (this.helper.isScalar(html)) {
                    element.innerHTML = html;
                } else {
                    element.appendChild(html);
                }
            }

            appendTo.appendChild(element);
        }

        return appendTo;
    },

    /**
     * Get a td element spanning the given number of rows or columns
     *
     * @param  {Number} spanCount
     * @param  {String} spanType
     * @return {Element}
     */
    getTd(spanCount, spanType) {
        var td = document.createElement('td')

        if (this.helper.argumentExists(spanCount)) {
            td[spanType + 'Span'] = spanCount;
        }

        return td;
    },

    /**
     * Add classes to the given element
     *
     * @param {Element} element
     * @param {String|Array} classes
     * @return {void}
     */
    addClasses(element, classes) {
        if (this.helper.isString(classes)) {
            element.classList.add(classes);
        } else if (Array.isArray(classes)) {
            // Strip out empty strings
            classes = classes.filter((item) => item !== '');

            element.classList.add(...classes);
        }
    },

    /**
     * Return an image element or div with a class name that utilizes a background image
     *
     * @param  {String} source
     * @param  {Number} width
     * @param  {Number} maxHeight
     * @return {Element}
     */
    getImage(source, width, maxHeight) {
        var image;

        if (source.indexOf('http') > -1) {
            image = document.createElement('img');
            image.src = source;
        } else {
            image = document.createElement('div');
            image.classList.add(source);
        }

        if (this.helper.argumentExists(width)) {
            image.width = width;
        }

        if (this.helper.argumentExists(maxHeight)) {
            image.style.maxHeight = maxHeight + 'px';
        }

        return image;
    },

    /**
     * Format numbers over 10,000
     *
     * @param  {Number} score
     * @return {Number|String}
     */
    formatScore(score) {
        if (score > 10000) {
            score = (score / 1000).toFixed(1) + 'k';
        }

        return score;
    },

    /**
     * Set interval to cycle through existing post sets
     *
     * @return {void}
     */
    setRotateInterval() {
        if (this.rotateInterval !== null) {
            clearInterval(this.rotator);
        }

        this.rotator = setInterval(() => {
            var slider = document.getElementById('mmm-reddit-slider'),
                postSets = slider.children,
                nextIndex = this.getNextPostSetIndex();

            postSets[this.currentPostSetIndex].style.display = "none";
            postSets[nextIndex].style.display = "initial";

            this.currentPostSetIndex = nextIndex;
        }, this.config.rotateInterval * 1000);
    },

    /**
     * Increment the post set index, cylcing back to 0 when the last post set
     * is the current set
     *
     * @return {Number}
     */
    getNextPostSetIndex() {
        var index = this.currentPostSetIndex + 1;;

        if (index === this.postSets.length) {
            index = 0;
        }

        return index;
    },

    /**
     * Helper functions
     * @type {Object}
     */
    helper: {
        /**
         * Determine if the argument is undefined or null
         *
         * @param  {mixed} arg
         * @return {Boolean}
         */
        argumentExists(variable) {
            return typeof variable !== 'undefined' && variable !== null;
        },

        /**
         * Determine if the argument is a string
         *
         * @param  {mixed}  variable
         * @return {Boolean}
         */
        isString(variable) {
            return typeof variable === 'string' || variable instanceof String;
        },

        /**
         * Determine if the argument is a string or a number
         *
         * @param  {mixed}  variable
         * @return {Boolean}
         */
        isScalar(variable) {
            return (/boolean|number|string/).test(typeof variable);
        },
    }
});
