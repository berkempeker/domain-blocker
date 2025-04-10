blocklist.searchpage = {};

blocklist.searchpage.blocklist = [];

blocklist.searchpage.mutationObserver = null;

blocklist.searchpage.pws_option = "off";

blocklist.searchpage.SEARCH_RESULT_DIV_BOX = "div.MjjYud";

blocklist.searchpage.LINK_TAG = "a[jsname='UWckNb']";

blocklist.searchpage.handleGetBlocklistResponse = function (response) {
  if (response.blocklist != undefined) {
    blocklist.searchpage.blocklist = response.blocklist;
  }
};

blocklist.searchpage.isHostLinkInBlocklist = function (hostlink) {
  if (blocklist.searchpage.blocklist.indexOf(hostlink) != -1) {
    return true;
  } else {
    return false;
  }
};

blocklist.searchpage.handleAddBlocklistFromSerachResult = function (response) {
  if (response.blocklist != undefined) {
    blocklist.searchpage.blocklist = response.blocklist;
  }
};

blocklist.searchpage.showAddBlocklistMessage = function (pattern, section) {
  let showMessage = document.createElement('div');
  showMessage.style.cssText = 'color: #F00; font-size:16px;padding:0px;margin:0px 0;box-sizing:border-box;';
  showMessage.innerHTML = browser.i18n.getMessage("completeBlocked", pattern);

  // Add undo link
  let undoLink = document.createElement('div');
  undoLink.style.cssText = "cursor: pointer;margin-bottom:50px;font-size:16px;color: #0066c0;text-decoration: underline;";
  undoLink.innerHTML = browser.i18n.getMessage("undoBlock");
  undoLink.addEventListener("click", function (e) {
    blocklist.searchpage.removePatternFromBlocklists(pattern);
    blocklist.searchpage.removeBlockMessage(e.target.parentNode);
  }, false);
  showMessage.appendChild(undoLink);

  let parent = section.parentNode;
  parent.insertBefore(showMessage, section);
}

blocklist.searchpage.removeBlockMessage = function (elm) {
  elm.parentNode.removeChild(elm);
}

blocklist.searchpage.removePatternFromBlocklists = function (pattern) {
  browser.runtime.sendMessage({
    type: blocklist.common.DELETE_FROM_BLOCKLIST,
    pattern: pattern
  }).then(blocklist.searchpage.handleRemoveBlocklistFromSerachResult);

  blocklist.searchpage.displaySectionsFromSearchResult(pattern);
}

blocklist.searchpage.handleRemoveBlocklistFromSerachResult = function (response) {
  if (response.blocklist != undefined) {
    blocklist.searchpage.blocklist = response.blocklist;
  }
}

blocklist.searchpage.displaySectionsFromSearchResult = function (pattern) {
  blocklist.searchpage.toggleSections(pattern, "block");
}

blocklist.searchpage.deleteSectionsFromSearchResult = function (pattern) {
  blocklist.searchpage.toggleSections(pattern, "none");
};

blocklist.searchpage.toggleSections = function (pattern, display) {
  var searchResultPatterns = document.querySelectorAll(blocklist.searchpage.SEARCH_RESULT_DIV_BOX);

  for (let i = 0, length = searchResultPatterns.length; i < length; i++) {
    var searchResultPattern = searchResultPatterns[i];
    var searchResultHostLink = searchResultPattern.querySelector(blocklist.searchpage.LINK_TAG);
    if (searchResultHostLink) {
      var HostLinkHref = searchResultHostLink.getAttribute("href");
      var sectionLink = HostLinkHref.replace(blocklist.common.HOST_REGEX, '$2');
      if (pattern === sectionLink) {
        searchResultPattern.style.display = display;
      }
    }
  }
}

blocklist.searchpage.addBlocklistFromSearchResult = function (hostlink, searchresult) {
  var pattern = hostlink;
  browser.runtime.sendMessage({
    type: blocklist.common.ADD_TO_BLOCKLIST,
    pattern: pattern
  }).then(blocklist.searchpage.handleAddBlocklistFromSerachResult);
  blocklist.searchpage.deleteSectionsFromSearchResult(pattern);
  blocklist.searchpage.showAddBlocklistMessage(pattern, searchresult);
};

blocklist.searchpage.insertAddBlockLinkInSearchResult = function (searchResult, hostlink) {
  var insertLink = document.createElement('p');
  insertLink.innerHTML = browser.i18n.getMessage("addBlocklist", hostlink);
  insertLink.style.cssText =
    "color:#F00;margin:0px;text-decoration:underline;cursor: pointer;";
  searchResult.insertBefore(insertLink, searchResult.firstChild);

  insertLink.addEventListener("click", function () {
    blocklist.searchpage.addBlocklistFromSearchResult(hostlink, searchResult);
  }, false);
};

blocklist.searchpage.isPwsFeatureUsed = function () {
  if (blocklist.searchpage.pws_option == "off") return false;

  const PWS_REGEX = /(&|[?])pws=0/;
  return PWS_REGEX.test(location.href);
};

blocklist.searchpage.modifySearchResults = function (parent_dom) {
  if (blocklist.searchpage.isPwsFeatureUsed()) return;

  var searchResultPatterns = parent_dom.querySelectorAll(blocklist.searchpage.SEARCH_RESULT_DIV_BOX);

  for (let i = 0, length = searchResultPatterns.length; i < length; i++) {
    var searchResultPattern = searchResultPatterns[i];
    var searchResultHostLink = searchResultPattern.querySelector(blocklist.searchpage.LINK_TAG);
    if (searchResultHostLink) {
      var HostLinkHref = searchResultHostLink.getAttribute("href");
      var HostLinkPattern = blocklist.common.getHostNameFromUrl(HostLinkHref);

      if (blocklist.searchpage.isHostLinkInBlocklist(HostLinkPattern)) {
        searchResultPattern.style.display = "none";
      } else {
        blocklist.searchpage.insertAddBlockLinkInSearchResult(
          searchResultPattern, HostLinkPattern);
      }
    }
  }
};

blocklist.searchpage.refreshBlocklist = function () {
  browser.runtime.sendMessage({
    type: blocklist.common.GET_BLOCKLIST
  }).then(blocklist.searchpage.handleGetBlocklistResponse);
};

blocklist.searchpage.getPwsOption = function () {
  browser.runtime.sendMessage({
    type: blocklist.common.GET_PWS_OPTION_VAL
  }).then(blocklist.searchpage.handleGetPwsOptionResponse);
}

blocklist.searchpage.handleGetPwsOptionResponse = function (response) {
  blocklist.searchpage.pws_option = response.pws_option;
}

blocklist.searchpage.initMutationObserver = function () {
  if (blocklist.searchpage.mutationObserver != null) return;

  blocklist.searchpage.mutationObserver = new MutationObserver(function (mutations) {
    blocklist.searchpage.modifySearchResultsAdded(mutations);
  });

  const SEARCH_RESULTS_WRAP = "div#center_col";
  let target = document.querySelector(SEARCH_RESULTS_WRAP);
  let config = { childList: true, subtree: true };
  blocklist.searchpage.mutationObserver.observe(target, config);
}

blocklist.searchpage.modifySearchResultsAdded = function (mutations) {
  for (let i = 0; i < mutations.length; i++) {
    let mutation = mutations[i];
    let nodes = mutation.addedNodes;

    if (nodes.length !== 3) continue;

    let div_tag = nodes[1];
    if (div_tag.tagName !== "DIV") continue;

    let new_srp_div = div_tag.parentNode;
    if (!(/arc-srp_([0-9]+)/).test(new_srp_div.id)) continue;

    blocklist.searchpage.modifySearchResults(new_srp_div);
  };
}

blocklist.searchpage.refreshBlocklist();
blocklist.searchpage.getPwsOption();

document.addEventListener("DOMContentLoaded", function () {
  blocklist.searchpage.initMutationObserver();
  blocklist.searchpage.modifySearchResults(document);
}, false);
