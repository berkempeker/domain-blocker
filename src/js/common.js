let blocklist = {};

blocklist.common = {};

blocklist.common.pws_option_val = "off";

blocklist.common.GET_BLOCKLIST = 'getBlocklist';
blocklist.common.ADD_TO_BLOCKLIST = 'addToBlocklist';
blocklist.common.ADD_LIST_TO_BLOCKLIST = 'addListToBlocklist';
blocklist.common.DELETE_FROM_BLOCKLIST = 'deleteFromBlocklist';
blocklist.common.GET_PWS_OPTION_VAL = "getPwsOptionVal";
blocklist.common.CHANGE_PWS_OPTION_VAL = "changePwsOptionVal";

blocklist.common.HOST_REGEX = new RegExp(
  '^https?://(www[.])?([0-9a-zA-Z.-]+).*$');

blocklist.common.startBackgroundListeners = function () {
  browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (request.type == blocklist.common.GET_BLOCKLIST) {
        browser.storage.local.get(['blocklist', 'blocklist_pws_option']).then(function(result) {
          let blocklistPatterns = result.blocklist || [];
          let pwsOption = result.blocklist_pws_option || "off";
          
          sendResponse({
            blocklist: blocklistPatterns,
            pws_option: pwsOption
          });
        });
        return true; // Required for async response
      } else if (request.type == blocklist.common.ADD_TO_BLOCKLIST) {
        browser.storage.local.get('blocklist').then(function(result) {
          let blocklists = result.blocklist || [];
          if (blocklists.indexOf(request.pattern) == -1) {
            blocklists.push(request.pattern);
            blocklists.sort();
            browser.storage.local.set({blocklist: blocklists});
          }
          sendResponse({
            success: 1,
            pattern: request.pattern
          });
        });
        return true;
      } else if (request.type == blocklist.common.ADD_LIST_TO_BLOCKLIST) {
        let regex = /(https?:\/\/)?(www[.])?([0-9a-zA-Z.-]+).*(\r\n|\n)?/g;
        let arr = [];
        while ((m = regex.exec(request.pattern)) !== null) {
          arr.push(m[3]);
        }

        browser.storage.local.get('blocklist').then(function(result) {
          let blocklists = result.blocklist || [];
          for (let i = 0, length = arr.length; i < length; i++) {
            if (blocklists.indexOf(arr[i]) == -1) {
              blocklists.push(arr[i]);
            }
          }

          blocklists.sort();
          browser.storage.local.set({blocklist: blocklists});

          sendResponse({
            success: 1,
            pattern: request.pattern
          });
        });
        return true;
      } else if (request.type == blocklist.common.DELETE_FROM_BLOCKLIST) {
        browser.storage.local.get('blocklist').then(function(result) {
          let blocklists = result.blocklist || [];
          let index = blocklists.indexOf(request.pattern);
          if (index != -1) {
            blocklists.splice(index, 1);
            browser.storage.local.set({blocklist: blocklists});
            sendResponse({
              pattern: request.pattern
            });
          }
        });
        return true;
      } else if (request.type == blocklist.common.GET_PWS_OPTION_VAL) {
        browser.storage.local.get('blocklist_pws_option').then(function(result) {
          let pwsOption = result.blocklist_pws_option || "off";
          sendResponse({
            pws_option: pwsOption
          });
        });
        return true;
      } else if (request.type == blocklist.common.CHANGE_PWS_OPTION_VAL) {
        browser.storage.local.set({blocklist_pws_option: request.val});
        sendResponse({
          pws_option: request.val
        });
        return true;
      }
    }
  );
};

/*
 * get hostname from url
 *
 * ex) https://example.com/foo.html      → example.com
 *     http://example.com/               → example.com
 *     https://example.com/bar/foo.html  → example.com
 */
blocklist.common.getHostNameFromUrl = function (pattern) {
  return pattern.replace(blocklist.common.HOST_REGEX, '$2');
}

blocklist.common.startBackgroundListeners();

