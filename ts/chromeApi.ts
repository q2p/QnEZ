declare var browser:any;

declare var chrome: {
	readonly contextMenus:any;
	readonly windows:any;
	readonly downloads:any;
	readonly commands: {
		readonly onCommand: {
			readonly addListener:( callback:(command:string)=>any )=>void;
		}
	}
	readonly runtime: {
		readonly onStartup:any;
		readonly onInstalled:any;
		readonly lastError:any;
		readonly reload:()=>void;
		readonly onMessage: {
			readonly addListener:( callback:(...args: any[])=>any )=>void;
		}
		readonly sendMessage:(message:any, responseCallback?:(response:any)=>any)=>void
	}
	readonly bookmarks:any;
	readonly extension: {
		readonly inIncognitoContext:boolean;
		readonly isAllowedIncognitoAccess:(callback:(incognitoAccess:boolean)=>void)=>void;
	}
	readonly tabs: {
		readonly query:(queryInfo:object, callback:(tabs:any[])=>void)=>void;
		readonly move:(tabIds:number|number[], moveProperties:object, callback?:(tabs:any[])=>void)=>void;
		readonly update:any;
		readonly discard:any;
		readonly remove:any;
	}
	readonly browserAction: {
	}
	readonly storage: {
		readonly local: {
			readonly get:(key:string|string[], callback:(result:any)=>void)=>void;
			readonly set:(items:object, callback:()=>void)=>void;
			readonly remove:(key:string, callback:()=>void)=>void;
			readonly clear:(callback:()=>void)=>void;
		}
	}
	readonly webRequest: {
		readonly onBeforeRedirect: {
			readonly addListener:( callback:(...args: any[])=>any, filter:{ urls:string[] }, opt_extraInfoSpec:Array<'blocking' | 'asyncBlocking' | 'responseHeaders'> )=>void;
		}
		readonly onBeforeRequest: {
			readonly addListener:( callback:(...args: any[])=>any, filter:{ urls:string[] }, opt_extraInfoSpec:Array<'blocking' | 'asyncBlocking' | 'responseHeaders'> )=>void;
		}
		readonly onErrorOccurred: {
			readonly addListener:( callback:(...args: any[])=>any, filter:{ urls:string[] } )=>void;
		}
		readonly onCompleted: {
			readonly addListener:( callback:(...args: any[])=>any, filter:{ urls:string[] }, opt_extraInfoSpec:Array<'blocking' | 'asyncBlocking' | 'responseHeaders'> )=>void;
		}
	}
};