function loadKernelReport(reportItem, kernelData){
	
	//check if report's data exists:
	var reportData =readAjaxData(kernelData.filesDirName + "/main.ajax");
	if(reportData == null){
		if(kernelData.KBSKernelName == null || kernelData.KBSConfiguration == null){
			appendCriticalErrorMessage(reportItem , "Error: Data corruption! missing analysis command info.");
		}
		else{
			var desabledData =readAjaxData(filesBaseDir + "/data/disableDeep.ajax");
			if(desabledData != null){
				displayDeepIsDisabled(reportItem, kernelData.KBSKernelName, kernelData.KBSConfiguration);
				return;
			}
			displayNotAnalyzedYet(reportItem, kernelData.KBSKernelName, kernelData.KBSConfiguration);
		}
		return; //stop
	}
	
	
	//data exists, build the report:
	if(!kernelData.lastState){
		kernelData.lastState = { 'activePage': null };
	}
	
	var reportTitle = kernelData.kernelUniqueName;
	var vm = new ViewMode(reportItem, '250px', reportTitle + ':', 'reportTitle');
	reportItem.appendChild(CreateSeperator());
	var tl = new TransitionList(reportItem, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', onPageLoad, onPageDispose);
	
	//ids:
	//var vm1_id = 'kernelAnalysis_overview', page1_id = vm1_id+'Page';
	var vm2_id = 'kernelAnalysis_occupancy', page2_id = vm2_id+'Page';
	var vm3_id = 'kernelAnalysis_latency', page3_id = vm3_id+'Page';
	var vm4_id = 'kernelAnalysis_memoryDiagram', page4_id = vm4_id+'Page';
	
	//============ create pages ============
	/*f(reportData.overview){
		vm.add(vm1_id, 'Overview', function () { tl.switchTo(page1_id); });
		var page1 = tl.addReportToList(page1_id);
		page1.loadingFunc = function(){ buildKernelOverviewReport(reportData.overview, page1); };
		
		//last state:
		if(kernelData.lastState && kernelData.lastState.activePage == page1_id){
			page1.loadingFunc();
		}
	}//-------------------------------------
	*/
	
	if(reportData.occupancy != null && reportData.occupancy.source != null){
		vm.add(vm2_id, 'Occupancy', function () { tl.switchTo(page2_id); });
		var page2 = tl.addReportToList(page2_id);
		if(kernelData.lastState.occupancy == null) {	kernelData.lastState.occupancy = {}; };
		page2.loadingFunc = function(){ buildKernelOccupancyReport(reportData.occupancy, page2, kernelData.lastState.occupancy); };
		
		//last state:
		if(kernelData.lastState && kernelData.lastState.activePage == page2_id){
			//vm.setFocusOn(vm2_id);
			page2.loadingFunc();
		}
	}//-------------------------------------

	if(reportData.latency != null && reportData.latency.source != null){
		vm.add(vm3_id, 'Latency', function () { tl.switchTo(page3_id); });
		var page3 = tl.addReportToList(page3_id);
		if(kernelData.lastState.latency == null) {	kernelData.lastState.latency = {}; };
		page3.loadingFunc = function(){ buildKernelLatencyReport(reportData.latency, page3, kernelData.lastState.latency); };
		
		//last state:
		if(kernelData.lastState && kernelData.lastState.activePage == page3_id){
			if(reportData.occupancy != null && reportData.occupancy.source == null){
				page3.loadingFunc();
				//vm.setFocusOn(vm3_id);//todo: instead of this, check if there's no occupancy tab! (currently it does Double-Load).
			}
			else{
				vm.setFocusOn(vm3_id);
			}
		}
	}//-------------------------------------
	
	if(reportData.memdiagram != null && reportData.memdiagram.source != null){
		vm.add(vm4_id, 'Hardware Counters', function () { tl.switchTo(page4_id); });
		var page4 = tl.addReportToList(page4_id);
		if(kernelData.lastState.memdiagram == null) {	kernelData.lastState.memdiagram = {}; };
		page4.loadingFunc = function(){ buildKernelCounterReport(reportData.memdiagram, page4, kernelData.lastState.memdiagram); };
		
		//last state:
		if(kernelData.lastState && kernelData.lastState.activePage == page4_id){
			if(reportData.occupancy != null && reportData.occupancy.source != null){
				page4.loadingFunc();
				vm.setFocusOn(vm4_id);//todo: instead of this, check if there's no occupancy tab! (currently it does Double-Load).
			}
			else{
				vm.setFocusOn(vm4_id);
			}
		}
	}//-------------------------------------
	
	
	vm.autoSetWidth(125);
	
	//if no last-state set yet, set it to be the first:
	if(kernelData.lastState.activePage == null && tl.itemsCount > 0){
		var firstPageId = tl.callLoadOnFirstItem();
		kernelData.lastState.activePage = firstPageId;
	}
	
	
	addEditKernelButtonIfcanEditKernels(reportItem);
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	/*****************************************/
	/* Help functions */
	/*****************************************/
	function addEditKernelButtonIfcanEditKernels(parent){
		$.ajax({
				url: "KernelAnalysis?canEditKernels",
				type: "POST",
				async: true,
				dataType: "text",
				success: function () {
					var editButton = CreateEditKernelButton();
					editButton.style.position = 'absolute';
					editButton.style.top = '10px';
					editButton.style.right = '60px';
					editButton.onclick = function(){
						EditKernel(kernelData.KBSKernelName, kernelData.KBSConfiguration, 
									  kernelData.KBFilename, kernelData.KBFolderName, kernelData.KBSessionName);
					};
					parent.appendChild(editButton);
				},
				error: function () {}
			});
	}

	function EditKernel(KBSKernelName, KBSConfiguration, KBFilename, KBFolderName, KBSessionName){
		appendLoadingMessage(document.body);
		$.ajax({
			url: "KernelAnalysis?EditKernel=" + KBSKernelName + '&' + KBSConfiguration + '&' + KBFilename
													   + '&' + KBFolderName + '&' + KBSessionName,
			type: "POST",
			async: true,
		dataType: "text",
		success: function () {
			removeLoadingMessage(document.body);
		},
		error: function () {
			removeLoadingMessage(document.body);
		}
	});
}

	function CreateEditKernelButton(){
		var button = document.createElement('span');
		button.className = 'editKernelButton';
		button.innerHTML = 'Edit Kernel';
		button.title = 'You can edit your kernel and rerun the analysis on it.\n' +
						   'Very useful when trying to improve the perfomance of your kernels.';
						   
		return button;
	}

	
	
	function displayDeepIsDisabled(reportItem, KBSKernelName, KBSConfiguration){
		
		var layoutWrapper =  document.createElement('table');
		layoutWrapper.style.width = '100%';
		reportItem.appendChild(layoutWrapper);
		var tr = layoutWrapper.insertRow(layoutWrapper.rows.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		var layoutWrapperCell = tr.insertCell(tr.cells.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		
		//table layout:
		var layout = document.createElement('table');
		layout.className = 'hostProfilingOverviewLayout';
		layoutWrapperCell.appendChild(layout);
		var tr;

		tr = layout.insertRow(layout.rows.length);
		var container = tr.insertCell(tr.cells.length);
		container.style.textAlign = 'center';
		container.style.position = 'relative';
		
		var headerText = document.createElement('div');
		container.appendChild(headerText);
		headerText.innerHTML = 'Session has been modified and the analysis input aren\'t relavent anymore!<br>' +
                               'Deep analysis for kernel "' + KBSKernelName + '" has been disabled.';
		headerText.style.fontSize = '16px';
		headerText.style.paddingTop = '50px';
		headerText.style.paddingBottom = '30px';
		headerText.style.color = 'gray';
		
		
		
		
	}
	
	function displayNotAnalyzedYet(reportItem, KBSKernelName, KBSConfiguration){
		
		var layoutWrapper =  document.createElement('table');
		layoutWrapper.style.width = '100%';
		reportItem.appendChild(layoutWrapper);
		var tr = layoutWrapper.insertRow(layoutWrapper.rows.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		var layoutWrapperCell = tr.insertCell(tr.cells.length);
		tr.insertCell(tr.cells.length).style.width = '3%';
		
		//table layout:
		var layout = document.createElement('table');
		layout.className = 'hostProfilingOverviewLayout';
		layoutWrapperCell.appendChild(layout);
		var tr;

		updateMode();

		if(mode == 'localHost') {
			
			addEditKernelButtonIfcanEditKernels(layout);
			
			tr = layout.insertRow(layout.rows.length);
			var container = tr.insertCell(tr.cells.length);
			container.style.textAlign = 'center';
			container.style.position = 'relative';
			
			var headerText = document.createElement('div');
			container.appendChild(headerText);
			headerText.innerHTML = '"' + KBSKernelName + '" has not been analyzed yet, click below to start kernel analysis.<br>';
			headerText.style.fontSize = '16px';
			headerText.style.paddingTop = '50px';
			headerText.style.paddingBottom = '30px';
			headerText.style.color = 'gray';
			
			var launchButtonContainer = document.createElement('div');
			launchButtonContainer.style.paddingTop = '150px';
			
			container.appendChild(launchButtonContainer);
			
			var launchSpan = document.createElement('span');
			launchSpan.className = 'deepAnalysisLauncher';
			launchButtonContainer.appendChild(launchSpan);
			launchSpan.innerHTML = 'Launch analysis';

			launchSpan.onclick = function(){
				$(reportItem).empty();
				
				//check if it has been disabled in the time it was opened:
				var desabledData =readAjaxData(filesBaseDir + "/data/disableDeep.ajax");
				if(desabledData != null){
					displayDeepIsDisabled(reportItem, kernelData.KBSKernelName, kernelData.KBSConfiguration);
					return;
				}
				
				//send launch request to parent:
				var iterationsCount = null;
				var Lx = null;
				var Ly = null;
				var Lz = null;
				
				if(kernelData.Lx && kernelData.Lx != ""){
					Lx = kernelData.Lx;
				}
				if(kernelData.Ly && kernelData.Ly != ""){
					Ly = kernelData.Ly;
				}
				if(kernelData.Lz && kernelData.Lz != ""){
					Lz = kernelData.Lz;
				}
									
				//window.external.launchKernelAnalysis(KBSKernelName, KBSConfiguration, kernelData.KBFilename, kernelData.KBFolderName, 
				//							kernelData.KBSessionName, kernelData.filesDirName, iterationsCount, Lx, Ly, Lz);
											
				var criticalError = false;	
				$.ajax({
					url: 'KernelAnalysis?launchKernelAnalysis=' + KBSKernelName + '&' + KBSConfiguration + '&' + kernelData.KBFilename + '&' + kernelData.KBFolderName + '&' +
											kernelData.KBSessionName + '&' + kernelData.filesDirName + '&' + iterationsCount + '&' + Lx + '&' + Ly + '&' + Lz + '&' +
											kernelData.doOccupancy + '&' + kernelData.doLatency,
					type: "POST",
					async: false,
					dataType: "text",
					success: function (data) {
					},
					error: function (jqxhr, statusText, errorThrown){
						criticalError = true;
						alert(errorThrown);
					}
				});
					
				if(criticalError == true){
					return;
				}

				
				//cover / disable top menu selections:
				var menuCover = document.createElement('div');
				menuCover.style.position = 'fixed';
				menuCover.style.width = '100%';
				menuCover.style.height = '50px';
				menuCover.style.top = '0px';
				menuCover.style.left = '0px';
				menuCover.style.zIndex = '9999999999';
				menuCover.style.background = 'white';
				menuCover.style.opacity = '0.5';
				
				document.body.appendChild(menuCover);
				
				$(menuCover).hide();
				$(menuCover).fadeIn(100);
				
				//create progrss & cancelation layout:
				var layoutWrapper =  document.createElement('table');
				layoutWrapper.style.width = '100%';
				reportItem.appendChild(layoutWrapper);
				var tr = layoutWrapper.insertRow(layoutWrapper.rows.length);
				tr.insertCell(tr.cells.length).style.width = '10%';
				var layoutWrapperCell = tr.insertCell(tr.cells.length);
				tr.insertCell(tr.cells.length).style.width = '10%';
				
				//table layout:
				var layout = document.createElement('table');
				layout.className = 'hostProfilingOverviewLayout';
				layoutWrapperCell.appendChild(layout);
				var tr = layout.insertRow(layout.rows.length);
				var td = tr.insertCell(tr.cells.length);
				
				var container = document.createElement('div');
				td.appendChild(container);
				container.className = 'deepAnalysisProgressContainer';
				
				var headerTitle = document.createElement('span');
				headerTitle.className = 'headerTitle progressbarGroup';
				container.appendChild(headerTitle);
				
				var progressHeader = document.createElement('span');
				progressHeader.className = 'headerStatus progressbarGroup';
				container.appendChild(progressHeader);
				
				var progress = document.createElement('div');
				progress.className = 'progress progressbarGroup';
				container.appendChild(progress);
								
				var number = document.createElement('span');
				number.className = 'number progressbarGroup';
				container.appendChild(number);
				
				var currentNumber = document.createElement('span');
				currentNumber.id = 'number-current';
				currentNumber.className = 'number-current progressbarGroup';
				number.appendChild(currentNumber);
				
				var totalNumber = document.createElement('span');
				totalNumber.id = 'number-total';
				totalNumber.className = 'number-total progressbarGroup';
				number.appendChild(totalNumber);
				
				//hide progress bar container until we verify that we can receive progress signals.
				$(container).find('.progressbarGroup').css({'visibility': 'hidden'});
				
				var totalSteps = 0;
				if(kernelData.doOccupancy == true){
					totalSteps = totalSteps + 2;
				}
				if(kernelData.doLatency == true){
					totalSteps = totalSteps + 2;
				}
				
				var currentStep = 0;
				totalNumber.innerHTML = totalSteps;
				//currentNumber.innerHTML = 0;
				updateProgress(currentStep);
				
				function updateProgress(stepNum){
					progress.style.width = (stepNum)* ( 100 / totalSteps ) + '%';
					currentNumber.innerHTML = stepNum;
				}
				
				//loading img:
				var loadingImg = document.createElement('img');
				container.appendChild(loadingImg);
				loadingImg.className = 'loadingImage';
				loadingImg.src = filesBaseDir + '/resources/loading.gif';
				
				var cancelAnalysisSpanContainer = document.createElement('div');
				cancelAnalysisSpanContainer.style.paddingTop = '5px';
				container.appendChild(cancelAnalysisSpanContainer);
				
				var cancelAnalysisSpan = document.createElement('span');
				cancelAnalysisSpan.className = 'cancelAnalysisSpan';
				container.appendChild(cancelAnalysisSpan);
				
				
				cancelAnalysisSpan.innerHTML = 'cancel analysis';
				
				cancelAnalysisSpan.onclick = function(){
					
				var criticalError = false;
				$.ajax({
					url: 'KernelAnalysis?cancelAnalysis',
					type: "POST",
					async: true,
					dataType: "text",
					success: function (data) {
					},
					error: function (jqxhr, statusText, errorThrown){
						alert('failed to cancel analysis');
					}
				});
					
				if(criticalError == true){
					return;
				}
					
				}
				
				headerTitle.innerHTML = 'Analyzing kernel "' + KBSKernelName +'"...';
				progressHeader.innerHTML = 'preparing analysis, please wait...';
				
				fetchProgressUpdate();
				
				//get the analysis progress (async request):
				function fetchProgressUpdate(){
					
					$.ajax({
						url: 'KernelAnalysis?getProgressStatus',
						type: "POST",
						async: true,
						dataType: "json",
						success: function (data) {
							$(container).find('.progressbarGroup').css({'visibility': ''});//if we're receiving signals, show progress bar container.
							//alert('signal received: ' + JSON.stringify(data));
							if(data.title != null){
								headerTitle.innerHTML = data.title;
							}
							
							if(data.header != null){
								progressHeader.innerHTML = data.header;
							}
							
							if(data.step != null && data.step == true){
								currentStep++;
								updateProgress(currentStep);
							}
							
							if(data.done != null && data.done == true){
								$(reportItem).empty();
								loadKernelReport(reportItem, kernelData);
								$(menuCover).remove();
								
								//errors?
								if(data.errors != null && data.errors.trim() != ''){
									alert(data.errors);
								}
								return;
							}
							
							if(data.canceled != null && data.canceled == true){
								$(cancelAnalysisSpan).hide();
								headerTitle.innerHTML = 'Canceling analysis.';
								progressHeader.innerHTML = 'cleaning up temp file, please wait....';
								currentStep = 0;
								updateProgress(currentStep);
							}
							
							fetchProgressUpdate();
							
						},
						error: function (jqxhr, statusText, errorThrown){
							console.log('an error occured while waiting for progressUpdate:\n' + errorThrown);
							alert('failed to get analysis signal: ' + errorThrown);
							//todo: some test to determin if to retry or not:
							if(false){
								//retry:
								fetchProgressUpdate();
							}
						}
					});
					
				}
				
				
			}
			
		}
		
		//Browser mode:
		else{
			tr = layout.insertRow(layout.rows.length);
			
			//---------------------- level 1 ----------------------//
			tr = layout.insertRow(layout.rows.length);
			var td = tr.insertCell(tr.cells.length);
			td.innerHTML = '"' + KBSKernelName + '" has not been analyzed yet. please manually run the following command:';
			//td.style.paddingLeft = '20px';
			td.style.textAlign = 'center';
			td.style.fontSize = '16px';
			td.style.paddingTop = '50px';
			td.style.paddingBottom = '30px';
			
			//---------------------- level 2 ----------------------//
			tr = layout.insertRow(layout.rows.length);
			//application info:
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			var section = createSection('', null, null);
			section.style.padding = '20px 20px';
			section.style.fontSize = '12px';
			section.title = 'click to copy to clipboard';
			section.className += ' copiable';
			section.onclick = function (){ copyToClipboard(section.innerHTML); };
			container.appendChild(section);
			
			//============ analysis-types flags ============
			var switchesHeader = document.createElement('span');
			//switchesHeader.className = 'toggelableText on';
			switchesHeader.innerHTML = '- Enable/disable analysis types:';
			//switchesHeader.title = 'makes sure your working directory / export path matches the report\'s expectations.';
			container.appendChild(switchesHeader);
			
			//styling & positioning:
			switchesHeader.style.fontSize = '13px';
			switchesHeader.style.paddingLeft = '15px';//'50px';
			switchesHeader.style.paddingTop = '10px';
			
			
			var runOccupancy;
			if(kernelData.doOccupancy == true){
				runOccupancy = document.createElement('span');
				runOccupancy.className = 'toggelableText on';
				runOccupancy.innerHTML = 'occupancy';
				//runOccupancy.title = 'makes sure your working directory / export path matches the report\'s expectations.';
				container.appendChild(runOccupancy);
				
				//styling & positioning:
				runOccupancy.style.fontSize = '13px';
				runOccupancy.style.paddingLeft = '15px';
				runOccupancy.style.paddingTop = '10px';
				
				//behaviour:
				runOccupancy.onclick = function(){
					var jq = $(runOccupancy);
					if(jq.hasClass('off')){
						jq.removeClass('off').addClass('on');
					}
					else{
						jq.removeClass('on').addClass('off');
					}
					updateKernelAnalysisCommand();
				};
			}
			
			var runLatency;
			if(kernelData.doLatency == true){
				runLatency = document.createElement('span');
				runLatency.className = 'toggelableText on';
				runLatency.innerHTML = 'latency';
				//runLatency.title = 'makes sure your working directory / export path matches the report\'s expectations.';
				container.appendChild(runLatency);
				
				//styling & positioning:
				runLatency.style.fontSize = '13px';
				runLatency.style.paddingLeft = '15px';
				runLatency.style.paddingTop = '10px';
				
				//behaviour:
				runLatency.onclick = function(){
					var jq = $(runLatency);
					if(jq.hasClass('off')){
						jq.removeClass('off').addClass('on');
					}
					else{
						jq.removeClass('on').addClass('off');
					}
					updateKernelAnalysisCommand();
				};
			}
			
			var force = document.createElement('span');
			force.className = 'toggelableText on';
			force.innerHTML = 'override existing analysis results';
			force.title = 'overrides the existing results (of the previous analysis).';
			container.appendChild(force);
			
			//styling & positioning:
			force.style.position = 'absolute';
			force.style.top = '122px';
			force.style.right = '10%';
			force.style.fontSize = '13px';
			//force.style.paddingRight = '15px';//'50px';
			//force.style.paddingTop = '10px';
			
			//behaviour:
			force.onclick = function(){
				var jq = $(force);
				if(jq.hasClass('off')){
					jq.removeClass('off').addClass('on');
				}
				else{
					jq.removeClass('on').addClass('off');
				}
				updateKernelAnalysisCommand();
			};
			
			updateKernelAnalysisCommand();
			
			//section.appendChild(infoTable);
			container.appendChild(section);
			
			
			
			
			
			//---------------------- level 3 ----------------------//
			//tr = layout.insertRow();
			tr = layout.insertRow(layout.rows.length);
			var td = tr.insertCell(tr.cells.length);
			//td.style.paddingLeft = '20px';
			td.style.textAlign = 'center';
			td.style.fontSize = '16px';
			td.style.paddingTop = '50px';
			td.style.paddingBottom = '30px';

			var loadResultsSpan = document.createElement('span');
			loadResultsSpan.className = 'deepAnalysisLauncher';
			td.appendChild(loadResultsSpan);
			loadResultsSpan.innerHTML = 'Load analysis results';
			loadResultsSpan.title = 'click this after the manual analysis command is done to load the results.';

			loadResultsSpan.onclick = function(){
				$(reportItem).empty();
				loadKernelReport(reportItem, kernelData);
				return;
			};
			
			return layoutWrapper;
			
		}
		
		
		
		function updateKernelAnalysisCommand(){
			if(section == null){
					return;
				}
				
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
				
				var folderEndIndex = mainHTML.lastIndexOf("/");
				var baseDir = mainHTML.substring(0, folderEndIndex) + '/';

				var outputDir = kernelData.filesDirName;
				
				function isNullOrEmpty(value){
					return value == null || value == '';
				}
				
				var locals = '';
				if(!isNullOrEmpty(kernelData.Lx) || !isNullOrEmpty(kernelData.Ly) || !isNullOrEmpty(kernelData.Lz)){
					var Lx = '0', Ly = '0', Lz = '0';
					
					if(!isNullOrEmpty(kernelData.Lx)){
						Lx = kernelData.Lx;
					}
					if(!isNullOrEmpty(kernelData.Ly)){
						Ly = kernelData.Ly;
					}
					if(!isNullOrEmpty(kernelData.Lz)){
						Lz = kernelData.Lz;
					}
					locals = ' --locals "' + Lx + ';' + Ly + ';' + Lz + '"';
				}
				
				
				
				var preCommand = '';
				//if (window.navigator.userAgent.indexOf("Linux")!=-1){
				//	preCommand = 'mono ';
				//}
				
				//original command:
				section.innerHTML = preCommand + 'CodeBuilder analyze-kernel -k "' + KBSKernelName + '" -c "' + KBSConfiguration + '" -s "' + kernelData.KBFilename +
											'" -o "' + outputDir + '" --mainhtml "' + mainHTML + '"' + locals;
				
				//analysis types flags:
				if(runOccupancy != null && $(runOccupancy).hasClass('on')){
					section.innerHTML += ' --occupancy';
				}
				if(runLatency != null && $(runLatency).hasClass('on')){
					section.innerHTML += ' --latency';
				}
				
				//additional flags
				if($(force).hasClass('on')){
					section.innerHTML += ' -f';
				}
		}
		
		
		//---------------------------------------------------------------------------------------------------
		function createSection(title, tipsCount, info, keyColumnWidth){
			
			var section = document.createElement('div');
			section.className = 'hostProfilingOverviewSection';
			
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
	
	
	function readAjaxData(source){
		//basic check:
		if(source == null){
			return null;
		}
		
		//get and parse the data:
		var ajaxData = null;
		
		$.ajax({
			url: source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				ajaxData = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				ajaxData = null;
				//appendCriticalErrorMessage(reportItem , "Error: unable to retrieve Kernel's data:<br/> \"" + errorThrown + "\".");
			}
		});
		
		return ajaxData;
	}
	
	function buildKernelOverviewReport(overviewData, page){
		page.innerHTML = JSON.stringify(overviewData);
	}
	
	
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
		kernelData.lastState.activePage = id;
		
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
		
		//if(id == page1_id){
			//todo.
		//}
		
		if(id == page2_id){
			//todo.
		}
		
		//call the item's special dispose function (if it has any):
		if (typeof page.onItemDispose == 'function') {
			page.onItemDispose();
		}
		
		$(page).empty();
	}
	
	reportItem.onItemDispose = function(){
		var activePage = tl.getCurrentItem();
		onPageDispose(activePage.id);
	}
	
	
	
	
	
	
	
	
}
