// ==UserScript==
// @name         Github Tweaks
// @namespace    https://www.nimishjha.com
// @version      0.1
// @description  Github tweaks
// @author       Nimish Jha
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	//
	//				Utils
	//

	var utils = (function(){
		var get = function(s)
		{
			if(s.indexOf("#") === 0 && !~s.indexOf(" ") && !~s.indexOf("."))
				return document.querySelector(s);
			var nodes = document.querySelectorAll(s);
			if(nodes.length)
				return Array.from(nodes);
			return false;
		};

		var del = function(arg)
		{
			if(!arg)
				return;
			if(arg.nodeType)
				arg.parentNode.removeChild(arg);
			else if(arg.length)
				if(typeof arg === "string")
					del(get(arg));
				else
					for(var i = 0, ii = arg.length; i < ii; i++)
						del(arg[i]);
		};

		var replaceElementsBySelector = function(selector, tagName)
		{
			if(!(selector && tagName))
			{
				selector = prompt("Element to replace (querySelectorAll)");
				tagName = prompt("Tag to replace with");
			}
			var replacement, e, toreplace, i, ii;
			e = document.querySelectorAll(selector);
			if(e.length)
			{
				toreplace = [];
				for (i = 0, ii = e.length; i < ii; i++)
				{
					toreplace.push(e[i]);
				}
				for (i = toreplace.length - 1; i >= 0; i--)
				{
					replacement = createElement(tagName, { innerHTML: toreplace[i].innerHTML });
					toreplace[i].parentNode.replaceChild(replacement, toreplace[i]);
				}
			}
			else if(e && e.parentNode)
			{
				replacement = createElement(tagName, { innerHTML: e.innerHTML });
				e.parentNode.replaceChild(replacement, e);
			}
		};

		var insertStyle = function(str, identifier, important)
		{
			if(identifier && get("#" + identifier))
				del("#" + identifier);
			if(important)
				str = str.replace(/;/g, " !important;");
			var head = get("head")[0], style = document.createElement("style"), rules = document.createTextNode(str);
			style.type = "text/css";
			if(style.styleSheet)
				style.styleSheet.cssText = rules.nodeValue;
			else
				style.appendChild(rules);
			if(identifier && identifier.length)
				style.id = identifier;
			head.appendChild(style);
		};

		var containsAnyOfTheStrings = function(s, arrStrings)
		{
			if(!s || typeof(s) !== "string") return false;
			var i = arrStrings.length;
			var found = false;
			while(i--)
			{
				if(~s.indexOf(arrStrings[i]))
				{
					found = true;
					break;
				}
			}
			return found;
		};

		var createElement = function(tag, props)
		{
			var elem = document.createElement(tag);
			if(props && typeof props === "object")
			{
				var key, keys = Object.keys(props);
				var i = keys.length;
				var settableProperties = ["id", "className", "textContent", "innerHTML", "value"];
				while(i--)
				{
					key = keys[i];
					if(settableProperties.includes(key))
						elem[key] = props[key];
					else
						elem.setAttribute(key, props[key]);
				}
				return elem;
			}
			return elem;
		};

		return {
			get: get,
			del: del,
			replaceElementsBySelector: replaceElementsBySelector,
			insertStyle: insertStyle,
			containsAnyOfTheStrings: containsAnyOfTheStrings,
			createElement: createElement,
		};

	}());

	//
	//				Github
	//

	var github = (function(){
		var CATEGORY = {
			ALL_FILES: 'all',
			TEST_FILE: 'test',
			TEMPLATE_FILE: 'template',
			LOGIC_FILE: 'logic',
		};

		var addButton = function(config)
		{
			var e = document.createElement("button");
			e.textContent = config.buttonText;
			e.className = "btn btn-primary";
			e.addEventListener("click", config.clickHandler, false);
			var wrapper = utils.get("#njGithubButtonWrapper");
			wrapper.appendChild(e);
		};

		var isTemplateFile = function(s)
		{
			return utils.containsAnyOfTheStrings(s, ["styl", "css", "pug"]);
		};

		var isLogicFile = function(s)
		{
			return utils.containsAnyOfTheStrings(s, [".coffee", ".js", ".jsx"]);
		};

		var isTestFile = function(s)
		{
			return utils.containsAnyOfTheStrings(s, ["/test/", "/__test__/", "/unit/", "/demos/", ".snap", ".spec"]);
		};

		var clickButton = function(button)
		{
			button.click();
		};

		var collapseAllFiles = function()
		{
			var e = utils.get(".file-actions .js-details-target");
			var i = e.length;
			while(i--)
				if(e[i].getAttribute("aria-expanded") === "true")
					clickButton(e[i]);
		};

		var toggleFilesByCategory = function(category)
		{
			var e = utils.get(".file-actions .js-details-target");
			var parent, fileInfo;
			var i = e.length;
			while(i--)
			{
				parent = e[i].closest(".file-header");
				if(parent)
				{
					fileInfo = parent.querySelector(".file-info a");
					switch(category)
					{
						case CATEGORY.ALL_FILES: clickButton(e[i]); break;
						case CATEGORY.TEST_FILE: if(isTestFile(fileInfo.textContent)) clickButton(e[i]); break;
						case CATEGORY.TEMPLATE_FILE: if(isTemplateFile(fileInfo.textContent)) clickButton(e[i]); break;
						case CATEGORY.LOGIC_FILE: if(isLogicFile(fileInfo.textContent)) clickButton(e[i]); break;
					}
				}
			}
		};

		const approvePullRequest = function ()
		{
			const openReviewPanel = function ()
			{
				const elem = getOne(".js-reviews-toggle");
				if (elem)
					elem.click();
			};

			const clickApproveCheckbox = function ()
			{
				const e = get(".form-checkbox input");
				let i = e.length;
				while (i--)
				{
					const checkbox = e[i];
					if (checkbox.value === "approve")
					{
						checkbox.setAttribute("checked", "checked");
						checkbox.click();
						break;
					}
				}
			};

			const clickSubmitReview = function ()
			{
				const e = getOne(".pull-request-review-menu .btn-primary");
				if (e)
					e.click();
			};

			openReviewPanel();
			setTimeout(clickApproveCheckbox, 100);
			setTimeout(clickSubmitReview, 500);
		};

		var main = function()
		{
			var style = '.sticky-content, .js-sticky h1, .js-sticky h2 { display: none; }' +
				'#njGithubButtonWrapper { display: none; padding: 10px; background: #000; }' +
				'#njGithubButtonWrapper button { margin: 0 10px 0 0; }' +
				'body.full-width #njGithubButtonWrapper { display: block; }';
			utils.insertStyle(style, "styleGithub", true);
			var wrapper = utils.createElement("div", { id: "njGithubButtonWrapper" });
			document.body.insertBefore(wrapper, document.body.firstChild);
			addButton({ buttonText: "Collapse all files", clickHandler: collapseAllFiles });
			addButton({ buttonText: "Toggle all files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.ALL_FILES ); } });
			addButton({ buttonText: "Toggle logic files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.LOGIC_FILE ); } });
			addButton({ buttonText: "Toggle test files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.TEST_FILE ); } });
			addButton({ buttonText: "Toggle template files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.TEMPLATE_FILE ); } });
			addButton({ buttonText: "Approve pull request", clickHandler: approvePullRequest });
			document.title = document.title.replace(/\[.+\]/, '');
			utils.replaceElementsBySelector(".commit-title", "h1");
		};

		return {
			main: main,
		};

	}());

	github.main();

})();