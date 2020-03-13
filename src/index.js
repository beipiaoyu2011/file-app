import {
	app,
	BrowserWindow,
	Notification,
	Menu,
	ipcMain
} from 'electron';
const exec = require('child_process').execFile;
const path = require('path')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

// 检查进程是否存在
const checkProcessStatus = function (options) {
	const name = options.name;
	const cb = options.cb || function () { };
	let cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux';
	exec(cmd, function (err, stdout, stderr) {
		if (err) {
			return console.error(err)
		}
		const isExist = stdout.includes(name);
		console.log(name, isExist);
		if (!isExist) {
			cb();
		} else {
			console.log(name, "isExist");
		}
	});
}

// 执行依赖 EXE
const execFun = function () {
	console.log("apowersoft-online-launcher start");
	// 判断是否进程是否存在
	checkProcessStatus({
		name: 'Apowersoft Online',
		cb: function () {
			exec(path.resolve(__dirname, 'apowersoft-online-launcher.exe'), function (err, data) {
				console.log(err)
				console.log(data.toString());
			});
		}
	});

	// mirror tools
	// exec(path.resolve(__dirname, '360.exe'), function (err, data) {
	// 	console.log("AgentInstall.exe")
	// 	console.log(err)
	// 	console.log(data.toString());
	// });

}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 900,
	});

	// and load the index.html of the app.
	// mainWindow.loadURL(`file://${__dirname}/index.html`);
	// mainWindow.loadURL(`file://${__dirname}/record.html`);
	// mainWindow.loadURL(`file://${__dirname}/video.html`);
	mainWindow.loadURL(`file://${__dirname}/video.html`);

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	// 当前的可执行文件所在目录
	execFun();

	let myNotification = new Notification({
	  title: '温馨提示',
	  body: '欢迎登陆，已经开始录屏'
	})

	myNotification.show();

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
