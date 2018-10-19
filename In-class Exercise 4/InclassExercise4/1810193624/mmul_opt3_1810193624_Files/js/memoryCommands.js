function loadMemoryCommandsReport(reportItem, memoryCommands){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	//basics:
	if(!memoryCommands.lastState){
		memoryCommands.lastState = { 'activePage': null };
	}
	
	var vm = new ViewMode(reportItem, 140, 'Memory Commands:', 'reportTitle');
	reportItem.appendChild(CreateSeperator('100%', null, '5px'));
	var tl = new TransitionList(reportItem, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', onPageLoad, onPageDispose, 0);
	
	//ids:
	var vm1_id = 'hostProf_memoryCommands_tableView', page1_id = 'hostProf_memoryCommands_tablePage';
	var vm2_id = 'hostProf_memoryCommands_graphView', page2_id = 'hostProf_memoryCommands_graphPage';
	var mainDataTable_id = 'hostProf_memoryCommands_tableView_table';
	
	//create pages:
	if(memoryCommands.table){
		vm.add(vm1_id, 'Data Table', function () { tl.switchTo(page1_id); });
		var page1 = tl.addReportToList(page1_id);
		page1.loadingFunc = function(){
			if( $(page1).is(':empty') ) {
				buildMemoryCommandsTable(memoryCommands.table, page1);
			}
		};
		
		//last state:
		if(memoryCommands.lastState && memoryCommands.lastState.activePage == page1_id){
			page1.loadingFunc();
		}
	}
	
	if(memoryCommands.graph && memoryCommands.graph.source != null){
		vm.add(vm2_id, 'Graphical View', function () { tl.switchTo(page2_id); });
		var page2 = tl.addReportToList(page2_id);
		page2.loadingFunc = function(){
			if( $(page2).is(':empty') ) {
				buildMemoryCommandsGraph(memoryCommands.graph, page2);
			}
		};
		
		//last state:
		if(memoryCommands.lastState && memoryCommands.lastState.activePage == page2_id){
			vm.setFocusOn(vm2_id);
		}
	}

	//if no last-state set yet, set it to be the first:
	if(memoryCommands.lastState.activePage == null && tl.itemsCount > 0){
		var firstPageId = tl.callLoadOnFirstItem();
		memoryCommands.lastState.activePage = firstPageId;
	}
	
	
	//build tips:
	if(memoryCommands.tips){
		buildMemoryCommandsTips(memoryCommands.tips);
	}
	
	
	
	/*****************************************/
	/* Load / Dispose functions */
	/*****************************************/
	function onPageLoad(id){
		//get page element:
		var page = document.getElementById(id);
		if(page == null){
			//appendCriticalErrorMessage(parent , "Error: unable to find report!");
			alert("Error: unable to find report!");
			return;
		}
		memoryCommands.lastState.activePage = id;
		
		//call it's loading function (if it has any):
		if (typeof page.loadingFunc == 'function') {
			page.loadingFunc();
		}
		else{
			console.log('no loading function found for ' + id);
		}
		
	}
	
	function onPageDispose(id){
		//get page element:
		var page = document.getElementById(id);
		if(page == null){
			alert("Error: unable to find report!");
			return;
		}
		
		if(id == page1_id){
			memoryCommands.lastState.tableView = {'tableState': null};
		}
		
		if(id == page2_id){
			//get graph's last state:
			if(page.objectsMap && page.objectsMap.graph != null){
				var graphLastState = page.objectsMap.graph.getState();
				memoryCommands.lastState.graphView = {'graphState': graphLastState};
			}
		}
		
		//$(page).empty();
	}
	
	reportItem.onItemDispose = function(){
		var activePage = tl.getCurrentItem();
		onPageDispose(activePage.id);
	}
	
	
	
	/*****************************************/
	/* Build page1 - table view */
	/*****************************************/
	function buildMemoryCommandsTable(pageData, parent) {
		//spcial handling for bad datatable plug-in margin in IE:
		if(browserInfo.isIE == true){
			$(parent).addClass('IEmode');
		}
		
		//special handling for bad datatable plug-in body-height in Chrome:
		if(browserInfo.isChrome == true){
			parent.style.overflowY = 'hidden';
		}
		
		var id = mainDataTable_id;
		var OCLObjects = [];
		
		
		//get the oclObjects info:
		if(memoryCommands.oclObjects != null){
			$.ajax({
				url: memoryCommands.oclObjects.source,
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

		
		$('<table id="' + id + '" class="display apiTraceTable"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			"ajax": pageData.source,
			"columns":
			[
				{
					"title": "",
					"defaultContent": "+",
					"searchable": false,
					"className": 'details-control',
					"orderable": false,
				},
				{
					"title": "Command Name",
					"data": "commandName"
				},
				{
					"title": "Count",
					"data": "executionsCount"
				},
				{
					"title": "# Errors",
					"data": "errorCount"
				},
				{
					"title": "Total Duration (ms)",
					"data": "totalDuration"
				},
				{
					"title": "Avg Duration (ms)",
					"data": "avgDuration"
				},
				{
					"title": "Min Duration (ms)",
					"data": "minDuration"
				},
				{
					"title": "Max Duration (ms)",
					"data": "maxDuration"
				}
			],
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
		});
		
		resizeTableToFitScreen();
		$('#' + id).css({ 'min-width': '800px' });

		// Add event listener for opening and closing details
		$('#' + id + ' tbody').on('click', 'td.details-control', function () {

			var tr = $(this).closest('tr');
			var row = dataTableObj.row(tr);

			if (row.child.isShown()) {
				// This row is already open - close it
				row.child.hide();
				row.child.remove();
				RowDetailsHidden($(this));
			}
			else {
				// Open this row
				child = createRowDetails(row, row.data());
				child.show();
				RowDetailsShown($(this));
			}

		});

		function createRowDetails(row, rowData) {
			div = document.createElement('div');
			div.style.background = '#bfc7ce';
			div.style.height = '198px';
			div.style.minHeight = '198px';
			div.style.maxHeight = '198px';
			//div.style.width = 'calc(100% - 30px)';
			div.style.paddingLeft = '0px';
			div.style.overflow = 'auto';
			div.style.overflowY = 'hidden';
			child = row.child(div);

			tableLayout = document.createElement('table');
			tableLayout.style.width = '100%';
			tr = tableLayout.insertRow(tableLayout.rows.length);

			cell_datatable = tr.insertCell(tr.cells.length);
			cell_datatable.style.width = '70%';
			cell_datatable.style.minWidth = '800px';
			cell_datatable.style.paddingBottom = '0px';

			cell_graph = tr.insertCell(tr.cells.length);
			$(div).append(tableLayout);

			tableContainer = document.createElement('div');
			tableContainer.style.background = '#fcfcfc';
			tableContainer.style.marginRight = '5px';
			tableContainer.style.marginTop = '15px';
			$(cell_datatable).append(tableContainer);

			table = document.createElement('table');
			table.className = 'display apiTraceTable';
			$(tableContainer).append(table);
			table.rowData = rowData;

			detailsTableObj = $(table).DataTable({

				"ajax": rowData.details,
				"columns":
				[
					{
						"title": "Objects",
						"defaultContent": "[...]",
						"searchable": false,
						"className": 'apiCallsDetails-args',
						"orderable": false,
					},
					{
						"title": "Return Value",
						"data": "returnValue"
					},
					{
						"title": "Duration (ms)",
						"data": "duration"
					},
					{
						"title": "Latency (ms)",
						"data": "latency"
					},
					{
						"title": "Size (byte)",
						"data": "size"
					},
					{
						"title": "Queued Time (ms)",
						"data": "queuedTime"
					},
					{
						"title": "Start Time (ms)",
						"data": "startTime"
					},
					{
						"title": "End Time (ms)",
						"data": "endTime"
					},
					{
						"title": "Context ID",
						"data": "context"
					}
				],
				"order": [[5, 'asc']],
				"bSortClasses": false,
				"scrollY": "100px",
				"bDeferRender": true,
				"processing": true,
				"serverSide": false,
				//"scrollY": "130px",
				//"sScrollX": "100%",
				//"deferRender": true,
				//"bPaginate": false,
				//"bInfo": false,
				//"bSortClasses": false
				//"aLengthMenu": [5],
				"fnCreatedRow": function (nRow, rowData, iDataIndex) {
					$(nRow).find('td.apiCallsDetails-args').on('click', function () {
						var innerTable = $(nRow).closest('.dataTable');
						var row = $(innerTable).DataTable().row(nRow);

						if (row.child.isShown()) {
							// This row is already open - close it
							row.child.hide();
							row.child.remove();
						}
						else {
							// Open this row
							div = document.createElement('div');
							div.style.background = '#bfc7ce';
							div.style.paddingLeft = '0px';
							//div.style.overflow = 'auto';
							//div.style.overflowY = 'hidden';
							child = row.child(div);

							var relatedMemoryObjects = row.data().relatedMemoryObjects;
							var memObjsTable = document.createElement('table');
							memObjsTable.style.width = '100%';
							var argsLen = relatedMemoryObjects.length;
							for (var i = 0; i < argsLen; i++) {

								//add memObj to table:
								argumentsTableRow = memObjsTable.insertRow(memObjsTable.rows.length);
								td = argumentsTableRow.insertCell(argumentsTableRow.cells.length);
								td.innerHTML = '#' + i + ':';
								td = argumentsTableRow.insertCell(argumentsTableRow.cells.length);
								var memObjName = relatedMemoryObjects[i];
								td.innerHTML = memObjName;

								//create tooltip:
								var objInfoTooltip = '';
								oclObjInfo = getOclObjInfoFor(memObjName);
								if(oclObjInfo != null){
									var len = oclObjInfo.length;
									for (var j = 0; j < len; j++) {
										if (j != 0) {
											objInfoTooltip += '\n';
										}
										objInfoTooltip += oclObjInfo[j][0] + ': ' + oclObjInfo[j][1];
									}
									td.title = objInfoTooltip;
									td.className = 'linkableArgToOclObj';
								}
							}

							$(div).append(memObjsTable);

							child.show();

							function getOclObjInfoFor(objName) {
								var len = OCLObjects.length;
								for (var n = 0; n < len; n++) {
									if (OCLObjects[n].name == objName) {
										return OCLObjects[n].info;
									}
								}
								return null;
							}
						}
					});

					$(nRow).find('td.apiCallsDetails-args').each(function (index, td) {
						var relatedMemoryObjects = rowData.relatedMemoryObjects;
						var toolTip = '';
						for (var i = 0; i < relatedMemoryObjects.length; i++) {
							if (i != 0) {
								toolTip += '\n';
							}
							toolTip += relatedMemoryObjects[i];
						}
						td.title = toolTip;
					});
					
					//highlight row if it's related to the active tip:
					var currentRowIndex = $($(nRow).closest('.dataTable')).DataTable().row(nRow).index().selector.rows._DT_RowIndex;
					if (ActiveTipInfo!= null && ActiveTipInfo.TableToHighlight == '' || ActiveTipInfo.TableToHighlight == table.id) {
						if (ActiveTipInfo.LinesToHighlight == null || ActiveTipInfo.LinesToHighlight.indexOf(currentRowIndex) != -1) {
							highlightJavascriptElement(nRow);
							activeTipHighlightedRows.push(nRow);
						}
					}
					
				},
				"fnInitComplete": function (oSettings, json) {
					//create bars-chart:
					cell_graph.className = 'cell_detailesGraph';
					graphContainer = document.createElement('div');
					graphContainer.style.width = '100%';
					graphContainer.style.height = '180px';
					graphContainer.style.position = 'relative';
					$(cell_graph).append(graphContainer);

					createGraphFromTableData(graphContainer, json.data, 'duration');
				}
			});

			// Add resize listener:
			$(table).resize(function () {
				detailsTableObj.columns.adjust();
			});

			return child;
		}


	}

	
	
	/*****************************************/
	/* Build page2 - graph view */
	/*****************************************/
	function buildMemoryCommandsGraph(pageData, parent){
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
				graphContainer.className = 'memoryCommandsGraphContainer';
				parent.appendChild(graphContainer);
				
				var graph = new Graph(graphContainer);
				graph.setData(graphData.datasets);
				graph.setOptions(graphData.options);
				graph.Render();
				
				//save reference:
				parent.objectsMap.graph = graph;
				
				//apply last state (if there any):
				if(memoryCommands.lastState.graphView && memoryCommands.lastState.graphView.graphState != null){
					graph.applyState(memoryCommands.lastState.graphView.graphState);
				}
			},
			error: function(jqxhr, statusText, errorThrown){
				appendCriticalErrorMessage(parent , "Error: unable to retrieve \"Memory Commands graph\":<br/> \"" + errorThrown + "\".");
			}
		});
	
	}
	
	
	
	/*****************************************/
	/* Build MemoryCommands Tips */
	/*****************************************/
	function buildMemoryCommandsTips(pageData){
		
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
