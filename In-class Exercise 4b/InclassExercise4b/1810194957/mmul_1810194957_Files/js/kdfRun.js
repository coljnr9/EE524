function loadKDFRunReportFromFile(reportItem, source){
	//read homePage data:	
	var criticalError = false;
	var runData = null;
	$.ajax({
        url: source,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			runData = data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			alert("--- " + errorThrown);
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"overview data\":<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	loadKDFRunReport(reportItem, runData);
	
}

function loadKDFRunReport(reportItem, runMenuData){
	if(!runMenuData){
		alert('Error, run results are missing.');
		return;
	}
	
	//for normal report (kernel run):
	if(runMenuData.kernelsRunData.length == 1){
		CreateKDFKernelRunReport(reportItem, runMenuData.kernelsRunData[0]);
	}
	//for workflow:
	else{
		//create overview section:
		$(reportItem).append($('<h1 style="text-align: center; color: #0071C5;">' + runMenuData.workflowName + '</h1>'));
		$(reportItem).append($('<h2 style="text-align: center; color: #0071C5;">Overall time: ' + runMenuData.workflowOverallTime + '(ms)</h2>'));
		
		/*var info = [];
		info.push(['Workflow name:', runMenuData.workflowName, false]);
		info.push(['Overall time:', runMenuData.workflowOverallTime, false]);
					  
		var section = createSection('Workflow Overview:', null, info, '120px');
		section.style.minHeight = '130px';
		reportItem.appendChild(section);*/
		
		//create kernels section:
		for(var i=0; i<runMenuData.kernelsRunData.length; i++){
			CreateKDFKernelRunReport(reportItem, runMenuData.kernelsRunData[i], i + 1);
		}
	}
	
	
	
	
	
}
	
function CreateKDFKernelRunReport(reportItem, runMenuData, workflowIndex){

	//read homePage data:	
	var criticalError = false;
	var configurationsArray = null;
	$.ajax({
        url: runMenuData.configurations,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			configurationsArray = data.data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"executed configurations\":<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	
	if(workflowIndex != null){
		var $fieldset = $('<fieldset class="fieldset1"><legend class="legend">Kernel #' + workflowIndex + '</legend></fieldset>');
		$(reportItem).append($fieldset);
		reportItem = $fieldset.get(0);
	}
	
	if(configurationsArray.length == 0){
		appendCriticalErrorMessage(reportItem , "there're no executed configurations to show.");
		return;
	}
	else if(configurationsArray.length == 1){
		createSingleConfigurationRunReport(reportItem, runMenuData, configurationsArray[0], workflowIndex);
		return;
	}
	else{
		createMultipleConfigurationsRunReport(reportItem, runMenuData, configurationsArray);
		return;
	}
	
	
	function createSingleConfigurationRunReport(parent, runData, configurationData, workflowIndex){
		var layoutWrapper =  document.createElement('table');
		layoutWrapper.style.width = '100%';
		parent.appendChild(layoutWrapper);
		var tr = layoutWrapper.insertRow(layoutWrapper.rows.length);
		if(workflowIndex == null){
			tr.insertCell(tr.cells.length).style.width = '3%';
		}
		var layoutWrapperCell = tr.insertCell(tr.cells.length);
		
		if(workflowIndex == null){
			tr.insertCell(tr.cells.length).style.width = '3%';
		}
		
		//table layout:
		var layout = document.createElement('table');
		layout.className = 'hostProfilingOverviewLayout';
		layoutWrapperCell.appendChild(layout);
		var tr;
		
		//---------------------- Overview ----------------------//
		tr = layout.insertRow(layout.rows.length);
		
		var container = tr.insertCell(tr.cells.length);
		container.className = 'sectionContainer';
		var validationResult = '';
		if(configurationData.validationStatus == true){
			validationResult = '<span style="color: green; font-weight: 700;">SUCCESS</span>';
		}
		else if(configurationData.validationStatus == false){
			validationResult = '<span style="color: red; font-weight: 700;">FAILED</span>';
		}
		else{
			validationResult = '<span style="color: black; font-weight: 700;">not set</span>';
		}
		
		var configurationName = 'G(' + configurationData.Gx + ',' + configurationData.Gy + ',' + configurationData.Gz + ') ' +
										  'L(' + configurationData.Lx + ',' + configurationData.Ly + ',' + configurationData.Lz + ')';
										  
		var info = [
							['Kernel:', runData.overview.kernelName + ' - ' + 
							'<span style="color: gray;">' + configurationName + '</span>', false]
					  ];

		if(runData.overview.iteration != null && runData.overview.iteration > 1){
			info.push(['Execution Median:', configurationData.executionMedian + ' (ms)', false]);
			info.push(['Iterations:', runData.overview.iteration, false]);
		}
		else{
			info.push(['Execution:', configurationData.executionMedian + ' (ms)', false]);
		}
		info.push(['Validation:', validationResult, false]);
		
		if(workflowIndex == null){
			var section = createSection('Execution Overview:', null, info, '100px');
			section.style.minHeight = '130px';
			container.appendChild(section);
			info = [];
		}
		//---------------------- output validation results ----------------------//
		//get list of variables with validation reference:
		var validation = [];
		if(configurationData.variables != null){
			for(var i=0; i<configurationData.variables.length; i++){
				var variable = configurationData.variables[i];
				if(variable.refPath != null){
					validation.push(variable);
				}
			}
		}
		
		if(validation.length > 0){
			info.push(['', '<div style="height: 20px; width: 1px;"/>', false]);
			tr = layout.insertRow(layout.rows.length);
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			//var info = [];
			
			for(var i=0; i<validation.length; i++){
				var outVar = validation[i];
				var spanHTML;
				var dataAttributes = 'onclick="TriggerVariableViewerFromSpanData(this, ' + workflowIndex + ');" ' +
											 'data-variabletype = "' + outVar.dataType + '" ' +
														  'data-name = "' + runData.overview.kernelName + '::' + outVar.name + '" ' +
														  'data-path = "' + outVar.path + '" ' +
														  'data-refpath = "' + outVar.refPath + '" ' +
														  'data-width = "' + outVar.width + '" ' +
														  'data-height = "' + outVar.height + '" ' +
														  'data-channelorder = "' + outVar.channelOrder + '" ' +
														  'data-channeltype = "' + outVar.channelType + '" ' +
														  'data-rowpitch = "' + outVar.rowPitch + '" ';
				var additionalClasses = ' variableLauncherSpan';
				if(outVar.dataType == 'image2d_t'){
					additionalClasses += ' allowYUVContextMenu';
				}
				var key = '<span class="linkableTextIntelBlue' + additionalClasses + '" ' + dataAttributes + '>' + outVar.name + '</span>' + 
							  '<span style="color: gray; margin-left: 5px;">' + '(' + outVar.dataType + ')</span>';
							  
				if(outVar.success == true){
					spanHTML = '<span style="margin-left: 30px; color: green; font-weight: 700; cursor: pointer; text-decoration: underline;" ' + dataAttributes +'>Passed.</span>';
				}
				else{
					spanHTML = '<span style="margin-left: 30px; color: red; font-weight: 700; cursor: pointer; text-decoration: underline;" ' + dataAttributes +'>Validation failed.</span>';
									 //'<span style="color: gray;"> (' + outVar.matchPrecentage + ' mismatch)</span>';
				}
				
				info.push([' ', key + spanHTML, false]);
			}
			
			if(workflowIndex == null){
				var section = createSection('Output Validation:', null, info);
				section.style.minHeight = '130px';
				container.appendChild(section);
				info = [];
			}
		}
		
		
		
		//---------------------- Variables viewing ----------------------//
		if(configurationData.variables && configurationData.variables.length > 0){
			info.push(['', '<div style="height: 20px; width: 1px;"/>', false]);
			tr = layout.insertRow(layout.rows.length);
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			//var info = [];
			var variables = configurationData.variables;
			
			for(var i=0; i<variables.length; i++){
				var v = variables[i];
				var additionalClasses = ' variableLauncherSpan';
				if(v.dataType == 'image2d_t'){
					additionalClasses += ' allowYUVContextMenu';
				}
				var spanHTML = '<span>#' + i + ':</span>' +
									   '<span class="linkableTextIntelBlue' + additionalClasses + '" style="margin-left: 20px;" onclick="TriggerVariableViewerFromSpanData(this, ' + workflowIndex + ');" ' +
														  'data-variabletype = "' + v.dataType + '" ' +
														  'data-name = "' + runData.overview.kernelName + '::' + v.name + '" ' +
														  'data-path = "' + v.path + '" ' +
														  'data-width = "' + v.width + '" ' +
														  'data-height = "' + v.height + '" ' +
														  'data-channelorder = "' + v.channelOrder + '" ' +
														  'data-channeltype = "' + v.channelType + '" ' +
														  'data-rowpitch = "' + v.rowPitch + '" ' +
									   '>' + v.name + '</span>' + '<span style="color: gray; margin-left: 5px;">' + '(' + v.dataType + ')</span>';
				if(workflowIndex != null && i == 0){
					info.push(['Kernel Variables', spanHTML, false]);
				}
				else{
					info.push(['', spanHTML, false]);
				}
			}
			
			
		}
		
		var section, sectionTitle;
		if(workflowIndex == null){
			sectionTitle = 'Kernel Variables:';
		}
		else{
			sectionTitle = 'Kernel Overview:';
		}
		
		if(info != []){
			section = createSection(sectionTitle, null, info, null);
			section.style.minHeight = '130px';
			container.appendChild(section);
		}
	}

	
	
	function createMultipleConfigurationsRunReport(parent, runData, configurationsArray){
		var layoutWrapper =  document.createElement('table');
		layoutWrapper.style.width = '100%';
		parent.appendChild(layoutWrapper);
		var tr = layoutWrapper.insertRow(layoutWrapper.rows.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		var layoutWrapperCell = tr.insertCell(tr.cells.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		
		//table layout:
		var layout = document.createElement('table');
		layout.className = 'hostProfilingOverviewLayout';
		layoutWrapperCell.appendChild(layout);
		var tr;
		
		//---------------------- Overview ----------------------//
		tr = layout.insertRow(layout.rows.length);
		
		//application info (CodeAnalyzer mode):
		if(runData.overview != null){
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			
			var info = [
								['Kernel Name:', runData.overview.kernelName, false],
								['Configurations count:', runData.overview.confCount, false],
								['Iterations Per Configuration:', runData.overview.iteration, false],
								['Best Configuration:', runData.overview.bestConf.name, false],
								['Best Configuration execution median:', runData.overview.bestConf.median + ' (ms)', false]
								//'Validation:', validationResult, false]
							];
			var section = createSection('Execution Overview:', null, info, '250px');
			section.style.minHeight = '130px';
			container.appendChild(section);
		}
		
		//---------------------- Variables viewing ----------------------//
		if(configurationsArray && configurationsArray.length > 0){
			tr = layout.insertRow(layout.rows.length);
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			var section = createSection('Configurations:', null, null);
			section.style.minHeight = '130px';
			container.appendChild(section);
			//section.innerHTML += '</br></br></br>';
			createMultipleRunExecutionTable(section, runData, configurationsArray);
		}
	}
	
//---------------------------------------------------------------------------------------------------
	function createSection(title, tipsCount, info, keyColumnWidth, sectionClass){
		
		var section = document.createElement('div');
		section.className = 'hostProfilingOverviewSection';
		if(sectionClass != null && sectionClass != ''){
			section.className += ' ' + sectionClass;
		}
		
		var titleSpan = document.createElement('span');
		titleSpan.className = 'sectionTitle';
		titleSpan.innerHTML = title;
		section.appendChild(titleSpan);
		
		if(tipsCount > 0){//todo: parse to int first.
			var tipsSpan =document.createElement('span');
			tipsSpan.className = 'sectionTipsCount';
			tipsSpan.innerHTML = tipsCount + ' tips';
			section.appendChild(tipsSpan);
		}
		
		if(info !=null && info.length > 0){
			var infoTable = document.createElement('table');
			infoTable.className = 'sectionInfoTable';
			for(var i = 0; i < info.length; i++)(function(i){
				var tr = infoTable.insertRow(infoTable.rows.length);
				
				var td = tr.insertCell(tr.cells.length);
				td.className = 'sectionInfoKey';
				if(info[i][0] != null && info[i][0] != ''){
					td.innerHTML = '- ' + info[i][0];
				}
				if(keyColumnWidth != null){
					td.style.width = keyColumnWidth;
				}
				
				td = tr.insertCell(tr.cells.length);
				td.className = 'sectionInfoValue';
				td.innerHTML = info[i][1];
				
				//can copy?
				if(info[i][2] == true){
					td.title = 'click to copy to clipboard';
					td.className = 'copiable';
					td.onclick = function (){ copyToClipboard(info[i][1]); };
				}
			})(i);
			
			section.appendChild(infoTable);
		}
		
		return section;
	}

//---------------------------------------------------------------------------------------------------
	function createMultipleRunExecutionTable(parent, runData, configurationsArray){
		var columns = [
			{
				"title": "<span class='hwCountersHeaders'>Gx</span>",
				"data": "Gx"
			},
			{
				"title": "<span class='hwCountersHeaders'>Gy</span>",
				"data": "Gy"
			},
			{
				"title": "<span class='hwCountersHeaders'>Gz</span>",
				"data": "Gz"
			},
			{
				"title": "<span class='hwCountersHeaders'>Lx</span>",
				"data": "Lx"
			},
			{
				"title": "<span class='hwCountersHeaders'>Ly</span>",
				"data": "Ly"
			},
			{
				"title": "<span class='hwCountersHeaders'>Lz</span>",
				"data": "Lz"
			},
			{
				"title": "<span class='hwCountersHeaders'>Execution Median (ms)</span>",
				"data": "executionMedian"
			},
			{
				"title": "<span class='hwCountersHeaders'>Validation Status</span>",
				"data": "validationStatus",
				"render": function (data, type, row) {
							 var text, color;
							 if(data == true){
								 text = 'Passed';
								 color = 'green';
							 }
							 else if(data == false){
								 text = 'Failed';
								 color = 'red';
							 }
							 else{
								 text = 'not set';
								 color = 'black';
							 }
							 var spanHTML = '<span style="color: ' + color + ';" >' + text + '</span>';
							 return spanHTML;
						}
			},
			{
				"title": "<span class='hwCountersHeaders'>Details</span>",
				//"data": "name",
				"render": function (data, type, row) {				
							 var spanHTML = '<span class="confDisplaySpan" style="color: #0071C5; text-decoration: underline; cursor: pointer;" ' +
															 'title="view variables details">' + 'show configuration details' +
													'</span>';
							 return spanHTML;
						}
			},
		];
		
		var tableContainer = document.createElement('div');
		tableContainer.style.marginTop = '15px';
		tableContainer.style.marginLeft = '10px';
		tableContainer.style.marginRight = '10px';
		parent.appendChild(tableContainer);
		
		var table = document.createElement('table');
		table.className = 'display'; //apiTraceTable
		$(tableContainer).append(table);
		
		detailsTableObj = $(table).DataTable({

			"aaData": configurationsArray,
			"columns": columns,
			"bSortClasses": false,
			"scrollY": "100px",
			"bDeferRender": true,
			"processing": true,
			"serverSide": false,
			"bFilter": true,
			"bLengthChange": false,
			"bInfo": false,
			//"scrollY": "280px",
			//"sScrollX": "100%",
			"bPaginate": false,
			//"bInfo": false,
		});
		
		
		$($(table).find('tbody')).on('click', 'span.confDisplaySpan', function () {
			var popupDiv = openOverlayLayout('100%', '100%', true, null, null, null, true);
			popupDiv.style.textAlign = 'left';
			
			var row = detailsTableObj.row($(this).closest('tr'));
			var rowData = row.data();
			createSingleConfigurationRunReport(popupDiv, runData, rowData);
		});
		
		var dataTableObj2 = $(table).dataTable();
		$(window).resize( function () {
			dataTableObj2.fnAdjustColumnSizing();
		});
				
		//resize event:
		window.addEventListener('resize', function (event) {
			resizeTableToFitScreen();
		});
		
		function resizeTableToFitScreen(){
			var scrollBodies = $(parent).find('.dataTables_scrollBody');
			if (scrollBodies != null && scrollBodies.length > 0) {
				var topOffset = $(table).position().top;
				$(scrollBodies[0]).css({ 'height': 'calc(100% - ' + topOffset + 'px - 10px)' });
			}
		}
		
		resizeTableToFitScreen();

		
				
	}
	
}

function TriggerVariableViewerFromSpanData(element, workflowIndex){
	
	if(mode != 'localHost') {
		showUnavailableViewersOverlay();
		return;
	}
	
	var data = $(element).data();
	//images:
	if(data.variabletype == 'image2d_t'){
		var onCloseFunction = function(){
			imageViewer.dispose();
		}
		var overlayDiv = openOverlayLayout('100%','100%', true, onCloseFunction, null, null, true);
		
		var containerDiv = document.createElement('div');
		containerDiv.style.position = 'relative';
		containerDiv.style.width = '100%';
		containerDiv.style.height = '100%';
		overlayDiv.appendChild(containerDiv);
		
		var variablesInfo = [];
		var typeIdentifier;
		var info;
		var extension = '';
		if(data.path != null && data.path.length > 3)
		{
			extension = data.path.toLowerCase().slice(-4);
		}
		if(extension == ".bmp" || extension == ".jpg" || extension == ".jpeg" || extension == ".png")
		{
			typeIdentifier = 'standard';
			info = "";
		}
		else
		{
			typeIdentifier = 'CL';
			info = "image2d_t::" + data.width + "::" + data.height + "::" + data.channelorder + "::" + data.channeltype + "::" + data.rowpitch;
		}
		
		variablesInfo.push({
				"type": "image",
				"typeIdentifier": typeIdentifier,
				"name": data.name,
				"path": data.path,
				"info": info
			});
		
		if(data.refpath != null && data.refpath != ''){
			variablesInfo.push({
				"type": "image",
				"typeIdentifier": typeIdentifier,
				"name": data.name + ' reference',
				"path": data.refpath,
				"info": info,
				"isDisplayed": true
			});
		}
		
		//add the rest of the images as comparables:
		var dataSpans = $(document.body).find('.sectionInfoTable .linkableTextIntelBlue');
		for(var i=0; i<dataSpans.length; i++){
			var comparableData = $(dataSpans[i]).data();
			if(comparableData.variabletype != 'image2d_t' || dataSpans[i] == element){
				continue;
			}

			var comparableTypeIdentifier;
			var comparableInfo;
			var extension = '';
			if(comparableData.path != null && comparableData.path.length > 3)
			{
				extension = comparableData.path.toLowerCase().slice(-4);
			}
			if(extension == ".bmp" || extension == ".jpg" || extension == ".jpeg" || extension == ".png")
			{
				comparableTypeIdentifier = 'standard';
				comparableInfo = "";
			}
			else
			{
				comparableTypeIdentifier = 'CL';
				comparableInfo = "image2d_t::" + comparableData.width + "::" + comparableData.height + "::" +
							comparableData.channelorder + "::" + comparableData.channeltype + "::" + comparableData.rowpitch;
			}
			
			variablesInfo.push({
				"type": "image",
				"typeIdentifier": comparableTypeIdentifier,
				"name": comparableData.name,
				"path": comparableData.path,
				"info": comparableInfo
			});
		}
		var imageViewer = LoadVariablesViewer(containerDiv, JSON.stringify(variablesInfo), overlayDiv.closeButton);
		
		/*imageViewer.mainImageInitializationInfo = {
			"dataType": "image2d_t",
			"path": data.path,
			"name": data.name,
			"width": data.width,
			"height": data.height,
			"channelOrder": data.channelorder,
			"channelType": data.channeltype,
			"rowPitch": data.rowpitch
		};*/
	}
	
	//buffers:
	else if(data.variabletype.toLowerCase().indexOf("image") < 0){//not Image3d_t
		var onCloseFunction = function(){
			bufferViewer.dispose();
		}
		var overlayDiv = openOverlayLayout('100%','100%', true, onCloseFunction, null, null, true);
		
		var containerDiv = document.createElement('div');
		containerDiv.style.position = 'relative';
		containerDiv.style.width = '100%';
		containerDiv.style.height = '100%';
		overlayDiv.appendChild(containerDiv);
		
		var variablesInfo = [];
		
		//add selected buffer to view:
		variablesInfo.push({
				"type": "buffer",
				"name": data.name,
				"dataType": data.variabletype,
				"path": data.path
			});
		
		if(data.refpath != null && data.refpath != ''){
			variablesInfo.push({
				"type": "buffer",
				"name": data.name + ' reference',
				"dataType": data.variabletype,
				"path": data.refpath,
				"isDisplayed": true
			});
		}
		
		//add the rest of the buffers as comparables:
		var dataSpans = $(document.body).find('.sectionInfoTable .linkableTextIntelBlue');
		for(var i=0; i<dataSpans.length; i++){
			var comparableData = $(dataSpans[i]).data();
			if(comparableData.variabletype == 'image2d_t' || dataSpans[i] == element){
				continue;
			}
					
			variablesInfo.push({
				"type": "buffer",
				"name": comparableData.name,
				"dataType": comparableData.variabletype,
				"path": comparableData.path
			});
		}
		
		var bufferViewer = LoadVariablesViewer(containerDiv, JSON.stringify(variablesInfo), overlayDiv.closeButton);	
	}
	else{
		alert('requested image type is not supported.');
	}

}


function showUnavailableViewersOverlay(){
	// create a warning box:
	var overlayDiv = openOverlayLayout('400px','300px', true, null, null, true, null);
    overlayDiv.style.background = '#fcfcfc';
    var title = document.createElement('h2');
    title.innerHTML = 'Viewers unavailable';
    $(overlayDiv).append(title);

    var message = document.createElement('div');
    message.style.textAlign = 'left';
    message.style.marginLeft = '10px';
    message.style.marginRight = '10px';
	
	
	var mainHTML = window.location.pathname;
	//to fix the "%20" added by the browser:
	mainHTML = mainHTML.replace(/%20/gi, " ");
	
	if(mainHTML.startsWith('file:///')){
		mainHTML = mainHTML.replace("file:///", "");
	}
	
	if (window.navigator.userAgent.indexOf("Linux")==-1){//for windows
		while(mainHTML.startsWith('/')){
			mainHTML = mainHTML.substring(1);
		}
	}
	
	var span1 = document.createElement('span');
    span1.innerHTML = "To be able to use the images and buffers viewers " +
								  "please run the following command: <br/>";
								  
	message.appendChild(span1);
	
	var section = document.createElement('div');
	section.className = 'hostProfilingOverviewSection sectionInfoValue';
	section.style.padding = '20px 20px';
	section.style.fontSize = '12px';
	section.title = 'click to copy to clipboard';
	section.className += ' copiable';
	section.style.minHeight = '0px';
	section.style.height = '';
	section.innerHTML = "CBReport -r \"" +mainHTML +"\"";
	section.onclick = function (){ copyToClipboard(section.innerHTML); };
	message.appendChild(section);
	
    $(overlayDiv).append(message);	
}


