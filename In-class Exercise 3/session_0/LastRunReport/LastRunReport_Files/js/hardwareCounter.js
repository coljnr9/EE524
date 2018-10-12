function buildKernelCounterReport(countersMainAjax, reportItem, lastState){
	
	//last state initialization:
	if(lastState == null){
		lastState = {};
	}
	
	var countersData = {};
	
	//read homePage data:	
	var criticalError = false;
	$.ajax({
        url: countersMainAjax.source,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			countersData = data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Hardware Counters\":<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	
	/*var countersArray = [];
	for (var name in countersData) {
		var entry = {
			"name": name,
			"value": countersData[name]
		}
		countersArray.push(entry);
	}
	reportItem.style.background = 'pink';
	var countersTableContainer = document.createElement('div');
	reportItem.appendChild(countersTableContainer);
	countersTableContainer.style.height = '100%';
	countersTableContainer.style.width = '300px';
	countersTableContainer.style.overflow = 'hidden';
	countersTableContainer.style.scrollY = 'auto';
	
	//create the All-Counters data table:
	createCountersDataTable('countersTable', countersTableContainer, countersArray);
	*/
	
	
	
	
	//create memory diagram:
	openMemoryDiagram(reportItem, countersData);
	
	
	
	
	//call resize function after everything is created to adjust the scrollers:
	//onLatencyReportResize();
	
	
	/*****************************************/
	/* dispose function */
	/*****************************************/
	reportItem.onItemDispose = function(){
		//todo: save last state.
		//$(window).off("resize", onLatencyReportResize);		
	}	
	
	
	
	
	/*****************************************/
	/* Help functions */
	/*****************************************/
	
	function createCountersDataTable(id, parentToAppendTo, data) {
		var table = document.createElement('table');
		table.id = id;
		table.className = 'display latencyTable';
		$(table).appendTo(parentToAppendTo);

		var dataTableObj = $('#' + id).DataTable(
		{
			"aaData": data,
			"aoColumns":
			[
				{
					"title": "Counter Name",
					"mDataProp": "name",
					//"className": "linkableSrcCode",
				},
				{
					"title": "Value",
					"mDataProp": "value"
				}
			],
			"order": [[0, 'asc']],
			"bLengthChange": false,
			"bFilter": true,
			//"bInfo": false,
			//"aLengthMenu": [10],
			"scrollY": "auto",
			//"sScrollX": "100%",
			"bPaginate": false,
			"bSortClasses": false,
			"language": {"emptyTable": "no records available."}
		});

	}
	
	function openMemoryDiagram(parent, allData){
		
		var diagramContainer = document.createElement('div');
		diagramContainer.style.marginTop = '20px';
		diagramContainer.style.marginLeft = '10px';
		diagramContainer.style.marginRight = '10px';
		parent.appendChild(diagramContainer);
		
		var memoryDiagram = new MemoryDiagram(diagramContainer, 'hsw');
		
		//calculations:
		var EU_text = '';
		if(allData.EuStall && allData.EuStall != ''){
			EU_text += '<br/>Stall: ' + allData.EuStall + '<br/>';
		}
		if(allData.EuActive && allData.EuActive != ''){
			EU_text += 'Active: ' + allData.EuActive + '<br/>';
		}
		if(allData.EuIdle && allData.EuIdle != ''){
			EU_text += 'Idle: ' + allData.EuIdle + '<br/>';
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
	
	
	
}

