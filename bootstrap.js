const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var qQuitBtn = null;
var gAddonData = null;

const branchName = "extensions.cleanquit.";

function isNativeUI() {
  var appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
  return (appInfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}

function cleanAndQuit(window) {
  var branch = Services.prefs.getBranch(branchName);

  window.NativeWindow.toast.show("Cleaning up...", "short");

  // Use the window's sanitizer to clean the session
  var san = null;
  var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
  		.getService(Components.interfaces.nsIXULAppInfo);
  var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
  		.getService(Components.interfaces.nsIVersionComparator);
  if(versionChecker.compare(appInfo.version, "21") < 0) {
    san = new window.Sanitizer();
  } else {
    Cu.import("resource://gre/modules/XPCOMUtils.jsm");
    Cu.import("resource:///modules/Sanitizer.jsm");
    san = Sanitizer;
  }

  if (branch.getBoolPref("recenttabs")){
    var tabs = window.BrowserApp.tabs;
    tabs.forEach(function(tab) {
      window.BrowserApp.closeTab(tab);
    });
  }
  if (branch.getBoolPref("cache")){
    san.clearItem("cache");
  }
  if (branch.getBoolPref("cookies")){
    san.clearItem("cookies");
  }
  if (branch.getBoolPref("sitesettings")){
    san.clearItem("siteSettings");
  }
  if (branch.getBoolPref("offlineapps")){
    san.clearItem("offlineApps");
  }
  if (branch.getBoolPref("history")){
    san.clearItem("history");
  }
  if (branch.getBoolPref("formdata")){
    san.clearItem("formdata");
  }
  if (branch.getBoolPref("downloads")){
    san.clearItem("downloads");
  }
  if (branch.getBoolPref("passwords")){
    san.clearItem("passwords");
  }
  if (branch.getBoolPref("sessions")){
    san.clearItem("sessions");
  }

  window.setTimeout(window.BrowserApp.quit,0);
}


function loadIntoWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    var iconUrl = gAddonData.resourceURI.spec + "icon.png";
    qQuitBtn = window.NativeWindow.menu.add("CleanQuit", iconUrl, function() { cleanAndQuit(window); });
  }
}

function unloadFromWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    window.NativeWindow.menu.remove(qQuitBtn);
  }
}


/**
 * bootstrap.js API
 */
var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    var domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function() {
      domWindow.removeEventListener("load", arguments.callee, false);
      loadIntoWindow(domWindow);
    }, false);
  },
  
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
  gAddonData = aData;

  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  
  // Set up default prefs, bool only
  var defaultBranch = Services.prefs.getDefaultBranch(branchName);
  var scope = {
    pref: function(pref, value){
      defaultBranch.setBoolPref(pref, value);
    }
  };
  Services.scriptloader.loadSubScript(aData.resourceURI.spec + "defaults/prefs.js", scope);

  // Load into any existing windows
  var windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  var windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
