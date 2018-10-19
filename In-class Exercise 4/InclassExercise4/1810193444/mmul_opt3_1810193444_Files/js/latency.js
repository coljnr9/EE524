function buildKernelLatencyReport(latencyMainAjax, reportItem, lastState){
	
	//globals:
	var latencyArray;

	//last state initialization:
	if(lastState == null){
		lastState = {};
	}
		
		
	//if we have any errors, show them and return:
	if(latencyMainAjax.latencyErrors != null && latencyMainAjax.latencyErrors != ''){
		appendCriticalErrorMessage(reportItem , latencyMainAjax.latencyErrors);
	}
		
		
	//read homePage data:	
	var criticalError = false;
	$.ajax({
        url: latencyMainAjax.source,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			latencyArray = data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Kernel Latency\":<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	

	var currentLatencyElement = latencyArray[0];
	if(currentLatencyElement == null){
		return;
	}
	
	//read source code:
	var srcCode;
	$.ajax({
        url: currentLatencyElement.srcCodeSource,
        type: "POST",
        dataType: "text",
		async: false,
        success: function (data) {
			srcCode = data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve kernel's source code:<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	
	//read table data:
	var linesData;
	$.ajax({
        url: currentLatencyElement.latencyDataSource,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			linesData = data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Kernel Latency\":<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	
	//create a table container:
    var linesTableContainer = document.createElement('div');
    linesTableContainer.className = 'linesTableContainer';
    reportItem.appendChild(linesTableContainer);	

    //create a source code viewer:
    var srcViewer = document.createElement('div');
    srcViewer.className = 'srcCodeView';
    reportItem.appendChild(srcViewer);
	
	//create source code viewer:
	srcViewer.appendChild(CreateSrcViewer(srcCode));

    //apply syntax highlighter:
    SyntaxHighlighter.defaults.toolbar = false;
    SyntaxHighlighter.highlight();
	
	//resize the srcViewer on window size:
	$(window).resize(onLatencyReportResize);
	
	function onLatencyReportResize(){
		var topOffset = $(srcViewer).position().top;
        $(srcViewer).css({ 'height': 'calc(100% - ' + topOffset + 'px - 10px)' });
	}
	
	//set inner heights to 100% (to make the horizontal scroller visible all the time):
	$(srcViewer).find('div:first').css({ 'height': '100%' });
	var highlighterDiv = $(srcViewer).find('.syntaxhighlighter')[0];
	highlighterDiv.style.height = '100%';
	
	//apply last state (if there is one):
    if (lastState.lastState_srcTarget) {
        srcViewer_scrollTo(highlighterDiv, lastState.lastState_srcTarget, 0, 0);
    }
	
	//create the lines data table:
	createLinesDataTable('latency_linesTable', linesTableContainer, linesData, highlighterDiv);
	
	//call resize function after everything is created to adjust the scrollers:
	onLatencyReportResize();
	
	
	/*****************************************/
	/* dispose function */
	/*****************************************/
	reportItem.onItemDispose = function(){
		//todo: save last state.
		$(window).off("resize", onLatencyReportResize);		
	}	
	
	
	
	
	/*****************************************/
	/* Help functions */
	/*****************************************/
	
	function createLinesDataTable(id, parentToAppendTo, data, srcViewer) {
		var table = document.createElement('table');
		table.id = id;
		table.className = 'display latencyTable';
		table.linkedSrcViewer = srcViewer;
		$(table).appendTo(parentToAppendTo);

		var dataTableObj = $('#' + id).DataTable(
		{
			"aaData": data,
			"aoColumns":
			[
				{
					"title": "Line #",
					"mDataProp": "lineNumber",
					"className": "linkableSrcCode",
				},
				{
					"title": "Total Latency (%)",
					"mDataProp": "totalLatency_percentages"
				},
				{
					"title": "Total latency (cycles)",
					"mDataProp": "totalLatency_cycles"
				},
				{
					"title": "Count",
					"mDataProp": "count"
				},
				{
					"title": "Average Latency (cycles)",
					"mDataProp": "avgLatency_cycles"
				}
			],
			"order": [[1, 'desc']],
			"bLengthChange": false,
			"bFilter": false,
			//"bInfo": false,
			"aLengthMenu": [5],
			"language": {"emptyTable": "no records available."}
		});

		// Add event listener for opening and closing details
		$('#' + id + ' tbody').on('click', 'tr', function () {
			var rowData = dataTableObj.row(this).data();
			srcViewer_scrollTo(table.linkedSrcViewer, rowData.lineNumber, 800, 1000);
			return false;
		});
	}
	
	
	function srcViewer_scrollTo(viewer, target, speed, highlightDelay) {
		
		if(target == null){
			return;
		}
		
		if(speed == null){
			speed = 800;
		}
		
		if (highlightDelay == null) {
			highlightDelay = 1000;
		}

		//unhighlight everything currently highlighted:
		$(viewer).find('.highlighted').removeClass('highlighted');

		//calc new scrolling target:
		viewerJquery = $(viewer);
		var lineToHighlightJquery = $(viewer.getElementsByClassName('line number' + target));
		var viewerOffset = viewerJquery.offset().top;
		var targetOffset = lineToHighlightJquery.offset().top - viewerOffset + viewerJquery.scrollTop();
		var viewerHeight = viewerJquery.height();
		var scrollingOffset = targetOffset - (viewerHeight / 2);

		viewerJquery.animate({ scrollTop: scrollingOffset }, speed);

		setTimeout(function () {
			//get elements to be highlighted:
			lineToHighlight = viewer.getElementsByClassName('line number' + target);
			var lineNumberTD = lineToHighlight[0];
			var SrcCodeTD = lineToHighlight[1];

			//unhighlight everything currently highlighted:
			$(viewer).find('.highlighted').removeClass('highlighted');

			//apply highlight class to target elements:
			$(lineNumberTD).addClass('highlighted');
			$(SrcCodeTD).addClass('highlighted');

		}, highlightDelay);

		//save target for last state purposes:
		lastState.lastState_srcTarget = target;
		
	}


}

