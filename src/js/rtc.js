let video = document.getElementById("video");
let videoStart = false;
let recorder;

function invokeGetDisplayMedia(success, error) {
	let displaymediastreamconstraints = {
		video: {
			displaySurface: 'monitor', // monitor, window, application, browser
			logicalSurface: true,
			cursor: 'always' // never, always, motion
		}
	};
	// above constraints are NOT supported YET
	// that's why overridnig them
	displaymediastreamconstraints = {
		video: true
	};
	if (navigator.mediaDevices.getDisplayMedia) {
		navigator.mediaDevices.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
	} else {
		navigator.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
	}
}
function captureScreen(callback) {
	this.invokeGetDisplayMedia((screen) => {
		this.addStreamStopListener(screen, () => {
			//
		});
		callback(screen);
	}, function (error) {
		console.error(error);
		alert('Unable to capture your screen. Please check console logs.\n' + error);
	});
}
function addStreamStopListener(stream, callback) {
	stream.addEventListener('ended', function () {
		callback();
		callback = function () { };
	}, false);
	stream.addEventListener('inactive', function () {
		callback();
		callback = function () { };
	}, false);
	stream.getTracks().forEach(function (track) {
		track.addEventListener('ended', function () {
			callback();
			callback = function () { };
		}, false);
		track.addEventListener('inactive', function () {
			callback();
			callback = function () { };
		}, false);
	});
}
function startRecording() {
	captureScreen(screen => {
		video.srcObject = screen;
		recorder = RecordRTC(screen, {
			type: 'video',
			mimeType: 'video/webm;codecs=h264',
		});
		recorder.startRecording();
		// release screen on stopRecording
		recorder.screen = screen;
		videoStart = true;
	});
}
//结束时下载到本地
function stopRecordingCallback() {
	video.src = video.srcObject = null;
	video.src = URL.createObjectURL(recorder.getBlob());
	console.log(video.src);
	let downloadLink = document.createElement('a');
	downloadLink.href = URL.createObjectURL(recorder.getBlob());
	downloadLink.download = "录屏.mp4";
	downloadLink.click();
	recorder.screen.stop();
	recorder.destroy();
	recorder = null;
	videoStart = false;
}
function stopRecording() {
	recorder.stopRecording(this.stopRecordingCallback);
}