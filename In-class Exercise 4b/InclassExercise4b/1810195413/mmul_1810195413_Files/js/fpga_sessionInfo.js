function loadFPGAGeneralInfoReport(reportItem, sessionInfo){
	
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
		
		var generalInfoSection = createGeneralInfoSection(data.rows);
		reportItem.appendChild(generalInfoSection);

	}
	
		
//---------------------------------------------------------------------------
	function createGeneralInfoSection(generalInfo){
		
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
		
		if(generalInfo != null && generalInfo.length != 0){
			var container = tr.insertCell(tr.cells.length);
			container.className = 'sectionContainer';
			var info = [];
			for(var i=0; i<generalInfo.length; i++)
			{
				var entry = generalInfo[i];
				info.push([entry.name + ':', entry.data[0], true]);
			}
			
			var section = createSection('Session Info', null, info, '220px');
			container.appendChild(section);
		}
		
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
	
}






function loadFPGAOpenCLSourcesReport(reportItem){
	var multiSrcView = SharedMultiSrcView.getInstance();
	multiSrcView.reparentInto(reportItem);
}

