console.log("Sanity Check: JS is working!");

let sampleObj = {
	category: null,
	samples: [],
	clickCount: 0,
	current: '',
};

let synObj = {
	keyWord: '',
	syns: [''],
};

let newNote = {
	title: '',
	author: '',
	category: '',
	content: '',
	rating: 1,
};

$(document).ready(function(){
	// When user selects a category from dropdown:
	$('.chooseCategory').click(function(event){
		// reset clickCount if a new category is selected
		if (sampleObj.category !== $(this).data("category")) {
			console.log('NEW CATEGORY SELECTED!');
			sampleObj.category = $(this).data("category");
			// set choose button to text category HTML
			$('#chooseButton').text(($(this).text()));
			// ajax call to getNotesbyCategory
			console.log('calling ajax... ');
			$.ajax({
				method: 'GET',
				url: '/api/notes/' + sampleObj.category,
				success: getNotesByCategorySuccess,
				error: getNotesByCategoryError
			});			
		}
	});

	// viewSampleButton click
	// Currently only toggles the collapse
	$('#viewSampleButton').click(function() {
		console.log('viewSampleButton CLICKED!');
	});

	// NEXT SAMPLE BUTTON
	$('#nextSampleButton').click(function() {
		console.log('nextSampleButton clicked');
		// set current sample based on click count
		sampleObj.current = sampleObj.samples[sampleObj.clickCount];
		$('#sampleP').text(sampleObj.current.content);
		sampleObj.clickCount++;
		// if last sample is being viewed, reset click count.
		if (sampleObj.clickCount >= sampleObj.samples.length) { sampleObj.clickCount = 0;}
	});

	// INSERT SAMPLE BUTTON
	$('#insertSampleButton').click(function() {
		console.log('insertSampleButton clicked');
		console.log(sampleObj.current.content);
		// Get current text area string
		let currentString = $('#textarea').val();
		console.log(currentString);
		// Get current cursor position
		let pos =$('#textarea').getCursorPosition();
		let newString = 
				currentString.substr(0, pos)
			+ sampleObj.current.content
			+ currentString.substr(pos);
		console.log(newString);
		$('#textarea').val(newString);
	});

	// When the text area is clicked	
	$('#textareaDiv').click(function() {
		console.log('HELLO from textareaDiv!');
		// store the value of string in the text area
		let textareaString = $('#textarea').val();
		// Find cursor position is text area
		let pos =$('#textarea').getCursorPosition();

		let selectedWord = findWordAtPos(pos, textareaString);
		if (selectedWord.length === 0) {return console.log('no word selected');}
		$.ajax({
			method: 'GET',
			url: '/api/syn/' + selectedWord,
			success: synSuccess,
			error: synError
		});
	});

	//CONTRIBUTE BUTTON CLICK
	$('#contributeButton').click(function() {
		console.log('contributeButton click');
		// get current textarea string
		let textareaString = $('#textarea').val();
		$('#modalP').text(textareaString);
		newNote.content = textareaString;
	});

	// MODALDROP CLICK
	$('.modalDrop').click(function(event) {
		console.log('modalDrop Click!');
		newNote.category = $(this).data("category");
		$('#chooseButtonModal').text(($(this).text()));
	});

	//CONTRIBUTE BUTTON MODAL CLICK
	$('#contributeButtonModal').click(function() {
		console.log('contributeButtonModal Click!');
		console.log(newNote);
		$.ajax({
			method: 'POST',
			url: '/api/notes/',
			data: newNote,
			success: postNoteSuccess,
			error: postNoteError,
		});	
	});
});
// ^^ End of document.ready ^^

function findWordAtPos(pos, textareaString) {
	// set i to the cursor position
	let i = pos;
	// instantiate selectedWord
	let selectedWord = '';

	// keep moving "backwards" along the textString
	// until we reach whitespace, aka the start of the word.
	if (textareaString.charAt(i) === ' ') {i--;}
	while (textareaString.charAt(i) !== ' ' && i > -1) {
		i--;
	}
	console.log('while broken. i = ' + i);
	console.log('character at i: ' + textareaString.charAt(i));

	// move forward in textString, add each character to selectedWord
	// until we get to the end of the word.
	i++;
	while (textareaString.charAt(i) !== ' ' && i < textareaString.length) {
		//add each character to selectedWord
		selectedWord += textareaString.charAt(i);
		i++;
	}
	console.log('selectedWord: ' + selectedWord);
	synObj.keyWord = selectedWord;
	return selectedWord;
}

// When index comes back:
function getNotesByCategorySuccess(json) {
	console.log('insertSuccess json: ' + JSON.stringify(json));
	sampleObj.samples = json;
	sampleObj.current = sampleObj.samples[0];
	console.log('XXX' + sampleObj.current.author);
	$('#sampleP').text(sampleObj.current.content);
	$('#sampleS').text(sampleObj.current.author);
	// Successfully got new samples, set clickCount to 1 so the next sample viewed will be at index 1.
	sampleObj.clickCount = 1;	
}

function getNotesByCategoryError(e) {
	console.log('there was an error: e');
}

function synSuccess(json) {
	console.log('synSuccess.');
	// set the returned synonyms to synObj
	synObj.syns = json;
	// clear the old synonyms from the DOM
	$('.synList').remove();
	// clear the old synonyms from synListHTML
	let synListHTML = '';
	// set the top list item
	synListHTML = '<a id="synList" href="#" class="list-group-item active synList">' + synObj.keyWord + '</a>';
	// loop through synonyms and add to synListHTML,
	// we limit how many syns are added in the for loop
	for (let i = 0; i < 8 && i < synObj.syns.length ; i++) {
		synListHTML += '<a href="#" class="list-group-item synList synListItem">' + synObj.syns[i] + '</a>'
	}
	$('#synonymsDiv').append(synListHTML);

	//When the user clicks on a syn:
	$('.synListItem').click(function(event) {
		console.log('synListItem CLICKED');
		// grab the syn string value
		let syn = $(this).text();
		console.log('this.val' + syn);
		// grab the current textareaString
		let currentString = $('#textarea').val();
		console.log('textareaString: ' + currentString);
		// use regex to replace the keyWord with the selected syn
		// If there are multiple instances of a keyWord, all get replaced
		// even if the keyWord exists as part of another word (for example: is and this)
		// TODO: only replace selected keyWord
		let keyWordRegExp = new RegExp(synObj.keyWord, "g");
		currentString = currentString.replace(keyWordRegExp, syn);
		console.log('currentString: ' + currentString);
		// put new string in the textarea!
		$('#textarea').val(currentString);
		// hide the syns
		$('.synList').remove();
	});
}

function synError(e) {
	console.log('ERROR IN APP.JS !!' + JSON.stringify(e));
}

function postNoteSuccess() {
	console.log('postNoteSuccess.');
}

function postNoteError(e) {
	console.log('postNoteError');
}

// This function determines the cursor's position in the textfield
(function ($, undefined) {
	$.fn.getCursorPosition = function() {
	    var el = $(this).get(0);
	    var pos = 0;
	    if('selectionStart' in el) {
	        pos = el.selectionStart;
	    } else if('selection' in document) {
	      el.focus();
	      var Sel = document.selection.createRange();
	      var SelLength = document.selection.createRange().text.length;
	      Sel.moveStart('character', -el.value.length);
	      pos = Sel.text.length - SelLength;
	    }
	    return pos;
	};
})(jQuery);