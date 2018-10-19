function loadSessionInfoReport(reportItem, sessionInfo){
	
	//read sessionInfo data:
	$.ajax({
        url: sessionInfo.source,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			buildApplicationInfoReport(data);
        },
        error: function(jqxhr, statusText, errorThrown){
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Application Info\":<br/> \"" + errorThrown + "\".");
        }
    });


//==============================================
// help functions:
//==============================================
	function buildApplicationInfoReport(data){
		
		var vm = new ViewMode(reportItem, 140, 'Session Info:', 'reportTitle');
		reportItem.appendChild(CreateSeperator());
		var tl = new TransitionList(reportItem, '100%', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', null, null);
		
		if(data.generalInfo){
			vm.add('sessionOverview_appInfo', 'Session Info', function () { tl.switchTo('sessionOverview_appInfoPage'); });
			var page1 = tl.addReportToList('sessionOverview_appInfoPage');
			page1.appendChild(createGeneralInfoSection(data.generalInfo, null, data.rerunCommand, data.platformInfo));
		}
		
		if(data.output){
			vm.add('sessionOverview_appOutput', 'Application Output', function () { tl.switchTo('sessionOverview_appOutputPage'); });
			var page2 = tl.addReportToList('sessionOverview_appOutputPage');
			page2.appendChild(createApplicationOutputSection(data.output));
		}
		
		if(data.KDFSessionInfo){
			vm.add('sessionOverview_KDFInfo', 'Session Info', function () { tl.switchTo('sessionOverview_KDFInfoPage'); });
			var page3 = tl.addReportToList('sessionOverview_KDFInfoPage');
			page3.appendChild(createGeneralInfoSection(data.generalInfo, data.KDFSessionInfo, data.rerunCommand, data.platformInfo));
		}
		
		if(data.sourceCode != null){
			vm.add('sessionOverview_source', 'Kernel Code', function () { tl.switchTo('sessionOverview_sourcePage'); });
			var page4 = tl.addReportToList('sessionOverview_sourcePage');
			createSourceCodeViewer(data.sourceCode, page4);
		}
		
	}
	
		
//---------------------------------------------------------------------------
	function createGeneralInfoSection(generalInfo, KDFSessionInfo, rerunCommand, platformInfo){
		
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
		
		//---------------------- level 1 ----------------------//
		tr = layout.insertRow(layout.rows.length);
		
		//application info (CodeAnalyzer mode):
		if(generalInfo != null && KDFSessionInfo == null){
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			var info = [
								['analysis start:', generalInfo.analysisStart, false],
								['executable:', generalInfo.executable, true],
								['arguments:', generalInfo.arguments, true],
								['working directory:', generalInfo.workDir, true],
								['exit code:', generalInfo.exitCode, false]
							];
			var section = createSection('Application Info', null, info, '150px');
			container.appendChild(section);
		}
		
		//KDF session info:
		if(KDFSessionInfo != null){
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			var info = [
								['Analysis start:', KDFSessionInfo.analysisStart, false],
								['Target Machine:', KDFSessionInfo.TargetMachine, true],
								['Platform name:', KDFSessionInfo.PlatformName, true],
								['Device name:', KDFSessionInfo.DeviceName, true],
								['Session architecture:', KDFSessionInfo.SessionArchitecture, false],
								['Build options:', KDFSessionInfo.BuildOptions, true],
								['Global sizes:', KDFSessionInfo.GlobalSize, false],
								['Local sizes:', KDFSessionInfo.LocalSize, false],
								['Iterations:', KDFSessionInfo.Iteration, false],
								['Assigned variables:', KDFSessionInfo.AssignedVariables, false]
							];
			var section = createSection('Session Info', null, info, '150px');
			container.appendChild(section);
		}
		
		//---------------------- level 2 ----------------------//
		tr = layout.insertRow(layout.rows.length);
		
		//analysis rerun:
		if(rerunCommand != null){
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			var section = createSection('Analysis Manual Re-run Command', null, null);
			
			//append text to section:
			var infoTable = document.createElement('table');
			infoTable.className = 'sectionInfoTable';
			var tr = infoTable.insertRow(infoTable.rows.length);
			var rerunCommandContainer = tr.insertCell(tr.cells.length);
			rerunCommandContainer.className = 'sectionInfoValue';
			rerunCommandContainer.innerHTML = rerunCommand;
			rerunCommandContainer.title = 'click to copy to clipboard';
			rerunCommandContainer.className = 'copiable';
			rerunCommandContainer.onclick = function (){ copyToClipboard(rerunCommandContainer.innerHTML); };
			
			
			//additional flags:
			var autoviewFlag = document.createElement('span');
			autoviewFlag.className = 'toggelableText off';
			autoviewFlag.innerHTML = 'auto view';
			autoviewFlag.title = 'automatically open the reports after the analysis is done.';
			section.appendChild(autoviewFlag);
			
			//styling & positioning:
			autoviewFlag.style.position = 'absolute';
			autoviewFlag.style.top = '10px';
			autoviewFlag.style.right = '20px';
			autoviewFlag.style.fontSize = '14px';
			
			//behaviour:
			autoviewFlag.onclick = function(){
				var jqAutoview = $(autoviewFlag);
				if(jqAutoview.hasClass('off')){
					jqAutoview.removeClass('off').addClass('on');
				}
				else{
					jqAutoview.removeClass('on').addClass('off');
				}
				updateRerunCommand();
			};
			
			section.appendChild(infoTable);
			container.appendChild(section);
			
			//HELP FUNCTION:
			function updateRerunCommand(){
				if(rerunCommandContainer == null){
					return;
				}
				//original command:
				rerunCommandContainer.innerHTML = rerunCommand;
				
				//additional flags:
				if($(autoviewFlag).hasClass('on')){
					rerunCommandContainer.innerHTML += ' --autoview';
				}
			}
			
			
		}
		
		//---------------------- level 3 ----------------------//
		/*tr = layout.insertRow();
		
		//platform info:
		if(platformInfo !=null){
			var container = tr.insertCell();
			container.className = 'sectionContainer';
			var info = [
								['platform:', 'HSW', false],
								['Devices:', 'list of devices', true],
								['others:', 'stuff about things...', true]
							];
			var section = createSection('Platform Info', null, info, '90px');
			container.appendChild(section);
		}*/
		
		return layoutWrapper;
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
	function createApplicationOutputSection(output){
		
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
		
		//---------------------- level 1 ----------------------//
		//togglers:
		tr = layout.insertRow(layout.rows.length);
		var td = tr.insertCell(tr.cells.length);
		td.innerHTML = 'filters:';
		td.style.paddingLeft = '30px';
		td.style.fontSize = '14px';
		
		var stdoutToggler = document.createElement('span');
		stdoutToggler.className = 'toggelableText on';
		stdoutToggler.innerHTML = 'stdout';
		stdoutToggler.title = 'show / hide standard output.';
		stdoutToggler.style.paddingLeft = '30px';
		td.appendChild(stdoutToggler);
		stdoutToggler.onclick = function(){
			var jq = $(stdoutToggler);
				if(jq.hasClass('off')){
					jq.removeClass('off').addClass('on');
				}
				else{
					jq.removeClass('on').addClass('off');
				}
			updateApplicationOutputView();
		};
		
		
		var stderrToggler = document.createElement('span');
		stderrToggler.className = 'toggelableText on';
		stderrToggler.innerHTML = 'stderr';
		stderrToggler.title = 'show / hide standard error.';
		stderrToggler.style.paddingLeft = '30px';
		td.appendChild(stderrToggler);
		stderrToggler.onclick = function(){
			var jq = $(stderrToggler);
				if(jq.hasClass('off')){
					jq.removeClass('off').addClass('on');
				}
				else{
					jq.removeClass('on').addClass('off');
				}
			updateApplicationOutputView();
		};
		
		//---------------------- level 2 ----------------------//
		tr = layout.insertRow(layout.rows.length);
		
		//application info:
		var container = tr.insertCell(tr.cells.length);
		container.className = 'sectionContainer';
		var section = createSection('', null, null);
		section.style.padding = '10px 20px';
		section.style.fontSize = '14px';
		section.innerHTML = output;
		container.appendChild(section);
	
	
		//section.appendChild(infoTable);
		container.appendChild(section);
	
		return layoutWrapper;
		
		
		//HELP FUNCTION:
		function updateApplicationOutputView(){
			if($(stdoutToggler).hasClass('on')){
				$(section).find('.stdout').show();
			}
			else{
				$(section).find('.stdout').hide();
			}
			
			if($(stderrToggler).hasClass('on')){
				$(section).find('.stderr').show();
			}
			else{
				$(section).find('.stderr').hide();
			}
		}
		
	}
	
	
	function createSourceCodeViewer(sourceFile, pageItem){
		var sourceWrapper = document.createElement('div');
		sourceWrapper.style.width = '100%';
		sourceWrapper.style.height = '100%';
		pageItem.appendChild(sourceWrapper);
		
		var sourceCode = "";
		var success = false;
		//get and parse the data:
		$.ajax({
			url: sourceFile,
			type: "POST",
			dataType: "text",
			async: false,
			success: function (data) {
				sourceCode = data;
				success = true;
			},
			error: function(jqxhr, statusText, errorThrown){
				appendCriticalErrorMessage(sourceWrapper , "Error: unable to retrieve \"Kernel Code\":<br/> \"" + errorThrown + "\".");
				success = false;
			}
		});
		
		if(success == true) {
			sourceWrapper.appendChild(CreateSrcViewer(sourceCode));
			
			//apply syntax highlighter:
			SyntaxHighlighter.defaults.toolbar = false;
			SyntaxHighlighter.highlight();
		}
		
	
	}
	
	
}

