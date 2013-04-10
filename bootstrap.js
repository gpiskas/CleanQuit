const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var qQuitBtn = null;
let gAddonData = null;

const branchName = "extensions.cleanquit.";

function isNativeUI() {
  let appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
  return (appInfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}

function cleanAndQuit(window) {
  
  let branch = Services.prefs.getBranch(branchName);
  
  // Use the window's sanitizer to clean the session
  let san = new window.Sanitizer();
  if (branch.getBoolPref("cache")){
    san.clearItem("cache");
  }
  if (branch.getBoolPref("cookies")){
    san.clearItem("cookies");
  }
  //if (branch.getBoolPref("geolocation")){
  //  san.clearItem("geolocation");
  //}
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
  
  Services.obs.notifyObservers(null, "Browser:Quit", "");
}


function loadIntoWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    let iconUrl = gAddonData.resourceURI.spec + "image.png";
    qQuitBtn = window.NativeWindow.menu.add("Quit", iconUrl, function() { cleanAndQuit(window); });
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
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
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

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  
  // Set up default prefs, bool only
  let defaultBranch = Services.prefs.getDefaultBranch(branchName);
  let scope = {
    pref: function(pref, value){
      defaultBranch.setBoolPref(pref, value);
    }
  };
  Services.scriptloader.loadSubScript(aData.resourceURI.spec + "defaults/prefs.js", scope);

  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
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

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}