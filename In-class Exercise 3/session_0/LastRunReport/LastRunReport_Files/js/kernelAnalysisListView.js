function loadKernelAnalysisListViewReport(reportItem, kernelAnalysisListView){

	//fill kernelAnalysisListView data:
	var infoDiv = document.createElement('div');
	infoDiv.innerHTML = JSON.stringify(kernelAnalysisListView);
	reportItem.appendChild(infoDiv);
	
}
