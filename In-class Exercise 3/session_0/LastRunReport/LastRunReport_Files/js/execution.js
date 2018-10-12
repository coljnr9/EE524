function loadExectionViewReport(reportItem, execution){

	//*****************************************/
	/* Building report structure */
	/*****************************************/
	//basics:
	if(!execution.lastState){
		execution.lastState = { 'activePage': null };
	}
	
	var vm = new ViewMode(reportItem, 140, 'Execution View:', 'reportTitle');
	reportItem.appendChild(CreateSeperator('100%', null, '5px'));
	var tl = new TransitionList(reportItem, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', onPageLoad, onPageDispose);
	
	//ids:
	var vm1_id = 'executionView_basicExecutionView', page1_id = 'executionView_basicExecutionPage';
	var vm2_id = 'executionView_graphView', page2_id = 'executionView_graphPage';
	var vm3_id = 'executionView_advancedExecutionView', page3_id = 'executionView_advancedExecutionPage';
	
	//create pages:
	if(execution.run){
		vm.add(vm1_id, 'Execution', function () { tl.switchTo(page1_id); });
		var page1 = tl.addReportToList(page1_id);
		page1.loadingFunc = function(){ loadKDFRunReportFromFile(page1, execution.run); };
		
		//last state:
		if(execution.lastState && execution.lastState.activePage == page1_id){
			page1.loadingFunc();
		}
	}
	
	if(execution.table){
		vm.add(vm3_id, 'Advanced', function () { tl.switchTo(page3_id); });
		var page3 = tl.addReportToList(page3_id);
		page3.loadingFunc = function(){ buildExecutionTableView(execution.table, true, page3, page3_id); };
		
		//last state:
		if(execution.lastState && execution.lastState.activePage == page3_id){
			vm.setFocusOn(vm3_id);
		}
	}
	
	if(execution.graph != null && execution.graph.source != null){
		vm.add(vm2_id, 'Graphical View', function () { tl.switchTo(page2_id); });
		var page2 = tl.addReportToList(page2_id);
		page2.loadingFunc = function(){ buildExecutionGraphView(execution.graph, page2); };
		
		//last state:
		if(execution.lastState && execution.lastState.activePage == page2_id){
			vm.setFocusOn(vm2_id);
		}
	}
	
	

	//if no last-state set yet, set it to be the first:
	if(execution.lastState.activePage == null && tl.itemsCount > 0){
		//execution.lastState = { 'activePage': null };
		var firstPageId = tl.callLoadOnFirstItem();
		execution.lastState.activePage = firstPageId;
	}
	
	
	//build tips:
	//addNewTip();
	
	
	
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
		execution.lastState.activePage = id;
		
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
			execution.lastState.tableView = {'tableState': null};
		}
		
		if(id == page2_id){
			//get graph's last state:
			if(page.objectsMap && page.objectsMap.graph != null){
				var graphLastState = page.objectsMap.graph.getState();
				execution.lastState.graphView = {'graphState': graphLastState};
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
	function buildExecutionTableView(pageData, showCounters, parent, id_suffix) {
		//spcial handling for bad datatable plug-in margin in IE:
		if(browserInfo.isIE == true){
			$(parent).addClass('IEmode');
		}
		
		//special handling for bad datatable plug-in body-height in Chrome:
		if(browserInfo.isChrome == true){
			parent.style.overflowY = 'hidden';
		}
		
		
		//best/worst configurations:
		var bestAndWorstConfigDiv = document.createElement('div');
		parent.appendChild(bestAndWorstConfigDiv);
		bestAndWorstConfigDiv.style.height = '21px';
		
		var spaceNumber = ' ';
		var space = '';
		for(var i=0; i<8; i++){
			space += spaceNumber;
		}
		bestAndWorstConfigDiv.innerHTML = '<b>Best Configuration:</b> <span style="color: #0071c5;">' + execution.bestConf.name + '</span> - <span style="color: gray;">median (ms): ' + execution.bestConf.median + '</span>';// +
														// space +'|' + space +
														// '<b>Worst Configuration:</b> <span style="color: #0071c5;">' + execution.worstConf.name + '</span> - <span style="color: gray;">median (ms): ' + execution.worstConf.median + '</span>';
													
		
		
		var id = 'executionView_tableView_'+id_suffix;
		var ActiveTipInfo = {};
		var metricsInfo = {};
		
		if(showCounters == true){
			
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
					//alert('failed to get metrics info: ' + errorThrown);//todo: remove.
					metricsInfo = {};
				}
			});
		}
		
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
					"title": "<span class='hwCountersHeaders'>Gx</span>",
					"data": "Gx",
					"contentPadding": ""
				},
				{
					"title": "<span class='hwCountersHeaders'>Gy</span>",
					"data": "Gy",
					"contentPadding": ""
				},
				{
					"title": "<span class='hwCountersHeaders'> Gz</span>",
					"data": "Gz",
					"contentPadding": ""
				},
				{
					"title": "<span class='hwCountersHeaders'>Lx</span>",
					"data": "Lx",
					"contentPadding": ""
				},
				{
					"title": "<span class='hwCountersHeaders'>Ly</span>",
					"data": "Ly",
					"contentPadding": ""
				},
				{
					"title": "<span class='hwCountersHeaders'>Lz</span>",
					"data": "Lz",
					"contentPadding": ""
				},
				{
					"title": "<span class='hwCountersHeaders'>Iterations</span>",
					"data": "iterations",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Total (ms)</span>",
					"data": "total",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Queue (ms)</span>",
					"data": "queue",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Submit (ms)</span>",
					"data": "submit",
					"contentPadding": "mmmm"
				},
				{
					"title": "<span class='hwCountersHeaders'>Execution (ms)</span>",
					"data": "execution",
					"contentPadding": "mmmm"
				}
			];
			
			
		var canViewVariables = false;
		try{
			canViewVariables = window.external.CanViewVariables();
		}
		catch(ex){
			canViewVariables = false;
		}
			
		//do variables?
		if(canViewVariables && execution.variables == true){

				var variablesColumn = {
						"title": "Variables",
						"className": "variablesLauncher",
						"searchable": false,
						"orderable": false,
						"render": function (data, type, row) {							
							//check if needed data exists:
							if(row.variables != null && row.variables.length != 0){
								var spanHTML = '<span class="linkableTextIntelBlue" style="margin-right: 10px;" ' +
													   'title="view variables">[...]</span>';
								return spanHTML;
							}
							return '';
						}
					};
				
				columns.splice(7, 0, variablesColumn);//at index 7.
			
			}
			
			
			
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
			"bFilter": false,
			"bInfo": false,
			//"aLengthMenu": [10],
			"scrollY": "auto",
			"sScrollX": "100%",
			"bPaginate": false,
			"bSortClasses": false,
			"language": { "emptyTable": "no records available." }
			//	"sRowSelect": "single"
			
		});
		$('#' + id).css({ 'min-width': '600px' });

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
		
		
		//variablesLauncher events:
		var count = 0;
		$($('#' + id).find('tbody')).on('click', 'td.variablesLauncher', function () {
			if(this.innerHTML == ''){
				return;
			}
			
			count++;
			this.style.cursor = 'pointer';
			var t1_parentTR = this.parentNode;
			var t1_row = dataTableObj.row(t1_parentTR);
			var t1_data = t1_row.data();
			
			openVariablesLauncher(t1_parentTR, t1_row, t1_data);
			
		});
			
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

			var graphContainer = document.createElement('div');
			graphContainer.className = 'kernelsOverviewInnerGraphContainer';
			cell_graph.appendChild(graphContainer);
			graphContainer.style.width = '100%';
			graphContainer.style.height = '180px';
			graphContainer.style.position = 'relative';
			

			var table = document.createElement('table');
			table.className = 'display'; //apiTraceTable
			$(tableContainer).append(table);
			table.rowData = rowData;
			
			var columns = [
				{
					"title": "<span class='hwCountersHeaders'>Measurement/Iteration</span>",
					"data": "measurement"
				},
				{
					"title": "<span class='hwCountersHeaders'>Total (ms)</span>",
					"data": "total"
				},
				{
					"title": "<span class='hwCountersHeaders'>Submit (ms)</span>",
					"data": "submit"
				},
				{
					"title": "<span class='hwCountersHeaders'>Queue (ms)</span>",
					"data": "queue",
					"chartable": "true"
				},
				{
					"title": "<span class='hwCountersHeaders'>Execution (ms)</span>",
					"data": "execution"
				}
			];
			
			var scrollY = null;
			if(rowData.executionsCount != null && rowData.executionsCount > 4){
				scrollY = '100px';
			}
			
			
			
			if(metricsInfo.details != null){

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
			if(metricsInfo.details != null){
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
					createGraphFromTableData(graphContainer, json.data, 'total');
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
	
	
	function openVariablesLauncher(parentTR, row, allData){
		
		var popupDiv = openOverlayLayout('850px', '380px', true);
		popupDiv.style.textAlign = 'left';
		
		var title = document.createElement('div');
		title.innerHTML = 'Kernel Variables:';
		title.style.textAlign = 'left';
		title.style.color = 'gray';
		title.style.marginTop = '20px';
		title.style.marginLeft = '20px';
		popupDiv.appendChild(title);
		
		var seperator = CreateSeperator('80%', null, '0px');
		seperator.style.marginLeft = '12px';
		popupDiv.appendChild(seperator);
		
		var tableContainer = document.createElement('div');
		tableContainer.style.marginTop = '5px';
		tableContainer.style.marginLeft = '10px';
		tableContainer.style.marginRight = '10px';
		popupDiv.appendChild(tableContainer);
		
		var table = document.createElement('table');
			table.className = 'display'; //apiTraceTable
			$(tableContainer).append(table);
			
			var columns = [
				{
					"title": "<span class='hwCountersHeaders'>Variable Name</span>",
					"data": "name",
					"render": function (data, type, row) {				
								 var spanHTML = '<span class="variableLauncherSpan" style="color: #0071C5; text-decoration: underline;" ' +
															'title="view variable content">' + data +
														'</span>';
								 return spanHTML;
							}
				},
				{
					"title": "<span class='hwCountersHeaders'>Read Time (ms)</span>",
					"data": "readTime"
				},
				{
					"title": "<span class='hwCountersHeaders'>Read Back Time (ms)</span>",
					"data": "readBackTime"
				},
				{
					"title": "<span class='hwCountersHeaders'>Data Type</span>",
					"data": "dataType",
				}
			];
			
			detailsTableObj2 = $(table).DataTable({

				"aaData": allData.variables.data,
				"columns": columns,
				"bSortClasses": false,
				"scrollY": "100px",
				"bDeferRender": true,
				"processing": true,
				"serverSide": false,
				"bFilter": false,
				"bLengthChange": false,
				"bInfo": false,
				"scrollY": "280px",
				//"sScrollX": "100%",
				"bPaginate": false,
				//"bInfo": false,
			});
			
			
			$.each($(table).find('span.variableLauncherSpan'), function( index, variableSpan ) {
				var variableData = detailsTableObj2.row($(variableSpan).closest('tr')).data();
				if(variableData.dataType == 'image2d_t'){
					$(variableSpan).addClass('allowYUVContextMenu');
				}
				variableSpan.variableData = variableData;
				variableSpan.style.cursor = 'pointer';
			});
			
			$($(table).find('tbody')).on('click', 'span.variableLauncherSpan', function () {
				OpenVariableViewer(this.variableData);
			});
			
		
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
	function buildExecutionGraphView(pageData, parent){
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
				if(execution.lastState.graphView && execution.lastState.graphView.graphState != null){
					graph.applyState(execution.lastState.graphView.graphState);
				}
			},
			error: function(jqxhr, statusText, errorThrown){
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Kernels Overview\" graph:<br/> \"" + errorThrown + "\".");
			}
		});
		
		
	
	}
	
	
}


function createKDFVariablesContextMenuFor(variableSpan, event){
	
	//context menu container:
	var contextMenuDiv = document.createElement('div');
	contextMenuDiv.className = 'customeContextMenu';
	document.body.appendChild(contextMenuDiv);
	
	contextMenuDiv.style.position = 'fixed';
	contextMenuDiv.style.top = event.pageY + 'px';
	contextMenuDiv.style.left = event.pageX + 'px';
	contextMenuDiv.style.background = 'white';
	contextMenuDiv.style.padding = '5px';
	contextMenuDiv.style.border = '1px solid #CCC';
	contextMenuDiv.style. borderRadius = '5px';
	contextMenuDiv.style.zIndex = '9999999999';
	
	//"view variable" item:
	var showVariableMenuItem = document.createElement('li');
	contextMenuDiv.appendChild(showVariableMenuItem);
	showVariableMenuItem.innerHTML = 'View Variable';
	showVariableMenuItem.style.cursor = 'pointer';
		
	//"view as YUV image" item:
	var showVariableAsYUVItem = null;
	if($(variableSpan).hasClass('allowYUVContextMenu')){
		showVariableAsYUVItem = document.createElement('div');
		contextMenuDiv.appendChild(showVariableAsYUVItem);
		showVariableAsYUVItem.innerHTML = 'View as YUV Image';
		showVariableAsYUVItem.style.cursor = 'pointer';
	}
	

	var clickAwayEventHandler = function (e) {
		// If the clicked element is not the menu
		if (!$(e.target).parents(".customeContextMenu").length > 0) {
			document.body.removeChild(contextMenuDiv);
			$(document).unbind("mousedown", clickAwayEventHandler);
		}
		else{
			if(e.target == showVariableMenuItem){
				TriggerVariableViewerFromSpanData(variableSpan);
				document.body.removeChild(contextMenuDiv);
				$(document).unbind("mousedown", clickAwayEventHandler);
			}
			else if(showVariableAsYUVItem != null && e.target == showVariableAsYUVItem){
				OpenVariableYUVViewer(variableSpan);
				document.body.removeChild(contextMenuDiv);
				$(document).unbind("mousedown", clickAwayEventHandler);
			}


			
		}
	}
	
	// If the document is clicked somewhere
	$(document).bind("mousedown", clickAwayEventHandler);

}

function OpenVariableYUVViewer(variableSpan){
	
	var variableData = $(variableSpan).data();
	var overlayDiv = openOverlayLayout('400px','350px', true, null, null, null, true);
		//overlayDiv.style.paddingLeft = '10px';
		overlayDiv.style.textAlign = 'center';
		var title = document.createElement('div');
		overlayDiv.appendChild(title);
		title.innerHTML = 'YUV Planes Combiner:';
		title.style.fontSize = '16px';
		title.style.paddingTop = '50px';
		title.style.paddingBottom = '10px';
		title.style.color = 'gray';

		
		var span = document.createElement('span');
		span.className = 'bufferViewerSpanInputName';
		span.innerHTML = '- Planes Format:';
		overlayDiv.appendChild(span);
		
		//planes format:
		var planesFormatSelect = document.createElement('select');
		planesFormatSelect.className = "textInput";
		planesFormatSelect.style.width = '200px';
		planesFormatSelect.style.marginLeft = '10px';
		planesFormatSelect.style.marginRight = '40px';
		overlayDiv.appendChild(planesFormatSelect);
		var yuvOptions = ['YUV - NV12', 'YUV - NV21', 'YUV - YV12'];
		for(i = 0; i<yuvOptions.length; i++) { 
			var opt = document.createElement('option');
			opt.value = yuvOptions[i];
			opt.innerHTML = yuvOptions[i];
			planesFormatSelect.appendChild(opt);
		}
		planesFormatSelect.onchange=function(){ onPlanesFormateSelectionChange(); };
		
		function onPlanesFormateSelectionChange(){
			if(planesFormatSelect.value == 'YUV - YV12'){
				$(overlayDiv).find('.uvPlane_class').css({'display': 'none'});
				$(overlayDiv).find('.vPlane_class').css({'display': ''});
				$(overlayDiv).find('.uPlane_class').css({'display': ''});
			}
			else{
				$(overlayDiv).find('.uvPlane_class').css({'display': ''});
				$(overlayDiv).find('.vPlane_class').css({'display': 'none'});
				$(overlayDiv).find('.uPlane_class').css({'display': 'none'});
			}
		}
		
		overlayDiv.appendChild(document.createElement("br"));
		
		
		
		addYUVInputFieldsSet('- Y Plane :', true, true, 'yPlane_class', variableData.path);
		addYUVInputFieldsSet('- UV Plane:', true, true, 'uvPlane_class', null);
		addYUVInputFieldsSet('- V Plane :', true, true, 'vPlane_class', null);
		addYUVInputFieldsSet('- U Plane :', true, true, 'uPlane_class', null);
		addYUVInputFieldsSet('- Width :', false, false, 'imageWidth', variableData.width, '57px');
		addYUVInputFieldsSet('- Height :', false, false, 'imageHeight', variableData.height, '62px');
		
		overlayDiv.appendChild(document.createElement("br"));
		//overlayDiv.appendChild(document.createElement("br"));
		
		var createImageButton = document.createElement('span');
		createImageButton.className = 'intelLinkHoverColor';
		overlayDiv.appendChild(createImageButton);
		createImageButton.innerHTML = 'create YUV image';
		createImageButton.style.fontSize = '14px';
		
		overlayDiv.appendChild(document.createElement("br"));
		
		var errorSpan = document.createElement('span');
		overlayDiv.appendChild(errorSpan);
		errorSpan.innerHTML = '';
		errorSpan.style.fontSize = '14px';
		errorSpan.style.color = 'red';
		
		onPlanesFormateSelectionChange();
		
		createImageButton.onclick = function(){
			
			var selectedMode = planesFormatSelect.value;
			var yPlane = $('input.yPlane_class:text')[0].value;
			if($($('.yPlane_class.toggelableText')[0]).hasClass('on')){
				yPlane = 'Auto';
			}
			
			var uvPlane = $('input.uvPlane_class:text')[0].value;
			if($($('.uvPlane_class.toggelableText')[0]).hasClass('on')){
				uvPlane = 'Auto';
			}
			
			var vPlane = $('input.vPlane_class:text')[0].value;
			if($($('.vPlane_class.toggelableText')[0]).hasClass('on')){
				vPlane = 'Auto';
			}
			
			var uPlane = $('input.uPlane_class:text')[0].value;
			if($($('.uPlane_class.toggelableText')[0]).hasClass('on')){
				uPlane = 'Auto';
			}
			
			var imageWidth = $('input.imageWidth:text')[0].value;
			var imageHeight = $('input.imageHeight:text')[0].value;
			
			//call the YUV combine service:
			$.ajax({
				url:  'ImageViewer?combineYUVImageAndGetPath=' + selectedMode + '&' + yPlane + '&' + uvPlane + '&' + 
				vPlane + '&' + uPlane + '&' + imageWidth + '&' + imageHeight + '&' + variableData.name,
				type: "POST",
				async: false,
				dataType: "text",
				success: function (bitmapPath) {
					var clonedSpan = $(variableSpan).clone();
					$(clonedSpan).data('path', bitmapPath);
					TriggerVariableViewerFromSpanData(clonedSpan);
					errorSpan.innerHTML = '';
				},
				error: function(jqxhr, statusText, errorThrown){
					errorSpan.innerHTML =  errorThrown;
				}
			});
		}
		
		
		function addYUVInputFieldsSet(labelText, allowBrowseButton, allowAutoButton, groupClass, defaultValue, extraMargin){
			
			var canBrowse = false;
			if (window.navigator.userAgent.indexOf("Linux")==-1){//for windows
				canBrowse = true;
			}
			
			var span = document.createElement('span');
			overlayDiv.appendChild(span);
			span.className = 'bufferViewerSpanInputName ' + groupClass;
			span.innerHTML = labelText;
			
			var yPlaneInput = document.createElement('input');
			yPlaneInput.type = "text";
			yPlaneInput.className = "textInput " + groupClass;
			yPlaneInput.style.width = '200px';
			yPlaneInput.style.marginLeft = '19px';
			if(defaultValue != null){
				yPlaneInput.value = defaultValue;
			}
			overlayDiv.appendChild(yPlaneInput);
			
			var button = null;
			if(allowBrowseButton == true && canBrowse == true){
				button = document.createElement('button');
				button.className = groupClass;
				button.innerHTML = '...';
				button.onclick = function(){
					yPlaneInput.value = openFileSelector();
				}
				overlayDiv.appendChild(button);
			}

			var auto = null;
			if(allowAutoButton == true){
				auto = document.createElement('span');
				auto.className = 'toggelableText off ' + groupClass;
				auto.style.marginLeft = '5px';
				auto.innerHTML = 'Auto';
				overlayDiv.appendChild(auto);
				auto.onclick = function(){
					var jq = $(auto);
					if(jq.hasClass('off')){
						yPlaneInput.disabled = true;
						if(button != null){
							button.disabled = true;
						}
						jq.removeClass('off').addClass('on');
					}
					else{
						yPlaneInput.disabled = false;
						if(button != null){
							button.disabled = false;
						}
						jq.removeClass('on').addClass('off');
					}
				};
				overlayDiv.appendChild(auto);
			}
			
			if(extraMargin != null){
				var lastElement;
				if(auto != null){
					lastElement = auto;
				}
				else if(button != null){
					lastElement = button;
				}
				else{
					lastElement = yPlaneInput;
				}
				lastElement.style.marginRight = extraMargin;
			}
			
			var lineBreak = document.createElement("br");
			lineBreak.className = groupClass;
			overlayDiv.appendChild(lineBreak);
		
		
		
			function openFileSelector(){
				var selectedPath = '';
				$.ajax({
					url: "Generic?selectFileDialog",
					type: "POST",
					async: false,
					dataType: "text",
					success: function (path) {
						selectedPath = path;
					},
					error: function (jqxhr, statusText, errorThrown) {
						selectedPath = '';
					}
				});
				return selectedPath;
			}
			
		}
				
}

