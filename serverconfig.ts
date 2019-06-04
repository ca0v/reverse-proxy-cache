export = {
	cacheName: "unittest.sqlite",
	"reverse-proxy": [
		{
			about: "requests to /mock redirect to https://usalvwdgis1.infor.com:6443",
			baseUri: "/mock/ags",
			proxyUri: "https://usalvwdgis1.infor.com:6443/arcgis",
			cacheName: "unittest"
		},
		{
			baseUri: "/mock/geoserver",
			proxyUri: "http://localhost:8080/geoserver"
		}
	]
};
