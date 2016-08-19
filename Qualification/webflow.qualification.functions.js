//this method standardizes comment data being pulled from contentful
function StandardizeCommentData(allComments, searchResults){

	//loop over our search results and look for comments from the comment data
	$.each(searchResults, function(m, searchResult){
		searchResult.comments = [];
		
		var comments = $.grep(allComments.items, function(e){ return e.fields.productId === searchResult.productId; });
		
		if (comments.length > 0) {

			$.each(comments, function(index, comment) {
		
				$.each(comment.fields.recommendations, function(k, u) {
			   
				   var entries = $.grep(allComments.includes.Entry, function(e){ return e.sys.id === u.sys.id; });
		
					if (entries.length > 0) {
					
						$.each(entries, function(i, v) {
							var comment = {};
							comment.commentText = v.fields.comment;
							
							var staff = $.grep(allComments.includes.Entry, function(e){ return e.sys.id === v.fields.staff.sys.id; });

							if (staff.length > 0) {							
						
								$.each(staff, function(i, v) {
									comment.commenterName = v.fields.name;
									
									var staffPhotos = $.grep(allComments.includes.Asset, function(e){ return e.sys.id === v.fields.photo.sys.id; });

									if (staffPhotos.length > 0) {							
										//var photo_title = v.fields.title;
										comment.commenterImageUrl = staffPhotos[0].fields.file.url;
									}              
								});
							}							
							searchResult.comments.push(comment);
						});  
					
					}                  
				});
	  
			});
		}	

	});
	
	return searchResults;
}

function StandardizeResults(searchResults){
	var result = [];
	for (var i = 0; i < searchResults.length; i++){
		var obj = searchResults[i];
		
		obj.Parents.splice(0,1);
		obj.Parents.splice(obj.Parents.length - 1, 1);
		var arrNames = $.map(obj.Parents, function(c){return c.LocationName});
		
		result.push({
			'index':i+1,
			'name':obj.LocationName,
			'productId': obj.CatalogId.toString(),
			'url': 'http://www.rentvillas.com/PropertyDetail.aspx?Catalog=' + obj.CatalogId,
			'image': obj.PrimaryImage,
			'categories': arrNames,
			'categoriesAsAPath': arrNames.join('/'),
		});
	}
	return result;
}

/**
 * Call this function when a user clicks on a product link. This function uses the event
 * callback datalayer variable to handle navigation after the ecommerce data has been sent
 * to Google Analytics.
 * @param {Object} productObj An object representing a product.
 */
function pushClickToDataLayer(productObj) {
  window.dataLayer.push({
	'event': 'productClick',
	'ecommerce': {
	  'click': {
		'actionField': {'list': 'portal'},      // Optional list property.
		'products': [{
			  'name': productObj.name,                      // Name or ID is required.
			  'id': productObj.productId,
			  //'price': productObj.price,
			  //'brand': productObj.brand,
			  //'variant': productObj.variant,
			  'position': productObj.position,
			  'category' : productObj.categories,
			  'list' : 'portal',
		 }]
	   }
	 }/* ,
	 'eventCallback': function() {
	   document.location = productObj.url // removed callback since we aren't navigating away
	 } */
  });
}

//builds array of ecommerice impression objects
function pushImpressionsToDataLayer(listingJson){
	var impressions  = [];          
	jQuery.each(listingJson, function (i, item) {
		var lnum = i+1;
		impressions.push(getEcommerceImpressionForItem(item, i, lnum));
	});

	window.dataLayer.push({
	  'event': 'productImpression',
	  'ecommerce': {
		'impressions': impressions
	  }
	});
	
	return impressions;        
}

function getHtmlForListings(listingJson, allcomments){
	var output = '';          
	jQuery.each(listingJson, function (i, v) {
		output += getHtmlForListing(v,i);
	});
	
	pushImpressionsToDataLayer(listingJson);
	
	return output;        
} 

function getGridColumn(){
	var grid_column = 3;            
	var mq7 = window.matchMedia("(max-width: 700px)");
	var mq9 = window.matchMedia("(max-width: 900px)");

	if(mq7.matches){
		grid_column = 1;
	}else if(mq9.matches){
		grid_column = 2;
	}                  
	return grid_column;          
} 

function gridifyColumn(obj){
	var gcol = getGridColumn();
	 gcol = parseInt(gcol);
  
	jQuery(obj).pinterest_grid({
	  no_columns: gcol,
	  padding_x: 10,
	  padding_y: 10,
	  margin_bottom: 20,
	  single_column_breakpoint: 700
	});      
}

function showSignupform(){
  var s = DB.getItem('signed_up');
  if(!s){
	  jQuery('.signup-section').fadeIn('slow'); 
	  window.dataLayer.push({
			'event' : 'GAEvent',
			'eventCategory' : 'sign-up form',
			'eventAction' : 'viewed',
			'eventLabel' : window.location.href,
			'eventValue' : undefined,
			'eventNonInteractionHit' : true
		});
  } 
} 

//utility methods
function concatValues(param,value,type){
	var outp = ''; 
	if(getParam(param)){
	  var parval = getParam(param);
	  if((type == 'int' && parseInt(parval)> 0) || (type == 'string' && $.trim(parval) !='')){
		  outp += value;
	  }			  
	}	
	return outp;		  
}
  
function cleanStr(str){
	str = $.trim(str);
	//str = str.replace(/(^,)|(,$)/g, "");
	return str;		  
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getAllMonths(start, end) {
	var s = moment(start);
	var e = moment(end);
	var a = [];

	while(s < e) {
		a.push(s.clone());
		s.add(1,'M');
	}

	return a;
}

//our app constructor
function Qualification(){
	(window.onpopstate = function () {
		var match,
			pl     = /@@@/g,  // Regex for replacing addition symbol with a space, you could replace @@@ with a + to remove those from values
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query  = window.location.search.substring(1);

		this.UrlParams = {};
		while (match = search.exec(query))
		   this.UrlParams[decode(match[1])] = decode(match[2]);
	})();
	
		//polyfill json support used in parsing to and from storage
	if(!(window.JSON && window.JSON.parse))
	{
		(function() {
		  function g(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
		  else if("function"==b&&"undefined"==typeof a.call)return"object";return b};function h(a){a=""+a;if(/^\s*$/.test(a)?0:/^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g,"@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g,"")))try{return eval("("+a+")")}catch(b){}throw Error("Invalid JSON string: "+a);}function i(a,b){var c=[];j(new k(b),a,c);return c.join("")}function k(a){this.a=a}
		  function j(a,b,c){switch(typeof b){case "string":l(b,c);break;case "number":c.push(isFinite(b)&&!isNaN(b)?b:"null");break;case "boolean":c.push(b);break;case "undefined":c.push("null");break;case "object":if(null==b){c.push("null");break}if("array"==g(b)){var f=b.length;c.push("[");for(var d="",e=0;e<f;e++)c.push(d),d=b[e],j(a,a.a?a.a.call(b,""+e,d):d,c),d=",";c.push("]");break}c.push("{");f="";for(e in b)Object.prototype.hasOwnProperty.call(b,e)&&(d=b[e],"function"!=typeof d&&(c.push(f),l(e,c),c.push(":"),
			j(a,a.a?a.a.call(b,e,d):d,c),f=","));c.push("}");break;case "function":break;default:throw Error("Unknown type: "+typeof b);}}var m={'"':'\\"',"\\":"\\\\","/":"\\/","\u0008":"\\b","\u000c":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\x0B":"\\u000b"},n=/\uffff/.test("\uffff")?/[\\\"\x00-\x1f\x7f-\uffff]/g:/[\\\"\x00-\x1f\x7f-\xff]/g;
		  function l(a,b){b.push('"',a.replace(n,function(a){if(a in m)return m[a];var b=a.charCodeAt(0),d="\\u";16>b?d+="000":256>b?d+="00":4096>b&&(d+="0");return m[a]=d+b.toString(16)}),'"')};window.JSON||(window.JSON={});"function"!==typeof window.JSON.stringify&&(window.JSON.stringify=i);"function"!==typeof window.JSON.parse&&(window.JSON.parse=h);
		})();
	}	
	
	//override webflows resize function
	var Webflow = Webflow || [];
	Webflow.push(function () {
		
		Webflow.resize.on(function () {   
			if($('#recommend-list').length > 0){
			 gridifyColumn($('#recommend-list'));
			}
		});

	});  
	
	Qualification.SetupStorage();
}

Qualification.SetupStorage = function(){
	Qualification.DB;
	try {
		var x = 'test_localstorage_available_' + Date.now();
		localStorage.setItem(x, x);
		var y = localStorage.getItem(x);
		localStorage.removeItem(x);
		if (x !== y) {throw new Error();}
		Qualification.DB = localStorage;
	}
	catch(e) {
		Qualification.DB = new MemoryStorage('qualification');
	}
}

function getParam(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


function setHeight() {
	var vph = $(window).height();
	vph =  vph - 35; 
	var windowHeight = vph + 'px';
	$('#hero-banner-section').css('height', windowHeight);
	$('.share-recomm.dialog').css('height', windowHeight);
	if(Webflow.isMobile()){
	   $('.signup.dialog').css('height', windowHeight);
	}
};

// Single Page Form: Populate single page forms drop downs
  
function populate_who_is_travelling($){
 var who_is_travelling = 
   [
	 {text:"Group with children", val:"1"},
	 {text:"Group of adults", val:"2"},
	 {text:"Just two of us", val:"3"}
   ];      
  
  var sobj = $('#who_is_travelling');
  $(sobj).empty();
  $(sobj).append($('<option>').text("Please choose...").attr('value', ''));
  $.each(who_is_travelling, function(i, obj){
	$(sobj).append($('<option>').text(obj.text).attr('value', obj.val));
  });        
  
}

function populate_when_do_you_plan_to_travel($){
	var today = new Date();
	var start = new Date(today.getFullYear(), today.getMonth(), 1);
	var x = 36;
	var end = new Date();
	end.setMonth(start.getMonth() + x);
	var result = getAllMonths(start, end);

	var sobj = $("#when_do_you_plan_to_travel");
	$(sobj).empty();
	$(sobj).append($('<option>').text("Please choose...").attr('value', ''));

	$.each(result, function(i, obj) {
	sobj.append($("<option />").val(moment(obj).format('MM/DD/YYYY')).html(moment(obj).format('MMM YYYY')));
	});      
}

function populate_what_is_your_max_weekly_budget($){
	var s = 1000;
	var e = 10000;
	var prices = [];
	while (s < e) {
	 prices.push(s);
	  s = s + 1000;
	}

	s = 10000;
	e = 20000;
	while (s < e) {
	prices.push(s);
	s = s + 2000;
	}
	prices.push(25000);
	prices.push(35000);
	prices.push(60000);
	prices.push(80000);

	var sobj = $("#what_is_your_max_weekly_budget");
	$(sobj).empty();
	$(sobj).append($('<option>').text("Please choose...").attr('value', 0));	
	  
	$.each(prices, function(i, val) { 
	  sobj.append($("<option />").val(val).html('$' + numberWithCommas(val)));
	});		  

}    


function populate_how_many_people_are_traveling($){
   
	  var s = 1;
	  var e = 18;
	  var a = [];
	  while (s < e) {
		 a.push(s);
		  s++;
	  }

	  s = 20;
	  e = 32;
	  while (s < e) {
		a.push(s);
		s = s + 2;
	  }  

	  var sobj = $("#how_many_people_are_traveling");
	  $(sobj).empty();
	  $(sobj).append($('<option>').text("Please choose...").attr('value', 0)); 

	  $.each(a, function(i, val) { 
		  sobj.append($("<option />").val(val).html(val));
	  });   
   
}    

function populate_how_long_will_you_stay($){

	var numdays = 
	   [
		 {text:"less than a week", val:"1"},
		 {text:"1 week", val:"7"},
		 {text:"2 weeks", val:"14"},
		 {text:"3 weeks", val:"21"},
		 {text:"1 month or more", val:"30"},
	   ];
   
	var sobj = $("#how_long_will_you_stay");
	$(sobj).empty();
	$(sobj).append($('<option>').text("Please choose...").attr('value', 0)); 
	$.each(numdays, function(i, val) { 
	  sobj.append($("<option />").val(val.val).html(val.text));
	});
}  

function populate_form_fields($){
	populate_who_is_travelling($);
	populate_when_do_you_plan_to_travel($);
	populate_what_is_your_max_weekly_budget($);   
	populate_how_many_people_are_traveling($);
	populate_how_long_will_you_stay($);
}

//
function getEcommerceImpressionForItem(item, i, lnum){
	
	return {
		  'id' : item.productId,
		  'name' : item.name,
		  'category' : item.categories.join('/'),
		  'list' : 'portal',
		//'variant' : 'a variant to track',
		  'position' : lnum,
	};
}



function getHtmlForListing(item,i){
	// Grab the template script
	var theTemplateScript = $("#listing-template").html();

	// Compile the template
	var theTemplate = Handlebars.compile(theTemplateScript);

	// Pass our data to the template and return html
	return theTemplate(item);
}


function getCommentJson(searchResults){
	var accessToken = '5c2dd986b12e51e663a6c2750a63cf6f6ce6128098a9bd3e721ad6239e6267d0';
	
	//get list of ids for which to get comments
	var product_ids = '';
	$.each(searchResults,function(i,v){
	  product_ids += ',' + v.productId;
	});   
	product_ids = product_ids.replace(/(^,)|(,$)/g, "");
	
	var retdata = false;		
	$.ajax({
		url: 'https://cdn.contentful.com/spaces/y315od15q5s0/entries',
		async: false,
		data: {
			access_token : accessToken,
			content_type : 'product',
			include : 5,
			'fields.productId[in]' : product_ids            
		},
		error: function() {
			return false;
		},
		dataType: 'json',
		success: function(rdata) {              
		  retdata = StandardizeCommentData(rdata, searchResults);                    
		},
			type: 'GET'
		});	
	  
		return retdata;
}