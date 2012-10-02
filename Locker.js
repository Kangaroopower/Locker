//Locker- File API library
//CURENTLY IN ALPHA
(function	(window, undefined) {

	//define some variables
	var document = window.document,
		Locker = {
			version: '1.0 Guinea Pig'
		};

	Locker.fileSelect = function (e) {
		var files = e.target.files;
		for (var i = 0, f; f = files[i]; i++) {
			return {
				'name': escape(f.name),
				'type': f.type,
				'size': f.size,
				'lastmodified': f.lastModifiedDate,
				'obj': f

			}
		}
		return false;
	};

	Locker.handleDrag = function (e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};

	Locker.drag = function (dropZone)
		dropZone.addEventListener('dragover', Locker.dragOver, false);
		dropZone.addEventListener('drop', Locker.fileSelect, false);
	};

	Locker.image = function (e) {
		var f = Locker.fileSelect(e).obj;
		if (!f.type.match('image.*')) {
			break;
		}

		var reader = new FileReader();
		reader.readAsDataURL(f);
		reader.onload = (function(theFile) {
			return {
				'file': theFile,
				'name': escape(theFile.name)
			}
		})(f);
	};

	Locker.readBlob = function (el, start, stop) {
		var files = document.querySelector(el).files;
		if (!files.length) {
			alert('Please select a file!');
			return;
		}

		var file = files[0], reader = new FileReader();
		start = parseInt(start) || 0;
		stop = parseInt(stopByte) || file.size - 1;

		reader.onloadend = function(e) {
			if (e.target.readyState == FileReader.DONE) {
				return {
					'content': reader.readAsBinaryString(file.slice(start, stop + 1)),
					'start': start + 1,
					'end': stop + 1,
					'size': file.size
				}
			}
		};
	};

	Locker.readBinary = function (file) {
		var reader = new FileReader();
		return reader.readAsBinaryString(file);
	};

	Locker.readDataURL = function (file) {
		var reader = new FileReader();
		return reader.readAsDataURL(file);
	};

	Locker.readText = function (file) {
		var reader = new FileReader();
		return reader.readAsText(file);
	};

	Locker.readBuffer = function (file) {
		var reader = new FileReader();
		return reader.readAsArrayBuffer(file);
	};

	window.Locker = Locker;
})(window, undefined);