/*
*  CleanQuit
*  Copyright (C) 2013  George Piskas
*
*  This program is free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License along
*  with this program; if not, write to the Free Software Foundation, Inc.,
*  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*
*  Contact: geopiskas@gmail.com
*/

var data = require("self").data;
var menuitem = require("menuitems");

menuitem.Menuitem({
	id: "cleanquit-button",
	menuid: "menu_FilePopup",
	label: "CleanQuit",
	image: data.url("icon.png"),
	onCommand: function() {
		cleanQuit();
	}
});

exports.main = function(options) {
    var btn = require("toolbarbutton").ToolbarButton({
        id: 'cleanquit-toolbar',
        label: 'CleanQuit',
        image: data.url("icon.png"),
        onCommand: function() {
			cleanQuit();
        }
    });

    if (options.loadReason === "install") {
    btn.moveTo({
		toolbarID: "nav-bar",
		forceMove: false // only move from palette
    });
  }
};



function cleanQuit() {
    var {Cc, Ci} = require("chrome");
	
	// Cache
	if(require("sdk/simple-prefs").prefs.cache) {
		try {
			var cacheService = Cc["@mozilla.org/network/cache-service;1"].getService(Ci.nsICacheService);
			cacheService.evictEntries(Ci.nsICache.STORE_ANYWHERE);
		} catch(e) {
			//chill
		}
	}
	
	
	// Cookies
	if(require("sdk/simple-prefs").prefs.cookies) {
		try {
			var cookieMgr = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager);
			cookieMgr.removeAll();
		} catch(e) {
			//chill
		}
	}
	
	// History
	if(require("sdk/simple-prefs").prefs.history) {
		try {
			var history = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsIBrowserHistory);
			history.removeAllPages();
			
			var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
			os.notifyObservers(null, "browser:purge-session-history", "");
			
			var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2);
			prefs.clearUserPref("general.open_location.last_url");
		} catch (e) {
			//chill
		}
	}

	// Form Data
	if(require("sdk/simple-prefs").prefs.formdata) {
		try {
			var windows = Cc['@mozilla.org/appshell/window-mediator;1']
										.getService()
										.QueryInterface(Ci.nsIWindowMediator)
										.getEnumerator("navigator:browser");
			while (windows.hasMoreElements()) {
				var searchBar = windows.getNext().document.getElementById("searchbar");
				if (searchBar) {
					searchBar.value = "";
					searchBar.textbox.editor.transactionManager.clear();
				}
			}

			var formHistory = Cc["@mozilla.org/satchel/form-history;1"].getService(Ci.nsIFormHistory2);
			formHistory.removeAllEntries();		
		} catch (e) {
			//chill
		}
	}
	
	// Downloads
	if(require("sdk/simple-prefs").prefs.downloads) {
		try {
			var dlMgr = Cc["@mozilla.org/download-manager;1"].getService(Ci.nsIDownloadManager);
			dlMgr.cleanUp();	
		} catch (e) {
			//chill
		}
	}
	
	// Passwords
	if(require("sdk/simple-prefs").prefs.passwords) {
		try {
			var pwmgr = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
			pwmgr.removeAllLogins();	
		} catch (e) {
			//chill
		}	
	}

	// Sessions
	if(require("sdk/simple-prefs").prefs.sessions) {
		try {
			var sdr = Cc["@mozilla.org/security/sdr;1"].getService(Ci.nsISecretDecoderRing);
			sdr.logoutAndTeardown();
			
			var authMgr = Cc['@mozilla.org/network/http-auth-manager;1'].getService(Ci.nsIHttpAuthManager);
			authMgr.clearAll();
		} catch (e) {
			//chill
		}	
	}
	
	// Quit
	if(require("sdk/simple-prefs").prefs.quit) {
		require("sdk/system").exit();
	}
}
