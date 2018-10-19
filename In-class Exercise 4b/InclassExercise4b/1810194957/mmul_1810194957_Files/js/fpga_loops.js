function loadFPGALoopsReport(reportItem, loops){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(loops == null)
	{
		appendCriticalErrorMessage(reportItem , "Loops data is undefined.");
		return;
	}
	
	var splitView = new SplitView(reportItem, true, true, false, true);
	var tableView = splitView.getLeftView();
	var srcView = splitView.getRightView();

	
	//hide the srcViewer (we'll display it on demand):
	//splitView.hideRightSide();
	
	//get the data from file:
	var data;
	$.ajax({
		url: loops.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			data = recievedData;
		},
		error: function(jqxhr, statusText, errorThrown){
			appendCriticalErrorMessage(parent , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	if(data == null)
	{
		return;
	}
	
	//post process data into a bindable array:
	data = FPGALoopsAnalysisCommons.postProcessTableData(data);
		
	
	//build report:
	var vm = new ViewMode(tableView, 90, 'View Loops By:', 'reportTitle');
	tableView.appendChild(CreateSeperator('100%', null, '5px'));
	var tl = new TransitionList(tableView, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', null, null);//onPageLoad, onPageDispose);
	
	//ids:
	var vm1_id = 'fpga_loops_byKernel', page1_id = 'fpga_loops_byKernelPage';
	var vm2_id = 'fpga_loops_byBlock', page2_id = 'fpga_loops_byBlockPage';
	var vm3_id = 'fpga_loops_none', page3_id = 'fpga_loops_nonePage';
	
	
	//vuild the view mode menu:
	vm.add(vm1_id, 'Kernel', function () { tl.switchTo(page1_id); });
	var page1 = tl.addReportToList(page1_id);
	
	vm.add(vm2_id, 'Block', function () { tl.switchTo(page2_id); });
	var page2 = tl.addReportToList(page2_id);
	
	vm.add(vm3_id, 'None', function () { tl.switchTo(page3_id); });
	var page3 = tl.addReportToList(page3_id);
	
	
	//bind the views with the post processed data:
	buildFPGALoopsTable_groupedByKernels(page1, data);
	buildFPGALoopsTable_groupedByBlock(page2, data);
	buildFPGALoopsTable_flattened(page3, data);
	

	//build tips:
	if(loops.tips){
		buildFPGALoopsTips(loops.tips);
	}
	
	
	//create a multi-source viewer:
	var multiSrcView = SharedMultiSrcView.getInstance();
	multiSrcView.reparentInto(srcView);
	
	//reportItem.onItemDispose = function(){}
	
	//on highlightable lineMapping link click:
	function onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex) {
		$(nRow).find('span.lineMapped').on('click', function () {
			FPGACommonTools.onHighlightRequest($(this).data().linemapping, multiSrcView, splitView);
		});
		$(nRow).find('.tipsyEnabled').each(function() {
			FPGACommonTools.applyTipsyOnElement(this);
		});
	}
	
	
	
	
	/*****************************************/
	/* Build table view */
	/*****************************************/
	function buildFPGALoopsTable_groupedByKernels(parent, processedData) {

		DataTableCommonTools.setAsDatatableContainer(parent);
		
		var id = 'fpgaLoopsGroupedByKernelDatatableID';
		
		//define table columns:
		var columns = [];
		DataTableCommonTools.appendExpandableColumn(columns, 'children');
		
		//name:
		columns.push(
			{
				"title": "Kernel Name",//"<span class='hwCountersHeaders'>Avg Duration (ms)</span>",
				"data": "name",
				//"contentPadding": "mm",
				"className": "",
				"searchable": true,
				"orderable": true,
				"render": function (data, type, row) {			
					return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
				}
			});
			
		columns.push(
			{
				"title": "Count",
				"data": "children.length",
				//"contentPadding": "mm",
				"className": "",
				"searchable": true,
				"orderable": true
			});
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);
		
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData.valuesByKernel,
			'bServerSide': false,
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
			"language": { "emptyTable": "no records available." },
			"fnCreatedRow": function (nRow, rowData, iDataIndex) {
					onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex);
				}
		});
		
		DataTableCommonTools.bindExpandableColumnClickToFunction(id, dataTableObj, 'children', createRowDetails, 'subTable');

		function createRowDetails(row, rowData, childrenMemberName, table) {
			
			//define table columns:
			var columns = [];
			
			
			columns.push(
			{
				"title": "",
				"data": "fullName",
				//"contentPadding": "mm",
				"className": "",
				"searchable": true,
				"orderable": true,
				"render": function (data, type, row) {	
					return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
				}
			});

			//define the data columns:
			DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, processedData.columns);
			
			detailsTableObj = $(table).DataTable({
				"aaData": rowData.children,
				'bServerSide': false,
				"columns": columns,
				"order": [[0, 'desc']],
				"bSortClasses": false,
				"scrollY": "100px",
				"bDeferRender": true,
				"processing": true,
				"serverSide": false,
				"aLengthMenu": [4],
				"fnCreatedRow": function (nRow, rowData, iDataIndex) {
					onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex);
				}
			});

			// Add resize listener:
			$(table).resize(function () {
				detailsTableObj.columns.adjust();
			});

		}


	}

	
	function buildFPGALoopsTable_groupedByBlock(parent, processedData) {
		
		DataTableCommonTools.setAsDatatableContainer(parent);
		
		var id = 'fpgaLoopsGroupedByBlockDatatableID';
		
		//define table columns:
		var columns = [];
		DataTableCommonTools.appendExpandableColumn(columns, 'children');
			
		columns.push(
			{
				"title": "Block Name",
				"data": "name",
				"className": "",
				"searchable": true,
				"orderable": true,
				"render": function (data, type, row) {
					return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
				}
			});
			
		columns.push(
			{
				"title": "Count",
				"data": "children.length",
				"className": "",
				"searchable": true,
				"orderable": true
			});
			
		//define the data columns:
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, processedData.columns);
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);
		
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData.valuesByBlocks,
			'bServerSide': false,
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
			"language": { "emptyTable": "no records available." },
			"fnCreatedRow": function (nRow, rowData, iDataIndex) {
					onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex);
				}
		});
		
		DataTableCommonTools.bindExpandableColumnClickToFunction(id, dataTableObj, 'children', createRowDetails, 'subTable');

		function createRowDetails(row, rowData, childrenMemberName, table) {
			
			//define table columns:
			var columns = [];
			columns.push(
				{
					"title": "",
					"data": "fullName",
					//"contentPadding": "mm",
					"className": "",
					"searchable": true,
					"orderable": true,
					"render": function (data, type, row) {
						return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
					}
				});
			
			//define the data columns:
			DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, processedData.columns);
			
			detailsTableObj = $(table).DataTable({
				"aaData": rowData.children,
				'bServerSide': false,
				"columns": columns,
				"order": [[0, 'desc']],
				"bSortClasses": false,
				"scrollY": "100px",
				"bDeferRender": true,
				"processing": true,
				"serverSide": false,
				"aLengthMenu": [4],
				"fnCreatedRow": function (nRow, rowData, iDataIndex) {
					onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex);
				}
			});

			// Add resize listener:
			$(table).resize(function () {
				detailsTableObj.columns.adjust();
			});
		}
	}

	
	function buildFPGALoopsTable_flattened(parent, processedData) {
		
		DataTableCommonTools.setAsDatatableContainer(parent);
		
		var id = 'fpgaLoopsFlattenedDatatableID';
		
		//define table columns:
		var columns = [];
		columns.push(
			{
				"title": "",//"<span class='hwCountersHeaders'>Avg Duration (ms)</span>",
				"data": "fullName",
				//"contentPadding": "mm",
				"className": "",
				"searchable": true,
				"orderable": true,
				"render": function (data, type, row) {							
					return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
				}
			});
		
		//define the data columns:
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, processedData.columns);
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);
		
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData.valuesFlattened,
			'bServerSide': false,
			"columns": columns,
			"order": [[0, 'desc']],
			//"bLengthChange": false,
			//"bFilter": false,
			"bInfo": false,
			//"aLengthMenu": [10],
			"scrollY": "auto",
			"sScrollX": "100%",
			"bPaginate": false,
			"bSortClasses": false,
			"language": { "emptyTable": "no records available." },
			"fnCreatedRow": function (nRow, rowData, iDataIndex) {
				onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex);
			}
		});
		
	}


	/*****************************************/
	/* Build FPGA Loops Tips */
	/*****************************************/
	function buildFPGALoopsTips(pageData){
		
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


/*****************************************/
/* post processing */
/*****************************************/
var FPGALoopsAnalysisCommons = (function () {

	return {
	
		postProcessTableData: function (data) {
			
			//make sure the data is complete:
			var columnsNames = data.columns;
			if(columnsNames == null)
			{
				return {
								'columns': [],
								'valuesByKernel': [],
								'valuesFlattened': [],
								'valuesByBlocks': [],
								'maxBottleneck': 'n/a',
								'minBottleneck': 'n/a'
						  };
			}
			
			if(data.functions == null) 
			{
				return {
								'columns': columnsNames,
								'valuesByKernel': [],
								'valuesFlattened': [],
								'valuesByBlocks': [],
								'maxBottleneck': 'n/a',
								'minBottleneck': 'n/a'
						  };
			}
			
			//rewrite the data into parent-child format:
			var currentParentsLevels = [];		  
			var allEntries = [];
			for(var i=0; i<data.functions.length; i++)
			{
				var entry = data.functions[i];
				//basic data:
				var fixedEntry = 
					{
						'name': entry.name,
						//'parialName': '',
						'fullName': entry.name,
						'level': 0,
						'details': entry.details,
						'children': []
					};
				
				//get the columns values:
				for(var k=0; k<columnsNames.length; k++)
				{
					fixedEntry[columnsNames[k]] = entry.data[k];
				}
				
				//line mapping (flatten the double arrays to a signle array):
				var entryLevel;
				var lineMapping = [];
				for(var n=0; n<entry.debug.length; n++)
				{
					for(var k=0; k<entry.debug[n].length; k++)
					{
						var lineEntry = {
							'file': entry.debug[n][k].filename,
							'line': entry.debug[n][k].line,
						}
						lineMapping.push(lineEntry);
						entryLevel = entry.debug[n][k].level;
					}
				}
				fixedEntry['lineMapping'] = lineMapping;
				fixedEntry['level'] = entryLevel;
				
				//set the fixedEntry in the level tracker array:
				currentParentsLevels[entryLevel] = fixedEntry;
				if(entryLevel >= 1)
				{
					currentParentsLevels[entryLevel - 1].children.push(fixedEntry);
					//fixedEntry['parialName'] =  currentParentsLevels[entryLevel - 1]['parialName'] + ', ' + fixedEntry['name'];
					fixedEntry['fullName'] =  currentParentsLevels[entryLevel - 1]['fullName'] + ', ' + fixedEntry['name'];
				}
				
				allEntries.push(fixedEntry);
			}
			
			
			//create bindable arrays from the entries collected:
			var newData = 
			{
				'columns': columnsNames,
				'valuesByKernel': [],
				'valuesFlattened': [],
				'valuesByBlocks': [],
				'maxBottleneck': 'n/a',
				'minBottleneck': 'n/a'
			};
								  
			for(var i=0; i<allEntries.length; i++)
			{
				var entry = allEntries[i];
				var level = entry['level'];
				var childrenCount = entry.children.length;
				
				//kernels:
				if(level == 0)
				{
					var kernelEntryWithFlattenedChildren = {
						'name': entry['name'],
						'fullName': entry['fullName'],
						'level': entry['level'],
						'details': entry['details'],
						'lineMapping': entry['lineMapping'],
						'children': []
					}
					
					for(var k=0; k<columnsNames.length; k++)
					{
						kernelEntryWithFlattenedChildren[columnsNames[k]] = entry[columnsNames[k]];
					}
					
					for(var k=0; k<entry.children.length; k++)
					{
						kernelEntryWithFlattenedChildren.children.push(entry.children[k]);
						for(var n=0; n<entry.children[k].children.length; n++)
						{
							kernelEntryWithFlattenedChildren.children.push(entry.children[k].children[n]);
						}
					}
					
					newData.valuesByKernel.push(kernelEntryWithFlattenedChildren);
				}
				//blocks:
				else if(level == 1 && childrenCount != 0)
				{
					newData.valuesByBlocks.push(entry);
				}
				//flattened
				if(level != 0)
				{
					newData.valuesFlattened.push(entry);
					if(entry['Bottleneck'] != 'n/a'){
						//max bottleneck:
						if(newData.maxBottleneck == 'n/a'){
							newData.maxBottleneck = entry['Bottleneck'];
						}
						else{
							newData.maxBottleneck = Math.max(newData.maxBottleneck, entry['Bottleneck']);
						}
						
						//min bottleneck:
						if(newData.minBottleneck == 'n/a'){
							newData.minBottleneck = entry['Bottleneck'];
						}
						else{
							newData.minBottleneck = Math.max(newData.minBottleneck, entry['Bottleneck']);
						}
						
					}
					
					
					
				}
				
			}
				
			return newData;
		}
	
}; })();

