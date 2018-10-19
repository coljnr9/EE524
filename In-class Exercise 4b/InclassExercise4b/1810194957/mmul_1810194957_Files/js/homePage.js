function loadHomePage(reportItem, homePage){

	//read homePage data:
	$.ajax({
        url: homePage.source,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			createAnalysisOverviewReport(data.overview);
			animateEntrance();
        },
        error: function(jqxhr, statusText, errorThrown){
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Home Page\":<br/> \"" + errorThrown + "\".");
        }
    });

	
	//---------------------------------------------------------------------------
	function createAnalysisOverviewReport(data){

		var layoutWrapper =  document.createElement('table');
		reportItem.appendChild(layoutWrapper);
		
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
		td.innerHTML = 'Host Profiling Overview:';
		td.className = 'homePageLevelNameText';
		
		tr = layout.insertRow(layout.rows.length);
		
		//apiCalls:
		if(data.apiCallsOverview != null){
			var apiCallsContainer = tr.insertCell(tr.cells.length);
			apiCallsContainer.className = 'sectionContainer';
			var info = [
								['calls:', data.apiCallsOverview.count],
								['errors:', data.apiCallsOverview.errorsCount],
								['total time:', data.apiCallsOverview.totalTime + ' (ms)']
							];
			var section = createSection('Api Calls', data.apiCallsOverview.tipsCount, info, null, 'linkable');
			apiCallsContainer.appendChild(section);
			
			section.onclick = function(){ mainMenuOpenPage(pagesTitles.apiCalls); };
		}
		
		//memoryCommands:
		if(data.memoryCommandsOverview != null){
			var memoryCommandsContainer = tr.insertCell(tr.cells.length);
			memoryCommandsContainer.className = 'sectionContainer';
			var info = [
								['calls:', data.memoryCommandsOverview.count],
								['errors:', data.memoryCommandsOverview.errorsCount],
								['total time', data.memoryCommandsOverview.totalTime + ' (ms)']
								//['avg bandwidth:', data.apiCallsOverview.avgBandwidth]
							];
			var section = createSection('Memory Commands', data.memoryCommandsOverview.tipsCount, info, null, 'linkable');
			memoryCommandsContainer.appendChild(section);
			
			section.onclick = function(){ mainMenuOpenPage(pagesTitles.memoryCommands); };
		}
		
		//oclObjects:
		if(data.oclObjectsOverview != null){
			var oclObjectsContainer = tr.insertCell(tr.cells.length);
			oclObjectsContainer.className = 'sectionContainer';
			var info = [
								['total objects', data.oclObjectsOverview.count]
							];
			var section = createSection('OpenCL Objects', data.oclObjectsOverview.tipsCount, info, null, 'linkable');
			oclObjectsContainer.appendChild(section);
			
			section.onclick = function(){ mainMenuOpenPage(pagesTitles.oclObjects); };
		}
		
		//---------------------- level 2 ----------------------//
		tr = layout.insertRow(layout.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = 'Kernels Overview:';
		td.className = 'homePageLevelNameText';
		
		tr = layout.insertRow(layout.rows.length);
		
		if(data.kernelsOverview != null){
			var container = tr.insertCell(tr.cells.length);
			container.colSpan = '3';
			container.className = 'sectionContainer';
			
			if(isNaN(parseFloat(data.kernelsOverview.avgEUActive))){
				data.kernelsOverview.avgEUActive = '[N/A]';
			}
			
			if(isNaN(parseFloat(data.kernelsOverview.avgEUStall))){
				data.kernelsOverview.avgEUStall = '[N/A]';
			}
			
			var info = [
								//line1:
								['unique kernels:', data.kernelsOverview.uniqueKernelsCount],
								['total NDRanges:', data.kernelsOverview.NDRangesCount],
								['EU Active (GPU):', data.kernelsOverview.avgEUActive],
								
								//line2:
								['overall time:', data.kernelsOverview.totalTime + ' (ms)'],
								['GPU NDRanges:', data.kernelsOverview.gpuNDRanges],
								['EU Stall (GPU):', data.kernelsOverview.avgEUStall]
							];
			var section = createSection('Kernels Profiling', data.kernelsOverview.tipsCount, null, null, 'linkable');
			
			var infoTable = document.createElement('table');
			infoTable.className = 'sectionInfoTable';
			var keyColumn1Width = '130px', keyColumn2Width = '130px', keyColumn3Width = '140px';;
			
			for(var i = 0; i < info.length; i+=3){
				var td, tr = infoTable.insertRow(infoTable.rows.length);
				
				//entry1:
				td = tr.insertCell(tr.cells.length);//key
				td.className = 'sectionInfoKey';
				td.innerHTML = '- ' + info[i][0];
				td.style.width = keyColumn1Width;
				
				td = tr.insertCell(tr.cells.length);//value
				td.className = 'sectionInfoValue';
				td.innerHTML = info[i][1];
				
				if(i+1 >= info.length){ continue; } //safety.
				td.style.paddingRight = '90px'; //padding.
				
				//entry2:
				td = tr.insertCell(tr.cells.length);//key
				td.className = 'sectionInfoKey';
				td.innerHTML = '- ' + info[i+1][0];
				td.style.width = keyColumn2Width;
				
				td = tr.insertCell(tr.cells.length);//value
				td.className = 'sectionInfoValue';
				td.innerHTML = info[i+1][1];
				
				if(i+2 >= info.length){ continue; } //safety.
				td.style.paddingRight = '90px'; //padding.
				
				//entry2:
				td = tr.insertCell(tr.cells.length);//key
				td.className = 'sectionInfoKey';
				td.innerHTML = '- ' + info[i+2][0];
				td.style.width = keyColumn3Width;
				
				td = tr.insertCell(tr.cells.length);//value
				td.className = 'sectionInfoValue';
				td.innerHTML = info[i+2][1];
			}
			
			section.appendChild(infoTable);
			
			
			//hottest kernels:
			if(data.kernelsOverview.hottestKernels != null){
			
				//todo: implement.
				//section.appendChild(infoTable);
			
			}
			
			container.appendChild(section);
			
			section.onclick = function(){ mainMenuOpenPage(pagesTitles.kernelsOverview); };
		}
		
		
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
	
	
	
}