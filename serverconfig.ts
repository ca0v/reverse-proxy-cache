export = {
	cacheName: "unittest.sqlite",
	"reverse-proxy": [
		{
			about: "requests to /mock redirect to https://usalvwdgis1.infor.com:6443",
			baseUri: "/mock",
			proxyUri: "https://usalvwdgis1.infor.com:6443",
			cacheName: "unittest"
		}
	]
};
