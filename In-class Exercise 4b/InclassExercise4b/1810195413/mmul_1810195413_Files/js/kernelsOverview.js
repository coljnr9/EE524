function loadKernelsOverviewReport(reportItem, kernelsOverview){

	//*****************************************/
	/* Building report structure */
	/*****************************************/
	//basics:
	if(!kernelsOverview.lastState){
		kernelsOverview.lastState = { 'activePage': null };
	}
	
	var vm = new ViewMode(reportItem, 140, 'Kernels Overview:', 'reportTitle');
	reportItem.appendChild(CreateSeperator('100%', null, '5px'));
	var tl = new TransitionList(reportItem, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', onPageLoad, onPageDispose);
	
	//ids:
	var vm1_id = 'hostProf_kernelsOverview_tableView', page1_id = 'hostProf_kernelsOverview_tablePage';
	var vm2_id = 'hostProf_kernelsOverview_graphView', page2_id = 'hostProf_kernelsOverview_graphPage';
	
	//create pages:
	if(kernelsOverview.table){
		vm.add(vm1_id, 'Data Table', function () { tl.switchTo(page1_id); });
		var page1 = tl.addReportToList(page1_id);
		page1.loadingFunc = function(){ buildkernelsOverviewTable(kernelsOverview.table, page1); };
		
		//last state:
		if(kernelsOverview.lastState && kernelsOverview.lastState.activePage == page1_id){
			page1.loadingFunc();
		}
	}
	
	if(kernelsOverview.graph != null && kernelsOverview.graph != ''){
		vm.add(vm2_id, 'Graphical View', function () { tl.switchTo(page2_id); });
		var page2 = tl.addReportToList(page2_id);
		page2.loadingFunc = function(){ buildkernelsOverviewGraph(kernelsOverview.graph, page2); };
		
		//last state:
		if(kernelsOverview.lastState && kernelsOverview.lastState.activePage == page2_id){
			vm.setFocusOn(vm2_id);
		}
	}

	//if no last-state set yet, set it to be the first:
	if(kernelsOverview.lastState.activePage == null && tl.itemsCount > 0){
		//kernelsOverview.lastState = { 'activePage': null };
		var firstPageId = tl.callLoadOnFirstItem();
		kernelsOverview.lastState.activePage = firstPageId;
	}
	
	
	//build tips:
	if(kernelsOverview.tips){
		buildKernelsOverviewTips(kernelsOverview.tips);
	}
	
	
	
	/*****************************************/
	/* Load / Dispose functions */
	/*****************************************/
	function onPageLoad(id){
		//console.log('inner load: ' + id);
		//get page element:
		var page = document.getElementById(id);
		if(page == null){
			//appendCriticalErrorMessage(parent , "Error: unable to find report!");
			alert("Error: unable to find report!");
			return;
		}
		kernelsOverview.lastState.activePage = id;
		
		//call it's loading function (if it has any):
		if (typeof page.loadingFunc == 'function') {
			page.loadingFunc();
		}
		else{
			console.log('no loading function found for ' + id);
		}
		
	}
	
	function onPageDispose(id){
		//console.log('inner dispose: ' + id);
		//get page element:
		var page = document.getElementById(id);
		if(page == null){
			alert("Error: unable to find report!");
			return;
		}
		
		if(id == page1_id){
			kernelsOverview.lastState.tableView = {'tableState': null};
		}
		
		if(id == page2_id){
			//get graph's last state:
			if(page.objectsMap && page.objectsMap.graph != null){
				var graphLastState = page.objectsMap.graph.getState();
				kernelsOverview.lastState.graphView = {'graphState': graphLastState};
			}
		}
		
		$(page).empty();
	}
	
	reportItem.onItemDispose = function(){
		var activePage = tl.getCurrentItem();
		onPageDispose(activePage.id);
	}
	
	
	
	/*****************************************/
	/* Build page1 - table view */
	/*****************************************/
		function buildkernelsOverviewTable(pageData, parent) {
		//spcial handling for bad datatable plug-in margin in IE:
		if(browserInfo.isIE == true){
			$(parent).addClass('IEmode');
		}
		
		//special handling for bad datatable plug-in body-height in Chrome:
		if(browserInfo.isChrome == true){
			parent.style.overflowY = 'hidden';
		}
		
		var id = 'hostProf_kernelsOverview_tableView_table';
		var OCLObjects = [];
		var ActiveTipInfo = {};
		var metricsInfo = [];
		
		//get the oclObjects info:
		$.ajax({
			url: kernelsOverview.oclObjects.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				OCLObjects = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				OCLObjects = [];
			}
		});
		
		//get the HW metrics info:
		$.ajax({
			url: pageData.metricsInfo,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				metricsInfo = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				alert('failed to get metrics info: ' + errorThrown);//todo: remove.
				metricsInfo = {};
			}
		});
		
		//transition list height binding to window size:
		window.addEventListener('resize', function (event) {
			resizeTableToFitScreen();
		});
		
		function resizeTableToFitScreen(){
			var scrollBodies = $(parent).find('.dataTables_scrollBody');
			if (scrollBodies != null && scrollBodies.length > 0) {
				$(scrollBodies[0]).css('height', ($(parent).height() - 51));
			}
    
		}
		
		var columns = [
				{
					"title": "",
					"defaultContent": "+",
					"searchable": false,
					"className": 'details-control',
					"orderable": false
				},
				{
					"title": "<span class='hwCountersHeaders'>Kernel Name</span>",
					"data": "kernelName",
					"contentPadding": "mmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Global Work Size</span>",
					"data": "globalWorkSize",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Local Work Size</span>",
					"data": "localWorkSize",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Device Type</span>",
					"data": "deviceType",
					"contentPadding": "mm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Count</span>",
					"data": "executionsCount",
					"contentPadding": "mmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Total Duration (ms)</span>",
					"data": "totalDuration",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Avg Duration (ms)</span>",
					"data": "avgDuration",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Min Duration (ms)</span>",
					"data": "minDuration",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Max Duration (ms)</span>",
					"data": "maxDuration",
					"contentPadding": "mmmm"
				}
			];
			
			
			
		if(metricsInfo.stats != null){

				var memoryDiagramColumn = {
						"title": "",
						"className": "memoryDiagramLauncher",
						"searchable": false,
						"orderable": false,
						"render": function (data, type, row) {							
							//check if needed data exists:
							if(row.EuActive != null && row.EuActive != '' && row.EuActive != '[N/A]'){
								var spanHTML = '<span class="linkableTextIntelBlue" style="margin-right: 10px;" ' +
													   'title="view data as a memory diagram">[...]</span>';
								return spanHTML;
							}
							return '';
						}
					};
				
				columns.push(memoryDiagramColumn);
			
			}
			
			
		//HW metrics columns definition:
		if(metricsInfo.stats != null){
			columns = columns.concat(metricsInfo.stats);
		}
		
		$('<table id="' + id + '" class="display "/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable({
			"ajax": pageData.source,
			"columns": columns,
			"order": [[1, 'asc']],
			//"bLengthChange": false,
			//"bFilter": false,
			"bInfo": false,
			//"aLengthMenu": [10],
			"scrollY": "auto",
			"sScrollX": "100%",
			"bPaginate": false,
			"bSortClasses": false,
			"language": { "emptyTable": "no records available." }
			//	"sRowSelect": "single"
			
		});
		$('#' + id).css({ 'min-width': '1200px' });

		resizeTableToFitScreen();
		
		var selectedRow = null;
		$($('#' + id).find('tbody')).on('click', 'tr', function () {
			if(selectedRow != null){
				$(selectedRow).removeClass('selected');
			}
			
			selectedRow = this;
			$(selectedRow).addClass('selected');
		} );
		
		$($('#' + id).find('tbody')).on('dblclick', 'tr', function () {
			
			var td = $(this).find('td.details-control')[0];
			$(td).click();
		} );
		
		
		// Add event listener for opening and closing details
			var count = 0;
			$($('#' + id).find('tbody')).on('click', 'td.memoryDiagramLauncher', function () {
				if(this.innerHTML == ''){
					return;
				}
				
				count++;
				this.style.cursor = 'pointer';
				var t1_parentTR = this.parentNode;
				var t1_row = dataTableObj.row(t1_parentTR);
				var t1_data = t1_row.data();
				
				openMemoryDiagram(t1_parentTR, t1_row, t1_data);
				
			});

			if(count == 0){
				//alert('todo: hide the column');
			}
		
		// Add event listener for opening and closing details
		$('#' + id + ' tbody').on('click', 'td.details-control', function () {
			var tr = $(this).closest('tr');
			var row = dataTableObj.row(tr);

			if (row.child.isShown()) {
				// This row is already open - close it
				row.child.hide();
				row.child.remove();
				RowDetailsHidden($(this));
				
				//clear highlight:
				$(tr).find('.tableFocusedRow_topLeft').removeClass('tableFocusedRow_topLeft');
				$(tr).find('.tableFocusedRow_top').removeClass('tableFocusedRow_top');
				
			}
			else {
				//close previouse active rows:
				closeActiveDetailRows();
				
				// Open this row
				child = createRowDetails(tr, row, row.data());
				child.show();
				RowDetailsShown($(this));
				
				
			}

		});
		
		function closeActiveDetailRows(){
			var activeRows = $('#' + id).find('.activeDetailsParentRow');
			if(activeRows.length > 0){
				activeRows.trigger('click');
			}
		}

		function createRowDetails(parentTR, row, rowData) {
			
			var parentCells = $(parentTR).find('td');
			for(var i=0; i<parentCells.length; i++){
				if(i==0){
					$(parentCells[0]).addClass('tableFocusedRow_topLeft');
				}
				else{
					$(parentCells[i]).addClass('tableFocusedRow_top');
				}
			}
			
			var div = document.createElement('div');
			div.style.background = 'white';//'#bfc7ce';
			div.style.height = '198px';
			//div.style.minHeight = '190px';
			//div.style.maxHeight = '190px';
			div.style.width = 'calc(100% - 40px)';
			//div.style.minWidth = '1200px';
			div.style.marginLeft = '20px';
			div.style.overflow = 'auto';
			div.style.overflowY = 'hidden';
			child = row.child(div);
			
			$(div.parentNode).addClass('tableFocusedRow_left');
			
			
			
			var tableLayout = document.createElement('table');
			tableLayout.style.width = '100%';
			var tr = tableLayout.insertRow(tableLayout.rows.length);

			var cell_datatable = tr.insertCell(tr.cells.length);
			cell_datatable.style.width = '70%';
			cell_datatable.style.minWidth = '500px';
			cell_datatable.style.paddingBottom = '0px';

			var cell_graph = tr.insertCell(tr.cells.length);
			cell_graph.className = 'cell_detailesGraph';
			$(div).append(tableLayout);

			var tableContainer = document.createElement('div');
			tableContainer.style.background = '#fcfcfc';
			tableContainer.style.marginRight = '5px';
			tableContainer.style.marginTop = '15px';
			$(cell_datatable).append(tableContainer);


			
			/*
			var headerDiv = document.createElement('div');
			headerDiv.className = 'kernelsOverviewInnerHeaderDiv';
			div.appendChild(headerDiv);
			
			var title = document.createElement('div');
			title.className = 'kernelsOverviewInnerHeaderTitle';
			title.innerHTML = ' actions:';
			headerDiv.appendChild(title);
			
			var viewSrcButton = document.createElement('span');
			viewSrcButton.className = 'kernelsOverviewInnerHeaderButton';
			viewSrcButton.innerHTML = 'source';
			viewSrcButton.title = 'view source code';
			headerDiv.appendChild(viewSrcButton);
			
			var deepAnalysisButton = document.createElement('span');
			deepAnalysisButton.className = 'kernelsOverviewInnerHeaderButton';
			deepAnalysisButton.innerHTML = 'analysis';
			deepAnalysisButton.title = 'deep analysis';
			headerDiv.appendChild(deepAnalysisButton);
			
			var editInKDFButton = document.createElement('span');
			editInKDFButton.className = 'kernelsOverviewInnerHeaderButton';
			editInKDFButton.innerHTML = 'edit';
			editInKDFButton.title = 'edit in KDF';
			headerDiv.appendChild(editInKDFButton);
			*/
			
			/*var tableWrapper = document.createElement('div');
			tableWrapper.className = 'kernelsOverviewInnerTableWrapper';
			div.appendChild(tableWrapper);
			*/
			
			
			
			var graphContainer = document.createElement('div');
			graphContainer.className = 'kernelsOverviewInnerGraphContainer';
			cell_graph.appendChild(graphContainer);
			graphContainer.style.width = '100%';
			graphContainer.style.height = '180px';
			graphContainer.style.position = 'relative';
			
			//div.appendChild(CreateSeperator());
			
			/*cell_graph = tr.insertCell();
			$(div).append(tableLayout);

			tableContainer = document.createElement('div');
			tableContainer.style.background = '#fcfcfc';
			tableContainer.style.marginRight = '5px';
			tableContainer.style.marginTop = '15px';
			$(cell_datatable).append(tableContainer);
*/
			var table = document.createElement('table');
			table.className = 'display'; //apiTraceTable
			$(tableContainer).append(table);
			table.rowData = rowData;
			
			var columns = [
				//{
				//	"title": "Type",
				//	"data": "type"
				//},
				{
					"title": "<span class='hwCountersHeaders'>Duration (ms)</span>",
					"data": "duration"
				},
				{
					"title": "<span class='hwCountersHeaders'>Start Time (ms)</span>",
					"data": "startTime"
				},
				{
					"title": "<span class='hwCountersHeaders'>End Time (ms)</span>",
					"data": "endTime"
				},
				{
					"title": "<span class='hwCountersHeaders'>Latency (ms)</span>",
					"data": "latency",
					"chartable": "true"
				},
				//{
				//	"title": "Return Value",
				//	"data": "returnValue"
				//},
				//{
				//	"title": "Command Queue ID",
				//	"data": "commandQueueID"
				//},
				//{
				//	"title": "Context ID",
				//	"data": "contextID"
				//},
				{
					"title": "<span class='hwCountersHeaders'>Global Work Offset</span>",
					"data": "globalWorkOffset"
				}
			];
			
			var scrollY = null;
			if(rowData.executionsCount != null && rowData.executionsCount > 4){
				scrollY = '100px';
			}
			
			
			
			if(rowData.deviceType.toLowerCase() == "gpu" && metricsInfo.details != null){

				var memoryDiagramColumn = {
						"title": "",
						"className": "t2_memoryDiagramLauncher",
						"searchable": false,
						"orderable": false,
						"render": function (data, type, row) {							
							//check if needed data exists:
							if(row.EuActive != null && row.EuActive != '' && row.EuActive != '[N/A]'){
								var spanHTML = '<span class="linkableTextIntelBlue" style="margin-right: 10px;" ' +
													   'title="view data as a memory diagram">[...]</span>';
								return spanHTML;
							}
							return '';
						}
					};
				
				columns.push(memoryDiagramColumn);
			
			}
			
			
			
			//HW metrics columns definition:
			if(rowData.deviceType.toLowerCase() == "gpu" && metricsInfo.details != null){
				columns = columns.concat(metricsInfo.details);
			}
		
			
			detailsTableObj = $(table).DataTable({

				"ajax": rowData.details,
				"columns": columns,
				"bSortClasses": false,
				"scrollY": "100px",
				"bDeferRender": true,
				"processing": true,
				"serverSide": false,
				//"bFilter": false,
				//"bLengthChange": false,
				//"bInfo": false,
				//"scrollY": "130px",
				//"sScrollX": "100%",
				//"bPaginate": false,
				//"bInfo": false,
				"aLengthMenu": [4],
				"fnInitComplete": function (oSettings, json) {
					//create bars-chart:
					createGraphFromTableData(graphContainer, json.data, 'duration');
				}
			});

			// Add resize listener:
			$(table).resize(function () {
				detailsTableObj.columns.adjust();
			});
			
			
			// Add event listener for opening and closing details
			var count = 0;
			$($(table).find('tbody')).on('click', 'td.t2_memoryDiagramLauncher', function () {
				if(this.innerHTML == ''){
					return;
				}
				
				count++;
				this.style.cursor = 'pointer';
				var t2_parentTR = this.parentNode;
				var t2_row = detailsTableObj.row(t2_parentTR);
				var t2_data = t2_row.data();
				
				openMemoryDiagram(t2_parentTR, t2_row, t2_data);
				
			});

			if(count == 0){
				//alert('todo: hide the column');
			}
			
			return child;
		}
	
	
	}
	
	
	
	function openMemoryDiagram(parentTR, row, allData){
		
		var popupDiv = openOverlayLayout('850px', '380px', true);
		
		var title = document.createElement('div');
		title.innerHTML = 'Memory Diagram:';
		title.style.textAlign = 'left';
		title.style.color = 'gray';
		title.style.marginTop = '20px';
		title.style.marginLeft = '20px';
		popupDiv.appendChild(title);
		
		var seperator = CreateSeperator('80%', null, '0px');
		seperator.style.marginLeft = '12px';
		popupDiv.appendChild(seperator);
		
		var diagramContainer = document.createElement('div');
		diagramContainer.style.marginTop = '20px';
		diagramContainer.style.marginLeft = '10px';
		diagramContainer.style.marginRight = '10px';
		popupDiv.appendChild(diagramContainer);
		
		var memoryDiagram = new MemoryDiagram(diagramContainer, 'hsw');
		
		//calculations:
		var EU_text = '';
		if(allData.EuStall && allData.EuStall != ''){
			EU_text += 'EU Stall: ' + allData.EuStall + '<br/>';
		}
		if(allData.EuActive && allData.EuActive != ''){
			EU_text += 'EU Active: ' + allData.EuActive + '<br/>';
		}
		if(allData.EuIdle && allData.EuIdle != ''){
			EU_text += 'EU Idle: ' + allData.EuIdle + '<br/>';
		}
		if(allData.EuThreadOccupancy && allData.EuThreadOccupancy != ''){
			EU_text += 'Occupancy: ' + allData.EuThreadOccupancy + '<br/>';
		}
		

		var arrow_EU_L3 = '';
		if(allData.SlmBytesRead && allData.SlmBytesRead != ''){
			arrow_EU_L3 += 'Slm Bytes Read: ' + allData.SlmBytesRead + '<br/>';
		}
		if(allData.SlmBytesWritten && allData.SlmBytesWritten != ''){
			arrow_EU_L3 += 'Slm Bytes Written: ' + allData.SlmBytesWritten + '<br/>';
		}
		if(allData.TypedBytesRead && allData.TypedBytesRead != ''){
			arrow_EU_L3 += 'Typed Bytes Read: ' + allData.TypedBytesRead + '<br/>';
		}
		if(allData.TypedBytesWritten && allData.TypedBytesWritten != ''){
			arrow_EU_L3 += 'Typed Bytes Written: ' + allData.TypedBytesWritten + '<br/>';
		}
		if(allData.UntypedBytesRead && allData.UntypedBytesRead != ''){
			arrow_EU_L3 += 'Untyped Bytes Read: ' + allData.UntypedBytesRead + '<br/>';
		}
		if(allData.UntypedBytesWritten && allData.UntypedBytesWritten != ''){
			arrow_EU_L3 += 'Untyped Bytes Written: ' + allData.UntypedBytesWritten + '<br/>';
		}
		
		var arrow_L3_LLC = '';
		if(allData.LlcAccesses && allData.LlcAccesses != ''){
			arrow_L3_LLC += 'LLC Accesses: ' + allData.LlcAccesses + '<br/>';
		}
		if(allData.LlcHits && allData.LlcHits != ''){
			arrow_L3_LLC += 'LLC Hits: ' + allData.LlcHits + '<br/>';
		}

		
		memoryDiagram.setValues(
									EU_text, //EU
									'', //unit_L1
									'', //unit_L2
									'',//unit_L3
									'',//unit_LLC
									'',//unit_DRAM
									'',//arrow_EU_L1
									'',//arrow_L1_L2
									'',//arrow_L2_L3
									arrow_L3_LLC,
									'',//arrow_LLC_DRAM_up
									arrow_EU_L3
								);
	}
	
	
	/*****************************************/
	/* Build page2 - graph view */
	/*****************************************/
	function buildkernelsOverviewGraph(pageData, parent){
		//objects map:
		parent.objectsMap = {};
		
		//read graph data:
		$.ajax({
			url: pageData.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (graphData) {
				//build graph:
				var graphContainer = document.createElement('div');
				graphContainer.className = 'apiCallsGraphContainer';
				parent.appendChild(graphContainer);
				
				var graph = new Graph(graphContainer);
				graph.setData(graphData.datasets);
				graph.setOptions(graphData.options);
				graph.Render();
				
				//save reference:
				parent.objectsMap.graph = graph;
				
				//apply last state (if there any):
				if(kernelsOverview.lastState.graphView && kernelsOverview.lastState.graphView.graphState != null){
					graph.applyState(kernelsOverview.lastState.graphView.graphState);
				}
			},
			error: function(jqxhr, statusText, errorThrown){
				appendCriticalErrorMessage(parent , "Error: unable to retrieve \"Kernels Overview\" graph:<br/> \"" + errorThrown + "\".");
			}
		});
		
	
	}
	
	
	/*****************************************/
	/* Build KernelsOverview Tips */
	/*****************************************/
	function buildKernelsOverviewTips(pageData){
		
		var tipsData = [];
		
		//read graph data:
		$.ajax({
			url: pageData.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				tipsData = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				alert('Warning: failed to read analysis tips: ' + errorThrown);
				tipsData = [];
			}
		});
		
		//build tips list:
		var len = tipsData.length;
		for(var i=0; i<len; i++) (function(i){
			var tipInfo = tipsData[i];
			
			var onClickFunc = null;
			if(tipInfo.onClickInfo != null){
				onClickFunc = function(){
					
					var notificationAnimationDelay = 0;
					
					//if the tip wants to filter by an ApiName:
					if(tipInfo.onClickInfo.apiName != null && tipInfo.onClickInfo.apiName != ''){
						
						//set ApiCalls report ViewMode Focus on DataTable page:
						notificationAnimationDelay = vm.setFocusOn(vm1_id);
						
						//filter table by the given apiName:
						FilterDatatable_singleColumn(mainDataTable_id, 1, tipInfo.onClickInfo.apiName);
						
						//set active tip & highlighting rows info: (this is needed to highlight the table without knowing it's id)
						setActiveTipInfo('', tipInfo.onClickInfo.innerRowsToHighlight);
						
						//expand row and show innerTable details: 
						expandDetailesForFirstFilteredRowInTable(mainDataTable_id);
						
						//get the id of the new inner table:
						var detailesTableID = getDetailesDataTableIDForFirstFilteredRow(mainDataTable_id);
						
						//set active tip & highlighting rows info: (this is needed to apply highlighting only to this innerTable)
						setActiveTipInfo(detailesTableID, tipInfo.onClickInfo.innerRowsToHighlight);
					}
					
					if(tipInfo.notification != null && tipInfo.notification != ''){
						setTimeout(function(){
							showNotificationCenterScreen(tipInfo.notification);
						}, notificationAnimationDelay);
					}
					
				}
			}
			
			addNewTip(tipInfo.title, tipInfo.description, tipInfo.icon, onClickFunc, tipInfo.tipID);
			
		})(i);
		
		
	}
	
	
}
