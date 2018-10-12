function loadFPGACompilerWarningsReport(reportItem, warnings){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(warnings == null)
	{
		appendCriticalErrorMessage(reportItem , "compiler warnings data is undefined.");
		return;
	}
	
	//get the data from file:
	var data;
	$.ajax({
		url: warnings.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			data = FPGACompilerWarningsCommons.getProcessedData(recievedData);
		},
		error: function(jqxhr, statusText, errorThrown){
			appendCriticalErrorMessage(parent , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	if(data == null)
	{
		return;
	}
	
	var vm = new ViewMode(reportItem, 1, 'Compiler Warnings:', 'reportTitle');
	reportItem.appendChild(CreateSeperator('100%', null, '0px'));
	var tl = new TransitionList(reportItem, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', null, null);//onPageLoad, onPageDispose);
	var tableView = tl.addReportToList('compilerWarningsTableView');
	
	//bind the views with the post processed data:
	buildFPGA_CompilerWarnings(tableView, data);
	
	
	//build tips:
	if(warnings.tips){
		buildFPGAKernelCompilerWarningsTips(warnings.tips);
	}
	


	/*****************************************/
	/* Build table view */
	/*****************************************/
	function buildFPGA_CompilerWarnings(parent, processedData) {
		//alert(JSON.stringify(processedData));
		DataTableCommonTools.setAsDatatableContainer(parent);
		var id = 'fpgaKernelCompilerWarningsDatatableID';
		
		//define table columns:
		var columns = [];
		columns.push(
			{
				"title": "Compiler Warnings",
				"data": "details",
				"className": "",
				"searchable": true,
				"orderable": false,
				"render": function (data, type, row) {	
					var div = document.createElement('div');
					div.style.margin = '5px 30px 15px 0px';
					div.style.fontSize = '13px';
					div.style.width = '100%';
					//div.style.fontWeight = '700';
					
					if(data.startsWith('Compiler Warning:')){
						data = data.replace('Compiler Warning:','<span style="font-size: 14px; font-weight: 700;">Compiler Warning:</span>');
					}
					div.innerHTML = data;
					return div.outerHTML;
				}
			});
			
		
		//create the datatable:
		$('<table id="' + id + '" class="display" width="100%"/>').appendTo(parent);
		var dataTableObj = $('#' + id).DataTable(
		{
			'aaData': processedData,
			'bServerSide': false,
			"columns": columns,
			//"order": [[0, 'asc']],
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
		
		//register to the resize event and apply it:
		DataTableCommonTools.bindResizeEventForDataTableContainer(parent, true);

	}

	/*****************************************/
	/* Build FPGA warnings Tips */
	/*****************************************/
	function buildFPGAKernelCompilerWarningsTips(pageData){
		
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
var FPGACompilerWarningsCommons = (function () {
	//privates:
	function postProcessTableData(data) {
		var processedData = [];
		
		for(var i=0; i<data.rows.length; i++)
		{
			processedData.push({
					'name': data.rows[i].name,
					'details': data.rows[i].details[0]
			});
		}
		
		return processedData;
	};
	
	//public:
	return {
		
		getProcessedData: function (data) {
			return postProcessTableData(data);
		}
		
}; })();


