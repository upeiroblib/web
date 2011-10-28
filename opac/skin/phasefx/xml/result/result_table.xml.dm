<!-- Search results are spit into this table -->

<div id='result_table_div' xmlns:xi="http://www.w3.org/2001/XInclude">

    <table id='res_table'> 

        <!-- for some reason, this is the only way i can force the cell widths -->
        <thead id='result_thead'>
            <tr>
                <td class='result_table_pic_header'></td>
                <td> </td>
            </tr>
        </thead>

        <tbody id='result_table'>
            <tr>

                <td class='result_table_row'>
                    <!--#include virtual="result_info.xml"-->
                </td>
            </tr>

            <!-- Template for displaying a search result.  This row template is cloned and inserted
                    for each result returned -->

            <tr id='result_table_template' class='hide_me'>

                <!-- Jacket image goes here -->

                <td class='result_table_row' align='left'>
                    <table class='result_table_subtable'>
                        <tbody class='result_table_subtbody'>

                            <tr style='height: 1em' name='counts_row' valign="top">

                                <td  rowspan='4' class='result_table_pic_header'>
                                    <a><img name='item_jacket' class='result_table_pic'/></a>
                                </td>

                                <td class='result_table_title_cell' name='result_table_title_cell'>
                                    <!-- Title goes here -->
                                    <a title="&result.table.keyword;" name='item_title' class='search_link'> 
                                        <!-- Title goes here -->
                                    </a>
                                </td>

                                <!-- Copy this td for each copy count appended -->
                                <td  rowspan='4' nowrap='nowrap' name="copy_count_cell" class='copy_count_cell'> 
                                </td>

                            </tr>
        
                            <tr style='height: 1em' >
                                <td class='result_table_author_cell'>
                                    <a title="&result.table.author;" name='item_author' class='search_link'> 
                                        <!-- Author goes here -->
                                    </a>
                                    <div>
                                    <span name='result_table_extra_span' class='hide_me'>
                                        <span name='result_table_pub_box' style='padding-left: 10px;'> 
                                            <span name='result_table_edition_span' style='padding-left: 10px;'></span> |
                                            <span name='result_table_pub_span'> </span> |
                                            <span name='result_table_phys_span'> </span>
                                        </span>
                                    </span>
                                    </div>
                                </td>
                            </tr>

                            <tr style='height:1em;' >
                                <td name='result_table_format_cell' class='result_table_format_cell'>

                                    <a name='text_link' class='search_link'> 
                                        <img src='../../../../images/tor/text.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='sound recording-nonmusical_link' class='search_link'> 
                                        <img src='../../../../images/tor/sound recording-nonmusical.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='moving image_link' class='search_link'> 
                                        <img src='../../../../images/tor/moving image.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='software, multimedia_link' class='search_link'> 
                                        <img src='../../../../images/tor/software, multimedia.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='sound recording-musical_link' class='search_link'> 
                                        <img src='../../../../images/tor/sound recording-musical.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='cartographic_link' class='search_link'> 
                                        <img src='../../../../images/tor/cartographic.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='mixed material_link' class='search_link'> 
                                        <img src='../../../../images/tor/mixed material.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='notated music_link' class='search_link'> 
                                        <img src='../../../../images/tor/notated music.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='sound recording_link' class='search_link'> 
                                        <img src='../../../../images/tor/sound recording.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='still image_link' class='search_link'> 
                                        <img src='../../../../images/tor/still images.jpg' class='dim tor_pic' />
                                    </a>

                                    <a name='three dimensional object_link' class='search_link'> 
                                        <img src='../../../../images/tor/three dimensional object.jpg' class='dim tor_pic' />
                                    </a>

                                    <span class='hide_me' 
                                        style='color: #9999FF; padding-left: 10px; font-size: 7pt; font-weight: 300;'> 
                                        <span>&common.relevancy; </span><span name='relevancy_span'> </span>
                                    </span>

                                    <span class='hide_me' name='place_hold_span'>
                                        <a style='padding-left: 8px;' href='javascript:void(0);' 
                                            class='classic_link' name='place_hold_link'>&opac.holds.placeHold;</a>
                                    </span>

                                    <!-- Empty span used for creating unAPI links -->
                                    <abbr style='padding-left: 8px;' name="unapi" class="unapi-id">
                                        <!-- unAPI URI goes here -->
                                    </abbr>

                                    <!-- Empty span used for creating Google Book Search-->
                                    <span name="googleBooksLink" class="hide_me">
                                        <a style='padding-left: 8px;' class='classic_link' name="googleBooks-link">&result.googleBooks.browse;</a>
                                    </span>

                                </td>
                            </tr>
                            <tr name="local_callnumber_list" class="result_table_title_cell">
                                <td>
                                <span type='opac/slot-data+holdings_xml-full' query='volumes'>
                                <span class='hide_me' debug='true' type='opac/slot-format'><![CDATA[
                                    var output = dojo.create('span'); 

                                    var item_cnt = 0;
                                    var max_items = 4;

                                    dojo.query('volume', item).forEach(function(vol) {
                                        if (item_cnt >= max_items) {
                                            return output.innerHTML;
                                        }
                                        dojo.query('copy', vol).forEach(function (cp) {
                                            if (item_cnt >= max_items) {
                                                return;
                                            }
                                            if (cp.getAttribute('deleted') == 't') {
                                                return;
                                            }
                                            if (cp.getAttribute('opac_visible') == 'f') {
                                                return;
                                            }
                                            var cp_entry = dojo.create('div');
                                            var loc_visible;
                                            var vol_appended = false;
                                            dojo.query('location', cp).forEach(function (location) {
                                                loc_visible = location.getAttribute('opac_visible');
                                                if (loc_visible == 't') {
                                                    if (!vol_appended) {
                                                        var cn = dojo.create('span', { style: "font-weight: bold;" }, cp_entry);
                                                        var cn_txt = dojo.doc.createTextNode(vol.getAttribute('label'));
                                                        cn.appendChild(cn_txt);
                                                        vol_appended = true;
                                                    }
                                                    var loc = dojo.create('span', { "style": "font-weight: bold;"}, cp_entry);
                                                    var loc_txt = dojo.doc.createTextNode(' - ' + BT.textContent(location));
                                                    loc.appendChild(loc_txt);
                                                }
                                            });
                                            if (loc_visible != 't') {
                                                return;
                                            }
                                            dojo.query('circ_lib', cp).forEach(function (circ_lib) {
                                                var cp_lib = dojo.create('span', { "style": "font-weight: bold;" }, cp_entry, "first");
                                                var cp_lib_txt = dojo.doc.createTextNode(circ_lib.getAttribute('name') + ' - ');
                                                cp_lib.appendChild(cp_lib_txt);
                                            });
                                            dojo.query('status', cp).forEach(function (status) {
                                                var cp_status = dojo.create('span', { "style": "font-weight: bold;" }, cp_entry);
                                                var cp_status_txt = dojo.doc.createTextNode(' (' + BT.textContent(status) + ')');
                                                cp_status.appendChild(cp_status_txt);
                                            });

                                            item_cnt++;
                                            if (item_cnt >= max_items) {
                                                dojo.create('br', null, cp_entry);
                                                cp_entry.appendChild(dojo.doc.createTextNode(opac_strings.MORE_COPIES_FULL_RECORD));
                                            }
                                            output.appendChild(cp_entry);
                                        });
                                    });

                                return output.innerHTML;
                                ]]></span>
                                </span>
                                </td>
                            </tr>
                            <!-- Placeholder for ChiliFresh Review -->
                            <tr class="hide_me" name="chilifreshReview">
                                <td valign="top" colspan="2">
                                        <span name="chilifreshReviewLink" class="chili_review"></span>
                                        <div name="chilifreshReviewResult" style="display:none"></div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>


   <!-- ====================== -->
   <table style='width: 100%; margin-top: 12px;' id='result_info_2' class='hide_me'>
      <tbody>
               
          <tr class='color_4' style='height: 1em;'>
                     
             <td style='vertical-align: top;'  id='next_prev_links2'>
                        
                <span class='hide_me' id='result_info_div2' style='font-size: 9pt;'>
                   <span> &common.results; </span> 
                   <b id='offset_start2'> </b>
                   <span> - </span>
                   <b id='offset_end2'> </b>
                   <span> &common.ofAtLeast; </span>
                   <b id='result_count2'> </b>
                   <span style='padding-left: 6px;'> (page </span>
                   <span id='current_page2'> </span>
                   <span> &common.of; </span>
                   <span id='num_pages2'> </span>
                </span>
                           
                <span id='start_end_links_span2' class='hide_me' 
                   style='padding-left: 40px;' >
                <a class='search_page_nav_link' id='search_home_link2' 
                   title="&rdetail.page.results;">&rdetail.start;</a><a class='search_page_nav_link' 
                   id='prev_link2' title='&rdetail.page.previous;'>&rdetail.page.previous.short;</a>
            
                <span class='search_page_nav_link' id='page_numbers2'> </span>
                   <a  class='search_page_nav_link' id='next_link2' 
                      title='&rdetail.page.next;'>&rdetail.page.next.short;</a>
                      <!--
                      <a class='search_page_nav_link' 
                      id='end_link2' title="&rdetail.page.last;">&rdetail.end;</a>
                      -->
                </span>
                        
             </td>
                        
             <td  colspan='5' 
                style='padding-bottom: 4px; text-align:center; vertical-align: top; border-bottom: 1px solid #E0E0E0;'>
               <!--
                <span id='search_info_table2' style='font-size: 8pt;'>
                <b>Available copies / Total copies </b>
                </span>
               -->
             </td>
          </tr>
      </tbody>
   </table>
   <!-- ====================== -->


    <script language='javascript' type='text/javascript'>
        config.names.result.format_cell = 'result_table_format_cell';
        config.names.result.format_link = 'resource_link'
        config.names.result.format_pic = 'format_pic'
    </script>

    <!-- ChiliFresh setup -->
    <script language='javascript' type='text/javascript'>
        var chilifresh = '<!--#echo var="OILS_CHILIFRESH_ACCOUNT"-->';
        if (chilifresh=='(none)') { chilifresh = false; }
    </script>
    <!--if expr="${OILS_CHILIFRESH_ACCOUNT} && ${OILS_CHILIFRESH_ACCOUNT}!='(none)'"-->
        <input type="hidden" id="chilifresh_account" name="chilifresh_account"
            value="<!--#echo var='OILS_CHILIFRESH_ACCOUNT'-->" />
        <input type="hidden" id="chilifresh_profile" name="chilifresh_profile"
            value="<!--#echo var='OILS_CHILIFRESH_PROFILE'-->" />
        <input type="hidden" id="chilifresh_version" name="chilifresh_version" value="onsite_v1" />
        <input type="hidden" id="chilifresh_type" name="chilifresh_type" value="search" />
        <script language="javascript" type="text/javascript" src="<!--#echo var='OILS_CHILIFRESH_URL'-->"></script>
    <!--endif-->
</div>


