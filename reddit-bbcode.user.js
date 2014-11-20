// ==UserScript==
// @name Reddit BBCode
// @description Generate BBCode from Reddit posts.
// @author cpancake
// @downloadURL http://github.com/cpancake/reddit-bbcode
// @updateURL https://github.com/cpancake/reddit-bbcode/raw/master/reddit-bbcode.user.js
// @include http*://*reddit.com/*
// @version 0.1
// @copyright 2014 cpancake
// @namespace http://github.com/cpancake/reddit-bbcode
// ==/UserScript==

$(document).ready(function() {
	// We're not on a page with a post on it.
	if(!('.commentarea').length) return;
	// Will be filled with the compiled common.styl by sed in the makefile.
	var cssStyle = '#reddit-bbcode-popup{width:500px;height:300px;position:fixed;top:50%;left:50%;margin-left:-250px;margin-top:-150px;background:#fff;border:2px solid #cee6ff;display:none;}#reddit-bbcode-popup textarea{width:496px;height:296px;resize:none;border:0;outline:0;resize:none;font-family:monospace;overflow-x:hidden}#reddit-bbcode-popup #reddit-bbcode-close{position:absolute;bottom:0;right:0}';
	$('head').append('<style>' + cssStyle + '</style>');

	// Recursive function to figure out the bbcode of an element.
	// When provided with an element, it will recurse over its children until there's no more left,
	// and then it'll return the contents as BBCode.
	function parseContent(element)
	{
		element = $(element);
		text = '';
		if(element.is('ul'))
			text += '[list]';
		else if(element.is('ol'))
			text += '[list=1]';
		_.forEach(element.contents(), function(item) {
			item = $(item);
			if(item.is('a'))
			{
				var realItem = item[0];
				// When reddit links internally, the href is just /r/subreddit or /u/user or whatever.
				// Instead of trying to detect those, we just let the browser figure it out for us.
				var url = realItem.protocol + '//' + realItem.host + realItem.pathname 
						+ (realItem.search ? realItem.search : '') + (realItem.hash ? realItem.hash : '');
				text += '[url=' + url + ']' + item.text() + '[/url]';
			}
			// There is no header element in SA BBCode.
			else if(item.is('h1') || item.is('h2') || item.is('h3') || item.is('strong'))
				text += '[b]' + parseContent(item[0]) + '[/b]';
			else if(item.is('strike'))
				text += '[s]' + parseContent(item[0]) + '[/s]';
			else if(item.is('sup'))
				text += '[super]' + parseContent(item[0]) + '[/super]';
			else if(item.is('code'))
				text += '[code]' + parseContent(item[0]).trim() + '[/code]';
			else if(item.is('blockquote'))
				text += '[quote]' + parseContent(item[0]) + '[/quote]';
			else if(item.is('em'))
				text += '[i]' + parseContent(item[0]) + '[/i]';
			else if(item.is('li'))
				text += '[*]' + parseContent(item[0]);
			else if(item.is('p'))
				text += parseContent(item[0]);
			else
				text += item.text();
		});
		if(element.is('ul'))
			text += '[/list]';
		else if(element.is('ol'))
			text += '[/list=1]';
		return text;
	}

	function bbcodeClicked(e)
	{
		// I didn't want to do parent.parent.parent because that gets messy.
		var post = $($(this).parents('.entry'));
		var text = '[quote]\n';
		if(!post.parent().hasClass('self'))
			text += _.template('<%= author %><% if(flair) { %> [i]<%= flair %>[/i]<% } %> <%= points %> <%= time %>\n\n', {
				author: post.find('.author').text(),
				points: post.find('.score.unvoted').text(),
				time: post.find('.live-timestamp').text(),
				flair: post.find('.flair').text()
			});
		else
			text += _.template('<%= title %>\nsubmitted <%= time %> by <%= author %><% if(flair) {%> [i]<%= flair %>[/i]<% } %>\n\n', {
				title: post.find('p.title').text(),
				time: post.find('.live-timestamp').text(),
				author: post.find('.author').text(),
				flair: post.find('.flair').text()
			});
		// Find all the root content elements and recurse from there.
		_.forEach($.makeArray($(post.find('.md')).children('p,ul,pre,ol')), function(elem) {
			text += parseContent(elem) + '\n';
		});
		text += '[/quote]';
		$('#reddit-bbcode-popup textarea').val(text).focus().select();
		$('#reddit-bbcode-popup').show();
	}

	$('body').append('<div id="reddit-bbcode-popup"><textarea></textarea><button id="reddit-bbcode-close">Close</button></div>');

	$('#reddit-bbcode-close').click(function() { $('#reddit-bbcode-popup').hide(); });

	var button_listings = [];
	// We don't want to add a button to self posts, because there would be no point to that.
	if($('.linklisting .thumbnail').hasClass('self'))
		button_listings.push($('.linklisting .flat-list.buttons')[0]);
	button_listings = button_listings.concat($.makeArray($('.commentarea .flat-list')));
	_.forEach(button_listings, function(list) {
		// We don't want to add two.
		if($(list).children('.reddit-bbcode').length != 0) return;
		$(list).append('<li class="reddit-bbcode"></li>');
		$(list).find('.reddit-bbcode').append('<a href="javascript:void(0)">bbcode</a>');
		$(list).find('.reddit-bbcode a').click(bbcodeClicked);
	});
});