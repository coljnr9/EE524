function loadFPGAHomePage(reportItem, mainMenuData){

	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(mainMenuData == null)
	{
		appendCriticalErrorMessage(reportItem , "homePage data is undefined.");
		return;
	}
	
	//var splitView = new SplitView(reportItem, true, true, false, true);
	//var rightView = splitView.getLeftView();
	//var srcView = splitView.getRightView();

	
	//hide the srcViewer (we'll display it on demand):
	//splitView.hideRightSide();
	
	//get the data from file:
	var resourceEstimationData;
	$.ajax({
		url: mainMenuData.summary.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			resourceEstimationData = FPGASummaryCommons.getProcessedData(recievedData);
		},
		error: function(jqxhr, statusText, errorThrown){
			//appendCriticalErrorMessage(reportItem , "Error: failed to retrieve data: " + errorThrown);
		}
	});

	var areaAnalysisData;
	$.ajax({
		url: mainMenuData.FPGAAnalysis.area.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			areaAnalysisData = FPGAAreaAnalysisCommons.getProcessedAreaData(recievedData);
		},
		error: function(jqxhr, statusText, errorThrown){
			//appendCriticalErrorMessage(reportItem , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	
	var loopsAnalysisData;
	$.ajax({
		url: mainMenuData.FPGAAnalysis.loops.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			loopsAnalysisData = FPGALoopsAnalysisCommons.postProcessTableData(recievedData);
		},
		error: function(jqxhr, statusText, errorThrown){
			//appendCriticalErrorMessage(reportItem , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	
	//get the data from file:
	var compilerWarningsData;
	$.ajax({
		url: mainMenuData.warnings.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			compilerWarningsData = FPGACompilerWarningsCommons.getProcessedData(recievedData);
		},
		error: function(jqxhr, statusText, errorThrown){
			//appendCriticalErrorMessage(parent , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	
	
	
	//create a multi-source viewer:
	//var multiSrcView = SharedMultiSrcView.getInstance();
	//multiSrcView.reparentInto(srcView);
	
	
	createFPGAOverviewReport(reportItem, resourceEstimationData, areaAnalysisData, loopsAnalysisData, compilerWarningsData);
	animateEntrance();
	
	
	return;
	
	
	
	
	
	
	//---------------------------------------------------------------------------
	function createFPGAOverviewReport(parent, resourceEstimationData, areaAnalysisData, loopsAnalysisData, compilerWarningsData){

		var layoutWrapper =  document.createElement('table');
		parent.appendChild(layoutWrapper);
		
		layoutWrapper.style.width = '100%';
		var tr = layoutWrapper.insertRow(layoutWrapper.rows.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		var layoutWrapperCell = tr.insertCell(tr.cells.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		
		//table layout:
		var layout = document.createElement('table');
		layout.className = 'hostProfilingOverviewLayout';
		layoutWrapperCell.appendChild(layout);
		var tr;
		
		
		//---------------------- level 1 ----------------------//
		tr = layout.insertRow(layout.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = 'FPGA Analysis Summary:';
		td.className = 'homePageLevelNameText';
		
		tr = layout.insertRow(layout.rows.length);
		
		//loop analysis:
		var loopAnalysisContainer = tr.insertCell(tr.cells.length);
		loopAnalysisContainer.className = 'sectionContainer';
		
		var loopsCount = loopsAnalysisData.valuesFlattened.length;
		if(loopsCount == null) { loopsCount = 0; }
		var minBottleneck = loopsAnalysisData.minBottleneck;
		if(minBottleneck == null) { minBottleneck = "n/a"; }
		var maxBottleneck = loopsAnalysisData.maxBottleneck;
		if(maxBottleneck == null) { maxBottleneck = "n/a"; }
		
		var info = [
						['Loops Count:', loopsCount],
						['Min Bottleneck:', minBottleneck],
						['Max Bottleneck:', maxBottleneck],
					];
		var section = createSection('Loops Analysis', 0, info, null, 'linkable');
		loopAnalysisContainer.appendChild(section);
		
		section.onclick = function(){ mainMenuOpenPage(pagesTitles.FPGALoops); };
		
		
		//area analysis:
		var areaAnalysisContainer = tr.insertCell(tr.cells.length);
		areaAnalysisContainer.className = 'sectionContainer';
		areaAnalysisContainer.colSpan = '2';
		
		var info = [];
		if(areaAnalysisData.partition.values.length > 0){
			info.push(['Board Interface:   ', areaAnalysisData.partition.values[0]['ALUTs'], areaAnalysisData.partition.values[0]['FFs'], areaAnalysisData.partition.values[0]['RAMs'], areaAnalysisData.partition.values[0]['DSPs']]);
		}
		else{
			info.push(['Board Interface:   ', "n/a", "n/a", "n/a", "n/a"]);
		}
		
		info.push(['Globals:', areaAnalysisData.kernelSystem.overall['ALUTs'], areaAnalysisData.kernelSystem.overall['FFs'], areaAnalysisData.kernelSystem.overall['RAMs'], areaAnalysisData.kernelSystem.overall['DSPs']]);
		info.push(['Kernels:', areaAnalysisData.functions.overall['ALUTs'], areaAnalysisData.functions.overall['FFs'], areaAnalysisData.functions.overall['RAMs'], areaAnalysisData.functions.overall['DSPs']]);
		
		var section = createTableSection('Area Analysis', 0, areaAnalysisData.partition.columns, info, null, 'linkable');
		areaAnalysisContainer.appendChild(section);
		
		section.onclick = function(){ mainMenuOpenPage(pagesTitles.FPGAArea); };
		
		//compiler warnings:
		var compilerWarningsContainer = tr.insertCell(tr.cells.length);
		compilerWarningsContainer.className = 'sectionContainer';
		var info = [
							['total warning',  compilerWarningsData.length]
						];
		var section = createSection('Compiler Warnings', 0, info, null, 'linkable');
		compilerWarningsContainer.appendChild(section);
		
		section.onclick = function(){ mainMenuOpenPage(pagesTitles.FPGAComplierWarnings); };
		
		
		//---------------------- level 2 ----------------------//
		tr = layout.insertRow(layout.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = 'Resources Usage:';
		td.className = 'homePageLevelNameText';
		
		tr = layout.insertRow(layout.rows.length);
		
		
		var kernelSummaryContainer = tr.insertCell(0);
		kernelSummaryContainer.colSpan = '4';
		kernelSummaryContainer.className = 'sectionContainer';
		var info = [
							['Board Interface:   ', resourceEstimationData.resources.boardInterface['ALUTs '], resourceEstimationData.resources.boardInterface['FFs  '], resourceEstimationData.resources.boardInterface['RAMs '], resourceEstimationData.resources.boardInterface['DSPs ']],
							['Kernel Subtotal:', resourceEstimationData.resources.kernelSubtotal['ALUTs '], resourceEstimationData.resources.kernelSubtotal['FFs  '], resourceEstimationData.resources.kernelSubtotal['RAMs '], resourceEstimationData.resources.kernelSubtotal['DSPs ']],
							['Total:', resourceEstimationData.resources.total['ALUTs '], resourceEstimationData.resources.total['FFs  '], resourceEstimationData.resources.total['RAMs '], resourceEstimationData.resources.total['DSPs ']],
							['Available:', resourceEstimationData.resources.available['ALUTs '], resourceEstimationData.resources.available['FFs  '], resourceEstimationData.resources.available['RAMs '], resourceEstimationData.resources.available['DSPs ']],

						];
		var section = createTableSection('Estimated Resource Usage Summary', 0, resourceEstimationData.resources.columns, info, null, 'linkable');//data.apiCallsOverview.tipsCount
		kernelSummaryContainer.appendChild(section);
		
		section.onclick = function(){ mainMenuOpenPage(pagesTitles.FPGAResources); };
		
		
		
	}
	
	
	//---------------------------------------------------------------------------
	function animateEntrance(){
		//get a list of all sections (from first to last):
		var sectionsList = $(reportItem).find('.hostProfilingOverviewSection');
		if(sectionsList.length > 0){
			for(var i=0; i<sectionsList.length; i++) (function(i){
				var section = $(sectionsList[i]);
				section.addClass('hidden');
				setTimeout(function(){ section.removeClass('hidden'); }, i * 80);
			})(i);
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
				td.innerHTML = '- ' + info[i][0];
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
	function createTableSection(title, tipsCount, columns, info, keyColumnWidth, sectionClass){
		
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
			var headerRow = infoTable.insertRow(infoTable.rows.length);
			$(headerRow).append('<th></th>');
			for(var i=0; i<columns.length; i++){
				$(headerRow).append('<th class="sectionInfoKey" style="text-align: left;">' + columns[i] + '</th>');
			}
			
			for(var i = 0; i < info.length; i++)(function(i){
				var tr = infoTable.insertRow(infoTable.rows.length);
				
				var td = tr.insertCell(tr.cells.length);
				td.className = 'sectionInfoKey';
				td.innerHTML = '- ' + info[i][0];
				if(keyColumnWidth != null){
					td.style.width = keyColumnWidth;
				}
				
				for(var j=1; j<info[i].length; j++){
					td = tr.insertCell(tr.cells.length);
					td.className = 'sectionInfoValue';
					//td.style.borderLeft = 'solid 1px #cccccc';
					td.style.paddingRight = '20px';
					//td.style.paddingLeft = '4px';
					td.innerHTML = info[i][j];
				}
			})(i);
			
			section.appendChild(infoTable);
		}
		
		return section;
	}
	
	
	
}