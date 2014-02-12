// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @file A compability layer over different types of storage.
 * Depending on the environment in which this code is run and the required
 * lifetime of stored data, different APIs are used. Four types of storage are
 * available. Here's the list of APIs used for each kind in the order of
 * priority:
 *   'permanent' - chrome.storage.sync, localStorage
 *   'local'     - chrome.storage.local, localStorage
 *   'session'   - sessionStorage
 *   'memory'    - in-memory array
 */

/**
 * @param {string} type
 */
function getStorage(type) {
}
