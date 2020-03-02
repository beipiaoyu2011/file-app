// 配置参数
const config = {
	maxSize: 500 * 1024, //不触发压缩的最大的size=500KB
	imageType: 'image/jpeg' //压缩后的图片格式
};
// 获取 blob 对象 兼容写法
const getBlob = (buffer, format = config.imageType) => {
	let blob = null;
	try {
		blob = new Blob(buffer, { format: config.imageType });
	} catch (error) {
		const blobBuilder = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder)();
		buffer.forEach(buf => {
			blobBuilder.append(buf);
		});
		blob = blobBuilder.getBlob(format);
	}
	return blob;
};

// 获取处理过的 blob 对象
const getBlobFromBase64 = base64Data => {
	// 去除mime type，atob() 函数用来解码一个已经被base-64编码过的数据
	// 需要被频繁处理时，数组好像比字符串性能好点
	const text = window.atob(base64Data.split(',')[1]).split('');
	const buffer = new Uint8Array(text.length);

	text.map((n, i) => {
		buffer[i] = n.charCodeAt(0);
	});

	return getBlob([buffer]);
};


// Blob对象转化为 File, 最终其实还是个多个 name 和 lastModifiedDate 的 Blob
const blobToFile = (theBlob, fileName) => {
	//A Blob() is almost a File() - it's just missing the two properties below which we will add
	theBlob.lastModifiedDate = new Date().getTime();
	theBlob.name = fileName;
	return theBlob;
};

// 封装获取最后的 File {name, raw, size, type}
const getFile = (blob) => {
	const copyFile = Object.assign(new File());
	copyFile.name = 'test.jpg';
	copyFile.size = blob.size;
	// IE 不支持 File
	try {
		copyFile.raw = new File([blob], copyFile.name);
	} catch (error) {
		copyFile.raw = blobToFile(blob, copyFile.name);
	}
	return copyFile;
};

// 获取二进制文件
window.getMultiplePartFile = (base64) => {
	const blob = getBlobFromBase64(base64);
	// 最终的 file
	const targetFile = new File([blob], "test.jpg");
	return targetFile;
}
