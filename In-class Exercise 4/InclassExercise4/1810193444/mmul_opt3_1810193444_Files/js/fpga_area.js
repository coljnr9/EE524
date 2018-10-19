function loadFPGAAreaReport(reportItem, area){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(area == null)
	{
		appendCriticalErrorMessage(reportItem , "area data is undefined.");
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
		url: area.source,
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
	data = FPGAAreaAnalysisCommons.getProcessedAreaData(data);
	var valuesColumns = data.partition.columns;
	
	//build report:
	var vm = new ViewMode(tableView, 110, 'FPGA Area:', 'reportTitle');
	tableView.appendChild(CreateSeperator('100%', null, '5px'));
	var tl = new TransitionList(tableView, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', null, null);//onPageLoad, onPageDispose);
	
	//ids:
	var vm1_id = 'fpga_area_staticPartition', page1_id = 'fpga_area_staticPartitionPage';
	var vm2_id = 'fpga_area_BySystem', page2_id = 'fpga_area_bySystemPage';
	//var vm3_id = 'fpga_area_BySource', page3_id = 'fpga_area_bySourcePage';
	var vm4_id = 'fpga_area_Resources', page4_id = 'fpga_area_ResourcesPage';
	
	
	//build the view mode menu:
	vm.add(vm4_id, 'Globals', function () { tl.switchTo(page4_id); });
	var page4 = tl.addReportToList(page4_id);
	
	vm.add(vm2_id, 'Kernels', function () { tl.switchTo(page2_id); });
	var page2 = tl.addReportToList(page2_id);
	
	vm.add(vm1_id, 'Partitions', function () { tl.switchTo(page1_id); });
	var page1 = tl.addReportToList(page1_id);
	
	
	//bind the views with the post processed data:
	buildFPGAArea_Resources(page4, data.kernelSystem.columns, data.kernelSystem.values);
	buildFPGAArea_kernelSystem(page2, data.functions.columns, data.functions.values);
	buildFPGAArea_Partition(page1, data);
	

	//build tips:
	if(area.tips){
		buildFPGAAreaTips(area.tips);
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
	
	//on highlightable lineMapping link click:
	function onRowWithLinkingOptionCreateEvent(nRow, rowData, iDataIndex, layerCount) {
		$(nRow).find('span.linkableLineWithChildren').on('click', function () {
			CreateOverlayRowDetailsLayer(rowData, multiSrcView, splitView, layerCount);
		});
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
	function buildFPGAArea_Resources(parent, dataColumns, values) {
		
		DataTableCommonTools.setAsDatatableContainer(parent);
		
		//define table columns:
		var columns = [];
		columns.push(
			{
				"title": "Resource Name",
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
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, dataColumns);
		
		//create the datatable:
		var table = $('<table class="display" width="100%"/>')
		table.appendTo(parent);
		var dataTableObj = table.DataTable(
		{
			'aaData': values,
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

	
	function buildFPGAArea_kernelSystem(parent, dataColumns, values, expandableColumnBind, idSuffix, layerCount) {
		DataTableCommonTools.setAsDatatableContainer(parent);
		if(idSuffix == null){ idSuffix = ''; }
		if(layerCount == null) { layerCount = 0; }
		var id = 'fpgaAreaSystemDatatableID' + idSuffix + layerCount;
		
		//define table columns:
		var columns = [];
		
		//expandable (show children):
		if(expandableColumnBind != null && expandableColumnBind != '')
		{
			DataTableCommonTools.appendExpandableColumn(columns, expandableColumnBind);
		}
		
		var mainColumn;
		

			mainColumn = {
					"title": "",
					"data": "name",
					//"contentPadding": "mm",
					"className": "",
					"searchable": true,
					"orderable": true,
					"render": function (data, type, row) {
						
						if(expandableColumnBind != null && expandableColumnBind != '')
						{
							return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
						}
						
						else if(row.resources || row.basicblocks || row.bbresources || 
							row.bbcomputation || row.groupedBySource || row.subinfos)
						{
							return FPGACommonTools.onLinkableLineRender(row.name, row.details, row.lineMapping);
						}
						else
						{
							return FPGACommonTools.onHighlightableLineRender(row.name, row.details, row.lineMapping);
						}
					}
			};

		
		columns.push(mainColumn);
		
		//define the data columns:
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, dataColumns);
		
		//create the datatable:
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': values,
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
				onRowWithLinkingOptionCreateEvent(nRow, rowData, iDataIndex, layerCount);
			}
		});
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);
		
		if(expandableColumnBind != null && expandableColumnBind != '')
		{
			DataTableCommonTools.bindExpandableColumnClickToFunction(id, dataTableObj, expandableColumnBind, createRowDetails, 'subTable');
		}	
	}

	
	function buildFPGAArea_Partition(parent, processedData) {
		
		DataTableCommonTools.setAsDatatableContainer(parent);
		var id = 'fpgaAreaPartitionDatatableID';
		
		//define table columns:
		var columns = [];
		
		//expandable (show children):
		DataTableCommonTools.appendExpandableColumn(columns, 'resources');
		
		columns.push(
			{
				"title": "Partition Name",
				"data": "name",
				//"contentPadding": "mm",
				"className": "",
				"searchable": true,
				"orderable": true
			});
			
		//define the data columns:
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, processedData.partition.columns);
		
		//create the datatable:
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData.partition.values,
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
		
		
		DataTableCommonTools.bindExpandableColumnClickToFunction(id, dataTableObj, 'resources', createRowDetails, 'subTable');
		

	}


	function createRowDetails(row, rowData, childrenMemberName, table) {
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
		DataTableCommonTools.appendDatatableColumnsFromJSONArray(columns, valuesColumns);
		
		
		detailsTableObj = $(table).DataTable({

			"aaData": rowData[childrenMemberName],
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
	
	function CreateOverlayRowDetailsLayer(layerData, multiSrcView, splitView, layerCount) {	
		layerCount++;
		
		//create a overlay and set some custom styling to it:
		var overlay = openOverlayLayout('100%', '100%', true, null, splitView.getLeftView(), true, true);
		overlay.style.background = '#fcfcfc';
		overlay.style.padding = '10px';
		overlay.style.border = '';
		overlay.style.textAlign = 'left';
		overlay.backgroundDisabler.style.marginRight = '5px';
		overlay.backgroundDisabler.style.width = 'calc(100% - 5px)';
		
		//build report structure:
		var vm = new ViewMode(overlay, 150, layerData.name + ':', 'reportTitle');
		overlay.appendChild(CreateSeperator('100%', null, '5px'));
		var tl = new TransitionList(overlay, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', null, null);//onPageLoad, onPageDispose);
		
		//add resources page:
		if(layerData.resources != null)
		{
			var vm_id1 = 'fpga_layer' + layerCount + '_resources', page_id1 = vm_id1 + 'Page';
			vm.add(vm_id1, 'Resources', function () { tl.switchTo(page_id1); });
			var page = tl.addReportToList(page_id1);
			buildFPGAArea_Resources(page, data.functions.columns, layerData.resources);
		}
		
		//add basic blocks page (by System):
		if(layerData.basicblocks != null)
		{
			var vm_id2 = 'fpga_layer' + layerCount + '_basicBlocks', page_id2 = vm_id2 + 'Page';
			vm.add(vm_id2, 'By System', function () { tl.switchTo(page_id2); });
			var page = tl.addReportToList(page_id2);
			buildFPGAArea_kernelSystem(page, data.functions.columns, layerData.basicblocks, null, 'bb', layerCount);
		}
		
		//add resources page:
		if(layerData.bbresources != null)
		{
			var vm_id4 = 'fpga_layer' + layerCount + '_resources', page_id4 = vm_id4 + 'Page';
			vm.add(vm_id4, 'Resources', function () { tl.switchTo(page_id4); });
			var page = tl.addReportToList(page_id4);
			buildFPGAArea_kernelSystem(page, data.functions.columns, layerData.bbresources, 'subinfos', 'bbres', layerCount);
		}
		
		//for computations:
		if(layerData.bbcomputation != null)
		{
			var vm_id3 = 'fpga_layer' + layerCount + '_computation', page_id3 = vm_id3 + 'Page';
			vm.add(vm_id3, 'Computation', function () { tl.switchTo(page_id3); });
			var page = tl.addReportToList(page_id3);
			buildFPGAArea_kernelSystem(page, data.functions.columns, layerData.bbcomputation, 'subinfos', 'bbcomp', layerCount);
		}
		
		//add function's source page (by Source):
		if(layerData.groupedBySource != null)
		{
			var vm_id5 = 'fpga_layer' + layerCount + '_bySource', page_id5 = vm_id5 + 'Page';
			vm.add(vm_id5, 'By Source', function () { tl.switchTo(page_id5); });
			var page = tl.addReportToList(page_id5);
			buildFPGAArea_kernelSystem(page, data.functions.columns, layerData.groupedBySource, null, 'bySource', layerCount);
		}
		
		//add subinfos (By Source):
		if(layerData.subinfos != null)
		{
			var vm_id6 = 'fpga_layer' + layerCount + '_bySubinfos', page_id6 = vm_id6 + 'Page';
			vm.add(vm_id6, 'Info', function () { tl.switchTo(page_id6); });
			var page = tl.addReportToList(page_id6);
			buildFPGAArea_kernelSystem(page, data.functions.columns, layerData.subinfos, null, 'subinfos', layerCount);
		}
		
		
		//var vm2_id = 'fpga_area_BySystem' + layerCount, page2_id = 'fpga_area_bySystemPage' + layerCount;
		//var vm3_id = 'fpga_area_BySource' + layerCount, page3_id = 'fpga_area_bySourcePage' + layerCount;
		
		
		//build the view mode menu:
		
		
		//vm.add(vm2_id, 'Functions', function () { tl.switchTo(page2_id); });
		//var page2 = tl.addReportToList(page2_id);
		
	}
	
	
	/*****************************************/
	/* Build FPGA Loops Tips */
	/*****************************************/
	function buildFPGAAreaTips(pageData){
		
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
var FPGAAreaAnalysisCommons = (function () {
	//privates:
	var summaryData = {
									'columns': [],
									'total_percent': null,
									'total': null,
									'max_resources': null,
									'partitionsCount': null,
									'resourcesCount': null,
									'functionsCount': null
								};
								
	function postProcessTableData(data) {
		
		
		var processedData = {
										'partition': {
											'columns': [],
											'values': []
										},
										'kernelSystem': {
											'columns': [],
											'values': []
										},
										'functions': {
											'columns': [],
											'values': []
										}
									};
		
		//get the columns:
		processedData.partition.columns = data.columns;
		processedData.kernelSystem.columns = data.columns;
		processedData.functions.columns = data.columns;
		
		//fill the summary data fields:
		summaryData.columns = data.columns;
		summaryData.total_percent = data.total_percent;
		summaryData.total = data.total;
		summaryData.max_resources = data.max_resources;
		summaryData.partitionsCount = data.partitionsCount;
		summaryData.resourcesCount = data.resourcesCount;
		summaryData.functionsCount = data.functionsCount;
		
		//partitions:
		if(data.partitions != null && data.partitions.length > 0)
		{
			for(var i=0; i<data.partitions.length; i++)
			{
				var partitionEntry = data.partitions[i];
				var fixedPartition = {
								  'name': partitionEntry.name,
								  'resources': []
							  };
							  
				if(partitionEntry.resources != null && partitionEntry.resources.length > 0)
				{
					for(var j=0; j<partitionEntry.resources.length; j++)
					{
							var resource = partitionEntry.resources[j];
							var fixedResource = valuesArrayToAjax(data.columns, resource.data);
							fixedResource.name = resource.name;
							fixedResource.details = resource.details;
							
							fixedPartition.resources.push(fixedResource);
					}
				}
				sumChildrenValuesForObject(data.columns, fixedPartition.resources, fixedPartition, data.max_resources);
				processedData.partition.values.push(fixedPartition);
			}
		}
		
		
		//kernelSystem - resources:
		for(var i=0; i<data.resources.length; i++)
		{
			var resource = data.resources[i];
			var fixedResource = valuesArrayToAjax(data.columns, resource.data);
			fixedResource.name = resource.name;
			fixedResource.details = resource.details;
			
			//line mapping (flatten the double arrays to a signle array):
			var lineMapping = [];
			if(resource.debug != null)
			{
				for(var n=0; n<resource.debug.length; n++)
				{
					for(var k=0; k<resource.debug[n].length; k++)
					{
						var lineEntry = {
							'file': resource.debug[n][k].filename,
							'line': resource.debug[n][k].line,
						}
						lineMapping.push(lineEntry);
					}
				}
				fixedResource['lineMapping'] = lineMapping;
			}
			processedData.kernelSystem.values.push(fixedResource);
		}
		
		processedData.kernelSystem.overall = {};
		sumChildrenValuesForObject(data.columns, processedData.kernelSystem.values, processedData.kernelSystem.overall, null);
		
		
		//functions:
		for(var i=0; i<data.functions.length; i++)
		{
			var functionEntry = data.functions[i];
			
			var fixedFunction = {
								  'name': functionEntry.name,
								  'compute_units': functionEntry.compute_units,
								  'resources': [],
								  'basicblocks': [],
								  'groupedBySource': [],
								  'details': functionEntry.details
							  };
							  
			if(functionEntry.resources != null && functionEntry.resources.length > 0)
			{
				for(var j=0; j<functionEntry.resources.length; j++)
				{
					var resource = functionEntry.resources[j];
					var fixedResource = valuesArrayToAjax(data.columns, resource.data);
					fixedResource.name = resource.name;
					fixedResource.details = resource.details;
					
					//line mapping (flatten the double arrays to a single array):
					var lineMapping = [];
					if(resource.debug != null)
					{
						for(var n=0; n<resource.debug.length; n++)
						{
							for(var k=0; k<resource.debug[n].length; k++)
							{
								var lineEntry = {
									'file': resource.debug[n][k].filename,
									'line': resource.debug[n][k].line,
								}
								lineMapping.push(lineEntry);
							}
						}
						fixedResource['lineMapping'] = lineMapping;
					}
					fixedFunction.resources.push(fixedResource);
				}
			}
			
			//data needed for "by Source" grouping:
			var bySourceGroupingDict = {};
			
			
			if(functionEntry.basicblocks != null && functionEntry.basicblocks.length > 0)
			{
				for(var j=0; j<functionEntry.basicblocks.length; j++)
				{
					var basicBlock = functionEntry.basicblocks[j];
					var fixedBasicBlock = {
						'name': basicBlock.name,
						'bbresources': [],
						'bbcomputation': []
					};
					
					//basic block resources:
					if(basicBlock.resources != null && basicBlock.resources.length > 0)
					{
						for(var k=0; k<basicBlock.resources.length; k++)
						{
							var bbresource = basicBlock.resources[k];
							var fixedBBResource = valuesArrayToAjax(data.columns, bbresource.data);
							fixedBBResource.name = bbresource.name;
							fixedBBResource.details = bbresource.details;
							fixedBasicBlock.bbresources.push(fixedBBResource);
							
							//resource subInfo:
							if(bbresource.subinfos != null && bbresource.subinfos.length > 0)
							{
								fixedBBResource.subinfos = [];
								for(var m=0; m<bbresource.subinfos.length; m++)
								{
									var infoLvl1 = bbresource.subinfos[m];
									var fixedInfoLvl1 = valuesArrayToAjax(data.columns, infoLvl1.info.data);
									fixedInfoLvl1.name = infoLvl1.info.name;
									fixedInfoLvl1.count = bbresource.count;
									//line mapping (flatten the double arrays to a single array):
									var lineMapping = [];
									if(infoLvl1.info.debug != null)
									{
										for(var n=0; n<infoLvl1.info.debug.length; n++)
										{
											for(var l=0; l<infoLvl1.info.debug[n].length; l++)
											{
												var lineEntry = {
													'file': infoLvl1.info.debug[n][l].filename,
													'line': infoLvl1.info.debug[n][l].line,
												}
												lineMapping.push(lineEntry);
											}
										}
										fixedInfoLvl1['lineMapping'] = lineMapping;
									}
									
									fixedBBResource.subinfos.push(fixedInfoLvl1);
								}
							}
							
							if(fixedBBResource.name == 'State')
							{
								AddToBySourceGroupingDict('No Source Line', fixedBBResource, bySourceGroupingDict);
							}
						}
					}
					
					
					//basic block computation:
					if(basicBlock.computation != null && basicBlock.computation.length > 0)
					{
						for(var k=0; k<basicBlock.computation.length; k++)
						{
							var bbcomputation = basicBlock.computation[k];
							var fixedBBComputation = valuesArrayToAjax(data.columns, bbcomputation.data);
							fixedBBComputation.name = bbcomputation.name;
							fixedBBComputation.details = bbcomputation.details;
							fixedBasicBlock.bbcomputation.push(fixedBBComputation);
							
							if(fixedBBComputation.name != 'No Source Line')
							{
								AddToBySourceGroupingDict(fixedBBComputation.name, fixedBBComputation, bySourceGroupingDict);
							}
							
							//line mapping (flatten the double arrays to a single array):
							var lineMapping = [];
							if(bbcomputation.debug != null)
							{
								for(var n=0; n<bbcomputation.debug.length; n++)
								{
									for(var l=0; l<bbcomputation.debug[n].length; l++)
									{
										var lineEntry = {
											'file': bbcomputation.debug[n][l].filename,
											'line': bbcomputation.debug[n][l].line,
										}
										lineMapping.push(lineEntry);
									}
								}
								fixedBBComputation['lineMapping'] = lineMapping;
							}
							
							//resource subInfo:
							if(bbcomputation.subinfos != null && bbcomputation.subinfos.length > 0)
							{
								fixedBBComputation.subinfos = [];
								for(var m=0; m<bbcomputation.subinfos.length; m++)
								{
									var infoLvl1 = bbcomputation.subinfos[m];
									var fixedInfoLvl1 = valuesArrayToAjax(data.columns, infoLvl1.info.data);
									fixedInfoLvl1.name = infoLvl1.info.name;
									fixedInfoLvl1.count = bbcomputation.count;
									fixedInfoLvl1.details = infoLvl1.info.details;
									//line mapping (flatten the double arrays to a single array):
									var lineMapping = [];
									if(infoLvl1.info.debug != null)
									{
										for(var n=0; n<infoLvl1.info.debug.length; n++)
										{
											for(var l=0; l<infoLvl1.info.debug[n].length; l++)
											{
												var lineEntry = {
													'file': infoLvl1.info.debug[n][l].filename,
													'line': infoLvl1.info.debug[n][l].line,
												}
												lineMapping.push(lineEntry);
											}
										}
										fixedInfoLvl1['lineMapping'] = lineMapping;
									}
									
									fixedBBComputation.subinfos.push(fixedInfoLvl1);
									
									
									if(fixedBBComputation.name == 'No Source Line')
									{
										AddToBySourceGroupingDict('No Source Line', fixedInfoLvl1, bySourceGroupingDict);
									}
									
									
								}
							}
							
							
							
						}
					}
					
					
					sumChildrenValuesForObject(data.columns, fixedBasicBlock.bbresources, fixedBasicBlock, data.max_resources);
					fixedFunction.basicblocks.push(fixedBasicBlock);
				}
			}
					
			
			for(var entryName in bySourceGroupingDict)
			{
				if (bySourceGroupingDict.hasOwnProperty(entryName))
				{
					if(bySourceGroupingDict[entryName].length == 1)
					{
						//alert(bySourceGroupingDict[entryName][0].name);
						fixedFunction.groupedBySource.push(bySourceGroupingDict[entryName][0]);
					}
					else
					{
						var groupRepresentitive = {
							'name': entryName,
							'subinfos': []
						};
						sumChildrenValuesForObject(data.columns, bySourceGroupingDict[entryName], groupRepresentitive);
						fixedFunction.groupedBySource.push(groupRepresentitive);
						for(var n=0; n<bySourceGroupingDict[entryName].length; n++)
						{
							groupRepresentitive.subinfos.push(bySourceGroupingDict[entryName][n]);
						}
					}
					
				}
			}
			
			
			var allChildren = fixedFunction.resources.concat(fixedFunction.basicblocks);
			sumChildrenValuesForObject(data.columns, allChildren, fixedFunction, data.max_resources);
			processedData.functions.values.push(fixedFunction);
		}
		
		processedData.functions.overall = {};
		sumChildrenValuesForObject(data.columns, processedData.functions.values, processedData.functions.overall, null);
		
		return processedData;

		

	};
	
	function AddToBySourceGroupingDict(name, element, bySourceGroupingDict) {
		var entryName;
		if(name != 'No Source Line'){
			entryName = name.split(' ')[0];
		}
		else{
			entryName = name;
		}
		if(bySourceGroupingDict[entryName] == null)
		{
			bySourceGroupingDict[entryName] = [];
		}

		bySourceGroupingDict[entryName].push(element);
		
	}
	
	function valuesArrayToAjax(columns, valuesArray) {
		var obj = {};
		if(valuesArray == null)
		{
			for(var i=0; i<columns.length; i++)
			{
				obj[columns[i]] = '';
			}
		}
		else
		{
			for(var i=0; i<columns.length; i++)
			{
				obj[columns[i]] = valuesArray[i];
			}
		}
		return obj;
	}
	
	function sumChildrenValuesForObject(members, childrenArray, parentObj, maxValues_ForPercentages) {
		for(var i=0; i<members.length; i++)
		{
			parentObj[members[i]] = 0;
		}
		
		for(var i=0; i<childrenArray.length; i++)
		{
			for(var j=0; j<members.length; j++)
			{
				parentObj[members[j]] += childrenArray[i][members[j]];
			}
		}
		
		if(maxValues_ForPercentages != null && maxValues_ForPercentages.length == members.length)
		{
			for(var i=0; i<members.length; i++)
			{
				var percentage = parentObj[members[i]] / maxValues_ForPercentages[i] * 100;
				parentObj[members[i] + '%'] =  parentObj[members[i]] + ' (' + roundNumber(percentage, 1) + '%)';
				
			}
		}
		
	}
	
	function roundNumber(number, digits) {
		if (digits === undefined) {
			digits = 0;
		}

		var multiplicator = Math.pow(10, digits);
		number = parseFloat((number * multiplicator).toFixed(11));
		var test =(Math.round(number) / multiplicator);
		return +(test.toFixed(2));
	}
	
	//public:
	return {
	
        getProcessedAreaData: function (data) {
			return postProcessTableData(data);
		}
		
}; })();
