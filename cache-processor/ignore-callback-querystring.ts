let regex = /[\?&]callback=[^&]*/;
export = (v: string) => v.replace(regex, "");
