const fs = require('fs');
const ffmpeg = require('ffmpeg');
document.addEventListener('DOMContentLoaded', () => {
	readVideo();
})

const readVideo = () => {
	const files = fs.readdirSync('./src/video', () => { });
	console.log(files)
	const fileReader = new FileReader();
	const videoPath = './src/video/' + files[0];
	// fileReader.readAsBinaryString('./src/video/' + files[0]);
	// fileReader.onload = data => {
	// 	console.log(fileReader.result)
	// }

	try {
		fs.readFile(videoPath, function(err, data){
			console.log(data);
		})
	} catch (e) {
		console.log(e.code);
		console.log(e.msg);
	}
}