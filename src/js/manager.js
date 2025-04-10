blocklist.manager = {};

blocklist.manager.handleDeleteBlocklistResponse = function (response) {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(function(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
      type: 'refresh'
    });
  });
};

blocklist.manager.handleAddBlocklistResponse = function (response) {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(function(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
      type: 'refresh'
    });
  });
};

blocklist.manager.createBlocklistPattern = function (pattern) {
  let patRow = $(
    '<div style="max-width:350px;white-space: nowrap;display:flex;font-size:16px;margin:10px 0;padding:5px 0;border-bottom:1px solid #f2f2f2;"></div>');
  let patRowDeleteButton = $('<div class="isBlocked" style="margin-right: 15px;"></div>');
  let span = $('<span style="color:#1a0dab;margin:8px;hover:underline;cursor: pointer;">' +
    browser.i18n.getMessage('removeUrlFromBlocklist') +
    '</span>');

  patRowDeleteButton.append(span);
  patRowDeleteButton.appendTo(patRow);

  let patRowHostName = $(
    '<div class="pattern-block">' + pattern + '</div>');
  patRowHostName.appendTo(patRow);

  patRowDeleteButton.on("click", function () {
    let btn = $(this);

    if (btn.hasClass("isBlocked")) {
      browser.runtime.sendMessage({
        type: blocklist.common.DELETE_FROM_BLOCKLIST,
        pattern: pattern
      }).then(blocklist.manager.handleDeleteBlocklistResponse);

      btn.removeClass("isBlocked");
      span.html(
        '<span style="color:#1a0dab;margin:8px;hover:underline;cursor: pointer;">' +
        browser.i18n.getMessage('blockThisUrl') +
        '</span>');

    } else {
      browser.runtime.sendMessage({
        type: blocklist.common.ADD_TO_BLOCKLIST,
        pattern: pattern
      }).then(blocklist.manager.handleAddBlocklistResponse);

      btn.addClass("isBlocked");
      span.html(
        '<span style="color:#1a0dab;margin:8px;hover:underline;cursor: pointer;">' +
        browser.i18n.getMessage('removeUrlFromBlocklist') +
        '</span>');

    }
  });
  return patRow;
}

blocklist.manager.handleAddBlocklistResponse = function (response) {
  browser.runtime.sendMessage({
    type: blocklist.common.GET_BLOCKLIST
  }).then(blocklist.manager.handleRefreshResponse);
}

blocklist.manager.hideCurrentHost = function (pattern) {
  browser.runtime.sendMessage({
    'type': blocklist.common.ADD_TO_BLOCKLIST,
    'pattern': pattern
  }).then(blocklist.manager.handleAddBlocklistResponse);
  $("#current-blocklink").html(
    '<p style="background:#dff0d8;color:#3c763d;padding:10px;">' +
    browser.i18n.getMessage('alreadlyBlocked', pattern) +
    '</p>');
}

blocklist.manager.addBlockCurrentHostLink = function (blocklistPatterns) {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(function(tabs) {
    let pattern = blocklist.common.getHostNameFromUrl(tabs[0].url);

    if (blocklistPatterns.indexOf(pattern) == -1) {
      $('#current-blocklink').html(
        '<a href="#"> ' +
        browser.i18n.getMessage("addBlocklist", pattern) +
        '</a>');
      $('#current-blocklink').click(function () {
        blocklist.manager.hideCurrentHost(pattern);
      });
    } else {
      $("#current-blocklink").html(
        '<p style="background:#dff0d8;color:#3c763d;padding:10px;">' +
        browser.i18n.getMessage('completeBlocked', pattern) +
        '</p>');
    };
  });
}

blocklist.manager.handleRefreshResponse = function (response) {
  $("#manager-pattern-list").show('fast');

  let length = response.blocklist.length,
    listDiv = $('#manager-pattern-list');
  listDiv.empty();

  if (response.blocklist != undefined && length > 0) {
    blocklist.manager.addBlockCurrentHostLink(response.blocklist);

    for (let i = 0; i < length; i++) {
      var patRow = blocklist.manager.createBlocklistPattern(response.blocklist[i]);
      patRow.appendTo(listDiv);
    }
  } else {
    blocklist.manager.addBlockCurrentHostLink([]);
  }
}

blocklist.manager.refresh = function () {
  browser.runtime.sendMessage({
    type: blocklist.common.GET_BLOCKLIST
  }).then(blocklist.manager.handleRefreshResponse);
};

blocklist.manager.clickImportButton = function () {
  $("#io-head").text(browser.i18n.getMessage('import'));

  let submitArea = $("#submit-area");
  submitArea.off('click');
  submitArea.text(browser.i18n.getMessage("save"));
  $("#io-desc").text(browser.i18n.getMessage('importDescription'));
  $("#io-text").val('');
  submitArea.on("click", function () {
    let pattern = $("#io-text").val();
    blocklist.manager.handleImportButton(pattern);
  });
  $("#io-area").toggleClass('io-area-open');
};

blocklist.manager.handleImportButton = function (pattern) {
  browser.runtime.sendMessage({
    type: blocklist.common.ADD_LIST_TO_BLOCKLIST,
    pattern: pattern
  }).then(blocklist.manager.handleImportButtonResult);
}

blocklist.manager.handleImportButtonResult = function (response) {
  let showMessage = document.createElement('p');
  showMessage.style.cssText = 'background:#dff0d8;color:#3c763d;padding:10px;';
  showMessage.innerHTML = browser.i18n.getMessage("completeAllBlocked");

  $('#submit-area').after(showMessage);

  setTimeout(function () {
    showMessage.style.visibility = "hidden";
  }, 1000);

  blocklist.manager.refresh();
}

blocklist.manager.clickExportButton = function () {
  browser.runtime.sendMessage({
    type: blocklist.common.GET_BLOCKLIST
  }).then(blocklist.manager.handleExportButton);
};

blocklist.manager.handleExportButton = function (response) {
  $("#io-head").text(browser.i18n.getMessage('export'));

  $('#io-desc').text(browser.i18n.getMessage('exportDescription'));
  let ioText = $("#io-text");
  let blocklist = response.blocklist;

  ioText.val('');
  for (let i = 0, length = blocklist.length; i < length; i++) {
    ioText.val(ioText.val() + blocklist[i] + "\n");
  }

  let submitArea = $("#submit-area");
  submitArea.off('click');
  submitArea.text(browser.i18n.getMessage('copy'));
  submitArea.click(function () {
    ioText.select();
    document.execCommand('copy');
  });

  $("#io-area").toggleClass('io-area-open');
}

blocklist.manager.localizeHeader = function () {
  let blockListHeader = $("#blockListHeader");
  blockListHeader.html(browser.i18n.getMessage("blockListHeader"));
}

blocklist.manager.createIoButton = function () {
  let export_btn = $("#export");
  export_btn.text(browser.i18n.getMessage("export"));
  export_btn.on("click", function () {
    blocklist.manager.clickExportButton();
  });

  let import_btn = $("#import");
  import_btn.text(browser.i18n.getMessage("import"));
  import_btn.on("click", function () {
    blocklist.manager.clickImportButton();
  });
}

blocklist.manager.createBackButton = function () {
  $("#back").text(browser.i18n.getMessage("back"))
  $("#back").on("click", function () {
    $("#io-area").toggleClass('io-area-open');
  });
}

blocklist.manager.createPwsOptionBox = function () {
  browser.runtime.sendMessage({
    type: blocklist.common.GET_PWS_OPTION_VAL
  }).then(blocklist.manager.handlePwsOptionBox);
}

blocklist.manager.handlePwsOptionBox = function (response) {
  $("#pws_option_mes").text(browser.i18n.getMessage("pws_option_mes"));

  if (response.pws_option == "on")
    $("#pws_option").prop("checked", true);

  $("#pws_option").on("change", function () {
    let val = $("#pws_option").prop("checked") ? "on" : "off";
    blocklist.manager.clickPwsOptionCheckbox(val);
  });
}

blocklist.manager.clickPwsOptionCheckbox = function (val) {
  browser.runtime.sendMessage({
    type: blocklist.common.CHANGE_PWS_OPTION_VAL,
    val: val
  }).then(blocklist.manager.handlePwsOptionCheckboxResult);
};

blocklist.manager.handlePwsOptionCheckboxResult = function (response) {
  if (blocklist.common.pws_option_val)
    blocklist.common.pws_option_val = response.pws_option;
}

document.addEventListener('DOMContentLoaded', function () {
  blocklist.manager.refresh();
  blocklist.manager.localizeHeader();
  blocklist.manager.createIoButton();
  blocklist.manager.createBackButton();
  blocklist.manager.createPwsOptionBox();
});


