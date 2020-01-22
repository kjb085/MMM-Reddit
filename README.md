# MMM-Reddit #

This module is used to show top level reddit info for Magic Mirror<sup>2</sup>.

It is highly configurable and primarily allows users to choose between two display types, the number of posts pull from reddit, how many of those posts to display, how often to cycle through the set of posts, and how frequently to refresh posts from reddit.

## End User Dependencies ##

Just an installation of [Magic Mirror<sup>2</sup>](https://github.com/MichMich/MagicMirror) and a working internet connection.

## Installation ##

1. Run `git clone https://github.com/kjb085/MMM-Reddit.git` in the directory `~/MagicMirror/modules`
2. Add MMM-Reddit to your config file `~/MagicMirror/config/config.js`

```
{
	module: "MMM-Reddit",
	position: "top_right",
	config: {
    	...
	}
}
```

## Examples ##

#### Display Type: Image ####

![images](https://i.imgur.com/dvfqHiS.png)

```
config: {
	subreddit: 'earthporn',
	displayType: 'image',
	imageQuality: 'high',
	count: 10,
	show: 1,
	width: 500,
	showAll: true,
}
```

#### Display Type: Headlines ####

![headlines](https://i.imgur.com/9S60nB3.png)

```
config: {
	subreddit: ['television', 'science', 'nottheonion'],
	headerType: 'chained',
	displayType: 'headlines',
	count: 14,
	show: 7,
	width: 700,
	showScore: false,
	showSubreddit: true,
	colorText: false,
	showThumbnail: false,
}
```

## Config Options ##

#### Primary ####

Option  | Default | Description
------- | ------- | -------------
`subreddit`  | `'all'` | Subreddit to pull content from.<br><br>Please enter `frontpage` to get content from the frontpage.<br>This value can also be an array of subreddits. Ex: `['funny', 'jokes', 'tifu']`
`type`  | `hot` | Filter applied to searches.<br><br>**Options:** `hot`, `top`, `new`, `rising`, `controversial`
`displayType` | `headlines` | Format in which the reddit posts are displayed. See below for configurations specific to each display type.<br><br>**Options:** `headlines`, `image`
`count` | `10` | Number of posts to get from reddit.
`show` | `5` | Number of posts to be displayed at a time.<br><br>If this number is lower than `count`, then the posts will be rotated after a given number of seconds configured with `rotateInterval`.
`width` | `400` | Number of pixels wide the module will take up on the display.
`updateInterval` | `15` | Number of minutes until the set of current posts gets refreshed from reddit.
`rotateInterval` | `30` | Number of seconds until the posts currently being displayed is substituted by the subsequent set.
`characterLimit` | `false` | Set a character limit for post titles. Titles that are truncated will have "..." appended to the title to indicate it.
`titleReplacements` | `[]` | An array of objects used to make replacements to words or phrases in a title. Title replacements will occur prior to the character limit being enforced, so these can be used to help shorten post titles or just for fun.<br><br>**Example:** `[{toReplace: 'millennials', replacement: 'snake people', caseSensitive: false'}, {toReplace: 'politicians', replacement: 'lizard people'}]`<br><br>**Note:** `caseSensitive` defaults to true. Also accepts regular expressions for advanced find and replace, but do not include preceding and trailing forward slashes. For those not familiar with regular expressions, see [here](https://regexr.com/).
`forceImmediateUpdate` | `true` | When set to `true`, as soon as posts are received from reddit according to the updateInterval, posts are immediately rendered, regardless of what is currently on screen. When set to `false`, the module will allow the existing set to finish and the new \#1 post will be from the updated set of posts.<br><br><b>Note:</b> If this is set to `false`, it's a good idea to try to keep the show &amp; count, rotateInterval, and updateInterval in good sync with this. For example, if you're using images, displaying 1 image with a count of 10 posts rotating every 30 seconds, it will take 5 minutes to cycle through a set. Therefore, ideally you'll want to set your updateInterval to a mutiple of 5 so that it's not waiting too long to update the posts as your update will appear somewhat inconsistent.

#### Secondary ####

Option  | Default | Description
------- | ------- | -------------
`showHeader` | `true` | Show the module header.
`headerType` | `sentence` | Format in which the header is displayed.<br><br>**Options:**<br>1. Sentence (Ex: Top Posts from r/funny, r/jokes, and r/tifu)<br>2. Chained (Ex: Top Posts from r/funny+jokes+tifu)
`showAll` | `false` | Alias to show all of the below "show" toggles. `showHeader` is the only toggle excluded from this.<br><br>**Note:** If this toggle is set, it will ignore all configurations set to false.
`showRank` | `true` | Show number preceding posts indicating what order it was returned from reddit.
`showScore` | `true` | Show the total upvotes less downvotes currently attributed to a post.
`showNumComments` | `true` | Show the total number of comments on a post.
`showGilded` | `true` | Show if a post has been gilded and, if so, how many times it has been gilded.
`showAuthor` | `false` | Show the username of the person who submitted the post.
`showSubreddit` | `false` | Show the subreddit to which a post was submitted. Mostly only valuable if using the frontpage, r/all, or passing an array of subreddits.
`colorText` | `true` | Mute the color of the rank and show the score of a post with the upvote red/orange color.

#### Image Only ####

Option  | Default | Description
------- | ------- | -------------
`maxImageHeight` | `500` | Maximum height that an image is allowed to take up.
`imageQuality` | `mid-high` | Resolution of image to display.<br><br>**Options:** `low`, `mid`, `mid-high`, `high`
`showTitle` | `true` | Show the title of the given post. This attribute is also included in `showAll`.


#### Headlines Only ####

Option  | Default | Description
------- | ------- | -------------
`showThumbnail` | `false` | Show the thumbnails of posts. This attribute is also included in `showAll`.

## Dev Dependencies ##

If you plan on modifying the existing code, these tools will be helpful as the the css was created using sass. Once you have npm installed, simply run `npm install` for the subsequent npm packages to be installed.

* node-sass
* nodemon

**Note**: To make use of the installed packages run `npm run build-css` to compile scss to css and running `npm run watch-css` will watch the scss file for changes and compile on save.

## To Do ##

There is no timeline or guarantee than any of these will be accomplished. Will throughly review and test pull requests if anyone else wants to take any of these on.

* Write tests
* Allow widths other than pixels
* Add `gif` option as display type
  * Not sure if there's going to be a way to do this to ensure that the rotate doesn't fire before the gif is finished playing
* Add feature to display portion of text posts for subs such as r/dadjokes
* Add ability to allow user defined post ids for curated slideshow
* Add ability to query a subreddit(s) for a given phrase and return top hits
