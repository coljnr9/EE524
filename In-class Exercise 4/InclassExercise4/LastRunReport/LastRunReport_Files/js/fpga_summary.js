function loadFPGAKernelsSummaryReport(reportItem, summary){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(summary == null)
	{
		appendCriticalErrorMessage(reportItem , "summary data is undefined.");
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
		url: summary.source,
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
	data =  FPGASummaryCommons.getProcessedKernelsSummaryData(data);
	
	
	//build report:
	//var vm = new ViewMode(tableView, 110, 'Summary Report:', 'reportTitle');
	//tableView.appendChild(CreateSeperator('100%', null, '5px'));
	//var tl = new TransitionList(tableView, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', null, null);//onPageLoad, onPageDispose);
	
	//ids:
	//var vm1_id = 'fpga_summary_kernels', page1_id = 'fpga_summary_kernelsPage';
	//var vm2_id = 'fpga_summary_estimatedResourceUsage', page2_id = 'fpga_summary_resourcesPage';
	
	
	//Build the view mode menu:
	//vm.add(vm1_id, 'Kernels', function () { tl.switchTo(page1_id); });
	//var page1 = tl.addReportToList(page1_id);
	
	//vm.add(vm2_id, 'Resources', function () { tl.switchTo(page2_id); });
	//var page2 = tl.addReportToList(page2_id);
	
	
	//bind the views with the post processed data:
	buildFPGA_summary_kernels(tableView, data);
	//buildFPGA_summary_kernels(page1, data.kernels);
	//buildFPGA_summary_estimatedResourceUsage(page2, data.resources);
	
	
	//build tips:
	if(summary.tips){
		buildFPGAKernelSummaryTips(summary.tips);
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
	function buildFPGA_summary_kernels(parent, processedData) {
		//alert(JSON.stringify(processedData));
		DataTableCommonTools.setAsDatatableContainer(parent);
		var id = 'fpgaKernelSummaryDatatableID';
		
		//define table columns:
		var columns = [];
		columns.push(
			{
				"title": "Kernel Name",
				"data": "name",
				//"contentPadding": "mm",
				"className": "",
				"searchable": true,
				"orderable": true,
				"render": function (data, type, row) {	
					//var rowData = $(row).data();
					//alert(JSON.stringify(row));
					return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
				}
			});
			
		//define the data columns:
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, processedData.columns);
		
		//create the datatable:
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData.values,
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
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);

	}

	/*****************************************/
	/* Build FPGA Summary Tips */
	/*****************************************/
	function buildFPGAKernelSummaryTips(pageData){
		
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


function loadFPGAResourcesUsageReport(reportItem, summary){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(summary == null)
	{
		appendCriticalErrorMessage(reportItem , "summary data is undefined.");
		return;
	}
	
	var splitView = new SplitView(reportItem, true, true, false, true);
	var tableView = splitView.getLeftView();
	var srcView = splitView.getRightView();

	
	//get the data from file:
	var data;
	$.ajax({
		url: summary.source,
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
	data =  FPGASummaryCommons.getProcessedResourcesUsageData(data);
	
	//bind the views with the post processed data:
	buildFPGA_summary_estimatedResourceUsage(tableView, data);
	
	//build tips:
	if(summary.tips){
		//buildFPGAResourcesSummaryTips(summary.tips);
	}
	
	//create a multi-source viewer:
	var multiSrcView = SharedMultiSrcView.getInstance();
	multiSrcView.reparentInto(srcView);
	
	//on highlightable lineMapping link click:
	function onRowWithHighlightingOptionCreateEvent(nRow, rowData, iDataIndex) {
		$(nRow).find('span.lineMapped').on('click', function () {
			FPGACommonTools.onHighlightRequest($(this).data().linemapping, multiSrcView, splitView);
		});
		$(nRow).find('.tipsyEnabled').each(function() {
			FPGACommonTools.applyTipsyOnElement(this);
		});
	}
	
	
	function buildFPGA_summary_estimatedResourceUsage(parent, processedData) {
		
		DataTableCommonTools.setAsDatatableContainer(parent);
		var id = 'fpgaResourcesDatatableID';
		
		//define table columns:
		var columns = [];
		columns.push(
			{
				"title": "Kernel Name",
				"data": "name",
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
		
		//create the datatable:
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData.values,
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
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);
	}
	
	
	
	
}


/*****************************************/
/* post processing */
/*****************************************/
var FPGASummaryCommons = (function () {
	//privates:
	function postProcessTableData(data) {
		var processedData = {
										'kernels': {
											'columns': [],
											'values': []
										},
										'resources': {
											'columns': [],
											'values': [],
											'boardInterface': {},
											'kernelSubtotal': {},
											'total': {},
											'available': {},
											'kernelsList': []
										}
									};
		
		//process the kernel summary data:
		if(data.performanceSummary != null && data.performanceSummary.rows != null) {
			var kernelSummary = data.performanceSummary;			
			processedData.kernels.columns = kernelSummary.columns;
			processedData.kernels.columns.splice(0,1);
			
			//rows:
			for(var i=0; i<kernelSummary.rows.length; i++)
			{
				var entry = kernelSummary.rows[i];
				var fixedEntry = 
					{
						'name': entry.name,
						'details': entry.details,
					};
				
				//get the columns values:
				for(var k=0; k<kernelSummary.columns.length; k++)
				{
					fixedEntry[kernelSummary.columns[k]] = entry.data[k];
				}
				
				//line mapping (flatten the double arrays to a signle array):
				var lineMapping = [];
				if(entry.debug != null)
				{
					for(var n=0; n<entry.debug.length; n++)
					{
						for(var k=0; k<entry.debug[n].length; k++)
						{
							var lineEntry = {
								'file': entry.debug[n][k].filename,
								'line': entry.debug[n][k].line,
							}
							lineMapping.push(lineEntry);
						}
					}
					fixedEntry['lineMapping'] = lineMapping;
				}
				processedData.kernels.values.push(fixedEntry);
			}
		}
		

		
		//process the kernel summary data:
		if(data.estimatedResources != null && data.estimatedResources.rows != null) {
			var resourcesSummary = data.estimatedResources;			
			processedData.resources.columns = resourcesSummary.columns;
			processedData.resources.columns.splice(0,1);
			
			//rows:
			for(var i=0; i<resourcesSummary.rows.length; i++)
			{
				var entry = resourcesSummary.rows[i];
				var fixedEntry = 
					{
						'name': entry.name,
						'details': entry.details,
					};
				
				//get the columns values:
				for(var k=0; k<resourcesSummary.columns.length; k++)
				{
					fixedEntry[resourcesSummary.columns[k]] = entry.data[k];
				}
				
				//line mapping (flatten the double arrays to a signle array):
				var lineMapping = [];
				if(entry.debug != null)
				{
					for(var n=0; n<entry.debug.length; n++)
					{
						for(var k=0; k<entry.debug[n].length; k++)
						{
							var lineEntry = {
								'file': entry.debug[n][k].filename,
								'line': entry.debug[n][k].line,
							}
							lineMapping.push(lineEntry);
						}
					}
					fixedEntry['lineMapping'] = lineMapping;
				}
				processedData.resources.values.push(fixedEntry);
				
				if(fixedEntry.name == 'Board Interface'){
					processedData.resources.boardInterface = fixedEntry;
				}
				else if(fixedEntry.name == 'Kernel Subtotal'){
					processedData.resources.kernelSubtotal = fixedEntry;
				}
				else if(fixedEntry.name == 'Total'){
					processedData.resources.total = fixedEntry;
				}
				else if(fixedEntry.name == 'Available'){
					processedData.resources.available = fixedEntry;
				}
				else{
					processedData.resources.kernelsList.push(fixedEntry);
				}
			}
		}
		
		return processedData;
	};
	
	//public:
	return {
	
        getProcessedKernelsSummaryData: function (data) {
			return postProcessTableData(data).kernels;
		},
		
		getProcessedResourcesUsageData: function (data) {
			return postProcessTableData(data).resources;
		},
		
		getProcessedData: function (data) {
			return postProcessTableData(data);
		}
		
}; })();



	
	