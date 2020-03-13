const { desktopCapturer, ipcRenderer, remote } = require('electron')
// 记录桌面
const videoElement = document.getElementById('video');
const recordDesktop = async () => {
	let displaymediastreamconstraints = {
		video: {
			displaySurface: 'monitor', // monitor, window, application, browser
			logicalSurface: true,
			cursor: 'always' // never, always, motion
		}
	};
	let stream = await navigator.mediaDevices.getDisplayMedia(displaymediastreamconstraints);
	videoElement.srcObject = stream;
	let recorder = new RecordRTCPromisesHandler(stream, {
		type: 'video'
	});
	recorder.startRecording();
	// navigator.mediaDevices.getUserMedia({ video: true })
	// 	.then(stream => {
	// 		videoElement.srcObject = stream;
	// 	}, error => console.log(error));

	// navigator.mediaDevices.enumerateDevices().then(devices => {
	// 	console.log(devices);
	// 	const cam = devices.find(function (device) {
	// 		return device.kind === "videoinput";
	// 	});
	// 	const mic = devices.find(function (device) {
	// 		return device.kind === "audioinput";
	// 	});
	// 	const constraints = {
	// 		video: cam ? true : false,
	// 		audio: mic ? true : false
	// 	};
	// 	console.log(constraints);
	// 	console.log("getUserMedia start mediaConstraints=" + JSON.stringify(constraints));
	// });

}
let recorder;

const createRecorder = (stream) => {
	log.log(LOG_TYPE.record, 'start record');
	recorder = new MediaRecorder(stream);
	recorder.start();
	recorder.ondataavailable = event => {
		let blob = new Blob([event.data], {
			type: 'video/mp4'
		});
		saveMedia(blob);
	};

}

const saveMedia = (blob) => {
	let reader = new FileReader();
	reader.onload = function () {
		let buffer = new Buffer(reader.result)
		fs.writeFile('demo.mp4', buffer, {}, (err, res) => {
			if (err) {
				console.error(err);
				return
			}
		})
	}
	reader.readAsArrayBuffer(blob);

}


const getMicroAudioStream = () => {
	return navigator.mediaDevices.getUserMedia({ audio: false, video: true })
}


ipcRenderer.send('source-id-selected', 'screen:0:0')

ipcRenderer.on('source-id-selected', (event, options) => {
	console.log("111", event, options);
	desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
		console.log(sources);
		for (const source of sources) {
			if (source.name === 'Electron') {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({
						audio: false,
						video: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: source.id,
								minWidth: 1280,
								maxWidth: 1280,
								minHeight: 720,
								maxHeight: 720
							}
						}
					})
					handleStream(stream)
				} catch (e) {
					handleError(e)
				}
				return
			}
		}
	})
})

function handleStream(stream) {
	const video = document.querySelector('video')
	video.srcObject = stream
	video.onloadedmetadata = (e) => video.play()
}

function handleError(e) {
	console.log(e)
}
// 清理记录
const cleanRecord = () => {
	let video = document.querySelector('video');
	video.controls = false;
	// recordedChunks = []
	// numRecordedChunks = 0
}
document.addEventListener('DOMContentLoaded', () => {
	recordDesktop();
})
