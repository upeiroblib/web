dump('entering cat/util.js\n');

function $(id) { return document.getElementById(id); }

if (typeof cat == 'undefined') var cat = {};
cat.util = {};

cat.util.EXPORT_OK    = [ 
    'spawn_copy_editor', 'add_copies_to_bucket', 'show_in_opac', 'spawn_spine_editor', 'transfer_copies', 
    'transfer_title_holds', 'mark_item_missing', 'mark_item_damaged', 'replace_barcode', 'fast_item_add', 
    'make_bookable', 'edit_new_brsrc', 'edit_new_bresv', 'batch_edit_volumes', 'render_fine_level',
    'render_loan_duration', 'mark_item_as_missing_pieces'
];
cat.util.EXPORT_TAGS    = { ':all' : cat.util.EXPORT_OK };

cat.util.replace_barcode = function(old_bc) {
    try {
        JSAN.use('util.network');
        var network = new util.network();

        if (!old_bc) old_bc = window.prompt($("catStrings").getString('staff.cat.util.replace_barcode.old_bc_window_prompt.prompt'),
            '',
            $("catStrings").getString('staff.cat.util.replace_barcode.old_bc_window_prompt.title'));
        if (!old_bc) return;

        var copy;
        try {
            copy = network.simple_request('FM_ACP_RETRIEVE_VIA_BARCODE',[ old_bc ]);
            if (typeof copy.ilsevent != 'undefined') throw(copy); 
            if (!copy) throw(copy);
        } catch(E) {
            alert($("catStrings").getFormattedString('staff.cat.util.replace_barcode.error_alert', [old_bc]) + '\n');
            return old_bc;
        }
    
        // Why did I want to do this twice?  Because this copy is more fleshed?
        try {
            copy = network.simple_request('FM_ACP_RETRIEVE',[ copy.id() ]);
            if (typeof copy.ilsevent != 'undefined') throw(copy);
            if (!copy) throw(copy);
        } catch(E) {
            try {
                alert($("catStrings").getFormattedString('staff.cat.util.replace_barcode.error_alert', [old_bc]) +
                     '\n' + (typeof E.ilsevent == 'undefined' ? '' : E.textcode + ' : ' + E.desc));
            } catch(F) {
                alert(E + '\n' + F);
            }
            return old_bc;
        }
    
        var new_bc = window.prompt($("catStrings").getString('staff.cat.util.replace_barcode.new_bc_window_prompt.prompt'),
            '',
            $("catStrings").getString('staff.cat.util.replace_barcode.new_bc_window_prompt.title'));
        new_bc = String( new_bc ).replace(/\s/g,'');
        /* Casting a possibly null input value to a String turns it into "null" */
        if (!new_bc || new_bc == 'null') {
            alert($("catStrings").getString('staff.cat.util.replace_barcode.new_bc.failed'));
            return old_bc;
        }
    
        var test = network.simple_request('FM_ACP_RETRIEVE_VIA_BARCODE',[ new_bc ]);
        if (typeof test.ilsevent == 'undefined') {
            alert('Rename aborted.  Another copy has barcode "' + new_bc + '".');
            return old_bc;
        } else {
            if (test.ilsevent != 1502 /* ASSET_COPY_NOT_FOUND */) {
                obj.error.standard_unexpected_error_alert($("catStrings").getFormattedString('staff.cat.util.replace_barcode.testing_error', [new_bc]), test);
                return old_bc;
            }    
        }

        copy.barcode(new_bc); copy.ischanged('1');
        var r = network.simple_request('FM_ACP_FLESHED_BATCH_UPDATE', [ ses(), [ copy ] ]);
        if (typeof r.ilsevent != 'undefined') { 
            if (r.ilsevent != 0) {
                if (r.ilsevent == 5000 /* PERM_FAILURE */) {
                    alert($("catStrings").getString('staff.cat.util.replace_barcode.insufficient_permission_for_rename'));
                    return old_bc;
                } else {
                    obj.error.standard_unexpected_error_alert($("catStrings").getString('staff.cat.util.replace_barcode.item_rename_error'),r);
                    return old_bc;
                }
            }
        }

        return new_bc;
    } catch(E) {
        JSAN.use('util.error'); var error = new util.error();
        error.standard_unexpected_error_alert($("catStrings").getString('staff.cat.util.replace_barcode.rename_error'),E);
        return old_bc;
    }
}

cat.util.transfer_title_holds = function(old_targets) {
    JSAN.use('OpenILS.data'); var data = new OpenILS.data();
    JSAN.use('util.network'); var network = new util.network();
    try {
        data.stash_retrieve();
        var target = data.marked_record_for_hold_transfer;
        if (!target) {
            var m = $("catStrings").getString('staff.cat.opac.title_for_hold_transfer.destination_needed.label');
            alert(m);
            return;
        }
        var robj = network.simple_request('TRANSFER_TITLE_HOLDS',[ ses(), target, old_targets ]);
        if (robj == 1) {
            var m = $("catStrings").getString('staff.cat.opac.title_for_hold_transfer.success.label');
            alert(m);
        } else {
            var m = $("catStrings").getString('staff.cat.opac.title_for_hold_transfer.failure.label');
            alert(m);
        }
    } catch(E) {
        alert('Error in cat.util.transfer_title.holds(): ' + E);
    }
}

cat.util.transfer_copies = function(params) {
    JSAN.use('util.error'); var error = new util.error();
    JSAN.use('OpenILS.data'); var data = new OpenILS.data();
    JSAN.use('util.network'); var network = new util.network();
    try {
        data.stash_retrieve();
        if (!data.marked_volume) {
            alert($("catStrings").getString('staff.cat.util.transfer_copies.unmarked_volume_alert'));
            return;
        }
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect UniversalBrowserWrite');
        var xml = '<vbox xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" flex="1" style="overflow: auto">';
        if (!params.message) {
            params.message = $("catStrings").getFormattedString('staff.cat.util.transfer_copies.params_message', [data.hash.aou[ params.owning_lib ].shortname(), params.volume_label]);
            //params.message = 'Transfer items from their original volumes to ';
            //params.message += data.hash.aou[ params.owning_lib ].shortname() + "'s volume labelled ";
            //params.message += '"' + params.volume_label + '" on the following record (and change their circ libs to match)?';
        }

        xml += '<description>' + params.message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</description>';
        xml += '<hbox><button label="' + $("catStrings").getString('staff.cat.util.transfer_copies.transfer.label')+ '" name="fancy_submit"/>';
        xml += '<button label="' + $("catStrings").getString('staff.cat.util.transfer_copies.cancel.label');
        xml += '" accesskey="'+ $("catStrings").getString('staff.cat.util.transfer_copies.cancel.accesskey') +'" name="fancy_cancel"/></hbox>';
        xml += '<iframe style="overflow: scroll" flex="1" src="' + urls.XUL_BIB_BRIEF + '?docid=' + params.docid + '"/>';
        xml += '</vbox>';
        //data.temp_transfer = xml; data.stash('temp_transfer');
        JSAN.use('util.window'); var win = new util.window();
        var fancy_prompt_data = win.open(
            urls.XUL_FANCY_PROMPT,
            //+ '?xml_in_stash=temp_transfer'
            //+ '&title=' + window.escape('Item Transfer'),
            'fancy_prompt', 'chrome,resizable,modal,width=500,height=300',
            { 'xml' : xml, 'title' : $("catStrings").getString('staff.cat.util.transfer_copies.window_title') }
        );
        if (fancy_prompt_data.fancy_status == 'incomplete') { alert($("catStrings").getString('staff.cat.util.transfer_copies.aborted_transfer')); return; }

        JSAN.use('util.functional');

        var copies = network.simple_request('FM_ACP_FLESHED_BATCH_RETRIEVE.authoritative', [ params.copy_ids ]);

        for (var i = 0; i < copies.length; i++) {
            copies[i].call_number( data.marked_volume );
            copies[i].circ_lib( params.owning_lib );
            copies[i].ischanged( 1 );
        }

        var robj = network.simple_request(
            'FM_ACP_FLESHED_BATCH_UPDATE', 
            [ ses(), copies, true ], 
            null,
            {
                'title' : $("catStrings").getString('staff.cat.util.transfer_copies.override_transfer_failure'),
                'overridable_events' : [
                    1208 /* TITLE_LAST_COPY */,
                    1227 /* COPY_DELETE_WARNING */,
                ]
            }
        );
        
        if (typeof robj.ilsevent != 'undefined') {
            throw(robj);
        } else {
            alert($("catStrings").getString('staff.cat.util.transfer_copies.successful_transfer'));
        }

    } catch(E) {
        error.standard_unexpected_error_alert($("catStrings").getString('staff.cat.util.transfer_copies.transfer_error'),E);
    }
}

cat.util.spawn_spine_editor = function(selection_list) {
    JSAN.use('util.error'); var error = new util.error();
    try {
        JSAN.use('util.functional');
        xulG.new_tab(
            xulG.url_prefix( urls.XUL_SPINE_LABEL ),
            { 'tab_name' : $("catStrings").getString('staff.cat.util.spine_editor.tab_name') },
            {
                'barcodes' : util.functional.map_list( selection_list, function(o){return o.barcode;}) 
            }
        );
    } catch(E) {
        error.standard_unexpected_error_alert($("catStrings").getString('staff.cat.util.spine_editor.spine_editor_error'),E);
    }
}

cat.util.show_in_opac = function(selection_list) {
    JSAN.use('util.error'); var error = new util.error();
    JSAN.use('util.network'); var network = new util.network();
    var doc_id; var seen = {};
    try {
        for (var i = 0; i < selection_list.length; i++) {
            doc_id = selection_list[i].doc_id;
            if (!doc_id) {
                var barcode = selection_list[i].barcode;
                doc_id = network.simple_request('FM_BRE_ID_VIA_BARCODE',[barcode]);
                if (typeof doc_id.ilsevent != 'undefined' || doc_id == -1) {
                    alert($("catStrings").getFormattedString('staff.cat.util.show_in_opac.unknown_barcode', [barcode]));
                    continue;
                }
            }
            if (doc_id == -1 ) {
                continue; /* pre-cat */
            }
            if (typeof seen[doc_id] != 'undefined') {
                continue;
            }
            seen[doc_id] = true;
            var opac_url = xulG.url_prefix( urls.opac_rdetail ) + '?r=' + doc_id;
            var content_params = { 
                'session' : ses(),
                'authtime' : ses('authtime'),
                'opac_url' : opac_url,
            };
            xulG.new_tab(
                xulG.url_prefix(urls.XUL_OPAC_WRAPPER), 
                {'tab_name':'Retrieving title...'}, 
                content_params
            );
        }
    } catch(E) {
        error.standard_unexpected_error_alert($("catStrings").getFormattedString('staff.cat.util.show_in_opac.catalog_error_for_doc_id', [doc_id]),E);
    }
}

cat.util.add_copies_to_bucket = function(selection_list) {
    JSAN.use('util.functional');
    JSAN.use('util.window'); var win = new util.window();
    JSAN.use('OpenILS.data'); var data = new OpenILS.data(); data.init({'via':'stash'});
    data.cb_temp_copy_ids = js2JSON(
        util.functional.map_list(
            selection_list,
            function (o) {
                if (typeof o.copy_id != 'undefined' && o.copy_id != null) {
                    return o.copy_id;
                } else {
                    return o;
                }
            }
        )
    );
    data.stash('cb_temp_copy_ids');
    win.open( 
        xulG.url_prefix(urls.XUL_COPY_BUCKETS_QUICK),
        'sel_bucket_win' + win.window_name_increment(),
        'chrome,resizable,center'
    );
}

cat.util.add_titles_to_bucket = function(record_ids) {
    JSAN.use('util.window'); var win = new util.window();
    win.open(
        xulG.url_prefix(urls.XUL_RECORD_BUCKETS_QUICK),
        'sel_bucket_win' + win.window_name_increment(),
        'chrome,resizable,modal,center',
        {
            record_ids: record_ids 
        }
    );
}

cat.util.spawn_copy_editor = function(params) {
    try {
        if (!params.copy_ids && !params.copies) return;
        if (params.copy_ids && params.copy_ids.length == 0) return;
        if (params.copies && params.copies.length == 0) return;
        if (params.copy_ids) params.copy_ids = js2JSON(params.copy_ids); // legacy
        if (!params.caller_handles_update) params.handle_update = 1; // legacy

        var obj = {};
        JSAN.use('util.network'); obj.network = new util.network();
        JSAN.use('util.error'); obj.error = new util.error();
    
        var title = '';
        if (params.copy_ids && params.copy_ids.length > 1 && params.edit == 1)
            title = $("catStrings").getString('staff.cat.util.copy_editor.batch_edit');
        else if(params.copies && params.copies.length > 1 && params.edit == 1)
            title = $("catStrings").getString('staff.cat.util.copy_editor.batch_view');
        else if(params.copy_ids && params.copy_ids.length == 1)
            title = $("catStrings").getString('staff.cat.util.copy_editor.edit');
        else
            title = $("catStrings").getString('staff.cat.util.copy_editor.view');

        JSAN.use('util.window'); var win = new util.window();
        var my_xulG = win.open(
            (urls.XUL_COPY_EDITOR),
            title,
            'chrome,modal,resizable',
            params
        );
        if (!my_xulG.copies && params.edit) {
        } else {
            return my_xulG.copies;
        }
        return [];
    } catch(E) {
        JSAN.use('util.error'); var error = new util.error();
        error.standard_unexpected_error_alert('error in cat.util.spawn_copy_editor',E);
    }
}

cat.util.mark_item_damaged = function(copy_ids) {
    var error;
    try {
        JSAN.use('util.error'); error = new util.error();
        JSAN.use('util.functional'); JSAN.use('util.date');
        JSAN.use('util.network'); var network = new util.network();
        if (!copy_ids) { return; }
        copy_ids = util.functional.filter_list( copy_ids, function(o) { return o != null; } );
        if (copy_ids.length < 1) { return; }
        var copies = network.simple_request('FM_ACP_FLESHED_BATCH_RETRIEVE.authoritative', [ copy_ids ]);
        if (typeof copies.ilsevent != 'undefined') throw(copies);
        var magic_status = false;
        for (var i = 0; i < copies.length; i++) {
            var status = copies[i].status(); if (typeof status == 'object') status = status.id();
            if (typeof my_constants.magical_statuses[ status ] != 'undefined') 
                if (my_constants.magical_statuses[ status ].block_mark_item_damaged) magic_status = true;
        }
        if (magic_status) {
        
            error.yns_alert($("catStrings").getString('staff.cat.util.mark_item_damaged.af_message'),
                $("catStrings").getString('staff.cat.util.mark_item_damaged.af_title'),
                $("catStrings").getString('staff.cat.util.mark_item_damaged.af_ok_label'), null, null,
                $("catStrings").getString('staff.cat.util.mark_item_damaged.af_confirm_action'));

        } else {

            var r = error.yns_alert($("catStrings").getFormattedString('staff.cat.util.mark_item_damaged.md_message', [util.functional.map_list( copies, function(o) { return o.barcode(); } ).join(", ")]),
                $("catStrings").getString('staff.cat.util.mark_item_damaged.md_title'),
                $("catStrings").getString('staff.cat.util.mark_item_damaged.md_ok_label'),
                $("catStrings").getString('staff.cat.util.mark_item_damaged.md_cancel_label'), null,
                $("catStrings").getString('staff.cat.util.mark_item_damaged.md_confirm_action'));

            if (r == 0) {
                var count = 0;
                for (var i = 0; i < copies.length; i++) {
                    try {

                        var my_circ = network.simple_request('FM_CIRC_RETRIEVE_VIA_COPY',[ses(),copies[i].id(),1]);
                        if (typeof my_circ.ilsevent == 'undefined') { 
                            JSAN.use('OpenILS.data'); var data = new OpenILS.data(); data.stash_retrieve();
                            my_circ = my_circ[0];
                            if (typeof my_circ != 'undefined') {
                                if (! my_circ.checkin_time() ) {
                                    var due_date = my_circ.due_date() ? util.date.formatted_date( my_circ.due_date(), '%F' ) : null;
                                    var auto_checkin = String( data.hash.aous['circ.auto_checkin_on_mark_damage'] ) == 'true';
                                    /* short-circuit this behavior.  We don't want to mark an item damaged and still have it circulating.  At least for now.  Wait until someone asks for it. */
                                    auto_checkin = true; 
                                    JSAN.use('patron.util');
                                    var patron_obj = patron.util.retrieve_fleshed_au_via_id( ses(), my_circ.usr() );
                                    var patron_name = patron.util.format_name( patron_obj ) + ' : ' + patron_obj.card().barcode();
                                    var msg = $("catStrings").getFormattedString('staff.cat.util.mark_item_damaged.item_circulating_to_patron', [ 
                                        copies[i].barcode(),
                                        patron_name,
                                        util.date.formatted_date( my_circ.due_date(), '%{localized}' )]);
                                    JSAN.use('util.date'); var today = util.date.formatted_date(new Date(),'%F');
                                    var r2 = auto_checkin ? 1 : error.yns_alert(
                                        msg,
                                        document.getElementById('catStrings').getString('staff.cat.util.mark_item_damaged.checkin.title'),
                                        document.getElementById('catStrings').getString('staff.cat.util.mark_item_damaged.checkin.no_checkin'),
                                        document.getElementById('catStrings').getString('staff.cat.util.mark_item_damaged.checkin.normal_checkin'),
                                        due_date ? (today > due_date ? document.getElementById('catStrings').getString('staff.cat.util.mark_item_damaged.checkin.forgiving_checkin') : null) : null,
                                        document.getElementById('catStrings').getString('staff.cat.util.mark_item_damaged.checkin.confirm_action')
                                    );
                                    JSAN.use('circ.util');
                                    switch(r2) {
                                        case 1:
                                            circ.util.checkin_via_barcode( ses(), { 'barcode' : copies[i].barcode(), 'noop' : 1 } );
                                        break;
                                        case 2:
                                            circ.util.checkin_via_barcode( ses(), { 'barcode' : copies[i].barcode(), 'noop' : 1 }, due_date );
                                        break;
                                    }
                                }
                            }
                        }

                        var robj = network.simple_request('MARK_ITEM_DAMAGED',[ses(),copies[i].id()]);
                        if (typeof robj.ilsevent != 'undefined') {
                            switch(robj.textcode) {
                                case 'DAMAGE_CHARGE' :
                                    var params = {};
                                    JSAN.use('util.money');
                                    var circ_obj = robj.payload.circ;
                                    var patron_obj = circ_obj.usr();
                                    JSAN.use('patron.util'); 
                                    var patron_name = patron.util.format_name( patron_obj ) + ' : ' + patron_obj.card().barcode(); 
                                    var r1 = error.yns_alert( 
                                        $("catStrings").getFormattedString('staff.cat.util.mark_item_damaged.charge_patron_prompt.message', [  
                                            copies[i].barcode(),  
                                            patron_name,  
                                            util.date.formatted_date( circ_obj.checkin_time(), '%{localized}' ),
                                            util.money.sanitize(robj.payload.charge) ]), 
                                        $("catStrings").getString('staff.cat.util.mark_item_damaged.charge_patron_prompt.title'), 
                                        $("catStrings").getString('staff.cat.util.mark_item_damaged.charge_patron_prompt.ok_label'), 
                                        $("catStrings").getString('staff.cat.util.mark_item_damaged.charge_patron_prompt.change_amount_label'), 
                                        $("catStrings").getString('staff.cat.util.mark_item_damaged.charge_patron_prompt.cancel_label'), 
                                        $("catStrings").getString('staff.cat.util.mark_item_damaged.charge_patron_prompt.confirm_action')); 
                                    if (r1 == 0) {
                                        params.apply_fines = 'apply';
                                    } else if (r1 == 1) { 
                                        JSAN.use('util.window'); var win = new util.window();
                                        var my_xulG = win.open(
                                            urls.XUL_PATRON_BILL_WIZARD,
                                            'billwizard',
                                            'chrome,resizable,modal',
                                            { 
                                                'patron' : patron_obj, 
                                                'patron_id' : patron_obj.id(), 
                                                'circ' : circ_obj, 
                                                'xact_id' : circ_obj.id(), 
                                                'do_not_process_bill' : true,
                                                /* 'override_default_billing_type' : 7, FIXME: maybe reintroduce this with an org setting for the specific btype? */
                                                'override_default_price' : util.money.sanitize( robj.payload.charge ) 
                                            }
                                        );

                                        params.apply_fines = my_xulG.proceed ? 'apply' : 'noapply';
                                        if (my_xulG.proceed) {
                                            params.override_amount = my_xulG.amount;
                                            params.override_btype = my_xulG.cbt_id;
                                            params.override_note = my_xulG.note;
                                        }
                                    } else {
                                        params.apply_fines = 'noapply';
                                    }
                                    robj = network.simple_request('MARK_ITEM_DAMAGED',[ ses(), copies[i].id(), params ]);
                                    if (typeof robj.ilsevent != 'undefined') { throw(robj); }
                                    break;
                                default: throw(robj);
                            }
                        }
                        count++;
                    } catch(E) {
                        error.standard_unexpected_error_alert($("catStrings").getFormattedString('staff.cat.util.mark_item_damaged.marking_error', [copies[i].barcode()]),E);
                    }
                }
                alert(count == 1 ? $("catStrings").getString('staff.cat.util.mark_item_damaged.one_item_damaged') :
                    $("catStrings").getFormattedString('staff.cat.util.mark_item_damaged.multiple_item_damaged', [count]));
            }
        }

    } catch(E) {
        if (error) error.standard_unexpected_error_alert('cat.util.mark_item_damaged',E); else alert('FIXME: ' + E);
    }
}

cat.util.mark_item_missing = function(copy_ids) {
    var error;
    try {
        JSAN.use('util.error'); error = new util.error();
        JSAN.use('util.functional');
        JSAN.use('util.network'); var network = new util.network();
        if (!copy_ids) { return; }
        copy_ids = util.functional.filter_list( copy_ids, function(o) { return o != null; } );
        if (copy_ids.length < 1) { return; }
        var copies = network.simple_request('FM_ACP_FLESHED_BATCH_RETRIEVE.authoritative', [ copy_ids ]);
        if (typeof copies.ilsevent != 'undefined') throw(copies);
        var magic_status = false;
        for (var i = 0; i < copies.length; i++) {
            var status = copies[i].status(); if (typeof status == 'object') status = status.id();
            if (typeof my_constants.magical_statuses[ status ] != 'undefined') 
                if (my_constants.magical_statuses[ status ].block_mark_item_action) magic_status = true;
        }
        if (magic_status) {
        
            error.yns_alert($("catStrings").getString('staff.cat.util.mark_item_missing.af_message'),
                $("catStrings").getString('staff.cat.util.mark_item_missing.af_title'),
                $("catStrings").getString('staff.cat.util.mark_item_missing.af_ok_label'), null, null,
                $("catStrings").getString('staff.cat.util.mark_item_missing.af_confirm_action'));

        } else {

            var r = error.yns_alert($("catStrings").getFormattedString('staff.cat.util.mark_item_missing.ms_message', [util.functional.map_list( copies, function(o) { return o.barcode(); } ).join(", ")]),
                $("catStrings").getString('staff.cat.util.mark_item_missing.ms_title'),
                $("catStrings").getString('staff.cat.util.mark_item_missing.ms_ok_label'),
                $("catStrings").getString('staff.cat.util.mark_item_missing.ms_cancel_label'), null,
                $("catStrings").getString('staff.cat.util.mark_item_missing.ms_confirm_action'));

            if (r == 0) {
                var count = 0;
                for (var i = 0; i < copies.length; i++) {
                    try {
                        var robj = network.simple_request('MARK_ITEM_MISSING',[ses(),copies[i].id()]);
                        if (typeof robj.ilsevent != 'undefined') throw(robj);
                        count++;
                    } catch(E) {
                        error.standard_unexpected_error_alert($("catStrings").getFormattedString('staff.cat.util.mark_item_missing.marking_error', [copies[i].barcode()]),E);
                    }
                }
                alert(count == 1 ? $("catStrings").getString('staff.cat.util.mark_item_missing.one_item_missing') :
                    $("catStrings").getFormattedString('staff.cat.util.mark_item_missing.multiple_item_missing', [count]));
            }
        }

    } catch(E) {
        if (error) error.standard_unexpected_error_alert('cat.util.mark_item_missing',E); else alert('FIXME: ' + E);
    }
}

cat.util.fast_item_add = function(doc_id,cn_label,cp_barcode) {
    var error;
    try {

        JSAN.use('util.error'); error = new util.error();
        JSAN.use('util.network'); var network = new util.network();

        var acn_id = network.simple_request(
            'FM_ACN_FIND_OR_CREATE',
            [ ses(), cn_label, doc_id, ses('ws_ou') ]
        );

        if (typeof acn_id.ilsevent != 'undefined') {
            error.standard_unexpected_error_alert($("catStrings").getFormattedString('staff.cat.volume_copy_creator.stash_and_close.problem_with_volume', [cn]), acn_id);
            return;
        }

        var copy_obj = new acp();
        copy_obj.id( -1 );
        copy_obj.isnew('1');
        copy_obj.barcode( cp_barcode );
        copy_obj.call_number( acn_id );
        copy_obj.circ_lib( ses('ws_ou') );
        /* FIXME -- use constants */
        copy_obj.deposit(0);
        copy_obj.price(0);
        copy_obj.deposit_amount(0);
        copy_obj.fine_level(2); // Normal
        copy_obj.loan_duration(2); // Normal
        copy_obj.location(1); // Stacks
        copy_obj.status(0); // Available
        copy_obj.circulate(get_db_true());
        copy_obj.holdable(get_db_true());
        copy_obj.opac_visible(get_db_true());
        copy_obj.ref(get_db_false());

        JSAN.use('util.window'); var win = new util.window();
        JSAN.use('cat.util');
        return cat.util.spawn_copy_editor( { 'handle_update' : 1, 'edit' : 1, 'docid' : doc_id, 'copies' : [ copy_obj ] });

    } catch(E) {
        if (error) error.standard_unexpected_error_alert('cat.util.fast_item_add',E); else alert('FIXME: ' + E);
    }
}

cat.util.make_bookable = function(copy_ids) {
    if (!copy_ids) { return; }
    copy_ids = util.functional.filter_list( copy_ids, function(o) { return o != null; } );
    if (copy_ids.length < 1) { return; }
    var results = fieldmapper.standardRequest(
        ["open-ils.booking", "open-ils.booking.resources.create_from_copies"],
        [ses(), copy_ids]
    );
    if (results == null) {
        alert(document.getElementById("catStrings").getString(
            "staff.cat.copy_browser.make_bookable.create_failed_silent"
        ));
    }
    else if (typeof results.ilsevent != "undefined") {
        alert(document.getElementById("catStrings").getFormattedString(
            "staff.cat.copy_browser.make_bookable.create_failed",
            [results.ilsevent, results.textcode, results.desc, results.debug]
        ));
    }
    return results;
}

cat.util.edit_new_brsrc = function(brsrc_list) {
    /* Spawn new tab to allow editing new resources. */
    try {
        xulG.resultant_brsrc = brsrc_list.map(function(o) { return o[0]; });
        xulG.new_tab(
            urls.XUL_BROWSER + "?url=" + window.escape(
                xulG.url_prefix("/eg/conify/global/booking/resource")
            ), {
                "tab_name": offlineStrings.getString(
                    "menu.cmd_booking_resource.tab"
                 ),
                "browser" : true
            }, {
                "no_xulG": false,
                "show_print_button": false,
                "show_nav_buttons": true,
                "passthru_content_params": xulG
            }
        );
    } catch(E) {
        alert(
            document.getElementById("catStrings").getFormattedString(
                "staff.cat.copy_browser.make_bookable.newtab_failed"
            ), E
        );
    }
}

cat.util.edit_new_bresv = function(booking_results) {
    /* Spawn new tab to allow editing new reservations. */
    try {
        if (xulG.auth == undefined) {
            xulG.auth = {"session": {"key": ses()}};
        }
        xulG.bresv_interface_opts = {"booking_results": booking_results};
        xulG.new_tab(
            xulG.url_prefix("/eg/booking/reservation"),
            {
                "tab_name": offlineStrings.getString(
                    "menu.cmd_booking_reservation.tab"
                 ),
                "browser" : false
            }, xulG
        );
    } catch(E) {
        alert(
            document.getElementById("catStrings").getString(
                "staff.cat.copy_browser.make_bookable.newtab_failed"
            ) + E
        );
    }
}

cat.util.batch_edit_volumes = function(fleshed_volumes) {
    try {
        if (!fleshed_volumes || fleshed_volumes.length < 1) { return false; }

        JSAN.use('util.functional');
        JSAN.use('util.network'); var net = new util.network();
        JSAN.use('util.window'); var win = new util.window();

        var can_edit = net.simple_request(
            'PERM_MULTI_ORG_CHECK',
            [
                ses(),
                ses('staff_id'),
                util.functional.map_list(
                    fleshed_volumes,
                    function(v) {
                        return v.owning_lib();
                    }
                ),
                ['UPDATE_VOLUME']
            ]
        );
        if (!can_edit) {
            alert(document.getElementById('catStrings').getString('staff.cat.edit_volume.permission_error'));
            return false;
        }
        var title;
        if (fleshed_volumes.length == 1) {
            title = document.getElementById('catStrings').getString('staff.cat.edit_volume.title');
        } else {
            title = document.getElementById('catStrings').getString('staff.cat.edit_volume.title.plural');
        }

        function clone_list(o) {
            var list = JSON2js( js2JSON( o ) );
            // now that it is safe to clear copies, let's do so, otherwise may get an error from volume edit method
            for (var i = 0; i < list.length; i++) { list[i].copies( [] ); } 
            return list;
        }

        var my_xulG = win.open(
            xulG.url_prefix(urls.XUL_VOLUME_EDITOR),
            title,
            'chrome,modal,resizable',
            { 'volumes' : clone_list( fleshed_volumes ) }
        );

        if (typeof my_xulG.update_these_volumes == 'undefined') { return false; }

        var volumes = util.functional.filter_list(
            my_xulG.volumes,
            function(v) {
                return get_bool( v.ischanged() );
            }
        );

        if (volumes.length < 1) { return false; }

        var r = net.simple_request(
            'FM_ACN_TREE_UPDATE',
            [ ses(), volumes, false, { 'auto_merge_vols' : my_xulG.auto_merge } ],
            null,
            {
                'title' : document.getElementById('catStrings').getString('staff.cat.edit_volumes.override.confirm'),
                'overridable_events' : [
                    1705 /* VOLUME_LABEL_EXISTS */
                ],
                'text' : {
                    '1705' : function(r) {
                        var payload_acn = util.functional.find_id_object_in_list( volumes, r.payload );
                        return document.getElementById('catStrings').getFormattedString('staff.cat.edit_volumes.label_exists.details',[payload_acn.label()]);
                    }
                }
            }
        );
        if (!r) { throw('Update method returned null or false.'); }
        if (typeof r.ilsevent != 'undefined') {
            if (r.ilsevent == 1705 /* VOLUME_LABEL_EXISTS */) {
               /* not overriden, but otherwise handled, so ignore */
                return false;
            } else {
                throw(r);
            }
        }

        return true;

    } catch(E) {
        alert('Error in cat.util.batch_edit_volumes: ' + E);
        return false;
    }
}

cat.util.render_fine_level = function(value) {
    var text;
    switch(Number(value)){
        case 1: text = document.getElementById("catStrings").getString("staff.cat.copy_editor.field.fine_level.low"); break;
        case 2: text = document.getElementById("catStrings").getString("staff.cat.copy_editor.field.fine_level.normal"); break;
        case 3: text = document.getElementById("catStrings").getString("staff.cat.copy_editor.field.fine_level.high"); break; 
    }
    return text;
}
cat.util.render_loan_duration = function(value) {
    var text;
    switch(Number(value)){
        case 1: text = document.getElementById("catStrings").getString("staff.cat.copy_editor.field.loan_duration.short"); break;
        case 2: text = document.getElementById("catStrings").getString("staff.cat.copy_editor.field.loan_duration.normal"); break;
        case 3: text = document.getElementById("catStrings").getString("staff.cat.copy_editor.field.loan_duration.extended"); break;
    }
    return text;
}

cat.util.mark_item_as_missing_pieces = function(copy_ids) {
    var error;
    try {
        JSAN.use('util.error'); error = new util.error();
        JSAN.use('util.functional'); JSAN.use('util.date');
        JSAN.use('util.network'); var network = new util.network();
        JSAN.use('util.print'); var print = new util.print();
        JSAN.use('util.window'); var win = new util.window();
        if (!copy_ids) { return; }
        copy_ids = util.functional.filter_list( copy_ids, function(o) { return o != null; } );
        if (copy_ids.length < 1) { return; }
        var copies = network.simple_request('FM_ACP_FLESHED_BATCH_RETRIEVE.authoritative', [ copy_ids ]);
        if (typeof copies.ilsevent != 'undefined') throw(copies);

        var r = error.yns_alert($("catStrings").getFormattedString('staff.cat.util.mark_item_missing_pieces.ms_message', [util.functional.map_list( copies, function(o) { return o.barcode(); } ).join(", ")]),
            $("catStrings").getString('staff.cat.util.mark_item_missing_pieces.ms_title'),
            $("catStrings").getString('staff.cat.util.mark_item_missing_pieces.ms_ok_label'),
            $("catStrings").getString('staff.cat.util.mark_item_missing_pieces.ms_cancel_label'), null,
            $("catStrings").getString('staff.cat.util.mark_item_missing_pieces.ms_confirm_action'));

        if (r == 0) {
            var count = 0;
            JSAN.use('cat.util');
            for (var i = 0; i < copies.length; i++) {
                try {
                    var robj = network.simple_request('MARK_ITEM_MISSING_PIECES',[ses(),copies[i].id()]);
                    if (typeof robj.ilsevent != 'undefined') {
                        if (robj.ilsevent == 0 /* SUCCESS */) {
                            count++;
                            // Print Slip
                            if (robj.payload && robj.payload.slip) {
                                print.simple( robj.payload.slip.template_output().data() );
                            }
                            // Item Note
                            cat.util.spawn_copy_editor( { 'copy_ids' : [ copies[i].id() ], 'edit' : 1 } );
                            // Patron Message
                            var my_xulG = win.open(
                                urls.XUL_NEW_STANDING_PENALTY,
                                'new_standing_penalty',
                                'chrome,resizable,modal',
                                {}
                            );
                            if (my_xulG.id) {
                                var penalty = new ausp();
                                penalty.usr( robj.payload.circ.usr() );
                                penalty.isnew( 1 );
                                penalty.standing_penalty( my_xulG.id );
                                penalty.org_unit( ses('ws_ou') );
                                penalty.note( my_xulG.note );
                                network.simple_request(
                                    'FM_AUSP_APPLY',
                                    [ ses(), penalty ]
                                );
                            }
                            // Patron Letter

                            var txt_file = new util.file('letter.txt');
                            txt_file.write_content('truncate',robj.payload.letter.template_output().data());
                            var text_path = '"' + txt_file._file.path + '"';
                            txt_file.close();

                            var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces['nsIPrefBranch']);
                            var key = 'oils.text_editor.external.cmd';
                            var has_key = prefs.prefHasUserValue(key);
                            var oils_external_letter_opener_cmd = has_key ? prefs.getCharPref(key) : 'C:\\Windows\\notepad.exe %letter.txt%';

                            var cmd = oils_external_letter_opener_cmd.replace('%letter.txt%',text_path);

                            var file = new util.file('letter.bat');
                            file.write_content('truncate+exec',cmd);
                            file.close();
                            file = new util.file('letter.bat');

                            dump('letter exec: ' + cmd + '\n');
                            var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
                            process.init(file._file);

                            var args = [];

                            dump('process.run = ' + process.run(false, args, args.length) + '\n');

                            file.close();

                        } else if (robj.ilsevent == 1500 /* ACTION_CIRCULATION_NOT_FOUND */) {
                            alert( $("catStrings").getFormattedString('staff.cat.util.mark_item_missing_pieces.circ_not_found',[ copies[i].barcode() ]) );
                        } else {
                            throw(robj);
                        }
                    } else {
                        throw(robj);
                    }
                } catch(E) {
                    error.standard_unexpected_error_alert($("catStrings").getFormattedString('staff.cat.util.mark_item_missing_pieces.marking_error', [copies[i].barcode()]),E);
                }
            }
            /*alert(count == 1 ? $("catStrings").getString('staff.cat.util.mark_item_missing_pieces.one_item_missing_pieces') :
                $("catStrings").getFormattedString('staff.cat.util.mark_item_missing_pieces.multiple_item_missing_pieces', [count]));*/
        }

        return true;
    } catch(E) {
        alert('Error in cat.util.mark_item_as_missing_pieces: ' + E);
        return false;
    }
}

dump('exiting cat/util.js\n');
