dump('entering util.browser.js\n');

if (typeof util == 'undefined') util = {};
util.browser = function (params) {
    try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        JSAN.use('util.error'); this.error = new util.error();
    } catch(E) {
        dump('util.browser: ' + E + '\n');
    }
}

util.browser.prototype = {

    'init' : function( params ) {

        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

            var obj = this;

            obj.url = params['url'];
            obj.push_xulG = params['push_xulG'];
            obj.html_source = params['html_source'];
            obj.browser_id = params['browser_id'];
            obj.debug_label = params['debug_label'];
            obj.passthru_content_params = params['passthru_content_params'];
            obj.on_url_load = params['on_url_load'];
            obj.printer_context = params['printer_context'] || 'default';

            JSAN.use('util.controller'); obj.controller = new util.controller();
            obj.controller.init(
                {
                    control_map : {
                        'cmd_broken' : [
                            ['command'],
                            function() { alert('Not Yet Implemented'); }
                        ],
                        'cmd_debug' : [
                            ['command'],
                            function() {
                                var curr_url = obj.get_content().location.href;
                                var url = window.prompt('Original URL: ' + obj.url + '\nCurrent URL: ' + curr_url + '\nEnter new URL:',curr_url);
                                if (url) { obj.get_content().location.href = url; }
                            }
                        ],
                        'cmd_view_source' : [
                            ['command'],
                            function() {
                                var curr_url = obj.get_content().location.href;
                                //obj.get_content().location.href = 'view-source:' + curr_url; // This works too, but the openDialog below is more feature-rich
                                window.openDialog("chrome://global/content/viewSource.xul", "", "all,dialog=no", curr_url);
                            }
                        ],
                        'cmd_print' : [
                            ['command'],
                            function() {
                                try {
                                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                                    var content = obj.get_content();
                                    JSAN.use('util.print'); var p = new util.print(obj.printer_context);
                                    var print_params = {};
                                    if (obj.html_source) {
                                        print_params.msg = obj.html_source;
                                        print_params.content_type = 'text/html';
                                    }
                                    if (typeof content.printable_output == 'function') {
                                        print_params.msg = content.printable_output();
                                        print_params.content_type = 'text/plain';
                                        content = print_params.msg;
                                    }
                                    JSAN.use('OpenILS.data'); var data = new OpenILS.data(); data.stash_retrieve();
                                    // Override the print strategy temporarily if it's not set or is equal to webBrowserPrint (which is buggy here)
                                    if (data.print_strategy) {
                                        if (data.print_strategy[obj.printer_context] || data.print_strategy['default']) {
                                            if (data.print_strategy[obj.printer_context]) {
                                                if (data.print_strategy[obj.printer_context] == 'webBrowserPrint') {
                                                    print_params.print_strategy = 'window.print';
                                                }
                                            } else {
                                                if (data.print_strategy['default'] == 'webBrowserPrint') {
                                                    print_params.print_strategy = 'window.print';
                                                }
                                            }
                                        } else {
                                            print_params.print_strategy = 'window.print';
                                        }
                                    } else {
                                        print_params.print_strategy = 'window.print';
                                    }
                                    p.NSPrint(content,false,print_params);
                                } catch(E) {
                                    alert('browser.js, cmd_print exception: ' + E);
                                }
                            }
                        ],
                        'cmd_forward' : [
                            ['command'],
                            function() {
                                try {
                                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                                    var n = obj.getWebNavigation();
                                    if (n.canGoForward) n.goForward();
                                } catch(E) {
                                    var err = 'cmd_forward: ' + E;
                                    obj.error.sdump('D_ERROR',err);
                                }
                            }
                        ],
                        'cmd_back' : [
                            ['command'],
                            function() {
                                try {
                                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                                    var n = obj.getWebNavigation();
                                    if (n.canGoBack) n.goBack();
                                } catch(E) {
                                    var err = 'cmd_back: ' + E;
                                    obj.error.sdump('D_ERROR',err);
                                }
                            }
                        ],
                        'cmd_reload' : [
                            ['command'],
                            function() {
                                try {
                                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                                    var n = obj.getWebNavigation();
                                    n.reload( Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE );
                                } catch(E) {
                                    var err = 'cmd_reload: ' + E;
                                    obj.error.sdump('D_ERROR',err);
                                }
                            }
                        ],
                        'cmd_find' : [
                            ['command'],
                            function() {
                                var text = window.prompt('Enter text to find:');
                                obj.find(text);
                            }
                        ]
                    }
                }
            );
            obj.controller.render();

            var browser_id = 'browser_browser'; if (obj.browser_id) browser_id = obj.browser_id;
            obj.controller.view.browser_browser = document.getElementById(browser_id);

            obj.buildProgressListener();
            /*
            dump('obj.controller.view.browser_browser.addProgressListener = ' 
                + obj.controller.view.browser_browser.addProgressListener + '\n');
            */
            obj.controller.view.browser_browser.addProgressListener(obj.progressListener,
                            Components.interfaces.nsIWebProgress.NOTIFY_ALL );

            obj.controller.view.browser_browser.setAttribute('src',obj.url);
            //dump('browser url = ' + obj.url + '\n');

            window.help_context_set_locally = true;

        } catch(E) {
            this.error.sdump('D_ERROR','util.browser.init: ' + E + '\n');
        }
    },

    'find' : function(text) {
        var obj = this;
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

            function getBrowser() {
                return obj.controller.view.browser_browser;
            }

            function getFocusedSelCtrl() {
                var ds = getBrowser().docShell;
                var dsEnum = ds.getDocShellEnumerator(Components.interfaces.nsIDocShellTreeItem.typeContent,
                                                    Components.interfaces.nsIDocShell.ENUMERATE_FORWARDS);
                while (dsEnum.hasMoreElements()) {
                    ds = dsEnum.getNext().QueryInterface(Components.interfaces.nsIDocShell);
                    if (ds.hasFocus) {
                        var display = ds.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsISelectionDisplay);
                        if (!display) return null;
                        return display.QueryInterface(Components.interfaces.nsISelectionController);
                    }
                }

                // One last try
                return getBrowser().docShell
                    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                    .getInterface(Components.interfaces.nsISelectionDisplay)
                    .QueryInterface(Components.interfaces.nsISelectionController);
            }

            function setSelection(range) {
                try {
                    var selctrlcomp = Components.interfaces.nsISelectionController;
                    var selctrl = getFocusedSelCtrl();
                    var sel = selctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
                    sel.removeAllRanges();
                    sel.addRange(range.cloneRange());

                    selctrl.scrollSelectionIntoView(selctrlcomp.SELECTION_NORMAL,
                        selctrlcomp.SELECTION_FOCUS_REGION,
                        true);
                } catch(e) {alert("setSelection: " + e);}
            }

            var doc = obj.get_content().document;
            var body = doc.body;
            var count = body.childNodes.length;
            var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance()
                .QueryInterface(Components.interfaces.nsIFind);
            var searchRange = doc.createRange();
            var startPt = doc.createRange();
            var endPt = doc.createRange();
                searchRange.setStart(body,0);
                searchRange.setEnd(body, count);
                startPt.setStart(body, 0);
                startPt.setEnd(body, 0);
                endPt.setStart(body, count);
                endPt.setEnd(body, count);
            var retRange = finder.Find(text, searchRange, startPt, endPt);
            dump('retRange = ' + retRange + '\n');
            setSelection(retRange);
        } catch(E) {
            alert('Error in browser.js, find(): ' + E);
        }
    },

    'get_content' : function() {
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            if (this.controller.view.browser_browser.contentWindow.wrappedJSObject) {
                return this.controller.view.browser_browser.contentWindow.wrappedJSObject;
            } else {
                return this.controller.view.browser_browser.contentWindow;
            }
        } catch(E) {
            this.error.sdump('D_ERROR','util.browser.get_content(): ' + E);
        }
    },

    'push_variables' : function() {
        try {
            var obj = this;
            var s = '';
            try { s += obj.url + '\n' + obj.get_content().location.href + '\n'; } catch(E) { s+=E + '\n'; }
            if (!obj.push_xulG) return;
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            var cw = this.get_content();
            cw.IAMXUL = true;
            cw.XUL_BUILD_ID = '/xul/rel_2_0_6/server/'.split(/\//)[2];
            cw.xulG = obj.passthru_content_params || {};
            if (!cw.xulG.set_tab) { cw.xulG.set_tab = function(a,b,c) { return window.xulG.set_tab(a,b,c); }; }
            if (!cw.xulG.new_tab) { cw.xulG.new_tab = function(a,b,c) { return window.xulG.new_tab(a,b,c); }; }
            if (!cw.xulG.new_patron_tab) { cw.xulG.new_patron_tab = function(a,b) { return window.xulG.new_patron_tab(a,b); }; }
            if (!cw.xulG.set_patron_tab) { cw.xulG.set_patron_tab = function(a,b) { return window.xulG.set_patron_tab(a,b); }; }
            if (!cw.xulG.volume_item_creator) { cw.xulG.volume_item_creator = function(a) { return window.xulG.volume_item_creator(a); }; }
            if (!cw.xulG.get_new_session) { cw.xulG.get_new_session = function(a) { return window.xulG.get_new_session(a); }; }
            if (!cw.xulG.holdings_maintenance_tab) { cw.xulG.holdings_maintenance_tab = function(a,b,c) { return window.xulG.holdings_maintenance_tab(a,b,c); }; }
            if (!cw.xulG.url_prefix) { cw.xulG.url_prefix = function(url) { return window.xulG.url_prefix(url); }; }
            if (!cw.xulG.urls) { cw.xulG.urls = window.urls; }
            try { s += ('******** cw = ' + cw + ' cw.xulG = ' + (cw.xulG) + '\n'); } catch(E) { s+=E + '\n'; }
            obj.error.sdump('D_BROWSER',s);
        } catch(E) {
            this.error.sdump('D_ERROR','util.browser.push_variables: ' + E + '\n');
        }
    },

    'getWebNavigation' : function() {
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            var wn = this.controller.view.browser_browser.webNavigation;
            var s = this.url + '\n' + this.get_content().location.href + '\n';
            s += ('getWebNavigation() = ' + wn + '\n');
            //this.error.sdump('D_BROWSER',s);
            return wn;
        } catch(E) {
            this.error.sdump('D_ERROR','util.browser.getWebNavigation(): ' + E );
        }
    },

    'updateNavButtons' : function() {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        var obj = this; 
        var s = obj.url + '\n' + obj.get_content().location.href + '\n';
        try {
            var n = obj.getWebNavigation();
            s += ('webNavigation = ' + n + '\n');
            s += ('webNavigation.canGoForward = ' + n.canGoForward + '\n');
            if (n.canGoForward) {
                if (typeof obj.controller.view.cmd_forward != 'undefined') {
                    obj.controller.view.cmd_forward.disabled = false;
                    obj.controller.view.cmd_forward.setAttribute('disabled','false');
                }
            } else {
                if (typeof obj.controller.view.cmd_forward != 'undefined') {
                    obj.controller.view.cmd_forward.disabled = true;
                    obj.controller.view.cmd_forward.setAttribute('disabled','true');
                }
            }
        } catch(E) {
            s += E + '\n';
        }
        try {
            var n = obj.getWebNavigation();
            s += ('webNavigation = ' + n + '\n');
            s += ('webNavigation.canGoBack = ' + n.canGoBack + '\n');
            if (n.canGoBack) {
                if (typeof obj.controller.view.cmd_back != 'undefined') {
                    obj.controller.view.cmd_back.disabled = false;
                    obj.controller.view.cmd_back.setAttribute('disabled','false');
                }
            } else {
                if (typeof obj.controller.view.cmd_back != 'undefined') {
                    obj.controller.view.cmd_back.disabled = true;
                    obj.controller.view.cmd_back.setAttribute('disabled','true');
                }
            }
        } catch(E) {
            s += E + '\n';
        }
        //this.error.sdump('D_BROWSER',s);

        // Let's also update @protocol, @hostname, @port, and @pathname on the <help> widget
        if (xulG.set_help_context) {
            try {
                var help_params = {
                    'protocol' : obj.get_content().location.protocol,
                    'hostname' : obj.get_content().location.hostname,
                    'port' : obj.get_content().location.port,
                    'pathname' : obj.get_content().location.pathname,
                    'src' : ''
                };
                xulG.set_help_context(help_params);
            } catch(E) {
                dump('Error in browser.js, setting location on help widget: ' + E);
            }
        } else {
            dump(location.href + ': browser.js, updateNavButtons, xulG = ' + xulG + ' xulG.set_help_context = ' + xulG.set_help_context + '\n');
        }
    },

    'buildProgressListener' : function() {

        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

            var obj = this;
            obj.progressListener = {
                onProgressChange    : function(){},
                onLocationChange    : function(){},
                onStatusChange        : function(){},
                onSecurityChange    : function(){},
                onStateChange         : function ( webProgress, request, stateFlags, status) {
                    try {
                        netscape.security.PrivilegeManager.enablePrivilege( "UniversalXPConnect" );
                        var s = obj.url + '\n' + obj.get_content().location.href + '\n';
                        const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
                        const nsIChannel = Components.interfaces.nsIChannel;
                        ////// handle the throbber
                        var throbber = xulG.page_meter;
                        if (throbber) {
                            var busy = false;
                            if (!(stateFlags & nsIWebProgressListener.STATE_RESTORING)) {
                                busy = true;
                                throbber.on();
                            }
                            if (stateFlags & nsIWebProgressListener.STATE_STOP) {
                                busy = false;
                                setTimeout(
                                    function() {
                                        if (!busy) { throbber.off(); }
                                    }, 2000
                                );
                            }
                        }
                        //////
                        if (stateFlags == 65540 || stateFlags == 65537 || stateFlags == 65552) { return; }
                        s += ('onStateChange: stateFlags = ' + stateFlags + ' status = ' + status + '\n');
                        if (stateFlags & nsIWebProgressListener.STATE_IS_REQUEST) {
                            s += ('\tSTATE_IS_REQUEST\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_IS_DOCUMENT) {
                            s += ('\tSTATE_IS_DOCUMENT\n');
                            if( stateFlags & nsIWebProgressListener.STATE_STOP ) {
                                obj.push_variables(); obj.updateNavButtons();
                                if (typeof obj.on_url_load == 'function') {
                                    try {
                                        obj.error.sdump('D_TRACE','calling on_url_load');
                                        var helpers = {
                                            'doc_write' : function(html) {
                                                netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                                                obj.get_content().document.write(html);
                                            },
                                            'doc_close' : function() {
                                                netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                                                obj.get_content().document.close();
                                            }
                                        }
                                        obj.on_url_load( obj.controller.view.browser_browser, obj, helpers );
                                    } catch(E) {
                                        obj.error.sdump('D_ERROR','on_url_load: ' + E );
                                    }
                                }
                                if (obj.debug_label) {
                                    try {
                                        document.getElementById(obj.debug_label).setAttribute('tooltiptext','url: ' + obj.get_content().location.href);
                                    } catch(E) {
                                        obj.error.sdump('D_ERROR','on_url_load, debug_label: ' + E );
                                    }
                                }
                            }
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
                            s += ('\tSTATE_IS_NETWORK\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_IS_WINDOW) {
                            s += ('\tSTATE_IS_WINDOW\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_START) {
                            s += ('\tSTATE_START\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_REDIRECTING) {
                            s += ('\tSTATE_REDIRECTING\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_TRANSFERING) {
                            s += ('\tSTATE_TRANSFERING\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_NEGOTIATING) {
                            s += ('\tSTATE_NEGOTIATING\n');
                        }
                        if (stateFlags & nsIWebProgressListener.STATE_STOP) {
                            s += ('\tSTATE_STOP\n');
                        }
                        //obj.error.sdump('D_BROWSER',s);    
                        if (throbber) { throbber.tooltip(s); }
                    } catch(E) {
                        obj.error.sdump('D_ERROR','util.browser.progresslistener.onstatechange: ' + (E));
                    }
                }
            }
            obj.progressListener.QueryInterface = function(){return this;};
        } catch(E) {
            this.error.sdump('D_ERROR','util.browser.buildProgressListener: ' + E + '\n');
        }
    }
}

dump('exiting util.browser.js\n');
