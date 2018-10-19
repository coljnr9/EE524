
function LoadVariablesViewer(reportItem, variablesInputAsText, customCloseButtonElement){
	
	//parse input:
	var variablesArray;
	try{
		variablesArray = JSON.parse(variablesInputAsText);
	}
	catch(ex){
		appendCriticalErrorMessage(reportItem , "Error: Variables info badly formatted: " + ex);
		return;
	}
	
	if(variablesArray.length == 0){
		appendCriticalErrorMessage(reportItem , "there are no variables to show.");
		return;
	}
	
	var mainVariable = variablesArray[0];
		
	//image2d:
	if(mainVariable.type == 'image'){
		//add selected image to view:
		var imageViewer = new ImageViewer(reportItem, false, customCloseButtonElement);
		var requestStr = 'ImageViewer?add=' + mainVariable.name + '&' + mainVariable.path + '&' +  mainVariable.typeIdentifier + '&' + mainVariable.info;
		imageViewer.AddImage(requestStr, mainVariable.name);
		
	
		//add the rest of the images as comparables:
		for(var i=1; i<variablesArray.length; i++){
			var comparableData = variablesArray[i];
			if(comparableData.type != 'image' || comparableData.name == mainVariable.name){
				continue;
			}
			imageViewer.addComparableImage(comparableData.path, comparableData.name, comparableData.typeIdentifier, comparableData.info);
			
			if(comparableData.isDisplayed == true){
				var comparableRequestStr = 'ImageViewer?add=' + comparableData.name + '&' + comparableData.path + '&' + comparableData.typeIdentifier + '&' + comparableData.info;
				imageViewer.AddImage(comparableRequestStr, comparableData.name);
			}
		}
		
		return imageViewer;
	}
	
	//buffers:
	else if(mainVariable.type.toLowerCase().indexOf("image") < 0){//not Image3d_t
		//add selected buffer to view:
		var bufferViewer = new BufferViewer(reportItem, false, customCloseButtonElement);
		bufferViewer.AddBuffer(mainVariable.name, mainVariable.path, mainVariable.dataType);
		
		//add the rest of the buffers as comparables:
		for(var i=1; i<variablesArray.length; i++){
			var comparableData = variablesArray[i];
			if(comparableData.type == 'image' || comparableData.name == mainVariable.name){
				continue;
			}
			bufferViewer.addComparableBuffer(comparableData.path, comparableData.name, comparableData.dataType);
			if(comparableData.isDisplayed == true){
				bufferViewer.AddBuffer(comparableData.name, comparableData.path, comparableData.dataType);
			}
		}
		
		return bufferViewer;
	}
	else{
		alert('requested image type is not supported.');
		return null;
	}

	
}

