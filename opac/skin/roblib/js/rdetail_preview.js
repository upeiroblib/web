/**
 *  Functions to enable Google books previews on Evergreen item pages.
 */
 
 
function rdetailCheckForPreview() {
  
  var p = document.createElement('p');
  p.appendChild( document.createTextNode('Loading... ' ) );
  p.id = 'loading';
  $('rdetail_excerpt_div').appendChild(p);
  searchForPreview( getText( $('rdetail_isbn' ) ) );
}
 
/**
 *
 * @param {DOM object} query The form element containing the
 *                     input parameters "isbns"
 */
function searchForPreview( isbn ) {

  // Delete any previous Google Booksearch JSON queries.
  var jsonScript = document.getElementById("jsonScript");
  if (jsonScript) {
    jsonScript.parentNode.removeChild(jsonScript);
  }
  // Add a script element with the src as the user's Google Booksearch query. 
  // JSON output is specified by including the alt=json-in-script argument
  // and the callback funtion is also specified as a URI argument.
  var scriptElement = document.createElement("script");

  scriptElement.setAttribute("id", "jsonScript");
  scriptElement.setAttribute("src",
      "http://books.google.com/books?bibkeys=" + 
      cleanISBN( isbn ) + "&jscmd=viewapi&callback=previewCallback");
  scriptElement.setAttribute("type", "text/javascript");
  // make the request to Google booksearch
  document.documentElement.firstChild.appendChild(scriptElement);
}

/**
 * This function is the call-back function for the JSON scripts which 
 * executes a Google book search response.
 *
 * @param {JSON} booksInfo is the JSON object pulled from the Google books service.
 */
function previewCallback(bookInfo) {
  // Clear any old data to prepare to display the Loading... message.
  var div = document.getElementById("rdetail_excerpt_div");
  var book;
  
  for ( i in bookInfo ) {
    book = bookInfo[i];
  }
//  if (div.firstChild) { 
//    div.removeChild(div.firstChild);    

//  }
 
  if ( !book ) {
    return;
  }

  if ( book.preview != "noview" ) {
    if ( book.preview == 'full' ) {
      setText( $('rdetail_excerpt_link_a'), 'Full Text' );
      $('rdetail_excerpt_link_a').title = 'See the full text of this book.';      
    }

    // Add a button below the book cover image to load the preview.
    badge = document.createElement( 'img' );
    badge.src = 'http://books.google.com/intl/en/googlebooks/images/gbs_preview_button1.gif';
    badge.title = 'Show a preview of this book from Google Book Search';
    badge.style.border = 0;
    badgelink = document.createElement( 'a' );
    badgelink.href = 'javascript:rdetailShowExtra("excerpt");';
    badgelink.appendChild( badge );
    $('rdetail_image_cell').appendChild( badgelink );

	
    
    unHideMe( $('rdetail_excerpt_link' ) );
    $('rdetail_excerpt_div').style.height = 600;
  }

//  document.getElementById('rdetail_excerpt_div').appendChild(mainDiv);

}

/**
 *  This is called when the user clicks on the 'Excerpt' link.  We assume
 *  a preview is available from google is this link was made visible.
 *  The google viewer API should have been loaded in page_rdetail.xml
 */
function rdetailDisplayPreview() {
  previewPane = $('rdetail_excerpt_div');
  if ( $('rdetail_excerpt_div').getAttribute('loaded') == null ||  $('rdetail_excerpt_div').getAttribute('loaded') == "false" ) {
    google.load("books", "0", {"callback" : rdetailVIewerLoadCallback} );
//  google.setOnLoadCallback( rdetailVIewerLoadCallback );
    $('rdetail_excerpt_div').setAttribute('loaded', 'true');
  }
}

function rdetailVIewerLoadCallback() {

  var viewer = new google.books.DefaultViewer(document.getElementById('rdetail_excerpt_div'));
  viewer.load('ISBN:' + trimStr( getText( $('rdetail_isbn' ) ) ) );

}


























