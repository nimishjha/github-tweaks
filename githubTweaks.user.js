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

	const utils = (function(){
		const get = function(s)
		{
			if(s.indexOf("#") === 0 && !~s.indexOf(" ") && !~s.indexOf("."))
				return document.querySelector(s);
			const nodes = document.querySelectorAll(s);
			if(nodes.length)
				return Array.from(nodes);
			return false;
		};

		const getOne = function(s)
		{
			return document.querySelector(s);
		};

		const del = function(arg)
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

		const replaceElementsBySelector = function(selector, tagName)
		{
			if(!(selector && tagName))
			{
				selector = prompt("Element to replace (querySelectorAll)");
				tagName = prompt("Tag to replace with");
			}
			let i, ii;
			const e = document.querySelectorAll(selector);
			if(e.length)
			{
				let toreplace = [];
				for (i = 0, ii = e.length; i < ii; i++)
				{
					toreplace.push(e[i]);
				}
				for (i = toreplace.length - 1; i >= 0; i--)
				{
					toreplace[i].parentNode.replaceChild(createElement(tagName, { innerHTML: toreplace[i].innerHTML }), toreplace[i]);
				}
			}
			else if(e && e.parentNode)
			{
				e.parentNode.replaceChild(createElement(tagName, { innerHTML: e.innerHTML }), e);
			}
		};

		const insertStyle = function(str, identifier, important)
		{
			if(identifier && get("#" + identifier))
				del("#" + identifier);
			if(important)
				str = str.replace(/;/g, " !important;");
			const head = get("head")[0];
			const style = document.createElement("style");
			const rules = document.createTextNode(str);
			style.type = "text/css";
			if(style.styleSheet)
				style.styleSheet.cssText = rules.nodeValue;
			else
				style.appendChild(rules);
			if(identifier && identifier.length)
				style.id = identifier;
			head.appendChild(style);
		};

		const containsAnyOfTheStrings = function(s, arrStrings)
		{
			if(!s || typeof s !== "string") return false;
			let i = arrStrings.length;
			let found = false;
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

		const createElement = function(tag, props)
		{
			const elem = document.createElement(tag);
			if(props && typeof props === "object")
			{
				const settableProperties = ["id", "className", "textContent", "innerHTML", "value"];
				const keys = Object.keys(props);
				let i = keys.length;
				while(i--)
				{
					let key = keys[i];
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
			getOne: getOne,
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

	const github = (function(){
		const CATEGORY = {
			ALL_FILES: 'all',
			TEST_FILE: 'test',
			TEMPLATE_FILE: 'template',
			LOGIC_FILE: 'logic',
		};
		const EXPAND_TOGGLE_BUTTON_SELECTOR = ".file-info .js-details-target";

		const addButton = function(config)
		{
			const e = document.createElement("button");
			e.textContent = config.buttonText;
			e.className = "btn btn-primary";
			e.addEventListener("click", config.clickHandler, false);
			const wrapper = utils.get("#njGithubButtonWrapper");
			wrapper.appendChild(e);
		};

		const isTemplateFile = function(s)
		{
			return utils.containsAnyOfTheStrings(s, ["styl", "css", "pug"]);
		};

		const isLogicFile = function(s)
		{
			return utils.containsAnyOfTheStrings(s, [".coffee", ".js", ".jsx"]);
		};

		const isTestFile = function(s)
		{
			return utils.containsAnyOfTheStrings(s, ["/test/", "/__test__/", "/unit/", "/demos/", ".snap", ".spec"]);
		};

		const clickButton = function(button)
		{
			button.click();
		};

		const collapseAllFiles = function()
		{
			const e = utils.get(EXPAND_TOGGLE_BUTTON_SELECTOR);
			let i = e.length;
			while(i--)
				if(e[i].getAttribute("aria-expanded") === "true")
					clickButton(e[i]);
		};

		const replaceStickyHeaders = function()
		{
			console.log('Replacing sticky headers');
			utils.replaceElementsBySelector(".sticky-file-header", "h4");
			utils.replaceElementsBySelector(".file-header", "h4");
		};

		const toggleFilesByCategory = function(category)
		{
			init();
			const e = utils.get(EXPAND_TOGGLE_BUTTON_SELECTOR);
			let parent, fileInfo;
			let i = e.length;
			while(i--)
			{
				parent = e[i].closest("h4");
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

		const init = function ()
		{
			if(~location.href.indexOf('/pull/'))
			{
				const splits = location.href.split('/');
				if (splits.length >= 7)
				{
					// document.title = splits[6];
					document.title = document.title.replace(/\[[^\]]+\]/g, '');
				}
			}
			replaceStickyHeaders();
		};

		const approvePullRequest = function ()
		{
			const openReviewPanel = function ()
			{
				const elem = utils.getOne(".js-reviews-toggle");
				if (elem)
					elem.click();
			};

			const clickApproveCheckbox = function ()
			{
				const e = utils.get(".form-checkbox input");
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
				const e = utils.getOne(".pull-request-review-menu .btn-primary");
				if (e)
					e.click();
			};

			openReviewPanel();
			setTimeout(clickApproveCheckbox, 100);
			setTimeout(clickSubmitReview, 500);
		};

		const main = function()
		{
			const style = '.sticky-content, .js-sticky h1, .js-sticky h2 { display: none; }' +
				'#njGithubButtonWrapper { display: none; padding: 10px; background: #000; }' +
				'#njGithubButtonWrapper button { margin: 0 10px 0 0; }' +
				'body.full-width #njGithubButtonWrapper { display: block; }';
			utils.insertStyle(style, "styleGithub", true);
			utils.replaceElementsBySelector(".sticky-file-header", "h4");
			utils.replaceElementsBySelector(".file-header", "h4");
			const wrapper = utils.createElement("div", { id: "njGithubButtonWrapper" });
			document.body.insertBefore(wrapper, document.body.firstChild);
			addButton({ buttonText: "Collapse all files", clickHandler: collapseAllFiles });
			addButton({ buttonText: "Toggle all files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.ALL_FILES ); } });
			addButton({ buttonText: "Toggle logic files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.LOGIC_FILE ); } });
			addButton({ buttonText: "Toggle test files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.TEST_FILE ); } });
			addButton({ buttonText: "Toggle template files", clickHandler: function(){ toggleFilesByCategory( CATEGORY.TEMPLATE_FILE ); } });
			addButton({ buttonText: "Approve pull request", clickHandler: approvePullRequest });
			init();
			setTimeout(init, 500);
			setTimeout(init, 5000);
			window.onpopstate = function(){ console.log('onpopstate'); setTimeout(init, 200); };
			window.onbeforeunload = function(){ console.log('onbeforeunload'); setTimeout(init, 200); };
			window.onunload = function(){ console.log('onunload'); setTimeout(init, 200); };
			utils.replaceElementsBySelector(".commit-title", "h1");
		};

		return {
			main: main,
		};

	}());

	github.main();

})();
