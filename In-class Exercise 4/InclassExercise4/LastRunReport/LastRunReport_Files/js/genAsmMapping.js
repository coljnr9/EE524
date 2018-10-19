function loadGenAsmViewReport(reportItem, execution, onTheFlyMode){
	
	//appendLoadingMessage(document.body);
	
	//create clViewerDiv docked to the left:
	var clViewer = document.createElement('div');
	clViewer.className = 'srcCodeView';
	clViewer.style.height = 'calc(100% - 0px)';
	clViewer.style.width = '50%';
	clViewer.style.position = 'absolute';
	clViewer.style.top = '0px';
	clViewer.style.left = '0px';
	$(reportItem).append(clViewer);
	
	
	//create asm viewer docked to the right:
	var asmViewer = document.createElement('div');
	asmViewer.className = 'srcCodeView';
	asmViewer.style.height = 'calc(100% - 0px)';
	asmViewer.style.width = '50%';
	asmViewer.style.position = 'absolute';
	asmViewer.style.top = '0px';
	asmViewer.style.right = '0px';
	$(reportItem).append(asmViewer);
	
	
	//add a draggable seperator / resizer control in the middle:
	var divider = document.createElement('div');
	divider.style.height = '100%';
	divider.style.width = '10px';
	divider.style.position = 'absolute';
	divider.style.zIndex = '9999999999';
	divider.style.top = '0px';
	divider.style.left = 'calc(50% - 5px)';
	divider.style.cursor = 'e-resize';
	$('body').append(divider);
	
	//make it draggable:
	$(divider).draggable({
		containment: document.body,
		axis: "x",
		drag: function() {
			updateViewsWidths();
		},
		stop: function() {
			updateViewsWidths(true);
			
		}
		
	}); 
	
	//on seperator drag, apply resizing on the CL and ASM controls:
	function updateViewsWidths(positionDivider) {
		var dividerLeftOffset = $(divider).offset().left;
		var fullWidth = $(document.body).width();
		var locationInPercentages = (dividerLeftOffset / fullWidth) * 100;
		locationInPercentages = Math.round(locationInPercentages);
		
		clViewer.style.width = locationInPercentages + '%';
		asmViewer.style.width = (100 - locationInPercentages) + '%';
		
		if(positionDivider == true){
			divider.style.left = 'calc(' + locationInPercentages + '% - 5px)';
		}
	}
	

	
	//------------------ Get the report data and build the source viewers ---------------------//
	var dataRequestPrefix = filesBaseDir + '/data/';
	if(onTheFlyMode == true){
		dataRequestPrefix = "GenAsm?";
	}
	
	buildCLViewer();
	buildGenViewer();
	buildGenAsmOffsetsColumn();
	loadAndApplyMapping(clViewer, asmViewer, dataRequestPrefix + 'mapping.txt');
	
	//removeLoadingMessage(document.body);
	
	
	
	//-------- HELP FUNCTIONS --------//
	function buildCLViewer() {
		$.ajax({
			url: dataRequestPrefix + 'cl.txt',
			type: "POST",
			dataType: "text",
			async: false,
			success: function (srcCode, textStatus) 
			{
				//create the clViewer:
				var clSrcViewer = CreateSrcViewer(srcCode, 'cpp');
				$(clViewer).append(clSrcViewer);
				
				//apply syntax highlighter:
				SyntaxHighlighter.defaults.toolbar = false;
				SyntaxHighlighter.highlight();
				
				//this bypasses a syntaxhighlighter library bug in layout:
				var children = $(clViewer).children();
				children.css({'height': '100%'});
				if (children.length > 0) {
					var grandChildren = $(children[0]).children();
					grandChildren.css({'height': '100%'});
				}
			},
			error: function (xhr, textStatus, errorThrown) {
				appendCriticalErrorMessage(clViewer, errorThrown);
			}
		});
	
	}
		

	function buildGenViewer() {
		$.ajax({
			url: dataRequestPrefix + 'gen.txt',
			type: "POST",
			dataType: "text",
			async: false,
			success: function (srcCode, textStatus) 
			{
				//create viewer:
				var asmSourceViewer = CreateSrcViewer(srcCode, 'genasm');
				$(asmViewer).append(asmSourceViewer);

				//apply syntax highlighter:
				SyntaxHighlighter.defaults.toolbar = false;
				SyntaxHighlighter.highlight();
				
				//this bypasses a bug in syntaxhighlighting lib in layout:
				var children = $(asmViewer).children();
				children.css({'height': '100%'});				
				if (children.length > 0) {
					var grandchildren = $(children[0]).children();
					grandchildren.css({'height': '100%'});
				}
			},
			
			error: function (xhr, textStatus, errorThrown) {
				appendCriticalErrorMessage(asmViewer, errorThrown);
			}
		});
	}
	
	
	function buildGenAsmOffsetsColumn() {
		//get the offsets data:
		var offsets;
		$.ajax({
			url: dataRequestPrefix + 'offset.txt',
			type: "POST",
			dataType: "json",
			async: false,
			success: function (offsetsData, textStatus) {
				offsets = offsetsData;
			},
			error: function (xhr, textStatus, errorThrown) {
				offsets = [];
			}
		});
		
		//add an offset column (find the element with classname "gutter", that's the column containing lines numbers, insert the "offset" column after it):
		var offsetsLen = offsets.length;
		var gutters = $(asmViewer).find(".gutter");
		if(gutters.length == 1){
			var offsetColumn = document.createElement('td');
			offsetColumn.className = 'gutter';
			$(offsetColumn).insertAfter( $(gutters[0]) );
			
			//fill the offset column with the offsets data:
			var asmLen =  $(gutters[0]).find('.line').length;
			for(var i=0; i<asmLen; i++)
			{
				var offsetValue;
				if( i < offsetsLen){
					offsetValue = offsets[i];
				}
				else{
					offsetValue = '[N/A]';
				}
				var div = document.createElement('div');
				if(offsetValue != null && offsetValue != '[N/A]'){
					div.innerHTML = '0x' + offsetValue.toString(16);
				}
				div.className = 'line number' + (i+1);
				offsetColumn.appendChild(div);
			}
		}
	}
	
	
	function bindGenAsmDocumentation() {
		
		//Gen Asm documentations binding:
		var genCommands = $(asmViewer).find('.genasm .keyword ');
		genCommands.addClass('hasGenDocumentation');
		
		for(var n=0; n<genCommands.length; n++) (function(i){
			var element = genCommands[n];
			element.title = 'display the documentation of "' + element.innerHTML + '" here';
			
		})(i);
	}
	
	
	function loadAndApplyMapping(clViewer, asmViewer, mappingFile){
		//request mapping Data:
		$.ajax({
			url: mappingFile,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (mapping, textStatus) 
			{
				var len = mapping.length;
				for(var i=0; i<len; i++){
					var clLine = mapping[i][0];
					var asmLines = mapping[i][1];
					
					var lineElements = $(clViewer).find('.number' + clLine);
					if(lineElements.length != 2){
						continue;
					}
					registerMappingClickEvent(lineElements, clLine, asmLines, clViewer, asmViewer);
				}
			},
			error: function (xhr, textStatus, errorThrown) {
				//appendCriticalErrorMessage(document.body);
				alert('unable to apply mapping data: ' + errorThrown);
			}
		});
	}


	function registerMappingClickEvent(allClLinesElements, clLine, asmLines, clViewer, asmViewer){
		
		//register CL to ASM mapping:
		registerLineClickEvent(allClLinesElements, clViewer, asmViewer, asmLines);
		
		//register ASM to CL mapping:
		for(var i=0; i<asmLines.length; i++) (function(i){
			var asmLineElements = $(asmViewer).find('.number' + asmLines[i]);
				registerLineClickEvent(asmLineElements, asmViewer, clViewer, [clLine], asmLines[i], asmLines);
		})(i);
		
		
		function registerLineClickEvent(lineElements, containerViewer, viewerToLinkTo, linesToLinkTo, selectedLine, allLines){
			
			var highlightLinesWithSimilarMapping = false;
			if(selectedLine != null && allLines != null)
			{
				highlightLinesWithSimilarMapping = true;
			}
			lineElements.css({cursor: 'pointer'});
			lineElements.click(function()
			{
				//unhighlight everything currently highlighted:
				$(containerViewer).find('.highlighted').removeClass('highlighted');
				
				//apply highlight class to target elements:
				lineElements.addClass('highlighted');
				
				//scroll in the target view to the first line and highlight all of targets:
				scrollViewerTo(viewerToLinkTo, linesToLinkTo, 800, 1000);
			
				if(highlightLinesWithSimilarMapping == true)
				{
					highlightAsmLineAndHisRelatedLines(containerViewer, selectedLine, allLines);
				}
			
				lineElements.mouseenter(function(){
					$(this).css({ 'background-color': 'lightBlue !important' });
				});
				lineElements.mouseout(function(){
					$(this).css({ 'background-color': '' });
				});
			});
		}
		
	}

	
	function scrollViewerTo(viewer, target, speed, highlightDelay) {
		if(target.length == 0){
			return;
		}
		var scrollTarget = target[0];
		
		if(speed == null){
			speed = 800;
		}
		if (highlightDelay == null){
			highlightDelay = 576;
		}

		//unhighlight everything currently highlighted:
		$(viewer).find('.highlighted').removeClass('highlighted');

		//calc new scrolling target:
		viewerJquery = $(viewer);
		var syntaxHighlighter = $(viewerJquery.find('.syntaxhighlighter')[0]);
		var viewerOffset = syntaxHighlighter.scrollTop();
		var targetFirstLine = viewer.getElementsByClassName('line number' + target[0])[0];
		var relativeTopOffsetOfTraget = $(targetFirstLine).offset().top;
		var targetOffset = relativeTopOffsetOfTraget;//15.9 * (scrollTarget - 1);
		var viewerHeight = viewerJquery.height();
		var scrollingOffset = targetOffset + viewerOffset - (viewerHeight / 2)

		syntaxHighlighter.animate({ scrollTop: scrollingOffset }, speed);

		setTimeout(function () {
			//unhighlight everything currently highlighted:
			$(viewer).find('.highlighted').removeClass('highlighted');
			
			var targetsLen = target.length;
			for(var i=0; i< targetsLen; i++){
				var targetLine = target[i];
				//get elements to be highlighted:
				lineToHighlight = viewer.getElementsByClassName('line number' + targetLine);
				var lineNumberTD = lineToHighlight[0];
				var offsetTD = lineToHighlight[1];
				var SrcCodeTD = lineToHighlight[2];

				//apply highlight class to target elements:
				$(lineNumberTD).addClass('highlighted');
				$(SrcCodeTD).addClass('highlighted');
				$(offsetTD).addClass('highlighted');
			}
		}, highlightDelay);
	}

	
	function highlightAsmLineAndHisRelatedLines(viewer, mainAsmLineNumber, asmLines) {
		if(mainAsmLineNumber == null){
			return;
		}
		
		//unhighlight everything currently highlighted:
		$(viewer).find('.highlighted').removeClass('highlighted').removeClass('relatedSrcLine');
		
		var additionalClass = ' relatedSrcLine';
		
		var targetsLen = asmLines.length;
		for(var i=0; i< targetsLen; i++){
			var targetLine = asmLines[i];
			//get elements to be highlighted:
			lineToHighlight = viewer.getElementsByClassName('line number' + targetLine);
			var lineNumberTD = lineToHighlight[0];
			var offsetTD = lineToHighlight[1];
			var SrcCodeTD = lineToHighlight[2];

			//apply highlight class to target elements:
			$(lineNumberTD).addClass('highlighted' + additionalClass)
			$(SrcCodeTD).addClass('highlighted' + additionalClass);
			$(offsetTD).addClass('highlighted' + additionalClass);
		}
		
		var mainLineToHighlight = viewer.getElementsByClassName('line number' + mainAsmLineNumber);
		//apply highlight class to target elements:
		var lineNumberTD = mainLineToHighlight[0];
		var offsetTD = mainLineToHighlight[1];
		var SrcCodeTD = mainLineToHighlight[2];
		$(lineNumberTD).removeClass(additionalClass)
		$(SrcCodeTD).removeClass(additionalClass);
		$(offsetTD).removeClass(additionalClass);
			
	}


}


//=========== private functions =============
/*function CreateSrcViewer(src, brush) {
    var srcCodeContainer = document.createElement('pre');
    srcCodeContainer.className = 'brush: ' + brush + '; class-name: "highlighterLine";';
	var invisibleChar = ' ';
    srcCodeContainer.innerHTML = invisibleChar + src + invisibleChar;
    return srcCodeContainer;
}*/

