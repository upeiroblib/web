/**
 *  Functions to export records in Evergreen to RefWorks.
 */
 
function exportToRefWorks( ) {

  refWorksItem = buildRefWorksItem();
  
 createForm( refWorksItem );

  document.getElementById( 'ExportRWForm' ).submit();
}

function rdetailShowRefworks( ) {

  if ( document.getElementById('ExportRWForm') != null ) {
    return;
  }
  
  refWorksItem = buildRefWorksItem();

  rwForm = createForm( refWorksItem );
  
  
  
  $('rdetail_refworks_div').appendChild( rwForm );

  document.getElementById("ImportData").focus();
  document.getElementById("ImportData").select();
}

function build_godot_url() {

  if ( MARCRequest.responseXML == null ) {
    return null;
  }

  SN = getText( G.ui.rdetail.isbn );
  ISSN = '';
  if ( SN == null || SN == '' ) {
    ISSN = getMarcDataField( '022' );
    if ( ISSN.length > 0 ) {
      ISSN = getMarcSubField( ISSN[0], 'a' );
    }
    
    ISSN = getText(ISSN[0]);
  }

  pubField = getMarcDataField( '260' );
  pubPlace = getMarcSubField( pubField[0], 'a' );
  pubPlaceStr = getText( pubPlace[0] );

  if ( pubPlaceStr != null && pubPlaceStr != '' && pubPlaceStr.indexOf( ' :') > 0 ) {
    // Hack off the ":" at the end of our pub place data.
    pubPlaceStr = pubPlaceStr.substr( 0, pubPlaceStr.indexOf( ' :' ) );
  }
  
  var urlFieldStr = '';
  urlField = getMarcDataField( '856' );
  if ( urlField.length > 0 ) {
    urlField = getMarcSubField( urlField[0], 'u' );
    urlFieldStr = getText( urlField[0] );
  }

  notesStr = '';
  notesField = getMarcDataField( '245' );
  if ( notesField.length > 0 ) {
    notesData = getMarcSubField( notesField[0], 'c' );
    notesStr = getText( notesData[0] );
  }
  var godot_url = 'http://articles.library.upei.ca/GODOT/rw_export.cgi?state=import&id=evergreen&proxy=http%3A%2F%2Frlproxy.upei.ca%2Flogin%3Furl%3D&DBASE=unknown&REQTYPE=BOOK&PUBTYPE=&'
  						 + 'TITLE=' + escape( getText( G.ui.rdetail.title ) )
  						 + '&ARTTIT=&SERIES=&AUT=' + escape( getText( G.ui.rdetail.author ) )
  						 + '&ARTAUT=&PUB=' + escape( getText( G.ui.rdetail.publisher ) )
  						 + '&PUB_PLACE=' + escape( pubPlaceStr)
  						 + '&ISSN=' + escape( ISSN )
  						 + '&ISBN=' + escape( SN )
  						 + '&VOLISS=&VOL=&ISS=&PGS=&YEAR=' + escape( getText( G.ui.rdetail.pubdate ) )
  						 + '&MONTH=&YYYYMMDD=&EDITION=&THESIS_TYPE=&FTREC=&URL=' + escape( urlFieldStr )
  						 + '&NOTE=' + escape(notesStr)
  						 + '&REPNO=&SYSID=&ERIC_NO=&ERIC_AV=&ERIC_FT_AV=&MLOG_NO=&UMI_DISS_NO=&CALL_NO=&DOI=&PMID=&BIBCODE=&OAI=';
  
                         

  return godot_url;                   
}


/**
 *  Generate a Refworks Tagged Format string from the current item record.
 */
function buildRefWorksItem( ) {

  if ( MARCRequest.responseXML == null ) {
    return null;
  }

  SN = getText( G.ui.rdetail.isbn );
  
  if ( SN == null || SN == '' ) {
    ISSN = getMarcDataField( '022' );
    if ( ISSN.length > 0 ) {
      ISSN = getMarcSubField( ISSN[0], 'a' );
    }
    
    SN = getText(ISSN[0]);
  }

  pubField = getMarcDataField( '260' );
  pubPlace = getMarcSubField( pubField[0], 'a' );
  pubPlaceStr = getText( pubPlace[0] );

  if ( pubPlaceStr != null && pubPlaceStr != '' && pubPlaceStr.indexOf( ' :') > 0 ) {
    // Hack off the ":" at the end of our pub place data.
    pubPlaceStr = pubPlaceStr.substr( 0, pubPlaceStr.indexOf( ' :' ) );
  }
  notesStr = '';
  notesField = getMarcDataField( '245' );
  if ( notesField.length > 0 ) {
    notesData = getMarcSubField( notesField[0], 'c' );
    notesStr = getText( notesData[0] );
  }
  var refWorksTaggedItem = 'SN '
                         + SN + '\n'
                         + 'A1 '
                         + getText( G.ui.rdetail.author ) + '\n'
                         + 'T1 '
                         + getText( G.ui.rdetail.title ) + '\n'
                         + 'ED '
                         + getText( G.ui.rdetail.edition ) + '\n'
                         + 'YR '
                         + getText( G.ui.rdetail.pubdate ) + '\n'
                         + 'PB '
                         + getText( G.ui.rdetail.publisher ) + '\n'
                         + 'PP '
                         + pubPlaceStr + '\n'
                         + 'AB '
                         + getText( G.ui.rdetail.abstr ) + '\n'
                         + 'N1 '
                         + notesStr + '\n';
                         

  return refWorksTaggedItem;                   
}

/**
 *  Create a form to submit the item to RefWorks
 */
function createForm( refWorksItem ) {

  rwForm = document.createElement('form');
  
  rwForm.id = 'ExportRWForm';
  rwForm.name = 'ExportRWForm';
  rwForm.method = 'post';
  rwForm.action = 'http://www.refworks.com.rlproxy.upei.ca/refworks/autologin.asp?vendor=RefWorks&filter=RefWorks%20Tagged%20Format&encoding=65001';
  rwForm.target = 'RefWorksMain';
  
  formText = document.createElement( 'textarea' );
  formText.name = 'ImportData';
  formText.id = 'ImportData';
  formText.value = refWorksItem;
  formText.cols = 60;
  formText.rows = 15;
  rwForm.appendChild( formText );

/*  
  submitButton = document.createElement( 'input' );
  submitButton.type = 'submit';
  submitButton.name = 'Submit';
  submitButton.value = 'Export to Refworks';
  rwForm.appendChild( submitButton );
*/
/*  copyButton = document.createElement( 'input' );
  copyButton.type = 'button';
  copyButton.value = 'Select and Copy the above text';
  copyButton.setAttribute( 'onClick', 'document.getElementById("ImportData").focus(); document.getElementById("ImportData").select();');
  rwForm.appendChild( copyButton );
*/
  explanationP = document.createElement( 'p' );
  setText(explanationP, 'Instructions');
  rwForm.appendChild( explanationP );
  
  explanationL = document.createElement( 'ol' );
  explanationL.name = 'instructionslist';
  explanationL.id = 'instructionslist';

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'The text in the box above should be selected for you. Press ' + (isMac ? '⌘' : 'Ctrl') +'-c to copy that text into your clipboard');
  explanationL.appendChild( explanationStep );
  
  explanationStep = document.createElement( 'li' );
  explanationA = document.createElement( 'a' );
  explanationA.href = 'http://rlproxy.upei.ca/login?url=http://refworks.scholarsportal.info/Refworks/login.asp?WNCLang=false';
  explanationA.setAttribute( 'style', 'text-decoration:underline' );
  explanationA.setAttribute( 'target', 'RefWorksMain' );
  setText( explanationA, 'Open Refworks'); 
  explanationStep.appendChild( explanationA );
  
  explanationSpan = document.createElement( 'span' );
  setText( explanationSpan, '. For help with RefWorks see ');
  explanationStep.appendChild( explanationSpan );
  
  explanationA = document.createElement( 'a' );
  explanationA.href = 'http://library.upei.ca/refworks';
  explanationA.setAttribute( 'style', 'text-decoration:underline' );
  explanationA.setAttribute( 'target', 'roblib' );
  setText( explanationA, 'library.upei.ca/refworks' );
  explanationStep.appendChild( explanationA );
  explanationL.appendChild( explanationStep );

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'Use the RefWorks "References" menu to select "Import."' );
  explanationL.appendChild( explanationStep );

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'Set the "Import Filter/Data Source" pulldown to "RefWorks Tagged Format"' );
  explanationL.appendChild( explanationStep );

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'Set the "Database" pulldown to "Tagged Format"' );
  explanationL.appendChild( explanationStep );

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'Use ' + (isMac ? '⌘' : 'Ctrl') + '-v to paste the contents of the above box to the RefWorks box labelled "Import Data from the following Text"' );
  explanationL.appendChild( explanationStep );

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'Click the "Import" button' );
  explanationL.appendChild( explanationStep );

  explanationStep = document.createElement( 'li' );
  setText( explanationStep, 'Be sure to check the author/editor list in the imported RefWorks record to ensure compliance with your citation rules' );
  explanationL.appendChild( explanationStep );

  rwForm.appendChild( explanationL );

  return rwForm;
}