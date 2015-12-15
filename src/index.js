import { getServiceName, resolvePath } from './utils.js';
import { getUrlFromRegistry } from './registries.js';
import { getManifest } from './manifest.js';

const config = System.sofe;

const systemNormalize = System.normalize;

let serviceMap = {};

System.normalize = function(name, parentName, parentAddress) {
	if (parentName && parentName.match(/sofe/))
		if (name.match(/sofe/)) {
			return systemNormalize.call(this, name, parentName, parentAddress);
		} else {
			let resolution = resolvePath(serviceMap, name, parentName);
			return resolution;
		}
		else
			return systemNormalize.call(this, name, parentName, parentAddress);
}

/**
 * Override SystemJS loader locate method
 * @param {Object} load Load object from System.js loader
 *        See more at: https://github.com/ModuleLoader/es6-module-loader/blob/v0.17.0/docs/loader-extensions.md
 *
 * @return {Promise} A promise which resolves with the service url
 */
export function locate(load) {
	let service = getServiceName(load.address);

	return new Promise((resolve, reject) => {
		getManifest(config)
			.then((manifest) => {
				// First try and resolve the service with the manifest,
				// otherwise resolve by requesting the registry
				if (manifest && manifest[service]) {
					serviceMap[load.name] = manifest[service];
					resolve(manifest[service]);
				} else {
					getUrlFromRegistry(service, config)
						.then((url) => {
							serviceMap[load.name] = url;
							resolve(url);
						})
						.catch((error) => {
							throw new Error(error)
						});
				}
			})
			.catch((error) => {
				throw new Error(error)
			});
	})
}